import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { generateCustomerReportPDF, ReportData, ClientPaymentData } from '@/lib/generateCustomerReportPDF';
import { toast } from 'sonner';
import { getInvoiceBalance, getInvoiceStatus } from '@/lib/invoice-utils';

export function DownloadReportButton() {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      // Fetch company profile
      const { data: company } = await supabase
        .from('company_profile')
        .select('*')
        .single();

      // Fetch all clients
      const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .order('client_name');

      // Fetch all invoices with client info
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*');

      // Fetch all receipts for total revenue
      const { data: receipts } = await supabase
        .from('receipts')
        .select('amount, receipt_date');

      if (!clients || !invoices) {
        toast.error('Failed to fetch data');
        return;
      }

      // Calculate per-client statistics
      const clientPaymentData: ClientPaymentData[] = clients.map(client => {
        const clientInvoices = invoices.filter(inv => inv.client_id === client.id);
        const completed = clientInvoices.filter(inv => getInvoiceStatus(inv) === 'completed');
        const partiallyPaid = clientInvoices.filter(inv => getInvoiceStatus(inv) === 'partially_paid');
        const overdue = clientInvoices.filter(inv => getInvoiceStatus(inv) === 'overdue');

        return {
          clientName: client.client_name,
          productionHouse: client.production_house_name,
          phone: client.phone,
          email: client.email,
          state: client.state,
          totalInvoices: clientInvoices.length,
          totalAmount: clientInvoices.reduce((sum, inv) => sum + Number(inv.grand_total), 0),
          totalPaid: clientInvoices.reduce((sum, inv) => sum + Number(inv.total_paid), 0),
          balanceDue: clientInvoices.reduce((sum, inv) => sum + getInvoiceBalance(inv), 0),
          completedCount: completed.length,
          partiallyPaidCount: partiallyPaid.length,
          overdueCount: overdue.length,
        };
      });

      // Calculate summary
      const totalRevenue = receipts?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
      const cameramanRevenue = invoices.reduce(
        (sum, invoice) => sum + Number(invoice.cameraman_amount || 0),
        0
      );
      const soundRevenue = invoices.reduce(
        (sum, invoice) => sum + Number(invoice.sound_amount || 0),
        0
      );
      const completed = invoices.filter(inv => getInvoiceStatus(inv) === 'completed');
      const partiallyPaid = invoices.filter(inv => getInvoiceStatus(inv) === 'partially_paid');
      const overdue = invoices.filter(inv => getInvoiceStatus(inv) === 'overdue');

      const getMonthKey = (dateString: string | null | undefined) => {
        if (!dateString) return '';
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

      const monthlyMap = new Map<string, { amount: number; cameramanAmount: number; soundAmount: number }>();
      (receipts || []).forEach((r) => {
        const monthKey = getMonthKey(r.receipt_date);
        if (!monthKey) return;
        const revenue = monthlyMap.get(monthKey) || { amount: 0, cameramanAmount: 0, soundAmount: 0 };
        revenue.amount += Number(r.amount);
        monthlyMap.set(monthKey, revenue);
      });
      invoices.forEach((invoice) => {
        const monthKey = getMonthKey(invoice.invoice_date || invoice.created_at);
        if (!monthKey) return;
        const revenue = monthlyMap.get(monthKey) || { amount: 0, cameramanAmount: 0, soundAmount: 0 };
        revenue.cameramanAmount += Number(invoice.cameraman_amount || 0);
        revenue.soundAmount += Number(invoice.sound_amount || 0);
        monthlyMap.set(monthKey, revenue);
      });
      const monthlyRevenue = Array.from(monthlyMap.entries())
        .sort((a, b) => (a[0] < b[0] ? 1 : -1))
        .map(([monthKey, amounts]) => ({ month: getMonthLabel(monthKey), ...amounts }));

      const reportData: ReportData = {
        clients: clientPaymentData,
        monthlyRevenue,
        summary: {
          totalClients: clients.length,
          totalRevenue,
          cameramanRevenue,
          soundRevenue,
          totalOutstanding: invoices.reduce((sum, inv) => sum + getInvoiceBalance(inv), 0),
          completedInvoices: completed.length,
          partiallyPaidInvoices: partiallyPaid.length,
          overdueInvoices: overdue.length,
        },
        company: {
          name: company?.company_name || 'My Company',
          address: company?.office_address || '',
          phone: company?.phone || '',
          email: company?.email || '',
        },
        generatedAt: new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      await generateCustomerReportPDF(reportData);
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleDownload} disabled={loading} variant="outline" size="sm">
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      <span className="ml-2">Download Report</span>
    </Button>
  );
}
