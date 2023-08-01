with type_intervals as (
  select 
    source_url,
    session_id,
    record_time,
    lead(record_time) over (
      partition by session_id
      order by record_time asc
    ) - record_time  as interval_to_next_event
  from keyevents 
  where
    record_time > (now() - interval '3 days')
  order by record_time asc
),
flows as (
  select 
    *,
    case 
      when interval_to_next_event > time '00:00:05.000000' then 1 
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
    avg(interval_to_next_event) as avg_type_speed,
    min(date_bin('15 minutes', record_time, date_trunc('day', record_time))) as from_date,
    max(record_time) as to_date,
    count(*) as event_count
  from grouped_flows 
  where interval_to_next_event < time '00:00:05.000000'
  group by source_url,session_id,flow_id
  
)
select 
  extract(hour from from_date) || ':' || extract(minute from from_date) as time_bin,
  extract(milliseconds from avg(avg_type_speed)) as speed,
  coalesce(
    stddev(extract(milliseconds from avg_type_speed)),
    0
  ) as volatility,
  sum(event_count) as event_count
from stats_by_flow
where event_count > 5
group by 1
order by speed asc
