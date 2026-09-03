import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Briefcase,
  Receipt,
  Sparkles,
  AlertTriangle,
  Plus,
  Trash2,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { Customer, Project, Invoice, BusinessSettings, Lead, FloralTemplate, DEFAULT_BUSINESS_SETTINGS } from '../types';
import { api } from '../lib/api';
import { formatINR } from '../lib/formatters';

export interface ModalState {
  lead?: boolean;
  project?: boolean;
  customer?: boolean;
  quotation?: boolean;
  invoice?: boolean;
  payment?: boolean;
  dailyLog?: boolean;
  template?: boolean;
  paymentInvoiceId?: string;
  invoiceProjectId?: string;
  dailyLogProjectId?: string;
  quotationTemplate?: FloralTemplate | null;
}

interface NewEntryModalsProps {
  modalType?: 'LEAD' | 'PROJECT' | 'CUSTOMER' | 'INVOICE' | 'QUOTATION' | 'PAYMENT' | 'DAILY_UPDATE' | null;
  modalState?: ModalState;
  onClose?: () => void;
  onCloseModal?: (key: string) => void;
  onRefreshData?: () => void | Promise<void>;
  projects?: Project[];
  customers?: Customer[];
  invoices?: Invoice[];
  leads?: Lead[];
  templates?: FloralTemplate[];
  settings?: BusinessSettings | null;
  preselectedProjectId?: string;
  preselectedInvoiceId?: string;
  preselectedTemplate?: FloralTemplate | null;
  onLeadCreated?: () => void;
  onProjectCreated?: () => void;
  onCustomerCreated?: () => void;
  onInvoiceCreated?: () => void;
  onQuotationCreated?: () => void;
  onPaymentRecorded?: () => void;
  onDailyUpdatePosted?: () => void;
}

export const NewEntryModals: React.FC<NewEntryModalsProps> = ({
  modalType,
  modalState,
  onClose,
  onCloseModal,
  onRefreshData,
  projects = [],
  customers = [],
  invoices = [],
  leads = [],
  templates = [],
  settings,
  preselectedProjectId,
  preselectedInvoiceId,
  preselectedTemplate,
  onLeadCreated,
  onProjectCreated,
  onCustomerCreated,
  onInvoiceCreated,
  onQuotationCreated,
  onPaymentRecorded,
  onDailyUpdatePosted,
}) => {
  const safeSettings = settings || DEFAULT_BUSINESS_SETTINGS;

  const isQuotationOpen = modalType === 'QUOTATION' || Boolean(modalState?.quotation);
  const isLeadOpen = modalType === 'LEAD' || Boolean(modalState?.lead);
  const isProjectOpen = modalType === 'PROJECT' || Boolean(modalState?.project);
  const isCustomerOpen = modalType === 'CUSTOMER' || Boolean(modalState?.customer);
  const isInvoiceOpen = modalType === 'INVOICE' || Boolean(modalState?.invoice);
  const isPaymentOpen = modalType === 'PAYMENT' || Boolean(modalState?.payment);
  const isDailyUpdateOpen = modalType === 'DAILY_UPDATE' || Boolean(modalState?.dailyLog);

  if (
    !isQuotationOpen &&
    !isLeadOpen &&
    !isProjectOpen &&
    !isCustomerOpen &&
    !isInvoiceOpen &&
    !isPaymentOpen &&
    !isDailyUpdateOpen
  ) {
    return null;
  }

  const handleClose = (key: string) => {
    if (onCloseModal) onCloseModal(key);
    if (onClose) onClose();
  };

  const handleRefresh = async (cb?: () => void) => {
    if (cb) cb();
    if (onRefreshData) await onRefreshData();
  };

  const activeInvoiceProjectId = preselectedProjectId || modalState?.invoiceProjectId;
  const activePaymentInvoiceId = preselectedInvoiceId || modalState?.paymentInvoiceId;
  const activeDailyLogProjectId = preselectedProjectId || modalState?.dailyLogProjectId;
  const activeQuotationTemplate = preselectedTemplate || modalState?.quotationTemplate;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      {isQuotationOpen && (
        <NewQuotationModal
          onClose={() => handleClose('quotation')}
          leads={leads}
          templates={templates}
          settings={safeSettings}
          initialTemplate={activeQuotationTemplate}
          onSuccess={() => handleRefresh(onQuotationCreated)}
        />
      )}

      {isLeadOpen && (
        <NewLeadModal
          onClose={() => handleClose('lead')}
          settings={safeSettings}
          onSuccess={() => handleRefresh(onLeadCreated)}
        />
      )}

      {isProjectOpen && (
        <NewProjectModal
          onClose={() => handleClose('project')}
          customers={customers}
          settings={safeSettings}
          onSuccess={() => handleRefresh(onProjectCreated)}
        />
      )}

      {isCustomerOpen && (
        <NewCustomerModal
          onClose={() => handleClose('customer')}
          settings={safeSettings}
          onSuccess={() => handleRefresh(onCustomerCreated)}
        />
      )}

      {isInvoiceOpen && (
        <NewInvoiceModal
          onClose={() => handleClose('invoice')}
          projects={projects}
          settings={safeSettings}
          preselectedProjectId={activeInvoiceProjectId}
          onSuccess={() => handleRefresh(onInvoiceCreated)}
        />
      )}

      {isPaymentOpen && (
        <RecordPaymentModal
          onClose={() => handleClose('payment')}
          invoices={invoices}
          preselectedInvoiceId={activePaymentInvoiceId}
          onSuccess={() => handleRefresh(onPaymentRecorded)}
        />
      )}

      {isDailyUpdateOpen && (
        <PostDailyUpdateModal
          onClose={() => handleClose('dailyLog')}
          projects={projects}
          preselectedProjectId={activeDailyLogProjectId}
          onSuccess={() => handleRefresh(onDailyUpdatePosted)}
        />
      )}
    </div>
  );
};

