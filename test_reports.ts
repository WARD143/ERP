import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function login(email: string) {
  let pwd = 'student123';
  if (email.includes('admin')) pwd = 'admin123';
  if (email.includes('guide')) pwd = 'guide123';

  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email, password: pwd })
  });
  if (!res.ok) throw new Error(`Login failed for ${email}`);
  const data = await res.json() as any;
  return data.token;
}

async function runTest() {
  const adminToken = await login('admin@cse.college.edu');
  const facultyToken = await login('guide@cse.college.edu');

  // Test 360
  let res = await fetch(`${BASE_URL}/api/faculty/students/stu_tejaditya/360`, {
    headers: { 'Authorization': `Bearer ${facultyToken}` }
  });
  console.log('360 Status:', res.status);
  
  // Test At-Risk
  res = await fetch(`${BASE_URL}/api/reports/at-risk`, {
    headers: { 'Authorization': `Bearer ${facultyToken}` }
  });
  console.log('At-Risk Status:', res.status);

  // Test Cohort
  res = await fetch(`${BASE_URL}/api/reports/cohort`, {
    headers: { 'Authorization': `Bearer ${facultyToken}` }
  });
  console.log('Cohort Status:', res.status);
  
  // Test Interventions
  res = await fetch(`${BASE_URL}/api/faculty/students/stu_tejaditya/interventions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${facultyToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ issue_type: 'Attendance', priority: 'High', notes: 'Missed 3 days', action_plan: 'Call parents', follow_up_date: '2026-10-10' })
  });
  console.log('Intervention POST Status:', res.status);
  
  const invData = await res.json() as any;
  if (invData.caseId) {
    res = await fetch(`${BASE_URL}/api/faculty/interventions/${invData.caseId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${facultyToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Resolved' })
    });
    console.log('Intervention PATCH Status:', res.status);
  }
}

runTest().catch(console.error);
