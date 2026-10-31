import {
  User,
  StudentAnalytics,
  RiskAssessment,
  Alert,
  Recommendation,
  ForecastResult,
  WhatIfSimulationResult,
  Intervention,
  RiskConfiguration
} from '../types';

const TOKEN_KEY = 'edupulse_auth_token';
const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMsg = `HTTP ${response.status} ${response.statusText}`;
    try {
      const data = await response.json();
      if (data && data.error) {
        errorMsg = data.error;
      }
    } catch (_) {}
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  async login(identifierOrEmail: string, password: string): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: identifierOrEmail,
        email: identifierOrEmail,
        password
      })
    });
    setStoredToken(res.token);
    return res;
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/api/auth/me');
  },

  async getDemoAccounts(): Promise<{ accounts: any[] }> {
    return request<{ accounts: any[] }>('/api/auth/demo-accounts');
  },

  async resetDatabase(): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/api/auth/seed-reset', {
      method: 'POST'
    });
  },

  // Student endpoints
  async getStudentOverview(): Promise<{
    analytics: StudentAnalytics;
    risk: RiskAssessment;
    recommendations: Recommendation[];
    forecast: ForecastResult;
    alerts: Alert[];
  }> {
    return request('/api/students/overview');
  },

  async getStudentAnalytics(studentId: string): Promise<{ analytics: StudentAnalytics }> {
    return request(`/api/students/${studentId}/analytics`);
  },

  async getStudentRisk(studentId: string): Promise<{ risk: RiskAssessment }> {
    return request(`/api/students/${studentId}/risk`);
  },

  async getStudentAlerts(studentId: string): Promise<{ alerts: Alert[] }> {
    return request(`/api/students/${studentId}/alerts`);
  },

  async runWhatIfSimulation(studentId: string, payload: any): Promise<{ result: any }> {
    return request(`/api/students/${studentId}/what-if`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getStudentRecommendations(studentId: string): Promise<{ recommendations: Recommendation[] }> {
    return request(`/api/students/${studentId}/recommendations`);
  },

  async getStudentForecast(studentId: string): Promise<{ forecast: ForecastResult }> {
    return request(`/api/students/${studentId}/forecast`);
  },

  async runWhatIf(
    studentId: string,
    data: {
      hypotheticalEndTermPercentage: number;
      targetSubjectCode?: string;
      targetSubjectScore?: number;
      simulatedAttendanceBonus?: number;
      resolveOverdueAssignments?: boolean;
    }
  ): Promise<{ simulation: WhatIfSimulationResult }> {
    return request(`/api/students/${studentId}/what-if`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Faculty endpoints
  async getFacultyDashboard(): Promise<{
    summary: {
      totalStudents: number;
      highRiskCount: number;
      mediumRiskCount: number;
      lowRiskCount: number;
      criticalAlertsCount: number;
      activeInterventionsCount: number;
    };
    students: any[];
    subjects: any[];
    alerts: Alert[];
    interventions: Intervention[];
  }> {
    return request('/api/faculty/dashboard');
  },

  async getFacultyStudents(params: Record<string, string> = {}): Promise<{ students: any[] }> {
    const queryStr = new URLSearchParams(params).toString();
    return request(`/api/faculty/students?${queryStr}`);
  },

  async getFacultyStudentProfileByRoll(rollNumber: string): Promise<any> {
    return request(`/api/faculty/student-profile/${rollNumber}`);
  },

  async getStudent360(studentId: string): Promise<any> {
    return request(`/api/faculty/students/${studentId}/360`);
  },

  async getCohortAnalytics(): Promise<any> {
    return request('/api/faculty/cohort-analytics');
  },

  async getFacultySubjects(): Promise<{ subjects: any[] }> {
    return request('/api/faculty/subjects');
  },

  async scheduleIntervention(data: {
    studentId: string;
    type: string;
    notes: string;
    targetDate?: string;
  }): Promise<{ success: boolean; interventionId: string }> {
    return request('/api/faculty/interventions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateIntervention(id: string, data: { status?: string; notes?: string }): Promise<{ success: boolean }> {
    return request(`/api/faculty/interventions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async createInterventionCase(studentId: string, data: any): Promise<{ success: boolean; caseId: string }> {
    return request(`/api/faculty/students/${studentId}/interventions`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateInterventionCase(id: string, data: any): Promise<{ success: boolean }> {
    return request(`/api/faculty/interventions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  async getInterventionCases(studentId: string): Promise<any> {
    return request(`/api/faculty/students/${studentId}/interventions`);
  },

  async getRiskExplanation(studentId: string): Promise<any> {
    return request(`/api/faculty/students/${studentId}/risk-explanation`);
  },

  async runFacultyWhatIfSimulation(studentId: string, payload: any): Promise<{ result: any }> {
    return request(`/api/faculty/students/${studentId}/what-if`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Admin endpoints
  async getAdminDashboard(): Promise<{
    totalStudents: number;
    totalFaculty: number;
    totalSubjects: number;
    averageAttendance: number;
    riskDistribution: { high: number; medium: number; low: number };
    gpaBuckets: Array<{ label: string; count: number }>;
    config: RiskConfiguration;
  }> {
    return request('/api/admin/dashboard');
  },

  async getRiskConfig(): Promise<{ config: RiskConfiguration }> {
    return request('/api/admin/risk-config');
  },

  async updateRiskConfig(config: Partial<RiskConfiguration>): Promise<{ success: boolean; config: RiskConfiguration }> {
    return request('/api/admin/risk-config', {
      method: 'PUT',
      body: JSON.stringify(config)
    });
  },

  async recalculateRisks(): Promise<{ success: boolean; evaluatedCount: number }> {
    return request('/api/admin/recalculate-risks', {
      method: 'POST'
    });
  },

  async importData(type: 'MARKS' | 'ATTENDANCE', records: any[]): Promise<{
    success: boolean;
    successCount: number;
    errors: string[];
  }> {
    return request('/api/admin/import-data', {
      method: 'POST',
      body: JSON.stringify({ type, records })
    });
  },

  async getAuditLogs(): Promise<{ logs: any[] }> {
    return request('/api/admin/audit-logs');
  },

  // Parent endpoints
  async getParentDashboard(): Promise<{
    student: any;
    analytics: StudentAnalytics;
    mentor: any;
    notifications: any[];
  }> {
    return request('/api/parent/dashboard');
  },

  // AI Diagnostic endpoint
  async getAiDiagnostic(studentId: string): Promise<{
    studentId: string;
    riskLevel: string;
    riskScore: number;
    aiGeneratedReport: string;
  }> {
    return request(`/api/ai/insights/${studentId}`, {
      method: 'POST'
    });
  },

  // Mentoring Portal Endpoints
  async getMyMentor(): Promise<{
    mentor: {
      id: string;
      name: string;
      designation: string;
      department: string;
      specialization: string;
      email: string;
      phone: string;
      officeLocation: string;
      officeHours: string;
      mentorWelcomeMessage: string;
    };
    sessions: any[];
    latestWellness: any;
  }> {
    return request('/api/mentoring/my-mentor');
  },

  async getMyMentees(): Promise<{
    facultyName: string;
    mentees: any[];
  }> {
    return request('/api/mentoring/my-mentees');
  },

  async logMentoringSession(data: {
    studentId: string;
    sessionDate?: string;
    topic: string;
    mentorNotes: string;
    studentActionPlan?: string;
    parentInformed?: boolean;
    followUpDate?: string;
    status?: string;
  }): Promise<{ success: boolean; message: string; id: string }> {
    return request('/api/mentoring/sessions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async submitWellnessCheckin(data: {
    stressLevel: number;
    confidenceLevel: number;
    studyHoursWeekly: number;
    sleepHoursDaily: number;
    reflectionNotes: string;
  }): Promise<{ success: boolean; message: string }> {
    return request('/api/mentoring/wellness', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async requestMentoringMeeting(data: {
    preferredDate?: string;
    topic?: string;
    reason?: string;
  }): Promise<{ success: boolean; message: string }> {
    return request('/api/mentoring/request-meeting', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // University ERP Services Endpoints
  async getHallTicket(studentId: string): Promise<any> {
    return request(`/api/erp/hall-ticket/${studentId}`);
  },

  async getGradeCard(studentId: string): Promise<any> {
    return request(`/api/erp/grade-card/${studentId}`);
  },

  async getTimetable(): Promise<{ timetable: any[] }> {
    return request('/api/erp/timetable');
  },

  async getCampusCirculars(): Promise<{ circulars: any[] }> {
    return request('/api/erp/circulars');
  },

  async getFeeClearance(studentId: string): Promise<any> {
    return request(`/api/erp/fee-clearance/${studentId}`);
  },

  // UCI Student Performance Dataset Explorer & ML Predictor
  async getDatasetRecords(params: {
    course?: string;
    school?: string;
    risk?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    records: import('../types').UCIRecord[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const query = new URLSearchParams();
    if (params.course) query.set('course', params.course);
    if (params.school) query.set('school', params.school);
    if (params.risk) query.set('risk', params.risk);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    return request(`/api/dataset/records?${query.toString()}`);
  },

  async getDatasetAnalytics(): Promise<import('../types').UCIDatasetAnalytics> {
    return request('/api/dataset/analytics');
  },

  async predictDatasetRisk(features: {
    g1: number;
    g2: number;
    studytime: number;
    failures: number;
    absences: number;
    walc: number;
    schoolsup?: string;
    higher?: string;
  }): Promise<import('../types').UCIPredictionResult> {
    return request('/api/dataset/predict-risk', {
      method: 'POST',
      body: JSON.stringify(features)
    });
  },

  // ----------------------------------------------------
  // KL UNIVERSITY ERP MODULE APIS
  // ----------------------------------------------------
  async getErpRegistrations(studentId: string): Promise<any> {
    return request(`/api/erp/registration/courses/${studentId}`);
  },

  async registerCourse(payload: { studentId: string; subjectId: string; registrationType: string }): Promise<any> {
    return request('/api/erp/registration/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getErpAttendance(studentId: string): Promise<any> {
    return request(`/api/erp/attendance/register/${studentId}`);
  },

  async getErpCareerPreferences(studentId: string): Promise<any> {
    return request(`/api/erp/career/preferences/${studentId}`);
  },

  async saveErpCareerPreferences(payload: any): Promise<any> {
    return request('/api/erp/career/preferences', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getErpCoursesMaterials(subjectId?: string): Promise<any> {
    const q = subjectId ? `?subjectId=${subjectId}` : '';
    return request(`/api/erp/courses/materials${q}`);
  },

  async submitErpCourseFeedback(payload: any): Promise<any> {
    return request('/api/erp/courses/feedback', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getErpCrtProgress(studentId: string): Promise<any> {
    return request(`/api/erp/crt/progress/${studentId}`);
  },

  async getErpCounselling(studentId: string): Promise<any> {
    return request(`/api/erp/counselling/${studentId}`);
  },

  async scheduleErpCounselling(payload: any): Promise<any> {
    return request('/api/erp/counselling/schedule', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getErpClubs(): Promise<any> {
    return request('/api/erp/clubs');
  },

  async getErpClubMembership(studentId: string): Promise<any> {
    return request(`/api/erp/clubs/membership/${studentId}`);
  },

  async getErpFees(studentId: string): Promise<any> {
    return request(`/api/erp/fees/${studentId}`);
  },

  async payErpFee(payload: { studentId: string; feeType: string; amount: number; paymentMode?: string }): Promise<any> {
    return request('/api/erp/fees/pay', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getErpHostel(studentId: string): Promise<any> {
    return request(`/api/erp/hostel/${studentId}`);
  },

  async submitErpHostelComplaint(payload: any): Promise<any> {
    return request('/api/erp/hostel/complaint', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getErpLibrary(studentId: string, search?: string): Promise<any> {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return request(`/api/erp/library/records/${studentId}${q}`);
  },

  async getErpNoDue(studentId: string): Promise<any> {
    return request(`/api/erp/nodue/${studentId}`);
  },

  async getErpDocumentRequests(studentId: string): Promise<any> {
    return request(`/api/erp/documents/requests/${studentId}`);
  },

  async submitErpDocumentRequest(payload: any): Promise<any> {
    return request('/api/erp/documents/request', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getErpHallTicket(studentId: string): Promise<any> {
    return request(`/api/erp/hall-ticket/${studentId}`);
  }
};
