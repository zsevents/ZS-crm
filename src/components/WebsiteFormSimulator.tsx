import React, { useState } from 'react';
import {
  Globe,
  Send,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Flower2,
  Phone,
  Calendar,
  MapPin,
  Heart,
  DollarSign,
  User,
  Mail,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  Filter,
  Eye,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { Lead, DEFAULT_BUSINESS_SETTINGS } from '../types';
import { api } from '../lib/api';
import { formatINR, formatDate } from '../lib/formatters';

interface WebsiteFormSimulatorProps {
  leads?: Lead[];
  onLeadCreated?: (leadId: string) => void;
  bangaloreAreas?: string[];
  eventTypes?: string[];
  onSelectLead?: (leadId: string) => void;
  templates?: any[];
  onLeadSubmitted?: () => void;
  onViewLeads?: () => void;
}

export const WebsiteFormSimulator: React.FC<WebsiteFormSimulatorProps> = ({
  leads = [],
  onLeadCreated,
  bangaloreAreas = DEFAULT_BUSINESS_SETTINGS.bangaloreAreas,
  eventTypes = DEFAULT_BUSINESS_SETTINGS.eventTypes,
  onSelectLead,
  templates = [],
  onLeadSubmitted,
  onViewLeads,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'INBOX' | 'SIMULATOR'>('INBOX');

  // Form State for the simulator
  const [name, setName] = useState('Deepika Padukone');
  const [phone, setPhone] = useState('+91 99887 66554');
  const [email, setEmail] = useState('deepika@example.com');
  const [location, setLocation] = useState(bangaloreAreas?.[0] || 'Sadashivanagar, Bangalore');
  const [eventType, setEventType] = useState(eventTypes?.[0] || 'Wedding');
  const [eventDate, setEventDate] = useState('2026-11-20');
  const [service, setService] = useState('Stage Floral Decor & Jasmine Mandap');
  const [budget, setBudget] = useState('250000');
  const [message, setMessage] = useState('Need grand traditional South Indian floral styling with 100kg fresh white and pink lotus, jasmine garlands, and floral entryway.');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inquirySearch, setInquirySearch] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<Lead | null>(null);

  const [result, setResult] = useState<{
    success: boolean;
    leadId?: string;
    message?: string;
    duplicateWarning?: string;
    error?: string;
  } | null>(null);

  // Filter inquiries that come from Website
  const websiteInquiries = leads.filter((l) => l.source === 'WEBSITE');
  const filteredInquiries = websiteInquiries.filter((l) => {
    if (!inquirySearch) return true;
    const q = inquirySearch.toLowerCase();
    return (
      l.customerName.toLowerCase().includes(q) ||
      l.phone.toLowerCase().includes(q) ||
      (l.email && l.email.toLowerCase().includes(q)) ||
      (l.location && l.location.toLowerCase().includes(q)) ||
      (l.eventType && l.eventType.toLowerCase().includes(q))
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await api.submitWebsiteInquiry({
        name,
        phone,
        email,
        location,
        eventType,
        eventDate,
        service,
        budget: Number(budget),
        message,
      });

      setResult({
        success: true,
        leadId: res.leadId,
        message: res.message,
        duplicateWarning: res.duplicateWarning,
      });

      if (res.leadId) {
        onLeadCreated(res.leadId);
      }
    } catch (err: any) {
      setResult({
        success: false,
        error: err.message || 'Failed to submit website inquiry',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (preset: 'WEDDING' | 'BIRTHDAY' | 'CORPORATE') => {
    if (preset === 'WEDDING') {
      setName('Siddharth Malini');
      setPhone('+91 98450 11992');
      setEmail('siddharth.m@gmail.com');
      setLocation('Whitefield, Bangalore');
      setEventType('Wedding');
      setEventDate('2026-12-05');
      setService('Luxury Pastel Rose Stage & Mandap Decoration');
      setBudget('180000');
      setMessage('Looking for lush english rose mandap and floral canopy for reception at The Taj West End.');
    } else if (preset === 'BIRTHDAY') {
      setName('Rhea Kapoor');
      setPhone('+91 97400 88221');
      setEmail('rhea.k@design.in');
      setLocation('Indiranagar, Bangalore');
      setEventType('Birthday');
      setEventDate('2026-09-18');
      setService('Boho Floral & Pampas Grass Photo Booth');
      setBudget('40000');
      setMessage('Floral arch and table centerpieces for a 30th birthday dinner.');
    } else {
      setName('Infosys Events Desk');
      setPhone('+91 98860 55443');
      setEmail('events@infosys.com');
      setLocation('Electronic City, Bangalore');
      setEventType('Corporate Event');
      setEventDate('2026-10-10');
      setService('Annual Awards Floral Centerpieces & Stage Backdrop');
      setBudget('320000');
      setMessage('Contemporary corporate setup with blue orchids, lilies, and branded floral photo wall.');
    }
    setResult(null);
  };

  return (
    <div className="space-y-8 pb-16 text-slate-900 selection:bg-rose-200">
      {/* 1. TOP SUSPENDED CAPSULE HEADER */}
      <div className="flex flex-col items-center justify-center pt-2">
        <div className="suspended-cable flex flex-col items-center">
          <div className="glass-header-pill px-8 py-2.5 flex items-center gap-3 shadow-xl hover:scale-102 transition-all">
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              Website Inquiries
            </h1>
            <span className="w-2 h-2 rounded-full bg-[#831843] animate-pulse" />
          </div>
        </div>
      </div>

      {/* 2. MASTER FLOATING GLASS SCREEN CONTAINER */}
      <div className="glass-screen p-5 sm:p-7 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-slate-950 tracking-tight">
                Website Inquiries & Intake
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full glass-subtle text-[#831843] font-bold border border-rose-200 shadow-xs">
                {websiteInquiries.length} Inquiries Received
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1">
              Review incoming inquiries submitted through your florist website and test real-time form intake logic.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('INBOX')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'INBOX'
                  ? 'glass-btn-primary text-white shadow-md'
                  : 'glass-card hover:bg-white text-slate-800'
              }`}
            >
              Inquiries Inbox ({websiteInquiries.length})
            </button>
            <button
              onClick={() => setActiveSubTab('SIMULATOR')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'SIMULATOR'
                  ? 'glass-btn-primary text-white shadow-md'
                  : 'glass-card hover:bg-white text-slate-800'
              }`}
            >
              Interactive Form Simulator
            </button>
          </div>
        </div>

      {/* VIEW 1: WEBSITE INBOX & INQUIRIES LIST */}
      {activeSubTab === 'INBOX' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inquiries list */}
          <div className="lg:col-span-2 space-y-3">
            <div className="glass-card border border-white/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
              <input
                type="text"
                value={inquirySearch}
                onChange={(e) => setInquirySearch(e.target.value)}
                placeholder="Search website inquiries by client name, phone, venue..."
                className="w-full glass-input text-xs"
              />
            </div>

            {filteredInquiries.length > 0 ? (
              filteredInquiries.map((inquiry) => {
                const isSelected = selectedInquiry?.id === inquiry.id;
                return (
                  <div
                    key={inquiry.id}
                    onClick={() => setSelectedInquiry(inquiry)}
                    className={`p-5 rounded-3xl border transition-all cursor-pointer glass-card shadow-lg ${
                      isSelected
                        ? 'border-[#831843] ring-2 ring-[#831843]/30 bg-rose-500/10'
                        : 'border-white/80 hover:border-[#831843]/40'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#831843] text-xs">
                            {inquiry.id}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-950 font-bold border border-emerald-500/30">
                            Status: {inquiry.status}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-950 font-bold border border-indigo-500/25">
                            Source: Website Form
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-slate-950 mt-1">
                          {inquiry.customerName}
                        </h3>
                        <p className="text-xs text-slate-700 font-medium">
                          {inquiry.eventType} • {inquiry.location}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Client Budget
                        </span>
                        <span className="text-base font-black text-slate-950">
                          {formatINR(inquiry.budget)}
                        </span>
                        <span className="text-[11px] text-slate-700 font-semibold block mt-0.5">
                          Date: {formatDate(inquiry.eventDate)}
                        </span>
                      </div>
                    </div>

                    {inquiry.message && (
                      <p className="mt-2.5 p-3 rounded-2xl bg-white/50 text-xs text-slate-800 italic border border-white/80 line-clamp-2 backdrop-blur-xs">
                        "{inquiry.message}"
                      </p>
                    )}

                    <div className="mt-3 pt-2.5 border-t border-white/60 flex items-center justify-between text-xs text-slate-600">
                      <span>Submitted: {formatDate(inquiry.createdAt)}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectLead) {
                            onSelectLead(inquiry.id);
                          } else if (onViewLeads) {
                            onViewLeads();
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-white/80 hover:bg-white text-[#831843] font-bold text-xs transition-all flex items-center gap-1 cursor-pointer border border-rose-500/20 shadow-xs"
                      >
                        <span>Open Lead in CRM</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center rounded-3xl glass-card border border-dashed border-white/90 text-slate-600 shadow-xl">
                <Globe className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="font-bold text-sm text-slate-900">No website inquiries yet</p>
                <p className="text-xs text-slate-600 mt-1">
                  Click on "Live Form Simulator" tab to simulate customer inquiry submissions.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('SIMULATOR')}
                  className="mt-4 px-5 py-2.5 bg-gradient-to-r from-[#831843] to-[#9f1239] hover:from-[#701a39] hover:to-[#881337] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#831843]/20 border border-white/20 cursor-pointer transition-all"
                >
                  Open Simulator
                </button>
              </div>
            )}
          </div>

          {/* Details Sidebar preview */}
          <div className="glass-card border border-white/80 rounded-3xl p-5 shadow-xl h-fit space-y-4 text-slate-900">
            <h3 className="text-sm font-extrabold text-slate-950 pb-2 border-b border-white/60 flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#831843]" />
              <span>Inquiry Quick Viewer</span>
            </h3>

            {selectedInquiry ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 font-bold text-[11px] block">Client Name</span>
                  <span className="font-extrabold text-slate-950 text-sm">{selectedInquiry.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold text-[11px] block">Phone / WhatsApp</span>
                  <a href={`tel:${selectedInquiry.phone}`} className="font-bold text-[#831843] hover:underline">
                    {selectedInquiry.phone}
                  </a>
                </div>
                {selectedInquiry.email && (
                  <div>
                    <span className="text-slate-500 font-bold text-[11px] block">Email</span>
                    <span className="text-slate-900 font-medium">{selectedInquiry.email}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 font-bold text-[11px] block">Event & Date</span>
                  <span className="font-bold text-slate-900">{selectedInquiry.eventType} on {formatDate(selectedInquiry.eventDate)}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold text-[11px] block">Venue / Area</span>
                  <span className="text-slate-900 font-medium">{selectedInquiry.location}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold text-[11px] block">Budget</span>
                  <span className="font-black text-emerald-900 text-sm">{formatINR(selectedInquiry.budget)}</span>
                </div>
                {selectedInquiry.message && (
                  <div>
                    <span className="text-slate-500 font-bold text-[11px] block">Client Message</span>
                    <p className="p-3 bg-white/50 rounded-2xl text-slate-800 italic border border-white/80 mt-1 backdrop-blur-xs">
                      "{selectedInquiry.message}"
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (onSelectLead) {
                      onSelectLead(selectedInquiry.id);
                    } else if (onViewLeads) {
                      onViewLeads();
                    }
                  }}
                  className="w-full mt-2 py-2.5 bg-gradient-to-r from-[#831843] to-[#9f1239] hover:from-[#701a39] hover:to-[#881337] text-white font-bold rounded-xl text-xs shadow-md shadow-[#831843]/20 border border-white/20 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Open Full Lead Record</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Select an inquiry from the list to preview details.
              </p>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: LIVE CLIENT SIMULATOR */}
      {activeSubTab === 'SIMULATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form container */}
          <div className="lg:col-span-2 glass-card border border-white/80 rounded-3xl p-6 sm:p-8 shadow-xl text-slate-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/60 mb-6 gap-2">
              <div>
                <h2 className="text-lg font-extrabold text-slate-950">
                  Client Intake Form (Live Interactive Simulator)
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  Simulate what customers submit on your website and verify live CRM lead generation.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickFill('WEDDING')}
                  className="px-3 py-1.5 text-[11px] font-bold rounded-xl bg-rose-500/15 text-[#831843] hover:bg-rose-500/25 transition-all border border-rose-500/25 cursor-pointer shadow-xs"
                >
                  Wedding
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('BIRTHDAY')}
                  className="px-3 py-1.5 text-[11px] font-bold rounded-xl bg-emerald-500/15 text-emerald-900 hover:bg-emerald-500/25 transition-all border border-emerald-500/25 cursor-pointer shadow-xs"
                >
                  Birthday
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('CORPORATE')}
                  className="px-3 py-1.5 text-[11px] font-bold rounded-xl bg-indigo-500/15 text-indigo-900 hover:bg-indigo-500/25 transition-all border border-indigo-500/25 cursor-pointer shadow-xs"
                >
                  Corporate
                </button>
              </div>
            </div>

            {/* Submission Status Alert */}
            {result && (
              <div
                className={`mb-6 p-4 rounded-2xl text-xs flex items-start gap-3 backdrop-blur-xs ${
                  result.success
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-950'
                    : 'bg-rose-500/15 border border-rose-500/30 text-rose-950'
                }`}
              >
                {result.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-extrabold text-sm">
                    {result.success ? 'Inquiry Submitted Successfully!' : 'Submission Failed'}
                  </p>
                  <p className="mt-0.5 font-medium">{result.message || result.error}</p>
                  {result.duplicateWarning && (
                    <p className="text-amber-900 font-bold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                      {result.duplicateWarning}
                    </p>
                  )}
                  {result.leadId && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectLead) {
                          onSelectLead(result.leadId!);
                        } else if (onViewLeads) {
                          onViewLeads();
                        }
                      }}
                      className="mt-2 text-xs font-bold text-[#831843] underline cursor-pointer hover:text-[#701a39]"
                    >
                      View Lead #{result.leadId} in CRM →
                    </button>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-900">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-900 mb-1">
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Deepika Padukone"
                    className="w-full glass-input"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-900 mb-1">
                    Phone / WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 99887 66554"
                    className="w-full glass-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-900 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="deepika@example.com"
                    className="w-full glass-input"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-900 mb-1">
                    Bangalore Location / Venue <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full glass-input font-semibold"
                  >
                    {bangaloreAreas.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-900 mb-1">
                    Event Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full glass-input font-semibold"
                  >
                    {eventTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-900 mb-1">
                    Event Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full glass-input font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-900 mb-1">
                    Estimated Budget (₹ INR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="250000"
                    className="w-full glass-input font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Primary Floral Service Requested
                </label>
                <input
                  type="text"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  placeholder="Stage Floral Decor, Jasmine Mandap, Table Centerpieces..."
                  className="w-full glass-input"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Floral Design Preferences & Notes
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your floral palette, favorite blossoms (Lotus, Roses, Orchids, Carnations), theme, or setup requirements..."
                  className="w-full glass-input"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-[#831843] to-[#9f1239] hover:from-[#701a39] hover:to-[#881337] text-white font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-[#831843]/25 border border-white/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Submitting Inquiry to Z S EVENTS CRM...</span>
                ) : (
                  <>
                    <span>Submit Consultation Inquiry</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Side Info */}
          <div className="space-y-4 text-slate-900">
            <div className="glass-card border border-emerald-500/30 rounded-3xl p-5 text-xs text-emerald-950 space-y-2.5 shadow-xl bg-emerald-500/10">
              <h4 className="font-extrabold flex items-center gap-1.5 text-emerald-950 text-sm">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>Automated CRM Processing</span>
              </h4>
              <p className="text-slate-800 font-medium">
                When a customer submits this form, the system automatically:
              </p>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-800 font-medium">
                <li>Creates a lead record tagged with <strong>WEBSITE</strong> source</li>
                <li>Validates phone numbers and flags existing clients</li>
                <li>Calculates estimated floral margins and Indian GST rates</li>
                <li>Syncs directly to your Leads & CRM pipeline</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
