"""
Training script placeholder for future ML model development.
The MVP uses deterministic scoring in scoring.py.
Run: python -m ml_models.train
"""

import json
from pathlib import Path


def generate_sample_dataset(output_path: str = "ml_models/sample_data.json") -> None:
    """Generate sample training data for future model fine-tuning."""
    samples = [
        {
            "transcript": "I led a team of five engineers to deliver the project ahead of schedule.",
            "eye_contact_pct": 85,
            "wpm": 145,
            "filler_rate": 2.0,
            "label_score": 88,
        },
        {
            "transcript": "Um, like, I guess I did some stuff at my last job, you know.",
            "eye_contact_pct": 45,
            "wpm": 90,
            "filler_rate": 12.0,
            "label_score": 42,
        },
        {
            "transcript": "In my previous role I identified a bottleneck in our deployment pipeline.",
            "eye_contact_pct": 78,
            "wpm": 138,
            "filler_rate": 3.5,
            "label_score": 82,
        },
    ]
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(samples, f, indent=2)
    print(f"Sample dataset written to {path}")


if __name__ == "__main__":
    generate_sample_dataset()
