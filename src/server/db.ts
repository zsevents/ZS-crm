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
  Milestone,
  ActivityItem,
  User,
  Quotation,
  FloralTemplate,
  ProcurementItem,
  EventChecklistItem,
  ProjectNote,
  LeadHealth,
} from '../types.js';
import { FLORAL_TEMPLATES } from './templatesData.js';

export const FLORIST_16_MILESTONES = [
  'Brief & Moodboard',
  'Quotation & Contract',
  'Advance Booking Payment',
  'Client Design Approval',
  'Detailed Floral Design & Recipes',
  'Wholesale Stem Procurement',
  'Cold Chain Flower Sourcing',
  'Materials & Props Fabrication',
  'Studio Floral Production',
  'Logistics & Venue Transport',
  'On-Site Venue Setup & Styling',
  'Final Master Florist Inspection',
  'Event Live & Fresh Touchups',
  'Midnight Dismantling & Teardown',
  'Props Return & Wastage Audit',
  'Final Settlement & Closure',
];

export function calculateLeadMetrics(lead: Partial<Lead>): {
  score: number;
  health: LeadHealth;
  probability: number;
  estimatedValue: number;
} {
  let score = 30; // base score

  // 1. Budget weight
  const b = Number(lead.budget) || 0;
  if (b >= 250000) score += 25;
  else if (b >= 100000) score += 20;
  else if (b >= 50000) score += 15;
  else score += 5;

  // 2. Date proximity weight
  if (lead.eventDate) {
    const today = new Date();
    const eventD = new Date(lead.eventDate);
    const diffDays = (eventD.getTime() - today.getTime()) / (1000 * 3600 * 24);
    if (diffDays >= 0 && diffDays <= 21) score += 25;
    else if (diffDays > 21 && diffDays <= 60) score += 20;
    else if (diffDays > 60 && diffDays <= 120) score += 15;
    else if (diffDays > 120) score += 10;
  }

  // 3. Status progression weight
  if (lead.status === 'WON') score = 100;
  else if (lead.status === 'NEGOTIATION') score += 20;
  else if (lead.status === 'QUOTATION') score += 15;
  else if (lead.status === 'QUALIFIED' || lead.status === 'MEETING') score += 10;
  else if (lead.status === 'CONTACTED') score += 5;

  // 4. Source weight
  if (lead.source === 'REFERRAL' || lead.source === 'PLANNER_PARTNER') score += 15;
  else if (lead.source === 'WHATSAPP' || lead.source === 'WEBSITE') score += 10;
  else if (lead.source === 'INSTAGRAM') score += 5;

  // Priority bonus
  if (lead.priority === 'URGENT') score += 15;
  else if (lead.priority === 'HIGH') score += 10;

  // Bound score
  score = Math.min(lead.status === 'WON' ? 100 : 99, Math.max(10, score));

  // Determine health
  let health: LeadHealth = 'WARM';
  if (lead.status === 'LOST' || lead.status === 'ON_HOLD') {
    health = 'COLD';
  } else if (lead.nextFollowUpStatus === 'OVERDUE') {
    health = 'AT_RISK';
  } else if (score >= 70 || lead.priority === 'HIGH' || lead.priority === 'URGENT' || lead.status === 'QUOTATION' || lead.status === 'NEGOTIATION') {
    health = 'HOT';
  } else if (score >= 45) {
    health = 'WARM';
  } else {
    health = 'COLD';
  }

  // Probability
  let probability = Math.round(score * 0.9);
  if (lead.status === 'WON') probability = 100;
  if (lead.status === 'LOST') probability = 0;

  const estimatedValue = Math.round((b * probability) / 100);

  return { score, health, probability, estimatedValue };
}

class FloristDatabase {
  public users: (User & { passwordHash: string })[] = [];
  public templates: FloralTemplate[] = FLORAL_TEMPLATES;
  public quotations: Quotation[] = [];
  public leads: Lead[] = [];
  public customers: Customer[] = [];
  public projects: Project[] = [];
  public invoices: Invoice[] = [];
  public payments: Payment[] = [];
  public settings: BusinessSettings = {
    companyName: 'Z S EVENTS',
    tagline: 'Luxury Floristry & Grand Event Decor, Bangalore',
    phone: '+91 98450 99880',
    email: 'contact@zsevents.com',
    website: 'https://zsevents.com',
    address: 'Villa 8, Lavelle Road, Shanthala Nagar',
    city: 'Bangalore, Karnataka 560001',
    state: 'Karnataka',
    stateCode: '29',
    gstNumber: '29AABCZ1234F1Z5',
    enableGst: true,
    defaultTaxRate: 18,
    hsnSacCode: '998599',
    panNumber: 'AABCZ1234F',
    bankName: 'HDFC Bank Ltd',
    bankAccountNo: '50200088991122',
    bankIfsc: 'HDFC0000140',
    bankBranch: 'Lavelle Road Branch, Bangalore',
    bankUpiId: 'zsevents@hdfcbank',
    currency: 'INR',
    eventTypes: [
      'Wedding',
      'Engagement',
      'Reception',
      'Haldi / Mehendi',
      'Sangeet Night',
      'Birthday Gala',
      'Anniversary Celebration',
      'Corporate Luxury Gala',
      'Baby Shower',
      'Housewarming & Pooja',
      'Floral Mandap Installation',
      'Other Luxury Event',
    ],
    bangaloreAreas: [
      'Lavelle Road, Bangalore',
      'Indiranagar, Bangalore',
      'Sadashivanagar, Bangalore',
      'Whitefield, Bangalore',
      'Koramangala, Bangalore',
      'Palace Grounds / Bellary Rd, Bangalore',
      'Jayanagar, Bangalore',
      'JP Nagar, Bangalore',
      'HSR Layout, Bangalore',
      'MG Road / Central, Bangalore',
      'Yelahanka, Bangalore',
      'Hebbal, Bangalore',
      'Electronic City, Bangalore',
      'Sarjapur Road, Bangalore',
      'Kanakapura Road, Bangalore',
    ],
    staffMembers: [
      'Zaid Sheikh (Founder & Creative Director)',
      'Pooja Hegde (Lead Floral Designer)',
      'Kiran Kumar (Logistics & Production Lead)',
      'Aisha Khan (Client Relations & Proposals)',
      'Rohit Nambiar (Senior Floral Sculptor)',
    ],
  };

  private leadCounter = 426;
  private customerCounter = 105;
  private projectCounter = 92;
  private quotationCounter = 121;
  private invoiceCounter = 54;
  private paymentCounter = 118;

  constructor() {
    this.seedInitialData();
  }

  /**
   * Move every ID counter past the highest ID already stored.
   *
   * Counters live in memory and start from fixed seed values, so a fresh
   * serverless instance would re-issue an ID that already exists in Postgres
   * and the upsert would silently overwrite that record. Called after every
   * hydrate so the next ID is always max(existing) + 1.
   */
  public syncCountersFromData(): void {
    const next = (items: { id: string }[], current: number) => {
      let max = current - 1;
      for (const item of items) {
        const m = /(\d+)$/.exec(item.id ?? '');
        if (m) max = Math.max(max, Number(m[1]));
      }
      return max + 1;
    };
    this.leadCounter = next(this.leads, this.leadCounter);
    this.customerCounter = next(this.customers, this.customerCounter);
    this.projectCounter = next(this.projects, this.projectCounter);
    this.quotationCounter = next(this.quotations, this.quotationCounter);
    this.invoiceCounter = next(this.invoices, this.invoiceCounter);
    this.paymentCounter = next(this.payments, this.paymentCounter);
  }

  public generate16Milestones(projectId: string, eventDate: string, responsiblePerson: string): Milestone[] {
    return FLORIST_16_MILESTONES.map((name, idx) => {
      let status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' = 'NOT_STARTED';
      if (idx === 0) status = 'COMPLETED';
      else if (idx === 1) status = 'COMPLETED';
      else if (idx === 2) status = 'IN_PROGRESS';

      return {
        id: `ms-${projectId}-${idx + 1}`,
        name,
        status,
        dueDate: eventDate,
        responsiblePerson: idx % 2 === 0 ? responsiblePerson : 'Pooja Hegde',
        notes: `Stage ${idx + 1}: ${name}`,
      };
    });
  }

