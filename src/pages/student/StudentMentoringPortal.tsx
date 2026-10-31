import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  HeartHandshake,
  UserCheck,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
  MessageSquare,
  Sparkles,
  Smile,
  Meh,
  Frown,
  CheckCircle2,
  Send,
  HelpCircle,
  FileCheck,
  AlertCircle
} from 'lucide-react';

export const StudentMentoringPortal: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Wellness Form state
  const [stress, setStress] = useState<number>(3);
  const [confidence, setConfidence] = useState<number>(4);
  const [studyHours, setStudyHours] = useState<number>(18);
  const [sleepHours, setSleepHours] = useState<number>(7);
  const [reflection, setReflection] = useState<string>('');
  const [wellnessSubmitting, setWellnessSubmitting] = useState<boolean>(false);
  const [wellnessSuccess, setWellnessSuccess] = useState<string>('');

  // Meeting Request state
  const [reqDate, setReqDate] = useState<string>('');
  const [reqTopic, setReqTopic] = useState<string>('Coursework & Mid-Term Preparation');
  const [reqReason, setReqReason] = useState<string>('');
  const [reqSubmitting, setReqSubmitting] = useState<boolean>(false);
  const [reqSuccess, setReqSuccess] = useState<string>('');

  const loadData = () => {
    setLoading(true);
    api.getMyMentor()
      .then(res => {
        setData(res);
        if (res.latestWellness) {
          setStress(res.latestWellness.stress_level || 3);
          setConfidence(res.latestWellness.confidence_level || 4);
          setStudyHours(res.latestWellness.study_hours_weekly || 18);
          setSleepHours(res.latestWellness.sleep_hours_daily || 7);
          setReflection(res.latestWellness.reflection_notes || '');
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleWellnessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWellnessSubmitting(true);
    setWellnessSuccess('');
    try {
      await api.submitWellnessCheckin({
        stressLevel: stress,
        confidenceLevel: confidence,
        studyHoursWeekly: studyHours,
        sleepHoursDaily: sleepHours,
        reflectionNotes: reflection
      });
      setWellnessSuccess('Your weekly academic wellness check-in has been shared with your mentor!');
      setTimeout(() => setWellnessSuccess(''), 4000);
      loadData();
    } catch (err: any) {
      alert('Failed to submit: ' + err.message);
    } finally {
      setWellnessSubmitting(false);
    }
  };

  const handleMeetingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqSubmitting(true);
    setReqSuccess('');
    try {
      await api.requestMentoringMeeting({
        preferredDate: reqDate,
        topic: reqTopic,
        reason: reqReason
      });
      setReqSuccess('Meeting request sent! Dr. Pratusha Mam will review during proctorial hours.');
      setReqReason('');
      setTimeout(() => setReqSuccess(''), 4000);
      loadData();
    } catch (err: any) {
      alert('Failed to submit meeting request: ' + err.message);
    } finally {
      setReqSubmitting(false);
    }
  };

  if (loading || !data) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading student mentoring portal...</div>;
  }

  const { mentor, sessions = [] } = data;

  return (
    <div className="space-y-6">
      {/* Humanized Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-900/60 border border-indigo-500/20 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-indigo-400" />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-300">
                Official University Proctorial & Mentoring Desk
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
              Personalized Mentorship & Wellness Hub
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Academic excellence thrives on consistent guidance and emotional balance. Connect directly with your assigned faculty mentor, log weekly reflections, and review past guidance sessions.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Sessions Logged</span>
              <span className="text-lg font-bold font-mono text-indigo-400">{sessions.length}</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Faculty Guide</span>
              <span className="text-xs font-bold text-slate-200">{mentor.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Mentor Profile Card & Wellness Check-in */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mentor Profile Card (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
          <div className="flex items-start gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white text-xl font-bold shadow-md shrink-0">
              {mentor.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono text-indigo-400 font-semibold uppercase">Assigned Proctor</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <h2 className="text-base font-bold text-slate-100">{mentor.name}</h2>
              <p className="text-xs text-slate-400">{mentor.designation}</p>
              <p className="text-[11px] text-indigo-300/80 mt-0.5">{mentor.department}</p>
            </div>
          </div>

          {/* Warm Welcome Message */}
          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-xs text-indigo-200/90 leading-relaxed italic">
            "{mentor.mentorWelcomeMessage}"
          </div>

          {/* Mentor Details */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center gap-2.5 text-slate-300">
              <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
              <span>{mentor.officeLocation}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300">
              <Clock className="w-4 h-4 text-slate-500 shrink-0" />
              <span><strong>Office Hours:</strong> {mentor.officeHours}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300">
              <Mail className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="font-mono text-indigo-300">{mentor.email}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300">
              <Phone className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="font-mono text-slate-300">{mentor.phone}</span>
            </div>
          </div>

          {/* Quick Request Meeting Button Form */}
          <div className="pt-3 border-t border-slate-800/80">
            <h3 className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Request 1-on-1 Mentoring Meeting</span>
            </h3>

            {reqSuccess && (
              <div className="mb-2 p-2 rounded bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{reqSuccess}</span>
              </div>
            )}

            <form onSubmit={handleMeetingSubmit} className="space-y-2 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Preferred Date</label>
                <input
                  type="date"
                  required
                  value={reqDate}
                  onChange={(e) => setReqDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Discussion Focus</label>
                <select
                  value={reqTopic}
                  onChange={(e) => setReqTopic(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                >
                  <option value="Coursework & Mid-Term Preparation">Coursework & Mid-Term Preparation</option>
                  <option value="Attendance Recovery & Condonation Advisory">Attendance Recovery & Condonation Advisory</option>
                  <option value="Capstone Project Guidance">Capstone Project Guidance</option>
                  <option value="Exam Stress & Time Management">Exam Stress & Time Management</option>
                  <option value="Internship & Career Planning">Internship & Career Planning</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Brief Note to Mentor</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Would like to discuss dynamic programming doubts and lab submission plan..."
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={reqSubmitting}
                className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{reqSubmitting ? 'Submitting...' : 'Submit Meeting Request'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Weekly Academic Wellness & Self-Reflection (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Weekly Academic Wellness & Self-Reflection Check-In</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Share your current state with your mentor so they can support your mental clarity and study pacing.
              </p>
            </div>
          </div>

          {wellnessSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{wellnessSuccess}</span>
            </div>
          )}

          <form onSubmit={handleWellnessSubmit} className="space-y-4">
            {/* Stress Rating */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Perceived Academic Stress & Workload:</span>
                <span className="font-mono font-bold text-indigo-300">
                  {stress === 1 ? '1/5 · Very Low' : stress === 2 ? '2/5 · Manageable' : stress === 3 ? '3/5 · Moderate' : stress === 4 ? '4/5 · High Pressure' : '5/5 · Overwhelming'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={stress}
                onChange={(e) => setStress(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Relaxed</span>
                <span>Balanced</span>
                <span>Under Severe Stress</span>
              </div>
            </div>

            {/* Confidence Rating */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Confidence in End-Term Preparation:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {confidence === 1 ? '1/5 · Very Unprepared' : confidence === 2 ? '2/5 · Struggling' : confidence === 3 ? '3/5 · Moderate' : confidence === 4 ? '4/5 · Confident' : '5/5 · Extremely High'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Low</span>
                <span>Average</span>
                <span>Peak Readiness</span>
              </div>
            </div>

            {/* Study & Sleep Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <label className="text-[11px] text-slate-400 block font-medium">Weekly Self-Study (Hours)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={studyHours}
                  onChange={(e) => setStudyHours(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <label className="text-[11px] text-slate-400 block font-medium">Avg Daily Sleep (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  min="3"
                  max="12"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Reflection Notes */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium block">
                Personal Academic Reflection & Notes for Proctor:
              </label>
              <textarea
                rows={3}
                placeholder="Share how your classes are going, which subjects feel comfortable, or if you feel stuck anywhere..."
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={wellnessSubmitting}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{wellnessSubmitting ? 'Saving...' : 'Update Academic Wellness Record'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Official Proctorial Mentoring Diary & Session History */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-400" />
              <span>Proctorial Diary & Official Mentoring History</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Official university counseling sessions, academic guidance notes, and agreed action plans
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded">
            {sessions.length} Sessions on Record
          </span>
        </div>

        <div className="space-y-3">
          {sessions.map((sess: any) => (
            <div
              key={sess.id}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-100">{sess.topic}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/50 border border-indigo-800/60 text-indigo-300">
                    {sess.session_type || 'ONE_ON_ONE'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="font-mono">{sess.session_date}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                    sess.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}>
                    {sess.status}
                  </span>
                </div>
              </div>

              {/* Mentor Notes */}
              <div className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800 leading-relaxed">
                <div className="text-[10px] uppercase font-mono text-indigo-400 font-semibold mb-1">
                  Mentor Remarks & Evaluation ({sess.faculty_name || 'Dr. Pratusha Mam'})
                </div>
                {sess.mentor_notes}
              </div>

              {/* Action Plan */}
              {sess.student_action_plan && (
                <div className="text-xs text-emerald-300/90 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-900/30">
                  <span className="font-semibold text-emerald-400 block text-[10px] uppercase font-mono">Agreed Action Plan:</span>
                  {sess.student_action_plan}
                </div>
              )}

              {/* Footer info */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Parent Communication: {sess.parent_informed ? 'Informed & Documented' : 'Not Required'}</span>
                {sess.follow_up_date && (
                  <span className="font-mono text-indigo-400">Next Follow-Up Target: {sess.follow_up_date}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
