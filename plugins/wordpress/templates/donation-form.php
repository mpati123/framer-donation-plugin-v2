<?php
/**
 * Template for donation form
 *
 * This template can be overridden by copying it to yourtheme/lupusursus-donations/donation-form.php
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

$min_amount = (float) get_option('lupusursus_donations_min_amount', 5);
$default_amounts = apply_filters('lupusursus_donations_default_amounts', [20, 50, 100, 200]);
?>

<div class="shelter-donation-form">
    <h3><?php esc_html_e('Wesprzyj tę zbiórkę', 'lupusursus-donations'); ?></h3>

    <div class="shelter-form-message" style="display: none;"></div>

    <form method="post" action="">
        <input type="hidden" name="campaign_id" value="<?php echo esc_attr($campaign['id']); ?>">

        <!-- Amount selection -->
        <div class="shelter-form-group">
            <label><?php esc_html_e('Wybierz kwotę', 'lupusursus-donations'); ?></label>

            <div class="shelter-amount-buttons">
                <?php foreach ($default_amounts as $amount) : ?>
                    <button type="button" class="shelter-amount-btn" data-amount="<?php echo esc_attr($amount); ?>">
                        <?php echo esc_html($amount); ?> zł
                    </button>
                <?php endforeach; ?>
            </div>

            <div class="shelter-custom-amount-wrapper">
                <input type="number"
                       name="amount"
                       class="shelter-custom-amount"
                       placeholder="<?php esc_attr_e('Inna kwota', 'lupusursus-donations'); ?>"
                       min="<?php echo esc_attr($min_amount); ?>"
                       step="1">
                <small>
                    <?php echo sprintf(
                        esc_html__('Minimalna kwota: %s zł', 'lupusursus-donations'),
                        number_format($min_amount, 0, ',', ' ')
                    ); ?>
                </small>
            </div>
        </div>

        <!-- Donor info -->
        <div class="shelter-form-group">
            <label for="shelter-donor-name">
                <?php esc_html_e('Imię i nazwisko', 'lupusursus-donations'); ?>
                <small>(<?php esc_html_e('opcjonalnie', 'lupusursus-donations'); ?>)</small>
            </label>
            <input type="text"
                   id="shelter-donor-name"
                   name="donor_name"
                   placeholder="<?php esc_attr_e('Jan Kowalski', 'lupusursus-donations'); ?>">
        </div>

        <div class="shelter-form-group">
            <label for="shelter-donor-email">
                <?php esc_html_e('Email', 'lupusursus-donations'); ?>
                <small>(<?php esc_html_e('opcjonalnie - do potwierdzenia wpłaty', 'lupusursus-donations'); ?>)</small>
            </label>
            <input type="email"
                   id="shelter-donor-email"
                   name="donor_email"
                   placeholder="<?php esc_attr_e('jan@example.com', 'lupusursus-donations'); ?>">
        </div>

        <div class="shelter-form-group">
            <label for="shelter-message">
                <?php esc_html_e('Wiadomość', 'lupusursus-donations'); ?>
                <small>(<?php esc_html_e('opcjonalnie', 'lupusursus-donations'); ?>)</small>
            </label>
            <textarea id="shelter-message"
                      name="message"
                      rows="3"
                      placeholder="<?php esc_attr_e('Trzymam kciuki!', 'lupusursus-donations'); ?>"></textarea>
        </div>

        <div class="shelter-form-group shelter-checkbox-group">
            <input type="checkbox"
                   id="shelter-anonymous"
                   name="is_anonymous"
                   value="1">
            <label for="shelter-anonymous">
                <?php esc_html_e('Chcę wpłacić anonimowo', 'lupusursus-donations'); ?>
            </label>
        </div>

        <div class="shelter-form-group">
            <button type="submit" class="shelter-donate-btn shelter-donate-btn--full">
                <?php esc_html_e('Wpłacam', 'lupusursus-donations'); ?>
            </button>
        </div>

        <p class="shelter-form-note">
            <small>
                <?php echo sprintf(
                    esc_html__('Płatność obsługiwana przez %s. Obsługujemy karty, BLIK i Przelewy24.', 'lupusursus-donations'),
                    '<strong>Stripe</strong>'
                ); ?>
            </small>
        </p>
    </form>
</div>
