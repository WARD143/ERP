import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { X, Award, ShieldAlert, BookOpen, Clock, AlertTriangle, Lightbulb, LineChart, Plus, CheckCircle2, User, Phone, Mail, FileText } from 'lucide-react';
import { RiskBadge } from '../../components/common/RiskBadge';
import { TrendLineChart } from '../../components/charts/TrendLineChart';
import { WhatIfAnalysis } from '../../components/analytics/WhatIfAnalysis';

interface StudentDetailModalProps {
  studentId: string | null;
  onClose: () => void;
  onScheduleIntervention?: (studentId: string) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  studentId,
  onClose,
  onScheduleIntervention
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'attendance' | 'risk' | 'interventions' | 'alerts'>('overview');

  const [caseForm, setCaseForm] = useState(false);
  const [newCase, setNewCase] = useState({ issue_type: 'Academic Performance', priority: 'Medium', notes: '', action_plan: '', follow_up_date: '' });

  const loadData = async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await api.getStudent360(studentId);
      setData(res);
    } catch (err) {
      console.error('Failed to load student 360 profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  if (!studentId) return null;

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCase.notes) return;
    try {
      await api.createInterventionCase(studentId, newCase);
      setCaseForm(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl my-8 overflow-hidden flex flex-col h-[90vh]">
        
        {/* Header */}
        <div className="flex-shrink-0 p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 rounded-full bg-indigo-900/50 flex items-center justify-center border border-indigo-500/30">
              <User className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase text-indigo-400">Student 360° Profile</span>
                {data?.achievements?.map((ach: string, i: number) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"><Award className="w-3 h-3" /> {ach}</span>
                ))}
              </div>
              <h2 className="text-xl font-bold text-slate-100 mt-1">
                {data ? data.student.name : 'Loading...'}
                <span className="font-mono text-sm px-2 py-0.5 bg-slate-800 rounded text-slate-300 ml-2">{data?.student.roll_number}</span>
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-100"><X className="w-5 h-5" /></button>
        </div>

        {loading || !data ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Loading comprehensive academic profile...</div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            
            {/* Tabs */}
            <div className="flex border-b border-slate-800 px-5 overflow-x-auto">
              {['overview', 'performance', 'attendance', 'risk', 'interventions', 'alerts'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap capitalize transition-colors ${activeTab === tab ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-5">
              
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                      <div className="text-xs text-slate-400">Program</div>
                      <div className="text-sm font-medium text-slate-200 mt-1">CSE - Section {data.student.section}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                      <div className="text-xs text-slate-400">Dataset GPA Proxy</div>
                      <div className="text-xl font-mono text-indigo-400 mt-1">{data.analytics.currentGpa.toFixed(2)}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                      <div className="text-xs text-slate-400">Risk Assessment</div>
                      <div className="mt-1"><RiskBadge level={data.risk.riskLevel} score={data.risk.overallRiskScore} /></div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                      <div className="text-xs text-slate-400">Contact</div>
                      <div className="text-xs text-slate-300 mt-1 flex flex-col gap-1">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3"/> {data.student.email || 'N/A'}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {data.student.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5 rounded-xl bg-indigo-950/20 border border-indigo-900/30">
                    <h3 className="text-sm font-semibold text-indigo-300 mb-2">Smart Risk Recommendation</h3>
                    <ul className="space-y-2">
                      {data.risk.recommendations?.map((rec: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-indigo-200">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-indigo-400"/> {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'performance' && (
                <div className="space-y-6">
                  {data.analytics.hasDetailedSubjectData ? (
                    <div className="border border-slate-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] border-b border-slate-800">
                          <tr>
                            <th className="py-3 px-4">Subject</th>
                            <th className="py-3 px-4">Internal Marks</th>
                            <th className="py-3 px-4">Weighted %</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {data.analytics.subjects.map((s: any) => (
                            <tr key={s.code}>
                              <td className="py-3 px-4 font-medium text-slate-200">{s.code} · {s.name}</td>
                              <td className="py-3 px-4 font-mono text-slate-400">IA1: {s.ia1Marks} | IA2: {s.ia2Marks} | Mid: {s.midTermMarks}</td>
                              <td className="py-3 px-4 font-mono font-semibold text-indigo-300">{s.weightedScorePercentage}%</td>
                              <td className="py-3 px-4">
                                <span className={`text-[11px] font-semibold ${s.riskStatus === 'HIGH' ? 'text-rose-400' : s.riskStatus === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}`}>{s.riskStatus}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center border border-dashed border-slate-700 rounded-xl">
                      <BookOpen className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                      <h3 className="text-slate-300 font-medium">Subject-level data unavailable</h3>
                      <p className="text-xs text-slate-500 mt-1">This student was migrated from a dataset that only contains overall performance (G1, G2, G3).</p>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4">Chronological Learning Trajectory</h3>
                    {data.forecast?.hasSufficientData ? (
                      <div className="h-48">
                        <TrendLineChart dataPoints={data.forecast.trajectoryPoints} height={200} />
                      </div>
                    ) : (
                      <div className="h-24 flex items-center justify-center text-xs text-slate-500">
                        Insufficient historical data to plot trajectory.
                      </div>
                    )}
                  </div>

                  {/* Assignment Analytics Audit */}
                  <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4">Assignment Performance Audit</h3>
                    {data.analytics.assignmentAnalytics ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-slate-900 rounded border border-slate-800">
                           <div className="text-xs text-slate-500">Total Assigned</div>
                           <div className="text-xl font-bold text-slate-200 mt-1">{data.analytics.assignmentAnalytics.totalAssignments}</div>
                        </div>
                        <div className="p-3 bg-slate-900 rounded border border-slate-800">
                           <div className="text-xs text-slate-500">Submitted</div>
                           <div className="text-xl font-bold text-emerald-400 mt-1">{data.analytics.assignmentAnalytics.submitted}</div>
                        </div>
                        <div className="p-3 bg-slate-900 rounded border border-slate-800">
                           <div className="text-xs text-slate-500">Missing / Late</div>
                           <div className="text-xl font-bold text-rose-400 mt-1">{data.analytics.assignmentAnalytics.missing}</div>
                        </div>
                        <div className="p-3 bg-slate-900 rounded border border-slate-800">
                           <div className="text-xs text-slate-500">Avg. Score</div>
                           <div className="text-xl font-bold text-indigo-400 mt-1">{data.analytics.assignmentAnalytics.averageScore}%</div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-20 flex items-center justify-center text-xs text-slate-500">
                        Assignment analytics unavailable for current dataset.
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6">
                    <WhatIfAnalysis 
                      studentId={studentId} 
                      baselinePercentage={data.analytics.overallPercentage} 
                      isFaculty={true} 
                    />
                  </div>
                </div>
              )}

              {activeTab === 'attendance' && (
                <div className="space-y-6">
                  {data.analytics.hasDetailedSubjectData ? (
                    <div className="p-6 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-400">Institutional Attendance</div>
                        <div className="text-3xl font-bold text-slate-100 mt-1">{data.analytics.attendanceAverage}%</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-400">Status</div>
                        <div className={`text-lg font-semibold mt-1 ${data.analytics.attendanceAverage < 75 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {data.analytics.attendanceAverage < 75 ? 'Critical Shortage' : 'Satisfactory'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center border border-dashed border-slate-700 rounded-xl">
                      <Clock className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                      <h3 className="text-slate-300 font-medium">Official attendance percentage is unavailable</h3>
                      <p className="text-xs text-slate-500 mt-1">Dataset contains recorded absences but no total session count.</p>
                      <div className="mt-4 inline-block px-4 py-2 bg-slate-900 rounded-lg text-sm text-slate-300">
                        Recorded Dataset Absences: <span className="font-mono font-bold text-amber-400 ml-2">{100 - data.analytics.attendanceAverage}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'risk' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl bg-slate-950/50 border border-slate-800">
                      <h3 className="text-sm font-semibold text-slate-300 mb-4">Risk Factors</h3>
                      <ul className="space-y-3">
                        {data.risk.explanationReasons.map((r: string, i: number) => (
                          <li key={i} className="flex gap-3 text-sm text-slate-300">
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="p-5 rounded-xl bg-slate-950/50 border border-slate-800">
                      <h3 className="text-sm font-semibold text-slate-300 mb-4">Risk Timeline</h3>
                      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                        {data.timeline?.length > 0 ? data.timeline.map((event: any, i: number) => (
                          <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-4 h-4 rounded-full border border-slate-800 bg-slate-900 text-slate-500 group-[.is-active]:text-indigo-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border border-slate-800 bg-slate-950/50">
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-xs font-semibold ${event.risk_level === 'HIGH' ? 'text-rose-400' : event.risk_level === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}`}>{event.risk_level} Risk</span>
                                <time className="text-[10px] text-slate-500">{new Date(event.created_at).toLocaleDateString()}</time>
                              </div>
                              <div className="text-xs text-slate-400">{event.reason}</div>
                            </div>
                          </div>
                        )) : (
                          <div className="text-xs text-slate-500 text-center py-4 relative z-10">No historical risk events recorded.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'interventions' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-slate-200">Mentor Case Management</h3>
                    <button onClick={() => setCaseForm(!caseForm)} className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1">
                      <Plus className="w-3 h-3" /> New Case
                    </button>
                  </div>

                  {caseForm && (
                    <form onSubmit={handleCreateCase} className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Issue Type</label>
                          <select value={newCase.issue_type} onChange={e => setNewCase({...newCase, issue_type: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-200">
                            <option>Academic Performance</option>
                            <option>Attendance</option>
                            <option>Subject Weakness</option>
                            <option>Risk Escalation</option>
                            <option>Parent Communication</option>
                            <option>Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Priority</label>
                          <select value={newCase.priority} onChange={e => setNewCase({...newCase, priority: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-200">
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                            <option>Critical</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-slate-400 mb-1">Notes / Description</label>
                          <textarea required value={newCase.notes} onChange={e => setNewCase({...newCase, notes: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 h-20"></textarea>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-slate-400 mb-1">Action Plan</label>
                          <input type="text" value={newCase.action_plan} onChange={e => setNewCase({...newCase, action_plan: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-200" placeholder="e.g. Schedule remedial classes" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Follow-up Date</label>
                          <input type="date" value={newCase.follow_up_date} onChange={e => setNewCase({...newCase, follow_up_date: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-200" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setCaseForm(false)} className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg">Create Case</button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-4">
                    {data.interventions.length === 0 ? (
                      <p className="text-xs text-slate-500">No intervention cases found.</p>
                    ) : (
                      data.interventions.map((inv: any) => (
                        <div key={inv.id} className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="text-xs font-mono text-slate-500 mb-1">CASE ID: {inv.id}</div>
                              <h4 className="text-sm font-semibold text-slate-200">{inv.issue_type}</h4>
                            </div>
                            <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300">{inv.status}</span>
                          </div>
                          <p className="text-sm text-slate-400 mb-3">{inv.notes}</p>
                          {inv.action_plan && (
                            <div className="text-xs p-2 bg-indigo-950/20 border border-indigo-900/30 text-indigo-300 rounded mb-3">
                              <strong>Action Plan:</strong> {inv.action_plan}
                            </div>
                          )}
                          <div className="text-xs text-slate-500">Created: {new Date(inv.created_at).toLocaleDateString()} {inv.follow_up_date && `| Follow-up: ${new Date(inv.follow_up_date).toLocaleDateString()}`}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'alerts' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4">Recent Alerts</h3>
                  {data.alerts.length === 0 ? (
                    <p className="text-xs text-slate-500">No alerts found.</p>
                  ) : (
                    data.alerts.map((alert: any) => (
                      <div key={alert.id} className={`p-4 rounded-xl border ${alert.severity === 'CRITICAL' ? 'bg-rose-950/20 border-rose-900/30' : 'bg-amber-950/20 border-amber-900/30'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldAlert className={`w-4 h-4 ${alert.severity === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'}`} />
                          <h4 className={`text-sm font-semibold ${alert.severity === 'CRITICAL' ? 'text-rose-300' : 'text-amber-300'}`}>{alert.title}</h4>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">{alert.message}</p>
                        <div className="text-[10px] text-slate-500 mt-2">{new Date(alert.created_at).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
