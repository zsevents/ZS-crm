import React, { useMemo } from 'react';
import { AlertTriangle, ArrowRight, CalendarDays, Clock, MapPin, Plus } from 'lucide-react';
import { DashboardStats, DateConflict, Invoice, Lead, Project, Quotation } from '../types';
import { formatDate, formatINR } from '../lib/formatters';
import { CountUp } from './CountUp';

interface DashboardViewProps {
  stats: DashboardStats | null;
  conflicts?: DateConflict[];
  projects?: Project[];
  leads?: Lead[];
  quotations?: Quotation[];
  invoices?: Invoice[];
  onSelectLead?: (leadId: string) => void;
  onSelectProject?: (projectId: string) => void;
  onNavigateTab?: (tab: string) => void;
  onOpenDailyUpdateModal?: (projectId?: string) => void;
  onOpenLeadModal?: () => void;
  onOpenProjectModal?: () => void;
  onOpenPaymentModal?: () => void;
}

const OPEN_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'MEETING', 'QUOTATION', 'NEGOTIATION', 'ON_HOLD'];

// Pipeline stages in order, sage shades deepening toward a won deal (terracotta)
const STAGES: { id: string; label: string; color: string }[] = [
  { id: 'NEW', label: 'New', color: '#A9BDA3' },
  { id: 'CONTACTED', label: 'Contacted', color: '#7F9A7C' },
  { id: 'MEETING', label: 'Meeting', color: '#5E7E66' },
  { id: 'QUOTATION', label: 'Quotation', color: '#3F5B4A' },
  { id: 'NEGOTIATION', label: 'Negotiation', color: '#2F4A3A' },
  { id: 'WON', label: 'Won', color: '#C0674A' },
];

const todayISO = () => new Date().toISOString().slice(0, 10);

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

const daysUntil = (iso: string) => Math.round((new Date(iso).getTime() - new Date(todayISO()).getTime()) / 86400000);

