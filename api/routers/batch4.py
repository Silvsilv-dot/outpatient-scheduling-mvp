"""
Read-only Batch 4 roster for the synthetic-data preview.

Uses the existing Neon database structure.
Does not modify appointments or return patient names, notes,
access-code hashes, or user email addresses.

Database failures report only the exception category and SQLSTATE.
Raw database error messages and connection strings are not returned.
"""

import logging

import psycopg
from fastapi import APIRouter, Depends, HTTPException, Query, Response

from services.batch4_database import database_connection
from services.batch4_security import require_batch4_preview_access


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/batch4",
    tags=["Batch 4 Preview"],
    dependencies=[Depends(require_batch4_preview_access)],
)


@router.get("/appointments")
def list_preview_appointments(
    response: Response,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
):
    """
    Return a paginated, read-only appointment roster.

    Patient identifiers are returned instead of patient names.
    Appointment times retain the database's timezone-free format.
    """
    response.headers["Cache-Control"] = "no-store"
    response.headers["Pragma"] = "no-cache"

    try:
        with database_connection() as connection:
            rows = connection.execute(
                """
                SELECT
                    a.id,
                    a.patient_id,
                    a.clinician_id,
                    c.name AS clinician_name,
                    a.appointment_time,
                    COALESCE(a.status, 'scheduled') AS status
                FROM public.appointments AS a
