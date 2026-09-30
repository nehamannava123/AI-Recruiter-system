import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "../api";
import { secondaryButtonStyle } from "../styles/shared";

function SkillList({ skills }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {(skills || []).map((s) => (
        <span
          key={s}
          style={{
            background: "#eef2ff",
            color: "#1e3a8a",
            border: "1px solid #c7d2fe",
            padding: "6px 10px",
            borderRadius: "999px",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          {s}
        </span>
      ))}
      {(!skills || skills.length === 0) && (
        <span style={{ color: "#94a3b8", fontStyle: "italic" }}>None found</span>
      )}
    </div>
  );
}

function JobApply() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/jobs/${jobId}`)
      .then((res) => res.json())
      .then(setJob)
      .catch(() => setError("Could not load job details"));
  }, [jobId]);

  const handleUpload = async () => {
    if (!file) {
      alert("Please choose a resume PDF first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("job_id", jobId);

      const res = await apiFetch("/upload", { method: "POST", body: formData });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Upload failed");
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Upload failed");
    }

    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", padding: "40px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto 20px auto" }}>
        <Link to="/candidate">
          <button style={secondaryButtonStyle}>&larr; Back to jobs</button>
        </Link>
      </div>

      <div style={{ maxWidth: "900px", margin: "auto" }}>
        {!job && !error && <p style={{ color: "white" }}>Loading...</p>}
        {error && <p style={{ color: "#f87171" }}>{error}</p>}

        {job && (
          <div
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "15px",
              boxShadow: "0px 4px 15px rgba(0,0,0,0.2)",
              marginBottom: "20px",
            }}
          >
            <h1 style={{ color: "#0f172a" }}>{job.role}</h1>
            <p style={{ color: "#64748b", marginBottom: "16px" }}>Posted by {job.recruiter_username}</p>
            <p style={{ color: "#334155", whiteSpace: "pre-wrap" }}>{job.description}</p>
          </div>
        )}

        {job && (
          <div
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "15px",
              boxShadow: "0px 4px 15px rgba(0,0,0,0.2)",
            }}
          >
            <h2 style={{ color: "#0f172a" }}>Apply with your resume</h2>
            <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} />
            {file && <p style={{ color: "green", marginTop: "10px" }}>Selected: {file.name}</p>}

            <button
              onClick={handleUpload}
              disabled={loading}
              style={{
                marginTop: "20px",
                background: "#2563eb",
                color: "white",
                border: "none",
                padding: "12px 25px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                width: "100%",
              }}
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        )}

        {result && (
          <div
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "12px",
              marginTop: "20px",
              boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ color: "#16a34a" }}>Application submitted ✅</h3>
            <p style={{ color: "#334155", marginBottom: "14px" }}>
              Your match score for this role: <strong>{result.matchScore}%</strong>
            </p>

            <h4 style={{ color: "#0f172a", marginBottom: "8px" }}>Matched Skills</h4>
            <SkillList skills={result.matchedSkills} />

            <h4 style={{ color: "#0f172a", marginTop: "14px", marginBottom: "8px" }}>Missing Skills</h4>
            <SkillList skills={result.missingSkills} />

            {result.aiFeedback && result.aiFeedback.length > 0 && (
              <div style={{ marginTop: "18px" }}>
                <h4 style={{ color: "#0f172a", marginBottom: "8px" }}>🤖 AI Resume Feedback</h4>
                <ul style={{ color: "#334155", paddingLeft: "20px", lineHeight: 1.6 }}>
                  {result.aiFeedback.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ marginTop: "20px" }}>
              <Link to={`/candidate/applications`}>
                <button
                  style={{
                    background: "#0f172a",
                    color: "white",
                    border: "none",
                    padding: "12px 20px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Go to My Applications &rarr;
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default JobApply;
