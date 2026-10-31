import { Router, Request, Response } from 'express';
import { query, queryOne } from '../../db/database.js';
import { hashPassword, seedDatabase } from '../../db/seed.js';
import { generateToken, authenticateToken, AuthenticatedRequest, requireRole } from '../auth.js';
import { evaluateAllStudentsRisk } from '../riskEngine.js';

export const authRouter = Router();

authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, identifier, rollNumber, employeeId, password } = req.body;
  const loginKey = (identifier || rollNumber || employeeId || email || '').trim();

  if (!loginKey || !password) {
    return res.status(400).json({ error: 'Roll Number / Employee ID and password are required.' });
  }

  // 1. Try finding by email
  let user = await queryOne('SELECT * FROM users WHERE LOWER(email) = ?', [loginKey.toLowerCase()]);

  // 2. Try finding student by roll_number in users or students table
  if (!user) {
    user = await queryOne(`
      SELECT u.* FROM users u 
      LEFT JOIN students s ON s.user_id = u.id
      WHERE LOWER(u.roll_number) = ? 
         OR LOWER(s.roll_number) = ?
      LIMIT 1
    `, [loginKey.toLowerCase(), loginKey.toLowerCase()]);
  }

  // 3. Try finding faculty by employee_id (e.g. EMP-CSE-042 or EMP042)
  if (!user) {
    const cleanKey = loginKey.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    user = await queryOne(`
      SELECT u.* FROM users u
      JOIN faculty f ON f.user_id = u.id
      WHERE LOWER(f.employee_id) = ?
         OR LOWER(REPLACE(f.employee_id, '-', '')) = ?
      LIMIT 1
    `, [loginKey.toLowerCase(), cleanKey]);
  }

  // 4. Try finding administrator by employee ID (e.g. ADM-CSE-001, ADMIN-001, or 'admin')
  if (!user) {
    const cleanKey = loginKey.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (['admcse001', 'admin001', 'empadm001', 'admin', 'admcse'].includes(cleanKey)) {
      user = await queryOne("SELECT * FROM users WHERE role = 'ADMIN' LIMIT 1");
    }
  }

  if (!user) {
    return res.status(401).json({ error: 'Invalid Roll Number, Employee ID, or password.' });
  }

  const incomingHash = hashPassword(password);
  const isStudentDefaultPassword = user.role === 'STUDENT' && password.toLowerCase() === (user.roll_number || '').toLowerCase();
  
  if (user.password_hash !== incomingHash && !isStudentDefaultPassword) {
    return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
  }

  let studentId: string | undefined;
  let facultyId: string | undefined;
  let parentId: string | undefined;
  let fixedEmployeeId: string | undefined;

  if (user.role === 'STUDENT') {
    const stu = await queryOne('SELECT id, roll_number FROM students WHERE user_id = ?', [user.id]);
    studentId = stu?.id;
  } else if (user.role === 'FACULTY') {
    const fac = await queryOne('SELECT id, employee_id FROM faculty WHERE user_id = ?', [user.id]);
    facultyId = fac?.id;
    fixedEmployeeId = fac?.employee_id;
  } else if (user.role === 'ADMIN') {
    fixedEmployeeId = 'ADM-CSE-001';
  } else if (user.role === 'PARENT') {
    const par = await queryOne('SELECT id FROM parents WHERE user_id = ?', [user.id]);
    parentId = par?.id;
  }

  const authenticatedUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    department: user.department,
    studentId,
    facultyId,
    parentId,
    employeeId: fixedEmployeeId,
    rollNumber: user.roll_number
  };

  const token = generateToken(authenticatedUser);
  return res.json({
    token,
    user: authenticatedUser
  });
});

authRouter.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ user: req.user });
});

// Demo accounts endpoint for rapid evaluation and grading demonstration
authRouter.get('/demo-accounts', async (_req: Request, res: Response) => {
  const accounts = [
    {
      role: 'STUDENT',
      name: 'P. TejAditya (High Performer)',
      email: 'tejaditya@student.college.edu',
      password: 'student123',
      rollNumber: '2420030520',
      description: 'Top academic score (GPA ~9.6), 95% attendance, consistent top grades across all subjects.'
    },
    {
      role: 'STUDENT',
      name: 'G. Akshath (Improving Student)',
      email: 'akshath@student.college.edu',
      password: 'student123',
      rollNumber: '2420030512',
      description: 'Upward trajectory (62% in IA-1 to 84% in Mid-Term), positive slope, improving status.'
    },
    {
      role: 'STUDENT',
      name: 'I. Rajesh (Declining Student)',
      email: 'rajesh@student.college.edu',
      password: 'student123',
      rollNumber: '2420030684',
      description: 'High risk early warning: marks dropped from 84% to 52%, subject weakness in CS304.'
    },
    {
      role: 'STUDENT',
      name: 'Rahul Verma (Low Attendance)',
      email: 'rahul@student.college.edu',
      password: 'student123',
      rollNumber: '2420030533',
      description: 'Attendance crisis: 59% cumulative attendance (below statutory 75% limit).'
    },
    {
      role: 'STUDENT',
      name: 'Ananya Sharma (Inconsistent Assessments)',
      email: 'ananya@student.college.edu',
      password: 'student123',
      rollNumber: '2420030545',
      description: 'Assessment volatility: swings between 92% and 46%, high variance alert.'
    },
    {
      role: 'STUDENT',
      name: 'Vikram Reddy (Urgent Intervention)',
      email: 'vikram@student.college.edu',
      password: 'student123',
      rollNumber: '2420030556',
      description: 'Critical early warning: 46% average marks, 63% attendance, multiple missed assignments.'
    },
    {
      role: 'FACULTY',
      name: 'Dr. Pratusha Mam (Capstone Guide)',
      email: 'guide@cse.college.edu',
      password: 'guide123',
      employeeId: 'EMP-CSE-042',
      description: 'Faculty mentor & guide: teaches CS301 & CS305, oversees student risk interventions.'
    },
    {
      role: 'FACULTY',
      name: 'Prof. K. Ramanathan (Faculty)',
      email: 'ramanathan@cse.college.edu',
      password: 'faculty123',
      employeeId: 'EMP-CSE-058',
      description: 'Faculty view for CS302 (DBMS) & CS303 (Operating Systems).'
    },
    {
      role: 'ADMIN',
      name: 'Dr. S. K. Murthy (Dean & Analytics Head)',
      email: 'admin@cse.college.edu',
      password: 'admin123',
      employeeId: 'ADM-CSE-001',
      description: 'Administrator: overall cohort analytics, risk thresholds, data management, CSV imports.'
    }
  ];
  return res.json({ accounts });
});

// Database Seed / Reset
authRouter.post('/seed-reset', authenticateToken, requireRole(['ADMIN']), async (_req: Request, res: Response) => {
  try {
    await seedDatabase(true);
    await evaluateAllStudentsRisk();
    return res.json({ success: true, message: 'Database reset to clean baseline and risk engine re-evaluated.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to reset database: ' + err.message });
  }
});
