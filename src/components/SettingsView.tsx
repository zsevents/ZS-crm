import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  User as UserIcon,
  Smartphone,
  Bell,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Copy,
  LogOut,
  RefreshCw,
  Laptop,
  CheckCircle2,
  Mail,
  Phone,
  Lock,
  Sparkles,
  QrCode,
  Globe,
  Sliders,
  RotateCcw,
  Clock,
  Shield,
  Trash2,
  Save,
  Send,
} from 'lucide-react';
import { BusinessSettings, User } from '../types';
import zsEventsLogo from '../assets/images/zs_events_logo_1788181982999.jpg';

interface SettingsViewProps {
  settings?: BusinessSettings;
  currentUser?: User;
  onSaveSettings?: (updates: Partial<BusinessSettings>) => Promise<void>;
  onUpdateUser?: (updates: Partial<User>) => Promise<void> | void;
}

type TabType = 'PASSWORD' | 'PROFILE' | '2FA_SESSIONS' | 'NOTIFICATIONS' | 'AUDIT_PREFS';

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  currentUser,
  onSaveSettings,
  onUpdateUser,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('PASSWORD');

  // User Profile Form State
  const [name, setName] = useState(currentUser?.name || 'Syed');
  const [email, setEmail] = useState(currentUser?.email || 'syed@zsevents.com');
  const [phone, setPhone] = useState(currentUser?.phone || '+91 98450 99880');
  const [title, setTitle] = useState(currentUser?.title || 'Lead Event Manager & Producer');
  const [avatarTheme, setAvatarTheme] = useState<'plum' | 'emerald' | 'rose' | 'slate'>('plum');
  const [profileSaved, setProfileSaved] = useState(false);

  // Password & Reset Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [enforce90Days, setEnforce90Days] = useState(true);
  const [logoutOtherSessions, setLogoutOtherSessions] = useState(true);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // 2FA State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const [testOtp, setTestOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Active Sessions State
  const [sessions, setSessions] = useState([
    {
      id: 'sess-01',
      device: 'MacBook Pro 16" · macOS Sonoma',
      browser: 'Chrome 128.0',
      location: 'Bangalore, Karnataka, India',
      ip: '49.207.182.14',
      isCurrent: true,
      lastActive: 'Active Now',
    },
    {
      id: 'sess-02',
      device: 'iPhone 15 Pro Max · iOS 18.1',
      browser: 'Mobile Safari',
      location: 'Bangalore, Karnataka, India',
      ip: '157.49.22.89',
      isCurrent: false,
      lastActive: '2 hours ago',
    },
    {
      id: 'sess-03',
      device: 'Studio Staging iPad Pro 12.9"',
      browser: 'Safari Kiosk Mode',
      location: 'Lavelle Road Studio, Bangalore',
      ip: '49.207.182.15',
      isCurrent: false,
      lastActive: 'Yesterday at 6:45 PM',
    },
  ]);
  const [revokedNotice, setRevokedNotice] = useState<string | null>(null);

  // Notification Preferences
  const [notifWhatsAppLeads, setNotifWhatsAppLeads] = useState(true);
  const [notifWhatsAppConflicts, setNotifWhatsAppConflicts] = useState(true);
  const [notifEmailDailyDigest, setNotifEmailDailyDigest] = useState(true);
  const [notifEmailInvoices, setNotifEmailInvoices] = useState(true);
  const [notifSmsMilestones, setNotifSmsMilestones] = useState(false);
  const [notifVipPings, setNotifVipPings] = useState(true);
  const [notifSaved, setNotifSaved] = useState(false);

  // Studio Preferences
  const [currency, setCurrency] = useState(settings?.currency || 'INR');
  const [autoSaveInterval, setAutoSaveInterval] = useState('30s');
  const [timezone, setTimezone] = useState('Asia/Kolkata (IST, UTC+5:30)');
  const [cacheCleared, setCacheCleared] = useState(false);

  // Password criteria computation
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const strengthScore = [hasMinLength, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;

  const getStrengthLabel = () => {
    if (!newPassword) return { text: 'None', color: 'bg-slate-200 text-slate-500' };
    if (strengthScore === 1) return { text: 'Weak', color: 'bg-rose-500 text-white' };
    if (strengthScore === 2) return { text: 'Fair', color: 'bg-amber-500 text-white' };
    if (strengthScore === 3) return { text: 'Good', color: 'bg-emerald-500 text-white' };
    return { text: 'Luxury-Grade Strong', color: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white' };
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current account password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    setTimeout(() => {
      setIsUpdatingPassword(false);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3500);
    }, 800);
  };

  const handleSendResetEmail = () => {
    setResetEmailSent(true);
    setTimeout(() => setResetEmailSent(false), 5000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateUser) {
      onUpdateUser({
        name,
        email,
        phone,
        title,
      });
    }
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleRevokeSession = (sessionId: string) => {
    setSessions(sessions.filter((s) => s.id !== sessionId));
    setRevokedNotice('Session has been revoked and logged out.');
    setTimeout(() => setRevokedNotice(null), 3000);
  };

  const handleRevokeAllOther = () => {
    setSessions(sessions.filter((s) => s.isCurrent));
    setRevokedNotice('All remote devices have been signed out successfully.');
    setTimeout(() => setRevokedNotice(null), 3000);
  };

  const handleCopyCodes = () => {
    navigator.clipboard.writeText('ZSE-8842-1982\nZSE-9912-4410\nZSE-5521-7789\nZSE-3310-6644\nZSE-1190-8821\nZSE-7744-2201');
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const backupCodes = [
    'ZSE-8842-1982',
    'ZSE-9912-4410',
    'ZSE-5521-7789',
    'ZSE-3310-6644',
    'ZSE-1190-8821',
    'ZSE-7744-2201',
  ];

  const auditLogs = [
    {
      id: 'log-01',
      action: 'Account Login Successful',
      ip: '49.207.182.14',
      device: 'MacBook Pro · Chrome',
      location: 'Bangalore, India',
      status: 'SUCCESS',
      time: 'Today at 08:30 AM',
    },
    {
      id: 'log-02',
      action: 'Two-Factor Authentication Passed',
      ip: '49.207.182.14',
      device: 'MacBook Pro · Chrome',
      location: 'Bangalore, India',
      status: 'SUCCESS',
      time: 'Today at 08:30 AM',
    },
    {
      id: 'log-03',
      action: 'Mobile App Session Refreshed',
      ip: '157.49.22.89',
      device: 'iPhone 15 Pro · Safari',
      location: 'Bangalore, India',
      status: 'SUCCESS',
      time: 'Yesterday at 09:15 PM',
    },
    {
      id: 'log-04',
      action: 'GST Quotation Export Audit Verified',
      ip: '49.207.182.14',
      device: 'MacBook Pro · Chrome',
      location: 'Bangalore, India',
      status: 'SUCCESS',
      time: '28 Aug 2026, 04:12 PM',
    },
  ];

  return (
    <div className="space-y-8 pb-16 text-slate-900 selection:bg-rose-200 selection:text-[#831843]">
      {/* 1. TOP SUSPENDED CAPSULE HEADER */}
      <div className="flex flex-col items-center justify-center pt-2">
        <div className="suspended-cable flex flex-col items-center">
          <div className="glass-header-pill px-8 py-2.5 flex items-center gap-3 shadow-xl hover:scale-102 transition-all">
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              Account & Security Settings
            </h1>
            <span className="w-2.5 h-2.5 rounded-full bg-[#961b45] animate-pulse" />
          </div>
        </div>
        <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full glass-subtle border border-rose-200/80 text-[11px] font-bold text-slate-600 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-[#961b45]" />
          <span>256-bit AES Encrypted • Admin Credentials & Password Controls</span>
        </div>
      </div>

      {/* 2. MASTER FLOATING GLASS SCREEN CONTAINER */}
      <div className="glass-screen p-5 sm:p-7 md:p-8 space-y-6">
        
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-rose-100/60 no-scrollbar">
          <button
            id="tab-btn-password"
            onClick={() => setActiveTab('PASSWORD')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'PASSWORD'
                ? 'glass-btn-primary text-white shadow-lg shadow-[#961b45]/30'
                : 'glass-btn-secondary text-slate-700 hover:text-slate-950'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Reset & Password</span>
          </button>

          <button
            id="tab-btn-profile"
            onClick={() => setActiveTab('PROFILE')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'PROFILE'
                ? 'glass-btn-primary text-white shadow-lg shadow-[#961b45]/30'
                : 'glass-btn-secondary text-slate-700 hover:text-slate-950'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Profile & Identity</span>
          </button>

          <button
            id="tab-btn-2fa"
            onClick={() => setActiveTab('2FA_SESSIONS')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === '2FA_SESSIONS'
                ? 'glass-btn-primary text-white shadow-lg shadow-[#961b45]/30'
                : 'glass-btn-secondary text-slate-700 hover:text-slate-950'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>2FA & Sessions</span>
            {twoFactorEnabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            id="tab-btn-notifications"
            onClick={() => setActiveTab('NOTIFICATIONS')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'NOTIFICATIONS'
                ? 'glass-btn-primary text-white shadow-lg shadow-[#961b45]/30'
                : 'glass-btn-secondary text-slate-700 hover:text-slate-950'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Alerts & Notifications</span>
          </button>

          <button
            id="tab-btn-audit"
            onClick={() => setActiveTab('AUDIT_PREFS')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'AUDIT_PREFS'
                ? 'glass-btn-primary text-white shadow-lg shadow-[#961b45]/30'
                : 'glass-btn-secondary text-slate-700 hover:text-slate-950'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Security Logs & Studio</span>
          </button>
        </div>

        {/* Global Feedback Notifications */}
        {passwordSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Password updated successfully! Your account credentials have been securely refreshed.</span>
          </div>
        )}

        {resetEmailSent && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-[#961b45] text-xs font-bold flex items-center gap-3 animate-in fade-in">
            <Mail className="w-5 h-5 text-[#961b45] shrink-0" />
            <span>Password reset link sent to <strong>{email}</strong>. Please check your inbox and follow the secure link.</span>
          </div>
        )}

        {passwordError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        {revokedNotice && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-3 animate-in fade-in">
            <Check className="w-5 h-5 text-amber-600 shrink-0" />
            <span>{revokedNotice}</span>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 1: RESET PASSWORD & SECURITY AUTHENTICATION                       */}
        {/* ==================================================================== */}
        {activeTab === 'PASSWORD' && (
          <div className="space-y-6">
            
            {/* Quick Email Reset Capsule Banner */}
            <div className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-rose-200/60 bg-gradient-to-r from-rose-50/70 to-white/70">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-[#961b45] shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Forgot your existing password?</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    We can dispatch a secure one-time password reset link to your registered email <strong>({email})</strong>.
                  </p>
                </div>
              </div>

              <button
                id="btn-send-reset-email"
                type="button"
                onClick={handleSendResetEmail}
                className="px-4 py-2.5 rounded-xl glass-btn-primary text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-[#961b45]/20 shrink-0 cursor-pointer active:scale-98"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Reset Link</span>
              </button>
            </div>

            {/* Change Password Form */}
            <form onSubmit={handlePasswordSubmit} className="glass-card p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <KeyRound className="w-5 h-5 text-[#961b45]" />
                  <h3 className="text-base font-black text-slate-900">Update Account Password</h3>
                </div>
                <span className="text-[11px] font-bold text-slate-500">
                  Last changed: 35 days ago
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* 1. Current Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Current Password <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="input-current-password"
                      type={showCurrentPw ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 text-xs font-medium glass-input pr-10 text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 2. New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    New Password <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="input-new-password"
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full px-3.5 py-2.5 text-xs font-medium glass-input pr-10 text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 3. Confirm New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Confirm New Password <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="input-confirm-password"
                      type={showConfirmPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      className="w-full px-3.5 py-2.5 text-xs font-medium glass-input pr-10 text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Strength Indicator Meter */}
              {newPassword && (
                <div className="p-4 rounded-2xl glass-subtle border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Password Strength:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${getStrengthLabel().color}`}>
                      {getStrengthLabel().text}
                    </span>
                  </div>

                  {/* 4-step bar */}
                  <div className="grid grid-cols-4 gap-1.5 h-2">
                    <div className={`rounded-full ${strengthScore >= 1 ? 'bg-rose-500' : 'bg-slate-200'}`} />
                    <div className={`rounded-full ${strengthScore >= 2 ? 'bg-amber-500' : 'bg-slate-200'}`} />
                    <div className={`rounded-full ${strengthScore >= 3 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    <div className={`rounded-full ${strengthScore >= 4 ? 'bg-teal-500' : 'bg-slate-200'}`} />
                  </div>

                  {/* Checklist */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                    <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                      <Check className="w-3.5 h-3.5" /> 8+ Characters
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                      <Check className="w-3.5 h-3.5" /> Uppercase Letter
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                      <Check className="w-3.5 h-3.5" /> At least 1 Number
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                      <Check className="w-3.5 h-3.5" /> Special Character
                    </div>
                  </div>
                </div>
              )}

              {/* Security Preferences Toggles */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enforce90Days}
                    onChange={(e) => setEnforce90Days(e.target.checked)}
                    className="w-4 h-4 rounded text-[#961b45] accent-[#961b45]"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900">Enforce periodic password rotation (Every 90 days)</span>
                    <p className="text-[11px] text-slate-500">Automated studio security prompt to keep CRM and customer financials protected.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={logoutOtherSessions}
                    onChange={(e) => setLogoutOtherSessions(e.target.checked)}
                    className="w-4 h-4 rounded text-[#961b45] accent-[#961b45]"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900">Sign out of all other devices & tablets upon password update</span>
                    <p className="text-[11px] text-slate-500">Instantly invalidates active tokens on mobile Safari, staging kiosks, and crew laptops.</p>
                  </div>
                </label>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-3 border-t border-slate-200/60">
                <button
                  id="btn-submit-update-password"
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="px-6 py-2.5 rounded-2xl glass-btn-primary text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#961b45]/25 cursor-pointer hover:scale-102 active:scale-98 transition-all disabled:opacity-50"
                >
                  {isUpdatingPassword ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Encrypting & Updating...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Update Password Now</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: PROFILE & IDENTITY                                             */}
        {/* ==================================================================== */}
        {activeTab === 'PROFILE' && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            
            {profileSaved && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-3 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Profile details saved successfully!</span>
              </div>
            )}

            <div className="glass-card p-6 space-y-6">
              
              {/* Header with Avatar & Studio Brand Crest */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-5 border-b border-slate-200/60 pb-5">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-white text-2xl font-black shadow-xl shrink-0 ${
                    avatarTheme === 'plum'
                      ? 'bg-gradient-to-br from-[#961b45] to-[#751437] shadow-[#961b45]/30'
                      : avatarTheme === 'emerald'
                      ? 'bg-gradient-to-br from-emerald-700 to-teal-900 shadow-emerald-900/30'
                      : avatarTheme === 'rose'
                      ? 'bg-gradient-to-br from-rose-500 to-pink-700 shadow-rose-500/30'
                      : 'bg-gradient-to-br from-slate-800 to-slate-950 shadow-slate-900/30'
                  }`}>
                    {name.charAt(0) || 'S'}
                  </div>

                  <div className="text-center sm:text-left space-y-1">
                    <h3 className="text-lg font-black text-slate-950">{name}</h3>
                    <p className="text-xs text-slate-600 font-semibold">{title} · Z S EVENTS Bangalore</p>
                    
                    {/* Theme buttons */}
                    <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
                      <span className="text-[11px] font-bold text-slate-500 mr-1">Avatar Theme:</span>
                      <button
                        type="button"
                        onClick={() => setAvatarTheme('plum')}
                        className={`w-6 h-6 rounded-full bg-[#961b45] border-2 cursor-pointer ${avatarTheme === 'plum' ? 'border-slate-900 scale-110' : 'border-white'}`}
                        title="Plum Royale"
                      />
                      <button
                        type="button"
                        onClick={() => setAvatarTheme('emerald')}
                        className={`w-6 h-6 rounded-full bg-emerald-700 border-2 cursor-pointer ${avatarTheme === 'emerald' ? 'border-slate-900 scale-110' : 'border-white'}`}
                        title="Emerald Botanical"
                      />
                      <button
                        type="button"
                        onClick={() => setAvatarTheme('rose')}
                        className={`w-6 h-6 rounded-full bg-rose-500 border-2 cursor-pointer ${avatarTheme === 'rose' ? 'border-slate-900 scale-110' : 'border-white'}`}
                        title="Rose Gold"
                      />
                      <button
                        type="button"
                        onClick={() => setAvatarTheme('slate')}
                        className={`w-6 h-6 rounded-full bg-slate-900 border-2 cursor-pointer ${avatarTheme === 'slate' ? 'border-slate-900 scale-110' : 'border-white'}`}
                        title="Obsidian"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl glass-subtle border border-rose-200/80 shadow-xs">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/90 shrink-0 bg-white shadow-md p-0.5">
                    <img
                      src={zsEventsLogo}
                      alt="ZS Events Logo"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#961b45] block">Official Brand Crest</span>
                    <span className="text-xs font-black text-slate-900 block">ZS Events Bangalore</span>
                    <span className="text-[10px] text-slate-500 italic">Where Every Celebration Blooms</span>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-xs font-medium glass-input text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Job Title / Role in Studio <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-xs font-medium glass-input text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Official Email Address (Login ID)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 text-xs font-medium glass-input pr-20 text-slate-900"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                      Verified
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Phone & WhatsApp Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-medium glass-input pr-20 text-slate-900"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                      WhatsApp Linked
                    </span>
                  </div>
                </div>
              </div>

              {/* Digital Quotation Signature Preview */}
              <div className="p-4 rounded-2xl glass-subtle border border-slate-200/80 space-y-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  Digital Sign-off on Quotations & GST Invoices
                </span>
                <p className="text-xs font-serif italic text-slate-800">
                  "{name} — {title}, Z S Events Bangalore (Luxury Weddings & Event Management)"
                </p>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-200/60">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl glass-btn-primary text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#961b45]/25 cursor-pointer hover:scale-102 active:scale-98 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Profile Changes</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: 2FA & ACTIVE SESSIONS                                          */}
        {/* ==================================================================== */}
        {activeTab === '2FA_SESSIONS' && (
          <div className="space-y-6">
            
            {/* 2FA Master Card */}
            <div className="glass-card p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-[#961b45]">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Two-Factor Authentication (2FA)</h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Protect high-value quotes and client data with Google Authenticator or TOTP app.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    twoFactorEnabled ? 'bg-[#961b45]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {twoFactorEnabled ? (
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Two-Factor Authentication is Active
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowQrModal(!showQrModal)}
                      className="text-[11px] text-[#961b45] font-black hover:underline cursor-pointer"
                    >
                      {showQrModal ? 'Hide Setup Key' : 'View Authenticator QR'}
                    </button>
                  </div>

                  {/* QR Code expansion */}
                  {showQrModal && (
                    <div className="p-4 rounded-2xl bg-white border border-emerald-300 flex flex-col sm:flex-row items-center gap-5 animate-in fade-in">
                      <div className="w-28 h-28 bg-slate-900 p-2 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md">
                        <QrCode className="w-24 h-24 text-rose-200" />
                      </div>

                      <div className="space-y-2 text-xs">
                        <h4 className="font-black text-slate-900">Scan with Google Authenticator or 1Password</h4>
                        <p className="text-slate-600 text-[11px]">
                          Manual Setup Key: <code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[#961b45] font-bold">ZSEV-8842-KLR9-PLM1</code>
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            maxLength={6}
                            value={testOtp}
                            onChange={(e) => setTestOtp(e.target.value)}
                            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs w-32 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (testOtp.length === 6) setOtpVerified(true);
                            }}
                            className="px-3 py-1.5 rounded-xl glass-btn-primary text-white text-xs font-bold"
                          >
                            Verify
                          </button>
                          {otpVerified && <span className="text-xs text-emerald-600 font-bold">Verified ✓</span>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Backup Recovery Codes */}
                  <div className="pt-2 border-t border-emerald-200/70">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800">Emergency Backup Recovery Codes</span>
                      <button
                        type="button"
                        onClick={handleCopyCodes}
                        className="text-[11px] font-bold text-[#961b45] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedCodes ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCodes ? 'Copied to Clipboard!' : 'Copy Backup Codes'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {backupCodes.map((code, idx) => (
                        <div key={idx} className="px-2.5 py-1 rounded-xl bg-white border border-emerald-200 font-mono text-[11px] text-slate-700 text-center font-bold">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  <p className="font-bold">2FA is currently disabled.</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">Toggle the switch above to require an authentication code on future sign-ins.</p>
                </div>
              )}
            </div>

            {/* Active Logged-In Sessions */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <Laptop className="w-5 h-5 text-[#961b45]" />
                  <div>
                    <h3 className="text-base font-black text-slate-900">Active Logged-In Sessions</h3>
                    <p className="text-xs text-slate-500">Devices currently authenticated to your ZS Events account.</p>
                  </div>
                </div>

                {sessions.length > 1 && (
                  <button
                    type="button"
                    onClick={handleRevokeAllOther}
                    className="px-3.5 py-1.5 rounded-xl border border-rose-300 bg-rose-50 text-[#961b45] hover:bg-rose-100 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out Other Devices</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border transition-all ${
                      sess.isCurrent
                        ? 'bg-rose-50/40 border-rose-200/80 shadow-xs'
                        : 'bg-white/60 border-slate-200/70 hover:bg-white/90'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                        {sess.device.includes('iPhone') ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{sess.device}</span>
                          {sess.isCurrent && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                              This Device
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {sess.browser} · IP: {sess.ip} · {sess.location}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <span className="text-[11px] font-bold text-slate-600">{sess.lastActive}</span>
                      {!sess.isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(sess.id)}
                          className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-bold cursor-pointer"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 4: ALERTS & NOTIFICATIONS                                         */}
        {/* ==================================================================== */}
        {activeTab === 'NOTIFICATIONS' && (
          <div className="glass-card p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
              <div className="flex items-center gap-2.5">
                <Bell className="w-5 h-5 text-[#961b45]" />
                <h3 className="text-base font-black text-slate-900">Notification & Alert Channels</h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">Synced with WhatsApp API</span>
            </div>

            {notifSaved && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold">
                Notification preferences updated.
              </div>
            )}

            <div className="space-y-4">
              
              {/* WhatsApp Alerts */}
              <div className="p-4 rounded-2xl glass-subtle border border-slate-200 space-y-3">
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600" /> WhatsApp Instant Alerts (+91 98450 99880)
                </span>

                <div className="space-y-2.5 pt-1">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-slate-800">New Website & Inquiry Lead Alerts</span>
                      <p className="text-[11px] text-slate-500">Receive instant WhatsApp push notification when a bride or event host submits an inquiry.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifWhatsAppLeads}
                      onChange={(e) => setNotifWhatsAppLeads(e.target.checked)}
                      className="w-4 h-4 rounded text-[#961b45] accent-[#961b45]"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-slate-800">Bangalore Date Conflict Warnings</span>
                      <p className="text-[11px] text-slate-500">Alert if multiple wedding bookings are requested on the same auspicious date.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifWhatsAppConflicts}
                      onChange={(e) => setNotifWhatsAppConflicts(e.target.checked)}
                      className="w-4 h-4 rounded text-[#961b45] accent-[#961b45]"
                    />
                  </label>
                </div>
              </div>

              {/* Email Alerts */}
              <div className="p-4 rounded-2xl glass-subtle border border-slate-200 space-y-3">
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#961b45]" /> Email Briefings ({email})
                </span>

                <div className="space-y-2.5 pt-1">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-slate-800">Daily 8:30 AM Studio Agenda Digest</span>
                      <p className="text-[11px] text-slate-500">Summary of today's follow-ups, staging deliveries, and active team assignments.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifEmailDailyDigest}
                      onChange={(e) => setNotifEmailDailyDigest(e.target.checked)}
                      className="w-4 h-4 rounded text-[#961b45] accent-[#961b45]"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-slate-800">GST Invoice Overdue Reminders</span>
                      <p className="text-[11px] text-slate-500">Weekly alert for outstanding client payments past their milestone due dates.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifEmailInvoices}
                      onChange={(e) => setNotifEmailInvoices(e.target.checked)}
                      className="w-4 h-4 rounded text-[#961b45] accent-[#961b45]"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200/60">
              <button
                type="button"
                onClick={() => {
                  setNotifSaved(true);
                  setTimeout(() => setNotifSaved(false), 2500);
                }}
                className="px-6 py-2.5 rounded-2xl glass-btn-primary text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#961b45]/25 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Notification Settings</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 5: SECURITY AUDIT & STUDIO PREFERENCES                            */}
        {/* ==================================================================== */}
        {activeTab === 'AUDIT_PREFS' && (
          <div className="space-y-6">
            
            {/* Audit Log Table */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-5 h-5 text-[#961b45]" />
                  <h3 className="text-base font-black text-slate-900">Security Audit Log</h3>
                </div>
                <span className="text-xs text-slate-500">Read-Only Immutable Log</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-extrabold">
                      <th className="pb-2">Event Action</th>
                      <th className="pb-2">Device & Browser</th>
                      <th className="pb-2">Location / IP</th>
                      <th className="pb-2">Timestamp</th>
                      <th className="pb-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 font-bold text-slate-900">{log.action}</td>
                        <td className="py-2.5 text-slate-600">{log.device}</td>
                        <td className="py-2.5 text-slate-500">{log.location} ({log.ip})</td>
                        <td className="py-2.5 text-slate-500">{log.time}</td>
                        <td className="py-2.5 text-right">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Studio Preferences */}
            <div className="glass-card p-6 space-y-5">
              <div className="flex items-center gap-2.5 border-b border-slate-200/60 pb-3">
                <Sliders className="w-5 h-5 text-[#961b45]" />
                <h3 className="text-base font-black text-slate-900">Studio & System Preferences</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Default Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 text-xs glass-input"
                  >
                    <option value="INR">₹ INR (Indian Rupee - Lakhs/Crores)</option>
                    <option value="USD">$ USD (US Dollar)</option>
                    <option value="AED">AED (UAE Dirham)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Studio Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 text-xs glass-input"
                  >
                    <option value="Asia/Kolkata (IST, UTC+5:30)">Asia/Kolkata (IST, UTC+5:30)</option>
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST, UTC+4)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Draft Auto-Save Interval</label>
                  <select
                    value={autoSaveInterval}
                    onChange={(e) => setAutoSaveInterval(e.target.value)}
                    className="w-full px-3 py-2 text-xs glass-input"
                  >
                    <option value="15s">Every 15 Seconds</option>
                    <option value="30s">Every 30 Seconds (Recommended)</option>
                    <option value="60s">Every 1 Minute</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-3">
              <div className="flex items-center gap-2 text-rose-900 font-black text-xs uppercase tracking-wider">
                <Trash2 className="w-4 h-4 text-rose-600" /> Danger Zone & Workspace Reset
              </div>
              <p className="text-xs text-rose-800">
                Clear cached browser state, purge temporary draft leads, or reset to initial luxury florist studio state.
              </p>

              {cacheCleared && (
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold">
                  Local cache cleared and refreshed.
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('zse_leads_draft');
                    setCacheCleared(true);
                    setTimeout(() => setCacheCleared(false), 3000);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Purge Draft Leads Cache</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
