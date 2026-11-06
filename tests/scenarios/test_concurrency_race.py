import concurrent.futures
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_double_booking_race_condition():
    """Validates T04-3: Concurrent confirmation attempts on the same slot result in conflict handling."""
    slot_payload = {"slot_id": "slot_test_999", "patient_id": "pat_001"}
    
    def attempt_booking():
        return client.post("/api/v1/appointments/reschedule", json=slot_payload)

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        futures = [executor.submit(attempt_booking), executor.submit(attempt_booking)]
        results = [f.result() for f in futures]

    status_codes = [r.status_code for r in results]
    assert 200 in status_codes
    assert 409 in status_codes or 400 in status_codes
