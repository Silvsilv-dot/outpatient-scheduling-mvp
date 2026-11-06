from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_consent_decline_blocks_api():
    """Validates T02-2: Direct API access without valid consent returns 403 consent_required."""
    response = client.post(
        "/api/v1/appointments/reschedule",
        json={"slot_id": "slot_101", "patient_id": "pat_unconsented"},
        headers={"Authorization": "Bearer mock_token_no_consent"}
    )
    assert response.status_code == 403
    assert "consent" in response.text.lower()
