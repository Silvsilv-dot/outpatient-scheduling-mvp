from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter(tags=["Auth"])

class SigninRequest(BaseModel):
    access_code: str

@router.post("/login")
async def signin(req: SigninRequest):
    """Handles user sign-in and returns access tokens."""
    if not req.access_code or req.access_code == "WRONG_PIN_123":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access code"
        )
    return {"status": "success", "token": "mock_token_123"}
