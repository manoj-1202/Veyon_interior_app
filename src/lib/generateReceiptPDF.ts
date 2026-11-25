import jsPDF from "jspdf";

export interface ReceiptData {
  receiptNumber: string;
  receiptDate: string;
  amount: number;
  balanceAfterPayment: number;
  
  paymentMethod: string;
  transactionReference: string | null;
  
  invoiceNumber: string;
  projectTitle: string;
  clientName: string;
  
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logoUrl?: string;
  };
}

const paymentMethodLabels: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  upi: 'UPI',
  cash: 'Cash',
  cheque: 'Cheque',
  card: 'Card',
};

export const generateReceiptPDF = async (receipt: ReceiptData) => {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  const green: [number, number, number] = [31, 91, 71];
  pdf.setFillColor(...green);
  pdf.rect(0, 0, pageWidth, 42, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(17);
  pdf.setFont(undefined, 'bold');
  let brandX = margin;
  if (receipt.company.logoUrl) {
    try {
      const response = await fetch(receipt.company.logoUrl);
      const blob = await response.blob();
      const logoData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob);
      });
      pdf.addImage(logoData, blob.type.toLowerCase().includes('png') ? 'PNG' : 'JPEG', margin, 7, 23, 23);
      brandX = margin + 29;
    } catch { /* Keep the text brand mark if the uploaded logo cannot be loaded. */ }
  }
  pdf.text(receipt.company.name || 'Veyon Interiors', brandX, 18);
  pdf.setFontSize(10);
  pdf.text('PAYMENT RECEIPT', pageWidth - margin, 18, { align: 'right' });

  // Receipt details on the right
  pdf.setFontSize(8);
  pdf.setFont(undefined, 'normal');
  pdf.setTextColor(235, 242, 237);
  pdf.text(`Receipt ${receipt.receiptNumber}  |  ${receipt.receiptDate}`, pageWidth - margin, 26, { align: 'right' });

  y = 55;

  // Divider line
  pdf.setDrawColor(...green);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 15;

  // Company details
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(12);
  pdf.setFont(undefined, 'bold');
  pdf.text('From:', margin, y);
  
  pdf.setFont(undefined, 'normal');
  pdf.setFontSize(10);
  pdf.text(receipt.company.name, margin, y + 7);
  pdf.text(receipt.company.address || '', margin, y + 13, { maxWidth: 80 });
  if (receipt.company.phone) pdf.text(`Phone: ${receipt.company.phone}`, margin, y + 25);
  if (receipt.company.email) pdf.text(`Email: ${receipt.company.email}`, margin, y + 31);

  // Client details
  pdf.setFontSize(12);
  pdf.setFont(undefined, 'bold');
  pdf.text('To:', pageWidth / 2 + 10, y);
  
  pdf.setFont(undefined, 'normal');
  pdf.setFontSize(10);
  pdf.text(receipt.clientName, pageWidth / 2 + 10, y + 7);

  y += 45;

  // Payment Details Box
  const boxWidth = pageWidth - margin * 2;
  const boxHeight = 70;
  
  pdf.setFillColor(246, 248, 245);
  pdf.roundedRect(margin, y, boxWidth, boxHeight, 3, 3, 'F');
  
  pdf.setFontSize(14);
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(...green);
  pdf.text('Payment Details', margin + 10, y + 12);
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  pdf.setFont(undefined, 'normal');
  
  const detailsStartY = y + 22;
  const col1X = margin + 10;
  const valueX = col1X + 50;
  const valueMaxWidth = pageWidth - margin - valueX - 10;
  const hasRef = Boolean(receipt.transactionReference);
  
  const drawDetailRow = (
    label: string,
    value: string,
    yPos: number,
    options?: { valueFontSize?: number; valueColor?: [number, number, number]; lineHeight?: number }
  ) => {
    const lineHeight = options?.lineHeight ?? 6;
    pdf.setFont(undefined, 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text(label, col1X, yPos);

    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(options?.valueFontSize ?? 10);
    const valueColor = options?.valueColor ?? [0, 0, 0];
    pdf.setTextColor(valueColor[0], valueColor[1], valueColor[2]);
    const lines = pdf.splitTextToSize(value, valueMaxWidth);
    pdf.text(lines, valueX, yPos);
    const lineCount = Array.isArray(lines) ? lines.length : 1;
    return yPos + lineCount * lineHeight;
  };
  
  let currentY = detailsStartY;

  // Row 1
  // currentY = drawDetailRow('Invoice:', receipt.invoiceNumber, currentY);
  currentY = drawDetailRow('Project:', receipt.projectTitle, currentY);

  // Row 2
  currentY = drawDetailRow(
    'Payment Method:',
    paymentMethodLabels[receipt.paymentMethod] || receipt.paymentMethod,
    currentY + 2
  );

  if (hasRef) {
    currentY = drawDetailRow('Ref:', receipt.transactionReference as string, currentY + 2);
  }

  // Row 3 - Amount (emphasized)
  currentY = drawDetailRow(
    'Amount Received:',
    `INR ${receipt.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    currentY + 2,
    { valueFontSize: 14, valueColor: [34, 139, 34], lineHeight: 7 }
  );

  // Row 4 - Balance
  const balanceColor = receipt.balanceAfterPayment > 0 ? [220, 53, 69] : [34, 139, 34];
  currentY = drawDetailRow(
    'Balance After Payment:',
    `INR ${receipt.balanceAfterPayment.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    currentY + 2,
    { valueColor: balanceColor }
  );

  y += boxHeight + 30;

  // Thank you message
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(12);
  pdf.setFont(undefined, 'normal');
  pdf.text('Thank you for your payment!', pageWidth / 2, y, { align: 'center' });

  y += 40;

  // Signature section
  // pdf.setFontSize(10);
  // pdf.setFont(undefined, 'bold');
  // pdf.text('Authorized Signature', margin, y);
  // pdf.line(margin, y + 6, margin + 60, y + 6);
  
  // pdf.text('Customer Signature', pageWidth - margin - 60, y);
  // pdf.line(pageWidth - margin - 60, y + 6, pageWidth - margin, y + 6);

  // Footer
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.setFontSize(8);
  pdf.setFont(undefined, 'normal');
  pdf.setTextColor(128, 128, 128);
  pdf.text('This is a system generated receipt.', pageWidth / 2, pageHeight - 15, { align: 'center' });

  // Save PDF
  pdf.save(`${receipt.receiptNumber.replace(/\//g, '-')}.pdf`);
};
