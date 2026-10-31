import { Router, Response } from 'express';
import { query, queryOne } from '../../db/database.js';
import { authenticateToken, enforceParentAccess, AuthenticatedRequest } from '../auth.js';
import { calculateStudentAnalytics } from '../analytics.js';

export const parentRouter = Router();

// Apply auth and role middleware
parentRouter.use(authenticateToken);

parentRouter.get('/dashboard', async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'PARENT' || !req.user.parentId) {
    return res.status(403).json({ error: 'Access denied. Parent privileges required.' });
  }

  // 1. Get linked student
  const link = await queryOne('SELECT student_id FROM parent_students WHERE parent_id = ?', [req.user.parentId]);
  
  if (!link) {
    return res.json({ student: null, analytics: null, mentor: null, notifications: [] });
  }

  const studentId = link.student_id;
  
  // 2. Fetch student details
  const student = await queryOne('SELECT id, name, roll_number, batch, section, mentor_faculty_id FROM students WHERE id = ?', [studentId]);
  
  // 3. Fetch analytics
  const analyticsData = await calculateStudentAnalytics(studentId);

  // 4. Fetch mentor details
  let mentor = null;
  if (student.mentor_faculty_id) {
    mentor = await queryOne(`
      SELECT f.id, f.name, u.email, u.phone 
      FROM faculty f 
      JOIN users u ON f.user_id = u.id 
      WHERE f.id = ?
    `, [student.mentor_faculty_id]);
  }

  // 5. Fetch notifications for parent
  const notifications = await query(`
    SELECT id, title, message, created_at, type 
    FROM notifications 
    WHERE recipient_id = ? AND recipient_role = 'PARENT'
    ORDER BY created_at DESC LIMIT 10
  `, [req.user.parentId]);

  return res.json({
    student,
    analytics: analyticsData,
    mentor,
    notifications
  });
});
