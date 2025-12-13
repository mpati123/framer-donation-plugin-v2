<?php
/**
 * Template for successful donation message
 *
 * This template can be overridden by copying it to yourtheme/lupusursus-donations/success.php
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

<div class="shelter-message shelter-message--success">
    <div class="shelter-message-icon">
        &#10003;
    </div>
    <h2><?php esc_html_e('Dziękujemy za wpłatę!', 'lupusursus-donations'); ?></h2>
    <p>
        <?php esc_html_e('Twoja wpłata została pomyślnie zrealizowana. Potwierdzenie zostanie wysłane na podany adres email.', 'lupusursus-donations'); ?>
    </p>

    <?php if (!empty($campaign)) : ?>
        <p>
            <?php echo sprintf(
                esc_html__('Właśnie wsparłeś zbiórkę "%s". Każda złotówka się liczy!', 'lupusursus-donations'),
                '<strong>' . esc_html($campaign['title']) . '</strong>'
            ); ?>
        </p>
        <a href="<?php echo esc_url($campaign['url']); ?>" class="shelter-donate-btn">
            <?php esc_html_e('Wróć do zbiórki', 'lupusursus-donations'); ?>
        </a>
    <?php endif; ?>

    <p class="shelter-share-message">
        <?php esc_html_e('Podziel się zbiórką z innymi i pomóż zebrać jeszcze więcej!', 'lupusursus-donations'); ?>
    </p>
</div>
