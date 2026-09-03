import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Briefcase,
  TrendingUp,
  Receipt,
  ExternalLink,
  ChevronDown,
  Sparkles,
  StickyNote,
  Edit3,
  Check,
} from 'lucide-react';
import { formatINR, formatPhoneNumber, cleanPhoneNumber } from '../lib/formatters';

export interface CustomerSummaryData {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  location?: string;
  totalSpend?: number;
  projectsCount?: number;
  notes?: string;
  gstNumber?: string;
  companyName?: string;
}

interface CustomerHoverDropdownProps {
  customer: CustomerSummaryData;
  onViewCustomer?: (id: string) => void;
  onUpdateNotes?: (notes: string) => Promise<void>;
  className?: string;
  badgeOnly?: boolean;
}

export const CustomerHoverDropdown: React.FC<CustomerHoverDropdownProps> = ({
  customer,
  onViewCustomer,
  onUpdateNotes,
  className = '',
  badgeOnly = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState(customer.notes || '');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    setNoteDraft(customer.notes || '');
  }, [customer.notes]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setIsEditingNote(false);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSaveInlineNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateNotes) return;
    setIsSavingNote(true);
    try {
      await onUpdateNotes(noteDraft.trim());
      setIsEditingNote(false);
    } catch (err) {
      console.error('Failed to save note from hover card:', err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const cleanPhone = cleanPhoneNumber(customer.phone);
  const formattedPhone = formatPhoneNumber(customer.phone);

  return (
    <div
      ref={dropdownRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger element */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group inline-flex items-center gap-1.5 text-left font-bold text-slate-900 hover:text-[#831843] transition-colors cursor-pointer"
      >
        <span className="truncate max-w-[170px] sm:max-w-[220px]">
          {customer.name || 'Unnamed Client'}
        </span>
        {customer.notes && (
          <span
            title="Has client notes"
            className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-200 shrink-0"
          />
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-[#831843] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Popover on Hover / Click */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-80 rounded-2xl glass-modal p-4 shadow-2xl border border-white/80 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-900">
          {/* Header Card */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#831843] to-[#9f1239] text-white flex items-center justify-center text-xs font-black shadow-xs shrink-0 border border-white/20">
                {(customer.name || 'C').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-sm text-slate-950 truncate">
                  {customer.name}
                </h4>
                {customer.companyName && (
                  <p className="text-[11px] font-semibold text-[#831843] truncate">
                    {customer.companyName}
                  </p>
                )}
                {customer.location && (
                  <p className="text-[11px] text-slate-600 font-medium flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-[#831843] shrink-0" />
                    <span className="truncate">{customer.location}</span>
                  </p>
                )}
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-[#831843] border border-rose-500/20 shrink-0 backdrop-blur-xs">
              Client
            </span>
          </div>

          {/* Contact Details & Quick Triggers */}
          <div className="py-2.5 space-y-2 text-xs border-b border-white/60">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-slate-700 truncate">
                <Phone className="w-3.5 h-3.5 text-[#831843] shrink-0" />
                <span className="font-bold text-slate-900 truncate">
                  {formattedPhone || 'No phone recorded'}
                </span>
              </div>
              {cleanPhone && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={`https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(
                      customer.name
                    )},%20greeting%20from%20ZS%20Events!`}
                    target="_blank"
                    rel="noreferrer"
                    title="WhatsApp Client"
                    className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 border border-emerald-500/20 transition-colors backdrop-blur-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`tel:${cleanPhone}`}
                    title="Call Client"
                    className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-[#831843] border border-rose-500/20 transition-colors backdrop-blur-xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {customer.email && (
              <div className="flex items-center gap-2 text-slate-700 truncate">
                <Mail className="w-3.5 h-3.5 text-[#831843] shrink-0" />
                <a
                  href={`mailto:${customer.email}`}
                  className="font-medium text-slate-800 hover:text-[#831843] truncate underline"
                >
                  {customer.email}
                </a>
              </div>
            )}
          </div>

          {/* Spend / Project Metrics */}
          {(customer.totalSpend !== undefined || customer.projectsCount !== undefined) && (
            <div className="pt-2.5">
              <div className="grid grid-cols-2 gap-2 bg-white/60 p-2 rounded-xl border border-white/80 text-xs backdrop-blur-xs">
                {customer.totalSpend !== undefined && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Total Value
                    </span>
                    <span className="font-extrabold text-[#831843]">
                      {formatINR(customer.totalSpend)}
                    </span>
                  </div>
                )}
                {customer.projectsCount !== undefined && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Events
                    </span>
                    <span className="font-extrabold text-slate-900">
                      {customer.projectsCount} Project{customer.projectsCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Customer Notes Section (Highlighted Box) */}
          <div className="pt-2.5">
            <div className="text-[11px] text-slate-700 bg-amber-500/10 p-2.5 rounded-xl border border-amber-300/40 space-y-1 backdrop-blur-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-950 flex items-center gap-1.5">
                  <StickyNote className="w-3 h-3 text-amber-700" />
                  <span>Customer Notes & Preferences</span>
                </span>
                {onUpdateNotes && !isEditingNote && (
                  <button
                    type="button"
                    onClick={() => setIsEditingNote(true)}
                    className="text-[10px] font-bold text-amber-800 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Edit3 className="w-2.5 h-2.5" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {isEditingNote ? (
                <form onSubmit={handleSaveInlineNote} className="space-y-2 pt-1">
                  <textarea
                    rows={2}
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Add special floral preferences, VIP status, billing terms..."
                    className="w-full p-2 bg-white/90 backdrop-blur-sm border border-amber-400/80 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-amber-600 shadow-2xs font-medium"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsEditingNote(false)}
                      className="px-2 py-0.5 rounded text-[10px] text-slate-600 hover:bg-amber-100/50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingNote}
                      className="px-2.5 py-0.5 rounded-lg bg-amber-700 text-white font-bold text-[10px] hover:bg-amber-800 disabled:opacity-50 cursor-pointer shadow-2xs"
                    >
                      {isSavingNote ? 'Saving...' : 'Save Note'}
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-slate-800 text-[11px] leading-relaxed whitespace-pre-wrap font-medium">
                  {customer.notes || (
                    <span className="italic text-slate-400">
                      No custom notes logged yet.{' '}
                      {onUpdateNotes && (
                        <button
                          type="button"
                          onClick={() => setIsEditingNote(true)}
                          className="text-amber-800 font-bold not-italic hover:underline cursor-pointer"
                        >
                          + Add note
                        </button>
                      )}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Quick Footer Action */}
          {customer.id && onViewCustomer && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onViewCustomer(customer.id!);
              }}
              className="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#831843] to-[#9f1239] hover:from-[#701a39] hover:to-[#881337] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#831843]/20 border border-white/20 transition-all cursor-pointer"
            >
              <span>View Client Full Profile</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
