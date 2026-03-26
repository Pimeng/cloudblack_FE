import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ 
  title, 
  description, 
  children,
  className 
}: PageHeaderProps) {
  return (
    <div className={cn(
      'flex flex-col md:flex-row md:items-center justify-between gap-4',
      className
    )}>
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1 md:mb-2">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}
