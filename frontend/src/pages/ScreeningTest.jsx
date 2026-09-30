import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../api";
import { secondaryButtonStyle } from "../styles/shared";

const CATEGORY_LABELS = {
  backend: "Backend Engineering",
  frontend: "Frontend Engineering",
  data: "Data / ML",
  devops: "DevOps / Cloud",
  mobile: "Mobile Engineering",
  qa: "QA / Testing",
  general: "General Software",
};

function ScreeningTest() {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [stage, setStage] = useState("loading"); // loading | active | submitting | done | already_done | error
  const [category, setCategory] = useState(null);
  const [aptitudeQuestions, setAptitudeQuestions] = useState([]);
  const [codingQuestions, setCodingQuestions] = useState([]);
  const [aptitudeAnswers, setAptitudeAnswers] = useState({}); // { [id]: selectedIndex }
  const [codingAnswers, setCodingAnswers] = useState({}); // { [id]: text }
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;

    apiFetch(`/applications/${applicationId}/screening/start`, { method: "POST" })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Could not load the screening test");
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setCategory(data.category);
        setAptitudeQuestions(data.aptitude_questions || []);
        setCodingQuestions(data.coding_questions || []);

        if (data.already_completed) {
          setResult(data.result);
          setStage("already_done");
        } else {
          setStage("active");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || "Could not load the screening test");
        setStage("error");
      });

    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  const selectAptitude = (questionId, optionIndex) => {
    setAptitudeAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const setCodingAnswer = (questionId, text) => {
    setCodingAnswers((prev) => ({ ...prev, [questionId]: text }));
  };

  const unansweredAptitudeCount = aptitudeQuestions.filter(
    (q) => aptitudeAnswers[q.id] === undefined
  ).length;

  const submitTest = async () => {
    setStage("submitting");
    setError("");
    try {
      const payload = {
        aptitude_answers: aptitudeQuestions.map((q) => ({
          question_id: q.id,
          selected_index: aptitudeAnswers[q.id] === undefined ? null : aptitudeAnswers[q.id],
        })),
        coding_answers: codingQuestions.map((q) => ({
          question_id: q.id,
          answer: codingAnswers[q.id] || "",
        })),
      };

      const res = await apiFetch(`/applications/${applicationId}/screening/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Could not submit the screening test");
      }

      const data = await res.json();
      setResult(data.result);
      setStage("done");
    } catch (err) {
      setError(err.message || "Could not submit the screening test");
      setStage("active");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", padding: "40px" }}>
      <div style={{ maxWidth: "820px", margin: "0 auto 20px auto" }}>
        <Link to="/candidate/applications">
          <button style={secondaryButtonStyle}>&larr; Back to My Applications</button>
        </Link>
      </div>

      <div style={{ maxWidth: "820px", margin: "auto" }}>
        <div style={{ background: "white", padding: "30px", borderRadius: "15px", boxShadow: "0px 4px 15px rgba(0,0,0,0.2)" }}>
          <h1 style={{ color: "#0f172a", marginBottom: "6px" }}>📝 Aptitude & Coding Screening</h1>
          <p style={{ color: "#64748b", marginBottom: "20px" }}>
            {category
              ? `Questions tailored for a ${CATEGORY_LABELS[category] || category} role. Complete this before starting the AI video interview.`
              : "Loading questions tailored to this role..."}
          </p>

          {error && <p style={{ color: "#dc2626", fontWeight: 600 }}>{error}</p>}

          {stage === "loading" && <p style={{ color: "#0f172a" }}>Loading your screening test...</p>}

          {(stage === "active" || stage === "submitting") && (
            <div>
              <h2 style={{ color: "#0f172a", fontSize: "18px", marginBottom: "12px" }}>
                Part 1 · Aptitude ({aptitudeQuestions.length} questions)
              </h2>
              {aptitudeQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "16px",
                    marginBottom: "12px",
                  }}
                >
                  <p style={{ color: "#0f172a", fontWeight: 600, marginBottom: "10px" }}>
                    {idx + 1}. {q.question}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {q.options.map((option, optIdx) => (
                      <label
                        key={optIdx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                          color: "#334155",
                        }}
                      >
                        <input
                          type="radio"
                          name={`aptitude-${q.id}`}
                          checked={aptitudeAnswers[q.id] === optIdx}
                          onChange={() => selectAptitude(q.id, optIdx)}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <h2 style={{ color: "#0f172a", fontSize: "18px", margin: "24px 0 12px 0" }}>
                Part 2 · Coding ({codingQuestions.length} questions)
              </h2>
              <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "12px" }}>
                Write code or pseudocode in the box below. These answers are saved for the recruiter to review manually.
              </p>
              {codingQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "16px",
                    marginBottom: "14px",
                  }}
                >
                  <p style={{ color: "#0f172a", fontWeight: 600, marginBottom: "4px" }}>
                    {idx + 1}. {q.title}
                  </p>
                  <p style={{ color: "#334155", marginBottom: "10px" }}>{q.prompt}</p>
                  <textarea
                    value={codingAnswers[q.id] || ""}
                    onChange={(e) => setCodingAnswer(q.id, e.target.value)}
                    placeholder="Write your code / pseudocode here..."
                    spellCheck={false}
                    style={{
                      width: "100%",
                      minHeight: "160px",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      boxSizing: "border-box",
                      fontFamily: "monospace",
                      fontSize: "13px",
                    }}
                  />
                </div>
              ))}

              {unansweredAptitudeCount > 0 && (
                <p style={{ color: "#b45309", fontSize: "13px", marginBottom: "10px" }}>
                  {unansweredAptitudeCount} aptitude question(s) unanswered — you can still submit, but they'll be marked unanswered.
                </p>
              )}

              <button
                onClick={submitTest}
                disabled={stage === "submitting"}
                style={{ ...secondaryButtonStyle, width: "100%", background: "#2563eb", color: "white" }}
              >
                {stage === "submitting" ? "Submitting..." : "Submit Screening Test"}
              </button>
            </div>
          )}

          {(stage === "done" || stage === "already_done") && result && (
            <div>
              {stage === "already_done" && (
                <p style={{ color: "#64748b", marginBottom: "10px" }}>
                  You've already completed the screening test for this application.
                </p>
              )}
              <h2 style={{ color: "#16a34a", marginBottom: "10px" }}>Screening Complete ✅</h2>
              <p style={{ color: "#0f172a", fontSize: "22px", fontWeight: 800, marginBottom: "10px" }}>
                Aptitude Score: {result.aptitude.score}%
              </p>
              <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", marginBottom: "16px" }}>
                <span style={{ color: "#16a34a", fontWeight: 600 }}>✓ Correct: {result.aptitude.correct}</span>
                <span style={{ color: "#dc2626", fontWeight: 600 }}>✗ Wrong: {result.aptitude.wrong}</span>
                <span style={{ color: "#64748b", fontWeight: 600 }}>— Unanswered: {result.aptitude.unanswered}</span>
                <span style={{ color: "#64748b", fontWeight: 600 }}>/ {result.aptitude.total} total</span>
              </div>
              <p style={{ color: "#334155", marginBottom: "20px" }}>
                Coding answers ({result.coding_question_count}) have been saved for the recruiter to review.
              </p>
              <button
                onClick={() => navigate(`/candidate/interview/${applicationId}`)}
                style={{ ...secondaryButtonStyle, width: "100%", background: "#7c3aed", color: "white", marginBottom: "10px" }}
              >
                🎥 Continue to AI Video Interview
              </button>
              <button
                onClick={() => navigate("/candidate/applications")}
                style={{ ...secondaryButtonStyle, width: "100%", background: "#0f172a", color: "white" }}
              >
                Back to My Applications
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ScreeningTest;
