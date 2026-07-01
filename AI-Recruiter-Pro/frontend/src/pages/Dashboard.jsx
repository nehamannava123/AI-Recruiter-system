import { useState } from "react";

function MissingSkillsPie({ missing, matched }) {
  // If parent passes undefined, show placeholders but do not crash.
  missing = Number(missing ?? 0);
  matched = Number(matched ?? 0);

  const total = (missing || 0) + (matched || 0);
  if (!total) {
    return (
      <div style={{ color: "#64748b", fontStyle: "italic" }}>No skills data yet.</div>
    );
  }

  const matchedSlice = (matched || 0) / total;
  const missingSlice = (missing || 0) / total;

  const size = 170;
  const r = 65;
  const cx = size / 2;
  const cy = size / 2;

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (startAngle, endAngle) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      `M ${cx} ${cy}`,
      `L ${start.x} ${start.y}`,
      `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
      "Z",
    ].join(" ");
  };

  const matchedStart = 0;
  const matchedEnd = matchedSlice * 360;
  const missingStart = matchedEnd;
  const missingEnd = 360;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "200px 1fr",
        gap: "16px",
        alignItems: "center",
      }}
    >
      <div>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={r} fill="#f1f5f9" />
          <path d={describeArc(matchedStart, matchedEnd)} fill="#f59e0b" />
          <path d={describeArc(missingStart, missingEnd)} fill="#ef4444" />
        </svg>

        <div
          style={{
            textAlign: "center",
            marginTop: "-150px",
            position: "relative",
          }}
        >
          <div style={{ fontWeight: 900, color: "#0f172a", fontSize: "20px" }}>
            {Math.round(((matched || 0) / total) * 100)}%
          </div>
          <div style={{ color: "#475569", fontSize: "12px", fontWeight: 700 }}>Match Fit</div>
        </div>
      </div>

      <div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: "#f59e0b" }} />
            <span style={{ fontWeight: 800, color: "#0f172a" }}>Matched Skills</span>
            <span style={{ marginLeft: "auto", fontWeight: 900, color: "#92400e" }}>{matched}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: "#ef4444" }} />
            <span style={{ fontWeight: 800, color: "#0f172a" }}>Missing Skills</span>
            <span style={{ marginLeft: "auto", fontWeight: 900, color: "#991b1b" }}>{missing}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const [role, setRole] = useState("");
  const [jd, setJd] = useState("");
  const [file, setFile] = useState(null);

  const [resumePreview, setResumePreview] = useState("");
  const [resumeSkillsFound, setResumeSkillsFound] = useState([]);

  const [candidates, setCandidates] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(false);

  const screenCandidate = async () => {
    try {
      if (!role || !jd) {
        alert("Please enter Job Role and Job Description");
        return;
      }

      if (!file) {
        alert("Please upload a resume");
        return;
      }

      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Resume Upload Failed");
      }

      const uploadData = await uploadResponse.json();
      setResumePreview(uploadData.resumePreview || "");
      setResumeSkillsFound(uploadData.resumeSkillsFound || []);

      const rankResponse = await fetch("http://127.0.0.1:8000/rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          job_description: jd,
        }),
      });

      const rankData = await rankResponse.json();

      const uniqueCandidates = [
        ...new Map((rankData.top_candidates || []).map((item) => [item.name, item])).values(),
      ];

      setCandidates(uniqueCandidates);
      setAnalytics(rankData.analytics || null);
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    }

    setLoading(false);
  };

  const SkillList = ({ skills }) => (
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

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", padding: "40px" }}>
      <h1 style={{ color: "white", textAlign: "center", marginBottom: "30px" }}>
        AI Recruiter: Intelligent Resume Screening & Candidate Ranking System
      </h1>

      <div
        style={{
          background: "white",
          maxWidth: "900px",
          margin: "auto",
          padding: "30px",
          borderRadius: "15px",
          boxShadow: "0px 4px 15px rgba(0,0,0,0.2)",
        }}
      >
        <h2 style={{ color: "#0f172a" }}>Job Role</h2>
        <input
          type="text"
          placeholder="Enter Job Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "20px",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        />

        <h2 style={{ color: "#0f172a" }}>Job Description</h2>
        <textarea
          rows="8"
          placeholder="Paste Job Description"
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            marginBottom: "20px",
          }}
        />

        <h2 style={{ color: "#0f172a" }}>Upload Resume</h2>
        <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} />

        {file && <p style={{ color: "green", marginTop: "10px" }}>Selected: {file.name}</p>}

        <button
          onClick={screenCandidate}
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
          {loading ? "Screening..." : "Screen Candidate"}
        </button>
      </div>

      {(resumePreview || (resumeSkillsFound && resumeSkillsFound.length > 0)) && (
        <div style={{ maxWidth: "900px", margin: "20px auto" }}>
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ color: "#0f172a" }}>Resume Preview</h2>
            <div
              style={{
                color: "#334155",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                padding: "12px",
                borderRadius: "10px",
                whiteSpace: "pre-wrap",
                maxHeight: "220px",
                overflow: "auto",
                fontSize: "14px",
                lineHeight: 1.5,
              }}
            >
              {resumePreview || ""}
            </div>

            <div style={{ marginTop: "16px" }}>
              <h3 style={{ color: "#0f172a", marginBottom: "8px" }}>Skills Found in Resume</h3>
              <SkillList skills={resumeSkillsFound} />
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: "900px", margin: "20px auto" }}>
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ color: "#0f172a", marginBottom: "10px" }}>Analytics</h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>

              <div style={{ padding: "14px", background: "#eff6ff", borderRadius: "10px" }}>
                <div style={{ color: "#1d4ed8", fontWeight: 800, fontSize: "20px" }}>{analytics.matchScore}%</div>
                <div style={{ color: "#1e3a8a", fontWeight: 700 }}>Match Score</div>
              </div>
              <div style={{ padding: "14px", background: "#f0fdf4", borderRadius: "10px" }}>
                <div style={{ color: "#16a34a", fontWeight: 800, fontSize: "20px" }}>{analytics.matchedSkillsCount}</div>
                <div style={{ color: "#15803d", fontWeight: 700 }}>Matched Skills</div>
              </div>
              <div style={{ padding: "14px", background: "#fef2f2", borderRadius: "10px" }}>
                <div style={{ color: "#dc2626", fontWeight: 800, fontSize: "20px" }}>{analytics.missingSkillsCount}</div>
                <div style={{ color: "#b91c1c", fontWeight: 700 }}>Missing Skills</div>
              </div>
            </div>

            <div style={{ marginTop: "16px" }}>
              <h3 style={{ color: "#0f172a", marginBottom: "10px" }}>Missing Skills Breakdown</h3>

              <div style={{ color: "#64748b", fontSize: 12, marginBottom: 10, fontWeight: 700 }}>
                Analytics fields:
                <div>matchedSkillsCount: {String(analytics.matchedSkillsCount ?? 0)}</div>
                <div>missingSkillsCount: {String(analytics.missingSkillsCount ?? 0)}</div>
              </div>

              <MissingSkillsPie
                missing={Number(analytics.missingSkillsCount || 0)}
                matched={Number(analytics.matchedSkillsCount || 0)}
              />

              <div style={{ marginTop: "14px" }}>
                <h4 style={{ color: "#0f172a", marginBottom: "8px" }}>Matched Skills (Analytics)</h4>
                <div style={{ color: "#64748b", fontSize: 12, marginBottom: 8, fontWeight: 700 }}>
                  matchedSkills: {String((analytics.matchedSkills || []).length)} items
                </div>
                <SkillList skills={analytics.matchedSkills || []} />
              </div>

              <div style={{ marginTop: "12px" }}>
                <h4 style={{ color: "#0f172a", marginBottom: "8px" }}>Missing Skills (Analytics)</h4>
                <div style={{ color: "#64748b", fontSize: 12, marginBottom: 8, fontWeight: 700 }}>
                  missingSkills: {String((analytics.missingSkills || []).length)} items
                </div>
                <SkillList skills={analytics.missingSkills || []} />
              </div>
            </div>

          </div>
        </div>
      )}


      {candidates.length > 0 && (
        <div style={{ maxWidth: "900px", margin: "30px auto" }}>
          <h2 style={{ color: "white", marginBottom: "20px" }}>Top Candidates</h2>

          {candidates.map((candidate) => (
            <div
              key={candidate.name}
              style={{
                background: "#ffffff",
                padding: "20px",
                borderRadius: "12px",
                marginBottom: "15px",
                boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
              }}
            >
              <h3 style={{ color: "#0f172a" }}>{candidate.name}</h3>

              <p style={{ color: "#2563eb", fontSize: "18px", fontWeight: "bold", marginTop: "6px" }}>
                Match Score: {candidate.match_score}%
              </p>

              <div style={{ marginTop: "12px" }}>
                <h4 style={{ color: "#0f172a", marginBottom: "6px" }}>Required Skills</h4>
                <SkillList skills={candidate.requiredSkills} />
              </div>

              <div style={{ marginTop: "12px" }}>
                <h4 style={{ color: "#0f172a", marginBottom: "6px" }}>Matched Skills</h4>
                <SkillList skills={candidate.matchedSkills} />
              </div>

              <div style={{ marginTop: "12px" }}>
                <h4 style={{ color: "#0f172a", marginBottom: "6px" }}>Missing Skills</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {(candidate.missingSkills || []).map((s) => (
                    <span
                      key={s}
                      style={{
                        background: "#fef2f2",
                        color: "#991b1b",
                        border: "1px solid #fecaca",
                        padding: "6px 10px",
                        borderRadius: "999px",
                        fontSize: "13px",
                        fontWeight: 700,
                      }}
                    >
                      {s}
                    </span>
                  ))}
                  {(!candidate.missingSkills || candidate.missingSkills.length === 0) && (
                    <span style={{ color: "#16a34a", fontStyle: "italic", fontWeight: 700 }}>None 🎉</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;

