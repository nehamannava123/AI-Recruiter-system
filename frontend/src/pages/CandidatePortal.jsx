import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../auth/AuthContext";
import { topBarStyle, secondaryButtonStyle, statusBadgeStyle } from "../styles/shared";

function CandidatePortal() {
  const [jobs, setJobs] = useState([]);
  const [applicationsByJob, setApplicationsByJob] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { user, logout } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function loadJobs() {
      try {
        const res = await apiFetch("/jobs");
        if (!res.ok) throw new Error("Could not load jobs");
        const data = await res.json();
        if (!cancelled) setJobs(data);
      } catch (err) {
        if (!cancelled) setError(err.message || "Something went wrong");
      }
      if (!cancelled) setLoading(false);
    }

    async function loadMyApplications() {
      try {
        const res = await apiFetch("/candidate/applications");
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const lookup = {};
        data.forEach((app) => {
          lookup[app.job_id] = app;
        });
        setApplicationsByJob(lookup);
      } catch {
        // Non-fatal: job cards just won't show an application status.
      }
    }

    loadJobs();
    loadMyApplications();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", padding: "40px" }}>
      <div style={topBarStyle}>
        <h1 style={{ color: "white" }}>Open Roles</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <Link to="/candidate/applications">
            <button style={secondaryButtonStyle}>My Applications</button>
          </Link>
          <span>Hi, {user?.username}</span>
          <button style={secondaryButtonStyle} onClick={logout}>
            Log out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "auto" }}>
        {loading && <p style={{ color: "white" }}>Loading jobs...</p>}
        {error && <p style={{ color: "#f87171" }}>{error}</p>}
        {!loading && !error && jobs.length === 0 && (
          <p style={{ color: "#94a3b8" }}>No jobs posted yet. Check back soon.</p>
        )}

        {jobs.map((job) => {
          const myApplication = applicationsByJob[job.id];
          return (
            <div
              key={job.id}
              style={{
                background: "white",
                padding: "22px",
                borderRadius: "12px",
                marginBottom: "16px",
                boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <h2 style={{ color: "#0f172a", marginBottom: "4px" }}>{job.role}</h2>
                  <p style={{ color: "#64748b", marginBottom: "12px" }}>Posted by {job.recruiter_username}</p>
                </div>
                {myApplication && (
                  <span style={statusBadgeStyle(myApplication.status)}>{myApplication.status}</span>
                )}
              </div>
              <p
                style={{
                  color: "#334155",
                  whiteSpace: "pre-wrap",
                  maxHeight: "100px",
                  overflow: "hidden",
                  marginBottom: "14px",
                }}
              >
                {job.description}
              </p>
              {myApplication && (
                <p style={{ color: "#2563eb", fontWeight: 700, marginBottom: "14px" }}>
                  You applied — Match Score: {myApplication.match_score}%
                </p>
              )}
              <Link to={`/candidate/jobs/${job.id}`}>
                <button
                  style={{
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {myApplication ? "View Application" : "View & Apply"}
                </button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CandidatePortal;
