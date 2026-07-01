import faiss
import numpy as np

dimension = 384

index = faiss.IndexFlatL2(dimension)

# In-memory candidate metadata.
# Since /rank currently only returns names from FAISS,
# we also store the resume text + extracted skills for each candidate.
candidate_names = []
candidate_resume_text = {}  # name -> full extracted resume text

candidate_resume_skills = {}  # name -> list of extracted skills


def add_candidate(name, embedding, resume_text: str | None = None, resume_skills=None):

    vector = np.array(
        [embedding]
    ).astype("float32")

    index.add(vector)

    candidate_names.append(name)

    if resume_text is not None:
        candidate_resume_text[name] = resume_text

    if resume_skills is not None:
        candidate_resume_skills[name] = resume_skills


def search_candidates(query_embedding):

    vector = np.array(
        [query_embedding]
    ).astype("float32")

    k = min(10, len(candidate_names))
    if k <= 0:
        return []

    D, I = index.search(
        vector,
        k
    )

    return [
        candidate_names[i]
        for i in I[0]
        if 0 <= i < len(candidate_names)
    ]


def get_candidate_resume_text(name: str) -> str | None:
    return candidate_resume_text.get(name)


def get_candidate_resume_skills(name: str):
    return candidate_resume_skills.get(name, [])
