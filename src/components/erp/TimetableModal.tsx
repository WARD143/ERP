import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { X, Calendar, Clock, MapPin, User, CheckCircle2 } from 'lucide-react';

interface TimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TimetableModal: React.FC<TimetableModalProps> = ({ isOpen, onClose }) => {
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeDay, setActiveDay] = useState<string>('Monday');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getTimetable()
        .then(res => {
          setTimetable(res.timetable);
          // Highlight current day if weekday
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const today = dayNames[new Date().getDay()];
          if (res.timetable.some(t => t.day === today)) {
            setActiveDay(today);
          } else {
            setActiveDay('Monday');
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentDaySchedule = timetable.find(t => t.day === activeDay);

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
          <Calendar className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-base font-bold text-slate-100">Official Class Lecture & Lab Timetable</h2>
            <p className="text-xs text-slate-400">Department of CSE · Semester 5 (Section A & B)</p>
          </div>
        </div>

        {/* Day Switcher */}
        <div className="flex items-center gap-2 my-4 overflow-x-auto pb-1">
          {timetable.map((t) => (
            <button
              key={t.day}
              onClick={() => setActiveDay(t.day)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeDay === t.day
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {t.day}
            </button>
          ))}
        </div>

        {/* Periods List */}
        <div className="space-y-3 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading daily schedule...</div>
          ) : currentDaySchedule ? (
            currentDaySchedule.periods.map((period: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-300">{period.code}</span>
                      <span className="text-xs font-semibold text-slate-100">{period.subject}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>{period.faculty}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-mono text-slate-300">{period.room}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="font-mono text-xs font-semibold text-indigo-300 px-2.5 py-1 bg-indigo-950/40 border border-indigo-900/50 rounded shrink-0">
                  {period.time}
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-400 text-center py-6">No scheduled periods for {activeDay}.</div>
          )}
        </div>
      </div>
    </div>
  );
};
