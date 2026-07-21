// Thin client for the Places API (New) HTTP endpoints, called directly via
// fetch rather than the Google Maps JavaScript SDK (web-only) or a native
// Places SDK — this way the same code works on web and native/Expo Go.
//
// Setup required (see README for details):
//   1. In Google Cloud Console, enable "Places API (New)" on the project.
//   2. Create an API key and set EXPO_PUBLIC_GOOGLE_PLACES_API_KEY in .env.
//   3. Restrict the key by HTTP referrer for web deployments. Native builds
//      need their own app-restricted key eventually; not required yet.
//
// NOT verified end-to-end against the live Google API with a real key —
// this environment has no key and no billing account to test one with.
// Verify once a real key is set, particularly for CORS behavior on web:
// testing here with a placeholder key showed the request hanging rather
// than failing fast (which is why fetches below are wrapped in a timeout),
// and it wasn't possible to tell whether that was a real CORS limitation
// or an artifact of this sandboxed environment's network proxy.

const PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
const REQUEST_TIMEOUT_MS = 8000;

export const isPlacesConfigured = Boolean(PLACES_API_KEY);

export type PlaceSuggestion = {
  placeId: string;
  text: string;
};

export type PlaceDetails = {
  formattedAddress: string;
  latitude: number;
  longitude: number;
};

export function generateSessionToken(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function fetchWithTimeout(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function autocompletePlaces(
  input: string,
  sessionToken: string,
): Promise<PlaceSuggestion[]> {
  if (!PLACES_API_KEY || !input.trim()) return [];

  const response = await fetchWithTimeout(
    "https://places.googleapis.com/v1/places:autocomplete",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": PLACES_API_KEY,
        "X-Goog-FieldMask":
          "suggestions.placePrediction.placeId,suggestions.placePrediction.text",
      },
      body: JSON.stringify({ input, sessionToken }),
    },
  );

  if (!response.ok) {
    throw new Error(`Places autocomplete request failed (${response.status})`);
  }

  const data = await response.json();
  const suggestions: any[] = data.suggestions ?? [];

  return suggestions
    .filter((s) => s.placePrediction)
    .map((s) => ({
      placeId: s.placePrediction.placeId as string,
      text: (s.placePrediction.text?.text as string) ?? "",
    }));
}

export async function getPlaceDetails(
  placeId: string,
  sessionToken: string,
): Promise<PlaceDetails> {
  if (!PLACES_API_KEY) {
    throw new Error("Places API is not configured");
  }

  const response = await fetchWithTimeout(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?sessionToken=${encodeURIComponent(sessionToken)}`,
    {
      headers: {
        "X-Goog-Api-Key": PLACES_API_KEY,
        "X-Goog-FieldMask": "formattedAddress,location",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Place details request failed (${response.status})`);
  }

  const data = await response.json();

  return {
    formattedAddress: data.formattedAddress,
    latitude: data.location?.latitude,
    longitude: data.location?.longitude,
  };
}
