import React, { useState } from 'react';
import {
  Receipt,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Download,
  CreditCard,
  Building2,
  Calendar,
  FileText,
  Percent,
  ChevronRight,
  Phone,
  Clock,
  Send,
  Trash2,
  Edit3,
  MessageSquare,
  DollarSign,
  MoreVertical,
  Check,
  X,
  Briefcase,
  ExternalLink,
} from 'lucide-react';
import { Invoice, Payment, Project, BusinessSettings, Quotation, Lead } from '../types';
import { formatINR, formatDate, formatDateTime, cleanPhoneNumber } from '../lib/formatters';
import { generateInvoicePDF, generateQuotationPDF } from '../utils/pdfGenerator';
import { api } from '../lib/api';
import { CustomerHoverDropdown } from './CustomerHoverDropdown';
import zsEventsLogo from '../assets/images/zs_events_logo_1788181982999.jpg';

interface FinanceViewProps {
  invoices?: Invoice[];
  payments?: Payment[];
  projects?: Project[];
  quotations?: Quotation[];
  leads?: Lead[];
  settings: BusinessSettings;
  onOpenNewInvoiceModal: (projectId?: string) => void;
  onOpenPaymentModal: (invoiceId?: string) => void;
  onOpenNewQuoteModal?: () => void;
  onQuotationUpdated?: () => void;
  onConvertToProject?: (leadId: string) => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  invoices = [],
  payments = [],
  projects = [],
  quotations = [],
  leads = [],
  settings,
  onOpenNewInvoiceModal,
  onOpenPaymentModal,
  onOpenNewQuoteModal,
  onQuotationUpdated,
  onConvertToProject,
}) => {
  const [activeFinanceTab, setActiveFinanceTab] = useState<'INVOICES' | 'QUOTATIONS' | 'PAYMENTS' | 'GST_SUMMARY'>('INVOICES');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(quotations[0] || null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [activeMenuInvoiceId, setActiveMenuInvoiceId] = useState<string | null>(null);

  // Quick edit modal states
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editDueDate, setEditDueDate] = useState('');
  const [editTotal, setEditTotal] = useState('');
  const [editPaidAmount, setEditPaidAmount] = useState('');
  const [editStatus, setEditStatus] = useState<string>('SENT');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Quick edit payment modal states
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editPayMethod, setEditPayMethod] = useState('UPI');
  const [editPayAmount, setEditPayAmount] = useState('');
  const [editPayDate, setEditPayDate] = useState('');
  const [editPayRef, setEditPayRef] = useState('');
  const [editPayNotes, setEditPayNotes] = useState('');
  const [isSavingPaymentEdit, setIsSavingPaymentEdit] = useState(false);

  // Financial summary metrics
  const totalInvoiced = invoices.reduce((sum, i) => sum + Number(i.total || 0), 0);
  const totalReceived = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalOutstanding = Math.max(0, totalInvoiced - totalReceived);
  const totalGstCollected = invoices.reduce((sum, i) => sum + Number(i.taxAmount || 0), 0);

  React.useEffect(() => {
    if (!selectedQuote && quotations.length > 0) {
      setSelectedQuote(quotations[0]);
    }
  }, [quotations, selectedQuote]);

  // Filtered Invoices (All Invoices shown, filtered strictly by search query)
  const filteredInvoices = invoices.filter((i) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        i.invoiceNumber.toLowerCase().includes(q) ||
        i.customerName.toLowerCase().includes(q) ||
        (i.projectName && i.projectName.toLowerCase().includes(q)) ||
        (i.customerPhone && i.customerPhone.includes(q))
      );
    }
    return true;
  });

  // Filtered Quotations (All Quotations shown, filtered strictly by search query)
  const filteredQuotations = quotations.filter((q) => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        q.quotationNumber.toLowerCase().includes(query) ||
        q.customerName.toLowerCase().includes(query) ||
        (q.eventType && q.eventType.toLowerCase().includes(query)) ||
        (q.venue && q.venue.toLowerCase().includes(query)) ||
        (q.customerPhone && q.customerPhone.includes(query))
      );
    }
    return true;
  });

  // Filtered Payments
  const filteredPayments = payments.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchedInv = invoices.find((i) => i.id === p.invoiceId);
      return (
        p.id.toLowerCase().includes(q) ||
        (p.customerName && p.customerName.toLowerCase().includes(q)) ||
        (p.paymentMethod && p.paymentMethod.toLowerCase().includes(q)) ||
        (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q)) ||
        (matchedInv && (matchedInv.invoiceNumber.toLowerCase().includes(q) || matchedInv.customerName.toLowerCase().includes(q)))
      );
    }
    return true;
  });

  // Status Change Handlers
  const handleInvoiceStatusChange = async (invoiceId: string, status: string) => {
    try {
      await api.updateInvoice(invoiceId, { status: status as any });
      if (onQuotationUpdated) onQuotationUpdated();
    } catch (err) {
      console.error('Invoice status update failed:', err);
    }
  };

  const handleInvoiceAmountPaidChange = async (invoiceId: string, amountPaid: number) => {
    try {
      const inv = invoices.find((i) => i.id === invoiceId);
      if (!inv) return;
      const total = inv.total || 0;
      const safePaid = Math.max(0, amountPaid);
      const balance = Math.max(0, total - safePaid);
      let status = inv.status;
      if (safePaid >= total && total > 0) {
        status = 'PAID';
      } else if (safePaid > 0) {
        status = 'PARTIALLY_PAID';
      } else {
        status = 'UNPAID';
      }
      await api.updateInvoice(invoiceId, { amountPaid: safePaid, balance, status });
      if (onQuotationUpdated) onQuotationUpdated();
    } catch (err) {
      console.error('Failed to update invoice payment amount:', err);
    }
  };

  const handleInvoiceTotalChange = async (invoiceId: string, total: number) => {
    try {
      const inv = invoices.find((i) => i.id === invoiceId);
      if (!inv) return;
      const safeTotal = Math.max(0, total);
      const amountPaid = inv.amountPaid || 0;
      const balance = Math.max(0, safeTotal - amountPaid);
      const taxableAmount = Math.round((safeTotal / 1.18) * 100) / 100;
      const taxAmount = Math.round((safeTotal - taxableAmount) * 100) / 100;
      await api.updateInvoice(invoiceId, { total: safeTotal, taxableAmount, taxAmount, balance });
      if (onQuotationUpdated) onQuotationUpdated();
    } catch (err) {
      console.error('Failed to update invoice total amount:', err);
    }
  };

  const handleInvoiceDueDateChange = async (invoiceId: string, newDueDate: string) => {
    try {
      await api.updateInvoice(invoiceId, { dueDate: newDueDate });
      if (onQuotationUpdated) onQuotationUpdated();
    } catch (err) {
      console.error('Due date update failed:', err);
    }
  };

  const handleQuoteStatusChange = async (quoteId: string, status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED') => {
    try {
      await api.updateQuotation(quoteId, { status });
      if (onQuotationUpdated) onQuotationUpdated();
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleQuoteDateChange = async (quoteId: string, eventDate: string) => {
    try {
      await api.updateQuotation(quoteId, { eventDate });
      if (onQuotationUpdated) onQuotationUpdated();
    } catch (err) {
      console.error('Event date update failed:', err);
    }
  };

  const handleQuoteTotalChange = async (quoteId: string, total: number) => {
    try {
      await api.updateQuotation(quoteId, { total });
      if (onQuotationUpdated) onQuotationUpdated();
    } catch (err) {
      console.error('Quotation total update failed:', err);
    }
  };

  const handleDeleteQuotation = async (quoteId: string) => {
    if (window.confirm(`Are you sure you want to delete this quotation?`)) {
      try {
        await api.deleteQuotation(quoteId);
        if (onQuotationUpdated) onQuotationUpdated();
      } catch (err) {
        console.error('Failed to delete quotation:', err);
      }
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (window.confirm(`Are you sure you want to delete invoice ${invoiceId}?`)) {
      try {
        await api.deleteInvoice(invoiceId);
        if (onQuotationUpdated) onQuotationUpdated();
      } catch (err) {
        console.error('Failed to delete invoice:', err);
      }
    }
  };

  // Payment Handlers
  const handlePaymentMethodChange = async (paymentId: string, method: string) => {
    try {
      await api.updatePayment(paymentId, { paymentMethod: method });
      if (onQuotationUpdated) onQuotationUpdated();
    } catch (err) {
      console.error('Failed to update payment method:', err);
    }
  };

  const handlePaymentDateChange = async (paymentId: string, paymentDate: string) => {
    try {
      await api.updatePayment(paymentId, { paymentDate });
      if (onQuotationUpdated) onQuotationUpdated();
    } catch (err) {
      console.error('Failed to update payment date:', err);
    }
  };

  const handlePaymentAmountChange = async (paymentId: string, amount: number) => {
    try {
      await api.updatePayment(paymentId, { amount });
      if (onQuotationUpdated) onQuotationUpdated();
    } catch (err) {
      console.error('Failed to update payment amount:', err);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (window.confirm(`Are you sure you want to delete this payment receipt?`)) {
      try {
        await api.deletePayment(paymentId);
        if (onQuotationUpdated) onQuotationUpdated();
      } catch (err) {
        console.error('Failed to delete payment:', err);
      }
    }
  };

  const handleOpenEditPaymentModal = (pay: Payment) => {
    setEditingPayment(pay);
    setEditPayMethod(pay.paymentMethod || 'UPI');
    setEditPayAmount(String(pay.amount || 0));
    setEditPayDate(pay.paymentDate ? pay.paymentDate.split('T')[0] : '');
    setEditPayRef(pay.referenceNumber || '');
    setEditPayNotes(pay.notes || '');
  };

  const handleSavePaymentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    setIsSavingPaymentEdit(true);
    try {
      await api.updatePayment(editingPayment.id, {
        paymentMethod: editPayMethod,
        amount: Number(editPayAmount) || editingPayment.amount,
        paymentDate: editPayDate || editingPayment.paymentDate,
        referenceNumber: editPayRef,
        notes: editPayNotes,
      });
      setEditingPayment(null);
      if (onQuotationUpdated) onQuotationUpdated();
    } catch (err) {
      console.error('Failed to save payment edits:', err);
    } finally {
      setIsSavingPaymentEdit(false);
    }
  };

  const handleWhatsAppPaymentReceipt = (pay: Payment) => {
    const matchedInv = invoices.find((i) => i.id === pay.invoiceId);
    const customerName = matchedInv?.customerName || pay.customerName || 'Valued Client';
    const text = `Namaste ${customerName}, this is from Z S EVENTS Bangalore.\n\nWe have received your payment of ${formatINR(
      pay.amount
    )} via ${pay.paymentMethod || 'UPI/Bank'}.\n• Receipt Ref: ${pay.id.slice(0, 12).toUpperCase()}\n• Date: ${formatDate(
      pay.paymentDate || pay.createdAt
    )}\n• Transaction ID: ${pay.referenceNumber || 'N/A'}\n\nThank you for choosing Z S EVENTS!`;
    const phone = cleanPhoneNumber(matchedInv?.customerPhone || '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleOpenEditModal = (inv: Invoice) => {
    setEditingInvoice(inv);
    setEditDueDate(inv.dueDate || '');
    setEditTotal(String(inv.total || 0));
    setEditPaidAmount(String(inv.amountPaid || 0));
    setEditStatus(inv.status || 'SENT');
    setEditNotes(inv.notes || '');
    setActiveMenuInvoiceId(null);
  };

  const handleSaveInvoiceEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;
    setIsSavingEdit(true);
    try {
      const numTotal = Number(editTotal) || editingInvoice.total;
      const numPaid = Number(editPaidAmount) || 0;
      await api.updateInvoice(editingInvoice.id, {
        dueDate: editDueDate || editingInvoice.dueDate,
        total: numTotal,
        amountPaid: numPaid,
        balance: Math.max(0, numTotal - numPaid),
        status: editStatus as any,
        notes: editNotes,
      });
      setEditingInvoice(null);
      if (onQuotationUpdated) onQuotationUpdated();
    } catch (err) {
      console.error('Failed to save invoice edits:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConvertQuotationToProject = async (quote: Quotation) => {
    try {
      const res = await api.convertQuotationToProject(quote.id);
      if (res && res.id) {
        if (onQuotationUpdated) onQuotationUpdated();
        if (onConvertToProject && quote.leadId) {
          onConvertToProject(quote.leadId);
        }
      }
    } catch (err: any) {
      console.error('Failed to convert quotation to project:', err);
    }
  };

  const handleDownloadInvoicePDF = (inv: Invoice) => {
    setIsGeneratingPdf(true);
    try {
      generateInvoicePDF(inv, settings);
    } catch (err) {
      console.error('Invoice PDF error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadQuotePDF = (quote: Quotation) => {
    setIsGeneratingPdf(true);
    try {
      generateQuotationPDF(quote, settings);
    } catch (err) {
      console.error('Quote PDF error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleWhatsAppInvoice = (inv: Invoice) => {
    const balance = Math.max(0, inv.total - (inv.amountPaid || 0));
    const text = `Namaste ${inv.customerName}, this is from Z S EVENTS Bangalore.\n\nHere is your Tax Invoice summary for ${inv.projectName}:\n• Invoice #: ${inv.invoiceNumber}\n• Total Amount: ${formatINR(inv.total)}\n• Amount Paid: ${formatINR(inv.amountPaid || 0)}\n• Balance Due: ${formatINR(balance)}\n• Due Date: ${formatDate(inv.dueDate)}\n\nBank Account: ${settings.bankName || 'HDFC Bank'}\nA/C No: ${settings.bankAccountNo || '50200088912344'}\nIFSC: ${settings.bankIfsc || 'HDFC0001234'}\nUPI ID: ${settings.bankUpiId || 'zsevents@hdfcbank'}\n\nThank you for choosing Z S EVENTS!`;
    const cleanPhone = cleanPhoneNumber(inv.customerPhone || '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'PARTIALLY_PAID':
        return 'bg-amber-100 text-amber-950 border-amber-300';
      case 'UNPAID':
      case 'PAYMENT_DUE':
        return 'bg-rose-100 text-rose-950 border-rose-300';
      case 'OVERDUE':
        return 'bg-red-100 text-red-950 border-red-300';
      case 'SENT':
      case 'ISSUED':
        return 'bg-blue-100 text-blue-950 border-blue-300';
      case 'DRAFT':
        return 'bg-slate-100 text-slate-900 border-slate-300';
      case 'CANCELLED':
        return 'bg-slate-200 text-slate-700 border-slate-400';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 pb-16 text-slate-900 selection:bg-rose-200">
      {/* 1. TOP SUSPENDED CAPSULE HEADER */}
      <div className="flex flex-col items-center justify-center pt-2">
        <div className="suspended-cable flex flex-col items-center">
          <div className="glass-header-pill px-8 py-2.5 flex items-center gap-3 shadow-xl hover:scale-102 transition-all">
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              Finance & GST
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
                Unified Finance & GST Hub
              </h2>
              <span className="text-xs px-3 py-1 rounded-full glass-subtle text-[#831843] font-bold border border-rose-200 shadow-xs">
                SAC 998599 • 18% GST Compliant
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1">
              Manage client payments, update invoice statuses, record receipts, and track GST in real time.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {onOpenNewQuoteModal && (
              <button
                type="button"
                id="btn-create-quote"
                onClick={onOpenNewQuoteModal}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl glass-card hover:bg-rose-50/80 border border-rose-200 text-[#831843] text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-102"
              >
                <FileText className="w-4 h-4 text-[#831843]" />
                <span>New Quotation</span>
              </button>
            )}

            <button
              type="button"
              id="btn-record-payment"
              onClick={() => onOpenPaymentModal()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl glass-card hover:bg-white/90 text-slate-900 text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-102"
            >
              <span className="font-extrabold text-emerald-700">₹</span>
              <span>Record Payment</span>
            </button>

            <button
              type="button"
              id="btn-create-invoice"
              onClick={() => onOpenNewInvoiceModal()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass-btn-primary text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#831843]/20 transition-all cursor-pointer hover:scale-102"
            >
              <Plus className="w-4 h-4" />
              <span>Create Tax Invoice</span>
            </button>
          </div>
        </div>

      {/* 4 Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-card shadow-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Invoiced
          </span>
          <div className="text-2xl font-black text-slate-950 mt-1">
            {formatINR(totalInvoiced)}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">{invoices.length} tax invoices generated</p>
        </div>

        <div className="p-5 rounded-2xl glass-card border-emerald-200/80 shadow-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            Total Received (Paid)
          </span>
          <div className="text-2xl font-black text-emerald-900 mt-1">
            {formatINR(totalReceived)}
          </div>
          <p className="text-xs text-emerald-700 font-medium mt-1">Collected via UPI & Bank NEFT</p>
        </div>

        <div className="p-5 rounded-2xl glass-card border-rose-200/80 shadow-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#831843]">
            Outstanding Balance
          </span>
          <div className="text-2xl font-black text-[#831843] mt-1">
            {formatINR(totalOutstanding)}
          </div>
          <p className="text-xs text-rose-800 font-medium mt-1">Pending payment collection</p>
        </div>

        <div className="p-5 rounded-2xl glass-card shadow-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            GST Collected (18%)
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatINR(totalGstCollected)}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">SAC 998599 (CGST+SGST)</p>
        </div>
      </div>

      {/* Unified Finance Sub-Tab Selector & Search Bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            type="button"
            id="tab-invoices"
            onClick={() => setActiveFinanceTab('INVOICES')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeFinanceTab === 'INVOICES'
                ? 'glass-btn-primary text-white shadow-md'
                : 'glass-subtle text-slate-700 hover:text-slate-950 hover:bg-white/80'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Tax Invoices ({invoices.length})</span>
          </button>

          <button
            type="button"
            id="tab-quotations"
            onClick={() => setActiveFinanceTab('QUOTATIONS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeFinanceTab === 'QUOTATIONS'
                ? 'glass-btn-primary text-white shadow-md'
                : 'glass-subtle text-slate-700 hover:text-slate-950 hover:bg-white/80'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Quotations & Proposals ({quotations.length})</span>
          </button>

          <button
            type="button"
            id="tab-payments"
            onClick={() => setActiveFinanceTab('PAYMENTS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeFinanceTab === 'PAYMENTS'
                ? 'glass-btn-primary text-white shadow-md'
                : 'glass-subtle text-slate-700 hover:text-slate-950 hover:bg-white/80'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payments Ledger ({payments.length})</span>
          </button>

          <button
            type="button"
            id="tab-gst-summary"
            onClick={() => setActiveFinanceTab('GST_SUMMARY')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeFinanceTab === 'GST_SUMMARY'
                ? 'glass-btn-primary text-white shadow-md'
                : 'glass-subtle text-slate-700 hover:text-slate-950 hover:bg-white/80'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>GST Compliance & Summary</span>
          </button>
        </div>

        {/* Global Search Bar */}
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoices, clients, proposals..."
            className="w-full pl-10 pr-3 py-2 glass-input rounded-xl text-xs text-slate-950 font-medium placeholder-slate-400 focus:outline-none focus:border-[#831843]"
          />
        </div>
      </div>

      {/* SUB-TAB 1: TAX INVOICES WITH INLINE STATUS & DATE DROPDOWNS */}
      {activeFinanceTab === 'INVOICES' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="glass-panel border-b border-white/60 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Invoice #</th>
                    <th className="py-3.5 px-4">Customer Details</th>
                    <th className="py-3.5 px-4">Project / Event</th>
                    <th className="py-3.5 px-4">Date & Due</th>
                    <th className="py-3.5 px-4 text-right">Taxable</th>
                    <th className="py-3.5 px-4 text-right">GST (18%)</th>
                    <th className="py-3.5 px-4 text-right">Total & Balance</th>
                    <th className="py-3.5 px-4 text-center">Payment Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/60 font-medium text-slate-800">
                  {filteredInvoices.length > 0 ? (
                    filteredInvoices.map((inv) => {
                      const balance = Math.max(0, inv.total - (inv.amountPaid || 0));
                      const isMenuOpen = activeMenuInvoiceId === inv.id;

                      return (
                        <tr key={inv.id} className="hover:bg-white/40 transition-colors">
                          {/* Invoice Number */}
                          <td className="py-3.5 px-4 font-mono font-bold text-[#831843]">
                            {inv.invoiceNumber}
                          </td>

                          {/* Customer Profile */}
                          <td className="py-3.5 px-4">
                            <CustomerHoverDropdown
                              customer={{
                                name: inv.customerName,
                                phone: inv.customerPhone || '',
                                email: inv.customerEmail,
                                location: inv.customerAddress,
                                totalSpend: inv.total,
                              }}
                            />
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {inv.customerPhone || 'Phone not set'}
                            </div>
                          </td>

                          {/* Project Name */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 truncate max-w-[180px]">
                              {inv.projectName}
                            </div>
                            <div className="text-[11px] text-slate-500">SAC: {inv.hsnSacCode || '998599'}</div>
                          </td>

                          {/* Date & Editable Due Date */}
                          <td className="py-3.5 px-4">
                            <div className="text-slate-700 font-medium">{formatDate(inv.invoiceDate || inv.createdAt)}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Due:</span>
                              <input
                                type="date"
                                value={inv.dueDate || ''}
                                onChange={(e) => handleInvoiceDueDateChange(inv.id, e.target.value)}
                                className="text-[11px] font-semibold text-slate-800 glass-input rounded px-1.5 py-0.5 focus:outline-none focus:border-[#831843] cursor-pointer"
                                title="Click to change Due Date"
                              />
                            </div>
                          </td>

                          {/* Taxable Value */}
                          <td className="py-3.5 px-4 text-right text-slate-700 font-semibold">
                            {formatINR(inv.taxableAmount || (inv.subtotal - (inv.discount || 0)))}
                          </td>

                          {/* GST */}
                          <td className="py-3.5 px-4 text-right text-slate-700 font-semibold">
                            {formatINR(inv.taxAmount || 0)}
                          </td>

                          {/* Total & Outstanding Balance / Editable Payment Amount & Pricing */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1 font-black text-slate-950 text-sm">
                              <span>₹</span>
                              <input
                                type="number"
                                defaultValue={inv.total}
                                onBlur={(e) => {
                                  const val = Number(e.target.value);
                                  if (!isNaN(val) && val >= 0 && val !== inv.total) {
                                    handleInvoiceTotalChange(inv.id, val);
                                  }
                                }}
                                className="w-24 text-right font-black text-slate-950 glass-input rounded px-1 py-0.5 text-xs focus:outline-none focus:border-[#831843]"
                                title="Click to edit Total Invoice Pricing (₹)"
                              />
                            </div>
                            <div className="flex items-center justify-end gap-1 text-[11px] text-slate-600 mt-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Paid: ₹</span>
                              <input
                                type="number"
                                defaultValue={inv.amountPaid || 0}
                                onBlur={(e) => {
                                  const val = Number(e.target.value);
                                  if (!isNaN(val) && val >= 0 && val !== inv.amountPaid) {
                                    handleInvoiceAmountPaidChange(inv.id, val);
                                  }
                                }}
                                className="w-20 text-right font-bold text-emerald-800 bg-emerald-50/60 hover:bg-white/90 border border-emerald-300 rounded px-1 py-0.5 text-xs focus:outline-none focus:border-emerald-600"
                                title="Click to edit Amount Paid by Customer (₹)"
                              />
                            </div>
                            {balance > 0 ? (
                              <div className="text-[10px] text-rose-700 font-bold mt-0.5">
                                Bal: {formatINR(balance)}
                              </div>
                            ) : (
                              <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                                Paid in Full ✓
                              </div>
                            )}
                          </td>

                          {/* Changeable Payment Status Dropdown for Every Customer */}
                          <td className="py-3.5 px-4 text-center">
                            <select
                              value={inv.status}
                              onChange={(e) => handleInvoiceStatusChange(inv.id, e.target.value)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer focus:outline-none ${getStatusBadgeStyle(
                                inv.status
                              )}`}
                            >
                              <option value="PAID">🟢 PAID</option>
                              <option value="PARTIALLY_PAID">🟡 PARTIALLY PAID</option>
                              <option value="UNPAID">🔴 UNPAID</option>
                              <option value="OVERDUE">🟠 OVERDUE</option>
                              <option value="SENT">🔵 ISSUED / SENT</option>
                              <option value="DRAFT">⚪ DRAFT</option>
                              <option value="CANCELLED">⚫ CANCELLED</option>
                            </select>
                          </td>

                          {/* Quick Actions Dropdown / Buttons */}
                          <td className="py-3.5 px-4 text-right relative">
                            <div className="flex items-center justify-end gap-1.5">
                              {balance > 0 && (
                                <button
                                  type="button"
                                  onClick={() => onOpenPaymentModal(inv.id)}
                                  title="Record Payment"
                                  className="px-2 py-1 rounded-lg bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-pointer text-xs font-bold transition-colors shadow-xs"
                                >
                                  + ₹ Pay
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleWhatsAppInvoice(inv)}
                                title="Share Invoice on WhatsApp"
                                className="p-1.5 rounded-lg bg-emerald-50/90 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer transition-colors"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDownloadInvoicePDF(inv)}
                                title="Download GST Tax Invoice PDF"
                                className="p-1.5 rounded-lg glass-subtle hover:bg-rose-50 text-slate-700 hover:text-[#831843] border border-white/60 cursor-pointer transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(inv)}
                                title="Edit Invoice Details & Amount"
                                className="p-1.5 rounded-lg glass-subtle hover:bg-white/80 text-slate-700 border border-white/60 cursor-pointer transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteInvoice(inv.id)}
                                title="Delete Invoice"
                                className="p-1.5 rounded-lg glass-subtle hover:bg-rose-100 text-slate-500 hover:text-rose-700 border border-white/60 cursor-pointer transition-colors"
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
                      <td colSpan={9} className="py-12 text-center text-slate-500 font-medium">
                        No invoices found. Click "Create Tax Invoice" to generate one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: QUOTATIONS & PROPOSALS */}
      {activeFinanceTab === 'QUOTATIONS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quotations List */}
            <div className="lg:col-span-2 space-y-3">
              {filteredQuotations.length > 0 ? (
                filteredQuotations.map((quote) => {
                  const isSelected = selectedQuote?.id === quote.id;
                  return (
                    <div
                      key={quote.id}
                      onClick={() => setSelectedQuote(quote)}
                      className={`p-4 rounded-2xl transition-all cursor-pointer glass-card ${
                        isSelected
                          ? 'border-[#831843] ring-2 ring-[#831843]/20 shadow-xl'
                          : 'hover:border-[#831843]/40 shadow-md hover:shadow-xl'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-[#831843] text-sm">
                              {quote.quotationNumber}
                            </span>

                            {/* In-line Changeable Status Dropdown for Quotations */}
                            <select
                              value={quote.status}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleQuoteStatusChange(quote.id, e.target.value as any)}
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${
                                quote.status === 'ACCEPTED'
                                  ? 'bg-emerald-100/90 text-emerald-800 border-emerald-200'
                                  : quote.status === 'SENT'
                                  ? 'bg-blue-100/90 text-blue-800 border-blue-200'
                                  : quote.status === 'REJECTED'
                                  ? 'bg-rose-100/90 text-rose-800 border-rose-200'
                                  : 'glass-subtle text-slate-800 border-white/60'
                              }`}
                            >
                              <option value="DRAFT">⚪ DRAFT</option>
                              <option value="SENT">🔵 SENT TO CLIENT</option>
                              <option value="ACCEPTED">🟢 ACCEPTED (WON)</option>
                              <option value="REJECTED">🔴 REJECTED</option>
                              <option value="EXPIRED">🟠 EXPIRED</option>
                            </select>

                            {quote.eventType && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-50/90 text-[#831843] border border-rose-100">
                                {quote.eventType}
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <CustomerHoverDropdown
                              customer={{
                                name: quote.customerName,
                                phone: quote.customerPhone,
                                email: quote.customerEmail,
                                location: quote.venue,
                                totalSpend: quote.total,
                              }}
                            />
                            {quote.venue && (
                              <span className="text-xs text-slate-500 flex items-center gap-1 truncate max-w-[200px]">
                                • {quote.venue}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Editable Event Date & Price */}
                        <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0">
                          <div className="text-base sm:text-lg font-black text-slate-950">
                            {formatINR(quote.total)}
                          </div>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[10px] text-slate-400 font-medium">Event:</span>
                            <input
                              type="date"
                              value={quote.eventDate ? quote.eventDate.split('T')[0] : ''}
                              onChange={(e) => handleQuoteDateChange(quote.id, e.target.value)}
                              className="text-[11px] font-semibold text-slate-700 glass-input rounded-md px-1.5 py-0.5 cursor-pointer focus:outline-none focus:border-[#831843]"
                            />
                          </div>
                          <div className="flex items-center gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleDownloadQuotePDF(quote)}
                              title="Download Quotation PDF"
                              className="p-1 rounded-md glass-subtle hover:bg-rose-50 text-slate-700 hover:text-[#831843] transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuotation(quote.id)}
                              title="Delete Quotation"
                              className="p-1 rounded-md glass-subtle hover:bg-rose-100 text-slate-500 hover:text-rose-700 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center glass-card rounded-2xl text-slate-500 font-medium">
                  No quotations found. Click "New Quotation" to create one.
                </div>
              )}
            </div>

            {/* Selected Quotation Drawer / Details */}
            <div className="glass-card rounded-2xl p-5 shadow-lg space-y-4">
              {selectedQuote ? (
                <>
                  <div className="flex items-center justify-between pb-3 border-b border-white/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-rose-200/80 shrink-0 bg-white shadow-xs p-0.5">
                        <img
                          src={zsEventsLogo}
                          alt="ZS Events Logo"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div>
                        <span className="font-mono text-xs font-bold text-[#831843]">
                          {selectedQuote.quotationNumber}
                        </span>
                        <h3 className="font-black text-slate-950 text-base mt-0.5">
                          {selectedQuote.customerName}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDownloadQuotePDF(selectedQuote)}
                        className="p-2 rounded-xl bg-rose-50/90 text-[#831843] hover:bg-[#831843] hover:text-white transition-colors cursor-pointer shadow-xs"
                        title="Download PDF Proposal"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-white/40">
                      <span className="text-slate-500 font-medium">Proposal Status:</span>
                      <select
                        value={selectedQuote.status}
                        onChange={(e) => handleQuoteStatusChange(selectedQuote.id, e.target.value as any)}
                        className="px-2 py-0.5 rounded font-bold text-xs glass-input text-slate-900 cursor-pointer"
                      >
                        <option value="DRAFT">⚪ DRAFT</option>
                        <option value="SENT">🔵 SENT TO CLIENT</option>
                        <option value="ACCEPTED">🟢 ACCEPTED (WON)</option>
                        <option value="REJECTED">🔴 REJECTED</option>
                        <option value="EXPIRED">🟠 EXPIRED</option>
                      </select>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-white/40">
                      <span className="text-slate-500 font-medium">Event Date:</span>
                      <input
                        type="date"
                        value={selectedQuote.eventDate ? selectedQuote.eventDate.split('T')[0] : ''}
                        onChange={(e) => handleQuoteDateChange(selectedQuote.id, e.target.value)}
                        className="font-bold text-slate-900 glass-input rounded px-2 py-0.5 text-xs cursor-pointer"
                      />
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/40">
                      <span className="text-slate-500 font-medium">Venue:</span>
                      <span className="font-semibold text-slate-900">{selectedQuote.venue || 'Bangalore'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-white/40">
                      <span className="text-slate-500 font-medium">Total Value:</span>
                      <span className="font-black text-[#831843] text-sm">{formatINR(selectedQuote.total)}</span>
                    </div>
                  </div>

                  {/* Items list preview */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Staging Elements ({selectedQuote.items?.length || 0})
                    </span>
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                      {selectedQuote.items?.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-xs py-1 border-b border-white/40">
                          <span className="text-slate-800 font-medium truncate max-w-[170px]">
                            {it.quantity}x {it.description}
                          </span>
                          <span className="font-semibold text-slate-950 shrink-0">
                            {formatINR(it.quantity * it.unitPrice)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-white/60 flex flex-col gap-2">
                    <button
                      onClick={() => handleDownloadQuotePDF(selectedQuote)}
                      className="w-full py-2 px-3 rounded-xl glass-btn-primary text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer hover:scale-102"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF Proposal</span>
                    </button>

                    {selectedQuote.status !== 'ACCEPTED' && (
                      <button
                        onClick={() => handleQuoteStatusChange(selectedQuote.id, 'ACCEPTED')}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Mark as Accepted by Client</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleConvertQuotationToProject(selectedQuote)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-rose-300" />
                      <span>Convert Proposal to Active Project</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Select a quotation from the list to preview details.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PAYMENTS LEDGER */}
      {activeFinanceTab === 'PAYMENTS' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="glass-panel border-b border-white/60 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Receipt #</th>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Invoice / Customer</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4">Transaction / Ref ID</th>
                    <th className="py-3.5 px-4 text-right">Amount Received</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/60 font-medium text-slate-800">
                  {filteredPayments.length > 0 ? (
                    filteredPayments.map((p) => {
                      const matchedInv = invoices.find((i) => i.id === p.invoiceId);
                      return (
                        <tr key={p.id} className="hover:bg-white/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#831843]">
                            {p.id.slice(0, 12).toUpperCase()}
                          </td>
                          
                          {/* Editable Date & Time Picker */}
                          <td className="py-3.5 px-4">
                            <input
                              type="date"
                              value={p.paymentDate ? p.paymentDate.split('T')[0] : ''}
                              onChange={(e) => handlePaymentDateChange(p.id, e.target.value)}
                              className="text-xs text-slate-700 font-semibold glass-input rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:border-[#831843]"
                            />
                          </td>

                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            {matchedInv ? (
                              <div className="flex items-center gap-1.5">
                                <CustomerHoverDropdown
                                  customer={{
                                    name: matchedInv.customerName,
                                    phone: matchedInv.customerPhone,
                                    email: matchedInv.customerEmail,
                                    location: matchedInv.projectName,
                                    totalSpend: matchedInv.total,
                                  }}
                                />
                                <span className="font-mono text-[11px] text-[#831843]">({matchedInv.invoiceNumber})</span>
                              </div>
                            ) : (
                              <div>
                                <span>{p.customerName || 'Direct Booking'}</span>
                                <div className="text-[10px] text-slate-400">Advance Deposit</div>
                              </div>
                            )}
                          </td>

                          {/* Editable Payment Method Dropdown */}
                          <td className="py-3.5 px-4">
                            <select
                              value={p.paymentMethod || 'UPI'}
                              onChange={(e) => handlePaymentMethodChange(p.id, e.target.value)}
                              className="px-2 py-1 rounded-lg glass-input text-slate-900 font-bold cursor-pointer text-xs focus:outline-none focus:border-[#831843]"
                            >
                              <option value="UPI">📱 UPI / QR</option>
                              <option value="Bank Transfer">🏦 Bank Transfer / NEFT</option>
                              <option value="Credit Card">💳 Credit Card</option>
                              <option value="Cash">💵 Cash</option>
                              <option value="Cheque">📄 Cheque</option>
                              <option value="RTGS">🏛️ RTGS</option>
                            </select>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-slate-500">
                            {p.referenceNumber || 'N/A'}
                          </td>

                          {/* Editable / Formatted Amount Received */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <span className="font-bold text-emerald-800 text-xs">₹</span>
                              <input
                                type="number"
                                defaultValue={p.amount}
                                onBlur={(e) => {
                                  const val = Number(e.target.value);
                                  if (!isNaN(val) && val >= 0 && val !== p.amount) {
                                    handlePaymentAmountChange(p.id, val);
                                  }
                                }}
                                className="w-24 text-right font-black text-emerald-950 bg-emerald-50/60 hover:bg-white/90 border border-emerald-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-emerald-700"
                                title="Click to edit Received Payment Amount (₹)"
                              />
                            </div>
                          </td>

                          {/* Payment Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleWhatsAppPaymentReceipt(p)}
                                title="Send WhatsApp Payment Receipt"
                                className="p-1.5 rounded-lg bg-emerald-50/90 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditPaymentModal(p)}
                                title="Edit Payment Record"
                                className="p-1.5 rounded-lg glass-subtle hover:bg-white/80 text-slate-700 border border-white/60 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePayment(p.id)}
                                title="Delete Payment"
                                className="p-1.5 rounded-lg glass-subtle hover:bg-rose-100 text-slate-500 hover:text-rose-700 border border-white/60 transition-colors cursor-pointer"
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
                      <td colSpan={7} className="py-10 text-center text-slate-500 font-medium">
                        No payments recorded yet. Click "Record Payment" to log a bank or UPI transaction.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: GST TAX COMPLIANCE & SUMMARY */}
      {activeFinanceTab === 'GST_SUMMARY' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl glass-card shadow-md space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                GST Identification Number (GSTIN)
              </span>
              <div className="font-mono text-lg font-black text-[#831843]">
                {settings.gstNumber || '29AABCZ1234F1Z5'}
              </div>
              <p className="text-xs text-slate-500">State: Karnataka (Code: 29)</p>
            </div>

            <div className="p-5 rounded-2xl glass-card shadow-md space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Services Accounting Code (SAC)
              </span>
              <div className="font-mono text-lg font-black text-slate-900">
                {settings.hsnSacCode || '998599'}
              </div>
              <p className="text-xs text-slate-500">Event Decor, Flower Staging & Floristry</p>
            </div>

            <div className="p-5 rounded-2xl glass-card shadow-md space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Default GST Tax Rate
              </span>
              <div className="text-lg font-black text-emerald-800">
                18% (9% CGST + 9% SGST)
              </div>
              <p className="text-xs text-slate-500">Standard GST rate for Event Production</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl glass-card shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border border-rose-200/90 shrink-0 bg-white shadow-md p-0.5">
                <img
                  src={zsEventsLogo}
                  alt="ZS Events Logo"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <div>
                <h3 className="font-bold text-slate-950 text-sm">Official Bank Account & UPI Settlement</h3>
                <p className="text-xs text-slate-500 font-medium">ZS Events Bangalore • Where Every Celebration Blooms</p>
              </div>
            </div>
            <div className="w-full md:w-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs flex-1 md:ml-4">
              <div className="p-3 glass-subtle rounded-xl border border-white/60">
                <span className="text-slate-500 block mb-0.5">Bank Name</span>
                <span className="font-bold text-slate-900">{settings.bankName || 'HDFC Bank'}</span>
              </div>
              <div className="p-3 glass-subtle rounded-xl border border-white/60">
                <span className="text-slate-500 block mb-0.5">Account Number</span>
                <span className="font-mono font-bold text-slate-900">{settings.bankAccountNo || '50200088912344'}</span>
              </div>
              <div className="p-3 glass-subtle rounded-xl border border-white/60">
                <span className="text-slate-500 block mb-0.5">IFSC Code</span>
                <span className="font-mono font-bold text-slate-900">{settings.bankIfsc || 'HDFC0001234'}</span>
              </div>
              <div className="p-3 glass-subtle rounded-xl border border-white/60">
                <span className="text-slate-500 block mb-0.5">UPI ID</span>
                <span className="font-mono font-bold text-[#831843]">{settings.bankUpiId || 'zsevents@hdfcbank'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* QUICK EDIT INVOICE MODAL */}
      {editingInvoice && (
        <div className="fixed inset-0 bg-slate-950/40 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="glass-modal rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-white/80">
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <div>
                <h3 className="font-black text-slate-950 text-base">Edit Invoice Details</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{editingInvoice.invoiceNumber}</p>
              </div>
              <button
                onClick={() => setEditingInvoice(null)}
                className="p-1.5 rounded-full hover:bg-white/40 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoiceEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Customer / Project</label>
                <input
                  type="text"
                  disabled
                  value={`${editingInvoice.customerName} - ${editingInvoice.projectName}`}
                  className="w-full px-3 py-2 glass-subtle border border-white/60 rounded-xl text-slate-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Payment Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 glass-input rounded-xl text-slate-900 font-bold focus:outline-none focus:border-[#831843]"
                  >
                    <option value="PAID">PAID</option>
                    <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                    <option value="UNPAID">UNPAID</option>
                    <option value="OVERDUE">OVERDUE</option>
                    <option value="SENT">ISSUED / SENT</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Due Date</label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full px-3 py-2 glass-input rounded-xl text-slate-900 font-medium focus:outline-none focus:border-[#831843]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Total Amount (₹)</label>
                  <input
                    type="number"
                    value={editTotal}
                    onChange={(e) => setEditTotal(e.target.value)}
                    className="w-full px-3 py-2 glass-input rounded-xl text-slate-900 font-bold focus:outline-none focus:border-[#831843]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Amount Paid (₹)</label>
                  <input
                    type="number"
                    value={editPaidAmount}
                    onChange={(e) => setEditPaidAmount(e.target.value)}
                    className="w-full px-3 py-2 glass-input rounded-xl text-slate-900 font-bold focus:outline-none focus:border-[#831843]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Notes / Terms</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 glass-input rounded-xl text-slate-900 font-medium focus:outline-none focus:border-[#831843]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/60">
                <button
                  type="button"
                  onClick={() => setEditingInvoice(null)}
                  className="px-4 py-2 rounded-xl glass-subtle hover:bg-white/60 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-xl glass-btn-primary text-white font-bold shadow-md shadow-[#831843]/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK EDIT PAYMENT MODAL */}
      {editingPayment && (
        <div className="fixed inset-0 bg-slate-950/40 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="glass-modal rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-white/80">
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <div>
                <h3 className="font-black text-slate-950 text-base">Edit Payment Receipt</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{editingPayment.id.slice(0, 14).toUpperCase()}</p>
              </div>
              <button
                onClick={() => setEditingPayment(null)}
                className="p-1.5 rounded-full hover:bg-white/40 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePaymentEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Payment Method</label>
                  <select
                    value={editPayMethod}
                    onChange={(e) => setEditPayMethod(e.target.value)}
                    className="w-full px-3 py-2 glass-input rounded-xl text-slate-900 font-bold focus:outline-none focus:border-[#831843]"
                  >
                    <option value="UPI">📱 UPI / QR</option>
                    <option value="Bank Transfer">🏦 Bank Transfer / NEFT</option>
                    <option value="Credit Card">💳 Credit Card</option>
                    <option value="Cash">💵 Cash</option>
                    <option value="Cheque">📄 Cheque</option>
                    <option value="RTGS">🏛️ RTGS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={editPayDate}
                    onChange={(e) => setEditPayDate(e.target.value)}
                    className="w-full px-3 py-2 glass-input rounded-xl text-slate-900 font-medium focus:outline-none focus:border-[#831843]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Amount Received (₹)</label>
                <input
                  type="number"
                  value={editPayAmount}
                  onChange={(e) => setEditPayAmount(e.target.value)}
                  className="w-full px-3 py-2 glass-input rounded-xl text-slate-900 font-black text-sm focus:outline-none focus:border-[#831843]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Transaction / Reference ID</label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref / Bank UTR Number"
                  value={editPayRef}
                  onChange={(e) => setEditPayRef(e.target.value)}
                  className="w-full px-3 py-2 glass-input rounded-xl text-slate-900 font-mono focus:outline-none focus:border-[#831843]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={editPayNotes}
                  onChange={(e) => setEditPayNotes(e.target.value)}
                  className="w-full px-3 py-2 glass-input rounded-xl text-slate-900 font-medium focus:outline-none focus:border-[#831843]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/60">
                <button
                  type="button"
                  onClick={() => setEditingPayment(null)}
                  className="px-4 py-2 rounded-xl glass-subtle hover:bg-white/60 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPaymentEdit}
                  className="px-5 py-2 rounded-xl glass-btn-primary text-white font-bold shadow-md shadow-[#831843]/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingPaymentEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
