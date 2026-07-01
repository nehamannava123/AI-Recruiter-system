def calculate_trust(candidate):

    # Backward-compatible: accept either a plain resume text (str) or a candidate dict.
    if isinstance(candidate, str):
        resume_text = candidate
    else:
        # Best-effort text representation for the current dummy /trust endpoint.
        resume_text = " "
        try:
            # candidate may be: {projects: [...], github: bool, certifications: bool}
            projects = candidate.get("projects", []) or []
            resume_text = " ".join(projects) + " "
            if candidate.get("github"):
                resume_text += " github "
            if candidate.get("certifications"):
                resume_text += " certification "
            if candidate.get("experience"):
                resume_text += " experience "
        except Exception:
            pass

    score = 50

    keywords = [
        "project",
        "intern",
        "github",
        "certification",
        "experience"
    ]

    for keyword in keywords:
        if keyword.lower() in resume_text.lower():
            score += 10

    return min(score, 100)
