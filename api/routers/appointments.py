from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
# Import your database session dependency and models here (adjust paths to match your repo structure)
# from database import get_db
# from models import Appointment

router = APIRouter()

@router.get("")
def get_appointments(db: Session = Depends(get_db)): # type: ignore
    # Query all appointments from Neon DB
    # appointments = db.query(Appointment).all()
    # return appointments
    
    # Fallback response reflecting live DB schema if session is wired
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
