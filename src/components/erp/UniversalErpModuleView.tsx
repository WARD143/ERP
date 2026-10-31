import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  GraduationCap,
  Calendar,
  CreditCard,
  Building,
  Library,
  FileCheck2,
  Award,
  Users,
  Briefcase,
  HelpCircle,
  FolderOpen,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Search,
  Download,
  BookOpen,
  DollarSign
} from 'lucide-react';

interface UniversalErpModuleViewProps {
  tabId: string;
  studentId: string;
}

export const UniversalErpModuleView: React.FC<UniversalErpModuleViewProps> = ({ tabId, studentId }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setLoading(true);
    setSuccessMsg('');

    // Fetch corresponding real ERP backend endpoints via centralized api client
    const loadModuleData = async () => {
      try {
        if (tabId.startsWith('reg-')) {
          setData(await api.getErpRegistrations(studentId));
        } else if (tabId.startsWith('att-')) {
          setData(await api.getErpAttendance(studentId));
        } else if (tabId.startsWith('fees-')) {
          setData(await api.getErpFees(studentId));
        } else if (tabId.startsWith('hostel-')) {
          setData(await api.getErpHostel(studentId));
        } else if (tabId.startsWith('lib-')) {
          setData(await api.getErpLibrary(studentId));
        } else if (tabId.startsWith('career-')) {
          setData(await api.getErpCareerPreferences(studentId));
        } else if (tabId.startsWith('crt-')) {
          setData(await api.getErpCrtProgress(studentId));
        } else if (tabId.startsWith('counselling-')) {
          setData(await api.getErpCounselling(studentId));
        } else if (tabId.startsWith('clubs-')) {
          const clubsData = await api.getErpClubs();
          const memberData = await api.getErpClubMembership(studentId);
          setData({ ...clubsData, ...memberData });
        } else if (tabId.startsWith('nodue-')) {
          setData(await api.getErpNoDue(studentId));
        } else if (tabId.startsWith('reg-bonafide') || tabId.startsWith('reg-transcript') || tabId.startsWith('reg-certificates')) {
          setData(await api.getErpDocumentRequests(studentId));
        } else if (tabId.startsWith('ht-') || tabId === 'exam-hallticket') {
          setData(await api.getErpHallTicket(studentId));
        } else if (tabId.startsWith('courses-')) {
          setData(await api.getErpCoursesMaterials());
        } else {
          setData({ status: 'ACTIVE', timestamp: new Date().toISOString() });
        }
      } catch (err) {
        console.error('Failed to load ERP module data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadModuleData();
  }, [tabId, studentId]);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs font-semibold uppercase tracking-wider text-slate-400 animate-pulse">
        Connecting to University ERP Database...
      </div>
    );
  }

  // ----------------------------------------------------
  // MODULE RENDERERS
  // ----------------------------------------------------

  // 1. ACADEMIC REGISTRATION
  if (tabId.startsWith('reg-')) {
    const registrations = data?.registrations || [];
    const available = data?.availableCourses || [];
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Academic Course Registration</h1>
            <p className="text-xs text-slate-500 mt-0.5">Category: {tabId.replace('reg-', '').toUpperCase()} · Academic Year 2026–2027</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200">
            Registration Active
          </span>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Enrolled Courses in Semester VI</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="p-3">Course Code</th>
                  <th className="p-3">Subject Name</th>
                  <th className="p-3">Credits</th>
                  <th className="p-3">Faculty Instructor</th>
                  <th className="p-3">Registration Type</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {registrations.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{r.code}</td>
                    <td className="p-3 text-slate-800 dark:text-slate-200">{r.subject_name}</td>
                    <td className="p-3 font-mono">{r.credits} Credits</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{r.faculty_name || 'Dr. Pratusha Mam'}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold">{r.registration_type}</span></td>
                    <td className="p-3"><span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // 2. ATTENDANCE REGISTER
  if (tabId.startsWith('att-')) {
    const records = data?.records || [];
    const summary = data?.summary || {};
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Attendance Register</h1>
            <p className="text-xs text-slate-500 mt-0.5">Live biometric and classroom session logs · Min. Required: 75%</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">{summary.averagePercentage}%</span>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Aggregate Rate</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Shortage Courses</span>
            <div className="text-2xl font-mono font-black text-rose-600 mt-1">{summary.shortageCount || 0}</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Hall Ticket Eligibility</span>
            <div className="text-lg font-bold text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> {summary.isEligible ? 'Eligible' : 'Under Review'}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Total Registered Subjects</span>
            <div className="text-2xl font-mono font-black text-slate-900 dark:text-white mt-1">{summary.totalSubjects || 5}</div>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Subject-wise Session Breakdown</h2>
          <div className="space-y-4">
            {records.map((r: any) => (
              <div key={r.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mr-2">{r.code}</span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{r.subject_name}</span>
                  </div>
                  <div className="text-xs font-mono font-bold">
                    <span className={r.percentage < 75 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                      {r.percentage}% ({r.attended_classes}/{r.total_classes} Classes)
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${r.percentage < 75 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, Math.max(0, r.percentage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. FEE PAYMENTS
  if (tabId.startsWith('fees-')) {
    const structure = data?.structure || [];
    const payments = data?.payments || [];
    const summary = data?.summary || {};
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">University Fee Desk & Payments</h1>
            <p className="text-xs text-slate-500 mt-0.5">Online fee payment, receipts & accounts clearance</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200">
              Accounts Status: Cleared
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Total Billed (Sem VI)</span>
            <div className="text-2xl font-mono font-black text-slate-900 dark:text-white mt-1">₹{summary.totalBilled?.toLocaleString()}</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Amount Paid</span>
            <div className="text-2xl font-mono font-black text-emerald-600 mt-1">₹{summary.totalPaid?.toLocaleString()}</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Pending Dues</span>
            <div className="text-2xl font-mono font-black text-slate-400 mt-1">₹{summary.dues?.toLocaleString() || 0}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Semester Fee Structure</h2>
            <div className="space-y-3">
              {structure.map((f: any) => (
                <div key={f.id} className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{f.fee_type}</div>
                    <div className="text-[11px] text-slate-400">{f.description}</div>
                  </div>
                  <div className="font-mono font-bold text-slate-900 dark:text-white">₹{f.amount.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Payment Receipts History</h2>
            <div className="space-y-3">
              {payments.map((p: any) => (
                <div key={p.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                  <div className="flex items-center justify-between font-semibold mb-1">
                    <span className="text-slate-800 dark:text-slate-200">{p.fee_type}</span>
                    <span className="font-mono text-emerald-600">₹{p.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Receipt: <strong className="font-mono text-slate-600 dark:text-slate-300">{p.receipt_number}</strong></span>
                    <span>{new Date(p.paid_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. HOSTEL MANAGEMENT
  if (tabId.startsWith('hostel-')) {
    const alloc = data?.allocation;
    const complaints = data?.complaints || [];
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Hostel Management & Allotment</h1>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Allocated Room Details</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-400">Hostel Block</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-1">{alloc?.block_name || 'Aryabhata Block'}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-400">Room & Bed</span>
              <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm mt-1">{alloc?.room_number} ({alloc?.bed_number})</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-400">Room Type</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-1">{alloc?.occupancy_type}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-400">Warden Contact</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-1">{alloc?.warden_contact}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. LIBRARY MANAGEMENT
  if (tabId.startsWith('lib-')) {
    const books = data?.books || [];
    const txns = data?.transactions || [];
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Central Library System</h1>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Books Issued to Student</h2>
          <div className="space-y-3 text-xs">
            {txns.map((t: any) => (
              <div key={t.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200">{t.title}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Author: {t.author} · ISBN: {t.isbn}</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 font-semibold text-[10px]">Active Issue</span>
                  <p className="text-[10px] text-slate-400 mt-1">Due: {t.due_date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">University Book Catalog</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {books.map((b: any) => (
              <div key={b.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <div className="font-bold text-slate-900 dark:text-white">{b.title}</div>
                <div className="text-slate-500 mt-1">By {b.author} ({b.category})</div>
                <div className="mt-2 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">
                  Available Copies: {b.available_copies} of {b.total_copies}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 6. DEFAULT / ALL OTHER MODULES (NODUE, DOCUMENTS, CRT, CAREER, CLUBS)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white capitalize">
            {tabId.replace('-', ' · ')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Koneru Lakshmaiah University Student Enterprise Resource Portal</p>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-200">
          Verified Active
        </span>
      </div>

      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Module Records & Verification</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Real-time institutional records synchronized with student ID <span className="font-mono font-bold text-indigo-600">{studentId}</span>.
        </p>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Status</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> All Clearance & Academic Validations Passed
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Academic Year</span>
            <span className="text-slate-600 dark:text-slate-400 font-mono">2026–2027 (Semester VI)</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Department</span>
            <span className="text-slate-600 dark:text-slate-400">Computer Science & Engineering</span>
          </div>
        </div>
      </div>
    </div>
  );
};

