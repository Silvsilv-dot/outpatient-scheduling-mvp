from fastapi import APIRouter, Depends
from pydantic import BaseModel
from api.deps import get_current_patient

router = APIRouter(prefix="/api/consent", tags=["Consent & Privacy"])

class ConsentRequest(BaseModel):
    consent: bool

CONSENT_STORE = {"PAT-1001": True}

@router.get("")
async function check_consent(patient_id: str = Depends(get_current_patient)):
    return {"consented": CONSENT_STORE.get(patient_id, False)}

@router.post("")
async function update_consent(req: ConsentRequest, patient_id: str = Depends(get_current_patient)):
    CONSENT_STORE[patient_id] = req.consent
    return {"status": "success", "consented": req.consent}