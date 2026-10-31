import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ClipboardList, AlertCircle, Clock, CheckCircle2, AlertTriangle, UserCheck } from 'lucide-react';
import { StudentDetailModal } from './StudentDetailModal';

interface InterventionManagerProps {
  initialStudentId?: string | null;
}

export const InterventionManager: React.FC<InterventionManagerProps> = ({ initialStudentId }) => {
  const [interventions, setInterventions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(initialStudentId || null);

  const fetchInterventions = async () => {
    try {
      const dashRes = await api.getFacultyDashboard();
      setInterventions(dashRes.interventions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterventions();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parsedInterventions = interventions.map(i => {
    let statusCategory = 'none';
    if (i.follow_up_date && i.status !== 'Resolved') {
      const fDate = new Date(i.follow_up_date);
      fDate.setHours(0,0,0,0);
      const diff = fDate.getTime() - today.getTime();
      if (diff < 0) statusCategory = 'overdue';
      else if (diff === 0) statusCategory = 'today';
      else statusCategory = 'upcoming';
    }
    return { ...i, statusCategory };
  });

  const dueToday = parsedInterventions.filter(i => i.statusCategory === 'today');
  const overdue = parsedInterventions.filter(i => i.statusCategory === 'overdue');
  const upcoming = parsedInterventions.filter(i => i.statusCategory === 'upcoming');
  const otherActive = parsedInterventions.filter(i => i.statusCategory === 'none' && i.status !== 'Resolved');
  const resolved = parsedInterventions.filter(i => i.status === 'Resolved');

  const Section = ({ title, items, icon: Icon, colorClass }: any) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${colorClass}`}>
          <Icon className="w-4 h-4" /> {title} ({items.length})
        </h3>
        <div className="space-y-3">
          {items.map((item: any) => (
            <div key={item.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-slate-200">{item.student_name}</span>
                  <span className="text-xs font-mono text-slate-500">({item.roll_number})</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${item.priority === 'High' || item.priority === 'Critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>{item.priority}</span>
                </div>
                <div className="text-xs text-indigo-300 font-medium mb-1">Issue: {item.issue_type || item.type}</div>
                <div className="text-xs text-slate-400 line-clamp-2 max-w-2xl">{item.notes}</div>
                {item.action_plan && (
                  <div className="text-xs text-slate-300 mt-2 p-2 bg-indigo-950/20 border border-indigo-900/30 rounded inline-block">
                    Action Plan: {item.action_plan}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end shrink-0 gap-2">
                {item.follow_up_date && (
                  <div className="text-[11px] text-slate-500 font-mono">
                    Follow-up: {new Date(item.follow_up_date).toLocaleDateString()}
                  </div>
                )}
                <button onClick={() => setSelectedStudentId(item.student_id)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors">
                  Open Case
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardList className="w-6 h-6 text-indigo-400" />
        <div>
          <h1 className="text-xl font-bold text-slate-100">Mentor Case Management Dashboard</h1>
          <p className="text-xs text-slate-400">Track all interventions, follow-ups, and student counseling cases</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400 text-sm">Loading cases...</div>
      ) : parsedInterventions.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-slate-700 rounded-2xl bg-slate-900/30">
          <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-3" />
          <h3 className="text-slate-300 font-medium">No Cases Found</h3>
          <p className="text-xs text-slate-500">There are no intervention cases assigned to you.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <Section title="Overdue Follow-ups" items={overdue} icon={AlertTriangle} colorClass="text-rose-400" />
          <Section title="Due Today" items={dueToday} icon={AlertCircle} colorClass="text-amber-400" />
          <Section title="Upcoming Follow-ups" items={upcoming} icon={Clock} colorClass="text-indigo-400" />
          <Section title="Active Cases (No Follow-up Date)" items={otherActive} icon={UserCheck} colorClass="text-slate-300" />
          <Section title="Resolved Cases" items={resolved} icon={CheckCircle2} colorClass="text-emerald-400" />
        </div>
      )}

      {selectedStudentId && (
        <StudentDetailModal
          studentId={selectedStudentId}
          onClose={() => {
            setSelectedStudentId(null);
            fetchInterventions();
          }}
        />
      )}
    </div>
  );
};
