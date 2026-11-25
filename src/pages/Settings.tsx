import { useEffect, useState } from 'react';
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
import { Loader2, Save, Building, CreditCard, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { INDIAN_STATES } from '@/types/database';
import type { CompanyProfile } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'company' | 'bank' | 'legal'>('company');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);


  const [profile, setProfile] = useState<Partial<CompanyProfile>>({
    company_name: '',
    office_address: '',
    gstin: '',
    pan_number: '',
    phone: '',
    email: '',
    bank_account_name: '',
    bank_account_number: '',
    bank_ifsc: '',
    bank_name: '',
    terms_and_conditions: '',
    legal_disclaimer: '',
    logo_url: '', 
  });

const uploadLogo = async (): Promise<string | null> => {
  if (!logoFile) return profile.logo_url || null;

  if (!logoFile.type.startsWith('image/')) {
    toast.error('Please upload a valid image file');
    return profile.logo_url || null;
  }

  setUploadingLogo(true);

  try {
    const fileExt = logoFile.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `logo-${timestamp}.${fileExt}`;
    const filePath = `${user!.id}/${fileName}`;

    const { error } = await supabase.storage
      .from('company-logos')
      .upload(filePath, logoFile, { upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from('company-logos').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error: any) {
    toast.error(error.message);
    return null;
  } finally {
    setUploadingLogo(false);
  }
};




  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('company_profile')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

 const handleSave = async () => {
  setSaving(true);
  try {
    const logoURL = await uploadLogo();

    const updatedProfile = { ...profile, logo_url: logoURL };

    const { data: existing } = await supabase
      .from('company_profile')
      .select('id')
      .single();

    if (existing) {
      const { error } = await supabase
        .from('company_profile')
        .update(updatedProfile)
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('company_profile')
        .insert({ ...updatedProfile, user_id: user!.id });

      if (error) throw error;
    }

    toast.success('Settings saved successfully');
    setProfile(updatedProfile);
    setLogoFile(null);
  } catch (error: any) {
    toast.error(error.message);
  } finally {
    setSaving(false);
  }
};


  const tabs = [
    { id: 'company' as const, label: 'Company', icon: Building },
    { id: 'bank' as const, label: 'Bank Details', icon: CreditCard },
    { id: 'legal' as const, label: 'Legal', icon: FileText },
  ];

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Settings" />
        <Skeleton className="h-96 rounded-xl" />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Settings"
        description="Manage your company profile and preferences"
        action={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
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
        }
      />

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="glass-card rounded-xl border border-border p-6">
        {activeTab === 'company' && (
          <div className="space-y-6">
            <h3 className="font-display text-lg font-semibold">Company Information</h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={profile.company_name || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, company_name: e.target.value })
                  }
                  placeholder="Your Company Name"
                />
              </div>
<div className="space-y-2 sm:col-span-2">
  <Label>Company Logo</Label>

  {/* Logo preview */}
  {logoFile ? (
    <img
      src={URL.createObjectURL(logoFile)}
      alt="Selected Logo Preview"
      className="h-24 w-24 rounded-md object-contain border border-border"
    />
  ) : profile.logo_url ? (
    <img
      src={profile.logo_url}
      alt="Company Logo"
      className="h-24 w-24 rounded-md object-contain border border-border"
    />
  ) : null}

  {/* File input */}
  <Input
    type="file"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          toast.error('Please upload a valid image file');
          return;
        }
        setLogoFile(file);
      }
    }}
  />

  {/* Uploading indicator */}
  {uploadingLogo && (
    <p className="text-sm text-muted-foreground">Uploading logo...</p>
  )}
</div>



              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email || ''}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="contact@company.com"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="office_address">Office Address</Label>
                <Textarea
                  id="office_address"
                  value={profile.office_address || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, office_address: e.target.value })
                  }
                  placeholder="Full office address including city, state, and PIN code"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN</Label>
                <Input
                  id="gstin"
                  value={profile.gstin || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, gstin: e.target.value.toUpperCase() })
                  }
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pan_number">PAN Number</Label>
                <Input
                  id="pan_number"
                  value={profile.pan_number || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, pan_number: e.target.value.toUpperCase() })
                  }
                  placeholder="AAAAA0000A"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bank' && (
          <div className="space-y-6">
            <h3 className="font-display text-lg font-semibold">Bank Details</h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="bank_account_name">Account Holder Name</Label>
                <Input
                  id="bank_account_name"
                  value={profile.bank_account_name || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, bank_account_name: e.target.value })
                  }
                  placeholder="Account holder name as per bank records"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_account_number">Account Number</Label>
                <Input
                  id="bank_account_number"
                  value={profile.bank_account_number || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, bank_account_number: e.target.value })
                  }
                  placeholder="Bank account number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_ifsc">IFSC Code</Label>
                <Input
                  id="bank_ifsc"
                  value={profile.bank_ifsc || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, bank_ifsc: e.target.value.toUpperCase() })
                  }
                  placeholder="SBIN0000001"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="bank_name">Bank Name & Branch</Label>
                <Input
                  id="bank_name"
                  value={profile.bank_name || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, bank_name: e.target.value })
                  }
                  placeholder="State Bank of India, Main Branch"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'legal' && (
          <div className="space-y-6">
            <h3 className="font-display text-lg font-semibold">Legal & Terms</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="terms_and_conditions">Terms & Conditions</Label>
                <Textarea
                  id="terms_and_conditions"
                  value={profile.terms_and_conditions || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, terms_and_conditions: e.target.value })
                  }
                  placeholder="Standard terms and conditions for invoices"
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="legal_disclaimer">Legal Disclaimer</Label>
                <p className="text-sm text-muted-foreground">
                  This will appear as Page 2 in your invoice PDFs
                </p>
                <Textarea
                  id="legal_disclaimer"
                  value={profile.legal_disclaimer || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, legal_disclaimer: e.target.value })
                  }
                  placeholder="Legal disclaimer text..."
                  rows={8}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
