import { useState, useEffect, useCallback } from 'react';
import { BookOpen, X, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { openExternalLink } from './ExternalLinkProvider';

const STORAGE_KEY = 'doc_reminder_closed';
const DOC_URL = 'https://cloudblack-doc.07210700.xyz?pwd=PIMENGNB';

export function DocReminder() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const checkVisibility = useCallback(() => {
    const hasClosed = localStorage.getItem(STORAGE_KEY);
    setIsVisible(!hasClosed);
  }, []);

  useEffect(() => {
    // 检查用户是否之前关闭过提醒
    checkVisibility();

    // 监听自定义事件，用于重新显示提醒
    const handleShowEvent = () => {
      checkVisibility();
      if (!localStorage.getItem(STORAGE_KEY)) {
        toast.success('文档提醒已重新显示');
      }
    };

    window.addEventListener('showDocReminder', handleShowEvent);
    return () => window.removeEventListener('showDocReminder', handleShowEvent);
  }, [checkVisibility]);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
    toast.info('如需查看文档，可点击左下角「刷新数据」旁的菜单重新显示');
  };

  const handleOpenDoc = () => {
    openExternalLink(DOC_URL);
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 展开的提示内容 */}
      {isExpanded && (
        <div className="mb-2 w-80 glass rounded-2xl p-4 border border-border/50 shadow-xl animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-brand" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground">Bot 对接文档</h4>
                <p className="text-xs text-muted-foreground">开发 Bot 时需要参考</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="不再显示"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1.5">文档地址</p>
              <button
                onClick={handleOpenDoc}
                className="flex items-center gap-1.5 text-sm text-brand hover:text-brand-light transition-colors group"
              >
                <span className="font-mono">{DOC_URL}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

            <button
              onClick={handleOpenDoc}
              className="w-full py-2 px-3 rounded-xl bg-brand hover:bg-brand-dark text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              前往查看文档
            </button>
          </div>
        </div>
      )}

      {/* 悬浮按钮 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          flex items-center gap-2 px-4 py-3 rounded-full
          transition-all duration-300 shadow-lg
          ${isExpanded || isHovered
            ? 'bg-brand hover:bg-brand-dark text-white shadow-brand/30'
            : 'bg-muted/90 hover:bg-muted text-foreground/80 border border-border/50'
          }
        `}
      >
        <BookOpen className="w-4 h-4" />
        <span className="text-sm font-medium">
          {isExpanded ? '收起' : 'Bot 对接文档'}
        </span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronUp className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

// 重新显示提醒的函数，可以在其他地方调用
export function showDocReminder() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('showDocReminder'));
}
