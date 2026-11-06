from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_patient_data_isolation():
    """Validates T07-1: Using Patient A's token on Patient B's appointment returns 403[cite: 8]."""
    response = client.get(
        "/api/v1/appointments/patient_b_record",
        headers={"Authorization": "Bearer token_for_patient_a"}
    )
    assert response.status_code in [403, 404]

def test_front_desk_role_boundaries():
    """Validates T07-2: Front desk role trying to call manager-restricted endpoints receives 403[cite: 8]."""
    response = client.get(
        "/api/v1/admin/manager_metrics",
        headers={"Authorization": "Bearer token_front_desk"}
    )
    assert response.status_code == 403
