import os
import pyodbc
from dotenv import load_dotenv

load_dotenv()

_DSN = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    f"SERVER={os.getenv('DB_SERVER', 'localhost')},{os.getenv('DB_PORT', '1433')};"
    f"DATABASE={os.getenv('DB_DATABASE', 'EnergyGrid')};"
    f"UID={os.getenv('DB_USER', 'sa')};"
    f"PWD={os.getenv('DB_PASSWORD', '1234')};"
    "TrustServerCertificate=yes;"
    "Encrypt=no;"
)


def get_db():
    """Return a fresh pyodbc connection (Flask g can cache it per request)."""
    conn = pyodbc.connect(_DSN, autocommit=False)
    return conn


def run_query(sql: str, params: tuple = (), *, fetch=True, identity=False):
    """
    Execute *sql* with *params*.

    Parameters
    ----------
    sql      : T-SQL statement (use ? placeholders for pyodbc).
    params   : Tuple of positional parameters.
    fetch    : Return rows as list-of-dicts when True (SELECT / OUTPUT).
    identity : When True, append SELECT SCOPE_IDENTITY() AS new_id so that
               INSERT … OUTPUT … still works (pyodbc returns only the first
               result-set unless we call nextset()).

    Returns
    -------
    list[dict] | int   – rows when fetch=True, else rowcount.
    """
    conn   = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(sql, params)

        if fetch:
            cols  = [col[0] for col in cursor.description]
            rows  = [dict(zip(cols, row)) for row in cursor.fetchall()]
            conn.commit()
            return rows
        else:
            affected = cursor.rowcount
            conn.commit()
            return affected
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()