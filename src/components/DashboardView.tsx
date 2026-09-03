import React, { useState } from 'react';
import {
  Users,
  Briefcase,
  TrendingUp,
  AlertCircle,
  Calendar,
  Clock,
  Phone,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Sparkles,
  MapPin,
  Globe,
  MessageCircle,
  ExternalLink,
  Filter,
  RefreshCw,
  ChevronDown,
  FileText,
  Receipt,
  Layers,
  ChevronRight,
  Flower2,
  Activity,
  Compass,
  Zap,
  Sliders,
  ChevronLeft,
} from 'lucide-react';
import { DashboardStats, Project, Lead, DateConflict, Quotation, Invoice } from '../types';
import { formatINR, formatDate, formatPhoneNumber } from '../lib/formatters';
import { CustomerHoverDropdown } from './CustomerHoverDropdown';
import zsEventsLogo from '../assets/images/zs_events_logo_1788181982999.jpg';

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

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  conflicts = [],
  projects = [],
  leads = [],
  quotations = [],
  invoices = [],
  onSelectLead = (_leadId: string) => {},
  onSelectProject = (_projectId: string) => {},
  onNavigateTab = (_tab: string) => {},
  onOpenDailyUpdateModal = (_projectId?: string) => {},
  onOpenLeadModal = () => {},
  onOpenProjectModal = () => {},
  onOpenPaymentModal = () => {},
}) => {
  const [activeStreamTab, setActiveStreamTab] = useState<
    'LEADS' | 'PROJECTS' | 'SCHEDULE' | 'FINANCE'
  >('LEADS');
  const [leadSourceFilter, setLeadSourceFilter] = useState<'ALL' | 'WEBSITE' | 'NEW'>('ALL');
  const [selectedDay, setSelectedDay] = useState<number>(3); // Wed/Thu

  const activeProjects = (projects || []).filter((p) =>
    ['PLANNING', 'IN_PROGRESS', 'EVENT_DAY'].includes(p.status)
  );
  const activeConflicts =
    conflicts && conflicts.length > 0 ? conflicts : stats?.conflictingDates || [];
  const websiteLeads = (leads || []).filter((l) => l.source === 'WEBSITE');

  const filteredLeads = (leads || []).filter((l) => {
    if (leadSourceFilter === 'WEBSITE') return l.source === 'WEBSITE';
    if (leadSourceFilter === 'NEW') return l.status === 'NEW';
    return true;
  });

  const weekLoadData = [
    { day: 'Mon', count: 2, height: '40%' },
    { day: 'Tue', count: 3, height: '55%' },
    { day: 'Wed', count: 4, height: '75%' },
    { day: 'Thu', count: 5, height: '95%', isPeak: true },
    { day: 'Fri', count: 3, height: '60%' },
    { day: 'Sat', count: 4, height: '85%' },
    { day: 'Sun', count: 1, height: '25%' },
  ];

  return (
    <div className="space-y-8 pb-16 text-slate-900 selection:bg-rose-200">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP SUSPENDED CAPSULE HEADER (Matching Reference Image)    */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col items-center justify-center pt-2">
        <div className="suspended-cable flex flex-col items-center">
          <div className="glass-header-pill px-8 py-2.5 flex items-center gap-3 shadow-xl hover:scale-102 transition-all">
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              Dashboard
            </h1>
            <span className="w-2 h-2 rounded-full bg-[#831843] animate-pulse" />
          </div>
        </div>
      </div>

      {/* Date Conflict Warning Banner (if conflicts exist) */}
      {activeConflicts.length > 0 && (
        <div className="p-4 rounded-3xl bg-amber-50/80 backdrop-blur-xl border border-amber-200/90 shadow-lg">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-amber-100/90 border border-amber-300 text-amber-800 shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Bangalore Multi-Event Date Conflict Alert
                </h4>
                <button
                  onClick={() => onNavigateTab('CALENDAR')}
                  className="text-xs font-bold text-[#831843] underline cursor-pointer hover:text-[#701a39]"
                >
                  Open Calendar →
                </button>
              </div>
              <p className="text-xs text-amber-800 mt-0.5 font-medium">
                Multiple active floral decorations are scheduled on the same date in Bangalore. Allocate transport, scaffolding, and floral masters.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {activeConflicts.map((c) => (
                  <div
                    key={c.date}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-xl glass-subcard border border-amber-300/80 text-xs font-medium text-amber-950 shadow-xs"
                  >
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span className="font-bold">{formatDate(c.date)}:</span>
                    <span>{c.projectCount} Events</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. MASTER FLOATING GLASS SCREEN (Exact Reference Aesthetic)   */}
      {/* ------------------------------------------------------------- */}
      <div className="glass-screen p-5 sm:p-7 md:p-8 space-y-6">
        
        {/* ROW 1: Mandap Control + Weekly Muhurtham Load + Cold Storage Bandwidth + Live Staging Tracker */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          
          {/* Card 1: Mandap & Production Control (Dark Frosted Glass Card) */}
          <div className="glass-dark-card p-6 flex flex-col justify-between relative overflow-hidden group hover:border-white/40 transition-all shadow-2xl">
            <div className="flex items-start justify-between z-10">
              <div>
                <span className="text-[11px] font-extrabold tracking-widest uppercase text-[#fb7185]">
                  MANDAP & STAGING CONTROL
                </span>
                <h3 className="text-2xl font-black text-white mt-1 tracking-tight">
                  Active Venue Setups
                </h3>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-rose-300 shadow-inner group-hover:scale-105 transition-all">
                <Flower2 className="w-5 h-5" />
              </div>
            </div>

            {/* Visual sculpture / Geometric floral motif with rotating dashed ring */}
            <div className="my-4 flex items-center justify-center relative py-1">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-rose-400/50 animate-[spin_30s_linear_infinite]" />
                <div className="w-20 h-20 rounded-full bg-white/95 p-1 border-2 border-rose-400/80 shadow-2xl group-hover:scale-105 transition-transform duration-300 flex items-center justify-center overflow-hidden">
                  <img
                    src={zsEventsLogo}
                    alt="ZS Events Logo"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>
            </div>

            <div className="z-10 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
              <div>
                <p className="text-[10.5px] text-slate-400 font-medium">KR Market Flower Dispatch</p>
                <p className="font-extrabold text-white text-sm">4,200 kg Staged Blooms</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-rose-300 font-black tracking-tight">18 Riggers & Florists</p>
                <p className="text-[10.5px] text-slate-400">Muhurtham: 04:30 AM</p>
              </div>
            </div>
          </div>

          {/* Card 2: Weekly Wedding & Muhurtham Load */}
          <div className="glass-subcard p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
                  Weekly Wedding & Muhurtham Load
                </span>
                <div className="text-xl font-black text-slate-950 mt-0.5">
                  {activeProjects.length > 0 ? activeProjects.length : 6} Mandaps <span className="text-xs font-bold text-slate-500">/ 7-Day Window</span>
                </div>
              </div>
              <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                7d
              </div>
            </div>

            {/* Vertical Bar Meters */}
            <div className="my-5 flex items-end justify-between gap-2 h-28 px-1">
              {weekLoadData.map((item, idx) => (
                <div
                  key={item.day}
                  onClick={() => setSelectedDay(idx)}
                  className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end cursor-pointer group"
                >
                  <div
                    className={`w-full rounded-full transition-all duration-300 relative flex items-center justify-center ${
                      item.isPeak || selectedDay === idx
                        ? 'bg-slate-950 shadow-md scale-105'
                        : 'bg-slate-300/80 hover:bg-slate-400'
                    }`}
                    style={{ height: item.height }}
                  >
                    {(item.isPeak || selectedDay === idx) && (
                      <span className="text-[9px] font-bold text-white">
                        {item.count}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold transition-colors ${
                      selectedDay === idx ? 'text-slate-950 font-black' : 'text-slate-500'
                    }`}
                  >
                    {item.day}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold">Peak Day: Thursday (3 Mandaps, 2 Galas)</span>
              <span className="font-bold text-[#831843]">South Zone</span>
            </div>
          </div>

          {/* Card 3: Cold Storage & Crew Capacity (Dual Ring Meters) */}
          <div className="glass-subcard p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
                  Storage & Crew Deployment
                </span>
                <div className="text-base font-black text-slate-950 mt-0.5">
                  Cold Room & Crew Bandwidth
                </div>
              </div>
              <Activity className="w-4 h-4 text-slate-700" />
            </div>

            {/* Dual Circular Progress Indicators */}
            <div className="my-3 flex items-center justify-around">
              {/* Gauge 1: Cold Storage 85% */}
              <div className="flex flex-col items-center">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-slate-950"
                      strokeDasharray="85, 100"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-xs font-black text-slate-950">85%</span>
                </div>
                <span className="text-[10px] font-bold text-slate-600 mt-1">Cold Storage</span>
              </div>

              {/* Gauge 2: Crew Deployed 92% */}
              <div className="flex flex-col items-center">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#831843]"
                      strokeDasharray="92, 100"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-xs font-black text-[#831843]">92%</span>
                </div>
                <span className="text-[10px] font-bold text-slate-600 mt-1">Crew Deployed</span>
              </div>
            </div>

            {/* 2 Progress Bars */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200/60 text-[10px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-semibold">KR Market Batch Procurement</span>
                <span className="font-bold text-slate-950">95%</span>
              </div>
              <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                <div className="bg-slate-900 h-full rounded-full w-[95%]" />
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <span className="text-slate-600 font-semibold">Truss & Scaffolding Ingress Pass</span>
                <span className="font-bold text-[#831843]">100%</span>
              </div>
              <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#831843] h-full rounded-full w-[100%]" />
              </div>
            </div>
          </div>

          {/* Card 4: Daily Run-Sheet & Ingress Tracker */}
          <div className="space-y-3 flex flex-col justify-between">
            {/* Top 3 Round Badges */}
            <div className="glass-subcard p-3.5 rounded-2xl flex items-center justify-around">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-slate-950 text-white flex items-center justify-center text-xs font-black shadow-md">
                  3.8T
                </div>
                <span className="text-[9px] font-bold text-slate-600 mt-1">Daily Blooms</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-slate-950 text-white flex items-center justify-center text-xs font-black shadow-md">
                  100%
                </div>
                <span className="text-[9px] font-bold text-slate-600 mt-1">Ingress Pass</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-[#831843] text-white flex items-center justify-center text-xs font-black shadow-md">
                  4h
                </div>
                <span className="text-[9px] font-bold text-slate-600 mt-1">To Muhurtham</span>
              </div>
            </div>

            {/* Dark Milestones Card */}
            <div className="glass-dark-card p-4 rounded-2xl space-y-2 flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-white/10">
                <span className="font-bold text-white text-[11px]">Upcoming Staging Setup</span>
                <span className="text-[10px] text-rose-300 font-bold">The Tamarind Tree</span>
              </div>

              <div className="space-y-1.5 text-[10px]">
                <div className="flex justify-between text-slate-300">
                  <span>KR Market Floral Loading & Cold Van</span>
                  <span className="font-bold text-white">100%</span>
                </div>
                <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full w-[100%]" />
                </div>

                <div className="flex justify-between text-slate-300 pt-0.5">
                  <span>Mandap Truss & Scaffolding Ingress</span>
                  <span className="font-bold text-white">75%</span>
                </div>
                <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
                  <div className="bg-rose-300 h-full rounded-full w-[75%]" />
                </div>

                <div className="flex justify-between text-slate-300 pt-0.5">
                  <span>Fresh Jasmine & Rose Garland Weaving</span>
                  <span className="font-bold text-white">45%</span>
                </div>
                <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
                  <div className="bg-white h-full rounded-full w-[45%]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: Revenue Pipeline Velocity + Venue Staging Run-Sheet */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          
          {/* Revenue Pipeline Spline Chart (Dark Frosted, 4 cols) */}
          <div className="lg:col-span-4 glass-dark-card p-6 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold tracking-widest uppercase text-[#fb7185]">
                    REVENUE & BOOKINGS
                  </span>
                  <h4 className="text-2xl font-black text-white mt-1 tracking-tight">
                    Quotation Pipeline
                  </h4>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-rose-300 shadow-inner">
                  <TrendingUp className="w-5 h-5 text-rose-300" />
                </div>
              </div>

              {/* Monthly Stats / Status Pills */}
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-emerald-950/70 text-emerald-300 text-xs font-black border border-emerald-500/40 shadow-xs">
                  ₹28.5L Confirmed
                </span>
                <span className="px-3 py-1 rounded-full bg-purple-950/70 text-purple-300 text-xs font-black border border-purple-500/40 shadow-xs">
                  ₹46.0L In Proposals
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-950/70 text-blue-300 text-xs font-black border border-blue-500/40 shadow-xs">
                  94% Advance Recd
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-950/70 text-amber-300 text-xs font-black border border-amber-500/40 shadow-xs">
                  {leads.filter(l => l.status === 'NEW').length || 12} Open Enquiries
                </span>
              </div>
            </div>

            {/* Glowing Spline SVG Line Chart */}
            <div className="my-5 relative h-28 w-full flex items-center">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="splineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#961b45" stopOpacity="0.85" />
                    <stop offset="60%" stopColor="#751437" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#1e293b" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Area under curve */}
                <path
                  d="M 0 85 Q 50 20, 100 60 T 200 25 T 300 50 L 300 100 L 0 100 Z"
                  fill="url(#splineGradient)"
                />
                {/* Main spline line */}
                <path
                  d="M 0 85 Q 50 20, 100 60 T 200 25 T 300 50"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {/* Data Points */}
                <circle cx="0" cy="85" r="4" fill="#fb7185" stroke="#fff" strokeWidth="2" />
                <circle cx="85" cy="45" r="4" fill="#fb7185" stroke="#fff" strokeWidth="2" />
                <circle cx="170" cy="38" r="4" fill="#fb7185" stroke="#fff" strokeWidth="2" />
                <circle cx="250" cy="28" r="5" fill="#ffffff" stroke="#fb7185" strokeWidth="2.5" />
                <circle cx="300" cy="50" r="4" fill="#fb7185" stroke="#fff" strokeWidth="2" />
              </svg>
            </div>

            <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs text-slate-300">
              <span className="font-medium">Forecast Peak Season (Q3/Q4): 18 Luxury Bookings</span>
              <span className="font-extrabold text-rose-300 text-sm">₹74.5L Pipeline</span>
            </div>
          </div>

          {/* Venue Staging & Loading Schedule (Frosted Light, 8 cols) */}
          <div className="lg:col-span-8 glass-subcard p-5 flex flex-col justify-between">
            <div>
              {/* Calendar Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/70">
                <div className="flex items-center gap-2 flex-wrap">
                  <Calendar className="w-4 h-4 text-[#831843] shrink-0" />
                  <h4 className="text-sm sm:text-base font-black text-slate-950">
                    Venue Staging & Loading Schedule
                  </h4>
                  <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                    Live Production
                  </span>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-1">
                  <button className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-600 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] sm:text-xs font-bold text-slate-700 px-1">Bangalore Central & South</span>
                  <button className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-600 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day Columns Header */}
              <div className="overflow-x-auto no-scrollbar">
                <div className="min-w-[340px] grid grid-cols-7 gap-1 py-2 text-center text-[10px] sm:text-[11px] font-bold text-slate-500 border-b border-slate-200/50">
                  <span>Mon 19</span>
                  <span>Tue 20</span>
                  <span>Wed 21</span>
                  <span className="text-slate-950 font-black">Thu 22</span>
                  <span>Fri 23</span>
                  <span className="text-[#831843] font-black">Sat 24</span>
                  <span>Sun 25</span>
                </div>
              </div>
            </div>

            {/* Time slot schedule rows (Actionable South India wedding decor run-sheet) */}
            <div className="my-3 space-y-2">
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-950 text-white shadow-md">
                <span className="text-xs font-mono font-bold text-rose-300 w-16 shrink-0">
                  04:00 AM
                </span>
                <div className="w-1.5 h-6 rounded-full bg-rose-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">KR Market Flower Van Ingress (Loading Bay 2)</p>
                  <p className="text-[10px] text-slate-400 truncate">4,200 kg Tuberoses, Jasmine & Imported Dutch Roses • Quality Checked</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold shrink-0">
                  Dispatched
                </span>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-900/90 text-white shadow-sm">
                <span className="text-xs font-mono font-bold text-amber-300 w-16 shrink-0">
                  06:30 AM
                </span>
                <div className="w-1.5 h-6 rounded-full bg-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">Mandap Truss & Scaffolding Ingress</p>
                  <p className="text-[10px] text-slate-400 truncate">The Tamarind Tree, Kanakapura Road · 14 Structural Riggers</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 font-bold shrink-0">
                  Active On-Site
                </span>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-800/80 text-white shadow-sm">
                <span className="text-xs font-mono font-bold text-blue-300 w-16 shrink-0">
                  11:00 AM
                </span>
                <div className="w-1.5 h-6 rounded-full bg-blue-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">Stage Lighting & Floral Chandelier Rigging Briefing</p>
                  <p className="text-[10px] text-slate-400 truncate">The Leela Palace Bengaluru, Grand Ballroom · 15 kW Power DB Passed</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 font-bold shrink-0">
                  In Progress
                </span>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-950 text-white shadow-md">
                <span className="text-xs font-mono font-bold text-emerald-300 w-16 shrink-0">
                  03:30 PM
                </span>
                <div className="w-1.5 h-6 rounded-full bg-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">Final Muhurtham Walkthrough & Misting Inspection</p>
                  <p className="text-[10px] text-slate-400 truncate">Taj West End Heritage Lawn · Wedding & Reception Stage Ready</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold shrink-0">
                  Confirmed
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">4 Critical Setup Milestones Scheduled Today</span>
              <button
                onClick={() => onNavigateTab('CALENDAR')}
                className="text-xs font-bold text-[#831843] hover:underline flex items-center gap-1"
              >
                <span>Full Calendar Run-sheet</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ROW 3: Logistics Flow Mountain Chart + Venue Compliance Gauges + South India Luxury Venues Map */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-4 sm:gap-5">
          
          {/* Mountain / Area Chart: Floral Procurement vs Venue Setup (5 cols) */}
          <div className="lg:col-span-5 glass-subcard p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
                  Daily Floral Logistics & Misting Flow
                </span>
                <h4 className="text-base font-black text-slate-950 mt-0.5">
                  KR Market Ingress vs Staging
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-lg">
                24h Window
              </span>
            </div>

            {/* Mountain Layered SVG Chart */}
            <div className="my-3 h-28 w-full relative flex items-end">
              <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                {/* Bottom Mountain Layer */}
                <path
                  d="M 0 100 L 0 60 L 50 30 L 100 70 L 160 20 L 220 50 L 300 10 L 300 100 Z"
                  fill="rgba(15, 23, 42, 0.85)"
                />
                {/* Middle Mountain Layer */}
                <path
                  d="M 0 100 L 0 75 L 60 50 L 120 80 L 180 40 L 240 65 L 300 35 L 300 100 Z"
                  fill="rgba(131, 24, 67, 0.45)"
                />
                {/* Highlight Peak Dots */}
                <circle cx="160" cy="20" r="3" fill="#ffffff" />
                <circle cx="300" cy="10" r="3" fill="#ffffff" />
              </svg>
            </div>

            {/* Time labels below */}
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-200/60">
              <span>04:00 (KR Mkt)</span>
              <span>08:00 (Cold Rm)</span>
              <span>12:00 (Truss)</span>
              <span>16:00 (Flora)</span>
              <span>20:00 (Handover)</span>
            </div>
          </div>

          {/* Dual Efficiency Gauges (3 cols) */}
          <div className="lg:col-span-3 glass-subcard p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
                  Venue Compliance & Timing
                </span>
                <h4 className="text-base font-black text-slate-950 mt-0.5">
                  Muhurtham SLA
                </h4>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>

            {/* Two Circular Meters */}
            <div className="my-2 flex items-center justify-around">
              <div className="flex flex-col items-center">
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-slate-950"
                      strokeDasharray="0, 100"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-xs font-black text-slate-950">0%</span>
                </div>
                <span className="text-[9px] font-bold text-slate-600 mt-1">Ingress Delays</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-emerald-700"
                      strokeDasharray="99.2, 100"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-xs font-black text-emerald-800">99.2%</span>
                </div>
                <span className="text-[9px] font-bold text-slate-600 mt-1">On-Time Muhurtham</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 text-center">
              <span className="text-[11px] font-bold text-slate-800">
                100% Ingress Pass & Fire Safety Cleared
              </span>
            </div>
          </div>

          {/* Bangalore Luxury Venues Map (4 cols) */}
          <div className="lg:col-span-4 glass-subcard p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
                  Regional Production Hub
                </span>
                <h4 className="text-base font-black text-slate-950 mt-0.5">
                  South India Luxury Venues
                </h4>
              </div>
              <span className="text-xs font-bold text-[#831843] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                54 Partner Venues
              </span>
            </div>

            {/* Minimalist Regional Map Visual */}
            <div className="my-3 h-28 w-full bg-slate-950 rounded-2xl p-2.5 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />
              
              {/* Radar Circles */}
              <div className="absolute w-24 h-24 rounded-full border border-white/20" />
              <div className="absolute w-16 h-16 rounded-full border border-white/30" />

              {/* Pin Locations */}
              <div className="absolute top-4 left-8 flex items-center gap-1 group">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-ping" />
                <span className="w-2 h-2 rounded-full bg-rose-500 ring-1 ring-white absolute" />
                <span className="text-[8px] font-bold text-white bg-slate-900/80 px-1 rounded ml-3">
                  Palace Grounds
                </span>
              </div>

              <div className="absolute bottom-5 left-14 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 ring-1 ring-white" />
                <span className="text-[8px] font-bold text-white bg-slate-900/80 px-1 rounded ml-3">
                  The Leela Palace
                </span>
              </div>

              <div className="absolute top-7 right-6 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-white" />
                <span className="text-[8px] font-bold text-white bg-slate-900/80 px-1 rounded ml-3">
                  Taj West End
                </span>
              </div>

              <div className="absolute bottom-3 right-10 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-400 ring-1 ring-white" />
                <span className="text-[8px] font-bold text-white bg-slate-900/80 px-1 rounded ml-3">
                  The Tamarind Tree
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
              <span>Palace Grounds · Central · Kanakapura</span>
              <span className="font-bold text-slate-950">Active Cold Vans: 4</span>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* ROW 4: INTERACTIVE DATA WORKSPACE STREAM                      */}
        {/* ------------------------------------------------------------- */}
        <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-5 shadow-lg">
          {/* Workspace Segmented Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/60">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              <button
                onClick={() => setActiveStreamTab('LEADS')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeStreamTab === 'LEADS'
                    ? 'glass-btn-primary text-white shadow-md'
                    : 'glass-btn-secondary text-slate-700 hover:text-slate-950'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Inbound Leads ({leads.length})</span>
              </button>

              <button
                onClick={() => setActiveStreamTab('PROJECTS')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeStreamTab === 'PROJECTS'
                    ? 'glass-btn-primary text-white shadow-md'
                    : 'glass-btn-secondary text-slate-700 hover:text-slate-950'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Active Staging Projects ({activeProjects.length})</span>
              </button>

              <button
                onClick={() => setActiveStreamTab('SCHEDULE')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeStreamTab === 'SCHEDULE'
                    ? 'glass-btn-primary text-white shadow-md'
                    : 'glass-btn-secondary text-slate-700 hover:text-slate-950'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Event Schedule ({projects.length})</span>
              </button>

              <button
                onClick={() => setActiveStreamTab('FINANCE')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeStreamTab === 'FINANCE'
                    ? 'glass-btn-primary text-white shadow-md'
                    : 'glass-btn-secondary text-slate-700 hover:text-slate-950'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Invoices & Billing ({invoices.length})</span>
              </button>
            </div>

            <button
              onClick={() =>
                onNavigateTab(
                  activeStreamTab === 'LEADS'
                    ? 'LEADS'
                    : activeStreamTab === 'PROJECTS'
                    ? 'PROJECTS'
                    : activeStreamTab === 'SCHEDULE'
                    ? 'CALENDAR'
                    : 'FINANCE'
                )
              }
              className="text-xs font-bold text-[#831843] hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>Open Dedicated View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 1. INBOUND LEADS STREAM */}
          {activeStreamTab === 'LEADS' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Filter Source:</span>
                <button
                  onClick={() => setLeadSourceFilter('ALL')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    leadSourceFilter === 'ALL'
                      ? 'glass-btn-primary text-white'
                      : 'glass-btn-secondary text-slate-700 hover:text-slate-900'
                  }`}
                >
                  All ({leads.length})
                </button>
                <button
                  onClick={() => setLeadSourceFilter('WEBSITE')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    leadSourceFilter === 'WEBSITE'
                      ? 'glass-btn-primary text-white'
                      : 'glass-btn-secondary text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  Website ({websiteLeads.length})
                </button>
                <button
                  onClick={() => setLeadSourceFilter('NEW')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    leadSourceFilter === 'NEW'
                      ? 'glass-btn-primary text-white'
                      : 'glass-btn-secondary text-slate-700 hover:text-slate-900'
                  }`}
                >
                  New ({leads.filter((l) => l.status === 'NEW').length})
                </button>
              </div>

              <div className="divide-y divide-white/60 rounded-2xl overflow-hidden glass-card shadow-sm">
                {filteredLeads.length > 0 ? (
                  filteredLeads.slice(0, 8).map((lead) => (
                    <div
                      key={lead.id}
                      className="p-4 hover:bg-white/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-rose-50/90 border border-rose-200/80 text-[#831843] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {lead.customerName?.charAt(0) || 'L'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <CustomerHoverDropdown
                              customer={{
                                name: lead.customerName,
                                phone: lead.phone,
                                email: lead.email,
                                location: lead.location,
                                totalSpend: lead.budget ? Number(lead.budget) : undefined,
                                notes: lead.notes,
                              }}
                            />
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
                                lead.status === 'NEW'
                                  ? 'bg-rose-100/90 text-[#831843] border border-rose-200/80'
                                  : lead.status === 'PROPOSAL_SENT'
                                  ? 'bg-blue-100/90 text-blue-800 border border-blue-200/80'
                                  : 'glass-subtle text-slate-700'
                              }`}
                            >
                              {lead.status.replace('_', ' ')}
                            </span>
                            {lead.source === 'WEBSITE' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50/90 text-purple-700 border border-purple-200/80 shadow-xs">
                                Website
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                            <span>{lead.eventType || 'Event'}</span>
                            <span>•</span>
                            <span>Date: {formatDate(lead.eventDate)}</span>
                            <span>•</span>
                            <span className="text-slate-700 font-semibold">{lead.location}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right">
                          <div className="text-xs font-black text-slate-900">
                            {lead.budget ? formatINR(lead.budget) : 'Custom'}
                          </div>
                          <div className="text-[10px] text-slate-400">Budget Est.</div>
                        </div>

                        <button
                          onClick={() => onSelectLead(lead.id)}
                          className="px-3.5 py-1.5 rounded-xl glass-btn-secondary text-slate-700 text-xs font-bold hover:text-[#831843] transition-all cursor-pointer shadow-xs"
                        >
                          Inspect
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs font-medium">
                    No inquiries found in this view.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. ACTIVE PROJECTS STREAM */}
          {activeStreamTab === 'PROJECTS' && (
            <div className="divide-y divide-white/60 rounded-2xl overflow-hidden glass-card shadow-sm">
              {activeProjects.length > 0 ? (
                activeProjects.map((p) => {
                  const completedCount =
                    p.milestones?.filter((m) => m.status === 'COMPLETED').length || 0;
                  const totalCount = p.milestones?.length || 0;
                  return (
                    <div
                      key={p.id}
                      className="p-4 hover:bg-white/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-950 text-sm">{p.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
                              p.status === 'EVENT_DAY'
                                ? 'bg-rose-100/90 text-[#831843] border border-rose-200/80'
                                : 'bg-emerald-100/90 text-emerald-800 border border-emerald-200/80'
                            }`}
                          >
                            {p.status.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-500">
                            {completedCount}/{totalCount} Milestones Achieved
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                          <CustomerHoverDropdown
                            customer={{
                              name: p.customerName,
                              phone: p.customerPhone || '',
                              location: p.venue,
                              totalSpend: p.contractValue,
                            }}
                          />
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#831843]" />
                            {p.venue || 'Bangalore'}
                          </span>
                          <span>•</span>
                          <span>Event: {formatDate(p.eventDate)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right">
                          <div className="text-sm font-black text-slate-950">
                            {formatINR(p.contractValue)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Staff: {p.assignedStaff?.split(' ')[0] || 'Unassigned'}
                          </div>
                        </div>

                        <button
                          onClick={() => onSelectProject(p.id)}
                          className="px-3.5 py-1.5 rounded-xl glass-btn-secondary text-slate-700 text-xs font-bold hover:text-[#831843] transition-all cursor-pointer shadow-xs"
                        >
                          Run-sheet & Milestones
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                  No active projects currently in staging.
                </div>
              )}
            </div>
          )}

          {/* 3. UPCOMING SCHEDULE */}
          {activeStreamTab === 'SCHEDULE' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {projects.slice(0, 6).map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => onSelectProject(proj.id)}
                  className="p-4 rounded-2xl glass-card hover:border-[#831843]/50 transition-all cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#831843]">
                      {formatDate(proj.eventDate)}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full glass-subtle text-slate-700">
                      {proj.eventType || 'Floral Decor'}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{proj.name}</h4>
                  <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
                    <CustomerHoverDropdown
                      customer={{
                        name: proj.customerName,
                        phone: proj.customerPhone || '',
                        location: proj.venue,
                      }}
                    />
                    <span className="font-bold text-slate-900">
                      {formatINR(proj.contractValue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 4. RECENT GST INVOICES */}
          {activeStreamTab === 'FINANCE' && (
            <div className="divide-y divide-white/60 rounded-2xl overflow-hidden glass-card shadow-sm">
              {invoices.length > 0 ? (
                invoices.slice(0, 6).map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 hover:bg-white/40 flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-mono font-bold text-[#831843]">{inv.invoiceNumber}</div>
                      <CustomerHoverDropdown
                        customer={{
                          name: inv.customerName,
                          phone: inv.customerPhone || '',
                          location: inv.billingAddress,
                          totalSpend: inv.total,
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-slate-950 text-sm">
                        {formatINR(inv.total)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100/90 text-emerald-800 border border-emerald-200/80'
                            : 'bg-rose-100/90 text-[#831843] border border-rose-200/80'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                  No invoices found.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
