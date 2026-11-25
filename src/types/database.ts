export type InvoiceStatus = 'draft' | 'sent' | 'partially_paid' | 'completed' | 'overdue';
export type GstType = 'cgst_sgst' | 'igst' | 'no_gst';
export type PaymentMethod = 'bank_transfer' | 'upi' | 'cash' | 'cheque' | 'card';
export type ProjectStage = 'site_measurement' | 'quotation_sent' | 'approved' | 'in_production' | 'ready_for_installation' | 'installation_scheduled' | 'completed';
export const PROJECT_STAGES: { value: ProjectStage; label: string }[] = [
  { value: 'site_measurement', label: 'Site measurement' },
  { value: 'quotation_sent', label: 'Quotation sent' },
  { value: 'approved', label: 'Approved' },
  { value: 'in_production', label: 'In production' },
  { value: 'ready_for_installation', label: 'Ready for installation' },
  { value: 'installation_scheduled', label: 'Installation scheduled' },
  { value: 'completed', label: 'Completed' },
];

export interface CompanyProfile {
  id: string;
  user_id: string;
  company_name: string;
  logo_url: string | null;
  office_address: string | null;
  gstin: string | null;
  pan_number: string | null;
  phone: string | null;
  email: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  bank_name: string | null;
  terms_and_conditions: string | null;
  legal_disclaimer: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  client_name: string;
  production_house_name: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  billing_address: string | null;
  gstin: string | null;
  state: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string | null;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  project_title: string;
  project_type: string;
  project_stage: ProjectStage;
  site_address: string | null;
  site_contact_name: string | null;
  site_contact_phone: string | null;
  measurement_date: string | null;
  installation_date: string | null;
  subtotal: number;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
  gst_type: GstType;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  round_off: number;
  grand_total: number;
  total_paid: number;
  balance_due: number;
  cameraman_amount: number;
  sound_amount: number;
  status: InvoiceStatus;
  notes: string | null;
  custom_disclaimer: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  service_category: string;
  description: string | null;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
  width_mm: number | null;
  height_mm: number | null;
  profile_series: string | null;
  glass_specification: string | null;
  finish: string | null;
  hardware_specification: string | null;
  installation_included: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  user_id: string;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_reference: string | null;
  notes: string | null;
  created_at: string;
}

export interface Receipt {
  id: string;
  payment_id: string;
  user_id: string;
  receipt_number: string;
  receipt_date: string;
  amount: number;
  balance_after_payment: number;
  created_at: string;
}

export const SERVICE_CATEGORIES = [
  'uPVC Windows',
  'uPVC Doors',
  'Aluminium Windows',
  'Cupboards',
  'Wardrobes',
  'False Ceilings',
  'Wall Panels',
  'Installation',
  'Other',
] as const;

export const PROJECT_TYPES = [
  'Residential',
  'Commercial',
  'Renovation',
  'New Construction',
  'Other',
] as const;

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Puducherry',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Lakshadweep',
  'Andaman and Nicobar Islands',
] as const;

export const UNITS = [
  'Piece',
  'Sq. ft.',
  'Running ft.',
  'Set',
  'Lot',
] as const;