function SectionCard({
  title,
  action,
  onAction,
  children,
  className = '',
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`glass-subcard p-5 flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-slate-950">{title}</h2>
        {action && (
          <button
            onClick={onAction}
            className="text-xs font-semibold text-[#3F5B4A] hover:text-[#2F4A3A] flex items-center gap-1 cursor-pointer"
          >
            {action} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-xs text-slate-500 py-6 text-center">{text}</p>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  conflicts,
  projects = [],
  leads = [],
  invoices = [],
  onSelectLead,
  onSelectProject,
  onNavigateTab,
  onOpenLeadModal,
  onOpenProjectModal,
}) => {
  const today = todayISO();

  const openLeads = useMemo(() => leads.filter((l) => OPEN_STATUSES.includes(l.status)), [leads]);
  const newLeads = useMemo(() => leads.filter((l) => l.status === 'NEW').length, [leads]);
  const pipelineValue = useMemo(() => openLeads.reduce((sum, l) => sum + (Number(l.budget) || 0), 0), [openLeads]);

  const activeProjects = useMemo(
    () => projects.filter((p) => !['COMPLETED', 'CANCELLED'].includes(p.status)),
    [projects]
  );

  const upcomingEvents = useMemo(
    () =>
      activeProjects
        .filter((p) => p.eventDate && p.eventDate >= today)
        .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
        .slice(0, 5),
    [activeProjects, today]
  );

  const followUps = useMemo(
    () =>
      openLeads
        .filter((l) => l.nextFollowUpDate)
        .sort((a, b) => (a.nextFollowUpDate || '').localeCompare(b.nextFollowUpDate || ''))
        .slice(0, 5),
    [openLeads]
  );

  const recentLeads = useMemo(
    () => [...leads].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 5),
    [leads]
  );

  const invoiced = invoices.reduce((s, i) => s + (Number(i.total) || 0), 0);
  const received = invoices.reduce((s, i) => s + (Number(i.amountPaid) || 0), 0);
  const outstanding = stats?.totalOutstanding ?? Math.max(0, invoiced - received);
  const receivedPct = invoiced > 0 ? Math.round((received / invoiced) * 100) : 0;

  const stageCounts = STAGES.map((s) => ({ ...s, count: leads.filter((l) => l.status === s.id).length }));
  const stageTotal = stageCounts.reduce((s, x) => s + x.count, 0) || 1;

  const activeConflicts = conflicts && conflicts.length > 0 ? conflicts : stats?.conflictingDates || [];

  const kpis = [
    { label: 'Open enquiries', value: openLeads.length, hint: `${newLeads} new`, tab: 'LEADS' },
    { label: 'Active projects', value: activeProjects.length, hint: `${upcomingEvents.length} upcoming`, tab: 'PROJECTS' },
    { label: 'Pipeline value', money: pipelineValue, hint: 'Open lead budgets', tab: 'LEADS' },
    { label: 'Outstanding', money: outstanding, hint: `${receivedPct}% collected`, tab: 'FINANCE' },
  ];

  return (
    <div className="space-y-6 pb-16 text-slate-900">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
        <div>
          <p className="text-xs font-semibold text-slate-500">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 mt-1">{greeting()}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenProjectModal}
            className="px-4 py-2.5 rounded-xl glass-btn-secondary text-xs font-bold text-slate-800 cursor-pointer"
          >
            New project
          </button>
          <button
            onClick={onOpenLeadModal}
            className="px-4 py-2.5 rounded-xl glass-btn-primary text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New lead
          </button>
        </div>
      </header>

      {/* Date clash warning */}
      {activeConflicts.length > 0 && (
        <button
          onClick={() => onNavigateTab?.('CALENDAR')}
          className="w-full text-left px-4 py-3 rounded-2xl bg-amber-50/90 border border-amber-200 flex items-center gap-3 cursor-pointer"
        >
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-xs text-amber-900 flex-1">
            <span className="font-bold">{activeConflicts.length} date clash{activeConflicts.length > 1 ? 'es' : ''}</span> · more than one
            event on {activeConflicts.slice(0, 2).map((c) => formatDate(c.date)).join(', ')}
          </span>
          <ArrowRight className="w-4 h-4 text-amber-700 shrink-0" />
        </button>
      )}

      {/* Key numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((k) => (
          <button
            key={k.label}
            onClick={() => onNavigateTab?.(k.tab)}
            className="glass-subcard p-4 sm:p-5 text-left cursor-pointer"
          >
            <p className="text-xs font-semibold text-slate-500">{k.label}</p>
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 mt-2">
              {'money' in k ? formatINR(k.money) : <CountUp value={k.value ?? 0} />}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-1">{k.hint}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming events */}
        <SectionCard title="Upcoming events" action="All projects" onAction={() => onNavigateTab?.('PROJECTS')} className="lg:col-span-2">
          {upcomingEvents.length === 0 ? (
            <Empty text="No upcoming events. New projects will show here." />
          ) : (
            <ul className="divide-y divide-slate-200/70">
              {upcomingEvents.map((p) => {
                const d = new Date(p.eventDate);
                const left = daysUntil(p.eventDate);
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => onSelectProject?.(p.id)}
                      className="w-full py-3 flex items-center gap-3 text-left cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-[#3F5B4A] text-white flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-semibold uppercase leading-none">
                          {d.toLocaleDateString('en-IN', { month: 'short' })}
                        </span>
                        <span className="text-lg font-black leading-tight">{d.getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-950 truncate group-hover:text-[#3F5B4A]">{p.name}</p>
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" /> {p.venue || 'Venue to be confirmed'}
                        </p>
                      </div>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                          left <= 3 ? 'bg-[#C0674A]/12 text-[#9A4A31]' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {left === 0 ? 'Today' : left === 1 ? 'Tomorrow' : `In ${left} days`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        {/* Follow-ups */}
        <SectionCard title="Follow-ups" action="Leads" onAction={() => onNavigateTab?.('LEADS')}>
          {followUps.length === 0 ? (
            <Empty text="No follow-ups scheduled." />
          ) : (
            <ul className="space-y-2">
              {followUps.map((l) => {
                const overdue = (l.nextFollowUpDate || '') < today;
                return (
                  <li key={l.id}>
                    <button
                      onClick={() => onSelectLead?.(l.id)}
                      className="w-full p-3 rounded-xl bg-white/60 hover:bg-white/90 text-left flex items-start gap-3 cursor-pointer transition-colors"
                    >
                      <Clock className={`w-4 h-4 mt-0.5 shrink-0 ${overdue ? 'text-[#C0674A]' : 'text-slate-400'}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-950 truncate">{l.customerName}</p>
                        <p className={`text-xs ${overdue ? 'text-[#9A4A31] font-semibold' : 'text-slate-500'}`}>
                          {overdue ? 'Overdue · ' : ''}
                          {formatDate(l.nextFollowUpDate)}
                          {l.nextFollowUpType ? ` · ${l.nextFollowUpType.replace(/_/g, ' ').toLowerCase()}` : ''}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pipeline */}
        <SectionCard title="Lead pipeline" action="Open pipeline" onAction={() => onNavigateTab?.('LEADS')} className="lg:col-span-2">
          <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100">
            {stageCounts.map((s) =>
              s.count > 0 ? (
                <div
                  key={s.id}
                  title={`${s.label}: ${s.count}`}
                  className="h-full transition-[width] duration-500"
                  style={{ width: `${(s.count / stageTotal) * 100}%`, background: s.color }}
                />
              ) : null
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-5">
            {stageCounts.map((s) => (
              <div key={s.id}>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-[11px] font-semibold text-slate-500">{s.label}</span>
                </div>
                <p className="text-xl font-black text-slate-950 mt-1">
                  <CountUp value={s.count} />
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-slate-200/70">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Collected this season</span>
              <span className="font-bold text-slate-950">
                {formatINR(received)} <span className="text-slate-500 font-medium">of {formatINR(invoiced)}</span>
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 mt-2 overflow-hidden">
              <div className="h-full rounded-full bg-[#3F5B4A] transition-[width] duration-700" style={{ width: `${receivedPct}%` }} />
            </div>
          </div>
        </SectionCard>

        {/* Recent leads */}
        <SectionCard title="Recent enquiries" action="All" onAction={() => onNavigateTab?.('LEADS')}>
          {recentLeads.length === 0 ? (
            <Empty text="No enquiries yet." />
          ) : (
            <ul className="divide-y divide-slate-200/70">
              {recentLeads.map((l) => (
                <li key={l.id}>
                  <button onClick={() => onSelectLead?.(l.id)} className="w-full py-2.5 flex items-center gap-3 text-left cursor-pointer group">
                    <span className="w-8 h-8 rounded-full bg-[#E3EADF] text-[#3F5B4A] text-xs font-black flex items-center justify-center shrink-0">
                      {l.customerName.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-950 truncate group-hover:text-[#3F5B4A]">{l.customerName}</p>
                      <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                        <CalendarDays className="w-3 h-3 shrink-0" /> {l.eventType} · {formatDate(l.eventDate)}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0">{l.status.replace(/_/g, ' ')}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
};
