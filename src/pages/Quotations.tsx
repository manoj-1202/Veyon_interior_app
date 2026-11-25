import { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SERVICE_CATEGORIES, PROJECT_TYPES, UNITS, type GstType } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { calculateGST, calculateRoundOff, formatCurrency } from '@/lib/invoice-utils';
import type { Json } from '@/integrations/supabase/types';
import { Download, Plus, Trash2, Pencil, FileText } from 'lucide-react';
import { toast } from 'sonner';

type QuoteItem = {
  id: string;
  category: string;
  description: string;
  width: string;
  height: string;
  profile: string;
  glass: string;
  finish: string;
  hardware: string;
  quantity: number;
  unit: string;
  rate: number;
  installation: boolean;
};
type QuoteData = {
  version: 2;
  quoteNumber: string;
  clientName: string;
  contactPerson: string;
  phone: string;
  email: string;
  projectTitle: string;
  projectType: string;
  siteAddress: string;
  issueDate: string;
  validUntil: string;
  installationDate: string;
  gstType: GstType;
  discount: number;
  notes: string;
  items: QuoteItem[];
};
type SavedQuote = QuoteData & { id: string; grandTotal: number };

const today = () => new Date().toISOString().slice(0, 10);
const newItem = (): QuoteItem => ({ id: crypto.randomUUID(), category: '', description: '', width: '', height: '', profile: '', glass: '', finish: '', hardware: '', quantity: 1, unit: 'Piece', rate: 0, installation: true });
const formatINR = (value: number) => `INR ${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
const initialQuote = (quoteNumber = ''): QuoteData => ({ version: 2, quoteNumber, clientName: '', contactPerson: '', phone: '', email: '', projectTitle: '', projectType: 'Residential', siteAddress: '', issueDate: today(), validUntil: '', installationDate: '', gstType: 'cgst_sgst', discount: 0, notes: '', items: [newItem()] });

export default function Quotations() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<QuoteData>(initialQuote());

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data, error } = await supabase.from('quotations').select('*').order('created_at', { ascending: false });
      if (error) toast.error(`Could not load quotations: ${error.message}`);
      const records = (data || []).flatMap((row) => {
        const value = row.quotation_data as unknown as QuoteData;
        return value?.version === 2 && Array.isArray(value.items) ? [{ ...value, id: row.id, grandTotal: Number(row.grand_total) }] : [];
      });
      setQuotes(records);
      const next = String(records.length + 1).padStart(3, '0');
      setForm(initialQuote(`VI/QTN/${new Date().getFullYear()}/${next}`));
      setLoading(false);
    };
    void load();
  }, [user]);

  const subtotal = useMemo(() => form.items.reduce((sum, item) => sum + item.quantity * item.rate, 0), [form.items]);
  const discount = Math.min(Math.max(form.discount, 0), subtotal);
  const tax = calculateGST(subtotal, form.gstType, discount);
  const roundOff = calculateRoundOff(subtotal - discount + tax.cgst + tax.sgst + tax.igst);
  const grandTotal = Math.round(subtotal - discount + tax.cgst + tax.sgst + tax.igst);

  const updateItem = (id: string, field: keyof QuoteItem, value: string | number | boolean) => {
    setForm((current) => ({ ...current, items: current.items.map((item) => item.id === id ? { ...item, [field]: value } : item) }));
  };
  const startNew = () => {
    const next = String(quotes.length + 1).padStart(3, '0');
    setForm(initialQuote(`VI/QTN/${new Date().getFullYear()}/${next}`));
    setEditingId(null);
  };
  const edit = (quote: SavedQuote) => {
    const { id, grandTotal: _grandTotal, ...data } = quote;
    setEditingId(id);
    setForm({ ...data, items: data.items.map((item) => ({ ...item, id: item.id || crypto.randomUUID() })) });
  };

  const downloadPdf = (quote: QuoteData, total: number) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 16;
    pdf.setFillColor(31, 91, 71);
    pdf.rect(0, 0, pageWidth, 43, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(20); pdf.text('VEYON INTERIORS', margin, 19);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.text('Windows | Doors | Interior Solutions', margin, 27);
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(15); pdf.text('QUOTATION', pageWidth - margin, 19, { align: 'right' });
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.text(quote.quoteNumber, pageWidth - margin, 27, { align: 'right' });
    pdf.setTextColor(39, 48, 43);
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.text('Prepared for', margin, 55);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
    pdf.text([quote.clientName, quote.contactPerson, quote.phone, quote.email].filter(Boolean), margin, 62);
    pdf.setFont('helvetica', 'bold'); pdf.text('Project & site', 112, 55);
    pdf.setFont('helvetica', 'normal');
    pdf.text([quote.projectTitle, quote.projectType, quote.siteAddress].filter(Boolean), 112, 62, { maxWidth: pageWidth - 112 - margin });
    pdf.setFontSize(8); pdf.setTextColor(95, 105, 99);
    pdf.text(`Date: ${quote.issueDate}     Valid until: ${quote.validUntil || 'As agreed'}`, margin, 83);

    autoTable(pdf, {
      startY: 90,
      head: [['Product / work', 'Specification', 'Qty', 'Unit', 'Rate', 'Amount']],
      body: quote.items.map((item) => {
        const dimensions = item.width || item.height ? `${item.width || '-'} x ${item.height || '-'} mm` : '';
        const specifications = [dimensions, item.profile && `Profile: ${item.profile}`, item.glass && `Spec: ${item.glass}`, item.finish && `Finish: ${item.finish}`, item.hardware && `Hardware: ${item.hardware}`, item.installation ? 'Installation included' : 'Installation excluded'].filter(Boolean).join('\n');
        return [[item.category, item.description].filter(Boolean).join('\n'), specifications || '-', String(item.quantity), item.unit, formatINR(item.rate), formatINR(item.quantity * item.rate)];
      }),
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 3, textColor: [39, 48, 43], lineColor: [222, 228, 223], lineWidth: 0.2 },
      headStyles: { fillColor: [31, 91, 71], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 249, 246] },
      columnStyles: { 0: { cellWidth: 37 }, 1: { cellWidth: 49 }, 2: { cellWidth: 12, halign: 'right' }, 3: { cellWidth: 15 }, 4: { cellWidth: 28, halign: 'right' }, 5: { cellWidth: 28, halign: 'right' } },
      margin: { left: margin, right: margin },
    });

    let y = ((pdf as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 100) + 10;
    if (y > 235) { pdf.addPage(); y = 22; }
    const right = pageWidth - margin;
    const labelX = right - 70;
    const moneyLine = (label: string, amount: number, bold = false) => {
      pdf.setFont('helvetica', bold ? 'bold' : 'normal'); pdf.setFontSize(bold ? 11 : 9); pdf.setTextColor(39, 48, 43);
      pdf.text(label, labelX, y); pdf.text(formatINR(amount), right, y, { align: 'right' }); y += bold ? 8 : 6;
    };
    moneyLine('Subtotal', subtotal);
    if (discount > 0) moneyLine('Discount', -discount);
    if (quote.gstType === 'cgst_sgst') { moneyLine('CGST', tax.cgst); moneyLine('SGST', tax.sgst); }
    if (quote.gstType === 'igst') moneyLine('IGST', tax.igst);
    if (roundOff) moneyLine('Round off', roundOff);
    pdf.setDrawColor(31, 91, 71); pdf.line(labelX, y - 2, right, y - 2);
    moneyLine('Total quotation value', total, true);
    if (quote.installationDate) { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.text(`Planned installation: ${quote.installationDate}`, margin, y + 3); y += 10; }
    if (quote.notes) { pdf.setFont('helvetica', 'bold'); pdf.text('Notes & terms', margin, y + 4); pdf.setFont('helvetica', 'normal'); pdf.text(pdf.splitTextToSize(quote.notes, pageWidth - margin * 2), margin, y + 10); }
    pdf.setFontSize(8); pdf.setTextColor(105, 113, 108); pdf.text('Thank you for considering Veyon Interiors.', pageWidth / 2, 285, { align: 'center' });
    pdf.save(`${quote.quoteNumber.replaceAll('/', '-')}.pdf`);
  };

  const save = async (download = false) => {
    if (!form.clientName.trim() || !form.projectTitle.trim()) { toast.error('Enter the customer and project name.'); return; }
    if (!form.items.length || form.items.some((item) => !item.category || item.quantity <= 0)) { toast.error('Choose a category and a positive quantity for every line.'); return; }
    setSaving(true);
    try {
      const data = { ...form, discount };
      if (editingId) {
        const { error } = await supabase.from('quotations').update({ client_name: data.clientName, project_title: data.projectTitle, quotation_date: data.issueDate, grand_total: grandTotal, quotation_data: data as unknown as Json }).eq('id', editingId);
        if (error) throw error;
        setQuotes((current) => current.map((quote) => quote.id === editingId ? { ...data, id: editingId, grandTotal } : quote));
      } else {
        const { data: saved, error } = await supabase.from('quotations').insert({ user_id: user!.id, client_name: data.clientName, project_title: data.projectTitle, quotation_date: data.issueDate, grand_total: grandTotal, quotation_data: data as unknown as Json }).select('id').single();
        if (error) throw error;
        setEditingId(saved.id);
        setQuotes((current) => [{ ...data, id: saved.id, grandTotal }, ...current]);
      }
      if (download) downloadPdf(data, grandTotal);
      toast.success(editingId ? 'Quotation updated.' : 'Quotation saved.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not save quotation.'); }
    finally { setSaving(false); }
  };

  const remove = async (quote: SavedQuote) => {
    if (!window.confirm(`Delete quotation ${quote.quoteNumber}?`)) return;
    const { error } = await supabase.from('quotations').delete().eq('id', quote.id);
    if (error) { toast.error(error.message); return; }
    setQuotes((current) => current.filter((item) => item.id !== quote.id));
    toast.success('Quotation deleted.');
  };

  return <AppLayout>
    <PageHeader title="Quotations" description="Prepare detailed product proposals with site measurements, specifications, and installation scope." action={<Button type="button" onClick={startNew}><Plus className="mr-2 h-4 w-4" />New quotation</Button>} />
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
      <div className="space-y-5">
        <section className="glass-card rounded-xl p-6">
          <div className="mb-5 flex items-center gap-3"><div className="rounded-lg bg-primary/10 p-2 text-primary"><FileText className="h-5 w-5" /></div><div><h2 className="text-lg font-semibold">Customer & project</h2><p className="text-sm text-muted-foreground">Where the work will be supplied and installed</p></div></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2"><Label>Customer name *</Label><Input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="Customer or company" /></div>
            <div className="space-y-2"><Label>Contact person</Label><Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} placeholder="Site decision maker" /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Project name *</Label><Input value={form.projectTitle} onChange={(e) => setForm({ ...form, projectTitle: e.target.value })} placeholder="e.g. Lakeview Villa - windows & wardrobes" /></div>
            <div className="space-y-2"><Label>Project type</Label><Select value={form.projectType} onValueChange={(value) => setForm({ ...form, projectType: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROJECT_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-3"><Label>Installation site address</Label><Textarea value={form.siteAddress} onChange={(e) => setForm({ ...form, siteAddress: e.target.value })} rows={2} placeholder="Full property address" /></div>
            <div className="space-y-2"><Label>Quotation date</Label><Input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} /></div>
            <div className="space-y-2"><Label>Valid until</Label><Input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} /></div>
            <div className="space-y-2"><Label>Target installation date</Label><Input type="date" value={form.installationDate} onChange={(e) => setForm({ ...form, installationDate: e.target.value })} /></div>
          </div>
        </section>

        <section className="glass-card rounded-xl p-6">
          <div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-semibold">Products & specifications</h2><p className="text-sm text-muted-foreground">Record each opening, room, finish, and included work</p></div><Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, items: [...form.items, newItem()] })}><Plus className="mr-2 h-4 w-4" />Add line</Button></div>
          <div className="space-y-4">{form.items.map((item, index) => <div key={item.id} className="space-y-4 rounded-xl border border-border bg-background p-4">
            <div className="flex items-center justify-between"><p className="text-sm font-semibold text-primary">Line {index + 1}</p><Button type="button" variant="ghost" size="icon" aria-label="Remove line" disabled={form.items.length === 1} onClick={() => setForm({ ...form, items: form.items.filter((row) => row.id !== item.id) })}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
            <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label>Product / work category</Label><Select value={item.category} onValueChange={(value) => updateItem(item.id, 'category', value)}><SelectTrigger><SelectValue placeholder="Choose category" /></SelectTrigger><SelectContent>{SERVICE_CATEGORIES.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Room / opening / item reference</Label><Input value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} placeholder="e.g. Bedroom 1 - W03" /></div></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="space-y-2"><Label>Width (mm)</Label><Input type="number" min="0" value={item.width} onChange={(e) => updateItem(item.id, 'width', e.target.value)} placeholder="Optional" /></div><div className="space-y-2"><Label>Height (mm)</Label><Input type="number" min="0" value={item.height} onChange={(e) => updateItem(item.id, 'height', e.target.value)} placeholder="Optional" /></div><div className="space-y-2"><Label>Profile / material</Label><Input value={item.profile} onChange={(e) => updateItem(item.id, 'profile', e.target.value)} placeholder="Profile series / board" /></div><div className="space-y-2"><Label>Glass / product spec</Label><Input value={item.glass} onChange={(e) => updateItem(item.id, 'glass', e.target.value)} placeholder="Glass / panel details" /></div><div className="space-y-2"><Label>Colour / finish</Label><Input value={item.finish} onChange={(e) => updateItem(item.id, 'finish', e.target.value)} placeholder="Finish" /></div><div className="space-y-2"><Label>Hardware</Label><Input value={item.hardware} onChange={(e) => updateItem(item.id, 'hardware', e.target.value)} placeholder="Lock, handle, fittings" /></div><div className="space-y-2"><Label>Quantity</Label><Input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value) || 0)} /></div><div className="space-y-2"><Label>Unit</Label><Select value={item.unit} onValueChange={(value) => updateItem(item.id, 'unit', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{UNITS.map((unit) => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Rate (₹)</Label><Input type="number" min="0" step="0.01" value={item.rate || ''} onChange={(e) => updateItem(item.id, 'rate', Number(e.target.value) || 0)} /></div><div className="space-y-2"><Label>Line total</Label><div className="flex h-10 items-center font-semibold">{formatCurrency(item.quantity * item.rate)}</div></div></div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" className="h-4 w-4 accent-primary" checked={item.installation} onChange={(e) => updateItem(item.id, 'installation', e.target.checked)} />Installation included</label>
          </div>)}</div>
        </section>
        <section className="glass-card rounded-xl p-6"><h2 className="mb-4 text-lg font-semibold">Terms & tax</h2><div className="grid gap-4 sm:grid-cols-3"><div className="space-y-2"><Label>GST treatment</Label><Select value={form.gstType} onValueChange={(value) => setForm({ ...form, gstType: value as GstType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cgst_sgst">CGST + SGST</SelectItem><SelectItem value="igst">IGST</SelectItem><SelectItem value="no_gst">No GST</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Discount (₹)</Label><Input type="number" min="0" value={form.discount || ''} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) || 0 })} /></div><div className="space-y-2 sm:col-span-3"><Label>Scope notes, exclusions, and payment terms</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Mention lead time, advance, delivery, warranty, exclusions, and site readiness." /></div></div></section>
      </div>
      <aside className="space-y-5">
        <section className="glass-card sticky top-6 rounded-xl p-6"><p className="text-sm font-medium text-muted-foreground">Quotation total</p><p className="mt-2 text-3xl font-bold text-primary">{formatCurrency(grandTotal)}</p><div className="mt-5 space-y-3 border-t border-border pt-4 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>{discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>−{formatCurrency(discount)}</span></div>}{form.gstType === 'cgst_sgst' && <><div className="flex justify-between"><span className="text-muted-foreground">CGST</span><span>{formatCurrency(tax.cgst)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">SGST</span><span>{formatCurrency(tax.sgst)}</span></div></>}{form.gstType === 'igst' && <div className="flex justify-between"><span className="text-muted-foreground">IGST</span><span>{formatCurrency(tax.igst)}</span></div>}{roundOff !== 0 && <div className="flex justify-between"><span className="text-muted-foreground">Rounding</span><span>{formatCurrency(roundOff)}</span></div>}</div><div className="mt-5 grid gap-2"><Button type="button" onClick={() => void save(false)} disabled={saving}>{saving ? 'Saving…' : editingId ? 'Update quotation' : 'Save quotation'}</Button><Button type="button" variant="outline" onClick={() => void save(true)} disabled={saving}><Download className="mr-2 h-4 w-4" />Save & download PDF</Button></div></section>
        <section className="glass-card rounded-xl p-5"><h2 className="font-semibold">Saved quotations</h2>{loading ? <p className="mt-3 text-sm text-muted-foreground">Loading…</p> : quotes.length ? <div className="mt-3 space-y-3">{quotes.map((quote) => <div key={quote.id} className="rounded-lg border border-border p-3"><p className="text-xs font-medium text-primary">{quote.quoteNumber}</p><p className="mt-1 text-sm font-semibold">{quote.projectTitle}</p><p className="text-xs text-muted-foreground">{quote.clientName}</p><p className="mt-2 text-sm font-semibold">{formatCurrency(quote.grandTotal)}</p><div className="mt-3 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => edit(quote)}><Pencil className="mr-1 h-3 w-3" />Edit</Button><Button type="button" size="sm" variant="ghost" onClick={() => downloadPdf(quote, quote.grandTotal)}><Download className="mr-1 h-3 w-3" />PDF</Button><Button type="button" size="sm" variant="ghost" onClick={() => void remove(quote)}><Trash2 className="h-3 w-3 text-destructive" /></Button></div></div>)}</div> : <p className="mt-2 text-sm text-muted-foreground">Your saved proposals will appear here.</p>}</section>
      </aside>
    </div>
  </AppLayout>;
}
