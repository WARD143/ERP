import { execute, query, queryOne, saveDb } from '../db/database.js';

export async function triggerAbsenceNotifications(studentId: string, subjectId: string, totalClasses: number, attendedClasses: number, newAbsencesCount: number) {
  if (newAbsencesCount <= 0) return;

  const dedupKey = `absence_${studentId}_${subjectId}_${totalClasses}_${attendedClasses}`;
  const existingNotification = await queryOne('SELECT id FROM notifications WHERE deduplication_key = ?', [dedupKey]);
  if (existingNotification) return; // Already processed this event

  const student = await queryOne('SELECT id, name, mentor_faculty_id FROM students WHERE id = ?', [studentId]);
  const subject = await queryOne('SELECT name, code FROM subjects WHERE id = ?', [subjectId]);

  if (!student || !subject) return;

  const title = `Absence Alert: ${subject.code}`;
  const message = `${student.name} was marked absent for ${newAbsencesCount} session(s) in ${subject.name}.`;

  const notificationsToInsert = [];
  const now = new Date().toISOString();

  // 1. Notify Mentor
  if (student.mentor_faculty_id) {
    const mentorId = student.mentor_faculty_id;
    notificationsToInsert.push({
      id: `notif_mentor_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      recipient_id: mentorId,
      recipient_role: 'FACULTY',
      student_id: student.id,
      type: 'ABSENCE',
      priority: 'MEDIUM',
      title,
      message,
      deduplication_key: `${dedupKey}_mentor`
    });
  }

  // 2. Notify Parent
  const parents = await query('SELECT parent_id FROM parent_students WHERE student_id = ?', [student.id]);
  for (const p of parents) {
    notificationsToInsert.push({
      id: `notif_parent_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      recipient_id: p.parent_id,
      recipient_role: 'PARENT',
      student_id: student.id,
      type: 'ABSENCE',
      priority: 'MEDIUM',
      title,
      message,
      deduplication_key: `${dedupKey}_parent_${p.parent_id}`
    });
  }

  for (const n of notificationsToInsert) {
    await execute(`
      INSERT OR IGNORE INTO notifications (id, recipient_id, recipient_role, student_id, type, priority, title, message, deduplication_key, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [n.id, n.recipient_id, n.recipient_role, n.student_id, n.type, n.priority, n.title, n.message, n.deduplication_key, now]);
  }

  if (notificationsToInsert.length > 0) {
    saveDb();
  }
}
