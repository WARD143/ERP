import React from 'react';
import { StudentAnalytics } from '../../types';
import { GraduationCap, Award, BookOpen, Clock } from 'lucide-react';

interface AcademicPerformanceProps {
  analytics: StudentAnalytics;
}

export const AcademicPerformance: React.FC<AcademicPerformanceProps> = ({ analytics }) => {
  const { subjects, comparisons } = analytics;
  const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-indigo-400" />
          <span>Academic Performance & Assessment Records</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Detailed marks breakdown across continuous internal evaluations, laboratory exercises, and semester comparisons
        </p>
      </div>

      {/* Comparison Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400">Current Semester GPA</div>
          <div className="text-2xl font-bold font-mono text-indigo-300 mt-1">{analytics.currentGpa.toFixed(2)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Overall Percentage: {analytics.overallPercentage}%</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400">Previous Semester (Sem 4)</div>
          <div className="text-2xl font-bold font-mono text-slate-200 mt-1">{comparisons.prevSemesterGpa.toFixed(2)}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Delta: <span className={comparisons.gpaDelta >= 0 ? 'text-emerald-400' : 'text-rose-400 font-medium'}>
              {comparisons.gpaDelta >= 0 ? '+' : ''}{comparisons.gpaDelta}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400">Section Average GPA</div>
          <div className="text-2xl font-bold font-mono text-slate-200 mt-1">{comparisons.sectionAverageGpa.toFixed(2)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Section {analytics.section} Cohort</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400">Total Enrolled Credits</div>
          <div className="text-2xl font-bold font-mono text-slate-200 mt-1">{totalCredits}</div>
          <div className="text-[11px] text-slate-400 mt-1">5 Core Theory & Lab Courses</div>
        </div>
      </div>

      {/* Detailed Continuous Evaluation Marks Table */}
      {!analytics.hasDetailedSubjectData ? (
        <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-slate-200">Continuous Evaluation Marks Unavailable</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Subject-wise internal marks and laboratory grades cannot be displayed because this student's academic profile is derived from overall dataset records, which lack detailed breakdown matrices.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Course Continuous Internal Evaluations (CIE)
          </div>
          <div className="text-[11px] text-slate-400">
            Weighting: IA1 (25%) · IA2 (25%) · Mid-Term (35%) · Assignments (15%)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Credits</th>
                <th className="py-3 px-4">IA-1 (30)</th>
                <th className="py-3 px-4">IA-2 (30)</th>
                <th className="py-3 px-4">Mid-Term (50)</th>
                <th className="py-3 px-4">Assignments (40)</th>
                <th className="py-3 px-4">Weighted %</th>
                <th className="py-3 px-4">Attendance</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {subjects.map((sub) => {
                const isWeak = sub.riskStatus === 'HIGH';
                const isModerate = sub.riskStatus === 'MEDIUM';

                return (
                  <tr key={sub.code} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{sub.name}</div>
                      <div className="text-[11px] font-mono text-indigo-400">{sub.code} · {sub.facultyName}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-300">
                      {sub.credits}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-200">
                      <span className="font-semibold">{sub.ia1Marks}</span>
                      <span className="text-slate-500">/{sub.ia1Max}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-200">
                      <span className="font-semibold">{sub.ia2Marks}</span>
                      <span className="text-slate-500">/{sub.ia2Max}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-200">
                      <span className="font-semibold">{sub.midTermMarks}</span>
                      <span className="text-slate-500">/{sub.midTermMax}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-200">
                      <span className="font-semibold">{sub.assignmentScore}</span>
                      <span className="text-slate-500">/{sub.assignmentMax}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums">
                      <span className={`font-semibold ${isWeak ? 'text-rose-400' : isModerate ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {sub.weightedScorePercentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums">
                      <span className={sub.attendancePercentage < 75 ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
                        {sub.attendancePercentage}%
                      </span>
                      <div className="text-[10px] text-slate-500">{sub.attendedClasses}/{sub.totalClasses} classes</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[11px] font-medium ${
                        isWeak ? 'text-rose-400' : isModerate ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {isWeak ? 'At Risk' : isModerate ? 'Moderate' : 'On Track'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
};
