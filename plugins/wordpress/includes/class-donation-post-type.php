<?php
/**
 * Donation Custom Post Type
 *
 * @package LupusUrsus_Donations
 */

if (!defined('ABSPATH')) {
    exit;
}

class LupusUrsus_Donations_Donation_Post_Type {

    /**
     * Post type name
     */
    const POST_TYPE = 'lupusursus_donation';

    /**
     * Register the custom post type
     */
    public static function register() {
        $labels = [
            'name'               => __('Wpłaty', 'lupusursus-donations'),
            'singular_name'      => __('Wpłata', 'lupusursus-donations'),
            'menu_name'          => __('Wpłaty', 'lupusursus-donations'),
            'add_new'            => __('Dodaj wpłatę', 'lupusursus-donations'),
            'add_new_item'       => __('Dodaj nową wpłatę', 'lupusursus-donations'),
            'edit_item'          => __('Edytuj wpłatę', 'lupusursus-donations'),
            'view_item'          => __('Zobacz wpłatę', 'lupusursus-donations'),
            'search_items'       => __('Szukaj wpłat', 'lupusursus-donations'),
            'not_found'          => __('Nie znaleziono wpłat', 'lupusursus-donations'),
            'not_found_in_trash' => __('Nie znaleziono w koszu', 'lupusursus-donations'),
            'all_items'          => __('Wszystkie wpłaty', 'lupusursus-donations'),
        ];

        $args = [
            'labels'              => $labels,
            'public'              => false,
            'publicly_queryable'  => false,
            'show_ui'             => true,
            'show_in_menu'        => 'edit.php?post_type=lupusursus_campaign',
            'query_var'           => false,
            'capability_type'     => 'post',
            'has_archive'         => false,
            'hierarchical'        => false,
            'supports'            => ['title'],
            'show_in_rest'        => false,
        ];

        register_post_type(self::POST_TYPE, $args);

        // Register meta boxes
        add_action('add_meta_boxes', [__CLASS__, 'add_meta_boxes']);
        add_action('save_post_' . self::POST_TYPE, [__CLASS__, 'save_meta_boxes'], 10, 2);

        // Add custom columns
        add_filter('manage_' . self::POST_TYPE . '_posts_columns', [__CLASS__, 'add_columns']);
        add_action('manage_' . self::POST_TYPE . '_posts_custom_column', [__CLASS__, 'render_columns'], 10, 2);
        add_filter('manage_edit-' . self::POST_TYPE . '_sortable_columns', [__CLASS__, 'sortable_columns']);
    }

    /**
     * Add meta boxes
     */
    public static function add_meta_boxes() {
        add_meta_box(
            'lupusursus_donation_details',
            __('Szczegóły wpłaty', 'lupusursus-donations'),
            [__CLASS__, 'render_details_meta_box'],
            self::POST_TYPE,
            'normal',
            'high'
        );
    }

