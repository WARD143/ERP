import sqlite3
import os
import csv
import json
import time

DB_PATH = "academic_analytics.sqlite"
DATA_DIR = r"C:\Users\hp\Downloads\ERP\data\oulad\raw"

print("--- Initializing OULAD Database Schema ---")
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

cursor.executescript("""
-- OULAD Import History
CREATE TABLE IF NOT EXISTS oulad_import_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    row_count INTEGER NOT NULL,
    import_duration_seconds REAL,
    status TEXT NOT NULL,
    error_message TEXT,
    imported_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- OULAD Courses
CREATE TABLE IF NOT EXISTS oulad_courses (
    code_module TEXT NOT NULL,
    code_presentation TEXT NOT NULL,
    module_presentation_length INTEGER,
    PRIMARY KEY (code_module, code_presentation)
);

-- OULAD Assessments
CREATE TABLE IF NOT EXISTS oulad_assessments (
    id_assessment INTEGER PRIMARY KEY,
    code_module TEXT NOT NULL,
    code_presentation TEXT NOT NULL,
    assessment_type TEXT NOT NULL,
    date INTEGER,
    weight REAL
);
CREATE INDEX IF NOT EXISTS idx_oulad_assessments_module_pres ON oulad_assessments (code_module, code_presentation);

-- OULAD Students (Enrolment Level)
CREATE TABLE IF NOT EXISTS oulad_students (
    code_module TEXT NOT NULL,
    code_presentation TEXT NOT NULL,
    id_student INTEGER NOT NULL,
    gender TEXT,
    region TEXT,
    highest_education TEXT,
    imd_band TEXT,
    age_band TEXT,
    num_of_prev_attempts INTEGER,
    studied_credits INTEGER,
    disability TEXT,
    final_result TEXT,
    PRIMARY KEY (code_module, code_presentation, id_student)
);
CREATE INDEX IF NOT EXISTS idx_oulad_students_id ON oulad_students (id_student);
CREATE INDEX IF NOT EXISTS idx_oulad_students_result ON oulad_students (final_result);

-- OULAD Student Registrations
CREATE TABLE IF NOT EXISTS oulad_student_registrations (
    code_module TEXT NOT NULL,
    code_presentation TEXT NOT NULL,
    id_student INTEGER NOT NULL,
    date_registration INTEGER,
    date_unregistration INTEGER,
    PRIMARY KEY (code_module, code_presentation, id_student)
);

-- OULAD Student Assessments
CREATE TABLE IF NOT EXISTS oulad_student_assessments (
    id_assessment INTEGER NOT NULL,
    id_student INTEGER NOT NULL,
    date_submitted INTEGER,
    is_banked INTEGER,
    score REAL,
    PRIMARY KEY (id_assessment, id_student)
);
CREATE INDEX IF NOT EXISTS idx_oulad_sa_student ON oulad_student_assessments (id_student);
CREATE INDEX IF NOT EXISTS idx_oulad_sa_assessment ON oulad_student_assessments (id_assessment);

-- OULAD VLE Sites
CREATE TABLE IF NOT EXISTS oulad_vle (
    id_site INTEGER PRIMARY KEY,
    code_module TEXT NOT NULL,
    code_presentation TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    week_from INTEGER,
    week_to INTEGER
);
CREATE INDEX IF NOT EXISTS idx_oulad_vle_module_pres ON oulad_vle (code_module, code_presentation);

-- OULAD Student VLE Aggregated (Student x Course x Activity Type)
-- Optimizes queries over 10.6M raw clicks so UI queries are sub-millisecond
CREATE TABLE IF NOT EXISTS oulad_student_vle_summary (
    code_module TEXT NOT NULL,
    code_presentation TEXT NOT NULL,
    id_student INTEGER NOT NULL,
    activity_type TEXT NOT NULL,
    total_clicks INTEGER NOT NULL,
    first_activity_day INTEGER,
    last_activity_day INTEGER,
    active_days_count INTEGER,
    PRIMARY KEY (code_module, code_presentation, id_student, activity_type)
);
CREATE INDEX IF NOT EXISTS idx_oulad_vle_sum_student ON oulad_student_vle_summary (id_student);

-- OULAD Student Overall Engagement Rollup
CREATE TABLE IF NOT EXISTS oulad_student_engagement (
    code_module TEXT NOT NULL,
    code_presentation TEXT NOT NULL,
    id_student INTEGER NOT NULL,
    total_clicks INTEGER NOT NULL,
    active_days INTEGER NOT NULL,
    pre_course_clicks INTEGER DEFAULT 0,
    early_clicks INTEGER DEFAULT 0,
    late_clicks INTEGER DEFAULT 0,
    PRIMARY KEY (code_module, code_presentation, id_student)
);
CREATE INDEX IF NOT EXISTS idx_oulad_eng_student ON oulad_student_engagement (id_student);
""")
conn.commit()
print("OULAD schema created successfully.")

