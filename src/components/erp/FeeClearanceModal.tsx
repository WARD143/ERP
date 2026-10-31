import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { X, CreditCard, CheckCircle2, ShieldCheck, Download } from 'lucide-react';

interface FeeClearanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
}

export const FeeClearanceModal: React.FC<FeeClearanceModalProps> = ({
  isOpen,
  onClose,
  studentId
}) => {
  const [fee, setFee] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen && studentId) {
      setLoading(true);
      api.getFeeClearance(studentId)
        .then(res => setFee(res))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, studentId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 my-6 max-h-[92vh] flex flex-col text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <CreditCard className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="text-base font-bold text-slate-100">Institutional Accounts & Scholarship Clearance</h2>
            <p className="text-xs text-slate-400">Finance & Fee Office · Semester 5 Examination Clearance</p>
          </div>
        </div>

        {loading || !fee ? (
          <div className="py-12 text-center text-xs text-slate-400">Checking finance records...</div>
        ) : (
          <div className="space-y-4 my-4">
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-emerald-300">Financial Clearance Approved</div>
                  <div className="text-[11px] text-emerald-400/80">All tuition and laboratory dues cleared for Semester 5.</div>
                </div>
              </div>
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-emerald-900/60 text-emerald-200 rounded">
                100% CLEARED
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Tuition Fee Standing</span>
                <span className="font-mono font-semibold text-emerald-400">{fee.tuitionFeeStatus}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Examination Fee</span>
                <span className="font-mono font-semibold text-emerald-400">{fee.examinationFeeStatus}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Central Library Clearance</span>
                <span className="font-mono font-semibold text-emerald-400">{fee.libraryDues}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between">
                <span className="text-slate-400">State Scholarship Award</span>
                <span className="font-semibold text-indigo-300">{fee.scholarshipCategory}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Scholarship Benefit Amount</span>
                <span className="font-mono font-bold text-emerald-400">{fee.scholarshipSanctioned}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
