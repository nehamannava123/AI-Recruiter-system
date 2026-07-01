SKILLS = [
    "Python",
    "Java",
    "FastAPI",
    "SQL",
    "Machine Learning",
    "Docker",
    "AWS",
    "React"
]

def extract_skills(text):

    found = []

    for skill in SKILLS:

        if skill.lower() in text.lower():

            found.append(skill)

    return found