def clean_val(v):
    if v is None:
        return None
    s = str(v).strip()
    if s == '?' or s == '' or s.lower() == 'null':
        return None
    return s

def clean_int(v):
    val = clean_val(v)
    if val is None:
        return None
    try:
        return int(float(val))
    except:
        return None

def clean_float(v):
    val = clean_val(v)
    if val is None:
        return None
    try:
        return float(val)
    except:
        return None

# 1. Courses
t0 = time.time()
with open(os.path.join(DATA_DIR, "courses.csv"), "r", encoding="utf-8") as f:
    r = csv.DictReader(f)
    rows = [(clean_val(x['code_module']), clean_val(x['code_presentation']), clean_int(x['module_presentation_length'])) for x in r]
cursor.executemany("INSERT OR REPLACE INTO oulad_courses VALUES (?,?,?)", rows)
conn.commit()
cursor.execute("INSERT INTO oulad_import_history (table_name, row_count, import_duration_seconds, status) VALUES (?,?,?,?)",
               ("oulad_courses", len(rows), time.time()-t0, "SUCCESS"))
print(f"Imported oulad_courses: {len(rows)} rows.")

# 2. Assessments
t0 = time.time()
with open(os.path.join(DATA_DIR, "assessments.csv"), "r", encoding="utf-8") as f:
    r = csv.DictReader(f)
    rows = [(clean_int(x['id_assessment']), clean_val(x['code_module']), clean_val(x['code_presentation']),
             clean_val(x['assessment_type']), clean_int(x['date']), clean_float(x['weight'])) for x in r]
cursor.executemany("INSERT OR REPLACE INTO oulad_assessments VALUES (?,?,?,?,?,?)", rows)
conn.commit()
cursor.execute("INSERT INTO oulad_import_history (table_name, row_count, import_duration_seconds, status) VALUES (?,?,?,?)",
               ("oulad_assessments", len(rows), time.time()-t0, "SUCCESS"))
print(f"Imported oulad_assessments: {len(rows)} rows.")

# 3. Student Info
t0 = time.time()
with open(os.path.join(DATA_DIR, "studentInfo.csv"), "r", encoding="utf-8") as f:
    r = csv.DictReader(f)
    rows = [(clean_val(x['code_module']), clean_val(x['code_presentation']), clean_int(x['id_student']),
             clean_val(x['gender']), clean_val(x['region']), clean_val(x['highest_education']),
             clean_val(x['imd_band']), clean_val(x['age_band']), clean_int(x['num_of_prev_attempts']),
             clean_int(x['studied_credits']), clean_val(x['disability']), clean_val(x['final_result'])) for x in r]
cursor.executemany("INSERT OR REPLACE INTO oulad_students VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", rows)
conn.commit()
cursor.execute("INSERT INTO oulad_import_history (table_name, row_count, import_duration_seconds, status) VALUES (?,?,?,?)",
               ("oulad_students", len(rows), time.time()-t0, "SUCCESS"))
