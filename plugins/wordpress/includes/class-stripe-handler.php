<?php
/**
 * Stripe Payment Handler
 *
 * @package LupusUrsus_Donations
 */

if (!defined('ABSPATH')) {
    exit;
}

class LupusUrsus_Donations_Stripe_Handler {

    /**
     * Get Stripe API key based on mode
     */
    public static function get_secret_key() {
        $mode = get_option('lupusursus_donations_stripe_mode', 'test');
        return $mode === 'live'
            ? get_option('lupusursus_donations_stripe_live_secret')
            : get_option('lupusursus_donations_stripe_test_secret');
    }

    /**
     * Get Stripe public key
     */
    public static function get_public_key() {
        $mode = get_option('lupusursus_donations_stripe_mode', 'test');
        return $mode === 'live'
            ? get_option('lupusursus_donations_stripe_live_public')
            : get_option('lupusursus_donations_stripe_test_public');
    }

    /**
     * Initialize Stripe
     */
    public static function init_stripe() {
        $secret_key = self::get_secret_key();

        if (empty($secret_key)) {
            return new WP_Error('stripe_not_configured', __('Stripe nie jest skonfigurowany.', 'lupusursus-donations'));
        }

        // Check if Stripe library is loaded
        if (!class_exists('\Stripe\Stripe')) {
            // Try to load from vendor
            $autoload = LUPUSURSUS_DONATIONS_PLUGIN_DIR . 'vendor/autoload.php';
            if (file_exists($autoload)) {
                require_once $autoload;
            } else {
                return new WP_Error('stripe_not_installed', __('Biblioteka Stripe nie jest zainstalowana. Uruchom: composer require stripe/stripe-php', 'lupusursus-donations'));
            }
        }

        \Stripe\Stripe::setApiKey($secret_key);
        \Stripe\Stripe::setApiVersion('2023-10-16');

        return true;
    }

    /**
     * Create Checkout Session
     */
    public static function create_checkout_session($campaign_id, $amount, $donor_data = []) {
        $init = self::init_stripe();
        if (is_wp_error($init)) {
            return $init;
        }

        $campaign = LupusUrsus_Donations_Campaign_Post_Type::get_campaign_data($campaign_id);
        if (!$campaign) {
            return new WP_Error('invalid_campaign', __('Nie znaleziono zbiórki.', 'lupusursus-donations'));
        }

        if (!$campaign['is_active']) {
            return new WP_Error('campaign_inactive', __('Ta zbiórka nie jest już aktywna.', 'lupusursus-donations'));
        }

        $currency = strtolower(get_option('lupusursus_donations_currency', 'PLN'));
        $min_amount = (float) get_option('lupusursus_donations_min_amount', 5);

        if ($amount < $min_amount) {
            return new WP_Error('amount_too_low', sprintf(
                __('Minimalna kwota wpłaty to %s zł.', 'lupusursus-donations'),
                number_format($min_amount, 2, ',', ' ')
            ));
        }

        // Build payment method types
        $payment_methods = ['card'];

        // Add BLIK for PLN
        if ($currency === 'pln') {
            $payment_methods[] = 'blik';
            $payment_methods[] = 'p24'; // Przelewy24
        }

        // Success and cancel URLs
        $success_url = add_query_arg([
            'lupusursus_donation' => 'success',
            'session_id' => '{CHECKOUT_SESSION_ID}',
        ], get_permalink($campaign_id));

        $cancel_url = add_query_arg([
            'lupusursus_donation' => 'cancel',
        ], get_permalink($campaign_id));

        try {
            $session_data = [
                'payment_method_types' => $payment_methods,
                'line_items' => [[
                    'price_data' => [
                        'currency' => $currency,
                        'product_data' => [
                            'name' => sprintf(__('Darowizna: %s', 'lupusursus-donations'), $campaign['title']),
                            'description' => $campaign['beneficiary']
                                ? sprintf(__('Dla: %s', 'lupusursus-donations'), $campaign['beneficiary'])
                                : $campaign['excerpt'],
                            'images' => $campaign['image'] ? [$campaign['image']] : [],
                        ],
                        'unit_amount' => (int) ($amount * 100), // Stripe uses cents
                    ],
                    'quantity' => 1,
                ]],
                'mode' => 'payment',
                'success_url' => $success_url,
                'cancel_url' => $cancel_url,
                'metadata' => [
                    'campaign_id' => $campaign_id,
                    'campaign_title' => $campaign['title'],
                    'donor_name' => $donor_data['name'] ?? '',
                    'donor_message' => $donor_data['message'] ?? '',
                    'is_anonymous' => $donor_data['is_anonymous'] ?? false,
                    'source' => 'lupusursus_donations_plugin',
                ],
                'locale' => 'pl',
            ];

            // Add customer email if provided
            if (!empty($donor_data['email'])) {
                $session_data['customer_email'] = $donor_data['email'];
            }

            // Allow customization via filter
            $session_data = apply_filters('lupusursus_donations_checkout_session_data', $session_data, $campaign, $donor_data);

            $session = \Stripe\Checkout\Session::create($session_data);

            // Log the session
            self::log_checkout_session($campaign_id, $session, $amount, $donor_data);

            return [
                'session_id' => $session->id,
                'url' => $session->url,
            ];

        } catch (\Stripe\Exception\ApiErrorException $e) {
            error_log('LupusUrsus Donations Stripe Error: ' . $e->getMessage());
            return new WP_Error('stripe_error', $e->getMessage());
        }
    }

