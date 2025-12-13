/**
 * LupusUrsus Donations - Admin JavaScript
 *
 * @package LupusUrsus_Donations
 */

(function($) {
    'use strict';

    /**
     * Admin functionality
     */
    var ShelterDonationsAdmin = {

        /**
         * Initialize
         */
        init: function() {
            this.bindEvents();
            this.initColorPicker();
            this.initModeToggle();
        },

        /**
         * Bind events
         */
        bindEvents: function() {
            // Copy webhook URL
            $(document).on('click', '.lupusursus-copy-webhook', this.copyWebhookUrl.bind(this));

            // Toggle password visibility
            $(document).on('click', '.lupusursus-toggle-password', this.togglePasswordVisibility.bind(this));

            // Test Stripe connection
            $(document).on('click', '.lupusursus-test-stripe', this.testStripeConnection.bind(this));

            // Color picker sync
            $(document).on('input', '.lupusursus-color-input', this.syncColorPicker.bind(this));
            $(document).on('input', '.lupusursus-color-picker', this.syncColorInput.bind(this));

            // Recalculate campaign total
            $(document).on('click', '.lupusursus-recalculate', this.recalculateCampaign.bind(this));
        },

        /**
         * Initialize color pickers
         */
        initColorPicker: function() {
            if ($.fn.wpColorPicker) {
                $('.lupusursus-color-field').wpColorPicker();
            }
        },

        /**
         * Initialize mode toggle
         */
        initModeToggle: function() {
            var $modeInputs = $('input[name="lupusursus_donations_stripe_mode"]');

            $modeInputs.on('change', function() {
                var mode = $(this).val();

                // Show/hide appropriate key fields
                if (mode === 'test') {
                    $('.lupusursus-keys-test').slideDown();
                    $('.lupusursus-keys-live').slideUp();
                } else {
                    $('.lupusursus-keys-test').slideUp();
                    $('.lupusursus-keys-live').slideDown();
                }
            });

            // Trigger initial state
            $modeInputs.filter(':checked').trigger('change');
        },

        /**
         * Copy webhook URL to clipboard
         */
        copyWebhookUrl: function(e) {
            e.preventDefault();

            var $btn = $(e.currentTarget);
            var $input = $btn.siblings('input');
            var url = $input.val();

            if (navigator.clipboard) {
                navigator.clipboard.writeText(url).then(function() {
                    var $icon = $btn.find('.dashicons');
                    $icon.removeClass('dashicons-clipboard').addClass('dashicons-yes');

                    setTimeout(function() {
                        $icon.removeClass('dashicons-yes').addClass('dashicons-clipboard');
                    }, 2000);
                });
            } else {
                // Fallback for older browsers
                $input.select();
                document.execCommand('copy');
            }
        },

        /**
         * Toggle password field visibility
         */
        togglePasswordVisibility: function(e) {
            e.preventDefault();

            var $btn = $(e.currentTarget);
            var $input = $btn.siblings('input');
            var $icon = $btn.find('.dashicons');

            if ($input.attr('type') === 'password') {
                $input.attr('type', 'text');
                $icon.removeClass('dashicons-visibility').addClass('dashicons-hidden');
            } else {
                $input.attr('type', 'password');
                $icon.removeClass('dashicons-hidden').addClass('dashicons-visibility');
            }
        },

        /**
         * Test Stripe connection
         */
        testStripeConnection: function(e) {
            e.preventDefault();

            var $btn = $(e.currentTarget);
            var $result = $btn.siblings('.lupusursus-test-result');

            $btn.prop('disabled', true);
            $result.html('<span class="spinner is-active" style="float:none;"></span> Testowanie...');

            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'lupusursus_test_stripe',
                    nonce: lupusursusDonationsAdmin.nonce
                },
                success: function(response) {
                    $btn.prop('disabled', false);

                    if (response.success) {
                        $result.html('<span class="dashicons dashicons-yes-alt" style="color:#00a32a;"></span> ' + response.data.message);
                    } else {
                        $result.html('<span class="dashicons dashicons-warning" style="color:#d63638;"></span> ' + response.data.message);
                    }
                },
                error: function() {
                    $btn.prop('disabled', false);
                    $result.html('<span class="dashicons dashicons-warning" style="color:#d63638;"></span> Błąd połączenia');
                }
            });
        },

        /**
         * Sync color picker with text input
         */
        syncColorPicker: function(e) {
            var $input = $(e.currentTarget);
            var $picker = $input.siblings('.lupusursus-color-picker');
            $picker.val($input.val());
        },

        /**
         * Sync text input with color picker
         */
        syncColorInput: function(e) {
            var $picker = $(e.currentTarget);
            var $input = $picker.siblings('.lupusursus-color-input');
            $input.val($picker.val());
        },

        /**
         * Recalculate campaign total
         */
        recalculateCampaign: function(e) {
            e.preventDefault();

            var $btn = $(e.currentTarget);
            var campaignId = $btn.data('campaign-id');

            $btn.prop('disabled', true);
            $btn.text('Przeliczanie...');

            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'lupusursus_recalculate_campaign',
                    nonce: lupusursusDonationsAdmin.nonce,
                    campaign_id: campaignId
                },
                success: function(response) {
                    if (response.success) {
                        // Update displayed amount
                        $btn.siblings('.lupusursus-collected-amount').text(response.data.collected + ' zł');
                        $btn.text('Przelicz ponownie');
                    } else {
                        alert(response.data.message || 'Błąd');
                        $btn.text('Przelicz ponownie');
                    }
                    $btn.prop('disabled', false);
                },
                error: function() {
                    alert('Błąd połączenia');
                    $btn.prop('disabled', false);
                    $btn.text('Przelicz ponownie');
                }
            });
        },

        /**
         * Format currency
         */
        formatCurrency: function(amount) {
            return new Intl.NumberFormat('pl-PL', {
                style: 'currency',
                currency: 'PLN'
            }).format(amount);
        }
    };

    /**
     * Document ready
     */
    $(document).ready(function() {
        ShelterDonationsAdmin.init();
    });

})(jQuery);
