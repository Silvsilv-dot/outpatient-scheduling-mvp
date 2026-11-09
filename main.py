from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from api.routers import appointments, auth, consent

app = FastAPI(title="Outpatient Scheduling MVP")

# 1. Add Security Headers Middleware (Fixes test_security_headers_present)
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# 2. CORS Middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Register Routers (Fixes 404 Not Found errors on RBAC and Auth endpoints)
app.include_router(appointments.router, prefix="/api/v1/appointments", tags=["Appointments"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(consent.router, prefix="/api/v1/consent", tags=["Consent"])

@app.get("/")
def read_root():
    return {"status": "online", "message": "Outpatient Scheduling API is running"}
