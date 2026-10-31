import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { TeamModal } from './TeamModal';
import { HallTicketModal } from '../erp/HallTicketModal';
import { GradeCardModal } from '../erp/GradeCardModal';
import { TimetableModal } from '../erp/TimetableModal';
import { CircularsModal } from '../erp/CircularsModal';
import { FeeClearanceModal } from '../erp/FeeClearanceModal';
import {
  Sparkles,
  LogOut,
  Users,
  ChevronDown,
  RotateCcw,
  Check,
  FileText,
  Award,
  Calendar,
  Bell,
  CreditCard,
  Building2,
  HeartHandshake,
  Sun,
  Moon,
  Search,
  Command,
  HelpCircle,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { api } from '../../api/client';

interface HeaderProps {
  onOpenCommandPalette?: () => void;
  onNavigateTab?: (tabId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCommandPalette, onNavigateTab }) => {
  const { user, logout, switchUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showErpDropdown, setShowErpDropdown] = useState(false);
  const [showHelpDropdown, setShowHelpDropdown] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // ERP Modals
  const [showHallTicket, setShowHallTicket] = useState(false);
  const [showGradeCard, setShowGradeCard] = useState(false);
  const [showTimetable, setShowTimetable] = useState(false);
  const [showCirculars, setShowCirculars] = useState(false);
  const [showFeeClearance, setShowFeeClearance] = useState(false);

  // Active student ID for ERP modals
  const studentId = user?.studentId || (user?.role === 'STUDENT' ? 'stu_tejaditya' : 'stu_tejaditya');

  const demoAccounts = [
    { name: 'P. TejAditya (High Performer)', email: 'tejaditya@student.college.edu', role: 'STUDENT', desc: 'GPA 9.6 · 95% Att. · Tier 1' },
    { name: 'G. Akshath (Improving)', email: 'akshath@student.college.edu', role: 'STUDENT', desc: '62% → 84% · Upward Trend' },
    { name: 'I. Rajesh (Declining)', email: 'rajesh@student.college.edu', role: 'STUDENT', desc: '84% → 52% · Urgent Action' },
    { name: 'Rahul Verma (Low Att.)', email: 'rahul@student.college.edu', role: 'STUDENT', desc: '59% Attendance · At-Risk' },
    { name: 'Ananya Sharma (Inconsistent)', email: 'ananya@student.college.edu', role: 'STUDENT', desc: 'High Variance · Erratic' },
    { name: 'Vikram Reddy (Urgent Int.)', email: 'vikram@student.college.edu', role: 'STUDENT', desc: '46% Marks · Multiple Backlogs' },
    { name: 'Dr. Pratusha Mam (Guide)', email: 'guide@cse.college.edu', role: 'FACULTY', desc: 'Faculty, Mentor & Capstone Guide' },
    { name: 'Dr. S. K. Murthy (Admin)', email: 'admin@cse.college.edu', role: 'ADMIN', desc: 'Head of Academic Analytics' },
  ];

  const handleSelectAccount = async (email: string) => {
    setShowAccountDropdown(false);
    try {
      const pwd = email.includes('admin') ? 'admin123' : email.includes('guide') ? 'guide123' : email.includes('student') ? 'student123' : 'faculty123';
      await switchUser(email, pwd);
    } catch (err: any) {
      console.error('Failed to switch user:', err);
    }
  };

  const handleResetDatabase = async () => {
    if (!window.confirm('Reset academic database to fresh pristine demo state?')) return;
    setIsResetting(true);
    try {
      await api.resetDatabase();
      window.location.reload();
    } catch (err) {
      alert('Reset failed: ' + err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Academic Branding */}
          <div className="flex items-center gap-4">
            <div 
              onClick={() => onNavigateTab && onNavigateTab(user?.role === 'ADMIN' ? 'admin-dashboard' : user?.role === 'FACULTY' ? 'faculty-dashboard' : 'student-dashboard')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 p-[1px] shadow-sm shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[11px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-tight text-base text-slate-900 dark:text-white">
                    AKTERA
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 uppercase tracking-wider">
                    Intelligence
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-none mt-0.5">
                  Academic Performance & Early Warning
                </p>
              </div>
            </div>

            {/* Academic Session Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700/60">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>A.Y. 2026–2027</span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Semester VI (CSE)</span>
            </div>
          </div>

          {/* Center Search / Command Palette Trigger */}
          <div className="flex-1 max-w-md mx-2 hidden md:block">
            <button
              onClick={onOpenCommandPalette}
              className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all text-xs cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <span>Search features, analytics, students...</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[10px] bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-500">
                <span>Ctrl</span>
                <span>K</span>
              </div>
            </button>
          </div>

          {/* Right Action Icons & Menus */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Mobile Search Button */}
            <button
              onClick={onOpenCommandPalette}
              className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* ERP Quick Services Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowErpDropdown(!showErpDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden sm:inline">ERP Services</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showErpDropdown && (
                <div 
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-1"
                  onMouseLeave={() => setShowErpDropdown(false)}
                >
                  <div className="px-3.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Institutional ERP Documents
                  </div>
                  <button
                    onClick={() => { setShowHallTicket(true); setShowErpDropdown(false); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-left"
                  >
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <span>Hall Ticket / Admit Card</span>
                  </button>
                  <button
                    onClick={() => { setShowGradeCard(true); setShowErpDropdown(false); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-left"
                  >
                    <Award className="w-4 h-4 text-violet-500" />
                    <span>Grade Card & Transcripts</span>
                  </button>
                  <button
                    onClick={() => { setShowTimetable(true); setShowErpDropdown(false); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-left"
                  >
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span>Weekly Class Timetable</span>
                  </button>
                  <button
                    onClick={() => { setShowCirculars(true); setShowErpDropdown(false); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-left"
                  >
                    <Bell className="w-4 h-4 text-amber-500" />
                    <span>Dean & Exam Circulars</span>
                  </button>
                  <button
                    onClick={() => { setShowFeeClearance(true); setShowErpDropdown(false); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-left"
                  >
                    <CreditCard className="w-4 h-4 text-emerald-500" />
                    <span>Fee Clearance Slip</span>
                  </button>
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* Engineering Capstone Team Modal Button */}
            <button
              onClick={() => setShowTeamModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors"
              title="Capstone Engineering Project Credits"
            >
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>Project Team</span>
            </button>

            {/* Demo Account Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-colors"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-xs flex items-center justify-center">
                  {user?.name ? user.name[0] : 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight flex items-center gap-1">
                    <span>{user?.name?.split(' ')[0] || 'User'}</span>
                    <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-mono font-bold">
                      {user?.role}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showAccountDropdown && (
                <div 
                  className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in"
                  onMouseLeave={() => setShowAccountDropdown(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  </div>

                  <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                    Switch Test Archetype
                  </div>

                  <div className="max-h-60 overflow-y-auto px-1 space-y-0.5">
                    {demoAccounts.map((acc) => {
                      const isCurrent = user?.email === acc.email;
                      return (
                        <button
                          key={acc.email}
                          onClick={() => handleSelectAccount(acc.email)}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-left text-xs transition-colors ${
                            isCurrent
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="truncate mr-2">
                            <div className="truncate font-medium">{acc.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{acc.desc}</div>
                          </div>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 mt-2 pt-1 px-1">
                    <button
                      onClick={handleResetDatabase}
                      disabled={isResetting}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                      <span>{isResetting ? 'Resetting DB...' : 'Reset Database to Clean State'}</span>
                    </button>
                    <button
                      onClick={() => logout()}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Modals */}
      <TeamModal isOpen={showTeamModal} onClose={() => setShowTeamModal(false)} />
      <HallTicketModal studentId={studentId} isOpen={showHallTicket} onClose={() => setShowHallTicket(false)} />
      <GradeCardModal studentId={studentId} isOpen={showGradeCard} onClose={() => setShowGradeCard(false)} />
      <TimetableModal studentId={studentId} isOpen={showTimetable} onClose={() => setShowTimetable(false)} />
      <CircularsModal isOpen={showCirculars} onClose={() => setShowCirculars(false)} />
      <FeeClearanceModal studentId={studentId} isOpen={showFeeClearance} onClose={() => setShowFeeClearance(false)} />
    </>
  );
};
