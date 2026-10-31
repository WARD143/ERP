import React, { useState } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { api } from '../../api/client';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose, onImportComplete }) => {
  const [importType, setImportType] = useState<'MARKS' | 'ATTENDANCE'>('MARKS');
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; successCount: number; errors: string[] } | null>(null);

  if (!isOpen) return null;

  const loadSampleData = () => {
    if (importType === 'MARKS') {
      setCsvText(
`rollNumber,subjectCode,assessmentType,marksObtained,maxMarks
2420030520,CS301,INTERNAL_1,28,30
2420030512,CS301,INTERNAL_1,24,30
2420030684,CS304,INTERNAL_1,15,30
2420030556,CS301,INTERNAL_1,12,30`
      );
    } else {
      setCsvText(
`rollNumber,subjectCode,attendedClasses,totalClasses
2420030520,CS301,46,48
2420030512,CS301,42,48
2420030533,CS303,25,48
2420030556,CS304,28,48`
      );
    }
  };

  const handleImport = async () => {
    if (!csvText.trim()) {
      alert('Please enter or paste CSV content.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const lines = csvText.trim().split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length <= 1) {
        alert('CSV must contain a header row and at least one data row.');
        setLoading(false);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const records: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim());
        if (parts.length < headers.length) continue;

        const row: any = {};
        headers.forEach((h, idx) => {
          row[h] = parts[idx];
        });
        records.push(row);
      }

      const res = await api.importData(importType, records);
      setResult(res);
      if (res.success && res.successCount > 0 && onImportComplete) {
        onImportComplete();
      }
    } catch (err: any) {
      setResult({
        success: false,
        successCount: 0,
        errors: [err.message || 'Failed to process import.']
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Batch Academic Data Import</h2>
            <p className="text-xs text-slate-400">Upload or paste CSV records for continuous evaluation</p>
          </div>
        </div>

        {/* Segmented Type Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 mb-4">
          <button
            type="button"
            onClick={() => { setImportType('MARKS'); setCsvText(''); setResult(null); }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              importType === 'MARKS'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Internal Assessment Marks
          </button>
          <button
            type="button"
            onClick={() => { setImportType('ATTENDANCE'); setCsvText(''); setResult(null); }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              importType === 'ATTENDANCE'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Attendance Records
          </button>
        </div>

        {/* Format Guidance & Sample Button */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
          <span>
            Required Headers: <span className="font-mono text-indigo-300">
              {importType === 'MARKS' ? 'rollNumber,subjectCode,assessmentType,marksObtained,maxMarks' : 'rollNumber,subjectCode,attendedClasses,totalClasses'}
            </span>
          </span>
          <button
            type="button"
            onClick={loadSampleData}
            className="text-indigo-400 hover:text-indigo-300 font-medium underline"
          >
            Load Sample CSV
          </button>
        </div>

        {/* CSV Textarea */}
        <textarea
          rows={7}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder={
            importType === 'MARKS'
              ? "rollNumber,subjectCode,assessmentType,marksObtained,maxMarks\n2420030520,CS301,INTERNAL_1,28,30"
              : "rollNumber,subjectCode,attendedClasses,totalClasses\n2420030520,CS301,46,48"
          }
          className="w-full p-3 text-xs font-mono bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
        />

        {/* Validation Output */}
        {result && (
          <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            {result.successCount > 0 && (
              <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Successfully validated and stored {result.successCount} records. Risk engine re-evaluated!</span>
              </div>
            )}
            {result.errors && result.errors.length > 0 && (
              <div className="space-y-1 mt-2 text-rose-400">
                <div className="flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Validation Warnings ({result.errors.length}):</span>
                </div>
                <ul className="list-disc pl-5 space-y-0.5 max-h-24 overflow-y-auto text-[11px]">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-5 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-2"
          >
            {loading ? 'Validating...' : 'Validate & Import Records'}
          </button>
        </div>
      </div>
    </div>
  );
};
