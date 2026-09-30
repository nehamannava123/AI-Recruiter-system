from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Set

from .skill_extractor import extract_skills


@dataclass
class MatchResult:
    required_skills: List[str]
    resume_skills_found: List[str]
    missing_skills: List[str]
    matched_skills: List[str]
    match_score: float


def compute_skills_match(job_description: str, resume_text: str) -> MatchResult:
    """Compute missing/matched skills and a normalized match score.

    match_score is in [0, 100].
    """

    required = extract_skills(job_description)
    found = extract_skills(resume_text)

    required_set: Set[str] = {s.strip() for s in required if s and s.strip()}
    found_set: Set[str] = {s.strip() for s in found if s and s.strip()}

    matched_set = required_set.intersection(found_set)
    missing_set = required_set.difference(found_set)

    total = len(required_set) if required_set else 0
    matched = len(matched_set)

    if total == 0:
        # If we can't infer required skills, fall back to "no signal".
        score = 0.0
    else:
        score = (matched / total) * 100

    # Stable ordering (preserve order from extraction)
    required_ordered = [s for s in required if s in required_set]
    matched_ordered = [s for s in required_ordered if s in matched_set]
    missing_ordered = [s for s in required_ordered if s in missing_set]

    return MatchResult(
        required_skills=required_ordered,
        resume_skills_found=[s for s in found if s in found_set],
        missing_skills=missing_ordered,
        matched_skills=matched_ordered,
        match_score=round(score, 2),
    )


def compute_analytics(job_description: str, resume_text: str) -> Dict:
    res = compute_skills_match(job_description=job_description, resume_text=resume_text)

    return {
        "totalRequiredSkills": len(res.required_skills),
        "matchedSkillsCount": len(res.matched_skills),
        "missingSkillsCount": len(res.missing_skills),
        "matchedSkills": res.matched_skills,
        "missingSkills": res.missing_skills,
        "resumeSkillsFound": res.resume_skills_found,
        "matchScore": res.match_score,
    }

