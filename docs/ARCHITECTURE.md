# AccOS architecture

## Runtime

```text
Browser
  ├─ Overview / Live Network
  │    └─ Supabase JS (publishable key)
  │         └─ public.get_accos_live_traffic() [SECURITY INVOKER]
  │              ├─ traffic.segments [RLS SELECT]
  │              └─ traffic.latest [security_invoker view]
  │                   └─ traffic.readings [RLS SELECT]
  └─ Simulation Lab (local synthetic junction model)

pg_cron (15 minutes)
  └─ traffic-poll Edge Function [JWT required]
       └─ TomTom Traffic Flow API
            └─ traffic.readings (server-side writer)
```

## Trust boundaries

- Publishable key only in the browser.
- Browser database access is read-only through one narrow RPC.
- No frontend insert/update/delete path.
- No service-role key or provider credential in client code.
- Traffic ingestion credential remains an Edge Function secret.
- Simulation is local synthetic data and never enters the observed readings table.

## Deliberate constraints

- Existing traffic schema retained; no parallel database created.
- `traffic.latest` only returns observations from the previous 30 minutes.
- Missing readings remain missing. No synthetic speed or congestion estimate is shown in the live view.
- Map plots point samples, not road polylines. Coordinates remain unverified until checked.
- `verified` is an explicit validation flag, not inferred from provider success.

## Next increments

1. Restore authenticated provider ingestion and verify Ghana coverage.
2. Validate all road locations and segment identity.
3. Add provider provenance and health records before introducing multiple sources.
4. Add historical corridor analytics after coverage and cadence are measured.
5. Replace sample points with validated road geometry.
