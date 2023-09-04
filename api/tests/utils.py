from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from dependencies import get_db, engine
from models import Base, User
import os

os.environ["JWT_SECRET_KEY"] = "oth42obgtwknbwl2ngl2np2non24ongtonh2gn2ngpwn"

SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
Base.metadata.create_all(bind=engine)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
  try:
    db = TestingSessionLocal()
    yield db
  finally:
    db.close()