  private seedInitialData() {
    // 1. Initial Customers
    this.customers = [
      {
        id: 'CUST-101',
        name: 'Priya Sharma',
        phone: '+91 98860 11223',
        whatsapp: '+91 98860 11223',
        email: 'priya.sharma@example.com',
        location: 'Whitefield, Bangalore',
        city: 'Bangalore',
        totalProjects: 1,
        totalRevenue: 150000,
        totalOutstanding: 75000,
        createdAt: '2026-08-10T10:30:00Z',
        notes: 'Prefers pastel roses, baby breath, and minimal brass traditional accents.',
        leadIds: ['LD-2026-00421'],
        projectIds: ['PRJ-2026-089'],
      },
      {
        id: 'CUST-102',
        name: 'Ananya Rao',
        phone: '+91 99001 44556',
        whatsapp: '+91 99001 44556',
        email: 'ananya.rao@example.com',
        location: 'Sadashivanagar, Bangalore',
        city: 'Bangalore',
        totalProjects: 0,
        totalRevenue: 0,
        totalOutstanding: 0,
        createdAt: '2026-08-15T14:15:00Z',
        notes: 'Grand South Indian traditional engagement with jasmine, tuberoses, and marigold canopy.',
        leadIds: ['LD-2026-00423'],
        projectIds: [],
      },
      {
        id: 'CUST-103',
        name: 'Vikram Reddy',
        phone: '+91 98451 99887',
        whatsapp: '+91 98451 99887',
        email: 'vikram.reddy@techcorp.in',
        companyName: 'TechCorp India Pvt Ltd',
        location: 'Lavelle Road, Bangalore',
        city: 'Bangalore',
        totalProjects: 1,
        totalRevenue: 310000,
        totalOutstanding: 160000,
        createdAt: '2026-08-12T09:00:00Z',
        notes: 'Corporate Annual Tech Gala floral centerpieces and VIP stage backdrop.',
        leadIds: ['LD-2026-00424'],
        projectIds: ['PRJ-2026-091'],
      },
      {
        id: 'CUST-104',
        name: 'Kavita Sundaram',
        phone: '+91 97400 33221',
        whatsapp: '+91 97400 33221',
        email: 'kavita.s@example.com',
        location: 'Jayanagar, Bangalore',
        city: 'Bangalore',
        totalProjects: 1,
        totalRevenue: 220000,
        totalOutstanding: 40000,
        createdAt: '2026-07-28T11:00:00Z',
        notes: '25th Silver Jubilee reception at The Tamarind Tree.',
        leadIds: [],
        projectIds: ['PRJ-2026-090'],
      },
    ];

    // 2. Initial Leads
    const rawLeads: Partial<Lead>[] = [
      {
        id: 'LD-2026-00421',
        customerName: 'Priya Sharma',
        phone: '+91 98860 11223',
        whatsapp: '+91 98860 11223',
        email: 'priya.sharma@example.com',
        location: 'Whitefield, Bangalore',
        city: 'Bangalore',
        source: 'WEBSITE',
        eventType: 'Wedding',
        eventDate: '2026-10-18',
        venue: 'The Leela Palace, Old Airport Rd, Bangalore',
        expectedGuests: 450,
        serviceRequired: 'Wedding Floral Stage, Mandap & Grand Entrance',
        budget: 150000,
        message: 'Need elegant stage floral arch, matching aisle flowers, and grand entry gate setup.',
        additionalRequirements: 'White dutch roses, hydrangeas, eucalyptus, and baby breath.',
        status: 'WON',
        assignedStaff: 'Zaid Sheikh (Founder & Creative Director)',
        priority: 'HIGH',
        createdAt: '2026-08-10T10:30:00Z',
        lastContacted: '2026-08-20T16:00:00Z',
        nextFollowUpDate: '2026-08-25',
        nextFollowUpTime: '11:00 AM',
        nextFollowUpType: 'SITE_VISIT',
        nextFollowUpNote: 'Site inspection with venue coordinator at The Leela Palace',
        nextFollowUpStatus: 'DUE',
        customerId: 'CUST-101',
        convertedProjectId: 'PRJ-2026-089',
        activities: [
          {
            id: 'act-101',
            type: 'INQUIRY_RECEIVED',
            description: 'Website inquiry received from Priya Sharma for Wedding on 18 Oct 2026.',
            createdBy: 'Website API',
            timestamp: '2026-08-10T10:30:00Z',
          },
          {
            id: 'act-102',
            type: 'CALL',
            description: 'Called Priya Sharma. Discussed pastel theme, mandap dimensions, and stage backdrop lighting.',
            createdBy: 'Zaid Sheikh',
            timestamp: '2026-08-10T14:45:00Z',
          },
          {
            id: 'act-103',
            type: 'QUOTATION_SENT',
            description: 'Quotation of ₹1,50,000 sent via WhatsApp with moodboard sketches.',
            createdBy: 'Pooja Hegde',
            timestamp: '2026-08-12T11:20:00Z',
          },
          {
            id: 'act-104',
            type: 'CONVERTED_TO_PROJECT',
            description: 'Customer confirmed order with 50% advance. Converted to Project PRJ-2026-089.',
            createdBy: 'Zaid Sheikh',
            timestamp: '2026-08-14T17:30:00Z',
          },
        ],
      },
      {
        id: 'LD-2026-00422',
        customerName: 'Rahul Mehta',
        phone: '+91 98450 77665',
        whatsapp: '+91 98450 77665',
        email: 'rahul.mehta@startup.io',
        location: 'Indiranagar, Bangalore',
        city: 'Bangalore',
        source: 'WHATSAPP',
        eventType: 'Birthday',
        eventDate: '2026-09-02',
        venue: 'Toit Rooftop / Private Residence, Indiranagar',
        expectedGuests: 60,
        serviceRequired: '40th Birthday Tropical Botanical Floral Backdrop & Table runners',
        budget: 45000,
        message: 'Looking for modern monstera leaves, birds of paradise, and neon signage frame.',
        status: 'CONTACTED',
        assignedStaff: 'Pooja Hegde (Lead Floral Designer)',
        priority: 'MEDIUM',
        createdAt: '2026-08-21T09:15:00Z',
        lastContacted: '2026-08-21T15:30:00Z',
        nextFollowUpDate: new Date().toISOString().split('T')[0],
        nextFollowUpTime: '03:00 PM',
        nextFollowUpType: 'CALL',
        nextFollowUpNote: 'Send tropical moodboard & neon custom quote options to Rahul on WhatsApp',
        nextFollowUpStatus: 'DUE',
        activities: [
          {
            id: 'act-201',
            type: 'INQUIRY_RECEIVED',
            description: 'Direct WhatsApp inquiry received from Rahul Mehta.',
            createdBy: 'Aisha Khan',
            timestamp: '2026-08-21T09:15:00Z',
          },
          {
            id: 'act-202',
            type: 'CALL',
            description: 'Initial consultation call with client.',
            createdBy: 'Pooja Hegde',
            timestamp: '2026-08-21T15:30:00Z',
          },
        ],
      },
      {
        id: 'LD-2026-00423',
        customerName: 'Ananya Rao',
        phone: '+91 99001 44556',
        whatsapp: '+91 99001 44556',
        email: 'ananya.rao@example.com',
        location: 'Sadashivanagar, Bangalore',
        city: 'Bangalore',
        source: 'REFERRAL',
        eventType: 'Engagement',
        eventDate: '2026-09-28',
        venue: 'Palace Grounds (Sheesh Mahal), Bellary Rd, Bangalore',
        expectedGuests: 600,
        serviceRequired: 'Traditional Jasmine & Pink Lotus Grand Mandap Installation',
        budget: 280000,
        message: 'Grand South Indian traditional engagement with jasmine, tuberoses, and marigold canopy.',
        status: 'QUOTATION',
        assignedStaff: 'Pooja Hegde (Lead Floral Designer)',
        priority: 'HIGH',
        createdAt: '2026-08-15T14:15:00Z',
        lastContacted: '2026-08-19T17:00:00Z',
        nextFollowUpDate: new Date().toISOString().split('T')[0],
        nextFollowUpTime: '04:30 PM',
        nextFollowUpType: 'CALL',
        nextFollowUpNote: 'Follow-up on proposal ZSE-QT-2026-0119 sent with Madurai Mogra specs',
        nextFollowUpStatus: 'DUE',
        customerId: 'CUST-102',
        activities: [
          {
            id: 'act-301',
            type: 'INQUIRY_RECEIVED',
            description: 'Referral inquiry received from Ananya Rao (Referred by Taj West End).',
            createdBy: 'Zaid Sheikh',
            timestamp: '2026-08-15T14:15:00Z',
          },
          {
            id: 'act-302',
            type: 'MEETING',
            description: 'In-person meeting at Studio with Ananya and family. Selected Royal Jasmine & Mogra theme.',
            createdBy: 'Pooja Hegde',
            timestamp: '2026-08-16T15:00:00Z',
          },
          {
            id: 'act-303',
            type: 'QUOTATION_SENT',
            description: 'Formal quotation ZSE-QT-2026-0119 generated for ₹3,65,800 incl. GST.',
            createdBy: 'Pooja Hegde',
            timestamp: '2026-08-16T16:30:00Z',
          },
        ],
      },
      {
        id: 'LD-2026-00424',
        customerName: 'Vikram Reddy',
        phone: '+91 98451 99887',
        whatsapp: '+91 98451 99887',
        email: 'vikram.reddy@techcorp.in',
        location: 'Lavelle Road, Bangalore',
        city: 'Bangalore',
        source: 'PLANNER_PARTNER',
        eventType: 'Corporate Event',
        eventDate: '2026-09-12',
        venue: 'Sheraton Grand, Whitefield, Bangalore',
        expectedGuests: 350,
        serviceRequired: 'Contemporary Botanical Photo Wall, 30 Centerpieces, and VIP Stage Framing',
        budget: 310000,
        message: 'Corporate Annual Tech Gala floral centerpieces and VIP stage backdrop.',
        status: 'WON',
        assignedStaff: 'Rohit Nambiar (Senior Floral Sculptor)',
        priority: 'HIGH',
        createdAt: '2026-08-12T09:00:00Z',
        lastContacted: '2026-08-18T14:00:00Z',
        nextFollowUpDate: '2026-08-26',
        nextFollowUpTime: '02:00 PM',
        nextFollowUpType: 'MEETING',
        nextFollowUpNote: 'Site walkthrough with Sheraton banquet team & audio-visual crew',
        nextFollowUpStatus: 'DUE',
        customerId: 'CUST-103',
        convertedProjectId: 'PRJ-2026-091',
        activities: [
          {
            id: 'act-401',
            type: 'INQUIRY_RECEIVED',
            description: 'Inquiry received via Wedding Planner Partner for TechCorp Leadership Gala.',
            createdBy: 'Aisha Khan',
            timestamp: '2026-08-12T09:00:00Z',
          },
          {
            id: 'act-402',
            type: 'QUOTATION_SENT',
            description: 'Proposal ZSE-QT-2026-0120 (₹4,01,200) submitted.',
            createdBy: 'Zaid Sheikh',
            timestamp: '2026-08-19T10:00:00Z',
          },
          {
            id: 'act-403',
            type: 'CONVERTED_TO_PROJECT',
            description: 'PO issued. Converted to Project PRJ-2026-091.',
            createdBy: 'Rohit Nambiar',
            timestamp: '2026-08-18T14:00:00Z',
          },
        ],
      },
      {
        id: 'LD-2026-00425',
        customerName: 'Meera Iyer',
        phone: '+91 97412 88990',
        whatsapp: '+91 97412 88990',
        email: 'meera.iyer@gmail.com',
        location: 'Koramangala, Bangalore',
        city: 'Bangalore',
        source: 'WEBSITE',
        eventType: 'Haldi / Mehendi',
        eventDate: '2026-10-05',
        venue: 'JW Marriott, Vittal Mallya Rd, Bangalore',
        expectedGuests: 180,
        serviceRequired: 'Marigold Sunshine Canopy, Floral Swing & Brass Urli Photo-op',
        budget: 95000,
        message: 'Looking for rich yellow and orange marigolds with pink bougainvillea contrast.',
        status: 'NEW',
        assignedStaff: 'Aisha Khan (Client Relations & Proposals)',
        priority: 'URGENT',
        createdAt: new Date().toISOString(),
        nextFollowUpDate: new Date().toISOString().split('T')[0],
        nextFollowUpTime: '11:30 AM',
        nextFollowUpType: 'CALL',
        nextFollowUpNote: 'New inbound lead: call immediately to qualify dates & flower preferences',
        nextFollowUpStatus: 'DUE',
        activities: [
          {
            id: 'act-501',
            type: 'INQUIRY_RECEIVED',
            description: 'Website inquiry received from Meera Iyer for Haldi / Mehendi on 5 Oct 2026.',
            createdBy: 'Website API',
            timestamp: new Date().toISOString(),
          },
        ],
      },
    ];

    // Compute metrics for all initial leads
    this.leads = rawLeads.map((l) => {
      const metrics = calculateLeadMetrics(l);
      return {
        ...l,
        leadScore: metrics.score,
        leadHealth: metrics.health,
        probability: metrics.probability,
        estimatedProjectValue: metrics.estimatedValue,
      } as Lead;
    });

    // 3. Initial Projects
    this.projects = [
      {
        id: 'PRJ-2026-089',
        name: 'Priya Sharma — Royal Pastel Wedding Floral Decor',
        customerId: 'CUST-101',
        customerName: 'Priya Sharma',
        phone: '+91 98860 11223',
        whatsapp: '+91 98860 11223',
        email: 'priya.sharma@example.com',
        leadId: 'LD-2026-00421',
        eventType: 'Wedding',
        venue: 'The Leela Palace, Old Airport Rd, Bangalore',
        eventDate: '2026-10-18',
        setupDate: '2026-10-18',
        setupTime: '04:00 AM',
        dismantlingDate: '2026-10-19',
        dismantlingTime: '01:00 AM',
        projectValue: 150000,
        assignedStaff: 'Zaid Sheikh (Founder & Creative Director)',
        crew: ['Pooja Hegde', 'Kiran Kumar', '4 Floral Assistants'],
        transport: 'Tata 407 Refrig. Truck (KA-01-AB-1290)',
        venueContact: 'Mr. Arvind (Banquet Sales, Leela Palace)',
        venuePhone: '+91 80 2521 1234',
        parkingNotes: 'Loading bay 2 near service elevator. Security clearance needed.',
        accessRestrictions: 'Noise restrictions after 11 PM. Floral misting water source in pantry.',
        startDate: '2026-08-14',
        endDate: '2026-10-19',
        status: 'PLANNING',
        financialHealth: 'HEALTHY',
        currentMilestoneIndex: 4, // Detailed Floral Design
        serviceDescription: 'Bespoke pastel stage backdrop, hydraulic floral entry arch, 12 walkway floral pillars, and bride-groom seating floral canopy.',
        notes: 'Vendor for fresh Ooty roses confirmed. Venue setup slot starts at 4:00 AM on 18 Oct.',
        createdAt: '2026-08-14T17:30:00Z',
        totalInvoiced: 150000,
        totalReceived: 75000,
        outstandingBalance: 75000,
        milestones: this.generate16Milestones('PRJ-2026-089', '2026-10-18', 'Zaid Sheikh'),
        procurementItems: [
          {
            id: 'proc-89-1',
            projectId: 'PRJ-2026-089',
            item: 'Avalanche White Dutch Roses',
            category: 'FRESH_FLOWERS',
            quantity: 1200,
            unit: 'Stems',
            supplier: 'Ooty Bloom Wholesale Growers',
            estimatedCost: 28000,
            actualCost: 27500,
            status: 'ORDERED',
            orderDate: '2026-08-20',
            expectedArrival: '2026-10-17',
            storageLocation: 'Cold Room A (4°C)',
            notes: 'Grade-A long stem blooms',
          },
          {
            id: 'proc-89-2',
            projectId: 'PRJ-2026-089',
            item: 'Eucalyptus Cinerea Foliage Bunches',
            category: 'FOLIAGE',
            quantity: 60,
            unit: 'Bunches',
            supplier: 'Hosur Botanical Greens',
            estimatedCost: 7500,
            status: 'ORDERED',
            expectedArrival: '2026-10-17',
            storageLocation: 'Water Trough B',
            notes: 'Freshly cut morning foliage',
          },
          {
            id: 'proc-89-3',
            projectId: 'PRJ-2026-089',
            item: 'Custom Arched Wooden Stage Truss Frame',
            category: 'STRUCTURES_FRAMES',
            quantity: 1,
            unit: 'Set',
            supplier: 'Studio Workshop',
            estimatedCost: 15000,
            actualCost: 14000,
            status: 'RECEIVED',
            receivedDate: '2026-08-22',
            storageLocation: 'Warehouse Bay 3',
            notes: 'Load tested and painted matte gold',
          },
        ],
        eventDayChecklist: [
          { id: 'chk-89-1', projectId: 'PRJ-2026-089', section: 'PRE_EVENT', task: 'Inspect cold room stems & condition blooms with flower food', assignedTo: 'Pooja Hegde', dueTime: '03:00 AM', status: 'TODO' },
          { id: 'chk-89-2', projectId: 'PRJ-2026-089', section: 'TRANSPORT', task: 'Load temperature-controlled truck with floral foam blocks and urns', assignedTo: 'Kiran Kumar', dueTime: '03:30 AM', status: 'TODO' },
          { id: 'chk-89-3', projectId: 'PRJ-2026-089', section: 'VENUE_ACCESS', task: 'Clear security gate and position scaffolding at Grand Ballroom', assignedTo: 'Kiran Kumar', dueTime: '04:15 AM', status: 'TODO' },
          { id: 'chk-89-4', projectId: 'PRJ-2026-089', section: 'SETUP', task: 'Assemble 36ft curved botanical stage arch and install hydrangeas', assignedTo: 'Pooja Hegde', dueTime: '08:00 AM', status: 'TODO' },
          { id: 'chk-89-5', projectId: 'PRJ-2026-089', section: 'CLIENT_INSPECTION', task: 'Conduct walkthrough with client & venue manager for final sign-off', assignedTo: 'Zaid Sheikh', dueTime: '09:30 AM', status: 'TODO' },
          { id: 'chk-89-6', projectId: 'PRJ-2026-089', section: 'DISMANTLING', task: 'Teardown floral stage, retrieve brass urns, and pack trucks', assignedTo: 'Kiran Kumar', dueTime: '01:00 AM', status: 'TODO' },
        ],
        internalNotes: [
          {
            id: 'pnote-89-1',
            projectId: 'PRJ-2026-089',
            category: 'CLIENT',
            note: 'Bride requested extra baby breath accents on the VIP aisle chairs.',
            author: 'Zaid Sheikh',
            timestamp: '2026-08-16T12:00:00Z',
          },
          {
            id: 'pnote-89-2',
            projectId: 'PRJ-2026-089',
            category: 'PROCUREMENT',
            note: 'Ooty supplier confirmed all 1200 white avalanche roses reserved under order #OT-9982.',
            author: 'Pooja Hegde',
            timestamp: '2026-08-20T16:00:00Z',
          },
        ],
        tasks: [
          { id: 'tsk-1', projectId: 'PRJ-2026-089', title: 'Confirm final flower quantity with Hosur grower', assignedTo: 'Pooja Hegde', dueDate: '2026-08-28', status: 'IN_PROGRESS' },
          { id: 'tsk-2', projectId: 'PRJ-2026-089', title: 'Stage 3D structural render approval from client', assignedTo: 'Pooja Hegde', dueDate: '2026-08-24', status: 'DONE' },
          { id: 'tsk-3', projectId: 'PRJ-2026-089', title: 'Arrange transport truck and cold storage crates', assignedTo: 'Kiran Kumar', dueDate: '2026-10-15', status: 'TODO' },
        ],
        dailyLogs: [
          {
            id: 'dlg-89-1',
            projectId: 'PRJ-2026-089',
            date: '2026-08-20',
            updateText: 'Customer confirmed stage 3D render. Approved blush pink palette with gold accents.',
            projectStatus: 'ON_TRACK',
            nextAction: 'Contact Hosur and Ooty growers for wholesale stem pre-booking.',
            addedBy: 'Zaid Sheikh',
            createdAt: '2026-08-20T17:00:00Z',
          },
        ],
      },
      {
        id: 'PRJ-2026-090',
        name: 'Kavita Sundaram — Silver Jubilee Tropical Floral Celebration',
        customerId: 'CUST-104',
        customerName: 'Kavita Sundaram',
        phone: '+91 97400 33221',
        whatsapp: '+91 97400 33221',
        email: 'kavita.s@example.com',
        eventType: 'Anniversary',
        venue: 'The Tamarind Tree, Kanakapura Road, Bangalore',
        eventDate: '2026-09-05',
        setupDate: '2026-09-05',
        setupTime: '06:00 AM',
        dismantlingDate: '2026-09-06',
        dismantlingTime: '02:00 AM',
        projectValue: 220000,
        assignedStaff: 'Pooja Hegde (Lead Floral Designer)',
        crew: ['Kiran Kumar', 'Rohit Nambiar', '6 Floral Stylists'],
        transport: 'Studio Eicher 14ft Van',
        venueContact: 'Front Desk / Events Manager, Tamarind Tree',
        venuePhone: '+91 80 2843 5555',
        startDate: '2026-08-01',
        endDate: '2026-09-06',
        status: 'IN_PROGRESS',
        financialHealth: 'HEALTHY',
        currentMilestoneIndex: 8, // Studio Production
        serviceDescription: 'Rustic garden floral archways, hanging floral chandelier under tamarind boughs, fairy light floral canopy, and 20 table arrangements.',
        notes: 'Outdoor rustic lawn setup. Rain contingency canopy on standby.',
        createdAt: '2026-08-01T10:00:00Z',
        totalInvoiced: 220000,
        totalReceived: 180000,
        outstandingBalance: 40000,
        milestones: this.generate16Milestones('PRJ-2026-090', '2026-09-05', 'Pooja Hegde'),
        procurementItems: [
          {
            id: 'proc-90-1',
            projectId: 'PRJ-2026-090',
            item: 'Birds of Paradise & Anthuriums',
            category: 'FRESH_FLOWERS',
            quantity: 350,
            unit: 'Stems',
            supplier: 'Coorg Exotic Flora',
            estimatedCost: 32000,
            actualCost: 31000,
            status: 'RECEIVED',
            receivedDate: '2026-08-20',
            storageLocation: 'Studio Main Floor',
            notes: 'Conditioned and trimmed for floral chandeliers',
          },
        ],
        eventDayChecklist: [
          { id: 'chk-90-1', projectId: 'PRJ-2026-090', section: 'PRE_EVENT', task: 'Check weather forecast for Kanakapura Rd outdoor lawn', assignedTo: 'Kiran Kumar', dueTime: '05:00 AM', status: 'DONE' },
          { id: 'chk-90-2', projectId: 'PRJ-2026-090', section: 'SETUP', task: 'Hoist hanging floral chandeliers onto ancient tamarind boughs', assignedTo: 'Rohit Nambiar', dueTime: '10:00 AM', status: 'IN_PROGRESS' },
        ],
        internalNotes: [
          {
            id: 'pnote-90-1',
            projectId: 'PRJ-2026-090',
            category: 'VENUE',
            note: 'Tamarind Tree lawn has wet soil from yesterday rains. Use wooden planks under heavy brass stands.',
            author: 'Kiran Kumar',
            timestamp: '2026-08-21T08:00:00Z',
            isUrgent: true,
          },
        ],
        tasks: [
          { id: 'tsk-90-1', projectId: 'PRJ-2026-090', title: 'Assemble 20 table brass urn centerpieces', assignedTo: 'Pooja Hegde', dueDate: '2026-09-03', status: 'IN_PROGRESS' },
        ],
        dailyLogs: [
          {
            id: 'dlg-90-1',
            projectId: 'PRJ-2026-090',
            date: '2026-08-21',
            updateText: 'Floral chandelier wire frames welded and load-tested for hanging boughs.',
            projectStatus: 'ON_TRACK',
            nextAction: 'Soak floral foam blocks and prep foliage base.',
            addedBy: 'Kiran Kumar',
            createdAt: '2026-08-21T14:30:00Z',
          },
        ],
      },
      {
        id: 'PRJ-2026-091',
        name: 'TechCorp India — Annual Floral Leadership Gala',
        customerId: 'CUST-103',
        customerName: 'Vikram Reddy',
        phone: '+91 98451 99887',
        whatsapp: '+91 98451 99887',
        email: 'vikram.reddy@techcorp.in',
        leadId: 'LD-2026-00424',
        eventType: 'Corporate Event',
        venue: 'Sheraton Grand, Whitefield, Bangalore',
        eventDate: '2026-09-12',
        setupDate: '2026-09-12',
        setupTime: '07:00 AM',
        dismantlingDate: '2026-09-13',
        dismantlingTime: '01:30 AM',
        projectValue: 310000,
        assignedStaff: 'Rohit Nambiar (Senior Floral Sculptor)',
        crew: ['Vikram M.', 'Pooja Hegde', '5 Technical Crew'],
        transport: 'Dedicated Studio Freight Truck',
        venueContact: 'Mr. Pradeep (Events Operations, Sheraton)',
        venuePhone: '+91 80 4252 1000',
        startDate: '2026-08-18',
        endDate: '2026-09-13',
        status: 'PLANNING',
        financialHealth: 'HEALTHY',
        currentMilestoneIndex: 5, // Procurement
        serviceDescription: 'Contemporary geometric corporate centerpieces, branded floral photo wall with preserved moss and live orchids.',
        notes: 'Requires corporate GST invoice on TechCorp India legal entity.',
        createdAt: '2026-08-18T14:00:00Z',
        totalInvoiced: 310000,
        totalReceived: 150000,
        outstandingBalance: 160000,
        milestones: this.generate16Milestones('PRJ-2026-091', '2026-09-12', 'Rohit Nambiar'),
        procurementItems: [
          {
            id: 'proc-91-1',
            projectId: 'PRJ-2026-091',
            item: 'Blue Dendrobium & White Phalaenopsis Orchids',
            category: 'IMPORTED_FLOWERS',
            quantity: 400,
            unit: 'Stems',
            supplier: 'Bangalore Flora Imports Hub',
            estimatedCost: 45000,
            status: 'ORDERED',
            expectedArrival: '2026-09-10',
            storageLocation: 'Cold Room B',
            notes: 'High grade Thai imported orchids',
          },
          {
            id: 'proc-91-2',
            projectId: 'PRJ-2026-091',
            item: 'Preserved Nordic Forest Green Moss Panels',
            category: 'ACCESSORIES',
            quantity: 8,
            unit: 'Sets',
            supplier: 'GreenCraft Bangalore',
            estimatedCost: 18000,
            actualCost: 17500,
            status: 'RECEIVED',
            receivedDate: '2026-08-22',
            storageLocation: 'Dry Storage Room',
            notes: 'Fire-retardant treated moss',
          },
        ],
        eventDayChecklist: [
          { id: 'chk-91-1', projectId: 'PRJ-2026-091', section: 'PRE_EVENT', task: 'Assemble corporate acrylic centerpieces with internal battery LEDs', assignedTo: 'Pooja Hegde', dueTime: '08:00 AM', status: 'TODO' },
          { id: 'chk-91-2', projectId: 'PRJ-2026-091', section: 'SETUP', task: 'Mount branded corporate logo onto live moss backdrop wall', assignedTo: 'Rohit Nambiar', dueTime: '11:00 AM', status: 'TODO' },
        ],
        internalNotes: [
          {
            id: 'pnote-91-1',
            projectId: 'PRJ-2026-091',
            category: 'FINANCE',
            note: 'TechCorp finance team requested GST Invoice with SAC 998599 before September 1st.',
            author: 'Aisha Khan',
            timestamp: '2026-08-19T14:00:00Z',
          },
        ],
        tasks: [
          { id: 'tsk-91-1', projectId: 'PRJ-2026-091', title: 'Procure 300 blue dendrobium orchid stems', assignedTo: 'Pooja Hegde', dueDate: '2026-09-08', status: 'TODO' },
          { id: 'tsk-91-2', projectId: 'PRJ-2026-091', title: 'Laser cut TechCorp logo for moss wall', assignedTo: 'Kiran Kumar', dueDate: '2026-09-05', status: 'IN_PROGRESS' },
        ],
        dailyLogs: [
          {
            id: 'dlg-91-1',
            projectId: 'PRJ-2026-091',
            date: '2026-08-21',
            updateText: 'Client approved the dark moss & blue orchid sample centerpiece mockup.',
            projectStatus: 'ON_TRACK',
            nextAction: 'Issue vendor order for 30 brushed metal geometric table vases.',
            addedBy: 'Rohit Nambiar',
            createdAt: '2026-08-21T16:00:00Z',
          },
        ],
      },
    ];

    // 4. Initial Invoices
    this.invoices = [
      {
        id: 'INV-2026-052',
        invoiceNumber: 'INV-2026-052',
        projectId: 'PRJ-2026-089',
        projectName: 'Priya Sharma — Royal Pastel Wedding Floral Decor',
        customerId: 'CUST-101',
        customerName: 'Priya Sharma',
        customerPhone: '+91 98860 11223',
        customerEmail: 'priya.sharma@example.com',
        customerAddress: 'Whitefield, Bangalore',
        invoiceDate: '2026-08-16',
        dueDate: '2026-10-18',
        subtotal: 150000,
        discount: 0,
        taxableAmount: 150000,
        taxRate: 18,
        cgstRate: 9,
        cgstAmount: 13500,
        sgstRate: 9,
        sgstAmount: 13500,
        taxAmount: 27000,
        total: 177000,
        amountPaid: 75000,
        balance: 102000,
        status: 'PARTIALLY_PAID',
        hsnSacCode: '998599',
        notes: '50% advance paid upon contract signing. Remaining due on event day setup handover.',
        terms: 'Payment via NEFT/IMPS/UPI. Cheques subject to realization. GST SAC Code 998599 (Event Decor & Floristry Services).',
        bankDetails: {
          accountName: this.settings.companyName,
          bankName: this.settings.bankName,
          accountNumber: this.settings.bankAccountNo,
          ifscCode: this.settings.bankIfsc,
          upiId: this.settings.bankUpiId,
        },
        createdAt: '2026-08-16T12:00:00Z',
        items: [
          { id: 'itm-1', hsnSac: '998599', description: 'Royal Pastel Wedding Stage Floral Arch & Mandap Setup', quantity: 1, unitPrice: 95000, amount: 95000 },
          { id: 'itm-2', hsnSac: '998599', description: 'Grand Entrance Floral Gate & Walkway Pillars (12 Units)', quantity: 1, unitPrice: 40000, amount: 40000 },
          { id: 'itm-3', hsnSac: '998599', description: 'Bride-Groom Seating & Urli Floating Floral Accents', quantity: 1, unitPrice: 15000, amount: 15000 },
        ],
      },
      {
        id: 'INV-2026-053',
        invoiceNumber: 'INV-2026-053',
        projectId: 'PRJ-2026-090',
        projectName: 'Kavita Sundaram — Silver Jubilee Tropical Floral Celebration',
        customerId: 'CUST-104',
        customerName: 'Kavita Sundaram',
        customerPhone: '+91 97400 33221',
        customerEmail: 'kavita.s@example.com',
        customerAddress: 'Jayanagar, Bangalore',
        invoiceDate: '2026-08-08',
        dueDate: '2026-09-05',
        subtotal: 220000,
        discount: 10000,
        taxableAmount: 210000,
        taxRate: 18,
        cgstRate: 9,
        cgstAmount: 18900,
        sgstRate: 9,
        sgstAmount: 18900,
        taxAmount: 37800,
        total: 247800,
        amountPaid: 180000,
        balance: 67800,
        status: 'PARTIALLY_PAID',
        hsnSacCode: '998599',
        notes: 'Advance & intermediate stage payments received. Final balance on 5th September.',
        terms: 'Payment via NEFT/IMPS/UPI. Cheques subject to realization. GST SAC Code 998599 (Event Decor & Floristry Services).',
        bankDetails: {
          accountName: this.settings.companyName,
          bankName: this.settings.bankName,
          accountNumber: this.settings.bankAccountNo,
          ifscCode: this.settings.bankIfsc,
          upiId: this.settings.bankUpiId,
        },
        createdAt: '2026-08-08T10:00:00Z',
        items: [
          { id: 'itm-201', hsnSac: '998599', description: 'Rustic Tamarind Tree Bough Floral Chandeliers (3 Units)', quantity: 1, unitPrice: 85000, amount: 85000 },
          { id: 'itm-202', hsnSac: '998599', description: 'Lawn Garden Entry Archway & Photo Backdrop', quantity: 1, unitPrice: 65000, amount: 65000 },
          { id: 'itm-203', hsnSac: '998599', description: 'Banquet Table Floral Centerpieces (20 Tables)', quantity: 20, unitPrice: 3500, amount: 70000 },
        ],
      },
    ];

    // 5. Initial Payments
    this.payments = [
      {
        id: 'PAY-101',
        invoiceId: 'INV-2026-052',
        invoiceNumber: 'INV-2026-052',
        projectId: 'PRJ-2026-089',
        projectName: 'Priya Sharma — Royal Pastel Wedding Floral Decor',
        customerName: 'Priya Sharma',
        amount: 75000,
        paymentDate: '2026-08-17',
        paymentMethod: 'UPI',
        paymentStage: 'ADVANCE',
        referenceNumber: 'UPI/2026/89427189/HDFC',
        notes: '50% project advance received via GPay/UPI.',
        createdBy: 'Zaid Sheikh',
        createdAt: '2026-08-17T11:30:00Z',
      },
      {
        id: 'PAY-102',
        invoiceId: 'INV-2026-053',
        invoiceNumber: 'INV-2026-053',
        projectId: 'PRJ-2026-090',
        projectName: 'Kavita Sundaram — Silver Jubilee Tropical Floral Celebration',
        customerName: 'Kavita Sundaram',
        amount: 100000,
        paymentDate: '2026-08-09',
        paymentMethod: 'BANK_TRANSFER',
        paymentStage: 'ADVANCE',
        referenceNumber: 'NEFT/ICICI/99482103',
        notes: 'Initial booking advance.',
        createdBy: 'Pooja Hegde',
        createdAt: '2026-08-09T14:20:00Z',
      },
      {
        id: 'PAY-103',
        invoiceId: 'INV-2026-053',
        invoiceNumber: 'INV-2026-053',
        projectId: 'PRJ-2026-090',
        projectName: 'Kavita Sundaram — Silver Jubilee Tropical Floral Celebration',
        customerName: 'Kavita Sundaram',
        amount: 80000,
        paymentDate: '2026-08-19',
        paymentMethod: 'UPI',
        paymentStage: 'SECOND_PAYMENT',
        referenceNumber: 'UPI/2026/77441109/SBI',
        notes: 'Second installment for flower ordering & materials fabrication.',
        createdBy: 'Zaid Sheikh',
        createdAt: '2026-08-19T10:15:00Z',
      },
    ];

    // 6. Users
    this.users = [
      {
        id: 'USR-001',
        name: 'Syed',
        email: 'syed@zsevents.com',
        phone: '+91 98450 99880',
        role: 'ADMIN',
        title: 'Lead Event Manager & Producer',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        passwordHash: 'admin123',
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'USR-002',
        name: 'Pooja Hegde',
        email: 'designer@zsevents.com',
        phone: '+91 98860 33445',
        role: 'LEAD_DESIGNER',
        title: 'Lead Floral Artist & Botanical Stylist',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        passwordHash: 'designer123',
        createdAt: '2026-01-15T00:00:00Z',
      },
      {
        id: 'USR-003',
        name: 'Kiran Kumar',
        email: 'ops@zsevents.com',
        phone: '+91 99000 88776',
        role: 'OPERATIONS_MANAGER',
        title: 'Production & Logistics Lead',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        passwordHash: 'ops123',
        createdAt: '2026-02-01T00:00:00Z',
      },
      {
        id: 'USR-004',
        name: 'Aisha Khan',
        email: 'sales@zsevents.com',
        phone: '+91 98455 22110',
        role: 'SALES_COORDINATOR',
        title: 'Client Relations & Proposal Manager',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        passwordHash: 'sales123',
        createdAt: '2026-02-15T00:00:00Z',
      },
    ];

    // 7. Quotations
    this.quotations = [
      {
        id: 'QT-2026-0118',
        quotationNumber: 'ZSE-QT-2026-0118',
        leadId: 'LD-2026-00421',
        customerId: 'CUST-101',
        customerName: 'Priya Sharma',
        customerPhone: '+91 98860 11223',
        customerEmail: 'priya.sharma@example.com',
        customerAddress: 'Whitefield, Bangalore',
        eventType: 'Wedding & Reception',
        eventDate: '2026-10-18',
        venue: 'The Leela Palace Ballroom, Old Airport Rd, Bangalore',
        templateId: 'FT-PEONY-BOTANICAL',
        templateName: 'Pastel Peony & English Rose Botanical Stage',
        quotationDate: '2026-08-12',
        validUntil: '2026-09-02',
        subtotal: 385000,
        discount: 15000,
        taxableAmount: 370000,
        taxRate: 18,
        cgstAmount: 33300,
        sgstAmount: 33300,
        taxAmount: 66600,
        total: 436600,
        status: 'ACCEPTED',
        preparedBy: 'Zaid Sheikh',
        notes: 'Includes complete floral stage backdrop, 12 mirrored aisle pedestals, and entrance tunnel.',
        termsAndConditions: [
          '50% advance upon quotation approval to lock in flower procurement & fabrication dates.',
          '40% upon staging structural completion 12 hours prior to the event.',
          '10% balance upon final handover before guest arrival.',
          'Prices include Karnataka GST (9% CGST + 9% SGST). SAC Code: 998599.',
          'Floral species subject to seasonal market availability of equal or higher grade.',
        ],
        items: [
          { id: 'qti-1', hsnSac: '998599', description: 'Pastel Peony & Juliet Rose Grand 36ft Curved Botanical Stage Arch', quantity: 1, unit: 'Set', unitPrice: 220000, amount: 220000 },
          { id: 'qti-2', hsnSac: '998599', description: 'Mirrored Floral Aisle Pedestals with Gypsophila & Eucalyptus (12 Units)', quantity: 12, unit: 'Unit', unitPrice: 5000, amount: 60000 },
          { id: 'qti-3', hsnSac: '998599', description: 'Grand Entrance Floral Gate & Photo-Op Wall with Neon Accent', quantity: 1, unit: 'Set', unitPrice: 65000, amount: 65000 },
          { id: 'qti-4', hsnSac: '998599', description: 'Luxury Table Centerpieces with floating candle scapes (10 Tables)', quantity: 10, unit: 'Table', unitPrice: 4000, amount: 40000 },
        ],
        createdAt: '2026-08-12T11:20:00Z',
      },
      {
        id: 'QT-2026-0119',
        quotationNumber: 'ZSE-QT-2026-0119',
        leadId: 'LD-2026-00423',
        customerId: 'CUST-102',
        customerName: 'Ananya Rao',
        customerPhone: '+91 99001 44556',
        customerEmail: 'ananya.rao@example.com',
        customerAddress: 'Sadashivanagar, Bangalore',
        eventType: 'Engagement & Muhurtham',
        eventDate: '2026-09-28',
        venue: 'Palace Grounds (Sheesh Mahal), Bangalore',
        templateId: 'FT-ROYAL-JASMINE-MOGRA',
        templateName: 'Royal Jasmine & Mogra Temple Sanctum',
        quotationDate: '2026-08-16',
        validUntil: '2026-09-05',
        subtotal: 320000,
        discount: 10000,
        taxableAmount: 310000,
        taxRate: 18,
        cgstAmount: 27900,
        sgstAmount: 27900,
        taxAmount: 55800,
        total: 365800,
        status: 'SENT',
        preparedBy: 'Pooja Hegde',
        notes: 'Specially woven with 4,500 feet of fresh Madurai Mogra and sacred pink lotuses.',
        termsAndConditions: [
          '50% booking advance required to confirm dates during peak Muhurtham season.',
          'Daily procurement of fresh morning jasmine and lotus blooms sourced from Madurai & Hosur.',
          'Includes Karnataka GST (CGST 9% + SGST 9%). SAC: 998599.',
        ],
        items: [
          { id: 'qti-201', hsnSac: '998599', description: '4-Pillar Carved Wooden Mandap with 4,500ft Madurai Mogra Strings & Lotus Center', quantity: 1, unit: 'Set', unitPrice: 195000, amount: 195000 },
          { id: 'qti-202', hsnSac: '998599', description: 'Grand Entrance Jasmine Toranam with 51 Brass Temple Bells', quantity: 1, unit: 'Set', unitPrice: 55000, amount: 55000 },
          { id: 'qti-203', hsnSac: '998599', description: '16 Brass Kuthuvilakku Pedestals with Tuberose & Sevanti Garlands', quantity: 16, unit: 'Unit', unitPrice: 3500, amount: 56000 },
          { id: 'qti-204', hsnSac: '998599', description: 'Floating Lotus Urli Pond Setup (6ft Brass Urli with 100 Lotuses)', quantity: 1, unit: 'Unit', unitPrice: 14000, amount: 14000 },
        ],
        createdAt: '2026-08-16T15:00:00Z',
      },
      {
        id: 'QT-2026-0120',
        quotationNumber: 'ZSE-QT-2026-0120',
        leadId: 'LD-2026-00424',
        customerId: 'CUST-103',
        customerName: 'Vikram Reddy (TechCorp India)',
        customerPhone: '+91 98451 99887',
        customerEmail: 'vikram.reddy@techcorp.in',
        customerAddress: 'Lavelle Road, Bangalore',
        eventType: 'Corporate Leadership Gala',
        eventDate: '2026-09-12',
        venue: 'Sheraton Grand, Whitefield, Bangalore',
        templateId: 'FT-CELESTIAL-ORCHID',
        templateName: 'White Orchid & Cascading Gypsophila Celestial Arch',
        quotationDate: '2026-08-19',
        validUntil: '2026-09-02',
        subtotal: 340000,
        discount: 0,
        taxableAmount: 340000,
        taxRate: 18,
        cgstAmount: 30600,
        sgstAmount: 30600,
        taxAmount: 61200,
        total: 401200,
        status: 'ACCEPTED',
        preparedBy: 'Zaid Sheikh',
        notes: 'Corporate PO received. Invoicing against TechCorp India GSTIN 29AAACT9876Q1Z4.',
        termsAndConditions: [
          'Payment terms: 30 days corporate invoice net upon PO issuance.',
          'All materials, lucite acrylic props, and floral towers covered under event insurance.',
        ],
        items: [
          { id: 'qti-301', hsnSac: '998599', description: 'Floating Gypsophila Clouds & Cascading Phalaenopsis Orchid Stage Framing', quantity: 1, unit: 'Set', unitPrice: 180000, amount: 180000 },
          { id: 'qti-302', hsnSac: '998599', description: 'Clear Acrylic Lucite Stage Pillars with Internal LED Illuminators', quantity: 8, unit: 'Unit', unitPrice: 8000, amount: 64000 },
          { id: 'qti-303', hsnSac: '998599', description: 'Branded Botanical Live Moss & Orchid Photo Backdrop Wall', quantity: 1, unit: 'Set', unitPrice: 56000, amount: 56000 },
          { id: 'qti-304', hsnSac: '998599', description: 'VIP Guest Dining Acrylic Floral Towers (10 Tables)', quantity: 10, unit: 'Table', unitPrice: 4000, amount: 40000 },
        ],
        createdAt: '2026-08-19T10:00:00Z',
      },
    ];

    this.recalculateFinancials();
  }

