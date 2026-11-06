"""
Business Rules Engine (BR-01 through BR-25).
Pure Python decision logic enforcing scheduling policies.
"""
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Tuple, List, Optional

VALID_TRANSITIONS: Dict[str, List[str]] = {
    "Scheduled": ["Confirmed", "Rescheduled", "Cancelled", "Completed", "No-show"],
    "Confirmed": ["Rescheduled", "Cancelled", "Completed", "No-show"],
    "Rescheduled": ["Confirmed", "Rescheduled", "Cancelled", "Completed", "No-show"],
    "Cancelled": [],
    "Completed": [],
    "No-show": []
}

def validate_status_transition(current_status: str, new_status: str) -> Tuple[bool, str]:
    if current_status in ["Cancelled", "Completed", "No-show"]:
        return False, f"Cannot modify appointment in terminal status '{current_status}' (BR-24)."
    allowed = VALID_TRANSITIONS.get(current_status, [])
    if new_status not in allowed:
        return False, f"Invalid transition from '{current_status}' to '{new_status}'."
    return True, ""

def validate_reschedule_window(start_time: datetime, now: Optional[datetime] = None) -> Tuple[bool, str]:
    if now is None:
        now = datetime.now(timezone.utc)
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)
    if (start_time - now) < timedelta(hours=24):
        return False, "Rescheduling is locked within 24 hours of scheduled start time."
    return True, ""

def validate_reschedule_limit(current_count: int) -> Tuple[bool, str]:
    if current_count >= 2:
        return False, "Maximum limit of 2 reschedules reached for this appointment."
    return True, ""

def calculate_wait_time_days(earliest_slot_time: datetime, now: Optional[datetime] = None) -> int:
    if now is None:
        now = datetime.now(timezone.utc)
    if earliest_slot_time.tzinfo is None:
        earliest_slot_time = earliest_slot_time.replace(tzinfo=timezone.utc)
    return max(0, (earliest_slot_time - now).days)

def calculate_change_deadline(start_time: datetime) -> datetime:
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)
    return start_time - timedelta(hours=24)

def is_offer_expired(offered_at: datetime, expires_at: datetime, now: Optional[datetime] = None) -> bool:
    if now is None:
        now = datetime.now(timezone.utc)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return now > expires_at

def sanitize_privacy_fields(payload: Dict[str, Any]) -> Dict[str, Any]:
    whitelisted = {
        "appt_id", "patient_id", "provider_id", "provider_name", "specialty",
        "location_id", "location_name", "facility_address", "start_time",
        "end_time", "status", "reschedule_count", "change_deadline",
        "estimated_wait_days", "selectable", "slot_id"
    }
    return {k: v for k, v in payload.items() if k in whitelisted}