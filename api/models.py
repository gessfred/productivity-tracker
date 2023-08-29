from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text, Sequence
from sqlalchemy.ext.declarative import declarative_base
import os
Base = declarative_base()

schema = os.getenv("MAIN_APP_SCHEMA")
#db: Session = Depends(SessionLocal)


class User(Base):
  __tablename__ = "users"
  __table_args__ = {'schema': schema}

  id = Column(Integer, primary_key=True, index=True)
  username = Column(String, index=True, unique=True)
  email = Column(String, unique=True, index=True)
  password_digest = Column(String)

class Keystroke(Base):
  __tablename__ = "typing_events"
  __table_args__ = {'schema': schema}
  # For PostgreSQL:
  # keystroke_id = Column(Integer, primary_key=True, server_default=text("generated always as identity"))
  # For SQLite compatibility:
  keystroke_id = Column(Integer, Sequence('keystroke_id_seq'), primary_key=True)
    
  record_time = Column(DateTime)
  ingestion_time = Column(DateTime)
  batch_id = Column(String(32), nullable=False)
  session_id = Column(String(32), nullable=False)
  user_id = Column(Text, nullable=False)
  agent_description = Column(Text)
  source_url = Column(Text)
  is_end_of_word = Column(Boolean)
  is_end_of_line = Column(Boolean)
  is_return = Column(Boolean)