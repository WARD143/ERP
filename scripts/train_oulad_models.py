import sqlite3
import pandas as pd
import numpy as np
import joblib
import json
import time
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix, classification_report

print("--- Preparing OULAD Machine Learning Dataset ---")
t0 = time.time()
conn = sqlite3.connect("academic_analytics.sqlite")

# Query student level features + aggregated engagement + assessment stats
query = """
SELECT 
    s.id_student,
    s.code_module,
    s.code_presentation,
    s.gender,
    s.region,
    s.highest_education,
    s.imd_band,
    s.age_band,
    s.num_of_prev_attempts,
    s.studied_credits,
    s.disability,
    s.final_result,
    COALESCE(r.date_registration, -50) as date_registration,
    COALESCE(e.total_clicks, 0) as total_clicks,
    COALESCE(e.active_days, 0) as active_days,
    COALESCE(e.pre_course_clicks, 0) as pre_course_clicks,
    COALESCE(e.early_clicks, 0) as early_clicks,
    COALESCE(e.late_clicks, 0) as late_clicks,
    COALESCE(astat.avg_score, 0) as avg_assessment_score,
    COALESCE(astat.sub_count, 0) as assessment_submissions,
    COALESCE(astat.avg_submission_delay, 0) as avg_submission_delay
FROM oulad_students s
LEFT JOIN oulad_student_registrations r 
    ON s.code_module = r.code_module AND s.code_presentation = r.code_presentation AND s.id_student = r.id_student
LEFT JOIN oulad_student_engagement e
    ON s.code_module = e.code_module AND s.code_presentation = e.code_presentation AND s.id_student = e.id_student
LEFT JOIN (
    SELECT 
        sa.id_student,
        a.code_module,
        a.code_presentation,
        AVG(sa.score) as avg_score,
        COUNT(sa.id_assessment) as sub_count,
        AVG(sa.date_submitted - COALESCE(a.date, sa.date_submitted)) as avg_submission_delay
    FROM oulad_student_assessments sa
    JOIN oulad_assessments a ON sa.id_assessment = a.id_assessment
    WHERE sa.score IS NOT NULL
    GROUP BY sa.id_student, a.code_module, a.code_presentation
) astat ON s.code_module = astat.code_module AND s.code_presentation = astat.code_presentation AND s.id_student = astat.id_student
"""

df = pd.read_sql_query(query, conn)
conn.close()

print(f"Loaded {len(df):,} student enrolment records in {time.time()-t0:.2f}s")
print(f"Final Result distribution:\n{df['final_result'].value_counts()}")

# Clean and encode features
# Classification Target: Pass/Distinction vs Fail/Withdrawn (Academic Risk/Completion)
# Or Multi-class: Pass, Distinction, Fail, Withdrawn
df['binary_target'] = df['final_result'].apply(lambda x: 1 if x in ['Pass', 'Distinction'] else 0)

# Categorical encodings (avoiding target leakage and student identifiers)
feature_cols = [
    'studied_credits', 'num_of_prev_attempts', 'date_registration',
    'total_clicks', 'active_days', 'pre_course_clicks', 'early_clicks', 'late_clicks',
    'avg_assessment_score', 'assessment_submissions', 'avg_submission_delay'
]

# One-hot encode high-level categoricals
cat_cols = ['gender', 'highest_education', 'age_band', 'disability']
df_encoded = pd.get_dummies(df[feature_cols + cat_cols], columns=cat_cols, drop_first=True)

X = df_encoded.fillna(0)
y = df['binary_target']
y_multi = df['final_result']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

models = {
    "LogisticRegression": LogisticRegression(max_iter=1000, random_state=42),
    "DecisionTree": DecisionTreeClassifier(max_depth=6, random_state=42),
    "RandomForest": RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1),
    "GradientBoosting": GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42)
}

results = {}

for name, model in models.items():
    print(f"\n--- Training {name} ---")
    mt0 = time.time()
    model.fit(X_train, y_train)
    train_dur = time.time() - mt0
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    prec, rec, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='weighted')
    cm = confusion_matrix(y_test, y_pred).tolist()
    
    print(f"{name} Results -> Accuracy: {acc:.4f} | Precision: {prec:.4f} | Recall: {rec:.4f} | F1: {f1:.4f} in {train_dur:.2f}s")
    
    results[name] = {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "confusion_matrix": cm,
        "features": list(X.columns)
    }

# Save best model pipeline (RandomForest and GradientBoosting)
joblib.dump(models["RandomForest"], "oulad_random_forest.joblib")
joblib.dump(models["GradientBoosting"], "oulad_gradient_boosting.joblib")

# Save feature metadata for fast inference
with open("data/oulad/model_evaluation.json", "w") as out:
    json.dump({
        "dataset": "Open University Learning Analytics Dataset (OULAD)",
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "features_count": len(X.columns),
        "features": list(X.columns),
        "results": results
    }, out, indent=2)

print("\nModel evaluation saved to data/oulad/model_evaluation.json")
