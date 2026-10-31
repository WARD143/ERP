import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function login(email: string) {
  let pwd = 'student123';
  if (email.includes('admin')) pwd = 'admin123';
  if (email.includes('guide')) pwd = 'guide123';
  if (email.includes('faculty')) pwd = 'faculty123';
  if (email.includes('parent')) pwd = 'parent123';

  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email, password: pwd })
  });
  if (!res.ok) throw new Error(`Login failed for ${email}`);
  const data = await res.json() as any;
  return data.token;
}

async function testEndpoint(name: string, token: string, endpoint: string, expectedStatus: number) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (res.status === expectedStatus) {
    console.log(`[PASS] ${name} -> ${endpoint} (Got ${res.status})`);
    return true;
  } else {
    console.error(`[FAIL] ${name} -> ${endpoint} (Expected ${expectedStatus}, Got ${res.status})`);
    if (res.status !== 401 && res.status !== 403) {
      console.error(await res.text());
    }
    return false;
  }
}

async function runTests() {
  console.log('--- STARTING API AUTHORIZATION TESTS ---');
  let allPass = true;

  try {
    const adminToken = await login('admin@cse.college.edu');
    const facultyToken = await login('guide@cse.college.edu');
    const student1Token = await login('tejaditya@student.college.edu'); // student_id: stu_tejaditya
    const student2Token = await login('akshath@student.college.edu'); // student_id: stu_akshath
    const parentToken = await login('parent.tejaditya@example.com'); // link: stu_tejaditya

    // 1. ADMIN -> Faculty routes
    // Should be allowed (200)
    allPass = await testEndpoint('ADMIN on Faculty Dashboard', adminToken, '/api/faculty/dashboard', 200) && allPass;
    allPass = await testEndpoint('ADMIN on Faculty Students', adminToken, '/api/faculty/students', 200) && allPass;

    // 2. FACULTY -> Faculty routes (Assigned student)
    // Roll number 2420030520 is Tejaditya, assigned to guide
    allPass = await testEndpoint('FACULTY on Faculty Dashboard', facultyToken, '/api/faculty/dashboard', 200) && allPass;
    allPass = await testEndpoint('FACULTY on assigned student', facultyToken, '/api/faculty/student-profile/2420030520', 200) && allPass;

    // 3. FACULTY -> Unassigned student
    // Unassigned student roll number: 2420030512 (Akshath) or similar. Let's see if 403 is returned.
    allPass = await testEndpoint('FACULTY on unassigned student', facultyToken, '/api/faculty/student-profile/2420030512', 403) && allPass;

    // 4. PARENT -> Another student's profile
    // Parent of Tejaditya tries to access Akshath
    allPass = await testEndpoint('PARENT on unlinked student (analytics API)', parentToken, '/api/students/stu_akshath/analytics', 403) && allPass;

    // 5. STUDENT -> Another student's profile
    allPass = await testEndpoint('STUDENT on another student', student1Token, '/api/students/stu_akshath/analytics', 403) && allPass;

  } catch (err) {
    console.error('Test script error:', err);
    allPass = false;
  }

  if (allPass) {
    console.log('--- ALL AUTHORIZATION TESTS PASSED ---');
  } else {
    console.log('--- SOME AUTHORIZATION TESTS FAILED ---');
  }
}

runTests();
