from celery import Celery
import os
from .services.ai_service import tailor_resume, generate_cover_letter, analyze_ats
from .database import SessionLocal
from .models import ApplicationPackage, Job, Resume

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

celery = Celery(__name__, broker=REDIS_URL, backend=REDIS_URL)

@celery.task
def process_application_package(package_id: int):
    db = SessionLocal()
    try:
        package = db.query(ApplicationPackage).get(package_id)
        if not package:
            return

        job = db.query(Job).get(package.job_id)
        resume = db.query(Resume).get(package.resume_id)

        # 1. Tailor Resume
        tailored_text = tailor_resume(resume.content_text, job.description)
        package.tailored_resume_text = tailored_text

        # 2. Generate Cover Letter
        cover_letter = generate_cover_letter(resume.content_text, job.description)
        package.cover_letter = cover_letter

        # 3. Analyze ATS
        ats_report = analyze_ats(tailored_text, job.description)
        package.ats_report = ats_report

        package.status = "tailored"
        db.commit()

    except Exception as e:
        print(f"Error processing package {package_id}: {e}")
    finally:
        db.close()
