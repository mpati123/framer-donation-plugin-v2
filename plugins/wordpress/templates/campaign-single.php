<?php
/**
 * Template for single campaign display
 *
 * This template can be overridden by copying it to yourtheme/lupusursus-donations/campaign-single.php
 *
 * @package LupusUrsus_Donations
 * @version 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Variables available:
 * $campaign - array with campaign data (from get_campaign_data)
 * $show_form - boolean
 * $show_donors - boolean
 */
?>

<div class="shelter-campaign shelter-campaign-single" data-campaign-id="<?php echo esc_attr($campaign['id']); ?>">

    <?php if ($campaign['image']) : ?>
        <div class="shelter-campaign-image">
            <img src="<?php echo esc_url($campaign['image']); ?>" alt="<?php echo esc_attr($campaign['title']); ?>">
            <?php if (!$campaign['is_active']) : ?>
                <span class="shelter-campaign-badge shelter-campaign-badge--inactive">
                    <?php esc_html_e('Zakończona', 'lupusursus-donations'); ?>
                </span>
            <?php endif; ?>
        </div>
    <?php endif; ?>

    <div class="shelter-campaign-content">
        <h1 class="shelter-campaign-title"><?php echo esc_html($campaign['title']); ?></h1>

        <?php if ($campaign['beneficiary']) : ?>
            <p class="shelter-campaign-beneficiary">
                <?php echo sprintf(
                    esc_html__('Zbiórka dla: %s', 'lupusursus-donations'),
                    '<strong>' . esc_html($campaign['beneficiary']) . '</strong>'
                ); ?>
            </p>
        <?php endif; ?>

        <div class="shelter-progress" data-campaign-id="<?php echo esc_attr($campaign['id']); ?>">
            <div class="shelter-progress-bar-container">
                <div class="shelter-progress-bar <?php echo esc_attr($campaign['progress_style'] ? 'shelter-progress-bar--' . $campaign['progress_style'] : ''); ?>"
                     style="width: <?php echo esc_attr($campaign['percentage']); ?>%; background-color: <?php echo esc_attr($campaign['progress_color']); ?>;">
                </div>
            </div>
            <div class="shelter-progress-stats">
                <span class="shelter-progress-collected">
                    <?php echo number_format($campaign['collected'], 0, ',', ' '); ?> zł
                </span>
                <span class="shelter-progress-percentage">
                    <?php echo esc_html($campaign['percentage']); ?>%
                </span>
            </div>
            <div class="shelter-progress-goal">
                <?php echo sprintf(
                    esc_html__('Cel: %s zł', 'lupusursus-donations'),
                    number_format($campaign['goal'], 0, ',', ' ')
                ); ?>
                <?php if ($campaign['donations_count'] > 0) : ?>
                    <span class="shelter-progress-donors">
                        &bull; <?php echo sprintf(
                            _n('%d wpłata', '%d wpłat', $campaign['donations_count'], 'lupusursus-donations'),
                            $campaign['donations_count']
                        ); ?>
                    </span>
                <?php endif; ?>
            </div>
        </div>

        <?php if ($campaign['content']) : ?>
            <div class="shelter-campaign-description">
                <?php echo wp_kses_post($campaign['content']); ?>
            </div>
        <?php endif; ?>

        <?php if ($show_form && $campaign['is_active']) : ?>
            <?php include LUPUSURSUS_DONATIONS_PLUGIN_DIR . 'templates/donation-form.php'; ?>
        <?php elseif (!$campaign['is_active']) : ?>
            <div class="shelter-message shelter-message--info">
                <p><?php esc_html_e('Ta zbiórka została zakończona. Dziękujemy wszystkim darczyńcom za wsparcie!', 'lupusursus-donations'); ?></p>
            </div>
        <?php endif; ?>

        <?php if ($show_donors && $campaign['donations_count'] > 0) : ?>
            <?php
            $donations = LupusUrsus_Donations_Donation_Post_Type::get_campaign_donations($campaign['id'], 10);
            if (!empty($donations)) :
            ?>
                <div class="shelter-donors-list">
                    <h4><?php esc_html_e('Ostatni darczyńcy', 'lupusursus-donations'); ?></h4>
                    <?php foreach ($donations as $donation) : ?>
                        <div class="shelter-donor-item">
                            <div class="shelter-donor-info">
                                <div class="shelter-donor-name">
                                    <?php echo esc_html($donation['display_name']); ?>
                                </div>
                                <div class="shelter-donor-date">
                                    <?php echo esc_html($donation['date']); ?>
                                </div>
                                <?php if (!empty($donation['message'])) : ?>
                                    <div class="shelter-donor-message">
                                        "<?php echo esc_html($donation['message']); ?>"
                                    </div>
                                <?php endif; ?>
                            </div>
                            <div class="shelter-donor-amount">
                                <?php echo number_format($donation['amount'], 0, ',', ' '); ?> zł
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        <?php endif; ?>

    </div>
</div>
