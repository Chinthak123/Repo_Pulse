from datetime import datetime, timezone
from collections import Counter
from typing import Dict, Any, Tuple

def parse_iso(dt_str: str) -> datetime:
    """Safely parses ISO 8601 strings to UTC datetime."""
    if not dt_str:
        return datetime.now(timezone.utc)
    # Python 3.11+ handles Z and offsets
    clean_str = dt_str.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(clean_str)
    except Exception:
        return datetime.now(timezone.utc)

def extract_features(raw_data: Dict[str, Any]) -> Tuple[Dict[str, float], Dict[str, Any]]:
    """
    Computes numerical features for the ML model and structured human-readable metrics.
    """
    now = datetime.now(timezone.utc)
    repo = raw_data.get("repo", {})
    commits = raw_data.get("commits", [])
    pulls = raw_data.get("pulls", [])
    latest_release = raw_data.get("latest_release")
    
    is_archived = bool(repo.get("archived", False))
    stars = int(repo.get("stargazers_count", 0))
    forks = int(repo.get("forks_count", 0))
    open_issues = int(repo.get("open_issues_count", 0))
    
    # 1. Days since last push
    pushed_at = parse_iso(repo.get("pushed_at", ""))
    days_since_last_push = max(0.0, (now - pushed_at).total_seconds() / 86400.0)

    # 2. Commit Cadence & Decay Rate
    c_last_90 = 0
    c_prev_180 = 0
    authors = []

    for c in commits:
        commit_dt_str = c.get("commit", {}).get("author", {}).get("date")
        if not commit_dt_str:
            continue
        c_dt = parse_iso(commit_dt_str)
        age_days = (now - c_dt).total_seconds() / 86400.0
        
        if age_days <= 90:
            c_last_90 += 1
        elif age_days <= 270:
            c_prev_180 += 1
            
        author_name = (
            (c.get("author") or {}).get("login") or
            c.get("commit", {}).get("author", {}).get("name") or
            "Unknown"
        )
        authors.append(author_name)

    # Baseline 90-day volume from the previous 180 days (divide by 2)
    baseline_90 = c_prev_180 / 2.0
    if baseline_90 == 0:
        commit_decay_rate = 100.0 if c_last_90 == 0 else 0.0
    else:
        # Positive value means activity dropped (decay)
        # Negative value means activity surged
        decay = (1.0 - (c_last_90 / baseline_90)) * 100.0
        commit_decay_rate = max(-100.0, min(100.0, decay))

    # 3. Maintainer Concentration (Bus Factor)
    if authors:
        counts = Counter(authors)
        top_author, top_count = counts.most_common(1)[0]
        top_author_share = (top_count / len(authors)) * 100.0
        total_unique_contributors = len(counts)
    else:
        top_author_share = 100.0
        total_unique_contributors = 1
        top_author = "Unknown"

    # 4. Pull Request Idle Latency
    pr_ages = []
    for p in pulls:
        pr_dt = parse_iso(p.get("created_at", ""))
        pr_ages.append((now - pr_dt).total_seconds() / 86400.0)
    avg_pr_age_days = (sum(pr_ages) / len(pr_ages)) if pr_ages else 0.0

    # 5. Days since last release
    if latest_release and latest_release.get("published_at"):
        rel_dt = parse_iso(latest_release["published_at"])
        days_since_last_release = max(0.0, (now - rel_dt).total_seconds() / 86400.0)
    else:
        # If no releases published, fallback to pushed_at
        days_since_last_release = max(days_since_last_push, 180.0)

    # ML Feature Vector (normalized inputs for Random Forest)
    features_for_model = {
        "days_since_last_push": days_since_last_push,
        "commit_decay_rate": commit_decay_rate,
        "commits_last_90_days": float(c_last_90),
        "top_author_share": top_author_share,
        "unique_contributors": float(total_unique_contributors),
        "avg_pr_age_days": avg_pr_age_days,
        "days_since_last_release": days_since_last_release,
        "open_issues_count": float(open_issues),
        "is_archived": 1.0 if is_archived else 0.0
    }

    # Human-readable breakdown for the frontend
    diagnostics = {
        "repo_name": repo.get("full_name", "Unknown"),
        "description": repo.get("description", "No description provided."),
        "stars": stars,
        "forks": forks,
        "open_issues": open_issues,
        "is_archived": is_archived,
        "days_since_last_push": round(days_since_last_push, 1),
        "commit_decay_rate": round(commit_decay_rate, 1),
        "commits_last_90_days": c_last_90,
        "top_author_share": round(top_author_share, 1),
        "top_author": top_author,
        "unique_contributors": total_unique_contributors,
        "avg_pr_age_days": round(avg_pr_age_days, 1),
        "days_since_last_release": round(days_since_last_release, 1),
        "last_push_iso": repo.get("pushed_at")
    }

    return features_for_model, diagnostics
