from fastapi import FastAPI, Depends, Request, Header
from fastapi.responses import JSONResponse, PlainTextResponse
from pydantic import BaseModel
from psycopg2 import pool
from typing import List, Any, Tuple, Dict, Optional
import os
from datetime import datetime
from uuid import uuid4
from starlette.datastructures import MutableHeaders

app = FastAPI()

def create_table(name: str, table: dict) -> str:
  sep = ',\n'
  return f"""
    create table if not exists {name} (
      {sep.join([k + ' ' + v for k, v in table.items()])}
    )
  """

def insert(table: str, rows: List[dict], columns: List[str]):
  def encode_col(col): 
    if col is None:
      return 'null'
    elif type(col) == bool:
      return 'true' if col else 'false'
    else:
      return f"'{str(col)}'"
  def encode_row(row: dict):
    cols = [encode_col(row.get(c, None)) for c in columns]
    return ','.join(cols)
  rows_as_tuples = [f"({encode_row(row)})" for row in rows] 
  inserted_rows = ','.join(rows_as_tuples)
  cols = ','.join(columns)
  return f"""
    insert into {table} ({cols})
      values {inserted_rows}
  """

EVENTS_TABLE = "keyevents"

class Database:
  def __init__(self, host, user, password, database, port):
    self.pool = pool.SimpleConnectionPool(
      1,8,
      host=host, 
      user=user, 
      password=password, 
      database=database, 
      sslmode="require", 
      port=port
    )
    self.build()
  
  def build(self):
    #column_name -> type + constraints
    self.tables = {}
    self.tables[EVENTS_TABLE] = {
      "keystroke_id": "bigint generated always as identity",
      "record_time": "timestamp",
      "ingestion_time": "timestamp",
      "batch_id": "character(32) not null",
      "session_id": "character(32) not null",
      "user_id": "text not null",
      "agent_description": "text",
      "source_url": "text",
      "is_end_of_word": "boolean",
      "is_end_of_line": "boolean",
      "is_return": "boolean"
    }
    sql = create_table(EVENTS_TABLE, self.tables[EVENTS_TABLE])
    print("SQL Create Table", sql)
    self.command(sql)

  def insert(self, table: str, data: List[dict]):
    if len(data) == 0:
      return
    columns = [c for c in self.tables[table] if "generated" not in self.tables[table][c]]
    query = insert(table, data, columns)
    self.command(query)


  def command(self, sql: str, *args):
    connection = self.pool.getconn()
    connection.set_session(autocommit=True)
    cur = connection.cursor()
    try:
      cur.execute(sql, args)
    finally:
      cur.close()
      self.pool.putconn(connection)
  
  def query(self, sql: str, *args):
    connection = self.pool.getconn()
    connection.set_session(autocommit=True)
    cur = connection.cursor()
    res = None
    try:
      cur.execute(sql, args)
      res = cur.fetchall()
    finally:
      cur.close()
      self.pool.putconn(connection)
    return res

db = Database(
  host="104.248.24.146",#os.getenv("DB_HOST"),
  port=os.getenv("DB_PORT"),
  user=os.getenv("DB_USER"),
  password=os.getenv("DB_PASSWORD"),
  database=os.getenv("DB_NAME")
)

def database():

  return db

class KeyEvent(BaseModel):
  record_time: datetime 
  #ingestion_time: datetime written by route handler 
  #batch_id: alternative to ingestion_time - same semantics
  #user_id: str comes from
  #agent_description: str
  session_id: str
  source_url: str
  is_end_of_word: bool
  is_end_of_line: bool
  is_return: bool

class KeystrokesBatch(BaseModel):
  events: List[KeyEvent]

def agent_description(request: Request):
  keys = ["host", "user-agent", "accept-language"]
  data = []
  for k in keys:
    data.append(request.headers.get(k, ''))
  return '#'.join(data)
  
@app.middleware("http")
async def authorize_request(request: Request, call_next):
  """
      JWT token based authorization.

      Will look first for a Bearer authorization header, which is the preferred method,
      but if not found will look for a cookie. This allows authorization for server sent events.
  """
  """if "Referer" not in request.headers:
    return JSONResponse(
      status_code=401, 
      content={'detail': "Referer header must be set"}
    )"""
  origin = request.headers.get("Referer", "localhost")
  if origin.endswith("/"): origin = origin[:-1]
  cors_headers = {
    "Access-Control-Allow-Methods": "GET, POST, DELETE, PUT, OPTIONS", 
    "Access-Control-Allow-Credentials": "true", 
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization", 
    "Access-Control-Max-Age": "86400"
  }
  if request.method == "OPTIONS":
    """if not ("amiscan.xyz" in origin or "localhost" in origin):
      print(origin, "not in allowed origins")
      return PlainTextResponse("CORS error", status_code=401)"""
    return PlainTextResponse(
      "OK", 
      status_code=200, 
      headers=cors_headers
    )
  """ if 'Authorization' not in request.headers:
    return JSONResponse(status_code=401, content={'detail': "No credentials found (authorization bearer or cookie)"})
  token = decode_auth_header(request.headers['Authorization'])
  payload = get_token_payload(token)
  if 'https://api.amiscan.xyz/' not in payload['aud']:
    raise Exception("unauthorized")"""

  headers = MutableHeaders(request._headers)
  headers["X-User-Id"] = "alice@test"#payload.get("sub", None)
  request._headers = headers
  request.scope.update(headers=request.headers.raw)

  response = await call_next(request)
  for h in cors_headers:
    response.headers[h] = cors_headers[h]
  return response

@app.post("/api/events")
def post_keystrokes(batch: KeystrokesBatch, request: Request, x_user_id: str = Header(default=None), db = Depends(database)):
  batch = batch.dict()
  user_id = x_user_id
  ingestion_time = datetime.now()
  for event in batch["events"]:
    event["ingestion_time"] = ingestion_time
    event["user_id"] = user_id
    event["batch_id"] = uuid4().hex
    event["agent_description"] = agent_description(request)
  db.insert(EVENTS_TABLE, batch["events"])

@app.get("/api/events")
def get_keystrokes(request: Request, db = Depends(database)):
  return db.query(f"""
    select * from {EVENTS_TABLE}
  """)

@app.get("/api/events/count")
def get_keystrokes(request: Request, db = Depends(database)):
  return {
    "count": db.query(f"SELECT COUNT(*) FROM {EVENTS_TABLE}")[0][0]
  }

@app.get("/api/version")
def get_version(db = Depends(database)):
  return "0.0.1"