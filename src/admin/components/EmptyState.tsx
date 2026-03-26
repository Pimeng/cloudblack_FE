import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title?: string;
  description?: string;
  className?: string;
  iconClassName?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title,
  description = '暂无数据',
  className,
  iconClassName
}: EmptyStateProps) {
  return (
    <div className={cn('glass rounded-2xl p-12 text-center', className)}>
      <Icon className={cn('w-16 h-16 text-muted-foreground/40 mx-auto mb-4', iconClassName)} />
      {title && <p className="text-foreground font-medium mb-2">{title}</p>}
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
