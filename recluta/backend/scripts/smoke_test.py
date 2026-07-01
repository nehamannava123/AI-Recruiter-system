"""Smoke test: simulate interview sessions via API to populate dataset and trigger training."""

import requests
import time
import random
import os

API = os.getenv("RECLUTA_API", "http://localhost:8000")


def start_session(role="Engineer", level="Junior", interview_type="Technical"):
    resp = requests.post(f"{API}/api/interview/start", json={"role": role, "level": level, "interview_type": interview_type})
    resp.raise_for_status()
    return resp.json()


def respond(session_id, answer_text):
    resp = requests.post(f"{API}/api/interview/respond", json={"session_id": session_id, "transcription": answer_text, "cv_metrics": {"eye_contact": random.uniform(40, 90), "smile": random.uniform(0,1), "head_pose": {}}})
    resp.raise_for_status()
    return resp.json()


def run(n_sessions=50, q_per_session=3):
    sample_answers = [
        "I led a team to deliver a feature using agile practices and we reduced latency by 30%.",
        "I debugged a production issue by analyzing logs and adding retries, which fixed the problem.",
        "I designed a microservice with clear interfaces and wrote tests to ensure reliability.",
        "I prioritize tasks based on impact and effort, and I communicate progress to stakeholders.",
    ]
    for i in range(n_sessions):
        s = start_session(role="Engineer", level=random.choice(["Junior","Mid","Senior"]), interview_type=random.choice(["Technical","Behavioral"]))
        sid = s.get("session_id")
        for q in range(q_per_session):
            answer = random.choice(sample_answers)
            r = respond(sid, answer)
            print("Resp:", r.get("overall_score", r.get("answer_score")))
            time.sleep(0.1)

    # trigger retrain
    try:
        r = requests.post(f"{API}/api/analysis/retrain")
        print("Retrain response:", r.json())
    except Exception as e:
        print("Retrain failed:", e)


if __name__ == "__main__":
    run( n_sessions=60, q_per_session=4)