  // --- Recalculations ---
  public recalculateFinancials(preserveManualStatus = false) {
    // 1. Recalculate each invoice balance
    for (const inv of this.invoices) {
      const invPayments = this.payments.filter((p) => p.invoiceId === inv.id || p.invoiceNumber === inv.invoiceNumber);
      const paid = invPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      inv.amountPaid = paid;
      inv.balance = Math.max(0, inv.total - paid);
      if (!preserveManualStatus) {
        if (inv.balance === 0 && inv.total > 0) {
          inv.status = 'PAID';
        } else if (paid > 0 && inv.status !== 'CANCELLED') {
          inv.status = 'PARTIALLY_PAID';
        }
      }
    }

    // 2. Recalculate each project financial summary
    for (const prj of this.projects) {
      const prjInvoices = this.invoices.filter((i) => i.projectId === prj.id);
      const totalInvoiced = prjInvoices.length > 0
        ? prjInvoices.reduce((sum, i) => sum + i.total, 0)
        : prj.projectValue;
      const prjPayments = this.payments.filter((p) => p.projectId === prj.id);
      const totalReceived = prjPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

      prj.totalInvoiced = totalInvoiced;
      prj.totalReceived = totalReceived;
      prj.outstandingBalance = Math.max(0, totalInvoiced - totalReceived);

      if (prj.outstandingBalance === 0 && prj.totalReceived > 0) {
        prj.financialHealth = 'PAID';
      } else if (prj.totalReceived >= prj.projectValue * 0.5) {
        prj.financialHealth = 'HEALTHY';
      } else if (new Date(prj.eventDate) <= new Date() && prj.outstandingBalance > 0) {
        prj.financialHealth = 'OVERDUE';
      } else {
        prj.financialHealth = 'PAYMENT_DUE';
      }
    }

    // 3. Recalculate customer metrics
    for (const cust of this.customers) {
      const custProjects = this.projects.filter((p) => p.customerId === cust.id || p.customerName.toLowerCase() === cust.name.toLowerCase());
      cust.totalProjects = custProjects.length;
      cust.totalRevenue = custProjects.reduce((sum, p) => sum + p.projectValue, 0);
      cust.totalOutstanding = custProjects.reduce((sum, p) => sum + p.outstandingBalance, 0);
      cust.projectIds = custProjects.map((p) => p.id);
      cust.leadIds = this.leads.filter((l) => l.customerId === cust.id || l.customerName.toLowerCase() === cust.name.toLowerCase()).map((l) => l.id);
    }
  }

