from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from api.routers import auth, consent, appointments, batch4


app = FastAPI(
    title="Outpatient Scheduling MVP API",
    version="2.5.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Existing CORS configuration retained.
# Production origins and authentication must be reviewed before release.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"

    private_endpoint_prefixes = (
        "/api/v1/appointments",
        "/api/v1/consent",
        "/api/v1/batch4",
    )

    if request.url.path.startswith(private_endpoint_prefixes):
        response.headers["Cache-Control"] = (
            "no-store, no-cache, must-revalidate, max-age=0"
        )
        response.headers["Pragma"] = "no-cache"

    return response


# Existing application routes.
app.include_router(
    auth.router,
    prefix="/api/v1/auth",
    tags=["Authentication"],
)

app.include_router(
    consent.router,
    prefix="/api/v1/consent",
    tags=["Consent & Privacy"],
)

app.include_router(
    appointments.router,
    prefix="/api/v1/appointments",
    tags=["Appointments"],
)

# The Batch 4 router already defines its own prefix:
# /api/v1/batch4
# Its access guard applies to all endpoints in that router.
app.include_router(batch4.router)


@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "Outpatient MVP Backend",
        "batch": "2.5",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# Existing legacy demo endpoint retained unchanged.
# This substring check is NOT production role verification.
@app.get("/api/v1/admin/manager_metrics")
def manager_metrics(authorization: str = Header(default="")):
    if "manager" not in authorization.lower():
        raise HTTPException(
            status_code=403,
            detail=(
                "Front desk role is not authorized "
                "to access manager metrics."
            ),
        )

    return {
        "status": "success",
        "role": "manager",
        "metrics": {},
    }
