import asyncio
import time
import uuid
import sys
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.repositories.report_repository import ReportRepository

# Disable sqlalchemy logging for benchmark
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def run_benchmark():
    db = SessionLocal()
    repo = ReportRepository(db)
    
    # Let's get the user with most reports
    result = db.execute("SELECT user_id FROM reports GROUP BY user_id ORDER BY count(*) DESC LIMIT 1").first()
    if not result:
        print("No reports found")
        return
    user_id = result[0]
    
    start_time = time.perf_counter()
    reports = repo.get_by_user_id(user_id, limit=50)
    end_time = time.perf_counter()
    
    print(f"Time to fetch reports: {(end_time - start_time) * 1000:.2f} ms")
    
    # measure the size of the objects
    size = 0
    for r in reports:
        # Just access report_json to trigger lazy load if it's deferred
        _ = r.report_json
    
    lazy_load_end = time.perf_counter()
    if lazy_load_end > end_time:
        print(f"Time including lazy load: {(lazy_load_end - start_time) * 1000:.2f} ms")

    db.close()

if __name__ == "__main__":
    run_benchmark()
