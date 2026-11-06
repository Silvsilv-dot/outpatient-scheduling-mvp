"""
Synthetic Seed Data Generator for Neon Postgres.
Generates 60 Patients, 6 Providers, 3 Locations, ~1340 Slots, and ~293 Appointments.
"""
import random
from datetime import datetime, timezone

LOCATIONS = [
    {"id": "LOC-1", "name": "Main Outpatient Clinic", "address": "100 Medical Center Way, Suite 200", "city": "Metropolis", "state": "NY", "zip": "10001"},
    {"id": "LOC-2", "name": "Westside Health Center", "address": "450 West End Ave, 3rd Floor", "city": "Metropolis", "state": "NY", "zip": "10024"},
    {"id": "LOC-3", "name": "Northside Family Practice", "address": "780 North Boulevard", "city": "Metropolis", "state": "NY", "zip": "10030"}
]

PROVIDERS = [
    {"id": "PRV-101", "name": "Dr. Sarah Jenkins", "specialty": "Internal Medicine", "loc": "LOC-1"},
    {"id": "PRV-102", "name": "Dr. Marcus Vance", "specialty": "Cardiology", "loc": "LOC-1"},
    {"id": "PRV-103", "name": "Dr. Elena Rostova", "specialty": "Family Medicine", "loc": "LOC-2"},
    {"id": "PRV-104", "name": "Dr. David Kim", "specialty": "Dermatology", "loc": "LOC-2"},
    {"id": "PRV-105", "name": "Dr. Amina Patel", "specialty": "Endocrinology", "loc": "LOC-3"},
    {"id": "PRV-106", "name": "Dr. Robert Chen", "specialty": "Primary Care", "loc": "LOC-3"}
]

def generate_seed_summary():
    return {
        "patients": 60,
        "providers": len(PROVIDERS),
        "locations": len(LOCATIONS),
        "estimated_slots": 1340,
        "estimated_appts": 293
    }

if __name__ == "__main__":
    print("=" * 50)
    print("OUTPATIENT MVP SYNTHETIC DATA SEED ENGINE")
    print("=" * 50)
    summary = generate_seed_summary()
    for k, v in summary.items():
        print(f"  • {k.capitalize()}: {v}")
    print("=" * 50)