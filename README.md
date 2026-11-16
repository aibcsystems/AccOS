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
- `traffic.readings` contains 0 live readings.
- `traffic-poll` Edge Function is deployed and scheduled every 15 minutes.
- Recent poll responses report `inserted: 0` and `http_401: 26` from TomTom. The function's own HTTP 200 response is not evidence of successful provider ingestion.
- The configured `TOMTOM_API_KEY` environment value is malformed for this provider request (670 characters) and must be replaced with a valid credential. The secret is not included here.
- Do not market this as a live traffic service until a valid provider credential, Ghana coverage and actual inserted observations have been verified.

All 26 coordinates are currently unverified sample points, not surveyed road geometries. Missing readings are shown as missing, never fabricated.

## Run locally

Serve this directory with a static HTTP server, e.g. `python3 -m http.server 8080`, then open `http://localhost:8080`.

## Supabase security model

The client calls `public.get_accos_live_traffic()`, a narrow `SECURITY INVOKER` SQL function. The function returns segment metadata and the latest 30-minute view only. Underlying tables retain RLS with SELECT-only policies for `anon` and `authenticated`; the browser has no insert, update or delete access. The `traffic` schema remains outside the configured PostgREST exposed-schema list, so the public RPC is the intended client entry point.

`config.js` contains only the Supabase URL and publishable key. Never put `service_role`, secret API keys, TomTom credentials or database passwords in frontend files.

## Recovery checklist

1. Replace the invalid `TOMTOM_API_KEY` Edge Function secret securely.
2. Confirm TomTom Traffic Flow returns valid `flowSegmentData` for Ghana coordinates and the account has the required product access.
3. Run a controlled poll and verify inserted rows, speed/free-flow values and timestamps.
4. Verify each segment coordinate against trusted road geometry before setting its `verified` flag.
5. Re-run Supabase security advisors and inspect Edge Function logs.

## Product boundary

AccOS is not yet a navigation or dispatch-routing service. The initial commercial wedge should be corridor-level operational intelligence for fleet, delivery and logistics operators, with measured data coverage and clear provenance.
