Deno.serve(() => {
  console.warn("traffic-poll disabled: TomTom Traffic Flow does not list Ghana in published market coverage.");
  return new Response(
    JSON.stringify({
      ok: false,
      error: "provider_not_supported_in_market",
      provider: "tomtom",
      market: "GH",
      message: "TomTom Traffic Flow ingestion is disabled for Ghana pending written provider confirmation.",
    }),
    {
      status: 503,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    },
  );
});
