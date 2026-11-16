# AccOS provider strategy

## Decision: retire TomTom Traffic Flow for Ghana

TomTom's published Traffic API market-coverage tables list six African markets for Traffic Flow and Traffic Incidents: Egypt, Kenya, Lesotho, Morocco, Mozambique and South Africa. Ghana is not listed. TomTom's routing coverage does list Ghana, but routing availability must not be mistaken for real-time traffic coverage.

Sources:
- https://docs.tomtom.com/traffic-api/documentation/tomtom-orbis-maps/v2/product-information/market-coverage
- https://docs.tomtom.com/traffic-api/documentation/tomtom-maps/v1/product-information/market-coverage
- https://docs.tomtom.com/routing-api/documentation/tomtom-orbis-maps/v3/product-information/market-coverage

The existing AccOS poller received HTTP 401 responses for all 26 configured sample points. The configured TomTom secret was also malformed. Fixing that secret would not resolve the separate Ghana market-coverage gap. Do not spend time or money rotating a TomTom key for this integration without written confirmation from TomTom that Accra Traffic Flow is enabled for the account.

The 15-minute TomTom cron job has been deactivated, not deleted. The 14-day readings-retention job remains active. This prevents repeated, unproductive provider calls while preserving a reversible schedule.

## Candidate: Google Maps Platform

Google's current country coverage table lists Ghana as available for:
- Traffic Layer
- Driving Directions / Snap to Roads

This establishes that a Google traffic visualization layer is available in Ghana. It does not mean Google offers a raw feed of per-road speed observations through the Traffic Layer.

For operational measurements, evaluate Routes API Compute Routes with:
- `travelMode: DRIVE`
- `routingPreference: TRAFFIC_AWARE`
- departure time set to the current time
- response fields `routes.distanceMeters`, `routes.duration`, `routes.staticDuration`, and `routes.polyline`

Google documents `duration` as the traffic-aware estimate and `staticDuration` as the estimate without traffic. Their difference can support corridor delay indicators. It is not a direct sensor speed measurement and must be labelled as a route-level traffic estimate.

Sources:
- https://developers.google.com/maps/coverage
- https://developers.google.com/maps/documentation/routes/reference/rest/v2/TopLevel/computeRoutes
- https://developers.google.com/maps/documentation/routes/config_trade_offs
- https://developers.google.com/maps/documentation/routes/usage-and-billing

## Cost controls

The published Routes API price list currently shows a 5,000-request monthly free usage cap for Compute Routes Pro, followed by USD 10 per 1,000 requests in the first paid tier. Traffic-aware routing is a Pro feature. Billing must still be enabled on the Google Cloud project, and pricing/terms must be rechecked before launch.

A controlled pilot should measure a small number of verified origin-destination corridors only a few times daily, rather than polling every sample point every 15 minutes. For example, 10 corridors × 3 daily collection windows × 30 days = 900 Compute Routes requests/month, below the published 5,000-request cap if all requests remain in the same SKU and account. This is a planning estimate, not a price guarantee.

Never place a Google Maps API key in the browser bundle. Restrict it to the Routes API and store it as an Edge Function secret. Set API quotas and billing alerts before enabling scheduled collection.

## Data-model boundary

Do not write Google route estimates into `traffic.readings` as if they were direct segment-speed observations. The existing table represents point/segment speed observations. Route-level estimates need a separate table and API response with explicit fields for:
- origin and destination / corridor identity
- route distance
- traffic-aware duration
- static duration
- provider and provider product
- captured timestamp
- route geometry / polyline where permitted by Google terms
- status and freshness

Only enable a corridor after its origin and destination have been validated against road geography. Existing sample points remain unverified and are not automatically eligible.

## Parallel data partnership

The Ghana Department of Urban Roads says its Traffic Management Center monitors 102 cameras on the Achimota-to-CBD pilot corridor. The public information does not establish that external developers can access those feeds. Treat DUR as a potential data partner, not as an available API.

Source: https://dur.gov.gh/planning-and-development/

## Release gate

No live-traffic claim until all of the following are true:
1. The provider product explicitly supports Ghana / Accra.
2. A restricted credential is configured server-side.
3. At least one selected corridor has validated endpoints.
4. A controlled call returns a traffic-aware and static duration.
5. The observation is stored with source, timestamp, units and correct route-level semantics.
6. Freshness, failure and quota behaviour are tested.
