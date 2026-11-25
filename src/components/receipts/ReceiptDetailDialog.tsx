import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Receipt, CreditCard, FileText, User, Calendar } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/invoice-utils';
import { generateReceiptPDF, ReceiptData } from '@/lib/generateReceiptPDF';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface ReceiptWithDetails {
  id: string;
  receipt_number: string;
  receipt_date: string;
  amount: number;
  balance_after_payment: number;
  payment: {
    payment_method: string;
    transaction_reference: string | null;
    invoice: {
      invoice_number: string;
      project_title: string;
      client: {
        client_name: string;
      } | null;
    } | null;
  } | null;
}

interface CompanyProfile {
  company_name: string;
  office_address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
}

interface ReceiptDetailDialogProps {
  receipt: ReceiptWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const paymentMethodLabels: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  upi: 'UPI',
  cash: 'Cash',
  cheque: 'Cheque',
  card: 'Card',
};

export function ReceiptDetailDialog({ receipt, open, onOpenChange }: ReceiptDetailDialogProps) {
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (open && receipt) {
      fetchCompanyProfile();
    }
  }, [open, receipt]);

  const fetchCompanyProfile = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('company_profile')
        .select('company_name, office_address, phone, email, logo_url')
        .single();
      setCompany(data);
    } catch (error) {
      console.error('Error fetching company profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!receipt || !company) return;

    setDownloading(true);
    try {
      const receiptData: ReceiptData = {
        receiptNumber: receipt.receipt_number,
        receiptDate: formatDate(receipt.receipt_date),
        amount: Number(receipt.amount),
        balanceAfterPayment: Number(receipt.balance_after_payment),
        paymentMethod: receipt.payment?.payment_method || 'unknown',
        transactionReference: receipt.payment?.transaction_reference || null,
        invoiceNumber: receipt.payment?.invoice?.invoice_number || 'N/A',
        projectTitle: receipt.payment?.invoice?.project_title || 'N/A',
        clientName: receipt.payment?.invoice?.client?.client_name || 'N/A',
        company: {
          name: company.company_name,
          address: company.office_address || '',
          phone: company.phone || '',
          email: company.email || '',
          logoUrl: company.logo_url || '',
        },
      };

      await generateReceiptPDF(receiptData);
    } catch (error) {
      console.error('Error generating receipt PDF:', error);
    } finally {
      setDownloading(false);
    }
  };

  if (!receipt) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-status-completed" />
            Payment Receipt
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Receipt Header */}
            <div className="flex items-center justify-between rounded-lg bg-status-completed/10 p-4">
              <div>
                <p className="text-sm text-muted-foreground">Receipt Number</p>
                <p className="font-mono text-lg font-semibold">{receipt.receipt_number}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{formatDate(receipt.receipt_date)}</p>
              </div>
            </div>

            {/* Amount */}
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <p className="text-sm text-muted-foreground">Amount Received</p>
              <p className="font-sans text-3xl font-bold text-status-completed">
                {formatCurrency(Number(receipt.amount))}
              </p>
              {Number(receipt.balance_after_payment) > 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Balance remaining: <span className="font-medium text-status-overdue">{formatCurrency(Number(receipt.balance_after_payment))}</span>
                </p>
              )}
              {Number(receipt.balance_after_payment) === 0 && (
                <p className="mt-2 text-sm font-medium text-status-completed">
                  ✓ Fully Paid
                </p>
              )}
            </div>

            {/* Details Grid */}
            <div className="grid gap-4 rounded-lg border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Invoice</p>
                  <p className="font-medium">{receipt.payment?.invoice?.invoice_number || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Project</p>
                  <p className="font-medium">{receipt.payment?.invoice?.project_title || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{receipt.payment?.invoice?.client?.client_name || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium">
                    {paymentMethodLabels[receipt.payment?.payment_method || ''] || 'Unknown'}
                  </p>
                </div>
              </div>

              {receipt.payment?.transaction_reference && (
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Transaction Reference</p>
                    <p className="font-mono text-sm">{receipt.payment.transaction_reference}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Download Button */}
            <Button 
              onClick={handleDownload} 
              disabled={downloading || !company}
              className="w-full gap-2"
            >
              <Download className="h-4 w-4" />
              {downloading ? 'Generating PDF...' : 'Download Receipt'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
