def analyze_risk(candidate):

    risks = []

    if candidate["trust_score"] < 70:
        risks.append("Low Trust Score")

    if len(candidate["projects"]) == 0:
        risks.append("No Projects Found")

    return risks