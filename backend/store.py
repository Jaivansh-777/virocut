import threading
from datetime import datetime

# Single shared job store for the entire backend
jobs = {}
JOBS_LOCK = threading.Lock()

print(f"STORE: store.py loaded, jobs dict id: {id(jobs)}")
