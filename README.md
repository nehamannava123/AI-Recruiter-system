# AI Recruiter — Candidate + Recruiter Portals

## What changed from the original version

- **Real login** for two roles: `candidate` and `recruiter` (JWT-based, passwords hashed with bcrypt).
- **SQLite persistence** (`backend/candidates.db`, auto-created on first run) replacing the old in-memory FAISS store. Three tables: `users`, `jobs`, `applications`.
- **Recruiters post jobs** through a form in the app. **Candidates browse all open jobs** and apply directly to one.
- **Resumes go straight to the recruiter**: an uploaded resume is tied to a specific `job_id` + `candidate_id` (an `Application` row), so the recruiter who owns that job sees it immediately under "View Applicants" — no manual hand-off step.
- **Analysis logic is unchanged**: the same keyword-based skill extractor and `compute_skills_match` you already had are used to compute match score / matched / missing skills, now scoped per job instead of a single global JD.
- **Trust score & interview questions are now wired to real data** instead of the old hardcoded dummy candidate — they run against each application's actual resume text and matched skills.
- Dropped the global FAISS candidate search — since resumes are now tied directly to the job they were submitted for, there's no need to semantically search across all resumes to find "top candidates" for a role. Embeddings are still stored (in case you want semantic re-ranking within a job's applicant pool later), but not used yet.

### New in this update

- **Recruiter dashboard stat cards**: Total Jobs, Applications Received, Shortlisted Candidates, Rejected Candidates, and Average Match Score, computed live from `/recruiter/stats`.
- **Application status workflow**: recruiters can Shortlist or Reject a candidate from the applicant list; status is shown as a badge everywhere (recruiter dashboard, candidate's "My Applications" page).
- **AI resume feedback**: a heuristic feedback engine (`services/resume_feedback.py`) generates a short list of actionable tips (missing skills to emphasize, resume length, lack of quantified achievements, etc.) shown to the candidate right after upload and on their "My Applications" page.
- **AI video interview**: candidates can take a webcam-based interview (`/candidate/interview/:applicationId`) with randomized, resume-skill-based questions (`services/interview_generator.py`). The session is recorded via the browser's `MediaRecorder` API and uploaded to the backend; answers can be typed or (in Chrome/Edge) dictated with the browser's built-in speech recognition. Answers are scored with a lightweight heuristic evaluator — no external AI API key required, fully offline.
- **Interview scoring on the recruiter dashboard**: each applicant row shows the interview score plus a breakdown of correct / wrong / unanswered questions.

## Project structure

```
backend/
  main.py              FastAPI app, mounts all routers, serves /media (interview recordings)
  database.py           SQLite/SQLAlchemy setup
  models.py             User, Job, Application tables (status, AI feedback, interview scoring fields)
  auth/
    security.py          password hashing + JWT
    dependencies.py       get_current_user, require_role
  routes/
    auth.py               POST /auth/register, POST /auth/login
    jobs.py                POST/GET /jobs, GET /jobs/{id}
    upload.py               POST /upload  (candidate, needs job_id) — also generates AI resume feedback
    rank.py                  GET /jobs/{id}/candidates  (recruiter) — includes status + interview summary
    trust.py                  GET /applications/{id}/trust  (recruiter)
    interview.py               AI video interview: start/submit/video/result endpoints
    recruiter.py                 GET /recruiter/stats, PATCH /applications/{id}/status
    candidate.py                  GET /candidate/applications  (candidate's own applications + feedback + interview status)
  services/              resume parsing, skill extraction/matching, trust score,
                          AI interview question generation + scoring, AI resume feedback

frontend/src/
  auth/AuthContext.jsx   login/register/logout, session in localStorage
  api.js                 fetch wrapper that attaches the JWT
  pages/
    Login.jsx / Register.jsx
    CandidatePortal.jsx    browse jobs
    JobApply.jsx            job detail + resume upload + AI resume feedback
    CandidateApplications.jsx  "My Applications": status, AI feedback, interview score, entry point to interview
    AIInterview.jsx           webcam-recorded AI interview flow
    RecruiterPortal.jsx      post a job + dashboard stat cards + list your jobs
    JobDashboard.jsx          ranked applicants, status badges, shortlist/reject, trust score, interview score
  components/MissingSkillsPie.jsx
```

## Running it (quickest way)

Two terminals:

```bash
# Terminal 1
cd backend
./run.sh          # Windows: run.bat

# Terminal 2
cd frontend
./run.sh          # Windows: run.bat
```

Each script creates its environment / installs dependencies on the first run only, then starts the server. Backend runs at `http://127.0.0.1:8000`, frontend (Vite) usually at `http://127.0.0.1:5173`.

### Manual setup (equivalent, if you'd rather run the commands yourself)

**Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate      # venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload
```
This creates `backend/candidates.db` automatically on first run.

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

Requires Python 3.10+ and Node 18+.

## Trying it out

1. Register a **recruiter** account, log in, post a job. You'll see the dashboard stat cards (Total Jobs, Applications Received, Shortlisted, Rejected, Average Match Score) above the job form.
2. Register a **candidate** account (different browser tab/incognito, or log out first), you'll see the job on the candidate portal — click "View & Apply" and upload a resume PDF. You'll immediately see your match score, matched/missing skills, and AI resume feedback.
3. From "My Applications" (top bar on the candidate portal), click **"Take AI Video Interview"**. Allow camera/microphone access, answer the randomized resume-based questions (typed or spoken), and submit — you'll get an instant score.
4. Log back in as the recruiter, open "View Applicants" on that job to see the ranked candidate with match score, matched/missing skills, trust score, application status, and the AI interview score breakdown (correct/wrong/unanswered). Use the **Shortlist** / **Reject** buttons to update status — this flows back into the dashboard stat cards.

## Notes / things worth doing next

- `SECRET_KEY` in `auth/security.py` defaults to a dev value — set the `AI_RECRUITER_SECRET_KEY` environment variable before deploying anywhere real.
- The skill list in `services/skill_extractor.py` is still a small fixed keyword list (Python, Java, FastAPI, SQL, Machine Learning, Docker, AWS, React) — worth expanding for better match accuracy.
- The AI resume feedback and AI interview scoring are both heuristic (rule-based), not calls to an external LLM — this keeps the app fully self-contained and free to run, but the quality of feedback/scoring is naturally simpler than a real LLM would produce. Swapping in a real LLM call (e.g. via the Anthropic API) in `services/resume_feedback.py` / `services/interview_generator.py` would be the natural next step.
- Interview video recordings are saved to `backend/uploads/interviews/` and served at `/media/interviews/...` — not deleted automatically, so add cleanup/storage limits before using this in production.
- No password-reset, email verification, or rate limiting yet — fine for a demo, not for production.

