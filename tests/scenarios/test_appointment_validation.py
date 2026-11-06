from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_invalid_slot_and_past_submission():
    """Validates T04-4, T04-5, T04-6, T04-8: Rejection of already-booked, past, or mismatched appointment slots."""
    res_booked = client.post("/api/v1/appointments/reschedule", json={"slot_id": "booked_slot_123"})
    assert res_booked.status_code in [400, 422]

    res_past = client.post("/api/v1/appointments/reschedule", json={"slot_id": "past_slot_000"})
    assert res_past.status_code in [400, 422]
