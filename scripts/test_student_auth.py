import urllib.request
import json
import sys

BASE = 'http://localhost:3000'

def login(identifier, password):
    data = json.dumps({'identifier': identifier, 'password': password}).encode('utf-8')
    req = urllib.request.Request(f'{BASE}/api/auth/login', data=data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def get_overview(token):
    req = urllib.request.Request(f'{BASE}/api/students/overview', headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def change_pw(token, curr_pw, new_pw):
    data = json.dumps({'currentPassword': curr_pw, 'newPassword': new_pw, 'confirmPassword': new_pw}).encode('utf-8')
    req = urllib.request.Request(f'{BASE}/api/auth/change-password', data=data, headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def get_other_student_analytics(token, other_id):
    try:
        req = urllib.request.Request(f'{BASE}/api/students/{other_id}/analytics', headers={'Authorization': f'Bearer {token}'})
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')

print('--- Test 1: Test Login with 3 Distinct Student Roll Numbers ---')
test_rolls = ['2420030533', '2420030520', '2420030512']

tokens = {}
for roll in test_rolls:
    res = login(roll, roll)
    user = res['user']
    token = res['token']
    tokens[roll] = (token, user)
    print(f"Logged in Roll: {roll} -> Name: {user['name']}, ID: {user['studentId']}, mustChangePassword: {user.get('mustChangePassword')}")
    assert user['rollNumber'] == roll, f"Mismatch roll {roll}"

print('\n--- Test 2: Verify Isolated Academic Data per Student ---')
for roll, (token, user) in tokens.items():
    ov = get_overview(token)
    ana = ov['analytics']
    risk = ov['risk']
    print(f"Student: {ana['name']} ({ana['rollNumber']}) -> GPA: {ana.get('currentGpa')}, Attendance: {ana.get('attendanceAverage')}%, Risk: {risk['riskLevel']} ({risk['overallRiskScore']})")
    assert ana['rollNumber'] == roll, f"Data mismatch for {roll}"

print('\n--- Test 3: IDOR Security Check: Student Cannot Access Another Student Record ---')
t_rahul = tokens['2420030533'][0]
status_code, err_body = get_other_student_analytics(t_rahul, 'stu_tejaditya')
print(f"Student 2420030533 attempting to access stu_tejaditya -> Status: {status_code}")
assert status_code == 403, f"Expected 403 Forbidden, got {status_code}"

print('\n--- Test 4: First-Login Password Change Flow ---')
res_ch = change_pw(t_rahul, '2420030533', 'SecurePass2026!')
print('Password change response:', res_ch)
assert res_ch.get('success') == True

# Old roll number password must now FAIL
try:
    login('2420030533', '2420030533')
    print('ERROR: Old initial password still worked!')
    sys.exit(1)
except urllib.error.HTTPError as e:
    print(f'Verified: Old initial password rejected with HTTP {e.code}')

# New password must SUCCEED with mustChangePassword = False
res_new = login('2420030533', 'SecurePass2026!')
print(f"New password login SUCCESS -> mustChangePassword: {res_new['user'].get('mustChangePassword')}")
assert res_new['user'].get('mustChangePassword') == False

print('\n--- Test 5: Verify Faculty and Admin logins still work cleanly ---')
f_res = login('EMP-CSE-042', 'guide123')
print('Faculty Login:', f_res['user']['name'], '| Role:', f_res['user']['role'])
a_res = login('admin@cse.college.edu', 'admin123')
print('Admin Login:', a_res['user']['name'], '| Role:', a_res['user']['role'])

print('\n=== ALL 5 AUTOMATED VERIFICATION CHECKS PASSED ===')
