import postgres from "npm:postgres@3.4.4";

const MIN_GAP_MS = 10 * 60 * 1000;
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async () => {
  const raw = Deno.env.get("TOMTOM_API_KEY");
  if (!raw) return json({ ok: false, error: "provider_not_configured" }, 503);
  const key = raw.trim().replace(/^[\"']|[\"']$/g, "");
  if (key.length < 20 || key.length > 128) {
    return json({ ok: false, error: "provider_credential_invalid_format" }, 503);
  }
  const dbUrl = Deno.env.get("SUPABASE_DB_URL");
  if (!dbUrl) return json({ ok: false, error: "database_connection_not_configured" }, 503);

  const sql = postgres(dbUrl, { max: 1, prepare: false });
  try {
    const [last] = await sql`select max(fetched_at) as t from traffic.readings`;
    if (last.t && Date.now() - new Date(last.t).getTime() < MIN_GAP_MS) {
      return json({ ok: true, skipped: "polled_recently" });
    }
    const segs = await sql`select id, lat, lon from traffic.segments order by id`;
    const rows: Record<string, unknown>[] = [];
    const errors: Record<string, number> = {};
    const bad = (reason: string) => { errors[reason] = (errors[reason] ?? 0) + 1; };

    const fetchOne = async (s: { id: string; lat: number; lon: number }) => {
      try {
        const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${s.lat},${s.lon}&unit=KMPH&key=${encodeURIComponent(key)}`;
        const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!response.ok) { bad(`http_${response.status}`); return; }
        const payload = await response.json();
        const data = payload?.flowSegmentData;
        if (!data || typeof data.currentSpeed !== "number" || typeof data.freeFlowSpeed !== "number") {
          bad("invalid_provider_payload"); return;
        }
        rows.push({
          segment_id: s.id,
          speed_kmh: data.currentSpeed,
          free_kmh: data.freeFlowSpeed,
          confidence: typeof data.confidence === "number" ? Math.min(Math.max(data.confidence, 0), 1) : null,
          closed: data.roadClosure === true,
        });
      } catch { bad("network_or_timeout"); }
    };

    for (let i = 0; i < segs.length; i += 8) {
      await Promise.all(segs.slice(i, i + 8).map(fetchOne));
    }
    if (rows.length) {
      await sql`insert into traffic.readings ${sql(rows, "segment_id", "speed_kmh", "free_kmh", "confidence", "closed")}`;
    }
    const failed = Object.values(errors).reduce((sum, count) => sum + count, 0);
    if (!rows.length) {
      console.error("traffic-poll: no provider observations inserted", errors);
      return json({ ok: false, error: "no_provider_observations", inserted: 0, failed, errors }, 502);
    }
    return json({ ok: true, inserted: rows.length, failed, errors });
  } catch (error) {
    console.error("traffic-poll database or execution failure", error);
    return json({ ok: false, error: "poll_execution_failed" }, 500);
  } finally {
    await sql.end({ timeout: 2 });
  }
});
