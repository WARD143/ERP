"""
EduPulse AI - Python Flask Backend Server
Engineering Capstone Project – 1 (A.Y. 2026–2027)
Team: G. Akshath (2420030512), P. TejAditya (2420030520), I. Rajesh (2420030684)
Guide: Dr. Pratusha Mam | Department of CSE
"""

import os
import sqlite3
import hashlib
import json
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Database resolution
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)
DB_PATH = os.path.join(ROOT_DIR, 'academic_analytics.sqlite')
if not os.path.exists(DB_PATH):
    DB_PATH = os.path.join(BASE_DIR, 'academic_analytics.sqlite')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def get_user_from_token():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    token = auth_header[7:].strip()
    # In token payload, user email or ID is stored
    conn = get_db()
    try:
        user = conn.execute("SELECT * FROM users WHERE email = ? OR id = ?", (token, token)).fetchone()
        if user:
            return dict(user)
        # Default fallback to first student for dev testing if token exists
        user = conn.execute("SELECT * FROM users WHERE email = 'tejaditya@student.college.edu'").fetchone()
        return dict(user) if user else None
    finally:
        conn.close()

# ==========================================
# HEALTH & INFO
# ==========================================
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "backend": "Python Flask 3.x",
        "app": "AKTERA — Student Performance Analytics & Early Warning System",
        "academicYear": "2026-2027",
        "capstoneProject": "Engineering Capstone Project – 1",
        "department": "Computer Science & Engineering",
        "team": [
            {"name": "G. Akshath", "roll": "2420030512"},
            {"name": "P. TejAditya", "roll": "2420030520"},
            {"name": "I. Rajesh", "roll": "2420030684"}
        ],
        "guide": "Dr. Pratusha Mam"
    })

# ==========================================
# AUTHENTICATION
# ==========================================
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    identifier = (data.get('identifier') or data.get('rollNumber') or data.get('employeeId') or data.get('email') or '').strip()
    password = data.get('password', '')

    if not identifier or not password:
        return jsonify({"error": "Roll Number / Employee ID and password are required."}), 400

    conn = get_db()
    try:
        # Search by email, roll number, or employee ID
        clean_key = "".join(filter(str.isalnum, identifier)).lower()
        user = conn.execute("""
            SELECT u.* FROM users u
            LEFT JOIN students s ON s.user_id = u.id
            LEFT JOIN faculty f ON f.user_id = u.id
            WHERE LOWER(u.email) = ?
               OR LOWER(u.roll_number) = ?
               OR LOWER(s.roll_number) = ?
               OR LOWER(f.employee_id) = ?
               OR LOWER(REPLACE(f.employee_id, '-', '')) = ?
            LIMIT 1
        """, (identifier.lower(), identifier.lower(), identifier.lower(), identifier.lower(), clean_key)).fetchone()

        if not user and clean_key in ['admcse001', 'admin001', 'admin', 'admcse']:
            user = conn.execute("SELECT * FROM users WHERE role = 'ADMIN' LIMIT 1").fetchone()

        if not user:
            return jsonify({"error": "Invalid Roll Number, Employee ID, or email."}), 401

        incoming_hash = hash_password(password)
        is_student_default_password = user['role'] == 'STUDENT' and password.lower() == (user['roll_number'] or '').lower()
        if user['password_hash'] != incoming_hash and not is_student_default_password:
            return jsonify({"error": "Invalid password."}), 401

        user_dict = dict(user)
        student_id = None
        faculty_id = None
        fixed_emp_id = None

        if user_dict['role'] == 'STUDENT':
            s = conn.execute("SELECT id FROM students WHERE user_id = ?", (user_dict['id'],)).fetchone()
            if s:
                student_id = s['id']
        elif user_dict['role'] == 'FACULTY':
            f = conn.execute("SELECT id, employee_id FROM faculty WHERE user_id = ?", (user_dict['id'],)).fetchone()
            if f:
                faculty_id = f['id']
                fixed_emp_id = f['employee_id']
        elif user_dict['role'] == 'ADMIN':
            fixed_emp_id = 'ADM-CSE-001'

        authenticated_user = {
            "id": user_dict['id'],
            "name": user_dict['name'],
            "email": user_dict['email'],
            "role": user_dict['role'],
            "department": user_dict['department'],
            "studentId": student_id,
            "facultyId": faculty_id,
            "employeeId": fixed_emp_id,
            "rollNumber": user_dict['roll_number']
        }

        return jsonify({
            "token": user_dict['email'],
            "user": authenticated_user
        })
    finally:
        conn.close()

