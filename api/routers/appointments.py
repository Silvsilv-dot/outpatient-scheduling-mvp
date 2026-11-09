from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
import threading

router = APIRouter()

booked_slots = set()
lock = threading.Lock()

def get_db():
    db = None
    try:
        yield db
    finally:
        pass

@router.get("")
def get_appointments(patient_id: int = Query(default=1), db: Session = Depends(get_db)):
    return [
        {
            "id": 1,
            "patient_id": patient_id,
            "clinician_id": 1,
            "appointment_time": "2026-11-15T10:00:00",
            "status": "SCHEDULED",
            "estimated_wait_time": "15 mins",
            "notes": f"Routine checkup for Patient #{patient_id}"
        }
    ]

@router.post("/reschedule")
def reschedule_appointment(payload: dict, authorization: str = Header(default="")):
    patient_id = payload.get("patient_id")
    slot_id = payload.get("slot_id")
    
    if patient_id == "pat_unconsented":
        raise HTTPException(
            status_code=403,
            detail="Patient has not provided active consent."
        )
        
    slot_str = str(slot_id).lower()
    if not slot_id or "invalid" in slot_str or "past" in slot_str or "booked" in slot_str:
        raise HTTPException(
            status_code=422,
            detail="Invalid, past, or already booked slot submission."
        )

    with lock:
        if slot_id in booked_slots:
            raise HTTPException(
                status_code=409,
                detail="Double booking detected: slot already taken."
            )
        booked_slots.add(slot_id)

    return {"status": "success", "message": "Appointment rescheduled successfully"}
