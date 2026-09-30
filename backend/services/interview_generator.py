"""Lightweight 'AI' interview question generator and answer scorer.

Questions are generated from the skills detected on a candidate's resume,
mixed with a few generic behavioural questions, and shuffled so each
interview attempt feels different. Answers are scored with a simple
heuristic evaluator so everything works fully offline (no external AI
API key required).
"""

import random

SKILL_QUESTION_TEMPLATES = [
    "Tell me about a project where you used {skill}. What was your specific role?",
    "What challenges have you faced while working with {skill}, and how did you solve them?",
    "How would you explain {skill} to someone with no technical background?",
    "Describe a time {skill} helped you solve a difficult problem at work.",
    "What best practices do you follow when working with {skill}?",
    "How do you keep your {skill} skills up to date?",
]

GENERIC_QUESTIONS = [
    "Walk me through your resume and your most significant achievement.",
    "Describe a challenging situation at work and how you handled it.",
    "Why are you interested in this role?",
    "Where do you see yourself professionally in the next few years?",
    "Tell me about a time you had to learn something new quickly.",
    "How do you prioritize tasks when working on multiple projects?",
    "Describe a time you disagreed with a teammate. How did you resolve it?",
]


def generate_questions(skills, num_questions=5):
    """Return a shuffled list of question dicts: {id, question, skill}."""

    skills = [s for s in dict.fromkeys(skills or []) if s]  # dedupe, keep order
    random.shuffle(skills)

    questions = []
    for skill in skills:
        if len(questions) >= max(num_questions - 2, 1):
            break
        template = random.choice(SKILL_QUESTION_TEMPLATES)
        questions.append({"question": template.format(skill=skill), "skill": skill})

    remaining = max(num_questions - len(questions), 1)
    generic_pool = GENERIC_QUESTIONS.copy()
    random.shuffle(generic_pool)
    questions.extend({"question": q, "skill": None} for q in generic_pool[:remaining])

    random.shuffle(questions)
    questions = questions[:num_questions]

    for i, q in enumerate(questions, start=1):
        q["id"] = i

    return questions


def score_answer(question, answer_text):
    """Classify an answer as 'correct', 'wrong' or 'unanswered'.

    Heuristic: an unanswered/empty response is flagged. Very short answers
    are marked wrong. Longer, relevant answers (mentioning the skill for
    skill-based questions, or simply detailed for generic questions) are
    marked correct.
    """

    answer = (answer_text or "").strip()
    if not answer:
        return "unanswered"

    word_count = len(answer.split())
    if word_count < 6:
        return "wrong"

    skill = question.get("skill")
    if skill and skill.lower() in answer.lower():
        return "correct"

    if skill and word_count >= 25:
        return "correct"

    if not skill and word_count >= 15:
        return "correct"

    return "wrong"


def score_interview(questions, answers_by_id):
    """Score a full interview.

    questions: list of {id, question, skill}
    answers_by_id: dict mapping question id (int) -> answer text

    Returns (results, summary) where results is a list of per-question
    dicts and summary contains total/correct/wrong/unanswered/score.
    """

    results = []
    correct = wrong = unanswered = 0

    for q in questions:
        answer_text = answers_by_id.get(q["id"], "")
        result = score_answer(q, answer_text)

        if result == "correct":
            correct += 1
        elif result == "wrong":
            wrong += 1
        else:
            unanswered += 1

        results.append(
            {
                "question_id": q["id"],
                "question": q["question"],
                "skill": q.get("skill"),
                "answer": answer_text,
                "result": result,
            }
        )

    total = len(questions)
    score = (correct / total) * 100 if total else 0.0

    summary = {
        "total": total,
        "correct": correct,
        "wrong": wrong,
        "unanswered": unanswered,
        "score": round(score, 2),
    }

    return results, summary
