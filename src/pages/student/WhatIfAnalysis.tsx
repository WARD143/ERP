import React, { useState, useEffect } from 'react';
import { StudentAnalytics, WhatIfSimulationResult } from '../../types';
import { Sliders, Sparkles, TrendingUp, ShieldCheck, CheckCircle2, RotateCcw } from 'lucide-react';
import { api } from '../../api/client';

interface WhatIfAnalysisProps {
  analytics: StudentAnalytics;
}

export const WhatIfAnalysis: React.FC<WhatIfAnalysisProps> = ({ analytics }) => {
  const [targetEndTerm, setTargetEndTerm] = useState<number>(75);
  const [attendanceBonus, setAttendanceBonus] = useState<number>(0);
  const [resolveAssignments, setResolveAssignments] = useState<boolean>(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [subjectTargetScore, setSubjectTargetScore] = useState<number>(80);

  const [simulation, setSimulation] = useState<WhatIfSimulationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await api.runWhatIf(analytics.studentId, {
        hypotheticalEndTermPercentage: targetEndTerm,
        targetSubjectCode: selectedSubject || undefined,
        targetSubjectScore: selectedSubject ? subjectTargetScore : undefined,
        simulatedAttendanceBonus: attendanceBonus,
        resolveOverdueAssignments: resolveAssignments
      });
      setSimulation(res.simulation);
    } catch (err: any) {
      alert('Simulation error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [targetEndTerm, attendanceBonus, resolveAssignments, selectedSubject, subjectTargetScore]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Interactive Academic Sandbox
          </span>
          <span className="text-xs text-slate-500">· Real-Time What-If Modeler</span>
        </div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <span>What-If Academic Scenario Simulation</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Hypothetically test the impact of target final exam scores, attendance recovery, and assignment submissions on your final GPA
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Controls Panel */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-100">Simulation Variables</h2>
            <button
              onClick={() => {
                setTargetEndTerm(75);
                setAttendanceBonus(0);
                setResolveAssignments(false);
                setSelectedSubject('');
              }}
              className="text-slate-400 hover:text-slate-200 p-1 rounded"
              title="Reset sliders"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Target End-Term Score Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300">Hypothetical End-Term Score</span>
              <span className="font-mono tabular-nums text-indigo-300 font-bold text-sm">{targetEndTerm}%</span>
            </div>
            <input
              type="range"
              min={35}
              max={100}
              step={1}
              value={targetEndTerm}
              onChange={(e) => setTargetEndTerm(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Pass (40%)</span>
              <span>First Class (70%)</span>
              <span>Distinction (85%)</span>
            </div>
          </div>

          {/* Attendance Improvement */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300">Simulated Attendance Boost</span>
              <span className="font-mono tabular-nums text-emerald-400 font-bold text-sm">+{attendanceBonus}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={25}
              step={1}
              value={attendanceBonus}
              onChange={(e) => setAttendanceBonus(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="text-[10px] text-slate-500">
              Simulates attending all remaining semester lecture & lab classes without absence.
            </div>
          </div>

          {/* Clear Overdue Assignments Toggle */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-300">Clear Assignment Backlog</div>
              <div className="text-[11px] text-slate-500">Assume 100% submission of overdue lab tasks</div>
            </div>
            <button
              type="button"
              onClick={() => setResolveAssignments(!resolveAssignments)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                resolveAssignments ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                resolveAssignments ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Subject-Specific Target */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="text-xs font-medium text-slate-300">Focus on Specific Weak Course</div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300"
            >
              <option value="">All Subjects Equal</option>
              {analytics.subjects.map(s => (
                <option key={s.code} value={s.code}>{s.code} — {s.name}</option>
              ))}
            </select>

            {selectedSubject && (
              <div className="pt-2 space-y-1">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Target Score for {selectedSubject}</span>
                  <span className="font-mono text-indigo-300 font-bold">{subjectTargetScore}%</span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={100}
                  value={subjectTargetScore}
                  onChange={(e) => setSubjectTargetScore(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Live Simulation Results */}
        <div className="lg:col-span-2 space-y-6">
          {simulation && (
            <>
              {/* Baseline vs Simulated Metric Comparisons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-xs text-slate-400">Baseline Continuous GPA</div>
                  <div className="text-2xl font-bold font-mono text-slate-300 mt-1">
                    {simulation.baseline.gpa.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Risk: {simulation.baseline.riskLevel}</div>
                </div>

                <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/40">
                  <div className="text-xs text-indigo-300 font-medium">Projected Simulated GPA</div>
                  <div className="text-3xl font-bold font-mono text-indigo-200 mt-1">
                    {simulation.simulated.gpa.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-indigo-400 mt-1 flex items-center gap-1 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{simulation.simulated.gpaGain >= 0 ? `+${simulation.simulated.gpaGain}` : simulation.simulated.gpaGain} GPA Gain</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-xs text-slate-400">Projected Risk Standing</div>
                  <div className={`text-xl font-bold font-mono mt-1 ${
                    simulation.simulated.riskLevel === 'LOW' ? 'text-emerald-400' : simulation.simulated.riskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {simulation.simulated.riskLevel} RISK
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Attendance: {simulation.simulated.attendanceAverage}%
                  </div>
                </div>
              </div>

              {/* Target Milestones Needed */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Academic Milestones Required Examination Scores
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                    <div className="text-slate-400">For Distinction (GPA ≥ 8.5)</div>
                    <div className="text-lg font-bold font-mono text-slate-200 mt-1">
                      {simulation.targetsNeeded.scoreForDistinctionGpa8_5 !== null ? (
                        <span>{simulation.targetsNeeded.scoreForDistinctionGpa8_5}% in End-Term</span>
                      ) : (
                        <span className="text-amber-400 text-sm">Mathematically out of reach this semester</span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                    <div className="text-slate-400">For First Class (GPA ≥ 7.0)</div>
                    <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                      {simulation.targetsNeeded.scoreForFirstClassGpa7_0 !== null ? (
                        <span>{simulation.targetsNeeded.scoreForFirstClassGpa7_0}% in End-Term</span>
                      ) : (
                        <span className="text-emerald-400 text-sm">Already Achieved!</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject Projections Table */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-3.5 border-b border-slate-800 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Course-by-Course Simulated Outcomes
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 text-[10px] font-mono border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">Subject</th>
                      <th className="py-2.5 px-4">Current CIE %</th>
                      <th className="py-2.5 px-4">Simulated Final %</th>
                      <th className="py-2.5 px-4">Net Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {simulation.subjectProjections.map((sub) => (
                      <tr key={sub.code}>
                        <td className="py-2.5 px-4 font-semibold text-slate-200">
                          {sub.code} · {sub.name}
                        </td>
                        <td className="py-2.5 px-4 font-mono tabular-nums text-slate-400">
                          {sub.baselinePercentage}%
                        </td>
                        <td className="py-2.5 px-4 font-mono tabular-nums font-semibold text-indigo-300">
                          {sub.simulatedPercentage}%
                        </td>
                        <td className="py-2.5 px-4 font-mono tabular-nums">
                          <span className={sub.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {sub.delta >= 0 ? `+${sub.delta}%` : `${sub.delta}%`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Disclaimer */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] text-slate-500 italic">
                * Hypothetical Simulation: Calculations are executed in a safe sandbox. Official college records and grades are not affected.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
