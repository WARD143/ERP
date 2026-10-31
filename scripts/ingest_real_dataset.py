import sqlite3
import pandas as pd
import hashlib

def ingest_dataset():
    conn = sqlite3.connect('academic_analytics.sqlite')
    cursor = conn.cursor()

    def hash_pw(pwd):
        return hashlib.sha256(pwd.encode('utf-8')).hexdigest()

    df = pd.read_csv('student_exam_scores.csv')
    print(f'Ingesting {len(df)} students from dataset...')

    subjects = [
        ('sub_cs301', 'CS301'),
        ('sub_cs302', 'CS302'),
        ('sub_cs303', 'CS303'),
        ('sub_cs304', 'CS304'),
        ('sub_cs305', 'CS305')
    ]

    for idx, row in df.iterrows():
        sid = str(row['student_id']).strip()
        hours = float(row['hours_studied'])
        sleep = float(row['sleep_hours'])
        att = float(row['attendance_percent'])
        prev = float(row['previous_scores'])
        score = float(row['exam_score'])
        
        roll = sid
        name = f'Student {sid}'
        email = f'{sid.lower()}@student.college.edu'
        uid = f'user_{sid.lower()}'
        stuid = f'stu_{sid.lower()}'
        
        pw_hash = hash_pw('student123')
        
        # 1. Users
        cursor.execute('''
            INSERT OR REPLACE INTO users (id, email, password_hash, role, name, roll_number, department, phone)
            VALUES (?, ?, ?, 'STUDENT', ?, ?, 'Computer Science & Engineering', '+91 98765 43210')
        ''', (uid, email, pw_hash, name, roll))
        
        # 2. Students
        cursor.execute('''
            INSERT OR REPLACE INTO students (id, user_id, roll_number, name, section, batch, current_semester_id, mentor_faculty_id)
            VALUES (?, ?, ?, ?, 'A', '2024-2028', 'sem_5', 'fac_guide')
        ''', (stuid, uid, roll, name))
        
        # 3. Attendance & Marks for 5 subjects
        for sub_id, code in subjects:
            total_cls = 40
            att_cls = int(round((att / 100.0) * total_cls))
            att_id = f'att_{stuid}_{sub_id}'
            cursor.execute('''
                INSERT OR REPLACE INTO attendance (id, student_id, subject_id, total_classes, attended_classes, percentage)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (att_id, stuid, sub_id, total_cls, att_cls, att))
            
            ia1_val = round((prev / 100.0) * 30.0, 1)
            mid_val = round(score, 1)
            ia2_val = round(((prev * 0.4 + score * 0.6) / 50.0) * 15.0, 1)
            asg1_val = round((att / 100.0) * 18.0, 1)
            asg2_val = round((score / 50.0) * 19.0, 1)
            
            marks_data = [
                (f'm_{stuid}_{sub_id}_ia1', stuid, f'as_{sub_id}_ia1', ia1_val, 30.0),
                (f'm_{stuid}_{sub_id}_ia2', stuid, f'as_{sub_id}_ia2', ia2_val, 30.0),
                (f'm_{stuid}_{sub_id}_mid', stuid, f'as_{sub_id}_mid', mid_val, 50.0),
                (f'm_{stuid}_{sub_id}_asg1', stuid, f'as_{sub_id}_asg1', asg1_val, 20.0),
                (f'm_{stuid}_{sub_id}_asg2', stuid, f'as_{sub_id}_asg2', asg2_val, 20.0),
            ]
            for m_id, s_id, a_id, m_obt, m_max in marks_data:
                cursor.execute('''
                    INSERT OR REPLACE INTO marks (id, student_id, assessment_id, marks_obtained, max_marks, is_absent)
                    VALUES (?, ?, ?, ?, ?, 0)
                ''', (m_id, s_id, a_id, m_obt, m_max))

    conn.commit()
    print('Dataset students successfully inserted into database!')

if __name__ == '__main__':
    ingest_dataset()
