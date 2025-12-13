<?php
/**
 * Admin Campaigns Management
 *
 * @package LupusUrsus_Donations
 */

if (!defined('ABSPATH')) {
    exit;
}

class LupusUrsus_Donations_Admin_Campaigns {

    /**
     * Constructor
     */
    public function __construct() {
        // Meta boxes
        add_action('add_meta_boxes', [$this, 'add_campaign_meta_boxes']);
        add_action('save_post_lupusursus_campaign', [$this, 'save_campaign_meta'], 10, 2);

        // Donation meta boxes
        add_action('add_meta_boxes', [$this, 'add_donation_meta_boxes']);

        // Custom columns for campaigns
        add_filter('manage_lupusursus_campaign_posts_columns', [$this, 'campaign_columns']);
        add_action('manage_lupusursus_campaign_posts_custom_column', [$this, 'campaign_column_content'], 10, 2);
        add_filter('manage_edit-lupusursus_campaign_sortable_columns', [$this, 'campaign_sortable_columns']);

        // Row actions for campaigns (Archive/Restore)
        add_filter('post_row_actions', [$this, 'campaign_row_actions'], 10, 2);

        // Archive filter dropdown
        add_action('restrict_manage_posts', [$this, 'add_archive_filter']);
        add_action('pre_get_posts', [$this, 'filter_by_archive_status']);

        // Custom columns for donations
        add_filter('manage_lupusursus_donation_posts_columns', [$this, 'donation_columns']);
        add_action('manage_lupusursus_donation_posts_custom_column', [$this, 'donation_column_content'], 10, 2);

        // Admin notices
        add_action('admin_notices', [$this, 'admin_notices']);

        // AJAX handlers for admin
        add_action('wp_ajax_lupusursus_test_stripe', [$this, 'ajax_test_stripe']);
        add_action('wp_ajax_lupusursus_recalculate_campaign', [$this, 'ajax_recalculate_campaign']);
        add_action('wp_ajax_lupusursus_archive_campaign', [$this, 'ajax_archive_campaign']);
        add_action('wp_ajax_lupusursus_restore_campaign', [$this, 'ajax_restore_campaign']);

        // Handle archive/restore actions from URL
        add_action('admin_init', [$this, 'handle_archive_actions']);
    }

    /**
     * Add campaign meta boxes
     */
    public function add_campaign_meta_boxes() {
        add_meta_box(
            'lupusursus_campaign_details',
            __('Szczegóły zbiórki', 'lupusursus-donations'),
            [$this, 'render_campaign_details_meta_box'],
            'lupusursus_campaign',
            'normal',
            'high'
        );

        add_meta_box(
            'lupusursus_campaign_progress',
            __('Postęp zbiórki', 'lupusursus-donations'),
            [$this, 'render_campaign_progress_meta_box'],
            'lupusursus_campaign',
            'side',
            'high'
        );

        add_meta_box(
            'lupusursus_campaign_shortcode',
            __('Shortcode', 'lupusursus-donations'),
            [$this, 'render_campaign_shortcode_meta_box'],
            'lupusursus_campaign',
            'side',
            'default'
        );
    }

