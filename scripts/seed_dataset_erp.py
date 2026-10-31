import sqlite3
import random

def seed_all_dataset():
    conn = sqlite3.connect('academic_analytics.sqlite')
    cursor = conn.cursor()
    cursor.execute('SELECT id, roll_number, name FROM students WHERE id LIKE "stu_s%" LIMIT 200')
    dataset_students = cursor.fetchall()
    print(f'Populating ERP tables for {len(dataset_students)} dataset students...')

    for stuid, roll, name in dataset_students:
        # 1. Course Registration
        for i, sub_id in enumerate(['sub_cs301', 'sub_cs302', 'sub_cs303', 'sub_cs304', 'sub_cs305']):
            cursor.execute('INSERT OR REPLACE INTO course_registrations VALUES (?, ?, ?, "REGULAR", "2026-2027", "Semester VI", "APPROVED", CURRENT_TIMESTAMP)', (f'reg_{stuid}_{i+1}', stuid, sub_id))

        # 2. Fee Payments
        cursor.execute('INSERT OR REPLACE INTO fee_payments VALUES (?, ?, "Tuition Fee (Semester VI)", 115000, "ONLINE_UPI", ?, "PAID", ?, CURRENT_TIMESTAMP)',
                       (f'fp_{stuid}_1', stuid, f'UPI-{random.randint(10000000, 99999999)}', f'REC-2026-{roll}-01'))
        cursor.execute('INSERT OR REPLACE INTO fee_payments VALUES (?, ?, "End Semester Examination Fee", 2800, "NET_BANKING", ?, "PAID", ?, CURRENT_TIMESTAMP)',
                       (f'fp_{stuid}_2', stuid, f'NB-{random.randint(10000000, 99999999)}', f'REC-2026-{roll}-02'))

        # 3. Hostel Allocation
        cursor.execute('INSERT OR REPLACE INTO hostel_allocations VALUES (?, ?, "Aryabhata International Hostel", "B-304", "Bed-A", "2-SHARING-AC", "Mr. R. K. Sharma", "+91 98480 12345", "CLEARED")',
                       (f'hst_{stuid}', stuid))

        # 4. Library Transaction
        cursor.execute('INSERT OR REPLACE INTO library_transactions VALUES (?, ?, "bk_1", "2026-10-10", "2026-11-10", NULL, 0, "ISSUED")',
                       (f'lt_{stuid}', stuid))

        # 5. NoDue Clearance
        cursor.execute('INSERT OR REPLACE INTO no_due_clearance VALUES (?, ?, "CLEARED", "CLEARED", "CLEARED", "CLEARED", "CLEARED", "APPROVED", "All library books returned and accounts cleared.", CURRENT_TIMESTAMP)',
                       (f'nd_{stuid}', stuid))

        # 6. CRT Training
        cursor.execute('INSERT OR REPLACE INTO crt_training VALUES (?, ?, "CODING", "Dynamic Programming and Data Structures", 84.0, 100, "COMPLETED", "2026-10-24", 18)',
                       (f'crt_{stuid}_1', stuid))

        # 7. Document Requests
        cursor.execute('INSERT OR REPLACE INTO document_requests VALUES (?, ?, "BONAFIDE", "Internship Onboarding Verification", 1, "READY_FOR_PICKUP", ?, "2026-11-03", CURRENT_TIMESTAMP)',
                       (f'doc_{stuid}', stuid, f'DOC-2026-{roll}'))

        # 8. Career Preferences
        cursor.execute('INSERT OR REPLACE INTO career_preferences VALUES (?, ?, "Cloud and Full Stack Engineering", "AI Systems", "Software Engineer", "Hyderabad / Bengaluru", "Higher Studies / Industry", 82.0, "Active coder; recommended to strengthen cloud certifications.", CURRENT_TIMESTAMP)',
                       (f'cp_{stuid}', stuid))

    conn.commit()
    print('Successfully primed all dataset students with complete KL ERP records!')

if __name__ == '__main__':
    seed_all_dataset()

