import React from 'react';
import { Alert } from '../../types';
import { Bell, AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

interface StudentAlertsProps {
  alerts: Alert[];
}

export const StudentAlerts: React.FC<StudentAlertsProps> = ({ alerts }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-400" />
          <span>Early Warning Alerts & Notifications</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Automated early warnings triggered by attendance dips, test drops, or continuous assessment deadlines
        </p>
      </div>

      {alerts.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <h2 className="text-sm font-semibold text-slate-200">No Active Notifications</h2>
          <p className="text-xs text-slate-400">All academic indicators and attendance thresholds are within target parameters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isWarning = alert.severity === 'WARNING';

            const Icon = isCritical ? AlertCircle : isWarning ? AlertTriangle : Info;
            const borderClass = isCritical
              ? 'bg-rose-950/20 border-rose-900/50'
              : isWarning
              ? 'bg-amber-950/20 border-amber-900/50'
              : 'bg-slate-900/60 border-slate-800';

            const badgeClass = isCritical
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              : isWarning
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border ${borderClass} transition-all space-y-2`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${
                      isCritical ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-indigo-400'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-100">{alert.title}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border uppercase ${badgeClass}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{alert.message}</p>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-slate-500 shrink-0">
                    {new Date(alert.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Category: <span className="font-mono text-indigo-300">{alert.risk_category}</span></span>
                  <span>{alert.is_resolved ? 'Resolved' : 'Active Warning'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
