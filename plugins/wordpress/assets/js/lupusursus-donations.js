/**
 * LupusUrsus Donations - Frontend JavaScript
 *
 * @package LupusUrsus_Donations
 */

(function($) {
    'use strict';

    /**
     * Main LupusUrsus Donations object
     */
    window.ShelterDonations = {

        /**
         * Initialize
         */
        init: function() {
            this.bindEvents();
            this.initAmountButtons();
            this.initProgressAnimations();
            this.initModals();
        },

        /**
         * Bind events
         */
        bindEvents: function() {
            // Donation form submission
            $(document).on('submit', '.shelter-donation-form form, .lupusursus-donation-form form', this.handleFormSubmit.bind(this));

            // Amount button clicks
            $(document).on('click', '.shelter-amount-btn, .lupusursus-amount-btn', this.handleAmountClick.bind(this));

            // Custom amount input
            $(document).on('input', '.shelter-custom-amount, .lupusursus-custom-amount', this.handleCustomAmount.bind(this));

            // Copy shortcode
            $(document).on('click', '.lupusursus-copy-shortcode', this.handleCopyShortcode.bind(this));

            // Campaign card click to open detail modal
            $(document).on('click', '[data-campaign-modal]', this.handleCampaignCardClick.bind(this));

            // Open donate modal
            $(document).on('click', '.shelter-open-donate-modal', this.handleOpenDonateModal.bind(this));

            // Close modal
            $(document).on('click', '.shelter-modal-close, .shelter-modal-overlay', this.handleCloseModal.bind(this));

            // ESC key to close modal
            $(document).on('keydown', this.handleEscKey.bind(this));
        },

        /**
         * Initialize amount buttons
         */
        initAmountButtons: function() {
            $('.shelter-donation-form, .lupusursus-donation-form').each(function() {
                var $form = $(this);
                var $buttons = $form.find('.shelter-amount-btn, .lupusursus-amount-btn');
                var $input = $form.find('input[name="amount"]');

                // Set default amount if specified
                var defaultAmount = $input.val();
                if (defaultAmount) {
                    $buttons.filter('[data-amount="' + defaultAmount + '"]').addClass('active');
                }
            });
        },

        /**
         * Initialize modals
         */
        initModals: function() {
            // Preload modal template data
            this.$detailModal = $('#shelter-detail-modal');
            this.$donateModal = $('#shelter-donate-modal');
            this.$modalTemplate = $('#shelter-modal-template');
        },

        /**
         * Initialize progress bar animations
         */
        initProgressAnimations: function() {
            // Animate progress bars when they come into view
            if ('IntersectionObserver' in window) {
                var observer = new IntersectionObserver(function(entries) {
                    entries.forEach(function(entry) {
                        if (entry.isIntersecting) {
                            var $bar = $(entry.target);
                            var targetWidth = $bar.data('width') || $bar.css('width');
                            $bar.css('width', '0').animate({ width: targetWidth }, 1000);
                            observer.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.5 });

                $('.lupusursus-progress-bar').each(function() {
                    var $bar = $(this);
                    $bar.data('width', $bar.css('width'));
                    observer.observe(this);
                });
            }
        },

        /**
         * Handle amount button click
         */
        handleAmountClick: function(e) {
            e.preventDefault();

            var $btn = $(e.currentTarget);
            var $form = $btn.closest('.shelter-donation-form, .lupusursus-donation-form, form');
            var amount = $btn.data('amount');

            // Update active state
            $form.find('.shelter-amount-btn, .lupusursus-amount-btn').removeClass('active');
            $btn.addClass('active');

            // Update input
            $form.find('input[name="amount"]').val(amount);
            $form.find('.shelter-custom-amount, .lupusursus-custom-amount').val('');
        },

        /**
         * Handle custom amount input
         */
        handleCustomAmount: function(e) {
            var $input = $(e.currentTarget);
            var $form = $input.closest('.shelter-donation-form, .lupusursus-donation-form, form');
            var value = $input.val();

            if (value) {
                // Clear button selection
                $form.find('.shelter-amount-btn, .lupusursus-amount-btn').removeClass('active');
                // Update hidden amount input
                $form.find('input[name="amount"]').val(value);
            }
        },

        /**
         * Handle campaign card click - open detail modal
         */
        handleCampaignCardClick: function(e) {
            // Don't trigger if clicking on the donate button
            if ($(e.target).closest('.shelter-open-donate-modal').length) {
                return;
            }

            var campaignId = $(e.currentTarget).data('campaign-modal');
            this.openDetailModal(campaignId);
        },

        /**
         * Handle open donate modal button click
         */
        handleOpenDonateModal: function(e) {
            e.preventDefault();
            e.stopPropagation();

            var campaignId = $(e.currentTarget).data('campaign-id');
            this.openDonateModal(campaignId);
        },

        /**
         * Handle close modal
         */
        handleCloseModal: function(e) {
            this.closeAllModals();
        },

        /**
         * Handle ESC key to close modals
         */
        handleEscKey: function(e) {
            if (e.key === 'Escape' || e.keyCode === 27) {
                this.closeAllModals();
            }
        },

        /**
         * Open detail modal for a campaign
         */
        openDetailModal: function(campaignId) {
            var $modal = this.$detailModal;
            var $template = this.$modalTemplate;

            if (!$modal.length || !$template.length) {
                return;
            }

            // Get campaign data from template
            var $campaignData = $template.find('.shelter-modal-data[data-campaign-id="' + campaignId + '"]');
            if (!$campaignData.length) {
                return;
            }

            // Load content into modal
            $modal.find('.shelter-modal-content').html($campaignData.html());

            // Show modal
            $modal.fadeIn(200);
            $('body').addClass('shelter-modal-open');
        },

        /**
         * Open donate modal for a campaign
         */
        openDonateModal: function(campaignId) {
            var $modal = this.$donateModal;
            var $template = this.$modalTemplate;

            if (!$modal.length || !$template.length) {
                return;
            }

            // Get donate form data from template
            var $formData = $template.find('.shelter-donate-form-data[data-campaign-id="' + campaignId + '"]');
            if (!$formData.length) {
                return;
            }

            // Load content into modal
            $modal.find('.shelter-modal-content').html($formData.html());

            // Re-init amount buttons for the new form
            this.initAmountButtons();

            // Close detail modal if open
            this.$detailModal.hide();

            // Show modal
            $modal.fadeIn(200);
            $('body').addClass('shelter-modal-open');
        },

        /**
         * Close all modals
         */
        closeAllModals: function() {
            $('.shelter-modal').fadeOut(200);
            $('body').removeClass('shelter-modal-open');
        },

        /**
         * Handle form submission
         */
        handleFormSubmit: function(e) {
            e.preventDefault();

            var $form = $(e.currentTarget);
            var $btn = $form.find('.lupusursus-donate-btn');
            var $message = $form.find('.lupusursus-form-message');

            // Get form data
            var formData = {
                action: 'lupusursus_create_checkout',
                nonce: lupusursusDonationsData.nonce,
                campaign_id: $form.find('input[name="campaign_id"]').val(),
                amount: $form.find('input[name="amount"]').val(),
                donor_name: $form.find('input[name="donor_name"]').val() || '',
                donor_email: $form.find('input[name="donor_email"]').val() || '',
                message: $form.find('textarea[name="message"]').val() || '',
                is_anonymous: $form.find('input[name="is_anonymous"]').is(':checked') ? 1 : 0
            };

            // Validate amount
            var minAmount = parseFloat(lupusursusDonationsData.minAmount) || 5;
            if (!formData.amount || parseFloat(formData.amount) < minAmount) {
                this.showMessage($message, 'error',
                    lupusursusDonationsData.i18n.minAmountError.replace('%s', minAmount));
                return;
            }

            // Show loading state
            this.setLoading($btn, true);
            $message.hide();

            // Send AJAX request
            $.ajax({
                url: lupusursusDonationsData.ajaxUrl,
                type: 'POST',
                data: formData,
                success: function(response) {
                    if (response.success && response.data.checkout_url) {
                        // Redirect to Stripe Checkout
                        window.location.href = response.data.checkout_url;
                    } else {
                        this.setLoading($btn, false);
                        this.showMessage($message, 'error',
                            response.data.message || lupusursusDonationsData.i18n.genericError);
                    }
                }.bind(this),
                error: function() {
                    this.setLoading($btn, false);
                    this.showMessage($message, 'error', lupusursusDonationsData.i18n.genericError);
                }.bind(this)
            });
        },

        /**
         * Set button loading state
         */
        setLoading: function($btn, isLoading) {
            if (isLoading) {
                $btn.data('original-text', $btn.html());
                $btn.html('<span class="shelter-loading"></span> ' + lupusursusDonationsData.i18n.processing);
                $btn.prop('disabled', true);
            } else {
                $btn.html($btn.data('original-text'));
                $btn.prop('disabled', false);
            }
        },

        /**
         * Show form message
         */
        showMessage: function($container, type, message) {
            $container
                .removeClass('shelter-form-message--success shelter-form-message--error')
                .addClass('shelter-form-message--' + type)
                .html(message)
                .slideDown();
        },

        /**
         * Handle shortcode copy
         */
        handleCopyShortcode: function(e) {
            e.preventDefault();

            var $btn = $(e.currentTarget);
            var shortcode = $btn.data('shortcode') || $btn.prev('code').text();

            if (navigator.clipboard) {
                navigator.clipboard.writeText(shortcode).then(function() {
                    var originalText = $btn.text();
                    $btn.text(lupusursusDonationsData.i18n.copied || 'Skopiowano!');
                    setTimeout(function() {
                        $btn.text(originalText);
                    }, 2000);
                });
            }
        },

        /**
         * Update campaign progress (for real-time updates)
         */
        updateProgress: function(campaignId) {
            $.ajax({
                url: lupusursusDonationsData.ajaxUrl,
                type: 'GET',
                data: {
                    action: 'lupusursus_get_progress',
                    campaign_id: campaignId
                },
                success: function(response) {
                    if (response.success) {
                        var data = response.data;
                        var $campaign = $('[data-campaign-id="' + campaignId + '"]');

                        // Update progress bar
                        $campaign.find('.lupusursus-progress-bar')
                            .css('width', data.percentage + '%');

                        // Update text
                        $campaign.find('.lupusursus-progress-collected')
                            .text(data.formatted.collected);
                        $campaign.find('.lupusursus-progress-percentage')
                            .text(data.percentage + '%');
                    }
                }
            });
        },

        /**
         * Refresh all campaigns on page
         */
        refreshAllCampaigns: function() {
            $('[data-campaign-id]').each(function() {
                var campaignId = $(this).data('campaign-id');
                ShelterDonations.updateProgress(campaignId);
            });
        }
    };

    /**
     * Document ready
     */
    $(document).ready(function() {
        ShelterDonations.init();

        // Auto-refresh progress every 60 seconds (if enabled)
        if (typeof lupusursusDonationsData !== 'undefined' && lupusursusDonationsData.autoRefresh) {
            setInterval(function() {
                ShelterDonations.refreshAllCampaigns();
            }, 60000);
        }
    });

})(jQuery);
