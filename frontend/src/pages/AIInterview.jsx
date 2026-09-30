import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiFetch, BASE_URL } from "../api";
import { secondaryButtonStyle } from "../styles/shared";

function getToken() {
  return localStorage.getItem("ai_recruiter_token");
}

// Feature-detect the browser's built-in speech recognition (Chrome/Edge).
// Purely an optional convenience for auto-filling the answer box while
// the candidate speaks on camera; typing always remains available.
const SpeechRecognitionAPI =
  typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

function AIInterview() {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  const [stage, setStage] = useState("setup"); // setup | interviewing | submitting | done | already_done | error
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    return () => {
      stopCamera();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraReady(true);
    } catch (err) {
      setError("Camera/microphone access is required for the video interview. Please allow access and try again.");
    }
  };

  const beginInterview = async () => {
    setError("");
    try {
      const res = await apiFetch(`/applications/${applicationId}/interview/start`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Could not start interview");
      }
      const data = await res.json();

      if (data.already_completed) {
        setResult(data.result);
        setStage("already_done");
        return;
      }

      setQuestions(data.questions);
      setAnswers({});
      setCurrentIndex(0);

      // Start recording the webcam session for the whole interview.
      if (mediaStreamRef.current) {
        recordedChunksRef.current = [];
        const recorder = new MediaRecorder(mediaStreamRef.current, {
          mimeType: MediaRecorder.isTypeSupported("video/webm") ? "video/webm" : "",
        });
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
      }

      setStage("interviewing");
    } catch (err) {
      setError(err.message || "Could not start interview");
    }
  };

  const currentQuestion = questions[currentIndex];

  const setAnswerText = (text) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: text }));
  };

  const toggleListening = () => {
    if (!SpeechRecognitionAPI) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript + " ";
      }
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: `${prev[currentQuestion.id] || ""} ${transcript}`.trim(),
      }));
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const goNext = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setListening(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      finishInterview();
    }
  };

  const finishInterview = async () => {
    setStage("submitting");
    setError("");

    // Stop recording and give the recorder a beat to flush the last chunk.
    let videoBlob = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      await new Promise((resolve) => {
        mediaRecorderRef.current.onstop = resolve;
        mediaRecorderRef.current.stop();
      });
      videoBlob = new Blob(recordedChunksRef.current, { type: "video/webm" });
    }
    stopCamera();

    try {
      const answerPayload = {
        answers: questions.map((q) => ({ question_id: q.id, answer: answers[q.id] || "" })),
      };

      const submitRes = await apiFetch(`/applications/${applicationId}/interview/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answerPayload),
      });

      if (!submitRes.ok) {
        const err = await submitRes.json().catch(() => ({}));
        throw new Error(err.detail || "Could not submit interview");
      }

      const submitData = await submitRes.json();

      if (videoBlob && videoBlob.size > 0) {
        const formData = new FormData();
        formData.append("file", videoBlob, "interview.webm");
        await fetch(`${BASE_URL}/applications/${applicationId}/interview/video`, {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}` },
          body: formData,
        }).catch(() => {
          // Non-fatal: the score is already saved even if the recording upload fails.
        });
      }

      setResult(submitData.result);
      setStage("done");
    } catch (err) {
      setError(err.message || "Could not submit interview");
      setStage("interviewing");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", padding: "40px" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto 20px auto" }}>
        <Link to="/candidate/applications">
          <button style={secondaryButtonStyle}>&larr; Back to My Applications</button>
        </Link>
      </div>

      <div style={{ maxWidth: "760px", margin: "auto" }}>
        <div style={{ background: "white", padding: "30px", borderRadius: "15px", boxShadow: "0px 4px 15px rgba(0,0,0,0.2)" }}>
          <h1 style={{ color: "#0f172a", marginBottom: "6px" }}>🎥 AI Video Interview</h1>
          <p style={{ color: "#64748b", marginBottom: "20px" }}>
            Random questions are generated from your resume's skills. Answer on camera — you can type your answer,
            or use speech-to-text if your browser supports it.
          </p>

          {error && <p style={{ color: "#dc2626", fontWeight: 600 }}>{error}</p>}

          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: "100%",
              maxHeight: "320px",
              background: "#0f172a",
              borderRadius: "12px",
              marginBottom: "16px",
              transform: "scaleX(-1)",
            }}
          />

          {stage === "setup" && (
            <>
              {!cameraReady ? (
                <button onClick={startCamera} style={{ ...secondaryButtonStyle, width: "100%", background: "#2563eb", color: "white" }}>
                  Enable Camera & Microphone
                </button>
              ) : (
                <button onClick={beginInterview} style={{ ...secondaryButtonStyle, width: "100%", background: "#16a34a", color: "white" }}>
                  Start Interview
                </button>
              )}
            </>
          )}

          {stage === "interviewing" && currentQuestion && (
            <div>
              <p style={{ color: "#64748b", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                Question {currentIndex + 1} of {questions.length}
              </p>
              <h3 style={{ color: "#0f172a", marginBottom: "14px" }}>{currentQuestion.question}</h3>

              <textarea
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Type your answer here (or use the mic button to speak)..."
                style={{
                  width: "100%",
                  minHeight: "120px",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  boxSizing: "border-box",
                  marginBottom: "12px",
                }}
              />

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {SpeechRecognitionAPI && (
                  <button
                    onClick={toggleListening}
                    style={{
                      ...secondaryButtonStyle,
                      background: listening ? "#fee2e2" : "#e2e8f0",
                      color: listening ? "#991b1b" : "#0f172a",
                    }}
                  >
                    {listening ? "⏹ Stop Recording Speech" : "🎙 Speak Answer"}
                  </button>
                )}
                <button onClick={goNext} style={{ ...secondaryButtonStyle, background: "#2563eb", color: "white", marginLeft: "auto" }}>
                  {currentIndex < questions.length - 1 ? "Next Question →" : "Finish Interview"}
                </button>
              </div>
            </div>
          )}

          {stage === "submitting" && <p style={{ color: "#0f172a", fontWeight: 600 }}>Scoring your interview...</p>}

          {(stage === "done" || stage === "already_done") && result && (
            <div>
              {stage === "already_done" && (
                <p style={{ color: "#64748b", marginBottom: "10px" }}>
                  You've already completed the AI interview for this application.
                </p>
              )}
              <h2 style={{ color: "#16a34a", marginBottom: "10px" }}>Interview Complete ✅</h2>
              <p style={{ color: "#0f172a", fontSize: "22px", fontWeight: 800, marginBottom: "10px" }}>
                Score: {result.score}%
              </p>
              <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", marginBottom: "16px" }}>
                <span style={{ color: "#16a34a", fontWeight: 600 }}>✓ Correct: {result.correct}</span>
                <span style={{ color: "#dc2626", fontWeight: 600 }}>✗ Wrong: {result.wrong}</span>
                <span style={{ color: "#64748b", fontWeight: 600 }}>— Unanswered: {result.unanswered}</span>
                <span style={{ color: "#64748b", fontWeight: 600 }}>/ {result.total} total</span>
              </div>
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

export default AIInterview;
