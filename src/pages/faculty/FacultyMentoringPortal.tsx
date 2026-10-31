import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  HeartHandshake,
  Users,
  Calendar,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Mail,
  PlusCircle,
  FileText,
  UserCheck,
  Send,
  X
} from 'lucide-react';

export const FacultyMentoringPortal: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showLogModal, setShowLogModal] = useState<boolean>(false);

  // Form state for logging mentoring session
  const [sessionTopic, setSessionTopic] = useState<string>('Academic Review & Mid-Term Progress');
  const [mentorNotes, setMentorNotes] = useState<string>('');
  const [actionPlan, setActionPlan] = useState<string>('');
  const [parentInformed, setParentInformed] = useState<boolean>(false);
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  const loadMentees = () => {
    setLoading(true);
    api.getMyMentees()
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMentees();
  }, []);

  const openLogModal = (student: any) => {
    setSelectedStudent(student);
    setSessionTopic('Academic Review & Mid-Term Progress');
    setMentorNotes('');
    setActionPlan('');
    setParentInformed(student.risk_level === 'HIGH');
    setFollowUpDate('');
    setShowLogModal(true);
  };

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setSubmitting(true);
    try {
      await api.logMentoringSession({
        studentId: selectedStudent.id,
        topic: sessionTopic,
        mentorNotes,
        studentActionPlan: actionPlan,
        parentInformed,
        followUpDate: followUpDate || undefined,
        status: 'COMPLETED'
      });
      setSuccessMsg(`Mentoring session recorded for ${selectedStudent.name}!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowLogModal(false);
      loadMentees();
    } catch (err: any) {
      alert('Failed to save session: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !data) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading faculty proctorial desk...</div>;
  }

  const { mentees = [], facultyName } = data;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-900/60 border border-indigo-500/20 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-indigo-400" />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-300">
                Proctorial Mentoring Desk · {facultyName}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
              Assigned Mentee Cohort & Wellness Radar
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Holistic mentor-mentee monitoring combining academic performance, attendance safety margins, and student-reported psychological wellness. Log 1-on-1 counseling and monitor follow-ups.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Assigned Mentees</span>
              <span className="text-lg font-bold font-mono text-indigo-400">{mentees.length}</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">High Attention</span>
              <span className="text-lg font-bold font-mono text-rose-400">
                {mentees.filter((m: any) => m.risk_level === 'HIGH').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Mentees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {mentees.map((mentee: any) => {
          const isHighRisk = mentee.risk_level === 'HIGH';
          const isLowAtt = (mentee.attendance_average || 0) < 75;

          return (
            <div
              key={mentee.id}
              className={`p-5 rounded-2xl bg-slate-900/60 border transition-all flex flex-col justify-between space-y-4 ${
                isHighRisk
                  ? 'border-rose-500/40 hover:border-rose-500/60'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                {/* Mentee Top Meta */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm text-white ${
                      isHighRisk
                        ? 'bg-rose-600'
                        : mentee.risk_level === 'MEDIUM'
                        ? 'bg-amber-600'
                        : 'bg-indigo-600'
                    }`}>
                      {mentee.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">{mentee.name}</h3>
                      <span className="text-xs font-mono text-slate-400">{mentee.roll_number} · Sec {mentee.section}</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded ${
                    isHighRisk
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      : mentee.risk_level === 'MEDIUM'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {mentee.risk_level} RISK
                  </span>
                </div>

                {/* Academic & Attendance Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Current GPA</span>
                    <span className="font-mono font-bold text-slate-100 text-sm">
                      {mentee.gpa ? mentee.gpa.toFixed(2) : 'N/A'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Attendance</span>
                    <span className={`font-mono font-bold text-sm ${
                      isLowAtt ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {mentee.attendance_average ? `${mentee.attendance_average.toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Student Wellness Self-Rating Badge */}
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Reported Stress Level:</span>
                    </span>
                    <span className={`font-mono font-bold ${
                      mentee.stressLevel >= 4 ? 'text-rose-400' : 'text-slate-300'
                    }`}>
                      {mentee.stressLevel} / 5
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Exam Confidence:</span>
                    <span className="font-mono font-bold text-indigo-300">{mentee.confidenceLevel} / 5</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Weekly Study Hours:</span>
                    <span className="font-mono text-slate-300">{mentee.studyHours} hrs/wk</span>
                  </div>
                </div>

                {/* Last Session Info */}
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <div className="truncate">
                    <strong>Last Session:</strong> {mentee.lastSessionTopic}
                  </div>
                  <div className="font-mono text-slate-500">Date: {mentee.lastSessionDate}</div>
                  {mentee.followUpDate && (
                    <div className="font-mono text-indigo-400">Target Follow-Up: {mentee.followUpDate}</div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                <button
                  onClick={() => openLogModal(mentee)}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Log Mentoring</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Log Mentoring Session Modal */}
      {showLogModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 my-6 text-slate-200">
            <button
              onClick={() => setShowLogModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <HeartHandshake className="w-5 h-5 text-indigo-400" />
              <div>
                <h2 className="text-base font-bold text-slate-100">Log Proctorial Mentoring Session</h2>
                <p className="text-xs text-slate-400">
                  Student: <strong className="text-indigo-300">{selectedStudent.name}</strong> ({selectedStudent.roll_number})
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSession} className="space-y-3.5 my-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Session Discussion Topic</label>
                <input
                  type="text"
                  required
                  value={sessionTopic}
                  onChange={(e) => setSessionTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Mentor Evaluation & Guidance Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Record guidance provided, observations on concept grasp, attendance warning given, etc."
                  value={mentorNotes}
                  onChange={(e) => setMentorNotes(e.target.value)}
                  className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 text-xs resize-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Agreed Student Action Plan</label>
                <input
                  type="text"
                  placeholder="e.g. Solve 10 algorithm problems; Attend 100% classes next 2 weeks"
                  value={actionPlan}
                  onChange={(e) => setActionPlan(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Target Follow-Up Date</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="parentCheck"
                    checked={parentInformed}
                    onChange={(e) => setParentInformed(e.target.checked)}
                    className="rounded border-slate-800 text-indigo-600 focus:ring-0 w-4 h-4"
                  />
                  <label htmlFor="parentCheck" className="text-slate-300 text-xs cursor-pointer">
                    Parents Contacted / Informed
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Saving...' : 'Record Mentoring Session'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
