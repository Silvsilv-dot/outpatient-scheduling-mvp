from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import appointments

app = FastAPI(title="Outpatient Scheduling MVP")

# Allow requests from your Vercel frontend domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for MVP; can restrict to your Vercel domain later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(appointments.router, prefix="/api/v1/appointments", tags=["Appointments"])

@app.get("/")
def read_root():
    return {"status": "online", "message": "Outpatient Scheduling API is running"}
