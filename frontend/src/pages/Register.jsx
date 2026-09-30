import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { cardStyle, inputStyle, buttonStyle, pageStyle } from "../styles/shared";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("candidate");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await register(username, password, role);
      navigate(user.role === "recruiter" ? "/recruiter" : "/candidate");
    } catch (err) {
      setError(err.message || "Registration failed");
    }
    setLoading(false);
  };

  const roleButtonStyle = (r) => ({
    flex: 1,
    padding: "12px",
    borderRadius: "8px",
    border: r === role ? "2px solid #2563eb" : "1px solid #ccc",
    background: r === role ? "#eff6ff" : "white",
    color: "#0f172a",
    fontWeight: 700,
    cursor: "pointer",
  });

  return (
    <div style={pageStyle}>
      <div style={{ ...cardStyle, maxWidth: "420px" }}>
        <h1 style={{ color: "#0f172a", marginBottom: "6px" }}>Create Account</h1>
        <p style={{ color: "#64748b", marginBottom: "24px" }}>Join as a candidate or recruiter</p>

        <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
          <button type="button" style={roleButtonStyle("candidate")} onClick={() => setRole("candidate")}>
            Candidate
          </button>
          <button type="button" style={roleButtonStyle("recruiter")} onClick={() => setRole("recruiter")}>
            Recruiter
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            style={inputStyle}
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
          />
          <input
            style={inputStyle}
            type="password"
            placeholder="Choose a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          {error && <p style={{ color: "#dc2626", fontWeight: 600 }}>{error}</p>}

          <button style={buttonStyle} type="submit" disabled={loading}>
            {loading ? "Creating account..." : `Register as ${role === "candidate" ? "Candidate" : "Recruiter"}`}
          </button>
        </form>

        <p style={{ marginTop: "18px", color: "#475569" }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
