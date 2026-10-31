-- EduPulse AI Relational Schema (SQLite 3.x)
-- Engineering Capstone Project - 1 (A.Y. 2026-2027)

PRAGMA foreign_keys = ON;

-- Users & Authentication Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('STUDENT', 'FACULTY', 'ADMIN')) NOT NULL,
    name TEXT NOT NULL,
    roll_number TEXT,
    department TEXT DEFAULT 'Computer Science & Engineering',
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Academic Semesters
CREATE TABLE IF NOT EXISTS semesters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    semester_number INTEGER NOT NULL,
    is_current INTEGER DEFAULT 1,
    start_date DATE,
    end_date DATE
);

-- Faculty Profiles
CREATE TABLE IF NOT EXISTS faculty (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    designation TEXT NOT NULL,
    specialization TEXT
);

-- Subjects Offered
CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    credits INTEGER NOT NULL,
    semester_id TEXT NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    faculty_id TEXT REFERENCES faculty(id)
);

-- Students Profiles
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    roll_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    section TEXT NOT NULL,
    batch TEXT NOT NULL,
    current_semester_id TEXT NOT NULL REFERENCES semesters(id),
    mentor_faculty_id TEXT REFERENCES faculty(id)
);

-- Assessments (IA-1, IA-2, Assignments, Semester Exams)
CREATE TABLE IF NOT EXISTS assessments (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('INTERNAL_1', 'INTERNAL_2', 'ASSIGNMENT', 'MID_TERM', 'FINAL_EXAM')) NOT NULL,
    max_marks REAL NOT NULL,
    weightage REAL NOT NULL,
    assessment_date DATE NOT NULL
);

-- Marks Obtained
CREATE TABLE IF NOT EXISTS marks (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    marks_obtained REAL NOT NULL,
    max_marks REAL NOT NULL,
    is_absent INTEGER DEFAULT 0,
    remarks TEXT,
    entered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, assessment_id)
);

-- Attendance Records per Subject
CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    total_classes INTEGER NOT NULL,
    attended_classes INTEGER NOT NULL,
    percentage REAL NOT NULL,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, subject_id)
);

-- Assignments & Submissions
CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    score REAL NOT NULL,
    max_score REAL NOT NULL,
    submission_status TEXT CHECK(submission_status IN ('ON_TIME', 'LATE', 'MISSED')) NOT NULL,
    due_date DATE NOT NULL,
    submitted_date DATE
);

-- Historical & Aggregated Performance Records per Semester
CREATE TABLE IF NOT EXISTS performance_records (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    semester_id TEXT NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    gpa REAL NOT NULL,
    percentage REAL NOT NULL,
    total_credits INTEGER NOT NULL,
    rank_in_section INTEGER,
    attendance_average REAL NOT NULL,
    trend_status TEXT CHECK(trend_status IN ('IMPROVING', 'STABLE', 'DECLINING')) NOT NULL,
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, semester_id)
);

-- Central Risk Assessment Table (Risk Classification Engine Output)
CREATE TABLE IF NOT EXISTS risk_assessments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    overall_risk_score REAL NOT NULL, -- 0 to 100
    risk_level TEXT CHECK(risk_level IN ('LOW', 'MEDIUM', 'HIGH')) NOT NULL,
    declining_marks_flag INTEGER DEFAULT 0,
    low_attendance_flag INTEGER DEFAULT 0,
    inconsistent_assessments_flag INTEGER DEFAULT 0,
    weak_subjects_count INTEGER DEFAULT 0,
    explanation_reasons TEXT NOT NULL, -- JSON string array
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id)
);

-- Early Warning Alerts
CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    severity TEXT CHECK(severity IN ('INFO', 'WARNING', 'CRITICAL')) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    risk_category TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    is_resolved INTEGER DEFAULT 0,
    resolution_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Actionable Recommendations & Interventions
CREATE TABLE IF NOT EXISTS recommendations (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
    category TEXT NOT NULL,
    priority TEXT CHECK(priority IN ('HIGH', 'MEDIUM', 'LOW')) NOT NULL,
    title TEXT NOT NULL,
    actionable_steps TEXT NOT NULL, -- JSON string array
    rationale TEXT NOT NULL,
    status TEXT CHECK(status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')) DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Faculty Initiated Interventions & Counseling Records
CREATE TABLE IF NOT EXISTS interventions (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    faculty_id TEXT NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    type TEXT CHECK(type IN ('COUNSELING', 'REMEDIAL_CLASS', 'PEER_TUTORING', 'ATTENDANCE_WARNING', 'PARENT_CONTACT')) NOT NULL,
    notes TEXT NOT NULL,
    target_date DATE,
    status TEXT CHECK(status IN ('SCHEDULED', 'CONDUCTED', 'FOLLOW_UP')) DEFAULT 'SCHEDULED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Configurable Risk Engine Thresholds (Admin Controlled)
CREATE TABLE IF NOT EXISTS risk_configurations (
    id TEXT PRIMARY KEY,
    min_attendance_threshold REAL DEFAULT 75.0,
    decline_percentage_threshold REAL DEFAULT 10.0,
    variance_threshold REAL DEFAULT 15.0,
    high_risk_cutoff REAL DEFAULT 65.0,
    medium_risk_cutoff REAL DEFAULT 35.0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
