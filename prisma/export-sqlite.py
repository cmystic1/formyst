"""Read the old single-form SQLite database without modifying it."""
import json
import sqlite3
import sys
from pathlib import Path

source = Path(sys.argv[1]).resolve()
if not source.is_file():
    raise SystemExit(f"SQLite file not found: {source}")

connection = sqlite3.connect(f"file:{source.as_posix()}?mode=ro", uri=True)
connection.row_factory = sqlite3.Row
for table in ("Form", "Submission", "Setting"):
    for row in connection.execute(f'SELECT * FROM "{table}"'):
        print(json.dumps({"table": table, "row": dict(row)}, ensure_ascii=False))
connection.close()
