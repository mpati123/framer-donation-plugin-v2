<?php
/**
 * Campaign Widget
 *
 * @package LupusUrsus_Donations
 */

if (!defined('ABSPATH')) {
    exit;
}

class LupusUrsus_Donations_Campaign_Widget extends WP_Widget {

    /**
     * Constructor
     */
    public function __construct() {
        parent::__construct(
            'lupusursus_campaign_widget',
            __('Zbiórka - LupusUrsus Donations', 'lupusursus-donations'),
            [
                'description' => __('Wyświetla pasek postępu zbiórki z przyciskiem wpłaty.', 'lupusursus-donations'),
                'classname' => 'shelter-campaign-widget',
            ]
        );
    }

    /**
     * Frontend display
     */
    public function widget($args, $instance) {
        $campaign_id = absint($instance['campaign_id'] ?? 0);

        if (!$campaign_id) {
            return;
        }

        $campaign = LupusUrsus_Donations_Campaign_Post_Type::get_campaign_data($campaign_id);

        if (!$campaign) {
            return;
        }

        $title = !empty($instance['title']) ? $instance['title'] : $campaign['title'];
        $show_image = !empty($instance['show_image']);
        $show_button = !empty($instance['show_button']);

        echo $args['before_widget'];

        if ($title) {
            echo $args['before_title'] . esc_html($title) . $args['after_title'];
        }
        ?>
        <div class="shelter-widget-content">
            <?php if ($show_image && $campaign['image']) : ?>
                <a href="<?php echo esc_url($campaign['url']); ?>" class="shelter-widget-image">
                    <img src="<?php echo esc_url($campaign['image']); ?>" alt="<?php echo esc_attr($campaign['title']); ?>">
                </a>
            <?php endif; ?>

            <div class="shelter-widget-progress">
                <div class="shelter-progress-bar-container">
                    <div class="shelter-progress-bar"
                         style="width: <?php echo $campaign['percentage']; ?>%; background-color: <?php echo esc_attr($campaign['progress_color']); ?>;">
                    </div>
                </div>
                <div class="shelter-widget-stats">
                    <span class="shelter-widget-collected">
                        <?php echo number_format($campaign['collected'], 0, ',', ' '); ?> zł
                    </span>
                    <span class="shelter-widget-percentage">
                        <?php echo $campaign['percentage']; ?>%
                    </span>
                </div>
                <div class="shelter-widget-goal">
                    <?php echo sprintf(
                        __('Cel: %s zł', 'lupusursus-donations'),
                        number_format($campaign['goal'], 0, ',', ' ')
                    ); ?>
                </div>
            </div>

            <?php if ($show_button && $campaign['is_active']) : ?>
                <a href="<?php echo esc_url($campaign['url']); ?>" class="shelter-donate-btn shelter-donate-btn--widget">
                    <?php _e('Wesprzyj', 'lupusursus-donations'); ?>
                </a>
            <?php endif; ?>
        </div>
        <?php
        echo $args['after_widget'];
    }

    /**
     * Backend form
     */
    public function form($instance) {
        $title = $instance['title'] ?? '';
        $campaign_id = absint($instance['campaign_id'] ?? 0);
        $show_image = !empty($instance['show_image']);
        $show_button = isset($instance['show_button']) ? $instance['show_button'] : true;

        // Get campaigns
        $campaigns = get_posts([
            'post_type' => 'lupusursus_campaign',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'orderby' => 'title',
            'order' => 'ASC',
        ]);
        ?>
        <p>
            <label for="<?php echo $this->get_field_id('title'); ?>">
                <?php _e('Tytuł (opcjonalnie):', 'lupusursus-donations'); ?>
            </label>
            <input class="widefat"
                   id="<?php echo $this->get_field_id('title'); ?>"
                   name="<?php echo $this->get_field_name('title'); ?>"
                   type="text"
                   value="<?php echo esc_attr($title); ?>">
            <small><?php _e('Zostaw puste aby użyć tytułu zbiórki.', 'lupusursus-donations'); ?></small>
        </p>

        <p>
            <label for="<?php echo $this->get_field_id('campaign_id'); ?>">
                <?php _e('Wybierz zbiórkę:', 'lupusursus-donations'); ?>
            </label>
            <select class="widefat"
                    id="<?php echo $this->get_field_id('campaign_id'); ?>"
                    name="<?php echo $this->get_field_name('campaign_id'); ?>">
                <option value=""><?php _e('-- Wybierz --', 'lupusursus-donations'); ?></option>
                <?php foreach ($campaigns as $campaign) : ?>
                    <option value="<?php echo $campaign->ID; ?>" <?php selected($campaign_id, $campaign->ID); ?>>
                        <?php echo esc_html($campaign->post_title); ?>
                    </option>
                <?php endforeach; ?>
            </select>
        </p>

        <p>
            <input type="checkbox"
                   class="checkbox"
                   id="<?php echo $this->get_field_id('show_image'); ?>"
                   name="<?php echo $this->get_field_name('show_image'); ?>"
                   <?php checked($show_image); ?>>
            <label for="<?php echo $this->get_field_id('show_image'); ?>">
                <?php _e('Pokaż zdjęcie', 'lupusursus-donations'); ?>
            </label>
        </p>

        <p>
            <input type="checkbox"
                   class="checkbox"
                   id="<?php echo $this->get_field_id('show_button'); ?>"
                   name="<?php echo $this->get_field_name('show_button'); ?>"
                   <?php checked($show_button); ?>>
            <label for="<?php echo $this->get_field_id('show_button'); ?>">
                <?php _e('Pokaż przycisk "Wesprzyj"', 'lupusursus-donations'); ?>
            </label>
        </p>
        <?php
    }

    /**
     * Save widget settings
     */
    public function update($new_instance, $old_instance) {
        $instance = [];
        $instance['title'] = sanitize_text_field($new_instance['title'] ?? '');
        $instance['campaign_id'] = absint($new_instance['campaign_id'] ?? 0);
        $instance['show_image'] = !empty($new_instance['show_image']);
        $instance['show_button'] = !empty($new_instance['show_button']);
        return $instance;
    }
}
