# morrison-lawn-care

Expo (React Native) app backed by Supabase.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in your Supabase project's URL and anon key:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. `npm run web` (or `npm run ios` / `npm run android`)

### Address autocomplete (optional)

Customer and property address fields use address autocomplete (Places API
(New)), which requires its own Google Cloud setup separate from Supabase:

1. In [Google Cloud Console](https://console.cloud.google.com/), enable **Places API (New)** on a project with billing enabled (a free monthly credit covers moderate usage, but a billing account must be attached).
2. Create an API key under APIs & Services → Credentials.
3. Restrict the key: for web, restrict by HTTP referrer to the domain(s) the app is served from. Native builds (iOS/Android) need their own app-restricted key eventually (by bundle ID / package name + SHA-1); not required for local dev.
4. Set `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` in `.env`.

If this project already has a Google Maps API key/project reserved for the
planned route-mapping phase, the same project can likely be reused — Places
API (New) just needs to be enabled on it separately from the Maps
JavaScript/SDK APIs, since Google gates each API individually even within one
project.

Without this key set, address fields fall back to plain text inputs with no
autocomplete and no lat/lng lookup — nothing breaks, it just doesn't
autocomplete.

Database migrations live in `supabase/migrations/`.
