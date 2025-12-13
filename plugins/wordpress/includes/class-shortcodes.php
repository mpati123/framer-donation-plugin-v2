<?php
/**
 * Shortcodes
 *
 * @package LupusUrsus_Donations
 */

if (!defined('ABSPATH')) {
    exit;
}

class LupusUrsus_Donations_Shortcodes {

    /**
     * Parse description with image placeholders like [1], [2], etc.
     *
     * @param string $description The description text
     * @param array $images Array of image URLs
     * @return string HTML with images inserted
     */
    private function parse_description_with_images($description, $images) {
        if (empty($description) || empty($images)) {
            return wp_kses_post($description);
        }

        // Replace [1], [2], etc. with actual images
        $result = preg_replace_callback('/\[(\d+)\]/', function($matches) use ($images) {
            $index = (int) $matches[1] - 1; // [1] = index 0
            if (isset($images[$index])) {
                return sprintf(
                    '<img src="%s" alt="%s" class="shelter-inline-image" loading="lazy">',
                    esc_url($images[$index]),
                    esc_attr(sprintf(__('Zdjęcie %d', 'lupusursus-donations'), $index + 1))
                );
            }
            return $matches[0]; // Keep placeholder if image doesn't exist
        }, $description);

        return wp_kses_post($result);
    }

    /**
     * Get images not used in description (for gallery)
     *
     * @param string $description The description text
     * @param array $images Array of image URLs
     * @return array Unused images
     */
    private function get_unused_images($description, $images) {
        if (empty($images)) {
            return [];
        }
        if (empty($description)) {
            return $images;
        }

        $used_indices = [];
        preg_match_all('/\[(\d+)\]/', $description, $matches);

        if (!empty($matches[1])) {
            foreach ($matches[1] as $index) {
                $idx = (int) $index - 1;
                if (isset($images[$idx])) {
                    $used_indices[] = $idx;
                }
            }
        }

        $unused = [];
        foreach ($images as $index => $image) {
            if (!in_array($index, $used_indices)) {
                $unused[] = $image;
            }
        }

        return $unused;
    }

