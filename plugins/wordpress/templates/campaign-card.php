<?php
/**
 * Template for campaign card (used in grid/list views)
 *
 * This template can be overridden by copying it to yourtheme/lupusursus-donations/campaign-card.php
 *
 * @package LupusUrsus_Donations
 * @version 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Variables available:
 * $campaign - array with campaign data
 */
?>

<div class="shelter-campaign shelter-campaign-card" data-campaign-id="<?php echo esc_attr($campaign['id']); ?>">

    <?php if ($campaign['image']) : ?>
        <div class="shelter-campaign-image">
            <a href="<?php echo esc_url($campaign['url']); ?>">
                <img src="<?php echo esc_url($campaign['image']); ?>" alt="<?php echo esc_attr($campaign['title']); ?>">
            </a>
            <?php if (!$campaign['is_active']) : ?>
                <span class="shelter-campaign-badge shelter-campaign-badge--inactive">
                    <?php esc_html_e('Zakończona', 'lupusursus-donations'); ?>
                </span>
            <?php endif; ?>
        </div>
    <?php endif; ?>

    <div class="shelter-campaign-content">
        <h3 class="shelter-campaign-title">
            <a href="<?php echo esc_url($campaign['url']); ?>">
                <?php echo esc_html($campaign['title']); ?>
            </a>
        </h3>

        <?php if ($campaign['beneficiary']) : ?>
            <p class="shelter-campaign-beneficiary">
                <?php echo sprintf(
                    esc_html__('Dla: %s', 'lupusursus-donations'),
                    '<strong>' . esc_html($campaign['beneficiary']) . '</strong>'
                ); ?>
            </p>
        <?php endif; ?>

        <?php if ($campaign['excerpt']) : ?>
            <p class="shelter-campaign-description">
                <?php echo esc_html($campaign['excerpt']); ?>
            </p>
        <?php endif; ?>

        <div class="shelter-progress">
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
            </div>
        </div>

        <?php if ($campaign['is_active']) : ?>
            <a href="<?php echo esc_url($campaign['url']); ?>" class="shelter-donate-btn shelter-donate-btn--full">
                <?php esc_html_e('Wesprzyj', 'lupusursus-donations'); ?>
            </a>
        <?php endif; ?>
    </div>
</div>
