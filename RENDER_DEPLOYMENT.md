# Deploying Repo Pulse to Render (Free Plan)

This project is pre-configured and tested for 1-click hosting on Render's Free tier.

---

## What Was Pre-Configured

1. **`render.yaml`**: Official Render Blueprint configuration defining the web service, build steps, start command, and port bindings.
2. **`requirements.txt`**: Placed at repository root for Render Python runtime detection and dependency caching.
3. **`build.sh`**: Robust unified build script (`chmod +x` with UNIX line endings):
   - Installs Python dependencies
   - Compiles React frontend with Vite (or seamlessly falls back to pre-built distribution in `frontend/dist`)
   - Pre-trains and validates the Scikit-Learn Random Forest model (`backend/model.joblib`)
4. **`backend/main.py`**:
   - Dynamic path resolution ensuring imports work seamlessly regardless of whether run from root or `backend/`
   - Serves FastAPI REST API (`/api/predict`, `/api/health`)
   - Serves React SPA and static assets (`/assets/`, emblems, etc.) from the same single unified port
5. **`.gitignore` & `.gitattributes`**:
   - Excludes heavy/OS-dependent `node_modules` and Python caches
   - Enforces UNIX line-endings (`LF`) on `build.sh` to prevent Linux shell errors

---

## Deployment Options

### Option 1: Blueprint Deployment (Recommended - 1 Click)

1. Sign in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** at the top right and select **Blueprint**.
3. Connect your repository: `Chinthak123/Repo_Pulse`.
4. Render will automatically detect `render.yaml`.
5. Click **Apply**. Render will run `bash build.sh` and launch the service.

---

### Option 2: Manual Web Service Deployment

If you prefer to configure manually:

1. In the [Render Dashboard](https://dashboard.render.com/), click **New +** and select **Web Service**.
2. Connect your repository: `Chinthak123/Repo_Pulse`.
3. Fill in the following fields:
   - **Name**: `repo-pulse` (or your choice)
   - **Runtime**: `Python`
   - **Branch**: `main`
   - **Build Command**: `bash build.sh`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`
4. Click **Deploy Web Service**.

---

## Optional: GitHub Token for Higher Rate Limits

By default, GitHub's unauthenticated REST API allows 60 requests per hour per IP. 

To raise the limit to **5,000 requests per hour**:
1. Go to [GitHub Settings > Developer Settings > Personal Access Tokens](https://github.com/settings/tokens) (Fine-grained or Classic with `public_repo` read access).
2. In your Render Dashboard, open your `repo-pulse` service.
3. Go to **Environment** tab.
4. Add an environment variable:
   - **Key**: `GITHUB_TOKEN`
   - **Value**: `ghp_yourPersonalAccessTokenHere`
5. Save changes.
