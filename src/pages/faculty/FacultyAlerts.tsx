import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Alert } from '../../types';
import { Bell, AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export const FacultyAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getFacultyDashboard()
      .then(res => setAlerts(res.alerts))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading active alerts queue...</div>;
  }

  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL');
  const warningAlerts = alerts.filter(a => a.severity === 'WARNING');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-400" />
          <span>Faculty & Mentor Critical Alerts Queue</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Early warning notifications for urgent counseling, attendance debarment threats, and steep score declines
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40">
          <div className="text-xs text-rose-300">Critical Priority Alerts</div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{criticalAlerts.length}</div>
        </div>

        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40">
          <div className="text-xs text-amber-300">Warning Advisories</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{warningAlerts.length}</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400">Total Notifications Active</div>
          <div className="text-2xl font-bold font-mono text-slate-200 mt-1">{alerts.length}</div>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const isCritical = alert.severity === 'CRITICAL';
          const isWarning = alert.severity === 'WARNING';
          const Icon = isCritical ? AlertCircle : isWarning ? AlertTriangle : Info;

          return (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
                isCritical
                  ? 'bg-rose-950/20 border-rose-900/40'
                  : isWarning
                  ? 'bg-amber-950/20 border-amber-900/40'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${
                  isCritical ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-indigo-400'
                }`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100">{alert.title}</span>
                    <span className="font-mono text-[11px] text-indigo-400">
                      {alert.student_name ? `${alert.student_name} (${alert.roll_number})` : ''}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border uppercase ${
                      isCritical
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{alert.message}</p>
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-500 shrink-0">
                {new Date(alert.created_at).toLocaleDateString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