    /**
     * Render gallery HTML
     *
     * @param array $images Array of image URLs
     * @return string HTML gallery
     */
    private function render_gallery($images) {
        if (empty($images)) {
            return '';
        }

        ob_start();
        ?>
        <div class="shelter-gallery">
            <h4 class="shelter-gallery-title"><?php _e('Galeria', 'lupusursus-donations'); ?></h4>
            <div class="shelter-gallery-images">
                <?php foreach ($images as $index => $image_url) : ?>
                    <a href="<?php echo esc_url($image_url); ?>" class="shelter-gallery-item" target="_blank" rel="noopener">
                        <img src="<?php echo esc_url($image_url); ?>" alt="<?php echo esc_attr(sprintf(__('Zdjęcie %d', 'lupusursus-donations'), $index + 1)); ?>" loading="lazy">
                    </a>
                <?php endforeach; ?>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * Register shortcodes
     */
    public function register() {
        add_shortcode('lupusursus_campaign', [$this, 'campaign_shortcode']);
        add_shortcode('lupusursus_progress', [$this, 'progress_shortcode']);
        add_shortcode('lupusursus_donate_button', [$this, 'donate_button_shortcode']);
        add_shortcode('lupusursus_donation_form', [$this, 'donation_form_shortcode']);
        add_shortcode('lupusursus_campaigns_list', [$this, 'campaigns_list_shortcode']);
        add_shortcode('lupusursus_donors_list', [$this, 'donors_list_shortcode']);
    }

    /**
     * Full campaign display
     * [lupusursus_campaign id="123" show_form="yes" show_donors="yes"]
     */
    public function campaign_shortcode($atts) {
        $atts = shortcode_atts([
            'id' => 0,
            'show_form' => 'yes',
            'show_donors' => 'default',
            'show_description' => 'yes',
            'show_image' => 'yes',
        ], $atts, 'lupusursus_campaign');

        $campaign_id = absint($atts['id']);
        if (!$campaign_id) {
            return '<p class="shelter-error">' . __('Nie podano ID zbiórki.', 'lupusursus-donations') . '</p>';
        }

        $campaign = LupusUrsus_Donations_Campaign_Post_Type::get_campaign_data($campaign_id);
        if (!$campaign) {
            return '<p class="shelter-error">' . __('Nie znaleziono zbiórki.', 'lupusursus-donations') . '</p>';
        }

        // Determine if we should show donors
        $show_donors = $atts['show_donors'] === 'default' ? $campaign['show_donors'] : ($atts['show_donors'] === 'yes');

        ob_start();
        ?>
        <div class="shelter-campaign" data-campaign-id="<?php echo esc_attr($campaign_id); ?>">
            <?php if ($atts['show_image'] === 'yes' && $campaign['image']) : ?>
                <div class="shelter-campaign-image">
                    <img src="<?php echo esc_url($campaign['image']); ?>" alt="<?php echo esc_attr($campaign['title']); ?>">
                </div>
            <?php endif; ?>

            <div class="shelter-campaign-content">
                <h2 class="shelter-campaign-title"><?php echo esc_html($campaign['title']); ?></h2>

                <?php if ($campaign['beneficiary']) : ?>
                    <p class="shelter-campaign-beneficiary">
                        <?php echo esc_html(sprintf(__('Dla: %s', 'lupusursus-donations'), $campaign['beneficiary'])); ?>
                    </p>
                <?php endif; ?>

                <?php echo $this->render_progress_bar($campaign); ?>

                <?php if ($atts['show_description'] === 'yes' && $campaign['description']) : ?>
                    <div class="shelter-campaign-description">
                        <?php echo $this->parse_description_with_images($campaign['description'], $campaign['images']); ?>
                    </div>

                    <?php
                    // Show gallery with unused images
                    $unused_images = $this->get_unused_images($campaign['description'], $campaign['images']);
                    echo $this->render_gallery($unused_images);
                    ?>
                <?php endif; ?>

                <?php if ($campaign['end_date']) : ?>
                    <p class="shelter-campaign-end-date">
                        <?php
                        $end_date = new DateTime($campaign['end_date']);
                        $now = new DateTime();
                        $diff = $now->diff($end_date);

                        if ($end_date < $now) {
                            echo '<span class="ended">' . __('Zbiórka zakończona', 'lupusursus-donations') . '</span>';
                        } else {
                            echo sprintf(
                                __('Pozostało: %d dni', 'lupusursus-donations'),
                                $diff->days
                            );
                        }
                        ?>
                    </p>
                <?php endif; ?>

                <?php if ($atts['show_form'] === 'yes' && $campaign['is_active']) : ?>
                    <?php echo $this->render_donation_form($campaign); ?>
                <?php elseif (!$campaign['is_active']) : ?>
                    <p class="shelter-campaign-inactive">
                        <?php _e('Ta zbiórka nie przyjmuje już wpłat.', 'lupusursus-donations'); ?>
                    </p>
                <?php endif; ?>

                <?php if ($show_donors) : ?>
                    <?php echo $this->render_donors_list($campaign_id); ?>
                <?php endif; ?>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * Progress bar only
     * [lupusursus_progress id="123" style="animated" color="#ff5722"]
     */
    public function progress_shortcode($atts) {
        $atts = shortcode_atts([
            'id' => 0,
            'style' => 'default',
            'color' => '',
            'show_amounts' => 'yes',
            'show_percentage' => 'yes',
            'show_donors_count' => 'yes',
        ], $atts, 'lupusursus_progress');

        $campaign_id = absint($atts['id']);
        if (!$campaign_id) {
            return '';
        }

        $campaign = LupusUrsus_Donations_Campaign_Post_Type::get_campaign_data($campaign_id);
        if (!$campaign) {
            return '';
        }

        // Override style/color from shortcode if provided
        if (!empty($atts['style'])) {
            $campaign['progress_style'] = $atts['style'];
        }
        if (!empty($atts['color'])) {
            $campaign['progress_color'] = $atts['color'];
        }

        return $this->render_progress_bar($campaign, [
            'show_amounts' => $atts['show_amounts'] === 'yes',
            'show_percentage' => $atts['show_percentage'] === 'yes',
            'show_donors_count' => $atts['show_donors_count'] === 'yes',
        ]);
    }

    /**
     * Donate button only
     * [lupusursus_donate_button id="123" text="Wesprzyj" amount="50"]
     */
    public function donate_button_shortcode($atts) {
        $atts = shortcode_atts([
            'id' => 0,
            'text' => __('Wesprzyj', 'lupusursus-donations'),
            'amount' => '',
            'class' => '',
            'style' => 'primary',
        ], $atts, 'lupusursus_donate_button');

        $campaign_id = absint($atts['id']);
        if (!$campaign_id) {
            return '';
        }

        $campaign = LupusUrsus_Donations_Campaign_Post_Type::get_campaign_data($campaign_id);
        if (!$campaign || !$campaign['is_active']) {
            return '';
        }

        $button_class = 'shelter-donate-btn shelter-donate-btn--' . esc_attr($atts['style']);
        if (!empty($atts['class'])) {
            $button_class .= ' ' . esc_attr($atts['class']);
        }

        $data_attrs = 'data-campaign-id="' . esc_attr($campaign_id) . '"';
        if (!empty($atts['amount'])) {
            $data_attrs .= ' data-amount="' . esc_attr($atts['amount']) . '"';
        }

        return sprintf(
            '<button type="button" class="%s" %s>%s</button>',
            $button_class,
            $data_attrs,
            esc_html($atts['text'])
        );
    }

    /**
     * Donation form only
     * [lupusursus_donation_form id="123"]
     */
    public function donation_form_shortcode($atts) {
        $atts = shortcode_atts([
            'id' => 0,
            'amounts' => '20,50,100,200',
            'show_custom' => 'yes',
            'show_message' => 'yes',
            'show_anonymous' => 'yes',
        ], $atts, 'lupusursus_donation_form');

        $campaign_id = absint($atts['id']);
        if (!$campaign_id) {
            return '';
        }

        $campaign = LupusUrsus_Donations_Campaign_Post_Type::get_campaign_data($campaign_id);
        if (!$campaign || !$campaign['is_active']) {
            return '';
        }

        return $this->render_donation_form($campaign, [
            'amounts' => array_map('absint', explode(',', $atts['amounts'])),
            'show_custom' => $atts['show_custom'] === 'yes',
            'show_message' => $atts['show_message'] === 'yes',
            'show_anonymous' => $atts['show_anonymous'] === 'yes',
        ]);
    }

    /**
     * Campaigns list
     * [lupusursus_campaigns_list count="6" columns="3" status="active" show_modal="yes"]
     */
    public function campaigns_list_shortcode($atts) {
        $atts = shortcode_atts([
            'count' => 6,
            'columns' => 3,
            'status' => 'active',
            'orderby' => 'date',
            'order' => 'DESC',
            'show_modal' => 'yes',
        ], $atts, 'lupusursus_campaigns_list');

        $meta_query = [];
        if ($atts['status'] === 'active') {
            $meta_query[] = [
                'key' => '_lupusursus_is_active',
                'value' => '1',
            ];
        } elseif ($atts['status'] === 'inactive') {
            $meta_query[] = [
                'key' => '_lupusursus_is_active',
                'value' => '0',
            ];
        }

        $campaigns = get_posts([
            'post_type' => 'lupusursus_campaign',
            'post_status' => 'publish',
            'posts_per_page' => absint($atts['count']),
            'orderby' => $atts['orderby'],
            'order' => $atts['order'],
            'meta_query' => $meta_query,
        ]);

        if (empty($campaigns)) {
            return '<p class="shelter-no-campaigns">' . __('Brak zbiórek do wyświetlenia.', 'lupusursus-donations') . '</p>';
        }

        $show_modal = $atts['show_modal'] === 'yes';

        ob_start();
        ?>
        <div class="shelter-campaigns-grid shelter-campaigns-grid--<?php echo esc_attr($atts['columns']); ?>-cols">
            <?php foreach ($campaigns as $campaign_post) :
                $campaign = LupusUrsus_Donations_Campaign_Post_Type::get_campaign_data($campaign_post->ID);
                ?>
                <div class="shelter-campaign-card" <?php if ($show_modal) : ?>data-campaign-modal="<?php echo esc_attr($campaign['id']); ?>"<?php endif; ?>>
                    <?php if ($campaign['image']) : ?>
                        <div class="shelter-campaign-card-image">
                            <img src="<?php echo esc_url($campaign['image']); ?>" alt="<?php echo esc_attr($campaign['title']); ?>">
                        </div>
                    <?php endif; ?>
                    <div class="shelter-campaign-card-content">
                        <h3 class="shelter-campaign-card-title">
                            <?php echo esc_html($campaign['title']); ?>
                        </h3>
                        <?php if ($campaign['beneficiary']) : ?>
                            <p class="shelter-campaign-card-beneficiary"><?php echo esc_html(sprintf(__('Dla: %s', 'lupusursus-donations'), $campaign['beneficiary'])); ?></p>
                        <?php endif; ?>
                        <?php if ($campaign['excerpt']) : ?>
                            <p class="shelter-campaign-card-excerpt"><?php echo esc_html(wp_trim_words($campaign['excerpt'], 15)); ?></p>
                        <?php endif; ?>
                        <?php echo $this->render_progress_bar($campaign, ['compact' => true]); ?>
                        <button type="button" class="shelter-donate-btn shelter-donate-btn--small shelter-open-donate-modal" data-campaign-id="<?php echo esc_attr($campaign['id']); ?>">
                            <?php _e('Wesprzyj', 'lupusursus-donations'); ?>
                        </button>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

        <?php if ($show_modal) : ?>
            <!-- Campaign Detail Modal -->
            <div class="shelter-modal shelter-detail-modal" id="shelter-detail-modal" style="display:none;">
                <div class="shelter-modal-overlay"></div>
                <div class="shelter-modal-container">
                    <button type="button" class="shelter-modal-close">&times;</button>
                    <div class="shelter-modal-content">
                        <!-- Content loaded via JS -->
                    </div>
                </div>
            </div>

            <!-- Donate Modal -->
            <div class="shelter-modal shelter-donate-modal" id="shelter-donate-modal" style="display:none;">
                <div class="shelter-modal-overlay"></div>
                <div class="shelter-modal-container">
                    <button type="button" class="shelter-modal-close">&times;</button>
                    <div class="shelter-modal-content">
                        <!-- Content loaded via JS -->
                    </div>
                </div>
            </div>

            <script type="text/template" id="shelter-modal-template">
                <?php foreach ($campaigns as $campaign_post) :
                    $campaign = LupusUrsus_Donations_Campaign_Post_Type::get_campaign_data($campaign_post->ID);
                    ?>
                    <div class="shelter-modal-data" data-campaign-id="<?php echo esc_attr($campaign['id']); ?>" style="display:none;">
                        <div class="shelter-modal-campaign">
                            <?php if ($campaign['image']) : ?>
                                <div class="shelter-modal-image">
                                    <img src="<?php echo esc_url($campaign['image']); ?>" alt="<?php echo esc_attr($campaign['title']); ?>">
                                </div>
                            <?php endif; ?>
                            <div class="shelter-modal-body">
                                <h2 class="shelter-modal-title"><?php echo esc_html($campaign['title']); ?></h2>
                                <?php if ($campaign['beneficiary']) : ?>
                                    <p class="shelter-modal-beneficiary"><?php echo esc_html(sprintf(__('Dla: %s', 'lupusursus-donations'), $campaign['beneficiary'])); ?></p>
                                <?php endif; ?>

                                <?php echo $this->render_progress_bar($campaign); ?>

                                <button type="button" class="shelter-donate-btn shelter-donate-btn--primary shelter-donate-btn--full shelter-open-donate-modal" data-campaign-id="<?php echo esc_attr($campaign['id']); ?>">
                                    ❤️ <?php _e('Wesprzyj zbiórkę', 'lupusursus-donations'); ?>
                                </button>

                                <?php if ($campaign['description']) : ?>
                                    <div class="shelter-modal-description">
                                        <h4><?php _e('O zbiórce', 'lupusursus-donations'); ?></h4>
                                        <?php echo $this->parse_description_with_images($campaign['description'], $campaign['images']); ?>
                                    </div>

                                    <?php
                                    $unused_images = $this->get_unused_images($campaign['description'], $campaign['images']);
                                    echo $this->render_gallery($unused_images);
                                    ?>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                    <div class="shelter-donate-form-data" data-campaign-id="<?php echo esc_attr($campaign['id']); ?>" style="display:none;">
                        <h3><?php echo esc_html($campaign['title']); ?></h3>
                        <?php if ($campaign['beneficiary']) : ?>
                            <p class="shelter-modal-beneficiary"><?php echo esc_html(sprintf(__('Dla: %s', 'lupusursus-donations'), $campaign['beneficiary'])); ?></p>
                        <?php endif; ?>
                        <?php echo $this->render_progress_bar($campaign); ?>
                        <?php echo $this->render_donation_form($campaign); ?>
                    </div>
                <?php endforeach; ?>
            </script>
        <?php endif; ?>
        <?php
        return ob_get_clean();
    }

    /**
     * Donors list
     * [lupusursus_donors_list id="123" count="10"]
     */
    public function donors_list_shortcode($atts) {
        $atts = shortcode_atts([
            'id' => 0,
            'count' => 10,
        ], $atts, 'lupusursus_donors_list');

        $campaign_id = absint($atts['id']);
        if (!$campaign_id) {
            return '';
        }

        return $this->render_donors_list($campaign_id, absint($atts['count']));
    }

    /**
     * Render progress bar HTML
     */
    private function render_progress_bar($campaign, $options = []) {
        $defaults = [
            'show_amounts' => true,
            'show_percentage' => true,
            'show_donors_count' => true,
            'compact' => false,
        ];
        $options = wp_parse_args($options, $defaults);

        $style = esc_attr($campaign['progress_style']);
        $color = esc_attr($campaign['progress_color']);
        $percentage = $campaign['percentage'];

        ob_start();
        ?>
        <div class="shelter-progress shelter-progress--<?php echo $style; ?>" data-campaign-id="<?php echo esc_attr($campaign['id']); ?>">
            <?php if ($options['show_amounts'] && !$options['compact']) : ?>
                <div class="shelter-progress-amounts">
                    <span class="shelter-progress-collected">
                        <?php echo number_format($campaign['collected'], 0, ',', ' '); ?> zł
                    </span>
                    <span class="shelter-progress-goal">
                        <?php echo sprintf(__('z %s zł', 'lupusursus-donations'), number_format($campaign['goal'], 0, ',', ' ')); ?>
                    </span>
                </div>
            <?php endif; ?>

            <div class="shelter-progress-bar-container">
                <div class="shelter-progress-bar"
                     style="width: <?php echo $percentage; ?>%; background-color: <?php echo $color; ?>;"
                     data-percentage="<?php echo $percentage; ?>">
                </div>
            </div>

            <div class="shelter-progress-meta">
                <?php if ($options['show_percentage']) : ?>
                    <span class="shelter-progress-percentage"><?php echo $percentage; ?>%</span>
                <?php endif; ?>

                <?php if ($options['show_donors_count'] && !$options['compact']) : ?>
                    <span class="shelter-progress-donors">
                        <?php echo sprintf(
                            _n('%d darczyńca', '%d darczyńców', $campaign['donations_count'], 'lupusursus-donations'),
                            $campaign['donations_count']
                        ); ?>
                    </span>
                <?php endif; ?>
            </div>

            <?php if ($options['compact'] && $options['show_amounts']) : ?>
                <div class="shelter-progress-amounts shelter-progress-amounts--compact">
                    <span><?php echo number_format($campaign['collected'], 0, ',', ' '); ?> / <?php echo number_format($campaign['goal'], 0, ',', ' '); ?> zł</span>
                </div>
            <?php endif; ?>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * Render donation form HTML
     */
    private function render_donation_form($campaign, $options = []) {
        $defaults = [
            'amounts' => [20, 50, 100, 200],
            'show_custom' => true,
            'show_message' => true,
            'show_anonymous' => true,
        ];
        $options = wp_parse_args($options, $defaults);

        $min_amount = (float) get_option('lupusursus_donations_min_amount', 5);
        $currency_symbol = get_option('lupusursus_donations_currency_symbol', 'zł');

        ob_start();
        ?>
        <div class="shelter-donation-form" data-campaign-id="<?php echo esc_attr($campaign['id']); ?>">
            <form class="shelter-form" id="shelter-form-<?php echo esc_attr($campaign['id']); ?>">
                <input type="hidden" name="campaign_id" value="<?php echo esc_attr($campaign['id']); ?>">

                <div class="shelter-form-section">
                    <label class="shelter-form-label"><?php _e('Wybierz kwotę:', 'lupusursus-donations'); ?></label>
                    <div class="shelter-amount-buttons">
                        <?php foreach ($options['amounts'] as $amount) : ?>
                            <button type="button" class="shelter-amount-btn" data-amount="<?php echo esc_attr($amount); ?>">
                                <?php echo $amount; ?> <?php echo esc_html($currency_symbol); ?>
                            </button>
                        <?php endforeach; ?>
                    </div>

                    <?php if ($options['show_custom']) : ?>
                        <div class="shelter-custom-amount-wrapper">
                            <label for="shelter-custom-amount-<?php echo esc_attr($campaign['id']); ?>">
                                <?php _e('Lub wpisz własną kwotę:', 'lupusursus-donations'); ?>
                            </label>
                            <div class="shelter-input-group">
                                <input type="number"
                                       id="shelter-custom-amount-<?php echo esc_attr($campaign['id']); ?>"
                                       name="amount"
                                       class="shelter-custom-amount"
                                       min="<?php echo esc_attr($min_amount); ?>"
                                       step="1"
                                       placeholder="<?php echo esc_attr($min_amount); ?>">
                                <span class="shelter-input-suffix"><?php echo esc_html($currency_symbol); ?></span>
                            </div>
                        </div>
                    <?php endif; ?>
                </div>

                <div class="shelter-form-section">
                    <label class="shelter-form-label" for="shelter-donor-name-<?php echo esc_attr($campaign['id']); ?>">
                        <?php _e('Twoje imię (opcjonalnie):', 'lupusursus-donations'); ?>
                    </label>
                    <input type="text"
                           id="shelter-donor-name-<?php echo esc_attr($campaign['id']); ?>"
                           name="donor_name"
                           class="shelter-input"
                           placeholder="<?php esc_attr_e('Jan Kowalski', 'lupusursus-donations'); ?>">
                </div>

                <div class="shelter-form-section">
                    <label class="shelter-form-label" for="shelter-donor-email-<?php echo esc_attr($campaign['id']); ?>">
                        <?php _e('Twój email (opcjonalnie):', 'lupusursus-donations'); ?>
                    </label>
                    <input type="email"
                           id="shelter-donor-email-<?php echo esc_attr($campaign['id']); ?>"
                           name="donor_email"
                           class="shelter-input"
                           placeholder="<?php esc_attr_e('jan@example.com', 'lupusursus-donations'); ?>">
                </div>

                <?php if ($options['show_message']) : ?>
                    <div class="shelter-form-section">
                        <label class="shelter-form-label" for="shelter-message-<?php echo esc_attr($campaign['id']); ?>">
                            <?php _e('Wiadomość (opcjonalnie):', 'lupusursus-donations'); ?>
                        </label>
                        <textarea id="shelter-message-<?php echo esc_attr($campaign['id']); ?>"
                                  name="message"
                                  class="shelter-textarea"
                                  rows="3"
                                  placeholder="<?php esc_attr_e('Twoja wiadomość do organizatorów...', 'lupusursus-donations'); ?>"></textarea>
                    </div>
                <?php endif; ?>

                <?php if ($options['show_anonymous']) : ?>
                    <div class="shelter-form-section">
                        <label class="shelter-checkbox">
                            <input type="checkbox" name="is_anonymous" value="1">
                            <span><?php _e('Chcę pozostać anonimowy/a', 'lupusursus-donations'); ?></span>
                        </label>
                    </div>
                <?php endif; ?>

                <div class="shelter-form-section">
                    <button type="submit" class="shelter-donate-btn shelter-donate-btn--primary shelter-donate-btn--full">
                        <span class="shelter-btn-text"><?php _e('Przejdź do płatności', 'lupusursus-donations'); ?></span>
                        <span class="shelter-btn-loading" style="display:none;">
                            <span class="shelter-spinner"></span>
                            <?php _e('Przekierowuję...', 'lupusursus-donations'); ?>
                        </span>
                    </button>
                </div>

                <div class="shelter-form-footer">
                    <p class="shelter-secure-notice">
                        <span class="dashicons dashicons-lock"></span>
                        <?php _e('Bezpieczna płatność przez Stripe', 'lupusursus-donations'); ?>
                    </p>
                    <p class="shelter-payment-methods">
                        <?php _e('Akceptujemy: Visa, Mastercard, BLIK, Przelewy24', 'lupusursus-donations'); ?>
                    </p>
                </div>

                <div class="shelter-form-error" style="display:none;"></div>
            </form>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * Render donors list HTML
     */
    private function render_donors_list($campaign_id, $limit = 10) {
        $donations = LupusUrsus_Donations_Donation_Post_Type::get_campaign_donations($campaign_id, $limit);

        if (empty($donations)) {
            return '<p class="shelter-no-donors">' . __('Bądź pierwszym darczyńcą!', 'lupusursus-donations') . '</p>';
        }

        ob_start();
        ?>
        <div class="shelter-donors-list">
            <h4 class="shelter-donors-title"><?php _e('Ostatni darczyńcy', 'lupusursus-donations'); ?></h4>
            <ul class="shelter-donors">
                <?php foreach ($donations as $donation) : ?>
                    <li class="shelter-donor">
                        <span class="shelter-donor-avatar">
                            <?php echo substr($donation['donor_name'], 0, 1); ?>
                        </span>
                        <div class="shelter-donor-info">
                            <span class="shelter-donor-name"><?php echo esc_html($donation['donor_name']); ?></span>
                            <span class="shelter-donor-amount">
                                <?php echo number_format($donation['amount'], 0, ',', ' '); ?> zł
                            </span>
                        </div>
                        <span class="shelter-donor-date">
                            <?php echo human_time_diff(strtotime($donation['date']), current_time('timestamp')); ?> <?php _e('temu', 'lupusursus-donations'); ?>
                        </span>
                    </li>
                <?php endforeach; ?>
            </ul>
        </div>
        <?php
        return ob_get_clean();
    }
}
