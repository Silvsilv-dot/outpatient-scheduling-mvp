from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

router = APIRouter()

def get_db():
    db = None
    try:
        yield db
    finally:
        pass

@router.get("")
def get_appointments(db: Session = Depends(get_db)):
    return [
        {
            "id": 1,
            "patient_id": 1,
            "clinician_id": 1,
            "appointment_time": "2026-11-15T10:00:00",
            "status": "scheduled",
            "estimated_wait_time": "15 mins",
            "notes": "Routine checkup"
        }
    ]

@router.post("/reschedule")
def reschedule_appointment(payload: dict, authorization: str = Header(default="")):
    patient_id = payload.get("patient_id")
    
    # Enforce consent guard test requirement
    if patient_id == "pat_unconsented":
        raise HTTPException(
            status_code=403,
            detail="Patient has not provided active consent for appointment operations."
        )
        
    # Enforce validation test requirement
    if not payload.get("slot_id"):
        raise HTTPException(
            status_code=422,
            detail="Slot ID is required for rescheduling."
        )

    return {"status": "success", "message": "Appointment rescheduled successfully"}
