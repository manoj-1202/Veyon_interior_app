import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate, getInvoiceBalance, getInvoiceStatus } from '@/lib/invoice-utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PanelsTopLeft, IndianRupee, Users, ClipboardList, Plus, ArrowUpRight, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { PROJECT_STAGES } from '@/types/database';

type RecentProject = { id: string; invoice_number: string; project_title: string; project_type: string; project_stage: string; grand_total: number; created_at: string; status: string; customer: string; site: string | null };
type CategoryTotal = { name: string; value: number };

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ collected: 0, outstanding: 0, active: 0, customers: 0, quotations: 0 });
  const [projects, setProjects] = useState<RecentProject[]>([]);
  const [categories, setCategories] = useState<CategoryTotal[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [invoiceResult, customerResult, receiptResult, quoteResult, itemResult] = await Promise.all([
          supabase.from('invoices').select('id, invoice_number, project_title, project_type, project_stage, grand_total, total_paid, balance_due, due_date, status, created_at, site_address, clients(client_name)').order('created_at', { ascending: false }),
          supabase.from('clients').select('id', { count: 'exact', head: true }),
          supabase.from('receipts').select('amount'),
          supabase.from('quotations').select('id', { count: 'exact', head: true }),
          supabase.from('invoice_items').select('service_category, total'),
        ]);
        const error = invoiceResult.error || customerResult.error || receiptResult.error || quoteResult.error || itemResult.error;
        if (error) throw error;
        const invoices = invoiceResult.data || [];
        setMetrics({
          collected: (receiptResult.data || []).reduce((sum, item) => sum + Number(item.amount || 0), 0),
          outstanding: invoices.reduce((sum, invoice) => sum + getInvoiceBalance(invoice), 0),
          active: invoices.filter((invoice) => invoice.project_stage !== 'completed').length,
          customers: customerResult.count || 0,
          quotations: quoteResult.count || 0,
        });
        setProjects(invoices.slice(0, 6).map((invoice) => ({
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          project_title: invoice.project_title,
          project_type: invoice.project_type || 'Interior project',
          project_stage: invoice.project_stage || 'approved',
          grand_total: Number(invoice.grand_total || 0),
          created_at: invoice.created_at,
          status: getInvoiceStatus(invoice),
          customer: (invoice.clients as { client_name?: string } | null)?.client_name || 'Customer',
          site: invoice.site_address,
        })));
        const totals = new Map<string, number>();
        (itemResult.data || []).forEach((item) => totals.set(item.service_category, (totals.get(item.service_category) || 0) + Number(item.total || 0)));
        setCategories([...totals.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5));
      } catch (error) {
        console.error('Could not load Veyon dashboard:', error);
        toast.error('Could not load dashboard information. Check the database setup and try again.');
      } finally { setLoading(false); }
    };
    void load();
  }, [user]);

  if (loading) return <AppLayout><PageHeader title="Overview" description="Your Veyon Interiors workspace at a glance" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-32 rounded-xl" />)}</div></AppLayout>;

  const maxCategory = Math.max(...categories.map((category) => category.value), 1);
  return <AppLayout>
    <PageHeader title="Overview" description="Your Veyon Interiors workspace at a glance" action={<Button asChild><Link to="/invoices/new"><Plus className="mr-2 h-4 w-4" />Create invoice</Link></Button>} />
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard title="Payments collected" value={formatCurrency(metrics.collected)} icon={<IndianRupee className="h-5 w-5" />} variant="primary" />
      <MetricCard title="Outstanding balance" value={formatCurrency(metrics.outstanding)} icon={<IndianRupee className="h-5 w-5" />} variant={metrics.outstanding ? 'warning' : 'success'} />
      <MetricCard title="Active projects" value={metrics.active} icon={<PanelsTopLeft className="h-5 w-5" />} />
      <MetricCard title="Customers" value={metrics.customers} icon={<Users className="h-5 w-5" />} />
    </div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(290px,0.75fr)]">
      <section className="glass-card overflow-hidden rounded-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-semibold">Recent projects</h2><p className="text-sm text-muted-foreground">Latest invoices and customer work</p></div><Button asChild variant="outline" size="sm"><Link to="/invoices">All invoices<ArrowUpRight className="ml-1 h-4 w-4" /></Link></Button></div>
        {projects.length ? <div className="divide-y divide-border">{projects.map((project) => <Link key={project.id} to={`/invoices/${project.id}`} className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-secondary/50 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{project.project_title}</p><StatusBadge status={project.status} /><span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">{PROJECT_STAGES.find((stage) => stage.value === project.project_stage)?.label || 'Approved'}</span></div><p className="mt-1 text-sm text-muted-foreground">{project.customer} <span className="px-1">Â·</span>{project.project_type}</p>{project.site && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{project.site}</p>}</div><div className="shrink-0 sm:text-right"><p className="font-semibold">{formatCurrency(project.grand_total)}</p><p className="text-xs text-muted-foreground">{project.invoice_number} Â· {formatDate(project.created_at)}</p></div></Link>)}</div> : <div className="px-6 py-12 text-center"><PanelsTopLeft className="mx-auto h-8 w-8 text-muted-foreground/50" /><p className="mt-3 font-medium">Start with your first project</p><p className="mt-1 text-sm text-muted-foreground">Create a customer quotation or invoice to see activity here.</p><div className="mt-4 flex justify-center gap-2"><Button asChild variant="outline"><Link to="/quotations">Create quotation</Link></Button><Button asChild><Link to="/invoices/new">Create invoice</Link></Button></div></div>}
      </section>
      <div className="space-y-6">
        <section className="glass-card rounded-xl p-5"><div className="flex items-start justify-between"><div><h2 className="font-semibold">Product mix</h2><p className="text-sm text-muted-foreground">Invoice value by work category</p></div><ClipboardList className="h-5 w-5 text-primary" /></div>{categories.length ? <div className="mt-5 space-y-4">{categories.map((category) => <div key={category.name}><div className="mb-1 flex justify-between gap-3 text-sm"><span className="truncate">{category.name}</span><span className="font-medium">{formatCurrency(category.value)}</span></div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max((category.value / maxCategory) * 100, 3)}%` }} /></div></div>)}</div> : <p className="mt-4 text-sm text-muted-foreground">Category totals appear after you add invoice items.</p>}</section>
        <section className="rounded-xl bg-primary p-5 text-primary-foreground"><p className="text-sm font-medium text-primary-foreground/75">Quotation pipeline</p><p className="mt-2 text-3xl font-semibold">{metrics.quotations}</p><p className="mt-1 text-sm text-primary-foreground/75">Saved customer proposals</p><Button asChild variant="secondary" size="sm" className="mt-4"><Link to="/quotations">Open quotations<ArrowUpRight className="ml-1 h-4 w-4" /></Link></Button></section>
      </div>
    </div>
  </AppLayout>;
}

