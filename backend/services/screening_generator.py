"""Role-aware aptitude (MCQ) + coding (free-text) screening round.

This runs fully offline: a small keyword map picks the closest role
"category" for a job posting, then questions are drawn from a per-category
bank and shuffled so each attempt looks a little different. Aptitude MCQs
are auto-graded; coding answers are free-text and saved for the recruiter
to review manually (no code execution).
"""

import random

CATEGORY_KEYWORDS = {
    "backend": [
        "backend", "back-end", "api", "server", "node", "django", "flask",
        "spring", "microservice", "golang", "ruby", "php", ".net", "java",
        "rest", "sql", "database",
    ],
    "frontend": [
        "frontend", "front-end", "react", "angular", "vue", "javascript",
        "typescript", "ui", "css", "html", "web developer",
    ],
    "data": [
        "data scientist", "data analyst", "data engineer", "machine learning",
        "ml engineer", "analytics", "etl", "pandas", "statistics", "ai engineer",
    ],
    "devops": [
        "devops", "cloud", "aws", "azure", "gcp", "kubernetes", "docker",
        "ci/cd", "infrastructure", "sre", "site reliability",
    ],
    "mobile": [
        "mobile", "android", "ios developer", "flutter", "react native",
        "swift", "kotlin",
    ],
    "qa": [
        "qa", "quality assurance", "sdet", "test engineer", "automation testing",
        "manual testing",
    ],
}

# ---------------------------------------------------------------------------
# Aptitude MCQs
# ---------------------------------------------------------------------------

# Generic pool: quantitative / logical / verbal reasoning, applies to any role.
GENERIC_APTITUDE = [
    {
        "question": "A train travels 180 km in 3 hours. What is its average speed?",
        "options": ["45 km/h", "60 km/h", "50 km/h", "90 km/h"],
        "answer_index": 1,
    },
    {
        "question": "If 20% of a number is 50, what is the number?",
        "options": ["100", "150", "200", "250"],
        "answer_index": 3,
    },
    {
        "question": "Find the next number in the series: 2, 6, 12, 20, 30, ?",
        "options": ["36", "40", "42", "44"],
        "answer_index": 2,
    },
    {
        "question": "A is taller than B. C is shorter than B. Who is the shortest?",
        "options": ["A", "B", "C", "Cannot be determined"],
        "answer_index": 2,
    },
    {
        "question": "Choose the word most nearly opposite in meaning to 'Meticulous'.",
        "options": ["Careless", "Precise", "Thorough", "Attentive"],
        "answer_index": 0,
    },
    {
        "question": "If a shirt costs $40 after a 20% discount, what was the original price?",
        "options": ["$48", "$50", "$52", "$60"],
        "answer_index": 1,
    },
    {
        "question": "Which number does not belong: 4, 9, 16, 26, 36, 49?",
        "options": ["9", "16", "26", "49"],
        "answer_index": 2,
    },
    {
        "question": "Five people finish a task in 10 days. How many days for 10 people (same rate)?",
        "options": ["5", "10", "15", "20"],
        "answer_index": 0,
    },
    {
        "question": "Choose the correctly spelled word.",
        "options": ["Occurance", "Occurrence", "Ocurrence", "Occurrance"],
        "answer_index": 1,
    },
    {
        "question": "All engineers are logical. Some logical people are creative. Which must be true?",
        "options": [
            "All engineers are creative",
            "Some engineers may be creative",
            "No engineers are creative",
            "All creative people are engineers",
        ],
        "answer_index": 1,
    },
]

