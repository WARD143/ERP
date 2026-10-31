import React, { useState } from 'react';
import { StudentAnalytics, SubjectAnalytics as SubjectType } from '../../types';
import { BookOpen, UserCheck, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SubjectAnalyticsProps {
  analytics: StudentAnalytics;
}

export const SubjectAnalytics: React.FC<SubjectAnalyticsProps> = ({ analytics }) => {
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>(analytics.subjects[0]?.code || '');

  const selectedSubject = analytics.subjects.find(s => s.code === selectedSubjectCode) || analytics.subjects[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <span>Subject-Wise In-Depth Analytics</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Detailed metrics, component breakdown, topic mastery, and attendance for each course
        </p>
      </div>

      {!analytics.hasDetailedSubjectData && (
        <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center text-center mt-6">
          <BookOpen className="w-12 h-12 text-slate-500 mb-4 opacity-30" />
          <h2 className="text-lg font-semibold text-slate-200">Subject-Level Data Unavailable</h2>
          <p className="text-sm text-slate-400 mt-2 max-w-md leading-relaxed">
            This student's profile is based on overall UCI dataset performance metrics.
            Line-by-line internal subject assessment scores and specific attendance logs do not exist for this student.
          </p>
        </div>
      )}

      {/* Subject Navigation Tabs */}
      {analytics.hasDetailedSubjectData && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
          {analytics.subjects.map((sub) => {
            const isSelected = sub.code === selectedSubjectCode;
            const isHighRisk = sub.riskStatus === 'HIGH';

            return (
              <button
                key={sub.code}
                onClick={() => setSelectedSubjectCode(sub.code)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
                }`}
              >
                <span className="font-mono font-semibold">{sub.code}</span>
                <span>{sub.name}</span>
                {isHighRisk && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Subject Profile Card */}
      {analytics.hasDetailedSubjectData && selectedSubject && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Analytics Overview */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
                <div>
                  <div className="text-xs font-mono text-indigo-400">{selectedSubject.code} · {selectedSubject.credits} Credits</div>
                  <h2 className="text-lg font-bold text-slate-100">{selectedSubject.name}</h2>
                  <div className="text-xs text-slate-400 mt-0.5">Faculty In-Charge: {selectedSubject.facultyName}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-xs font-mono rounded font-semibold ${
                    selectedSubject.riskStatus === 'HIGH' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    selectedSubject.riskStatus === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {selectedSubject.riskStatus} RISK
                  </span>
                </div>
              </div>

              {/* KPI Triplet */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400">Continuous Evaluation</div>
                  <div className="text-xl font-bold font-mono text-indigo-300 mt-1">
                    {selectedSubject.weightedScorePercentage}%
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400">Attendance</div>
                  <div className={`text-xl font-bold font-mono mt-1 ${
                    selectedSubject.attendancePercentage < 75 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {selectedSubject.attendancePercentage}%
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400">Score Trajectory</div>
                  <div className="text-sm font-semibold flex items-center justify-center gap-1 mt-1 text-slate-200">
                    {selectedSubject.trend === 'IMPROVING' ? (
                      <span className="text-emerald-400 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Improving</span>
                    ) : selectedSubject.trend === 'DECLINING' ? (
                      <span className="text-rose-400 flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5" /> Declining</span>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1"><Minus className="w-3.5 h-3.5" /> Stable</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Assessment Breakdown Breakdown */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Component Marks Analysis
                </div>

                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-xs mb-1 text-slate-300">
                      <span>Internal Assessment 1 (IA-1)</span>
                      <span className="font-mono tabular-nums">{selectedSubject.ia1Marks} / {selectedSubject.ia1Max} ({(selectedSubject.ia1Marks/selectedSubject.ia1Max * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(selectedSubject.ia1Marks/selectedSubject.ia1Max * 100)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1 text-slate-300">
                      <span>Internal Assessment 2 (IA-2)</span>
                      <span className="font-mono tabular-nums">{selectedSubject.ia2Marks} / {selectedSubject.ia2Max} ({(selectedSubject.ia2Marks/selectedSubject.ia2Max * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(selectedSubject.ia2Marks/selectedSubject.ia2Max * 100)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1 text-slate-300">
                      <span>Mid-Term Examination</span>
                      <span className="font-mono tabular-nums">{selectedSubject.midTermMarks} / {selectedSubject.midTermMax} ({(selectedSubject.midTermMarks/selectedSubject.midTermMax * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(selectedSubject.midTermMarks/selectedSubject.midTermMax * 100)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1 text-slate-300">
                      <span>Assignments & Lab Experiments</span>
                      <span className="font-mono tabular-nums">{selectedSubject.assignmentScore} / {selectedSubject.assignmentMax} ({(selectedSubject.assignmentScore/selectedSubject.assignmentMax * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(selectedSubject.assignmentScore/selectedSubject.assignmentMax * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Weak Topics & Course Remediation Panel */}
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Identified Focus Topics</span>
              </h3>

              {selectedSubject.weakTopics.length > 0 ? (
                <div className="space-y-2">
                  {selectedSubject.weakTopics.map((topic, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                      <span>{topic}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>No critical knowledge gaps detected for this subject.</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-300">Attendance Breakdown</div>
                <div className="text-xs text-slate-400">
                  Attended <span className="font-mono text-slate-200 font-semibold">{selectedSubject.attendedClasses}</span> out of <span className="font-mono text-slate-200">{selectedSubject.totalClasses}</span> delivered lecture hours.
                </div>
                {selectedSubject.attendancePercentage < 75 && (
                  <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-900/50 text-xs text-rose-300">
                    Deficit: {Math.max(1, Math.ceil((0.75 * selectedSubject.totalClasses - selectedSubject.attendedClasses) / 0.25))} more consecutive classes required to reach 75%.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
