import os
from pathlib import Path
from typing import Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field
import joblib
import pandas as pd

from extractor import parse_repo_identifier, fetch_repo_raw_data
from features import extract_features

app = FastAPI(
    title="Repo Pulse Diagnostic API",
    description="Calculates probability of open-source repository silent abandonment",
    version="1.0.0"
)

# Enable CORS for local Vite dev server and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load ML Model
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model.joblib"

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Model file not found at {MODEL_PATH}. Run train_model.py first.")

model_payload = joblib.load(MODEL_PATH)
model = model_payload["model"]
feature_columns = model_payload["feature_columns"]

class RepoRequest(BaseModel):
    repo: str = Field(..., description="GitHub repository slug or URL, e.g. 'pallets/flask'")

def generate_simple_recommendation(risk_score: float, is_archived: bool, bus_factor: float, decay: float, pr_days: float) -> str:
    if is_archived:
        return "This repository is officially archived by its owner. It receives zero updates or security patches. Do not use for new projects."
    
    if risk_score >= 65.0:
        reasons = []
        if decay > 50:
            reasons.append("code updates have dropped significantly")
        if bus_factor > 80:
            reasons.append("the project relies almost entirely on one person")
        if pr_days > 45:
            reasons.append("community bug fixes sit unanswered for months")
        detail = ", and ".join(reasons) if reasons else "maintainer engagement has stalled"
        return f"High risk of silent abandonment: {detail}. Proceed with caution or identify actively maintained alternatives."
    
    elif risk_score >= 35.0:
        reasons = []
        if bus_factor > 75:
            reasons.append("high reliance on a single author")
        if decay > 25:
            reasons.append("commit velocity has slowed down")
        detail = " and ".join(reasons) if reasons else "cadence is slowing"
        return f"Moderate risk: {detail}. Suitable for existing dependencies, but monitor release activity before using in critical production."
    
    else:
        return "Healthy and actively maintained: Regular code updates, community pull requests get reviewed, and maintenance is well distributed."

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Repo Pulse API",
        "model_version": model_payload.get("version", "1.0.0")
    }

@app.post("/api/predict")
def predict_repo_abandonment(req: RepoRequest):
    try:
        repo_slug = parse_repo_identifier(req.repo)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    try:
        raw_data = fetch_repo_raw_data(repo_slug)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except PermissionError as pe:
        raise HTTPException(status_code=429, detail=str(pe))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to communicate with GitHub: {str(e)}")

    features_dict, diagnostics = extract_features(raw_data)

    # If officially archived, risk is 100%
    if diagnostics["is_archived"]:
        risk_probability = 1.0
    else:
        # Prepare feature vector matching training columns
        input_df = pd.DataFrame([features_dict])[feature_columns]
        prob_array = model.predict_proba(input_df)[0]
        # prob_array[1] is probability of abandonment
        risk_probability = float(prob_array[1])

    risk_percentage = round(risk_probability * 100.0, 1)

    if risk_percentage >= 65.0:
        status_label = "CRITICAL RISK"
        status_category = "critical"
    elif risk_percentage >= 35.0:
        status_label = "MODERATE RISK"
        status_category = "moderate"
    else:
        status_label = "HEALTHY & ACTIVE"
        status_category = "healthy"

    recommendation = generate_simple_recommendation(
        risk_score=risk_percentage,
        is_archived=diagnostics["is_archived"],
        bus_factor=diagnostics["top_author_share"],
        decay=diagnostics["commit_decay_rate"],
        pr_days=diagnostics["avg_pr_age_days"]
    )

    return {
        "repo_slug": repo_slug,
        "risk_score": risk_percentage,
        "status_label": status_label,
        "status_category": status_category,
        "recommendation": recommendation,
        "diagnostics": diagnostics
    }

# Mount static files from frontend build if available
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")
    
    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        file_path = FRONTEND_DIST / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")
else:
    @app.get("/")
    def index():
        return {
            "message": "Repo Pulse Backend API is running.",
            "api_endpoint": "POST /api/predict",
            "health_check": "GET /api/health",
            "frontend_status": "Building..."
        }
