from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from api.routers import auth, consent, appointments

app = FastAPI(
    title="Outpatient Scheduling MVP API",
    version="2.5.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    
    if any(path in request.url.path for path in ["/api/v1/appointments", "/api/v1/consent"]):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    
    return response

# Include Standard Routers FIRST so sub-routes match correctly
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(consent.router, prefix="/api/v1/consent", tags=["Consent & Privacy"])
app.include_router(appointments.router, prefix="/api/v1/appointments", tags=["Appointments"])

@app.get("/")
def read_root():
    return {"status": "online", "system": "Outpatient MVP Backend", "batch": "2.5"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/v1/admin/manager_metrics")
def manager_metrics(authorization: str = Header(default="")):
    if "manager" not in authorization.lower():
        raise HTTPException(
            status_code=403,
            detail="Front desk role is not authorized to access manager metrics."
        )
    return {"status": "success", "role": "manager", "metrics": {}}
