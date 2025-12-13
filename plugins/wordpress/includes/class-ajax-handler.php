<?php
/**
 * AJAX Handler
 *
 * @package LupusUrsus_Donations
 */

if (!defined('ABSPATH')) {
    exit;
}

class LupusUrsus_Donations_Ajax_Handler {

    /**
     * Create Stripe Checkout Session
     */
    public function create_checkout_session() {
        // Verify nonce
        if (!check_ajax_referer('lupusursus_donations_nonce', 'nonce', false)) {
            wp_send_json_error(['message' => __('Błąd weryfikacji. Odśwież stronę i spróbuj ponownie.', 'lupusursus-donations')]);
        }

        // Get and validate data
        $campaign_id = absint($_POST['campaign_id'] ?? 0);
        $amount = floatval($_POST['amount'] ?? 0);
        $donor_name = sanitize_text_field($_POST['donor_name'] ?? '');
        $donor_email = sanitize_email($_POST['donor_email'] ?? '');
        $message = sanitize_textarea_field($_POST['message'] ?? '');
        $is_anonymous = !empty($_POST['is_anonymous']);

        // Validate campaign
        if (!$campaign_id) {
            wp_send_json_error(['message' => __('Nie wybrano zbiórki.', 'lupusursus-donations')]);
        }

        // Validate amount
        $min_amount = (float) get_option('lupusursus_donations_min_amount', 5);
        if ($amount < $min_amount) {
            wp_send_json_error([
                'message' => sprintf(
                    __('Minimalna kwota wpłaty to %s zł.', 'lupusursus-donations'),
                    number_format($min_amount, 2, ',', ' ')
                )
            ]);
        }

        // Create checkout session
        $result = LupusUrsus_Donations_Stripe_Handler::create_checkout_session(
            $campaign_id,
            $amount,
            [
                'name' => $donor_name,
                'email' => $donor_email,
                'message' => $message,
                'is_anonymous' => $is_anonymous,
            ]
        );

        if (is_wp_error($result)) {
            wp_send_json_error(['message' => $result->get_error_message()]);
        }

        wp_send_json_success([
            'checkout_url' => $result['url'],
            'session_id' => $result['session_id'],
        ]);
    }

    /**
     * Get campaign progress (for real-time updates)
     */
    public function get_campaign_progress() {
        $campaign_id = absint($_GET['campaign_id'] ?? $_POST['campaign_id'] ?? 0);

        if (!$campaign_id) {
            wp_send_json_error(['message' => __('Nie podano ID zbiórki.', 'lupusursus-donations')]);
        }

        $campaign = LupusUrsus_Donations_Campaign_Post_Type::get_campaign_data($campaign_id);

        if (!$campaign) {
            wp_send_json_error(['message' => __('Nie znaleziono zbiórki.', 'lupusursus-donations')]);
        }

        wp_send_json_success([
            'collected' => $campaign['collected'],
            'goal' => $campaign['goal'],
            'percentage' => $campaign['percentage'],
            'donations_count' => $campaign['donations_count'],
            'is_active' => $campaign['is_active'],
            'formatted' => [
                'collected' => number_format($campaign['collected'], 0, ',', ' ') . ' zł',
                'goal' => number_format($campaign['goal'], 0, ',', ' ') . ' zł',
            ]
        ]);
    }

    /**
     * Get recent donations for campaign
     */
    public function get_recent_donations() {
        $campaign_id = absint($_GET['campaign_id'] ?? $_POST['campaign_id'] ?? 0);
        $limit = absint($_GET['limit'] ?? $_POST['limit'] ?? 5);

        if (!$campaign_id) {
            wp_send_json_error(['message' => __('Nie podano ID zbiórki.', 'lupusursus-donations')]);
        }

        $donations = LupusUrsus_Donations_Donation_Post_Type::get_campaign_donations($campaign_id, $limit);

        wp_send_json_success([
            'donations' => $donations,
        ]);
    }

    /**
     * Verify checkout session (called after return from Stripe)
     */
    public function verify_checkout() {
        $session_id = sanitize_text_field($_GET['session_id'] ?? $_POST['session_id'] ?? '');

        if (empty($session_id)) {
            wp_send_json_error(['message' => __('Brak ID sesji.', 'lupusursus-donations')]);
        }

        $init = LupusUrsus_Donations_Stripe_Handler::init_stripe();
        if (is_wp_error($init)) {
            wp_send_json_error(['message' => $init->get_error_message()]);
        }

        try {
            $session = \Stripe\Checkout\Session::retrieve($session_id);

            wp_send_json_success([
                'status' => $session->payment_status,
                'amount' => $session->amount_total / 100,
                'customer_email' => $session->customer_email,
            ]);

        } catch (\Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
}
