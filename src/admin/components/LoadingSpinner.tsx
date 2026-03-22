import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ 
  className, 
  text = '加载中...',
  size = 'md' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={cn('text-center py-20', className)}>
      <span className={cn(
        'border-2 border-brand/30 border-t-brand rounded-full animate-spin inline-block',
        sizeClasses[size]
      )} />
      {text && <p className="text-muted-foreground mt-4">{text}</p>}
    </div>
  );
}

// 行内加载 spinner（用于按钮等）
export function InlineSpinner({ className }: { className?: string }) {
  return (
    <span className={cn(
      'w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin',
      className
    )} />
  );
}
