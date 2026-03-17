import { useTurnstile, type UseTurnstileOptions } from '@/hooks/useTurnstile';
import { Loader2, Shield } from 'lucide-react';

interface TurnstileWidgetProps extends UseTurnstileOptions {
  className?: string;
}

export function TurnstileWidget(props: TurnstileWidgetProps) {
  const { className = '' } = props;
  const { widgetRef, isLoading, error, token } = useTurnstile(props);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* 标题 */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Shield className="w-4 h-4" />
        <span>人机验证</span>
        {token && (
          <span className="text-green-500 text-xs">(已完成)</span>
        )}
      </div>

      {/* Widget 容器 */}
      <div className="relative">
        {/* 加载状态 */}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>加载验证组件...</span>
          </div>
        )}

        {/* Turnstile Widget */}
        <div 
          ref={widgetRef} 
          className={isLoading ? 'hidden' : ''}
        />

        {/* 错误提示 */}
        {error && (
          <div className="text-sm text-destructive mt-2">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
