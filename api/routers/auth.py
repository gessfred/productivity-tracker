from fastapi import APIRouter, Request, Form, Depends, HTTPException
import bcrypt
from dependencies import get_db, SessionLocal
from models import User
from jose import JWTError, jwt
from datetime import datetime, timedelta
router = APIRouter()

SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

def hash_password(password: str):
  return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

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
  access_token = create_access_token(claim={"sub": user.email}, expires_delta=access_token_expires)
  
  refresh_token = create_access_token(claim={"sub": user.email, "type": "refresh"}, expires_delta=timedelta(days=30))
  
  return {"access_token": access_token, "refresh_token": refresh_token}

@router.post("/signup")
def signup(request: Request, email: str = Form(...), password: str = Form(...), db: SessionLocal = Depends(get_db)):
  user = User(email=email, password_digest=hash_password(password))
  try:
    db.add(user)
    db.commit()
  except:
    raise HTTPException(status_code=400, detail="User already exists")
  return create_bearer_tokens(user)

# token refresh

@router.post("/login")
def signup(request: Request, email: str = Form(...), password: str = Form(...), db: SessionLocal = Depends(get_db)):
  user: User = db.query(User).filter(User.email == email).first()
  if not user or not bcrypt.checkpw(password.encode('utf-8'), user.password_digest):
      raise HTTPException(status_code=400, detail="Incorrect username or password")
  
  return create_bearer_tokens(user)