# Repo Pulse: Open-Source Repository Silent Abandonment Predictor

A diagnostic web application that analyzes any public GitHub repository and predicts whether it is actively maintained or on the verge of being silently abandoned within the next 3 to 6 months.

---

## 1. Project Overview

Software engineers and companies rely on hundreds of free open-source code packages to build their products. A major hidden danger in software development is **Silent Abandonment**. 

Silent abandonment happens when a library creator slowly burns out or walks away from their project without warning. The project still appears popular because it has thousands of stars, but bug fixes stop, pull requests sit untouched, and security vulnerabilities go unpatched.

Repo Pulse connects to the GitHub public API, measures maintainer behavior patterns, and uses a Machine Learning model to calculate an accurate **Abandonment Risk Score** (0% to 100%).

---

## 2. Key Metrics Explained in Simple Words

To make technical software health easy to understand for anyone, the diagnostic engine simplifies complex data into everyday concepts:

### A. Commit Cadence (The Project's Heartbeat)
* **What it means in simple words:** How often the code gets updated over time.
* **Why it matters:** Just like checking someone's pulse, a healthy project gets regular checkups and updates. If a project had 100 updates six months ago but only 2 updates in the last 90 days, its heartbeat is flatlining. That is a clear warning that the creator has stepped away.

### B. Maintainer Risk (The Bus Factor)
* **What it means in simple words:** Does a team run this project, or is it just one overworked person?
* **Why it matters:** In software engineering, this is called the "Bus Factor" (if the lead developer got hit by a bus or switched jobs tomorrow, would the project survive?). If 95% of all code was written by a single person, that project is at extreme risk. If that one person gets busy or loses interest, the whole project stops.

### C. Pull Request Turnaround (Community Responsiveness)
* **What it means in simple words:** When other developers try to help or fix a bug, do the owners reply or ignore them?
* **Why it matters:** When outside developers submit free bug fixes (called Pull Requests), an active owner reviews and merges them within a few days. If community fixes sit open for 60 to 90 days with zero response, the maintainer has mentally checked out.

### D. Issue Backlog Velocity (Problem Piling)
* **What it means in simple words:** Are user problems getting solved, or are complaints piling up like unpaid bills?
* **Why it matters:** If users report 50 new bugs every month but the owner only closes 2, the project is drowning in technical debt and heading toward abandonment.

### E. Silent Abandonment
* **What it means in simple words:** A project that looks alive from the outside, but is practically dead on the inside.
* **Why it matters:** A GitHub project never loses its stars. A library made in 2018 might still have 20,000 stars today, giving newcomers a false sense of security. Repo Pulse exposes whether someone is actually taking care of the house today.

---

## 3. How the System Works (End-to-End Logic)

```
[User Browser]
      │
      ▼ Enters GitHub repo name (e.g., "facebook/react" or "pallets/flask")
[Render Web Service]
      │
      ├── UI Layer: Serves Mozilla Firefox-inspired React interface
      │
      └── API Layer: FastAPI POST /api/predict
               │
               ├── 1. Fetches recent commits, issues, PRs from GitHub REST API
               ├── 2. Calculates Commit Cadence, Maintainer Risk, and PR Turnaround
               ├── 3. Feeds numbers into trained Scikit-Learn Random Forest model
               └── 4. Returns JSON report (Risk percentage, breakdown, verdict)
      │
      ▼
[User Browser Renders]
      - Clear Risk Badge: Healthy, Moderate, or Critical
      - Exact Probability percentage (e.g., 78%)
      - 3 Diagnostic Metric Cards (Cadence, Maintainer Share, Response Time)
      - Plain-English Recommendation
```

---

## 4. UI Design System: Mozilla Firefox Theme

Per design requirements, this project avoids generic glowing AI templates and emojis. It uses the grounded, accessible, and functional design language of **Mozilla Firefox (Photon / Proton)**:

* **Background:** Firefox Ink (`#1C1B22`) - Deep matte charcoal.
* **Panels & Cards:** Firefox Slate (`#2B2A33`) with subtle borders (`#38343D`).
* **Text:** Crisp White (`#FBFBFE`) and Muted Gray (`#8F8F9D`).
* **Action Accent:** Firefox Orange (`#FF7139`).
* **Status Badges:**
  * Safe / Healthy: Firefox Mint (`#00DD8A`)
  * Warning / Moderate: Firefox Amber (`#FFA436`)
  * Danger / Critical: Firefox Crimson (`#E22850`)
* **Address Bar Input:** Styled like the Firefox URL Awesomebar with a search icon and quick-test repo chips.

---

## 5. Technology Stack

* **Frontend:** React (Vite), Tailwind CSS, Lucide Icons (SVG only, no emojis).
* **Backend:** Python 3.10+, FastAPI, Uvicorn.
* **Machine Learning:** Scikit-Learn (Random Forest Classifier), Pandas, NumPy, Joblib.
* **Data Provider:** GitHub REST API v3 (Public endpoints).
* **Cloud Deployment:** Hosted as a single unified service on **Render**.

---

## 6. Directory Layout (All files inside "repo pulse")

```
Desktop/repo pulse/
├── PROJECT.md               # Complete project documentation and specs
├── backend/
│   ├── extractor.py         # Pulls data from GitHub REST API
│   ├── features.py          # Calculates the simple metrics
│   ├── train_model.py       # Trains the Scikit-Learn classifier
│   ├── model.joblib         # Saved machine learning model file
│   ├── main.py              # FastAPI server serving API and static frontend
│   └── requirements.txt     # Python backend dependencies
├── frontend/
│   ├── src/                 # React UI components (Firefox theme)
│   ├── package.json         # Node.js dependencies
│   └── vite.config.js       # Production build configuration
└── build.sh                 # Unified deployment script for Render
```

---

## 7. What Happens Next

1. Build the Python backend (`extractor.py`, `features.py`, `train_model.py`, `main.py`).
2. Train and save the Scikit-Learn model (`model.joblib`).
3. Build the Firefox-styled React frontend with clean search and diagnostic cards.
4. Test the complete application locally.
5. Provide the exact 1-click build script ready to deploy to Render.
