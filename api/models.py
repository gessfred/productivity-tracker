from sqlalchemy import create_engine, Column, Integer, String, MetaData
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

class TypingEvent(Base):
  __tablename__ = "typing_events"
  __table_args__ = {'schema': schema}

  id = Column(Integer, primary_key=True, index=True)
  username = Column(String, index=True, unique=True)
  email = Column(String, unique=True, index=True)
  password_digest = Column(String)