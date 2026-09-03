import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import floralBgImage from './assets/images/luxury_floral_bg_1788163266849.jpg';
import {
  Users,
  Briefcase,
  Receipt,
  Calendar,
  Settings,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FileText,
  Phone,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  LayoutDashboard,
  Globe,
  DollarSign,
  Clock,
  List,
  Grid,
  Keyboard,
  Command,
  X,
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
import { formatINR, formatDate, formatPhoneNumber, cleanPhoneNumber, formatDateTime } from './lib/formatters';

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
import { CustomerHoverDropdown } from './components/CustomerHoverDropdown';
import { AuthView } from './components/AuthView';
import { getSupabase, isSupabaseConfigured } from './lib/supabaseClient';
import { sessionFromSupabase } from './lib/session';

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
  const [loading, setLoading] = useState(true);
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

  const handleSignOut = async () => {
    if (!isSupabaseConfigured()) return;
    await getSupabase().auth.signOut();
    setAuthed(false);
  };

  // Leads CRM Filter state
  const [leadFilterTab, setLeadFilterTab] = useState<string>('ALL');
  const [leadEventTypeFilter, setLeadEventTypeFilter] = useState<string>('ALL');
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [inspectedLeadId, setInspectedLeadId] = useState<string | null>(null);
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
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger letter shortcuts if user is typing in input/textarea/select
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (e.key === 'Escape') {
        setShowShortcutsModal(false);
        setInspectedLeadId(null);
        setModalState({
          lead: false,
          project: false,
          dailyLog: false,
          quotation: false,
          invoice: false,
          payment: false,
        });
        return;
      }

      if (isInput) return;

      // Key '?' or 'Shift+/' opens shortcuts guide
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
        return;
      }

      // Quick tab switching 1-8
      switch (e.key) {
        case '1':
          setActiveTab('DASHBOARD');
          break;
        case '2':
          setActiveTab('LEADS');
          break;
        case '3':
          setActiveTab('PROJECTS');
          break;
        case '4':
          setActiveTab('CUSTOMERS');
          break;
        case '5':
          setActiveTab('FINANCE');
          break;
        case '6':
          setActiveTab('CALENDAR');
          break;
        case '7':
          setActiveTab('WEBSITE');
          break;
        case '8':
          setActiveTab('SETTINGS');
          break;
        case 'n':
        case 'N':
          e.preventDefault();
          setModalState((prev) => ({ ...prev, lead: true }));
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          setModalState((prev) => ({ ...prev, project: true }));
          break;
        case 'q':
        case 'Q':
          e.preventDefault();
          setModalState((prev) => ({ ...prev, quotation: true }));
          break;
        case 'i':
        case 'I':
          e.preventDefault();
          setModalState((prev) => ({ ...prev, invoice: true }));
          break;
        case 'b':
        case 'B':
          e.preventDefault();
          setModalState((prev) => ({ ...prev, payment: true }));
          break;
        case 'd':
        case 'D':
          e.preventDefault();
          setModalState((prev) => ({ ...prev, dailyLog: true }));
          break;
      }
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
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (leadEventTypeFilter !== 'ALL' && lead.eventType !== leadEventTypeFilter) {
        return false;
      }

      if (leadSearchQuery.trim()) {
        const q = leadSearchQuery.toLowerCase();
        const matchesName = lead.customerName.toLowerCase().includes(q);
        const matchesPhone = lead.phone.includes(q);
        const matchesVenue = (lead.venue || lead.location || '').toLowerCase().includes(q);
        const matchesId = lead.id.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesVenue && !matchesId) return false;
      }

      return true;
    });
  }, [leads, leadEventTypeFilter, leadSearchQuery]);

  const handleToggleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    }
  };

  const handleToggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

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

  const handleUpdateLeadDate = async (leadId: string, eventDate: string) => {
    try {
      const updated = await api.updateLead(leadId, { eventDate });
      setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
    } catch (err) {
      console.error('Failed to update lead event date', err);
    }
  };

  const handleUpdateLeadBudget = async (leadId: string, budget: number) => {
    try {
      const updated = await api.updateLead(leadId, { budget });
      setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
    } catch (err) {
      console.error('Failed to update lead budget', err);
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

  const handleConvertToProject = async (leadId: string) => {
    setIsConvertingLead(true);
    try {
      const res = await api.convertLeadToProject(leadId);
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
  const totalInquiriesCount = leads.length;
  const qualifiedLeadsCount = leads.filter((l) => ['QUOTATION', 'NEGOTIATION', 'WON'].includes(l.status)).length;
  const activeProjectsCount = projects.filter((p) => ['PLANNING', 'IN_PROGRESS', 'EVENT_DAY'].includes(p.status)).length;
  const totalRevenueNumber = projects.reduce((acc, p) => acc + (p.projectValue || 0), 0);

  const getStatusBadgeStyle = (status: LeadStatus) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'CONTACTED':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'MEETING':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'QUOTATION':
        return 'bg-rose-50 text-[#831843] border-rose-200';
      case 'NEGOTIATION':
        return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'WON':
        return 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold';
      case 'LOST':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Auth gate. Every hook above has already run, so these early returns are safe.
  if (authChecking) {
    return (
      <div className="min-h-screen penthouse-bg flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-[#831843]/30 border-t-[#831843] rounded-full animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return <AuthView onLoginSuccess={(session) => setCurrentUser(session.user)} />;
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden text-slate-900 font-sans antialiased flex flex-col selection:bg-rose-200 selection:text-[#831843]">
      {/* Exact Penthouse Background Image & Frosted Glass Layer */}
      <div 
        className="penthouse-bg" 
        style={{ backgroundImage: `url(${floralBgImage})` }} 
      />
      <div className="penthouse-overlay" />

      {/* Ambient Glassmorphism Backlight Mesh Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-rose-300/25 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-amber-200/25 rounded-full blur-3xl animate-float-reverse" />
        <div className="absolute bottom-10 left-1/4 w-[480px] h-[480px] bg-pink-200/20 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-2/3 -right-20 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-float-reverse" />
      </div>

      {/* Fixed Left Sidebar & Mobile Navigation */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab as ViewTab)}
        onQuickAction={handleQuickAction}
        conflictsCount={conflicts.length}
        newLeadsCount={leads.filter((l) => l.status === 'NEW').length}
        currentUser={currentUser}
      />

      {/* Main Workspace Area with left margin/padding for fixed sidebar & bottom safe clearance on mobile */}
      <main className="md:pl-64 lg:pl-72 flex-1 w-full min-w-0 transition-all relative z-10">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-3 sm:py-6 pb-28 md:pb-8">
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
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-lg h-full glass-modal shadow-2xl flex flex-col overflow-hidden text-slate-900 border-l border-white/80">
            {/* Header */}
            <div className="p-5 border-b border-rose-200/50 bg-white/40 backdrop-blur-md flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">{inspectedLead.id}</span>
                <h3 className="text-lg font-black text-slate-950">{inspectedLead.customerName}</h3>
                <p className="text-xs text-slate-600 font-semibold">{inspectedLead.eventType} · {formatDate(inspectedLead.eventDate)}</p>
              </div>

              <button
                onClick={() => setInspectedLeadId(null)}
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
                  <span className="text-base font-black text-[#831843]">{formatINR(inspectedLead.budget)}</span>
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
                          : 'glass-btn-secondary text-slate-700 hover:text-[#831843]'
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

      {/* Floating Keyboard Shortcuts Trigger Button */}
      <button
        onClick={() => setShowShortcutsModal(true)}
        className="fixed bottom-4 right-4 z-40 px-3.5 py-2 glass-btn-secondary text-slate-900 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 border border-white/90 transition-all cursor-pointer hover:scale-105"
        title="Keyboard Shortcuts (?)"
      >
        <Keyboard className="w-3.5 h-3.5 text-[#831843]" />
        <span className="hidden sm:inline font-bold">Active Keys</span>
        <kbd className="px-1.5 py-0.5 bg-rose-50 border border-rose-200 rounded text-[10px] font-mono text-[#831843] font-bold">?</kbd>
      </button>

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl glass-modal rounded-3xl p-6 shadow-2xl space-y-4 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50/80 border border-rose-200 flex items-center justify-center text-[#831843] shadow-xs">
                  <Keyboard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-950">Active Keyboard Shortcuts</h3>
                  <p className="text-xs text-slate-500 font-medium">Quick key navigation for Z S EVENTS Event Management CRM</p>
                </div>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 glass-btn-secondary transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Navigation Keys */}
              <div className="p-3.5 rounded-2xl glass-card space-y-2.5">
                <span className="font-extrabold text-slate-900 block text-[11px] uppercase tracking-wider">
                  Tab Navigation Keys
                </span>
                <div className="space-y-1.5 font-medium">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Dashboard</span>
                    <kbd className="px-2 py-0.5 bg-white/80 border border-white/90 rounded font-mono font-bold text-slate-900 shadow-xs">1</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Leads Pipeline</span>
                    <kbd className="px-2 py-0.5 bg-white/80 border border-white/90 rounded font-mono font-bold text-slate-900 shadow-xs">2</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Projects & Staging</span>
                    <kbd className="px-2 py-0.5 bg-white/80 border border-white/90 rounded font-mono font-bold text-slate-900 shadow-xs">3</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Customer Directory</span>
                    <kbd className="px-2 py-0.5 bg-white/80 border border-white/90 rounded font-mono font-bold text-slate-900 shadow-xs">4</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Finance & Invoices</span>
                    <kbd className="px-2 py-0.5 bg-white/80 border border-white/90 rounded font-mono font-bold text-slate-900 shadow-xs">5</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Calendar & Conflicts</span>
                    <kbd className="px-2 py-0.5 bg-white/80 border border-white/90 rounded font-mono font-bold text-slate-900 shadow-xs">6</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Website Simulator</span>
                    <kbd className="px-2 py-0.5 bg-white/80 border border-white/90 rounded font-mono font-bold text-slate-900 shadow-xs">7</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Business Settings</span>
                    <kbd className="px-2 py-0.5 bg-white/80 border border-white/90 rounded font-mono font-bold text-slate-900 shadow-xs">8</kbd>
                  </div>
                </div>
              </div>

              {/* Action Keys */}
              <div className="p-3.5 rounded-2xl bg-rose-50/60 backdrop-blur-md border border-rose-200/80 shadow-xs space-y-2.5">
                <span className="font-extrabold text-[#831843] block text-[11px] uppercase tracking-wider">
                  Quick Action Keys
                </span>
                <div className="space-y-1.5 font-medium">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-800">New Client Lead</span>
                    <kbd className="px-2 py-0.5 bg-white/90 border border-rose-300 rounded font-mono font-bold text-[#831843] shadow-xs">N</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-800">New Floral Project</span>
                    <kbd className="px-2 py-0.5 bg-white/90 border border-rose-300 rounded font-mono font-bold text-[#831843] shadow-xs">P</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-800">Generate Quotation</span>
                    <kbd className="px-2 py-0.5 bg-white/90 border border-rose-300 rounded font-mono font-bold text-[#831843] shadow-xs">Q</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-800">Create Tax Invoice</span>
                    <kbd className="px-2 py-0.5 bg-white/90 border border-rose-300 rounded font-mono font-bold text-[#831843] shadow-xs">I</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-800">Record Payment</span>
                    <kbd className="px-2 py-0.5 bg-white/90 border border-rose-300 rounded font-mono font-bold text-[#831843] shadow-xs">B</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-800">Post Daily Log</span>
                    <kbd className="px-2 py-0.5 bg-white/90 border border-rose-300 rounded font-mono font-bold text-[#831843] shadow-xs">D</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-800">Close / Dismiss</span>
                    <kbd className="px-2 py-0.5 bg-white/90 border border-slate-300 rounded font-mono font-bold text-slate-700 shadow-xs">Esc</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-800">Shortcuts Help</span>
                    <kbd className="px-2 py-0.5 bg-white/90 border border-rose-300 rounded font-mono font-bold text-[#831843] shadow-xs">?</kbd>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/60">
              <span className="text-[11px] text-slate-500 font-medium">Shortcuts are active whenever text fields are not focused</span>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="px-4 py-2 glass-btn-primary text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Got It
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
