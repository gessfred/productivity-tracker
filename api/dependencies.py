from sqlalchemy import create_engine, Column, Integer, String, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(DATABASE_URL)

Base = declarative_base()
Base.metadata.create_all(bind=engine)

SessionLocal = sessionmaker(bind=engine)

def get_db():
  db = SessionLocal()
  try:
    yield db
  finally:
    db.close()