// 1. New Lead Modal
const NewLeadModal: React.FC<{
  onClose: () => void;
  settings?: BusinessSettings | null;
  onSuccess: () => void;
}> = ({ onClose, settings, onSuccess }) => {
  const safeSettings = settings || DEFAULT_BUSINESS_SETTINGS;
  const bangaloreAreas = safeSettings.bangaloreAreas?.length ? safeSettings.bangaloreAreas : DEFAULT_BUSINESS_SETTINGS.bangaloreAreas;
  const eventTypes = safeSettings.eventTypes?.length ? safeSettings.eventTypes : DEFAULT_BUSINESS_SETTINGS.eventTypes;

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState(bangaloreAreas[0] || 'Whitefield, Bangalore');
  const [eventType, setEventType] = useState(eventTypes[0] || 'Wedding');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceRequired, setServiceRequired] = useState('Stage Floral Arch & Entrance Decor');
  const [budget, setBudget] = useState('150000');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [source, setSource] = useState('PHONE');

  const [dupWarning, setDupWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkDuplicate = async (val: string) => {
    if (val.replace(/[^0-9]/g, '').length >= 10) {
      try {
        const res = await api.checkDuplicateLead(val);
        if (res.isDuplicate) {
          setDupWarning(res.message);
        } else {
          setDupWarning(null);
        }
      } catch {}
    } else {
      setDupWarning(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createLead({
        customerName,
        phone,
        email,
        location,
        eventType,
        eventDate,
        serviceRequired,
        budget: Number(budget),
        message,
        priority,
        source: source as any,
      });
      onSuccess();
    } catch (err: any) {
      alert(err.message || 'Failed to create lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl rounded-3xl glass-modal border border-white/80 shadow-2xl p-6 sm:p-7 space-y-4 max-h-[90vh] overflow-y-auto text-slate-900 animate-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-white/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[#831843]">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-950 text-base">New Lead Inquiry</h3>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white/60 transition-colors cursor-pointer border border-transparent hover:border-white/60">
          <X className="w-4 h-4" />
        </button>
      </div>

      {dupWarning && (
        <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-xs text-amber-950 font-bold flex items-center gap-2 backdrop-blur-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{dupWarning}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-900 font-bold block mb-1.5">Customer Name *</label>
            <input
              required
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#831843]"
            />
          </div>

          <div>
            <label className="text-slate-900 font-bold block mb-1.5">Phone Number (WhatsApp) *</label>
            <input
              required
              type="text"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                checkDuplicate(e.target.value);
              }}
              placeholder="+91 98860 11223"
              className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#831843]"
            />
          </div>

          <div>
            <label className="text-slate-900 font-bold block mb-1.5">Event Type *</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium cursor-pointer focus:outline-none focus:border-[#831843]"
            >
              {eventTypes.map((t) => (
                <option key={t} value={t} className="bg-white text-slate-950">{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-900 font-bold block mb-1.5">Event Date *</label>
            <input
              required
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium focus:outline-none focus:border-[#831843]"
            />
          </div>

          <div>
            <label className="text-slate-900 font-bold block mb-1.5">Location / Area</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium cursor-pointer focus:outline-none focus:border-[#831843]"
            >
              {bangaloreAreas.map((a) => (
                <option key={a} value={a} className="bg-white text-slate-950">{a}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-900 font-bold block mb-1.5">Budget (₹) *</label>
            <input
              required
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-black placeholder:text-slate-400 focus:outline-none focus:border-[#831843]"
            />
          </div>
        </div>

        <div>
          <label className="text-slate-900 font-bold block mb-1.5">Floral Service Required *</label>
          <input
            required
            type="text"
            value={serviceRequired}
            onChange={(e) => setServiceRequired(e.target.value)}
            placeholder="e.g. Stage backdrop, mandap, 12 walkway pillars"
            className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#831843]"
          />
        </div>

        <div>
          <label className="text-slate-900 font-bold block mb-1.5">Inquiry Notes / Customer Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            placeholder="Customer flower preferences, special requests..."
            className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#831843]"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-white/60 cursor-pointer font-bold transition-colors border border-transparent hover:border-white/60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#831843] to-[#9f1239] hover:from-[#701a39] hover:to-[#881337] text-white font-bold cursor-pointer shadow-md shadow-[#831843]/20 border border-white/20 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Create Lead'}
          </button>
        </div>
      </form>
    </div>
  );
};

// 2. New Project Modal
const NewProjectModal: React.FC<{
  onClose: () => void;
  customers?: Customer[];
  settings?: BusinessSettings | null;
  onSuccess: () => void;
}> = ({ onClose, customers = [], settings, onSuccess }) => {
  const safeSettings = settings || DEFAULT_BUSINESS_SETTINGS;
  const staffMembers = safeSettings.staffMembers?.length ? safeSettings.staffMembers : DEFAULT_BUSINESS_SETTINGS.staffMembers;
  const eventTypes = safeSettings.eventTypes?.length ? safeSettings.eventTypes : DEFAULT_BUSINESS_SETTINGS.eventTypes;

  const [customerName, setCustomerName] = useState(customers[0]?.name || '');
  const [eventType, setEventType] = useState(eventTypes[0] || 'Wedding');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [venue, setVenue] = useState('The Leela Palace, Bangalore');
  const [projectValue, setProjectValue] = useState('150000');
  const [assignedStaff, setAssignedStaff] = useState(staffMembers[0] || 'Syed (Lead Event Manager & Producer)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { lead } = await api.createLead({
        customerName,
        phone: customers.find((c) => c.name === customerName)?.phone || '+91 98860 11223',
        location: venue,
        eventType,
        eventDate,
        serviceRequired: `${eventType} Floral Decoration at ${venue}`,
        budget: Number(projectValue),
        assignedStaff,
      });

      await api.convertLeadToProject(lead.id);
      onSuccess();
    } catch (err: any) {
      alert(err.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg rounded-3xl glass-modal border border-white/80 shadow-2xl p-6 space-y-4 text-slate-900 animate-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-white/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[#831843]">
            <Briefcase className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-950 text-base">Create New Project</h3>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white/60 transition-colors cursor-pointer border border-transparent hover:border-white/60">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div>
          <label className="text-slate-900 font-bold block mb-1.5">Customer *</label>
          <input
            required
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. Priya Sharma"
            className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#831843]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-slate-900 font-bold block mb-1.5">Event Type *</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium cursor-pointer focus:outline-none focus:border-[#831843]"
            >
              {eventTypes.map((t) => (
                <option key={t} value={t} className="bg-white text-slate-950">{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-900 font-bold block mb-1.5">Event Date *</label>
            <input
              required
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium focus:outline-none focus:border-[#831843]"
            />
          </div>
        </div>

        <div>
          <label className="text-slate-900 font-bold block mb-1.5">Venue / Location *</label>
          <input
            required
            type="text"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="e.g. Palace Grounds Sheesh Mahal, Bangalore"
            className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#831843]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-slate-900 font-bold block mb-1.5">Total Project Value (₹) *</label>
            <input
              required
              type="number"
              value={projectValue}
              onChange={(e) => setProjectValue(e.target.value)}
              className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-black placeholder:text-slate-400 focus:outline-none focus:border-[#831843]"
            />
          </div>

          <div>
            <label className="text-slate-900 font-bold block mb-1.5">Assigned Event Manager</label>
            <select
              value={assignedStaff}
              onChange={(e) => setAssignedStaff(e.target.value)}
              className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium cursor-pointer focus:outline-none focus:border-[#831843]"
            >
              {staffMembers.map((s) => (
                <option key={s} value={s} className="bg-white text-slate-950">{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/60">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-white/60 font-bold cursor-pointer transition-colors border border-transparent hover:border-white/60">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#831843] to-[#9f1239] hover:from-[#701a39] hover:to-[#881337] text-white font-bold cursor-pointer shadow-md shadow-[#831843]/20 border border-white/20 transition-all disabled:opacity-50">
            {isSubmitting ? 'Creating...' : 'Launch Project'}
          </button>
        </div>
      </form>
    </div>
  );
};

// 3. New Customer Modal
const NewCustomerModal: React.FC<{
  onClose: () => void;
  settings?: BusinessSettings | null;
  onSuccess: () => void;
}> = ({ onClose, settings, onSuccess }) => {
  const safeSettings = settings || DEFAULT_BUSINESS_SETTINGS;
  const bangaloreAreas = safeSettings.bangaloreAreas?.length ? safeSettings.bangaloreAreas : DEFAULT_BUSINESS_SETTINGS.bangaloreAreas;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState(bangaloreAreas[0] || 'Indiranagar, Bangalore');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLead({
        customerName: name,
        phone,
        email,
        location,
        eventType: 'Wedding',
        serviceRequired: 'Direct Customer Creation',
        budget: 0,
        message: notes,
      });
      onSuccess();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl glass-modal border border-white/80 shadow-2xl p-6 space-y-4 text-slate-900 animate-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-white/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[#831843]">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-950 text-base">New Customer Profile</h3>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white/60 transition-colors cursor-pointer border border-transparent hover:border-white/60">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        <div>
          <label className="text-slate-900 font-bold block mb-1.5">Customer Full Name *</label>
          <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium focus:outline-none focus:border-[#831843]" />
        </div>
        <div>
          <label className="text-slate-900 font-bold block mb-1.5">Phone (WhatsApp) *</label>
          <input required type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98..." className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium focus:outline-none focus:border-[#831843]" />
        </div>
        <div>
          <label className="text-slate-900 font-bold block mb-1.5">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium focus:outline-none focus:border-[#831843]" />
        </div>
        <div>
          <label className="text-slate-900 font-bold block mb-1.5">Location / Area</label>
          <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium cursor-pointer focus:outline-none focus:border-[#831843]">
            {bangaloreAreas.map((a) => (<option key={a} value={a} className="bg-white text-slate-950">{a}</option>))}
          </select>
        </div>
        <div>
          <label className="text-slate-900 font-bold block mb-1.5">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium focus:outline-none focus:border-[#831843]" />
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t border-white/60">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-white/60 transition-colors font-bold cursor-pointer border border-transparent hover:border-white/60">Cancel</button>
          <button type="submit" className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#831843] to-[#9f1239] hover:from-[#701a39] hover:to-[#881337] text-white font-bold shadow-md shadow-[#831843]/20 border border-white/20 transition-all cursor-pointer">Save Customer</button>
        </div>
      </form>
    </div>
  );
};

// 4. New Invoice Modal
const NewInvoiceModal: React.FC<{
  onClose: () => void;
  projects?: Project[];
  settings?: BusinessSettings | null;
  preselectedProjectId?: string;
  onSuccess: () => void;
}> = ({ onClose, projects = [], settings, preselectedProjectId, onSuccess }) => {
  const safeSettings = settings || DEFAULT_BUSINESS_SETTINGS;
  const [projectId, setProjectId] = useState(preselectedProjectId || projects[0]?.id || '');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState([
    { description: 'Floral Stage Decoration & Mandap Setup', quantity: 1, unitPrice: 95000 },
    { description: 'Grand Entrance Floral Archway', quantity: 1, unitPrice: 35000 },
  ]);
  const [discount, setDiscount] = useState('0');
  const [taxRate, setTaxRate] = useState(safeSettings.enableGst ? '18' : '0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 10000 }]);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const next = [...items];
    (next[idx] as any)[field] = value;
    setItems(next);
  };

  const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0), 0);
  const taxAmount = (Math.max(0, subtotal - Number(discount)) * Number(taxRate)) / 100;
  const total = Math.max(0, subtotal - Number(discount)) + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !items.length) return;
    setIsSubmitting(true);
    try {
      await api.createInvoice({
        projectId,
        dueDate,
        items,
        discount: Number(discount),
        taxRate: Number(taxRate),
      });
      onSuccess();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl rounded-3xl glass-modal border border-white/80 shadow-2xl p-6 sm:p-7 space-y-4 max-h-[90vh] overflow-y-auto text-slate-900 animate-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-white/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[#831843]">
            <Receipt className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-950 text-base">Generate GST Invoice</h3>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white/60 transition-colors cursor-pointer border border-transparent hover:border-white/60">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-slate-900 font-bold block mb-1.5">Target Project *</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium cursor-pointer focus:outline-none focus:border-[#831843]"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-white text-slate-950">{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-900 font-bold block mb-1.5">Due Date *</label>
            <input
              required
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium focus:outline-none focus:border-[#831843]"
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-slate-950">Line Items & Floral Services</span>
            <button
              type="button"
              onClick={addItem}
              className="text-[#831843] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          {items.map((it, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                required
                type="text"
                value={it.description}
                onChange={(e) => updateItem(idx, 'description', e.target.value)}
                placeholder="Description e.g. Rose archway"
                className="flex-3 p-2 rounded-xl glass-input text-slate-950 placeholder:text-slate-400 font-medium"
              />
              <input
                required
                type="number"
                value={it.quantity}
                onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                placeholder="Qty"
                className="flex-1 p-2 rounded-xl glass-input text-slate-950 text-center font-bold"
              />
              <input
                required
                type="number"
                value={it.unitPrice}
                onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                placeholder="Price"
                className="flex-2 p-2 rounded-xl glass-input text-slate-950 font-black text-right"
              />
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Summary calculation */}
        <div className="p-4 rounded-2xl bg-white/60 border border-white/80 space-y-2 backdrop-blur-xs">
          <div className="flex justify-between text-slate-700 font-medium">
            <span>Subtotal:</span>
            <span className="font-bold text-slate-950">{formatINR(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-slate-700 font-medium">
            <span>GST Tax Rate (%):</span>
            <input
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="w-20 p-1 text-center rounded-lg glass-input text-slate-950 font-bold"
            />
          </div>
          <div className="flex justify-between text-sm font-black text-slate-950 pt-2 border-t border-white/60">
            <span>Total Invoiced:</span>
            <span className="text-emerald-800">{formatINR(total)}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-white/60">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-white/60 transition-colors font-bold cursor-pointer border border-transparent hover:border-white/60">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#831843] to-[#9f1239] hover:from-[#701a39] hover:to-[#881337] text-white font-bold shadow-md shadow-[#831843]/20 border border-white/20 transition-all cursor-pointer disabled:opacity-50">
            {isSubmitting ? 'Creating...' : 'Issue Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
};

// 5. Record Payment Modal
const RecordPaymentModal: React.FC<{
  onClose: () => void;
  invoices?: Invoice[];
  preselectedInvoiceId?: string;
  onSuccess: () => void;
}> = ({ onClose, invoices = [], preselectedInvoiceId, onSuccess }) => {
  const [invoiceId, setInvoiceId] = useState(preselectedInvoiceId || invoices[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'BANK_TRANSFER' | 'CASH' | 'CARD'>('UPI');
  const [referenceNumber, setReferenceNumber] = useState('UPI/2026/' + Math.floor(10000000 + Math.random() * 90000000));
  const [notes, setNotes] = useState('Payment received for project floral booking');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentInvoice = invoices.find((i) => i.id === invoiceId);

  useEffect(() => {
    if (currentInvoice && !amount) {
      setAmount(String(currentInvoice.balance || currentInvoice.total));
    }
  }, [currentInvoice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId || !amount || Number(amount) <= 0) return;
    setIsSubmitting(true);
    try {
      await api.recordPayment({
        invoiceId,
        amount: Number(amount),
        paymentDate,
        paymentMethod,
        referenceNumber,
        notes,
      });
      onSuccess();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl glass-modal border border-white/80 shadow-2xl p-6 space-y-4 text-slate-900 animate-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-white/60">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 font-black flex items-center justify-center text-xs backdrop-blur-xs">₹</span>
          <h3 className="font-extrabold text-slate-950 text-base">Record Payment Receipt</h3>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white/60 transition-colors cursor-pointer border border-transparent hover:border-white/60">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div>
          <label className="text-slate-900 font-bold block mb-1.5">Select Invoice *</label>
          <select
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
            className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-semibold cursor-pointer focus:outline-none focus:border-[#831843]"
          >
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id} className="bg-white text-slate-950">
                {inv.invoiceNumber} — {inv.customerName} (Bal: {formatINR(inv.balance)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-slate-900 font-bold block mb-1.5">Amount Received (₹) *</label>
          <input
            required
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2.5 rounded-xl glass-input text-base font-black text-emerald-800 focus:outline-none focus:border-[#831843]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-slate-900 font-bold block mb-1.5">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-bold cursor-pointer focus:outline-none focus:border-[#831843]"
            >
              <option value="UPI" className="bg-white text-slate-950">UPI (GPay / PhonePe)</option>
              <option value="BANK_TRANSFER" className="bg-white text-slate-950">Bank Transfer (NEFT / IMPS)</option>
              <option value="CASH" className="bg-white text-slate-950">Cash</option>
              <option value="CARD" className="bg-white text-slate-950">Credit / Debit Card</option>
            </select>
          </div>

          <div>
            <label className="text-slate-900 font-bold block mb-1.5">Payment Date</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium focus:outline-none focus:border-[#831843]"
            />
          </div>
        </div>

        <div>
          <label className="text-slate-900 font-bold block mb-1.5">Ref / UTR / Transaction #</label>
          <input
            type="text"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-mono font-bold focus:outline-none focus:border-[#831843]"
          />
        </div>

        <div>
          <label className="text-slate-900 font-bold block mb-1.5">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium focus:outline-none focus:border-[#831843]"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-white/60">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-white/60 transition-colors font-bold cursor-pointer border border-transparent hover:border-white/60">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#831843] to-[#9f1239] hover:from-[#701a39] hover:to-[#881337] text-white font-bold shadow-md shadow-[#831843]/20 border border-white/20 transition-all cursor-pointer disabled:opacity-50">
            {isSubmitting ? 'Recording...' : 'Save & Update Balance'}
          </button>
        </div>
      </form>
    </div>
  );
};

// 6. Post Daily Update Modal
const PostDailyUpdateModal: React.FC<{
  onClose: () => void;
  projects?: Project[];
  preselectedProjectId?: string;
  onSuccess: () => void;
}> = ({ onClose, projects = [], preselectedProjectId, onSuccess }) => {
  const [projectId, setProjectId] = useState(preselectedProjectId || projects[0]?.id || '');
  const [updateText, setUpdateText] = useState('');
  const [projectStatus, setProjectStatus] = useState<'ON_TRACK' | 'ATTENTION_NEEDED' | 'DELAYED'>('ON_TRACK');
  const [nextAction, setNextAction] = useState('');
  const [addedBy, setAddedBy] = useState('Admin');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !updateText.trim()) return;
    setIsSubmitting(true);
    try {
      await api.addDailyUpdate(projectId, {
        updateText: updateText.trim(),
        projectStatus,
        nextAction: nextAction.trim(),
        addedBy,
      });
      onSuccess();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg rounded-3xl glass-modal border border-white/80 shadow-2xl p-6 space-y-4 text-slate-900 animate-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-white/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[#831843]">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-950 text-base">Add Daily Project Update</h3>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white/60 transition-colors cursor-pointer border border-transparent hover:border-white/60">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div>
          <label className="text-slate-900 font-bold block mb-1.5">Select Active Project *</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-semibold cursor-pointer focus:outline-none focus:border-[#831843]"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="bg-white text-slate-950">{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-slate-900 font-bold block mb-1.5">Today's Progress / Update Text *</label>
          <textarea
            required
            value={updateText}
            onChange={(e) => setUpdateText(e.target.value)}
            placeholder="e.g. Stage design finalized. White roses confirmed. Vendor confirmed for flower delivery..."
            rows={3}
            className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#831843]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-slate-900 font-bold block mb-1.5">Project Status</label>
            <select
              value={projectStatus}
              onChange={(e) => setProjectStatus(e.target.value as any)}
              className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-bold cursor-pointer focus:outline-none focus:border-[#831843]"
            >
              <option value="ON_TRACK" className="bg-white text-slate-950">On Track</option>
              <option value="ATTENTION_NEEDED" className="bg-white text-slate-950">Attention Needed</option>
              <option value="DELAYED" className="bg-white text-slate-950">Delayed</option>
            </select>
          </div>

          <div>
            <label className="text-slate-900 font-bold block mb-1.5">Added By</label>
            <input
              type="text"
              value={addedBy}
              onChange={(e) => setAddedBy(e.target.value)}
              className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-semibold focus:outline-none focus:border-[#831843]"
            />
          </div>
        </div>

        <div>
          <label className="text-slate-900 font-bold block mb-1.5">Next Action</label>
          <input
            type="text"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            placeholder="e.g. Confirm final flower quantity"
            className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#831843]"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-white/60">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-white/60 transition-colors font-bold cursor-pointer border border-transparent hover:border-white/60">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#831843] to-[#9f1239] hover:from-[#701a39] hover:to-[#881337] text-white font-bold shadow-md shadow-[#831843]/20 border border-white/20 transition-all cursor-pointer disabled:opacity-50">
            {isSubmitting ? 'Posting...' : 'Save Log'}
          </button>
        </div>
      </form>
    </div>
  );
};

// 7. New Floral Quotation / Proposal Modal
const NewQuotationModal: React.FC<{
  onClose: () => void;
  leads?: Lead[];
  templates?: FloralTemplate[];
  settings?: BusinessSettings | null;
  initialTemplate?: FloralTemplate | null;
  onSuccess: () => void;
}> = ({ onClose, leads = [], templates = [], settings, initialTemplate, onSuccess }) => {
  const safeSettings = settings || DEFAULT_BUSINESS_SETTINGS;
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id || '');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [projectName, setProjectName] = useState('Luxury Floral Wedding & Reception Staging');
  const [eventDate, setEventDate] = useState(new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0]);
  const [venue, setVenue] = useState('The Leela Palace, Bangalore');
  const [validUntil, setValidUntil] = useState(new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialTemplate?.id || '');

  const [items, setItems] = useState<Array<{ description: string; quantity: number; unitPrice: number; category?: string }>>([
    { description: 'Grand Entrance Floral Arch with Imported Dutch Hydrangeas & Baby Breath', quantity: 1, unitPrice: 85000, category: 'Entrance Arch' },
    { description: 'Royal Stage Backdrop with White Orchids, Carnations & Jasmine Chandeliers', quantity: 1, unitPrice: 160000, category: 'Main Stage' },
    { description: 'Floral Walkway Pillars with Ambient Fairy Lights & Glass Vases (Set of 8)', quantity: 8, unitPrice: 6000, category: 'Aisle & Walkway' },
    { description: 'VIP Guest Dining Floral Centerpieces with Fresh Roses & Eucalyptus', quantity: 15, unitPrice: 2200, category: 'Table Decor' },
  ]);

  const [discount, setDiscount] = useState('0');
  const [taxRate, setTaxRate] = useState(safeSettings.enableGst ? '18' : '0');
  const [botanicalSpecs, setBotanicalSpecs] = useState('Premium Grade-A Dutch Roses, Orchids, Mogra & Jasmine strings, Foliage: Eucalyptus, Ruscus.');
  const [termsAndConditions, setTermsAndConditions] = useState('50% advance booking deposit required to lock event dates. Balance payable 48 hours prior to event staging.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiBudgetInput, setAiBudgetInput] = useState('200000');
  const [aiThemeInput, setAiThemeInput] = useState('Royal Blush Roses & Fragrant Madurai Mogra');

  const handleAiGenerateQuotation = async () => {
    setIsAiGenerating(true);
    try {
      const selectedLead = leads.find((l) => l.id === selectedLeadId);
      const res = await api.getAiQuotationSuggestions({
        eventType: selectedLead?.eventType || 'Wedding',
        theme: aiThemeInput || 'Luxury Floral Decor',
        budget: Number(aiBudgetInput) || 200000,
        location: venue || 'Bangalore',
        specialRequirements: projectName,
      });

      if (res && res.suggestedItems?.length) {
        setItems(
          res.suggestedItems.map((item) => ({
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 50000,
            category: 'Floral Staging',
          }))
        );
      }

      if (res.flowerList?.length) {
        setBotanicalSpecs(`Flower List: ${res.flowerList.join(', ')}. ${res.designNotes || ''}`);
      }
    } catch (err: any) {
      console.error('AI quotation suggestion error:', err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // If lead is picked, autofill
  useEffect(() => {
    if (selectedLeadId) {
      const l = leads.find((x) => x.id === selectedLeadId);
      if (l) {
        setCustomerName(l.customerName);
        setCustomerPhone(l.phone);
        setCustomerEmail(l.email || '');
        setProjectName(`${l.eventType} Floral Production - ${l.customerName}`);
        if (l.eventDate) setEventDate(l.eventDate);
        if (l.location) setVenue(l.location);
      }
    }
  }, [selectedLeadId, leads]);

  // If template is chosen, populate items & botanical notes
  const handleTemplateChange = (tId: string) => {
    setSelectedTemplateId(tId);
    const tmpl = templates.find((t) => t.id === tId);
    if (tmpl) {
      setBotanicalSpecs(`Floral Recipe: ${tmpl.stemRecipe.map((f) => `${f.flowerName} (${f.quantity})`).join(', ')}.`);
      setItems([
        {
          description: `${tmpl.name} - Main Staging & Structural Fabrication`,
          quantity: 1,
          unitPrice: Math.round(tmpl.basePrice * 0.6),
          category: tmpl.category,
        },
        {
          description: `Botanical Floral Installations (${tmpl.colorPalette.map(c => c.name).join(', ')} Palette: ${tmpl.keyFlowers.slice(0, 4).join(', ')})`,
          quantity: 1,
          unitPrice: Math.round(tmpl.basePrice * 0.3),
          category: 'Floral Recipe',
        },
        {
          description: `Custom Illumination & Atmospheric Lighting (${tmpl.lightingPairing})`,
          quantity: 1,
          unitPrice: Math.round(tmpl.basePrice * 0.1),
          category: 'Lighting',
        },
      ]);
    }
  };

  const addItem = () => {
    setItems([...items, { description: 'Bespoke Floral Decor Item', quantity: 1, unitPrice: 15000, category: 'Floral Decor' }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: value };
    setItems(next);
  };

  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const discountVal = Number(discount) || 0;
  const taxable = Math.max(0, subtotal - discountVal);
  const taxAmount = (taxable * (Number(taxRate) || 0)) / 100;
  const total = taxable + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName) return alert('Customer name is required');
    setIsSubmitting(true);
    try {
      await api.createQuotation({
        leadId: selectedLeadId || undefined,
        customerName,
        customerPhone,
        customerEmail,
        projectName,
        eventDate,
        venue,
        validUntil,
        templateId: selectedTemplateId || undefined,
        items,
        discount: discountVal,
        taxRate: Number(taxRate) || 18,
        botanicalSpecs,
        termsAndConditions,
      });
      onSuccess();
    } catch (err: any) {
      alert(err.message || 'Failed to create quotation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-modal border border-white/80 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-900 space-y-4 animate-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-white/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[#831843]">
            <Receipt className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-950 text-base">Generate Z S EVENTS Floral Proposal</h3>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white/60 transition-colors cursor-pointer border border-transparent hover:border-white/60">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Template Quick Loader & AI Generator */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col justify-between gap-2 backdrop-blur-xs">
            <div>
              <span className="font-bold text-[#831843] block">Apply Design Catalog Theme</span>
              <span className="text-slate-600 text-[11px] font-medium">Auto-populates items from catalog</span>
            </div>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-slate-950 text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="">-- Choose Floral Theme --</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id} className="bg-white text-slate-950">
                  {t.name} (₹{t.basePrice.toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col justify-between gap-2 backdrop-blur-xs">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-amber-950">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>AI Floral Recipe & Items Generator</span>
              </div>
              <span className="text-slate-600 text-[11px] font-medium">Calculates itemized rates & stem recipes</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={aiBudgetInput}
                onChange={(e) => setAiBudgetInput(e.target.value)}
                placeholder="Target Budget ₹"
                className="w-28 px-2.5 py-1.5 rounded-lg glass-input text-slate-950 text-xs font-bold focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAiGenerateQuotation}
                disabled={isAiGenerating}
                className="flex-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs border border-white/20 cursor-pointer transition-all disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isAiGenerating ? 'Calculating...' : 'AI Auto-Fill Items'}
              </button>
            </div>
          </div>
        </div>

        {/* Client & Lead Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {leads.length > 0 && (
            <div className="sm:col-span-2">
              <label className="text-slate-900 font-bold block mb-1">Pre-fill From Existing Lead (Optional)</label>
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium cursor-pointer focus:outline-none focus:border-[#831843]"
              >
                <option value="">-- Manual Client Entry --</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id} className="bg-white text-slate-950">
                    {l.customerName} • {l.eventType} ({l.phone})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-slate-900 font-bold block mb-1">Client Name *</label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Ananya & Arjun"
              className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium focus:outline-none focus:border-[#831843]"
            />
          </div>

          <div>
            <label className="text-slate-900 font-bold block mb-1">Phone Number</label>
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+91 98450 12345"
              className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium focus:outline-none focus:border-[#831843]"
            />
          </div>

          <div>
            <label className="text-slate-900 font-bold block mb-1">Event / Proposal Title *</label>
            <input
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Grand Wedding Reception Staging"
              className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium focus:outline-none focus:border-[#831843]"
            />
          </div>

          <div>
            <label className="text-slate-900 font-bold block mb-1">Event Venue & City</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Taj West End, Bangalore"
              className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium focus:outline-none focus:border-[#831843]"
            />
          </div>

          <div>
            <label className="text-slate-900 font-bold block mb-1">Event Date</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium focus:outline-none focus:border-[#831843]"
            />
          </div>

          <div>
            <label className="text-slate-900 font-bold block mb-1">Proposal Validity Date</label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium focus:outline-none focus:border-[#831843]"
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-2 pt-2 border-t border-white/60">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-slate-950 text-xs uppercase tracking-wider">
              Floral Scope & Deliverables
            </span>
            <button
              type="button"
              onClick={addItem}
              className="px-2.5 py-1 rounded-lg bg-white/60 hover:bg-white text-slate-900 text-xs font-bold flex items-center gap-1 transition-colors border border-white/80 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-white/50 border border-white/80 grid grid-cols-12 gap-2 items-center backdrop-blur-xs">
                <div className="col-span-6">
                  <input
                    type="text"
                    required
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    placeholder="Floral item description..."
                    className="w-full p-2 rounded-lg glass-input text-xs text-slate-950 font-medium"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                    placeholder="Qty"
                    className="w-full p-2 rounded-lg glass-input text-xs text-center text-slate-950 font-bold"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                    placeholder="Unit Price"
                    className="w-full p-2 rounded-lg glass-input text-xs text-right text-slate-950 font-black"
                  />
                </div>
                <div className="col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calculation & Taxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-2xl bg-white/60 border border-white/80 backdrop-blur-xs">
          <div className="space-y-2">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Discount (₹)</label>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full p-2 rounded-lg glass-input text-slate-950 font-bold"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">GST Tax Rate (% SAC 998599)</label>
              <input
                type="number"
                min="0"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full p-2 rounded-lg glass-input text-slate-950 font-bold"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-xs flex flex-col justify-end">
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Subtotal:</span>
              <span className="text-slate-950 font-bold">{formatINR(subtotal)}</span>
            </div>
            {discountVal > 0 && (
              <div className="flex justify-between text-emerald-800 font-bold">
                <span>Discount:</span>
                <span>-{formatINR(discountVal)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600 font-medium">
              <span>GST ({taxRate}%):</span>
              <span className="text-slate-950 font-bold">{formatINR(taxAmount)}</span>
            </div>
            <div className="flex justify-between font-black text-sm text-slate-950 pt-2 border-t border-white/60">
              <span>Total Proposal Cost:</span>
              <span className="text-[#831843]">{formatINR(total)}</span>
            </div>
          </div>
        </div>

        {/* Botanical specs */}
        <div>
          <label className="text-slate-900 font-bold block mb-1">Botanical Specifications & Fresh Floral Notes</label>
          <textarea
            rows={2}
            value={botanicalSpecs}
            onChange={(e) => setBotanicalSpecs(e.target.value)}
            className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium"
          />
        </div>

        {/* Submit row */}
        <div className="flex justify-end gap-2 pt-3 border-t border-white/60">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-white/60 transition-colors font-bold cursor-pointer border border-transparent hover:border-white/60">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#831843] to-[#9f1239] hover:from-[#701a39] hover:to-[#881337] text-white font-bold shadow-md shadow-[#831843]/20 border border-white/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Generating Proposal...' : 'Create & Save Quotation'}
          </button>
        </div>
      </form>
    </div>
  );
};
