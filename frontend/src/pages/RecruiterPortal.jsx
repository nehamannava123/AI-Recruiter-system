import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../auth/AuthContext";
import {
  topBarStyle,
  secondaryButtonStyle,
  inputStyle,
  buttonStyle,
  statCardStyle,
  statCardsRowStyle,
} from "../styles/shared";

function StatCard({ label, value }) {
  return (
    <div style={statCardStyle}>
      <p style={{ color: "#64748b", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>{label}</p>
      <p style={{ color: "#0f172a", fontSize: "26px", fontWeight: 800 }}>{value}</p>
    </div>
  );
}

function RecruiterPortal() {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  const { user, logout } = useAuth();

  const loadJobs = async () => {
    try {
      const res = await apiFetch("/jobs");
      if (!res.ok) throw new Error("Could not load jobs");
      setJobs(await res.json());
    } catch (err) {
      setError(err.message || "Something went wrong");
    }
  };

  const loadStats = async () => {
    try {
      const res = await apiFetch("/recruiter/stats");
      if (!res.ok) throw new Error("Could not load stats");
      setStats(await res.json());
    } catch {
      setStats(null);
    }
  };

  useEffect(() => {
    loadJobs();
    loadStats();
  }, []);

  const handlePostJob = async (e) => {
    e.preventDefault();
    setError("");

    if (!role || description.length < 10) {
      setError("Please enter a role and a description (10+ characters)");
      return;
    }

    setPosting(true);
    try {
      const res = await apiFetch("/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, description }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Could not post job");
      }

      setRole("");
      setDescription("");
      await loadJobs();
      await loadStats();
    } catch (err) {
      setError(err.message || "Could not post job");
    }
    setPosting(false);
  };

  const handleDeleteJob = async (jobId, role) => {
    const confirmed = window.confirm(
      `Delete "${role}"? This will permanently remove the job and all of its applicants. This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(jobId);
    try {
      const res = await apiFetch(`/jobs/${jobId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Could not delete job");
      }
      await loadJobs();
      await loadStats();
    } catch (err) {
      setError(err.message || "Could not delete job");
    }
    setDeletingId(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", padding: "40px" }}>
      <div style={topBarStyle}>
        <h1 style={{ color: "white" }}>Recruiter Dashboard</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <span>Hi, {user?.username}</span>
          <button style={secondaryButtonStyle} onClick={logout}>
            Log out
          </button>
        </div>
      </div>

      {stats && (
        <div style={statCardsRowStyle}>
          <StatCard label="Total Jobs" value={stats.total_jobs} />
          <StatCard label="Applications Received" value={stats.applications_received} />
          <StatCard label="Shortlisted Candidates" value={stats.shortlisted} />
          <StatCard label="Rejected Candidates" value={stats.rejected} />
          <StatCard label="Average Match Score" value={`${stats.avg_match_score}%`} />
        </div>
      )}

      <div style={{ maxWidth: "900px", margin: "auto" }}>
        <div
          style={{
            background: "white",
            padding: "26px",
            borderRadius: "12px",
            boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
            marginBottom: "26px",
          }}
        >
          <h2 style={{ color: "#0f172a", marginBottom: "14px" }}>Post a New Job</h2>
          <form onSubmit={handlePostJob}>
            <input
              style={inputStyle}
              type="text"
              placeholder="Job role (e.g. Python Developer)"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
            <textarea
              style={{ ...inputStyle, minHeight: "140px" }}
              placeholder="Job description, required skills, experience..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {error && <p style={{ color: "#dc2626", fontWeight: 600 }}>{error}</p>}
            <button style={buttonStyle} type="submit" disabled={posting}>
              {posting ? "Posting..." : "Post Job"}
            </button>
          </form>
        </div>

        <h2 style={{ color: "white", marginBottom: "16px" }}>Your Job Postings</h2>

        {jobs.length === 0 && <p style={{ color: "#94a3b8" }}>You haven't posted any jobs yet.</p>}

        {jobs.map((job) => (
          <div
            key={job.id}
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              marginBottom: "14px",
              boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div>
              <h3 style={{ color: "#0f172a", marginBottom: "4px" }}>{job.role}</h3>
              <p style={{ color: "#64748b" }}>{job.applicant_count} applicant(s)</p>
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link to={`/recruiter/jobs/${job.id}`}>
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
                  View Applicants
                </button>
              </Link>
              <button
                onClick={() => handleDeleteJob(job.id, job.role)}
                disabled={deletingId === job.id}
                style={{
                  background: "#fee2e2",
                  color: "#991b1b",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                {deletingId === job.id ? "Deleting..." : "Delete Job"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecruiterPortal;
