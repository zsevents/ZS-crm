import React,{ useState,useEffect,useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
Briefcase,Phone,
MessageSquare
} from 'lucide-react';

import {
Lead,
LeadStatus,
Project,
Customer,
Quotation,
Invoice,
Payment,
DashboardStats,
DateConflict,
BusinessSettings,
User,
DEFAULT_BUSINESS_SETTINGS,
} from './types';
import { api } from './lib/api';
import { formatINR,formatDate,cleanPhoneNumber,formatDateTime } from './lib/formatters';

// Views
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { LeadsView } from './components/LeadsView';
import { ProjectsView } from './components/ProjectsView';
import { FinanceView } from './components/FinanceView';
import { CustomersView } from './components/CustomersView';
import { CalendarView } from './components/CalendarView';
import { WebsiteFormSimulator } from './components/WebsiteFormSimulator';
import { SettingsView } from './components/SettingsView';
import { NewEntryModals } from './components/NewEntryModals';
import { AuthView } from './components/AuthView';
import { getSupabase,isSupabaseConfigured } from './lib/supabaseClient';
import { sessionFromSupabase } from './lib/session';
import { SetPasswordView,arrivedFromAuthLink } from './components/SetPasswordView';

type ViewTab =
  | 'DASHBOARD'
  | 'LEADS'
  | 'PROJECTS'
  | 'CUSTOMERS'
  | 'FINANCE'
  | 'CALENDAR'
  | 'WEBSITE_FORM'
  | 'SETTINGS';

