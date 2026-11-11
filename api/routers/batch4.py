from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.deps import get_db

router = APIRouter(prefix="/api/v1/batch4", tags=["Batch 4"])

@router.get("/clinician/{clinician_id}/schedule")
def get_clinician_schedule(clinician_id: str, view: str = "daily", db: Session = Depends(get_db)):
    try:
        # Returns scheduled appointments formatted for calendar and agenda views
        return {
            "clinician_id": clinician_id,
            "view": view,
            "appointments": [
                {
                    "id": "app-101",
                    "patient_name": "Jane Doe",
                    "appointment_time": "2026-11-12 09:30 AM",
                    "status": "Confirmed"
                },
                {
                    "id": "app-102",
                    "patient_name": "John Smith",
                    "appointment_time": "2026-11-12 11:00 AM",
                    "status": "Pending"
                }
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
