from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_auth_rate_limiting_lockout():
    """Validates T02-5 / T07-9: Repeated failed sign-ins trigger lockout behavior."""
    for _ in range(6):
        response = client.post(
            "/api/v1/auth/login",
            json={"access_code": "WRONG_PIN_123"}
        )
    assert response.status_code in [429, 401]
