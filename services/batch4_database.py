"""
Database connection helper for Batch 4.

Reads DATABASE_URL from the server environment.
Does not create tables, seed data, or expose API endpoints.
"""

import os
from contextlib import contextmanager
from typing import Iterator

import psycopg
from psycopg.rows import dict_row


@contextmanager
def database_connection() -> Iterator[psycopg.Connection]:
    database_url = os.environ.get("DATABASE_URL", "").strip()

    if not database_url:
        raise RuntimeError(
            "DATABASE_URL is not configured in the backend environment."
        )

    with psycopg.connect(
        database_url,
        row_factory=dict_row,
        connect_timeout=10,
        options="-c statement_timeout=15000",
    ) as connection:
        yield connection
