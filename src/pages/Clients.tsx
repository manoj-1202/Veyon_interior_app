import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Users, Plus, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ClientForm, ClientFormData } from '@/components/clients/ClientForm';
import { ClientCard } from '@/components/clients/ClientCard';

interface Client {
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
  aadhar_image_url: string | null;
  pan_image_url: string | null;
  created_at: string;
  updated_at: string;
}

const initialFormData: ClientFormData = {
  client_name: '',
  production_house_name: '',
  contact_person: '',
  phone: '',
  email: '',
  billing_address: '',
  gstin: '',
  state: '',
  aadhar_image_url: '',
  pan_image_url: '',
};

export default function Clients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>(initialFormData);

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const submitData = {
        client_name: formData.client_name,
        production_house_name: formData.production_house_name || null,
        contact_person: formData.contact_person || null,
        phone: formData.phone || null,
        email: formData.email || null,
        billing_address: formData.billing_address || null,
        gstin: formData.gstin || null,
        state: formData.state,
        aadhar_image_url: formData.aadhar_image_url || null,
        pan_image_url: formData.pan_image_url || null,
      };

      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update(submitData)
          .eq('id', editingClient.id);

        if (error) throw error;
        toast.success('Client updated successfully');
      } else {
        const { error } = await supabase.from('clients').insert({
          ...submitData,
          user_id: user!.id,
        });

        if (error) throw error;
        toast.success('Client created successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchClients();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      toast.success('Client deleted successfully');
      fetchClients();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setFormData({
      client_name: client.client_name,
      production_house_name: client.production_house_name || '',
      contact_person: client.contact_person || '',
      phone: client.phone || '',
      email: client.email || '',
      billing_address: client.billing_address || '',
      gstin: client.gstin || '',
      state: client.state,
      aadhar_image_url: client.aadhar_image_url || '',
      pan_image_url: client.pan_image_url || '',
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingClient(null);
    setFormData(initialFormData);
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.production_house_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Customers" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Customers"
        description="Customer contacts, property details, and billing information"
        action={
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? 'Edit customer' : 'Add customer'}
                </DialogTitle>
              </DialogHeader>
              <ClientForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
                isEditing={!!editingClient}
                userId={user?.id || ''}
                clientId={editingClient?.id}
              />
            </DialogContent>
          </Dialog>
        }
      />

      {/* Search */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={() => openEditDialog(client)}
              onDelete={() => handleDelete(client.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No customers found"
          description={
            searchQuery
              ? 'Try adjusting your search'
              : 'Add your first customer to get started'
          }
          action={
            !searchQuery ? (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            ) : undefined
          }
        />
      )}
    </AppLayout>
  );
}
