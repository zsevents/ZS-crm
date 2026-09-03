export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'LEAD_DESIGNER' | 'OPERATIONS_MANAGER' | 'SALES_COORDINATOR' | 'FINANCE_LEAD';
  avatarUrl?: string;
  title?: string;
  createdAt: string;
}

export interface AuthSession {
  user: User;
  token: string;
}

export interface ColorSwatch {
  name: string;
  hex: string;
}

export interface FloralStemItem {
  flowerName: string;
  quantity: string;
  color: string;
  seasonality: string;
  notes?: string;
}

export interface FloralTemplateCostItem {
  category: string;
  item: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface FloralTemplate {
  id: string; // e.g. "FT-ROYAL-JASMINE"
  name: string;
  subtitle: string;
  category: 'TRADITIONAL' | 'CONTEMPORARY' | 'CELESTIAL' | 'BOHEMIAN' | 'HERITAGE' | 'GARDEN' | 'CELEBRATION' | 'HIGH_GLAMOUR';
  vibe: string;
  basePrice: number;
  setupTimeHours: number;
  stemEstimate: number;
  colorPalette: ColorSwatch[];
  keyFlowers: string[];
  stemRecipe: FloralStemItem[];
  idealForVenues: string[];
  lightingPairing: string;
  fragranceProfile: string;
  inclusions: string[];
  fullDescription: string;
  tagline: string;
  badgeText: string;
  costBreakdown: FloralTemplateCostItem[];
}

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'MEETING'
  | 'QUOTATION'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST'
  | 'ON_HOLD';

export type LeadSource =
  | 'WEBSITE'
  | 'WHATSAPP'
  | 'INSTAGRAM'
  | 'REFERRAL'
  | 'WALK_IN'
  | 'PHONE'
  | 'PLANNER_PARTNER'
  | 'OTHER';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type LeadHealth = 'HOT' | 'WARM' | 'COLD' | 'AT_RISK';

export type FollowUpType =
  | 'CALL'
  | 'WHATSAPP'
  | 'EMAIL'
  | 'MEETING'
  | 'SITE_VISIT'
  | 'SEND_QUOTATION'
  | 'PAYMENT_REMINDER'
  | 'OTHER';

export type FollowUpStatus = 'DUE' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';

export type CommunicationType =
  | 'CALL'
  | 'WHATSAPP'
  | 'EMAIL'
  | 'MEETING'
  | 'NOTE'
  | 'FOLLOW_UP'
  | 'QUOTATION_SENT'
  | 'PAYMENT_DISCUSSION'
  | 'CLIENT_APPROVAL'
  | 'INTERNAL_NOTE'
  | 'STATUS_CHANGED'
  | 'CONVERTED_TO_PROJECT'
  | 'INQUIRY_RECEIVED'
  | 'MATERIAL_UPDATE';

export interface ActivityTimelineEntry {
  id: string;
  type: CommunicationType | string;
  description: string;
  createdBy: string;
  timestamp: string;
  outcome?: string;
  nextAction?: string;
  followUpDate?: string;
  metadata?: Record<string, any>;
}

// Backward compatibility alias
export type ActivityItem = ActivityTimelineEntry;

export interface Lead {
  id: string; // e.g. "LD-2026-00421"
  customerName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  location: string; // e.g. "Whitefield, Bangalore"
  city?: string;
  source: LeadSource;
  eventType: string; // e.g. "Wedding", "Engagement", "Corporate Event"
  eventDate: string; // YYYY-MM-DD
  venue?: string;
  expectedGuests?: number;
  serviceRequired: string;
  selectedTemplateId?: string;
  budget: number;
  estimatedProjectValue?: number;
  probability?: number; // 0 - 100
  leadScore?: number; // 0 - 100
  leadHealth?: LeadHealth;
  message?: string;
  additionalRequirements?: string;
  status: LeadStatus;
  assignedStaff: string;
  priority: PriorityLevel;
  createdAt: string;
  lastContacted?: string;
  nextFollowUpDate?: string;
  nextFollowUpTime?: string;
  nextFollowUpType?: FollowUpType;
  nextFollowUpNote?: string;
  nextFollowUpStatus?: FollowUpStatus;
  activities: ActivityTimelineEntry[];
  customerId?: string;
  convertedProjectId?: string;
}

export type ProjectStatus =
  | 'PLANNING'
  | 'IN_PROGRESS'
  | 'EVENT_DAY'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ON_HOLD';

export type MilestoneStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'DELAYED'
  | 'BLOCKED';

export interface Milestone {
  id: string;
  name: string;
  status: MilestoneStatus;
  startDate?: string;
  dueDate: string;
  completedDate?: string;
  responsiblePerson?: string;
  notes?: string;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  assignedTo: string;
  dueDate: string;
  status: TaskStatus;
}

export type DailyLogHealth = 'ON_TRACK' | 'ATTENTION_NEEDED' | 'DELAYED';

export interface DailyLog {
  id: string;
  projectId: string;
  date: string;
  updateText: string;
  projectStatus: DailyLogHealth;
  nextAction?: string;
  addedBy: string;
  createdAt: string;
}

export type ProcurementCategory =
  | 'FRESH_FLOWERS'
  | 'FOLIAGE'
  | 'IMPORTED_FLOWERS'
  | 'ARTIFICIAL_FLOWERS'
  | 'VASES_URNS'
  | 'STRUCTURES_FRAMES'
  | 'FABRIC_DRAPING'
  | 'CANDLES_LIGHTING'
  | 'ACCESSORIES'
  | 'PACKAGING'
  | 'OTHER';

export type ProcurementStatus =
  | 'REQUIRED'
  | 'QUOTED'
  | 'ORDERED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'SHORTAGE'
  | 'CANCELLED';

export interface ProcurementItem {
  id: string;
  projectId: string;
  item: string;
  category: ProcurementCategory;
  quantity: number;
  unit: string; // Stems, Bunches, Sets, Meters, Nos
  supplier?: string;
  estimatedCost: number;
  actualCost?: number;
  orderDate?: string;
  expectedArrival?: string;
  receivedDate?: string;
  status: ProcurementStatus;
  storageLocation?: string;
  notes?: string;
}

export type ChecklistSection =
  | 'PRE_EVENT'
  | 'TRANSPORT'
  | 'VENUE_ACCESS'
  | 'SETUP'
  | 'CLIENT_INSPECTION'
  | 'EVENT_LIVE'
  | 'DISMANTLING'
  | 'RETURN_CLOSURE';

export type ChecklistItemStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'ISSUE';

export interface EventChecklistItem {
  id: string;
  projectId: string;
  section: ChecklistSection;
  task: string;
  assignedTo: string;
  dueTime?: string;
  status: ChecklistItemStatus;
  notes?: string;
}

export type ProjectNoteCategory =
  | 'CLIENT'
  | 'FINANCE'
  | 'PROCUREMENT'
  | 'VENUE'
  | 'DESIGN'
  | 'INTERNAL'
  | 'URGENT';

export interface ProjectNote {
  id: string;
  projectId: string;
  category: ProjectNoteCategory;
  note: string;
  author: string;
  timestamp: string;
  isUrgent?: boolean;
}

export type FinancialHealth = 'PAID' | 'HEALTHY' | 'PAYMENT_DUE' | 'OVERDUE' | 'AT_RISK';

export interface Project {
  id: string; // e.g. "PRJ-2026-089"
  name: string;
  customerId: string;
  customerName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  leadId?: string;
  eventType: string;
  venue: string;
  eventDate: string; // YYYY-MM-DD
  setupDate?: string;
  setupTime?: string;
  dismantlingDate?: string;
  dismantlingTime?: string;
  projectValue: number;
  assignedStaff: string;
  crew?: string[];
  transport?: string;
  venueContact?: string;
  venuePhone?: string;
  parkingNotes?: string;
  accessRestrictions?: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  financialHealth?: FinancialHealth;
  currentMilestoneIndex: number;
  milestones: Milestone[];
  tasks: ProjectTask[];
  dailyLogs: DailyLog[];
  procurementItems?: ProcurementItem[];
  eventDayChecklist?: EventChecklistItem[];
  internalNotes?: ProjectNote[];
  totalInvoiced: number;
  totalReceived: number;
  outstandingBalance: number;
  serviceDescription?: string;
  selectedTemplateId?: string;
  notes?: string;
  createdAt: string;
}

export interface Customer {
  id: string; // e.g. "CUST-101"
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  location: string;
  city?: string;
  companyName?: string;
  gstNumber?: string;
  totalProjects: number;
  totalRevenue: number;
  totalOutstanding: number;
  createdAt: string;
  notes?: string;
  vipStatus?: boolean;
  leadIds: string[];
  projectIds: string[];
  activities?: ActivityTimelineEntry[];
}

export type InvoiceStatus =
  | 'DRAFT'
  | 'SENT'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED'
  | 'UNPAID';

export interface InvoiceItem {
  id: string;
  hsnSac?: string;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "ZSE-INV-2026-052"
  projectId?: string;
  projectName?: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerGstin?: string;
  invoiceDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  taxableAmount: number;
  taxRate: number; // e.g. 18 for GST
  isInterstate?: boolean;
  cgstRate?: number; // 9%
  cgstAmount?: number;
  sgstRate?: number; // 9%
  sgstAmount?: number;
  igstRate?: number; // 18%
  igstAmount?: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  balance: number;
  status: InvoiceStatus;
  hsnSacCode?: string;
  reverseCharge?: boolean;
  bankDetails?: {
    accountName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    upiId: string;
  };
  notes?: string;
  terms?: string;
  createdAt: string;
}

export type QuotationStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'NEGOTIATION' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface Quotation {
  id: string;
  quotationNumber: string; // e.g. "ZSE-QT-2026-0118"
  leadId?: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  eventType: string;
  eventDate: string;
  venue: string;
  templateId?: string;
  templateName?: string;
  quotationDate: string;
  validUntil: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  taxableAmount: number;
  taxRate: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  taxAmount: number;
  total: number;
  status: QuotationStatus;
  notes?: string;
  termsAndConditions: string[];
  preparedBy: string;
  createdAt: string;
}

export type PaymentMethod =
  | 'UPI'
  | 'BANK_TRANSFER'
  | 'Bank Transfer'
  | 'CASH'
  | 'Cash'
  | 'CARD'
  | 'Credit Card'
  | 'CHEQUE'
  | 'Cheque'
  | 'RTGS'
  | 'OTHER'
  | string;

export type PaymentStage = 'ADVANCE' | 'SECOND_PAYMENT' | 'FINAL_PAYMENT' | 'OTHER';

export interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  projectId?: string;
  projectName?: string;
  customerName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  paymentStage?: PaymentStage;
  referenceNumber?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface BusinessSettings {
  companyName: string;
  tagline: string;
  phone: string;
  email: string;
  website?: string;
  address: string;
  city: string;
  state: string;
  stateCode: string; // "29" for Karnataka
  gstNumber: string;
  enableGst: boolean;
  defaultTaxRate: number;
  hsnSacCode: string;
  panNumber?: string;
  bankName: string;
  bankAccountNo: string;
  bankIfsc: string;
  bankBranch: string;
  bankUpiId: string;
  currency: string;
  eventTypes: string[];
  bangaloreAreas: string[];
  staffMembers: string[];
}

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  companyName: 'ZS EVENTS',
  tagline: 'Luxury Floristry & Event Decor',
  phone: '+91 98450 99880',
  email: 'contact@zsevents.com',
  website: 'https://zsevents.com',
  address: 'Lavelle Road, Near UB City',
  city: 'Bangalore, Karnataka',
  state: 'Karnataka',
  stateCode: '29',
  gstNumber: '29AABCZ1234F1Z5',
  enableGst: true,
  defaultTaxRate: 18,
  hsnSacCode: '998599',
  panNumber: 'AABCZ1234F',
  bankName: 'HDFC Bank',
  bankAccountNo: '50200088991122',
  bankIfsc: 'HDFC0000140',
  bankBranch: 'Lavelle Road Branch',
  bankUpiId: 'zsevents@hdfcbank',
  currency: 'INR',
  eventTypes: [
    'Wedding',
    'Reception',
    'Haldi / Mehendi',
    'Sangeet Night',
    'Corporate Luxury Gala',
    'Birthday Gala',
    'Private Dinner / Soiree',
  ],
  bangaloreAreas: [
    'Whitefield, Bangalore',
    'Indiranagar, Bangalore',
    'Sadashivanagar, Bangalore',
    'Koramangala, Bangalore',
    'Palace Grounds, Bangalore',
    'MG Road / Lavelle Road',
    'JP Nagar / Jayanagar',
    'Hebbal / North Bangalore',
    'Electronic City',
    'Yelahanka',
    'Outstation / Destination',
  ],
  staffMembers: [
    'Syed (Lead Event Manager & Producer)',
    'Ananya R. (Senior Event Stylist)',
    'Vikram M. (Venue & Production Manager)',
    'Priya K. (Client Relationship Lead)',
    'Rahul S. (Logistics Coordinator)',
  ],
};

export interface DateConflict {
  date: string;
  projectCount: number;
  projects: { id: string; name: string; venue: string; eventType?: string }[];
}

export interface DashboardStats {
  newLeadsCount: number;
  activeLeadsCount: number;
  activeProjectsCount: number;
  totalRevenue: number;
  totalReceived: number;
  totalOutstanding: number;
  leadConversionRate: number;
  todaysFollowups: Lead[];
  overdueFollowupsCount?: number;
  hotLeadsCount?: number;
  pipelineValue?: number;
  upcomingEventsCount: number;
  conflictingDates: DateConflict[];
}