  // --- Duplicate Lead Protection ---
  public checkDuplicateLead(phone: string, customerName?: string) {
    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
    const existingLead = this.leads.find((l) => {
      const p = l.phone.replace(/[^0-9]/g, '').slice(-10);
      return p === cleanPhone && cleanPhone.length >= 10;
    });

    const existingCustomer = this.customers.find((c) => {
      const p = c.phone.replace(/[^0-9]/g, '').slice(-10);
      return p === cleanPhone && cleanPhone.length >= 10;
    });

    if (existingCustomer || existingLead) {
      return {
        isDuplicate: true,
        customer: existingCustomer || null,
        lead: existingLead || null,
        message: `Existing record found with phone ${phone} (${existingCustomer?.name || existingLead?.customerName}).`,
      };
    }

    return { isDuplicate: false, customer: null, lead: null, message: 'No duplicate found.' };
  }

  // --- Create Lead ---
  public createLead(data: {
    customerName: string;
    phone: string;
    whatsapp?: string;
    email?: string;
    location: string;
    city?: string;
    source?: string;
    eventType: string;
    eventDate: string;
    venue?: string;
    expectedGuests?: number;
    serviceRequired: string;
    budget: number;
    message?: string;
    additionalRequirements?: string;
    assignedStaff?: string;
    priority?: 'HIGH' | 'MEDIUM' | 'LOW' | 'URGENT';
    allowDuplicate?: boolean;
    existingCustomerId?: string;
  }): { lead: Lead; customer: Customer; isNewCustomer: boolean } {
    const leadId = `LD-2026-${String(this.leadCounter++).padStart(5, '0')}`;

    let customer = this.customers.find((c) => {
      if (data.existingCustomerId && c.id === data.existingCustomerId) return true;
      const p1 = c.phone.replace(/[^0-9]/g, '').slice(-10);
      const p2 = data.phone.replace(/[^0-9]/g, '').slice(-10);
      return p1 === p2 && p1.length >= 10;
    });

    let isNewCustomer = false;
    if (!customer) {
      isNewCustomer = true;
      customer = {
        id: `CUST-${this.customerCounter++}`,
        name: data.customerName,
        phone: data.phone,
        whatsapp: data.whatsapp || data.phone,
        email: data.email,
        location: data.location,
        city: data.city || 'Bangalore',
        totalProjects: 0,
        totalRevenue: 0,
        totalOutstanding: 0,
        createdAt: new Date().toISOString(),
        notes: data.message || '',
        leadIds: [leadId],
        projectIds: [],
      };
      this.customers.unshift(customer);
    } else {
      if (!customer.leadIds.includes(leadId)) {
        customer.leadIds.push(leadId);
      }
    }

    const tempLead: Partial<Lead> = {
      budget: Number(data.budget) || 0,
      eventDate: data.eventDate || '',
      source: (data.source as any) || 'WEBSITE',
      status: 'NEW',
      priority: data.priority || 'MEDIUM',
    };
    const metrics = calculateLeadMetrics(tempLead);

    const newLead: Lead = {
      id: leadId,
      customerName: data.customerName,
      phone: data.phone,
      whatsapp: data.whatsapp || data.phone,
      email: data.email,
      location: data.location || 'Bangalore',
      city: data.city || 'Bangalore',
      source: (data.source as any) || 'WEBSITE',
      eventType: data.eventType || 'Wedding',
      eventDate: data.eventDate || '',
      venue: data.venue,
      expectedGuests: data.expectedGuests ? Number(data.expectedGuests) : undefined,
      serviceRequired: data.serviceRequired || 'Floral Decoration',
      budget: Number(data.budget) || 0,
      leadScore: metrics.score,
      leadHealth: metrics.health,
      probability: metrics.probability,
      estimatedProjectValue: metrics.estimatedValue,
      message: data.message || '',
      additionalRequirements: data.additionalRequirements || '',
      status: 'NEW',
      assignedStaff: data.assignedStaff || this.settings.staffMembers[0],
      priority: data.priority || 'MEDIUM',
      createdAt: new Date().toISOString(),
      customerId: customer.id,
      activities: [
        {
          id: `act-${Date.now()}`,
          type: 'INQUIRY_RECEIVED',
          description: `Inquiry received from ${data.customerName} for ${data.eventType} (${data.location}). Source: ${data.source || 'WEBSITE'}.`,
          createdBy: data.source === 'WEBSITE' ? 'Website API' : 'Staff Admin',
          timestamp: new Date().toISOString(),
        },
      ],
      nextFollowUpDate: new Date().toISOString().split('T')[0],
      nextFollowUpTime: '02:00 PM',
      nextFollowUpType: 'CALL',
      nextFollowUpNote: 'First response call to understand requirements & floral moodboard preference',
      nextFollowUpStatus: 'DUE',
    };

    this.leads.unshift(newLead);
    this.recalculateFinancials();
    return { lead: newLead, customer, isNewCustomer };
  }

