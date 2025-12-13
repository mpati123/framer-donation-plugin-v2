# LupusUrsus Donations

Wtyczka WordPress do zbierania darowizn dla schronisk i organizacji pomocowych. Wyświetla atrakcyjny pasek postępu zbiórki z integracją płatności Stripe (karty, BLIK, Przelewy24).

## Funkcje

- **Zbiórki z paskiem postępu** - wizualne przedstawienie zebranych środków
- **Integracja Stripe** - bezpieczne płatności kartą, BLIK i Przelewy24
- **Shortcodes** - łatwe osadzanie zbiórek w dowolnym miejscu
- **Widget** - wyświetlanie zbiórki w sidebarze
- **Lista darczyńców** - opcjonalne pokazywanie wpłacających
- **Responsywny design** - działa na wszystkich urządzeniach
- **Szablony do nadpisania** - pełna kontrola nad wyglądem

## Wymagania

- WordPress 5.0+
- PHP 7.4+
- Konto Stripe (https://stripe.com)
- SSL (https) na stronie

## Instalacja

### 1. Pobierz i zainstaluj

```bash
cd wp-content/plugins/
git clone [repo-url] lupusursus-donations
cd lupusursus-donations
composer install
```

### 2. Aktywuj wtyczkę

W panelu WordPress: **Wtyczki → Zainstalowane wtyczki → LupusUrsus Donations → Włącz**

### 3. Skonfiguruj Stripe

1. Przejdź do **Ustawienia → LupusUrsus Donations**
2. Wprowadź klucze API Stripe (test lub live)
3. Skopiuj URL webhooka i dodaj go w panelu Stripe
4. Zapisz ustawienia

## Konfiguracja Stripe

### Klucze API

1. Zaloguj się do [Stripe Dashboard](https://dashboard.stripe.com)
2. Przejdź do **Developers → API keys**
3. Skopiuj **Publishable key** i **Secret key**
4. W trybie testowym używaj kluczy zaczynających się od `pk_test_` i `sk_test_`

### Webhook

1. W Stripe przejdź do **Developers → Webhooks**
2. Kliknij **Add endpoint**
3. Wklej URL z ustawień wtyczki (np. `https://twoja-strona.pl/wp-json/lupusursus-donations/v1/webhook`)
4. Wybierz zdarzenia:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Skopiuj **Signing secret** i wklej w ustawieniach wtyczki

## Użycie

### Tworzenie zbiórki

1. W panelu WordPress przejdź do **Zbiórki → Dodaj nową**
2. Wprowadź tytuł i opis zbiórki
3. Ustaw:
   - **Cel zbiórki** - kwota do zebrania
   - **Data zakończenia** (opcjonalnie)
   - **Beneficjent** - dla kogo zbieramy
   - **Styl paska** - solid, striped lub gradient
   - **Kolor paska** - dowolny kolor
4. Dodaj obrazek wyróżniający
5. Opublikuj zbiórkę

### Shortcodes

#### Pełna zbiórka z formularzem

```
[lupusursus_campaign id="123"]
```

Parametry:
- `id` - ID zbiórki (wymagane)
- `show_form` - pokaż formularz wpłaty (domyślnie: `true`)
- `show_donors` - pokaż listę darczyńców (domyślnie: `true`)

#### Tylko pasek postępu

```
[lupusursus_progress id="123"]
```

#### Tylko przycisk wpłaty

```
[lupusursus_donate_button id="123" text="Wesprzyj nas"]
```

Parametry:
- `id` - ID zbiórki (wymagane)
- `text` - tekst przycisku (domyślnie: "Wesprzyj")
- `class` - dodatkowe klasy CSS

#### Tylko formularz

```
[lupusursus_donation_form id="123"]
```

#### Lista zbiórek

```
[lupusursus_campaigns_list count="6" columns="3"]
```

Parametry:
- `count` - liczba zbiórek (domyślnie: 6)
- `columns` - liczba kolumn (domyślnie: 3)
- `status` - `active`, `completed` lub `all` (domyślnie: `active`)

#### Lista darczyńców

```
[lupusursus_donors_list id="123" count="10"]
```

Parametry:
- `id` - ID zbiórki (wymagane)
- `count` - liczba darczyńców (domyślnie: 10)
- `show_amount` - pokaż kwoty (domyślnie: `true`)
- `show_message` - pokaż wiadomości (domyślnie: `true`)

### Widget

1. Przejdź do **Wygląd → Widgety**
2. Znajdź **Zbiórka - LupusUrsus Donations**
3. Przeciągnij do wybranego sidebara
4. Wybierz zbiórkę z listy
5. Opcjonalnie zmień tytuł i włącz/wyłącz elementy

## Nadpisywanie szablonów

Możesz nadpisać szablony wtyczki kopiując je do motywu:

```
wp-content/themes/twoj-motyw/lupusursus-donations/
├── campaign-single.php    # Pojedyncza zbiórka
├── campaign-card.php      # Karta zbiórki (w gridzie)
├── donation-form.php      # Formularz wpłaty
├── success.php            # Strona sukcesu
└── cancel.php             # Strona anulowania
```

## Hooki i filtry

### Filtry

```php
// Zmiana domyślnych kwot w formularzu
add_filter('lupusursus_donations_default_amounts', function($amounts) {
    return [10, 25, 50, 100];
});

// Modyfikacja danych sesji Stripe
add_filter('lupusursus_donations_checkout_session_data', function($data, $campaign, $donor) {
    // Dodaj własne metadane
    $data['metadata']['custom_field'] = 'value';
    return $data;
}, 10, 3);
```

### Akcje

```php
// Po udanej płatności
add_action('lupusursus_donations_payment_completed', function($donation_id, $campaign_id, $amount) {
    // Np. wyślij powiadomienie, zaktualizuj CRM
}, 10, 3);

// Po nieudanej płatności
add_action('lupusursus_donations_payment_failed', function($payment_intent_id) {
    // Np. loguj błędy
});
```

## Struktura plików

```
lupusursus-donations/
├── lupusursus-donations.php      # Główny plik wtyczki
├── composer.json              # Zależności PHP
├── README.md                  # Dokumentacja
│
├── includes/
│   ├── class-campaign-post-type.php   # CPT zbiórki
│   ├── class-donation-post-type.php   # CPT wpłaty
│   ├── class-stripe-handler.php       # Integracja Stripe
│   ├── class-shortcodes.php           # Shortcodes
│   ├── class-ajax-handler.php         # AJAX endpoints
│   └── class-campaign-widget.php      # Widget WordPress
│
├── admin/
│   └── class-admin-settings.php       # Strona ustawień
│
├── assets/
│   ├── css/
│   │   ├── lupusursus-donations.css      # Style frontend
│   │   └── admin.css                  # Style admin
│   └── js/
│       ├── lupusursus-donations.js       # Skrypty frontend
│       └── admin.js                   # Skrypty admin
│
└── templates/
    ├── campaign-single.php            # Szablon pojedynczej zbiórki
    ├── campaign-card.php              # Szablon karty zbiórki
    ├── donation-form.php              # Szablon formularza
    ├── success.php                    # Strona sukcesu
    └── cancel.php                     # Strona anulowania
```

## Testowanie płatności

W trybie testowym użyj następujących danych:

### Karta
- Numer: `4242 4242 4242 4242`
- Data: dowolna przyszła
- CVC: dowolne 3 cyfry

### BLIK
- Kod: `123456`

### Przelewy24
- Wybierz dowolny bank z listy

Więcej kart testowych: https://stripe.com/docs/testing

## FAQ

### Czy mogę używać wtyczki bez Stripe?
Nie, wtyczka wymaga Stripe do obsługi płatności. Stripe oferuje konkurencyjne stawki (1.4% + 0.25 EUR dla kart europejskich).

### Czy wpłaty są bezpieczne?
Tak. Wszystkie płatności przechodzą przez Stripe, który jest certyfikowany PCI DSS Level 1. Dane kart nigdy nie trafiają na Twój serwer.

### Czy mogę zmienić wygląd paska postępu?
Tak. Możesz:
1. Wybrać styl (solid/striped/gradient) w ustawieniach zbiórki
2. Zmienić kolor paska
3. Nadpisać style CSS w motywie
4. Nadpisać szablony w motywie

### Jak dodać więcej metod płatności?
Stripe automatycznie obsługuje wiele metod. Dla PLN dostępne są: karty, BLIK, Przelewy24. Możesz aktywować więcej metod w panelu Stripe.

## Changelog

### 1.0.0
- Pierwsza wersja publiczna
- Obsługa zbiórek z paskiem postępu
- Integracja Stripe (karty, BLIK, P24)
- Shortcodes i widget
- Panel administracyjny

## Licencja

GPL v2 lub nowsza

## Wsparcie

Masz pytania lub problemy? Skontaktuj się z nami lub zgłoś issue na GitHub.
