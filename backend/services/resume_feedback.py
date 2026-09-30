"""Lightweight heuristic 'AI' resume feedback generator.

Produces short, actionable feedback bullets based on the match score,
matched/missing skills and some basic resume-quality signals. No external
API calls are required, so this works fully offline.
"""


def generate_feedback(resume_text, match_score, matched_skills, missing_skills):
    resume_text = resume_text or ""
    matched_skills = matched_skills or []
    missing_skills = missing_skills or []

    feedback = []

    if match_score >= 80:
        feedback.append(
            f"Excellent match! Your resume aligns with {match_score:.0f}% of this role's requirements."
        )
    elif match_score >= 50:
        feedback.append(
            f"Good match — your resume aligns with {match_score:.0f}% of this role's requirements."
        )
    else:
        feedback.append(
            f"Your resume currently matches {match_score:.0f}% of this role's requirements. "
            "There's meaningful room to tailor it further for this job."
        )

    if matched_skills:
        feedback.append(
            "Strong areas: your resume clearly highlights " + ", ".join(matched_skills) + "."
        )

    if missing_skills:
        feedback.append(
            "Consider adding or emphasizing: " + ", ".join(missing_skills) + ". "
            "If you have experience with these, make it explicit with a concrete example or project."
        )

    word_count = len(resume_text.split())
    if word_count == 0:
        feedback.append("We couldn't extract readable text from your resume — try re-uploading a text-based PDF.")
    elif word_count < 150:
        feedback.append(
            "Your resume looks quite short. Consider adding more detail about projects, responsibilities, and measurable outcomes."
        )
    elif word_count > 1200:
        feedback.append(
            "Your resume is quite long. Consider trimming it down to the most relevant and recent experience."
        )

    lower_text = resume_text.lower()
    if "project" not in lower_text:
        feedback.append(
            "Try including specific projects with clear outcomes to make your experience more concrete."
        )

    if not any(ch.isdigit() for ch in resume_text):
        feedback.append(
            "Quantify your achievements with numbers where possible (e.g., 'reduced load time by 30%')."
        )

    if "summary" not in lower_text and "objective" not in lower_text:
        feedback.append(
            "Consider adding a short summary at the top highlighting your strongest, most relevant skills."
        )

    return feedback
