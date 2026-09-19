import nodemailer from 'nodemailer';
import type { Lead } from '../types.js';

// Email alert for every new website enquiry.
//
// Configured entirely through environment variables so no credential lives in
// the code. For Gmail, SMTP_PASS is a 16-character App Password (Google
// Account > Security > 2-Step Verification > App passwords), not the normal
// account password.
//
//   SMTP_HOST=smtp.gmail.com  SMTP_PORT=465
//   SMTP_USER=zs.events62@gmail.com  SMTP_PASS=<app password>
//   INQUIRY_NOTIFY_TO=zs.events62@gmail.com   (comma separated for several)
//
// When SMTP is not configured this is a no-op: the lead is still saved in the
// CRM, only the email is skipped.

function readConfig() {
  const user = process.env.SMTP_USER ?? '';
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    user,
    pass: process.env.SMTP_PASS ?? '',
    to: process.env.INQUIRY_NOTIFY_TO || user,
  };
}

export function isEmailConfigured(): boolean {
  const c = readConfig();
  return Boolean(c.user && c.pass && c.to);
}

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);

export async function sendInquiryEmail(lead: Lead, message: string): Promise<'sent' | 'skipped'> {
  if (!isEmailConfigured()) return 'skipped';
  const c = readConfig();

  const phoneDigits = lead.phone.replace(/\D/g, '');
  const waNumber = phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits;
  const rows: [string, string][] = [
    ['Name', lead.customerName],
    ['Phone', lead.phone],
    ['Email', lead.email || '-'],
    ['Event', lead.eventType],
    ['Event date', lead.eventDate || 'Not given'],
    ['Area', lead.location],
    ['Service', lead.serviceRequired],
    ['Budget', lead.budget ? `Rs ${lead.budget.toLocaleString('en-IN')}` : 'Not given'],
    ['Message', message || '-'],
    ['CRM lead ID', lead.id],
  ];

  const transporter = nodemailer.createTransport({
    host: c.host,
    port: c.port,
    secure: c.port === 465,
    auth: { user: c.user, pass: c.pass },
  });

  await transporter.sendMail({
    from: `"ZS Events Website" <${c.user}>`,
    to: c.to,
    replyTo: lead.email || undefined,
    subject: `New enquiry: ${lead.customerName} - ${lead.eventType}${lead.eventDate ? ` on ${lead.eventDate}` : ''}`,
    text: rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\nWhatsApp: https://wa.me/${waNumber}\nCRM: https://crm.zsevents.in`,
    html: `<h2 style="font-family:sans-serif;color:#831843">New website enquiry</h2>
<table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">
${rows.map(([k, v]) => `<tr><td style="padding:6px 12px;color:#666">${esc(k)}</td><td style="padding:6px 12px"><b>${esc(v)}</b></td></tr>`).join('\n')}
</table>
<p style="font-family:sans-serif"><a href="tel:${esc(lead.phone)}">Call</a> &middot;
<a href="https://wa.me/${waNumber}">WhatsApp</a> &middot;
<a href="https://crm.zsevents.in">Open CRM</a></p>`,
  });
  return 'sent';
}
