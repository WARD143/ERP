import React, { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { CommandPalette } from './components/common/CommandPalette';
import { LoginPage } from './pages/public/LoginPage';
import { UniversalErpModuleView } from './components/erp/UniversalErpModuleView';
import { api } from './api/client';
import { StudentAnalytics, RiskAssessment, Recommendation, ForecastResult, Alert } from './types';
import { ArrowLeft, Home, Sparkles } from 'lucide-react';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { AcademicPerformance } from './pages/student/AcademicPerformance';
import { SubjectAnalytics } from './pages/student/SubjectAnalytics';
import { PerformanceTrends } from './pages/student/PerformanceTrends';
import { WeakAreas } from './pages/student/WeakAreas';
import { RiskStatus } from './pages/student/RiskStatus';
import { StudentAlerts } from './pages/student/StudentAlerts';
import { PersonalizedRecommendations } from './pages/student/PersonalizedRecommendations';
import { PerformanceForecast } from './pages/student/PerformanceForecast';
import { WhatIfAnalysis } from './pages/student/WhatIfAnalysis';
import { StudentMentoringPortal } from './pages/student/StudentMentoringPortal';

// Faculty Pages
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { StudentList } from './pages/faculty/StudentList';
import { SubjectOverview } from './pages/faculty/SubjectOverview';
import { RiskEarlyWarnings } from './pages/faculty/RiskEarlyWarnings';
import { FacultyAlerts } from './pages/faculty/FacultyAlerts';
import { InterventionManager } from './pages/faculty/InterventionManager';
import { FacultyMentoringPortal } from './pages/faculty/FacultyMentoringPortal';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { CohortAnalytics } from './pages/admin/CohortAnalytics';
import { RiskThresholdConfig } from './pages/admin/RiskThresholdConfig';
import { DataManagement } from './pages/admin/DataManagement';
import { UCIDatasetExplorer } from './pages/dataset/UCIDatasetExplorer';
import { OuladAnalyticsDashboard } from './pages/dataset/OuladAnalyticsDashboard';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal';

// Parent Pages
import { ParentDashboard } from './pages/parent/ParentDashboard';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('student-dashboard');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState<boolean>(false);

  useEffect(() => {
    if (user?.mustChangePassword) {
      setShowPasswordChangeModal(true);
    } else {
      setShowPasswordChangeModal(false);
    }
  }, [user?.mustChangePassword, user?.id]);

  // Student Loaded Data
  const [studentData, setStudentData] = useState<{
    analytics: StudentAnalytics;
    risk: RiskAssessment;
    recommendations: Recommendation[];
    forecast: ForecastResult;
    alerts: Alert[];
  } | null>(null);
  const [studentLoading, setStudentLoading] = useState<boolean>(false);

  // Intervention modal trigger for faculty
  const [activeInterventionStudentId, setActiveInterventionStudentId] = useState<string | null>(null);

  // Global Ctrl+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Set default tab on role switch
  useEffect(() => {
    if (!user) return;
    if (user.role === 'ADMIN') {
      setCurrentTab('admin-dashboard');
    } else if (user.role === 'FACULTY') {
      setCurrentTab('faculty-dashboard');
    } else if (user.role === 'PARENT') {
      setCurrentTab('parent-dashboard');
    } else {
      setCurrentTab('student-dashboard');
    }
  }, [user?.role, user?.id]);

  // Load student overview data if user is a student
  useEffect(() => {
    if (user && user.role === 'STUDENT') {
      setStudentLoading(true);
      api.getStudentOverview()
        .then((res) => {
          setStudentData(res);
        })
        .catch((err) => {
          console.error('Failed to fetch student overview:', err);
        })
        .finally(() => {
          setStudentLoading(false);
        });
    }
  }, [user?.id, user?.role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-500 gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 animate-pulse">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          Initializing University ERP Platform...
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleOpenInterventionModal = (studentId: string) => {
    setActiveInterventionStudentId(studentId);
    setCurrentTab('interventions');
  };

  const unresolvedAlertCount = studentData?.alerts.filter(a => a.is_resolved === 0).length || 0;

  const homeTab = user.role === 'ADMIN' ? 'admin-dashboard' : user.role === 'FACULTY' ? 'faculty-dashboard' : user.role === 'PARENT' ? 'parent-dashboard' : 'student-dashboard';
  const homeLabel = user.role === 'ADMIN' ? 'Admin Dashboard' : user.role === 'FACULTY' ? 'Faculty Dashboard' : user.role === 'PARENT' ? 'Parent Dashboard' : 'Student Dashboard';

  const isBuiltinStudentModule = [
    'student-dashboard',
    'mentoring-portal',
    'academic-performance',
    'subject-analytics',
    'performance-trends',
    'weak-areas',
    'risk-status',
    'student-alerts',
    'recommendations',
    'forecast',
    'what-if',
    'uci-dataset'
  ].includes(currentTab);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Header
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onNavigateTab={setCurrentTab}
      />

      <div className="flex-1 flex">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          alertCount={user.role === 'STUDENT' ? unresolvedAlertCount : undefined}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {/* Universal Breadcrumb Navigation Bar when on any subpage */}
          {currentTab !== homeTab && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentTab(homeTab)}
                  className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
                  title="Return to main overview dashboard"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>← Back to Dashboard</span>
                </button>

                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                  <span className="text-slate-300 dark:text-slate-700">/</span>
                  <button
                    onClick={() => setCurrentTab(homeTab)}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors cursor-pointer"
                  >
                    {homeLabel}
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">/</span>
                  <span className="text-slate-900 dark:text-slate-200 font-bold capitalize">
                    {currentTab.replace('-', ' ')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTab(homeTab)}
                  className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Main Portal</span>
                </button>
              </div>
            </div>
          )}

          {/* UCI DATASET BENCHMARK EXPLORER & ML ENGINE */}
          {currentTab === 'uci-dataset' && (
            <UCIDatasetExplorer />
          )}

          {/* OULAD RESEARCH DATASET ANALYTICS */}
          {currentTab === 'oulad-analytics' && (
            <OuladAnalyticsDashboard />
          )}

          {/* STUDENT PORTAL VIEWS */}
          {user.role === 'STUDENT' && currentTab !== 'uci-dataset' && currentTab !== 'oulad-analytics' && (
            <>
              {/* Check if current tab is one of the 20 new KL University ERP modules */}
              {!isBuiltinStudentModule ? (
                <UniversalErpModuleView
                  tabId={currentTab}
                  studentId={user.studentId || user.id}
                />
              ) : (
                <>
                  {studentLoading || !studentData ? (
                    <div className="py-20 text-center text-xs font-semibold uppercase tracking-wider text-slate-400 animate-pulse">
                      Loading academic performance metrics...
                    </div>
                  ) : (
                    <>
                      {currentTab === 'student-dashboard' && (
                        <StudentDashboard
                          analytics={studentData.analytics}
                          risk={studentData.risk}
                          recommendations={studentData.recommendations}
                          forecast={studentData.forecast}
                          alerts={studentData.alerts}
                          onNavigateTab={setCurrentTab}
                        />
                      )}
                      {currentTab === 'mentoring-portal' && (
                        <StudentMentoringPortal />
                      )}
                      {currentTab === 'academic-performance' && (
                        <AcademicPerformance analytics={studentData.analytics} />
                      )}
                      {currentTab === 'subject-analytics' && (
                        <SubjectAnalytics analytics={studentData.analytics} />
                      )}
                      {currentTab === 'performance-trends' && (
                        <PerformanceTrends analytics={studentData.analytics} forecast={studentData.forecast} />
                      )}
                      {currentTab === 'weak-areas' && (
                        <WeakAreas analytics={studentData.analytics} onNavigateTab={setCurrentTab} />
                      )}
                      {currentTab === 'risk-status' && (
                        <RiskStatus analytics={studentData.analytics} risk={studentData.risk} onNavigateTab={setCurrentTab} />
                      )}
                      {currentTab === 'student-alerts' && (
                        <StudentAlerts alerts={studentData.alerts} />
                      )}
                      {currentTab === 'recommendations' && (
                        <PersonalizedRecommendations
                          recommendations={studentData.recommendations}
                          analytics={studentData.analytics}
                        />
                      )}
                      {currentTab === 'forecast' && (
                        <PerformanceForecast
                          forecast={studentData.forecast}
                          analytics={studentData.analytics}
                          onNavigateTab={setCurrentTab}
                        />
                      )}
                      {currentTab === 'what-if' && (
                        <WhatIfAnalysis analytics={studentData.analytics} />
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}

          {/* FACULTY PORTAL VIEWS */}
          {user.role === 'FACULTY' && (
            <>
              {currentTab === 'faculty-dashboard' && (
                <FacultyDashboard
                  onNavigateTab={setCurrentTab}
                  onOpenInterventionModal={handleOpenInterventionModal}
                />
              )}
              {currentTab === 'mentoring-portal' && (
                <FacultyMentoringPortal />
              )}
              {currentTab === 'student-list' && (
                <StudentList onOpenInterventionModal={handleOpenInterventionModal} />
              )}
              {currentTab === 'faculty-subjects' && (
                <SubjectOverview />
              )}
              {currentTab === 'risk-radar' && (
                <RiskEarlyWarnings />
              )}
              {currentTab === 'faculty-alerts' && (
                <FacultyAlerts />
              )}
              {currentTab === 'interventions' && (
                <InterventionManager initialStudentId={activeInterventionStudentId} />
              )}
            </>
          )}

          {/* ADMIN PORTAL VIEWS */}
          {user.role === 'ADMIN' && (
            <>
              {currentTab === 'admin-dashboard' && (
                <AdminDashboard onNavigateTab={setCurrentTab} />
              )}
              {currentTab === 'cohort-analytics' && (
                <CohortAnalytics />
              )}
              {currentTab === 'risk-config' && (
                <RiskThresholdConfig />
              )}
              {currentTab === 'data-management' && (
                <DataManagement />
              )}
            </>
          )}

          {/* PARENT PORTAL VIEWS */}
          {user.role === 'PARENT' && (
            <>
              {currentTab === 'parent-dashboard' && (
                <ParentDashboard />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mandatory First-Login Password Change Modal */}
      {showPasswordChangeModal && user?.rollNumber && (
        <ChangePasswordModal
          rollNumber={user.rollNumber}
          onPasswordChanged={() => {
            setShowPasswordChangeModal(false);
            if (user) {
              user.mustChangePassword = false;
            }
          }}
        />
      )}

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateTab={setCurrentTab}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
