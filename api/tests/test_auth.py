from main import app
from dependencies import get_db
from fastapi.testclient import TestClient
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from dependencies import get_db, engine
from models import Base, User
from tests.utils import override_get_db
from pytest import raises

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)
client.raise_server_exceptions = False

def test_user_signup():
  res = client.post("/api/signup", data={"username": "alice@example.com", "password": "1234"})
  assert res.status_code == 200
  response = res.json()
  assert "access_token" in response
  assert "refresh_token" in response
  res = client.post("/api/login", data={"username": "alice@example.com", "password": "1234"})
  assert res.status_code == 200

def test_login_unauthenticated_user():
  res = client.post("/api/login", data={"username": "bob@example.com", "password": "1234"})
  assert res.status_code == 400

def test_signup_existing_user():
  res = client.post("/api/signup", data={"username": "charlie@example.com", "password": "1234"})
  assert res.status_code == 200
  res = client.post("/api/signup", data={"username": "charlie@example.com", "password": "1234"})
  assert res.status_code == 400

def test_wrong_password():
  res = client.post("/api/signup", data={"username": "danilo@example.com", "password": "1234"})
  assert res.status_code == 200
  res = client.post("/api/login", data={"username": "danilo@example.com", "password": "abcd"})
  assert res.status_code == 400

def test_bearer_token():
  with raises(HTTPException) as e:
    assert client.get("/api/version").status_code == 400
  res = client.post("/api/signup", data={"username": "fred@example.com", "password": "1234"})
  assert res.status_code == 200
  bearer = res.json()["access_token"]
  assert client.get(
    "/api/version",
    headers={
      "Authorization": "Bearer " + bearer 
    }
  ).status_code == 200

def test_tokens_eventually_expire():
  pass

def test_tokens_contain_relevant_claims():
  pass

def test_token_refresh():
  pass