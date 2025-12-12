# CLAUDE.md - Donation Framer Plugin

## Project Overview
Framer plugin for donation campaigns with Stripe payments, Supabase database, and Vercel serverless API.

## Tech Stack
- **Frontend Builder:** Vite + TypeScript
- **Components:** React (generated code for Framer)
- **API:** Vercel Serverless Functions
- **Database:** Supabase (PostgreSQL)
- **Payments:** Stripe Checkout
- **Storage:** Supabase Storage (images)

## Project Structure
```
donation-framer-plugin-v2/
├── api/                    # Vercel serverless functions
│   ├── campaigns/          # CRUD for campaigns
│   ├── donations/          # Donations list
│   ├── checkout/           # Stripe checkout session
│   ├── webhook/            # Stripe webhook handler
│   ├── settings/           # App settings (logo, etc.)
│   ├── upload/             # Image upload to Supabase
│   └── version/            # Plugin version endpoint
├── src/
│   └── components/         # Component code generators
│       ├── DonationWidget.ts
│       └── DonationGrid.ts
├── public/
│   └── admin/              # Admin panel (static HTML)
├── dist/                   # Built files (component builder)
└── supabase/               # Database schema
```

## Key Commands
```bash
# Development
npm run dev

# Build
npm run build

# Deploy (automatic via Vercel Git integration)
git push
```

## Component Builder
The app at `localhost:5173` (dev) or deployed URL generates React code that users copy-paste into Framer.

---

## CRITICAL - Version Management

### When to Update Version
**ALWAYS increment version when making ANY changes to:**
- `src/components/DonationWidget.ts`
- `src/components/DonationGrid.ts`
- Any API endpoint that affects component behavior

### How to Update Version
1. **Increment version** in `api/version/index.ts`:
   ```typescript
   export const PLUGIN_VERSION = "1.0.1"  // was "1.0.0"
   ```

2. **Update changelog** in `api/version/index.ts`:
   ```typescript
   changelog: "Opis wprowadzonych zmian"
   ```

3. **Update component versions** - change `COMPONENT_VERSION` in BOTH files:
   - `src/components/DonationWidget.ts`
   - `src/components/DonationGrid.ts`

### Version Format
Use semantic versioning: `MAJOR.MINOR.PATCH`
- PATCH (1.0.X): Bug fixes, small improvements
- MINOR (1.X.0): New features, non-breaking changes
- MAJOR (X.0.0): Breaking changes

### Example Version Update
```typescript
// api/version/index.ts
export const PLUGIN_VERSION = "1.0.1"
// ...
changelog: "Naprawiono wyświetlanie zdjęć w opisie"

// src/components/DonationWidget.ts (line ~35)
const COMPONENT_VERSION = "1.0.1"

// src/components/DonationGrid.ts (line ~35)
const COMPONENT_VERSION = "1.0.1"
```

---

## Image Placeholders in Description
Users can embed gallery images in description text using `[1]`, `[2]`, etc.
- `[1]` = first image from gallery
- Images used in description won't appear in gallery section

## Admin Panel
Located at `/admin/` - requires API key for authentication.

## AI Assistant Guidelines

### Permissions
- Full access to all files
- Can run build commands
- Can make API calls for testing

### After Making Component Changes
1. **ALWAYS update version** (see above)
2. Run `npm run build`
3. Test in browser if needed

### Code Style
- TypeScript for all code
- Inline styles in components (no external CSS - Framer limitation)
- Polish UI text, English code comments
- Double-escape regex in template strings: `/\\[(\\d+)\\]/g`
