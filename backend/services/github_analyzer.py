import requests

def github_score(username):

    url = f"https://api.github.com/users/{username}"

    data = requests.get(url).json()

    repos = data.get("public_repos", 0)

    followers = data.get("followers", 0)

    return repos + followers