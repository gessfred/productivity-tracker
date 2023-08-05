import duckdb
import pandas as pd
from datetime import datetime as dt
from datetime import timedelta

with open("typing_speed_current.sql") as fd:
    query = fd.read()

def make_event(t, source_url="example.com", session_id="1", is_error=False):
    return {
        "session_id": session_id,
        "source_url": source_url,
        "record_time": t,
        "is_return": is_error
    }

def test_weight_is_accounted_per_flow():
    now = dt.now()
    keyevents = pd.DataFrame((
        [ make_event(now - timedelta(milliseconds=k * 3)) for k in range (10)] + 
        [ make_event(now - timedelta(milliseconds=k * 8 + 55), source_url="google.com") for k in range (30)]
    ))
    res = duckdb.sql(query).df()
    assert len(res) == 1
    expected = 0.25 * 3 + 0.75 * 8
    assert res.speed.values[0] == expected
    #assert res.speed.values[0] == 5

def test_empty_case_returns_zeros():
    keyevents = pd.DataFrame([
        make_event(dt(2000, 1, 1, 0, 0))
    ])
    res = duckdb.sql(query).df()

    assert res.speed.isna().all()
    keyevents = keyevents.head(0)
    #keyevents = pd.DataFrame([], columns=["record_time", "source_url", "session_id"])
    res = duckdb.sql(query).df()

    assert res.speed.isna().all()

def test_domains_are_seggregated():
    now = dt.now()
    keyevents = pd.DataFrame([
        make_event(now ), 
        make_event(now - timedelta(milliseconds=5)), 
        make_event(now - timedelta(milliseconds=10)), 
        # if domains are not seggreagated, 
        make_event(now - timedelta(milliseconds=50), source_url="google.com"),
        make_event(now - timedelta(milliseconds=55), source_url="google.com"), 
        make_event(now - timedelta(milliseconds=60), source_url="google.com"), 
    ])
    res = duckdb.sql(query).df()
    assert len(res) == 1
    assert res.speed.values[0] == 5

def test_intervals_are_ignored():
    now = dt.now()
    keyevents = pd.DataFrame([
        make_event(now ), 
        make_event(now - timedelta(milliseconds=5)), 
        make_event(now - timedelta(milliseconds=10)), 
        make_event(now - timedelta(milliseconds=15)),
        make_event(now - timedelta(milliseconds=20)), 
        # this event should be ignored
        make_event(now - timedelta(seconds=30))
    ])
    res = duckdb.sql(query).df()
    assert len(res) == 1
    assert res.speed.values[0] == 5

def test_weight_is_accounted_across():
    pass
