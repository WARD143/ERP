import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { X, Bell, Calendar, User, AlertCircle, FileText } from 'lucide-react';

interface CircularsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CircularsModal: React.FC<CircularsModalProps> = ({ isOpen, onClose }) => {
  const [circulars, setCirculars] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getCampusCirculars()
        .then(res => setCirculars(res.circulars))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 my-6 max-h-[92vh] flex flex-col text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Bell className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-base font-bold text-slate-100">University Campus Circulars & Official Notices</h2>
            <p className="text-xs text-slate-400">Office of the Registrar & Controller of Examinations</p>
          </div>
        </div>

        <div className="space-y-3 my-4 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading university circulars...</div>
          ) : circulars.length > 0 ? (
            circulars.map((circ) => (
              <div
                key={circ.id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xs font-bold text-slate-100 leading-snug">{circ.title}</h3>
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded shrink-0 ${
                    circ.priority === 'HIGH'
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                  }`}>
                    {circ.category}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{circ.content}</p>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-850">
                  <span>Issued by: {circ.author}</span>
                  <span className="font-mono">{circ.date}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-400 text-center py-6">No recent notices published.</div>
          )}
        </div>
      </div>
    </div>
  );
};
