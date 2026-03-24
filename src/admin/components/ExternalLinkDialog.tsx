import { useState, useCallback } from 'react';
import { AlertTriangle, ExternalLink, Copy, X } from 'lucide-react';
import { toast } from 'sonner';

interface ExternalLinkDialogProps {
  isOpen: boolean;
  url: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ExternalLinkDialog({ isOpen, url, onConfirm, onCancel }: ExternalLinkDialogProps) {
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(url);
    toast.success('链接已复制到剪贴板');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onCancel}
      />
      
      {/* 对话框 */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-200 overflow-hidden">
        {/* 顶部装饰条 */}
        <div className="h-1.5 w-full bg-gradient-to-r from-yellow-500/50 via-orange-500/50 to-red-500/50" />
        
        {/* 关闭按钮 */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 内容区域 */}
        <div className="p-6 pt-8">
          {/* 图标 */}
          <div className="mx-auto w-16 h-16 rounded-full bg-yellow-500/10 border-2 border-yellow-500/30 flex items-center justify-center mb-5">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>

          {/* 标题 */}
          <h3 className="text-xl font-semibold text-white text-center mb-3">
            即将离开本站
          </h3>

          {/* 提示信息 */}
          <p className="text-slate-400 text-center text-sm mb-5 leading-relaxed">
            您正准备离开本站前往以下地址，请确认目标链接是否安全。
          </p>

          {/* 链接显示区域 */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <ExternalLink className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 mb-1">目标地址</p>
                <p className="text-sm text-white font-mono break-all leading-relaxed">
                  {url}
                </p>
              </div>
              <button
                onClick={handleCopyUrl}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
                title="复制链接"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 按钮组 */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              取消
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 px-4 rounded-xl bg-brand hover:bg-brand-dark text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              继续访问
            </button>
          </div>
        </div>

        {/* 底部安全提示 */}
        <div className="px-6 py-3 bg-slate-800/50 border-t border-slate-800">
          <p className="text-xs text-slate-500 text-center">
            请勿在不明网站输入您的账号密码
          </p>
        </div>
      </div>
    </div>
  );
}

// Hook 用于管理外链对话框状态
export function useExternalLink() {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingUrl, setPendingUrl] = useState('');

  const openExternalLink = useCallback((url: string) => {
    setPendingUrl(url);
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setPendingUrl('');
  }, []);

  const confirmNavigation = useCallback(() => {
    if (pendingUrl) {
      window.open(pendingUrl, '_blank', 'noopener,noreferrer');
    }
    closeDialog();
  }, [pendingUrl, closeDialog]);

  return {
    isOpen,
    pendingUrl,
    openExternalLink,
    closeDialog,
    confirmNavigation,
  };
}
