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
import { AuthSession } from '../types';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { sessionFromSupabase } from '../lib/session';
import zsEventsLogo from '../assets/images/zs_events_logo_1788181982999.jpg';

interface AuthViewProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickLoading, setQuickLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Dev-only quick login.
  //
  // Every reference to the demo credentials sits inside this one ternary. Vite
  // replaces import.meta.env.DEV with the literal `false` in a production
  // build, so the whole expression folds to `null` and the minifier drops the
  // untaken branch - the credentials never reach the shipped bundle. Reading
  // them into top-level consts instead would inline the strings unconditionally,
  // which is exactly the leak this shape avoids.
  const quickLogin =
    import.meta.env.DEV &&
    import.meta.env.VITE_DEMO_EMAIL &&
    import.meta.env.VITE_DEMO_PASSWORD
      ? {
          email: import.meta.env.VITE_DEMO_EMAIL as string,
          password: import.meta.env.VITE_DEMO_PASSWORD as string,
        }
      : null;

  const handleQuickLogin = async () => {
    if (!quickLogin) return;
    setQuickLoading(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      const { data, error } = await getSupabase().auth.signInWithPassword({
        email: quickLogin.email,
        password: quickLogin.password,
      });
      if (error) throw error;
      onLoginSuccess(await sessionFromSupabase(data.session!));
    } catch (err: any) {
      setErrorMessage(err.message || 'Quick login failed');
    } finally {
      setQuickLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setNotice(null);

    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured for this deployment.');
      }
      const supabase = getSupabase();

      if (!email.trim()) throw new Error('Please provide your email address');
      if (!password) throw new Error('Please enter your password');

      if (mode === 'LOGIN') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        onLoginSuccess(await sessionFromSupabase(data.session!));
      } else {
        if (!name.trim()) throw new Error('Please provide your full name');
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters');
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              name: name.trim(),
              phone: phone.trim(),
              // First account bootstraps the studio, so it is the admin.
              role: 'ADMIN',
              title: 'Lead Event Manager & Producer',
            },
          },
        });
        if (error) throw error;

        // With "Confirm email" enabled Supabase returns no session yet.
        if (!data.session) {
          setNotice(
            'Account created. Check your inbox to confirm the email address, then sign in.'
          );
          setMode('LOGIN');
          return;
        }
        onLoginSuccess(await sessionFromSupabase(data.session));
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

        {/* Success / confirmation notice */}
        {notice && (
          <div className="mb-5 p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-950 font-medium backdrop-blur-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

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
              Password <span className="text-rose-500">*</span>
              {mode === 'SIGNUP' && (
                <span className="text-slate-500 font-normal"> (minimum 8 characters)</span>
              )}
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

        {/* Dev-only quick login */}
        {quickLogin && (
          <div className="mt-6 pt-4 border-t border-white/60">
            <button
              type="button"
              id="btn-quick-login"
              onClick={handleQuickLogin}
              disabled={quickLoading}
              className="w-full py-2.5 px-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-950 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer backdrop-blur-xs shadow-xs disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>
                {quickLoading ? 'Signing in...' : `One-Click Login (${quickLogin.email})`}
              </span>
            </button>
            <p className="mt-2 text-[10px] text-slate-500 font-medium text-center">
              Development only — this button is absent from production builds.
            </p>
          </div>
        )}

        {!quickLogin && (
          <div className="mt-6 pt-4 border-t border-white/60">
            <p className="text-[11px] text-slate-600 font-medium text-center">
              {mode === 'LOGIN'
                ? 'Accounts are managed in Supabase. Use Studio Setup to create the first one.'
                : 'The first account created becomes the studio administrator.'}
            </p>
          </div>
        )}
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