    /**
     * Render campaign details meta box
     */
    public function render_campaign_details_meta_box($post) {
        wp_nonce_field('lupusursus_campaign_meta', 'lupusursus_campaign_meta_nonce');

        $goal = get_post_meta($post->ID, '_lupusursus_goal_amount', true);
        $collected = get_post_meta($post->ID, '_lupusursus_collected_amount', true) ?: 0;
        $end_date = get_post_meta($post->ID, '_lupusursus_end_date', true);
        $beneficiary = get_post_meta($post->ID, '_lupusursus_beneficiary', true);
        $progress_style = get_post_meta($post->ID, '_lupusursus_progress_style', true) ?: 'default';
        $progress_color = get_post_meta($post->ID, '_lupusursus_progress_color', true) ?: '#4CAF50';
        ?>
        <div class="shelter-meta-box">
            <div class="shelter-meta-row">
                <label for="lupusursus_goal"><?php _e('Cel zbiórki (zł)', 'lupusursus-donations'); ?></label>
                <div class="shelter-meta-field">
                    <input type="number"
                           id="lupusursus_goal"
                           name="lupusursus_goal"
                           value="<?php echo esc_attr($goal); ?>"
                           min="1"
                           step="1"
                           class="regular-text"
                           required>
                    <span class="description"><?php _e('Kwota, którą chcesz zebrać.', 'lupusursus-donations'); ?></span>
                </div>
            </div>

            <div class="shelter-meta-row">
                <label for="lupusursus_collected"><?php _e('Zebrano (zł)', 'lupusursus-donations'); ?></label>
                <div class="shelter-meta-field">
                    <input type="number"
                           id="lupusursus_collected"
                           name="lupusursus_collected"
                           value="<?php echo esc_attr($collected); ?>"
                           min="0"
                           step="0.01"
                           class="regular-text">
                    <span class="description"><?php _e('Aktualizowane automatycznie po każdej wpłacie. Możesz też zmienić ręcznie.', 'lupusursus-donations'); ?></span>
                </div>
            </div>

            <div class="shelter-meta-row">
                <label for="lupusursus_beneficiary"><?php _e('Beneficjent', 'lupusursus-donations'); ?></label>
                <div class="shelter-meta-field">
                    <input type="text"
                           id="lupusursus_beneficiary"
                           name="lupusursus_beneficiary"
                           value="<?php echo esc_attr($beneficiary); ?>"
                           class="regular-text"
                           placeholder="<?php esc_attr_e('np. Burek - 5-letni kundelek', 'lupusursus-donations'); ?>">
                    <span class="description"><?php _e('Dla kogo zbieramy? (opcjonalne)', 'lupusursus-donations'); ?></span>
                </div>
            </div>

            <div class="shelter-meta-row">
                <label for="lupusursus_end_date"><?php _e('Data zakończenia', 'lupusursus-donations'); ?></label>
                <div class="shelter-meta-field">
                    <input type="date"
                           id="lupusursus_end_date"
                           name="lupusursus_end_date"
                           value="<?php echo esc_attr($end_date); ?>"
                           class="regular-text">
                    <span class="description"><?php _e('Zostaw puste dla zbiórki bez limitu czasowego.', 'lupusursus-donations'); ?></span>
                </div>
            </div>

            <div class="shelter-meta-row">
                <label for="lupusursus_progress_style"><?php _e('Styl paska', 'lupusursus-donations'); ?></label>
                <div class="shelter-meta-field">
                    <select id="lupusursus_progress_style" name="lupusursus_progress_style">
                        <option value="solid" <?php selected($progress_style, 'solid'); ?>>
                            <?php _e('Jednolity', 'lupusursus-donations'); ?>
                        </option>
                        <option value="striped" <?php selected($progress_style, 'striped'); ?>>
                            <?php _e('W paski (animowany)', 'lupusursus-donations'); ?>
                        </option>
                        <option value="gradient" <?php selected($progress_style, 'gradient'); ?>>
                            <?php _e('Gradient', 'lupusursus-donations'); ?>
                        </option>
                    </select>
                </div>
            </div>

            <div class="shelter-meta-row">
                <label for="lupusursus_progress_color"><?php _e('Kolor paska', 'lupusursus-donations'); ?></label>
                <div class="shelter-meta-field">
                    <div class="shelter-color-picker-wrapper">
                        <input type="color"
                               id="lupusursus_progress_color"
                               name="lupusursus_progress_color"
                               value="<?php echo esc_attr($progress_color); ?>"
                               class="shelter-color-picker">
                        <input type="text"
                               value="<?php echo esc_attr($progress_color); ?>"
                               class="shelter-color-input small-text"
                               readonly>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }

