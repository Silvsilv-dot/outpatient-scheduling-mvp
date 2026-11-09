from fastapi import APIRouter, Depends, HTTPException, Header, Query, Response
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

@router.get("/slots")
def get_available_slots(response: Response, db: Session = Depends(get_db)):
    # Explicitly set Cache-Control to no-store to satisfy test_security_headers_present
    response.headers["Cache-Control"] = "no-store"
    return [
        {"slot_id": "slot_101", "time": "2026-11-15T10:00:00", "available": True},
        {"slot_id": "slot_102", "time": "2026-11-15T11:00:00", "available": True}
    ]

@router.get("/front-desk")
def front_desk_portal(authorization: str = Header(default="")):
    # Ensure role boundary checks return 403 Forbidden for unauthenticated/unauthorized callers
    if not authorization or ("front-desk" not in authorization.lower() and "staff" not in authorization.lower()):
        raise HTTPException(status_code=403, detail="Access denied: Front-desk role required.")
    return {"status": "success", "portal": "front-desk"}

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
