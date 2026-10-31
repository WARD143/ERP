import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { BookOpen, Users, Award, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const SubjectOverview: React.FC = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getFacultySubjects()
      .then(res => setSubjects(res.subjects))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading department courses overview...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <span>Department Course Performance & Passing Health</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Aggregated assessment metrics, attendance averages, and risk indicators across Semester 5 CSE courses
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((sub) => (
          <div key={sub.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono text-indigo-400 font-semibold">{sub.code}</span>
                <h2 className="text-base font-bold text-slate-100 mt-0.5">{sub.name}</h2>
                <div className="text-xs text-slate-400 mt-0.5">Faculty: {sub.facultyName || 'Department Faculty'}</div>
              </div>
              <span className="px-2 py-0.5 text-xs font-mono bg-slate-800 text-slate-300 rounded border border-slate-700">
                {sub.credits} Credits
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-center">
                <div className="text-[11px] text-slate-400">Average CIE Score</div>
                <div className="text-lg font-bold font-mono text-indigo-300 mt-0.5">{sub.avgScorePct}%</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-center">
                <div className="text-[11px] text-slate-400">Average Attendance</div>
                <div className={`text-lg font-bold font-mono mt-0.5 ${sub.avgAttendance < 75 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {sub.avgAttendance}%
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Predicted Pass Percentage</span>
                <span className="font-mono text-emerald-400 font-semibold">{sub.passPercentage}%</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Students with Attendance Deficit (&lt;75%)</span>
                <span className="font-mono text-rose-400 font-semibold">{sub.lowAttendanceCount} students</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