    /**
     * Render campaign progress meta box
     */
    public function render_campaign_progress_meta_box($post) {
        $campaign = LupusUrsus_Donations_Campaign_Post_Type::get_campaign_data($post->ID);

        if (!$campaign) {
            echo '<p>' . __('Zapisz zbiórkę, aby zobaczyć postęp.', 'lupusursus-donations') . '</p>';
            return;
        }
        ?>
        <div class="shelter-progress-preview">
            <div class="shelter-admin-progress">
                <div class="shelter-admin-progress-bar">
                    <span style="width: <?php echo esc_attr($campaign['percentage']); ?>%; background-color: <?php echo esc_attr($campaign['progress_color']); ?>;"></span>
                </div>
                <div class="shelter-admin-progress-text">
                    <span><?php echo number_format($campaign['collected'], 0, ',', ' '); ?> zł</span>
                    <span><?php echo $campaign['percentage']; ?>%</span>
                </div>
            </div>

            <div style="margin-top: 15px;">
                <strong><?php _e('Cel:', 'lupusursus-donations'); ?></strong>
                <?php echo number_format($campaign['goal'], 0, ',', ' '); ?> zł
            </div>

            <div style="margin-top: 5px;">
                <strong><?php _e('Wpłat:', 'lupusursus-donations'); ?></strong>
                <?php echo $campaign['donations_count']; ?>
            </div>

            <div style="margin-top: 5px;">
                <strong><?php _e('Status:', 'lupusursus-donations'); ?></strong>
                <?php if ($campaign['is_active']) : ?>
                    <span class="shelter-status-badge shelter-status-badge--active"><?php _e('Aktywna', 'lupusursus-donations'); ?></span>
                <?php else : ?>
                    <span class="shelter-status-badge shelter-status-badge--inactive"><?php _e('Zakończona', 'lupusursus-donations'); ?></span>
                <?php endif; ?>
            </div>

            <?php if ($post->ID) : ?>
                <div style="margin-top: 15px;">
                    <button type="button"
                            class="button shelter-recalculate"
                            data-campaign-id="<?php echo $post->ID; ?>">
                        <?php _e('Przelicz sumę wpłat', 'lupusursus-donations'); ?>
                    </button>
                </div>
            <?php endif; ?>
        </div>
        <?php
    }

    /**
     * Render shortcode meta box
     */
    public function render_campaign_shortcode_meta_box($post) {
        if ($post->post_status !== 'publish') {
            echo '<p>' . __('Opublikuj zbiórkę, aby uzyskać shortcode.', 'lupusursus-donations') . '</p>';
            return;
        }
        ?>
        <div class="shelter-shortcode-preview">
            <p><strong><?php _e('Pełna zbiórka:', 'lupusursus-donations'); ?></strong></p>
            <code>[lupusursus_campaign id="<?php echo $post->ID; ?>"]</code>

            <p style="margin-top: 15px;"><strong><?php _e('Tylko pasek:', 'lupusursus-donations'); ?></strong></p>
            <code>[lupusursus_progress id="<?php echo $post->ID; ?>"]</code>

            <p style="margin-top: 15px;"><strong><?php _e('Tylko przycisk:', 'lupusursus-donations'); ?></strong></p>
            <code>[lupusursus_donate_button id="<?php echo $post->ID; ?>"]</code>
        </div>
        <?php
    }

    /**
     * Save campaign meta
     */
    public function save_campaign_meta($post_id, $post) {
        // Verify nonce
        if (!isset($_POST['lupusursus_campaign_meta_nonce']) ||
            !wp_verify_nonce($_POST['lupusursus_campaign_meta_nonce'], 'lupusursus_campaign_meta')) {
            return;
        }

        // Check autosave
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }

        // Check permissions
        if (!current_user_can('edit_post', $post_id)) {
            return;
        }

