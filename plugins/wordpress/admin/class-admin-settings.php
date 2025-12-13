<?php
/**
 * Admin Settings
 *
 * @package LupusUrsus_Donations
 */

if (!defined('ABSPATH')) {
    exit;
}

class LupusUrsus_Donations_Admin_Settings {

    /**
     * Settings page slug
     */
    const PAGE_SLUG = 'lupusursus-donations-settings';

    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_submenu_page(
            'edit.php?post_type=lupusursus_campaign',
            __('Ustawienia', 'lupusursus-donations'),
            __('Ustawienia', 'lupusursus-donations'),
            'manage_options',
            self::PAGE_SLUG,
            [$this, 'render_settings_page']
        );
    }

    /**
     * Register settings
     */
    public function register_settings() {
        // Stripe Settings Section
        add_settings_section(
            'lupusursus_donations_stripe',
            __('Konfiguracja Stripe', 'lupusursus-donations'),
            [$this, 'stripe_section_callback'],
            self::PAGE_SLUG
        );

        // Stripe Mode
        register_setting('lupusursus_donations_settings', 'lupusursus_donations_stripe_mode');
        add_settings_field(
            'lupusursus_donations_stripe_mode',
            __('Tryb Stripe', 'lupusursus-donations'),
            [$this, 'render_stripe_mode_field'],
            self::PAGE_SLUG,
            'lupusursus_donations_stripe'
        );

        // Test Keys
        register_setting('lupusursus_donations_settings', 'lupusursus_donations_stripe_test_public');
        add_settings_field(
            'lupusursus_donations_stripe_test_public',
            __('Test Publishable Key', 'lupusursus-donations'),
            [$this, 'render_text_field'],
            self::PAGE_SLUG,
            'lupusursus_donations_stripe',
            ['name' => 'lupusursus_donations_stripe_test_public', 'placeholder' => 'pk_test_...']
        );

        register_setting('lupusursus_donations_settings', 'lupusursus_donations_stripe_test_secret');
        add_settings_field(
            'lupusursus_donations_stripe_test_secret',
            __('Test Secret Key', 'lupusursus-donations'),
            [$this, 'render_password_field'],
            self::PAGE_SLUG,
            'lupusursus_donations_stripe',
            ['name' => 'lupusursus_donations_stripe_test_secret', 'placeholder' => 'sk_test_...']
        );

        // Live Keys
        register_setting('lupusursus_donations_settings', 'lupusursus_donations_stripe_live_public');
        add_settings_field(
            'lupusursus_donations_stripe_live_public',
            __('Live Publishable Key', 'lupusursus-donations'),
            [$this, 'render_text_field'],
            self::PAGE_SLUG,
            'lupusursus_donations_stripe',
            ['name' => 'lupusursus_donations_stripe_live_public', 'placeholder' => 'pk_live_...']
        );

        register_setting('lupusursus_donations_settings', 'lupusursus_donations_stripe_live_secret');
        add_settings_field(
            'lupusursus_donations_stripe_live_secret',
            __('Live Secret Key', 'lupusursus-donations'),
            [$this, 'render_password_field'],
            self::PAGE_SLUG,
            'lupusursus_donations_stripe',
            ['name' => 'lupusursus_donations_stripe_live_secret', 'placeholder' => 'sk_live_...']
        );

        // Webhook Secret
        register_setting('lupusursus_donations_settings', 'lupusursus_donations_stripe_webhook_secret');
        add_settings_field(
            'lupusursus_donations_stripe_webhook_secret',
            __('Webhook Secret', 'lupusursus-donations'),
            [$this, 'render_password_field'],
            self::PAGE_SLUG,
            'lupusursus_donations_stripe',
            ['name' => 'lupusursus_donations_stripe_webhook_secret', 'placeholder' => 'whsec_...']
        );

        // General Settings Section
        add_settings_section(
            'lupusursus_donations_general',
            __('Ustawienia ogólne', 'lupusursus-donations'),
            [$this, 'general_section_callback'],
            self::PAGE_SLUG
        );

        // Currency
        register_setting('lupusursus_donations_settings', 'lupusursus_donations_currency');
        add_settings_field(
            'lupusursus_donations_currency',
            __('Waluta', 'lupusursus-donations'),
            [$this, 'render_currency_field'],
            self::PAGE_SLUG,
            'lupusursus_donations_general'
        );

        // Currency Symbol
        register_setting('lupusursus_donations_settings', 'lupusursus_donations_currency_symbol');
        add_settings_field(
            'lupusursus_donations_currency_symbol',
            __('Symbol waluty', 'lupusursus-donations'),
            [$this, 'render_text_field'],
            self::PAGE_SLUG,
            'lupusursus_donations_general',
            ['name' => 'lupusursus_donations_currency_symbol', 'placeholder' => 'zł', 'class' => 'small-text']
        );

        // Minimum Amount
        register_setting('lupusursus_donations_settings', 'lupusursus_donations_min_amount');
        add_settings_field(
            'lupusursus_donations_min_amount',
            __('Minimalna kwota wpłaty', 'lupusursus-donations'),
            [$this, 'render_number_field'],
            self::PAGE_SLUG,
            'lupusursus_donations_general',
            ['name' => 'lupusursus_donations_min_amount', 'min' => 1, 'default' => 5]
        );
    }

    /**
     * Stripe section callback
     */
    public function stripe_section_callback() {
        echo '<p>' . __('Skonfiguruj integrację z Stripe. Klucze znajdziesz w panelu Stripe w sekcji Developers > API Keys.', 'lupusursus-donations') . '</p>';

        // Show webhook URL
        $webhook_url = rest_url('lupusursus-donations/v1/webhook');
        echo '<div class="notice notice-info inline"><p>';
        echo '<strong>' . __('Webhook URL:', 'lupusursus-donations') . '</strong><br>';
        echo '<code>' . esc_html($webhook_url) . '</code><br>';
        echo '<small>' . __('Dodaj ten URL w panelu Stripe > Developers > Webhooks', 'lupusursus-donations') . '</small>';
        echo '</p></div>';

        // Verify configuration
        $verification = LupusUrsus_Donations_Stripe_Handler::verify_configuration();
        if ($verification !== true) {
            echo '<div class="notice notice-warning inline"><p>';
            echo '<strong>' . __('Problemy z konfiguracją:', 'lupusursus-donations') . '</strong><ul>';
            foreach ($verification as $error) {
                echo '<li>' . esc_html($error) . '</li>';
            }
            echo '</ul></p></div>';
        } else {
            echo '<div class="notice notice-success inline"><p>';
            echo '<strong>' . __('Konfiguracja Stripe jest poprawna!', 'lupusursus-donations') . '</strong>';
            echo '</p></div>';
        }
    }

    /**
     * General section callback
     */
    public function general_section_callback() {
        echo '<p>' . __('Ogólne ustawienia wtyczki.', 'lupusursus-donations') . '</p>';
    }

    /**
     * Render stripe mode field
     */
    public function render_stripe_mode_field() {
        $value = get_option('lupusursus_donations_stripe_mode', 'test');
        ?>
        <fieldset>
            <label>
                <input type="radio" name="lupusursus_donations_stripe_mode" value="test" <?php checked($value, 'test'); ?>>
                <?php _e('Test (do testowania)', 'lupusursus-donations'); ?>
            </label>
            <br>
            <label>
                <input type="radio" name="lupusursus_donations_stripe_mode" value="live" <?php checked($value, 'live'); ?>>
                <?php _e('Live (produkcyjny)', 'lupusursus-donations'); ?>
            </label>
        </fieldset>
        <p class="description">
            <?php if ($value === 'test') : ?>
                <span style="color: #f0ad4e;">⚠ <?php _e('Tryb testowy - wpłaty nie będą prawdziwe.', 'lupusursus-donations'); ?></span>
            <?php else : ?>
                <span style="color: #46b450;">✓ <?php _e('Tryb produkcyjny - prawdziwe wpłaty.', 'lupusursus-donations'); ?></span>
            <?php endif; ?>
        </p>
        <?php
    }

    /**
     * Render text field
     */
    public function render_text_field($args) {
        $name = $args['name'];
        $value = get_option($name, '');
        $placeholder = $args['placeholder'] ?? '';
        $class = $args['class'] ?? 'regular-text';
        ?>
        <input type="text"
               id="<?php echo esc_attr($name); ?>"
               name="<?php echo esc_attr($name); ?>"
               value="<?php echo esc_attr($value); ?>"
               placeholder="<?php echo esc_attr($placeholder); ?>"
               class="<?php echo esc_attr($class); ?>">
        <?php
    }

    /**
     * Render password field
     */
    public function render_password_field($args) {
        $name = $args['name'];
        $value = get_option($name, '');
        $placeholder = $args['placeholder'] ?? '';
        ?>
        <input type="password"
               id="<?php echo esc_attr($name); ?>"
               name="<?php echo esc_attr($name); ?>"
               value="<?php echo esc_attr($value); ?>"
               placeholder="<?php echo esc_attr($placeholder); ?>"
               class="regular-text">
        <button type="button" class="button shelter-toggle-password" data-target="<?php echo esc_attr($name); ?>">
            <?php _e('Pokaż', 'lupusursus-donations'); ?>
        </button>
        <?php
    }

    /**
     * Render number field
     */
    public function render_number_field($args) {
        $name = $args['name'];
        $value = get_option($name, $args['default'] ?? '');
        $min = $args['min'] ?? 0;
        ?>
        <input type="number"
               id="<?php echo esc_attr($name); ?>"
               name="<?php echo esc_attr($name); ?>"
               value="<?php echo esc_attr($value); ?>"
               min="<?php echo esc_attr($min); ?>"
               class="small-text">
        <span><?php echo esc_html(get_option('lupusursus_donations_currency_symbol', 'zł')); ?></span>
        <?php
    }

    /**
     * Render currency field
     */
    public function render_currency_field() {
        $value = get_option('lupusursus_donations_currency', 'PLN');
        $currencies = [
            'PLN' => __('Polski złoty (PLN)', 'lupusursus-donations'),
            'EUR' => __('Euro (EUR)', 'lupusursus-donations'),
            'USD' => __('Dolar amerykański (USD)', 'lupusursus-donations'),
            'GBP' => __('Funt brytyjski (GBP)', 'lupusursus-donations'),
            'CZK' => __('Korona czeska (CZK)', 'lupusursus-donations'),
        ];
        ?>
        <select id="lupusursus_donations_currency" name="lupusursus_donations_currency">
            <?php foreach ($currencies as $code => $label) : ?>
                <option value="<?php echo esc_attr($code); ?>" <?php selected($value, $code); ?>>
                    <?php echo esc_html($label); ?>
                </option>
            <?php endforeach; ?>
        </select>
        <p class="description">
            <?php if ($value === 'PLN') : ?>
                <?php _e('BLIK i Przelewy24 dostępne tylko dla PLN.', 'lupusursus-donations'); ?>
            <?php endif; ?>
        </p>
        <?php
    }

    /**
     * Render settings page
     */
    public function render_settings_page() {
        if (!current_user_can('manage_options')) {
            return;
        }

        // Save settings message
        if (isset($_GET['settings-updated'])) {
            add_settings_error(
                'lupusursus_donations_messages',
                'lupusursus_donations_message',
                __('Ustawienia zostały zapisane.', 'lupusursus-donations'),
                'updated'
            );
        }

        settings_errors('lupusursus_donations_messages');
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>

            <div class="shelter-admin-header">
                <div class="shelter-admin-logo">
                    <span class="dashicons dashicons-heart" style="font-size: 40px; color: #e74c3c;"></span>
                </div>
                <div class="shelter-admin-info">
                    <h2><?php _e('LupusUrsus Donations', 'lupusursus-donations'); ?></h2>
                    <p><?php _e('Wtyczka do zbiórek pieniędzy z paskiem postępu i integracją Stripe.', 'lupusursus-donations'); ?></p>
                </div>
            </div>

            <div class="shelter-admin-tabs">
                <nav class="nav-tab-wrapper">
                    <a href="#settings" class="nav-tab nav-tab-active"><?php _e('Ustawienia', 'lupusursus-donations'); ?></a>
                    <a href="#shortcodes" class="nav-tab"><?php _e('Shortcodes', 'lupusursus-donations'); ?></a>
                    <a href="#help" class="nav-tab"><?php _e('Pomoc', 'lupusursus-donations'); ?></a>
                </nav>

                <div id="settings" class="shelter-tab-content active">
                    <form action="options.php" method="post">
                        <?php
                        settings_fields('lupusursus_donations_settings');
                        do_settings_sections(self::PAGE_SLUG);
                        submit_button(__('Zapisz ustawienia', 'lupusursus-donations'));
                        ?>
                    </form>
                </div>

                <div id="shortcodes" class="shelter-tab-content" style="display:none;">
                    <?php $this->render_shortcodes_help(); ?>
                </div>

                <div id="help" class="shelter-tab-content" style="display:none;">
                    <?php $this->render_help_section(); ?>
                </div>
            </div>
        </div>

        <style>
            .lupusursus-admin-header { display: flex; align-items: center; gap: 20px; margin: 20px 0; padding: 20px; background: #fff; border: 1px solid #c3c4c7; border-radius: 4px; }
            .lupusursus-admin-info h2 { margin: 0 0 5px; }
            .lupusursus-admin-info p { margin: 0; color: #646970; }
            .lupusursus-tab-content { background: #fff; padding: 20px; border: 1px solid #c3c4c7; border-top: none; }
            .lupusursus-shortcode-table { width: 100%; border-collapse: collapse; }
            .lupusursus-shortcode-table th, .lupusursus-shortcode-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; }
            .lupusursus-shortcode-table code { background: #f0f0f0; padding: 4px 8px; border-radius: 3px; }
        </style>

        <script>
        jQuery(document).ready(function($) {
            // Tab switching
            $('.nav-tab').on('click', function(e) {
                e.preventDefault();
                var target = $(this).attr('href');
                $('.nav-tab').removeClass('nav-tab-active');
                $(this).addClass('nav-tab-active');
                $('.lupusursus-tab-content').hide();
                $(target).show();
            });

            // Toggle password visibility
            $('.lupusursus-toggle-password').on('click', function() {
                var target = $(this).data('target');
                var input = $('#' + target);
                if (input.attr('type') === 'password') {
                    input.attr('type', 'text');
                    $(this).text('<?php _e('Ukryj', 'lupusursus-donations'); ?>');
                } else {
                    input.attr('type', 'password');
                    $(this).text('<?php _e('Pokaż', 'lupusursus-donations'); ?>');
                }
            });
        });
        </script>
        <?php
    }

    /**
     * Render shortcodes help
     */
    private function render_shortcodes_help() {
        ?>
        <h3><?php _e('Dostępne shortcodes', 'lupusursus-donations'); ?></h3>

        <table class="shelter-shortcode-table">
            <thead>
                <tr>
                    <th><?php _e('Shortcode', 'lupusursus-donations'); ?></th>
                    <th><?php _e('Opis', 'lupusursus-donations'); ?></th>
                    <th><?php _e('Parametry', 'lupusursus-donations'); ?></th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><code>[lupusursus_campaign id="123"]</code></td>
                    <td><?php _e('Pełna zbiórka z obrazem, paskiem postępu i formularzem wpłaty.', 'lupusursus-donations'); ?></td>
                    <td>
                        <code>id</code> - ID zbiórki<br>
                        <code>show_form</code> - yes/no<br>
                        <code>show_donors</code> - yes/no/default<br>
                        <code>show_description</code> - yes/no<br>
                        <code>show_image</code> - yes/no
                    </td>
                </tr>
                <tr>
                    <td><code>[lupusursus_progress id="123"]</code></td>
                    <td><?php _e('Tylko pasek postępu.', 'lupusursus-donations'); ?></td>
                    <td>
                        <code>id</code> - ID zbiórki<br>
                        <code>style</code> - default/rounded/striped/animated/gradient<br>
                        <code>color</code> - kolor (np. #4CAF50)<br>
                        <code>show_amounts</code> - yes/no<br>
                        <code>show_percentage</code> - yes/no
                    </td>
                </tr>
                <tr>
                    <td><code>[lupusursus_donate_button id="123"]</code></td>
                    <td><?php _e('Tylko przycisk wpłaty.', 'lupusursus-donations'); ?></td>
                    <td>
                        <code>id</code> - ID zbiórki<br>
                        <code>text</code> - tekst przycisku<br>
                        <code>amount</code> - predefiniowana kwota<br>
                        <code>style</code> - primary/secondary
                    </td>
                </tr>
                <tr>
                    <td><code>[lupusursus_donation_form id="123"]</code></td>
                    <td><?php _e('Tylko formularz wpłaty.', 'lupusursus-donations'); ?></td>
                    <td>
                        <code>id</code> - ID zbiórki<br>
                        <code>amounts</code> - kwoty (np. "20,50,100,200")<br>
                        <code>show_custom</code> - yes/no<br>
                        <code>show_message</code> - yes/no<br>
                        <code>show_anonymous</code> - yes/no
                    </td>
                </tr>
                <tr>
                    <td><code>[lupusursus_campaigns_list]</code></td>
                    <td><?php _e('Lista zbiórek w siatce.', 'lupusursus-donations'); ?></td>
                    <td>
                        <code>count</code> - liczba zbiórek<br>
                        <code>columns</code> - liczba kolumn (2-4)<br>
                        <code>status</code> - active/inactive/all<br>
                        <code>orderby</code> - date/title<br>
                        <code>order</code> - ASC/DESC
                    </td>
                </tr>
                <tr>
                    <td><code>[lupusursus_donors_list id="123"]</code></td>
                    <td><?php _e('Lista ostatnich darczyńców.', 'lupusursus-donations'); ?></td>
                    <td>
                        <code>id</code> - ID zbiórki<br>
                        <code>count</code> - liczba darczyńców
                    </td>
                </tr>
            </tbody>
        </table>
        <?php
    }

    /**
     * Render help section
     */
    private function render_help_section() {
        ?>
        <h3><?php _e('Jak zacząć?', 'lupusursus-donations'); ?></h3>
        <ol>
            <li><?php _e('Utwórz konto w Stripe i pobierz klucze API.', 'lupusursus-donations'); ?></li>
            <li><?php _e('Wklej klucze w zakładce Ustawienia powyżej.', 'lupusursus-donations'); ?></li>
            <li><?php _e('Utwórz zbiórkę w menu Zbiórki > Dodaj nową.', 'lupusursus-donations'); ?></li>
            <li><?php _e('Wstaw shortcode na stronę lub użyj widżetu.', 'lupusursus-donations'); ?></li>
            <li><?php _e('Skonfiguruj webhook w panelu Stripe.', 'lupusursus-donations'); ?></li>
        </ol>

        <h3><?php _e('Konfiguracja Webhook', 'lupusursus-donations'); ?></h3>
        <p><?php _e('Aby automatycznie aktualizować stan zbiórki po wpłacie:', 'lupusursus-donations'); ?></p>
        <ol>
            <li><?php _e('Zaloguj się do panelu Stripe > Developers > Webhooks', 'lupusursus-donations'); ?></li>
            <li><?php _e('Kliknij "Add endpoint"', 'lupusursus-donations'); ?></li>
            <li><?php printf(__('Wklej URL: %s', 'lupusursus-donations'), '<code>' . rest_url('lupusursus-donations/v1/webhook') . '</code>'); ?></li>
            <li><?php _e('Wybierz zdarzenia: checkout.session.completed, payment_intent.succeeded, payment_intent.payment_failed', 'lupusursus-donations'); ?></li>
            <li><?php _e('Skopiuj "Signing secret" i wklej w ustawieniach powyżej', 'lupusursus-donations'); ?></li>
        </ol>

        <h3><?php _e('Wsparcie', 'lupusursus-donations'); ?></h3>
        <p><?php _e('Masz pytania? Napisz do nas:', 'lupusursus-donations'); ?> <a href="mailto:support@example.com">support@example.com</a></p>
        <?php
    }
}