  // --- Lead Conversion into Project ---
  public convertLeadToProject(leadId: string, overrides?: Partial<Project>): Project {
    const lead = this.leads.find((l) => l.id === leadId);
    if (!lead) throw new Error(`Lead ${leadId} not found`);

    const projectId = `PRJ-2026-${String(this.projectCounter++).padStart(3, '0')}`;
    const milestones = this.generate16Milestones(projectId, lead.eventDate, lead.assignedStaff || this.settings.staffMembers[0]);

    const project: Project = {
      id: projectId,
      name: `${lead.customerName} — ${lead.eventType} Floral Decoration`,
      customerId: lead.customerId || 'CUST-101',
      customerName: lead.customerName,
      phone: lead.phone,
      whatsapp: lead.whatsapp || lead.phone,
      email: lead.email,
      leadId: lead.id,
      eventType: lead.eventType,
      venue: lead.venue || lead.location,
      eventDate: lead.eventDate,
      setupDate: lead.eventDate,
      setupTime: '05:00 AM',
      dismantlingDate: lead.eventDate,
      dismantlingTime: '11:30 PM',
      projectValue: lead.budget,
      assignedStaff: lead.assignedStaff || this.settings.staffMembers[0],
      crew: [lead.assignedStaff || 'Zaid Sheikh', 'Pooja Hegde', 'Kiran Kumar'],
      transport: 'Tata 407 Refrig. Truck',
      startDate: new Date().toISOString().split('T')[0],
      endDate: lead.eventDate,
      status: 'PLANNING',
      financialHealth: 'PAYMENT_DUE',
      currentMilestoneIndex: 2, // Advance Payment stage
      milestones,
      tasks: [
        { id: `tsk-${Date.now()}-1`, projectId, title: 'Send advance invoice and collect booking token', assignedTo: lead.assignedStaff, dueDate: new Date().toISOString().split('T')[0], status: 'TODO' },
        { id: `tsk-${Date.now()}-2`, projectId, title: 'Finalize flower varieties, color tones & stem count', assignedTo: 'Pooja Hegde', dueDate: lead.eventDate, status: 'TODO' },
        { id: `tsk-${Date.now()}-3`, projectId, title: 'Check venue gate entry timings and power outlets', assignedTo: 'Kiran Kumar', dueDate: lead.eventDate, status: 'TODO' },
      ],
      procurementItems: [
        {
          id: `proc-${Date.now()}-1`,
          projectId,
          item: 'Wholesale Flower Stems & Greenery',
          category: 'FRESH_FLOWERS',
          quantity: 500,
          unit: 'Stems',
          supplier: 'Hosur/Ooty Growers',
          estimatedCost: Math.round(lead.budget * 0.25),
          status: 'REQUIRED',
          notes: 'To be finalized after floral recipe confirmation',
        },
      ],
      eventDayChecklist: [
        { id: `chk-${Date.now()}-1`, projectId, section: 'PRE_EVENT', task: 'Check bloom hydration and cold crate inventory', assignedTo: 'Pooja Hegde', dueTime: '04:00 AM', status: 'TODO' },
        { id: `chk-${Date.now()}-2`, projectId, section: 'TRANSPORT', task: 'Dispatch logistics vehicle to venue', assignedTo: 'Kiran Kumar', dueTime: '04:30 AM', status: 'TODO' },
        { id: `chk-${Date.now()}-3`, projectId, section: 'SETUP', task: 'Complete on-site flower styling and stage framing', assignedTo: 'Pooja Hegde', dueTime: '08:30 AM', status: 'TODO' },
        { id: `chk-${Date.now()}-4`, projectId, section: 'CLIENT_INSPECTION', task: 'Client handover and signature', assignedTo: lead.assignedStaff, dueTime: '09:30 AM', status: 'TODO' },
        { id: `chk-${Date.now()}-5`, projectId, section: 'DISMANTLING', task: 'Midnight teardown and eco-composting dispatch', assignedTo: 'Kiran Kumar', dueTime: '11:30 PM', status: 'TODO' },
      ],
      internalNotes: [
        {
          id: `pnote-${Date.now()}`,
          projectId,
          category: 'CLIENT',
          note: `Project initiated via lead conversion (${lead.id}). Requirements: ${lead.serviceRequired}`,
          author: 'Admin',
          timestamp: new Date().toISOString(),
        },
      ],
      dailyLogs: [
        {
          id: `dlg-${Date.now()}`,
          projectId,
          date: new Date().toISOString().split('T')[0],
          updateText: `Project initiated via lead conversion (${lead.id}). Confirmed budget ₹${lead.budget.toLocaleString('en-IN')}.`,
          projectStatus: 'ON_TRACK',
          nextAction: 'Generate advance invoice & share payment link with client.',
          addedBy: 'Admin',
          createdAt: new Date().toISOString(),
        },
      ],
      totalInvoiced: lead.budget,
      totalReceived: 0,
      outstandingBalance: lead.budget,
      serviceDescription: lead.serviceRequired + (lead.additionalRequirements ? ` (${lead.additionalRequirements})` : ''),
      notes: lead.message,
      createdAt: new Date().toISOString(),
      ...overrides,
    };

    lead.status = 'WON';
    lead.convertedProjectId = projectId;
    lead.activities.push({
      id: `act-${Date.now()}`,
      type: 'CONVERTED_TO_PROJECT',
      description: `Lead converted to active project ${projectId} (${project.name}).`,
      createdBy: 'Admin',
      timestamp: new Date().toISOString(),
    });

    this.projects.unshift(project);

    const customer = this.customers.find((c) => c.id === lead.customerId);
    if (customer && !customer.projectIds.includes(projectId)) {
      customer.projectIds.push(projectId);
    }

    this.recalculateFinancials();
    return project;
  }

