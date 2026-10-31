import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, ArrowRight, AlertCircle, Eye, EyeOff, Award, User, Lock, Sparkles, Database } from 'lucide-react';

export const StudentLogin: React.FC = () => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('S001');
  const [password, setPassword] = useState('student123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roll: string, pwd: string) => {
    setIdentifier(roll);
    setPassword(pwd);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-3">
          <Database className="w-3.5 h-3.5" />
          <span>Live Dataset Trained System</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Student Sign In
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Sign in with any student ID from your dataset (<span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">S001 – S200</span> or <span className="font-mono font-bold">2420030520</span>)
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Roll Number / Student ID (from Dataset)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. S001, S005, S021 or 2420030520"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-600/30 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Student Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins From Dataset */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              1-Click Dataset Profiles (Pass: student123)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('S001', 'student123')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-center transition-colors cursor-pointer group"
              >
                <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 font-mono">
                  S001
                </div>
                <div className="text-[9px] text-slate-500 dark:text-slate-400">Dataset Row 1</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('S005', 'student123')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-center transition-colors cursor-pointer group"
              >
                <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 font-mono">
                  S005
                </div>
                <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">Score: 40.3</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('S021', 'student123')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-center transition-colors cursor-pointer group"
              >
                <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 font-mono">
                  S021
                </div>
                <div className="text-[9px] text-indigo-600 dark:text-indigo-400 font-semibold">Score: 46.0</div>
              </button>
            </div>
          </div>
        </div>

        {/* Portal Switcher Footer */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
          <a href="/faculty-login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Faculty Portal →
          </a>
          <span>·</span>
          <a href="/admin-login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Admin Portal →
          </a>
          <span>·</span>
          <a href="/parent-login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Parent Portal →
          </a>
        </div>
      </div>
    </div>
  );
};
