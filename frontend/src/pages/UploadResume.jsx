import { useState } from "react";

function UploadResume() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const uploadResume = async () => {
    if (!file) {
      alert("Please select a resume first");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      alert("Resume Uploaded Successfully ✅");
      console.log(data);
    } catch (error) {
      console.log(error);
      alert("Upload Failed ❌");
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        background: "#ffffff",
        padding: "25px",
        borderRadius: "15px",
        boxShadow: "0px 4px 15px rgba(0,0,0,0.1)",
        marginTop: "20px",
        marginBottom: "20px",
      }}
    >
      <h2 style={{ color: "#1e293b" }}>
        Upload Candidate Resume
      </h2>

      <p style={{ color: "#64748b" }}>
        Upload PDF resumes for AI screening
      </p>

      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files[0])}
        style={{
          marginTop: "10px",
          marginBottom: "15px",
        }}
      />

      <br />

      <button
        onClick={uploadResume}
        disabled={loading}
        style={{
          background: "#2563eb",
          color: "white",
          border: "none",
          padding: "12px 25px",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        {loading ? "Uploading..." : "Upload Resume"}
      </button>

      {file && (
        <p
          style={{
            marginTop: "15px",
            color: "#16a34a",
          }}
        >
          Selected: {file.name}
        </p>
      )}
    </div>
  );
}

export default UploadResume;