from fastapi import APIRouter, Request, Form, Depends, HTTPException
import bcrypt
from dependencies import get_db, SessionLocal
from models import User
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from starlette.datastructures import MutableHeaders

router = APIRouter(prefix="")

SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

def decode_auth_header(auth):
  token = auth.split()
  assert len(token) == 2
  return token[1]

def decode_jwt_token():
  pass

class JWTMiddleware(BaseHTTPMiddleware):
  async def dispatch(self, request: Request, call_next):
      """
          JWT token based authorization.

          Will look first for a Bearer authorization header, which is the preferred method,
          but if not found will look for a cookie. This allows authorization for server sent events.
      """
      origin = request.headers.get("Referer", "*")
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
      if request.url.path not in ["/api/login", "/api/signup"]:
        if "Authorization" not in request.headers:
          raise HTTPException(status_code=400, detail="A token is required to access this endpoint")
        token = decode_auth_header(request.headers['Authorization'])
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM]) # issuer, audience?
        headers = MutableHeaders(request._headers)
        headers["X-User-Id"] = payload.get("sub", None)
        request._headers = headers
        request.scope.update(headers=request.headers.raw)

      response = await call_next(request)
      for h in cors_headers:
        response.headers[h] = cors_headers[h]
      return response

def hash_password(password: str):
  return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def is_token_expired(claim: dict):
  expiration_datetime = datetime.fromtimestamp(claim["exp"], tz=timezone.utc)
  return datetime.now(timezone.utc) > expiration_datetime

def create_access_token(claim: dict, expires_delta: timedelta = None):
  claim = claim.copy()
  if expires_delta:
    expire = datetime.utcnow() + expires_delta
  else:
    expire = datetime.utcnow() + timedelta(minutes=15)
  claim.update({"exp": expire})
  encoded_jwt = jwt.encode(claim, SECRET_KEY, algorithm=ALGORITHM)
  return encoded_jwt

def create_bearer_tokens(user: User):
  access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
  access_token = create_access_token(claim={"sub": user.username}, expires_delta=access_token_expires)
  
  refresh_token = create_access_token(claim={"sub": user.username, "type": "refresh"}, expires_delta=timedelta(days=30))
  
  return {"access_token": access_token, "refresh_token": refresh_token}

@router.post("/api/signup")
def signup(request: Request, username: str = Form(...), password: str = Form(...), db: SessionLocal = Depends(get_db)):
  user = User(username=username, password_digest=hash_password(password))
  try:
    db.add(user)
    db.commit()
  except:
    raise HTTPException(status_code=400, detail="User already exists")
  return create_bearer_tokens(user)

# token refresh

def password_matches(received, stored):
  if not isinstance(stored, bytes):
    print("converting stored password")
    stored = stored.encode('utf-8')
  return bcrypt.checkpw(received.encode('utf-8'), stored)

@router.post("/api/login")
def signup(request: Request, username: str = Form(...), password: str = Form(...), db: SessionLocal = Depends(get_db)):
  user: User = db.query(User).filter(User.username == username).first()

  if not user or not password_matches(password, user.password_digest):
      raise HTTPException(status_code=400, detail="Incorrect username or password")
  
  return create_bearer_tokens(user)