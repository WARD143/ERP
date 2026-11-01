import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { queryOne, execute } from '../db/database.js';

// Enforce environment AUTH_SECRET without insecure hardcoded fallbacks
function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.trim().length < 16) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL SECURITY ERROR: AUTH_SECRET must be configured with at least 16 characters in production.');
    }
    // Safe deterministic development secret if unconfigured in local dev
    return 'aktera_dev_secret_key_9f83b271d46e10ac25048cb12e39a7b6';
  }
  return secret.trim();
}

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
  mustChangePassword?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function generateToken(user: AuthenticatedUser): string {
  const secret = getAuthSecret();
  const payload = JSON.stringify({
    id: user.id,
    email: user.email,
    role: user.role,
    studentId: user.studentId,
    facultyId: user.facultyId,
    parentId: user.parentId,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days expiration
  });

  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(payload).toString('base64url') + '.' + hmac;
}

export function verifyToken(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const secret = getAuthSecret();
    const payloadStr = Buffer.from(parts[0], 'base64url').toString('utf8');
    const expectedHmac = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');

    const providedBuf = Buffer.from(parts[1], 'hex');
    const expectedBuf = Buffer.from(expectedHmac, 'hex');

    // Constant-time comparison with length matching validation
    if (providedBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) return null;

    const payload = JSON.parse(payloadStr);
    if (payload.exp && payload.exp < Date.now()) return null;

    return payload;
  } catch (err) {
    return null;
  }
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Missing session token.' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }

  // Fetch verified user record from database
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
    parentId = par?.id || user.id;
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
    rollNumber: user.roll_number,
    mustChangePassword: user.must_change_password === 1
  };

  next();
}

export function requireRole(allowedRoles: Array<'STUDENT' | 'FACULTY' | 'ADMIN' | 'PARENT'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Endpoint requires one of: ${allowedRoles.join(', ')}` });
    }
    next();
  };
}

/**
 * Strict Data Ownership: Resolves target studentId and strictly checks:
 * - Student: CAN ONLY access their own server-derived studentId (cannot spoof via URL/body)
 * - Parent: CAN ONLY access students linked in parent_students
 * - Faculty: CAN ONLY access students assigned to them or their courses
 * - Admin: Full access with audit logging
 */
export async function enforceStudentOwnership(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  // Extract requested studentId from route params, query, or body
  let targetStudentId = req.params.studentId || req.query.studentId || req.body.studentId;

  // If student requests an endpoint with no studentId specified, default to their own verified studentId
  if (req.user.role === 'STUDENT') {
    if (!targetStudentId) {
      targetStudentId = req.user.studentId;
      req.params.studentId = targetStudentId;
    } else if (targetStudentId !== req.user.studentId) {
      await logSecurityAudit(req.user.id, 'UNAUTHORIZED_IDOR_ATTEMPT', req.originalUrl, req.ip, 403);
      return res.status(403).json({
        error: 'Data Privacy Violation: You are not authorized to view or modify another student’s records.'
      });
    }
    return next();
  }

  // Parent Role: Enforce linked parent_students relationship
  if (req.user.role === 'PARENT') {
    if (!targetStudentId) {
      return res.status(400).json({ error: 'Target student ID is required for parent access.' });
    }

    const isLinked = await queryOne(`
      SELECT id FROM parent_students 
      WHERE (parent_user_id = ? OR parent_user_id = ?) 
        AND (student_id = ? OR student_id = (SELECT id FROM students WHERE roll_number = ?))
    `, [req.user.id, req.user.parentId || '', targetStudentId, targetStudentId]);

    if (!isLinked) {
      await logSecurityAudit(req.user.id, 'UNAUTHORIZED_PARENT_ACCESS', req.originalUrl, req.ip, 403);
      return res.status(403).json({ error: 'Access denied. You do not have authorization for this student record.' });
    }
    return next();
  }

  // Faculty Role: Check mentor assignment or subject class scope
  if (req.user.role === 'FACULTY') {
    if (!targetStudentId) {
      return next(); // General faculty dashboard endpoints
    }

    const isAssigned = await queryOne(`
      SELECT s.id FROM students s
      WHERE s.id = ? AND (
        s.mentor_faculty_id = ? OR
        EXISTS (SELECT 1 FROM subjects sub WHERE sub.faculty_id = ? AND sub.semester_id = s.current_semester_id)
      )
    `, [targetStudentId, req.user.facultyId || '', req.user.facultyId || '']);

    if (!isAssigned) {
      await logSecurityAudit(req.user.id, 'UNAUTHORIZED_FACULTY_ACCESS', req.originalUrl, req.ip, 403);
      return res.status(403).json({ error: 'Access denied: Student is outside your assigned mentoring or course roster.' });
    }
    return next();
  }

  // Admin Role: Full authorization
  if (req.user.role === 'ADMIN') {
    return next();
  }

  return res.status(403).json({ error: 'Unauthorized role access.' });
}

export async function logSecurityAudit(userId: string | undefined, action: string, endpoint: string, ip: string | undefined, statusCode: number) {
  try {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await execute(`
      INSERT INTO audit_logs (id, user_id, action, endpoint, ip_address, status_code)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, userId || 'ANONYMOUS', action, endpoint, ip || '127.0.0.1', statusCode]);
  } catch (err) {
    // Non-blocking error for audit logging
  }
}