    /**
     * Render details meta box
     */
    public static function render_details_meta_box($post) {
        wp_nonce_field('lupusursus_donation_details', 'lupusursus_donation_nonce');

        $campaign_id = get_post_meta($post->ID, '_lupusursus_campaign_id', true);
        $amount = get_post_meta($post->ID, '_lupusursus_amount', true);
        $donor_name = get_post_meta($post->ID, '_lupusursus_donor_name', true);
        $donor_email = get_post_meta($post->ID, '_lupusursus_donor_email', true);
        $is_anonymous = get_post_meta($post->ID, '_lupusursus_is_anonymous', true);
        $message = get_post_meta($post->ID, '_lupusursus_message', true);
        $stripe_payment_id = get_post_meta($post->ID, '_lupusursus_stripe_payment_id', true);
        $status = get_post_meta($post->ID, '_lupusursus_status', true) ?: 'completed';

        // Get campaigns for dropdown
        $campaigns = get_posts([
            'post_type' => 'lupusursus_campaign',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'orderby' => 'title',
            'order' => 'ASC',
        ]);
        ?>
        <table class="form-table">
            <tr>
                <th><label for="lupusursus_campaign_id"><?php _e('Zbiórka', 'lupusursus-donations'); ?></label></th>
                <td>
                    <select id="lupusursus_campaign_id" name="lupusursus_campaign_id" class="regular-text">
                        <option value=""><?php _e('-- Wybierz zbiórkę --', 'lupusursus-donations'); ?></option>
                        <?php foreach ($campaigns as $campaign) : ?>
                            <option value="<?php echo $campaign->ID; ?>" <?php selected($campaign_id, $campaign->ID); ?>>
                                <?php echo esc_html($campaign->post_title); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </td>
            </tr>
            <tr>
                <th><label for="lupusursus_amount"><?php _e('Kwota (zł)', 'lupusursus-donations'); ?></label></th>
                <td>
                    <input type="number" id="lupusursus_amount" name="lupusursus_amount"
                           value="<?php echo esc_attr($amount); ?>"
                           min="1" step="0.01" class="regular-text">
                </td>
            </tr>
            <tr>
                <th><label for="lupusursus_donor_name"><?php _e('Imię darczyńcy', 'lupusursus-donations'); ?></label></th>
                <td>
                    <input type="text" id="lupusursus_donor_name" name="lupusursus_donor_name"
                           value="<?php echo esc_attr($donor_name); ?>" class="regular-text">
                </td>
            </tr>
            <tr>
                <th><label for="lupusursus_donor_email"><?php _e('Email darczyńcy', 'lupusursus-donations'); ?></label></th>
                <td>
                    <input type="email" id="lupusursus_donor_email" name="lupusursus_donor_email"
                           value="<?php echo esc_attr($donor_email); ?>" class="regular-text">
                </td>
            </tr>
            <tr>
                <th><label for="lupusursus_is_anonymous"><?php _e('Anonimowa', 'lupusursus-donations'); ?></label></th>
                <td>
                    <label>
                        <input type="checkbox" id="lupusursus_is_anonymous" name="lupusursus_is_anonymous"
                               value="1" <?php checked($is_anonymous); ?>>
                        <?php _e('Darczyńca chce pozostać anonimowy', 'lupusursus-donations'); ?>
                    </label>
                </td>
            </tr>
            <tr>
                <th><label for="lupusursus_message"><?php _e('Wiadomość', 'lupusursus-donations'); ?></label></th>
                <td>
                    <textarea id="lupusursus_message" name="lupusursus_message" rows="3" class="large-text"><?php echo esc_textarea($message); ?></textarea>
                </td>
            </tr>
            <tr>
                <th><label for="lupusursus_status"><?php _e('Status', 'lupusursus-donations'); ?></label></th>
                <td>
                    <select id="lupusursus_status" name="lupusursus_status">
                        <option value="pending" <?php selected($status, 'pending'); ?>><?php _e('Oczekująca', 'lupusursus-donations'); ?></option>
                        <option value="completed" <?php selected($status, 'completed'); ?>><?php _e('Zakończona', 'lupusursus-donations'); ?></option>
                        <option value="failed" <?php selected($status, 'failed'); ?>><?php _e('Nieudana', 'lupusursus-donations'); ?></option>
                        <option value="refunded" <?php selected($status, 'refunded'); ?>><?php _e('Zwrócona', 'lupusursus-donations'); ?></option>
                    </select>
                </td>
            </tr>
            <?php if ($stripe_payment_id) : ?>
            <tr>
                <th><?php _e('Stripe Payment ID', 'lupusursus-donations'); ?></th>
                <td>
                    <code><?php echo esc_html($stripe_payment_id); ?></code>
                </td>
            </tr>
            <?php endif; ?>
        </table>
        <?php
    }