@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    user = get_user_from_token()
    if not user:
        return jsonify({"error": "Not authenticated"}), 401
    return jsonify(user)

# ==========================================
# STUDENT ANALYTICS & INSIGHTS
# ==========================================
@app.route('/api/student/analytics', methods=['GET'])
def student_analytics():
    conn = get_db()
    try:
        student_id = request.args.get('studentId')
        if not student_id:
            user = get_user_from_token()
            if user:
                s = conn.execute("SELECT id FROM students WHERE user_id = ?", (user['id'],)).fetchone()
                student_id = s['id'] if s else 'stu_tejaditya'
            else:
                student_id = 'stu_tejaditya'

        student = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
        if not student:
            return jsonify({"error": "Student not found"}), 404

        s_dict = dict(student)

        # Subject marks
        marks_rows = conn.execute("""
            SELECT sub.id as subject_id, sub.code, sub.name, sub.credits,
                   AVG(m.score_percentage) as avg_score,
                   att.percentage as att_pct
            FROM subjects sub
            LEFT JOIN marks m ON m.subject_id = sub.id AND m.student_id = ?
            LEFT JOIN attendance att ON att.subject_id = sub.id AND att.student_id = ?
            GROUP BY sub.id
        """, (student_id, student_id)).fetchall()

        subject_performances = []
        for row in marks_rows:
            avg_s = round(row['avg_score'] or 75.0, 1)
            att_p = round(row['att_pct'] or 85.0, 1)
            risk = 'HIGH' if avg_s < 50 or att_p < 75 else 'MEDIUM' if avg_s < 65 or att_p < 80 else 'LOW'
            subject_performances.append({
                "subjectId": row['subject_id'],
                "subjectCode": row['code'],
                "subjectName": row['name'],
                "credits": row['credits'],
                "weightedScorePercentage": avg_s,
                "attendancePercentage": att_p,
                "internalMarksObtained": round(avg_s * 0.4, 1),
                "internalMarksMax": 40,
                "riskStatus": risk,
                "historicalAverage": 72.0,
                "classAverage": 71.5,
                "trendDirection": "STABLE"
            })

        # Semesters history
        sem_rows = conn.execute("""
            SELECT sem.name as sem_name, pr.gpa, pr.credits_earned
            FROM performance_records pr
            JOIN semesters sem ON sem.id = pr.semester_id
            WHERE pr.student_id = ?
            ORDER BY sem.start_date ASC
        """, (student_id,)).fetchall()

        sem_history = [{
            "semesterId": r['sem_name'],
            "semesterName": r['sem_name'],
            "gpa": r['gpa'],
            "creditsEarned": r['credits_earned'],
            "standing": "Excellent" if r['gpa'] >= 8.5 else "Good" if r['gpa'] >= 7.0 else "Average"
        } for r in sem_rows]

        return jsonify({
            "studentId": student_id,
            "name": s_dict['name'],
            "rollNumber": s_dict['roll_number'],
            "email": s_dict['email'],
            "section": s_dict['section'],
            "batch": s_dict['batch'],
            "semesterName": "Semester 5 (Fall 2026)",
            "currentGPA": s_dict['gpa'] or 8.5,
            "cumulativeGPA": s_dict['cgpa'] or 8.6,
            "attendanceAverage": s_dict['attendance_average'] or 88.0,
            "totalCreditsEarned": s_dict['total_credits_earned'] or 96,
            "rankInSection": 3,
            "totalStudentsInSection": 68,
            "subjectPerformances": subject_performances,
            "semesterProgression": sem_history,
            "assessmentTimeline": [],
            "comparisons": {
                "gpaDelta": 0.4,
                "attendanceDelta": 1.2,
                "sectionAvgGpa": 7.42,
                "sectionAvgAttendance": 81.3
            }
        })
    finally:
        conn.close()

@app.route('/api/student/risk', methods=['GET'])
def student_risk():
    conn = get_db()
    try:
        student_id = request.args.get('studentId', 'stu_tejaditya')
        s = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
        risk_level = s['risk_level'] if s and s['risk_level'] else 'LOW'
        score = 82 if risk_level == 'HIGH' else 54 if risk_level == 'MEDIUM' else 18

        return jsonify({
            "studentId": student_id,
            "riskLevel": risk_level,
            "overallRiskScore": score,
            "confidenceScore": 0.94,
            "riskCategorySummary": f"Student performance exhibits {risk_level.lower()} risk indicators across attendance and continuous evaluation.",
            "factors": [
                {
                    "name": "Classroom Attendance",
                    "category": "ATTENDANCE",
                    "contributionPercentage": 35,
                    "status": "DANGER" if (s['attendance_average'] or 0) < 75 else "GOOD",
                    "description": f"Overall recorded attendance is {s['attendance_average'] or 88}%"
                },
                {
                    "name": "Mid-Term Examination Score",
                    "category": "ACADEMIC",
                    "contributionPercentage": 40,
                    "status": "WARNING" if (s['gpa'] or 0) < 7.0 else "GOOD",
                    "description": f"Cumulative GPA standing is {s['gpa'] or 8.5}"
                }
            ],
            "earlyWarningSignals": [
                {"signal": "Attendance compliance safety check", "severity": "HIGH" if (s['attendance_average'] or 0) < 75 else "LOW"}
            ]
        })
    finally:
        conn.close()

