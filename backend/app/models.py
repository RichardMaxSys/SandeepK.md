from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from .database import Base
import datetime

class Resume(Base):
    __tablename__ = "resumes"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    content_text = Column(Text)
    structured_data = Column(JSON) # Parsed AI profile
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    company = Column(String)
    location = Column(String)
    description = Column(Text)
    description_snapshot = Column(Text) # Original snapshot
    url = Column(String)
    source = Column(String)
    match_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ApplicationPackage(Base):
    __tablename__ = "application_packages"
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"))
    resume_id = Column(Integer, ForeignKey("resumes.id"))
    tailored_resume_text = Column(Text)
    cover_letter = Column(Text)
    ats_report = Column(JSON)
    recruiter_notes = Column(Text)
    fit_score_explanation = Column(Text)
    status = Column(String, default="draft") # draft, reviewed, applied, interview, offer, rejected
    outcome = Column(String, nullable=True) # Success tracking
    approved_for_apply = Column(DateTime, nullable=True) # Manual approval timestamp
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    job = relationship("Job")
    resume = relationship("Resume")
