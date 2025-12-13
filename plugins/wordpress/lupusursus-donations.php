<?php
/**
 * Plugin Name: LupusUrsus Donations
 * Plugin URI: https://github.com/your-repo/lupusursus-donations
 * Description: Beautiful donation campaigns with progress bars, Stripe integration, and BLIK support. Perfect for animal shelters and charities.
 * Version: 1.0.0
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Author: Your Name
 * Author URI: https://yourwebsite.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: lupusursus-donations
 * Domain Path: /languages
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Plugin constants
define('LUPUSURSUS_DONATIONS_VERSION', '1.0.0');
define('LUPUSURSUS_DONATIONS_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('LUPUSURSUS_DONATIONS_PLUGIN_URL', plugin_dir_url(__FILE__));
define('LUPUSURSUS_DONATIONS_PLUGIN_BASENAME', plugin_basename(__FILE__));

/**
 * Main plugin class
 */
final class LupusUrsus_Donations {

    /**
     * Single instance
     */
    private static $instance = null;

    /**
     * Get instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        $this->load_dependencies();
        $this->set_locale();
        $this->define_admin_hooks();
        $this->define_public_hooks();
    }

    /**
     * Load required files
     */
    private function load_dependencies() {
        // Core classes
        require_once LUPUSURSUS_DONATIONS_PLUGIN_DIR . 'includes/class-campaign-post-type.php';
        require_once LUPUSURSUS_DONATIONS_PLUGIN_DIR . 'includes/class-donation-post-type.php';
        require_once LUPUSURSUS_DONATIONS_PLUGIN_DIR . 'includes/class-stripe-handler.php';
        require_once LUPUSURSUS_DONATIONS_PLUGIN_DIR . 'includes/class-shortcodes.php';
        require_once LUPUSURSUS_DONATIONS_PLUGIN_DIR . 'includes/class-ajax-handler.php';
        require_once LUPUSURSUS_DONATIONS_PLUGIN_DIR . 'includes/class-campaign-widget.php';

        // Admin
        if (is_admin()) {
            require_once LUPUSURSUS_DONATIONS_PLUGIN_DIR . 'admin/class-admin-settings.php';
            require_once LUPUSURSUS_DONATIONS_PLUGIN_DIR . 'admin/class-admin-campaigns.php';
        }
    }

    /**
     * Load translations
     */
    private function set_locale() {
        add_action('plugins_loaded', function() {
            load_plugin_textdomain(
                'lupusursus-donations',
                false,
                dirname(LUPUSURSUS_DONATIONS_PLUGIN_BASENAME) . '/languages/'
            );
        });
    }

    /**
     * Admin hooks
     */
    private function define_admin_hooks() {
        if (!is_admin()) {
            return;
        }

        $admin_settings = new LupusUrsus_Donations_Admin_Settings();
        add_action('admin_menu', [$admin_settings, 'add_admin_menu']);
        add_action('admin_init', [$admin_settings, 'register_settings']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);
    }

    /**
     * Public hooks
     */
    private function define_public_hooks() {
        // Register post types
        add_action('init', ['LupusUrsus_Donations_Campaign_Post_Type', 'register']);
        add_action('init', ['LupusUrsus_Donations_Donation_Post_Type', 'register']);

        // Register shortcodes
        $shortcodes = new LupusUrsus_Donations_Shortcodes();
        add_action('init', [$shortcodes, 'register']);

        // AJAX handlers
        $ajax = new LupusUrsus_Donations_Ajax_Handler();
        add_action('wp_ajax_lupusursus_create_checkout', [$ajax, 'create_checkout_session']);
        add_action('wp_ajax_nopriv_lupusursus_create_checkout', [$ajax, 'create_checkout_session']);
        add_action('wp_ajax_lupusursus_get_campaign_progress', [$ajax, 'get_campaign_progress']);
        add_action('wp_ajax_nopriv_lupusursus_get_campaign_progress', [$ajax, 'get_campaign_progress']);

        // Enqueue assets
        add_action('wp_enqueue_scripts', [$this, 'enqueue_public_assets']);

        // Register widget
        add_action('widgets_init', function() {
            register_widget('LupusUrsus_Donations_Campaign_Widget');
        });

        // Stripe webhook endpoint
        add_action('rest_api_init', [$this, 'register_webhook_endpoint']);
    }

