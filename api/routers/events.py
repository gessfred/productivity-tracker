from fastapi import APIRouter, Request, Depends, Header
from dependencies import get_db
from sqlalchemy import text, func
from datetime import datetime
from uuid import uuid4
from typing import Optional, List
from pydantic import BaseModel
from models import Keystroke, User

router = APIRouter()

class KeyEvent(BaseModel):
  record_time: datetime
  #ingestion_time: datetime written by route handler
  #batch_id: alternative to ingestion_time - same semantics
  #user_id: str comes from
  #agent_description: str
  session_id: str
  source_url: str
  is_end_of_word: bool
  is_end_of_line: bool
  is_return: bool


class KeystrokesBatch(BaseModel):
  events: List[KeyEvent]

def agent_description(request: Request):
  keys = ["host", "user-agent", "accept-language"]
  data = []
  for k in keys:
    data.append(request.headers.get(k, ''))
  return '#'.join(data)

@router.get("/api/events/count")
def get_keystrokes(request: Request, x_user_id: str = Header(default=None), db = Depends(get_db)):
  return {
    "count": db.query(func.count(User.user_id)).filter(User.username == x_user_id).scalar()#
  }

@router.post("/api/events")
def post_keystrokes(batch: KeystrokesBatch, request: Request, x_user_id: str = Header(default=None), db = Depends(get_db)):
  batch = batch.dict()
  ingestion_time = datetime.now()
  events = batch["events"]
  events = [Keystroke(
    ingestion_time=ingestion_time,
    user_id=x_user_id,
    batch_id=uuid4().hex,
    agent_description=agent_description(request),
    **event
  ) for event in events]
  db.add_all(events)
  db.commit()