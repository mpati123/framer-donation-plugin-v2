# Donations Plugin - Dashboard

Panel zarządzania dla wtyczki donacyjnej. Umożliwia klientom (fundacjom) zarządzanie zbiórkami, podgląd wpłat i zarządzanie subskrypcją.

## Technologie

- **Framework:** Next.js 15 (App Router)
- **Baza danych:** Supabase (PostgreSQL + Auth)
- **Płatności:** Stripe Billing + Connect
- **Styling:** Tailwind CSS

## Wymagania

- Node.js 18+
- Konto Supabase
- Konto Stripe

## Instalacja

### 1. Zainstaluj zależności

```bash
cd dashboard
npm install
```

### 2. Skonfiguruj Supabase

1. Utwórz nowy projekt na [supabase.com](https://supabase.com)
2. Przejdź do SQL Editor i wykonaj schemat z pliku `../donations-saas-schema.sql`
3. W ustawieniach projektu znajdź:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - Anon Key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - Service Role Key (`SUPABASE_SERVICE_KEY`)

### 3. Skonfiguruj Stripe

1. Zaloguj się do [dashboard.stripe.com](https://dashboard.stripe.com)
2. Utwórz produkty i ceny:
   - **Plan miesięczny:** 49 zł/mies. (zapisz `price_id`)
   - **Plan roczny:** 499 zł/rok (zapisz `price_id`)
3. Znajdź klucze API:
   - Secret Key (`STRIPE_SECRET_KEY`)
   - Publishable Key (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)
4. Utwórz webhook endpoint:
   - URL: `https://twoja-domena.com/api/license/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
   - Zapisz Webhook Secret (`STRIPE_WEBHOOK_SECRET`)

### 4. Utwórz plik .env.local

```bash
cp .env.example .env.local
```

Wypełnij wartości:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx...

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Uruchom serwer deweloperski

```bash
npm run dev
```

Aplikacja będzie dostępna pod `http://localhost:3000`

## Struktura projektu

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── (auth)/               # Strony logowania/rejestracji
│   │   ├── login/
│   │   └── register/
│   ├── auth/callback/        # OAuth callback
│   └── dashboard/            # Panel zarządzania
│       ├── page.tsx          # Przegląd
│       ├── campaigns/        # Zbiórki
│       └── settings/         # Ustawienia + billing
├── components/
│   └── dashboard/
├── lib/
│   └── supabase/             # Klienty Supabase
└── middleware.ts             # Ochrona tras
```

## Deployment na Vercel

1. Połącz repozytorium z Vercel
2. Ustaw Root Directory na `dashboard`
3. Dodaj zmienne środowiskowe w ustawieniach projektu
4. Deploy

## API Endpoints (w głównym projekcie)

Dashboard korzysta z API z głównego projektu:

- `POST /api/license/checkout` - Tworzenie sesji płatności
- `GET /api/license/verify` - Weryfikacja licencji
- `POST /api/license/webhook` - Webhook Stripe
- `GET /api/connect/stripe` - Stripe Connect OAuth

## Licencja

Własnościowe - wszystkie prawa zastrzeżone.
