from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from services.batch4_database import database_connection
from services.batch4_security import require_batch4_preview_access


# 1. Pydantic Models for serialization and validation
class AppointmentResponse(BaseModel):
    id: str
    patient_name: str
    appointment_time: str
    status: str
    clinician_name: Optional[str] = None

class ClinicianScheduleResponse(BaseModel):
    clinician_id: str
    view: str
    appointments: List[AppointmentResponse]

class AppointmentUpdate(BaseModel):
    status: str


# 2. Router Setup with Global Security Dependency
router = APIRouter(
    prefix="/api/v1/batch4",
    tags=["Batch 4"],
    dependencies=[Depends(require_batch4_preview_access)]
)


# 3. Clinician Calendar View Endpoint
@router.get("/clinician/{clinician_id}/schedule", response_model=ClinicianScheduleResponse)
def get_clinician_schedule(clinician_id: str, view: str = Query("daily")):
    try:
        with database_connection() as conn:
            with conn.cursor() as cur:
                # TO_CHAR formats the timestamp exactly as the frontend expects: "2026-11-12 09:30 AM"
                cur.execute("""
                    SELECT 
                        a.id::text, 
                        u.name AS patient_name, 
                        TO_CHAR(a.start_time, 'YYYY-MM-DD HH12:MI AM') AS appointment_time, 
                        a.status 
                    FROM appointments a
                    JOIN users u ON a.patient_id = u.id
                    WHERE a.clinician_id = %s
                    ORDER BY a.start_time ASC
                """, (clinician_id,))
                
                records = cur.fetchall()
        
        return {
            "clinician_id": clinician_id,
            "view": view,
            "appointments": records
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 4. Clinic-Wide Staff Dashboard Feed
@router.get("/staff/appointments", response_model=List[AppointmentResponse])
def get_staff_appointments(status: Optional[str] = Query("All", description="Filter by status")):
    try:
        with database_connection() as conn:
            with conn.cursor() as cur:
                query = """
                    SELECT 
                        a.id::text, 
                        u.name AS patient_name, 
                        c.name AS clinician_name,
                        TO_CHAR(a.start_time, 'YYYY-MM-DD HH12:MI AM') AS appointment_time, 
                        a.status 
                    FROM appointments a
                    JOIN users u ON a.patient_id = u.id
                    JOIN clinicians c ON a.clinician_id = c.id
                """
                params = []
                
                if status and status.lower() != 'all':
                    query += " WHERE a.status = %s"
                    params.append(status)
                    
                query += " ORDER BY a.start_time ASC"
                
                cur.execute(query, params)
                records = cur.fetchall()
                
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 5. Status Update Endpoint (Confirm/Reschedule)
@router.patch("/staff/appointments/{appointment_id}")
def update_appointment_status(appointment_id: str, payload: AppointmentUpdate):
    try:
        with database_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE appointments 
                    SET status = %s 
                    WHERE id = %s 
                    RETURNING id::text
                """, (payload.status, appointment_id))
                
                updated = cur.fetchone()
                
                if not updated:
                    raise HTTPException(status_code=404, detail="Appointment not found")
                    
            conn.commit()
            
        return {
            "status": "success", 
            "message": f"Appointment successfully updated to {payload.status}", 
            "id": appointment_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
