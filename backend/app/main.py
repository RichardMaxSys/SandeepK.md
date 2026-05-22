from fastapi import FastAPI, Depends, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from .database import engine, Base, get_db
from .models import Resume, Job, ApplicationPackage
from .services.ai_service import parse_resume
from .services.job_search_service import search_jobs
from .worker import process_application_package
from .services.document_service import generate_docx, generate_pdf
from .services.automation_service import run_dry_run
from fastapi.responses import StreamingResponse
import io
import datetime
from pdfminer.high_level import extract_text as extract_pdf_text

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Personal Job Application Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Job Application Assistant API is running"}

@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()

    if file.filename.endswith(".pdf"):
        text_content = extract_pdf_text(io.BytesIO(content))
    else:
        text_content = content.decode("utf-8")

    # Parse resume
    structured_data = await parse_resume(text_content)

    db_resume = Resume(filename=file.filename, content_text=text_content, structured_data=structured_data)
    db.add(db_resume)
    db.commit()
    db.refresh(db_resume)
    return db_resume

@app.get("/search")
async def search(query: str, db: Session = Depends(get_db)):
    jobs = await search_jobs(query)
    # Save jobs to DB
    db_jobs = []
    for job_data in jobs:
        db_job = Job(**job_data)
        db.add(db_job)
        db_jobs.append(db_job)
    db.commit()
    return db_jobs

@app.post("/generate-package/{job_id}/{resume_id}")
async def generate_package(job_id: int, resume_id: int, db: Session = Depends(get_db)):
    package = ApplicationPackage(job_id=job_id, resume_id=resume_id, status="processing")
    db.add(package)
    db.commit()
    db.refresh(package)

    # Trigger background task
    process_application_package.delay(package.id)

    return package

@app.get("/packages")
async def list_packages(db: Session = Depends(get_db)):
    # Join with Job to get titles for the UI
    packages = db.query(ApplicationPackage).order_by(ApplicationPackage.created_at.desc()).all()
    result = []
    for pkg in packages:
        job = db.query(Job).get(pkg.job_id)
        result.append({
            "id": pkg.id,
            "status": pkg.status,
            "created_at": pkg.created_at,
            "job_title": job.title if job else "Unknown",
            "job_company": job.company if job else "Unknown",
            "tailored_resume_text": pkg.tailored_resume_text,
            "ats_report": pkg.ats_report
        })
    return result

@app.post("/dry-run/{package_id}")
async def dry_run(package_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    package = db.query(ApplicationPackage).get(package_id)
    if not package:
        return {"error": "Package not found"}

    job = db.query(Job).get(package.job_id)
    resume = db.query(Resume).get(package.resume_id)

    # Extract data from structured profile
    user_data = resume.structured_data.get("contact_info", {})

    background_tasks.add_task(run_dry_run, job.url, user_data)
    return {"message": "Dry run started"}

@app.post("/approve-package/{package_id}")
async def approve_package(package_id: int, db: Session = Depends(get_db)):
    package = db.query(ApplicationPackage).get(package_id)
    if not package:
        return {"error": "Package not found"}

    package.status = "approved"
    package.approved_for_apply = datetime.datetime.utcnow()
    db.commit()
    return {"message": "Package approved"}

@app.get("/download/{package_id}/{format}")
async def download_package(package_id: int, format: str, db: Session = Depends(get_db)):
    package = db.query(ApplicationPackage).get(package_id)
    if not package:
        return {"error": "Package not found"}

    content = package.tailored_resume_text or "No content"

    if format == "docx":
        stream = generate_docx(content)
        return StreamingResponse(stream, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", headers={"Content-Disposition": f"attachment; filename=resume_{package_id}.docx"})
    else:
        stream = generate_pdf(content)
        return StreamingResponse(stream, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=resume_{package_id}.pdf"})