@app.route('/api/student/recommendations', methods=['GET'])
def student_recommendations():
    conn = get_db()
    try:
        student_id = request.args.get('studentId', 'stu_tejaditya')
        recs = conn.execute("SELECT * FROM recommendations WHERE student_id = ?", (student_id,)).fetchall()
        return jsonify([dict(r) for r in recs])
    finally:
        conn.close()

@app.route('/api/student/forecast', methods=['GET'])
def student_forecast():
    conn = get_db()
    try:
        student_id = request.args.get('studentId', 'stu_tejaditya')
        s = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
        current_gpa = s['gpa'] if s and s['gpa'] else 8.5

        return jsonify({
            "studentId": student_id,
            "projectedEndSemGPA": round(min(10.0, current_gpa + 0.15), 2),
            "projectedSGPARange": {
                "lower": max(4.0, round(current_gpa - 0.35, 2)),
                "median": round(current_gpa, 2),
                "upper": min(10.0, round(current_gpa + 0.45, 2))
            },
            "subjectForecasts": [],
            "riskTrajectory": "STABLE",
            "modelConfidence": 0.89,
            "keyDrivers": ["Consistent lab submissions", "Mid-term exam scores"]
        })
    finally:
        conn.close()

@app.route('/api/student/alerts', methods=['GET'])
def student_alerts():
    conn = get_db()
    try:
        student_id = request.args.get('studentId', 'stu_tejaditya')
        alerts = conn.execute("SELECT * FROM alerts WHERE student_id = ? ORDER BY created_at DESC", (student_id,)).fetchall()
        return jsonify([dict(a) for a in alerts])
    finally:
        conn.close()

@app.route('/api/student/what-if', methods=['POST'])
def what_if_simulation():
    data = request.get_json() or {}
    delta_att = data.get('deltaAttendancePercentage', 0)
    delta_study = data.get('deltaStudyHoursPerWeek', 0)
    delta_prep = data.get('deltaExamPreparationIndex', 0)

    # Analytical calculation model
    impact = (delta_att * 0.015) + (delta_study * 0.04) + (delta_prep * 0.08)
    baseline_gpa = 8.5
    simulated_gpa = max(3.0, min(10.0, round(baseline_gpa + impact, 2)))

    return jsonify({
        "baselineGPA": baseline_gpa,
        "simulatedGPA": simulated_gpa,
        "gpaDelta": round(simulated_gpa - baseline_gpa, 2),
        "riskLevelBefore": "LOW",
        "riskLevelAfter": "LOW" if simulated_gpa >= 7.0 else "MEDIUM",
        "narrative": f"Simulating this effort trajectory yields an estimated GPA adjustment of {round(simulated_gpa - baseline_gpa, 2):+} points."
    })

# ==========================================
# FACULTY & MENTORING DESK
# ==========================================
@app.route('/api/faculty/dashboard', methods=['GET'])
def faculty_dashboard():
    conn = get_db()
    try:
        students = conn.execute("SELECT * FROM students ORDER BY name ASC").fetchall()
        subjects = conn.execute("SELECT * FROM subjects").fetchall()
        alerts = conn.execute("SELECT * FROM alerts WHERE is_resolved = 0 LIMIT 10").fetchall()
        interventions = conn.execute("SELECT * FROM interventions ORDER BY created_at DESC LIMIT 10").fetchall()

        total = len(students)
        high_risk = sum(1 for s in students if s['risk_level'] == 'HIGH')
        med_risk = sum(1 for s in students if s['risk_level'] == 'MEDIUM')
        low_risk = sum(1 for s in students if s['risk_level'] == 'LOW')
        avg_gpa = round(sum(s['gpa'] or 0 for s in students) / max(1, total), 2)
        avg_att = round(sum(s['attendance_average'] or 0 for s in students) / max(1, total), 1)

        return jsonify({
            "summary": {
                "totalStudents": total,
                "highRiskCount": high_risk,
                "mediumRiskCount": med_risk,
                "lowRiskCount": low_risk,
                "classAverageGpa": avg_gpa,
                "classAverageAttendance": avg_att
            },
            "students": [dict(s) for s in students],
            "subjects": [dict(sub) for sub in subjects],
            "alerts": [dict(a) for a in alerts],
            "interventions": [dict(i) for i in interventions]
        })
    finally:
        conn.close()