# Small role-flavoured additions mixed in alongside the generic pool.
ROLE_APTITUDE = {
    "backend": [
        {
            "question": "What is the time complexity of binary search on a sorted array of n items?",
            "options": ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
            "answer_index": 1,
        },
        {
            "question": "Which HTTP status code indicates the request succeeded and a resource was created?",
            "options": ["200", "201", "301", "404"],
            "answer_index": 1,
        },
    ],
    "frontend": [
        {
            "question": "In CSS, which selector has the highest specificity?",
            "options": ["Element (div)", "Class (.card)", "ID (#header)", "Universal (*)"],
            "answer_index": 2,
        },
        {
            "question": "What does the 'virtual DOM' primarily help frameworks like React optimize?",
            "options": ["Network requests", "UI re-render performance", "Database queries", "CSS parsing"],
            "answer_index": 1,
        },
    ],
    "data": [
        {
            "question": "A dataset's mean is heavily skewed by outliers. Which statistic is more robust?",
            "options": ["Mean", "Median", "Range", "Sum"],
            "answer_index": 1,
        },
        {
            "question": "In SQL, which clause is used to filter grouped rows after a GROUP BY?",
            "options": ["WHERE", "HAVING", "ORDER BY", "LIMIT"],
            "answer_index": 1,
        },
    ],
    "devops": [
        {
            "question": "Which practice reduces downtime by gradually shifting traffic to a new version?",
            "options": ["Big-bang deployment", "Canary/rolling deployment", "Manual patching", "Cold restart"],
            "answer_index": 1,
        },
        {
            "question": "What does CI/CD primarily automate?",
            "options": ["UI design", "Building, testing and deploying code", "Hiring", "Billing"],
            "answer_index": 1,
        },
    ],
    "mobile": [
        {
            "question": "On Android, which component manages a screen's lifecycle?",
            "options": ["Service", "Activity", "ContentProvider", "BroadcastReceiver"],
            "answer_index": 1,
        },
        {
            "question": "What is the main benefit of a cross-platform framework like Flutter?",
            "options": [
                "Single codebase for multiple platforms",
                "Faster CPUs",
                "No need for testing",
                "Automatic backend hosting",
            ],
            "answer_index": 0,
        },
    ],
    "qa": [
        {
            "question": "What is the primary goal of a regression test suite?",
            "options": [
                "Test brand-new features only",
                "Catch new bugs introduced in previously working functionality",
                "Measure server uptime",
                "Design the UI",
            ],
            "answer_index": 1,
        },
        {
            "question": "Which testing technique selects inputs at the edges of valid ranges?",
            "options": ["Boundary value analysis", "Smoke testing", "Load testing", "Exploratory testing"],
            "answer_index": 0,
        },
    ],
}

# ---------------------------------------------------------------------------
# Coding questions (free-text, reviewed manually by the recruiter)
# ---------------------------------------------------------------------------

CODING_QUESTIONS = {
    "backend": [
        {
            "title": "Reverse a linked list",
            "prompt": "Write a function that reverses a singly linked list in place. State the time and space complexity of your solution.",
        },
        {
            "title": "Rate limiter",
            "prompt": "Design and implement a simple API rate limiter (e.g. token bucket) that allows N requests per user per minute. Explain your data structures.",
        },
        {
            "title": "Deduplicate & sort",
            "prompt": "Given a list of integers, write a function that returns the unique values sorted in ascending order without using a built-in sort function.",
        },
    ],
    "frontend": [
        {
            "title": "Debounce function",
            "prompt": "Implement a `debounce(fn, delay)` utility in JavaScript that delays invoking `fn` until `delay` ms have passed since the last call.",
        },
        {
            "title": "Flatten nested arrays",
            "prompt": "Write a function that flattens an arbitrarily nested array of numbers into a single flat array, without using Array.prototype.flat.",
        },
        {
            "title": "Accessible modal",
            "prompt": "Describe (with pseudocode or JSX) how you would implement an accessible modal dialog, including keyboard focus trapping and Escape-to-close.",
        },
    ],
    "data": [
        {
            "title": "Moving average",
            "prompt": "Write a function that computes the moving average of a list of numbers over a window of size k.",
        },
        {
            "title": "SQL: top N per group",
            "prompt": "Write a SQL query to find the top 3 highest-paid employees in each department, given tables employees(id, name, dept_id, salary).",
        },
        {
            "title": "Missing value strategy",
            "prompt": "You have a dataset with 15% missing values in a numeric column. Write pseudocode/code for how you'd detect and handle them, and justify your approach.",
        },
    ],
    "devops": [
        {
            "title": "Zero-downtime deploy script",
            "prompt": "Sketch a shell/CI pseudocode script that deploys a new app version with a health check and automatic rollback on failure.",
        },
        {
            "title": "Dockerfile",
            "prompt": "Write a minimal Dockerfile for a Python web service (assume `app.py` and `requirements.txt` exist) optimized for a small image size.",
        },
        {
            "title": "Log parsing",
            "prompt": "Write a script/function that parses a log file and counts how many requests returned a 5xx status code per hour.",
        },
    ],
    "mobile": [
        {
            "title": "Offline-first sync",
            "prompt": "Describe (with pseudocode) how you would implement offline-first data sync in a mobile app that queues writes and syncs when connectivity returns.",
        },
        {
            "title": "List performance",
            "prompt": "Write pseudocode/code for efficiently rendering a scrollable list of 10,000 items on mobile without jank (e.g. list recycling / virtualization).",
        },
        {
            "title": "Image cache",
            "prompt": "Implement a simple in-memory LRU cache for images identified by URL, with a maximum size limit.",
        },
    ],
    "qa": [
        {
            "title": "Test case design",
            "prompt": "Given a function that validates email addresses, list the test cases (valid, invalid, edge cases) you would write to cover it thoroughly.",
        },
        {
            "title": "Flaky test triage",
            "prompt": "Describe, step by step, how you would investigate and fix a test that passes locally but fails intermittently in CI.",
        },
        {
            "title": "Simple test script",
            "prompt": "Write pseudocode/code for an automated test that verifies a login form rejects an incorrect password with the correct error message.",
        },
    ],
    "general": [
        {
            "title": "FizzBuzz variant",
            "prompt": "Write a function that prints numbers 1 to 50, but for multiples of 3 prints 'Fizz', multiples of 5 prints 'Buzz', and multiples of both prints 'FizzBuzz'.",
        },
        {
            "title": "Find duplicates",
            "prompt": "Write a function that takes a list and returns all elements that appear more than once.",
        },
        {
            "title": "Word frequency",
            "prompt": "Write a function that takes a paragraph of text and returns the 3 most frequently occurring words.",
        },
    ],
}


