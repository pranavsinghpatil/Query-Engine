# api - AIzaSyAYqEVojzmSLv101fVPvEzDHLhpuR7SYso
import requests
import os
# Import the Python SDK
import google.generativeai as genai
genai.configure(api_key="AIzaSyAYqEVojzmSLv101fVPvEzDHLhpuR7SYso")

def generate_script_gemini(task_description):
    model = genai.GenerativeModel('gemini-1.5-flash')
    prompt= f"Generate a shell script to {task_description}, only give the single bullet point don't extend the response into a paragraph, and second line consist of the replacement that to made for execution of the script .  . also if not specified give the scripts for windows ",

    response = model.generate_content(prompt)

    return response.text

token = "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"


def create_github_repo(repo_name, token,description = "A New Repository"):
    url = "https://api.github.com/user/repos"
    headers = {"Authorization": f"token {token}"}
    data = {"name": repo_name,"description": description, "private": True}
    response = requests.post(url, json=data, headers=headers)
    if response.status_code == 201:
        print(f"Repository '{repo_name}' created successfully.")
    else:
        print(f"Error: {response.json()}")

# create_github_repo("hello",token)

