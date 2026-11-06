import pytest
from datetime import datetime, timedelta, timezone
from rules.business_rules import (
    validate_status_transition,
    validate_reschedule_limit,
    validate_reschedule_window
)

def test_status_transitions():
    assert validate_status_transition("Scheduled", "Confirmed")[0] is True
    assert validate_status_transition("Scheduled", "Rescheduled")[0] is True
    assert validate_status_transition("Cancelled", "Confirmed")[0] is False

def test_reschedule_limits():
    assert validate_reschedule_limit(0)[0] is True
    assert validate_reschedule_limit(1)[0] is True
    assert validate_reschedule_limit(2)[0] is False

def test_reschedule_window():
    future_time = datetime.now(timezone.utc) + timedelta(hours=48)
    near_time = datetime.now(timezone.utc) + timedelta(hours=12)
    
    assert validate_reschedule_window(future_time)[0] is True
    assert validate_reschedule_window(near_time)[0] is False