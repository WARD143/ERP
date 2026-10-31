import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { queryOne } from '../db/database.js';
import { hashPassword } from '../db/seed.js';

const JWT_SECRET = process.env.AUTH_SECRET || 'edupulse_academic_secret_jwt_2026';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'STUDENT' | 'FACULTY' | 'ADMIN' | 'PARENT';
  name: string;
  department: string;
  studentId?: string;
  facultyId?: string;
  parentId?: string;
  rollNumber?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function generateToken(user: AuthenticatedUser): string {
  const payload = JSON.stringify({
    id: user.id,
    email: user.email,
    role: user.role,
    studentId: user.studentId,
    facultyId: user.facultyId,
    parentId: user.parentId,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  const hmac = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
  return Buffer.from(payload).toString('base64url') + '.' + hmac;
}

export function verifyToken(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const payloadStr = Buffer.from(parts[0], 'base64url').toString('utf8');
    const expectedHmac = crypto.createHmac('sha256', JWT_SECRET).update(payloadStr).digest('hex');

    if (crypto.timingSafeEqual(Buffer.from(parts[1]), Buffer.from(expectedHmac))) {
      const payload = JSON.parse(payloadStr);
      if (payload.exp && payload.exp < Date.now()) return null;
      return payload;
    }
    return null;
  } catch (err) {
    return null;
  }
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }

  // Fetch fresh user record
  const user = await queryOne('SELECT id, email, role, name, department, roll_number FROM users WHERE id = ?', [payload.id]);
  if (!user) {
    return res.status(401).json({ error: 'User account not found.' });
  }

  let studentId: string | undefined;
  let facultyId: string | undefined;
  let parentId: string | undefined;

  if (user.role === 'STUDENT') {
    const stu = await queryOne('SELECT id FROM students WHERE user_id = ?', [user.id]);
    studentId = stu?.id;
  } else if (user.role === 'FACULTY') {
    const fac = await queryOne('SELECT id FROM faculty WHERE user_id = ?', [user.id]);
    facultyId = fac?.id;
  } else if (user.role === 'PARENT') {
    const par = await queryOne('SELECT id FROM parents WHERE user_id = ?', [user.id]);
    parentId = par?.id;
  }

  req.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    department: user.department,
    studentId,
    facultyId,
    parentId,
    rollNumber: user.roll_number
  };

  next();
}

export function requireRole(allowedRoles: Array<'STUDENT' | 'FACULTY' | 'ADMIN' | 'PARENT'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Requires one of: ${allowedRoles.join(', ')}` });
    }
    next();
  };
}

export function enforceStudentSelfAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  // Administrators and Faculty can access any student's data
  if (req.user.role === 'ADMIN' || req.user.role === 'FACULTY') {
    return next();
  }

  // Students can strictly only access their own studentId
  const requestedStudentId = req.params.studentId || req.query.studentId || req.body.studentId;
  if (requestedStudentId && req.user.studentId !== requestedStudentId) {
    return res.status(403).json({
      error: 'Data Privacy Violation: You are not authorized to view another student’s academic records.'
    });
  }

  next();
}

export async function enforceMentorAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'FACULTY') {
    return res.status(403).json({ error: 'Access denied. Mentor privileges required.' });
  }

  if (!req.user.facultyId) {
    return res.status(403).json({ error: 'Access denied. Mentor profile not found.' });
  }

  const requestedStudentId = req.params.studentId || req.query.studentId || req.body.studentId;
  if (requestedStudentId) {
    const assignment = await queryOne('SELECT id FROM mentor_students WHERE mentor_id = ? AND student_id = ? AND status = ?', [req.user.facultyId, requestedStudentId, 'ACTIVE']);
    if (!assignment) {
      // Create an audit log for unauthorized access attempt
      await queryOne('INSERT INTO audit_logs (id, actor, action, target) VALUES (?, ?, ?, ?)', [
        `audit_${Date.now()}`, req.user.email, 'UNAUTHORIZED_MENTOR_ACCESS', requestedStudentId
      ]);
      return res.status(403).json({ error: 'Student is not assigned to you. Access denied.' });
    }
  }

  next();
}

export async function enforceParentAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'PARENT') {
    return res.status(403).json({ error: 'Access denied. Parent privileges required.' });
  }

  const requestedStudentId = req.params.studentId || req.query.studentId || req.body.studentId;
  if (requestedStudentId) {
    const link = await queryOne('SELECT id FROM parent_students WHERE parent_id = ? AND student_id = ?', [req.user.parentId, requestedStudentId]);
    if (!link) {
      await queryOne('INSERT INTO audit_logs (id, actor, action, target) VALUES (?, ?, ?, ?)', [
        `audit_${Date.now()}`, req.user.email, 'UNAUTHORIZED_PARENT_ACCESS', requestedStudentId
      ]);
      return res.status(403).json({ error: 'You are not authorized to view this student.' });
    }
  }

  next();
}
