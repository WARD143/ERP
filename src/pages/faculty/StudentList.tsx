import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StudentDetailModal } from './StudentDetailModal';
import { RiskBadge } from '../../components/common/RiskBadge';
import { Search, Filter, ArrowUpDown, ChevronRight, TrendingUp, TrendingDown, Minus, Plus } from 'lucide-react';

interface StudentListProps {
  onOpenInterventionModal?: (studentId: string) => void;
}

export const StudentList: React.FC<StudentListProps> = ({ onOpenInterventionModal }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [trendFilter, setTrendFilter] = useState<string>('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (riskFilter !== 'ALL') params.riskLevel = riskFilter;
      if (sectionFilter !== 'ALL') params.section = sectionFilter;
      if (trendFilter !== 'ALL') params.trend = trendFilter;

      const res = await api.getFacultyStudents(params);
      setStudents(res.students);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, riskFilter, sectionFilter, trendFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Department Student Directory & Analytics Roster</h1>
        <p className="text-xs text-slate-400 mt-1">
          Search, filter by risk classification, inspect continuous evaluation marks, and trigger academic counseling
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by student name or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Risk Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="p-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="HIGH">High Risk Only</option>
            <option value="MEDIUM">Medium Risk Only</option>
            <option value="LOW">Low Risk Only</option>
          </select>

          {/* Section Filter */}
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="p-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300"
          >
            <option value="ALL">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
          </select>

          {/* Trend Filter */}
          <select
            value={trendFilter}
            onChange={(e) => setTrendFilter(e.target.value)}
            className="p-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300"
          >
            <option value="ALL">All Trajectories</option>
            <option value="IMPROVING">Improving</option>
            <option value="STABLE">Stable</option>
            <option value="DECLINING">Declining</option>
          </select>
        </div>
      </div>

      {/* Student Roster Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Showing <span className="font-semibold text-slate-200">{students.length}</span> students matching filters</span>
          <span className="font-mono text-[11px]">Academic Year 2026–2027</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] border-b border-slate-800 uppercase">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4">CIE GPA</th>
                <th className="py-3 px-4">Attendance</th>
                <th className="py-3 px-4">Trajectory</th>
                <th className="py-3 px-4">Risk Status</th>
                <th className="py-3 px-4">Critical Flags</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">Loading student directory...</td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">No students match current filter criteria.</td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{s.name}</div>
                      <div className="text-[11px] font-mono text-indigo-400">{s.rollNumber}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      Sec {s.section}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-200 font-semibold">
                      {s.gpa.toFixed(2)}
                      <span className="text-[11px] font-normal text-slate-500 ml-1">({s.percentage}%)</span>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums">
                      <span className={s.attendance < 75 ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
                        {s.attendance}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1">
                        {s.trend === 'IMPROVING' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                        {s.trend === 'DECLINING' && <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
                        {s.trend === 'STABLE' && <Minus className="w-3.5 h-3.5 text-slate-400" />}
                        <span className={s.trend === 'IMPROVING' ? 'text-emerald-400' : s.trend === 'DECLINING' ? 'text-rose-400' : 'text-slate-300'}>
                          {s.trend}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <RiskBadge level={s.riskLevel} score={s.riskScore} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {s.flags.lowAttendance && (
                          <span className="px-1.5 py-0.2 text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded">
                            Att &lt; 75%
                          </span>
                        )}
                        {s.flags.declining && (
                          <span className="px-1.5 py-0.2 text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded">
                            Declining Marks
                          </span>
                        )}
                        {s.flags.inconsistent && (
                          <span className="px-1.5 py-0.2 text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded">
                            High Variance
                          </span>
                        )}
                        {!s.flags.lowAttendance && !s.flags.declining && !s.flags.inconsistent && (
                          <span className="text-[11px] text-emerald-400/80">Normal</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedStudentId(s.id)}
                          className="px-2.5 py-1 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
                        >
                          Details
                        </button>
                        {onOpenInterventionModal && (
                          <button
                            onClick={() => onOpenInterventionModal(s.id)}
                            className="p-1 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded"
                            title="Log Intervention"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StudentDetailModal
        studentId={selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
        onScheduleIntervention={onOpenInterventionModal}
      />
    </div>
  );
};
