from tests.utils import override_get_db
from uuid import uuid4
from datetime import datetime
from main import app
from fastapi.testclient import TestClient
from dependencies import get_db

client = TestClient(app)

app.dependency_overrides[get_db] = override_get_db


def test_insert_single_event():
  res = client.post("/api/signup", data={"username": "jean@example.com", "password": "1234"})
  token = res.json()["access_token"]
  test_request = [
    {
      "record_time": str(datetime.now()),
      "session_id": uuid4().hex,
      "source_url": "google.com",
      "is_end_of_word": False,
      "is_end_of_line": False,
      "is_return": False
    }
  ]
  res = client.post(
    "/api/events", 
    json={"events": test_request},
    headers={"Authorization": "Bearer " + token}
  )
  assert res.status_code == 200
  res = client.get(
    "/api/events/count",
    headers={"Authorization": "Bearer " + token}
  )
  assert res.status_code == 200
  assert res.json() == {"count": 1}
  #res = client.get("/api/events/alice/count")