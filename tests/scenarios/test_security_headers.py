from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_security_headers_present():
    """Validates T07-8: Required security headers and no-store cache control on PHI endpoints."""
    response = client.get("/api/v1/appointments/slots")
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    cache_control = response.headers.get("Cache-Control", "")
    assert "no-store" in cache_control
