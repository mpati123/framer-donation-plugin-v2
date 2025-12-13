<?php
/**
 * Template for cancelled donation message
 *
 * This template can be overridden by copying it to yourtheme/lupusursus-donations/cancel.php
 *
 * @package LupusUrsus_Donations
 * @version 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Variables available:
 * $campaign - array with campaign data (optional)
 */
?>

<div class="shelter-message shelter-message--cancel">
    <div class="shelter-message-icon">
        &#8635;
    </div>
    <h2><?php esc_html_e('Płatność anulowana', 'lupusursus-donations'); ?></h2>
    <p>
        <?php esc_html_e('Twoja płatność została anulowana. Żadne środki nie zostały pobrane.', 'lupusursus-donations'); ?>
    </p>

    <?php if (!empty($campaign) && $campaign['is_active']) : ?>
        <p>
            <?php esc_html_e('Jeśli chcesz, możesz spróbować ponownie:', 'lupusursus-donations'); ?>
        </p>
        <a href="<?php echo esc_url($campaign['url']); ?>" class="shelter-donate-btn">
            <?php esc_html_e('Spróbuj ponownie', 'lupusursus-donations'); ?>
        </a>
    <?php endif; ?>
</div>
