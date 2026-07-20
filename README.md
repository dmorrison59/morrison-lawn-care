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

Database migrations live in `supabase/migrations/`.
