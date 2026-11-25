import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from '../components/assest/logo.png';

interface ClientPaymentData {
  clientName: string;
  productionHouse: string | null;
  phone: string | null;
  email: string | null;
  state: string;
  totalInvoices: number;
  totalAmount: number;
  totalPaid: number;
  balanceDue: number;
  completedCount: number;
  partiallyPaidCount: number;
  overdueCount: number;
}

interface MonthlyRevenue {
  month: string;
  amount: number;
  cameramanAmount: number;
  soundAmount: number;
}

interface ReportData {
  clients: ClientPaymentData[];
  monthlyRevenue: MonthlyRevenue[];
  summary: {
    totalClients: number;
    totalRevenue: number;
    cameramanRevenue: number;
    soundRevenue: number;
    totalOutstanding: number;
    completedInvoices: number;
    partiallyPaidInvoices: number;
    overdueInvoices: number;
  };
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  generatedAt: string;
}

const getBase64ImageFromURL = async (url: string) => {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const formatCurrency = (amount: number) => {
  return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const generateCustomerReportPDF = async (data: ReportData) => {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;
  let y = 15;

  // Load logo
  const logoBase64 = await getBase64ImageFromURL(logo);
  const logoWidth = 20;
  const logoHeight = 20;

  // Header with logo
  pdf.addImage(logoBase64, 'PNG', margin, y, logoWidth, logoHeight);

  // Report title
  pdf.setFontSize(20);
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(38, 84, 124);
  pdf.text('CUSTOMER PAYMENT REPORT', pageWidth / 2, y + 12, { align: 'center' });

  // Company name and date
  pdf.setFontSize(10);
  pdf.setFont(undefined, 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text(data.company.name, pageWidth - margin, y + 24, { align: 'right' });
  pdf.text(`Generated: ${data.generatedAt}`, pageWidth - margin, y + 28, { align: 'right' });

  y += logoHeight + 15;

  // Divider
  pdf.setDrawColor(38, 84, 124);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Summary Section
  pdf.setFontSize(14);
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(38, 84, 124);
  pdf.text('Summary Overview', margin, y);
  y += 8;

  // Summary boxes
  const boxWidth = (pageWidth - margin * 2 - 10) / 3;
  const boxHeight = 25;
  
  // Row 1
  const summaryItems = [
    { label: 'Total Clients', value: data.summary.totalClients.toString(), color: [38, 84, 124] },
    { label: 'Total Revenue', value: formatCurrency(data.summary.totalRevenue), color: [34, 139, 34] },
    { label: 'Outstanding Balance', value: formatCurrency(data.summary.totalOutstanding), color: [220, 53, 69] },
  ];

  summaryItems.forEach((item, index) => {
    const x = margin + (index * (boxWidth + 5));
    pdf.setFillColor(245, 247, 250);
    pdf.roundedRect(x, y, boxWidth, boxHeight, 2, 2, 'F');
    
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text(item.label, x + 5, y + 8);
    
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(item.color[0], item.color[1], item.color[2]);
    pdf.text(item.value, x + 5, y + 18);
  });

  y += boxHeight + 5;

  // Row 2 - Invoice status
  const statusItems = [
    { label: 'Completed Invoices', value: data.summary.completedInvoices.toString(), color: [34, 139, 34] },
    { label: 'Partially Paid', value: data.summary.partiallyPaidInvoices.toString(), color: [255, 165, 0] },
    { label: 'Overdue Invoices', value: data.summary.overdueInvoices.toString(), color: [220, 53, 69] },
  ];

  statusItems.forEach((item, index) => {
    const x = margin + (index * (boxWidth + 5));
    pdf.setFillColor(245, 247, 250);
    pdf.roundedRect(x, y, boxWidth, boxHeight, 2, 2, 'F');
    
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text(item.label, x + 5, y + 8);
    
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(item.color[0], item.color[1], item.color[2]);
    pdf.text(item.value, x + 5, y + 18);
  });

  y += boxHeight + 15;

  // Monthly Revenue Section
  pdf.setFontSize(14);
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(38, 84, 124);
  pdf.text('Monthly Revenue', margin, y);
  y += 8;

  const monthTableData = data.monthlyRevenue.map((m) => [
    m.month,
    formatCurrency(m.amount),
    formatCurrency(m.cameramanAmount),
    formatCurrency(m.soundAmount),
  ]);
  autoTable(pdf, {
    startY: y,
    head: [['Month', 'Collected Revenue', 'Cameraman Revenue', 'Sound Related Revenue']],
    body: monthTableData,
    theme: 'grid',
    headStyles: {
      fillColor: [38, 84, 124],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [50, 50, 50],
    },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 43, halign: 'right' },
      2: { cellWidth: 43, halign: 'right' },
      3: { cellWidth: 43, halign: 'right' },
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      // Footer on each page
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Page ${pdf.getCurrentPageInfo().pageNumber}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = ((pdf as any).lastAutoTable?.finalY || y) + 10;

  pdf.setFontSize(9);
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(50, 50, 50);
  pdf.text(
    `Cameraman Total: ${formatCurrency(data.summary.cameramanRevenue)}    Sound Related Total: ${formatCurrency(data.summary.soundRevenue)}`,
    margin,
    y
  );
  y += 10;

  // Client Details Table
  pdf.setFontSize(14);
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(38, 84, 124);
  pdf.text('Client Payment Details', margin, y);
  y += 8;

  const tableData = data.clients.map(client => [
    client.clientName,
    client.productionHouse || '-',
    client.phone || '-',
    client.totalInvoices.toString(),
    formatCurrency(client.totalAmount),
    formatCurrency(client.totalPaid),
    formatCurrency(client.balanceDue),
    `${client.completedCount}/${client.partiallyPaidCount}/${client.overdueCount}`,
  ]);

  autoTable(pdf, {
    startY: y,
    head: [[
      'Client Name',
      'Production House',
      'Phone',
      'Invoices',
      'Total Amount',
      'Paid',
      'Balance',
      // 'C/P/O'
    ]],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [38, 84, 124],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [50, 50, 50],
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 30 },
      2: { cellWidth: 22 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 17, halign: 'center' },
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      // Footer on each page
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Page ${pdf.getCurrentPageInfo().pageNumber}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    },
  });

  // Legend at the bottom
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = ((pdf as any).lastAutoTable?.finalY || y) + 10;
  pdf.setFontSize(8);
  pdf.setFont(undefined, 'italic');
  pdf.setTextColor(100, 100, 100);
  // pdf.text('C/P/O = Completed / Partially Paid / Overdue invoices count', margin, finalY);

  // Save PDF
  const fileName = `Customer-Report-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

export type { ClientPaymentData, ReportData };
