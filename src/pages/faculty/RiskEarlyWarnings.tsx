import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ShieldAlert, AlertTriangle, TrendingDown, Clock, Activity, ArrowRight } from 'lucide-react';
import { StudentDetailModal } from './StudentDetailModal';

export const RiskEarlyWarnings: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    api.getFacultyStudents()
      .then(res => setStudents(res.students))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Scanning risk radar...</div>;
  }

  const decliningStudents = students.filter(s => s.flags?.declining || s.trend === 'DECLINING');
  const attendanceCrisisStudents = students.filter(s => s.attendance < 75);
  const highVarianceStudents = students.filter(s => s.flags?.inconsistent);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <span>Early Warning Risk Radar & Triaged Deficits</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Automated multi-factor risk categorization to identify at-risk cohorts before semester exam failure
        </p>
      </div>

      {/* 3 Core Risk Signal Buckets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Declining Marks */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              <h2 className="text-sm font-semibold text-slate-100">Declining Trajectory ({decliningStudents.length})</h2>
            </div>
            <span className="text-[10px] font-mono text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900">
              Score Drop &gt; 10%
            </span>
          </div>

          <div className="space-y-2.5">
            {decliningStudents.map(s => (
              <div
                key={s.id}
                onClick={() => setSelectedStudentId(s.id)}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{s.name}</span>
                  <span className="font-mono text-indigo-400">{s.rollNumber}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  GPA: <span className="font-mono text-slate-200">{s.gpa.toFixed(2)}</span> · Trajectory: <span className="text-rose-400 font-medium">Declining</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance Crisis */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-slate-100">Attendance Crisis ({attendanceCrisisStudents.length})</h2>
            </div>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900">
              Below 75%
            </span>
          </div>

          <div className="space-y-2.5">
            {attendanceCrisisStudents.map(s => (
              <div
                key={s.id}
                onClick={() => setSelectedStudentId(s.id)}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{s.name}</span>
                  <span className="font-mono text-amber-400 font-bold">{s.attendance}%</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {s.rollNumber} · Shortfall against 75% statutory rule
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assessment Volatility */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-slate-100">High Volatility ({highVarianceStudents.length})</h2>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-900">
              StdDev &gt; 15%
            </span>
          </div>

          <div className="space-y-2.5">
            {highVarianceStudents.map(s => (
              <div
                key={s.id}
                onClick={() => setSelectedStudentId(s.id)}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{s.name}</span>
                  <span className="font-mono text-cyan-300">Erratic Scores</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {s.rollNumber} · Extreme score spread between theoretical and lab courses
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <StudentDetailModal
        studentId={selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
      />
    </div>
  );
};
