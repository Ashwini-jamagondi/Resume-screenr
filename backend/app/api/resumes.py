from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid

from app.core.database import get_db
from app.models.models import Resume, Analysis
from app.models.schemas import ResumeResponse
from app.services.resume_parser import parse_resume
from app.core.config import settings

router = APIRouter()

@router.post("/upload", response_model=List[ResumeResponse])
async def upload_resumes(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    uploaded = []
    for file in files:
        ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
        if ext not in ["pdf", "doc", "docx"]:
            raise HTTPException(400, f"File {file.filename}: unsupported format. Use PDF, DOC, or DOCX.")

        content = await file.read()
        if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
            raise HTTPException(400, f"File {file.filename} exceeds {settings.MAX_FILE_SIZE_MB}MB limit.")

        unique_name = f"{uuid.uuid4().hex}_{file.filename}"
        file_path = os.path.join("uploads/resumes", unique_name)

        with open(file_path, "wb") as f:
            f.write(content)

        parsed = parse_resume(file_path, ext)

        resume = Resume(
            candidate_name=parsed["candidate_name"],
            email=parsed["email"],
            phone=parsed["phone"],
            file_name=file.filename,
            file_path=file_path,
            file_type=ext,
            extracted_text=parsed["extracted_text"],
            skills=parsed["skills"],
            experience_years=parsed["experience_years"],
            education=parsed["education"],
        )
        db.add(resume)
        db.commit()
        db.refresh(resume)
        uploaded.append(resume)

    return uploaded

@router.get("/", response_model=List[ResumeResponse])
def list_resumes(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Resume)
    if search:
        query = query.filter(Resume.candidate_name.ilike(f"%{search}%"))
    return query.offset(skip).limit(limit).all()

@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(resume_id: int, db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(404, "Resume not found")
    return resume

@router.delete("/{resume_id}")
def delete_resume(resume_id: int, db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(404, "Resume not found")
    
    # Delete related analyses first to avoid foreign key constraint errors
    db.query(Analysis).filter(Analysis.resume_id == resume_id).delete()
    db.commit()
    
    # Now delete the resume file
    if os.path.exists(resume.file_path):
        os.remove(resume.file_path)
    
    db.delete(resume)
    db.commit()
    return {"message": "Resume deleted successfully"}