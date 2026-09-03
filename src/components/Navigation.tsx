import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  LayoutDashboard,
  Users,
  Briefcase,
  Receipt,
  CalendarDays,
  Globe,
  Settings,
  ShieldCheck,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FileText,
  LogOut,
  X,
  ChevronRight,
} from 'lucide-react';
import { User, Lead, Project, Customer, Quotation, Invoice } from '../types';
import { api } from '../lib/api';
import zsEventsLogo from '../assets/images/zs_events_logo_1788181982999.jpg';

interface NavigationProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onQuickAction: (
    action:
      | 'NEW_LEAD'
      | 'NEW_PROJECT'
      | 'POST_DAILY_UPDATE'
      | 'CREATE_INVOICE'
      | 'CREATE_QUOTATION'
      | 'RECORD_PAYMENT'
  ) => void;
  conflictsCount?: number;
  newLeadsCount?: number;
  currentUser?: User | null;
  onLogout?: () => void;
  onNavigateToItem?: (
    type: 'LEAD' | 'PROJECT' | 'CUSTOMER' | 'QUOTATION' | 'INVOICE',
    id: string
  ) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  onQuickAction,
  conflictsCount = 0,
  newLeadsCount = 0,
  currentUser,
  onLogout,
  onNavigateToItem,
}) => {
  // Mobile sidebar drawer state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Quick Action Dropdown state
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Global search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    leads: Lead[];
    projects: Project[];
    customers: Customer[];
    quotations: Quotation[];
    invoices: Invoice[];
  } | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click or ESC key
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNewDropdown(false);
      }
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSearchResults(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsMobileOpen(false);
        setShowSearchResults(false);
        setShowNewDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Debounced global search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.globalSearch(searchQuery);
        setSearchResults(res);
        setShowSearchResults(true);
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const navItems = [
    {
      id: 'DASHBOARD',
      label: 'Dashboard',
      description: 'Overview & KPIs',
      icon: LayoutDashboard,
    },
    {
      id: 'LEADS',
      label: 'Leads & CRM',
      description: 'Inquiry pipeline & outreach',
      icon: Users,
      badge: newLeadsCount > 0 ? newLeadsCount : undefined,
    },
    {
      id: 'PROJECTS',
      label: 'Projects & Staging',
      description: 'Milestones & execution',
      icon: Briefcase,
    },
    {
      id: 'CUSTOMERS',
      label: 'Customers',
      description: 'Client directory & notes',
      icon: CheckCircle2,
    },
    {
      id: 'FINANCE',
      label: 'Finance & GST',
      description: 'Quotations, invoices & receipts',
      icon: Receipt,
    },
    {
      id: 'CALENDAR',
      label: 'Schedule & Calendar',
      description: 'Bangalore event dates',
      icon: CalendarDays,
      conflict: conflictsCount > 0,
    },
    {
      id: 'WEBSITE_FORM',
      label: 'Website Inquiries',
      description: 'Customer inquiry simulator',
      icon: Globe,
    },
    {
      id: 'SETTINGS',
      label: 'Account & Security',
      description: 'Password reset & security',
      icon: ShieldCheck,
    },
  ];

  const currentNav = navItems.find((n) => n.id === activeTab) || navItems[0];

  const totalResults = searchResults
    ? searchResults.leads.length +
      searchResults.projects.length +
      searchResults.customers.length +
      searchResults.quotations.length +
      searchResults.invoices.length
    : 0;

  const handleSelectNav = (tabId: string) => {
    onSelectTab(tabId);
    setIsMobileOpen(false);
  };

  // The sidebar content rendered in both fixed desktop view and mobile drawer
  const sidebarContent = (
    <div className="flex flex-col h-full glass-nav text-slate-900 select-none">
      {/* 1. Header / Brand Title */}
      <div className="p-4 sm:p-5 border-b border-white/60 flex items-center justify-between">
        <div
          onClick={() => handleSelectNav('DASHBOARD')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-rose-200/90 shadow-md shadow-[#961b45]/20 group-hover:scale-105 transition-all shrink-0 bg-white/90 p-0.5">
            <img
              src={zsEventsLogo}
              alt="ZS Events Logo"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black tracking-tight text-slate-950 text-base leading-none">
                Z S EVENTS
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-rose-100/80 text-[#961b45] border border-rose-200/70 shadow-xs">
                BLR
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Event Management CRM
            </p>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 glass-btn-secondary"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Quick Action + Search Bar Section */}
      <div className="p-3.5 space-y-2.5 border-b border-white/60 bg-white/30 backdrop-blur-md">
        {/* Quick + New Action Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="btn-sidebar-quick-new"
            onClick={() => setShowNewDropdown(!showNewDropdown)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl glass-btn-primary text-white font-bold text-xs shadow-lg shadow-[#961b45]/30 active:scale-98 transition-all cursor-pointer hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Entry</span>
          </button>

          {showNewDropdown && (
            <div className="absolute left-0 right-0 mt-2 rounded-2xl glass-modal py-2 text-xs text-slate-900 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Event Management Actions
              </div>
              <button
                onClick={() => {
                  setShowNewDropdown(false);
                  onQuickAction('NEW_LEAD');
                  setIsMobileOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-rose-50/70 hover:text-[#831843] flex items-center gap-2.5 cursor-pointer font-semibold text-slate-800 transition-colors"
              >
                <Users className="w-4 h-4 text-[#831843]" />
                <span>New Lead Inquiry</span>
              </button>
              <button
                onClick={() => {
                  setShowNewDropdown(false);
                  onQuickAction('CREATE_QUOTATION');
                  setIsMobileOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-rose-50/70 hover:text-[#831843] flex items-center gap-2.5 cursor-pointer font-semibold text-slate-800 transition-colors"
              >
                <FileText className="w-4 h-4 text-[#831843]" />
                <span>New Quotation / Proposal</span>
              </button>
              <button
                onClick={() => {
                  setShowNewDropdown(false);
                  onQuickAction('NEW_PROJECT');
                  setIsMobileOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-rose-50/70 hover:text-[#831843] flex items-center gap-2.5 cursor-pointer font-semibold text-slate-800 transition-colors"
              >
                <Briefcase className="w-4 h-4 text-slate-700" />
                <span>New Event Project & Staging</span>
              </button>
              <div className="my-1 border-t border-white/60" />
              <button
                onClick={() => {
                  setShowNewDropdown(false);
                  onQuickAction('POST_DAILY_UPDATE');
                  setIsMobileOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-rose-50/70 hover:text-[#831843] flex items-center gap-2.5 cursor-pointer font-semibold text-slate-800 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Post Daily Site Staging Log</span>
              </button>
              <button
                onClick={() => {
                  setShowNewDropdown(false);
                  onQuickAction('CREATE_INVOICE');
                  setIsMobileOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-rose-50/70 hover:text-[#831843] flex items-center gap-2.5 cursor-pointer font-semibold text-slate-800 transition-colors"
              >
                <Receipt className="w-4 h-4 text-[#831843]" />
                <span>Create Tax Invoice (GST)</span>
              </button>
              <button
                onClick={() => {
                  setShowNewDropdown(false);
                  onQuickAction('RECORD_PAYMENT');
                  setIsMobileOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-rose-50/70 hover:text-[#831843] flex items-center gap-2.5 cursor-pointer font-semibold text-slate-800 transition-colors"
              >
                <span className="w-4 h-4 font-bold text-emerald-700 text-center inline-block">₹</span>
                <span>Record Payment (UPI/NEFT)</span>
              </button>
            </div>
          )}
        </div>

        {/* Global Search Input with Result Flyout */}
        <div className="relative" ref={searchContainerRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              id="sidebar-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim()) setShowSearchResults(true);
              }}
              placeholder="Search leads, clients, GST..."
              className="w-full pl-8 pr-7 py-2 rounded-xl glass-input text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults(null);
                  setShowSearchResults(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Flyout */}
          {showSearchResults && searchResults && (
            <div className="absolute left-0 right-0 mt-2 rounded-2xl glass-modal shadow-2xl z-50 max-h-80 overflow-y-auto py-2 text-xs divide-y divide-white/60">
              <div className="px-3 py-1.5 flex items-center justify-between text-slate-500 font-semibold bg-white/40 text-[11px]">
                <span>Results ({totalResults})</span>
                {isSearching && (
                  <span className="text-[10px] text-[#831843]">Searching...</span>
                )}
              </div>

              {totalResults === 0 ? (
                <div className="p-4 text-center text-slate-500">
                  <p className="font-semibold">No matches found</p>
                </div>
              ) : (
                <>
                  {searchResults.leads.length > 0 && (
                    <div className="p-1.5">
                      <div className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#831843]">
                        Leads ({searchResults.leads.length})
                      </div>
                      {searchResults.leads.slice(0, 3).map((lead) => (
                        <button
                          key={lead.id}
                          onClick={() => {
                            setShowSearchResults(false);
                            setIsMobileOpen(false);
                            if (onNavigateToItem) onNavigateToItem('LEAD', lead.id);
                            else handleSelectNav('LEADS');
                          }}
                          className="w-full text-left p-1.5 rounded-lg hover:bg-rose-50/70 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <div className="truncate">
                            <p className="font-bold text-slate-900 truncate">{lead.customerName}</p>
                            <p className="text-[10px] text-slate-500 truncate">{lead.eventType} • {lead.location}</p>
                          </div>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100/80 text-[#831843] shrink-0 ml-1 border border-rose-200/60">
                            {lead.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.projects.length > 0 && (
                    <div className="p-1.5">
                      <div className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-700">
                        Projects ({searchResults.projects.length})
                      </div>
                      {searchResults.projects.slice(0, 3).map((prj) => (
                        <button
                          key={prj.id}
                          onClick={() => {
                            setShowSearchResults(false);
                            setIsMobileOpen(false);
                            if (onNavigateToItem) onNavigateToItem('PROJECT', prj.id);
                            else handleSelectNav('PROJECTS');
                          }}
                          className="w-full text-left p-1.5 rounded-lg hover:bg-blue-50/70 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <div className="truncate">
                            <p className="font-bold text-slate-900 truncate">{prj.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{prj.venue}</p>
                          </div>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100/80 text-blue-800 shrink-0 ml-1 border border-blue-200/60">
                            {prj.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.customers.length > 0 && (
                    <div className="p-1.5">
                      <div className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                        Customers ({searchResults.customers.length})
                      </div>
                      {searchResults.customers.slice(0, 3).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setShowSearchResults(false);
                            setIsMobileOpen(false);
                            if (onNavigateToItem) onNavigateToItem('CUSTOMER', c.id);
                            else handleSelectNav('CUSTOMERS');
                          }}
                          className="w-full text-left p-1.5 rounded-lg hover:bg-emerald-50/70 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <div className="truncate">
                            <p className="font-bold text-slate-900 truncate">{c.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{c.phone}</p>
                          </div>
                          <span className="text-[9px] font-bold text-emerald-700 shrink-0 ml-1">
                            {c.totalProjects} Prj
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.invoices.length > 0 && (
                    <div className="p-1.5">
                      <div className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700">
                        Invoices ({searchResults.invoices.length})
                      </div>
                      {searchResults.invoices.slice(0, 3).map((inv) => (
                        <button
                          key={inv.id}
                          onClick={() => {
                            setShowSearchResults(false);
                            setIsMobileOpen(false);
                            if (onNavigateToItem) onNavigateToItem('INVOICE', inv.id);
                            else handleSelectNav('FINANCE');
                          }}
                          className="w-full text-left p-1.5 rounded-lg hover:bg-amber-50/70 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <div className="truncate">
                            <p className="font-bold text-slate-900 truncate">{inv.invoiceNumber}</p>
                            <p className="text-[10px] text-slate-500 truncate">₹{inv.total.toLocaleString('en-IN')}</p>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-1 border ${inv.status === 'PAID' ? 'bg-emerald-100/80 text-emerald-800 border-emerald-200' : 'bg-amber-100/80 text-amber-800 border-amber-200'}`}>
                            {inv.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Primary Vertical Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-1.5">
        <div className="px-3 pt-2 pb-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-500/80">
          MAIN MENU
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-nav-${item.id.toLowerCase()}`}
              onClick={() => handleSelectNav(item.id)}
              className={`w-full px-3.5 py-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer text-left group ${
                isActive
                  ? 'glass-btn-primary text-white font-bold shadow-xl shadow-[#961b45]/35 border border-white/30'
                  : 'text-slate-800 hover:bg-white/60 hover:text-slate-950 font-bold border border-transparent hover:border-white/70'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    isActive
                      ? 'bg-white/20 text-white shadow-inner border border-white/25'
                      : 'bg-white/85 text-slate-700 shadow-xs border border-white/80 group-hover:scale-105'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className={`text-xs leading-tight truncate ${isActive ? 'font-black text-white' : 'font-bold text-slate-900'}`}>
                    {item.label}
                  </div>
                  <div
                    className={`text-[10px] leading-tight truncate mt-0.5 ${
                      isActive ? 'text-rose-100/90 font-medium' : 'text-slate-500 font-medium'
                    }`}
                  >
                    {item.description}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
                      isActive
                        ? 'bg-white text-[#961b45] font-black'
                        : 'bg-rose-100/90 text-[#961b45] border border-rose-200/80'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.conflict && (
                  <span
                    title="Event Schedule Conflict"
                    className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200 shadow-xs"
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 4. Bottom Footer: User Profile & Logout */}
      <div className="p-3.5 border-t border-white/60 bg-white/40 backdrop-blur-md flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2.5 truncate min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#961b45] to-[#751437] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md shadow-[#961b45]/20">
            {currentUser?.name?.charAt(0) || 'S'}
          </div>
          <div className="truncate">
            <div className="font-bold text-slate-950 text-xs leading-tight truncate">
              {currentUser?.name || 'Syed'}
            </div>
            <div className="text-[10.5px] text-slate-500 font-medium truncate mt-0.5">
              {currentUser?.title || 'Lead Event Manager & Producer'}
            </div>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="p-2 rounded-xl text-slate-500 hover:text-[#961b45] glass-btn-secondary transition-colors cursor-pointer shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* 1. DESKTOP PERMANENT FIXED LEFT SIDEBAR (md: and above)        */}
      {/* ------------------------------------------------------------- */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-64 lg:w-72 flex-col">
        {sidebarContent}
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* 2. MOBILE TOP HEADER WITH SEARCH & BRAND (< md)               */}
      {/* ------------------------------------------------------------- */}
      <header className="md:hidden sticky top-0 z-30 w-full h-14 glass-panel px-3 sm:px-4 flex items-center justify-between border-b border-white/60">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="p-2 rounded-xl glass-btn-secondary text-[#831843] cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => handleSelectNav('DASHBOARD')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-rose-200/70 shrink-0 bg-white shadow-xs p-0.5">
              <img
                src={zsEventsLogo}
                alt="ZS Events Logo"
                className="w-full h-full object-cover rounded-md"
              />
            </div>
            <div>
              <span className="font-black text-slate-900 text-sm leading-none block">Z S EVENTS</span>
              <span className="text-[9px] text-slate-500 font-semibold leading-none">{currentNav.label}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowNewDropdown(!showNewDropdown)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl glass-btn-primary text-white text-xs font-bold shadow-md shadow-[#961b45]/30 cursor-pointer min-h-[38px]"
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 3. MOBILE BOTTOM NAVIGATION BAR (< md)                        */}
      {/* ------------------------------------------------------------- */}
      <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 inset-x-0 z-40 glass-nav border-t border-white/70 shadow-2xl backdrop-blur-xl px-2 py-1.5 flex items-center justify-around safe-area-pb">
        {/* Dashboard */}
        <button
          onClick={() => handleSelectNav('DASHBOARD')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[56px] min-h-[48px] transition-all cursor-pointer ${
            activeTab === 'DASHBOARD'
              ? 'text-[#831843] font-black'
              : 'text-slate-600 hover:text-slate-900 font-semibold'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'DASHBOARD' ? 'bg-rose-100/90 text-[#831843]' : ''}`}>
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <span className="text-[9.5px] leading-tight mt-0.5">Overview</span>
        </button>

        {/* Leads CRM */}
        <button
          onClick={() => handleSelectNav('LEADS')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[56px] min-h-[48px] relative transition-all cursor-pointer ${
            activeTab === 'LEADS'
              ? 'text-[#831843] font-black'
              : 'text-slate-600 hover:text-slate-900 font-semibold'
          }`}
        >
          <div className={`p-1 rounded-lg relative ${activeTab === 'LEADS' ? 'bg-rose-100/90 text-[#831843]' : ''}`}>
            <Users className="w-5 h-5" />
            {newLeadsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#831843] text-white text-[9px] font-black flex items-center justify-center">
                {newLeadsCount}
              </span>
            )}
          </div>
          <span className="text-[9.5px] leading-tight mt-0.5">Leads</span>
        </button>

        {/* Floating Quick Action Center (+) Button */}
        <div className="relative -top-3">
          <button
            onClick={() => setShowNewDropdown(!showNewDropdown)}
            className="w-12 h-12 rounded-full glass-btn-primary text-white shadow-xl shadow-[#961b45]/40 border-2 border-white flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
            title="Create New Entry"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Projects & Staging */}
        <button
          onClick={() => handleSelectNav('PROJECTS')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[56px] min-h-[48px] transition-all cursor-pointer ${
            activeTab === 'PROJECTS'
              ? 'text-[#831843] font-black'
              : 'text-slate-600 hover:text-slate-900 font-semibold'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'PROJECTS' ? 'bg-rose-100/90 text-[#831843]' : ''}`}>
            <Briefcase className="w-5 h-5" />
          </div>
          <span className="text-[9.5px] leading-tight mt-0.5">Projects</span>
        </button>

        {/* Schedule & Calendar */}
        <button
          onClick={() => handleSelectNav('CALENDAR')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[56px] min-h-[48px] relative transition-all cursor-pointer ${
            activeTab === 'CALENDAR'
              ? 'text-[#831843] font-black'
              : 'text-slate-600 hover:text-slate-900 font-semibold'
          }`}
        >
          <div className={`p-1 rounded-lg relative ${activeTab === 'CALENDAR' ? 'bg-rose-100/90 text-[#831843]' : ''}`}>
            <CalendarDays className="w-5 h-5" />
            {conflictsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
            )}
          </div>
          <span className="text-[9.5px] leading-tight mt-0.5">Schedule</span>
        </button>

        {/* Menu / More */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[56px] min-h-[48px] text-slate-600 hover:text-slate-900 font-semibold transition-all cursor-pointer"
        >
          <div className="p-1 rounded-lg">
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[9.5px] leading-tight mt-0.5">Menu</span>
        </button>
      </nav>

      {/* ------------------------------------------------------------- */}
      {/* 4. MOBILE QUICK ACTION BOTTOM SHEET OVERLAY (< md)            */}
      {/* ------------------------------------------------------------- */}
      {showNewDropdown && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end animate-in fade-in duration-200">
          <div
            onClick={() => setShowNewDropdown(false)}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity"
          />
          <div className="relative w-full max-w-lg mx-auto glass-modal rounded-t-3xl border-t border-white/80 p-5 shadow-2xl z-10 animate-in slide-in-from-bottom duration-250 pb-8">
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <div>
                <h3 className="text-base font-black text-slate-950">Quick Actions</h3>
                <p className="text-[11px] text-slate-500 font-medium">Create new records and log event operations</p>
              </div>
              <button
                onClick={() => setShowNewDropdown(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 glass-btn-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-4">
              <button
                onClick={() => {
                  setShowNewDropdown(false);
                  onQuickAction('NEW_LEAD');
                  setIsMobileOpen(false);
                }}
                className="p-3.5 rounded-2xl glass-card text-left flex flex-col justify-between hover:border-[#831843]/50 transition-all cursor-pointer shadow-xs active:scale-98"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-100/90 text-[#831843] flex items-center justify-center mb-2">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-950 block">New Lead</span>
                  <span className="text-[10px] text-slate-500 font-medium">Inbound inquiry</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowNewDropdown(false);
                  onQuickAction('CREATE_QUOTATION');
                  setIsMobileOpen(false);
                }}
                className="p-3.5 rounded-2xl glass-card text-left flex flex-col justify-between hover:border-[#831843]/50 transition-all cursor-pointer shadow-xs active:scale-98"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-100/90 text-purple-900 flex items-center justify-center mb-2">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-950 block">New Proposal</span>
                  <span className="text-[10px] text-slate-500 font-medium">Quotation / PDF</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowNewDropdown(false);
                  onQuickAction('NEW_PROJECT');
                  setIsMobileOpen(false);
                }}
                className="p-3.5 rounded-2xl glass-card text-left flex flex-col justify-between hover:border-[#831843]/50 transition-all cursor-pointer shadow-xs active:scale-98"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-100/90 text-blue-900 flex items-center justify-center mb-2">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-950 block">New Project</span>
                  <span className="text-[10px] text-slate-500 font-medium">Staging & venue</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowNewDropdown(false);
                  onQuickAction('POST_DAILY_UPDATE');
                  setIsMobileOpen(false);
                }}
                className="p-3.5 rounded-2xl glass-card text-left flex flex-col justify-between hover:border-[#831843]/50 transition-all cursor-pointer shadow-xs active:scale-98"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-100/90 text-amber-900 flex items-center justify-center mb-2">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-950 block">Daily Site Log</span>
                  <span className="text-[10px] text-slate-500 font-medium">On-site status</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowNewDropdown(false);
                  onQuickAction('CREATE_INVOICE');
                  setIsMobileOpen(false);
                }}
                className="p-3.5 rounded-2xl glass-card text-left flex flex-col justify-between hover:border-[#831843]/50 transition-all cursor-pointer shadow-xs active:scale-98"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-100/90 text-emerald-900 flex items-center justify-center mb-2">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-950 block">GST Invoice</span>
                  <span className="text-[10px] text-slate-500 font-medium">Tax bill & PDF</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowNewDropdown(false);
                  onQuickAction('RECORD_PAYMENT');
                  setIsMobileOpen(false);
                }}
                className="p-3.5 rounded-2xl glass-card text-left flex flex-col justify-between hover:border-[#831843]/50 transition-all cursor-pointer shadow-xs active:scale-98"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-100/90 text-[#831843] flex items-center justify-center mb-2 font-bold text-sm">
                  ₹
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-950 block">Record Payment</span>
                  <span className="text-[10px] text-slate-500 font-medium">UPI / NEFT receipt</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. MOBILE SLIDE-OUT OVERLAY DRAWER (< md)                     */}
      {/* ------------------------------------------------------------- */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex animate-in fade-in duration-200">
          <div
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity"
          />
          <div className="relative w-80 max-w-[85vw] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-250">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
