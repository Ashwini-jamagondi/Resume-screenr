from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class JobDescriptionCreate(BaseModel):
    title: str
    company: Optional[str] = None
    content: str

class JobDescriptionResponse(BaseModel):
    id: int
    title: str
    company: Optional[str]
    content: str
    required_skills: Optional[List[str]]
    required_experience: Optional[str]
    required_education: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class ResumeResponse(BaseModel):
    id: int
    candidate_name: str
    email: Optional[str]
    phone: Optional[str]
    file_name: str
    file_path: str
    file_type: str
    skills: Optional[List[str]]
    experience_years: Optional[float]
    education: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class AnalysisResponse(BaseModel):
    id: int
    job_id: int
    resume_id: int
    overall_score: float
    skills_score: Optional[float]
    experience_score: Optional[float]
    education_score: Optional[float]
    keyword_score: Optional[float]
    matching_skills: Optional[List[str]]
    missing_skills: Optional[List[str]]
    rank: Optional[int]
    summary: Optional[str]
    created_at: datetime
    resume: Optional[ResumeResponse]

    class Config:
        from_attributes = True

class RankedCandidateResponse(BaseModel):
    rank: int
    overall_score: float
    skills_score: Optional[float]
    experience_score: Optional[float]
    education_score: Optional[float]
    keyword_score: Optional[float]
    matching_skills: Optional[List[str]]
    missing_skills: Optional[List[str]]
    summary: Optional[str]
    candidate_name: str
    email: Optional[str]
    phone: Optional[str]
    file_name: str
    file_path: str
    resume_id: int
    analysis_id: int

    class Config:
        from_attributes = True
