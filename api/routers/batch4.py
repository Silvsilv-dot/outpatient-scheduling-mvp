# Read-only Batch 4 roster for the synthetic-data preview.
# Does not modify appointments or return patient names or notes.
# Database diagnostics include only an exception category and SQLSTATE.

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
    response.headers["Cache-Control"] = "no-store"
    response.headers["Pragma"] = "no-cache"

    query = (
        "SELECT "
        "a.id, "
        "a.patient_id, "
        "a.clinician_id, "
        "c.name AS clinician_name, "
        "a.appointment_time, "
        "COALESCE(a.status, 'scheduled') AS status "
        "FROM public.appointments AS a "
        "LEFT JOIN public.clinicians AS c "
        "ON c.id = a.clinician_id "
        "ORDER BY a.appointment_time ASC, a.id ASC "
        "LIMIT %s OFFSET %s"
    )

    try:
        with database_connection() as connection:
            rows = connection.execute(
                query,
                (limit, offset),
            ).fetchall()

    except RuntimeError:
        raise HTTPException(
            status_code=503,
            detail="The preview database connection is not configured.",
            headers={
                "Cache-Control": "no-store",
                "Pragma": "no-cache",
            },
        ) from None

    except psycopg.Error as exc:
        error_type = type(exc).__name__
        sqlstate = exc.sqlstate or "unavailable"

        logger.error(
            "Batch 4 roster database failure: type=%s sqlstate=%s",
            error_type,
            sqlstate,
        )

        raise HTTPException(
            status_code=503,
            detail=(
                "Preview database failure. "
                f"Category: {error_type}. "
                f"SQLSTATE: {sqlstate}."
            ),
            headers={
                "Cache-Control": "no-store",
                "Pragma": "no-cache",
            },
        ) from None

    return [
        {
            "id": row["id"],
            "patient_id": row["patient_id"],
            "clinician_id": row["clinician_id"],
            "clinician_name": (
                row["clinician_name"] or "Clinician unavailable"
            ),
            "appointment_time": row["appointment_time"].isoformat(),
            "status": str(row["status"]).strip().lower(),
        }
        for row in rows
    ]
