from tests.utils import get_docker_engine
from main import app
from fastapi.testclient import TestClient
from dependencies import get_db
from datetime import datetime
from uuid import uuid4
from random import randint
client = TestClient(app)

app.dependency_overrides[get_db] = get_docker_engine

def get_test_user():
    res = client.post("/api/signup", data={"username": f"alice{randint(1000, 2000)}@topsites.com", "password": "1234"})
    assert res.status_code == 200
    headers = {"Authorization": "Bearer " + res.json()["access_token"] }
    return headers

def test_top_sites_empty(postgres_db):
    headers = get_test_user()    
    res = client.get("/api/stats/top-sites", 
        headers=headers
    )
    assert res.status_code == 200
    assert len(res.json()["data"]) == 0, res.json()

def generate_event(url):
    return {
        "record_time": str(datetime.now()),
        "session_id": uuid4().hex,
        "source_url": url,
        "is_end_of_word": False,
        "is_end_of_line": False,
        "is_return": False
    }

def test_top_sites_ranking(postgres_db):
    headers = get_test_user()
    test_request = [generate_event("google.com") for _ in range(3)] + [generate_event("facebook.com")]
    res = client.post(
        "/api/events", 
        json={"events": test_request},
        headers=headers
    )
    assert res.status_code
    res = client.get("/api/stats/top-sites",
        headers=headers
    )
    assert res.status_code == 200
    stats = res.json()["data"]
    assert len(stats) == 2, stats
    assert stats[0]["url"] == "google.com"
    assert stats[1]["url"] == "facebook.com"

def test_typing_stats(postgres_db):
    headers = get_test_user()
    test_request = [generate_event("google.com") for _ in range(10)] + [generate_event("facebook.com")]
    res = client.post(
        "/api/events", 
        json={"events": test_request},
        headers=headers
    )
    assert res.status_code
    res = client.get("/api/stats/typing",
        headers=headers
    )
    assert res.status_code == 200
    stats = res.json()["stats"]
    assert len(stats) == 2, stats
