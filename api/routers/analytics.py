from fastapi import APIRouter, Request, Depends, Header
from dependencies import get_db
import pandas as pd

router = APIRouter()

#TODO align boundaries with 0000
@router.get("/api/stats/typing")
def get_typing_speed_history(request: Request, resolution: str = "15 minutes", lookback_time: str = "6 hours", x_user_id: str = Header(default=None), db = Depends(get_db)):
  return {
    "stats": pd.read_sql("""
      with recursive time_windows as (
          select now() - interval '%(lookback_time)s' as window_start
          union all
          select window_start + interval '%(resolution)s'
          from time_windows
          where window_start + interval '%(resolution)s' <= now()
      ),
      recent_events as (
        select * from typing_events 
        where 
          record_time >= now() - interval '%(lookback_time)s' and 
          user_id = '%(user_id)s'
      ),
      type_intervals as (
        select 
          user_id,
          window_start,
          source_url,
          session_id,
          record_time,
          lead(record_time) over (
            partition by user_id, window_start, source_url, session_id
            order by record_time asc
          ) - record_time  as interval_to_next_event,
          is_return as is_error
        from recent_events 
        join time_windows on 
          record_time >= window_start and 
          record_time < window_start + interval '%(resolution)s'
        order by record_time asc
      ),
      flows as (
        select 
          *,
          case 
            when lag(interval_to_next_event) over (
              partition by user_id, window_start, source_url, session_id 
              order by record_time asc
            ) > interval '5 seconds' then 1 
            else 0
          end as flow_indicator
        from type_intervals
      ),
      grouped_flows as (
        select 
          *,
          sum(flow_indicator) over (
            partition by user_id, window_start, source_url, session_id 
            order by record_time asc
          ) as flow_id
        from flows
      ),
      stats_by_flow as (
        select 
          user_id,
          window_start,
          source_url,
          session_id,
          flow_id,
          avg(extract(milliseconds from interval_to_next_event)) as avg_type_speed,
          count(*) as event_count,
          sum(cast(is_error as int)) as error_count
        from grouped_flows
        group by user_id, window_start, source_url,session_id,flow_id
        having count(*) > 1
      )
      select 
        u.user_id,
        b.window_start,
        sum(avg_type_speed * event_count) / sum(event_count) as speed,
        coalesce(
          stddev(avg_type_speed),
          0
        ) as volatility,
        coalesce(sum(event_count), 0) as event_count,
        coalesce(sum(error_count), 0) as error_count,
        coalesce(sum(error_count) / sum(event_count), 0) as relative_error
      from (select distinct user_id from stats_by_flow) u
      cross join time_windows b
      left join stats_by_flow s
        on s.window_start = b.window_start 
        and s.user_id = u.user_id
      where b.window_start < now() --and event_count > 1
      group by u.user_id, b.window_start
      order by b.window_start desc
    """, db.bind, params={"user_id": x_user_id, "lookback_time": lookback_time, "resolution": resolution}).to_json(orient="records")
  }

@router.get("/api/stats/top-sites")
def get_events_statistics(request: Request, x_user_id: str = Header(default=None), interval='1 month', db = Depends(get_db)):
  data = pd.read_sql("""
    with keyevents as (
        select 
            (regexp_matches(source_url, '^(?:https?:\/\/)?(?:[^@\/\n]+@)?([^:\/\n]+)', 'g'))[1] as url,
            *
        from typing_events 
        where 
          user_id=%(user_id)s and 
          record_time > now() - interval %(interval)s
    )
    select 
        url, count(*) 
    from keyevents
    group by url
    order by count(*) desc
    limit 10
  """, db.bind, params={"user_id": x_user_id, "interval": interval}).to_dict(orient="records")
  return {
    'data': data
  }

#TODO compute of typing_speed
@router.get("/api/stats/day-of-week")
def get_day_of_week_stats(request: Request, x_user_id: str = Header(default=None), interval='1 month', db = Depends(get_db)):
  data = pd.read_sql("""
    with user_keyevents as (
      select 
        * 
      from typing_events 
      where 
        user_id=%(user_id)s  and 
        record_time > now() - interval %(interval)s
    )
    select 
        to_char(record_time, 'Day'),
        count(*)
    from user_keyevents
    group by to_char(record_time, 'Day'), extract(dow from record_time)
    order by extract(dow from record_time)
  """, db.bind, params={"user_id": x_user_id, "interval": interval}).to_dict(orient="records")
  return {
    'data': data
  }