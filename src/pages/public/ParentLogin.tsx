import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, AlertCircle, Eye, EyeOff, Award, User, Lock } from 'lucide-react';

export const ParentLogin: React.FC = () => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('parent.tejaditya@example.com');
  const [password, setPassword] = useState('parent123');
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

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-slate-100">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-900/15 via-transparent to-transparent pointer-events-none" />
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
          <Award className="w-3.5 h-3.5 text-indigo-400" />
          <span>Parent Portal</span>
        </div>
        <div className="flex items-center justify-center gap-2.5 mb-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Parent / Guardian Login</h1>
        </div>
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email / Phone</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500"><User className="w-4 h-4" /></div>
                <input type="text" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-indigo-500 font-mono tracking-wide" placeholder="e.g. email@example.com" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500"><Lock className="w-4 h-4" /></div>
                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-indigo-500 font-mono" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg">
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-4 pt-4 border-t border-slate-800 text-center">
            <a href="/student-login" className="text-xs text-slate-400 hover:text-indigo-400 mr-4">Student Portal</a>
            <a href="/faculty-login" className="text-xs text-slate-400 hover:text-indigo-400 mr-4">Faculty Portal</a>
            <a href="/admin-login" className="text-xs text-slate-400 hover:text-indigo-400">Admin Portal</a>
          </div>
        </div>
      </div>
    </div>
  );
};
