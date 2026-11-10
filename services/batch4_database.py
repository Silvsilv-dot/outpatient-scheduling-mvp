# Database connection helper for the Batch 4 preview.
# Reads DATABASE_URL from the server environment.
# Does not create tables or seed data.

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
    ) as connection:
        with connection.cursor() as cursor:
            cursor.execute("SET LOCAL statement_timeout = '15s'")

        yield connection
