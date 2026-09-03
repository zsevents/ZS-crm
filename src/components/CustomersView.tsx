import React, { useState } from 'react';
import {
  Users,
  Search,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Briefcase,
  TrendingUp,
  Receipt,
  Calendar,
  ChevronRight,
  X,
  Plus,
  ArrowRight,
  ExternalLink,
  StickyNote,
  Edit3,
  Trash2,
  Check,
  Save,
  Clock,
  Sparkles,
  List,
  Grid,
  ShieldCheck,
} from 'lucide-react';
import { Customer, Lead, Project, Invoice } from '../types';
import { formatINR, formatDate, formatDateTime, formatPhoneNumber, cleanPhoneNumber } from '../lib/formatters';
import { CustomerHoverDropdown } from './CustomerHoverDropdown';
import { api } from '../lib/api';

interface CustomersViewProps {
  customers?: Customer[];
  leads?: Lead[];
  projects?: Project[];
  invoices?: Invoice[];
  onSelectLead?: (id: string) => void;
  onSelectProject?: (id: string) => void;
  onOpenNewCustomerModal?: () => void;
  onCustomerUpdated?: () => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers = [],
  leads = [],
  projects = [],
  invoices = [],
  onSelectLead = (_id: string) => {},
  onSelectProject = (_id: string) => {},
  onOpenNewCustomerModal = () => {},
  onCustomerUpdated = () => {},
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [viewLayout, setViewLayout] = useState<'table' | 'grid'>('table');

  // Inline Note Editor state (for quick table column editing)
  const [editingNoteCustomerId, setEditingNoteCustomerId] = useState<string | null>(null);
  const [inlineNoteText, setInlineNoteText] = useState('');
  const [isSavingInlineNote, setIsSavingInlineNote] = useState(false);

  // Drawer Note Composer state
  const [drawerNewNote, setDrawerNewNote] = useState('');
  const [isSubmittingDrawerNote, setIsSubmittingDrawerNote] = useState(false);

