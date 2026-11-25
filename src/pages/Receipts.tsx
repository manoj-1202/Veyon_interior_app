import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { formatCurrency, formatDate } from '@/lib/invoice-utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Receipt, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ReceiptDetailDialog } from '@/components/receipts/ReceiptDetailDialog';

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

const getMonthKey = (dateString: string) => {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const getMonthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split('-');
  if (!year || !month) return monthKey;
  const d = new Date(Number(year), Number(month) - 1);
  return d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
};

export default function Receipts() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<ReceiptWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [monthOptions, setMonthOptions] = useState<{ value: string; label: string }[]>([
    { value: 'all', label: 'All Time' },
  ]);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptWithDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReceipts();
    }
  }, [user]);

  const fetchReceipts = async () => {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select(`
          *,
          payment:payments(
            payment_method,
            transaction_reference,
            invoice:invoices(
              invoice_number,
              project_title,
              client:clients(client_name)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReceipts(data || []);
      const uniqueMonths = Array.from(
        new Set((data || []).map((r) => getMonthKey(r.receipt_date || r.created_at)).filter(Boolean))
      );
      uniqueMonths.sort((a, b) => (a < b ? 1 : -1));
      setMonthOptions([
        { value: 'all', label: 'All Time' },
        ...uniqueMonths.map((m) => ({ value: m, label: getMonthLabel(m) })),
      ]);
    } catch (error) {
      console.error('Error fetching receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReceipts = receipts.filter((receipt) => {
    const matchesSearch =
      receipt.receipt_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.payment?.invoice?.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.payment?.invoice?.client?.client_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const monthKey = getMonthKey(receipt.receipt_date || '');
    const matchesMonth = selectedMonth === 'all' || monthKey === selectedMonth;

    return matchesSearch && matchesMonth;
  });

  const paymentMethodLabels: Record<string, string> = {
    bank_transfer: 'Bank Transfer',
    upi: 'UPI',
    cash: 'Cash',
    cheque: 'Cheque',
    card: 'Card',
  };

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Receipts" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Payment Receipts"
        description="View all payment receipts"
      />

      {/* Search */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search receipts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="receipt-month" className="text-sm text-muted-foreground">
            Month
          </label>
          <select
            id="receipt-month"
            className="rounded-md border border-border bg-background px-2 py-1 text-sm"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Receipts List */}
      {filteredReceipts.length > 0 ? (
        <div className="glass-card overflow-hidden rounded-xl border border-border">
          <div className="divide-y divide-border">
            {filteredReceipts.map((receipt) => (
              <div
                key={receipt.id}
                onClick={() => {
                  setSelectedReceipt(receipt);
                  setDialogOpen(true);
                }}
                className="table-row-hover flex cursor-pointer flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-completed/20">
                    <Receipt className="h-5 w-5 text-status-completed" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{receipt.receipt_number}</p>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                        {paymentMethodLabels[receipt.payment?.payment_method || ''] || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {receipt.payment?.invoice?.project_title}
                    </p>
                    {receipt.payment?.invoice?.client && (
                      <p className="text-sm text-muted-foreground">
                        {receipt.payment.invoice.client.client_name} •{' '}
                        {receipt.payment.invoice.invoice_number}
                      </p>
                    )}
                    {receipt.payment?.transaction_reference && (
                      <p className="font-mono text-xs text-muted-foreground">
                        Ref: {receipt.payment.transaction_reference}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-start gap-1 sm:items-end">
                  <p className="font-sans text-lg font-semibold text-status-completed">
                    {formatCurrency(Number(receipt.amount))}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(receipt.receipt_date)}
                  </p>
                  {Number(receipt.balance_after_payment) > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Balance: {formatCurrency(Number(receipt.balance_after_payment))}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Receipt}
          title="No receipts found"
          description={
            searchQuery
              ? 'Try adjusting your search'
              : 'Receipts will appear here when payments are recorded'
          }
        />
      )}

      <ReceiptDetailDialog
        receipt={selectedReceipt}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </AppLayout>
  );
}
