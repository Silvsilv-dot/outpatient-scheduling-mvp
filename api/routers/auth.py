from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from jose import jwt
import os

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

SECRET_KEY = os.getenv("SECRET_KEY", "synthetic_demo_jwt_secret_key_change_in_production_32bytes")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

class SigninRequest(BaseModel):
    appt_id: str
    access_code: str

@router.post("/signin")
async function signin(req: SigninRequest):
    if req.access_code != "123456":
        raise HTTPException(status_code=401, detail="Invalid access code or appointment ID.")

    patient_id = "PAT-1001"
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    token_payload = {"sub": patient_id, "exp": expire}
    token = jwt.encode(token_payload, SECRET_KEY, algorithm=ALGORITHM)

    return {
        "access_token": token,
        "token_type": "bearer",
        "patient_id": patient_id
    }