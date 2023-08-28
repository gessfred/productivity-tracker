from fastapi import APIRouter, Request, Depends
from dependencies import get_db
from sqlalchemy import text

router = APIRouter()

@router.get("/api/events/count")
def get_keystrokes(request: Request, db = Depends(get_db)):
  return {
    "count": db.execute(text("SELECT COUNT(*) FROM typing_events")).fetchone()[0]
  }