    /**
     * Log checkout session
     */
    private static function log_checkout_session($campaign_id, $session, $amount, $donor_data) {
        global $wpdb;

        $table_name = $wpdb->prefix . 'lupusursus_donations_log';

        $wpdb->insert($table_name, [
            'campaign_id' => $campaign_id,
            'stripe_session_id' => $session->id,
            'amount' => $amount,
            'currency' => strtoupper(get_option('lupusursus_donations_currency', 'PLN')),
            'donor_email' => $donor_data['email'] ?? null,
            'donor_name' => $donor_data['name'] ?? null,
            'status' => 'pending',
        ]);
    }

    /**
     * Handle Stripe webhook
     */
    public static function handle_webhook($request) {
        $init = self::init_stripe();
        if (is_wp_error($init)) {
            return new WP_REST_Response(['error' => $init->get_error_message()], 500);
        }

        $payload = $request->get_body();
        $sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
        $webhook_secret = get_option('lupusursus_donations_stripe_webhook_secret');

        try {
            if (!empty($webhook_secret)) {
                $event = \Stripe\Webhook::constructEvent($payload, $sig_header, $webhook_secret);
            } else {
                $event = json_decode($payload);
            }
        } catch (\UnexpectedValueException $e) {
            return new WP_REST_Response(['error' => 'Invalid payload'], 400);
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            return new WP_REST_Response(['error' => 'Invalid signature'], 400);
        }

        // Handle the event
        switch ($event->type ?? $event['type']) {
            case 'checkout.session.completed':
                $session = $event->data->object ?? $event['data']['object'];
                self::handle_successful_payment($session);
                break;

            case 'payment_intent.succeeded':
                // Can be used for additional tracking
                break;

            case 'payment_intent.payment_failed':
                $payment_intent = $event->data->object ?? $event['data']['object'];
                self::handle_failed_payment($payment_intent);
                break;
        }

        return new WP_REST_Response(['received' => true], 200);
    }

