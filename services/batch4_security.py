"""
Temporary access control for the synthetic-data Batch 4 preview.

Not a production identity or role-based authentication system.
Does not accept the existing mock login token.
"""

import os
import secrets
from typing import Optional

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer


preview_bearer = HTTPBearer(
    auto_error=False,
    scheme_name="Batch4PreviewAccess",
)


def require_batch4_preview_access(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        preview_bearer
    ),
) -> str:
    environment = os.environ.get("VERCEL_ENV", "")
    expected_key = os.environ.get(
        "BATCH4_PREVIEW_ACCESS_KEY", ""
    ).strip()

    # This temporary access mechanism must not enable production APIs.
    if environment != "preview":
        raise HTTPException(
            status_code=503,
            detail="Batch 4 preview access is unavailable.",
        )

    if len(expected_key) < 32:
        raise HTTPException(
            status_code=503,
            detail="Batch 4 preview access is not configured.",
        )

    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Preview access key required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    supplied_key = credentials.credentials

    if not secrets.compare_digest(
        supplied_key.encode("utf-8"),
        expected_key.encode("utf-8"),
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid preview access key.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return "batch4-shared-preview-access"
