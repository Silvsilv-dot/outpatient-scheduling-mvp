from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

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
def reschedule_appointment(db: Session = Depends(get_db)):
    return {"status": "success", "message": "Appointment rescheduled successfully"}
