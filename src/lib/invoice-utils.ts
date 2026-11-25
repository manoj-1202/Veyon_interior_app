export function generateInvoiceNumber(existingCount: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  // Financial year in India: April to March
  const fyStart = month >= 4 ? year : year - 1;
  const fyEnd = fyStart + 1;
  const fyString = `${fyStart}-${String(fyEnd).slice(-2)}`;
  
  const nextNumber = (existingCount + 1).toString().padStart(3, '0');
  return `VI/INV/${fyString}/${nextNumber}`;
}

export function generateReceiptNumber(existingCount: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  const fyStart = month >= 4 ? year : year - 1;
  const fyEnd = fyStart + 1;
  const fyString = `${fyStart}-${String(fyEnd).slice(-2)}`;
  
  const nextNumber = (existingCount + 1).toString().padStart(3, '0');
  return `RC/${fyString}/${nextNumber}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function calculateGST(
  subtotal: number,
  gstType: 'cgst_sgst' | 'igst' | 'no_gst',
  discountAmount: number = 0
): { cgst: number; sgst: number; igst: number } {
  const taxableAmount = subtotal - discountAmount;
  
  if (gstType === 'no_gst') {
    return { cgst: 0, sgst: 0, igst: 0 };
  }
  
  if (gstType === 'igst') {
    return { cgst: 0, sgst: 0, igst: taxableAmount * 0.18 };
  }
  
  // CGST + SGST (9% each)
  return {
    cgst: taxableAmount * 0.09,
    sgst: taxableAmount * 0.09,
    igst: 0,
  };
}

export function calculateRoundOff(amount: number): number {
  const rounded = Math.round(amount);
  return rounded - amount;
}

type InvoicePaymentSummary = {
  grand_total?: number | string | null;
  total_paid?: number | string | null;
  due_date?: string | null;
  status?: string | null;
};

export function getInvoiceBalance(invoice: InvoicePaymentSummary): number {
  return Math.max(
    Number(invoice.grand_total || 0) - Number(invoice.total_paid || 0),
    0
  );
}

export function getInvoiceStatus(invoice: InvoicePaymentSummary): string {
  const paid = Number(invoice.total_paid || 0);
  const total = Number(invoice.grand_total || 0);

  if (invoice.status === 'draft' && paid === 0) return 'draft';
  if (paid >= total) return 'completed';

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (invoice.due_date && invoice.due_date < today) return 'overdue';
  if (paid > 0) return 'partially_paid';
  return 'sent';
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'draft':
      return 'status-draft';
    case 'sent':
      return 'status-sent';
    case 'partially_paid':
      return 'status-partial';
    case 'completed':
      return 'status-completed';
    case 'overdue':
      return 'status-overdue';
    default:
      return 'status-draft';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'sent':
      return 'Sent';
    case 'partially_paid':
      return 'Partially Paid';
    case 'completed':
      return 'Completed';
    case 'overdue':
      return 'Overdue';
    default:
      return status;
  }
}
