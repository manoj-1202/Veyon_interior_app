import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  calculateGST,
  calculateRoundOff,
  formatCurrency,
} from '@/lib/invoice-utils';
import {
  SERVICE_CATEGORIES,
  PROJECT_TYPES,
  PROJECT_STAGES,
  UNITS,
  type Client,
  type GstType,
  type ProjectStage,
} from '@/types/database';
import { Loader2, Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface LineItem {
  id: string;
  service_category: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
  width_mm: number | null;
  height_mm: number | null;
  profile_series: string;
  glass_specification: string;
  finish: string;
  hardware_specification: string;
  installation_included: boolean;
}

export default function EditInvoice() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [companyState, setCompanyState] = useState('');
  const [totalPaid, setTotalPaid] = useState(0);

  const [formData, setFormData] = useState({
    client_id: '',
    invoice_number: '',
    invoice_date: '',
    due_date: '',
    project_title: '',
    project_type: 'Residential',
    project_stage: 'approved' as ProjectStage,
    site_address: '',
    site_contact_name: '',
    site_contact_phone: '',
    measurement_date: '',
    installation_date: '',
    gst_type: 'cgst_sgst' as GstType,
    discount_type: 'flat',
    discount_value: 0,
    notes: '',
  });

  const [items, setItems] = useState<LineItem[]>([]);

  useEffect(() => {
    if (user && id) {
      fetchInvoiceData();
    }
  }, [user, id]);

  const fetchInvoiceData = async () => {
    try {
      // Fetch clients
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .order('client_name');

      if (clientsData) setClients(clientsData);

      // Fetch company state
      const { data: profile } = await supabase
        .from('company_profile')
        .select('office_address')
        .single();

      if (profile?.office_address) {
        setCompanyState(profile.office_address);
      }

      // Fetch invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (invoiceError) throw invoiceError;

      setTotalPaid(Number(invoiceData.total_paid) || 0);

      setFormData({
        client_id: invoiceData.client_id || '',
        invoice_number: invoiceData.invoice_number,
        invoice_date: invoiceData.invoice_date,
        due_date: invoiceData.due_date,
        project_title: invoiceData.project_title,
        project_type: invoiceData.project_type || 'Residential',
        project_stage: (invoiceData.project_stage || 'approved') as ProjectStage,
        site_address: invoiceData.site_address || '',
        site_contact_name: invoiceData.site_contact_name || '',
        site_contact_phone: invoiceData.site_contact_phone || '',
        measurement_date: invoiceData.measurement_date || '',
        installation_date: invoiceData.installation_date || '',
        gst_type: (invoiceData.gst_type as GstType) || 'cgst_sgst',
        discount_type: invoiceData.discount_type || 'flat',
        discount_value: Number(invoiceData.discount_value) || 0,
        notes: invoiceData.notes || '',
      });

      // Fetch items
      const { data: itemsData } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id);

      if (itemsData && itemsData.length > 0) {
        setItems(
          itemsData.map((item) => ({
            id: item.id,
            service_category: item.service_category,
            description: item.description || '',
            quantity: Number(item.quantity) || 1,
            unit: item.unit || 'Piece',
            rate: Number(item.rate) || 0,
            total: Number(item.total) || 0,
            width_mm: item.width_mm == null ? null : Number(item.width_mm),
            height_mm: item.height_mm == null ? null : Number(item.height_mm),
            profile_series: item.profile_series || '',
            glass_specification: item.glass_specification || '',
            finish: item.finish || '',
            hardware_specification: item.hardware_specification || '',
            installation_included: item.installation_included ?? true,
          }))
        );
      } else {
        setItems([
          {
            id: crypto.randomUUID(),
            service_category: '',
            description: '',
            quantity: 1,
            unit: 'Piece',
            rate: 0,
            total: 0,
            width_mm: null,
            height_mm: null,
            profile_series: '',
            glass_specification: '',
            finish: '',
            hardware_specification: '',
            installation_included: true,
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to load invoice');
    } finally {
      setFetching(false);
    }
  };

  const selectedClient = clients.find((c) => c.id === formData.client_id);

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'rate') {
            updated.total = Number(updated.quantity) * Number(updated.rate);
          }
          return updated;
        }
        return item;
      })
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        service_category: '',
        description: '',
        quantity: 1,
        unit: 'Piece',
        rate: 0,
        total: 0,
        width_mm: null,
        height_mm: null,
        profile_series: '',
        glass_specification: '',
        finish: '',
        hardware_specification: '',
        installation_included: true,
      },
    ]);
  };

  const removeItem = (itemId: string) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discountAmount =
    formData.discount_type === 'percentage'
      ? (subtotal * formData.discount_value) / 100
      : formData.discount_value;
  const gstCalc = calculateGST(subtotal, formData.gst_type, discountAmount);
  const totalBeforeRounding =
    subtotal - discountAmount + gstCalc.cgst + gstCalc.sgst + gstCalc.igst;
  const roundOff = calculateRoundOff(totalBeforeRounding);
  const grandTotal = Math.round(totalBeforeRounding);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client_id) {
      toast.error('Please select a client');
      return;
    }

    if (items.some((item) => !item.service_category)) {
      toast.error('Please select a service category for all items');
      return;
    }

    setLoading(true);

    try {
      // Update invoice
      const balanceDue = Math.max(grandTotal - totalPaid, 0);
      const status: 'completed' | 'overdue' | 'partially_paid' | 'sent' =
        totalPaid >= grandTotal
          ? 'completed'
          : totalPaid > 0
            ? formData.due_date < new Date().toISOString().slice(0, 10)
              ? 'overdue'
              : 'partially_paid'
            : 'sent';
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          client_id: formData.client_id,
          invoice_date: formData.invoice_date,
          due_date: formData.due_date,
          project_title: formData.project_title,
          project_type: formData.project_type,
          project_stage: formData.project_stage,
          site_address: formData.site_address || null,
          site_contact_name: formData.site_contact_name || null,
          site_contact_phone: formData.site_contact_phone || null,
          measurement_date: formData.measurement_date || null,
          installation_date: formData.installation_date || null,
          subtotal,
          discount_type: formData.discount_type,
          discount_value: formData.discount_value,
          discount_amount: discountAmount,
          gst_type: formData.gst_type,
          cgst_amount: gstCalc.cgst,
          sgst_amount: gstCalc.sgst,
          igst_amount: gstCalc.igst,
          round_off: roundOff,
          grand_total: grandTotal,
          total_paid: totalPaid,
          balance_due: balanceDue,
          status,
          notes: formData.notes,
        })
        .eq('id', id);

      if (invoiceError) throw invoiceError;

      // Delete existing items
      const { error: deleteItemsError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);

      if (deleteItemsError) throw deleteItemsError;

      // Create new items
      const { error: itemsError } = await supabase.from('invoice_items').insert(
        items.map((item) => ({
          invoice_id: id,
          service_category: item.service_category,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          total: item.total,
          width_mm: item.width_mm,
          height_mm: item.height_mm,
          profile_series: item.profile_series || null,
          glass_specification: item.glass_specification || null,
          finish: item.finish || null,
          hardware_specification: item.hardware_specification || null,
          installation_included: item.installation_included,
        }))
      );

      if (itemsError) throw itemsError;

      toast.success('Invoice updated successfully');
      navigate(`/invoices/${id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <AppLayout>
        <PageHeader title="Edit Invoice" />
        <div className="space-y-6">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Edit Invoice"
        description={`Editing ${formData.invoice_number}`}
        action={
          <Button asChild variant="outline">
            <Link to={`/invoices/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Client & Invoice Details */}
        <div className="glass-card rounded-xl border border-border p-6">
          <h3 className="mb-4 font-display text-lg font-semibold">Invoice Details</h3>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Customer *</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, client_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.client_name}
                      {client.production_house_name &&
                        ` (${client.production_house_name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Invoice Number</Label>
              <Input value={formData.invoice_number} disabled />
            </div>

            <div className="space-y-2">
              <Label>Invoice Date</Label>
              <Input
                type="date"
                value={formData.invoice_date}
                onChange={(e) =>
                  setFormData({ ...formData, invoice_date: e.target.value })
                }
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Project Title *</Label>
              <Input
                value={formData.project_title}
                onChange={(e) =>
                  setFormData({ ...formData, project_title: e.target.value })
                }
                placeholder="e.g., Living room windows and wardrobe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Project Type</Label>
              <Select
                value={formData.project_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, project_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Project Stage</Label>
              <Select value={formData.project_stage} onValueChange={(value) => setFormData({ ...formData, project_stage: value as ProjectStage })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PROJECT_STAGES.map((stage) => <SelectItem key={stage.value} value={stage.value}>{stage.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
              />
            </div>


          </div>
        </div>

        <div className="glass-card rounded-xl border border-border p-6">
          <h3 className="mb-4 font-display text-lg font-semibold">Project Site & Schedule</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2 sm:col-span-2 lg:col-span-3"><Label>Installation address</Label><Textarea value={formData.site_address} onChange={(e) => setFormData({ ...formData, site_address: e.target.value })} placeholder="Full site address for measurement and installation" rows={2} /></div>
            <div className="space-y-2"><Label>Site contact</Label><Input value={formData.site_contact_name} onChange={(e) => setFormData({ ...formData, site_contact_name: e.target.value })} placeholder="Name" /></div>
            <div className="space-y-2"><Label>Site contact phone</Label><Input value={formData.site_contact_phone} onChange={(e) => setFormData({ ...formData, site_contact_phone: e.target.value })} placeholder="Phone number" /></div>
            <div className="space-y-2"><Label>Measurement visit</Label><Input type="date" value={formData.measurement_date} onChange={(e) => setFormData({ ...formData, measurement_date: e.target.value })} /></div>
            <div className="space-y-2"><Label>Planned installation</Label><Input type="date" value={formData.installation_date} onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })} /></div>
          </div>
        </div>

        {/* Line Items */}
        <div className="glass-card rounded-xl border border-border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Products & Work</h3>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid gap-4 rounded-lg border border-border bg-background/50 p-4 sm:grid-cols-12"
              >
                <div className="sm:col-span-3">
                  <Label className="text-xs">Product / Work Category</Label>
                  <Select
                    value={item.service_category}
                    onValueChange={(value) =>
                      updateItem(item.id, 'service_category', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-3">
                  <Label className="text-xs">Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) =>
                      updateItem(item.id, 'description', e.target.value)
                    }
                    placeholder="Room, opening number, style, or scope of work"
                  />
                </div>

                <div className="grid gap-3 sm:col-span-12 sm:grid-cols-2 lg:grid-cols-6">
                  <div><Label className="text-xs">Width (mm)</Label><Input type="number" min="0" value={item.width_mm ?? ''} onChange={(e) => updateItem(item.id, 'width_mm', e.target.value ? Number(e.target.value) : null)} placeholder="Optional" /></div>
                  <div><Label className="text-xs">Height (mm)</Label><Input type="number" min="0" value={item.height_mm ?? ''} onChange={(e) => updateItem(item.id, 'height_mm', e.target.value ? Number(e.target.value) : null)} placeholder="Optional" /></div>
                  <div><Label className="text-xs">Profile / Material</Label><Input value={item.profile_series} onChange={(e) => updateItem(item.id, 'profile_series', e.target.value)} placeholder="Series or material" /></div>
                  <div><Label className="text-xs">Glass / Specification</Label><Input value={item.glass_specification} onChange={(e) => updateItem(item.id, 'glass_specification', e.target.value)} placeholder="Glass, board, or panel" /></div>
                  <div><Label className="text-xs">Colour / Finish</Label><Input value={item.finish} onChange={(e) => updateItem(item.id, 'finish', e.target.value)} placeholder="Finish / colour" /></div>
                  <div><Label className="text-xs">Hardware</Label><Input value={item.hardware_specification} onChange={(e) => updateItem(item.id, 'hardware_specification', e.target.value)} placeholder="Handle, lock, etc." /></div>
                </div>

                <div className="sm:col-span-1">
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)
                    }
                    min={0}
                    step={0.5}
                  />
                </div>

                <div className="sm:col-span-1">
                  <Label className="text-xs">Unit</Label>
                  <Select
                    value={item.unit}
                    onValueChange={(value) => updateItem(item.id, 'unit', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-xs">Rate (₹)</Label>
                  <Input
                    type="number"
                    value={item.rate}
                    onChange={(e) =>
                      updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)
                    }
                    min={0}
                  />
                </div>

                <div className="sm:col-span-1">
                  <Label className="text-xs">Total</Label>
                  <p className="mt-2 font-medium">{formatCurrency(item.total)}</p>
                </div>

                <label className="flex items-center gap-2 text-xs text-muted-foreground sm:col-span-3">
                  <input type="checkbox" checked={item.installation_included} onChange={(e) => updateItem(item.id, 'installation_included', e.target.checked)} className="h-4 w-4 accent-primary" />
                  Installation included in this line item
                </label>

                <div className="flex items-end sm:col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing & GST */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card rounded-xl border border-border p-6">
            <h3 className="mb-4 font-display text-lg font-semibold">GST & Discount</h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>GST Type</Label>
                <Select
                  value={formData.gst_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gst_type: value as GstType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cgst_sgst">CGST (9%) + SGST (9%)</SelectItem>
                    <SelectItem value="igst">IGST (18%)</SelectItem>
                    <SelectItem value="no_gst">No GST</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {selectedClient
                    ? `Client state: ${selectedClient.state}`
                    : 'Select a client to auto-detect GST type'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, discount_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat">Flat Amount</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    Discount {formData.discount_type === 'percentage' ? '(%)' : '(â‚¹)'}
                  </Label>
                  <Input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_value: parseFloat(e.target.value) || 0,
                      })
                    }
                    min={0}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl border border-border p-6">
            <h3 className="mb-4 font-display text-lg font-semibold">Summary</h3>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-status-completed">
                  <span>Discount</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              {formData.gst_type === 'cgst_sgst' && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">CGST (9%)</span>
                    <span>{formatCurrency(gstCalc.cgst)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">SGST (9%)</span>
                    <span>{formatCurrency(gstCalc.sgst)}</span>
                  </div>
                </>
              )}

              {formData.gst_type === 'igst' && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IGST (18%)</span>
                  <span>{formatCurrency(gstCalc.igst)}</span>
                </div>
              )}

              {roundOff !== 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Round Off</span>
                  <span>
                    {roundOff > 0 ? '+' : ''}
                    {formatCurrency(roundOff)}
                  </span>
                </div>
              )}

              <div className="border-t border-border pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold">Grand Total</span>
                  <span className="font-sans text-xl font-bold text-primary">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="glass-card rounded-xl border border-border p-6">
          <h3 className="mb-4 font-display text-lg font-semibold">Additional Notes</h3>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any additional notes or payment instructions..."
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link to={`/invoices/${id}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}