@app.route('/api/faculty/students', methods=['GET'])
def faculty_students():
    conn = get_db()
    try:
        students = conn.execute("SELECT * FROM students ORDER BY name ASC").fetchall()
        return jsonify([dict(s) for s in students])
    finally:
        conn.close()

@app.route('/api/mentoring/my-mentor', methods=['GET'])
def my_mentor():
    conn = get_db()
    try:
        # Default student
        student_id = request.args.get('studentId', 'stu_tejaditya')
        sessions = conn.execute("SELECT * FROM mentoring_records WHERE student_id = ? ORDER BY session_date DESC", (student_id,)).fetchall()
        latest_wellness = conn.execute("SELECT * FROM student_wellness WHERE student_id = ? ORDER BY week_number DESC LIMIT 1", (student_id,)).fetchone()

        return jsonify({
            "mentor": {
                "id": "fac_guide",
                "name": "Dr. Pratusha Mam",
                "designation": "Associate Professor & Capstone Guide",
                "department": "Computer Science & Engineering",
                "specialization": "Machine Learning & Algorithms",
                "email": "guide@cse.college.edu",
                "phone": "+91 98450 22334",
                "officeLocation": "Room 412, Alan Turing Academic Block",
                "officeHours": "Monday & Thursday · 2:00 PM – 4:30 PM",
                "mentorWelcomeMessage": "Welcome to your proctorial desk! Please log your weekly reflections and schedule 1-on-1 counseling whenever you encounter academic roadblocks."
            },
            "latestWellness": dict(latest_wellness) if latest_wellness else None,
            "sessions": [dict(s) for s in sessions]
        })
    finally:
        conn.close()

@app.route('/api/mentoring/my-mentees', methods=['GET'])
def my_mentees():
    conn = get_db()
    try:
        students = conn.execute("SELECT * FROM students ORDER BY name ASC").fetchall()
        mentee_list = []
        for s in students:
            wellness = conn.execute("SELECT * FROM student_wellness WHERE student_id = ? ORDER BY week_number DESC LIMIT 1", (s['id'],)).fetchone()
            last_sess = conn.execute("SELECT * FROM mentoring_records WHERE student_id = ? ORDER BY session_date DESC LIMIT 1", (s['id'],)).fetchone()

            mentee_list.append({
                "id": s['id'],
                "name": s['name'],
                "roll_number": s['roll_number'],
                "email": s['email'],
                "section": s['section'],
                "gpa": s['gpa'],
                "attendance_average": s['attendance_average'],
                "risk_level": s['risk_level'],
                "stressLevel": wellness['stress_level'] if wellness else 3,
                "confidenceLevel": wellness['confidence_level'] if wellness else 4,
                "studyHours": wellness['study_hours_weekly'] if wellness else 18,
                "lastSessionTopic": last_sess['topic'] if last_sess else "Orientation & Target Setting",
                "lastSessionDate": last_sess['session_date'] if last_sess else "2026-08-15",
                "followUpDate": last_sess['follow_up_date'] if last_sess else None
            })

        return jsonify({
            "facultyName": "Dr. Pratusha Mam",
            "department": "Computer Science & Engineering",
            "mentees": mentee_list
        })
    finally:
        conn.close()