    /**
     * Enqueue admin assets
     */
    public function enqueue_admin_assets($hook) {
        $screen = get_current_screen();
        $is_lupusursus_screen = (
            strpos($hook, 'lupusursus-donations') !== false ||
            (isset($screen->post_type) && in_array($screen->post_type, ['lupusursus_campaign', 'lupusursus_donation']))
        );

        if (!$is_lupusursus_screen) {
            return;
        }

        wp_enqueue_style(
            'lupusursus-donations-admin',
            LUPUSURSUS_DONATIONS_PLUGIN_URL . 'assets/css/admin.css',
            [],
            LUPUSURSUS_DONATIONS_VERSION
        );

        wp_enqueue_script(
            'lupusursus-donations-admin',
            LUPUSURSUS_DONATIONS_PLUGIN_URL . 'assets/js/admin.js',
            ['jquery'],
            LUPUSURSUS_DONATIONS_VERSION,
            true
        );

        wp_localize_script('lupusursus-donations-admin', 'lupusursusDonationsAdmin', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('lupusursus_donations_admin'),
            'i18n' => [
                'testing' => __('Testowanie...', 'lupusursus-donations'),
                'recalculating' => __('Przeliczanie...', 'lupusursus-donations'),
                'success' => __('Sukces!', 'lupusursus-donations'),
                'error' => __('Błąd', 'lupusursus-donations'),
            ]
        ]);
    }

    /**
     * Enqueue public assets
     */
    public function enqueue_public_assets() {
        wp_enqueue_style(
            'lupusursus-donations',
            LUPUSURSUS_DONATIONS_PLUGIN_URL . 'assets/css/lupusursus-donations.css',
            [],
            LUPUSURSUS_DONATIONS_VERSION
        );

        wp_enqueue_script(
            'lupusursus-donations',
            LUPUSURSUS_DONATIONS_PLUGIN_URL . 'assets/js/lupusursus-donations.js',
            ['jquery'],
            LUPUSURSUS_DONATIONS_VERSION,
            true
        );

        wp_localize_script('lupusursus-donations', 'lupusursusDonationsData', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('lupusursus_donations_nonce'),
            'currency' => get_option('lupusursus_donations_currency', 'PLN'),
            'currencySymbol' => get_option('lupusursus_donations_currency_symbol', 'zł'),
            'minAmount' => get_option('lupusursus_donations_min_amount', 5),
            'autoRefresh' => true,
            'i18n' => [
                'loading' => __('Ładowanie...', 'lupusursus-donations'),
                'processing' => __('Przetwarzanie...', 'lupusursus-donations'),
                'error' => __('Wystąpił błąd. Spróbuj ponownie.', 'lupusursus-donations'),
                'genericError' => __('Wystąpił błąd. Spróbuj ponownie.', 'lupusursus-donations'),
                'minAmountError' => __('Minimalna kwota wpłaty to %s zł.', 'lupusursus-donations'),
                'thankYou' => __('Dziękujemy za wsparcie!', 'lupusursus-donations'),
                'goalReached' => __('Cel osiągnięty!', 'lupusursus-donations'),
                'copied' => __('Skopiowano!', 'lupusursus-donations'),
            ]
        ]);
    }

    /**
     * Register Stripe webhook endpoint
     */
    public function register_webhook_endpoint() {
        register_rest_route('lupusursus-donations/v1', '/webhook', [
            'methods' => 'POST',
            'callback' => ['LupusUrsus_Donations_Stripe_Handler', 'handle_webhook'],
            'permission_callback' => '__return_true',
        ]);
    }

    /**
     * Activation hook
     */
    public static function activate() {
        // Create custom post types
        LupusUrsus_Donations_Campaign_Post_Type::register();
        LupusUrsus_Donations_Donation_Post_Type::register();

        // Flush rewrite rules
        flush_rewrite_rules();

        // Set default options
        $defaults = [
            'lupusursus_donations_currency' => 'PLN',
            'lupusursus_donations_currency_symbol' => 'zł',
            'lupusursus_donations_min_amount' => 5,
            'lupusursus_donations_stripe_mode' => 'test',
        ];

        foreach ($defaults as $key => $value) {
            if (get_option($key) === false) {
                add_option($key, $value);
            }
        }

        // Create database table for detailed donation tracking (optional)
        self::create_tables();
    }

    /**
     * Create custom tables
     */
    private static function create_tables() {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();
        $table_name = $wpdb->prefix . 'lupusursus_donations_log';

        $sql = "CREATE TABLE IF NOT EXISTS $table_name (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            campaign_id bigint(20) NOT NULL,
            donation_id bigint(20) DEFAULT NULL,
            stripe_session_id varchar(255) DEFAULT NULL,
            stripe_payment_intent varchar(255) DEFAULT NULL,
            amount decimal(10,2) NOT NULL,
            currency varchar(3) DEFAULT 'PLN',
            donor_email varchar(255) DEFAULT NULL,
            donor_name varchar(255) DEFAULT NULL,
            status varchar(20) DEFAULT 'pending',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY campaign_id (campaign_id),
            KEY stripe_session_id (stripe_session_id),
            KEY status (status)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }

    /**
     * Deactivation hook
     */
    public static function deactivate() {
        flush_rewrite_rules();
    }

    /**
     * Uninstall hook
     */
    public static function uninstall() {
        // Remove options
        $options = [
            'lupusursus_donations_currency',
            'lupusursus_donations_currency_symbol',
            'lupusursus_donations_min_amount',
            'lupusursus_donations_stripe_mode',
            'lupusursus_donations_stripe_test_public',
            'lupusursus_donations_stripe_test_secret',
            'lupusursus_donations_stripe_live_public',
            'lupusursus_donations_stripe_live_secret',
            'lupusursus_donations_stripe_webhook_secret',
        ];

        foreach ($options as $option) {
            delete_option($option);
        }

        // Optionally remove custom tables and posts
        // Uncomment if you want to clean everything on uninstall
        // global $wpdb;
        // $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}lupusursus_donations_log");
    }
}

// Initialize plugin
function lupusursus_donations() {
    return LupusUrsus_Donations::get_instance();
}

// Activation/Deactivation hooks
register_activation_hook(__FILE__, ['LupusUrsus_Donations', 'activate']);
register_deactivation_hook(__FILE__, ['LupusUrsus_Donations', 'deactivate']);
register_uninstall_hook(__FILE__, ['LupusUrsus_Donations', 'uninstall']);

// Start the plugin
lupusursus_donations();
