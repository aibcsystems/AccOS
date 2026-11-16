# Data integrity register

| Area | Verified state | Product treatment |
|---|---|---|
| Configured segments | 26 rows in `traffic.segments` | Show as sample points |
| Coordinate verification | 0 of 26 marked verified | Explicitly unverified |
| Traffic readings | 0 rows at last database audit | No live observations |
| TomTom poller | Edge Function v5 deployed | Do not use for Ghana |
| TomTom Traffic Flow coverage | Ghana absent from published coverage list | Provider rejected for this market |
| TomTom cron job | Inactive, preserved | No repeated unsupported requests |
| Retention cron job | Active; 14-day retention | Preserve cleanup |
| Read API | `public.get_accos_live_traffic()` returns segment metadata | Read-only client feed |
| Security advisors | No security lints at last check | Recheck after future changes |
| Performance advisors | No performance lints at last check | Recheck after future changes |

## Provider diagnosis

Recent TomTom calls returned HTTP 401 for all 26 sample points. The configured `TOMTOM_API_KEY` environment value was malformed (670 characters). Separately, TomTom's published Traffic API market-coverage list does not include Ghana. Correcting the credential alone is not a viable Accra ingestion plan unless TomTom confirms market access in writing.

The 15-minute cron job was deactivated using `cron.alter_job(job_id := 2, active := false)`. It was not deleted. The 14-day retention job remains active. Database verification confirmed job 2 is inactive and job 1 remains active.

## Google candidate

Google's country coverage table lists Ghana with Traffic Layer and Driving Directions / Snap to Roads support. This does not establish that the Traffic Layer exposes raw speed data. The Routes API returns traffic-aware `duration` and non-traffic `staticDuration`; these are route-level estimates, not direct segment sensor readings.

Any Google route data must be stored separately from `traffic.readings`, with origin/destination, distance, both durations, provider, capture time and freshness.

## Verification rules

- Do not set `verified = true` because a row exists or a provider call succeeds.
- Do not infer speed, congestion, closure or travel time without a fresh provider observation.
- Do not mislabel route-level ETA estimates as direct road-segment speed observations.
- Store timestamps in UTC; display Ghana local time.
- Preserve source and freshness metadata as more providers are added.