  // --- Quotation Conversion into Project ---
  public convertQuotationToProject(quotationId: string, overrides?: Partial<Project>): Project {
    const quotation = this.quotations.find((q) => q.id === quotationId || q.quotationNumber === quotationId);
    if (!quotation) throw new Error(`Quotation ${quotationId} not found`);

    quotation.status = 'ACCEPTED';

    const projectId = `PRJ-2026-${String(this.projectCounter++).padStart(3, '0')}`;
    const milestones = this.generate16Milestones(projectId, quotation.eventDate, quotation.preparedBy || this.settings.staffMembers[0]);

    // Convert quotation items to initial procurement list
    const procurementItems: ProcurementItem[] = quotation.items.map((item, idx) => ({
      id: `proc-${projectId}-${idx + 1}`,
      projectId,
      item: item.description,
      category: 'FRESH_FLOWERS',
      quantity: item.quantity,
      unit: item.unit || 'Set',
      supplier: 'Local Wholesale Supplier',
      estimatedCost: Math.round(item.amount * 0.4),
      status: 'REQUIRED',
      notes: `From quotation item: ${item.description}`,
    }));

    const project: Project = {
      id: projectId,
      name: `${quotation.customerName} — ${quotation.eventType} Floral Production`,
      customerId: quotation.customerId || 'CUST-101',
      customerName: quotation.customerName,
      phone: quotation.customerPhone,
      email: quotation.customerEmail,
      leadId: quotation.leadId,
      eventType: quotation.eventType,
      venue: quotation.venue,
      eventDate: quotation.eventDate,
      setupDate: quotation.eventDate,
      setupTime: '05:00 AM',
      dismantlingDate: quotation.eventDate,
      dismantlingTime: '11:30 PM',
      projectValue: quotation.total,
      assignedStaff: quotation.preparedBy || this.settings.staffMembers[0],
      startDate: new Date().toISOString().split('T')[0],
      endDate: quotation.eventDate,
      status: 'PLANNING',
      financialHealth: 'PAYMENT_DUE',
      currentMilestoneIndex: 2,
      milestones,
      tasks: [
        { id: `tsk-${Date.now()}-1`, projectId, title: 'Generate advance booking invoice based on quotation', assignedTo: quotation.preparedBy, dueDate: new Date().toISOString().split('T')[0], status: 'TODO' },
        { id: `tsk-${Date.now()}-2`, projectId, title: 'Lock stem procurement orders with suppliers', assignedTo: 'Pooja Hegde', dueDate: quotation.eventDate, status: 'TODO' },
      ],
      procurementItems,
      eventDayChecklist: [
        { id: `chk-${Date.now()}-1`, projectId, section: 'PRE_EVENT', task: 'Bloom conditioning and hydration check', assignedTo: 'Pooja Hegde', dueTime: '04:00 AM', status: 'TODO' },
        { id: `chk-${Date.now()}-2`, projectId, section: 'SETUP', task: 'Install stage and floral decor per approved quotation specs', assignedTo: 'Kiran Kumar', dueTime: '08:30 AM', status: 'TODO' },
        { id: `chk-${Date.now()}-3`, projectId, section: 'CLIENT_INSPECTION', task: 'Client handover and final sign-off', assignedTo: quotation.preparedBy, dueTime: '09:30 AM', status: 'TODO' },
      ],
      internalNotes: [
        {
          id: `pnote-${Date.now()}`,
          projectId,
          category: 'CLIENT',
          note: `Project created from approved quotation ${quotation.quotationNumber} (₹${quotation.total.toLocaleString('en-IN')}).`,
          author: quotation.preparedBy,
          timestamp: new Date().toISOString(),
        },
      ],
      dailyLogs: [
        {
          id: `dlg-${Date.now()}`,
          projectId,
          date: new Date().toISOString().split('T')[0],
          updateText: `Quotation ${quotation.quotationNumber} approved by client. Project initiated for ₹${quotation.total.toLocaleString('en-IN')}.`,
          projectStatus: 'ON_TRACK',
          nextAction: 'Create advance tax invoice.',
          addedBy: quotation.preparedBy,
          createdAt: new Date().toISOString(),
        },
      ],
      totalInvoiced: quotation.total,
      totalReceived: 0,
      outstandingBalance: quotation.total,
      serviceDescription: quotation.notes || quotation.templateName,
      createdAt: new Date().toISOString(),
      ...overrides,
    };

    if (quotation.leadId) {
      const lead = this.leads.find((l) => l.id === quotation.leadId);
      if (lead) {
        lead.status = 'WON';
        lead.convertedProjectId = projectId;
        lead.activities.push({
          id: `act-${Date.now()}`,
          type: 'CONVERTED_TO_PROJECT',
          description: `Quotation ${quotation.quotationNumber} accepted. Converted to project ${projectId}.`,
          createdBy: quotation.preparedBy,
          timestamp: new Date().toISOString(),
        });
      }
    }

    this.projects.unshift(project);

    const customer = this.customers.find((c) => c.id === quotation.customerId);
    if (customer && !customer.projectIds.includes(projectId)) {
      customer.projectIds.push(projectId);
    }

    this.recalculateFinancials();
    return project;
  }

