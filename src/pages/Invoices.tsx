import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatDate, getInvoiceBalance, getInvoiceStatus } from '@/lib/invoice-utils';

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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FileText, Plus, Search, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Invoice, Client } from '@/types/database';
import { PROJECT_STAGES } from '@/types/database';

export default function Invoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<(Invoice & { clients: Client | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [monthOptions, setMonthOptions] = useState<{ value: string; label: string }[]>([
    { value: 'all', label: 'All Time' },
  ]);

  useEffect(() => {
    if (user) {
      fetchInvoices();
    }
  }, [user]);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, clients(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
      const uniqueMonths = Array.from(
        new Set((data || []).map((i) => getMonthKey(i.invoice_date)).filter(Boolean))
      );
      uniqueMonths.sort((a, b) => (a < b ? 1 : -1));
      setMonthOptions([
        { value: 'all', label: 'All Time' },
        ...uniqueMonths.map((m) => ({ value: m, label: getMonthLabel(m) })),
      ]);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.project_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.clients?.client_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || getInvoiceStatus(invoice) === statusFilter;
    const monthKey = getMonthKey(invoice.invoice_date);
    const matchesMonth = selectedMonth === 'all' || monthKey === selectedMonth;

    return matchesSearch && matchesStatus && matchesMonth;
  });

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Invoices" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Invoices"
        description="Customer billing, project totals, and payment status"
        action={
          <Button asChild>
            <Link to="/invoices/new">
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Link>
          </Button>
        }
      />

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="partially_paid">Partially Paid</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <label htmlFor="invoice-month" className="text-sm text-muted-foreground">
            Month
          </label>
          <select
            id="invoice-month"
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

      {/* Invoices List */}
      {filteredInvoices.length > 0 ? (
        <div className="glass-card overflow-hidden rounded-xl border border-border">
          <div className="divide-y divide-border">
            {filteredInvoices.map((invoice) => (
              <Link
                key={invoice.id}
                to={`/invoices/${invoice.id}`}
                className="table-row-hover flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{invoice.invoice_number}</p>
                    <StatusBadge status={getInvoiceStatus(invoice)} />
                    <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">{PROJECT_STAGES.find((stage) => stage.value === invoice.project_stage)?.label || 'Approved'}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {invoice.project_title}
                  </p>
                  {invoice.clients && (
                    <p className="text-sm text-muted-foreground">
                      {invoice.clients.client_name}
                      {invoice.clients.production_house_name &&
                        ` • ${invoice.clients.production_house_name}`}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-start gap-1 sm:items-end">
                  <p className="font-sans text-lg font-semibold">
                    {formatCurrency(Number(invoice.grand_total))}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Due: {formatDate(invoice.due_date)}
                  </p>
                  {getInvoiceBalance(invoice) > 0 && (
                    <p className="text-sm text-status-sent">
                      Balance: {formatCurrency(getInvoiceBalance(invoice))}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No invoices found"
          description={
            searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first invoice to get started'
          }
          action={
            !searchQuery && statusFilter === 'all' ? (
              <Button asChild>
                <Link to="/invoices/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Link>
              </Button>
            ) : undefined
          }
        />
      )}
    </AppLayout>
  );
}
