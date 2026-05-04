# Single global job store - import this everywhere
jobs = {}

def get_job(job_id):
    return jobs.get(job_id)

def update_job(job_id, **kwargs):
    if job_id in jobs:
        jobs[job_id].update(kwargs)
