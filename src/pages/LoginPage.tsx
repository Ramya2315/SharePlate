import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useToast } from '../contexts/ToastContext.tsx';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Building2, UtensilsCrossed, Truck } from 'lucide-react';
import { UserRole } from '../types/index.ts';

interface LoginPageProps {
  setCurrentPage: (page: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ setCurrentPage }) => {
  const { login, quickDemoLogin } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please provide email and password', 'error');
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      showToast('Welcome back! Signed in successfully.', 'success');
      setCurrentPage('landing');
    } catch (err: any) {
      showToast(err.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = async (role: UserRole) => {
    setLoading(true);
    try {
      await quickDemoLogin(role);
      showToast(`Signed in as ${role.toUpperCase()} account`, 'success');
      setCurrentPage('landing');
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#183B28] flex items-center justify-center font-bold text-lg mx-auto">
            🌿
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Sign in to RescueBite</h1>
          <p className="text-xs text-slate-500">
            Access your food redistribution dashboard and pickup requests
          </p>
        </div>

        {/* Quick Role Selection */}
        <div className="bg-[#FAF8F5] p-3 rounded-xl border border-slate-200/80 space-y-2">
          <span className="block text-[11px] font-semibold text-slate-700 text-center">
            Instant Role Access
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoSelect('provider')}
              className="p-2 bg-white rounded-lg border border-slate-200 hover:border-[#183B28] text-slate-700 hover:text-[#183B28] flex items-center gap-1.5 font-medium transition-colors"
            >
              <UtensilsCrossed className="w-3.5 h-3.5 text-[#183B28]" />
              <span>Provider</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoSelect('ngo')}
              className="p-2 bg-white rounded-lg border border-slate-200 hover:border-[#183B28] text-slate-700 hover:text-[#183B28] flex items-center gap-1.5 font-medium transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-[#183B28]" />
              <span>Verified NGO</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoSelect('volunteer')}
              className="p-2 bg-white rounded-lg border border-slate-200 hover:border-[#183B28] text-slate-700 hover:text-[#183B28] flex items-center gap-1.5 font-medium transition-colors"
            >
              <Truck className="w-3.5 h-3.5 text-[#183B28]" />
              <span>Volunteer</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoSelect('admin')}
              className="p-2 bg-white rounded-lg border border-slate-200 hover:border-[#183B28] text-slate-700 hover:text-[#183B28] flex items-center gap-1.5 font-medium transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#183B28]" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-white px-2 text-[11px] text-slate-400 uppercase tracking-wider relative">
            Or Sign In with Email
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@organization.org"
                required
                className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#183B28] bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-9 pr-10 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#183B28] bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-xs font-semibold text-white bg-[#183B28] hover:bg-[#122c1e] rounded-xl transition-colors shadow-xs disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <button
            onClick={() => setCurrentPage('register')}
            className="font-semibold text-[#183B28] hover:underline"
          >
            Register your organization
          </button>
        </p>
      </div>
    </div>
  );
};
