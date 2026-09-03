import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  MapPin,
  Clock,
  Briefcase,
  Users,
  Plus,
  ExternalLink,
  Download,
  Share2,
  CheckCircle2,
  Sparkles,
  CalendarCheck,
  Flower2,
  X,
} from 'lucide-react';
import { Project, Lead, DateConflict } from '../types';
import { formatDate, formatINR } from '../lib/formatters';
import { createGoogleCalendarUrl, generateICS, downloadICSFile } from '../utils/calendarSync';

interface CalendarViewProps {
  projects?: Project[];
  leads?: Lead[];
  conflicts?: DateConflict[];
  onSelectProject?: (id: string) => void;
  onSelectLead?: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  projects = [],
  leads = [],
  conflicts = [],
  onSelectProject = (_id: string) => {},
  onSelectLead = (_id: string) => {},
}) => {
  // Current calendar month view state
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1)); // August 2026
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-08-15');
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState<string | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Calendar matrix calculation
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: { dayNumber: number; dateString: string }[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(i).padStart(2, '0');
    days.push({
      dayNumber: i,
      dateString: `${year}-${formattedMonth}-${formattedDay}`,
    });
  }

  // Find events on selected dates
  const getEventsForDate = (dateStr: string) => {
    const matchedProjects = projects.filter((p) => p.eventDate === dateStr);
    const matchedLeads = leads.filter((l) => l.eventDate === dateStr || l.nextFollowUpDate === dateStr);
    return { projects: matchedProjects, leads: matchedLeads };
  };

  // Direct sync a project to Google Calendar
  const handleSyncProjectToGoogleCalendar = (p: Project) => {
    const url = createGoogleCalendarUrl({
      title: `Z S EVENTS: ${p.name} - ${p.customerName}`,
      startDate: p.eventDate,
      location: `${p.venue}, Bangalore`,
      description: `Z S EVENTS Event Production\nClient: ${p.customerName} (${p.phone})\nEvent Type: ${p.eventType}\nProject Value: ₹${(p.projectValue || 0).toLocaleString('en-IN')}\nVenue: ${p.venue}\nStatus: ${p.status}\n\nMilestones:\n${(p.milestones || []).map((m) => `• ${m.name} (${m.status})`).join('\n')}`,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast(`Opened Google Calendar for "${p.name}"`);
  };

  // Direct sync a lead follow-up to Google Calendar
  const handleSyncLeadToGoogleCalendar = (l: Lead) => {
    const targetDate = l.nextFollowUpDate || l.eventDate || new Date().toISOString().split('T')[0];
    const url = createGoogleCalendarUrl({
      title: `Client Consultation: ${l.customerName} (${l.eventType})`,
      startDate: targetDate,
      location: l.location || 'Indiranagar, Bangalore',
      description: `Lead Consultation for Z S EVENTS\nClient: ${l.customerName}\nPhone: ${l.phone}\nBudget: ₹${l.budget.toLocaleString('en-IN')}\nEvent Date: ${l.eventDate || 'TBD'}\nVenue Preference: ${l.location || 'Bangalore'}`,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast(`Opened Google Calendar for "${l.customerName}"`);
  };

  // Export all projects to .ics
  const handleExportAllToICS = () => {
    const eventItems = projects.map((p) => ({
      id: p.id,
      title: `Z S EVENTS: ${p.name} (${p.customerName})`,
      startDate: p.eventDate,
      location: `${p.venue}, Bangalore`,
      description: `Client: ${p.customerName} (${p.phone})\nEvent Type: ${p.eventType}\nVenue: ${p.venue}\nProject Value: ₹${p.projectValue.toLocaleString('en-IN')}\nStatus: ${p.status}`,
    }));

    const icsContent = generateICS(eventItems);
    downloadICSFile(`ZS_EVENTS_Production_Schedule_${year}_${month + 1}.ics`, icsContent);
    showToast('Downloaded schedule file (.ics) for Google Calendar import');
  };

  const showToast = (msg: string) => {
    setSyncSuccessToast(msg);
    setTimeout(() => setSyncSuccessToast(null), 4000);
  };

  const selectedDayEvents = getEventsForDate(selectedDateStr);

  return (
    <div className="space-y-8 pb-16 text-slate-900 selection:bg-rose-200">
      {/* Toast Notification */}
      {syncSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-emerald-300 shadow-2xl border border-emerald-500/40 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{syncSuccessToast}</span>
        </div>
      )}

      {/* 1. TOP SUSPENDED CAPSULE HEADER */}
      <div className="flex flex-col items-center justify-center pt-2">
        <div className="suspended-cable flex flex-col items-center">
          <div className="glass-header-pill px-8 py-2.5 flex items-center gap-3 shadow-xl hover:scale-102 transition-all">
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              Schedule & Calendar
            </h1>
            <span className="w-2 h-2 rounded-full bg-[#831843] animate-pulse" />
          </div>
        </div>
      </div>

      {/* 2. MASTER FLOATING GLASS SCREEN CONTAINER */}
      <div className="glass-screen p-5 sm:p-7 md:p-8 space-y-6">
        {/* Header with Calendar Sync Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-slate-950 tracking-tight">
                Event Calendar & Schedule
              </h2>
              <span className="text-xs px-3 py-1 rounded-full glass-subtle text-[#831843] border border-rose-200/80 font-bold shadow-xs">
                {monthNames[month]} {year}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1">
              Bangalore event deliveries, venue setups, customer consultations, and date conflict warnings.
            </p>
          </div>

          {/* Sync Controls & Month Navigation */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              id="btn-sync-google-calendar"
              onClick={() => setShowSyncModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass-btn-primary text-white text-xs font-bold shadow-md shadow-[#831843]/20 transition-all cursor-pointer hover:scale-102"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Sync to Google Calendar</span>
            </button>

            <button
              type="button"
              onClick={handleExportAllToICS}
              title="Download iCalendar (.ics) to import into Google / Apple / Outlook Calendar"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl glass-card hover:bg-white text-slate-900 text-xs font-bold transition-all shadow-xs cursor-pointer hover:scale-102"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden md:inline">Export .ics</span>
            </button>

            <div className="flex items-center gap-1 glass-card p-1 rounded-xl shadow-xs">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-white text-slate-800 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-950 px-2">
                {monthNames[month].slice(0, 3)} {year}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-white text-slate-800 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      {/* Main Grid: Calendar View + Selected Date Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Interactive Calendar Matrix */}
        <div className="lg:col-span-2 rounded-3xl glass-card border border-white/80 overflow-hidden shadow-xl">
          {/* Days of week header */}
          <div className="grid grid-cols-7 text-center font-bold text-[10px] uppercase tracking-wider text-slate-600 bg-white/40 py-3 border-b border-white/60">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-white/40 bg-transparent min-h-[480px]">
            {/* Leading empty cells */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="p-2 bg-white/10" />
            ))}

            {/* Days */}
            {days.map(({ dayNumber, dateString }) => {
              const { projects: dayProjects, leads: dayLeads } = getEventsForDate(dateString);
              const hasConflict = dayProjects.length > 1;
              const isSelected = selectedDateStr === dateString;

              return (
                <div
                  key={dateString}
                  onClick={() => setSelectedDateStr(dateString)}
                  className={`p-2 transition-all flex flex-col justify-between min-h-[85px] cursor-pointer ${
                    isSelected
                      ? 'bg-rose-500/20 ring-2 ring-inset ring-[#831843]'
                      : hasConflict
                      ? 'bg-amber-500/15 hover:bg-amber-500/25'
                      : 'hover:bg-white/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#831843] text-white shadow-xs'
                          : dayProjects.length > 0
                          ? 'bg-emerald-500/20 text-emerald-950 font-black border border-emerald-500/30'
                          : 'text-slate-800'
                      }`}
                    >
                      {dayNumber}
                    </span>

                    {hasConflict && (
                      <span
                        title="Date Conflict: Multiple active projects scheduled on this day!"
                        className="px-1.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-950 text-[9px] font-bold flex items-center gap-0.5"
                      >
                        <AlertTriangle className="w-2.5 h-2.5 text-amber-700" />
                        <span>{dayProjects.length}</span>
                      </span>
                    )}
                  </div>

                  {/* Event badges */}
                  <div className="mt-1 space-y-1">
                    {dayProjects.map((p) => (
                      <div
                        key={p.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDateStr(dateString);
                          onSelectProject(p.id);
                        }}
                        className="p-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-950 text-[10px] font-bold truncate transition-colors border border-emerald-500/30 flex items-center justify-between group backdrop-blur-xs"
                        title={`${p.name} at ${p.venue}`}
                      >
                        <span className="truncate">{p.customerName}</span>
                      </div>
                    ))}

                    {dayLeads.map((l) => (
                      <div
                        key={l.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDateStr(dateString);
                          onSelectLead(l.id);
                        }}
                        className="p-1 rounded-md bg-rose-500/15 hover:bg-rose-500/25 text-[#831843] text-[10px] font-bold truncate transition-colors border border-rose-500/20 backdrop-blur-xs"
                        title={`Inquiry: ${l.customerName} (${l.eventType})`}
                      >
                        {l.customerName}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Date Inspector */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card border border-white/80 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#831843] block">
                  Day Schedule & Sync
                </span>
                <h3 className="text-base font-black text-slate-950">
                  {formatDate(selectedDateStr)}
                </h3>
              </div>

              <div className="text-right">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/70 text-slate-800 font-bold border border-white/90 shadow-xs">
                  {selectedDayEvents.projects.length + selectedDayEvents.leads.length} Items
                </span>
              </div>
            </div>

            {/* List of projects on this date */}
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {selectedDayEvents.projects.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase text-emerald-900 tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Confirmed Event Staging ({selectedDayEvents.projects.length})</span>
                  </span>

                  {selectedDayEvents.projects.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2 text-xs backdrop-blur-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-extrabold text-slate-950 text-sm">{p.name}</h4>
                          <p className="text-emerald-950 font-bold">{p.customerName} • {p.eventType}</p>
                          <p className="text-slate-600 text-[11px] flex items-center gap-1 mt-0.5 font-medium">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{p.venue}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-emerald-500/20">
                        <span className="font-black text-slate-950">{formatINR(p.projectValue)}</span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSyncProjectToGoogleCalendar(p)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-950 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer border border-emerald-500/30 shadow-xs"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Google Cal</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectProject(p.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-white/70 hover:bg-white text-slate-900 border border-white/90 font-bold text-[11px] transition-all cursor-pointer shadow-xs"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* List of leads / follow-ups on this date */}
              {selectedDayEvents.leads.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>Client Consultations & Follow-Ups</span>
                  </span>

                  {selectedDayEvents.leads.map((l) => (
                    <div
                      key={l.id}
                      className="p-3 rounded-2xl bg-white/50 border border-white/80 space-y-2 text-xs backdrop-blur-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-slate-950">{l.customerName}</h4>
                          <p className="text-[#831843] font-semibold">{l.eventType} ({l.phone})</p>
                          <p className="text-slate-600 text-[11px] font-medium">{l.location || 'Bangalore'}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/80 border border-white text-slate-800 font-bold shadow-xs">
                          {l.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/60">
                        <button
                          type="button"
                          onClick={() => handleSyncLeadToGoogleCalendar(l)}
                          className="px-2.5 py-1.5 rounded-xl bg-white/70 hover:bg-white text-slate-900 font-bold text-[11px] flex items-center gap-1 transition-all border border-white/80 shadow-xs cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Google Cal</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectLead(l.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-white/70 hover:bg-white text-slate-900 border border-white/80 font-bold text-[11px] transition-all shadow-xs cursor-pointer"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedDayEvents.projects.length === 0 && selectedDayEvents.leads.length === 0 && (
                <div className="p-8 text-center rounded-2xl bg-white/40 border border-dashed border-white/80 text-slate-500 space-y-2 backdrop-blur-xs">
                  <CalendarIcon className="w-6 h-6 mx-auto text-slate-400" />
                  <p className="text-xs font-semibold">No events scheduled for {formatDate(selectedDateStr)}</p>
                  <p className="text-[11px] text-slate-500">Select any date with events or click below to sync all events.</p>
                </div>
              )}
            </div>

            {/* Quick sync options */}
            <div className="pt-3 border-t border-white/60 flex items-center justify-between">
              <button
                type="button"
                onClick={handleExportAllToICS}
                className="w-full py-2.5 px-3 rounded-xl bg-white/70 hover:bg-white text-slate-900 font-bold text-xs flex items-center justify-center gap-2 border border-white/90 transition-all shadow-xs backdrop-blur-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#831843]" />
                <span>Export Entire Month (.ics)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* SYNC TO GOOGLE CALENDAR MODAL */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl glass-modal border border-white/80 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 text-slate-900 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[#831843]">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-950 text-base">Sync with Google Calendar</h3>
              </div>
              <button
                onClick={() => setShowSyncModal(false)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white/60 transition-colors cursor-pointer border border-transparent hover:border-white/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-700 font-medium">
              You can sync individual event staging timelines or download the full Z S EVENTS calendar to subscribe in Google Calendar, Apple Calendar, or Outlook on your phone and laptop.
            </p>

            {/* Option 1: 1-Click Sync of Upcoming Confirmed Projects */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#831843] block">
                Option 1: 1-Click Add Specific Event to Google Calendar
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl bg-white/50 border border-white/80 flex items-center justify-between gap-3 text-xs backdrop-blur-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-950">{p.name}</div>
                      <div className="text-[11px] text-slate-600 font-medium">{formatDate(p.eventDate)} • {p.venue}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSyncProjectToGoogleCalendar(p)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#831843] to-[#9f1239] hover:from-[#701a39] hover:to-[#881337] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#831843]/20 border border-white/20 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Add to G-Cal</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Option 2: Download master .ics */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2 text-xs backdrop-blur-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block">
                Option 2: Download & Import All {projects.length} Events (.ics)
              </span>
              <p className="text-slate-700 text-[11px]">
                Download a universal calendar file (.ics) and import it into your Google Calendar (Settings → Import & Export → Import).
              </p>
              <button
                type="button"
                onClick={() => {
                  handleExportAllToICS();
                  setShowSyncModal(false);
                }}
                className="w-full mt-2 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-800" />
                <span>Download Master Event Schedule (.ics)</span>
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/60">
              <button
                type="button"
                onClick={() => setShowSyncModal(false)}
                className="px-4 py-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-white/60 transition-colors font-bold text-xs cursor-pointer border border-transparent hover:border-white/60"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
