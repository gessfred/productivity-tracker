from fastapi import FastAPI, Depends, Request

from routers import auth, events, analytics
from dependencies import get_db, engine, Base

app = FastAPI()
app.include_router(auth.router)
app.include_router(events.router)
app.include_router(analytics.router)
app.add_middleware(auth.JWTMiddleware)

EVENTS_TABLE = "keyevents"

@app.get("/api/events/{userId}/statistics")
def get_events_statistics(request: Request, userId: str, interval: str = '1 hour', offset_count: int = 0, db = Depends(get_db)):
  #No SQL injection possible as the type is enforced... actually yes, as interval string can be bad #TODO fix urgently
  offset = ' '.join([f"- INTERVAL '{interval}'"] * offset_count) 
  data = db.query(f"""
    with user_keyevents as (
      select * from keyevents where user_id=%s
    ), last_hour_events as (
        select 
            * 
        from user_keyevents 
        where 
          record_time > NOW() - INTERVAL %s {offset} and
          record_time <= NOW() {offset}
    ), word_count as (
        select 
            count(*) as word_count
        from last_hour_events 
        where is_end_of_word is true or is_end_of_line is true 
    ),
    returns_count as (
        select
            count(*) as error_count
        from last_hour_events
        where is_return is true
    ),
    total_count as (
        select
            count(*) as total_count
        from last_hour_events
    )
    select 
        total_count,
        error_count,
        word_count
    from word_count, returns_count, total_count
  """, (userId, interval))
  return {
    'data': data
  }

#TODO add weeks offset
@app.get("/api/events/{userId}/analytics/time-of-day")
def get_events_statistics(request: Request, userId: str, interval: str = '1 hour', bucket_width='15 minutes', db = Depends(get_db)):
  data = db.query(f"""
    with user_keyevents as (
      select * from keyevents
      where 
        user_id=%s and 
        record_time > now() - interval %s
    ), bucketed as (
        select 
          date_bin(
              %s, 
              record_time, 
              date_trunc('day', record_time) 
          ) as trunc,
          date_trunc('day', record_time) as day
        from user_keyevents 
    ), strokes_times as (
        select 
          extract('hour' from trunc)::smallint as hour,
          extract('minute' from trunc)::smallint as minute,
          day
        from bucketed
    ), final_form as (
        select
            day,
            hour,
            minute,
            count(*) as strokes_count
        from strokes_times REF
        group by day, hour, minute
        order by day, hour, minute asc
    ), averaged as (
        select 
            hour, minute, avg(strokes_count) as strokes_count
        from final_form
        group by hour, minute
    ) select 
        hour, minute, --lpad(hour::text, 2, '0')|| ':' || lpad(minute::text, 2, '0'), 
        strokes_count 
    from averaged 
    order by hour, minute
  """, (userId, interval, bucket_width))
  return {
    'data': data
  }

@app.get("/api/events/{userId}/analytics/day-of-week")
def get_events_statistics(request: Request, userId: str, interval='1 month', db = Depends(get_db)):
  data = db.query(f"""
    with user_keyevents as (
      select * from keyevents where user_id=%s  and record_time > now() - interval %s
    )
    select 
        to_char(record_time, 'Day'),
        count(*)
    from user_keyevents
    group by to_char(record_time, 'Day'), extract(dow from record_time)
    order by extract(dow from record_time)
  """, (userId,interval))
  return {
    'data': data
  }

@app.get("/api/events/{userId}/analytics/top-sites")
def get_events_statistics(request: Request, userId: str, interval='1 month', db = Depends(get_db)):
  data = db.query(f"""
    with keyevents as (
        select 
            (regexp_matches(source_url, '^(?:https?:\/\/)?(?:[^@\/\n]+@)?([^:\/\n]+)', 'g'))[1] as url,
            *
        from keyevents 
        where 
          user_id=%s and 
          record_time > now() - interval %s
    )
    select 
        url, count(*) 
    from keyevents
    group by url
    order by count(*) desc
  """, (userId,interval))
  return {
    'data': data
  }

@app.get("/api/version")
def get_version():
  return "0.2.0"

@app.on_event("startup")
def startup():
  Base.metadata.create_all(bind=engine)