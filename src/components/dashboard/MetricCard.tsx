import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function MetricCard({
  title,
  value,
  icon,
  trend,
  variant = 'default',
  className,
}: MetricCardProps) {
  const variantStyles = {
    default: 'border-border',
    primary: 'border-primary/25',
    success: 'border-status-completed/30',
    warning: 'border-status-sent/30',
    danger: 'border-status-overdue/30',
  };

  const iconStyles = {
    default: 'bg-secondary text-secondary-foreground',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-status-completed/20 text-status-completed',
    warning: 'bg-status-sent/20 text-status-sent',
    danger: 'bg-status-overdue/20 text-status-overdue',
  };

  return (
    <div
      className={cn(
        'glass-card hover-lift rounded-xl border p-6',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="font-sans text-2xl font-semibold tracking-tight lg:text-3xl">
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                'text-sm font-medium',
                trend.isPositive ? 'text-status-completed' : 'text-status-overdue'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className={cn('rounded-xl p-3', iconStyles[variant])}>{icon}</div>
      </div>
    </div>
  );
}
