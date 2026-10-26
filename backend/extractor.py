import os
import re
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import requests

GITHUB_API_BASE = "https://api.github.com"

def parse_repo_identifier(raw_input: str) -> str:
    """
    Cleans user input like 'https://github.com/pallets/flask',
    'github.com/pallets/flask', or 'pallets/flask' into 'owner/repo'.
    """
    cleaned = raw_input.strip().rstrip("/")
    # Match standard github URLs
    match = re.search(r"github\.com/([^/]+)/([^/]+)", cleaned, re.IGNORECASE)
    if match:
        return f"{match.group(1)}/{match.group(2)}"
    
    # If user provided owner/repo directly
    parts = cleaned.split("/")
    if len(parts) == 2 and parts[0] and parts[1]:
        return f"{parts[0]}/{parts[1]}"
        
    raise ValueError(f"Invalid repository format '{raw_input}'. Please enter in 'owner/repo' or 'https://github.com/owner/repo' format.")

def get_headers() -> Dict[str, str]:
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "RepoPulse-Diagnostic/1.0"
    }
    token = os.getenv("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers

def fetch_repo_raw_data(repo_slug: str) -> Dict[str, Any]:
    """
    Fetches core repository metadata, recent commits, pull requests, and releases.
    """
    headers = get_headers()
    
    # 1. Base Repo Details
    repo_url = f"{GITHUB_API_BASE}/repos/{repo_slug}"
    resp = requests.get(repo_url, headers=headers, timeout=12)
    
    if resp.status_code == 404:
        raise ValueError(f"Repository '{repo_slug}' not found on GitHub. Check spelling or ensure it is public.")
    elif resp.status_code == 403:
        rate_limit_reset = resp.headers.get("X-RateLimit-Reset")
        reset_time_str = ""
        if rate_limit_reset:
            reset_dt = datetime.fromtimestamp(int(rate_limit_reset), tz=timezone.utc)
            reset_time_str = f" Rate limit resets at {reset_dt.strftime('%H:%M:%S UTC')}."
        raise PermissionError(f"GitHub API rate limit reached.{reset_time_str} Try again later or set GITHUB_TOKEN.")
    elif resp.status_code != 200:
        raise RuntimeError(f"GitHub API error (Status {resp.status_code}): {resp.text}")
        
    repo_data = resp.json()
    
    # 2. Recent Commits (Up to 100)
    commits_url = f"{GITHUB_API_BASE}/repos/{repo_slug}/commits?per_page=100"
    commits_resp = requests.get(commits_url, headers=headers, timeout=12)
    commits = commits_resp.json() if commits_resp.status_code == 200 and isinstance(commits_resp.json(), list) else []

    # 3. Open Pull Requests (Up to 30 oldest open to calculate idle lag)
    pulls_url = f"{GITHUB_API_BASE}/repos/{repo_slug}/pulls?state=open&sort=created&direction=asc&per_page=30"
    pulls_resp = requests.get(pulls_url, headers=headers, timeout=12)
    pulls = pulls_resp.json() if pulls_resp.status_code == 200 and isinstance(pulls_resp.json(), list) else []

    # 4. Latest Release Check
    release_url = f"{GITHUB_API_BASE}/repos/{repo_slug}/releases/latest"
    release_resp = requests.get(release_url, headers=headers, timeout=10)
    latest_release = release_resp.json() if release_resp.status_code == 200 else None

    return {
        "repo": repo_data,
        "commits": commits,
        "pulls": pulls,
        "latest_release": latest_release,
        "fetched_at": datetime.now(timezone.utc).isoformat()
    }
