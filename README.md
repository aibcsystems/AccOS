# AccOS · Accra Traffic Intelligence

An early-stage corridor intelligence workspace for Accra, Ghana. AccOS separates provider observations from synthetic traffic simulation and makes data freshness and coordinate verification visible.

## Current implementation

- Responsive dashboard: Overview, Live Network, Simulation Lab and Data Integrity.
- Supabase read-only feed via `public.get_accos_live_traffic()`.
- Existing `traffic.segments`, `traffic.readings` and `traffic.latest` schema retained.
- Browser uses a public publishable key only. No service-role key or provider secret is shipped to the client.
- Simulation is generated locally and never written into the live observations table.

## Verified backend status (16 Nov 2026)

- Supabase project: `jgmpodbamtqhofdocvdo`, region `eu-west-2`, PostgreSQL 17.11.
- 26 configured road sample points; 0 marked geographically verified.
- `traffic.readings` contains 0 live readings at the last audit.
- `traffic-poll` Edge Function v6 is deployed in fail-closed mode, but its 15-minute cron job is now inactive.
- Recent TomTom requests returned HTTP 401 for all 26 sample points.
- TomTom's published Traffic API market-coverage list does not include Ghana. Correcting the malformed key alone would not establish Accra coverage.
- Google Maps Platform lists Ghana for Traffic Layer and Driving Directions / Snap to Roads. Google Routes API traffic-aware duration is a promising candidate for limited corridor-level estimates, not direct segment speed observations.
- No Google provider credential has been configured and no Google traffic data has been ingested.

All 26 coordinates are currently unverified sample points, not surveyed road geometries. Missing readings are shown as missing, never fabricated.

## Run locally

Serve this directory with a static HTTP server, e.g. `python3 -m http.server 8080`, then open `http://localhost:8080`.

## Supabase security model

The client calls `public.get_accos_live_traffic()`, a narrow `SECURITY INVOKER` SQL function. The function returns segment metadata and the latest 30-minute view only. Underlying tables retain RLS with SELECT-only policies for `anon` and `authenticated`; the browser has no insert, update or delete access. The `traffic` schema remains outside the configured PostgREST exposed-schema list, so the public RPC is the intended client entry point.

`config.js` contains only the Supabase URL and publishable key. Never put `service_role`, secret API keys, Google Maps API keys or database passwords in frontend files.

## Recovery and next-provider plan

1. Do not continue rotating TomTom credentials for Ghana unless TomTom confirms Traffic Flow access in writing.
2. Validate the origin/destination points for a small set of Accra corridors against trusted road geometry.
3. Create a Google Cloud project, enable Routes API, configure billing, restrict the key to Routes API and set quotas/budget alerts.
4. Store the key only as an Edge Function secret.
5. Test a few `TRAFFIC_AWARE` routes and verify `duration`, `staticDuration` and `distanceMeters`.
6. Store route-level estimates in a separate table, not `traffic.readings`.
7. Re-run Supabase security advisors and end-to-end checks before release.

## Product boundary

AccOS is not yet a navigation or dispatch-routing service. The initial commercial wedge should be corridor-level operational intelligence for fleet, delivery and logistics operators, with measured data coverage and clear provenance.