    /**
     * Handle successful payment
     */
    private static function handle_successful_payment($session) {
        global $wpdb;

        $session_id = is_object($session) ? $session->id : $session['id'];
        $metadata = is_object($session) ? $session->metadata : $session['metadata'];
        $amount_total = is_object($session) ? $session->amount_total : $session['amount_total'];
        $customer_email = is_object($session) ? $session->customer_email : ($session['customer_email'] ?? '');
        $payment_intent = is_object($session) ? $session->payment_intent : ($session['payment_intent'] ?? '');

        $campaign_id = $metadata->campaign_id ?? $metadata['campaign_id'] ?? null;

        if (!$campaign_id) {
            error_log('LupusUrsus Donations: No campaign_id in session metadata');
            return;
        }

        // Check if already processed
        $existing = get_posts([
            'post_type' => 'lupusursus_donation',
            'meta_query' => [
                [
                    'key' => '_lupusursus_stripe_session_id',
                    'value' => $session_id,
                ]
            ],
            'posts_per_page' => 1,
        ]);

        if (!empty($existing)) {
            return; // Already processed
        }

        // Create donation
        $amount = $amount_total / 100; // Convert from cents
        $donor_name = $metadata->donor_name ?? $metadata['donor_name'] ?? '';
        $donor_message = $metadata->donor_message ?? $metadata['donor_message'] ?? '';
        $is_anonymous = $metadata->is_anonymous ?? $metadata['is_anonymous'] ?? false;

        $donation_id = LupusUrsus_Donations_Donation_Post_Type::create_donation([
            'campaign_id' => $campaign_id,
            'amount' => $amount,
            'donor_name' => $donor_name,
            'donor_email' => $customer_email,
            'is_anonymous' => $is_anonymous,
            'message' => $donor_message,
            'stripe_payment_id' => $payment_intent,
            'stripe_session_id' => $session_id,
            'status' => 'completed',
        ]);

        // Update log
        $table_name = $wpdb->prefix . 'lupusursus_donations_log';
        $wpdb->update(
            $table_name,
            [
                'donation_id' => $donation_id,
                'stripe_payment_intent' => $payment_intent,
                'status' => 'completed',
            ],
            ['stripe_session_id' => $session_id]
        );

        // Trigger action for extensions
        do_action('lupusursus_donations_payment_completed', $donation_id, $campaign_id, $amount);

        // Send email notification
        self::send_donation_notification($donation_id, $campaign_id);
    }

    /**
     * Handle failed payment
     */
    private static function handle_failed_payment($payment_intent) {
        global $wpdb;

        $payment_intent_id = is_object($payment_intent) ? $payment_intent->id : $payment_intent['id'];

        $table_name = $wpdb->prefix . 'lupusursus_donations_log';
        $wpdb->update(
            $table_name,
            ['status' => 'failed'],
            ['stripe_payment_intent' => $payment_intent_id]
        );

        do_action('lupusursus_donations_payment_failed', $payment_intent_id);
    }

    /**
     * Send donation notification email
     */
    private static function send_donation_notification($donation_id, $campaign_id) {
        $admin_email = get_option('admin_email');
        $campaign = get_post($campaign_id);
        $amount = get_post_meta($donation_id, '_lupusursus_amount', true);
        $donor_name = get_post_meta($donation_id, '_lupusursus_donor_name', true) ?: __('Anonimowy', 'lupusursus-donations');

        $subject = sprintf(
            __('[%s] Nowa wpłata: %s zł na "%s"', 'lupusursus-donations'),
            get_bloginfo('name'),
            number_format($amount, 2, ',', ' '),
            $campaign->post_title
        );

        $message = sprintf(
            __("Otrzymano nową wpłatę!\n\nZbiórka: %s\nKwota: %s zł\nDarczyńca: %s\n\nZobacz wpłatę: %s", 'lupusursus-donations'),
            $campaign->post_title,
            number_format($amount, 2, ',', ' '),
            $donor_name,
            admin_url('post.php?post=' . $donation_id . '&action=edit')
        );

        wp_mail($admin_email, $subject, $message);
    }

    /**
     * Verify Stripe configuration
     */
    public static function verify_configuration() {
        $secret_key = self::get_secret_key();
        $public_key = self::get_public_key();

        $errors = [];

        if (empty($secret_key)) {
            $errors[] = __('Brak klucza Secret Key dla Stripe.', 'lupusursus-donations');
        }

        if (empty($public_key)) {
            $errors[] = __('Brak klucza Publishable Key dla Stripe.', 'lupusursus-donations');
        }

        // Validate keys format
        if (!empty($secret_key)) {
            $mode = get_option('lupusursus_donations_stripe_mode', 'test');
            $expected_prefix = $mode === 'live' ? 'sk_live_' : 'sk_test_';

            if (strpos($secret_key, $expected_prefix) !== 0) {
                $errors[] = sprintf(
                    __('Klucz Secret Key powinien zaczynać się od "%s" dla trybu %s.', 'lupusursus-donations'),
                    $expected_prefix,
                    $mode
                );
            }
        }

        return empty($errors) ? true : $errors;
    }
}
