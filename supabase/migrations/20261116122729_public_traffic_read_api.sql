create or replace function public.get_accos_live_traffic()
returns table (
  id text, road text, leg integer, lat double precision, lon double precision,
  verified boolean, speed numeric, free numeric, confidence numeric,
  closed boolean, fetched_at timestamptz
)
language sql stable security definer
set search_path = pg_catalog
as $function$
  select s.id, s.road, s.leg, s.lat, s.lon, s.verified,
         l.speed, l.free, l.confidence, l.closed, l.fetched_at
  from traffic.segments s
  left join traffic.latest l on l.id = s.id
  order by s.road, s.leg;
$function$;

revoke all on function public.get_accos_live_traffic() from public;
grant execute on function public.get_accos_live_traffic() to anon, authenticated;

comment on function public.get_accos_live_traffic() is
  'Read-only AccOS public feed. Returns segment metadata and latest observations only.';
