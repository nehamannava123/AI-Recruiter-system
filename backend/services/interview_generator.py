def generate_questions(skills):

    questions = []

    for skill in skills:

        questions.append(
            f"Explain a project where you used {skill}"
        )

    return questions