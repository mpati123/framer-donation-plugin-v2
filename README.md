# LupusUrsus Donations - System zbiórek dla Framera

Kompletny system zbiórek pieniędzy z integracją Stripe, Supabase i Vercel. Gotowe komponenty React do użycia w Framerze.

## Spis treści

1. [Architektura](#architektura)
2. [Wymagania](#wymagania)
3. [Krok 1: Konfiguracja Supabase](#krok-1-konfiguracja-supabase)
4. [Krok 2: Konfiguracja Stripe](#krok-2-konfiguracja-stripe)
5. [Krok 3: Deploy na Vercel](#krok-3-deploy-na-vercel)
6. [Krok 4: Komponenty Framer](#krok-4-komponenty-framer)
7. [Panel administracyjny](#panel-administracyjny)
8. [API Reference](#api-reference)
9. [Testowanie płatności](#testowanie-płatności)
10. [Troubleshooting](#troubleshooting)

---

## Architektura

```
┌─────────────────┐     ┌──────────────────┐     ┌────────┐
│  Framer Site    │────▶│  Vercel API      │────▶│ Stripe │
│  (komponenty)   │◀────│  (serverless)    │◀────│        │
└─────────────────┘     └──────────────────┘     └────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  Supabase    │
                        │  (PostgreSQL)│
                        └──────────────┘
```

**Przepływ płatności:**
1. Użytkownik wypełnia formularz wpłaty w komponencie Framer
2. API tworzy sesję Stripe Checkout
3. Użytkownik płaci na stronie Stripe
4. Stripe wysyła webhook do API
5. API aktualizuje status wpłaty w Supabase
6. Trigger bazodanowy przelicza sumę zbiórki

---

## Wymagania

- Konto [Supabase](https://supabase.com) (darmowe)
- Konto [Stripe](https://stripe.com) (darmowe, prowizja od transakcji)
- Konto [Vercel](https://vercel.com) (darmowe)
- Konto [Framer](https://framer.com) (wymaga płatnego planu do code components)

---

## Krok 1: Konfiguracja Supabase

### 1.1 Utwórz projekt

1. Zaloguj się na [supabase.com](https://supabase.com)
2. Kliknij "New Project"
3. Wybierz organizację i nazwę projektu
4. Wybierz region (np. `eu-central-1` dla Europy)
5. Ustaw hasło do bazy danych (zapisz je!)
6. Kliknij "Create new project"

### 1.2 Utwórz schemat bazy danych

1. W panelu Supabase przejdź do **SQL Editor**
2. Kliknij "New query"
3. Wklej całą zawartość pliku `supabase/schema.sql`
4. Kliknij "Run" (Ctrl+Enter)

Schemat utworzy:
- Tabelę `campaigns` - zbiórki
- Tabelę `donations` - wpłaty
- Trigger automatycznie przeliczający sumy zbiórek
- Row Level Security (RLS) dla bezpieczeństwa

### 1.3 Pobierz klucze API

1. Przejdź do **Project Settings** → **API**
2. Zapisz następujące wartości:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ **UWAGA:** `service_role` key ma pełny dostęp do bazy. Nigdy nie umieszczaj go w kodzie frontendowym!

---

## Krok 2: Konfiguracja Stripe

### 2.1 Utwórz konto

1. Zarejestruj się na [stripe.com](https://stripe.com)
2. Uzupełnij dane firmy/organizacji
3. Aktywuj konto (wymaga weryfikacji dla trybu produkcyjnego)

### 2.2 Pobierz klucze API

1. Przejdź do **Developers** → **API keys**
2. Zapisz:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`

> 💡 Na początek użyj kluczy testowych (zaczynają się od `pk_test_` i `sk_test_`)

### 2.3 Skonfiguruj webhook (po deploy na Vercel)

1. Przejdź do **Developers** → **Webhooks**
2. Kliknij **+ Add destination**
3. Wybierz **Your account** (powinno być już zaznaczone)
4. W polu wyszukiwania wpisz `checkout.session.completed` i zaznacz ten event
5. Kliknij **Continue →**
6. Wybierz **Webhook endpoint**
7. Kliknij **Continue →**
8. W polu **Endpoint URL** wpisz: `https://TWOJA-DOMENA.vercel.app/api/webhook`
9. Kliknij **Create destination**
10. Po utworzeniu kliknij na webhook, potem **Signing secret** → **Reveal**
11. Skopiuj secret (zaczyna się od `whsec_`) i zapisz → `STRIPE_WEBHOOK_SECRET`

> ⚠️ **UWAGA:** Secret z Stripe CLI (`stripe listen`) jest tymczasowy i działa tylko podczas sesji CLI. Do produkcji potrzebujesz stałego secretu z Dashboard.

### 2.4 Włącz metody płatności (opcjonalnie)

Dla płatności w PLN zalecamy włączenie:

1. Przejdź do **Settings** → **Payment methods**
2. Włącz:
   - **Cards** (domyślnie włączone)
   - **BLIK** - popularna metoda w Polsce
   - **Przelewy24** - przelewy bankowe

---

## Krok 3: Deploy na Vercel

### 3.1 Przygotuj repozytorium

1. Sforkuj lub sklonuj to repozytorium
2. Opcjonalnie: usuń folder `node_modules/`

### 3.2 Deploy na Vercel

1. Zaloguj się na [vercel.com](https://vercel.com)
2. Kliknij "Add New" → "Project"
3. Zaimportuj repozytorium z GitHub/GitLab
4. **Framework Preset:** Other
5. **Root Directory:** pozostaw `/`

### 3.3 Ustaw zmienne środowiskowe

W ustawieniach projektu Vercel (**Settings** → **Environment Variables**) dodaj:

| Zmienna | Wartość | Opis |
|---------|---------|------|
| `SUPABASE_URL` | `https://xxx.supabase.co` | URL projektu Supabase |
| `SUPABASE_ANON_KEY` | `eyJ...` | Klucz anon Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Klucz service_role Supabase |
| `STRIPE_SECRET_KEY` | `sk_test_...` lub `sk_live_...` | Sekretny klucz Stripe |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Signing secret webhooka |
| `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` | `pk_test_...` lub `pk_live_...` | Publiczny klucz Stripe |
| `ADMIN_API_KEY` | (wygeneruj własny) | Klucz do panelu admina |
| `FRONTEND_URL` | `https://twoja-strona.pl` | URL strony z Framera (dla przekierowań Stripe) |

> 💡 **Tip:** `ADMIN_API_KEY` możesz wygenerować np. przez `openssl rand -hex 32`

### 3.4 Redeploy

Po ustawieniu zmiennych kliknij **Deployments** → wybierz ostatni deploy → **Redeploy**

### 3.5 Skonfiguruj domenę (opcjonalnie)

1. **Settings** → **Domains**
2. Dodaj własną domenę lub użyj domyślnej `*.vercel.app`

---

## Krok 4: Komponenty Framer

### 4.1 Dodaj komponenty do projektu Framer

W projekcie Framer:

1. Przejdź do **Assets** → **Code**
2. Kliknij **"+"** → **"New file"**
3. Dla każdego komponentu z folderu `framer/` utwórz nowy plik i wklej kod

Dostępne komponenty:
- `DonationProgress.tsx` - pasek postępu zbiórki
- `DonationForm.tsx` - formularz wpłaty
- `DonationButton.tsx` - przycisk szybkiej wpłaty
- `CampaignCard.tsx` - karta zbiórki
- `DonorsList.tsx` - lista darczyńców

### 4.2 Skonfiguruj hook

Utwórz folder `hooks/` w Assets → Code i dodaj `useCampaign.ts`

### 4.3 Ustaw API URL

W każdym komponencie ustaw property `apiUrl` na:
```
https://TWOJA-DOMENA.vercel.app/api
```

### 4.4 Ustaw Campaign ID

1. Utwórz zbiórkę w panelu admina (lub przez Supabase)
2. Skopiuj ID zbiórki
3. Wklej do property `campaignId` w komponentach

---

## Panel administracyjny

### Dostęp do panelu

1. Otwórz `https://TWOJA-DOMENA.vercel.app/admin/`
2. Wprowadź:
   - **API URL:** `https://TWOJA-DOMENA.vercel.app/api`
   - **API Key:** wartość `ADMIN_API_KEY` z Vercel

### Funkcje panelu

- **Tworzenie zbiórek** - ustaw tytuł, cel, opis, obrazek
- **Edycja zbiórek** - aktualizuj dane, zmień status
- **Archiwizacja** - ukryj zakończone zbiórki
- **Przywracanie** - odzyskaj zarchiwizowane zbiórki

---

## API Reference

### Endpointy publiczne

#### GET /api/campaigns
Lista aktywnych zbiórek
```bash
curl https://api.example.com/api/campaigns?status=active&limit=10
```

#### GET /api/campaigns/:id
Szczegóły zbiórki
```bash
curl https://api.example.com/api/campaigns/uuid-zbiórki
```

#### GET /api/donations
Lista wpłat dla zbiórki
```bash
curl https://api.example.com/api/donations?campaign_id=uuid&limit=10
```

#### POST /api/checkout
Utworzenie sesji płatności
```bash
curl -X POST https://api.example.com/api/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_id": "uuid",
    "amount": 50,
    "donor_name": "Jan Kowalski",
    "donor_email": "jan@example.com",
    "message": "Powodzenia!",
    "is_anonymous": false
  }'
```

### Endpointy administracyjne

Wymagają nagłówka `X-API-Key: TWÓJ_ADMIN_API_KEY`

#### POST /api/campaigns
Utworzenie zbiórki
```bash
curl -X POST https://api.example.com/api/campaigns \
  -H "Content-Type: application/json" \
  -H "X-API-Key: twój-klucz" \
  -d '{
    "title": "Operacja dla Burka",
    "description": "Opis zbiórki...",
    "goal_amount": 5000,
    "beneficiary": "Burek - 5-letni kundelek"
  }'
```

#### PUT /api/campaigns/:id
Aktualizacja zbiórki

#### DELETE /api/campaigns/:id
Archiwizacja zbiórki

#### DELETE /api/campaigns/:id?restore=true
Przywrócenie zbiórki

---

## Testowanie płatności

W trybie testowym Stripe użyj następujących danych:

### Karta kredytowa (sukces)
- Numer: `4242 4242 4242 4242`
- Data: dowolna przyszła (np. `12/25`)
- CVC: dowolne 3 cyfry (np. `123`)
- Kod pocztowy: dowolny (np. `00-000`)

### Karta odrzucona
- Numer: `4000 0000 0000 0002`

### BLIK (tylko PLN)
- Kod: `123456`

### Przelewy24 (tylko PLN)
- Wybierz dowolny bank z listy testowej

Więcej kart testowych: https://stripe.com/docs/testing

---

## Troubleshooting

### Webhook nie działa

1. Sprawdź URL webhooka w Stripe Dashboard
2. Sprawdź logi w Vercel Functions (**Deployments** → **Functions**)
3. Upewnij się że `STRIPE_WEBHOOK_SECRET` jest poprawny
4. W trybie dev użyj [Stripe CLI](https://stripe.com/docs/stripe-cli) do lokalnego testowania

### Błąd 404 po płatności

Problem: `success_url` wskazuje na niewłaściwy adres.

Rozwiązanie: Ustaw zmienną `FRONTEND_URL` w Vercel na URL Twojej strony Framer (np. `https://twoja-strona.framer.website` lub własna domena).

### Zbiórka nie pokazuje się

1. Sprawdź czy `is_active = true` w Supabase
2. Sprawdź czy `archived_at IS NULL`
3. Sprawdź RLS policies w Supabase

### CORS error

API domyślnie pozwala na requesty z dowolnej domeny (`Access-Control-Allow-Origin: *`). Jeśli masz problemy:
1. Sprawdź czy URL API jest poprawny (https, bez trailing slash)
2. Sprawdź konsolę przeglądarki dla szczegółów błędu

### Suma zbiórki się nie aktualizuje

1. Sprawdź czy trigger `trigger_update_campaign_totals` istnieje
2. Sprawdź czy wpłata ma status `completed`
3. Ręcznie uruchom update w Supabase SQL Editor:
```sql
UPDATE campaigns SET collected_amount = (
  SELECT COALESCE(SUM(amount), 0) FROM donations
  WHERE campaign_id = campaigns.id AND status = 'completed'
);
```

---

## Struktura projektu

```
donation-framer-lupusursus/
├── api/
│   ├── campaigns/
│   │   ├── index.ts       # GET/POST /api/campaigns
│   │   └── [id].ts        # GET/PUT/DELETE /api/campaigns/:id
│   ├── donations/
│   │   └── index.ts       # GET /api/donations
│   ├── checkout/
│   │   └── index.ts       # POST /api/checkout
│   └── webhook/
│       └── index.ts       # POST /api/webhook (Stripe)
│
├── framer/
│   ├── CampaignCard.tsx   # Karta zbiórki
│   ├── DonationButton.tsx # Przycisk wpłaty
│   ├── DonationForm.tsx   # Formularz wpłaty
│   ├── DonationProgress.tsx # Pasek postępu
│   ├── DonorsList.tsx     # Lista darczyńców
│   └── hooks/
│       └── useCampaign.ts # Hooki React
│
├── supabase/
│   └── schema.sql         # Schemat bazy danych
│
├── admin/
│   └── index.html         # Panel administracyjny
│
├── package.json
└── README.md
```

---

## Zmienne środowiskowe - podsumowanie

| Zmienna | Wymagana | Opis |
|---------|----------|------|
| `SUPABASE_URL` | Tak | URL projektu Supabase |
| `SUPABASE_ANON_KEY` | Tak | Klucz publiczny Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Tak | Klucz administracyjny Supabase |
| `STRIPE_SECRET_KEY` | Tak | Sekretny klucz Stripe |
| `STRIPE_WEBHOOK_SECRET` | Tak | Signing secret webhooka Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` | Nie* | Publiczny klucz Stripe |
| `ADMIN_API_KEY` | Tak | Klucz do autoryzacji panelu admina |
| `FRONTEND_URL` | Zalecana | URL strony dla przekierowań po płatności |

*Używany tylko jeśli implementujesz Stripe Elements zamiast Checkout

---

## Licencja

MIT

---

## Wsparcie

Masz pytania? Utwórz issue w repozytorium lub skontaktuj się przez Framer Community.