@app.route('/api/mentoring/wellness-checkin', methods=['POST'])
def submit_wellness():
    data = request.get_json() or {}
    conn = get_db()
    try:
        student_id = data.get('studentId', 'stu_tejaditya')
        stress = data.get('stressLevel', 3)
        confidence = data.get('confidenceLevel', 4)
        study_hours = data.get('studyHoursWeekly', 18)
        sleep_hours = data.get('sleepHoursDaily', 7)
        notes = data.get('reflectionNotes', '')

        rec_id = f"wel_{int(datetime.now().timestamp())}"
        conn.execute("""
            INSERT INTO student_wellness (id, student_id, week_number, stress_level, confidence_level, study_hours_weekly, sleep_hours_daily, reflection_notes, submitted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (rec_id, student_id, 7, stress, confidence, study_hours, sleep_hours, notes, datetime.now().isoformat()))
        conn.commit()

        return jsonify({"success": True, "message": "Wellness check-in recorded successfully!"})
    finally:
        conn.close()

@app.route('/api/mentoring/session', methods=['POST'])
def log_session():
    data = request.get_json() or {}
    conn = get_db()
    try:
        student_id = data.get('studentId')
        topic = data.get('topic', 'Proctorial Mentoring Review')
        notes = data.get('mentorNotes', '')
        action_plan = data.get('studentActionPlan', '')
        parent_informed = 1 if data.get('parentInformed') else 0
        follow_up = data.get('followUpDate')

        sess_id = f"sess_{int(datetime.now().timestamp())}"
        today_str = datetime.now().strftime('%Y-%m-%d')

        conn.execute("""
            INSERT INTO mentoring_records (id, student_id, faculty_id, session_date, topic, mentor_notes, student_action_plan, parent_informed, follow_up_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (sess_id, student_id, 'fac_guide', today_str, topic, notes, action_plan, parent_informed, follow_up, 'COMPLETED'))
        conn.commit()

        return jsonify({"success": True, "message": "Mentoring session saved!"})
    finally:
        conn.close()

# ==========================================
# ERP ACADEMIC SERVICES
# ==========================================
@app.route('/api/erp/hall-ticket/<student_id>', methods=['GET'])
def erp_hall_ticket(student_id):
    conn = get_db()
    try:
        student = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
        if not student:
            return jsonify({"error": "Student record not found"}), 404

        att = student['attendance_average'] or 85.0
        debarment_status = 'APPROVED' if att >= 75.0 else 'CONDONATION_REQUIRED' if att >= 65.0 else 'DEBARRED'
        is_eligible = (debarment_status == 'APPROVED')

        remarks = (
            "Permitted to sit for all End-Semester examinations." if is_eligible else
            "Attendance deficit (65%-74%). Condonation fee and medical certificate submission required." if debarment_status == 'CONDONATION_REQUIRED' else
            "CRITICAL DEBARMENT: Attendance strictly below statutory threshold (<65%). Repeat course required."
        )

        return jsonify({
            "institution": "Apex Institute of Technology & Engineering (Autonomous)",
            "accreditation": "Affiliated to State Technological University · NAAC A++ Accredited",
            "academicYear": "2026–2027",
            "semester": "Semester 5 (B.Tech CSE)",
            "examinationName": "End-Semester Regular Examinations — November 2026",
            "hallTicketNumber": f"HT-2026-{student['roll_number'][-6:]}",
            "studentName": student['name'],
            "rollNumber": student['roll_number'],
            "department": "Computer Science & Engineering",
            "section": student['section'],
            "examCenter": "Main Campus Examination Block B (Centrally Monitored)",
            "cumulativeAttendance": att,
            "debarmentStatus": debarment_status,
            "isEligible": is_eligible,
            "debarmentRemarks": remarks,
            "examSchedule": [
                {"code": "CS301", "subject": "Design & Analysis of Algorithms", "date": "18-Nov-2026", "time": "09:30 AM – 12:30 PM"},
                {"code": "CS302", "subject": "Database Management Systems", "date": "21-Nov-2026", "time": "09:30 AM – 12:30 PM"},
                {"code": "CS303", "subject": "Operating Systems & Concurrency", "date": "24-Nov-2026", "time": "09:30 AM – 12:30 PM"},
                {"code": "CS304", "subject": "Computer Networks & Security", "date": "27-Nov-2026", "time": "09:30 AM – 12:30 PM"},
                {"code": "CS305", "subject": "Machine Learning & Neural Nets", "date": "30-Nov-2026", "time": "09:30 AM – 12:30 PM"}
            ]
        })
    finally:
        conn.close()

@app.route('/api/erp/grade-card/<student_id>', methods=['GET'])
def erp_grade_card(student_id):
    conn = get_db()
    try:
        student = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
        if not student:
            return jsonify({"error": "Student not found"}), 404

        return jsonify({
            "institution": "Apex Institute of Technology & Engineering",
            "studentName": student['name'],
            "rollNumber": student['roll_number'],
            "degree": "Bachelor of Technology (B.Tech)",
            "branch": "Computer Science & Engineering",
            "cgpa": student['cgpa'] or 8.6,
            "totalCreditsEarned": student['total_credits_earned'] or 108,
            "evaluationScale": "10-Point Absolute Scale (UGC / AICTE Compliant)",
            "semesterHistory": [
                {"sem": "Semester 1", "credits": 22, "sgpa": 8.75, "status": "FIRST CLASS WITH DISTINCTION"},
                {"sem": "Semester 2", "credits": 22, "sgpa": 8.90, "status": "FIRST CLASS WITH DISTINCTION"},
                {"sem": "Semester 3", "credits": 24, "sgpa": 8.65, "status": "FIRST CLASS WITH DISTINCTION"},
                {"sem": "Semester 4", "credits": 24, "sgpa": 8.80, "status": "FIRST CLASS WITH DISTINCTION"},
                {"sem": "Semester 5 (Current)", "credits": 20, "sgpa": student['gpa'] or 8.5, "status": "FIRST CLASS"}
            ],
            "currentSubjects": [
                {"code": "CS301", "name": "Algorithms", "credits": 4, "weightedScorePercentage": 82.0, "riskStatus": "LOW"},
                {"code": "CS302", "name": "DBMS", "credits": 4, "weightedScorePercentage": 86.5, "riskStatus": "LOW"},
                {"code": "CS303", "name": "Operating Systems", "credits": 4, "weightedScorePercentage": 79.0, "riskStatus": "LOW"},
                {"code": "CS304", "name": "Networks", "credits": 4, "weightedScorePercentage": 84.0, "riskStatus": "LOW"},
                {"code": "CS305", "name": "Machine Learning", "credits": 4, "weightedScorePercentage": 88.0, "riskStatus": "LOW"}
            ]
        })
    finally:
        conn.close()

@app.route('/api/erp/timetable', methods=['GET'])
def erp_timetable():
    return jsonify({
        "academicYear": "2026–2027",
        "semester": "Semester 5",
        "section": "A & B",
        "timetable": [
            {
                "day": "Monday",
                "periods": [
                    {"time": "09:00 - 10:00", "code": "CS301", "subject": "Design & Analysis of Algorithms", "faculty": "Dr. Pratusha Mam", "room": "Turing-402"},
                    {"time": "10:05 - 11:05", "code": "CS302", "subject": "Database Management Systems", "faculty": "Prof. Ramanathan", "room": "Turing-402"},
                    {"time": "11:20 - 12:20", "code": "CS305", "subject": "Machine Learning Foundations", "faculty": "Dr. Pratusha Mam", "room": "Turing-402"},
                    {"time": "01:15 - 03:15", "code": "CS301L", "subject": "Algorithms Lab (Batch 1)", "faculty": "Dr. Pratusha Mam & TAs", "room": "Computing Lab 4"}
                ]
            },
            {
                "day": "Tuesday",
                "periods": [
                    {"time": "09:00 - 10:00", "code": "CS303", "subject": "Operating Systems & Concurrency", "faculty": "Dr. A. Verma", "room": "Turing-402"},
                    {"time": "10:05 - 11:05", "code": "CS304", "subject": "Computer Networks & Security", "faculty": "Prof. Mehra", "room": "Turing-402"},
                    {"time": "11:20 - 12:20", "code": "CS301", "subject": "Design & Analysis of Algorithms", "faculty": "Dr. Pratusha Mam", "room": "Turing-402"}
                ]
            },
            {
                "day": "Wednesday",
                "periods": [
                    {"time": "09:00 - 10:00", "code": "CS302", "subject": "Database Management Systems", "faculty": "Prof. Ramanathan", "room": "Turing-402"},
                    {"time": "10:05 - 11:05", "code": "CS305", "subject": "Machine Learning Foundations", "faculty": "Dr. Pratusha Mam", "room": "Turing-402"},
                    {"time": "01:15 - 03:15", "code": "CS302L", "subject": "DBMS SQL & NoSQL Lab", "faculty": "Prof. Ramanathan", "room": "Database Lab 2"}
                ]
            },
            {
                "day": "Thursday",
                "periods": [
                    {"time": "09:00 - 10:00", "code": "CS304", "subject": "Computer Networks", "faculty": "Prof. Mehra", "room": "Turing-402"},
                    {"time": "10:05 - 11:05", "code": "CS303", "subject": "Operating Systems", "faculty": "Dr. A. Verma", "room": "Turing-402"},
                    {"time": "02:00 - 04:30", "code": "MENTOR", "subject": "Official Proctorial Counseling & Office Hours", "faculty": "Dr. Pratusha Mam", "room": "Cabin 412"}
                ]
            },
            {
                "day": "Friday",
                "periods": [
                    {"time": "09:00 - 10:00", "code": "CS305", "subject": "Machine Learning Lab & Seminar", "faculty": "Dr. Pratusha Mam", "room": "AI Research Lab 1"},
                    {"time": "10:05 - 11:05", "code": "CS301", "subject": "Algorithms Tutorial & Doubt Clearing", "faculty": "Dr. Pratusha Mam", "room": "Turing-402"}
                ]
            }
        ]
    })

@app.route('/api/erp/circulars', methods=['GET'])
def erp_circulars():
    return jsonify({
        "circulars": [
            {
                "id": "circ_001",
                "title": "Semester 5 End-Term Examination Schedule & Hall Ticket Distribution",
                "date": "18-Oct-2026",
                "category": "EXAMINATIONS",
                "priority": "HIGH",
                "author": "Office of the Controller of Examinations",
                "content": "Eligible candidates with >=75% attendance can download digital Hall Tickets through the AKTERA ERP portal."
            },
            {
                "id": "circ_002",
                "title": "Mandatory Proctorial Mentoring Week & Wellness Submission",
                "date": "14-Oct-2026",
                "category": "ACADEMIC",
                "priority": "HIGH",
                "author": "Dean of Academic Affairs",
                "content": "All undergraduate scholars must meet their assigned proctors before 25-Oct-2026."
            }
        ]
    })

@app.route('/api/erp/fee-clearance/<student_id>', methods=['GET'])
def erp_fee_clearance(student_id):
    return jsonify({
        "studentId": student_id,
        "academicYear": "2026–2027",
        "semester": "Semester 5",
        "tuitionFeeStatus": "PAID & VERIFIED (INR 85,000 / 85,000)",
        "examinationFeeStatus": "CLEARED (INR 2,500)",
        "libraryDues": "NIL (Clearance Certificate Issued)",
        "hostelDues": "NOT APPLICABLE (Day Scholar)",
        "scholarshipSanctioned": "INR 35,000",
        "scholarshipCategory": "State Merit-cum-Means Technical Scholarship",
        "isFinanciallyCleared": True
    })

# ==========================================
# ADMIN COHORT ANALYTICS
# ==========================================
@app.route('/api/admin/cohort-analytics', methods=['GET'])
def admin_cohort_analytics():
    conn = get_db()
    try:
        students = conn.execute("SELECT * FROM students").fetchall()
        total = len(students)
        high = sum(1 for s in students if s['risk_level'] == 'HIGH')
        med = sum(1 for s in students if s['risk_level'] == 'MEDIUM')
        low = sum(1 for s in students if s['risk_level'] == 'LOW')

        return jsonify({
            "overview": {
                "totalEnrolled": total,
                "overallPassPercentage": 86.8,
                "cohortAverageGPA": 7.42,
                "cohortAverageAttendance": 81.3,
                "studentsAtRisk": high + med
            },
            "riskDistribution": {
                "highRisk": high,
                "mediumRisk": med,
                "lowRisk": low
            }
        })
    finally:
        conn.close()

# ==========================================
# UCI STUDENT PERFORMANCE DATASET ENDPOINTS
# ==========================================
@app.route('/api/dataset/records', methods=['GET'])
def get_dataset_records():
    conn = get_db()
    try:
        course = request.args.get('course')
        school = request.args.get('school')
        risk = request.args.get('risk')
        search = (request.args.get('search') or '').lower().strip()
        limit = int(request.args.get('limit', 25))
        page = int(request.args.get('page', 1))
        offset = (page - 1) * limit

        clauses = []
        params = []
        if course and course != 'ALL':
            clauses.append("subject_course = ?")
            params.append(course)
        if school and school != 'ALL':
            clauses.append("school = ?")
            params.append(school)
        if risk and risk != 'ALL':
            clauses.append("risk_status = ?")
            params.append(risk)
        if search:
            clauses.append("(LOWER(mjob) LIKE ? OR LOWER(fjob) LIKE ? OR LOWER(reason) LIKE ?)")
            params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])

        where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        total_row = conn.execute(f"SELECT COUNT(*) as total FROM uci_student_records {where_sql}", params).fetchone()
        total = total_row['total'] if total_row else 0

        rows = conn.execute(f"SELECT * FROM uci_student_records {where_sql} ORDER BY id ASC LIMIT ? OFFSET ?", params + [limit, offset]).fetchall()

        return jsonify({
            "records": [dict(r) for r in rows],
            "pagination": {
                "total": total,
                "page": page,
                "limit": limit,
                "totalPages": (total + limit - 1) // limit if limit else 1
            }
        })
    finally:
        conn.close()

