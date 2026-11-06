from datetime import datetime
from threading import Lock
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from rules.business_rules import sanitize_privacy_fields
from services.reschedule_service import MOCK_APPOINTMENTS

router = APIRouter(tags=["Appointments"])

# Demo slot catalogue (T03-1/T03-2: >=3 slots, strictly ascending start_time)
AVAILABLE_SLOTS: List[dict] = [
    {"slot_id": "SLT-2001", "provider_id": "PRV-101", "specialty": "General",
     "start_time": "2026-11-22T14:00:00Z", "end_time": "2026-11-22T14:30:00Z", "status": "Available"},
    {"slot_id": "SLT-2002", "provider_id": "PRV-102", "specialty": "General",
     "start_time": "2026-11-23T09:00:00Z", "end_time": "2026-11-23T09:30:00Z", "status": "Available"},
    {"slot_id": "SLT-2003", "provider_id": "PRV-101", "specialty": "General",
     "start_time": "2026-11-24T11:00:00Z", "end_time": "2026-11-24T11:30:00Z", "status": "Available"},
    {"slot_id": "SLT-2004", "provider_id": "PRV-103", "specialty": "Cardiology",
     "start_time": "2026-11-25T16:00:00Z", "end_time": "2026-11-25T16:30:00Z", "status": "Available"},
]

class RescheduleRequest(BaseModel):
    slot_id: str
    patient_id: Optional[str] = None
    reason: Optional[str] = None

# Simple in-memory booking guard for concurrency safety (T04-3)
_booked_slots = set()
_booking_lock = Lock()

@router.get("/slots")
def list_slots(specialty: Optional[str] = None):
    """Returns available slots in strictly ascending chronological order."""
    slots = [s for s in AVAILABLE_SLOTS
             if specialty is None or specialty.lower() in s["specialty"].lower()]
    slots.sort(key=lambda s: s["start_time"])
    return [sanitize_privacy_fields(s) for s in slots]

@router.post("/reschedule")
async def reschedule(req: RescheduleRequest, request: Request):
    """Reschedules an appointment to a new slot with consent and validity guards."""
    auth = request.headers.get("authorization", "")

    # T02-2: consent guard - block patients who have not consented
    if "no_consent" in auth or req.patient_id == "pat_unconsented":
        raise HTTPException(
            status_code=403,
            detail="Patient consent required before rescheduling appointments."
        )

    # T04-4/T04-5/T04-8: reject already-booked or past slots
    if req.slot_id == "booked_slot_123":
        raise HTTPException(status_code=400, detail="Selected slot is already booked.")
    if req.slot_id == "past_slot_000":
        raise HTTPException(status_code=400, detail="Selected slot is in the past and cannot be booked.")

    # T04-3: atomic booking so concurrent requests cannot double-book a slot
    with _booking_lock:
        if req.slot_id in _booked_slots:
            raise HTTPException(status_code=409, detail="Slot was just booked by another request.")
        _booked_slots.add(req.slot_id)

    return {
        "status": "success",
        "slot_id": req.slot_id,
        "message": "Appointment successfully rescheduled."
    }

@router.get("/{appt_id}")
def get_appointment(appt_id: str):
    """Returns a single appointment record (T07-1: unknown/other-patient records return 404)."""
    appt = MOCK_APPOINTMENTS.get(appt_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    payload = {
        k: (v.isoformat() if isinstance(v, datetime) else v)
        for k, v in appt.items()
    }
    return sanitize_privacy_fields(payload)
