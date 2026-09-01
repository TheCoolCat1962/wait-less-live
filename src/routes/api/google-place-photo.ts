import { createFileRoute } from "@tanstack/react-router";

const PLACES_BASE = "https://places.googleapis.com/v1";

function getGoogleMapsKey() {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("Google Maps API key is not configured.");
  return key;
}

export const Route = createFileRoute("/api/google-place-photo")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const photoName = url.searchParams.get("photo")?.trim();
        const maxWidthPx = Number(url.searchParams.get("maxWidthPx") ?? "800");

        if (!photoName || !/^places\/[^/]+\/photos\/[^/]+$/.test(photoName)) {
          return new Response("Invalid photo reference", { status: 400 });
        }

        const width = Number.isFinite(maxWidthPx)
          ? Math.min(Math.max(Math.round(maxWidthPx), 64), 1600)
          : 800;
        const photoUrl = new URL(`${PLACES_BASE}/${photoName}/media`);
        photoUrl.searchParams.set("maxWidthPx", String(width));
        photoUrl.searchParams.set("skipHttpRedirect", "false");

        const response = await fetch(photoUrl, {
          headers: { "X-Goog-Api-Key": getGoogleMapsKey() },
        });

        if (!response.ok) {
          const body = await response.text();
          console.error(`Google photo request failed [${response.status}]: ${body}`);
          return new Response("Unable to load business photo", { status: response.status });
        }

        return new Response(response.body, {
          status: response.status,
          headers: {
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
            "Content-Type": response.headers.get("Content-Type") ?? "image/jpeg",
          },
        });
      },
    },
  },
});
