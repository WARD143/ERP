import React, { useState, useEffect } from 'react';
import {
  Search,
  Command,
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  Bell,
  Lightbulb,
  LineChart,
  Sliders,
  Database,
  HeartHandshake,
  Users,
  BarChart3,
  SlidersHorizontal,
  FileSpreadsheet,
  FileText,
  CreditCard,
  Building2,
  Calendar,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
  onOpenErpModal?: (modalName: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenErpModal
}) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Parent handles opening or we trigger
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const role = user?.role || 'STUDENT';

  const items = [
    { id: 'student-dashboard', label: 'Overview Dashboard', category: 'Navigation', icon: LayoutDashboard, roles: ['STUDENT'] },
    { id: 'academic-performance', label: 'Academic Performance & Marks', category: 'Navigation', icon: GraduationCap, roles: ['STUDENT'] },
    { id: 'subject-analytics', label: 'Subject Analytics & Grade Breakdown', category: 'Navigation', icon: BookOpen, roles: ['STUDENT'] },
    { id: 'performance-trends', label: 'Performance Trends & Timeline', category: 'Navigation', icon: TrendingUp, roles: ['STUDENT'] },
    { id: 'weak-areas', label: 'Weak Areas Detection & Alerts', category: 'Intelligence', icon: AlertTriangle, roles: ['STUDENT'] },
    { id: 'risk-status', label: 'Risk Assessment & Explainability', category: 'Intelligence', icon: ShieldAlert, roles: ['STUDENT'] },
    { id: 'student-alerts', label: 'Early Warning Notifications', category: 'Intelligence', icon: Bell, roles: ['STUDENT'] },
    { id: 'recommendations', label: 'Personalized AI Study Plan', category: 'Intelligence', icon: Lightbulb, roles: ['STUDENT'] },
    { id: 'forecast', label: 'Performance Forecasting & Projections', category: 'Intelligence', icon: LineChart, roles: ['STUDENT'] },
    { id: 'what-if', label: 'What-If Simulation Sandbox', category: 'Tools', icon: Sliders, roles: ['STUDENT'] },
    { id: 'mentoring-portal', label: 'Proctorial Mentoring Desk', category: 'Tools', icon: HeartHandshake, roles: ['STUDENT', 'FACULTY'] },
    { id: 'uci-dataset', label: 'UCI Student Benchmark Dataset & ML', category: 'Intelligence', icon: Database, roles: ['STUDENT', 'FACULTY', 'ADMIN'] },
    
    // Faculty
    { id: 'faculty-dashboard', label: 'Faculty Overview', category: 'Navigation', icon: LayoutDashboard, roles: ['FACULTY'] },
    { id: 'student-list', label: 'Student Directory & Advanced Filters', category: 'Faculty', icon: Users, roles: ['FACULTY'] },
    { id: 'faculty-subjects', label: 'Subject-Wise Class View', category: 'Faculty', icon: BookOpen, roles: ['FACULTY'] },
    { id: 'risk-radar', label: 'Risk Early Warnings Radar', category: 'Faculty', icon: ShieldAlert, roles: ['FACULTY'] },
    { id: 'faculty-alerts', label: 'Critical Intervention Queue', category: 'Faculty', icon: Bell, roles: ['FACULTY'] },
    { id: 'interventions', label: 'Counseling & Intervention Manager', category: 'Faculty', icon: FileSpreadsheet, roles: ['FACULTY'] },

    // Admin
    { id: 'admin-dashboard', label: 'Administrator Command Center', category: 'Navigation', icon: LayoutDashboard, roles: ['ADMIN'] },
    { id: 'cohort-analytics', label: 'Cohort Performance Analytics', category: 'Admin', icon: BarChart3, roles: ['ADMIN'] },
    { id: 'risk-config', label: 'Risk Engine Sensitivity Weights', category: 'Admin', icon: SlidersHorizontal, roles: ['ADMIN'] },
    { id: 'data-management', label: 'CSV Data Sync & Batch Recalculation', category: 'Admin', icon: FileSpreadsheet, roles: ['ADMIN'] },

    // ERP Services
    { id: 'erp-hallticket', label: 'Download Hall Ticket / Admit Card', category: 'ERP Services', icon: FileText, roles: ['STUDENT', 'FACULTY', 'ADMIN'], isErp: true },
    { id: 'erp-gradecard', label: 'Semester Grade Card & Transcripts', category: 'ERP Services', icon: GraduationCap, roles: ['STUDENT', 'FACULTY', 'ADMIN'], isErp: true },
    { id: 'erp-timetable', label: 'Weekly Academic Schedule / Timetable', category: 'ERP Services', icon: Calendar, roles: ['STUDENT', 'FACULTY', 'ADMIN'], isErp: true },
    { id: 'erp-circulars', label: 'University Circulars & Notices', category: 'ERP Services', icon: Bell, roles: ['STUDENT', 'FACULTY', 'ADMIN'], isErp: true },
    { id: 'erp-feeclearance', label: 'Accounts & Fee Clearance Verification', category: 'ERP Services', icon: CreditCard, roles: ['STUDENT', 'FACULTY', 'ADMIN'], isErp: true },
  ];

  const filtered = items.filter(
    (item) =>
      item.roles.includes(role) &&
      (item.label.toLowerCase().includes(query.toLowerCase()) ||
       item.category.toLowerCase().includes(query.toLowerCase()))
  );

  const handleSelect = (item: any) => {
    if (item.isErp && onOpenErpModal) {
      const modalKey = item.id.replace('erp-', '');
      onOpenErpModal(modalKey);
    } else {
      onNavigateTab(item.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Type a command or search modules, analytics, ERP..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
          <button onClick={onClose} className="p-1 ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-white sm:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/50">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No matching modules or actions found.
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left hover:bg-indigo-50/80 dark:hover:bg-slate-800/60 group transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-slate-400">{item.category}</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center gap-1">
                    Jump to <span>→</span>
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>Navigation: <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-200 dark:bg-slate-800 rounded">↑</kbd> <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-200 dark:bg-slate-800 rounded">↓</kbd></span>
            <span>Select: <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-200 dark:bg-slate-800 rounded">↵</kbd></span>
          </div>
          <span>AKTERA Intelligence</span>
        </div>
      </div>
    </div>
  );
};

