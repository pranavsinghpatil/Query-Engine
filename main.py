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
# t = "create a folder named 'pristine' on the user's Desktop"
# print(generate_script_gemini(t))

def create_github_repo(repo_name, token):
    url = "https://api.github.com/user/repos"
    headers = {"Authorization": f"token {token}"}
    data = {"name": repo_name, "private": True}
    response = requests.post(url, json=data, headers=headers)
    return response.json()

create_github_repo("hello",token)

# git clone https://github.com/pranavsinghpatil/LLM-Agent.git