print(f"Imported oulad_students: {len(rows)} rows.")

# 4. Student Registration
t0 = time.time()
with open(os.path.join(DATA_DIR, "studentRegistration.csv"), "r", encoding="utf-8") as f:
    r = csv.DictReader(f)
    rows = [(clean_val(x['code_module']), clean_val(x['code_presentation']), clean_int(x['id_student']),
             clean_int(x['date_registration']), clean_int(x['date_unregistration'])) for x in r]
cursor.executemany("INSERT OR REPLACE INTO oulad_student_registrations VALUES (?,?,?,?,?)", rows)
conn.commit()
cursor.execute("INSERT INTO oulad_import_history (table_name, row_count, import_duration_seconds, status) VALUES (?,?,?,?)",
               ("oulad_student_registrations", len(rows), time.time()-t0, "SUCCESS"))
print(f"Imported oulad_student_registrations: {len(rows)} rows.")

# 5. Student Assessment
t0 = time.time()
with open(os.path.join(DATA_DIR, "studentAssessment.csv"), "r", encoding="utf-8") as f:
    r = csv.DictReader(f)
    rows = [(clean_int(x['id_assessment']), clean_int(x['id_student']), clean_int(x['date_submitted']),
             clean_int(x['is_banked']), clean_float(x['score'])) for x in r]
cursor.executemany("INSERT OR REPLACE INTO oulad_student_assessments VALUES (?,?,?,?,?)", rows)
conn.commit()
cursor.execute("INSERT INTO oulad_import_history (table_name, row_count, import_duration_seconds, status) VALUES (?,?,?,?)",
               ("oulad_student_assessments", len(rows), time.time()-t0, "SUCCESS"))
print(f"Imported oulad_student_assessments: {len(rows)} rows.")

# 6. VLE sites
t0 = time.time()
vle_site_map = {} # id_site -> activity_type
with open(os.path.join(DATA_DIR, "vle.csv"), "r", encoding="utf-8") as f:
    r = csv.DictReader(f)
    rows = []
    for x in r:
        s_id = clean_int(x['id_site'])
        act = clean_val(x['activity_type']) or 'other'
        vle_site_map[s_id] = act
        rows.append((s_id, clean_val(x['code_module']), clean_val(x['code_presentation']),
                     act, clean_int(x['week_from']), clean_int(x['week_to'])))
cursor.executemany("INSERT OR REPLACE INTO oulad_vle VALUES (?,?,?,?,?,?)", rows)
conn.commit()
cursor.execute("INSERT INTO oulad_import_history (table_name, row_count, import_duration_seconds, status) VALUES (?,?,?,?)",
               ("oulad_vle", len(rows), time.time()-t0, "SUCCESS"))
conn.commit()
print(f"Imported oulad_vle: {len(rows)} rows. VLE site map size: {len(vle_site_map)}")

# 7. Streaming Aggregation of studentVle.csv (10.65M rows)
print("Starting streaming processing of studentVle.csv (10.65M rows)...")
t0 = time.time()

# Aggregator in memory for batches of 500,000 lines
chunk_size = 500000
line_count = 0

# We aggregate directly into temp sqlite table or python dict chunks
# Key: (code_module, code_presentation, id_student, activity_type) -> [total_clicks, min_day, max_day, set_days]
agg_vle = {}
# Key: (code_module, code_presentation, id_student) -> [total_clicks, set_days, pre, early, late]
agg_eng = {}

