with type_intervals as (
  select 
    source_url,
    session_id,
    record_time,
    lead(record_time) over (
      partition by source_url, session_id
      order by record_time asc
    ) - record_time  as interval_to_next_event
  from keyevents 
  where
    record_time > (now() - interval '15 minutes')
  order by record_time asc
),
flows as (
  select 
    *,
    case 
      when lag(interval_to_next_event) over (partition by source_url, session_id order by record_time asc) > interval '5 seconds' then 1 
      else 0
    end as flow_indicator
  from type_intervals
),
grouped_flows as (
  select 
    *,
    sum(flow_indicator) over (
      partition by source_url, session_id 
      order by record_time asc
    ) as flow_id
  from flows
),
stats_by_flow as (
  select 
    source_url,
    session_id,
    flow_id,
    avg(extract(milliseconds from interval_to_next_event)) as avg_type_speed,
    count(*) as event_count
  from grouped_flows
  --where interval_to_next_event < time '00:00:05.000000' -- shouldn't this be <5s (redundant)
  group by source_url,session_id,flow_id
  having count(*) > 1 -- TODO find a better filtering condition
  
)
select 
  sum(avg_type_speed * event_count) / sum(event_count) as speed, -- weighted average
  coalesce(
    stddev(avg_type_speed),
    0
  ) as volatility,
  sum(event_count) as event_count
from stats_by_flow
where event_count > 1
order by speed asc
