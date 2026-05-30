from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid

from app.core.database import get_db
from app.models.models import JobDescription
from app.models.schemas import JobDescriptionCreate, JobDescriptionResponse
from app.services.resume_parser import extract_text
from app.services.scorer import extract_jd_info

router = APIRouter()

@router.post("/", response_model=JobDescriptionResponse)
def create_job(job_data: JobDescriptionCreate, db: Session = Depends(get_db)):
    jd_info = extract_jd_info(job_data.content)
    job = JobDescription(
        title=job_data.title,
        company=job_data.company,
        content=job_data.content,
        required_skills=jd_info.get("required_skills", []),
        required_experience=jd_info.get("required_experience", ""),
        required_education=jd_info.get("required_education", ""),
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

@router.post("/upload", response_model=JobDescriptionResponse)
async def upload_job_file(
    title: str,
    company: Optional[str] = None,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ["pdf", "doc", "docx", "txt"]:
        raise HTTPException(400, "Unsupported format. Use PDF, DOC, DOCX, or TXT.")

    content = await file.read()
    unique_name = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join("uploads/jds", unique_name)

    with open(file_path, "wb") as f:
        f.write(content)

    if ext == "txt":
        jd_text = content.decode("utf-8", errors="ignore")
    else:
        jd_text = extract_text(file_path, ext)

    jd_info = extract_jd_info(jd_text)
    job = JobDescription(
        title=title,
        company=company,
        content=jd_text,
        file_path=file_path,
        required_skills=jd_info.get("required_skills", []),
        required_experience=jd_info.get("required_experience", ""),
        required_education=jd_info.get("required_education", ""),
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

@router.get("/", response_model=List[JobDescriptionResponse])
def list_jobs(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(JobDescription).offset(skip).limit(limit).all()

@router.get("/{job_id}", response_model=JobDescriptionResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    return job

@router.delete("/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    db.delete(job)
    db.commit()
    return {"message": "Job deleted"}
