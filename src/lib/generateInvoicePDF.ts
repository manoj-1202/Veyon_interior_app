import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const inr = (value: number) => `INR ${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  projectTitle: string;
  projectType: string;
  company: { name: string; address: string; gstin: string; phone: string; email: string; logoUrl?: string };
  bank: { bank_account_name: string; bank_account_number: string; bank_ifsc: string; bank_name: string };
  client: { name: string; address: string; gstin: string; phone: string; email: string };
  site: { address: string; contactName: string; contactPhone: string; measurementDate: string; installationDate: string };
  items: {
    name: string; description: string; qty: number; unit: string; price: number; total: number;
    width: number | null; height: number | null; profile: string; glass: string; finish: string; hardware: string; installation: boolean;
  }[];
  subtotal: number;
  discountAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  roundOff: number;
  total: number;
  totalPaid: number;
  balanceDue: number;
  gstType: 'cgst_sgst' | 'igst' | 'no_gst';
  terms: { terms_and_conditions?: string };
  disclaimer?: string;
}

export async function generateInvoicePDF(invoice: InvoiceData) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const green: [number, number, number] = [31, 91, 71];
  const ink: [number, number, number] = [39, 48, 43];
  const muted: [number, number, number] = [101, 111, 105];

  pdf.setFillColor(...green); pdf.rect(0, 0, width, 39, 'F');
  pdf.setTextColor(255, 255, 255); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18);
  let brandX = margin;
  if (invoice.company.logoUrl) {
    try {
      const response = await fetch(invoice.company.logoUrl);
      const blob = await response.blob();
      const logoData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob);
      });
      pdf.addImage(logoData, blob.type.toLowerCase().includes('png') ? 'PNG' : 'JPEG', margin, 6, 23, 23);
      brandX = margin + 29;
    } catch { /* Keep the text brand mark if the uploaded logo cannot be loaded. */ }
  }
  pdf.text(invoice.company.name || 'Veyon Interiors', brandX, 17);
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8);
  const companyMeta = [invoice.company.address, invoice.company.phone, invoice.company.email, invoice.company.gstin && `GSTIN ${invoice.company.gstin}`].filter(Boolean).join('  |  ');
  pdf.text(pdf.splitTextToSize(companyMeta, width - brandX - margin - 55), brandX, 24);
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(15); pdf.text('TAX INVOICE', width - margin, 16, { align: 'right' });
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.text(invoice.invoiceNumber, width - margin, 23, { align: 'right' });

  let y = 48;
  const section = (title: string, x: number, top: number) => { pdf.setTextColor(...green); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.text(title.toUpperCase(), x, top); };
  section('Bill to', margin, y);
  section('Invoice details', width / 2 + 5, y);
  y += 6;
  pdf.setTextColor(...ink); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.text(invoice.client.name || 'Customer', margin, y);
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8);
  const customerLines = [invoice.client.address, invoice.client.phone, invoice.client.email, invoice.client.gstin && `GSTIN ${invoice.client.gstin}`].filter(Boolean);
  pdf.text(pdf.splitTextToSize(customerLines.join('\n'), 78), margin, y + 5);
  const metaX = width / 2 + 5;
  pdf.setTextColor(...ink); pdf.setFontSize(8);
  pdf.text(`Invoice no.  ${invoice.invoiceNumber}`, metaX, y);
  pdf.text(`Issue date  ${invoice.date}`, metaX, y + 5);
  pdf.text(`Due date  ${invoice.dueDate}`, metaX, y + 10);
  pdf.text(`Project  ${invoice.projectTitle}`, metaX, y + 15, { maxWidth: width - metaX - margin });
  pdf.text(`Type  ${invoice.projectType}`, metaX, y + 20);
  y += 36;

  if (invoice.site.address || invoice.site.contactName || invoice.site.measurementDate || invoice.site.installationDate) {
    section('Installation site', margin, y); y += 5;
    pdf.setTextColor(...ink); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8);
    const siteRows = [[invoice.site.address || '-', [invoice.site.contactName, invoice.site.contactPhone].filter(Boolean).join(' | ') || '-', invoice.site.measurementDate || '-', invoice.site.installationDate || '-']];
    autoTable(pdf, { startY: y, head: [['Site address', 'Site contact', 'Measured', 'Installation']], body: siteRows, theme: 'grid', styles: { font: 'helvetica', fontSize: 7, cellPadding: 2.5, textColor: ink, lineColor: [222, 228, 223] }, headStyles: { fillColor: [239, 244, 240], textColor: green, fontStyle: 'bold' }, margin: { left: margin, right: margin } });
    y = (pdf as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y + 15;
    y += 7;
  }

  section('Items supplied & installed', margin, y); y += 3;
  autoTable(pdf, {
    startY: y,
    head: [['Product / work', 'Specification', 'Qty', 'Unit', 'Rate', 'Amount']],
    body: invoice.items.map((item) => {
      const dimensions = item.width || item.height ? `${item.width || '-'} x ${item.height || '-'} mm` : '';
      const specs = [dimensions, item.profile && `Profile / material: ${item.profile}`, item.glass && `Product spec: ${item.glass}`, item.finish && `Finish: ${item.finish}`, item.hardware && `Hardware: ${item.hardware}`, item.installation ? 'Installation included' : 'Installation excluded'].filter(Boolean).join('\n');
      return [[item.name, item.description].filter(Boolean).join('\n'), specs || '-', String(item.qty), item.unit, inr(item.price), inr(item.total)];
    }),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2.8, textColor: ink, lineColor: [222, 228, 223], lineWidth: 0.15, overflow: 'linebreak' },
    headStyles: { fillColor: green, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 249, 246] },
    columnStyles: { 0: { cellWidth: 36 }, 1: { cellWidth: 59 }, 2: { cellWidth: 12, halign: 'right' }, 3: { cellWidth: 16 }, 4: { cellWidth: 27, halign: 'right' }, 5: { cellWidth: 29, halign: 'right' } },
    margin: { left: margin, right: margin },
  });
  y = ((pdf as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y + 20) + 8;
  if (y > height - 65) { pdf.addPage(); y = 20; }

  const labelX = width - margin - 75;
  const amountX = width - margin;
  const totalLine = (label: string, value: number, bold = false) => {
    pdf.setTextColor(...ink); pdf.setFont('helvetica', bold ? 'bold' : 'normal'); pdf.setFontSize(bold ? 10 : 8);
    pdf.text(label, labelX, y); pdf.text(inr(value), amountX, y, { align: 'right' }); y += bold ? 7 : 5;
  };
  totalLine('Subtotal', invoice.subtotal);
  if (invoice.discountAmount > 0) totalLine('Discount', -invoice.discountAmount);
  if (invoice.gstType === 'cgst_sgst') { totalLine('CGST', invoice.cgstAmount); totalLine('SGST', invoice.sgstAmount); }
  if (invoice.gstType === 'igst') totalLine('IGST', invoice.igstAmount);
  if (invoice.roundOff) totalLine('Round off', invoice.roundOff);
  pdf.setDrawColor(...green); pdf.line(labelX, y - 2, amountX, y - 2);
  totalLine('Grand total', invoice.total, true);
  totalLine('Paid to date', invoice.totalPaid);
  totalLine('Balance due', invoice.balanceDue, true);

  const bankLines = [invoice.bank.bank_account_name, invoice.bank.bank_name, invoice.bank.bank_account_number, invoice.bank.bank_ifsc].filter(Boolean);
  if (bankLines.length) {
    pdf.setTextColor(...green); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.text('PAYMENT DETAILS', margin, y + 3);
    pdf.setTextColor(...muted); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7);
    pdf.text(bankLines.join('  |  '), margin, y + 8, { maxWidth: width - margin * 2 });
    y += 13;
  }
  if (invoice.terms.terms_and_conditions || invoice.disclaimer) {
    if (y > height - 28) { pdf.addPage(); y = 20; }
    pdf.setTextColor(...green); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.text('TERMS & NOTES', margin, y + 3);
    pdf.setTextColor(...muted); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7);
    const text = [invoice.terms.terms_and_conditions, invoice.disclaimer].filter(Boolean).join('\n');
    pdf.text(pdf.splitTextToSize(text, width - margin * 2), margin, y + 8);
  }
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page); pdf.setDrawColor(226, 231, 227); pdf.line(margin, height - 13, width - margin, height - 13);
    pdf.setTextColor(...muted); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7);
    pdf.text(`${invoice.company.name || 'Veyon Interiors'}  |  Thank you for your business`, margin, height - 8);
    pdf.text(`${page} / ${pages}`, width - margin, height - 8, { align: 'right' });
  }
  pdf.save(`${invoice.invoiceNumber}.pdf`);
}
