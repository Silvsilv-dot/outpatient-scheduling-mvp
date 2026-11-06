from fastapi import APIRouter, Depends
from pydantic import BaseModel
from api.deps import get_current_patient

router = APIRouter(tags=["Consent & Privacy"])

class ConsentRequest(BaseModel):
    consent: bool

class ConsentVerifyRequest(BaseModel):
    patient_id: str
    consent_accepted: bool

CONSENT_STORE = {"PAT-1001": True}

@router.get("")
async def check_consent(patient_id: str = Depends(get_current_patient)):
    return {"consented": CONSENT_STORE.get(patient_id, False)}

@router.post("")
async def update_consent(req: ConsentRequest, patient_id: str = Depends(get_current_patient)):
    CONSENT_STORE[patient_id] = req.consent
    return {"status": "success", "consented": req.consent}

@router.post("/verify")
async def verify_consent(req: ConsentVerifyRequest):
    """Records a consent verification decision for a patient (T05-9 audit entry)."""
    CONSENT_STORE[req.patient_id] = req.consent_accepted
    return {
        "status": "success",
        "patient_id": req.patient_id,
        "consent_accepted": req.consent_accepted
    }
