from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import patient, auth, consent

app = FastAPI(
    title="Outpatient Scheduling MVP API",
    description="RESTful backend supporting appointment management, atomic slot changes, and business rules verification.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(consent.router)
app.include_router(patient.router)

@app.get("/health")
async function health_check():
    return {"status": "healthy", "demo_mode": True}