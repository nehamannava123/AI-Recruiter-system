import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "../api";
import { secondaryButtonStyle, statusBadgeStyle } from "../styles/shared";
import MissingSkillsPie from "../components/MissingSkillsPie";

function SkillList({ skills, tone = "matched" }) {
  const bg = tone === "matched" ? "#eef2ff" : "#fef2f2";
  const color = tone === "matched" ? "#1e3a8a" : "#991b1b";
  const border = tone === "matched" ? "#c7d2fe" : "#fecaca";

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {(skills || []).map((s) => (
        <span
          key={s}
          style={{ background: bg, color, border: `1px solid ${border}`, padding: "6px 10px", borderRadius: "999px", fontSize: "13px", fontWeight: 600 }}
        >
          {s}
        </span>
      ))}
      {(!skills || skills.length === 0) && <span style={{ color: "#94a3b8", fontStyle: "italic" }}>None</span>}
    </div>
  );
}

function ScreeningScorePanel({ screening }) {
  if (!screening || !screening.completed) {
    return <p style={{ color: "#94a3b8", fontStyle: "italic", marginTop: "6px" }}>Aptitude & coding screening not completed yet.</p>;
  }

  return (
    <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", marginTop: "8px", alignItems: "center" }}>
      <span style={{ color: "#0f172a", fontWeight: 700 }}>Aptitude Score: {screening.aptitude.score}%</span>
      <span style={{ color: "#16a34a" }}>✓ Correct: {screening.aptitude.correct}</span>
      <span style={{ color: "#dc2626" }}>✗ Wrong: {screening.aptitude.wrong}</span>
      <span style={{ color: "#64748b" }}>— Unanswered: {screening.aptitude.unanswered}</span>
      <span style={{ color: "#64748b" }}>/ {screening.aptitude.total} questions</span>
      {screening.category && (
        <span style={{ color: "#7c3aed", fontWeight: 600 }}>Category: {screening.category}</span>
      )}
    </div>
  );
}

