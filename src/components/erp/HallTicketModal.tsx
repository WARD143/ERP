import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { X, Printer, ShieldCheck, AlertTriangle, QrCode, FileText, CheckCircle2 } from 'lucide-react';

interface HallTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
}

export const HallTicketModal: React.FC<HallTicketModalProps> = ({
  isOpen,
  onClose,
  studentId
}) => {
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen && studentId) {
      setLoading(true);
      api.getHallTicket(studentId)
        .then(res => setTicket(res))
        .catch(err => console.error('Failed to load hall ticket:', err))
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

        {loading || !ticket ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Generating Official Examination Hall Ticket from ERP Examination Server...
          </div>
        ) : (
          <div className="overflow-y-auto pr-2 space-y-5">
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-300">Official ERP Examination Admit Card</span>
              </div>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </div>

            {/* Printable Hall Ticket Document */}
            <div className="bg-white text-slate-900 rounded-xl p-6 border-2 border-slate-300 shadow-sm font-sans space-y-5">
              {/* Institution Header */}
              <div className="text-center border-b-2 border-slate-800 pb-4">
                <div className="text-[11px] font-mono tracking-widest uppercase text-slate-500 font-semibold">
                  {ticket.accreditation}
                </div>
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-950 uppercase mt-0.5">
                  {ticket.institution}
                </h1>
                <div className="text-xs font-bold text-indigo-900 uppercase tracking-wide mt-1">
                  {ticket.examinationName} · {ticket.academicYear}
                </div>
                <div className="inline-block mt-2 px-3 py-0.5 bg-slate-100 border border-slate-300 text-[11px] font-mono font-bold text-slate-800 rounded">
                  HALL TICKET NO: {ticket.hallTicketNumber}
                </div>
              </div>

              {/* Eligibility & Debarment Alert Banner */}
              <div className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                ticket.isEligible
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : ticket.debarmentStatus === 'CONDONATION_REQUIRED'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}>
                <div className="flex items-center gap-2 font-medium">
                  {ticket.isEligible ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>
                    <strong>Eligibility Standing:</strong> {ticket.debarmentRemarks}
                  </span>
                </div>
                <div className="font-mono text-[11px] font-bold shrink-0 ml-2">
                  Attendance: {ticket.cumulativeAttendance}% {ticket.isEligible ? '(Passed ≥75%)' : '(Deficit <75%)'}
                </div>
              </div>

              {/* Student Details & Photo Section */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 pb-2 border-b border-slate-200 text-xs">
                <div className="col-span-2 sm:col-span-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">Candidate Name</span>
                      <span className="font-bold text-slate-900 text-sm">{ticket.studentName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">University Roll No</span>
                      <span className="font-mono font-bold text-slate-900">{ticket.rollNumber}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">Program & Branch</span>
                      <span className="font-medium text-slate-800">{ticket.department}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">Semester & Section</span>
                      <span className="font-medium text-slate-800">Semester 5 · Section {ticket.section}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">Allotted Exam Center</span>
                    <span className="font-semibold text-indigo-900">{ticket.examCenter}</span>
                  </div>
                </div>

                {/* Candidate Photo Box */}
                <div className="flex flex-col items-center justify-center p-2 bg-slate-50 border border-slate-300 rounded text-center">
                  <div className="w-20 h-24 bg-slate-200 border border-slate-400 rounded flex flex-col items-center justify-center text-slate-500 text-[10px] font-mono">
                    <span className="font-bold text-slate-700 text-xs">{ticket.rollNumber.slice(-4)}</span>
                    <span>CSE DEPT</span>
                    <span>PHOTO</span>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 uppercase font-semibold">Verified ERP ID</span>
                </div>
              </div>

              {/* Registered Subject Schedule Table */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800 mb-2">
                  Authorized Course Registrations & Schedule
                </div>
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 text-slate-700 font-mono text-[10px] border-b border-slate-300 uppercase">
                    <tr>
                      <th className="py-2 px-3 border-r border-slate-300">Course Code</th>
                      <th className="py-2 px-3 border-r border-slate-300">Course Title</th>
                      <th className="py-2 px-3 border-r border-slate-300">Exam Date</th>
                      <th className="py-2 px-3 border-r border-slate-300">Session</th>
                      <th className="py-2 px-3">Invigilator Sign</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-sans">
                    {ticket.examSchedule.map((exam: any) => (
                      <tr key={exam.code}>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900 border-r border-slate-200">{exam.code}</td>
                        <td className="py-2 px-3 text-slate-800 border-r border-slate-200">{exam.subject}</td>
                        <td className="py-2 px-3 font-mono text-slate-700 border-r border-slate-200">{exam.date}</td>
                        <td className="py-2 px-3 text-slate-700 border-r border-slate-200 text-[11px]">{exam.time}</td>
                        <td className="py-2 px-3 text-slate-400 font-mono text-[10px]">Pending</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Official Signatures & Barcode */}
              <div className="pt-4 border-t-2 border-slate-800 flex items-end justify-between text-xs">
                <div className="space-y-1">
                  <div className="font-mono text-xs text-slate-600 tracking-wider">
                    ||| | ||||| |||| || ||||| ||||||| | ||
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    AUTH TOKEN: {ticket.hallTicketNumber}-REG2026
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-32 border-b border-slate-400 pb-1 font-signature text-xs italic text-slate-600">
                    {ticket.studentName.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase mt-0.5 font-semibold">Candidate Signature</div>
                </div>

                <div className="text-center">
                  <div className="w-36 border-b border-slate-800 pb-1 font-mono text-xs font-bold text-slate-800">
                    V. R. Shastri
                  </div>
                  <div className="text-[10px] text-slate-700 font-bold uppercase mt-0.5">
                    Controller of Examinations
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
