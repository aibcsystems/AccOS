# AccOS architecture

## Current runtime

```text
Browser
  ├─ Overview / Live Network
  │    └─ Supabase JS (publishable key)
  │         └─ public.get_accos_live_traffic() [SECURITY INVOKER]
  │              ├─ traffic.segments [RLS SELECT]
  │              └─ traffic.latest [security_invoker view]
  │                   └─ traffic.readings [RLS SELECT]
  └─ Simulation Lab (local synthetic junction model)

pg_cron
  ├─ 15-minute traffic-poll job [INACTIVE]
  │    └─ TomTom Traffic Flow [not supported for Ghana in published market coverage]
  └─ 14-day traffic-readings retention job [ACTIVE]
```

## Candidate next provider

```text
Google Routes API (TRAFFIC_AWARE)
  └─ restricted Edge Function secret
       └─ validated corridor origin/destination pairs
            └─ traffic.route_observations (planned, separate from traffic.readings)
                 └─ read-only corridor RPC
```

Google's Traffic Layer is available in Ghana according to its coverage table, but it is a visualization layer, not a raw per-segment speed feed. Routes API traffic-aware duration and static duration can support route-level delay estimates. Keep those measurements distinct from direct traffic speed observations.

## Trust boundaries

- Publishable key only in the browser.
- Browser database access is read-only through a narrow RPC.
- No frontend insert/update/delete path.
- No service-role key or provider credential in client code.
- Provider credentials remain Edge Function secrets.
- Simulation is local synthetic data and never enters observed readings or route observations.
- Route-level estimates must not be written into `traffic.readings` as direct segment speed.

## Deliberate constraints

- Existing traffic schema retained; no parallel database created.
- `traffic.latest` only returns observations from the previous 30 minutes.
- Missing readings remain missing. No synthetic speed or congestion estimate is shown in the live view.
- Map plots point samples, not road polylines. Coordinates remain unverified until checked.
- `verified` is an explicit validation flag, not inferred from provider success.
- TomTom polling is paused because Ghana is absent from its published Traffic Flow coverage.

## Next increments

1. Validate candidate corridor endpoints and road geometry.
2. Secure a Google Cloud project, restricted Routes API key and billing/quota controls.
3. Test a few traffic-aware routes in Accra.
4. Add a separate route-observation table and read-only RPC only after a successful proof of coverage.
5. Add historical corridor analytics after collection cadence and coverage are measured.
6. Seek a data partnership with the Department of Urban Roads for camera/traffic-center data.
