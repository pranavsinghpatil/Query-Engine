# gemini-api - AIzaSyAYqEVojzmSLv101fVPvEzDHLhpuR7SYso
import requests
import os
import docker
# import boto3
# from botocore.exceptions import ClientError
import google.generativeai as genai
genai.configure(api_key="AIzaSyAYqEVojzmSLv101fVPvEzDHLhpuR7SYso")
client = docker.from_env()

def generate_script_gemini(task_description):
    model = genai.GenerativeModel('gemini-1.5-flash')
    prompt= f"Generate a shell script to {task_description}, only give the single bullet point don't extend the response into a paragraph, and second line consist of the replacement that to made for execution of the script .  . also if not specified give the scripts for windows ",

    response = model.generate_content(prompt)

    return response.text

# GITHUB_API_TOKEN = "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"


import os

def setup_project_folder(project_name):
    """Create a project directory."""
    try:
        os.makedirs(project_name, exist_ok=True)
        print(f"✅ Project folder '{project_name}' created.")
    except Exception as e:
        print(f"❌ Error creating folder: {e}")

import subprocess

def initialize_git_repo(project_name):
    """Initialize a git repository in the project directory."""
    try:
        subprocess.run(["git", "init"], cwd=project_name, check=True)
        print("✅ Git repository initialized.")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error initializing Git repo: {e}")

import requests
import os

def create_github_repo(repo_name, description="Auto-created by automation agent"):
    """Create a GitHub repository using GitHub API."""
    api_token = os.getenv("duGITHUB_API_TOKEN")
    if not api_token:
        print("❌ GitHub API token not found.")
        return
    
    headers = {
        "Authorization": f"token {api_token}",
        "Accept": "application/vnd.github.v3+json"
    }
    data = {
        "name": repo_name,
        "description": description,
        "private": False  # Set to True if you want the repo to be private
    }
    response = requests.post("https://api.github.com/user/repos", json=data, headers=headers)
    
    if response.status_code == 201:
        print(f"✅ GitHub repository '{repo_name}' created successfully.")
    else:
        print(f"❌ Error creating GitHub repo: {response.json()}")

import docker

def build_and_run_docker(image_name, project_name):
    """Build a Docker image and run a container in the specified project folder."""
    dockerfile_full_path = os.path.join(project_name, "Dockerfile")
    requirements_full_path = os.path.join(project_name, "requirements.txt")
    
    # Ensure the project folder exists
    if not os.path.isdir(project_name):
        print(f"❌ Project folder '{project_name}' does not exist.")
        return
    
    # Check if the Dockerfile exists; if not, create it
    if not os.path.isfile(dockerfile_full_path):
        print("⚠️ Dockerfile not found. Creating a default Dockerfile...")
        create_default_dockerfile(project_name)
    
    # Check if the requirements.txt exists; if not, create it
    if not os.path.isfile(requirements_full_path):
        print("⚠️ requirements.txt not found. Creating a default requirements.txt...")
        create_default_requirements(project_name)
    
    try:
        print("🔨 Building Docker image...")
        client.images.build(path=project_name, tag=image_name, dockerfile='Dockerfile')
        print(f"✅ Docker image '{image_name}' built successfully.")
        
        print(f"🚀 Running Docker container from image '{image_name}'...")
        container = client.containers.run(image_name, detach=True)
        print(f"✅ Container {container.short_id} is running.")
    except docker.errors.BuildError as e:
        print(f"❌ Error building Docker image: {e}")
    except docker.errors.ContainerError as e:
        print(f"❌ Error running Docker container: {e}")


def create_default_dockerfile(project_name):
    """Create a default Dockerfile in the specified project folder."""
    dockerfile_content = """
# Use an official Python runtime as a base image
FROM python:3.11-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed dependencies
RUN pip install --no-cache-dir -r requirements.txt || echo "No requirements.txt found, skipping..."

# Run the application
CMD ["python", "main.py"]
    """
    
    dockerfile_path = os.path.join(project_name, "Dockerfile")
    try:
        with open(dockerfile_path, "w") as dockerfile:
            dockerfile.write(dockerfile_content)
        print(f"✅ Default Dockerfile created at '{dockerfile_path}'")
    except Exception as e:
        print(f"❌ Error creating Dockerfile: {e}")


def create_default_requirements(project_name):
    """Create a default requirements.txt in the specified project folder."""
    requirements_content = """
# Default dependencies for the project
streamlit
requests
docker
"""
    requirements_path = os.path.join(project_name, "requirements.txt")
    try:
        with open(requirements_path, "w") as requirements_file:
            requirements_file.write(requirements_content)
        print(f"✅ Default requirements.txt created at '{requirements_path}'")
    except Exception as e:
        print(f"❌ Error creating requirements.txt: {e}")


class WorkflowEngine:
    def __init__(self):
        self.steps = []
    
    def add_step(self, function, *args):
        """Add a step to the workflow with its arguments."""
        self.steps.append((function, args))
    
    def run(self):
        """Execute each step in sequence."""
        for i, (func, args) in enumerate(self.steps):
            try:
                print(f"\n🔄 Running step {i+1}: {func.__name__}")
                func(*args)
            except Exception as e:
                print(f"❌ Error in step {i+1} ({func.__name__}): {e}")
                break


def setup_project_workflow(project_name, repo_name, image_name):
    # Create the workflow engine
    workflow = WorkflowEngine()
    
    # Add steps to the workflow
    workflow.add_step(setup_project_folder, project_name)
    workflow.add_step(initialize_git_repo, project_name)
    workflow.add_step(create_github_repo, repo_name)
    
    try:
        client = docker.DockerClient(base_url='npipe:////./pipe/docker_engine')
        print("✅ Docker client connected successfully.")
        workflow.add_step(build_and_run_docker, image_name, project_name)
    except docker.errors.DockerException as e:
        print(f"❌ Error connecting to Docker: {e}")
        exit(1)

    
    
    # Run the workflow
    workflow.run()


if __name__ == "__main__":
    
    setup_project_workflow(
        project_name="my-test-project",
        repo_name="my-test-repo",
        image_name="my-test-image"
    )
