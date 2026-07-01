# TODO - AI Recruiter: Analytics, Resume Preview, Missing Skills

## Backend
- [ ] Extend skill extraction: add required skills + missing skills (improve `backend/services/skill_extractor.py`)
- [ ] Compute resume skills found from extracted resume text
- [ ] Update `/upload` to return resume preview text + resume skills found
- [x] Update `/rank` to compute real match_score from JD required skills vs resume skills
- [x] Update `/rank` response to include: requiredSkills, matchedSkills, missingSkills, analytics metrics

## Persistence / Data model
- [ ] Decide storage approach for candidate skills so `/rank` can compute matches (in-memory or lightweight persistence)
- [ ] Implement chosen storage in `backend/services/faiss_service.py` or adjacent module

## Frontend
- [ ] Add missing components if they are absent in repo (Analytics, JobDescription, ResumePreview, MissingSkills)
- [ ] Update `frontend/src/pages/Dashboard/Dashboard.jsx` to render:
  - [ ] Resume preview after upload
  - [ ] Required/matched/missing skills after rank
  - [ ] Analytics section using new backend response
- [ ] Wire UI state for loading/error across upload and rank

## Validation
- [ ] Run backend + frontend and verify full flow: upload → preview → required skills → matched/missing → analytics

