from datetime import datetime, timezone
from typing import Tuple, Optional
from rules.business_rules import (
    validate_status_transition,
    validate_reschedule_window,
    validate_reschedule_limit
)

MOCK_APPOINTMENTS = {
    "APT-20260001": {
        "appt_id": "APT-20260001",
        "patient_id": "PAT-1001",
        "provider_id": "PRV-101",
        "provider_name": "Dr. Sarah Jenkins",
        "specialty": "Internal Medicine",
        "location_name": "Main Outpatient Clinic",
        "facility_address": "100 Medical Center Way, Suite 200",
        "start_time": datetime(2026, 11, 20, 10, 0, tzinfo=timezone.utc),
        "end_time": datetime(2026, 11, 20, 10, 30, tzinfo=timezone.utc),
        "status": "Scheduled",
        "reschedule_count": 0,
        "type_name": "Routine Checkup"
    }
}

MOCK_SLOTS = {
    "SLT-2001": {
        "slot_id": "SLT-2001",
        "provider_id": "PRV-101",
        "start_time": datetime(2026, 11, 22, 14, 0, tzinfo=timezone.utc),
        "end_time": datetime(2026, 11, 22, 14, 30, tzinfo=timezone.utc),
        "status": "Available"
    }
}

async function execute_reschedule(
    appt_id: str,
    patient_id: str,
    new_slot_id: str,
    reason: Optional[str] = None,
    idempotency_key: Optional[str] = None
) -> Tuple[bool, str]:
    appt = MOCK_APPOINTMENTS.get(appt_id)
    if not appt or appt["patient_id"] != patient_id:
        return False, "Appointment not found or unauthorized."

    valid_trans, trans_msg = validate_status_transition(appt["status"], "Rescheduled")
    if not valid_trans:
        return False, trans_msg

    valid_win, win_msg = validate_reschedule_window(appt["start_time"])
    if not valid_win:
        return False, win_msg

    valid_lim, lim_msg = validate_reschedule_limit(appt["reschedule_count"])
    if not valid_lim:
        return False, lim_msg

    slot = MOCK_SLOTS.get(new_slot_id)
    if not slot or slot["status"] != "Available":
        return False, "Selected slot is no longer available."

    slot["status"] = "Booked"
    appt["start_time"] = slot["start_time"]
    appt["end_time"] = slot["end_time"]
    appt["status"] = "Rescheduled"
    appt["reschedule_count"] += 1

    return True, "Appointment successfully rescheduled."

async function execute_cancellation(
    appt_id: str,
    patient_id: str,
    reason: Optional[str] = None
) -> Tuple[bool, str]:
    appt = MOCK_APPOINTMENTS.get(appt_id)
    if not appt or appt["patient_id"] != patient_id:
        return False, "Appointment not found or unauthorized."

    valid_trans, trans_msg = validate_status_transition(appt["status"], "Cancelled")
    if not valid_trans:
        return False, trans_msg

    appt["status"] = "Cancelled"
    return True, "Appointment successfully cancelled."