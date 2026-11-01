import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  Briefcase,
  ShieldAlert,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Award,
  CheckCircle2,
  Lock,
  User,
  Activity,
  Layers,
  ChevronRight,
  Database
} from 'lucide-react';

type RoleTab = 'STUDENT' | 'FACULTY' | 'ADMIN';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [roleTab, setRoleTab] = useState<RoleTab>('STUDENT');
  const [identifier, setIdentifier] = useState('2420030533');
  const [password, setPassword] = useState('2420030533');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTabChange = (tab: RoleTab) => {
    setRoleTab(tab);
    setError('');
    if (tab === 'STUDENT') {
      setIdentifier('2420030533');
      setPassword('2420030533');
    } else if (tab === 'FACULTY') {
      setIdentifier('EMP-CSE-042');
      setPassword('guide123');
    } else {
      setIdentifier('admin@cse.college.edu');
      setPassword('admin123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans text-slate-100">
      {/* Background ambient light effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[350px] bg-violet-600/10 blur-[110px] rounded-full pointer-events-none" />

      {/* Header / Brand */}
      <div className="relative z-10 text-center mb-8 max-w-md w-full">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 text-xs font-semibold mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>AKTERA Intelligence & Early Warning System</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
          Academic ERP Portal
        </h1>
        <p className="text-sm text-slate-400">
          AI-powered predictive student analytics, retention & mentoring
        </p>
      </div>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-3xl shadow-2xl p-6 sm:p-8">
          
          {/* Role Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/70 border border-slate-800/80 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => handleTabChange('STUDENT')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                roleTab === 'STUDENT'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('FACULTY')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                roleTab === 'FACULTY'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Faculty</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('ADMIN')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                roleTab === 'ADMIN'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-900/70 flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {roleTab === 'STUDENT'
                  ? 'Student ID / Roll Number (from Dataset)'
                  : roleTab === 'FACULTY'
                  ? 'Faculty Employee ID'
                  : 'Admin Email'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder={
                    roleTab === 'STUDENT'
                      ? 'Roll No: 2420030533, 2420030520, etc.'
                      : roleTab === 'FACULTY'
                      ? 'EMP-CSE-042'
                      : 'admin@cse.college.edu'
                  }
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : `Sign In to ${roleTab === 'STUDENT' ? 'Student' : roleTab === 'FACULTY' ? 'Faculty' : 'Admin'} Dashboard`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase text-center mb-3">
              1-Click Demo Profiles ({roleTab})
            </div>

            {roleTab === 'STUDENT' && (
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => { setIdentifier('2420030533'); setPassword('2420030533'); }}
                  className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-800 text-center transition-all cursor-pointer group"
                >
                  <div className="text-xs font-mono font-bold text-white group-hover:text-indigo-400">2420030533</div>
                  <div className="text-[10px] text-slate-400">Rahul Verma</div>
                </button>
                <button
                  type="button"
                  onClick={() => { setIdentifier('2420030520'); setPassword('2420030520'); }}
                  className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-800 text-center transition-all cursor-pointer group"
                >
                  <div className="text-xs font-mono font-bold text-emerald-400 group-hover:text-emerald-300">2420030520</div>
                  <div className="text-[10px] text-slate-400">P. TejAditya</div>
                </button>
                <button
                  type="button"
                  onClick={() => { setIdentifier('2420030512'); setPassword('2420030512'); }}
                  className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-800 text-center transition-all cursor-pointer group"
                >
                  <div className="text-xs font-mono font-bold text-indigo-400 group-hover:text-indigo-300">2420030512</div>
                  <div className="text-[10px] text-slate-400">G. Akshath</div>
                </button>
              </div>
            )}

            {roleTab === 'FACULTY' && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setIdentifier('EMP-CSE-042'); setPassword('guide123'); }}
                  className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-800 text-left transition-all cursor-pointer group"
                >
                  <div className="text-xs font-bold text-white group-hover:text-indigo-400">Dr. Pratusha Mam</div>
                  <div className="text-[10px] text-slate-400 font-mono">EMP-CSE-042 (Guide)</div>
                </button>
                <button
                  type="button"
                  onClick={() => { setIdentifier('EMP-CSE-058'); setPassword('faculty123'); }}
                  className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-800 text-left transition-all cursor-pointer group"
                >
                  <div className="text-xs font-bold text-white group-hover:text-indigo-400">Prof. Ramanathan</div>
                  <div className="text-[10px] text-slate-400 font-mono">EMP-CSE-058</div>
                </button>
              </div>
            )}

            {roleTab === 'ADMIN' && (
              <button
                type="button"
                onClick={() => { setIdentifier('admin@cse.college.edu'); setPassword('admin123'); }}
                className="w-full p-2.5 rounded-xl bg-slate-950/80 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-800 text-center transition-all cursor-pointer group"
              >
                <div className="text-xs font-bold text-white group-hover:text-indigo-400">Dr. S. K. Murthy (Admin)</div>
                <div className="text-[10px] text-slate-400 font-mono">admin@cse.college.edu</div>
              </button>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-500">
          <span>Capstone Project A.Y. 2026–2027</span>
          <span className="mx-2">·</span>
          <span>Department of CSE</span>
        </div>
      </div>
    </div>
  );
};
