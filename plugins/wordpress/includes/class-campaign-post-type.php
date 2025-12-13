<?php
/**
 * Campaign Custom Post Type
 *
 * @package LupusUrsus_Donations
 */

if (!defined('ABSPATH')) {
    exit;
}

class LupusUrsus_Donations_Campaign_Post_Type {

    /**
     * Post type name
     */
    const POST_TYPE = 'lupusursus_campaign';

    /**
     * Register the custom post type
     */
    public static function register() {
        $labels = [
            'name'                  => __('Zbiórki', 'lupusursus-donations'),
            'singular_name'         => __('Zbiórka', 'lupusursus-donations'),
            'menu_name'             => __('Zbiórki', 'lupusursus-donations'),
            'add_new'               => __('Dodaj nową', 'lupusursus-donations'),
            'add_new_item'          => __('Dodaj nową zbiórkę', 'lupusursus-donations'),
            'edit_item'             => __('Edytuj zbiórkę', 'lupusursus-donations'),
            'new_item'              => __('Nowa zbiórka', 'lupusursus-donations'),
            'view_item'             => __('Zobacz zbiórkę', 'lupusursus-donations'),
            'search_items'          => __('Szukaj zbiórek', 'lupusursus-donations'),
            'not_found'             => __('Nie znaleziono zbiórek', 'lupusursus-donations'),
            'not_found_in_trash'    => __('Nie znaleziono w koszu', 'lupusursus-donations'),
            'all_items'             => __('Wszystkie zbiórki', 'lupusursus-donations'),
            'archives'              => __('Archiwum zbiórek', 'lupusursus-donations'),
            'featured_image'        => __('Zdjęcie zbiórki', 'lupusursus-donations'),
            'set_featured_image'    => __('Ustaw zdjęcie', 'lupusursus-donations'),
            'remove_featured_image' => __('Usuń zdjęcie', 'lupusursus-donations'),
        ];

        $args = [
            'labels'              => $labels,
            'public'              => true,
            'publicly_queryable'  => true,
            'show_ui'             => true,
            'show_in_menu'        => true,
            'query_var'           => true,
            'rewrite'             => ['slug' => 'zbiorka', 'with_front' => false],
            'capability_type'     => 'post',
            'has_archive'         => true,
            'hierarchical'        => false,
            'menu_position'       => 25,
            'menu_icon'           => 'dashicons-heart',
            'supports'            => ['title', 'editor', 'thumbnail', 'excerpt'],
            'show_in_rest'        => true,
        ];

        register_post_type(self::POST_TYPE, $args);

        // Register meta boxes
        add_action('add_meta_boxes', [__CLASS__, 'add_meta_boxes']);
        add_action('save_post_' . self::POST_TYPE, [__CLASS__, 'save_meta_boxes'], 10, 2);

        // Add custom columns
        add_filter('manage_' . self::POST_TYPE . '_posts_columns', [__CLASS__, 'add_columns']);
        add_action('manage_' . self::POST_TYPE . '_posts_custom_column', [__CLASS__, 'render_columns'], 10, 2);
    }

    /**
     * Add meta boxes
     */
    public static function add_meta_boxes() {
        add_meta_box(
            'lupusursus_campaign_details',
            __('Szczegóły zbiórki', 'lupusursus-donations'),
            [__CLASS__, 'render_details_meta_box'],
            self::POST_TYPE,
            'normal',
            'high'
        );

        add_meta_box(
            'lupusursus_campaign_progress',
            __('Postęp zbiórki', 'lupusursus-donations'),
            [__CLASS__, 'render_progress_meta_box'],
            self::POST_TYPE,
            'side',
            'high'
        );

        add_meta_box(
            'lupusursus_campaign_shortcode',
            __('Shortcode', 'lupusursus-donations'),
            [__CLASS__, 'render_shortcode_meta_box'],
            self::POST_TYPE,
            'side',
            'default'
        );
    }

