import React, { useState } from 'react';
import { Recommendation, StudentAnalytics } from '../../types';
import { Lightbulb, Sparkles, CheckCircle2, Clock, BookOpen, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../../api/client';

interface PersonalizedRecommendationsProps {
  recommendations: Recommendation[];
  analytics: StudentAnalytics;
}

export const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({
  recommendations,
  analytics
}) => {
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

  const toggleStep = (stepId: string) => {
    setCompletedSteps(prev => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const handleGenerateAiInsight = async () => {
    setLoadingAi(true);
    try {
      const res = await api.getAiDiagnostic(analytics.studentId);
      setAiReport(res.aiGeneratedReport);
    } catch (err: any) {
      alert('Failed to generate AI insights: ' + err.message);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <span>Personalized Academic Interventions & Study Plans</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Targeted remediation roadmaps generated from actual performance deficits and continuous assessment metrics
          </p>
        </div>

        <button
          onClick={handleGenerateAiInsight}
          disabled={loadingAi}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all shadow-md shadow-indigo-600/20 shrink-0"
        >
          <Sparkles className="w-4 h-4 text-indigo-200" />
          <span>{loadingAi ? 'Synthesizing Diagnostic...' : 'Generate AI Pedagogical Diagnostic'}</span>
        </button>
      </div>

      {/* AI Diagnostic Commentary Card if generated */}
      {aiReport && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-indigo-950/40 border border-indigo-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>AI Pedagogical Counseling Intelligence (Gemini Diagnostic)</span>
            </div>
            <span className="text-[10px] font-mono text-indigo-400/80">CSE Department Academic Advisor</span>
          </div>

          <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line bg-slate-950/60 p-4 rounded-xl border border-indigo-900/40 font-sans">
            {aiReport}
          </div>
        </div>
      )}

      {/* Structured Action Recommendations List */}
      <div className="space-y-4">
        {recommendations.map((rec) => {
          const isHigh = rec.priority === 'HIGH';

          return (
            <div
              key={rec.id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${isHigh ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                    {rec.category === 'ATTENDANCE_CRITICAL' ? <Clock className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100">{rec.title}</h2>
                    <div className="text-[11px] text-slate-400">
                      Target Course: {rec.subjectCode || 'General Continuous Evaluation'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[10px] font-mono rounded font-semibold uppercase ${
                    isHigh
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}>
                    {rec.priority} Priority
                  </span>
                </div>
              </div>

              {/* Rationale */}
              <div className="text-xs text-slate-300 bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
                <span className="font-semibold text-slate-200">Analytical Rationale: </span>
                <span>{rec.rationale}</span>
              </div>

              {/* Actionable Steps with Checkbox Checklist */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Recommended Action Steps (Check when completed):
                </div>
                <div className="space-y-2">
                  {rec.actionableSteps.map((step, idx) => {
                    const stepKey = `${rec.id}_${idx}`;
                    const isDone = completedSteps[stepKey];

                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => toggleStep(stepKey)}
                        className={`w-full text-left p-3 rounded-lg border text-xs flex items-start gap-3 transition-colors ${
                          isDone
                            ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300 line-through'
                            : 'bg-slate-950/40 hover:bg-slate-950/80 border-slate-800 text-slate-200'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                          isDone ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-600'
                        }`}>
                          {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
