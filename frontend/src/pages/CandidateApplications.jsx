import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../auth/AuthContext";
import { topBarStyle, secondaryButtonStyle, statusBadgeStyle } from "../styles/shared";

function ScreeningBadge({ screening, applicationId }) {
  if (!screening || !screening.completed) {
    return (
      <Link to={`/candidate/screening/${applicationId}`}>
        <button
          style={{
            background: "#2563eb",
            color: "white",
            border: "none",
            padding: "10px 18px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          📝 Take Aptitude & Coding Test
        </button>
      </Link>
    );
  }

  return (
    <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" }}>
      <span style={{ color: "#0f172a", fontWeight: 700 }}>Aptitude Score: {screening.aptitude.score}%</span>
      <span style={{ color: "#16a34a" }}>✓ {screening.aptitude.correct} correct</span>
      <span style={{ color: "#dc2626" }}>✗ {screening.aptitude.wrong} wrong</span>
      <span style={{ color: "#64748b" }}>— {screening.aptitude.unanswered} unanswered</span>
      <span style={{ color: "#64748b" }}>· {screening.coding_question_count} coding answers submitted</span>
    </div>
  );
}

function InterviewBadge({ interview, screening, applicationId }) {
  if (!screening || !screening.completed) {
    return <p style={{ color: "#94a3b8", fontStyle: "italic" }}>Complete the aptitude & coding test to unlock the video interview.</p>;
  }

  if (!interview || !interview.completed) {
    return (
      <Link to={`/candidate/interview/${applicationId}`}>
        <button
          style={{
            background: "#7c3aed",
            color: "white",
            border: "none",
            padding: "10px 18px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          🎥 Take AI Video Interview
        </button>
      </Link>
    );
  }

  return (
    <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" }}>
      <span style={{ color: "#0f172a", fontWeight: 700 }}>Interview Score: {interview.score}%</span>
      <span style={{ color: "#16a34a" }}>✓ {interview.correct} correct</span>
      <span style={{ color: "#dc2626" }}>✗ {interview.wrong} wrong</span>
      <span style={{ color: "#64748b" }}>— {interview.unanswered} unanswered</span>
    </div>
  );
}

function CandidateApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { user, logout } = useAuth();

  useEffect(() => {
    apiFetch("/candidate/applications")
      .then((res) => res.json())
      .then((data) => setApplications(data))
      .catch(() => setError("Could not load your applications"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", padding: "40px" }}>
      <div style={topBarStyle}>
        <h1 style={{ color: "white" }}>My Applications</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <Link to="/candidate">
            <button style={secondaryButtonStyle}>&larr; Browse Jobs</button>
          </Link>
          <span>Hi, {user?.username}</span>
          <button style={secondaryButtonStyle} onClick={logout}>
            Log out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "auto" }}>
        {loading && <p style={{ color: "white" }}>Loading...</p>}
        {error && <p style={{ color: "#f87171" }}>{error}</p>}
        {!loading && !error && applications.length === 0 && (
          <p style={{ color: "#94a3b8" }}>You haven't applied to any jobs yet.</p>
        )}

        {applications.map((app) => (
          <div
            key={app.application_id}
            style={{
              background: "white",
              padding: "22px",
              borderRadius: "12px",
              marginBottom: "18px",
              boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
              <div>
                <h2 style={{ color: "#0f172a", marginBottom: "4px" }}>{app.job_role}</h2>
                <p style={{ color: "#64748b" }}>Posted by {app.recruiter_username}</p>
              </div>
              <span style={statusBadgeStyle(app.status)}>{app.status}</span>
            </div>

            <p style={{ color: "#2563eb", fontSize: "18px", fontWeight: "bold", marginTop: "10px" }}>
              Match Score: {app.match_score}%
            </p>

            {app.aiFeedback && app.aiFeedback.length > 0 && (
              <div style={{ marginTop: "14px" }}>
                <h4 style={{ color: "#0f172a", marginBottom: "8px" }}>🤖 AI Resume Feedback</h4>
                <ul style={{ color: "#334155", paddingLeft: "20px", lineHeight: 1.6 }}>
                  {app.aiFeedback.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
              <h4 style={{ color: "#0f172a", marginBottom: "10px" }}>Aptitude & Coding Screening</h4>
              <ScreeningBadge screening={app.screening} applicationId={app.application_id} />
            </div>

            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
              <h4 style={{ color: "#0f172a", marginBottom: "10px" }}>AI Video Interview</h4>
              <InterviewBadge interview={app.interview} screening={app.screening} applicationId={app.application_id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CandidateApplications;
