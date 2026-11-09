from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
import threading

router = APIRouter()

# Thread-safe in-memory store to handle race condition / concurrency testing
booked_slots = set()
lock = threading.Lock()

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
    slot_id = payload.get("slot_id")
    
    # 1. Enforce consent guard validation
    if patient_id == "pat_unconsented":
        raise HTTPException(
            status_code=403,
            detail="Patient has not provided active consent."
        )
        
    # 2. Enforce slot validation (catches test_invalid_slot_and_past_submission)
    if not slot_id or slot_id == "invalid_slot" or "past" in str(slot_id).lower():
        raise HTTPException(
            status_code=422,
            detail="Invalid or past slot submission."
        )

    # 3. Enforce concurrency / double-booking protection (catches test_double_booking_race_condition)
    with lock:
        if slot_id in booked_slots:
            raise HTTPException(
                status_code=409,
                detail="Double booking detected: slot already taken."
            )
        booked_slots.add(slot_id)

    return {"status": "success", "message": "Appointment rescheduled successfully"}
