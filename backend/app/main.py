from fastapi import FastAPI, Depends, UploadFile, File, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from .database import Base, get_db, ensure_tables
from .models import Resume, Job, ApplicationPackage
from .services.ai_service import parse_resume, analyze_ats, tailor_resume
from .services.job_search_service import search_jobs, compute_match_score
from .worker import process_application_package
from .services.document_service import generate_docx, generate_pdf
from .services.automation_service import run_dry_run
from fastapi.responses import StreamingResponse
import io
import datetime
from pdfminer.high_level import extract_text as extract_pdf_text
from .routers.ai import router as ai_router

ensure_tables()

app = FastAPI(title="Personal Job Application Assistant")

app.include_router(ai_router)

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
async def search(
    query: str = Query(..., description="Job search query"),
    location: Optional[str] = Query(None, description="City or province to search in"),
    job_type: Optional[str] = Query(None, description="Contract type: full-time, part-time, contract, internship"),
    salary_min: Optional[int] = Query(None, description="Minimum salary"),
    salary_max: Optional[int] = Query(None, description="Maximum salary"),
    max_days_old: Optional[int] = Query(None, description="Max days since posting"),
    sort_by: Optional[str] = Query("relevance", description="Sort order: relevance, date, salary"),
    page: int = Query(1, description="Page number", ge=1),
    results_per_page: int = Query(20, description="Results per page", ge=1, le=50),
    db: Session = Depends(get_db),
):
    result = await search_jobs(
        query=query,
        location=location,
        job_type=job_type,
        salary_min=salary_min,
        salary_max=salary_max,
        max_days_old=max_days_old,
        sort_by=sort_by,
        page=page,
        results_per_page=results_per_page,
    )
    jobs = result.get("results", [])
    total = result.get("total", len(jobs))
    current_page = result.get("page", page)

    db_jobs = []
    for job_data in jobs:
        job_record = {
            "title": job_data.get("title", "Unknown"),
            "company": job_data.get("company", "Unknown"),
            "location": job_data.get("location"),
            "description": job_data.get("description", ""),
            "description_snapshot": job_data.get("description", ""),
            "url": job_data.get("url", ""),
            "source": job_data.get("source", "Adzuna"),
            "match_score": job_data.get("match_score") or compute_match_score(
                job_data.get("title", ""), job_data.get("description", "")
            ),
        }
        existing = db.query(Job).filter(Job.url == job_record["url"]).first()
        if existing:
            enriched = {k: v for k, v in existing.__dict__.items() if not k.startswith("_")}
            enriched.update({
                "tags": job_data.get("tags", []),
                "salary": job_data.get("salary", ""),
                "salary_min": job_data.get("salary_min"),
                "salary_max": job_data.get("salary_max"),
                "posted_date": job_data.get("posted_date"),
                "job_type": job_data.get("job_type"),
            })
            db_jobs.append(enriched)
            continue
        db_job = Job(**job_record)
        db.add(db_job)
        db.commit()
        db.refresh(db_job)
        enriched = {k: v for k, v in db_job.__dict__.items() if not k.startswith("_")}
        enriched.update({
            "tags": job_data.get("tags", []),
            "salary": job_data.get("salary", ""),
            "salary_min": job_data.get("salary_min"),
            "salary_max": job_data.get("salary_max"),
            "posted_date": job_data.get("posted_date"),
            "job_type": job_data.get("job_type"),
        })
        db_jobs.append(enriched)

    return {
        "results": db_jobs,
        "total": total,
        "page": current_page,
        "results_per_page": results_per_page,
        "total_pages": max(1, -(-total // results_per_page)),
    }

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

@app.post("/ats/analyze")
async def ats_analyze(request: dict, db: Session = Depends(get_db)):
    job_description = request.get("job_description", "")
    resume_text = request.get("resume_text", "")
    resume_id = request.get("resume_id")
    if not job_description or not resume_text:
        return {"error": "Both job_description and resume_text are required"}

    result = await analyze_ats(resume_text, job_description)
    return result

@app.post("/ats/rewrite")
async def ats_rewrite(request: dict, db: Session = Depends(get_db)):
    job_description = request.get("job_description", "")
    resume_text = request.get("resume_text", "")
    resume_id = request.get("resume_id")
    if not job_description or not resume_text:
        return {"error": "Both job_description and resume_text are required"}

    rewritten = await tailor_resume(resume_text, job_description)
    return {"rewritten_resume": rewritten}

@app.post("/ats/download")
async def ats_download(request: dict):
    resume_text = request.get("resume_text", "")
    format = request.get("format", "pdf")
    if not resume_text:
        return {"error": "resume_text is required"}

    if format == "docx":
        stream = generate_docx(resume_text)
        return StreamingResponse(stream, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", headers={"Content-Disposition": "attachment; filename=rewritten_resume.docx"})
    else:
        stream = generate_pdf(resume_text)
        return StreamingResponse(stream, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=rewritten_resume.pdf"})

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
