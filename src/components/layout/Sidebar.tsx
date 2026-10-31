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
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  alertCount?: number;
}

interface NavSection {
  title: string;
  items: {
    id: string;
    label: string;
    icon: any;
    badge?: number;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, alertCount = 0 }) => {
  const { user } = useAuth();
  const role = user?.role || 'STUDENT';
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Student Navigation Sections
  const studentSections: NavSection[] = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'student-dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
        { id: 'academic-performance', label: 'Academic Performance', icon: GraduationCap },
        { id: 'subject-analytics', label: 'Subject Analytics', icon: BookOpen },
        { id: 'performance-trends', label: 'Performance Trends', icon: TrendingUp },
      ]
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { id: 'uci-dataset', label: 'UCI Dataset & ML Explorer', icon: Database },
        { id: 'weak-areas', label: 'Weak Areas Detection', icon: AlertTriangle },
        { id: 'risk-status', label: 'Risk Status & Reasons', icon: ShieldAlert },
        { id: 'student-alerts', label: 'Early Warning Alerts', icon: Bell, badge: alertCount },
        { id: 'recommendations', label: 'Personalized Support & AI', icon: Lightbulb },
        { id: 'forecast', label: 'Performance Forecast', icon: LineChart },
      ]
    },
    {
      title: 'TOOLS & DESK',
      items: [
        { id: 'what-if', label: 'What-If Scenario Sandbox', icon: Sliders },
        { id: 'mentoring-portal', label: 'Faculty Mentor Desk', icon: HeartHandshake },
      ]
    }
  ];

  // Faculty Navigation Sections
  const facultySections: NavSection[] = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'faculty-dashboard', label: 'Faculty Overview', icon: LayoutDashboard },
        { id: 'student-list', label: 'Student Directory & Filters', icon: Users },
        { id: 'faculty-subjects', label: 'Subject-Wise Class View', icon: BookOpen },
      ]
    },
    {
      title: 'INTELLIGENCE & INTERVENTION',
      items: [
        { id: 'uci-dataset', label: 'UCI Dataset & ML Explorer', icon: Database },
        { id: 'risk-radar', label: 'Risk & Early Warnings', icon: ShieldAlert },
        { id: 'faculty-alerts', label: 'Critical Alerts Queue', icon: Bell, badge: alertCount },
        { id: 'interventions', label: 'Interventions & Counseling', icon: ClipboardList },
      ]
    },
    {
      title: 'DESK',
      items: [
        { id: 'mentoring-portal', label: 'Mentoring Desk & Mentees', icon: HeartHandshake },
      ]
    }
  ];

  // Admin Navigation Sections
  const adminSections: NavSection[] = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'admin-dashboard', label: 'Administrator Command', icon: LayoutDashboard },
        { id: 'cohort-analytics', label: 'Cohort Performance', icon: BarChart3 },
      ]
    },
    {
      title: 'SYSTEM CONFIGURATION',
      items: [
        { id: 'uci-dataset', label: 'UCI Dataset & ML Engine', icon: Database },
        { id: 'risk-config', label: 'Risk Engine Sensitivity', icon: SlidersHorizontal },
        { id: 'data-management', label: 'Data Input & CSV Sync', icon: FileSpreadsheet },
      ]
    }
  ];

  const sections = role === 'ADMIN' ? adminSections : role === 'FACULTY' ? facultySections : studentSections;

  return (
    <aside
      className={`relative shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 min-h-[calc(100vh-4rem)] ${
        isCollapsed ? 'w-20' : 'w-64'
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
      <div className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-9rem)]">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group relative cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  {/* Left Active indicator bar */}
                  {isActive && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-600 dark:bg-indigo-400 rounded-r-full" />
                  )}

                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    }`}
                  />

                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}

                  {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-2xs">
                      {item.badge}
                    </span>
                  )}

                  {/* Hover tooltip when collapsed */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                      {item.label}
                      {item.badge !== undefined && item.badge > 0 && ` (${item.badge})`}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
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
                <span>{role} Connected</span>
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
