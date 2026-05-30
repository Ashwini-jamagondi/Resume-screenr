import json
import re
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


def calculate_experience_from_dates(text: str) -> float:
    """Extract experience in years from date ranges in resume text."""
    total_months = 0
    
    month_map = {
        'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
        'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12,
        'january': 1, 'february': 2, 'march': 3, 'april': 4, 'june': 6,
        'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12
    }

    # Match patterns like "Jan 2024 – Apr 2024" or "Jan 2024 - Apr 2024"
    pattern = r'([A-Za-z]+)\s+(\d{4})\s*[–\-—to]+\s*([A-Za-z]+)\s+(\d{4})'
    matches = re.findall(pattern, text, re.IGNORECASE)

    for m1, y1, m2, y2 in matches:
        m1l = m1.lower()[:3]
        m2l = m2.lower()[:3]
        if m1l in month_map and m2l in month_map:
            start = int(y1) * 12 + month_map[m1l]
            end = int(y2) * 12 + month_map[m2l]
            diff = end - start
            if 0 < diff < 60:  # reasonable range: up to 5 years
                total_months += diff

    # Also check for "X years" pattern
    explicit = re.search(r'(\d+)\+?\s*years?\s+of\s+experience', text.lower())
    if explicit:
        return float(explicit.group(1))

    # Count projects as partial experience (each project = 0.25 years)
    project_count = len(re.findall(r'(project|built|developed|created|implemented)', text.lower()))
    project_bonus = min(project_count * 0.1, 0.5)

    years = total_months / 12 + project_bonus
    return round(years, 2)


def score_with_ai(
    resume_text: str,
    jd_text: str,
    resume_skills: List[str],
    jd_title: str
) -> Dict[str, Any]:
    """Use Claude AI to score a resume against a JD."""
    try:
        import anthropic
        from app.core.config import settings

        if not settings.ANTHROPIC_API_KEY:
            raise ValueError("No API key set")

        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

        prompt = f"""You are an expert HR recruiter. Analyze this resume against the job description and provide a detailed scoring.

JOB DESCRIPTION:
Title: {jd_title}
{jd_text}

RESUME:
{resume_text[:3000]}

Provide scores (0-100) for each dimension and respond ONLY with a valid JSON object:
{{
  "overall_score": <number 0-100>,
  "skills_score": <number 0-100>,
  "experience_score": <number 0-100>,
  "education_score": <number 0-100>,
  "keyword_score": <number 0-100>,
  "matching_skills": [<list of matching skills found>],
  "missing_skills": [<list of important skills from JD not found in resume>],
  "summary": "<2-3 sentence assessment of candidate fit>"
}}

IMPORTANT scoring notes:
- For fresh graduate roles, internships and projects count as experience
- A student with internships and strong projects should score 60-80 on experience
- skills_score: How well resume skills match required skills
- experience_score: For freshers, count internships + projects. 2 internships = 70+
- education_score: Education level vs requirements
- keyword_score: Presence of important JD keywords
- overall_score: Weighted average (skills 35%, experience 30%, education 20%, keywords 15%)"""

        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )

        response_text = message.content[0].text.strip()
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
            return {
                "overall_score": min(100, max(0, float(result.get("overall_score", 0)))),
                "skills_score": min(100, max(0, float(result.get("skills_score", 0)))),
                "experience_score": min(100, max(0, float(result.get("experience_score", 0)))),
                "education_score": min(100, max(0, float(result.get("education_score", 0)))),
                "keyword_score": min(100, max(0, float(result.get("keyword_score", 0)))),
                "matching_skills": result.get("matching_skills", []),
                "missing_skills": result.get("missing_skills", []),
                "summary": result.get("summary", ""),
            }
    except Exception as e:
        logger.warning(f"AI scoring unavailable, using heuristics: {e}")

    return score_with_heuristics(resume_text, jd_text, resume_skills)


