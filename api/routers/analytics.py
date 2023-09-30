from fastapi import APIRouter, Request, Depends, Header
from dependencies import get_db
import pandas as pd

router = APIRouter()

@router.get("/api/stats/typing")
def get_typing_speed_current(request: Request, x_user_id: str = Header(default=None), db = Depends(get_db)):
  x_user_id = x_user_id.replace("'", "")
  return {
    "stats": pd.read_sql(f"""
      select * from typing_speed_current where user_id = '{x_user_id}'
    """, db.bind).to_json(orient="records")
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
  """, db.bind, params={"user_id": x_user_id, "interval": interval}).to_dict(orient="records")
  return {
    'data': data
  }