import { Button } from '@/components/ui/button';
import { Building, Phone, Mail, MapPin, Edit, Trash2 } from 'lucide-react';

interface ClientCardProps {
  client: {
    id: string;
    client_name: string;
    production_house_name: string | null;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
    state: string;
    gstin: string | null;
  };
  onEdit: () => void;
  onDelete: () => void;
}

export function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  return (
    <div className="glass-card hover-lift rounded-xl border border-border p-6">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
            <Building className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{client.client_name}</h3>
            {client.production_house_name && (
              <p className="text-sm text-muted-foreground">
                {client.production_house_name}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {client.contact_person && (
          <p className="text-muted-foreground">{client.contact_person}</p>
        )}
        {client.email && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            {client.email}
          </div>
        )}
        {client.phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
            {client.phone}
          </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {client.state}
        </div>
      </div>

      {client.gstin && (
        <div className="mt-4 rounded-md bg-secondary px-3 py-2">
          <p className="text-xs text-muted-foreground">GSTIN</p>
          <p className="font-mono text-sm">{client.gstin}</p>
        </div>
      )}

    </div>
  );
}