def flush_batch():
    global agg_vle, agg_eng
    # Insert or update into oulad_student_vle_summary
    vle_summary_rows = [
        (k[0], k[1], k[2], k[3], v['clicks'], v['min_day'], v['max_day'], len(v['days']))
        for k, v in agg_vle.items()
    ]
    cursor.executemany("""
        INSERT INTO oulad_student_vle_summary (code_module, code_presentation, id_student, activity_type, total_clicks, first_activity_day, last_activity_day, active_days_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(code_module, code_presentation, id_student, activity_type) DO UPDATE SET
            total_clicks = total_clicks + excluded.total_clicks,
            first_activity_day = MIN(COALESCE(first_activity_day, excluded.first_activity_day), COALESCE(excluded.first_activity_day, first_activity_day)),
            last_activity_day = MAX(COALESCE(last_activity_day, excluded.last_activity_day), COALESCE(excluded.last_activity_day, last_activity_day)),
            active_days_count = active_days_count + excluded.active_days_count
    """, vle_summary_rows)

    eng_rows = [
        (k[0], k[1], k[2], v['clicks'], len(v['days']), v['pre'], v['early'], v['late'])
        for k, v in agg_eng.items()
    ]
    cursor.executemany("""
        INSERT INTO oulad_student_engagement (code_module, code_presentation, id_student, total_clicks, active_days, pre_course_clicks, early_clicks, late_clicks)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(code_module, code_presentation, id_student) DO UPDATE SET
            total_clicks = total_clicks + excluded.total_clicks,
            active_days = active_days + excluded.active_days,
            pre_course_clicks = pre_course_clicks + excluded.pre_course_clicks,
            early_clicks = early_clicks + excluded.early_clicks,
            late_clicks = late_clicks + excluded.late_clicks
    """, eng_rows)
    conn.commit()
    agg_vle.clear()
    agg_eng.clear()

with open(os.path.join(DATA_DIR, "studentVle.csv"), "r", encoding="utf-8") as f:
    reader = csv.reader(f)
    header = next(reader)
    # ['code_module', 'code_presentation', 'id_student', 'id_site', 'date', 'sum_click']
    for row in reader:
        line_count += 1
        c_mod, c_pres, sid, site_id, dt, clicks = row[0], row[1], int(row[2]), int(row[3]), int(row[4]), int(row[5])
        act_type = vle_site_map.get(site_id, 'other')

        # VLE Summary
        vk = (c_mod, c_pres, sid, act_type)
        if vk not in agg_vle:
            agg_vle[vk] = {'clicks': clicks, 'min_day': dt, 'max_day': dt, 'days': {dt}}
        else:
            rec = agg_vle[vk]
            rec['clicks'] += clicks
            if dt < rec['min_day']: rec['min_day'] = dt
            if dt > rec['max_day']: rec['max_day'] = dt
            rec['days'].add(dt)

        # Engagement
        ek = (c_mod, c_pres, sid)
        if ek not in agg_eng:
            pre = clicks if dt < 0 else 0
            early = clicks if 0 <= dt <= 100 else 0
            late = clicks if dt > 100 else 0
            agg_eng[ek] = {'clicks': clicks, 'days': {dt}, 'pre': pre, 'early': early, 'late': late}
        else:
            erec = agg_eng[ek]
            erec['clicks'] += clicks
            erec['days'].add(dt)
            if dt < 0: erec['pre'] += clicks
            elif dt <= 100: erec['early'] += clicks
            else: erec['late'] += clicks

        if line_count % chunk_size == 0:
            flush_batch()
            print(f"Processed {line_count:,} / 10,655,280 lines ({line_count/10655280*100:.1f}%) in {time.time()-t0:.1f}s")

if agg_vle or agg_eng:
    flush_batch()

cursor.execute("PRAGMA synchronous = NORMAL;")
cursor.execute("PRAGMA journal_mode = WAL;")

cursor.execute("INSERT INTO oulad_import_history (table_name, row_count, import_duration_seconds, status) VALUES (?,?,?,?)",
               ("oulad_student_vle_aggregated", line_count, time.time()-t0, "SUCCESS"))
conn.commit()

print(f"Successfully processed and aggregated {line_count:,} VLE records in {time.time()-t0:.2f} seconds!")
conn.close()
