import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { InlineSpinner } from './LoadingSpinner';
import type { LucideIcon } from 'lucide-react';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading: boolean;
  icon?: LucideIcon;
  children: React.ReactNode;
  spinnerClassName?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export function LoadingButton({ 
  loading, 
  icon: Icon,
  children,
  disabled,
  spinnerClassName,
  className,
  ...props 
}: LoadingButtonProps) {
  return (
    <Button 
      disabled={loading || disabled} 
      className={cn(className)}
      {...props}
    >
      {loading ? (
        <InlineSpinner className={cn('mr-2', spinnerClassName)} />
      ) : Icon ? (
        <Icon className="w-4 h-4 mr-2" />
      ) : null}
      {children}
    </Button>
  );
}
