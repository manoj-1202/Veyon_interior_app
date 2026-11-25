import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatCurrency, formatDate, generateReceiptNumber, getInvoiceBalance, getInvoiceStatus } from '@/lib/invoice-utils';
import { ArrowLeft, Plus, Trash2, CreditCard, Building, Phone, Mail, MapPin, Copy, IndianRupee, Pencil } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PROJECT_STAGES, type Invoice, type Client, type InvoiceItem, type Payment, type PaymentMethod } from '@/types/database';
import { generateInvoicePDF } from "@/lib/generateInvoicePDF"
import type { InvoiceData } from '@/lib/generateInvoicePDF';
import { calculateRoundOff } from '@/lib/invoice-utils';


export default function InvoiceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    
    payment_date: new Date().toISOString().split('T')[0],
    amount: 0,
    payment_method: 'bank_transfer' as PaymentMethod,
    transaction_reference: '',
    notes: '',
  });

  // Derive the balance from the current total and recorded payments. This keeps
  // the detail view and payment controls correct even if a stored balance is stale.
  const balanceDue = invoice ? getInvoiceBalance(invoice) : 0;
  

const buildPDFInvoiceData = (profile: any = companyProfile): InvoiceData | null => {
  if (!invoice || !client || !profile) return null;

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + Number(item.total), 0);

  const discountAmount =
    invoice.discount_amount !== undefined
      ? Number(invoice.discount_amount)
      : 0;

  const cgstAmount = invoice.cgst_amount ? Number(invoice.cgst_amount) : 0;
  const sgstAmount = invoice.sgst_amount ? Number(invoice.sgst_amount) : 0;
  const igstAmount = invoice.igst_amount ? Number(invoice.igst_amount) : 0;

  const totalBeforeRounding = subtotal - discountAmount + cgstAmount + sgstAmount + igstAmount;
  const roundOff = calculateRoundOff(totalBeforeRounding);
  const grandTotal = Math.round(totalBeforeRounding);
  const totalPaidValue = Number(invoice.total_paid ?? 0);
  const balanceDueValue = getInvoiceBalance({ grand_total: grandTotal, total_paid: totalPaidValue });

  return {
    invoiceNumber: invoice.invoice_number,
    date: invoice.invoice_date,
    dueDate: invoice.due_date,
    projectTitle: invoice.project_title,
    projectType: invoice.project_type || 'Interior project',

    company: {
      name: profile.company_name,
      address: profile.office_address,
      gstin: profile.gstin,
      phone: profile.phone,
      email: profile.email,
      logoUrl: profile.logo_url || '',
    },

    bank: {
      bank_account_name: profile.bank_account_name || "",
      bank_account_number: profile.bank_account_number || "",
      bank_ifsc: profile.bank_ifsc || "",
      bank_name: profile.bank_name || "",
    },

    client: {
      name: client.client_name,
      address: client.billing_address || "",
      gstin: client.gstin || "N/A",
      phone: client.phone || "",
      email: client.email || "",
    },

    site: {
      address: invoice.site_address || '',
      contactName: invoice.site_contact_name || '',
      contactPhone: invoice.site_contact_phone || '',
      measurementDate: invoice.measurement_date || '',
      installationDate: invoice.installation_date || '',
    },

    items: items.map((item) => ({
      name: item.service_category,
      description: item.description || '',
      qty: Number(item.quantity),
      unit: item.unit || 'Piece',
      price: Number(item.rate),
      total: Number(item.total),
      width: item.width_mm,
      height: item.height_mm,
      profile: item.profile_series || '',
      glass: item.glass_specification || '',
      finish: item.finish || '',
      hardware: item.hardware_specification || '',
      installation: item.installation_included,
    })),

    subtotal,
    discountAmount,

    cgstAmount,
    sgstAmount,
    igstAmount,
    roundOff,

    total: grandTotal,
    totalPaid: totalPaidValue,
    balanceDue: Number(balanceDueValue),

    gstType: invoice.gst_type as "cgst_sgst" | "igst" | "no_gst",
    terms: {
      terms_and_conditions: profile.terms_and_conditions || "",
    },

    disclaimer: profile.legal_disclaimer || "",
  };
};

  const handleDownloadPdf = async () => {
    if (generatingPdf) return;
    setGeneratingPdf(true);
    try {
      let profile = companyProfile;
      if (!profile) {
        const { data, error } = await supabase
          .from("company_profile")
          .select("*")
          .single();
        if (error || !data) {
          toast.error('Company profile not found. Please update settings.');
          return;
        }
        setCompanyProfile(data);
        profile = data;
      }

      const pdfData = buildPDFInvoiceData(profile);
      if (!pdfData) {
        toast.error('Invoice data is not ready yet.');
        return;
      }

      await generateInvoicePDF(pdfData);
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      toast.error('Failed to generate invoice PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };


  useEffect(() => {
    if (user && id) {
      fetchInvoiceData();
    }
  }, [user, id]);

  const fetchInvoiceData = async () => {
    try {
      // Fetch invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (invoiceError) throw invoiceError;
      setInvoice(invoiceData);

      // Fetch client
      if (invoiceData.client_id) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('*')
          .eq('id', invoiceData.client_id)
          .single();

        setClient(clientData);
      }

      // Fetch items
      const { data: itemsData } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id);

      setItems(itemsData || []);

      // Fetch payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('invoice_id', id)
        .order('payment_date', { ascending: false });

      setPayments(paymentsData || []);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
    // Fetch company profile
const { data: profileData } = await supabase
  .from("company_profile")
  .select("*")
  .single()

setCompanyProfile(profileData)

  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentForm.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (paymentForm.amount > balanceDue) {
      toast.error('Payment amount cannot exceed balance due');
      return;
    }

    setSavingPayment(true);

    try {
      // Create payment
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          invoice_id: id,
          user_id: user!.id,
          payment_date: paymentForm.payment_date,
          amount: paymentForm.amount,
          payment_method: paymentForm.payment_method,
          transaction_reference: paymentForm.transaction_reference || null,
          notes: paymentForm.notes || null,
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Get receipt count
      const { count } = await supabase
        .from('receipts')
        .select('*', { count: 'exact', head: true });

      // Fetch updated invoice balance after the payment trigger runs
      const { data: updatedInvoice, error: updatedInvoiceError } = await supabase
        .from('invoices')
        .select('balance_due')
        .eq('id', id)
        .single();

      if (updatedInvoiceError) throw updatedInvoiceError;

      // Create receipt with the latest balance to keep "balance remaining" accurate everywhere
      const newBalance = Math.max(
        Number(updatedInvoice?.balance_due ?? (balanceDue - paymentForm.amount)),
        0
      );
      const { error: receiptError } = await supabase.from('receipts').insert({
        payment_id: payment.id,
        user_id: user!.id,
        receipt_number: generateReceiptNumber(count || 0),
        receipt_date: paymentForm.payment_date,
        amount: paymentForm.amount,
        balance_after_payment: newBalance,
      });

      if (receiptError) throw receiptError;

      toast.success('Payment recorded successfully');
      setPaymentDialogOpen(false);
      setPaymentForm({
        payment_date: new Date().toISOString().split('T')[0],
        amount: 0,
        payment_method: 'bank_transfer',
        transaction_reference: '',
        notes: '',
      });
      fetchInvoiceData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSavingPayment(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;

    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;
      toast.success('Payment deleted');
      fetchInvoiceData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDuplicateInvoice = () => {
    // Navigate to new invoice with pre-filled data
    toast.info('Duplicate invoice feature coming soon');
  };

  const handleDeleteInvoice = async () => {
    setDeleting(true);
    try {
      // Delete invoice items first (cascade should handle this, but being explicit)
      await supabase.from('invoice_items').delete().eq('invoice_id', id);
      
      // Delete payments related to this invoice
      await supabase.from('payments').delete().eq('invoice_id', id);
      
      // Delete the invoice
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      
      if (error) throw error;
      
      toast.success('Invoice deleted successfully');
      navigate('/invoices');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete invoice');
    } finally {
      setDeleting(false);
    }
  };

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
        <PageHeader title="Invoice" />
        <Skeleton className="h-96 rounded-xl" />
      </AppLayout>
    );
  }

  if (!invoice) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground">Invoice not found</p>
          <Button asChild className="mt-4">
            <Link to="/invoices">Back to Invoices</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }
  

  return (
    <AppLayout>
      <PageHeader
        title={invoice.invoice_number}
        description={invoice.project_title}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/invoices">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/invoices/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
            >
              {generatingPdf ? 'Generating...' : 'Download PDF'}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete invoice {invoice.invoice_number}? This will also delete all associated payments and receipts. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteInvoice} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />

<div id="invoice-page-1" className="grid gap-6 lg:grid-cols-3">

        {/* Main Invoice Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Invoice Header */}
          <div className="glass-card rounded-xl border border-border p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-2xl font-bold">{invoice.invoice_number}</h2>
                  <StatusBadge status={getInvoiceStatus(invoice)} />
                  <Badge variant="secondary">{PROJECT_STAGES.find((stage) => stage.value === invoice.project_stage)?.label || 'Project stage not set'}</Badge>
                </div>
                <p className="mt-1 text-muted-foreground">{invoice.project_title}</p>
                <p className="text-sm text-muted-foreground">{invoice.project_type}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Invoice Date</p>
                <p className="font-medium">{formatDate(invoice.invoice_date)}</p>
                <p className="mt-2 text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">{formatDate(invoice.due_date)}</p>
              </div>
            </div>
          </div>

          {/* Client Info */}
          {client && (
            <div className="glass-card rounded-xl border border-border p-6">
              <h3 className="mb-4 font-display text-lg font-semibold">Bill To</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{client.client_name}</span>
                  </div>
                  {client.production_house_name && (
                    <p className="ml-6 text-sm text-muted-foreground">
                      {client.production_house_name}
                    </p>
                  )}
                  {client.billing_address && (
                    <p className="ml-6 mt-2 text-sm text-muted-foreground">
                      {client.billing_address}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  {client.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {client.email}
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {client.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {client.state}
                  </div>
                  {client.gstin && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">GSTIN:</span> {client.gstin}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {(invoice.site_address || invoice.site_contact_name || invoice.measurement_date || invoice.installation_date) && (
            <div className="glass-card rounded-xl border border-border p-6">
              <h3 className="mb-4 font-display text-lg font-semibold">Installation Site & Schedule</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {invoice.site_address && <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Site address</p><p className="mt-1 text-sm">{invoice.site_address}</p></div>}
                {(invoice.site_contact_name || invoice.site_contact_phone) && <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Site contact</p><p className="mt-1 text-sm">{invoice.site_contact_name} {invoice.site_contact_phone && `· ${invoice.site_contact_phone}`}</p></div>}
                {invoice.measurement_date && <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Measurement visit</p><p className="mt-1 text-sm">{formatDate(invoice.measurement_date)}</p></div>}
                {invoice.installation_date && <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Planned installation</p><p className="mt-1 text-sm">{formatDate(invoice.installation_date)}</p></div>}
              </div>
            </div>
          )}

          {/* Line Items */}
          <div className="glass-card overflow-hidden rounded-xl border border-border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                      Product / Work
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                      Specifications
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-muted-foreground">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-muted-foreground">
                      Rate
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-muted-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="whitespace-nowrap px-6 py-4 font-medium">
                        {item.service_category}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <div>{item.description || '—'}</div>
                        <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                          {(item.width_mm || item.height_mm) && <p>Size: {item.width_mm || '—'} × {item.height_mm || '—'} mm</p>}
                          {item.profile_series && <p>Profile / material: {item.profile_series}</p>}
                          {item.glass_specification && <p>Glass / specification: {item.glass_specification}</p>}
                          {item.finish && <p>Finish: {item.finish}</p>}
                          {item.hardware_specification && <p>Hardware: {item.hardware_specification}</p>}
                          <p>{item.installation_included ? 'Installation included' : 'Installation excluded'}</p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        {formatCurrency(Number(item.rate))}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right font-medium">
                        {formatCurrency(Number(item.total))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="glass-card rounded-xl border border-border p-6">
            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(Number(invoice.subtotal))}</span>
                </div>

                {Number(invoice.discount_amount) > 0 && (
                  <div className="flex justify-between text-sm text-status-completed">
                    <span>Discount</span>
                    <span>-{formatCurrency(Number(invoice.discount_amount))}</span>
                  </div>
                )}

                {invoice.gst_type === 'cgst_sgst' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">CGST (9%)</span>
                      <span>{formatCurrency(Number(invoice.cgst_amount))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">SGST (9%)</span>
                      <span>{formatCurrency(Number(invoice.sgst_amount))}</span>
                    </div>
                  </>
                )}

                {invoice.gst_type === 'igst' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IGST (18%)</span>
                    <span>{formatCurrency(Number(invoice.igst_amount))}</span>
                  </div>
                )}

                {Number(invoice.round_off) !== 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Round Off</span>
                    <span>
                      {Number(invoice.round_off) > 0 ? '+' : ''}
                      {formatCurrency(Number(invoice.round_off))}
                    </span>
                  </div>
                )}

                <div className="border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold">Grand Total</span>
                    <span className="font-sans text-xl font-bold text-primary">
                      {formatCurrency(Number(invoice.grand_total))}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Paid</span>
                  <span className="text-status-completed">
                    {formatCurrency(Number(invoice.total_paid))}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Balance Due</span>
                  <span
                    className={`font-sans text-lg font-bold ${
                      balanceDue > 0
                        ? 'text-status-overdue'
                        : 'text-status-completed'
                    }`}
                  >
                    {formatCurrency(balanceDue)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Payments */}
        <div className="space-y-6">
          <div className="glass-card rounded-xl border border-border p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Payments</h3>
              {balanceDue > 0 && (
                <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record Payment</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddPayment} className="space-y-4">
                      <div className="rounded-lg bg-secondary p-3">
                        <p className="text-sm text-muted-foreground">Balance Due</p>
                        <p className="font-sans text-xl font-bold">
                          {formatCurrency(balanceDue)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Amount *</Label>
                        <Input
                          type="number"
                          value={paymentForm.amount || ''}
                          onChange={(e) =>
                            setPaymentForm({
                              ...paymentForm,
                              amount: parseFloat(e.target.value) || 0,
                            })
                          }
                          max={balanceDue}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Payment Date</Label>
                        <Input
                          type="date"
                          value={paymentForm.payment_date}
                          onChange={(e) =>
                            setPaymentForm({
                              ...paymentForm,
                              payment_date: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <Select
                          value={paymentForm.payment_method}
                          onValueChange={(value) =>
                            setPaymentForm({
                              ...paymentForm,
                              payment_method: value as PaymentMethod,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Transaction Reference / UTR</Label>
                        <Input
                          value={paymentForm.transaction_reference}
                          onChange={(e) =>
                            setPaymentForm({
                              ...paymentForm,
                              transaction_reference: e.target.value,
                            })
                          }
                          placeholder="Optional"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setPaymentDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={savingPayment}>
                          {savingPayment ? 'Saving...' : 'Record Payment'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-start justify-between rounded-lg border border-border bg-background/50 p-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-status-completed/20 p-2">
                        <CreditCard className="h-4 w-4 text-status-completed" />
                      </div>
                      <div>
                        <p className="font-medium text-status-completed">
                          {formatCurrency(Number(payment.amount))}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(payment.payment_date)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {paymentMethodLabels[payment.payment_method]}
                        </p>
                        {payment.transaction_reference && (
                          <p className="font-mono text-xs text-muted-foreground">
                            Ref: {payment.transaction_reference}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeletePayment(payment.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <IndianRupee className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">No payments yet</p>
              </div>
            )}
          </div>

          {invoice.notes && (
            <div className="glass-card rounded-xl border border-border p-6">
              <h3 className="mb-2 font-display text-lg font-semibold">Notes</h3>
              <p className="text-sm text-muted-foreground">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}


