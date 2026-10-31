import sqlite3
import random

def seed():
    conn = sqlite3.connect('academic_analytics.sqlite')
    cursor = conn.cursor()

    cursor.execute('SELECT id, roll_number, name FROM students LIMIT 50')
    students = cursor.fetchall()

    # 1. Course Materials Seed
    materials = [
        ('mat_1', 'sub_cs301', 'Unit 1: Advanced Graph Algorithms and Flow Networks', 'HANDOUT', '/materials/cs301_u1.pdf', 1),
        ('mat_2', 'sub_cs301', 'Complete Course Syllabus and Lecture Schedule', 'SYLLABUS', '/materials/cs301_syllabus.pdf', 1),
        ('mat_3', 'sub_cs302', 'Unit 2: Relational Query Optimization and Indexing', 'NOTES', '/materials/cs302_u2.pdf', 2),
        ('mat_4', 'sub_cs303', 'Unit 3: Real-Time Scheduling and Synchronization Primitives', 'SLIDES', '/materials/cs303_u3.pptx', 3),
        ('mat_5', 'sub_cs304', 'Question Bank and Previous Year Semester Papers', 'QUESTION_BANK', '/materials/cs304_qb.pdf', 4),
        ('mat_6', 'sub_cs305', 'Unit 4: Deep Learning Foundations and Backpropagation', 'HANDOUT', '/materials/cs305_u4.pdf', 4),
    ]
    for m in materials:
        cursor.execute('INSERT OR REPLACE INTO course_materials VALUES (?, ?, ?, ?, ?, ?, "fac_guide", CURRENT_TIMESTAMP)', m)

    # 2. Clubs Seed
    clubs = [
        ('club_coding', 'KL Coding and Algorithms Club (K-CODE)', 'TECHNICAL', 'Dr. Pratusha Mam', 'Competitive programming, algorithmic problem solving and global hackathons.', 'Code'),
        ('club_ai', 'AI and Machine Learning Innovators (AIMLI)', 'TECHNICAL', 'Prof. Ramanathan', 'Applied machine learning, generative models, robotics and research projects.', 'Cpu'),
        ('club_robotics', 'Robotics and Embedded Systems Guild', 'INNOVATION', 'Dr. A. V. Suresh', 'Drone technology, IoT devices, microcontrollers and automation.', 'Bot'),
        ('club_sil', 'Student Social and Environmental Initiative (SIL)', 'COMMUNITY', 'Dr. S. K. Murthy', 'Rural upliftment, social service, sustainable campus initiatives.', 'Heart'),
        ('club_cultural', 'Vachas Dramatic and Literary Society', 'CULTURAL', 'Dean Student Affairs', 'Stage plays, debates, public speaking and university fest organization.', 'Mic')
    ]
    for c in clubs:
        cursor.execute('INSERT OR REPLACE INTO clubs VALUES (?, ?, ?, ?, ?, ?)', c)

    # 3. Club Events Seed
    events = [
        ('evt_1', 'club_coding', 'Hack-A-League 2026: 24hr Campus Hackathon', '2026-11-12', 'Main Auditorium and Turing Labs', 30, 240),
        ('evt_2', 'club_ai', 'Generative AI and Agentic Systems Bootcamp', '2026-11-15', 'CSE Seminar Hall 2', 20, 180),
        ('evt_3', 'club_sil', 'Community Green Drive and Village School Mentorship', '2026-11-22', 'Adopted Village, Guntur', 40, 95)
    ]
    for e in events:
        cursor.execute('INSERT OR REPLACE INTO club_events VALUES (?, ?, ?, ?, ?, ?, ?)', e)

    # 4. Library Books Seed
    books = [
        ('bk_1', '978-0262033848', 'Introduction to Algorithms (4th Edition)', 'Thomas H. Cormen et al.', 'Algorithms', 15, 12),
        ('bk_2', '978-0133594140', 'Operating Systems: Internals and Design Principles', 'William Stallings', 'Systems', 12, 9),
        ('bk_3', '978-0078022159', 'Database System Concepts (7th Edition)', 'Silberschatz, Korth, Sudarshan', 'Database', 20, 16),
        ('bk_4', '978-0136079675', 'Data Communications and Networking', 'Behrouz A. Forouzan', 'Networks', 14, 11),
        ('bk_5', '978-0262035613', 'Deep Learning (Adaptive Computation and ML)', 'Ian Goodfellow, Yoshua Bengio', 'AI and ML', 10, 7)
    ]
    for b in books:
        cursor.execute('INSERT OR REPLACE INTO library_books VALUES (?, ?, ?, ?, ?, ?, ?)', b)

    # 5. Fee Structure Seed
    fees = [
        ('fee_tui', 'Tuition Fee (Semester VI)', 'Standard Academic Core Semester Tuition', 115000, 'Semester VI', '2026-11-30'),
        ('fee_exam', 'End Semester Examination Fee', 'Regular Theory and Practical Exam Evaluation', 2800, 'Semester VI', '2026-11-10'),
        ('fee_crt', 'CRT and Placement Training Fee', 'Campus Recruitment Training and Soft Skills', 12500, 'Semester VI', '2026-11-15'),
        ('fee_erp', 'ERP / SAP Cloud Access Fee', 'University Cloud Portal and Digital Transcripts', 1500, 'Semester VI', '2026-11-15'),
        ('fee_sports', 'Sports and Student Activity Fee', 'Campus Gymnasium, Indoor and Outdoor Facilities', 1200, 'Semester VI', '2026-11-15'),
        ('fee_coursera', 'Coursera University Consortium License', 'Unlimited Industry Certifications Subscription', 3500, 'Semester VI', '2026-11-15'),
        ('fee_sil', 'Skill Development and SIL Fee', 'Social Internship and Lab Practical Credits', 2000, 'Semester VI', '2026-11-15')
    ]
    for f in fees:
        cursor.execute('INSERT OR REPLACE INTO fee_structures VALUES (?, ?, ?, ?, ?, ?)', f)

    # Seed student-specific ERP data
    for stuid, roll, name in students:
        # Course registrations
        cursor.execute('INSERT OR REPLACE INTO course_registrations VALUES (?, ?, "sub_cs301", "REGULAR", "2026-2027", "Semester VI", "APPROVED", CURRENT_TIMESTAMP)', (f'reg_{stuid}_1', stuid))
        cursor.execute('INSERT OR REPLACE INTO course_registrations VALUES (?, ?, "sub_cs302", "REGULAR", "2026-2027", "Semester VI", "APPROVED", CURRENT_TIMESTAMP)', (f'reg_{stuid}_2', stuid))
        cursor.execute('INSERT OR REPLACE INTO course_registrations VALUES (?, ?, "sub_cs303", "REGULAR", "2026-2027", "Semester VI", "APPROVED", CURRENT_TIMESTAMP)', (f'reg_{stuid}_3', stuid))
        cursor.execute('INSERT OR REPLACE INTO course_registrations VALUES (?, ?, "sub_cs304", "REGULAR", "2026-2027", "Semester VI", "APPROVED", CURRENT_TIMESTAMP)', (f'reg_{stuid}_4', stuid))
        cursor.execute('INSERT OR REPLACE INTO course_registrations VALUES (?, ?, "sub_cs305", "REGULAR", "2026-2027", "Semester VI", "APPROVED", CURRENT_TIMESTAMP)', (f'reg_{stuid}_5', stuid))

        # Fee payments
        cursor.execute('INSERT OR REPLACE INTO fee_payments VALUES (?, ?, "Tuition Fee (Semester VI)", 115000, "ONLINE_UPI", ?, "PAID", ?, CURRENT_TIMESTAMP)',
                       (f'fp_{stuid}_1', stuid, f'UPI-{random.randint(10000000, 99999999)}', f'REC-2026-{roll}-01'))
        cursor.execute('INSERT OR REPLACE INTO fee_payments VALUES (?, ?, "End Semester Examination Fee", 2800, "NET_BANKING", ?, "PAID", ?, CURRENT_TIMESTAMP)',
                       (f'fp_{stuid}_2', stuid, f'NB-{random.randint(10000000, 99999999)}', f'REC-2026-{roll}-02'))
        cursor.execute('INSERT OR REPLACE INTO fee_payments VALUES (?, ?, "ERP / SAP Cloud Access Fee", 1500, "ONLINE_UPI", ?, "PAID", ?, CURRENT_TIMESTAMP)',
                       (f'fp_{stuid}_3', stuid, f'UPI-{random.randint(10000000, 99999999)}', f'REC-2026-{roll}-03'))

        # Hostel allocation
        cursor.execute('INSERT OR REPLACE INTO hostel_allocations VALUES (?, ?, "Aryabhata International Hostel", "B-304", "Bed-A", "2-SHARING-AC", "Mr. R. K. Sharma", "+91 98480 12345", "CLEARED")',
                       (f'hst_{stuid}', stuid))

        # Library transaction
        cursor.execute('INSERT OR REPLACE INTO library_transactions VALUES (?, ?, "bk_1", "2026-10-10", "2026-11-10", NULL, 0, "ISSUED")',
                       (f'lt_{stuid}', stuid))

        # NoDue Clearance
        cursor.execute('INSERT OR REPLACE INTO no_due_clearance VALUES (?, ?, "CLEARED", "CLEARED", "CLEARED", "CLEARED", "CLEARED", "APPROVED", "All library books returned and accounts cleared.", CURRENT_TIMESTAMP)',
                       (f'nd_{stuid}', stuid))

        # CRT Record
        cursor.execute('INSERT OR REPLACE INTO crt_training VALUES (?, ?, "CODING", "Dynamic Programming and Graph Problems", 88.5, 100, "COMPLETED", "2026-10-24", 14)',
                       (f'crt_{stuid}_1', stuid))
        cursor.execute('INSERT OR REPLACE INTO crt_training VALUES (?, ?, "APTITUDE", "Quantitative Aptitude and Logical Reasoning Mock 4", 92.0, 100, "COMPLETED", "2026-10-28", 9)',
                       (f'crt_{stuid}_2', stuid))

        # Career Preferences
        cursor.execute('INSERT OR REPLACE INTO career_preferences VALUES (?, ?, "Full Stack and Distributed Systems", "Artificial Intelligence / MLOps", "Software Development Engineer (SDE-1)", "Bengaluru / Hyderabad", "MS in CS (Fall 2027)", 86.5, "Strong algorithmic foundation; recommended to practice system design and participate in open-source hackathons.", CURRENT_TIMESTAMP)',
                       (f'cp_{stuid}', stuid))

        # Psychometric Assessment
        cursor.execute('INSERT OR REPLACE INTO psychometric_assessments VALUES (?, ?, "PERSONALITY", 91.0, "Analytical Architect (INTJ-A)", "Demonstrates high strategic planning, logical structuring and systematic problem breakdown skills.", "SDE, Cloud Solutions Architect, Systems Researcher", CURRENT_TIMESTAMP)',
                       (f'psy_{stuid}', stuid))

        # Document Request
        cursor.execute('INSERT OR REPLACE INTO document_requests VALUES (?, ?, "BONAFIDE", "Visa Application and Internship Verification", 2, "READY_FOR_PICKUP", ?, "2026-11-03", CURRENT_TIMESTAMP)',
                       (f'doc_{stuid}', stuid, f'DOC-2026-{roll}'))

        # Club membership
        cursor.execute('INSERT OR REPLACE INTO club_memberships VALUES (?, ?, "club_coding", "CORE_LEAD", 45, "2025-08-15")',
                       (f'cm_{stuid}', stuid))

    conn.commit()
    print(f'Successfully primed KL ERP database records for {len(students)} students!')

if __name__ == '__main__':
    seed()