def detect_category(role: str, description: str = "") -> str:
    """Pick the closest role category from free-text role/description."""

    text = f"{role or ''} {description or ''}".lower()

    best_category = "general"
    best_score = 0
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text)
        if score > best_score:
            best_score = score
            best_category = category

    return best_category


def generate_aptitude_questions(category: str, num_questions: int = 5):
    """Return a shuffled list of MCQ dicts: {id, question, options, answer_index}."""

    pool = ROLE_APTITUDE.get(category, []).copy() + GENERIC_APTITUDE.copy()
    random.shuffle(pool)
    selected = pool[:num_questions]

    questions = []
    for i, q in enumerate(selected, start=1):
        questions.append(
            {
                "id": i,
                "question": q["question"],
                "options": q["options"],
                "answer_index": q["answer_index"],
            }
        )
    return questions


def generate_coding_questions(category: str, num_questions: int = 2):
    """Return a shuffled list of coding prompt dicts: {id, title, prompt}."""

    pool = CODING_QUESTIONS.get(category, CODING_QUESTIONS["general"]).copy()
    random.shuffle(pool)
    selected = pool[:num_questions] or CODING_QUESTIONS["general"][:num_questions]

    questions = []
    for i, q in enumerate(selected, start=1):
        questions.append({"id": i, "title": q["title"], "prompt": q["prompt"]})
    return questions


def public_aptitude_questions(questions):
    """Strip answer keys before sending questions to the candidate."""

    return [{"id": q["id"], "question": q["question"], "options": q["options"]} for q in questions]


def score_aptitude(questions, answers_by_id):
    """Grade MCQ answers.

    questions: list of {id, question, options, answer_index}
    answers_by_id: dict mapping question id (int) -> selected option index (int or None)

    Returns (results, summary).
    """

    results = []
    correct = wrong = unanswered = 0

    for q in questions:
        selected = answers_by_id.get(q["id"])
        if selected is None:
            result = "unanswered"
            unanswered += 1
        elif selected == q["answer_index"]:
            result = "correct"
            correct += 1
        else:
            result = "wrong"
            wrong += 1

        results.append(
            {
                "question_id": q["id"],
                "question": q["question"],
                "options": q["options"],
                "selected_index": selected,
                "answer_index": q["answer_index"],
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
