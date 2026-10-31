import React from 'react';
import { Award, Users, BookOpen, GitBranch, X, CheckCircle2 } from 'lucide-react';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeamModal: React.FC<TeamModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const team = [
    { name: 'G. Akshath', roll: '2420030512', role: 'Full-Stack & Risk Engine Architecture', archetype: 'Improving Student Profile Archetype' },
    { name: 'P. TejAditya', roll: '2420030520', role: 'Analytics, Data Visualization & Forecasting', archetype: 'High-Performing Student Profile Archetype' },
    { name: 'I. Rajesh', roll: '2420030684', role: 'Database, Security & What-If Simulation Engine', archetype: 'Declining Student Profile Archetype' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition-colors p-1"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Engineering Capstone Project – 1</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Department of Computer Science & Engineering</span>
              <span aria-hidden="true">·</span>
              <span>A.Y. 2026–2027</span>
            </div>
          </div>
        </div>

        {/* Project Title */}
        <div className="mb-6 p-4 rounded-lg bg-slate-800/40 border border-slate-800">
          <div className="text-xs uppercase tracking-wider text-indigo-400 font-medium mb-1">Project Concept</div>
          <h3 className="text-base font-semibold text-slate-100 mb-2">
            AI-Driven Student Performance Analytics & Early Warning System
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            An analytical intelligence layer over existing academic/ERP data (marks, attendance, assignments, examinations).
            Transforms historical and continuous evaluation data into actionable predictive insights, multi-factor risk classifications,
            and early interventions before semester grade degradation occurs.
          </p>
        </div>

        {/* Central Architecture Pipeline */}
        <div className="mb-6">
          <div className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
            <span>Analytical Pipeline Flow</span>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 text-[11px] font-mono text-indigo-300 flex flex-wrap items-center gap-1.5 leading-relaxed">
            <span className="text-slate-300">ACADEMIC DATA</span>
            <span className="text-slate-600">→</span>
            <span className="text-indigo-400">ANALYTICS</span>
            <span className="text-slate-600">→</span>
            <span className="text-amber-400">TREND & WEAK-AREA</span>
            <span className="text-slate-600">→</span>
            <span className="text-rose-400">RISK SIGNALS</span>
            <span className="text-slate-600">→</span>
            <span className="text-rose-500">EARLY WARNING</span>
            <span className="text-slate-600">→</span>
            <span className="text-emerald-400">INTERVENTION</span>
            <span className="text-slate-600">→</span>
            <span className="text-cyan-400">FORECASTING</span>
            <span className="text-slate-600">→</span>
            <span className="text-violet-400">WHAT-IF</span>
          </div>
        </div>

        {/* Team Members & Guide */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2.5">
            <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Project Team</span>
            </div>
            {team.map((m) => (
              <div key={m.roll} className="p-2.5 rounded-lg bg-slate-800/30 border border-slate-800/60 flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">{m.name}</div>
                  <div className="text-[11px] font-mono text-indigo-400 tabular-nums">{m.roll}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{m.role}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2.5">
            <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Project Guide & Department</span>
            </div>
            <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20">
              <div className="text-xs font-semibold text-indigo-300">PRATUSHA MAM</div>
              <div className="text-[11px] text-slate-300 mt-0.5">Associate Professor & Project Guide</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Department of Computer Science & Engineering</div>
              <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Capstone Project – 1 Verified Architecture</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
          >
            Close & Continue Exploring
          </button>
        </div>
      </div>
    </div>
  );
};
