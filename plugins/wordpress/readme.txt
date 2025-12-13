=== LupusUrsus Donations ===
Contributors: lupusursus
Donate link: https://lupusursus.org/donate
Tags: donations, fundraising, stripe, progress bar, charity, animal shelter, blik, przelewy24
Requires at least: 5.8
Tested up to: 6.4
Stable tag: 1.0.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Beautiful donation campaigns with animated progress bars. Stripe integration with BLIK and Przelewy24 support. Perfect for animal shelters and charities.

== Description ==

**LupusUrsus Donations** is a powerful WordPress plugin for creating beautiful donation campaigns with animated progress bars and seamless Stripe payment integration.

= Key Features =

* **Animated Progress Bars** - Multiple styles: solid, striped, and gradient with smooth animations
* **Stripe Integration** - Secure payments via cards, BLIK, and Przelewy24 (for PLN)
* **6 Shortcodes** - Display campaigns, progress bars, donate buttons, forms, campaign lists, and donor lists anywhere
* **Widget** - Show campaigns in your sidebar
* **Responsive Design** - Looks great on all devices
* **Template Overrides** - Full control over the appearance
* **Multi-currency** - Support for PLN, EUR, USD, GBP, CZK

= Perfect For =

* Animal shelters
* Charitable organizations
* Nonprofits
* Community fundraising
* Medical fundraisers
* Educational campaigns

= Shortcodes =

* `[lupusursus_campaign id="123"]` - Full campaign with form
* `[lupusursus_progress id="123"]` - Progress bar only
* `[lupusursus_donate_button id="123"]` - Donate button only
* `[lupusursus_donation_form id="123"]` - Donation form only
* `[lupusursus_campaigns_list]` - Grid of campaigns
* `[lupusursus_donors_list id="123"]` - Recent donors list

= Requirements =

* WordPress 5.8+
* PHP 7.4+
* SSL certificate (HTTPS)
* Stripe account

== Installation ==

1. Upload the `lupusursus-donations` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to Settings > LupusUrsus Donations to configure Stripe
4. Create your first campaign under the 'Campaigns' menu
5. Use shortcodes or the widget to display campaigns

= Stripe Configuration =

1. Create a free Stripe account at stripe.com
2. Get your API keys from Stripe Dashboard > Developers > API keys
3. Enter the keys in the plugin settings
4. Configure the webhook URL in Stripe Dashboard > Webhooks
5. Copy the webhook signing secret to plugin settings

== Frequently Asked Questions ==

= Is Stripe required? =

Yes, LupusUrsus Donations uses Stripe for all payment processing. Stripe is free to set up and charges approximately 1.4% + 0.25 EUR per successful card transaction in Europe.

= Is it secure? =

Yes! All payment data is handled by Stripe, which is PCI DSS Level 1 certified. Card numbers never touch your server.

= Can I customize the appearance? =

Yes! You can:
- Choose from multiple progress bar styles (solid, striped, gradient)
- Set custom colors
- Override templates in your theme
- Add custom CSS

= Does it support recurring donations? =

Not yet. The current version supports one-time donations only. Recurring donations are planned for a future release.

= What payment methods are available? =

- Credit/debit cards (worldwide)
- BLIK (Poland only, PLN currency)
- Przelewy24 (Poland only, PLN currency)

= Can I export donation data? =

Donations are stored as a custom post type. You can export them using WordPress's built-in export feature or any compatible plugin.

== Screenshots ==

1. Campaign with animated progress bar
2. Donation form with amount buttons
3. Admin settings page with Stripe configuration
4. Campaign edit screen with meta boxes
5. Widget in sidebar
6. Responsive mobile view

== Changelog ==

= 1.0.0 =
* Initial release
* Campaign and donation custom post types
* Stripe Checkout integration
* BLIK and Przelewy24 support for PLN
* 6 shortcodes
* Campaign widget
* Admin settings page
* Multiple progress bar styles
* Donor list with optional anonymity
* Template override system
* Email notifications

== Upgrade Notice ==

= 1.0.0 =
Initial release of LupusUrsus Donations.

== Credits ==

* Built with [Stripe](https://stripe.com) for secure payments
* Icons from [Dashicons](https://developer.wordpress.org/resource/dashicons/)
