import {
  Lead,
  Customer,
  Project,
  Invoice,
  Payment,
  BusinessSettings,
  DashboardStats,
  DailyLog,
  ProjectTask,
  DateConflict,
  User,
  AuthSession,
  FloralTemplate,
  Quotation,
} from '../types';
import { getSupabase, isSupabaseConfigured } from './supabaseClient';

// Every /api call carries the signed-in user's Supabase access token; the
// server rejects requests without one (see src/server/auth.ts).
async function authHeader(): Promise<Record<string, string>> {
  if (!isSupabaseConfigured()) return {};
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function safeFetchJson<T = any>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(await authHeader()),
      ...(init?.headers || {}),
    },
  });

  // Session revoked or expired beyond refresh: drop back to the login screen.
  if (response.status === 401 && isSupabaseConfigured()) {
    await getSupabase().auth.signOut();
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    if (text.trim().startsWith('<') || text.includes('<!DOCTYPE')) {
      throw new Error(`Server returned HTML response instead of JSON for ${input.toString()} (Status: ${response.status})`);
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Invalid non-JSON response from server: ${text.slice(0, 100)}`);
    }
  }

  const data = await response.json();
  return data;
}

export const api = {
  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const json = await safeFetchJson<{ success: boolean; data: DashboardStats; error?: string }>('/api/dashboard/stats');
    if (!json.success) throw new Error(json.error || 'Failed to fetch dashboard stats');
    return json.data;
  },

  async getConflicts(): Promise<DateConflict[]> {
    const json = await safeFetchJson<{ success: boolean; data: DateConflict[] }>('/api/dashboard/conflicts');
    if (!json.success) return [];
    return json.data || [];
  },

  // Leads
  async getLeads(filters?: { status?: string; eventType?: string; source?: string; search?: string }): Promise<Lead[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.eventType) params.set('eventType', filters.eventType);
    if (filters?.source) params.set('source', filters.source);
    if (filters?.search) params.set('search', filters.search);

    const json = await safeFetchJson<{ success: boolean; data: Lead[]; error?: string }>(`/api/leads?${params.toString()}`);
    if (!json.success) throw new Error(json.error || 'Failed to fetch leads');
    return json.data;
  },

  async deleteLead(id: string): Promise<boolean> {
    const json = await safeFetchJson<{ success: boolean; message?: string; error?: string }>(`/api/leads/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!json.success) throw new Error(json.error || 'Failed to delete lead');
    return true;
  },

  async getLead(id: string): Promise<Lead> {
    const json = await safeFetchJson<{ success: boolean; data: Lead; error?: string }>(`/api/leads/${id}`);
    if (!json.success) throw new Error(json.error || 'Failed to fetch lead');
    return json.data;
  },

  async createLead(payload: Partial<Lead> & { allowDuplicate?: boolean }): Promise<{ lead: Lead; customer: Customer; isNewCustomer: boolean }> {
    const json = await safeFetchJson<{ success: boolean; data: { lead: Lead; customer: Customer; isNewCustomer: boolean }; error?: string }>('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!json.success) throw new Error(json.error || 'Failed to create lead');
    return json.data;
  },

  async checkDuplicateLead(phone: string, customerName?: string): Promise<{ isDuplicate: boolean; customer: Customer | null; lead: Lead | null; message: string }> {
    const json = await safeFetchJson<{ success: boolean; data: { isDuplicate: boolean; customer: Customer | null; lead: Lead | null; message: string }; error?: string }>('/api/leads/check-duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, customerName }),
    });
    if (!json.success) throw new Error(json.error || 'Duplicate check failed');
    return json.data;
  },

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    const json = await safeFetchJson<{ success: boolean; data: Lead; error?: string }>(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!json.success) throw new Error(json.error || 'Failed to update lead');
    return json.data;
  },

  async addLeadActivity(id: string, description: string, type: string = 'NOTE'): Promise<{ lead: Lead }> {
    const json = await safeFetchJson<{ success: boolean; data: { lead: Lead }; error?: string }>(`/api/leads/${id}/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, description }),
    });
    if (!json.success) throw new Error(json.error || 'Failed to add activity');
    return json.data;
  },

  async scheduleFollowUp(leadId: string, nextFollowUpDate: string, notes?: string): Promise<Lead> {
    return this.updateLead(leadId, {
      nextFollowUpDate,
      nextFollowUpNote: notes,
      nextFollowUpStatus: 'DUE',
    });
  },

  async convertLeadToProject(leadId: string, overrides?: Partial<Project>): Promise<{ project: Project; customer?: Customer }> {
    const json = await safeFetchJson<{ success: boolean; data: { project: Project; customer?: Customer }; error?: string }>(`/api/leads/${leadId}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overrides }),
    });
    if (!json.success) throw new Error(json.error || 'Failed to convert lead to project');
    return json.data;
  },

  // Website Lead Intake
  async submitWebsiteInquiry(data: {
    name: string;
    phone: string;
    email?: string;
    location?: string;
    eventType?: string;
    eventDate?: string;
    service?: string;
    budget?: number;
    message?: string;
  }): Promise<{ success: boolean; leadId: string; status: string; message: string; duplicateWarning?: string; error?: string }> {
    const json = await safeFetchJson<{ success: boolean; leadId: string; status: string; message: string; duplicateWarning?: string; error?: string }>('/api/website-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!json.success) throw new Error(json.error || json.message || 'Inquiry submission failed');
    return json;
  },

  // Customers
  async getCustomers(search?: string): Promise<Customer[]> {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const json = await safeFetchJson<{ success: boolean; data: Customer[]; error?: string }>(`/api/customers?${params.toString()}`);
    if (!json.success) throw new Error(json.error || 'Failed to fetch customers');
    return json.data;
  },

  async getCustomerDetail(id: string): Promise<{ customer: Customer; leads: Lead[]; projects: Project[]; invoices: Invoice[] }> {
    const json = await safeFetchJson<{ success: boolean; data: { customer: Customer; leads: Lead[]; projects: Project[]; invoices: Invoice[] }; error?: string }>(`/api/customers/${id}`);
    if (!json.success) throw new Error(json.error || 'Failed to fetch customer detail');
    return json.data;
  },

  async createCustomer(payload: Partial<Customer>): Promise<Customer> {
    const json = await safeFetchJson<{ success: boolean; data: Customer; error?: string }>('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!json.success) throw new Error(json.error || 'Failed to create customer');
    return json.data;
  },

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const json = await safeFetchJson<{ success: boolean; data: Customer; error?: string }>(`/api/customers/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!json.success) throw new Error(json.error || 'Failed to update customer');
    return json.data;
  },

  async addCustomerNote(id: string, note: string, author: string = 'Admin'): Promise<Customer> {
    const json = await safeFetchJson<{ success: boolean; data: Customer; error?: string }>(`/api/customers/${encodeURIComponent(id)}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note, author }),
    });
    if (!json.success) throw new Error(json.error || 'Failed to add customer note');
    return json.data;
  },

  async deleteCustomer(id: string): Promise<boolean> {
    const json = await safeFetchJson<{ success: boolean; message?: string; error?: string }>(`/api/customers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!json.success) throw new Error(json.error || 'Failed to delete customer');
    return true;
  },

  // Projects
  async getProjects(filters?: { status?: string; eventType?: string; search?: string }): Promise<Project[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.eventType) params.set('eventType', filters.eventType);
    if (filters?.search) params.set('search', filters.search);

    const json = await safeFetchJson<{ success: boolean; data: Project[]; error?: string }>(`/api/projects?${params.toString()}`);
    if (!json.success) throw new Error(json.error || 'Failed to fetch projects');
    return json.data;
  },

  async deleteProject(id: string): Promise<boolean> {
    const json = await safeFetchJson<{ success: boolean; message?: string; error?: string }>(`/api/projects/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!json.success) throw new Error(json.error || 'Failed to delete project');
    return true;
  },

  async getProjectDetail(id: string): Promise<{ project: Project; invoices: Invoice[]; payments: Payment[] }> {
    const json = await safeFetchJson<{ success: boolean; data: { project: Project; invoices: Invoice[]; payments: Payment[] }; error?: string }>(`/api/projects/${id}`);
    if (!json.success) throw new Error(json.error || 'Failed to fetch project detail');
    return json.data;
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const json = await safeFetchJson<{ success: boolean; data: Project; error?: string }>(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!json.success) throw new Error(json.error || 'Failed to update project');
    return json.data;
  },

  async updateMilestone(
    projectId: string,
    mIndex: number,
    payload: { status?: string; notes?: string; completedDate?: string; name?: string; dueDate?: string; responsiblePerson?: string }
  ): Promise<Project> {
    const json = await safeFetchJson<{ success: boolean; data: Project; error?: string }>(`/api/projects/${projectId}/milestones/${mIndex}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!json.success) throw new Error(json.error || 'Failed to update milestone');
    return json.data;
  },

  async addCustomMilestone(
    projectId: string,
    payload: { name: string; status?: string; dueDate?: string; responsiblePerson?: string; notes?: string }
  ): Promise<Project> {
    const json = await safeFetchJson<{ success: boolean; data: Project; error?: string }>(`/api/projects/${projectId}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!json.success) throw new Error(json.error || 'Failed to add custom milestone');
    return json.data;
  },

  async deleteMilestone(projectId: string, mIndex: number): Promise<Project> {
    const json = await safeFetchJson<{ success: boolean; data: Project; error?: string }>(`/api/projects/${projectId}/milestones/${mIndex}`, {
      method: 'DELETE',
    });
    if (!json.success) throw new Error(json.error || 'Failed to delete milestone');
    return json.data;
  },

  async setProjectMilestones(projectId: string, milestones: any[], currentMilestoneIndex?: number): Promise<Project> {
    const json = await safeFetchJson<{ success: boolean; data: Project; error?: string }>(`/api/projects/${projectId}/milestones`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ milestones, currentMilestoneIndex }),
    });
    if (!json.success) throw new Error(json.error || 'Failed to update project milestones');
    return json.data;
  },

  async addDailyUpdate(projectId: string, payload: { updateText: string; projectStatus?: string; nextAction?: string; addedBy?: string }): Promise<DailyLog> {
    const json = await safeFetchJson<{ success: boolean; data: DailyLog; error?: string }>(`/api/projects/${projectId}/daily-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!json.success) throw new Error(json.error || 'Failed to add daily update');
    return json.data;
  },

  async addTask(projectId: string, payload: { title: string; assignedTo?: string; dueDate?: string }): Promise<ProjectTask> {
    const json = await safeFetchJson<{ success: boolean; data: ProjectTask; error?: string }>(`/api/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!json.success) throw new Error(json.error || 'Failed to add project task');
    return json.data;
  },

  async updateTask(projectId: string, taskId: string, updates: Partial<ProjectTask>): Promise<ProjectTask> {
    const json = await safeFetchJson<{ success: boolean; data: ProjectTask; error?: string }>(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!json.success) throw new Error(json.error || 'Failed to update project task');
    return json.data;
  },

  // Invoices & Payments
  async getInvoices(filters?: { status?: string; search?: string }): Promise<Invoice[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);

    const json = await safeFetchJson<{ success: boolean; data: Invoice[]; error?: string }>(`/api/invoices?${params.toString()}`);
    if (!json.success) throw new Error(json.error || 'Failed to fetch invoices');
    return json.data;
  },

  async createInvoice(payload: {
    projectId: string;
    dueDate: string;
    items: { description: string; quantity: number; unitPrice: number }[];
    discount?: number;
    taxRate?: number;
    notes?: string;
  }): Promise<Invoice> {
    const json = await safeFetchJson<{ success: boolean; data: Invoice; error?: string }>('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!json.success) throw new Error(json.error || 'Failed to create invoice');
    return json.data;
  },

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const json = await safeFetchJson<{ success: boolean; data: Invoice; error?: string }>(`/api/invoices/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!json.success) throw new Error(json.error || 'Failed to update invoice');
    return json.data;
  },

  async deleteInvoice(id: string): Promise<{ success: boolean }> {
    const json = await safeFetchJson<{ success: boolean; message?: string; error?: string }>(`/api/invoices/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!json.success) throw new Error(json.error || 'Failed to delete invoice');
    return { success: true };
  },

  async getPayments(): Promise<Payment[]> {
    const json = await safeFetchJson<{ success: boolean; data: Payment[]; error?: string }>('/api/payments');
    if (!json.success) throw new Error(json.error || 'Failed to fetch payments');
    return json.data;
  },

  async recordPayment(payload: {
    invoiceId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    referenceNumber?: string;
    notes?: string;
    createdBy?: string;
  }): Promise<{ payment: Payment; invoice: Invoice; project: Project | undefined }> {
    const json = await safeFetchJson<{ success: boolean; data: { payment: Payment; invoice: Invoice; project: Project | undefined }; error?: string }>('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!json.success) throw new Error(json.error || 'Failed to record payment');
    return json.data;
  },

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment> {
    const json = await safeFetchJson<{ success: boolean; data: Payment; error?: string }>(`/api/payments/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!json.success) throw new Error(json.error || 'Failed to update payment');
    return json.data;
  },

  async deletePayment(id: string): Promise<{ success: boolean }> {
    const json = await safeFetchJson<{ success: boolean; message?: string; error?: string }>(`/api/payments/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!json.success) throw new Error(json.error || 'Failed to delete payment');
    return { success: true };
  },

  // Floral Design Templates (Light & Attractive)
  async getFloralTemplates(): Promise<FloralTemplate[]> {
    const json = await safeFetchJson<{ success: boolean; data: FloralTemplate[]; error?: string }>('/api/templates');
    if (!json.success) throw new Error(json.error || 'Failed to fetch floral templates');
    return json.data;
  },

  async getFloralTemplate(id: string): Promise<FloralTemplate> {
    const json = await safeFetchJson<{ success: boolean; data: FloralTemplate; error?: string }>(`/api/templates/${id}`);
    if (!json.success) throw new Error(json.error || 'Failed to fetch floral template');
    return json.data;
  },

  // Quotations (Floral Proposals with GST & PDF Download)
  async getQuotations(filters?: { status?: string; search?: string }): Promise<Quotation[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);

    const json = await safeFetchJson<{ success: boolean; data: Quotation[]; error?: string }>(`/api/quotations?${params.toString()}`);
    if (!json.success) throw new Error(json.error || 'Failed to fetch quotations');
    return json.data;
  },

  async getQuotation(id: string): Promise<Quotation> {
    const json = await safeFetchJson<{ success: boolean; data: Quotation; error?: string }>(`/api/quotations/${id}`);
    if (!json.success) throw new Error(json.error || 'Failed to fetch quotation');
    return json.data;
  },

  async createQuotation(payload: any): Promise<Quotation> {
    const json = await safeFetchJson<{ success: boolean; data: Quotation; error?: string }>('/api/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!json.success) throw new Error(json.error || 'Failed to create quotation');
    return json.data;
  },

  async updateQuotation(id: string, updates: Partial<Quotation>): Promise<Quotation> {
    const json = await safeFetchJson<{ success: boolean; data: Quotation; error?: string }>(`/api/quotations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!json.success) throw new Error(json.error || 'Failed to update quotation');
    return json.data;
  },

  async deleteQuotation(id: string): Promise<boolean> {
    const json = await safeFetchJson<{ success: boolean; message: string; error?: string }>(`/api/quotations/${id}`, {
      method: 'DELETE',
    });
    if (!json.success) throw new Error(json.error || 'Failed to delete quotation');
    return true;
  },

  async convertQuotationToProject(id: string, overrides?: Partial<Project>): Promise<Project> {
    const json = await safeFetchJson<{ success: boolean; data: Project; error?: string }>(`/api/quotations/${id}/convert-to-project`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overrides }),
    });
    if (!json.success) throw new Error(json.error || 'Failed to convert quotation to project');
    return json.data;
  },

  // Project Procurement (Floral Wholesale & Materials)
  async addProcurementItem(projectId: string, item: any): Promise<any> {
    const json = await safeFetchJson<{ success: boolean; data: any; error?: string }>(`/api/projects/${projectId}/procurement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!json.success) throw new Error(json.error || 'Failed to add procurement item');
    return json.data;
  },

  async updateProcurementItem(projectId: string, itemId: string, updates: any): Promise<any> {
    const json = await safeFetchJson<{ success: boolean; data: any; error?: string }>(`/api/projects/${projectId}/procurement/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!json.success) throw new Error(json.error || 'Failed to update procurement item');
    return json.data;
  },

  async deleteProcurementItem(projectId: string, itemId: string): Promise<boolean> {
    const json = await safeFetchJson<{ success: boolean; message: string; error?: string }>(`/api/projects/${projectId}/procurement/${itemId}`, {
      method: 'DELETE',
    });
    if (!json.success) throw new Error(json.error || 'Failed to delete procurement item');
    return true;
  },

  // Project Checklist (Event Operations)
  async addChecklistItem(projectId: string, item: any): Promise<any> {
    const json = await safeFetchJson<{ success: boolean; data: any; error?: string }>(`/api/projects/${projectId}/checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!json.success) throw new Error(json.error || 'Failed to add checklist item');
    return json.data;
  },

  async updateChecklistItem(projectId: string, itemId: string, updates: any): Promise<any> {
    const json = await safeFetchJson<{ success: boolean; data: any; error?: string }>(`/api/projects/${projectId}/checklist/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!json.success) throw new Error(json.error || 'Failed to update checklist item');
    return json.data;
  },

  // Project Notes & Journal
  async addProjectNote(projectId: string, payload: { category: string; note: string; author?: string; isUrgent?: boolean }): Promise<any> {
    const json = await safeFetchJson<{ success: boolean; data: any; error?: string }>(`/api/projects/${projectId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!json.success) throw new Error(json.error || 'Failed to add project note');
    return json.data;
  },

  // Global Search
  async globalSearch(query: string): Promise<{
    leads: Lead[];
    projects: Project[];
    customers: Customer[];
    quotations: Quotation[];
    invoices: Invoice[];
  }> {
    if (!query.trim()) {
      return { leads: [], projects: [], customers: [], quotations: [], invoices: [] };
    }
    const json = await safeFetchJson<{ success: boolean; data: any; error?: string }>(`/api/search?q=${encodeURIComponent(query)}`);
    if (!json.success) return { leads: [], projects: [], customers: [], quotations: [], invoices: [] };
    return json.data;
  },

  // Calendar
  async getCalendarEvents(): Promise<any[]> {
    const json = await safeFetchJson<{ success: boolean; data: any[]; error?: string }>('/api/calendar/events');
    if (!json.success) throw new Error(json.error || 'Failed to fetch calendar events');
    return json.data;
  },

  // Settings
  async getSettings(): Promise<BusinessSettings> {
    const json = await safeFetchJson<{ success: boolean; data: BusinessSettings; error?: string }>('/api/settings');
    if (!json.success) throw new Error(json.error || 'Failed to fetch settings');
    return json.data;
  },

  async updateSettings(updates: Partial<BusinessSettings>): Promise<BusinessSettings> {
    const json = await safeFetchJson<{ success: boolean; data: BusinessSettings; error?: string }>('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!json.success) throw new Error(json.error || 'Failed to update settings');
    return json.data;
  },

  // AI Florist Assistant
  async getAiQuotationSuggestions(params: {
    eventType: string;
    theme?: string;
    budget?: number;
    location?: string;
    specialRequirements?: string;
  }): Promise<{
    themeName: string;
    palette: string[];
    suggestedItems: Array<{
      description: string;
      hsnSac: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      amount: number;
    }>;
    flowerList: string[];
    designNotes: string;
    estimatedLaborDays: number;
  }> {
    const json = await safeFetchJson<{ success: boolean; data: any; error?: string }>('/api/ai/quotation-suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!json.success) throw new Error(json.error || 'AI quotation suggestion failed');
    return json.data;
  },

  async generateAiWhatsAppDraft(params: {
    customerName: string;
    eventType: string;
    eventDate?: string;
    budget?: number;
    serviceRequired?: string;
    tone?: 'WARM' | 'LUXURY' | 'URGENT' | 'FOLLOW_UP';
  }): Promise<string> {
    const json = await safeFetchJson<{ success: boolean; data: { message: string }; error?: string }>('/api/ai/whatsapp-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!json.success) throw new Error(json.error || 'AI WhatsApp draft generation failed');
    return json.data.message;
  },
};