    /**
     * Save meta boxes
     */
    public static function save_meta_boxes($post_id, $post) {
        // Verify nonce
        if (!isset($_POST['lupusursus_donation_nonce']) ||
            !wp_verify_nonce($_POST['lupusursus_donation_nonce'], 'lupusursus_donation_details')) {
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

        // Get old campaign ID to update amounts
        $old_campaign_id = get_post_meta($post_id, '_lupusursus_campaign_id', true);
        $old_amount = (float) get_post_meta($post_id, '_lupusursus_amount', true);
        $old_status = get_post_meta($post_id, '_lupusursus_status', true);

        // Save meta fields
        $fields = [
            'lupusursus_campaign_id' => '_lupusursus_campaign_id',
            'lupusursus_amount' => '_lupusursus_amount',
            'lupusursus_donor_name' => '_lupusursus_donor_name',
            'lupusursus_donor_email' => '_lupusursus_donor_email',
            'lupusursus_message' => '_lupusursus_message',
            'lupusursus_status' => '_lupusursus_status',
        ];

        foreach ($fields as $input => $meta_key) {
            if (isset($_POST[$input])) {
                update_post_meta($post_id, $meta_key, sanitize_text_field($_POST[$input]));
            }
        }

        // Checkbox
        update_post_meta($post_id, '_lupusursus_is_anonymous', isset($_POST['lupusursus_is_anonymous']) ? '1' : '0');

        // Update campaign collected amounts
        $new_campaign_id = sanitize_text_field($_POST['lupusursus_campaign_id'] ?? '');
        $new_amount = (float) sanitize_text_field($_POST['lupusursus_amount'] ?? 0);
        $new_status = sanitize_text_field($_POST['lupusursus_status'] ?? 'completed');

        // Recalculate campaign amounts if needed
        if ($old_campaign_id && ($old_campaign_id !== $new_campaign_id || $old_status === 'completed')) {
            if ($old_status === 'completed') {
                // Remove old amount from old campaign
                self::recalculate_campaign_amount($old_campaign_id);
            }
        }

        if ($new_campaign_id && $new_status === 'completed') {
            // Add new amount to new campaign
            self::recalculate_campaign_amount($new_campaign_id);
        }
    }

    /**
     * Recalculate campaign collected amount
     */
    public static function recalculate_campaign_amount($campaign_id) {
        global $wpdb;

        $total = $wpdb->get_var($wpdb->prepare(
            "SELECT SUM(pm.meta_value)
             FROM {$wpdb->postmeta} pm
             INNER JOIN {$wpdb->postmeta} pm2 ON pm.post_id = pm2.post_id
             INNER JOIN {$wpdb->postmeta} pm3 ON pm.post_id = pm3.post_id
             INNER JOIN {$wpdb->posts} p ON pm.post_id = p.ID
             WHERE pm.meta_key = '_lupusursus_amount'
             AND pm2.meta_key = '_lupusursus_campaign_id' AND pm2.meta_value = %d
             AND pm3.meta_key = '_lupusursus_status' AND pm3.meta_value = 'completed'
             AND p.post_type = 'lupusursus_donation'
             AND p.post_status = 'publish'",
            $campaign_id
        ));

        update_post_meta($campaign_id, '_lupusursus_collected_amount', $total ?: 0);
    }

    /**
     * Add custom columns
     */
    public static function add_columns($columns) {
        return [
            'cb' => $columns['cb'],
            'title' => __('Wpłata', 'lupusursus-donations'),
            'donation_campaign' => __('Zbiórka', 'lupusursus-donations'),
            'donation_amount' => __('Kwota', 'lupusursus-donations'),
            'donation_donor' => __('Darczyńca', 'lupusursus-donations'),
            'donation_status' => __('Status', 'lupusursus-donations'),
            'date' => __('Data', 'lupusursus-donations'),
        ];
    }

    /**
     * Render custom columns
     */
    public static function render_columns($column, $post_id) {
        switch ($column) {
            case 'donation_campaign':
                $campaign_id = get_post_meta($post_id, '_lupusursus_campaign_id', true);
                if ($campaign_id) {
                    $campaign = get_post($campaign_id);
                    if ($campaign) {
                        echo '<a href="' . get_edit_post_link($campaign_id) . '">' . esc_html($campaign->post_title) . '</a>';
                    } else {
                        echo '-';
                    }
                } else {
                    echo '-';
                }
                break;

            case 'donation_amount':
                $amount = get_post_meta($post_id, '_lupusursus_amount', true);
                echo $amount ? '<strong>' . number_format($amount, 2, ',', ' ') . ' zł</strong>' : '-';
                break;

            case 'donation_donor':
                $is_anonymous = get_post_meta($post_id, '_lupusursus_is_anonymous', true);
                if ($is_anonymous) {
                    echo '<em>' . __('Anonimowy', 'lupusursus-donations') . '</em>';
                } else {
                    $name = get_post_meta($post_id, '_lupusursus_donor_name', true);
                    $email = get_post_meta($post_id, '_lupusursus_donor_email', true);
                    echo esc_html($name ?: '-');
                    if ($email) {
                        echo '<br><small>' . esc_html($email) . '</small>';
                    }
                }
                break;

            case 'donation_status':
                $status = get_post_meta($post_id, '_lupusursus_status', true) ?: 'completed';
                $statuses = [
                    'pending' => ['label' => __('Oczekująca', 'lupusursus-donations'), 'color' => '#f0ad4e'],
                    'completed' => ['label' => __('Zakończona', 'lupusursus-donations'), 'color' => '#46b450'],
                    'failed' => ['label' => __('Nieudana', 'lupusursus-donations'), 'color' => '#dc3232'],
                    'refunded' => ['label' => __('Zwrócona', 'lupusursus-donations'), 'color' => '#0073aa'],
                ];
                $s = $statuses[$status] ?? $statuses['pending'];
                echo '<span style="color:' . $s['color'] . ';">● ' . $s['label'] . '</span>';
                break;
        }
    }

    /**
     * Sortable columns
     */
    public static function sortable_columns($columns) {
        $columns['donation_amount'] = 'donation_amount';
        return $columns;
    }

    /**
     * Create donation
     */
    public static function create_donation($data) {
        $donation_id = wp_insert_post([
            'post_type' => self::POST_TYPE,
            'post_status' => 'publish',
            'post_title' => sprintf(
                __('Wpłata #%s - %s zł', 'lupusursus-donations'),
                date('YmdHis'),
                number_format($data['amount'], 2, ',', ' ')
            ),
        ]);

        if (is_wp_error($donation_id)) {
            return $donation_id;
        }

        // Save meta data
        update_post_meta($donation_id, '_lupusursus_campaign_id', $data['campaign_id']);
        update_post_meta($donation_id, '_lupusursus_amount', $data['amount']);
        update_post_meta($donation_id, '_lupusursus_donor_name', $data['donor_name'] ?? '');
        update_post_meta($donation_id, '_lupusursus_donor_email', $data['donor_email'] ?? '');
        update_post_meta($donation_id, '_lupusursus_is_anonymous', $data['is_anonymous'] ?? false);
        update_post_meta($donation_id, '_lupusursus_message', $data['message'] ?? '');
        update_post_meta($donation_id, '_lupusursus_stripe_payment_id', $data['stripe_payment_id'] ?? '');
        update_post_meta($donation_id, '_lupusursus_stripe_session_id', $data['stripe_session_id'] ?? '');
        update_post_meta($donation_id, '_lupusursus_status', $data['status'] ?? 'completed');

        // Update campaign collected amount
        if (($data['status'] ?? 'completed') === 'completed') {
            LupusUrsus_Donations_Campaign_Post_Type::update_collected_amount(
                $data['campaign_id'],
                $data['amount']
            );
        }

        return $donation_id;
    }

    /**
     * Get donations for campaign
     */
    public static function get_campaign_donations($campaign_id, $limit = 10) {
        $donations = get_posts([
            'post_type' => self::POST_TYPE,
            'post_status' => 'publish',
            'posts_per_page' => $limit,
            'orderby' => 'date',
            'order' => 'DESC',
            'meta_query' => [
                'relation' => 'AND',
                [
                    'key' => '_lupusursus_campaign_id',
                    'value' => $campaign_id,
                ],
                [
                    'key' => '_lupusursus_status',
                    'value' => 'completed',
                ],
            ],
        ]);

        $result = [];
        foreach ($donations as $donation) {
            $is_anonymous = get_post_meta($donation->ID, '_lupusursus_is_anonymous', true);
            $result[] = [
                'id' => $donation->ID,
                'amount' => (float) get_post_meta($donation->ID, '_lupusursus_amount', true),
                'donor_name' => $is_anonymous ? __('Anonimowy darczyńca', 'lupusursus-donations') : get_post_meta($donation->ID, '_lupusursus_donor_name', true),
                'message' => get_post_meta($donation->ID, '_lupusursus_message', true),
                'date' => $donation->post_date,
                'is_anonymous' => (bool) $is_anonymous,
            ];
        }

        return $result;
    }
}