  // New / Edit Customer Modal
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custLocation, setCustLocation] = useState('');
  const [custCompany, setCustCompany] = useState('');
  const [custGst, setCustGst] = useState('');
  const [custNotes, setCustNotes] = useState('');
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  const filteredCustomers = (customers || []).filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.location || '').toLowerCase().includes(q) ||
      (c.companyName || '').toLowerCase().includes(q) ||
      (c.notes || '').toLowerCase().includes(q) ||
      (c.id || '').toLowerCase().includes(q)
    );
  });

  const selectedCustomer = (customers || []).find((c) => c.id === selectedCustomerId);
  const customerLeads = selectedCustomer
    ? (leads || []).filter((l) => l.customerId === selectedCustomer.id || (selectedCustomer.leadIds || []).includes(l.id))
    : [];
  const customerProjects = selectedCustomer
    ? (projects || []).filter((p) => p.customerId === selectedCustomer.id || (selectedCustomer.projectIds || []).includes(p.id))
    : [];
  const customerInvoices = selectedCustomer
    ? (invoices || []).filter((i) => i.customerId === selectedCustomer.id)
    : [];

  // Quick save inline note from table column
  const handleSaveInlineNote = async (customerId: string) => {
    if (!inlineNoteText.trim()) {
      setEditingNoteCustomerId(null);
      return;
    }
    setIsSavingInlineNote(true);
    try {
      await api.addCustomerNote(customerId, inlineNoteText.trim(), 'Staff');
      setEditingNoteCustomerId(null);
      setInlineNoteText('');
      onCustomerUpdated();
    } catch (err) {
      console.error('Failed to save customer note:', err);
    } finally {
      setIsSavingInlineNote(false);
    }
  };

  // Save note from drawer
  const handleSaveDrawerNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !drawerNewNote.trim()) return;
    setIsSubmittingDrawerNote(true);
    try {
      await api.addCustomerNote(selectedCustomer.id, drawerNewNote.trim(), 'Florist Manager');
      setDrawerNewNote('');
      onCustomerUpdated();
    } catch (err) {
      console.error('Failed to submit drawer note:', err);
    } finally {
      setIsSubmittingDrawerNote(false);
    }
  };

  // Quick note update handler for hover dropdown
  const handleUpdateHoverNote = async (customerId: string, newNote: string) => {
    await api.addCustomerNote(customerId, newNote, 'Quick Edit');
    onCustomerUpdated();
  };

  // Delete Customer
  const handleDeleteCustomer = async (customerId: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete customer "${name}" and their associated history?`)) {
      try {
        await api.deleteCustomer(customerId);
        if (selectedCustomerId === customerId) {
          setSelectedCustomerId(null);
        }
        onCustomerUpdated();
      } catch (err) {
        console.error('Failed to delete customer:', err);
      }
    }
  };

  // Open Create Customer Modal
  const handleOpenCreateModal = () => {
    setEditingCustomer(null);
    setCustName('');
    setCustPhone('');
    setCustEmail('');
    setCustLocation('Bangalore');
    setCustCompany('');
    setCustGst('');
    setCustNotes('');
    setIsNewCustomerModalOpen(true);
  };

  // Open Edit Customer Modal
  const handleOpenEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setCustName(cust.name || '');
    setCustPhone(cust.phone || '');
    setCustEmail(cust.email || '');
    setCustLocation(cust.location || '');
    setCustCompany(cust.companyName || '');
    setCustGst(cust.gstNumber || '');
    setCustNotes(cust.notes || '');
    setIsNewCustomerModalOpen(true);
  };

  // Save New or Edited Customer
  const handleSaveCustomerForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim()) {
      alert('Please provide customer name and phone number.');
      return;
    }
    setIsSavingCustomer(true);
    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, {
          name: custName.trim(),
          phone: custPhone.trim(),
          email: custEmail.trim() || undefined,
          location: custLocation.trim() || 'Bangalore',
          companyName: custCompany.trim() || undefined,
          gstNumber: custGst.trim() || undefined,
          notes: custNotes.trim() || undefined,
        });
      } else {
        await api.createCustomer({
          name: custName.trim(),
          phone: custPhone.trim(),
          email: custEmail.trim() || undefined,
          location: custLocation.trim() || 'Bangalore',
          companyName: custCompany.trim() || undefined,
          gstNumber: custGst.trim() || undefined,
          notes: custNotes.trim() || undefined,
        });
      }
      setIsNewCustomerModalOpen(false);
      onCustomerUpdated();
    } catch (err) {
      console.error('Failed to save customer:', err);
      alert('Failed to save customer record.');
    } finally {
      setIsSavingCustomer(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 text-slate-900 selection:bg-rose-200">
      {/* 1. TOP SUSPENDED CAPSULE HEADER */}
      <div className="flex flex-col items-center justify-center pt-2">
        <div className="suspended-cable flex flex-col items-center">
          <div className="glass-header-pill px-8 py-2.5 flex items-center gap-3 shadow-xl hover:scale-102 transition-all">
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              Client Directory
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
                Customer Directory & Client Profiles
              </h2>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-950 border border-emerald-300/80 font-bold shadow-xs">
                {customers.length} Profiles
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1">
              Track customer floral preferences, saved notes, inquiries, active event projects, and billing records.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass-btn-primary text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#831843]/20 transition-all cursor-pointer w-fit hover:scale-102"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          </div>
        </div>

      {/* Search & View Controls */}
      <div className="p-4 rounded-2xl glass-card border border-white/70 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, notes, phone, Bangalore area, company..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl glass-input border border-white/80 text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-[#831843] font-medium"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-white/50 backdrop-blur-md p-1 rounded-xl border border-white/70 shadow-xs">
              <button
                type="button"
                onClick={() => setViewLayout('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewLayout === 'table' ? 'bg-white text-[#831843] shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Comprehensive Table View with Notes Column"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewLayout === 'grid' ? 'bg-white text-[#831843] shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Card Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE VIEW (Default with dedicated Notes Column & Hover Dropdowns) */}
      {viewLayout === 'table' ? (
        <div className="glass-card border border-white/70 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-white/40 backdrop-blur-md border-b border-white/60 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Client Profile (Hover for Notes)</th>
                  <th className="py-3.5 px-4">Contact Details</th>
                  <th className="py-3.5 px-4">Location / Area</th>
                  <th className="py-3.5 px-4 text-center">Events & Inquiries</th>
                  <th className="py-3.5 px-4 text-right">Lifetime Spend</th>
                  <th className="py-3.5 px-4 min-w-[280px] bg-amber-500/10 text-amber-950 border-x border-amber-500/10">
                    <div className="flex items-center gap-1.5">
                      <StickyNote className="w-3.5 h-3.5 text-amber-700" />
                      <span>Customer Notes & Preferences</span>
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/60 font-medium text-slate-800">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => {
                    const isEditingThisNote = editingNoteCustomerId === customer.id;
                    const cleanPhone = cleanPhoneNumber(customer.phone);

                    return (
                      <tr
                        key={customer.id}
                        className="hover:bg-white/50 transition-colors group cursor-default"
                      >
                        {/* Client Name with Hover Popout */}
                        <td className="py-3.5 px-4">
                          <CustomerHoverDropdown
                            customer={{
                              id: customer.id,
                              name: customer.name,
                              phone: customer.phone,
                              email: customer.email,
                              location: customer.location,
                              totalSpend: customer.totalRevenue,
                              projectsCount: customer.totalProjects,
                              notes: customer.notes,
                              companyName: customer.companyName,
                            }}
                            onViewCustomer={() => setSelectedCustomerId(customer.id)}
                            onUpdateNotes={(note) => handleUpdateHoverNote(customer.id, note)}
                          />
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {customer.id}
                          </div>
                        </td>

                        {/* Contact Details & Quick Call/WhatsApp */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">
                              {formatPhoneNumber(customer.phone)}
                            </span>
                            {cleanPhone && (
                              <div className="flex items-center gap-1">
                                <a
                                  href={`https://wa.me/${cleanPhone}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="WhatsApp"
                                  className="p-1 rounded-md bg-emerald-500/15 text-emerald-800 hover:bg-emerald-500/25 border border-emerald-500/20 backdrop-blur-xs"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                </a>
                                <a
                                  href={`tel:${cleanPhone}`}
                                  title="Call"
                                  className="p-1 rounded-md bg-rose-500/15 text-[#831843] hover:bg-rose-500/25 border border-rose-500/20 backdrop-blur-xs"
                                >
                                  <Phone className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                          </div>
                          {customer.email && (
                            <span className="text-[11px] text-slate-500 block truncate max-w-[150px]">
                              {customer.email}
                            </span>
                          )}
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{customer.location || 'Bangalore'}</span>
                          </div>
                        </td>

                        {/* Events Count */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/70 text-slate-800 border border-white/90 font-bold text-[11px] backdrop-blur-xs shadow-2xs">
                            <Briefcase className="w-3 h-3 text-[#831843]" />
                            <span>{customer.totalProjects} Events</span>
                          </div>
                        </td>

                        {/* Lifetime Spend */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="font-black text-slate-950 text-sm">
                            {formatINR(customer.totalRevenue || 0)}
                          </div>
                          {Number(customer.totalOutstanding || 0) > 0 ? (
                            <div className="text-[10px] text-rose-700 font-bold">
                              Due: {formatINR(customer.totalOutstanding)}
                            </div>
                          ) : (
                            <div className="text-[10px] text-emerald-700 font-bold">
                              Settled ✓
                            </div>
                          )}
                        </td>

                        {/* NOTES COLUMN (Highlighted & Editable) */}
                        <td className="py-3 px-4 bg-amber-500/5 border-x border-amber-500/10">
                          {isEditingThisNote ? (
                            <div className="space-y-1.5">
                              <textarea
                                rows={2}
                                value={inlineNoteText}
                                onChange={(e) => setInlineNoteText(e.target.value)}
                                placeholder="Enter customer notes, floral preferences, or VIP instructions..."
                                className="w-full p-2 text-xs bg-white/90 backdrop-blur-md border border-amber-400/80 rounded-xl text-slate-900 focus:outline-none focus:border-amber-600 shadow-xs"
                                autoFocus
                              />
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingNoteCustomerId(null)}
                                  className="px-2 py-1 text-[10px] text-slate-600 hover:bg-amber-100/50 rounded-lg"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={isSavingInlineNote}
                                  onClick={() => handleSaveInlineNote(customer.id)}
                                  className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white font-bold text-[10px] rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
                                >
                                  <Save className="w-3 h-3" />
                                  <span>{isSavingInlineNote ? 'Saving...' : 'Save'}</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="group/note flex items-start justify-between gap-2">
                              <div
                                onClick={() => {
                                  setEditingNoteCustomerId(customer.id);
                                  setInlineNoteText(customer.notes || '');
                                }}
                                className="flex-1 cursor-pointer"
                                title="Click to edit notes"
                              >
                                {customer.notes ? (
                                  <p className="text-[11px] text-slate-800 line-clamp-2 leading-relaxed bg-white/75 backdrop-blur-xs p-1.5 rounded-lg border border-amber-300/40 hover:border-amber-400 transition-colors shadow-2xs">
                                    {customer.notes}
                                  </p>
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic flex items-center gap-1 hover:text-amber-800">
                                    <Plus className="w-3 h-3" />
                                    <span>Add client notes...</span>
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingNoteCustomerId(customer.id);
                                  setInlineNoteText(customer.notes || '');
                                }}
                                className="p-1 rounded text-slate-400 hover:text-amber-800 hover:bg-amber-100/50 transition-colors"
                                title="Edit Note"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedCustomerId(customer.id)}
                              title="View Full Profile Drawer"
                              className="px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-[#831843] text-slate-700 hover:text-white border border-white/90 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <span>Profile</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(customer)}
                              title="Edit Customer"
                              className="p-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 border border-white/90 transition-colors cursor-pointer shadow-2xs"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                              title="Delete Customer"
                              className="p-1.5 rounded-xl bg-white/80 hover:bg-rose-100 text-slate-500 hover:text-rose-700 border border-white/90 transition-colors cursor-pointer shadow-2xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                      No customer profiles found matching "{searchQuery}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => {
              const isSelected = selectedCustomerId === customer.id;
              return (
                <div
                  key={customer.id}
                  className={`p-5 rounded-2xl transition-all relative glass-card border shadow-xs ${
                    isSelected
                      ? 'border-[#831843] ring-2 ring-[#831843]/20 shadow-md'
                      : 'border-white/70 hover:border-white/90 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#831843] to-[#9f1239] text-white flex items-center justify-center font-bold text-sm shadow-sm border border-white/20">
                        {customer.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <CustomerHoverDropdown
                          customer={{
                            id: customer.id,
                            name: customer.name,
                            phone: customer.phone,
                            email: customer.email,
                            location: customer.location,
                            totalSpend: customer.totalRevenue,
                            projectsCount: customer.totalProjects,
                            notes: customer.notes,
                            companyName: customer.companyName,
                          }}
                          onViewCustomer={() => setSelectedCustomerId(customer.id)}
                          onUpdateNotes={(note) => handleUpdateHoverNote(customer.id, note)}
                        />
                        <span className="text-[10px] text-slate-500 font-bold block">{customer.id}</span>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/70 font-bold text-slate-800 border border-white/90 backdrop-blur-xs shadow-2xs">
                      {customer.totalProjects} Events
                    </span>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-700">
                    <p className="flex items-center gap-2 font-bold text-slate-950">
                      <Phone className="w-3.5 h-3.5 text-[#831843]" />
                      {formatPhoneNumber(customer.phone)}
                    </p>
                    <p className="flex items-center gap-2 text-slate-600 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {customer.location || 'Bangalore'}
                    </p>
                  </div>

                  {/* Notes Callout Box */}
                  <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-300/40 text-xs backdrop-blur-xs">
                    <div className="flex items-center justify-between text-amber-950 font-bold text-[11px] mb-1">
                      <span className="flex items-center gap-1">
                        <StickyNote className="w-3 h-3 text-amber-700" />
                        <span>Notes</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedCustomerId(customer.id)}
                        className="text-[10px] text-amber-800 hover:underline cursor-pointer font-bold"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-slate-800 text-[11px] line-clamp-2 leading-relaxed">
                      {customer.notes || <span className="italic text-slate-400">No notes saved</span>}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block">Lifetime Revenue</span>
                      <span className="font-black text-slate-950">{formatINR(customer.totalRevenue)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedCustomerId(customer.id)}
                        className="px-3 py-1.5 bg-white/80 hover:bg-[#831843] text-slate-800 hover:text-white font-bold text-xs rounded-xl border border-white/90 transition-colors cursor-pointer shadow-2xs"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full p-12 text-center rounded-2xl glass-card border border-dashed border-slate-300">
              <p className="text-xs text-slate-500 font-semibold">No customers found matching your search.</p>
            </div>
          )}
        </div>
      )}
      </div>

      {/* CUSTOMER DETAIL DRAWER WITH TIMELINE JOURNAL & NOTES LOGGING */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-2xl h-full glass-modal border-l border-white/70 shadow-2xl flex flex-col overflow-hidden text-slate-900">
            {/* Drawer Header */}
            <div className="p-5 border-b border-white/60 bg-white/40 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#831843] to-[#9f1239] text-white flex items-center justify-center font-bold text-lg shadow-sm border border-white/20">
                  {selectedCustomer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-950">{selectedCustomer.name}</h2>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(selectedCustomer)}
                      className="p-1 rounded text-slate-400 hover:text-[#831843]"
                      title="Edit Customer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    {selectedCustomer.location} · Client Profile #{selectedCustomer.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-white/60 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Financial KPI Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl glass-card border border-white/70 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Total Projects</span>
                  <div className="text-xl font-black text-slate-950 mt-1">{selectedCustomer.totalProjects}</div>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 backdrop-blur-md">
                  <span className="text-[10px] uppercase font-bold text-emerald-900">Total Spend</span>
                  <div className="text-xl font-black text-emerald-950 mt-1">{formatINR(selectedCustomer.totalRevenue)}</div>
                </div>
                <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/25 backdrop-blur-md col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-bold text-rose-900">Outstanding</span>
                  <div className="text-xl font-black text-rose-950 mt-1">{formatINR(selectedCustomer.totalOutstanding)}</div>
                </div>
              </div>

              {/* Direct Outreach */}
              <div className="p-4 rounded-2xl glass-card border border-white/70 space-y-2 text-xs">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Direct Contact</h4>
                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href={`tel:${cleanPhoneNumber(selectedCustomer.phone)}`}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/80 text-slate-900 font-bold border border-white/90 hover:bg-white transition-all shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#831843]" />
                    <span>Call {formatPhoneNumber(selectedCustomer.phone)}</span>
                  </a>
                  <a
                    href={`https://wa.me/${cleanPhoneNumber(selectedCustomer.phone)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-950 font-bold border border-emerald-500/30 hover:bg-emerald-500/30 transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                    <span>WhatsApp</span>
                  </a>
                  {selectedCustomer.email && (
                    <a
                      href={`mailto:${selectedCustomer.email}`}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/80 text-slate-900 font-bold border border-white/90 hover:bg-white transition-all shadow-xs"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-600" />
                      <span>{selectedCustomer.email}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* DEDICATED CUSTOMER NOTES & ACTIVITY JOURNAL */}
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-300/40 space-y-4 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-amber-950 text-sm flex items-center gap-2">
                    <StickyNote className="w-4 h-4 text-amber-700" />
                    <span>Customer Notes & Interaction Log</span>
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-950 border border-amber-400/50">
                    Auto-Synchronized
                  </span>
                </div>

                {/* Primary Preferences Note */}
                <div className="p-3 bg-white/80 backdrop-blur-xs rounded-xl border border-amber-300/40">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                    Current Client Preferences & Notes
                  </span>
                  <p className="text-xs text-slate-900 whitespace-pre-wrap leading-relaxed font-medium">
                    {selectedCustomer.notes || (
                      <span className="text-slate-400 italic">
                        No special notes recorded. Use the box below to log client preferences, VIP floral tastes, or billing terms.
                      </span>
                    )}
                  </p>
                </div>

                {/* Post New Note Form */}
                <form onSubmit={handleSaveDrawerNote} className="space-y-2">
                  <label className="block text-xs font-bold text-amber-950">
                    Log New Interaction Note / Preference Update
                  </label>
                  <textarea
                    rows={3}
                    value={drawerNewNote}
                    onChange={(e) => setDrawerNewNote(e.target.value)}
                    placeholder="E.g., Client prefers premium Ecuadorian red roses with gold brass vases. Met for coffee at Indiranagar..."
                    className="w-full p-3 bg-white/90 backdrop-blur-sm border border-amber-300/60 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-700 shadow-2xs font-medium"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingDrawerNote || !drawerNewNote.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSubmittingDrawerNote ? 'Saving Note...' : 'Save & Append Note'}</span>
                    </button>
                  </div>
                </form>

                {/* Activity & Notes Timeline */}
                {selectedCustomer.activities && selectedCustomer.activities.length > 0 && (
                  <div className="pt-2 border-t border-amber-300/40 space-y-2">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                      Logged Activity History
                    </h5>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedCustomer.activities.map((act) => (
                        <div key={act.id} className="p-2.5 bg-white/80 backdrop-blur-xs rounded-xl border border-amber-200/60 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span className="font-bold text-slate-700">{act.author || 'Staff'}</span>
                            <span>{formatDateTime(act.timestamp)}</span>
                          </div>
                          <p className="text-slate-800 text-[11px]">{act.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Linked Projects */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-slate-950 text-sm flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#831843]" />
                  <span>Floral Projects ({customerProjects.length})</span>
                </h3>
                {customerProjects.length > 0 ? (
                  customerProjects.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedCustomerId(null);
                        onSelectProject(p.id);
                      }}
                      className="p-3.5 rounded-2xl glass-card border border-white/70 hover:border-white cursor-pointer flex items-center justify-between text-xs transition-colors shadow-2xs"
                    >
                      <div>
                        <span className="font-bold text-slate-950 block">{p.name}</span>
                        <span className="text-slate-600 font-medium text-[11px]">{formatDate(p.eventDate)} · {p.venue}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-950 block">{formatINR(p.projectValue)}</span>
                        <span className="text-[10px] font-bold text-emerald-800">{p.status}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No confirmed projects yet.</p>
                )}
              </div>

              {/* Linked Inquiries / Leads */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-slate-950 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#831843]" />
                  <span>Inquiry History ({customerLeads.length})</span>
                </h3>
                {customerLeads.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => {
                      setSelectedCustomerId(null);
                      onSelectLead(l.id);
                    }}
                    className="p-3.5 rounded-2xl glass-card border border-white/70 hover:border-white cursor-pointer flex items-center justify-between text-xs transition-colors shadow-2xs"
                  >
                    <div>
                      <span className="font-bold text-slate-950">{l.eventType} ({l.location})</span>
                      <span className="text-slate-600 font-medium block text-[11px]">{l.id} · Budget {formatINR(l.budget)}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/70 text-slate-800 border border-white/90">
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW / EDIT CUSTOMER MODAL */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="glass-modal rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-white/80">
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <div>
                <h3 className="font-black text-slate-950 text-base">
                  {editingCustomer ? 'Edit Customer Profile' : 'Add New Customer'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingCustomer ? `Editing #${editingCustomer.id}` : 'Create a new client profile with contact and notes'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/60 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomerForm} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="e.g. Priya & Rohan Verma"
                    className="w-full px-3 py-2 glass-input border border-white/80 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-[#831843]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="e.g. +91 98860 12345"
                    className="w-full px-3 py-2 glass-input border border-white/80 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-[#831843]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    placeholder="priya@example.com"
                    className="w-full px-3 py-2 glass-input border border-white/80 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-[#831843]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Bangalore Area / Location</label>
                  <input
                    type="text"
                    value={custLocation}
                    onChange={(e) => setCustLocation(e.target.value)}
                    placeholder="e.g. Indiranagar, Bangalore"
                    className="w-full px-3 py-2 glass-input border border-white/80 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-[#831843]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={custCompany}
                    onChange={(e) => setCustCompany(e.target.value)}
                    placeholder="e.g. Embassy Group (Optional)"
                    className="w-full px-3 py-2 glass-input border border-white/80 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-[#831843]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={custGst}
                    onChange={(e) => setCustGst(e.target.value)}
                    placeholder="e.g. 29ABCDE1234F1Z5"
                    className="w-full px-3 py-2 glass-input border border-white/80 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-[#831843]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Customer Notes & Floral Preferences
                </label>
                <textarea
                  rows={3}
                  value={custNotes}
                  onChange={(e) => setCustNotes(e.target.value)}
                  placeholder="Record customer preferences (e.g. prefers pastel orchids, VIP wedding decor, preferred billing cycle)..."
                  className="w-full p-2.5 glass-input border border-white/80 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-[#831843]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/60">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/70 text-slate-700 hover:bg-white font-bold border border-white/90 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCustomer}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#831843] to-[#9f1239] hover:from-[#701a39] hover:to-[#881337] text-white font-bold disabled:opacity-50 transition-all shadow-md shadow-[#831843]/20 border border-white/20 cursor-pointer"
                >
                  {isSavingCustomer ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
