import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { CsvImportModal } from '../../components/common/CsvImportModal';
import { FileSpreadsheet, Upload, RotateCcw, CheckCircle2, Database, Shield } from 'lucide-react';

export const DataManagement: React.FC = () => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [resetting, setResetting] = useState<boolean>(false);
  const [resetMsg, setResetMsg] = useState<string>('');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    api.getAuditLogs().then(res => setAuditLogs(res.logs)).catch(console.error);
  }, []);

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset the SQLite database to fresh initial archetypes?')) return;

    setResetting(true);
    setResetMsg('');
    try {
      const res = await api.resetDatabase();
      setResetMsg(res.message);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      alert('Reset failed: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
          <span>Academic Data Ingestion & Database Management</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Import examination marks, attendance sheets, and calibrate persistent storage
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Import Card */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Batch CSV Marks & Attendance Ingestion</h2>
              <p className="text-xs text-slate-400">Real-time row validation with instant risk recalculation</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Ingest continuous evaluation internal marks (IA-1, IA-2, Mid-Term, Assignments) or lecture attendance logs directly into the relational SQLite schema. Format errors, missing fields, or invalid scores exceeding maximum limits are captured and flagged before storage.
          </p>

          <div className="pt-2">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Launch CSV Ingestion Modal</span>
            </button>
          </div>
        </div>

        {/* Database Baseline Reset Card */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Seed Data & Database Re-initialization</h2>
              <p className="text-xs text-slate-400">Reset test environment to pristine demo archetypes</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Restores all 6 student personas (High Performer, Improving, Declining, Low Attendance, Inconsistent, Urgent Intervention), 5 core CSE subjects, assessment records, and pre-calculated risk evaluations to the official baseline state.
          </p>

          {resetMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{resetMsg} Reloading...</span>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleReset}
              disabled={resetting}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/80 rounded-lg transition-colors"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
              <span>{resetting ? 'Re-initializing...' : 'Reset Database to Baseline'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audit Logs Section */}
      <div className="mt-8 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-slate-100">System Security & Audit Logs</h2>
        </div>
        
        {auditLogs.length === 0 ? (
          <p className="text-xs text-slate-400">No audit logs found.</p>
        ) : (
          <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
            {auditLogs.map((log: any) => (
              <div key={log.id} className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-xs flex items-start gap-4">
                <div className="shrink-0 text-slate-400">
                  {new Date(log.created_at).toLocaleString()}
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-indigo-300">{log.action}</span>
                  <p className="text-slate-300 mt-0.5">{log.target}</p>
                </div>
                <div className="shrink-0 font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded">
                  {log.actor}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CsvImportModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
};
