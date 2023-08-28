from sqlalchemy import create_engine, Column, Integer, String, MetaData
from sqlalchemy.ext.declarative import declarative_base
Base = declarative_base()

#db: Session = Depends(SessionLocal)

class User(Base):
  __tablename__ = "users"

  id = Column(Integer, primary_key=True, index=True)
  username = Column(String, index=True, unique=True)
  email = Column(String, unique=True, index=True)
  password_digest = Column(String)
