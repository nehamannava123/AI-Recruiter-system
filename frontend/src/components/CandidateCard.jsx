import { useEffect, useState } from "react";

function CandidateDetails() {
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/rank")
      .then((res) => res.json())
      .then((data) => {
        setCandidates(data.top_candidates || []);
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <div>
      <h2>Candidate Analysis</h2>

      {candidates.map((candidate, index) => (
        <div
          key={index}
          style={{
            border: "1px solid gray",
            padding: "10px",
            marginBottom: "10px",
          }}
        >
          <h3>{candidate}</h3>
        </div>
      ))}
    </div>
  );
}

export default CandidateDetails;