export default function App() {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<ViewTab>('DASHBOARD');

  // Global Data State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [conflicts, setConflicts] = useState<DateConflict[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'USR-01',
    name: 'Syed',
    email: 'syed@zsevents.com',
    phone: '+91 98450 99880',
    role: 'ADMIN',
    title: 'Lead Event Manager & Producer',
    createdAt: '2026-01-01',
  });

  // Authentication. When Supabase is configured the app is gated behind a real
  // sign-in; otherwise it stays open, as it was before auth existed.
  const [authed, setAuthed] = useState(!isSupabaseConfigured());
  const [authChecking, setAuthChecking] = useState(isSupabaseConfigured());
  // Opened from an invite / password-reset email: ask for a password first.
  const [needsPassword, setNeedsPassword] = useState(arrivedFromAuthLink);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabase();

    const adopt = async (session: any) => {
      if (!session) {
        setAuthed(false);
        return;
      }
      const appSession = await sessionFromSupabase(session);
      setCurrentUser(appSession.user);
      setAuthed(true);
    };

    supabase.auth
      .getSession()
      .then(({ data }) => adopt(data.session))
      .finally(() => setAuthChecking(false));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      adopt(session);
    });

    return () => sub.subscription.unsubscribe();
  }, []);



  // Leads CRM Filter state





  const [inspectedLeadId, setInspectedLeadId] = useState<string | null>(null);
  const [inspectorClosing, setInspectorClosing] = useState(false);
  const closeInspector = () => {
    setInspectorClosing(true);
    window.setTimeout(() => {
      setInspectedLeadId(null);
      setInspectorClosing(false);
    }, 70);
  };
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Modals state
  const [modalState, setModalState] = useState<{
    lead: boolean;
    project: boolean;
    dailyLog: boolean;
    dailyLogProjectId?: string;
    quotation: boolean;
    quotationLeadId?: string;
    invoice: boolean;
    invoiceProjectId?: string;
    payment: boolean;
    paymentInvoiceId?: string;
  }>({
    lead: false,
    project: false,
    dailyLog: false,
    quotation: false,
    invoice: false,
    payment: false,
  });

  // Slide-over note & follow-up composer state
  const [newActivityNote, setNewActivityNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isConvertingLead, setIsConvertingLead] = useState(false);
  // Escape closes any open pop-up
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setInspectedLeadId(null);
      setModalState({
        lead: false,
        project: false,
        dailyLog: false,
        quotation: false,
        invoice: false,
        payment: false,
      });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpDate, setFollowUpDate] = useState(new Date().toISOString().split('T')[0]);
  const [followUpTime, setFollowUpTime] = useState('02:00 PM');
  const [followUpType, setFollowUpType] = useState('CALL');
  const [followUpNote, setFollowUpNote] = useState('');

  // Load all florist studio data
  const loadData = async () => {
    try {
      setLoading(true);
      const [
        statsData,
        conflictsData,
        leadsData,
        projectsData,
        quotesData,
        invData,
        payData,
        custData,
        settData,
      ] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getConflicts().catch(() => []),
        api.getLeads().catch(() => []),
        api.getProjects().catch(() => []),
        api.getQuotations().catch(() => []),
        api.getInvoices().catch(() => []),
        api.getPayments().catch(() => []),
        api.getCustomers().catch(() => []),
        api.getSettings().catch(() => null),
      ]);

      if (statsData) setStats(statsData);
      setConflicts(conflictsData || []);
      setLeads(leadsData || []);
      setProjects(projectsData || []);
      setQuotations(quotesData || []);
      setInvoices(invData || []);
      setPayments(payData || []);
      setCustomers(custData || []);
      if (settData) setSettings(settData);
    } catch (err) {
      console.error('Failed to load florist studio data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const inspectedLead = useMemo(() => {
    return leads.find((l) => l.id === inspectedLeadId) || null;
  }, [leads, inspectedLeadId]);

  // Filtered Leads






  const handleUpdateLeadStatus = async (leadId: string, status: LeadStatus) => {
    try {
      const updated = await api.updateLead(leadId, { status });
      setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
      if (status === 'WON') {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      }
    } catch (err) {
      console.error('Failed to update lead status', err);
    }
  };





  const handleAddActivityNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectedLeadId || !newActivityNote.trim()) return;

    setIsSubmittingNote(true);
    try {
      const res = await api.addLeadActivity(inspectedLeadId, newActivityNote.trim(), 'NOTE_ADDED');
      if (res?.lead) {
        setLeads((prev) => prev.map((l) => (l.id === inspectedLeadId ? res.lead : l)));
      }
      setNewActivityNote('');
    } catch (err) {
      console.error('Failed to add note', err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleSaveFollowUp = async () => {
    if (!inspectedLeadId) return;
    try {
      const updated = await api.updateLead(inspectedLeadId, {
        nextFollowUpDate: followUpDate,
        nextFollowUpTime: followUpTime,
        nextFollowUpType: followUpType as any,
        nextFollowUpNote: followUpNote,
      });
      setLeads((prev) => prev.map((l) => (l.id === inspectedLeadId ? updated : l)));
      setShowFollowUpModal(false);
      setFollowUpNote('');
    } catch (err) {
      console.error('Failed to save follow up', err);
    }
  };



  const handleSignOut = async () => {
    await getSupabase().auth.signOut();
    setAuthed(false);
  };

  const handleConvertToProject = async (leadId: string) => {
    setIsConvertingLead(true);
    try {
      await api.convertLeadToProject(leadId);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
      await loadData();
      setActiveTab('PROJECTS');
      setInspectedLeadId(null);
    } catch (err) {
      console.error('Failed to convert lead to project', err);
    } finally {
      setIsConvertingLead(false);
    }
  };

  // Quick Action Handler from Top Navigation
  const handleQuickAction = (
    action: 'NEW_LEAD' | 'NEW_PROJECT' | 'POST_DAILY_UPDATE' | 'CREATE_INVOICE' | 'CREATE_QUOTATION' | 'RECORD_PAYMENT'
  ) => {
    switch (action) {
      case 'NEW_LEAD':
        setModalState((prev) => ({ ...prev, lead: true }));
        break;
      case 'NEW_PROJECT':
        setModalState((prev) => ({ ...prev, project: true }));
        break;
      case 'POST_DAILY_UPDATE':
        setModalState((prev) => ({ ...prev, dailyLog: true }));
        break;
      case 'CREATE_QUOTATION':
        setModalState((prev) => ({ ...prev, quotation: true }));
        break;
      case 'CREATE_INVOICE':
        setModalState((prev) => ({ ...prev, invoice: true }));
        break;
      case 'RECORD_PAYMENT':
        setModalState((prev) => ({ ...prev, payment: true }));
        break;
    }
  };

  // KPI Calculations







  // Auth gate. Every hook above has already run, so these early returns are safe.
  if (authChecking) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <div className="penthouse-bg" aria-hidden="true" />
        <span className="relative z-10 w-8 h-8 border-2 border-[#3F5B4A]/30 border-t-[#3F5B4A] rounded-full animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return <AuthView onLoginSuccess={(session) => setCurrentUser(session.user)} />;
  }

  if (needsPassword) {
    return <SetPasswordView email={currentUser.email} onDone={() => setNeedsPassword(false)} />;
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden text-slate-900 font-sans antialiased flex flex-col selection:bg-rose-200 selection:text-[#3F5B4A]">
      <div className="penthouse-bg" aria-hidden="true" />

      {/* Fixed Left Sidebar & Mobile Navigation */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab as ViewTab)}
        onLogout={isSupabaseConfigured() ? handleSignOut : undefined}
        onQuickAction={handleQuickAction}
        conflictsCount={conflicts.length}
        newLeadsCount={leads.filter((l) => l.status === 'NEW').length}
        currentUser={currentUser}
      />

      {/* Main Workspace Area with left margin/padding for fixed sidebar & bottom safe clearance on mobile */}
      <main className="md:pl-64 lg:pl-72 flex-1 w-full min-w-0 transition-all relative z-10">
        <div key={activeTab} className="view-enter max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-3 sm:py-6 pb-28 md:pb-8">
        {/* DASHBOARD TAB */}
        {activeTab === 'DASHBOARD' && (
          <DashboardView
            stats={stats}
            conflicts={conflicts}
            projects={projects}
            leads={leads}
            quotations={quotations}
            invoices={invoices}
            onSelectLead={(id) => {
              setActiveTab('LEADS');
              setInspectedLeadId(id);
            }}
            onSelectProject={(id) => {
              setSelectedProjectId(id);
              setActiveTab('PROJECTS');
            }}
            onNavigateTab={(tab) => setActiveTab(tab as ViewTab)}
            onOpenDailyUpdateModal={(pId) =>
              setModalState((prev) => ({ ...prev, dailyLog: true, dailyLogProjectId: pId }))
            }
            onOpenLeadModal={() => setModalState((prev) => ({ ...prev, lead: true }))}
            onOpenProjectModal={() => setModalState((prev) => ({ ...prev, project: true }))}
            onOpenPaymentModal={() => setModalState((prev) => ({ ...prev, payment: true }))}
          />
        )}

        {/* LEADS & INTAKE CRM TAB */}
        {activeTab === 'LEADS' && (
          <LeadsView
            leads={leads}
            selectedLeadId={inspectedLeadId}
            onSelectLead={(id) => setInspectedLeadId(id)}
            onUpdateLeadStatus={async (leadId, status) => {
              await handleUpdateLeadStatus(leadId, status);
            }}
            onAddLeadActivity={async (leadId, description, type) => {
              await api.addLeadActivity(leadId, description, type);
              loadData();
            }}
            onUpdateFollowUp={async (leadId, followUp) => {
              await api.scheduleFollowUp(leadId, followUp.date, followUp.note);
              loadData();
            }}
            onConvertToProject={async (leadId) => {
              const prj = await handleConvertToProject(leadId);
              return prj;
            }}
            onOpenNewLeadModal={() => setModalState((prev) => ({ ...prev, lead: true }))}
            onNavigateToProject={(projectId) => {
              setSelectedProjectId(projectId);
              setActiveTab('PROJECTS');
            }}
          />
        )}

        {/* PROJECTS & EVENT STAGING TAB */}
        {activeTab === 'PROJECTS' && (
          <ProjectsView
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelectProject={setSelectedProjectId}
            onUpdateMilestone={async (pId, idx, payload) => {
              await api.updateMilestone(pId, idx, payload);
              loadData();
            }}
            onAddCustomMilestone={async (pId, payload) => {
              await api.addCustomMilestone(pId, payload);
              loadData();
            }}
            onDeleteMilestone={async (pId, idx) => {
              await api.deleteMilestone(pId, idx);
              loadData();
            }}
            onAddDailyUpdate={async (pId, payload) => {
              await api.addDailyUpdate(pId, payload);
              loadData();
            }}
            onAddTask={async (pId, payload) => {
              await api.addTask(pId, payload);
              loadData();
            }}
            onUpdateTaskStatus={async (pId, tId, st) => {
              await api.updateTask(pId, tId, { status: st });
              loadData();
            }}
            onOpenNewProjectModal={() => setModalState((prev) => ({ ...prev, project: true }))}
            onOpenNewInvoiceModal={(pId) =>
              setModalState((prev) => ({ ...prev, invoice: true, invoiceProjectId: pId }))
            }
            onOpenPaymentModal={(pId) =>
              setModalState((prev) => ({ ...prev, payment: true, invoiceProjectId: pId }))
            }
          />
        )}

        {/* CUSTOMERS TAB */}
        {activeTab === 'CUSTOMERS' && (
          <CustomersView
            customers={customers}
            leads={leads}
            projects={projects}
            invoices={invoices}
            onSelectLead={(id) => {
              setActiveTab('LEADS');
              setInspectedLeadId(id);
            }}
            onSelectProject={(id) => {
              if (id) setSelectedProjectId(id);
              setActiveTab('PROJECTS');
            }}
            onOpenNewCustomerModal={() => setModalState((prev) => ({ ...prev, lead: true }))}
            onCustomerUpdated={loadData}
          />
        )}

        {/* UNIFIED FINANCE & GST TAB (Quotations, Invoices, Payments, GST 998599) */}
        {activeTab === 'FINANCE' && (
          <FinanceView
            invoices={invoices}
            payments={payments}
            projects={projects}
            quotations={quotations}
            leads={leads}
            settings={settings || DEFAULT_BUSINESS_SETTINGS}
            onOpenNewInvoiceModal={(pId) =>
              setModalState((prev) => ({ ...prev, invoice: true, invoiceProjectId: pId }))
            }
            onOpenPaymentModal={(invId) =>
              setModalState((prev) => ({ ...prev, payment: true, paymentInvoiceId: invId }))
            }
            onOpenNewQuoteModal={() => setModalState((prev) => ({ ...prev, quotation: true }))}
            onQuotationUpdated={loadData}
            onConvertToProject={(leadId) => handleConvertToProject(leadId)}
          />
        )}

        {/* CALENDAR & SCHEDULE CONFLICTS TAB */}
        {activeTab === 'CALENDAR' && (
          <CalendarView
            projects={projects}
            leads={leads}
            conflicts={conflicts}
            onSelectProject={(id) => {
              if (id) setSelectedProjectId(id);
              setActiveTab('PROJECTS');
            }}
            onSelectLead={(id) => {
              setActiveTab('LEADS');
              setInspectedLeadId(id);
            }}
          />
        )}

        {/* WEBSITE INQUIRIES SIMULATOR */}
        {activeTab === 'WEBSITE_FORM' && (
          <WebsiteFormSimulator
            leads={leads}
            onLeadSubmitted={loadData}
            onViewLeads={() => setActiveTab('LEADS')}
            onSelectLead={(id) => {
              setActiveTab('LEADS');
              setInspectedLeadId(id);
            }}
            onLeadCreated={(id) => {
              setActiveTab('LEADS');
              setInspectedLeadId(id);
            }}
          />
        )}

        {/* ACCOUNT & SECURITY SETTINGS TAB */}
        {activeTab === 'SETTINGS' && (
          <SettingsView
            settings={settings || DEFAULT_BUSINESS_SETTINGS}
            currentUser={currentUser}
            onUpdateUser={(updated) => {
              setCurrentUser((prev) => ({ ...prev, ...updated }));
            }}
            onSaveSettings={async (updated) => {
              await api.updateSettings(updated);
              setSettings(updated);
            }}
          />
        )}
        </div>
      </main>

      {/* LEAD DETAIL INSPECTOR SLIDE-OVER */}
      {inspectedLead && (
        <div
          data-closing={inspectorClosing || undefined}
          onClick={closeInspector}
          className="fixed inset-0 z-50 bg-slate-950/40 flex items-end sm:items-center justify-center sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-lg max-h-[92vh] sm:max-h-[88vh] rounded-t-3xl sm:rounded-3xl glass-modal shadow-2xl flex flex-col overflow-hidden text-slate-900 border border-white/80"
          >
            {/* Header */}
            <div className="p-5 border-b border-rose-200/50 bg-white/40 backdrop-blur-md flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">{inspectedLead.id}</span>
                <h3 className="text-lg font-black text-slate-950">{inspectedLead.customerName}</h3>
                <p className="text-xs text-slate-600 font-semibold">{inspectedLead.eventType} · {formatDate(inspectedLead.eventDate)}</p>
              </div>

              <button
                onClick={closeInspector}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-rose-100/60 glass-btn-secondary cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Quick Conversion Banner if Won */}
              <div className="p-4 rounded-2xl glass-card space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Project Value / Budget</span>
                  <span className="text-base font-black text-[#3F5B4A]">{formatINR(inspectedLead.budget)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Venue: {inspectedLead.venue || inspectedLead.location || 'Bangalore'}</span>
                  <span>Source: {inspectedLead.source}</span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-white/60">
                  <a
                    href={`https://wa.me/${cleanPhoneNumber(inspectedLead.phone)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-700/20 backdrop-blur-md"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={`tel:${cleanPhoneNumber(inspectedLead.phone)}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl glass-btn-primary text-white text-xs font-bold"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Client</span>
                  </a>
                  <button
                    onClick={() => handleConvertToProject(inspectedLead.id)}
                    disabled={isConvertingLead}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-bold shadow-md backdrop-blur-md"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{isConvertingLead ? 'Converting...' : 'Convert to Project'}</span>
                  </button>
                </div>
              </div>

              {/* Status Stepper */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Update Lead Pipeline Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['NEW', 'CONTACTED', 'MEETING', 'QUOTATION', 'NEGOTIATION', 'WON'] as LeadStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateLeadStatus(inspectedLead.id, st)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        inspectedLead.status === st
                          ? 'glass-btn-primary text-white font-black'
                          : 'glass-btn-secondary text-slate-700 hover:text-[#3F5B4A]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Next Follow-up */}
              <div className="p-4 rounded-2xl bg-amber-50/70 backdrop-blur-md border border-amber-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-950">Next Follow-Up Reminder</span>
                  <p className="text-xs text-amber-900 mt-0.5">
                    {inspectedLead.nextFollowUpDate
                      ? `${formatDate(inspectedLead.nextFollowUpDate)} · ${inspectedLead.nextFollowUpTime || 'Morning'}`
                      : 'No reminder scheduled'}
                  </p>
                </div>
                <button
                  onClick={() => setShowFollowUpModal(true)}
                  className="px-3.5 py-1.5 glass-btn-secondary text-amber-950 rounded-xl text-xs font-bold hover:bg-amber-100/80"
                >
                  Schedule
                </button>
              </div>

              {/* Activity Notes */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Notes & Floral Requests</h4>
                <form onSubmit={handleAddActivityNote} className="space-y-2 mb-3">
                  <textarea
                    rows={2}
                    placeholder="Log client call, floral theme requests, moodboard ideas..."
                    value={newActivityNote}
                    onChange={(e) => setNewActivityNote(e.target.value)}
                    className="w-full p-3 text-xs glass-input rounded-xl focus:outline-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingNote || !newActivityNote.trim()}
                      className="px-4 py-2 glass-btn-primary text-white text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmittingNote ? 'Saving...' : 'Post Note'}
                    </button>
                  </div>
                </form>

                <div className="space-y-2">
                  {inspectedLead.activities && inspectedLead.activities.length > 0 ? (
                    inspectedLead.activities.map((act) => (
                      <div key={act.id} className="p-3 rounded-xl glass-card text-xs">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                          <span className="font-bold text-slate-700">{act.createdBy}</span>
                          <span>{formatDateTime(act.timestamp)}</span>
                        </div>
                        <p className="text-slate-800">{act.description}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No notes recorded yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Reminder Modal */}
      {showFollowUpModal && inspectedLead && (
        <div className="fixed inset-0 z-60 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-modal rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-950">Schedule Follow-Up</h3>
            <p className="text-xs text-slate-500">For client {inspectedLead.customerName}</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full h-9 px-3 glass-input rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Time</label>
                <input
                  type="text"
                  value={followUpTime}
                  onChange={(e) => setFollowUpTime(e.target.value)}
                  placeholder="e.g. 11:00 AM"
                  className="w-full h-9 px-3 glass-input rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Type</label>
                <select
                  value={followUpType}
                  onChange={(e) => setFollowUpType(e.target.value)}
                  className="w-full h-9 px-3 glass-input rounded-xl font-medium"
                >
                  <option value="CALL">Phone Call</option>
                  <option value="WHATSAPP">WhatsApp Message</option>
                  <option value="MEETING">In-Person Consultation</option>
                  <option value="SITE_VISIT">Bangalore Venue Site Visit</option>
                  <option value="SEND_QUOTATION">Send Floral Quotation</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Note</label>
                <textarea
                  rows={2}
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  placeholder="Follow-up context..."
                  className="w-full p-2.5 glass-input rounded-xl font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/60">
              <button
                onClick={() => setShowFollowUpModal(false)}
                className="px-4 py-2 text-xs font-bold glass-btn-secondary rounded-xl text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFollowUp}
                className="px-4 py-2 text-xs font-bold glass-btn-primary text-white rounded-xl shadow-xs"
              >
                Save Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Modals Registry */}
      <NewEntryModals
        modalState={modalState}
        onCloseModal={(key) => setModalState((prev) => ({ ...prev, [key]: false }))}
        onRefreshData={loadData}
        settings={settings || DEFAULT_BUSINESS_SETTINGS}
        projects={projects}
        leads={leads}
        invoices={invoices}
        customers={customers}
      />
    </div>
  );
}