@app.route('/api/dataset/analytics', methods=['GET'])
def get_dataset_analytics():
    conn = get_db()
    try:
        total = conn.execute("SELECT COUNT(*) as total FROM uci_student_records").fetchone()['total']
        math_count = conn.execute("SELECT COUNT(*) as count FROM uci_student_records WHERE subject_course = 'Mathematics'").fetchone()['count']
        por_count = conn.execute("SELECT COUNT(*) as count FROM uci_student_records WHERE subject_course = 'Portuguese'").fetchone()['count']
        
        avg_stats = conn.execute("""
            SELECT 
                ROUND(AVG(g1), 1) as avg_g1,
                ROUND(AVG(g2), 1) as avg_g2,
                ROUND(AVG(g3), 1) as avg_g3,
                ROUND(AVG(studytime), 1) as avg_studytime,
                ROUND(AVG(absences), 1) as avg_absences,
                ROUND(AVG(failures), 1) as avg_failures
            FROM uci_student_records
        """).fetchone()

        risk_dist = conn.execute("""
            SELECT risk_status, COUNT(*) as count, ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM uci_student_records), 1) as percentage
            FROM uci_student_records
            GROUP BY risk_status
        """).fetchall()

        study_impact = conn.execute("""
            SELECT 
                studytime, 
                COUNT(*) as student_count, 
                ROUND(AVG(g3), 1) as avg_final_grade,
                ROUND(AVG(final_score_pct), 1) as avg_score_pct
            FROM uci_student_records
            GROUP BY studytime
            ORDER BY studytime ASC
        """).fetchall()

        alcohol_impact = conn.execute("""
            SELECT 
                walc as weekend_alcohol, 
                COUNT(*) as count, 
                ROUND(AVG(g3), 1) as avg_final_grade,
                ROUND(AVG(absences), 1) as avg_absences
            FROM uci_student_records
            GROUP BY walc
            ORDER BY walc ASC
        """).fetchall()

        failure_impact = conn.execute("""
            SELECT 
                failures, 
                COUNT(*) as count, 
                ROUND(AVG(g3), 1) as avg_final_grade,
                ROUND(SUM(CASE WHEN risk_status = 'HIGH' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as high_risk_pct
            FROM uci_student_records
            GROUP BY failures
            ORDER BY failures ASC
        """).fetchall()

        return jsonify({
            "overview": {
                "totalRecords": total,
                "mathStudents": math_count,
                "portugueseStudents": por_count,
                "averageG1": avg_stats['avg_g1'] if avg_stats else 0,
                "averageG2": avg_stats['avg_g2'] if avg_stats else 0,
                "averageG3": avg_stats['avg_g3'] if avg_stats else 0,
                "averageStudyTimeLevel": avg_stats['avg_studytime'] if avg_stats else 0,
                "averageAbsences": avg_stats['avg_absences'] if avg_stats else 0,
                "averageFailures": avg_stats['avg_failures'] if avg_stats else 0
            },
            "riskDistribution": [dict(r) for r in risk_dist],
            "studyImpact": [dict(r) for r in study_impact],
            "alcoholImpact": [dict(r) for r in alcohol_impact],
            "failureImpact": [dict(r) for r in failure_impact]
        })
    finally:
        conn.close()

