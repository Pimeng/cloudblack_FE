import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { DialogProps } from '@radix-ui/react-dialog';

interface AdminDialogContentProps extends DialogProps {
  className?: string;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export function AdminDialogContent({ 
  children, 
  className,
  fullWidth = false,
  ...props 
}: AdminDialogContentProps) {
  return (
    <DialogContent 
      className={cn(
        'bg-slate-900 border-slate-800 text-white',
        fullWidth ? 'w-[calc(100%-2rem)] mx-4' : 'max-w-lg w-[calc(100%-2rem)] mx-4',
        className
      )} 
      {...props}
    >
      {children}
    </DialogContent>
  );
}

// 重新导出其他 Dialog 组件以便统一使用
export {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};
