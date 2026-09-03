import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, Quotation, BusinessSettings } from '../types';

export function generateInvoicePDF(invoice: Invoice, settings?: BusinessSettings) {
  const doc = new jsPDF();
  const companyName = settings?.companyName || 'Z S EVENTS';
  const companyGstin = settings?.gstNumber || '29AAAAZ0000A1Z5';
  const companyPhone = settings?.phone || '+91 98450 99880';
  const companyEmail = settings?.email || 'syed@zsevents.com';
  const companyAddress = settings?.address || '128 Floral Boulevard, Indiranagar, Bangalore 560038';

  // Top Header Banner
  doc.setFillColor(23, 37, 84); // Navy Blue
  doc.rect(0, 0, 210, 38, 'F');

  // Gold accent bar
  doc.setFillColor(217, 119, 6); // Amber Gold
  doc.rect(0, 38, 210, 3, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, 14, 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text('WHERE EVERY CELEBRATION BLOOMS • LUXURY EVENT PRODUCTION', 14, 27);
  doc.text(`GSTIN: ${companyGstin} | SAC: 998599`, 14, 33);

  // Document Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TAX INVOICE', 196, 20, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(251, 191, 36);
  doc.text(`# ${invoice.invoiceNumber}`, 196, 28, { align: 'right' });
  doc.text(`Date: ${invoice.invoiceDate}`, 196, 34, { align: 'right' });

  // Bill To & Invoice Meta Information
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('BILLED TO / CLIENT:', 14, 52);
  doc.text('INVOICE DETAILS:', 125, 52);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  // Client info
  doc.text(invoice.customerName, 14, 58);
  if (invoice.customerPhone) doc.text(`Phone: ${invoice.customerPhone}`, 14, 63);
  if (invoice.customerEmail) doc.text(`Email: ${invoice.customerEmail}`, 14, 68);
  if (invoice.customerAddress) doc.text(`Address: ${invoice.customerAddress}`, 14, 73);
  if (invoice.customerGstin) doc.text(`Client GSTIN: ${invoice.customerGstin}`, 14, 78);

  // Meta info
  doc.text(`Project: ${invoice.projectName || 'Floral Decor Package'}`, 125, 58);
  doc.text(`Due Date: ${invoice.dueDate}`, 125, 63);
  doc.text(`Status: ${invoice.status}`, 125, 68);
  doc.text(`Place of Supply: Karnataka (29)`, 125, 73);
  doc.text(`Reverse Charge: ${invoice.reverseCharge ? 'Yes' : 'No'}`, 125, 78);

  // Items Table
  const tableData = invoice.items.map((item, index) => [
    index + 1,
    item.description,
    item.hsnSac || '998599',
    item.quantity,
    item.unit || 'Set',
    `Rs. ${Number(item.unitPrice).toLocaleString('en-IN')}`,
    `Rs. ${Number(item.amount).toLocaleString('en-IN')}`,
  ]);

  autoTable(doc, {
    startY: 85,
    head: [['#', 'Description of Floral Services & Materials', 'HSN/SAC', 'Qty', 'Unit', 'Rate (INR)', 'Amount (INR)']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8.5,
      textColor: [51, 65, 85],
      cellPadding: 3.5,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 25, halign: 'right' },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 150;

  // Calculation Breakdown Box
  const startBoxY = finalY + 8;

  // Bank Details Left Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, startBoxY, 95, 45, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, startBoxY, 95, 45, 2, 2, 'S');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('BANK & PAYMENT DETAILS', 18, startBoxY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Account Name: ${settings?.companyName || 'Z S EVENTS'}`, 18, startBoxY + 14);
  doc.text(`Bank: ${settings?.bankName || 'HDFC Bank Ltd, Indiranagar Branch'}`, 18, startBoxY + 20);
  doc.text(`A/C No: ${settings?.bankAccountNo || '50200084729103'}`, 18, startBoxY + 26);
  doc.text(`IFSC Code: ${settings?.bankIfsc || 'HDFC0000184'}`, 18, startBoxY + 32);
  doc.text(`UPI VPA: ${settings?.bankUpiId || 'zsevents@hdfcbank'}`, 18, startBoxY + 38);

  // Financial Breakdown Right Box
  const rightX = 120;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  const subtotal = invoice.subtotal;
  const discount = invoice.discount || 0;
  const taxable = invoice.taxableAmount || Math.max(0, subtotal - discount);
  const isInterstate = invoice.isInterstate;
  const cgst = invoice.cgstAmount || (isInterstate ? 0 : (taxable * 9) / 100);
  const sgst = invoice.sgstAmount || (isInterstate ? 0 : (taxable * 9) / 100);
  const igst = invoice.igstAmount || (isInterstate ? (taxable * 18) / 100 : 0);
  const total = invoice.total;
  const paid = invoice.amountPaid || 0;
  const balance = invoice.balance ?? Math.max(0, total - paid);

  let curY = startBoxY + 5;
  doc.text('Subtotal:', rightX, curY);
  doc.text(`Rs. ${subtotal.toLocaleString('en-IN')}`, 196, curY, { align: 'right' });

  if (discount > 0) {
    curY += 5;
    doc.text('Discount:', rightX, curY);
    doc.text(`- Rs. ${discount.toLocaleString('en-IN')}`, 196, curY, { align: 'right' });
  }

  curY += 5;
  doc.text('Taxable Value:', rightX, curY);
  doc.text(`Rs. ${taxable.toLocaleString('en-IN')}`, 196, curY, { align: 'right' });

  if (isInterstate) {
    curY += 5;
    doc.text('IGST @ 18%:', rightX, curY);
    doc.text(`Rs. ${igst.toLocaleString('en-IN')}`, 196, curY, { align: 'right' });
  } else {
    curY += 5;
    doc.text('CGST @ 9%:', rightX, curY);
    doc.text(`Rs. ${cgst.toLocaleString('en-IN')}`, 196, curY, { align: 'right' });

    curY += 5;
    doc.text('SGST @ 9%:', rightX, curY);
    doc.text(`Rs. ${sgst.toLocaleString('en-IN')}`, 196, curY, { align: 'right' });
  }

  curY += 6;
  doc.setDrawColor(203, 213, 225);
  doc.line(rightX, curY - 2, 196, curY - 2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Total (incl. GST):', rightX, curY + 3);
  doc.text(`Rs. ${total.toLocaleString('en-IN')}`, 196, curY + 3, { align: 'right' });

  curY += 8;
  doc.setFontSize(8.5);
  doc.setTextColor(22, 101, 52);
  doc.text('Amount Received:', rightX, curY);
  doc.text(`Rs. ${paid.toLocaleString('en-IN')}`, 196, curY, { align: 'right' });

  curY += 5;
  doc.setTextColor(185, 28, 28);
  doc.text('Balance Due:', rightX, curY);
  doc.text(`Rs. ${balance.toLocaleString('en-IN')}`, 196, curY, { align: 'right' });

  // Notes & Footer
  const footerY = Math.max(startBoxY + 54, curY + 12);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Terms & Conditions: Payments via NEFT/RTGS/UPI. Interest @ 18% p.a. charged on overdue bills.', 14, footerY);
  doc.text(`Z S EVENTS | ${companyAddress} | Ph: ${companyPhone} | Email: ${companyEmail}`, 14, footerY + 5);

  doc.save(`${invoice.invoiceNumber}.pdf`);
}

export function generateQuotationPDF(quotation: Quotation, settings?: BusinessSettings) {
  const doc = new jsPDF();
  const companyName = settings?.companyName || 'Z S EVENTS';
  const companyGstin = settings?.gstNumber || '29AAAAZ0000A1Z5';
  const companyPhone = settings?.phone || '+91 98450 99880';
  const companyEmail = settings?.email || 'syed@zsevents.com';
  const companyAddress = settings?.address || '128 Floral Boulevard, Indiranagar, Bangalore 560038';

  // Top Header Banner (Rose/Gold luxury tone)
  doc.setFillColor(15, 23, 42); // Midnight Slate
  doc.rect(0, 0, 210, 38, 'F');

  doc.setFillColor(244, 114, 182); // Soft Floral Pink bar
  doc.rect(0, 38, 210, 3, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, 14, 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(244, 114, 182);
  doc.text('WHERE EVERY CELEBRATION BLOOMS • LUXURY EVENT & FLORAL PROPOSAL', 14, 27);
  doc.setTextColor(203, 213, 225);
  doc.text(`GSTIN: ${companyGstin} | Official Estimate & Moodboard Scope`, 14, 33);

  // Document Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('FLORAL PROPOSAL', 196, 20, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(249, 168, 212);
  doc.text(`# ${quotation.quotationNumber}`, 196, 28, { align: 'right' });
  doc.text(`Valid Until: ${quotation.validUntil}`, 196, 34, { align: 'right' });

  // Proposal Meta Details
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT & EVENT INFORMATION:', 14, 52);
  doc.text('DESIGN & VENUE SPECIFICATIONS:', 120, 52);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  // Client info
  doc.text(quotation.customerName, 14, 58);
  doc.text(`Phone: ${quotation.customerPhone}`, 14, 63);
  if (quotation.customerEmail) doc.text(`Email: ${quotation.customerEmail}`, 14, 68);
  if (quotation.customerAddress) doc.text(`City: ${quotation.customerAddress}`, 14, 73);

  // Event info
  doc.text(`Event Type: ${quotation.eventType}`, 120, 58);
  doc.text(`Event Date: ${quotation.eventDate}`, 120, 63);
  doc.text(`Venue: ${quotation.venue}`, 120, 68);
  if (quotation.templateName) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(190, 24, 93);
    doc.text(`Concept: ${quotation.templateName}`, 120, 73);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
  }

  // Items Table
  const tableData = quotation.items.map((item, index) => [
    index + 1,
    item.description,
    item.hsnSac || '998599',
    item.quantity,
    item.unit || 'Set',
    `Rs. ${Number(item.unitPrice).toLocaleString('en-IN')}`,
    `Rs. ${Number(item.amount).toLocaleString('en-IN')}`,
  ]);

  autoTable(doc, {
    startY: 82,
    head: [['#', 'Floral Design Scope & Staging Elements', 'SAC', 'Qty', 'Unit', 'Rate (INR)', 'Amount (INR)']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8.5,
      textColor: [51, 65, 85],
      cellPadding: 3.5,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 26, halign: 'right' },
      6: { cellWidth: 26, halign: 'right' },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 150;
  const startBoxY = finalY + 8;

  // Terms and conditions left box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, startBoxY, 100, 52, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, startBoxY, 100, 52, 2, 2, 'S');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('TERMS OF SERVICE & BOOKING', 18, startBoxY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);

  const terms = quotation.termsAndConditions || [
    '50% advance upon quotation sign-off to reserve dates and fresh flower stocks.',
    '40% upon staging structural frame setup 12 hours prior to the event.',
    '10% balance payable at venue handover before guests arrive.',
    'Includes 18% GST (9% CGST + 9% SGST). SAC Code: 998599.',
  ];

  terms.slice(0, 4).forEach((term, idx) => {
    const lines = doc.splitTextToSize(`• ${term}`, 92);
    doc.text(lines, 18, startBoxY + 14 + idx * 9);
  });

  // Financial Breakdown Right Box
  const rightX = 125;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  const subtotal = quotation.subtotal;
  const discount = quotation.discount || 0;
  const taxable = quotation.taxableAmount || Math.max(0, subtotal - discount);
  const cgst = quotation.cgstAmount || (taxable * 9) / 100;
  const sgst = quotation.sgstAmount || (taxable * 9) / 100;
  const total = quotation.total;

  let curY = startBoxY + 6;
  doc.text('Proposal Subtotal:', rightX, curY);
  doc.text(`Rs. ${subtotal.toLocaleString('en-IN')}`, 196, curY, { align: 'right' });

  if (discount > 0) {
    curY += 6;
    doc.text('Special Courtesy Discount:', rightX, curY);
    doc.text(`- Rs. ${discount.toLocaleString('en-IN')}`, 196, curY, { align: 'right' });
  }

  curY += 6;
  doc.text('Net Taxable Amount:', rightX, curY);
  doc.text(`Rs. ${taxable.toLocaleString('en-IN')}`, 196, curY, { align: 'right' });

  curY += 6;
  doc.text('CGST @ 9% (SAC 998599):', rightX, curY);
  doc.text(`Rs. ${cgst.toLocaleString('en-IN')}`, 196, curY, { align: 'right' });

  curY += 6;
  doc.text('SGST @ 9% (SAC 998599):', rightX, curY);
  doc.text(`Rs. ${sgst.toLocaleString('en-IN')}`, 196, curY, { align: 'right' });

  curY += 7;
  doc.setDrawColor(203, 213, 225);
  doc.line(rightX, curY - 2, 196, curY - 2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Estimated Total:', rightX, curY + 3);
  doc.text(`Rs. ${total.toLocaleString('en-IN')}`, 196, curY + 3, { align: 'right' });

  // Signature Block
  curY += 16;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Prepared By: ${quotation.preparedBy || 'Zaid Sheikh'}`, rightX, curY);
  doc.text('Authorized Signatory: Z S EVENTS', rightX, curY + 5);

  const footerY = Math.max(startBoxY + 60, curY + 12);
  doc.setFontSize(7.5);
  doc.text(`Z S EVENTS | ${companyAddress} | Ph: ${companyPhone} | Email: ${companyEmail}`, 14, footerY);

  doc.save(`${quotation.quotationNumber}.pdf`);
}
