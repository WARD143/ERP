import sqlite3
import csv
import os

DB_PATH = 'academic_analytics.sqlite'
DATA_DIR = 'public/data'
os.makedirs(DATA_DIR, exist_ok=True)

# Math dataset CSV
mat_csv_path = os.path.join(DATA_DIR, 'student-mat.csv')
por_csv_path = os.path.join(DATA_DIR, 'student-por.csv')

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Create table for UCI student performance
cursor.execute("""
CREATE TABLE IF NOT EXISTS uci_student_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_course TEXT, -- 'Math' or 'Portuguese'
    school TEXT,
    sex TEXT,
    age INTEGER,
    address TEXT,
    famsize TEXT,
    pstatus TEXT,
    medu INTEGER,
    fedu INTEGER,
    mjob TEXT,
    fjob TEXT,
    reason TEXT,
    guardian TEXT,
    traveltime INTEGER,
    studytime INTEGER,
    failures INTEGER,
    schoolsup TEXT,
    famsup TEXT,
    paid TEXT,
    activities TEXT,
    nursery TEXT,
    higher TEXT,
    internet TEXT,
    romantic TEXT,
    famrel INTEGER,
    freetime INTEGER,
    goout INTEGER,
    dalc INTEGER,
    walc INTEGER,
    health INTEGER,
    absences INTEGER,
    g1 INTEGER,
    g2 INTEGER,
    g3 INTEGER,
    risk_status TEXT,
    final_score_pct REAL
)
""")

conn.commit()
print("Table uci_student_records verified/created.")
conn.close()
