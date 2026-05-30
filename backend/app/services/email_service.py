import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger(__name__)

def send_interview_email(
    candidate_name: str,
    candidate_email: str,
    job_title: str,
    company: str,
    overall_score: float,
    matching_skills: list,
) -> bool:
    try:
        if not settings.EMAIL_USER or not settings.EMAIL_PASSWORD:
            logger.warning("Email credentials not configured")
            return False

        company_name = company or "Our Company"
        first_name = candidate_name.split()[0]

        html_body = f"""
<html><body style="font-family:Arial,sans-serif;background:#f8fafc;padding:20px">
<div style="max-width:600px;margin:auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
  <div style="background:linear-gradient(135deg,#0ea5e9,#8b5cf6);padding:40px 32px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:26px">🎉 Congratulations, {first_name}!</h1>
    <p style="color:rgba(255,255,255,0.85);margin:8px 0 0">You've been shortlisted for <strong>{job_title}</strong></p>
    <div style="display:inline-block;background:rgba(255,255,255,0.2);color:#fff;padding:8px 20px;border-radius:99px;font-size:15px;font-weight:700;margin-top:16px">
      ⭐ Match Score: {round(overall_score)}%
    </div>
  </div>
  <div style="padding:36px 32px">
    <p style="font-size:18px;font-weight:600;color:#0f172a">Dear {candidate_name},</p>
    <p style="font-size:15px;color:#475569;line-height:1.7">
      We are pleased to inform you that you have been identified as a <strong>strong fit</strong>
      for the <strong>{job_title}</strong> position at <strong>{company_name}</strong>
      with a match score of <strong>{round(overall_score)}%</strong>.
    </p>
    <div style="background:#f0f9ff;border-left:4px solid #0ea5e9;border-radius:8px;padding:16px 20px;margin:20px 0">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#0284c7;text-transform:uppercase">Your Matched Skills</p>
      {''.join(f'<span style="display:inline-block;background:#bae6fd;color:#0369a1;padding:4px 12px;border-radius:99px;font-size:13px;font-weight:600;margin:3px">{s.title()}</span>' for s in matching_skills[:6])}
    </div>
    <p style="font-size:15px;color:#475569;line-height:1.7">
      Our HR team will contact you within <strong>2-3 business days</strong> with interview details.
    </p>
    <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin:24px 0">
      <h3 style="font-size:14px;font-weight:700;color:#0f172a;margin:0 0 12px">What happens next?</h3>
      <p style="font-size:14px;color:#475569;margin:6px 0">✅ HR will confirm your availability</p>
      <p style="font-size:14px;color:#475569;margin:6px 0">✅ Interview schedule will be shared</p>
      <p style="font-size:14px;color:#475569;margin:6px 0">✅ Technical and HR rounds</p>
      <p style="font-size:14px;color:#475569;margin:6px 0">✅ Final offer letter</p>
    </div>
    <p style="font-size:15px;color:#475569">Best regards,<br><strong>HR Team — {company_name}</strong></p>
  </div>
  <div style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0">
    <p style="font-size:13px;color:#94a3b8;margin:0">Sent by RecruitAI — Intelligent Resume Screening</p>
  </div>
</div>
</body></html>
"""

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"🎉 Interview Invitation — {job_title} at {company_name}"
        msg["From"] = f"RecruitAI <{settings.EMAIL_USER}>"
        msg["To"] = candidate_email

        msg.attach(MIMEText(f"Congratulations {first_name}! You scored {round(overall_score)}% for {job_title}.", "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
            server.starttls()
            server.login(settings.EMAIL_USER, settings.EMAIL_PASSWORD)
            server.sendmail(settings.EMAIL_USER, candidate_email, msg.as_string())

        logger.info(f"Email sent to {candidate_email}")
        return True

    except Exception as e:
        logger.error(f"Email failed: {e}")
        return False