    /**
     * Render details meta box
     */
    public static function render_details_meta_box($post) {
        wp_nonce_field('lupusursus_campaign_details', 'lupusursus_campaign_nonce');

        $goal_amount = get_post_meta($post->ID, '_lupusursus_goal_amount', true);
        $collected_amount = get_post_meta($post->ID, '_lupusursus_collected_amount', true) ?: 0;
        $end_date = get_post_meta($post->ID, '_lupusursus_end_date', true);
        $beneficiary = get_post_meta($post->ID, '_lupusursus_beneficiary', true);
        $is_active = get_post_meta($post->ID, '_lupusursus_is_active', true) !== '0';
        $show_donors = get_post_meta($post->ID, '_lupusursus_show_donors', true) !== '0';
        $progress_style = get_post_meta($post->ID, '_lupusursus_progress_style', true) ?: 'default';
        $progress_color = get_post_meta($post->ID, '_lupusursus_progress_color', true) ?: '#4CAF50';
        $gallery_images = get_post_meta($post->ID, '_lupusursus_gallery_images', true) ?: [];
        if (!is_array($gallery_images)) {
            $gallery_images = [];
        }
        ?>
        <table class="form-table shelter-campaign-meta">
            <tr>
                <th><label for="lupusursus_goal_amount"><?php _e('Kwota docelowa (zł)', 'lupusursus-donations'); ?></label></th>
                <td>
                    <input type="number" id="lupusursus_goal_amount" name="lupusursus_goal_amount"
                           value="<?php echo esc_attr($goal_amount); ?>"
                           min="1" step="1" class="regular-text" required>
                    <p class="description"><?php _e('Ile chcesz zebrać?', 'lupusursus-donations'); ?></p>
                </td>
            </tr>
            <tr>
                <th><label for="lupusursus_collected_amount"><?php _e('Zebrana kwota (zł)', 'lupusursus-donations'); ?></label></th>
                <td>
                    <input type="number" id="lupusursus_collected_amount" name="lupusursus_collected_amount"
                           value="<?php echo esc_attr($collected_amount); ?>"
                           min="0" step="0.01" class="regular-text">
                    <p class="description"><?php _e('Aktualizowane automatycznie po każdej wpłacie.', 'lupusursus-donations'); ?></p>
                </td>
            </tr>
            <tr>
                <th><label for="lupusursus_end_date"><?php _e('Data zakończenia', 'lupusursus-donations'); ?></label></th>
                <td>
                    <input type="date" id="lupusursus_end_date" name="lupusursus_end_date"
                           value="<?php echo esc_attr($end_date); ?>" class="regular-text">
                    <p class="description"><?php _e('Opcjonalne. Zostaw puste dla zbiórki bez limitu czasu.', 'lupusursus-donations'); ?></p>
                </td>
            </tr>
            <tr>
                <th><label for="lupusursus_beneficiary"><?php _e('Beneficjent', 'lupusursus-donations'); ?></label></th>
                <td>
                    <input type="text" id="lupusursus_beneficiary" name="lupusursus_beneficiary"
                           value="<?php echo esc_attr($beneficiary); ?>" class="regular-text">
                    <p class="description"><?php _e('Np. imię zwierzęcia lub nazwa akcji.', 'lupusursus-donations'); ?></p>
                </td>
            </tr>
            <tr>
                <th><label for="lupusursus_is_active"><?php _e('Status', 'lupusursus-donations'); ?></label></th>
                <td>
                    <label>
                        <input type="checkbox" id="lupusursus_is_active" name="lupusursus_is_active"
                               value="1" <?php checked($is_active); ?>>
                        <?php _e('Zbiórka aktywna', 'lupusursus-donations'); ?>
                    </label>
                    <p class="description"><?php _e('Odznacz aby zatrzymać przyjmowanie wpłat.', 'lupusursus-donations'); ?></p>
                </td>
            </tr>
            <tr>
                <th><label for="lupusursus_show_donors"><?php _e('Pokaż darczyńców', 'lupusursus-donations'); ?></label></th>
                <td>
                    <label>
                        <input type="checkbox" id="lupusursus_show_donors" name="lupusursus_show_donors"
                               value="1" <?php checked($show_donors); ?>>
                        <?php _e('Wyświetlaj listę darczyńców', 'lupusursus-donations'); ?>
                    </label>
                </td>
            </tr>
            <tr>
                <th><label for="lupusursus_progress_style"><?php _e('Styl paska postępu', 'lupusursus-donations'); ?></label></th>
                <td>
                    <select id="lupusursus_progress_style" name="lupusursus_progress_style">
                        <option value="default" <?php selected($progress_style, 'default'); ?>><?php _e('Domyślny', 'lupusursus-donations'); ?></option>
                        <option value="rounded" <?php selected($progress_style, 'rounded'); ?>><?php _e('Zaokrąglony', 'lupusursus-donations'); ?></option>
                        <option value="striped" <?php selected($progress_style, 'striped'); ?>><?php _e('W paski', 'lupusursus-donations'); ?></option>
                        <option value="animated" <?php selected($progress_style, 'animated'); ?>><?php _e('Animowany', 'lupusursus-donations'); ?></option>
                        <option value="gradient" <?php selected($progress_style, 'gradient'); ?>><?php _e('Gradient', 'lupusursus-donations'); ?></option>
                    </select>
                </td>
            </tr>
            <tr>
                <th><label for="lupusursus_progress_color"><?php _e('Kolor paska', 'lupusursus-donations'); ?></label></th>
                <td>
                    <input type="color" id="lupusursus_progress_color" name="lupusursus_progress_color"
                           value="<?php echo esc_attr($progress_color); ?>">
                </td>
            </tr>
            <tr>
                <th><label><?php _e('Galeria zdjęć', 'lupusursus-donations'); ?></label></th>
                <td>
                    <div id="lupusursus-gallery-container">
                        <?php foreach ($gallery_images as $index => $image_url) : ?>
                            <div class="lupusursus-gallery-item" data-index="<?php echo $index; ?>">
                                <img src="<?php echo esc_url($image_url); ?>" alt="">
                                <input type="hidden" name="lupusursus_gallery_images[]" value="<?php echo esc_url($image_url); ?>">
                                <span class="lupusursus-gallery-index">[<?php echo $index + 1; ?>]</span>
                                <button type="button" class="lupusursus-gallery-remove">&times;</button>
                            </div>
                        <?php endforeach; ?>
                    </div>
                    <button type="button" id="lupusursus-add-gallery-image" class="button">
                        <?php _e('Dodaj zdjęcia', 'lupusursus-donations'); ?>
                    </button>
                    <p class="description">
                        <?php _e('Użyj [1], [2], [3] itd. w opisie aby wstawić zdjęcie w tekst. Np. "[1]" wstawi pierwsze zdjęcie z galerii.', 'lupusursus-donations'); ?>
                    </p>
                </td>
            </tr>
        </table>
        <style>
            #lupusursus-gallery-container {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-bottom: 10px;
            }
            .lupusursus-gallery-item {
                position: relative;
                width: 120px;
                height: 120px;
                border: 2px solid #ddd;
                border-radius: 4px;
                overflow: hidden;
            }
            .lupusursus-gallery-item img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .lupusursus-gallery-index {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: rgba(0,0,0,0.7);
                color: #fff;
                text-align: center;
                padding: 2px 0;
                font-size: 12px;
                font-weight: bold;
            }
            .lupusursus-gallery-remove {
                position: absolute;
                top: 2px;
                right: 2px;
                background: rgba(220,50,50,0.9);
                color: #fff;
                border: none;
                border-radius: 50%;
                width: 22px;
                height: 22px;
                cursor: pointer;
                font-size: 16px;
                line-height: 1;
                padding: 0;
            }
            .lupusursus-gallery-remove:hover {
                background: #c00;
            }
        </style>
        <script>
        jQuery(document).ready(function($) {
            var galleryFrame;

            $('#lupusursus-add-gallery-image').on('click', function(e) {
                e.preventDefault();

                if (galleryFrame) {
                    galleryFrame.open();
                    return;
                }

                galleryFrame = wp.media({
                    title: '<?php _e('Wybierz zdjęcia do galerii', 'lupusursus-donations'); ?>',
                    button: { text: '<?php _e('Dodaj do galerii', 'lupusursus-donations'); ?>' },
                    multiple: true
                });

                galleryFrame.on('select', function() {
                    var attachments = galleryFrame.state().get('selection').toJSON();
                    var container = $('#lupusursus-gallery-container');
                    var currentCount = container.find('.lupusursus-gallery-item').length;

                    attachments.forEach(function(attachment, i) {
                        var index = currentCount + i;
                        var imageUrl = attachment.sizes && attachment.sizes.medium ? attachment.sizes.medium.url : attachment.url;
                        var fullUrl = attachment.url;

                        var html = '<div class="lupusursus-gallery-item" data-index="' + index + '">' +
                            '<img src="' + imageUrl + '" alt="">' +
                            '<input type="hidden" name="lupusursus_gallery_images[]" value="' + fullUrl + '">' +
                            '<span class="lupusursus-gallery-index">[' + (index + 1) + ']</span>' +
                            '<button type="button" class="lupusursus-gallery-remove">&times;</button>' +
                            '</div>';
                        container.append(html);
                    });

                    updateGalleryIndices();
                });

                galleryFrame.open();
            });

            $(document).on('click', '.lupusursus-gallery-remove', function() {
                $(this).closest('.lupusursus-gallery-item').remove();
                updateGalleryIndices();
            });

            function updateGalleryIndices() {
                $('#lupusursus-gallery-container .lupusursus-gallery-item').each(function(index) {
                    $(this).attr('data-index', index);
                    $(this).find('.lupusursus-gallery-index').text('[' + (index + 1) + ']');
                });
            }
        });
        </script>
        <?php
    }

    /**
     * Render progress meta box
     */
    public static function render_progress_meta_box($post) {
        $goal = (float) get_post_meta($post->ID, '_lupusursus_goal_amount', true) ?: 0;
        $collected = (float) get_post_meta($post->ID, '_lupusursus_collected_amount', true) ?: 0;
        $percentage = $goal > 0 ? min(100, round(($collected / $goal) * 100)) : 0;
        $donations_count = self::get_donations_count($post->ID);
        ?>
        <div class="shelter-progress-box">
            <div class="progress-stats">
                <div class="stat">
                    <span class="stat-value"><?php echo number_format($collected, 2, ',', ' '); ?> zł</span>
                    <span class="stat-label"><?php _e('zebrano', 'lupusursus-donations'); ?></span>
                </div>
                <div class="stat">
                    <span class="stat-value"><?php echo number_format($goal, 2, ',', ' '); ?> zł</span>
                    <span class="stat-label"><?php _e('cel', 'lupusursus-donations'); ?></span>
                </div>
                <div class="stat">
                    <span class="stat-value"><?php echo $donations_count; ?></span>
                    <span class="stat-label"><?php _e('wpłat', 'lupusursus-donations'); ?></span>
                </div>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: <?php echo $percentage; ?>%;"></div>
            </div>
            <div class="progress-percentage"><?php echo $percentage; ?>%</div>
        </div>
        <style>
            .lupusursus-progress-box { padding: 10px 0; }
            .progress-stats { display: flex; justify-content: space-between; margin-bottom: 15px; }
            .stat { text-align: center; }
            .stat-value { display: block; font-size: 18px; font-weight: bold; color: #1d2327; }
            .stat-label { font-size: 11px; color: #646970; }
            .progress-bar-container { background: #e0e0e0; height: 20px; border-radius: 10px; overflow: hidden; }
            .progress-bar { background: linear-gradient(90deg, #4CAF50, #8BC34A); height: 100%; transition: width 0.3s; }
            .progress-percentage { text-align: center; margin-top: 5px; font-weight: bold; }
        </style>
        <?php
    }

    /**
     * Render shortcode meta box
     */
    public static function render_shortcode_meta_box($post) {
        if ($post->post_status !== 'publish') {
            echo '<p>' . __('Opublikuj zbiórkę aby uzyskać shortcode.', 'lupusursus-donations') . '</p>';
            return;
        }
        ?>
        <p><strong><?php _e('Pełna zbiórka:', 'lupusursus-donations'); ?></strong></p>
        <code style="display:block;padding:8px;background:#f0f0f0;margin-bottom:10px;">[lupusursus_campaign id="<?php echo $post->ID; ?>"]</code>

        <p><strong><?php _e('Tylko pasek postępu:', 'lupusursus-donations'); ?></strong></p>
        <code style="display:block;padding:8px;background:#f0f0f0;margin-bottom:10px;">[lupusursus_progress id="<?php echo $post->ID; ?>"]</code>

        <p><strong><?php _e('Tylko przycisk:', 'lupusursus-donations'); ?></strong></p>
        <code style="display:block;padding:8px;background:#f0f0f0;">[lupusursus_donate_button id="<?php echo $post->ID; ?>"]</code>
        <?php
    }

    /**
     * Save meta boxes
     */
    public static function save_meta_boxes($post_id, $post) {
        // Verify nonce
        if (!isset($_POST['lupusursus_campaign_nonce']) ||
            !wp_verify_nonce($_POST['lupusursus_campaign_nonce'], 'lupusursus_campaign_details')) {
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

        // Save meta fields
        $fields = [
            'lupusursus_goal_amount' => '_lupusursus_goal_amount',
            'lupusursus_collected_amount' => '_lupusursus_collected_amount',
            'lupusursus_end_date' => '_lupusursus_end_date',
            'lupusursus_beneficiary' => '_lupusursus_beneficiary',
            'lupusursus_progress_style' => '_lupusursus_progress_style',
            'lupusursus_progress_color' => '_lupusursus_progress_color',
        ];

        foreach ($fields as $input => $meta_key) {
            if (isset($_POST[$input])) {
                update_post_meta($post_id, $meta_key, sanitize_text_field($_POST[$input]));
            }
        }

        // Checkboxes
        update_post_meta($post_id, '_lupusursus_is_active', isset($_POST['lupusursus_is_active']) ? '1' : '0');
        update_post_meta($post_id, '_lupusursus_show_donors', isset($_POST['lupusursus_show_donors']) ? '1' : '0');

        // Gallery images
        if (isset($_POST['lupusursus_gallery_images'])) {
            $gallery_images = array_map('esc_url_raw', $_POST['lupusursus_gallery_images']);
            $gallery_images = array_filter($gallery_images); // Remove empty values
            update_post_meta($post_id, '_lupusursus_gallery_images', $gallery_images);
        } else {
            update_post_meta($post_id, '_lupusursus_gallery_images', []);
        }
    }

    /**
     * Add custom columns
     */
    public static function add_columns($columns) {
        $new_columns = [];
        foreach ($columns as $key => $value) {
            $new_columns[$key] = $value;
            if ($key === 'title') {
                $new_columns['campaign_progress'] = __('Postęp', 'lupusursus-donations');
                $new_columns['campaign_goal'] = __('Cel', 'lupusursus-donations');
                $new_columns['campaign_status'] = __('Status', 'lupusursus-donations');
            }
        }
        return $new_columns;
    }

    /**
     * Render custom columns
     */
    public static function render_columns($column, $post_id) {
        switch ($column) {
            case 'campaign_progress':
                $goal = (float) get_post_meta($post_id, '_lupusursus_goal_amount', true) ?: 0;
                $collected = (float) get_post_meta($post_id, '_lupusursus_collected_amount', true) ?: 0;
                $percentage = $goal > 0 ? min(100, round(($collected / $goal) * 100)) : 0;
                echo '<div style="background:#e0e0e0;height:20px;border-radius:3px;overflow:hidden;min-width:100px;">';
                echo '<div style="background:#4CAF50;height:100%;width:' . $percentage . '%;"></div>';
                echo '</div>';
                echo '<small>' . number_format($collected, 0, ',', ' ') . ' / ' . number_format($goal, 0, ',', ' ') . ' zł (' . $percentage . '%)</small>';
                break;

            case 'campaign_goal':
                $goal = get_post_meta($post_id, '_lupusursus_goal_amount', true);
                echo $goal ? number_format($goal, 0, ',', ' ') . ' zł' : '-';
                break;

            case 'campaign_status':
                $is_active = get_post_meta($post_id, '_lupusursus_is_active', true) !== '0';
                if ($is_active) {
                    echo '<span style="color:#46b450;">● ' . __('Aktywna', 'lupusursus-donations') . '</span>';
                } else {
                    echo '<span style="color:#dc3232;">● ' . __('Nieaktywna', 'lupusursus-donations') . '</span>';
                }
                break;
        }
    }

    /**
     * Get donations count for campaign
     */
    public static function get_donations_count($campaign_id) {
        $donations = get_posts([
            'post_type' => 'lupusursus_donation',
            'post_status' => 'publish',
            'meta_query' => [
                [
                    'key' => '_lupusursus_campaign_id',
                    'value' => $campaign_id,
                ]
            ],
            'posts_per_page' => -1,
            'fields' => 'ids',
        ]);
        return count($donations);
    }

    /**
     * Get campaign data
     */
    public static function get_campaign_data($campaign_id) {
        $post = get_post($campaign_id);
        if (!$post || $post->post_type !== self::POST_TYPE) {
            return null;
        }

        $goal = (float) get_post_meta($campaign_id, '_lupusursus_goal_amount', true) ?: 0;
        $collected = (float) get_post_meta($campaign_id, '_lupusursus_collected_amount', true) ?: 0;
        $archived_at = get_post_meta($campaign_id, '_lupusursus_archived_at', true);

        $gallery_images = get_post_meta($campaign_id, '_lupusursus_gallery_images', true) ?: [];
        if (!is_array($gallery_images)) {
            $gallery_images = [];
        }

        return [
            'id' => $campaign_id,
            'title' => $post->post_title,
            'description' => $post->post_content,
            'excerpt' => $post->post_excerpt,
            'image' => get_the_post_thumbnail_url($campaign_id, 'large'),
            'images' => $gallery_images,
            'goal' => $goal,
            'collected' => $collected,
            'percentage' => $goal > 0 ? min(100, round(($collected / $goal) * 100)) : 0,
            'end_date' => get_post_meta($campaign_id, '_lupusursus_end_date', true),
            'beneficiary' => get_post_meta($campaign_id, '_lupusursus_beneficiary', true),
            'is_active' => get_post_meta($campaign_id, '_lupusursus_is_active', true) !== '0',
            'is_archived' => !empty($archived_at),
            'archived_at' => $archived_at ?: null,
            'show_donors' => get_post_meta($campaign_id, '_lupusursus_show_donors', true) !== '0',
            'progress_style' => get_post_meta($campaign_id, '_lupusursus_progress_style', true) ?: 'default',
            'progress_color' => get_post_meta($campaign_id, '_lupusursus_progress_color', true) ?: '#4CAF50',
            'donations_count' => self::get_donations_count($campaign_id),
            'url' => get_permalink($campaign_id),
        ];
    }

    /**
     * Update collected amount
     */
    public static function update_collected_amount($campaign_id, $amount_to_add) {
        $current = (float) get_post_meta($campaign_id, '_lupusursus_collected_amount', true) ?: 0;
        $new_amount = $current + $amount_to_add;
        update_post_meta($campaign_id, '_lupusursus_collected_amount', $new_amount);
        return $new_amount;
    }

    /**
     * Archive a campaign (soft delete)
     */
    public static function archive_campaign($campaign_id) {
        $post = get_post($campaign_id);
        if (!$post || $post->post_type !== self::POST_TYPE) {
            return false;
        }

        update_post_meta($campaign_id, '_lupusursus_archived_at', current_time('mysql'));
        update_post_meta($campaign_id, '_lupusursus_is_active', '0');

        return true;
    }

    /**
     * Restore a campaign from archive
     */
    public static function restore_campaign($campaign_id) {
        $post = get_post($campaign_id);
        if (!$post || $post->post_type !== self::POST_TYPE) {
            return false;
        }

        delete_post_meta($campaign_id, '_lupusursus_archived_at');
        update_post_meta($campaign_id, '_lupusursus_is_active', '1');

        return true;
    }

    /**
     * Check if campaign is archived
     */
    public static function is_archived($campaign_id) {
        return (bool) get_post_meta($campaign_id, '_lupusursus_archived_at', true);
    }

    /**
     * Get archived campaigns
     */
    public static function get_archived_campaigns($args = []) {
        $defaults = [
            'post_type' => self::POST_TYPE,
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'meta_query' => [
                [
                    'key' => '_lupusursus_archived_at',
                    'compare' => 'EXISTS',
                ]
            ],
        ];

        return get_posts(array_merge($defaults, $args));
    }

    /**
     * Get active (non-archived) campaigns
     */
    public static function get_active_campaigns($args = []) {
        $defaults = [
            'post_type' => self::POST_TYPE,
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'meta_query' => [
                'relation' => 'AND',
                [
                    'key' => '_lupusursus_archived_at',
                    'compare' => 'NOT EXISTS',
                ],
                [
                    'key' => '_lupusursus_is_active',
                    'value' => '1',
                ]
            ],
        ];

        return get_posts(array_merge($defaults, $args));
    }
}
