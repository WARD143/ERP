import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Bell,
  Lightbulb,
  LineChart,
  Sliders,
  Users,
  ShieldAlert,
  ClipboardList,
  SlidersHorizontal,
  FileSpreadsheet,
  BarChart3,
  HeartHandshake,
  Database,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  FileText,
  CreditCard,
  Building,
  Library,
  Briefcase,
  Award,
  Compass,
  FileCheck2,
  HelpCircle,
  FolderOpen,
  UserCheck,
  CheckCircle2,
  Zap,
  Target,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  alertCount?: number;
}

interface SidebarCategory {
  id: string;
  title: string;
  icon: any;
  submodules: {
    id: string;
    label: string;
    badge?: number;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, alertCount = 0 }) => {
  const { user } = useAuth();
  const role = user?.role || 'STUDENT';
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Expanded categories state
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'home': true,
    'academic-reg': false,
    'attendance': false,
    'career': false,
    'courses': false,
    'crt': false,
    'counselling': false,
    'clubs': false,
    'exam': false,
    'feedback': false,
    'fees': false,
    'hostel': false,
    'hall-ticket': false,
    'infra': false,
    'library': false,
    'cgpa': false,
    'nodue': false,
    'profile': false,
    'psycho': false,
    'registrar': false,
    'ai-intelligence': true
  });

  const toggleCategory = (catId: string) => {
    if (isCollapsed) setIsCollapsed(false);
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  // -------------------------------------------------------------------------
  // 20 Explicit KL University Student Portal Categories + AKTERA AI Engine
  // -------------------------------------------------------------------------
  const studentCategories: SidebarCategory[] = [
    {
      id: 'home',
      title: '1. HOME',
      icon: LayoutDashboard,
      submodules: [
        { id: 'student-dashboard', label: 'Student Dashboard' },
        { id: 'student-alerts', label: 'Notifications', badge: alertCount },
        { id: 'profile-view', label: 'Profile' }
      ]
    },
    {
      id: 'ai-intelligence',
      title: 'AKTERA AI & PREDICTIONS',
      icon: Sparkles,
      submodules: [
        { id: 'uci-dataset', label: 'UCI Dataset & ML Explorer' },
        { id: 'weak-areas', label: 'Weak Areas Detection' },
        { id: 'risk-status', label: 'Risk Status & Reasons' },
        { id: 'recommendations', label: 'Personalized AI Plan' },
        { id: 'forecast', label: 'Performance Forecast' },
        { id: 'what-if', label: 'What-If Simulation Sandbox' }
      ]
    },
    {
      id: 'academic-reg',
      title: '2. ACADEMIC REGISTRATION',
      icon: GraduationCap,
      submodules: [
        { id: 'reg-regular', label: 'Regular Course Registration' },
        { id: 'reg-betterment', label: 'Betterment Course Registration' },
        { id: 'reg-recourse', label: 'Fail/ReCourse Registration' },
        { id: 'reg-detain', label: 'Detain Course Registration' },
        { id: 'reg-certificate', label: 'Certificate Course Registration' }
      ]
    },
    {
      id: 'attendance',
      title: '3. ATTENDANCE REGISTER',
      icon: Calendar,
      submodules: [
        { id: 'att-subjectwise', label: 'Subject-wise Attendance' },
        { id: 'att-history', label: 'Attendance History' },
        { id: 'att-percentage', label: 'Attendance Percentage' },
        { id: 'att-shortage', label: 'Attendance Shortage Report' }
      ]
    },
    {
      id: 'career',
      title: '4. CAREER CHOICE',
      icon: Compass,
      submodules: [
        { id: 'career-pref', label: 'Career Preferences' },
        { id: 'career-assessment', label: 'Career Assessment' },
        { id: 'career-recommendations', label: 'Career Recommendations' }
      ]
    },
    {
      id: 'courses',
      title: '5. COURSES',
      icon: BookOpen,
      submodules: [
        { id: 'courses-assignments', label: 'Assignments' },
        { id: 'courses-handouts', label: 'Handouts' },
        { id: 'courses-material', label: 'Material' },
        { id: 'courses-internals', label: 'Internals' },
        { id: 'courses-feedback', label: 'Session Feedback' }
      ]
    },
    {
      id: 'crt',
      title: '6. CRT (CAMPUS PLACEMENT)',
      icon: Target,
      submodules: [
        { id: 'crt-schedule', label: 'Training Schedule' },
        { id: 'crt-aptitude', label: 'Aptitude Preparation' },
        { id: 'crt-coding', label: 'Coding Practice' },
        { id: 'crt-mock', label: 'Mock Tests' },
        { id: 'crt-progress', label: 'Training Progress' }
      ]
    },
    {
      id: 'counselling',
      title: '7. COUNSELLING DIARY',
      icon: HeartHandshake,
      submodules: [
        { id: 'counselling-mentor', label: 'Mentor Details' },
        { id: 'counselling-appointments', label: 'Counselling Appointments' },
        { id: 'counselling-history', label: 'Meeting History' },
        { id: 'counselling-followup', label: 'Follow-up Records' }
      ]
    },
    {
      id: 'clubs',
      title: '8. CLUBS & ACTIVITIES',
      icon: Users,
      submodules: [
        { id: 'clubs-register', label: 'Register to Club' },
        { id: 'clubs-events', label: 'Club Events' },
        { id: 'clubs-sil', label: 'My SIL Points' },
        { id: 'clubs-projects', label: 'Projects & Consultations' },
        { id: 'clubs-internships', label: 'Fellowships & Internships' },
        { id: 'clubs-trainings', label: 'Trainings List' }
      ]
    },
    {
      id: 'exam',
      title: '9. EXAMINATION SECTION',
      icon: FileCheck2,
      submodules: [
        { id: 'exam-results', label: 'End Exam Result' },
        { id: 'exam-seating', label: 'Exam Seating Room' },
        { id: 'exam-scripts', label: 'In-Sem Answer Scripts' },
        { id: 'exam-take', label: 'Take an Exam' },
        { id: 'exam-hallticket', label: 'Hall Ticket' }
      ]
    },
    {
      id: 'feedback',
      title: '10. FEEDBACK',
      icon: HelpCircle,
      submodules: [
        { id: 'feedback-course', label: 'Course Feedback' },
        { id: 'feedback-faculty', label: 'Faculty Feedback' },
        { id: 'feedback-infra', label: 'Infrastructure Feedback' }
      ]
    },
    {
      id: 'fees',
      title: '11. FEE PAYMENTS',
      icon: CreditCard,
      submodules: [
        { id: 'fees-payments', label: 'My Payments' },
        { id: 'fees-structure', label: 'My Semester Fee Structure' },
        { id: 'fees-verify', label: 'Verify Fee Payment Status' },
        { id: 'fees-tuition', label: 'Tuition Fee' },
        { id: 'fees-endsem', label: 'End Semester Exam Fee' },
        { id: 'fees-dues', label: 'Dues & Reconciliations' }
      ]
    },
    {
      id: 'hostel',
      title: '12. HOSTEL MANAGEMENT',
      icon: Building,
      submodules: [
        { id: 'hostel-app', label: 'Hostel Application' },
        { id: 'hostel-room', label: 'Room Allocation' },
        { id: 'hostel-fee', label: 'Hostel Fee' },
        { id: 'hostel-complaints', label: 'Hostel Complaints' }
      ]
    },
    {
      id: 'hall-ticket',
      title: '13. HALL TICKET',
      icon: Award,
      submodules: [
        { id: 'ht-eligibility', label: 'Examination Eligibility' },
        { id: 'ht-attendance', label: 'Attendance Verification' },
        { id: 'ht-fee', label: 'Fee Clearance' },
        { id: 'ht-download', label: 'Download Hall Ticket' }
      ]
    },
    {
      id: 'infra',
      title: '14. INFRASTRUCTURE RELATED',
      icon: SlidersHorizontal,
      submodules: [
        { id: 'infra-complaint', label: 'Submit Complaint' },
        { id: 'infra-maintenance', label: 'Maintenance Requests' },
        { id: 'infra-tracking', label: 'Complaint Tracking' }
      ]
    },
    {
      id: 'library',
      title: '15. LIBRARY',
      icon: Library,
      submodules: [
        { id: 'lib-search', label: 'Search Books' },
        { id: 'lib-availability', label: 'Book Availability' },
        { id: 'lib-history', label: 'Issue History' },
        { id: 'lib-dues', label: 'Due Dates & Fines' }
      ]
    },
    {
      id: 'cgpa',
      title: '16. MY CGPA',
      icon: TrendingUp,
      submodules: [
        { id: 'cgpa-sgpa', label: 'Semester GPA' },
        { id: 'cgpa-overall', label: 'Overall CGPA' },
        { id: 'cgpa-credits', label: 'Credit Details' },
        { id: 'cgpa-history', label: 'Academic History' }
      ]
    },
    {
      id: 'nodue',
      title: '17. NODUE',
      icon: FileCheck2,
      submodules: [
        { id: 'nodue-library', label: 'Library Clearance' },
        { id: 'nodue-hostel', label: 'Hostel Clearance' },
        { id: 'nodue-accounts', label: 'Accounts Clearance' },
        { id: 'nodue-dept', label: 'Department Clearance' }
      ]
    },
    {
      id: 'profile',
      title: '18. PROFILE',
      icon: UserCheck,
      submodules: [
        { id: 'prof-personal', label: 'Personal Information' },
        { id: 'prof-academic', label: 'Academic Information' },
        { id: 'prof-contact', label: 'Contact Details' },
        { id: 'prof-documents', label: 'Documents' }
      ]
    },
    {
      id: 'psycho',
      title: '19. PSYCHOMETRIC TESTS',
      icon: BrainIcon,
      submodules: [
        { id: 'psycho-interest', label: 'Interest Assessments' },
        { id: 'psycho-aptitude', label: 'Aptitude Tests' },
        { id: 'psycho-personality', label: 'Personality Assessments' }
      ]
    },
    {
      id: 'registrar',
      title: '20. REGISTRAR OFFICE',
      icon: FolderOpen,
      submodules: [
        { id: 'reg-bonafide', label: 'Bonafide Certificate' },
        { id: 'reg-transcript', label: 'Transcript Request' },
        { id: 'reg-certificates', label: 'Academic Certificates' },
        { id: 'reg-tc', label: 'Transfer Certificate' }
      ]
    }
  ];

  // Faculty Navigation
  const facultyCategories: SidebarCategory[] = [
    {
      id: 'fac-core',
      title: 'FACULTY OPERATIONS',
      icon: Briefcase,
      submodules: [
        { id: 'faculty-dashboard', label: 'Faculty Dashboard' },
        { id: 'student-list', label: 'Student Directory & Filters' },
        { id: 'faculty-subjects', label: 'My Courses & Classes' },
        { id: 'risk-radar', label: 'Risk Early Warnings Radar' },
        { id: 'faculty-alerts', label: 'Critical Alerts Queue', badge: alertCount },
        { id: 'interventions', label: 'Interventions & Counseling' },
        { id: 'mentoring-portal', label: 'Mentoring Desk' }
      ]
    },
    {
      id: 'fac-ml',
      title: 'AI EXPLORER',
      icon: Database,
      submodules: [
        { id: 'uci-dataset', label: 'UCI Dataset & ML Explorer' }
      ]
    }
  ];

  // Admin Navigation
  const adminCategories: SidebarCategory[] = [
    {
      id: 'adm-core',
      title: 'INSTITUTION ADMINISTRATION',
      icon: SlidersHorizontal,
      submodules: [
        { id: 'admin-dashboard', label: 'Administrator Command' },
        { id: 'cohort-analytics', label: 'Cohort Performance' },
        { id: 'risk-config', label: 'Risk Sensitivity Thresholds' },
        { id: 'data-management', label: 'Data Input & CSV Sync' },
        { id: 'uci-dataset', label: 'UCI Dataset & ML Engine' }
      ]
    }
  ];

  const activeCategories = role === 'ADMIN' ? adminCategories : role === 'FACULTY' ? facultyCategories : studentCategories;

  return (
    <aside
      className={`relative shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 min-h-[calc(100vh-4rem)] ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 z-20 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Navigation Groups */}
      <div className="p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-8.5rem)]">
        {activeCategories.map((cat) => {
          const Icon = cat.icon;
          const isExpanded = !!expandedCategories[cat.id];
          const hasActiveSub = cat.submodules.some(s => s.id === currentTab);

          return (
            <div key={cat.id} className="space-y-1">
              {/* Category Header */}
              <button
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                  hasActiveSub
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                }`}
                title={isCollapsed ? cat.title : undefined}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${hasActiveSub ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`} />
                  {!isCollapsed && (
                    <span className="truncate text-left tracking-wide">{cat.title}</span>
                  )}
                </div>
                {!isCollapsed && (
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                )}
              </button>

              {/* Submodules Accordion */}
              {!isCollapsed && isExpanded && (
                <div className="pl-4 pr-1 py-1 space-y-0.5 border-l-2 border-slate-100 dark:border-slate-800 ml-4">
                  {cat.submodules.map((sub) => {
                    const isActive = currentTab === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => onSelectTab(sub.id)}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer group ${
                          isActive
                            ? 'bg-indigo-600 text-white font-bold shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <span className="truncate">{sub.label}</span>
                        {sub.badge !== undefined && sub.badge > 0 && (
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isActive ? 'bg-white text-indigo-600' : 'bg-rose-500 text-white'}`}>
                            {sub.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Profile / Quick Status Badge */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80">
        {!isCollapsed ? (
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {user?.name || 'Academic User'}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>KL University ERP Connected</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

// Simple Fallback Brain Icon for Psychometric category
const BrainIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
    <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
    <path d="M12 18v4" />
  </svg>
);