def score_with_heuristics(
    resume_text: str,
    jd_text: str,
    resume_skills: List[str]
) -> Dict[str, Any]:
    """Improved heuristic scoring."""
    resume_lower = resume_text.lower()
    jd_lower = jd_text.lower()

    # --- Keyword overlap score ---
    jd_words = set(re.findall(r'\b\w{3,}\b', jd_lower))
    resume_words = set(re.findall(r'\b\w{3,}\b', resume_lower))
    common_words = {
        "the", "and", "for", "are", "with", "this", "that", "have",
        "will", "you", "from", "they", "your", "can", "all", "been",
        "our", "not", "but", "also", "has", "its", "was", "were",
        "work", "using", "used", "based", "good", "well", "strong"
    }
    jd_keywords = jd_words - common_words
    keyword_overlap = jd_keywords & resume_words
    keyword_score = min(100, (len(keyword_overlap) / max(len(jd_keywords), 1)) * 150)

    # --- Skills score ---
    resume_skills_set = set(s.lower() for s in resume_skills)
    skill_keywords = [
        "python", "javascript", "java", "sql", "react", "node",
        "aws", "docker", "kubernetes", "typescript", "mongodb",
        "postgresql", "mysql", "django", "flask", "fastapi", "git",
        "linux", "css", "html", "angular", "vue", "spring",
        "tensorflow", "pytorch", "kotlin", "android", "ios", "swift"
    ]
    jd_skills = set()
    for skill in skill_keywords:
        if skill in jd_lower:
            jd_skills.add(skill)

    matching_skills = list(resume_skills_set & jd_skills)
    # Also check raw resume text for skills not in parsed list
    extra_matches = []
    for skill in jd_skills:
        if skill in resume_lower and skill not in matching_skills:
            matching_skills.append(skill)
            extra_matches.append(skill)

    missing_skills = list(jd_skills - set(matching_skills))
    skills_score = min(100, (len(matching_skills) / max(len(jd_skills), 1)) * 100) if jd_skills else 50

    # --- Experience score (smart for freshers) ---
    exp_years = calculate_experience_from_dates(resume_text)

    # Count internships
    internship_count = len(re.findall(
        r'intern|internship|trainee|apprentice', resume_lower
    ))
    # Count projects
    project_count = len(re.findall(
        r'\b(project|built|developed|created|implemented|designed)\b', resume_lower
    ))

    # For fresh graduate JDs, internships + projects count heavily
    is_fresher_jd = any(w in jd_lower for w in [
        'fresh graduate', 'fresher', 'entry level', 'entry-level',
        '0-1 year', '0 year', 'no experience required', 'recent graduate'
    ])

    if is_fresher_jd or exp_years < 1:
        # Score based on internships and projects for freshers
        base = 50  # base for being a student
        intern_bonus = min(internship_count * 15, 30)
        project_bonus = min(project_count * 5, 20)
        experience_score = min(100, base + intern_bonus + project_bonus)
    else:
        jd_exp_match = re.search(r'(\d+)\+?\s*years?', jd_lower)
        jd_exp = int(jd_exp_match.group(1)) if jd_exp_match else 2
        experience_score = min(100, (exp_years / max(jd_exp, 1)) * 100)
        # Bonus for internships even with experience
        experience_score = min(100, experience_score + internship_count * 5)

    # --- Education score ---
    edu_score = 60
    if any(d in resume_lower for d in ["phd", "ph.d", "doctorate"]):
        edu_score = 100
    elif any(d in resume_lower for d in ["master", "mba", "m.s.", "m.tech", "msc"]):
        edu_score = 85
    elif any(d in resume_lower for d in ["bachelor", "b.s.", "b.tech", "b.e.", "bsc", "be ", "btech", "b.e"]):
        edu_score = 75
    # GPA bonus
    gpa_match = re.search(r'cgpa[:\s]+(\d+\.?\d*)|gpa[:\s]+(\d+\.?\d*)', resume_lower)
    if gpa_match:
        gpa = float(gpa_match.group(1) or gpa_match.group(2))
        if gpa >= 9.0:
            edu_score = min(100, edu_score + 15)
        elif gpa >= 8.0:
            edu_score = min(100, edu_score + 8)
        elif gpa >= 7.0:
            edu_score = min(100, edu_score + 4)

    # --- Overall score ---
    overall = (
        skills_score * 0.35 +
        experience_score * 0.30 +
        edu_score * 0.20 +
        keyword_score * 0.15
    )

    # --- Summary ---
    if overall >= 75:
        fit = "Strong fit — highly recommended for interview."
    elif overall >= 60:
        fit = "Good fit — relevant skills and experience present."
    elif overall >= 45:
        fit = "Moderate fit — some skill gaps but shows potential."
    else:
        fit = "Lower fit — significant gaps compared to requirements."

    summary = (
        f"Candidate matched {len(matching_skills)} of {len(jd_skills)} required skills "
        f"with {internship_count} internship(s) and {project_count} project(s). "
        f"Overall score: {round(overall, 1)}%. {fit}"
    )

    return {
        "overall_score": round(overall, 1),
        "skills_score": round(skills_score, 1),
        "experience_score": round(experience_score, 1),
        "education_score": round(edu_score, 1),
        "keyword_score": round(keyword_score, 1),
        "matching_skills": matching_skills,
        "missing_skills": missing_skills,
        "summary": summary,
    }


def extract_jd_info(jd_text: str) -> Dict[str, Any]:
    """Extract structured info from job description."""
    try:
        import anthropic
        from app.core.config import settings

        if not settings.ANTHROPIC_API_KEY:
            raise ValueError("No API key")

        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        prompt = f"""Extract key info from this job description. Return ONLY valid JSON:
{{
  "required_skills": [<list of required technical skills>],
  "required_experience": "<experience requirement e.g. '3+ years'>",
  "required_education": "<education requirement>"
}}

JOB DESCRIPTION:
{jd_text[:2000]}"""

        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}]
        )
        response_text = message.content[0].text.strip()
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except Exception as e:
        logger.warning(f"JD AI extraction unavailable: {e}")

    # Heuristic fallback
    jd_lower = jd_text.lower()
    skill_keywords = [
        "python", "javascript", "java", "sql", "react", "node.js", "aws",
        "docker", "kubernetes", "typescript", "mongodb", "postgresql",
        "django", "flask", "git", "linux", "css", "html", "angular",
        "vue", "spring", "kotlin", "android", "ios"
    ]
    found_skills = [s for s in skill_keywords if s in jd_lower]
    exp_match = re.search(r'(\d+)\+?\s*years?', jd_lower)
    exp = f"{exp_match.group(1)}+ years" if exp_match else "Fresh graduate"

    edu = "Not specified"
    if "phd" in jd_lower:
        edu = "PhD"
    elif "master" in jd_lower or "mba" in jd_lower:
        edu = "Master's degree"
    elif "bachelor" in jd_lower or "b.tech" in jd_lower or "b.e" in jd_lower:
        edu = "Bachelor's degree"

    return {
        "required_skills": found_skills,
        "required_experience": exp,
        "required_education": edu,
    }