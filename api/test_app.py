from uuid import uuid4
from datetime import datetime
from app import app, database
from fastapi.testclient import TestClient 
from unittest.mock import MagicMock
client = TestClient(app)

def mock_db():
    return MagicMock()

app.dependency_overrides[database] = mock_db


def test_events_crud():
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
    res = client.post("/api/events/alice", json={"events": test_request})
    assert res.status_code == 200
    res = client.get("/api/events/alice")
    assert res.status_code == 200