function ScreeningDetailsPanel({ aptitudeDetails, codingDetails }) {
  const toneStyles = {
    correct: { bg: "#f0fdf4", border: "#bbf7d0", label: "#15803d", icon: "✓" },
    wrong: { bg: "#fef2f2", border: "#fecaca", label: "#b91c1c", icon: "✗" },
    unanswered: { bg: "#f8fafc", border: "#e2e8f0", label: "#64748b", icon: "—" },
  };

  return (
    <div style={{ marginTop: "12px" }}>
      {aptitudeDetails && aptitudeDetails.length > 0 && (
        <>
          <h5 style={{ color: "#0f172a", marginBottom: "8px" }}>Aptitude Answers</h5>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
            {aptitudeDetails.map((item) => {
              const tone = toneStyles[item.result] || toneStyles.unanswered;
              const selected = item.selected_index;
              return (
                <div
                  key={item.question_id}
                  style={{ background: tone.bg, border: `1px solid ${tone.border}`, borderRadius: "8px", padding: "12px 14px" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                    <p style={{ color: "#0f172a", fontWeight: 700 }}>{item.question}</p>
                    <span style={{ color: tone.label, fontWeight: 800, whiteSpace: "nowrap" }}>
                      {tone.icon} {item.result}
                    </span>
                  </div>
                  <p style={{ color: "#334155", marginTop: "6px" }}>
                    Selected: {selected === null || selected === undefined ? (
                      <em style={{ color: "#94a3b8" }}>No answer given</em>
                    ) : (
                      item.options[selected]
                    )}
                  </p>
                  <p style={{ color: "#64748b", marginTop: "2px", fontSize: "13px" }}>
                    Correct answer: {item.options[item.answer_index]}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}

      {codingDetails && codingDetails.length > 0 && (
        <>
          <h5 style={{ color: "#0f172a", marginBottom: "8px" }}>Coding Answers (manual review)</h5>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {codingDetails.map((item) => (
              <div
                key={item.question_id}
                style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 14px" }}
              >
                <p style={{ color: "#0f172a", fontWeight: 700 }}>{item.title}</p>
                <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "8px" }}>{item.prompt}</p>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    color: "#334155",
                    background: "#0f172a0d",
                    padding: "10px",
                    borderRadius: "6px",
                    fontFamily: "monospace",
                    fontSize: "13px",
                    margin: 0,
                  }}
                >
                  {item.answer ? item.answer : <em style={{ color: "#94a3b8" }}>No answer given</em>}
                </pre>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function InterviewScorePanel({ interview }) {
  if (!interview || !interview.completed) {
    return <p style={{ color: "#94a3b8", fontStyle: "italic", marginTop: "6px" }}>AI interview not completed yet.</p>;
  }

  return (
    <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", marginTop: "8px" }}>
      <span style={{ color: "#0f172a", fontWeight: 700 }}>Interview Score: {interview.score}%</span>
      <span style={{ color: "#16a34a" }}>✓ Correct: {interview.correct}</span>
      <span style={{ color: "#dc2626" }}>✗ Wrong: {interview.wrong}</span>
      <span style={{ color: "#64748b" }}>— Unanswered: {interview.unanswered}</span>
      <span style={{ color: "#64748b" }}>/ {interview.total} questions</span>
    </div>
  );
}

function InterviewAnswerList({ details }) {
  const toneStyles = {
    correct: { bg: "#f0fdf4", border: "#bbf7d0", label: "#15803d", icon: "✓" },
    wrong: { bg: "#fef2f2", border: "#fecaca", label: "#b91c1c", icon: "✗" },
    unanswered: { bg: "#f8fafc", border: "#e2e8f0", label: "#64748b", icon: "—" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
      {details.map((item) => {
        const tone = toneStyles[item.result] || toneStyles.unanswered;
        return (
          <div
            key={item.question_id}
            style={{
              background: tone.bg,
              border: `1px solid ${tone.border}`,
              borderRadius: "8px",
              padding: "12px 14px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
              <p style={{ color: "#0f172a", fontWeight: 700 }}>{item.question}</p>
              <span style={{ color: tone.label, fontWeight: 800, whiteSpace: "nowrap" }}>
                {tone.icon} {item.result}
              </span>
            </div>
            <p style={{ color: "#334155", marginTop: "6px" }}>
              {item.answer ? item.answer : <em style={{ color: "#94a3b8" }}>No answer given</em>}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function CandidateRow({ candidate, onStatusChange }) {
  const [trust, setTrust] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [interviewDetails, setInterviewDetails] = useState(null);
  const [screeningDetails, setScreeningDetails] = useState(null);
  const [busy, setBusy] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchScreeningDetails = async () => {
    setBusy(true);
    try {
      const res = await apiFetch(`/applications/${candidate.application_id}/screening/result`);
      const data = await res.json();
      setScreeningDetails({
        aptitude: data.aptitude_details || [],
        coding: data.coding_details || [],
      });
    } catch {
      setScreeningDetails({ aptitude: [], coding: [] });
    }
    setBusy(false);
  };

  const fetchTrust = async () => {
    setBusy(true);
    try {
      const res = await apiFetch(`/applications/${candidate.application_id}/trust`);
      const data = await res.json();
      setTrust(data.trust_score);
    } catch {
      setTrust("error");
    }
    setBusy(false);
  };

  const fetchQuestions = async () => {
    setBusy(true);
    try {
      const res = await apiFetch(`/applications/${candidate.application_id}/interview`);
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch {
      setQuestions([]);
    }
    setBusy(false);
  };

  const fetchInterviewDetails = async () => {
    setBusy(true);
    try {
      const res = await apiFetch(`/applications/${candidate.application_id}/interview/result`);
      const data = await res.json();
      setInterviewDetails(data.details || []);
    } catch {
      setInterviewDetails([]);
    }
    setBusy(false);
  };

  const changeStatus = async (status) => {
    setUpdatingStatus(true);
    try {
      const res = await apiFetch(`/applications/${candidate.application_id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        onStatusChange(candidate.application_id, status);
      }
    } catch {
      // ignore, UI simply won't update
    }
    setUpdatingStatus(false);
  };

  return (
    <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", marginBottom: "15px", boxShadow: "0px 4px 10px rgba(0,0,0,0.1)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
        <div>
          <h3 style={{ color: "#0f172a" }}>{candidate.name}</h3>
          <p style={{ color: "#64748b", fontSize: "13px" }}>{candidate.filename}</p>
        </div>
        <span style={statusBadgeStyle(candidate.status)}>{candidate.status}</span>
      </div>

      <p style={{ color: "#2563eb", fontSize: "18px", fontWeight: "bold", marginTop: "6px" }}>
        Match Score: {candidate.match_score}%
      </p>

      <div style={{ marginTop: "12px" }}>
        <h4 style={{ color: "#0f172a", marginBottom: "6px" }}>Matched Skills</h4>
        <SkillList skills={candidate.matchedSkills} tone="matched" />
      </div>

      <div style={{ marginTop: "12px" }}>
        <h4 style={{ color: "#0f172a", marginBottom: "6px" }}>Missing Skills</h4>
        <SkillList skills={candidate.missingSkills} tone="missing" />
      </div>

      <div style={{ marginTop: "12px" }}>
        <h4 style={{ color: "#0f172a", marginBottom: "6px" }}>Aptitude & Coding Screening</h4>
        <ScreeningScorePanel screening={candidate.screening} />
      </div>

      <div style={{ marginTop: "12px" }}>
        <h4 style={{ color: "#0f172a", marginBottom: "6px" }}>AI Video Interview</h4>
        {candidate.screening?.completed ? (
          <InterviewScorePanel interview={candidate.interview} />
        ) : (
          <p style={{ color: "#94a3b8", fontStyle: "italic", marginTop: "6px" }}>
            Locked until the candidate completes the screening test.
          </p>
        )}
      </div>

      <div style={{ marginTop: "16px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button onClick={fetchTrust} disabled={busy} style={secondaryButtonStyle}>
          {trust === null ? "Get Trust Score" : `Trust Score: ${trust}`}
        </button>
        <button onClick={fetchQuestions} disabled={busy} style={secondaryButtonStyle}>
          Preview Interview Questions
        </button>
        {candidate.screening?.completed && (
          <button onClick={fetchScreeningDetails} disabled={busy} style={secondaryButtonStyle}>
            View Screening Answers
          </button>
        )}
        {candidate.interview?.completed && (
          <button onClick={fetchInterviewDetails} disabled={busy} style={secondaryButtonStyle}>
            View Interview Answers
          </button>
        )}
        <button
          onClick={() => changeStatus("shortlisted")}
          disabled={updatingStatus || candidate.status === "shortlisted"}
          style={{ ...secondaryButtonStyle, background: "#dcfce7", color: "#166534" }}
        >
          Shortlist
        </button>
        <button
          onClick={() => changeStatus("rejected")}
          disabled={updatingStatus || candidate.status === "rejected"}
          style={{ ...secondaryButtonStyle, background: "#fee2e2", color: "#991b1b" }}
        >
          Reject
        </button>
      </div>

      {questions && (
        <ul style={{ marginTop: "12px", color: "#334155" }}>
          {questions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      )}

      {screeningDetails && (
        <ScreeningDetailsPanel aptitudeDetails={screeningDetails.aptitude} codingDetails={screeningDetails.coding} />
      )}

      {interviewDetails && <InterviewAnswerList details={interviewDetails} />}
    </div>
  );
}

function JobDashboard() {
  const { jobId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/jobs/${jobId}/candidates`)
      .then((res) => res.json())
      .then(setData)
      .catch(() => setError("Could not load applicants"));
  }, [jobId]);

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", padding: "40px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto 20px auto" }}>
        <Link to="/recruiter">
          <button style={secondaryButtonStyle}>&larr; Back to your jobs</button>
        </Link>
      </div>

      <div style={{ maxWidth: "900px", margin: "auto" }}>
        {error && <p style={{ color: "#f87171" }}>{error}</p>}
        {!data && !error && <p style={{ color: "white" }}>Loading...</p>}

        {data && (
          <>
            <h1 style={{ color: "white", marginBottom: "6px" }}>{data.job.role}</h1>
            <p style={{ color: "#94a3b8", marginBottom: "24px", whiteSpace: "pre-wrap" }}>{data.job.description}</p>

            <div style={{ background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0px 4px 10px rgba(0,0,0,0.1)", marginBottom: "24px" }}>
              <h2 style={{ color: "#0f172a", marginBottom: "14px" }}>Top Candidate Snapshot</h2>
              <MissingSkillsPie
                missing={data.analytics.missingSkillsCount}
                matched={data.analytics.matchedSkillsCount}
              />
            </div>

            <h2 style={{ color: "white", marginBottom: "16px" }}>Applicants ({data.top_candidates.length})</h2>

            {data.top_candidates.length === 0 && <p style={{ color: "#94a3b8" }}>No applicants yet.</p>}

            {data.top_candidates.map((candidate) => (
              <CandidateRow
                key={candidate.application_id}
                candidate={candidate}
                onStatusChange={(applicationId, status) =>
                  setData((prev) => ({
                    ...prev,
                    top_candidates: prev.top_candidates.map((c) =>
                      c.application_id === applicationId ? { ...c, status } : c
                    ),
                  }))
                }
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default JobDashboard;
