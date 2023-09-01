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