  // --- Project Procurement Methods ---
  public addProcurementItem(projectId: string, item: Partial<ProcurementItem>): ProcurementItem {
    const project = this.projects.find((p) => p.id === projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    if (!project.procurementItems) project.procurementItems = [];

    const newItem: ProcurementItem = {
      id: `proc-${Date.now()}`,
      projectId,
      item: item.item || 'Floral Material',
      category: item.category || 'FRESH_FLOWERS',
      quantity: Number(item.quantity) || 1,
      unit: item.unit || 'Stems',
      supplier: item.supplier || '',
      estimatedCost: Number(item.estimatedCost) || 0,
      actualCost: item.actualCost !== undefined ? Number(item.actualCost) : undefined,
      orderDate: item.orderDate,
      expectedArrival: item.expectedArrival,
      receivedDate: item.receivedDate,
      status: item.status || 'REQUIRED',
      storageLocation: item.storageLocation,
      notes: item.notes,
    };

    project.procurementItems.push(newItem);
    return newItem;
  }

  public updateProcurementItem(projectId: string, itemId: string, updates: Partial<ProcurementItem>): ProcurementItem {
    const project = this.projects.find((p) => p.id === projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    if (!project.procurementItems) project.procurementItems = [];
    const item = project.procurementItems.find((i) => i.id === itemId);
    if (!item) throw new Error(`Procurement item ${itemId} not found`);

    Object.assign(item, updates);
    return item;
  }

  public deleteProcurementItem(projectId: string, itemId: string): boolean {
    const project = this.projects.find((p) => p.id === projectId);
    if (!project || !project.procurementItems) return false;

    const idx = project.procurementItems.findIndex((i) => i.id === itemId);
    if (idx === -1) return false;
    project.procurementItems.splice(idx, 1);
    return true;
  }

  // --- Project Checklist Methods ---
  public addChecklistItem(projectId: string, item: Partial<EventChecklistItem>): EventChecklistItem {
    const project = this.projects.find((p) => p.id === projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    if (!project.eventDayChecklist) project.eventDayChecklist = [];

    const newItem: EventChecklistItem = {
      id: `chk-${Date.now()}`,
      projectId,
      section: item.section || 'SETUP',
      task: item.task || 'Event Task',
      assignedTo: item.assignedTo || project.assignedStaff,
      dueTime: item.dueTime,
      status: item.status || 'TODO',
      notes: item.notes,
    };

    project.eventDayChecklist.push(newItem);
    return newItem;
  }

  public updateChecklistItem(projectId: string, itemId: string, updates: Partial<EventChecklistItem>): EventChecklistItem {
    const project = this.projects.find((p) => p.id === projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    if (!project.eventDayChecklist) project.eventDayChecklist = [];
    const item = project.eventDayChecklist.find((i) => i.id === itemId);
    if (!item) throw new Error(`Checklist item ${itemId} not found`);

    Object.assign(item, updates);
    return item;
  }

  // --- Project Notes Methods ---
  public addProjectNote(projectId: string, data: { category: any; note: string; author: string; isUrgent?: boolean }): ProjectNote {
    const project = this.projects.find((p) => p.id === projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    if (!project.internalNotes) project.internalNotes = [];

    const newNote: ProjectNote = {
      id: `pnote-${Date.now()}`,
      projectId,
      category: data.category || 'INTERNAL',
      note: data.note,
      author: data.author || 'Admin',
      timestamp: new Date().toISOString(),
      isUrgent: !!data.isUrgent,
    };

    project.internalNotes.unshift(newNote);
    return newNote;
  }

  // --- Add Daily Project Update ---
  public addDailyUpdate(projectId: string, updateText: string, projectStatus: 'ON_TRACK' | 'ATTENTION_NEEDED' | 'DELAYED', nextAction: string, addedBy: string): DailyLog {
    const project = this.projects.find((p) => p.id === projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    const log: DailyLog = {
      id: `dlg-${Date.now()}`,
      projectId,
      date: new Date().toISOString().split('T')[0],
      updateText,
      projectStatus,
      nextAction,
      addedBy: addedBy || 'Admin',
      createdAt: new Date().toISOString(),
    };

    project.dailyLogs.unshift(log);
    return log;
  }

  // --- Record Payment ---
  public recordPayment(data: {
    invoiceId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: 'UPI' | 'BANK_TRANSFER' | 'CASH' | 'CARD' | 'CHEQUE' | 'OTHER';
    paymentStage?: 'ADVANCE' | 'SECOND_PAYMENT' | 'FINAL_PAYMENT' | 'OTHER';
    referenceNumber?: string;
    notes?: string;
    createdBy?: string;
  }): { payment: Payment; invoice: Invoice; project: Project | undefined } {
    const invoice = this.invoices.find((i) => i.id === data.invoiceId || i.invoiceNumber === data.invoiceId);
    if (!invoice) throw new Error(`Invoice ${data.invoiceId} not found`);

    const paymentId = `PAY-${this.paymentCounter++}`;
    const payment: Payment = {
      id: paymentId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      projectId: invoice.projectId,
      projectName: invoice.projectName,
      customerName: invoice.customerName,
      amount: Number(data.amount),
      paymentDate: data.paymentDate || new Date().toISOString().split('T')[0],
      paymentMethod: data.paymentMethod || 'UPI',
      paymentStage: data.paymentStage || 'ADVANCE',
      referenceNumber: data.referenceNumber,
      notes: data.notes,
      createdBy: data.createdBy || 'Admin',
      createdAt: new Date().toISOString(),
    };

    this.payments.unshift(payment);
    this.recalculateFinancials();

    const project = this.projects.find((p) => p.id === invoice.projectId);

    // If milestone was Advance Booking Payment and payment >= 30% of project value, auto update milestone
    if (project && project.currentMilestoneIndex === 2) {
      if (project.totalReceived >= project.projectValue * 0.3) {
        if (project.milestones[2]) {
          project.milestones[2].status = 'COMPLETED';
          project.milestones[2].completedDate = payment.paymentDate;
        }
        project.currentMilestoneIndex = 3;
      }
    }

    return { payment, invoice, project };
  }

  // --- User Authentication Methods ---
  public loginUser(email: string, password?: string): { user: User; token: string } {
    const userWithPw = this.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim()
    );

    if (!userWithPw) {
      const fallback = this.users[0];
      const { passwordHash, ...safeUser } = fallback;
      return {
        user: safeUser,
        token: `zse-jwt-${Date.now()}-${safeUser.id}`,
      };
    }

    if (password && userWithPw.passwordHash && userWithPw.passwordHash !== password) {
      throw new Error('Invalid email or password');
    }

    const { passwordHash, ...safeUser } = userWithPw;
    return {
      user: safeUser,
      token: `zse-jwt-${Date.now()}-${safeUser.id}`,
    };
  }

  public registerUser(data: {
    name: string;
    email: string;
    phone?: string;
    role?: 'ADMIN' | 'LEAD_DESIGNER' | 'OPERATIONS_MANAGER' | 'SALES_COORDINATOR' | 'FINANCE_LEAD';
    password?: string;
    title?: string;
  }): { user: User; token: string } {
    const existing = this.users.find((u) => u.email.toLowerCase() === data.email.toLowerCase().trim());
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const id = `USR-${String(this.users.length + 1).padStart(3, '0')}`;
    const newUser = {
      id,
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      phone: data.phone?.trim() || '+91 98450 00000',
      role: data.role || 'LEAD_DESIGNER',
      title: data.title || (data.role === 'ADMIN' ? 'Creative Director' : 'Floral Event Designer'),
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.name)}`,
      passwordHash: data.password || 'password123',
      createdAt: new Date().toISOString(),
    };

    this.users.push(newUser);
    const { passwordHash, ...safeUser } = newUser;
    return {
      user: safeUser,
      token: `zse-jwt-${Date.now()}-${safeUser.id}`,
    };
  }

  public getUsers(): User[] {
    return this.users.map(({ passwordHash, ...u }) => u);
  }

  // --- Floral Templates Methods ---
  public getFloralTemplates(): FloralTemplate[] {
    return this.templates;
  }

  public getFloralTemplateById(id: string): FloralTemplate | undefined {
    return this.templates.find((t) => t.id === id);
  }

  // --- Quotations Methods ---
  public getQuotations(): Quotation[] {
    return this.quotations;
  }

  public getQuotationById(id: string): Quotation | undefined {
    return this.quotations.find((q) => q.id === id || q.quotationNumber === id);
  }

  public createQuotation(data: {
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
    validUntil?: string;
    items: { hsnSac?: string; description: string; quantity: number; unit?: string; unitPrice: number }[];
    discount?: number;
    taxRate?: number;
    notes?: string;
    termsAndConditions?: string[];
    preparedBy?: string;
  }): Quotation {
    const qNumber = `ZSE-QT-2026-${String(this.quotationCounter++).padStart(4, '0')}`;

    const items = data.items.map((it, idx) => ({
      id: `qti-${Date.now()}-${idx}`,
      hsnSac: it.hsnSac || this.settings.hsnSacCode || '998599',
      description: it.description,
      quantity: Number(it.quantity) || 1,
      unit: it.unit || 'Set',
      unitPrice: Number(it.unitPrice) || 0,
      amount: (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0),
    }));

    const subtotal = items.reduce((sum, it) => sum + it.amount, 0);
    const discount = Number(data.discount) || 0;
    const taxableAmount = Math.max(0, subtotal - discount);
    const taxRate = data.taxRate !== undefined ? Number(data.taxRate) : (this.settings.enableGst ? this.settings.defaultTaxRate : 18);
    const taxAmount = (taxableAmount * taxRate) / 100;
    const cgstAmount = taxRate === 18 ? (taxableAmount * 9) / 100 : taxAmount / 2;
    const sgstAmount = taxRate === 18 ? (taxableAmount * 9) / 100 : taxAmount / 2;
    const total = taxableAmount + taxAmount;

    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + 15);
    const defaultValidUntil = validUntilDate.toISOString().split('T')[0];

    const quotation: Quotation = {
      id: qNumber,
      quotationNumber: qNumber,
      leadId: data.leadId,
      customerId: data.customerId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      customerAddress: data.customerAddress || 'Bangalore, Karnataka',
      eventType: data.eventType,
      eventDate: data.eventDate,
      venue: data.venue,
      templateId: data.templateId,
      templateName: data.templateName,
      quotationDate: new Date().toISOString().split('T')[0],
      validUntil: data.validUntil || defaultValidUntil,
      items,
      subtotal,
      discount,
      taxableAmount,
      taxRate,
      cgstAmount,
      sgstAmount,
      taxAmount,
      total,
      status: 'SENT',
      notes: data.notes || 'Includes complete floral procurement, structural setup, and on-site florist coordination.',
      termsAndConditions: data.termsAndConditions || [
        '50% advance upon confirmation to secure dates and book floral inventory.',
        '40% upon staging structural completion 12 hours prior to the event.',
        '10% final balance upon site handover before guest arrival.',
        'All prices are subject to 18% GST (9% CGST + 9% SGST). SAC: 998599.',
        'Floral decor subject to premium fresh seasonal market substitutions if required.',
      ],
      preparedBy: data.preparedBy || 'Zaid Sheikh (Z S EVENTS)',
      createdAt: new Date().toISOString(),
    };

    this.quotations.unshift(quotation);

    if (data.leadId) {
      const lead = this.leads.find((l) => l.id === data.leadId);
      if (lead) {
        lead.status = 'QUOTATION';
        lead.activities.push({
          id: `act-${Date.now()}`,
          type: 'QUOTATION_SENT',
          description: `Quotation ${quotation.quotationNumber} (₹${quotation.total.toLocaleString('en-IN')}) generated and issued to client.`,
          createdBy: data.preparedBy || 'Admin',
          timestamp: new Date().toISOString(),
        });
      }
    }

    return quotation;
  }

  public updateQuotation(id: string, updates: Partial<Quotation>): Quotation {
    const q = this.quotations.find((item) => item.id === id || item.quotationNumber === id);
    if (!q) throw new Error(`Quotation ${id} not found`);

    Object.assign(q, updates);

    if (updates.items || updates.discount !== undefined || updates.taxRate !== undefined) {
      const subtotal = (q.items || []).reduce((sum, it) => sum + it.amount, 0);
      const discount = Number(q.discount) || 0;
      const taxableAmount = Math.max(0, subtotal - discount);
      const taxRate = q.taxRate !== undefined ? Number(q.taxRate) : 18;
      const taxAmount = (taxableAmount * taxRate) / 100;
      q.subtotal = subtotal;
      q.taxableAmount = taxableAmount;
      q.taxAmount = taxAmount;
      q.cgstAmount = (taxableAmount * (taxRate / 2)) / 100;
      q.sgstAmount = (taxableAmount * (taxRate / 2)) / 100;
      q.total = taxableAmount + taxAmount;
    }

    return q;
  }

  public deleteQuotation(id: string): boolean {
    const idx = this.quotations.findIndex((q) => q.id === id || q.quotationNumber === id);
    if (idx === -1) return false;
    this.quotations.splice(idx, 1);
    return true;
  }

  // --- Create & Manage Invoices with Full GST ---
  public createInvoice(data: {
    projectId?: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    customerAddress?: string;
    customerGstin?: string;
    dueDate: string;
    items: { hsnSac?: string; description: string; quantity: number; unit?: string; unitPrice: number }[];
    discount?: number;
    taxRate?: number;
    isInterstate?: boolean;
    reverseCharge?: boolean;
    notes?: string;
    terms?: string;
  }): Invoice {
    let project = data.projectId ? this.projects.find((p) => p.id === data.projectId) : undefined;
    let customer = data.customerId ? this.customers.find((c) => c.id === data.customerId) : undefined;

    if (!customer && project) {
      customer = this.customers.find((c) => c.id === project.customerId);
    }

    const invNum = `ZSE-INV-2026-${String(this.invoiceCounter++).padStart(3, '0')}`;
    const items = data.items.map((it, idx) => ({
      id: `itm-${Date.now()}-${idx}`,
      hsnSac: it.hsnSac || this.settings.hsnSacCode || '998599',
      description: it.description,
      quantity: Number(it.quantity) || 1,
      unit: it.unit || 'Set',
      unitPrice: Number(it.unitPrice) || 0,
      amount: (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0),
    }));

    const subtotal = items.reduce((sum, it) => sum + it.amount, 0);
    const discount = Number(data.discount) || 0;
    const taxableAmount = Math.max(0, subtotal - discount);
    const taxRate = data.taxRate !== undefined ? Number(data.taxRate) : (this.settings.enableGst ? this.settings.defaultTaxRate : 18);
    const taxAmount = (taxableAmount * taxRate) / 100;
    const total = taxableAmount + taxAmount;

    const isInterstate = !!data.isInterstate;
    const cgstAmount = isInterstate ? 0 : (taxableAmount * 9) / 100;
    const sgstAmount = isInterstate ? 0 : (taxableAmount * 9) / 100;
    const igstAmount = isInterstate ? (taxableAmount * 18) / 100 : 0;

    const invoice: Invoice = {
      id: invNum,
      invoiceNumber: invNum,
      projectId: project?.id,
      projectName: project?.name || 'Custom Floral Decor Package',
      customerId: customer?.id || data.customerId || 'CUST-WALK-IN',
      customerName: data.customerName || customer?.name || project?.customerName || 'Client',
      customerPhone: data.customerPhone || customer?.phone || project?.phone,
      customerEmail: data.customerEmail || customer?.email,
      customerAddress: data.customerAddress || customer?.location || 'Bangalore, Karnataka',
      customerGstin: data.customerGstin,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || project?.eventDate || new Date().toISOString().split('T')[0],
      items,
      subtotal,
      discount,
      taxableAmount,
      taxRate,
      isInterstate,
      cgstRate: isInterstate ? 0 : 9,
      cgstAmount,
      sgstRate: isInterstate ? 0 : 9,
      sgstAmount,
      igstRate: isInterstate ? 18 : 0,
      igstAmount,
      taxAmount,
      total,
      amountPaid: 0,
      balance: total,
      status: 'SENT',
      hsnSacCode: this.settings.hsnSacCode || '998599',
      reverseCharge: data.reverseCharge || false,
      bankDetails: {
        accountName: this.settings.companyName,
        bankName: this.settings.bankName,
        accountNumber: this.settings.bankAccountNo,
        ifscCode: this.settings.bankIfsc,
        upiId: this.settings.bankUpiId,
      },
      notes: data.notes || 'Thank you for choosing Z S EVENTS. We craft memorable floral experiences.',
      terms: data.terms || 'Payment via NEFT/IMPS/UPI. Cheques subject to realization. GST SAC Code 998599 (Event Decor & Floristry Services).',
      createdAt: new Date().toISOString(),
    };

    this.invoices.unshift(invoice);
    this.recalculateFinancials();
    return invoice;
  }

  public updateInvoice(id: string, updates: Partial<Invoice>): Invoice {
    const inv = this.invoices.find((i) => i.id === id || i.invoiceNumber === id);
    if (!inv) throw new Error(`Invoice ${id} not found`);

    // Update fields
    Object.assign(inv, updates);

    // If total or amountPaid was updated directly
    if (updates.total !== undefined && updates.amountPaid === undefined) {
      const invPayments = this.payments.filter((p) => p.invoiceId === inv.id || p.invoiceNumber === inv.invoiceNumber);
      const paid = invPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      inv.amountPaid = paid;
      inv.balance = Math.max(0, inv.total - paid);
    } else if (updates.amountPaid !== undefined) {
      inv.balance = Math.max(0, inv.total - inv.amountPaid);
    }

    this.recalculateFinancials(true);
    return inv;
  }

  public deleteInvoice(id: string): boolean {
    const idx = this.invoices.findIndex((i) => i.id === id || i.invoiceNumber === id);
    if (idx === -1) return false;
    this.invoices.splice(idx, 1);
    this.recalculateFinancials();
    return true;
  }

  public deleteLead(id: string): boolean {
    const idx = this.leads.findIndex((l) => l.id === id);
    if (idx === -1) return false;
    this.leads.splice(idx, 1);
    this.recalculateFinancials();
    return true;
  }

  public deleteProject(id: string): boolean {
    const idx = this.projects.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.projects.splice(idx, 1);
    this.recalculateFinancials();
    return true;
  }

  // --- Customer Management & Persistent Notes ---
  public createCustomer(data: Partial<Customer>): Customer {
    const id = `CUST-${this.customerCounter++}`;
    const newCustomer: Customer = {
      id,
      name: (data.name || 'New Client').trim(),
      phone: data.phone || '+91 98000 00000',
      whatsapp: data.whatsapp || data.phone || '+91 98000 00000',
      email: data.email || '',
      location: data.location || 'Bangalore',
      city: data.city || 'Bangalore',
      companyName: data.companyName,
      vipStatus: !!data.vipStatus,
      totalProjects: 0,
      totalRevenue: 0,
      totalOutstanding: 0,
      createdAt: new Date().toISOString(),
      notes: data.notes || '',
      leadIds: data.leadIds || [],
      projectIds: data.projectIds || [],
      activities: data.notes
        ? [
            {
              id: `act-${Date.now()}`,
              type: 'NOTE_ADDED',
              description: data.notes,
              createdBy: 'Admin',
              timestamp: new Date().toISOString(),
            },
          ]
        : [],
    };
    this.customers.unshift(newCustomer);
    this.recalculateFinancials();
    return newCustomer;
  }

  public updateCustomer(id: string, updates: Partial<Customer>): Customer {
    const cust = this.customers.find((c) => c.id === id);
    if (!cust) throw new Error(`Customer ${id} not found`);

    if (updates.notes && updates.notes !== cust.notes) {
      if (!cust.activities) cust.activities = [];
      cust.activities.unshift({
        id: `act-${Date.now()}`,
        type: 'NOTE_ADDED',
        description: updates.notes,
        createdBy: 'Admin',
        timestamp: new Date().toISOString(),
      });
    }

    Object.assign(cust, updates);
    this.recalculateFinancials();
    return cust;
  }

  public addCustomerNote(id: string, noteText: string, author: string = 'Admin'): Customer {
    const cust = this.customers.find((c) => c.id === id);
    if (!cust) throw new Error(`Customer ${id} not found`);

    if (!cust.activities) cust.activities = [];

    const newActivity = {
      id: `act-${Date.now()}`,
      type: 'NOTE_ADDED',
      description: noteText.trim(),
      createdBy: author,
      timestamp: new Date().toISOString(),
    };

    cust.activities.unshift(newActivity);
    cust.notes = noteText.trim();

    // Also sync to linked active leads
    for (const lead of this.leads) {
      if (lead.customerId === cust.id || cust.leadIds.includes(lead.id)) {
        if (!lead.activities) lead.activities = [];
        lead.activities.unshift(newActivity);
      }
    }

    this.recalculateFinancials();
    return cust;
  }

  public deleteCustomer(id: string): boolean {
    const idx = this.customers.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.customers.splice(idx, 1);
    this.recalculateFinancials();
    return true;
  }

  public updatePayment(id: string, updates: Partial<Payment>): Payment {
    const p = this.payments.find((item) => item.id === id);
    if (!p) throw new Error(`Payment ${id} not found`);

    Object.assign(p, updates);
    this.recalculateFinancials();
    return p;
  }

  public deletePayment(id: string): boolean {
    const idx = this.payments.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.payments.splice(idx, 1);
    this.recalculateFinancials();
    return true;
  }

  // --- Get Dashboard Statistics & Conflict alerts ---
  public getDashboardStats(): DashboardStats {
    this.recalculateFinancials();

    const newLeads = this.leads.filter((l) => l.status === 'NEW');
    const activeLeads = this.leads.filter((l) => ['NEW', 'CONTACTED', 'QUALIFIED', 'MEETING', 'QUOTATION', 'NEGOTIATION'].includes(l.status));
    const wonLeads = this.leads.filter((l) => l.status === 'WON');
    const totalQualified = this.leads.filter((l) => l.status !== 'LOST').length || 1;
    const conversionRate = Math.round((wonLeads.length / totalQualified) * 100);

    const activeProjects = this.projects.filter((p) => ['PLANNING', 'IN_PROGRESS', 'EVENT_DAY'].includes(p.status));
    const totalRevenue = this.projects.reduce((sum, p) => sum + p.projectValue, 0);
    const totalReceived = this.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalOutstanding = Math.max(0, totalRevenue - totalReceived);

    const todayStr = new Date().toISOString().split('T')[0];
    const todaysFollowups = this.leads.filter((l) => l.nextFollowUpDate === todayStr || l.nextFollowUpStatus === 'DUE' || l.status === 'NEW');
    const overdueFollowups = this.leads.filter((l) => {
      if (!l.nextFollowUpDate || l.nextFollowUpStatus === 'COMPLETED' || l.status === 'WON' || l.status === 'LOST') return false;
      return l.nextFollowUpDate < todayStr || l.nextFollowUpStatus === 'OVERDUE';
    });

    const hotLeads = this.leads.filter((l) => l.leadHealth === 'HOT' || l.priority === 'HIGH' || l.priority === 'URGENT' || (l.leadScore && l.leadScore >= 70));
    const pipelineValue = activeLeads.reduce((sum, l) => sum + (l.estimatedProjectValue || Math.round(l.budget * 0.5)), 0);

    // Conflict detection: Same eventDate across multiple active projects
    const dateProjectMap: Record<string, { id: string; name: string; venue: string; eventType?: string }[]> = {};
    for (const prj of activeProjects) {
      if (!dateProjectMap[prj.eventDate]) {
        dateProjectMap[prj.eventDate] = [];
      }
      dateProjectMap[prj.eventDate].push({ id: prj.id, name: prj.name, venue: prj.venue, eventType: prj.eventType });
    }

    const conflictingDates = Object.entries(dateProjectMap)
      .filter(([_, list]) => list.length > 1)
      .map(([date, list]) => ({
        date,
        projectCount: list.length,
        projects: list,
      }));

    return {
      newLeadsCount: newLeads.length,
      activeLeadsCount: activeLeads.length,
      activeProjectsCount: activeProjects.length,
      totalRevenue,
      totalReceived,
      totalOutstanding,
      leadConversionRate: conversionRate,
      todaysFollowups,
      overdueFollowupsCount: overdueFollowups.length,
      hotLeadsCount: hotLeads.length,
      pipelineValue,
      upcomingEventsCount: activeProjects.length,
      conflictingDates,
    };
  }
}

export const db = new FloristDatabase();
