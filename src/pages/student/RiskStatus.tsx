import React from 'react';
import { RiskAssessment, StudentAnalytics } from '../../types';
import { RiskBadge } from '../../components/common/RiskBadge';
import { ShieldAlert, CheckCircle2, AlertTriangle, HelpCircle, ArrowRight, Minus } from 'lucide-react';

interface RiskStatusProps {
  risk: RiskAssessment;
  analytics: StudentAnalytics;
  onNavigateTab: (tabId: string) => void;
}

export const RiskStatus: React.FC<RiskStatusProps> = ({ risk, analytics, onNavigateTab }) => {
  const isHigh = risk.riskLevel === 'HIGH';
  const isMedium = risk.riskLevel === 'MEDIUM';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-indigo-400" />
          <span>Early Warning & Risk Classification Status</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Rule-based, multi-factor academic risk evaluation engine with explainable diagnostic reasons
        </p>
      </div>

      {/* Main Risk Status Hero */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
        isHigh
          ? 'bg-rose-950/25 border-rose-900/60'
          : isMedium
          ? 'bg-amber-950/25 border-amber-900/60'
          : 'bg-emerald-950/25 border-emerald-900/60'
      }`}>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <RiskBadge level={risk.riskLevel} score={risk.overallRiskScore} />
            <span className="text-xs text-slate-400">· Evaluated: {new Date(risk.calculatedAt).toLocaleDateString()}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100">
            {isHigh ? 'High Academic Risk — Urgent Intervention Required' :
             isMedium ? 'Medium Academic Risk — Performance Advisory' :
             'Low Academic Risk — Normal Performance Standing'}
          </h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            {isHigh
              ? 'Multi-factor academic distress detected across continuous evaluation marks and/or attendance thresholds. Immediate faculty counseling is scheduled.'
              : isMedium
              ? 'Minor volatility or course deficit detected. Corrective actions in continuous evaluation can restore trajectory before semester finals.'
              : 'Performance meets or exceeds institutional benchmark standards. No current risk of examination debarment or semester backlog.'}
          </p>
        </div>

        {/* Risk Score Circle */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center shrink-0 min-w-[140px]">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Risk Score</div>
          <div className={`text-3xl font-bold font-mono mt-1 ${
            isHigh ? 'text-rose-400' : isMedium ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {risk.overallRiskScore}<span className="text-xs text-slate-500 font-normal">/100</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Threshold: High &ge; 65</div>
        </div>
      </div>

      {/* 4 Multi-Factor Detection Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border ${!analytics.hasDetailedSubjectData ? 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-80' : risk.decliningMarksFlag ? 'bg-rose-950/20 border-rose-900/40 text-rose-200' : 'bg-slate-900/60 border-slate-800 text-slate-300'}`}>
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span>Declining Marks Signal</span>
            {!analytics.hasDetailedSubjectData ? <Minus className="w-4 h-4 text-slate-500" /> : risk.decliningMarksFlag ? <AlertTriangle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          </div>
          <div className="text-xs text-slate-400">
            {!analytics.hasDetailedSubjectData
              ? 'Subject-level trajectory data unavailable.'
              : risk.decliningMarksFlag 
                ? 'Significant drop between successive assessments detected (>10%).' 
                : 'Stable or upward trajectory across tests.'}
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${risk.lowAttendanceFlag ? 'bg-rose-950/20 border-rose-900/40 text-rose-200' : 'bg-slate-900/60 border-slate-800 text-slate-300'}`}>
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span>Low Attendance Signal</span>
            {risk.lowAttendanceFlag ? <AlertTriangle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          </div>
          <div className="text-xs text-slate-400">
            {risk.lowAttendanceFlag ? 'Attendance in one or more subjects is below statutory 75% limit.' : 'All subject attendances meet 75% cutoff.'}
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${!analytics.hasDetailedSubjectData ? 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-80' : risk.inconsistentAssessmentsFlag ? 'bg-amber-950/20 border-amber-900/40 text-amber-200' : 'bg-slate-900/60 border-slate-800 text-slate-300'}`}>
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span>Assessment Volatility</span>
            {!analytics.hasDetailedSubjectData ? <Minus className="w-4 h-4 text-slate-500" /> : risk.inconsistentAssessmentsFlag ? <AlertTriangle className="w-4 h-4 text-amber-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          </div>
          <div className="text-xs text-slate-400">
            {!analytics.hasDetailedSubjectData 
              ? 'Subject-level data unavailable.' 
              : risk.inconsistentAssessmentsFlag 
                ? 'High standard deviation across courses indicates erratic test outcomes.' 
                : 'Consistent score distribution across courses.'}
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${!analytics.hasDetailedSubjectData ? 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-80' : risk.weakSubjectsCount > 0 ? 'bg-rose-950/20 border-rose-900/40 text-rose-200' : 'bg-slate-900/60 border-slate-800 text-slate-300'}`}>
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span>Weak Subjects Count</span>
            <span className="font-mono font-bold text-xs">
              {!analytics.hasDetailedSubjectData ? 'N/A' : risk.weakSubjectsCount}
            </span>
          </div>
          <div className="text-xs text-slate-400">
            {!analytics.hasDetailedSubjectData 
              ? 'Subject-level data unavailable.' 
              : risk.weakSubjectsCount > 0 
                ? `${risk.weakSubjectsCount} course(s) currently performing in the academic danger zone (<60%).` 
                : 'Zero courses currently below 60% mark.'}
          </div>
        </div>
      </div>

      {/* Transparent Explainable Reasons List */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span>Why Was This Risk Status Assigned? (Explainable AI / Rules)</span>
          </h3>
          <span className="text-[11px] text-slate-400">Deterministic Rule Attribution</span>
        </div>

        <div className="space-y-2.5">
          {risk.explanationReasons.map((reason, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-3"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${isHigh ? 'bg-rose-400' : isMedium ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              <span className="leading-relaxed">{reason}</span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Need a personalized recovery roadmap?</span>
          <button
            onClick={() => onNavigateTab('recommendations')}
            className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
          >
            <span>View Personalized Support Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
