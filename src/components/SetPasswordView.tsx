import React, { useState } from 'react';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { getSupabase } from '../lib/supabaseClient';

// Shown after someone opens an invite or password-reset email link. Supabase
// signs them in from the link itself, so without this screen an invited user
// would land in the CRM with no password ever set.

// Captured at module load, before the Supabase client parses and clears the
// URL hash (#access_token=...&type=invite).
export const arrivedFromAuthLink = /[#&?]type=(invite|recovery)\b/.test(
  window.location.hash + window.location.search
);

export const SetPasswordView: React.FC<{ email: string; onDone: () => void }> = ({ email, onDone }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 10) return setError('Use at least 10 characters.');
    if (password !== confirm) return setError('The two passwords do not match.');

    setSaving(true);
    const { error } = await getSupabase().auth.updateUser({ password });
    setSaving(false);
    if (error) return setError(error.message);

    window.history.replaceState(null, '', window.location.pathname);
    onDone();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="penthouse-bg" aria-hidden="true" />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md glass-modal border border-white/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 text-xs text-slate-900"
      >
        <h1 className="text-lg font-bold">Set your password</h1>
        <p className="text-slate-600">
          Signed in as <span className="font-bold">{email}</span>. Choose a password for future sign-ins.
        </p>

        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-center gap-2 text-rose-950">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {[
          { id: 'new-password', label: 'New password', value: password, set: setPassword },
          { id: 'confirm-password', label: 'Confirm password', value: confirm, set: setConfirm },
        ].map((f) => (
          <div key={f.id}>
            <label htmlFor={f.id} className="block font-bold mb-1">{f.label}</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                id={f.id}
                type="password"
                autoComplete="new-password"
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 glass-input font-medium"
              />
            </div>
          </div>
        ))}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-gradient-to-r from-[#831843] to-[#9f1239] text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {saving ? 'Saving...' : 'Save password'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
