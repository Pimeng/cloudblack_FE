import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { AnimationPhase } from '../hooks/useExpandableDetail';

interface AnimationLayerProps {
  animating: boolean;
  cardRect: DOMRect | null;
  animationPhase: AnimationPhase;
}

export function AnimationLayer({ animating, cardRect, animationPhase }: AnimationLayerProps) {
  if (!animating || !cardRect || animationPhase === 'content') return null;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const fullLeft = isMobile ? 0 : 256;
  const fullWidth = isMobile ? '100%' : 'calc(100% - 256px)';
  const isAtCardPosition = animationPhase === 'initial' || animationPhase === 'closing';

  return (
    <div
      className="fixed z-40 bg-card/90 backdrop-blur-xl rounded-2xl overflow-hidden border border-border/50"
      style={{
        left: isAtCardPosition ? cardRect.left : fullLeft,
        top: isAtCardPosition ? cardRect.top : 0,
        width: isAtCardPosition ? cardRect.width : fullWidth,
        height: isAtCardPosition ? cardRect.height : '100%',
        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    />
  );
}

interface DetailViewProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function DetailView({ isOpen, title, onClose, children }: DetailViewProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 left-0 md:left-64 bg-background z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 py-4 border-b border-border flex items-center justify-between shrink-0">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose} 
          className="text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 py-6 px-8 max-w-6xl mx-auto pb-20">
          {children}
        </div>
      </div>
    </div>
  );
}

// 详情信息网格项
interface DetailInfoItemProps {
  label: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function DetailInfoItem({ label, children, fullWidth = false }: DetailInfoItemProps) {
  return (
    <div className={fullWidth ? 'md:col-span-2' : ''}>
      <span className="text-muted-foreground text-sm">{label}:</span>
      <div className="mt-1">{children}</div>
    </div>
  );
}

// 详情信息网格
export function DetailInfoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      {children}
    </div>
  );
}

// 详情内容块
interface DetailContentBlockProps {
  label: string;
  children: React.ReactNode;
}

export function DetailContentBlock({ label, children }: DetailContentBlockProps) {
  return (
    <div>
      <span className="text-muted-foreground text-sm">{label}:</span>
      <div className="mt-2 bg-muted rounded-lg p-4">
        {children}
      </div>
    </div>
  );
}
