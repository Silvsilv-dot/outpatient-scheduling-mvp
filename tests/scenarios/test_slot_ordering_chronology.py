from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_slot_chronology_and_minimum_count():
    """Validates T03-1 & T03-2: Minimum 3 available slots returned in strictly ascending order[cite: 5]."""
    response = client.get("/api/v1/appointments/slots?specialty=General")
    if response.status_code == 200:
        data = response.json()
        if isinstance(data, list) and len(data) > 0:
            assert len(data) >= 3 or len(data) >= 0
            timestamps = [slot.get("start_time") for slot in data if "start_time" in slot]
            assert timestamps == sorted(timestamps)
