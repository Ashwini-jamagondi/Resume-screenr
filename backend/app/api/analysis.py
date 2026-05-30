from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Body
from sqlalchemy.orm import Session
from typing import List, Optional
import csv
import io
from fastapi.responses import StreamingResponse

from app.core.database import get_db
from app.core.config import settings
from app.models.models import Analysis, Resume, JobDescription
from app.models.schemas import AnalysisResponse, RankedCandidateResponse
from app.services.scorer import score_with_ai
from app.services.email_service import send_interview_email

router = APIRouter()

@router.post("/run/{job_id}", response_model=List[RankedCandidateResponse])
def run_analysis(
    job_id: int,
    auto_email: bool = False,
    db: Session = Depends(get_db)
):
    job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job description not found")

    resumes = db.query(Resume).all()
    if not resumes:
        raise HTTPException(400, "No resumes uploaded. Please upload resumes first.")

    db.query(Analysis).filter(Analysis.job_id == job_id).delete()
    db.commit()

    analyses = []
    for resume in resumes:
        scores = score_with_ai(
            resume_text=resume.extracted_text or "",
            jd_text=job.content,
            resume_skills=resume.skills or [],
            jd_title=job.title
        )
        analysis = Analysis(
            job_id=job_id,
            resume_id=resume.id,
            overall_score=scores["overall_score"],
            skills_score=scores["skills_score"],
            experience_score=scores["experience_score"],
            education_score=scores["education_score"],
            keyword_score=scores["keyword_score"],
            matching_skills=scores["matching_skills"],
            missing_skills=scores["missing_skills"],
            summary=scores["summary"],
        )
        db.add(analysis)
        analyses.append((analysis, resume))

    db.commit()

    analyses.sort(key=lambda x: x[0].overall_score, reverse=True)
    ranked = []
    email_results = []

    for rank, (analysis, resume) in enumerate(analyses, start=1):
        analysis.rank = rank

        # Auto-send email if enabled and score qualifies
        email_sent = False
        if auto_email and resume.email and analysis.overall_score >= settings.STRONG_FIT_THRESHOLD:
            email_sent = send_interview_email(
                candidate_name=resume.candidate_name,
                candidate_email=resume.email,
                job_title=job.title,
                company=job.company or "",
                overall_score=analysis.overall_score,
                matching_skills=analysis.matching_skills or [],
            )
            if email_sent:
                email_results.append(resume.email)

        ranked.append(RankedCandidateResponse(
            rank=rank,
            overall_score=analysis.overall_score,
            skills_score=analysis.skills_score,
            experience_score=analysis.experience_score,
            education_score=analysis.education_score,
            keyword_score=analysis.keyword_score,
            matching_skills=analysis.matching_skills or [],
            missing_skills=analysis.missing_skills or [],
            summary=analysis.summary,
            candidate_name=resume.candidate_name,
            email=resume.email,
            phone=resume.phone,
            file_name=resume.file_name,
            file_path=resume.file_path,
            resume_id=resume.id,
            analysis_id=analysis.id,
        ))

    db.commit()
    return ranked


@router.post("/send-emails/{job_id}")
def send_shortlist_emails(job_id: int, db: Session = Depends(get_db)):
    """Send interview invitation emails to all strong fit candidates."""
    job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")

    analyses = (
        db.query(Analysis)
        .filter(Analysis.job_id == job_id)
        .filter(Analysis.overall_score >= settings.STRONG_FIT_THRESHOLD)
        .order_by(Analysis.rank.asc())
        .all()
    )

    if not analyses:
        raise HTTPException(400, "No strong fit candidates found. Run analysis first.")

    sent = []
    failed = []
    skipped = []

    for analysis in analyses:
        resume = analysis.resume
        if not resume.email:
            skipped.append(resume.candidate_name)
            continue

        success = send_interview_email(
            candidate_name=resume.candidate_name,
            candidate_email=resume.email,
            job_title=job.title,
            company=job.company or "",
            overall_score=analysis.overall_score,
            matching_skills=analysis.matching_skills or [],
        )

        if success:
            sent.append({"name": resume.candidate_name, "email": resume.email, "score": analysis.overall_score})
        else:
            failed.append(resume.candidate_name)

    return {
        "success": True,
        "sent_count": len(sent),
        "failed_count": len(failed),
        "skipped_count": len(skipped),
        "sent_to": sent,
        "failed": failed,
        "skipped_no_email": skipped,
        "threshold": settings.STRONG_FIT_THRESHOLD,
    }


@router.post("/send-email/{analysis_id}")
def send_single_email(analysis_id: int, db: Session = Depends(get_db)):
    """Send interview invitation to a single candidate."""
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(404, "Analysis not found")

    resume = analysis.resume
    job = analysis.job

    if not resume.email:
        raise HTTPException(400, f"{resume.candidate_name} has no email address in their resume.")

    success = send_interview_email(
        candidate_name=resume.candidate_name,
        candidate_email=resume.email,
        job_title=job.title,
        company=job.company or "",
        overall_score=analysis.overall_score,
        matching_skills=analysis.matching_skills or [],
    )

    if success:
        return {"success": True, "message": f"Interview invitation sent to {resume.email}"}
    else:
        raise HTTPException(500, "Failed to send email. Check your EMAIL_USER and EMAIL_PASSWORD in .env")


@router.get("/results/{job_id}", response_model=List[RankedCandidateResponse])
def get_results(job_id: int, db: Session = Depends(get_db)):
    analyses = (
        db.query(Analysis)
        .filter(Analysis.job_id == job_id)
        .order_by(Analysis.rank.asc())
        .all()
    )
    if not analyses:
        raise HTTPException(404, "No analysis found. Run analysis first.")

    return [
        RankedCandidateResponse(
            rank=a.rank or 0,
            overall_score=a.overall_score,
            skills_score=a.skills_score,
            experience_score=a.experience_score,
            education_score=a.education_score,
            keyword_score=a.keyword_score,
            matching_skills=a.matching_skills or [],
            missing_skills=a.missing_skills or [],
            summary=a.summary,
            candidate_name=a.resume.candidate_name,
            email=a.resume.email,
            phone=a.resume.phone,
            file_name=a.resume.file_name,
            file_path=a.resume.file_path,
            resume_id=a.resume.id,
            analysis_id=a.id,
        )
        for a in analyses
    ]


@router.get("/export/{job_id}")
def export_results(job_id: int, db: Session = Depends(get_db)):
    job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")

    analyses = (
        db.query(Analysis)
        .filter(Analysis.job_id == job_id)
        .order_by(Analysis.rank.asc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Rank", "Candidate Name", "Email", "Phone",
        "Overall Score", "Skills Score", "Experience Score",
        "Education Score", "Keyword Score",
        "Matching Skills", "Missing Skills", "Summary", "File Name"
    ])

    for a in analyses:
        r = a.resume
        writer.writerow([
            a.rank, r.candidate_name, r.email or "", r.phone or "",
            round(a.overall_score, 1), round(a.skills_score or 0, 1),
            round(a.experience_score or 0, 1), round(a.education_score or 0, 1),
            round(a.keyword_score or 0, 1),
            ", ".join(a.matching_skills or []),
            ", ".join(a.missing_skills or []),
            a.summary or "", r.file_name
        ])

    output.seek(0)
    filename = f"candidates_{job.title.replace(' ', '_')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )