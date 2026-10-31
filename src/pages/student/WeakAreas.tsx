import React from 'react';
import { StudentAnalytics } from '../../types';
import { AlertTriangle, CheckCircle2, BookOpen, Clock, ArrowRight } from 'lucide-react';

interface WeakAreasProps {
  analytics: StudentAnalytics;
  onNavigateTab: (tabId: string) => void;
}

export const WeakAreas: React.FC<WeakAreasProps> = ({ analytics, onNavigateTab }) => {
  const { weakSubjects, subjects } = analytics;
  const attendanceDeficitSubs = subjects.filter(s => s.attendancePercentage < 75);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <span>Academic Weak Areas & Critical Gaps</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Identifies specific concepts, subject score shortfalls, and attendance deficits requiring immediate remediation
        </p>
      </div>

      {!analytics.hasDetailedSubjectData ? (
        <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-slate-200">Subject-Level Data Unavailable</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Specific weak subjects and attendance deficits cannot be calculated because this student's profile is based on overall UCI dataset performance metrics, which lack individual subject scores.
          </p>
        </div>
      ) : weakSubjects.length === 0 && attendanceDeficitSubs.length === 0 ? (
        <div className="p-8 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-emerald-200">No Critical Academic Gaps Detected</h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            All enrolled subjects are currently scoring above institutional risk thresholds (≥65%) and attendance satisfies the statutory 75% requirement.
          </p>
          <button
            onClick={() => onNavigateTab('what-if')}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            <span>Simulate Distinction Score in What-If</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weak Subjects Card */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-rose-400" />
                <span>Subject Score Deficits ({weakSubjects.length})</span>
              </h2>
              <span className="text-[11px] text-rose-400 font-mono">Performance &lt; 65%</span>
            </div>

            {weakSubjects.length > 0 ? (
              <div className="space-y-3">
                {weakSubjects.map((sub) => (
                  <div key={sub.code} className="p-4 rounded-xl bg-slate-950/60 border border-rose-950/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-200 text-xs">{sub.name}</div>
                      <span className="font-mono text-xs font-semibold text-rose-400">{sub.weightedScorePercentage}% Score</span>
                    </div>
                    <div className="text-[11px] text-slate-400">Course Code: {sub.code} · Mentor: {sub.facultyName}</div>

                    {sub.weakTopics.length > 0 && (
                      <div className="pt-2 border-t border-slate-800">
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1">
                          Diagnostic Concept Gaps
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {sub.weakTopics.map((topic, i) => (
                            <span key={i} className="px-2 py-0.5 rounded text-[11px] bg-rose-500/10 text-rose-300 border border-rose-500/20">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-emerald-400 py-4">All subjects performing above danger thresholds.</div>
            )}
          </div>

          {/* Attendance Deficits Card */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Attendance Deficits ({attendanceDeficitSubs.length})</span>
              </h2>
              <span className="text-[11px] text-amber-400 font-mono">Shortfall &lt; 75%</span>
            </div>

            {attendanceDeficitSubs.length > 0 ? (
              <div className="space-y-3">
                {attendanceDeficitSubs.map((sub) => {
                  const needed = Math.max(1, Math.ceil((0.75 * sub.totalClasses - sub.attendedClasses) / 0.25));
                  return (
                    <div key={sub.code} className="p-4 rounded-xl bg-slate-950/60 border border-amber-950/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-slate-200 text-xs">{sub.name} ({sub.code})</div>
                        <span className="font-mono text-xs font-semibold text-amber-400">{sub.attendancePercentage}%</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Attended <span className="font-mono text-slate-200 font-semibold">{sub.attendedClasses}</span> of {sub.totalClasses} classes.
                      </div>
                      <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                        Recovery Target: Attend the next <span className="font-mono font-bold text-amber-200">{needed}</span> consecutive classes without absence.
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-emerald-400 py-4">All course attendances satisfy the 75% regulation.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
