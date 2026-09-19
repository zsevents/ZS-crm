import { Router, Request, Response } from 'express';
import { db } from './db.js';
import { Milestone } from '../types.js';
import { generateQuotationSuggestions, generateWhatsAppPitch } from './assistant.js';

export const apiRouter = Router();

// --- Dashboard Stats ---
apiRouter.get('/dashboard/stats', (req: Request, res: Response) => {
  try {
    const stats = db.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Event-date clashes between active projects (computed with the dashboard stats)
apiRouter.get('/dashboard/conflicts', (req: Request, res: Response) => {
  try {
    res.json({ success: true, data: db.getDashboardStats().conflictingDates });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Leads ---
apiRouter.get('/leads', (req: Request, res: Response) => {
  try {
    const { status, eventType, source, search } = req.query;
    let leads = [...db.leads];

    if (status && status !== 'ALL') {
      leads = leads.filter((l) => l.status === status);
    }
    if (eventType && eventType !== 'ALL') {
      leads = leads.filter((l) => l.eventType === eventType);
    }
    if (source && source !== 'ALL') {
      leads = leads.filter((l) => l.source === source);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      leads = leads.filter(
        (l) =>
          l.customerName.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          l.location.toLowerCase().includes(q) ||
          (l.venue && l.venue.toLowerCase().includes(q))
      );
    }

    res.json({ success: true, data: leads });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/leads/check-duplicate', (req: Request, res: Response) => {
  try {
    const { phone, customerName } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }
    const result = db.checkDuplicateLead(phone, customerName);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/leads/:id', (req: Request, res: Response) => {
  try {
    const lead = db.leads.find((l) => l.id === req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }
    res.json({ success: true, data: lead });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/leads', (req: Request, res: Response) => {
  try {
    const { customerName, phone, eventType, eventDate, budget, serviceRequired } = req.body;
    if (!customerName || !phone || !serviceRequired) {
      return res.status(400).json({
        success: false,
        error: 'Customer name, phone number, and service required are mandatory.',
      });
    }

    const { lead, customer, isNewCustomer } = db.createLead(req.body);
    res.status(201).json({ success: true, data: { lead, customer, isNewCustomer } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Website public inquiry endpoint (PRD requirement #12, #13, #51)
apiRouter.get(['/website-inquiry', '/inquiry'], (req: Request, res: Response) => {
  res.json({
    status: 'online',
    endpoint: 'POST /api/website-inquiry',
    description: 'Public endpoint to ingest customer event floral inquiries directly into BloomCraft CRM.',
    acceptedFields: {
      name: 'string (or customerName, fullName, clientName) [Required]',
      phone: 'string (or mobile, whatsapp, contact) [Required]',
      email: 'string [Optional]',
      location: 'string (or area, city, venue) [Optional, default: Bangalore]',
      eventType: 'string (e.g. Wedding, Reception, Birthday, Corporate) [Optional]',
      eventDate: 'YYYY-MM-DD string [Optional]',
      service: 'string (or serviceRequired, requirements) [Optional]',
      budget: 'number or string (INR) [Optional]',
      message: 'string (or details, notes, comments) [Optional]',
    },
    examplePayload: {
      name: 'Priya Sharma',
      phone: '+91 98860 11223',
      email: 'priya@example.com',
      location: 'Indiranagar, Bangalore',
      eventType: 'Wedding',
      eventDate: '2026-11-20',
      service: 'Floral Stage Archway & Mandap Decor',
      budget: 180000,
      message: 'Pastel roses theme for reception dinner',
    },
  });
});

// Basic per-IP throttle for the public inquiry endpoint (per serverless
// instance, so it limits bursts rather than being a hard global quota).
const inquiryHits = new Map<string, number[]>();
function allowInquiry(ip: string): boolean {
  const now = Date.now();
  const recent = (inquiryHits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  if (recent.length >= 5) return false;
  recent.push(now);
  inquiryHits.set(ip, recent);
  if (inquiryHits.size > 5000) inquiryHits.clear();
  return true;
}

apiRouter.post(['/website-inquiry', '/inquiry'], (req: Request, res: Response) => {
  try {
    const name =
      req.body.name ||
      req.body.customerName ||
      req.body.fullName ||
      req.body.clientName ||
      req.body['your-name'] ||
      '';
    const phone =
      req.body.phone ||
      req.body.mobile ||
      req.body.whatsapp ||
      req.body.contact ||
      req.body.phoneNumber ||
      req.body['your-phone'] ||
      '';
    const email =
      req.body.email ||
      req.body.mail ||
      req.body.emailAddress ||
      req.body['your-email'] ||
      '';
    const location =
      req.body.location ||
      req.body.area ||
      req.body.city ||
      req.body.venue ||
      'Bangalore';
    const eventType =
      req.body.eventType ||
      req.body.event ||
      req.body.occasion ||
      req.body.type ||
      'Not specified';
    // Missing values stay empty rather than being invented: a made-up event
    // date would trigger false date clashes and a made-up budget skews the pipeline.
    const rawDate = (req.body.eventDate || req.body.date || req.body.dateOfEvent || '').toString().trim();
    const eventDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : '';
    const service =
      req.body.service ||
      req.body.serviceRequired ||
      req.body.requirements ||
      req.body.floralServices ||
      'Floral & Event Decoration';
    const rawBudget =
      req.body.budget ||
      req.body.estimatedBudget ||
      req.body.amount ||
      0;
    const budget = typeof rawBudget === 'string' ? parseFloat(rawBudget.replace(/[^0-9.]/g, '')) || 0 : Number(rawBudget) || 0;
    const message =
      req.body.message ||
      req.body.details ||
      req.body.notes ||
      req.body.comments ||
      req.body['your-message'] ||
      '';

    // Honeypot: the website form has a hidden "company" field that people never
    // see. Bots fill every field; pretend success so they do not retry.
    if (req.body.company) {
      return res.status(201).json({ success: true, message: 'Thank you! Your inquiry has been received.' });
    }

    if (!allowInquiry(req.ip ?? 'unknown')) {
      return res.status(429).json({
        success: false,
        error: 'Too many inquiries from this connection. Please WhatsApp us instead.',
      });
    }

    const phoneDigits = phone.toString().replace(/\D/g, '');
    if (phoneDigits && (phoneDigits.length < 10 || phoneDigits.length > 13)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid phone number.' });
    }
    if (name.toString().length > 120 || message.toString().length > 2000) {
      return res.status(400).json({ success: false, error: 'Inquiry is too long.' });
    }

    if (!name.toString().trim() || !phone.toString().trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both Name and Phone number so our florist team can contact you.',
      });
    }

    // Check duplicate
    const dupCheck = db.checkDuplicateLead(phone.toString().trim(), name.toString().trim());

    const { lead, customer } = db.createLead({
      customerName: name.toString().trim(),
      phone: phone.toString().trim(),
      email: email.toString().trim(),
      location: location.toString().trim(),
      source: 'WEBSITE',
      eventType: eventType.toString().trim(),
      eventDate: eventDate.toString().trim(),
      serviceRequired: service.toString().trim(),
      budget,
      message: message.toString().trim(),
      priority: 'HIGH',
    });

    res.status(201).json({
      success: true,
      leadId: lead.id,
      lead,
      status: lead.status,
      message: 'Thank you! Your floral inquiry has been received. Our team will contact you shortly.',
      duplicateWarning: dupCheck.isDuplicate ? dupCheck.message : undefined,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.patch('/leads/:id', (req: Request, res: Response) => {
  try {
    const lead = db.leads.find((l) => l.id === req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    const previousStatus = lead.status;
    Object.assign(lead, req.body);

    if (req.body.status && req.body.status !== previousStatus) {
      lead.activities.push({
        id: `act-${Date.now()}`,
        type: 'STATUS_CHANGED',
        description: `Lead status updated from ${previousStatus} to ${req.body.status}.`,
        createdBy: req.body.updatedBy || 'Staff Admin',
        timestamp: new Date().toISOString(),
      });
    }

    db.recalculateFinancials();
    res.json({ success: true, data: lead });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/leads/:id/activity', (req: Request, res: Response) => {
  try {
    const lead = db.leads.find((l) => l.id === req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    const { type, description, createdBy } = req.body;
    if (!description) {
      return res.status(400).json({ success: false, error: 'Activity description is required' });
    }

    const activity = {
      id: `act-${Date.now()}`,
      type: type || 'NOTE_ADDED',
      description,
      createdBy: createdBy || 'Admin',
      timestamp: new Date().toISOString(),
    };

    lead.activities.push(activity);
    lead.lastContacted = new Date().toISOString();

    res.json({ success: true, data: activity, lead });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/leads/:id/convert', (req: Request, res: Response) => {
  try {
    const project = db.convertLeadToProject(req.params.id, req.body.overrides);
    res.status(201).json({ success: true, data: project });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/leads/:id', (req: Request, res: Response) => {
  try {
    const ok = db.deleteLead(req.params.id);
    if (!ok) return res.status(404).json({ success: false, error: 'Lead not found' });
    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Customers ---
apiRouter.get('/customers', (req: Request, res: Response) => {
  try {
    db.recalculateFinancials();
    const { search } = req.query;
    let customers = [...db.customers];

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      customers = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          (c.notes && c.notes.toLowerCase().includes(q))
      );
    }

    res.json({ success: true, data: customers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/customers', (req: Request, res: Response) => {
  try {
    const customer = db.createCustomer(req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/customers/:id', (req: Request, res: Response) => {
  try {
    db.recalculateFinancials();
    const customer = db.customers.find((c) => c.id === req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const customerLeads = db.leads.filter((l) => l.customerId === customer.id || customer.leadIds.includes(l.id));
    const customerProjects = db.projects.filter((p) => p.customerId === customer.id || customer.projectIds.includes(p.id));
    const customerInvoices = db.invoices.filter((i) => i.customerId === customer.id);

    res.json({
      success: true,
      data: {
        customer,
        leads: customerLeads,
        projects: customerProjects,
        invoices: customerInvoices,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.patch('/customers/:id', (req: Request, res: Response) => {
  try {
    const customer = db.updateCustomer(req.params.id, req.body);
    res.json({ success: true, data: customer });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/customers/:id/notes', (req: Request, res: Response) => {
  try {
    const { note, author } = req.body;
    if (!note || typeof note !== 'string' || !note.trim()) {
      return res.status(400).json({ success: false, error: 'Note text is required' });
    }
    const customer = db.addCustomerNote(req.params.id, note, author);
    res.json({ success: true, data: customer });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/customers/:id', (req: Request, res: Response) => {
  try {
    const ok = db.deleteCustomer(req.params.id);
    if (!ok) return res.status(404).json({ success: false, error: 'Customer not found' });
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Projects ---
apiRouter.get('/projects', (req: Request, res: Response) => {
  try {
    db.recalculateFinancials();
    const { status, eventType, search } = req.query;
    let projects = [...db.projects];

    if (status && status !== 'ALL') {
      projects = projects.filter((p) => p.status === status);
    }
    if (eventType && eventType !== 'ALL') {
      projects = projects.filter((p) => p.eventType === eventType);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      projects = projects.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.customerName.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.venue.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, data: projects });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/projects/:id', (req: Request, res: Response) => {
  try {
    db.recalculateFinancials();
    const project = db.projects.find((p) => p.id === req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    const projectInvoices = db.invoices.filter((i) => i.projectId === project.id);
    const projectPayments = db.payments.filter((p) => p.projectId === project.id);

    res.json({
      success: true,
      data: {
        project,
        invoices: projectInvoices,
        payments: projectPayments,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.patch('/projects/:id', (req: Request, res: Response) => {
  try {
    const project = db.projects.find((p) => p.id === req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    Object.assign(project, req.body);
    db.recalculateFinancials();
    res.json({ success: true, data: project });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/projects/:id', (req: Request, res: Response) => {
  try {
    const ok = db.deleteProject(req.params.id);
    if (!ok) return res.status(404).json({ success: false, error: 'Project not found' });
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update project milestone by index
apiRouter.all(['/projects/:id/milestones/:mIndex', '/projects/:id/milestones/:mIndex/update'], (req: Request, res: Response) => {
  try {
    const project = db.projects.find((p) => p.id === req.params.id);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const mIndex = parseInt(req.params.mIndex, 10);
    if (isNaN(mIndex) || mIndex < 0 || mIndex >= project.milestones.length) {
      return res.status(400).json({ success: false, error: 'Invalid milestone index' });
    }

    const { status, notes, completedDate, name, dueDate, responsiblePerson } = req.body;
    if (name) project.milestones[mIndex].name = name;
    if (status) project.milestones[mIndex].status = status;
    if (notes !== undefined) project.milestones[mIndex].notes = notes;
    if (dueDate) project.milestones[mIndex].dueDate = dueDate;
    if (responsiblePerson) project.milestones[mIndex].responsiblePerson = responsiblePerson;

    if (status === 'COMPLETED') {
      project.milestones[mIndex].completedDate = completedDate || new Date().toISOString().split('T')[0];
      // Automatically advance current milestone index if this was current
      if (project.currentMilestoneIndex === mIndex && mIndex + 1 < project.milestones.length) {
        project.currentMilestoneIndex = mIndex + 1;
        if (project.milestones[mIndex + 1].status === 'NOT_STARTED') {
          project.milestones[mIndex + 1].status = 'IN_PROGRESS';
        }
      }
    } else if (status === 'NOT_STARTED' || status === 'IN_PROGRESS') {
      project.milestones[mIndex].completedDate = undefined;
    }

    // Auto update project status
    const allCompleted = project.milestones.every((m) => m.status === 'COMPLETED');
    if (allCompleted) {
      project.status = 'COMPLETED';
    } else if (project.status === 'PLANNING' && (status === 'COMPLETED' || mIndex >= 2)) {
      project.status = 'IN_PROGRESS';
    }

    db.recalculateFinancials();
    res.json({ success: true, data: project });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add new custom milestone to project
apiRouter.post('/projects/:id/milestones', (req: Request, res: Response) => {
  try {
    const project = db.projects.find((p) => p.id === req.params.id);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const { name, status = 'NOT_STARTED', dueDate, responsiblePerson, notes } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Milestone name is required' });
    }

    const newMilestone: Milestone = {
      id: `ms-${project.id}-${Date.now()}`,
      name: name.trim(),
      status: status,
      dueDate: dueDate || project.eventDate,
      responsiblePerson: responsiblePerson || project.assignedStaff || 'Zaid Sheikh',
      notes: notes || `Milestone: ${name.trim()}`,
      completedDate: status === 'COMPLETED' ? new Date().toISOString().split('T')[0] : undefined,
    };

    project.milestones.push(newMilestone);
    db.recalculateFinancials();
    res.status(201).json({ success: true, data: project, milestone: newMilestone });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete milestone from project
apiRouter.delete('/projects/:id/milestones/:mIndex', (req: Request, res: Response) => {
  try {
    const project = db.projects.find((p) => p.id === req.params.id);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const mIndex = parseInt(req.params.mIndex, 10);
    if (isNaN(mIndex) || mIndex < 0 || mIndex >= project.milestones.length) {
      return res.status(400).json({ success: false, error: 'Invalid milestone index' });
    }

    project.milestones.splice(mIndex, 1);
    if (project.currentMilestoneIndex >= project.milestones.length) {
      project.currentMilestoneIndex = Math.max(0, project.milestones.length - 1);
    }

    db.recalculateFinancials();
    res.json({ success: true, data: project });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update full milestone list or reset/reorder
apiRouter.put('/projects/:id/milestones', (req: Request, res: Response) => {
  try {
    const project = db.projects.find((p) => p.id === req.params.id);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const { milestones, currentMilestoneIndex } = req.body;
    if (Array.isArray(milestones)) {
      project.milestones = milestones;
    }
    if (typeof currentMilestoneIndex === 'number') {
      project.currentMilestoneIndex = currentMilestoneIndex;
    }

    db.recalculateFinancials();
    res.json({ success: true, data: project });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Daily Project Update (PRD #24, #25)
apiRouter.post('/projects/:id/daily-update', (req: Request, res: Response) => {
  try {
    const { updateText, projectStatus, nextAction, addedBy } = req.body;
    if (!updateText) {
      return res.status(400).json({ success: false, error: 'Update text is mandatory' });
    }

    const log = db.addDailyUpdate(
      req.params.id,
      updateText,
      projectStatus || 'ON_TRACK',
      nextAction || '',
      addedBy || 'Admin'
    );

    res.status(201).json({ success: true, data: log });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Project Tasks (PRD #26)
apiRouter.post('/projects/:id/tasks', (req: Request, res: Response) => {
  try {
    const project = db.projects.find((p) => p.id === req.params.id);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const { title, assignedTo, dueDate } = req.body;
    if (!title) return res.status(400).json({ success: false, error: 'Task title is required' });

    const task = {
      id: `tsk-${Date.now()}`,
      projectId: project.id,
      title,
      assignedTo: assignedTo || project.assignedStaff,
      dueDate: dueDate || project.eventDate,
      status: 'TODO' as const,
    };

    project.tasks.push(task);
    res.status(201).json({ success: true, data: task });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.patch('/projects/:id/tasks/:taskId', (req: Request, res: Response) => {
  try {
    const project = db.projects.find((p) => p.id === req.params.id);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const task = project.tasks.find((t) => t.id === req.params.taskId);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });

    Object.assign(task, req.body);
    res.json({ success: true, data: task });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Project Procurement (Floral Wholesale & Materials Tracking) ---
apiRouter.post('/projects/:id/procurement', (req: Request, res: Response) => {
  try {
    const item = db.addProcurementItem(req.params.id, req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.patch('/projects/:id/procurement/:itemId', (req: Request, res: Response) => {
  try {
    const item = db.updateProcurementItem(req.params.id, req.params.itemId, req.body);
    res.json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/projects/:id/procurement/:itemId', (req: Request, res: Response) => {
  try {
    const ok = db.deleteProcurementItem(req.params.id, req.params.itemId);
    if (!ok) return res.status(404).json({ success: false, error: 'Procurement item not found' });
    res.json({ success: true, message: 'Item removed from procurement' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Project Event-Day Checklist (Pre-event, Transport, Setup, Dismantling) ---
apiRouter.post('/projects/:id/checklist', (req: Request, res: Response) => {
  try {
    const item = db.addChecklistItem(req.params.id, req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.patch('/projects/:id/checklist/:itemId', (req: Request, res: Response) => {
  try {
    const item = db.updateChecklistItem(req.params.id, req.params.itemId, req.body);
    res.json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Project Internal Notes & Journal ---
apiRouter.post('/projects/:id/notes', (req: Request, res: Response) => {
  try {
    const note = db.addProjectNote(req.params.id, req.body);
    res.status(201).json({ success: true, data: note });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Authentication is handled by Supabase Auth (see src/server/auth.ts); the old
// in-memory /auth/login, /auth/register and /auth/users routes were removed.

// --- Floral Templates Routes ---
apiRouter.get('/templates', (req: Request, res: Response) => {
  try {
    const templates = db.getFloralTemplates();
    res.json({ success: true, data: templates });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/templates/:id', (req: Request, res: Response) => {
  try {
    const template = db.getFloralTemplateById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Floral template not found' });
    }
    res.json({ success: true, data: template });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Quotations / Proposals (With Floral Recipes & Indian GST) ---
apiRouter.get('/quotations', (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;
    let quotes = db.getQuotations();

    if (status && status !== 'ALL') {
      quotes = quotes.filter((q) => q.status === status);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      quotes = quotes.filter(
        (item) =>
          item.quotationNumber.toLowerCase().includes(q) ||
          item.customerName.toLowerCase().includes(q) ||
          item.eventType.toLowerCase().includes(q) ||
          item.venue.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, data: quotes });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/quotations/:id', (req: Request, res: Response) => {
  try {
    const quotation = db.getQuotationById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }
    res.json({ success: true, data: quotation });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/quotations', (req: Request, res: Response) => {
  try {
    const { customerName, customerPhone, eventType, eventDate, venue, items } = req.body;
    if (!customerName || !customerPhone || !items || !items.length) {
      return res.status(400).json({
        success: false,
        error: 'Customer name, phone, and at least one item are required.',
      });
    }

    const quote = db.createQuotation(req.body);
    res.status(201).json({ success: true, data: quote });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.patch('/quotations/:id', (req: Request, res: Response) => {
  try {
    const updated = db.updateQuotation(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/quotations/:id', (req: Request, res: Response) => {
  try {
    const ok = db.deleteQuotation(req.params.id);
    if (!ok) return res.status(404).json({ success: false, error: 'Quotation not found' });
    res.json({ success: true, message: 'Quotation deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/quotations/:id/convert-to-project', (req: Request, res: Response) => {
  try {
    const project = db.convertQuotationToProject(req.params.id, req.body.overrides);
    res.status(201).json({ success: true, data: project });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Calendar Events & Admin Schedule Sync ---
apiRouter.get('/calendar/events', (req: Request, res: Response) => {
  try {
    const events: any[] = [];

    // 1. Projects (Event Days & Staging)
    for (const prj of db.projects) {
      events.push({
        id: `cal-prj-${prj.id}`,
        title: `🎪 ${prj.name}`,
        date: prj.eventDate,
        endDate: prj.endDate || prj.eventDate,
        type: 'EVENT_DAY',
        category: prj.eventType,
        venue: prj.venue,
        client: prj.customerName,
        phone: prj.phone,
        value: prj.projectValue,
        status: prj.status,
        assignedTo: prj.assignedStaff,
        milestone: prj.milestones[prj.currentMilestoneIndex]?.name || 'Active',
        notes: prj.notes || prj.serviceDescription,
        projectId: prj.id,
      });

      // Add setup milestone date if different
      if (prj.startDate && prj.startDate !== prj.eventDate) {
        events.push({
          id: `cal-setup-${prj.id}`,
          title: `🚚 Floral Staging & Setup: ${prj.customerName}`,
          date: prj.startDate,
          type: 'STAGING',
          category: prj.eventType,
          venue: prj.venue,
          client: prj.customerName,
          assignedTo: prj.assignedStaff,
          projectId: prj.id,
        });
      }
    }

    // 2. Lead Follow-ups
    for (const lead of db.leads) {
      if (lead.nextFollowUpDate) {
        events.push({
          id: `cal-lead-${lead.id}`,
          title: `📞 Follow-up: ${lead.customerName} (${lead.nextFollowUpType || 'Call'})`,
          date: lead.nextFollowUpDate,
          time: lead.nextFollowUpTime || '11:00 AM',
          type: 'LEAD_FOLLOW_UP',
          category: lead.eventType,
          venue: lead.venue || lead.location,
          client: lead.customerName,
          phone: lead.phone,
          status: lead.status,
          assignedTo: lead.assignedStaff,
          notes: lead.nextFollowUpNote,
          leadId: lead.id,
        });
      }
    }

    // 3. Quotation Expirations
    for (const quote of db.quotations) {
      if (quote.validUntil && quote.status === 'SENT') {
        events.push({
          id: `cal-quote-${quote.id}`,
          title: `⏳ Proposal Expiry: ${quote.customerName} (${quote.quotationNumber})`,
          date: quote.validUntil,
          type: 'PROPOSAL_EXPIRY',
          category: quote.eventType,
          client: quote.customerName,
          value: quote.total,
          quotationId: quote.id,
        });
      }
    }

    res.json({ success: true, data: events });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/calendar/export-ics', (req: Request, res: Response) => {
  try {
    const calName = 'Z S EVENTS - Event & Floral Schedule';
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Z S EVENTS//Bangalore Florist CRM//EN',
      `X-WR-CALNAME:${calName}`,
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    for (const prj of db.projects) {
      const dtStart = prj.eventDate.replace(/-/g, '');
      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:zse-event-${prj.id}@zsevents.com`);
      icsContent.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
      icsContent.push(`DTSTART;VALUE=DATE:${dtStart}`);
      icsContent.push(`SUMMARY:Z S EVENTS: ${prj.name}`);
      icsContent.push(`LOCATION:${prj.venue || 'Bangalore'}`);
      icsContent.push(`DESCRIPTION:Client: ${prj.customerName}\\nPhone: ${prj.phone}\\nType: ${prj.eventType}\\nValue: Rs ${prj.projectValue}\\nStage: ${prj.milestones[prj.currentMilestoneIndex]?.name || 'Active'}`);
      icsContent.push(`STATUS:CONFIRMED`);
      icsContent.push('END:VEVENT');
    }

    icsContent.push('END:VCALENDAR');
    const icsString = icsContent.join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="zs-events-schedule.ics"');
    res.send(icsString);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Finance: Invoices & Authoritative Calculations ---
apiRouter.get('/invoices', (req: Request, res: Response) => {
  try {
    db.recalculateFinancials();
    const { status, search } = req.query;
    let invoices = [...db.invoices];

    if (status && status !== 'ALL') {
      invoices = invoices.filter((i) => i.status === status);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      invoices = invoices.filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(q) ||
          i.customerName.toLowerCase().includes(q) ||
          (i.projectName && i.projectName.toLowerCase().includes(q))
      );
    }

    res.json({ success: true, data: invoices });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/invoices/:id', (req: Request, res: Response) => {
  try {
    const inv = db.invoices.find((i) => i.id === req.params.id || i.invoiceNumber === req.params.id);
    if (!inv) return res.status(404).json({ success: false, error: 'Invoice not found' });
    res.json({ success: true, data: inv });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/invoices', (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ success: false, error: 'At least one line item is required.' });
    }

    const invoice = db.createInvoice(req.body);
    res.status(201).json({ success: true, data: invoice });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/invoices/:id', (req: Request, res: Response) => {
  try {
    const idx = db.invoices.findIndex((i) => i.id === req.params.id || i.invoiceNumber === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Invoice not found' });
    db.invoices.splice(idx, 1);
    db.recalculateFinancials();
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.patch('/invoices/:id', (req: Request, res: Response) => {
  try {
    const invoice = db.updateInvoice(req.params.id, req.body);
    res.json({ success: true, data: invoice });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Payments ---
apiRouter.get('/payments', (req: Request, res: Response) => {
  try {
    db.recalculateFinancials();
    res.json({ success: true, data: db.payments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/payments', (req: Request, res: Response) => {
  try {
    const { invoiceId, amount, paymentDate, paymentMethod, referenceNumber, notes, createdBy } = req.body;
    if (!invoiceId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid invoice and positive amount are required.' });
    }

    const result = db.recordPayment({
      invoiceId,
      amount: Number(amount),
      paymentDate,
      paymentMethod,
      referenceNumber,
      notes,
      createdBy,
    });

    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.patch('/payments/:id', (req: Request, res: Response) => {
  try {
    const payment = db.updatePayment(req.params.id, req.body);
    res.json({ success: true, data: payment });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/payments/:id', (req: Request, res: Response) => {
  try {
    const ok = db.deletePayment(req.params.id);
    if (!ok) return res.status(404).json({ success: false, error: 'Payment not found' });
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Business Settings ---
apiRouter.get('/settings', (req: Request, res: Response) => {
  res.json({ success: true, data: db.settings });
});

apiRouter.patch('/settings', (req: Request, res: Response) => {
  try {
    Object.assign(db.settings, req.body);
    res.json({ success: true, data: db.settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Global Search (Across Leads, Projects, Customers, Invoices, Quotations) ---
apiRouter.get('/search', (req: Request, res: Response) => {
  try {
    const q = ((req.query.q as string) || '').toLowerCase().trim();
    if (!q) {
      return res.json({
        success: true,
        data: { leads: [], projects: [], customers: [], quotations: [], invoices: [] },
      });
    }

    const leads = db.leads
      .filter(
        (l) =>
          l.customerName.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          l.eventType.toLowerCase().includes(q) ||
          (l.venue && l.venue.toLowerCase().includes(q))
      )
      .slice(0, 5);

    const projects = db.projects
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.customerName.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          (p.venue && p.venue.toLowerCase().includes(q)) ||
          p.eventType.toLowerCase().includes(q)
      )
      .slice(0, 5);

    const customers = db.customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.companyName && c.companyName.toLowerCase().includes(q))
      )
      .slice(0, 5);

    const quotations = db.quotations
      .filter(
        (qt) =>
          qt.quotationNumber.toLowerCase().includes(q) ||
          qt.customerName.toLowerCase().includes(q) ||
          qt.eventType.toLowerCase().includes(q) ||
          (qt.venue && qt.venue.toLowerCase().includes(q))
      )
      .slice(0, 5);

    const invoices = db.invoices
      .filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.customerName.toLowerCase().includes(q) ||
          (inv.projectName && inv.projectName.toLowerCase().includes(q))
      )
      .slice(0, 5);

    res.json({
      success: true,
      data: { leads, projects, customers, quotations, invoices },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- AI Florist Assistant Endpoints ---
apiRouter.post('/ai/quotation-suggest', async (req: Request, res: Response) => {
  try {
    const { eventType, theme, budget, location, specialRequirements } = req.body;
    const result = await generateQuotationSuggestions({
      eventType: eventType || 'Wedding',
      theme,
      budget: Number(budget) || 150000,
      location: location || 'Bangalore',
      specialRequirements,
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/ai/whatsapp-draft', async (req: Request, res: Response) => {
  try {
    const { customerName, eventType, eventDate, budget, serviceRequired, tone } = req.body;
    if (!customerName) {
      return res.status(400).json({ success: false, error: 'Customer name is required' });
    }
    const message = await generateWhatsAppPitch({
      customerName,
      eventType: eventType || 'Wedding',
      eventDate: eventDate || new Date().toISOString().split('T')[0],
      budget: budget ? Number(budget) : undefined,
      serviceRequired,
      tone: tone || 'LUXURY',
    });
    res.json({ success: true, data: { message } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

