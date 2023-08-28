from main import app
from dependencies import get_db
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from dependencies import get_db, engine
from models import Base, User

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

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_user_signup():
  res = client.post("/signup", data={"email": "alice@example.com", "password": "1234"})
  assert res.status_code == 200
  response = res.json()
  assert "access_token" in response
  assert "refresh_token" in response
  # assert login works

def test_login_unauthenticated_user():
  pass

def test_wrong_password():
  pass

def test_bearer_token():
  pass