        // Save fields
        $fields = [
            'lupusursus_goal' => ['meta_key' => '_lupusursus_goal_amount', 'sanitize' => 'floatval'],
            'lupusursus_collected' => ['meta_key' => '_lupusursus_collected_amount', 'sanitize' => 'floatval'],
            'lupusursus_end_date' => ['meta_key' => '_lupusursus_end_date', 'sanitize' => 'sanitize_text_field'],
            'lupusursus_beneficiary' => ['meta_key' => '_lupusursus_beneficiary', 'sanitize' => 'sanitize_text_field'],
            'lupusursus_progress_style' => ['meta_key' => '_lupusursus_progress_style', 'sanitize' => 'sanitize_text_field'],
            'lupusursus_progress_color' => ['meta_key' => '_lupusursus_progress_color', 'sanitize' => 'sanitize_hex_color'],
        ];

        foreach ($fields as $field => $config) {
            if (isset($_POST[$field])) {
                $value = call_user_func($config['sanitize'], $_POST[$field]);
                update_post_meta($post_id, $config['meta_key'], $value);
            }
        }
    }

    /**
     * Add donation meta boxes
     */
    public function add_donation_meta_boxes() {
        add_meta_box(
            'lupusursus_donation_details',
            __('Szczegóły wpłaty', 'lupusursus-donations'),
            [$this, 'render_donation_details_meta_box'],
            'lupusursus_donation',
            'normal',
            'high'
        );
    }

    /**
     * Render donation details meta box
     */
    public function render_donation_details_meta_box($post) {
        $campaign_id = get_post_meta($post->ID, '_lupusursus_campaign_id', true);
        $amount = get_post_meta($post->ID, '_lupusursus_amount', true);
        $donor_name = get_post_meta($post->ID, '_lupusursus_donor_name', true);
        $donor_email = get_post_meta($post->ID, '_lupusursus_donor_email', true);
        $is_anonymous = get_post_meta($post->ID, '_lupusursus_is_anonymous', true);
        $message = get_post_meta($post->ID, '_lupusursus_message', true);
        $stripe_payment_id = get_post_meta($post->ID, '_lupusursus_stripe_payment_id', true);
        $status = get_post_meta($post->ID, '_lupusursus_status', true) ?: 'completed';

        $campaign = $campaign_id ? get_post($campaign_id) : null;
        ?>
        <div class="shelter-donation-details">
            <div class="shelter-donation-detail">
                <span class="label"><?php _e('Kwota', 'lupusursus-donations'); ?></span>
                <span class="value amount"><?php echo number_format($amount, 2, ',', ' '); ?> zł</span>
            </div>

            <div class="shelter-donation-detail">
                <span class="label"><?php _e('Status', 'lupusursus-donations'); ?></span>
                <span class="value status-<?php echo esc_attr($status); ?>">
                    <?php
                    $statuses = [
                        'completed' => __('Zrealizowana', 'lupusursus-donations'),
                        'pending' => __('Oczekująca', 'lupusursus-donations'),
                        'failed' => __('Nieudana', 'lupusursus-donations'),
                    ];
                    echo $statuses[$status] ?? $status;
                    ?>
                </span>
            </div>

            <div class="shelter-donation-detail">
                <span class="label"><?php _e('Zbiórka', 'lupusursus-donations'); ?></span>
                <span class="value">
                    <?php if ($campaign) : ?>
                        <a href="<?php echo get_edit_post_link($campaign_id); ?>">
                            <?php echo esc_html($campaign->post_title); ?>
                        </a>
                    <?php else : ?>
                        <?php _e('Brak', 'lupusursus-donations'); ?>
                    <?php endif; ?>
                </span>
            </div>

            <div class="shelter-donation-detail">
                <span class="label"><?php _e('Darczyńca', 'lupusursus-donations'); ?></span>
                <span class="value">
                    <?php if ($is_anonymous) : ?>
                        <?php _e('Anonimowy', 'lupusursus-donations'); ?>
                        <?php if ($donor_name) : ?>
                            <small>(<?php echo esc_html($donor_name); ?>)</small>
                        <?php endif; ?>
                    <?php else : ?>
                        <?php echo esc_html($donor_name ?: __('Nie podano', 'lupusursus-donations')); ?>
                    <?php endif; ?>
                </span>
            </div>

            <div class="shelter-donation-detail">
                <span class="label"><?php _e('Email', 'lupusursus-donations'); ?></span>
                <span class="value">
                    <?php if ($donor_email) : ?>
                        <a href="mailto:<?php echo esc_attr($donor_email); ?>">
                            <?php echo esc_html($donor_email); ?>
                        </a>
                    <?php else : ?>
                        <?php _e('Nie podano', 'lupusursus-donations'); ?>
                    <?php endif; ?>
                </span>
            </div>

            <?php if ($message) : ?>
                <div class="shelter-donation-detail" style="grid-column: 1 / -1;">
                    <span class="label"><?php _e('Wiadomość', 'lupusursus-donations'); ?></span>
                    <span class="value"><?php echo esc_html($message); ?></span>
                </div>
            <?php endif; ?>

            <?php if ($stripe_payment_id) : ?>
                <div class="shelter-donation-detail" style="grid-column: 1 / -1;">
                    <span class="label"><?php _e('Stripe Payment ID', 'lupusursus-donations'); ?></span>
                    <span class="value"><code><?php echo esc_html($stripe_payment_id); ?></code></span>
                </div>
            <?php endif; ?>
        </div>
        <?php
    }

    /**
     * Campaign columns
     */
    public function campaign_columns($columns) {
        $new_columns = [];

        foreach ($columns as $key => $value) {
            $new_columns[$key] = $value;

            if ($key === 'title') {
                $new_columns['lupusursus_progress'] = __('Postęp', 'lupusursus-donations');
                $new_columns['lupusursus_collected'] = __('Zebrano', 'lupusursus-donations');
                $new_columns['lupusursus_goal'] = __('Cel', 'lupusursus-donations');
                $new_columns['lupusursus_status'] = __('Status', 'lupusursus-donations');
            }
        }

        return $new_columns;
    }

    /**
     * Campaign column content
     */
    public function campaign_column_content($column, $post_id) {
        $campaign = LupusUrsus_Donations_Campaign_Post_Type::get_campaign_data($post_id);

        if (!$campaign) {
            echo '—';
            return;
        }

        switch ($column) {
            case 'lupusursus_progress':
                ?>
                <div class="shelter-admin-progress">
                    <div class="shelter-admin-progress-bar">
                        <span style="width: <?php echo esc_attr($campaign['percentage']); ?>%; background-color: <?php echo esc_attr($campaign['progress_color']); ?>;"></span>
                    </div>
                    <div class="shelter-admin-progress-text">
                        <span><?php echo $campaign['percentage']; ?>%</span>
                        <span><?php echo $campaign['donations_count']; ?> <?php _e('wpłat', 'lupusursus-donations'); ?></span>
                    </div>
                </div>
                <?php
                break;

            case 'lupusursus_collected':
                echo number_format($campaign['collected'], 0, ',', ' ') . ' zł';
                break;

            case 'lupusursus_goal':
                echo number_format($campaign['goal'], 0, ',', ' ') . ' zł';
                break;

            case 'lupusursus_status':
                $is_archived = LupusUrsus_Donations_Campaign_Post_Type::is_archived($post_id);

                if ($is_archived) {
                    $archived_at = get_post_meta($post_id, '_lupusursus_archived_at', true);
                    echo '<span class="shelter-status-badge shelter-status-badge--archived" title="' . esc_attr(sprintf(__('Zarchiwizowana %s', 'lupusursus-donations'), $archived_at)) . '">' . __('Zarchiwizowana', 'lupusursus-donations') . '</span>';
                } elseif ($campaign['is_active']) {
                    echo '<span class="shelter-status-badge shelter-status-badge--active">' . __('Aktywna', 'lupusursus-donations') . '</span>';
                } else {
                    echo '<span class="shelter-status-badge shelter-status-badge--inactive">' . __('Zakończona', 'lupusursus-donations') . '</span>';
                }
                break;
        }
    }

    /**
     * Sortable columns
     */
    public function campaign_sortable_columns($columns) {
        $columns['lupusursus_collected'] = 'lupusursus_collected';
        $columns['lupusursus_goal'] = 'lupusursus_goal';
        return $columns;
    }

    /**
     * Donation columns
     */
    public function donation_columns($columns) {
        $new_columns = [];

        foreach ($columns as $key => $value) {
            if ($key === 'title') {
                $new_columns[$key] = __('Darczyńca', 'lupusursus-donations');
                $new_columns['lupusursus_amount'] = __('Kwota', 'lupusursus-donations');
                $new_columns['lupusursus_campaign'] = __('Zbiórka', 'lupusursus-donations');
                $new_columns['lupusursus_status'] = __('Status', 'lupusursus-donations');
            } else {
                $new_columns[$key] = $value;
            }
        }

        return $new_columns;
    }

    /**
     * Donation column content
     */
    public function donation_column_content($column, $post_id) {
        switch ($column) {
            case 'lupusursus_amount':
                $amount = get_post_meta($post_id, '_lupusursus_amount', true);
                echo '<strong>' . number_format($amount, 2, ',', ' ') . ' zł</strong>';
                break;

            case 'lupusursus_campaign':
                $campaign_id = get_post_meta($post_id, '_lupusursus_campaign_id', true);
                $campaign = $campaign_id ? get_post($campaign_id) : null;

                if ($campaign) {
                    echo '<a href="' . get_edit_post_link($campaign_id) . '">' . esc_html($campaign->post_title) . '</a>';
                } else {
                    echo '—';
                }
                break;

            case 'lupusursus_status':
                $status = get_post_meta($post_id, '_lupusursus_status', true) ?: 'completed';
                $class = 'shelter-status-badge--' . $status;
                $labels = [
                    'completed' => __('Zrealizowana', 'lupusursus-donations'),
                    'pending' => __('Oczekująca', 'lupusursus-donations'),
                    'failed' => __('Nieudana', 'lupusursus-donations'),
                ];
                echo '<span class="shelter-status-badge ' . $class . '">' . ($labels[$status] ?? $status) . '</span>';
                break;
        }
    }

    /**
     * Admin notices
     */
    public function admin_notices() {
        $screen = get_current_screen();

        // Archive/Restore success messages
        if (isset($_GET['lupusursus_message'])) {
            $message = sanitize_text_field($_GET['lupusursus_message']);

            if ($message === 'archived') {
                ?>
                <div class="notice notice-success is-dismissible">
                    <p><?php _e('Zbiórka została zarchiwizowana.', 'lupusursus-donations'); ?></p>
                </div>
                <?php
            } elseif ($message === 'restored') {
                ?>
                <div class="notice notice-success is-dismissible">
                    <p><?php _e('Zbiórka została przywrócona.', 'lupusursus-donations'); ?></p>
                </div>
                <?php
            }
        }

        // Check Stripe configuration
        if (!$screen || (strpos($screen->id, 'shelter') === false && strpos($screen->id, 'lupusursus') === false)) {
            return;
        }

        $errors = LupusUrsus_Donations_Stripe_Handler::verify_configuration();

        if (is_array($errors) && !empty($errors)) {
            ?>
            <div class="notice notice-warning is-dismissible">
                <p>
                    <strong><?php _e('LupusUrsus Donations:', 'lupusursus-donations'); ?></strong>
                    <?php _e('Stripe nie jest w pełni skonfigurowany.', 'lupusursus-donations'); ?>
                    <a href="<?php echo admin_url('admin.php?page=lupusursus-donations'); ?>">
                        <?php _e('Przejdź do ustawień', 'lupusursus-donations'); ?>
                    </a>
                </p>
            </div>
            <?php
        }
    }

    /**
     * AJAX: Test Stripe connection
     */
    public function ajax_test_stripe() {
        check_ajax_referer('lupusursus_donations_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('Brak uprawnień.', 'lupusursus-donations')]);
        }

        $init = LupusUrsus_Donations_Stripe_Handler::init_stripe();

        if (is_wp_error($init)) {
            wp_send_json_error(['message' => $init->get_error_message()]);
        }

        try {
            // Try to retrieve balance to test connection
            $balance = \Stripe\Balance::retrieve();
            wp_send_json_success([
                'message' => __('Połączenie ze Stripe działa poprawnie!', 'lupusursus-donations'),
            ]);
        } catch (\Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }

    /**
     * AJAX: Recalculate campaign total
     */
    public function ajax_recalculate_campaign() {
        check_ajax_referer('lupusursus_donations_admin', 'nonce');

        if (!current_user_can('edit_posts')) {
            wp_send_json_error(['message' => __('Brak uprawnień.', 'lupusursus-donations')]);
        }

        $campaign_id = absint($_POST['campaign_id'] ?? 0);

        if (!$campaign_id) {
            wp_send_json_error(['message' => __('Nieprawidłowe ID zbiórki.', 'lupusursus-donations')]);
        }

        LupusUrsus_Donations_Donation_Post_Type::recalculate_campaign_amount($campaign_id);

        $collected = get_post_meta($campaign_id, '_lupusursus_collected', true);

        wp_send_json_success([
            'collected' => number_format($collected, 2, ',', ' '),
            'message' => __('Suma wpłat została przeliczona.', 'lupusursus-donations'),
        ]);
    }

    /**
     * Add row actions for archive/restore
     */
    public function campaign_row_actions($actions, $post) {
        if ($post->post_type !== 'lupusursus_campaign') {
            return $actions;
        }

        $is_archived = LupusUrsus_Donations_Campaign_Post_Type::is_archived($post->ID);

        if ($is_archived) {
            // Show restore action for archived campaigns
            $restore_url = wp_nonce_url(
                add_query_arg([
                    'action' => 'lupusursus_restore',
                    'campaign_id' => $post->ID,
                ], admin_url('edit.php?post_type=lupusursus_campaign')),
                'lupusursus_restore_' . $post->ID
            );
            $actions['restore'] = sprintf(
                '<a href="%s" style="color:#46b450;">%s</a>',
                esc_url($restore_url),
                __('Przywróć', 'lupusursus-donations')
            );
        } else {
            // Show archive action for active campaigns
            $archive_url = wp_nonce_url(
                add_query_arg([
                    'action' => 'lupusursus_archive',
                    'campaign_id' => $post->ID,
                ], admin_url('edit.php?post_type=lupusursus_campaign')),
                'lupusursus_archive_' . $post->ID
            );
            $actions['archive'] = sprintf(
                '<a href="%s" style="color:#a36804;">%s</a>',
                esc_url($archive_url),
                __('Archiwizuj', 'lupusursus-donations')
            );
        }

        return $actions;
    }

    /**
     * Handle archive/restore URL actions
     */
    public function handle_archive_actions() {
        if (!isset($_GET['action']) || !isset($_GET['campaign_id'])) {
            return;
        }

        $action = sanitize_text_field($_GET['action']);
        $campaign_id = absint($_GET['campaign_id']);

        if (!in_array($action, ['lupusursus_archive', 'lupusursus_restore'])) {
            return;
        }

        // Verify nonce
        $nonce_action = ($action === 'lupusursus_archive') ? 'lupusursus_archive_' : 'lupusursus_restore_';
        if (!wp_verify_nonce($_GET['_wpnonce'] ?? '', $nonce_action . $campaign_id)) {
            wp_die(__('Nieprawidłowy token bezpieczeństwa.', 'lupusursus-donations'));
        }

        // Check permissions
        if (!current_user_can('edit_post', $campaign_id)) {
            wp_die(__('Brak uprawnień.', 'lupusursus-donations'));
        }

        // Perform action
        if ($action === 'lupusursus_archive') {
            LupusUrsus_Donations_Campaign_Post_Type::archive_campaign($campaign_id);
            $message = 'archived';
        } else {
            LupusUrsus_Donations_Campaign_Post_Type::restore_campaign($campaign_id);
            $message = 'restored';
        }

        // Redirect back
        wp_redirect(add_query_arg([
            'post_type' => 'lupusursus_campaign',
            'lupusursus_message' => $message,
        ], admin_url('edit.php')));
        exit;
    }

    /**
     * Add archive filter dropdown
     */
    public function add_archive_filter($post_type) {
        if ($post_type !== 'lupusursus_campaign') {
            return;
        }

        $current = isset($_GET['lupusursus_archive_filter']) ? sanitize_text_field($_GET['lupusursus_archive_filter']) : '';
        ?>
        <select name="lupusursus_archive_filter">
            <option value="" <?php selected($current, ''); ?>><?php _e('Aktywne zbiórki', 'lupusursus-donations'); ?></option>
            <option value="archived" <?php selected($current, 'archived'); ?>><?php _e('Zarchiwizowane', 'lupusursus-donations'); ?></option>
            <option value="all" <?php selected($current, 'all'); ?>><?php _e('Wszystkie', 'lupusursus-donations'); ?></option>
        </select>
        <?php
    }

    /**
     * Filter campaigns by archive status
     */
    public function filter_by_archive_status($query) {
        global $pagenow;

        if (!is_admin() || $pagenow !== 'edit.php' || !$query->is_main_query()) {
            return;
        }

        if ($query->get('post_type') !== 'lupusursus_campaign') {
            return;
        }

        $filter = isset($_GET['lupusursus_archive_filter']) ? sanitize_text_field($_GET['lupusursus_archive_filter']) : '';

        $meta_query = $query->get('meta_query') ?: [];

        switch ($filter) {
            case 'archived':
                // Show only archived
                $meta_query[] = [
                    'key' => '_lupusursus_archived_at',
                    'compare' => 'EXISTS',
                ];
                break;

            case 'all':
                // Show all (no filter)
                break;

            default:
                // Show only non-archived (default)
                $meta_query[] = [
                    'key' => '_lupusursus_archived_at',
                    'compare' => 'NOT EXISTS',
                ];
                break;
        }

        if (!empty($meta_query)) {
            $query->set('meta_query', $meta_query);
        }
    }

    /**
     * AJAX: Archive campaign
     */
    public function ajax_archive_campaign() {
        check_ajax_referer('lupusursus_donations_admin', 'nonce');

        if (!current_user_can('edit_posts')) {
            wp_send_json_error(['message' => __('Brak uprawnień.', 'lupusursus-donations')]);
        }

        $campaign_id = absint($_POST['campaign_id'] ?? 0);

        if (!$campaign_id) {
            wp_send_json_error(['message' => __('Nieprawidłowe ID zbiórki.', 'lupusursus-donations')]);
        }

        $result = LupusUrsus_Donations_Campaign_Post_Type::archive_campaign($campaign_id);

        if ($result) {
            wp_send_json_success([
                'message' => __('Zbiórka została zarchiwizowana.', 'lupusursus-donations'),
            ]);
        } else {
            wp_send_json_error(['message' => __('Nie udało się zarchiwizować zbiórki.', 'lupusursus-donations')]);
        }
    }

    /**
     * AJAX: Restore campaign
     */
    public function ajax_restore_campaign() {
        check_ajax_referer('lupusursus_donations_admin', 'nonce');

        if (!current_user_can('edit_posts')) {
            wp_send_json_error(['message' => __('Brak uprawnień.', 'lupusursus-donations')]);
        }

        $campaign_id = absint($_POST['campaign_id'] ?? 0);

        if (!$campaign_id) {
            wp_send_json_error(['message' => __('Nieprawidłowe ID zbiórki.', 'lupusursus-donations')]);
        }

        $result = LupusUrsus_Donations_Campaign_Post_Type::restore_campaign($campaign_id);

        if ($result) {
            wp_send_json_success([
                'message' => __('Zbiórka została przywrócona.', 'lupusursus-donations'),
            ]);
        } else {
            wp_send_json_error(['message' => __('Nie udało się przywrócić zbiórki.', 'lupusursus-donations')]);
        }
    }
}

// Initialize
new LupusUrsus_Donations_Admin_Campaigns();
