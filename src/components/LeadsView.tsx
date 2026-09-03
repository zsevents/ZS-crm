import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Phone,
  MessageSquare,
  Calendar,
  DollarSign,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  Briefcase,
  AlertCircle,
  Tag,
  MapPin,
  Send,
  Sparkles,
  ExternalLink,
  ChevronRight,
  X,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Lead, LeadStatus, ActivityItem, Project } from '../types';
import { formatINR, formatDate, formatPhoneNumber, cleanPhoneNumber, formatDateTime } from '../lib/formatters';
import { api } from '../lib/api';

interface LeadsViewProps {
  leads: Lead[];
  selectedLeadId: string | null;
  onSelectLead: (id: string | null) => void;
  onUpdateLeadStatus: (leadId: string, status: LeadStatus) => Promise<void>;
  onAddLeadActivity: (leadId: string, description: string, type?: string) => Promise<void>;
  onUpdateFollowUp: (leadId: string, followUp: { date: string; time: string; type: any; note: string }) => Promise<void>;
  onConvertToProject: (leadId: string) => Promise<Project | void>;
  onOpenNewLeadModal: () => void;
  onNavigateToProject?: (projectId: string) => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  leads,
  selectedLeadId,
  onSelectLead,
  onUpdateLeadStatus,
  onAddLeadActivity,
  onUpdateFollowUp,
  onConvertToProject,
  onOpenNewLeadModal,
  onNavigateToProject,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('NOTE_ADDED');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  // Follow-up scheduling modal in detail drawer
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpDate, setFollowUpDate] = useState(new Date().toISOString().split('T')[0]);
  const [followUpTime, setFollowUpTime] = useState('02:00 PM');
  const [followUpType, setFollowUpType] = useState('CALL');
  const [followUpNote, setFollowUpNote] = useState('');

  // AI WhatsApp generator state
  const [showAiWhatsAppModal, setShowAiWhatsAppModal] = useState(false);
  const [aiWhatsAppTone, setAiWhatsAppTone] = useState<'LUXURY' | 'WARM' | 'URGENT' | 'FOLLOW_UP'>('LUXURY');
  const [aiWhatsAppDraft, setAiWhatsAppDraft] = useState('');
  const [isGeneratingAiPitch, setIsGeneratingAiPitch] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);

  const handleOpenAiWhatsApp = async (lead: Lead) => {
    setShowAiWhatsAppModal(true);
    setIsGeneratingAiPitch(true);
    setCopiedPitch(false);
    try {
      const msg = await api.generateAiWhatsAppDraft({
        customerName: lead.customerName,
        eventType: lead.eventType,
        eventDate: lead.eventDate,
        budget: lead.budget,
        serviceRequired: lead.serviceRequired || lead.message || `${lead.eventType} floral decor`,
        tone: aiWhatsAppTone,
      });
      setAiWhatsAppDraft(msg);
    } catch (err) {
      console.error('Error generating AI WhatsApp pitch:', err);
      setAiWhatsAppDraft(
        `Dear ${lead.customerName}, warm greetings from Z S EVENTS Bangalore! 🌸\n\nThank you for reaching out to us regarding floral decor for your upcoming ${lead.eventType} on ${lead.eventDate || 'your event date'}. We would love to share a bespoke botanical moodboard and discuss your staging concepts.\n\nLet us know when you would like to schedule a 10-minute design call!`
      );
    } finally {
      setIsGeneratingAiPitch(false);
    }
  };

  const handleRegeneratePitch = async (tone: 'LUXURY' | 'WARM' | 'URGENT' | 'FOLLOW_UP') => {
    setAiWhatsAppTone(tone);
    if (!selectedLead) return;
    setIsGeneratingAiPitch(true);
    setCopiedPitch(false);
    try {
      const msg = await api.generateAiWhatsAppDraft({
        customerName: selectedLead.customerName,
        eventType: selectedLead.eventType,
        eventDate: selectedLead.eventDate,
        budget: selectedLead.budget,
        serviceRequired: selectedLead.serviceRequired || selectedLead.message || `${selectedLead.eventType} floral decor`,
        tone,
      });
      setAiWhatsAppDraft(msg);
    } catch (err) {
      console.error('Error regenerating AI WhatsApp pitch:', err);
    } finally {
      setIsGeneratingAiPitch(false);
    }
  };

  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  const statuses: { id: string; label: string; color: string }[] = [
    { id: 'ALL', label: 'All Leads', color: 'bg-slate-100 text-slate-900 border-slate-300' },
    { id: 'NEW', label: 'New', color: 'bg-blue-100 text-blue-900 border-blue-300' },
    { id: 'CONTACTED', label: 'Contacted', color: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
    { id: 'MEETING', label: 'Meeting', color: 'bg-cyan-100 text-cyan-900 border-cyan-300' },
    { id: 'QUOTATION', label: 'Quotation', color: 'bg-amber-100 text-amber-900 border-amber-300' },
    { id: 'NEGOTIATION', label: 'Negotiation', color: 'bg-orange-100 text-orange-900 border-orange-300' },
    { id: 'WON', label: 'Won (Project)', color: 'bg-emerald-100 text-emerald-950 border-emerald-300' },
    { id: 'ON_HOLD', label: 'On Hold', color: 'bg-stone-200 text-stone-900 border-stone-300' },
    { id: 'LOST', label: 'Lost', color: 'bg-rose-100 text-rose-900 border-rose-300' },
  ];

  const pipelineStages: LeadStatus[] = [
    'NEW',
    'CONTACTED',
    'MEETING',
    'QUOTATION',
    'NEGOTIATION',
    'WON',
  ];

  // Filtering
  const filteredLeads = leads.filter((l) => {
    if (activeFilter !== 'ALL' && l.status !== activeFilter) return false;
    if (eventTypeFilter !== 'ALL' && l.eventType !== eventTypeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        l.customerName.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.location.toLowerCase().includes(q) ||
        l.serviceRequired.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !newNote.trim()) return;
    setIsSubmittingNote(true);
    try {
      await onAddLeadActivity(selectedLead.id, newNote.trim(), noteType);
      setNewNote('');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleSaveFollowUp = async () => {
    if (!selectedLead) return;
    await onUpdateFollowUp(selectedLead.id, {
      date: followUpDate,
      time: followUpTime,
      type: followUpType,
      note: followUpNote,
    });
    setShowFollowUpModal(false);
    setFollowUpNote('');
  };

  const handleConvertLead = async () => {
    if (!selectedLead) return;
    setIsConverting(true);
    try {
      const prj = await onConvertToProject(selectedLead.id);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
      if (prj && onNavigateToProject) {
        onNavigateToProject(prj.id);
      }
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 text-slate-900 selection:bg-rose-200">
      {/* 1. TOP SUSPENDED CAPSULE HEADER */}
      <div className="flex flex-col items-center justify-center pt-2">
        <div className="suspended-cable flex flex-col items-center">
          <div className="glass-header-pill px-8 py-2.5 flex items-center gap-3 shadow-xl hover:scale-102 transition-all">
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              Leads & CRM
            </h1>
            <span className="w-2 h-2 rounded-full bg-[#831843] animate-pulse" />
          </div>
        </div>
      </div>

      {/* 2. MASTER FLOATING GLASS SCREEN CONTAINER */}
      <div className="glass-screen p-5 sm:p-7 md:p-8 space-y-6">
        {/* Header & New Lead Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-slate-950 tracking-tight">
                Client Intake & Pipeline
              </h2>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-950 border border-emerald-300/80 font-bold shadow-xs">
                {leads.length} Inquiries
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1">
              Track inquiries, follow-up calls, quotations, and convert won leads directly to active event projects.
            </p>
          </div>

          <button
            onClick={onOpenNewLeadModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass-btn-primary text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#831843]/20 transition-all cursor-pointer w-fit hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Lead</span>
          </button>
        </div>

      {/* Filter Tabs & Search Bar */}
      <div className="p-4 sm:p-5 rounded-2xl glass-card space-y-4 shadow-md">
        {/* Status pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {statuses.map((st) => {
            const count = st.id === 'ALL' ? leads.length : leads.filter((l) => l.status === st.id).length;
            const isSelected = activeFilter === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setActiveFilter(st.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'glass-btn-primary text-white shadow-md'
                    : 'glass-subtle hover:bg-white/80 text-slate-800 border border-white/60'
                }`}
              >
                <span>{st.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-white text-[#831843]' : 'bg-slate-200/80 text-slate-800'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search and Secondary Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-white/60">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by customer name, phone, area (e.g. Whitefield, Indiranagar)..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-[#831843] font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl text-xs glass-input text-slate-900 font-bold cursor-pointer focus:outline-none focus:border-[#831843]"
            >
              <option value="ALL">All Event Types</option>
              <option value="Wedding">Wedding</option>
              <option value="Engagement">Engagement</option>
              <option value="Birthday">Birthday</option>
              <option value="Anniversary">Anniversary</option>
              <option value="Corporate Event">Corporate Event</option>
              <option value="Housewarming">Housewarming</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads List / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLeads.length > 0 ? (
          filteredLeads.map((lead) => {
            const isSelected = selectedLeadId === lead.id;
            return (
              <div
                key={lead.id}
                onClick={() => onSelectLead(lead.id)}
                className={`p-5 rounded-2xl transition-all cursor-pointer relative glass-card ${
                  isSelected
                    ? 'border-[#831843] ring-2 ring-[#831843]/20 shadow-xl'
                    : 'hover:border-[#831843]/50 shadow-md hover:shadow-xl hover:-translate-y-0.5'
                }`}
              >
                {/* Top badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                      {lead.id}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full glass-subtle font-bold text-slate-700">
                      {lead.source}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      lead.status === 'NEW'
                        ? 'bg-blue-100/90 text-blue-900 border-blue-200'
                        : lead.status === 'WON'
                        ? 'bg-emerald-100/90 text-emerald-950 border-emerald-300'
                        : lead.status === 'QUOTATION'
                        ? 'bg-amber-100/90 text-amber-900 border-amber-300'
                        : lead.status === 'LOST'
                        ? 'bg-rose-100/90 text-rose-900 border-rose-200'
                        : 'glass-subtle text-slate-800 border-white/60'
                    }`}
                  >
                    {lead.status}
                  </span>
                </div>

                {/* Customer Details */}
                <div className="mt-3">
                  <h3 className="font-extrabold text-slate-950 text-base">
                    {lead.customerName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-700">
                    <span className="font-bold text-[#831843]">{lead.eventType}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-slate-600 font-medium">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {lead.location}
                    </span>
                  </div>
                </div>

                {/* Service Requirement Snippet */}
                <p className="mt-3 text-xs text-slate-800 font-medium line-clamp-2 glass-subtle p-2.5 rounded-xl border border-white/60">
                  {lead.serviceRequired}
                </p>

                {/* Bottom Row */}
                <div className="mt-4 pt-3 border-t border-white/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">Est. Budget</span>
                    <span className="font-black text-slate-950">{formatINR(lead.budget)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-bold block">Event Date</span>
                    <span className="font-bold text-slate-800">{formatDate(lead.eventDate)}</span>
                  </div>
                </div>

                {/* Converted to Project Badge if Won */}
                {lead.convertedProjectId && (
                  <div className="mt-3 py-2 px-3 rounded-xl bg-emerald-50/90 border border-emerald-300 text-[11px] text-emerald-950 font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-emerald-700" />
                      Project: {lead.convertedProjectId}
                    </span>
                    <ArrowRight className="w-3 h-3 text-emerald-700" />
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full p-12 text-center rounded-3xl glass-card border border-dashed border-slate-300">
            <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="font-bold text-slate-900 text-sm">No leads match your filter</p>
            <p className="text-xs text-slate-600 mt-1">Try changing the status or search terms.</p>
          </div>
        )}
      </div>
      </div>

      {/* LEAD DETAIL DRAWER */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-5xl h-full glass-modal border-l border-white/80 shadow-2xl flex flex-col overflow-hidden text-slate-900">
            {/* Drawer Top Header */}
            <div className="p-4 sm:p-5 border-b border-white/60 flex items-center justify-between glass-panel">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100/90 border border-rose-200 text-[#831843] flex items-center justify-center font-black text-sm shadow-xs">
                  {selectedLead.customerName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-950">
                      {selectedLead.customerName}
                    </h2>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full glass-subtle text-slate-800">
                      {selectedLead.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    {selectedLead.eventType} · {selectedLead.location} · Source: {selectedLead.source}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectLead(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-white/40 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 3-Pane Body Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/60">
              {/* LEFT PANE (4 cols): Customer & Event Information */}
              <div className="lg:col-span-4 p-5 space-y-5 glass-subtle">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Customer & Event Info
                </h3>

                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-slate-500 font-bold block mb-1">Phone & WhatsApp</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-950 text-sm">
                        {formatPhoneNumber(selectedLead.phone)}
                      </span>
                      <a
                        href={`tel:${cleanPhoneNumber(selectedLead.phone)}`}
                        className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                        title="Call Customer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={`https://wa.me/${cleanPhoneNumber(selectedLead.phone)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                        title="Open WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {selectedLead.email && (
                    <div>
                      <span className="text-slate-500 font-bold block mb-1">Email</span>
                      <span className="text-slate-900 font-medium">{selectedLead.email}</span>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-500 font-bold block mb-1">Event Date & Venue</span>
                    <div className="font-bold text-slate-950 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#831843]" />
                      {formatDate(selectedLead.eventDate)}
                    </div>
                    {selectedLead.venue && (
                      <p className="text-slate-700 mt-0.5 flex items-center gap-1 font-medium">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {selectedLead.venue}
                      </p>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-500 font-bold block mb-1">Estimated Budget</span>
                    <span className="text-lg font-black text-emerald-950">
                      {formatINR(selectedLead.budget)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-bold block mb-1">Floral Service Required</span>
                    <p className="text-slate-900 glass-card p-3 rounded-2xl font-medium">
                      {selectedLead.serviceRequired}
                    </p>
                  </div>

                  {selectedLead.message && (
                    <div>
                      <span className="text-slate-500 font-bold block mb-1">Customer Message / Inquiry</span>
                      <p className="text-slate-800 italic bg-amber-50/80 p-3 rounded-2xl border border-amber-200">
                        "{selectedLead.message}"
                      </p>
                    </div>
                  )}

                  {selectedLead.additionalRequirements && (
                    <div>
                      <span className="text-slate-500 font-bold block mb-1">Flower Preferences</span>
                      <p className="text-slate-800 glass-card p-2.5 rounded-2xl">
                        {selectedLead.additionalRequirements}
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-500 font-bold block mb-1">Assigned Staff</span>
                    <span className="font-bold text-slate-900">{selectedLead.assignedStaff}</span>
                  </div>
                </div>

                {/* Follow-up status card */}
                <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950">Next Follow-up</span>
                    <button
                      onClick={() => setShowFollowUpModal(true)}
                      className="text-[#831843] font-bold hover:underline cursor-pointer"
                    >
                      Reschedule
                    </button>
                  </div>
                  <p className="text-slate-900 mt-1 font-semibold">
                    {selectedLead.nextFollowUpType || 'Call'} on {formatDate(selectedLead.nextFollowUpDate)} at {selectedLead.nextFollowUpTime || '11:00 AM'}
                  </p>
                  {selectedLead.nextFollowUpNote && (
                    <p className="text-slate-700 mt-1 italic">"{selectedLead.nextFollowUpNote}"</p>
                  )}
                </div>
              </div>

              {/* CENTER PANE (5 cols): Pipeline & Activity Timeline */}
              <div className="lg:col-span-5 p-5 space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Interactive Pipeline Bar */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Lead Pipeline Stage
                    </h3>
                    <div className="grid grid-cols-3 gap-1.5">
                      {pipelineStages.map((stage) => {
                        const isCurrent = selectedLead.status === stage;
                        return (
                          <button
                            key={stage}
                            onClick={() => onUpdateLeadStatus(selectedLead.id, stage)}
                            className={`px-2.5 py-2 rounded-xl text-[11px] font-bold transition-all text-center cursor-pointer ${
                              isCurrent
                                ? 'glass-btn-primary text-white shadow-md'
                                : 'glass-subtle hover:bg-white/80 text-slate-800 border border-white/60'
                            }`}
                          >
                            {stage}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Activity Timeline */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                      Activity History & Notes
                    </h3>
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {selectedLead.activities && selectedLead.activities.length > 0 ? (
                        selectedLead.activities.map((act: ActivityItem, idx: number) => (
                          <div key={act.id || idx} className="p-3.5 rounded-2xl glass-card text-xs">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                              <span className="font-bold text-[#831843]">{act.createdBy}</span>
                              <span className="font-medium">{formatDateTime(act.timestamp)}</span>
                            </div>
                            <p className="text-slate-900 font-medium">{act.description}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 italic">No notes recorded yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Add Note / Activity Composer */}
                <form onSubmit={handleAddNote} className="mt-4 pt-3 border-t border-white/60">
                  <div className="flex items-center gap-2 mb-2">
                    <select
                      value={noteType}
                      onChange={(e) => setNoteType(e.target.value)}
                      className="text-[11px] px-2.5 py-1.5 rounded-xl glass-input text-slate-900 font-bold focus:outline-none focus:border-[#831843]"
                    >
                      <option value="NOTE_ADDED">Note</option>
                      <option value="CALL">Call Log</option>
                      <option value="WHATSAPP">WhatsApp Note</option>
                      <option value="MEETING">Meeting Notes</option>
                      <option value="QUOTATION_SENT">Quotation Sent</option>
                    </select>
                    <span className="text-[11px] text-slate-500 font-medium">Append to timeline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="e.g. Customer approved pastel moodboard..."
                      className="flex-1 px-3.5 py-2 text-xs rounded-xl glass-input text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-[#831843] font-medium"
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingNote || !newNote.trim()}
                      className="px-4 py-2 rounded-xl glass-btn-primary text-white text-xs font-bold disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md"
                    >
                      <Send className="w-3 h-3" />
                      <span>Log</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* RIGHT PANE (3 cols): Quick Actions & Project Conversion */}
              <div className="lg:col-span-3 p-5 space-y-4 glass-subtle">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Quick Actions
                </h3>

                <div className="space-y-2.5">
                  {/* 1. Direct Call */}
                  <a
                    href={`tel:${cleanPhoneNumber(selectedLead.phone)}`}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-card hover:border-[#831843]/50 text-xs font-bold text-slate-900 flex items-center justify-between transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-600" />
                      Call Customer
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  {/* 2. Direct WhatsApp */}
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`https://wa.me/${cleanPhoneNumber(selectedLead.phone)}?text=${encodeURIComponent(`Hi ${selectedLead.customerName}, regarding your ${selectedLead.eventType} floral decor inquiry with Z S EVENTS Bangalore...`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2.5 rounded-xl glass-card hover:border-[#831843]/50 text-xs font-bold text-slate-900 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <MessageSquare className="w-4 h-4 text-green-600" />
                      WhatsApp
                    </a>
                    <button
                      onClick={() => handleOpenAiWhatsApp(selectedLead)}
                      className="px-3 py-2.5 rounded-xl bg-emerald-700/90 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Smart Pitch
                    </button>
                  </div>

                  {/* 3. Schedule Follow-up */}
                  <button
                    onClick={() => setShowFollowUpModal(true)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-card hover:border-[#831843]/50 text-xs font-bold text-slate-900 flex items-center justify-between transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Schedule Follow-up
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>

                <div className="my-3 border-t border-white/60" />

                {/* Convert to Project Section */}
                <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                    <h4 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider">
                      Order Confirmed?
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-700 font-medium">
                    Carry over customer info, budget ({formatINR(selectedLead.budget)}), venue, and notes into an active project.
                  </p>

                  {selectedLead.convertedProjectId ? (
                    <div className="p-2.5 rounded-xl bg-emerald-100/90 border border-emerald-300 text-xs font-bold text-emerald-950 text-center">
                      ✓ Converted: {selectedLead.convertedProjectId}
                    </div>
                  ) : (
                    <button
                      onClick={handleConvertLead}
                      disabled={isConverting}
                      className="w-full py-2.5 rounded-xl glass-btn-primary active:scale-95 text-white text-xs font-bold shadow-md shadow-[#831843]/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:scale-102"
                    >
                      <Briefcase className="w-4 h-4" />
                      <span>{isConverting ? 'Converting...' : 'Convert to Project'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Follow-up Modal */}
      {showFollowUpModal && selectedLead && (
        <div className="fixed inset-0 z-60 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-modal rounded-3xl shadow-2xl p-6 space-y-4 text-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-950 text-base">Schedule Follow-up</h3>
              <button onClick={() => setShowFollowUpModal(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer">✕</button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Follow-up Date</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-semibold focus:outline-none focus:border-[#831843]"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Follow-up Time</label>
                <input
                  type="text"
                  value={followUpTime}
                  onChange={(e) => setFollowUpTime(e.target.value)}
                  placeholder="e.g. 11:00 AM"
                  className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-semibold focus:outline-none focus:border-[#831843]"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Action Type</label>
                <select
                  value={followUpType}
                  onChange={(e) => setFollowUpType(e.target.value)}
                  className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-bold focus:outline-none focus:border-[#831843]"
                >
                  <option value="CALL">Call Customer</option>
                  <option value="WHATSAPP">Send WhatsApp Message</option>
                  <option value="MEETING">Design Studio Meeting</option>
                  <option value="SITE_VISIT">Venue Site Inspection</option>
                  <option value="SEND_QUOTATION">Send Revised Quotation</option>
                  <option value="PAYMENT_REMINDER">Payment Follow-up</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Follow-up Note</label>
                <textarea
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  placeholder="e.g. Call to finalize mandap rose color and stage height..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium focus:outline-none focus:border-[#831843]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                onClick={() => setShowFollowUpModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-white/40 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFollowUp}
                className="px-4 py-2 rounded-xl text-xs font-bold glass-btn-primary text-white shadow-md cursor-pointer"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI WhatsApp Pitch Generator Modal */}
      {showAiWhatsAppModal && selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-modal rounded-3xl shadow-2xl p-6 space-y-4 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50/90 border border-emerald-200 flex items-center justify-center text-emerald-800">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-950 text-sm">Smart WhatsApp Pitch Generator</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                      Zero Key Needed
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Instant customized copy for {selectedLead.customerName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiWhatsAppModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-white/40 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tone Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Select Pitch Tone</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['LUXURY', 'WARM', 'URGENT', 'FOLLOW_UP'] as const).map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => handleRegeneratePitch(tone)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      aiWhatsAppTone === tone
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'glass-subtle hover:bg-white/80 text-slate-700'
                    }`}
                  >
                    {tone === 'LUXURY' && '✨ Luxury'}
                    {tone === 'WARM' && '🌸 Warm'}
                    {tone === 'URGENT' && '⚡ Urgent'}
                    {tone === 'FOLLOW_UP' && '📅 Check-in'}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Draft Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">WhatsApp Message Content</label>
                {isGeneratingAiPitch && (
                  <span className="text-[11px] font-bold text-emerald-800 animate-pulse flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Drafting...
                  </span>
                )}
              </div>
              <textarea
                value={aiWhatsAppDraft}
                onChange={(e) => setAiWhatsAppDraft(e.target.value)}
                rows={8}
                disabled={isGeneratingAiPitch}
                className="w-full p-3 rounded-2xl glass-input text-slate-950 font-medium text-xs focus:outline-none focus:border-emerald-700 font-mono leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(aiWhatsAppDraft);
                  setCopiedPitch(true);
                  setTimeout(() => setCopiedPitch(false), 2000);
                }}
                className="px-3.5 py-2 rounded-xl glass-card hover:bg-white/80 text-xs font-bold text-slate-800 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedPitch ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                {copiedPitch ? 'Copied!' : 'Copy Text'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAiWhatsAppModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-white/40 cursor-pointer"
                >
                  Close
                </button>
                <a
                  href={`https://wa.me/${cleanPhoneNumber(selectedLead.phone)}?text=${encodeURIComponent(aiWhatsAppDraft)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-green-700 hover:bg-green-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-green-700/20 transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Open in WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