@app.route('/api/dataset/predict-risk', methods=['POST'])
def predict_dataset_risk():
    data = request.get_json() or {}
    g1 = float(data.get('g1', 12))
    g2 = float(data.get('g2', 12))
    studytime = float(data.get('studytime', 2))
    failures = float(data.get('failures', 0))
    absences = float(data.get('absences', 4))
    walc = float(data.get('walc', 1))
    higher = data.get('higher', 'yes')

    pred_g3 = (0.18 * g1) + (0.68 * g2) + (0.35 * studytime) - (0.95 * failures) - (0.04 * absences)
    if higher == 'yes':
        pred_g3 += 0.75
    if walc >= 4:
        pred_g3 -= 0.6

    pred_g3 = max(0.0, min(20.0, round(pred_g3, 1)))

    if pred_g3 < 10:
        risk = 'HIGH'
        recom = 'CRITICAL: High probability of academic failure (G3 < 10). Urgent counseling & remedial clinic needed.'
    elif pred_g3 <= 13:
        risk = 'MEDIUM'
        recom = 'MODERATE RISK: Borderline performance. Encourage structured study hours and peer mentoring.'
    else:
        risk = 'LOW'
        recom = 'SAFE: Solid trajectory. Support advanced problem solving and project electives.'

    return jsonify({
        "predictedG3": pred_g3,
        "predictedPercentage": round((pred_g3 / 20.0) * 100),
        "riskLevel": risk,
        "recommendation": recom
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting AKTERA Flask Server on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
