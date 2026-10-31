import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { X, Award, Printer, BookOpen, CheckCircle2 } from 'lucide-react';

interface GradeCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
}

export const GradeCardModal: React.FC<GradeCardModalProps> = ({
  isOpen,
  onClose,
  studentId
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen && studentId) {
      setLoading(true);
      api.getGradeCard(studentId)
        .then(res => setData(res))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, studentId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 my-6 max-h-[92vh] flex flex-col text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {loading || !data ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Generating Official Grade Card from University Registrar Database...
          </div>
        ) : (
          <div className="overflow-y-auto pr-2 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-300">University Provisional Grade Transcript</span>
              </div>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Grade Card</span>
              </button>
            </div>

            <div className="bg-white text-slate-900 rounded-xl p-6 border-2 border-slate-300 shadow-sm font-sans space-y-4">
              <div className="text-center border-b-2 border-slate-800 pb-3">
                <h1 className="text-xl font-black text-slate-950 uppercase">{data.institution}</h1>
                <div className="text-xs font-bold text-slate-700 uppercase mt-0.5">Office of the Controller of Examinations</div>
                <div className="text-xs font-bold text-indigo-950 uppercase mt-1">
                  Provisional Academic Grade Transcript · {data.degree} ({data.branch})
                </div>
              </div>

              {/* Student Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Student Name</span>
                  <span className="font-bold text-slate-900">{data.studentName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">University Roll No</span>
                  <span className="font-mono font-bold text-slate-900">{data.rollNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Cumulative CGPA</span>
                  <span className="font-mono text-sm font-black text-indigo-900">{data.cgpa} / 10.0</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Total Credits Earned</span>
                  <span className="font-mono text-sm font-bold text-slate-900">{data.totalCreditsEarned} Credits</span>
                </div>
              </div>

              {/* Semester Progression Table */}
              <div>
                <div className="text-[11px] font-bold uppercase text-slate-800 mb-1.5">
                  Semester Grade Point Progression Record
                </div>
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 text-slate-700 font-mono text-[10px] border-b border-slate-300 uppercase">
                    <tr>
                      <th className="py-2 px-3 border-r border-slate-300">Semester Term</th>
                      <th className="py-2 px-3 border-r border-slate-300">Credits Registered</th>
                      <th className="py-2 px-3 border-r border-slate-300">SGPA</th>
                      <th className="py-2 px-3">Standing & Division</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.semesterHistory.map((sem: any, idx: number) => (
                      <tr key={idx} className={idx === data.semesterHistory.length - 1 ? 'bg-indigo-50/50 font-semibold' : ''}>
                        <td className="py-2 px-3 font-medium text-slate-900 border-r border-slate-200">{sem.sem}</td>
                        <td className="py-2 px-3 font-mono text-slate-700 border-r border-slate-200">{sem.credits}</td>
                        <td className="py-2 px-3 font-mono text-indigo-950 font-bold border-r border-slate-200">{sem.sgpa}</td>
                        <td className="py-2 px-3 text-[11px] text-slate-800">{sem.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Current Semester Course Assessment Summary */}
              <div>
                <div className="text-[11px] font-bold uppercase text-slate-800 mb-1.5">
                  Semester 5 Continuous Evaluation (CIE) Breakdown
                </div>
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 text-slate-700 font-mono text-[10px] border-b border-slate-300 uppercase">
                    <tr>
                      <th className="py-1.5 px-3 border-r border-slate-300">Code</th>
                      <th className="py-1.5 px-3 border-r border-slate-300">Subject Name</th>
                      <th className="py-1.5 px-3 border-r border-slate-300">Credits</th>
                      <th className="py-1.5 px-3 border-r border-slate-300">CIE %</th>
                      <th className="py-1.5 px-3">Internal Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800 font-sans">
                    {data.currentSubjects.map((sub: any) => (
                      <tr key={sub.code}>
                        <td className="py-1.5 px-3 font-mono font-bold border-r border-slate-200">{sub.code}</td>
                        <td className="py-1.5 px-3 border-r border-slate-200">{sub.name}</td>
                        <td className="py-1.5 px-3 font-mono border-r border-slate-200">{sub.credits}</td>
                        <td className="py-1.5 px-3 font-mono font-bold text-indigo-900 border-r border-slate-200">{sub.weightedScorePercentage}%</td>
                        <td className="py-1.5 px-3 text-[11px] font-medium">{sub.riskStatus === 'HIGH' ? 'Needs Improvement' : 'Satisfactory'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-4 border-t-2 border-slate-800 flex items-center justify-between text-[11px] text-slate-600">
                <span>Scale: {data.evaluationScale}</span>
                <span className="font-bold uppercase text-slate-800">Apex State Technological Examination Division</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
