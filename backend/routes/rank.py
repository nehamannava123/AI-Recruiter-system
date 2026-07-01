from fastapi import APIRouter
from pydantic import BaseModel

from services.embedding_service import create_embedding
from services.faiss_service import search_candidates, get_candidate_resume_text, get_candidate_resume_skills
from services.skills_matcher import compute_analytics, compute_skills_match

router = APIRouter()


class JobRequest(BaseModel):
    role: str
    job_description: str


@router.post("/rank")
def rank_candidates(job: JobRequest):

    jd_text = f"""
    Role: {job.role}

    Description:
    {job.job_description}
    """

    jd_embedding = create_embedding(jd_text)

    results = search_candidates(jd_embedding)

    top_candidates = []

    for candidate_name in results:
        # Use stored resume text when available; otherwise approximate from skills.
        resume_text = get_candidate_resume_text(candidate_name)

        if resume_text:
            match = compute_skills_match(job_description=jd_text, resume_text=resume_text)
        else:
            # Fallback: if we don't have resume text in-memory, compute via missing overlap from stored skills.
            resume_skills = get_candidate_resume_skills(candidate_name)
            # Build a fake resume text containing the skills; matcher is keyword-based.
            match = compute_skills_match(job_description=jd_text, resume_text="\n".join(resume_skills))

        top_candidates.append(
            {
                "name": candidate_name,
                "match_score": match.match_score,
                "requiredSkills": match.required_skills,
                "matchedSkills": match.matched_skills,
                "missingSkills": match.missing_skills,
            }
        )

    overall_analytics = compute_analytics(
        job_description=jd_text,
        resume_text=get_candidate_resume_text(results[0]) if results else "",
    )

    return {
        "top_candidates": top_candidates,
        "analytics": overall_analytics,
    }
