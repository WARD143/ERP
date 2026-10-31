import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { AlertCircle, User, Calendar, BookOpen, Clock, Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchParentData = async () => {
      try {
        const res = await api.getParentDashboard();
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Failed to load parent dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchParentData();
  }, []);

  if (loading) return <div className="text-center py-10 text-slate-400">Loading your ward's academic records...</div>;
  if (error) return <div className="text-center py-10 text-rose-400">{error}</div>;

  if (!data?.student) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-12 h-12 text-slate-500 mb-4" />
        <h2 className="text-lg font-medium text-slate-300">No Linked Student Profile</h2>
        <p className="text-slate-500 text-sm mt-2">Please contact the university administration to link your ward's profile.</p>
      </div>
    );
  }

  const { student, analytics, mentor, notifications } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">Parent Dashboard</h1>
          <p className="text-sm text-slate-400">Academic Overview for {student.name}</p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400"><User className="w-5 h-5" /></div>
            <div>
              <div className="text-sm font-semibold text-slate-200">Ward Details</div>
              <div className="text-xs text-slate-500">{student.roll_number}</div>
            </div>
          </div>
          <div className="text-xs text-slate-400 space-y-2">
            <p><strong>Batch:</strong> {student.batch}</p>
            <p><strong>Section:</strong> {student.section}</p>
            <p><strong>Semester:</strong> 5th Semester</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><BookOpen className="w-5 h-5" /></div>
            <div>
              <div className="text-sm font-semibold text-slate-200">Academic Status</div>
              <div className="text-xs text-slate-500">Current Semester</div>
            </div>
          </div>
          <div className="text-xs text-slate-400 space-y-2">
            <p><strong>CGPA/GPA:</strong> {analytics.gpa}</p>
            <p><strong>Overall %:</strong> {analytics.percentage}%</p>
            <p><strong>Attendance:</strong> {analytics.attendance_average}%</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400"><Calendar className="w-5 h-5" /></div>
            <div>
              <div className="text-sm font-semibold text-slate-200">Mentor Contact</div>
              <div className="text-xs text-slate-500">Assigned Faculty</div>
            </div>
          </div>
          <div className="text-xs text-slate-400 space-y-2">
            {mentor ? (
              <>
                <p><strong>Name:</strong> {mentor.name}</p>
                <p><strong>Email:</strong> {mentor.email}</p>
              </>
            ) : (
              <p>No mentor assigned.</p>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-white mb-4">Important Notifications & Alerts</h2>
        {notifications.length === 0 ? (
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
            <p className="text-slate-300 text-sm font-medium">No active alerts</p>
            <p className="text-slate-500 text-xs mt-1">Your ward's academic and attendance records are healthy.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif: any) => (
              <div key={notif.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">{notif.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{notif.message}</p>
                  <p className="text-[10px] text-slate-500 mt-2">{new Date(notif.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
