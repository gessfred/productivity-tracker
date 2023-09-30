from tests.utils import get_docker_engine
from main import app
from dependencies import get_db
from fastapi.testclient import TestClient
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from dependencies import get_db, engine
from models import Base, User
from pytest import raises

app.dependency_overrides[get_db] = get_docker_engine
client = TestClient(app)
client.raise_server_exceptions = False

def test_user_signup(postgres_db):
  res = client.post("/api/signup", data={"username": "alice@example.com", "password": "1234"})
  assert res.status_code == 200
  response = res.json()
  assert "access_token" in response
  assert "refresh_token" in response
  res = client.post("/api/login", data={"username": "alice@example.com", "password": "1234"})
  assert res.status_code == 200

def test_login_unauthenticated_user(postgres_db):
  res = client.post("/api/login", data={"username": "bob@example.com", "password": "1234"})
  assert res.status_code == 400

def test_signup_existing_user(postgres_db):
  res = client.post("/api/signup", data={"username": "charlie@example.com", "password": "1234"})
  assert res.status_code == 200
  res = client.post("/api/signup", data={"username": "charlie@example.com", "password": "1234"})
  assert res.status_code == 400

def test_wrong_password(postgres_db):
  res = client.post("/api/signup", data={"username": "danilo@example.com", "password": "1234"})
  assert res.status_code == 200
  res = client.post("/api/login", data={"username": "danilo@example.com", "password": "abcd"})
  assert res.status_code == 400

def test_bearer_token(postgres_db):
  #with raises(HTTPException) as e:
  #  assert client.get("/api/version").status_code == 400
  res = client.post("/api/signup", data={"username": "fred@example.com", "password": "1234"})
  assert res.status_code == 200
  bearer = res.json()["access_token"]
  assert client.get(
    "/api/version",
    headers={
      "Authorization": "Bearer " + bearer 
    }
  ).status_code == 200

def test_refresh_token_does_not_grant_routes():
  pass

def test_tokens_eventually_expire():
  # generate token with expiration in the past
  # access endpoint with expired token and test returns 400
  pass

def test_tokens_contain_relevant_claims():
  pass

def test_token_refresh(postgres_db):
  res = client.post("/api/signup", data={"username": "alice@tiktoken.com", "password": "1234"})
  assert res.status_code == 200
  credentials1 = res.json()
  assert "access_token" in credentials1
  assert "refresh_token" in credentials1
  res = client.post("/api/token", headers={"Authorization": "Bearer " + credentials1["refresh_token"]})
  assert res.status_code == 200
  credentials2 = res.json()
  assert "access_token" in credentials2
  assert "refresh_token" in credentials2

def test_refresh_token_with_access_token_fails(postgres_db):
  res = client.post("/api/signup", data={"username": "bob@tiktoken.com", "password": "1234"})
  assert res.status_code == 200
  credentials1 = res.json()
  assert "access_token" in credentials1
  assert "refresh_token" in credentials1
  res = client.post("/api/token", headers={"Authorization": "Bearer " + credentials1["access_token"]})
  assert res.status_code == 400