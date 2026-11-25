import { cn } from '@/lib/utils';
import { getStatusColor, getStatusLabel } from '@/lib/invoice-utils';
import { Circle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn('status-badge', getStatusColor(status), className)}>
      <Circle className="h-2 w-2 fill-current" />
      {getStatusLabel(status)}
    </span>
  );
}
