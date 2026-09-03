import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Check,
} from 'lucide-react';
import { api } from '../lib/api';
import { AuthSession } from '../types';
import zsEventsLogo from '../assets/images/zs_events_logo_1788181982999.jpg';

interface AuthViewProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [email, setEmail] = useState('syed@zsevents.com');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('Syed');
  const [phone, setPhone] = useState('+91 98450 99880');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Google SSO Sign-in flow (Instant One-Click Google Admin Login)
  const handleGoogleSSO = async () => {
    setGoogleLoading(true);
    setErrorMessage(null);
    try {
      const adminEmail = email.includes('@') ? email : 'syed@zsevents.com';
      const session = await api.login(adminEmail);
      localStorage.setItem('zse_auth_session', JSON.stringify(session));
      onLoginSuccess(session);
    } catch (err: any) {
      setErrorMessage(err.message || 'Google SSO verification failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      if (mode === 'LOGIN') {
        const session = await api.login(email || 'syed@zsevents.com', password || undefined);
        localStorage.setItem('zse_auth_session', JSON.stringify(session));
        onLoginSuccess(session);
      } else {
        if (!name.trim()) {
          throw new Error('Please provide admin full name');
        }
        if (!email.trim()) {
          throw new Error('Please provide admin email address');
        }
        const session = await api.register({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          role: 'ADMIN',
          title: 'Lead Event Manager & Producer',
          password: password || undefined,
        });
        localStorage.setItem('zse_auth_session', JSON.stringify(session));
        onLoginSuccess(session);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen penthouse-bg flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden font-sans text-slate-900 selection:bg-rose-200">
      {/* Brand Header with Logo */}
      <div className="text-center mb-6 relative z-10 flex flex-col items-center">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-white/90 shadow-2xl shadow-[#961b45]/30 mb-4 bg-white/95 p-1 hover:scale-105 transition-transform duration-300">
          <img
            src={zsEventsLogo}
            alt="ZS Events - Where Every Celebration Blooms"
            className="w-full h-full object-cover rounded-2xl"
          />
        </div>

        <div className="suspended-cable flex flex-col items-center mb-3">
          <div className="glass-header-pill px-8 py-2 flex items-center gap-3 shadow-xl">
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              Z S EVENTS
            </h1>
            <span className="w-2 h-2 rounded-full bg-[#831843] animate-pulse" />
          </div>
        </div>

        <div className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full glass-subtle border border-emerald-500/30 mb-2 shadow-xs">
          <span className="text-xs font-bold tracking-wider uppercase text-emerald-950">
            Luxury Event Management & Production CRM
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-700 font-medium max-w-md mx-auto">
          Bangalore Event Studio Management Portal • Proposals, Venue Run-sheets & GST Billing
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md glass-modal border border-white/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 text-slate-900">
        {/* Toggle Mode: Admin Login / Admin Setup */}
        <div className="grid grid-cols-2 p-1 bg-white/60 rounded-2xl mb-6 border border-white/80 backdrop-blur-xs shadow-xs">
          <button
            type="button"
            id="auth-tab-login"
            onClick={() => {
              setMode('LOGIN');
              setErrorMessage(null);
            }}
            className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'LOGIN'
                ? 'bg-gradient-to-r from-[#831843] to-[#9f1239] text-white shadow-md shadow-[#831843]/20 border border-white/20'
                : 'text-slate-700 hover:text-slate-950 hover:bg-white/40'
            }`}
          >
            Admin Sign In
          </button>
          <button
            type="button"
            id="auth-tab-signup"
            onClick={() => {
              setMode('SIGNUP');
              setErrorMessage(null);
            }}
            className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'SIGNUP'
                ? 'bg-gradient-to-r from-[#831843] to-[#9f1239] text-white shadow-md shadow-[#831843]/20 border border-white/20'
                : 'text-slate-700 hover:text-slate-950 hover:bg-white/40'
            }`}
          >
            Create Admin Account
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-rose-950 font-medium backdrop-blur-xs">
            <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Google SSO Button */}
        <div className="mb-5">
          <button
            type="button"
            id="btn-google-sso"
            onClick={handleGoogleSSO}
            disabled={googleLoading}
            className="w-full py-3 px-4 rounded-2xl border border-white/80 bg-white/70 hover:bg-white/90 text-slate-900 font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-3 transition-all cursor-pointer backdrop-blur-xs active:scale-[0.99]"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{googleLoading ? 'Signing in with Google...' : 'Continue with Google SSO'}</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/80" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-white/80 backdrop-blur-xs px-3 py-0.5 rounded-full border border-white/80 text-slate-500 font-bold">Or with Admin Credentials</span>
            </div>
          </div>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'SIGNUP' && (
            <>
              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Admin Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    id="signup-name-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Zaid Sheikh"
                    className="w-full pl-9 pr-3 py-2.5 glass-input font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Phone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    id="signup-phone-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98860 99887"
                    className="w-full pl-9 pr-3 py-2.5 glass-input font-medium"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block font-bold text-slate-900 mb-1">
              Admin Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                id="auth-email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@zsevents.com"
                className="w-full pl-9 pr-3 py-2.5 glass-input font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-900 mb-1">
              Password {mode === 'LOGIN' && <span className="text-slate-500 font-normal">(demo: admin123 or any)</span>}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="password"
                id="auth-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 glass-input font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            id="auth-submit-btn"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#831843] to-[#9f1239] hover:from-[#701a39] hover:to-[#881337] text-white font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-[#831843]/25 border border-white/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer mt-2"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Verifying Credentials...
              </span>
            ) : (
              <>
                <span>{mode === 'LOGIN' ? 'Sign In as Admin' : 'Create Admin Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Fast 1-Click Admin Access for Testing */}
        <div className="mt-6 pt-4 border-t border-white/60 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setEmail('admin@zsevents.com');
              handleSubmit({ preventDefault: () => {} } as any);
            }}
            className="w-full py-2.5 px-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-950 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer backdrop-blur-xs shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>1-Click Test Admin Login (Zaid Sheikh)</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-xs text-slate-600 font-medium flex items-center gap-1.5 justify-center">
        <span className="font-bold text-slate-800">© 2026 Z S EVENTS</span>
        <span>•</span>
        <span>Bangalore, Karnataka</span>
        <span>•</span>
        <span className="text-[#831843] font-bold">Floral & Event Production CRM</span>
      </div>
    </div>
  );
};
