import duckdb
import pandas as pd
from datetime import datetime as dt
from datetime import timedelta

with open("typing_speed.sql") as fd:
    query = fd.read()

def make_event(t):
    return {
        "session_id": "1",
        "source_url": "example.com",
        "record_time": t
    }

def make_events(*ts):
    return [make_event(t) for t in ts]

def test_empty_case_returns_zeros():
    keyevents = pd.DataFrame([
        {"record_time": dt(2000, 1, 1, 0, 0), "source_url": "example.com", "session_id": "1"}
    ])
    res = duckdb.sql(query).df()

    assert res.speed.isna().all()
    keyevents = keyevents.head(0)
    #keyevents = pd.DataFrame([], columns=["record_time", "source_url", "session_id"])
    res = duckdb.sql(query).df()

    assert res.speed.isna().all()

def test_domains_are_seggregated():
    pass

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

def test_weight_is_accounted_per_flow():
    pass# 

def test_weight_is_accounted_across():
    pass
