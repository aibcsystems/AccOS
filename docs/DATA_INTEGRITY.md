# Data integrity register

| Area | Verified state at implementation | Product treatment |
|---|---|---|
| Configured segments | 26 rows in `traffic.segments` | Show as sample points |
| Coordinate verification | 0 of 26 marked verified | Explicitly unverified |
| Traffic readings | 0 rows at audit time | No live observations |
| TomTom poller | Deployed; scheduled every 15 minutes | Do not claim live ingestion |
| TomTom provider responses | HTTP 401 for all 26 sample points in recent logs | Provider blocked |
| Read API | `public.get_accos_live_traffic()` returns 26 segment records | Read-only client feed |
| Security advisors | No security lints after RLS/invoker migration | Recheck after future changes |

## Provider diagnosis

The last recorded poll response before the v5 hardening reported `ok: true`, `inserted: 0`, and `errors: { "http_401": 26 }`. The HTTP 200 was the function's own response, not proof that the provider returned data.

The `TOMTOM_API_KEY` Edge Function environment value measured 670 characters and TomTom rejected it. The key is not included in the repository or logs. Edge Function v5 now rejects malformed credential lengths before making provider requests and returns an error status if no observations are inserted. A valid credential is still required.

## Verification rules

- Do not set `verified = true` because a row exists or a provider call succeeds.
- Do not infer speed, congestion, closure or travel time without a fresh provider observation.
- Store timestamps in UTC; display Ghana local time.
- Preserve source and freshness metadata as more providers are added.
