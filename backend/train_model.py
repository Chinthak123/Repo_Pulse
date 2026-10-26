import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
import joblib
import os

FEATURE_COLUMNS = [
    "days_since_last_push",
    "commit_decay_rate",
    "commits_last_90_days",
    "top_author_share",
    "unique_contributors",
    "avg_pr_age_days",
    "days_since_last_release",
    "open_issues_count",
    "is_archived"
]

def generate_synthetic_training_data(n_samples: int = 3000) -> pd.DataFrame:
    """
    Synthesizes a realistic distribution of active vs. stagnating vs. abandoned repositories.
    """
    np.random.seed(42)
    n_half = n_samples // 2
    
    # 1. Healthy / Active Repos (Class 0: Not Abandoned)
    healthy = pd.DataFrame({
        "days_since_last_push": np.random.exponential(scale=7, size=n_half),
        "commit_decay_rate": np.random.normal(loc=-10.0, scale=25.0, size=n_half),
        "commits_last_90_days": np.random.poisson(lam=45, size=n_half) + 5,
        "top_author_share": np.clip(np.random.normal(loc=45.0, scale=15.0, size=n_half), 15.0, 75.0),
        "unique_contributors": np.random.poisson(lam=12, size=n_half) + 2,
        "avg_pr_age_days": np.random.exponential(scale=8, size=n_half) + 1,
        "days_since_last_release": np.random.exponential(scale=35, size=n_half) + 5,
        "open_issues_count": np.random.poisson(lam=80, size=n_half) + 5,
        "is_archived": np.zeros(n_half),
        "abandoned": 0
    })

    # 2. Abandoned / Zombie Repos (Class 1: Abandoned)
    abandoned = pd.DataFrame({
        "days_since_last_push": np.random.exponential(scale=180, size=n_half) + 90,
        "commit_decay_rate": np.clip(np.random.normal(loc=85.0, scale=15.0, size=n_half), 50.0, 100.0),
        "commits_last_90_days": np.random.choice([0, 1, 2], size=n_half, p=[0.75, 0.20, 0.05]),
        "top_author_share": np.clip(np.random.normal(loc=92.0, scale=8.0, size=n_half), 75.0, 100.0),
        "unique_contributors": np.random.choice([1, 2, 3], size=n_half, p=[0.85, 0.12, 0.03]),
        "avg_pr_age_days": np.random.exponential(scale=120, size=n_half) + 60,
        "days_since_last_release": np.random.exponential(scale=300, size=n_half) + 180,
        "open_issues_count": np.random.poisson(lam=40, size=n_half),
        "is_archived": np.random.choice([0, 1], size=n_half, p=[0.80, 0.20]),
        "abandoned": 1
    })

    df = pd.concat([healthy, abandoned], ignore_index=True).sample(frac=1.0, random_state=42).reset_index(drop=True)
    return df

def train_and_export_model():
    print("Generating training dataset...")
    df = generate_synthetic_training_data(n_samples=4000)
    
    X = df[FEATURE_COLUMNS]
    y = df["abandoned"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    print("Fitting Random Forest Classifier...")
    model = RandomForestClassifier(
        n_estimators=150,
        max_depth=6,
        min_samples_split=5,
        random_state=42,
        class_weight="balanced"
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    probs = model.predict_proba(X_test)[:, 1]
    
    print("\nModel Performance Evaluation:")
    print(classification_report(y_test, preds))
    print(f"ROC-AUC Score: {roc_auc_score(y_test, probs):.4f}")

    # Inspect Feature Importances
    importances = sorted(zip(FEATURE_COLUMNS, model.feature_importances_), key=lambda x: x[1], reverse=True)
    print("\nFeature Importances:")
    for feat, imp in importances:
        print(f"  - {feat}: {imp*100:.1f}%")

    out_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(out_dir, "model.joblib")
    
    payload = {
        "model": model,
        "feature_columns": FEATURE_COLUMNS,
        "version": "1.0.0"
    }
    joblib.dump(payload, model_path)
    print(f"\nModel exported successfully to: {model_path}")

if __name__ == "__main__":
    train_and_export_model()
