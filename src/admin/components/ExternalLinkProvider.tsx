import { useState, useEffect } from 'react';
import { AlertTriangle, ExternalLink, Copy, X } from 'lucide-react';
import { toast } from 'sonner';

// SweetAlert 风格的动画关键帧
const swalAnimation = `
@keyframes swal-show {
  0% {
    transform: scale(1);
    opacity: 0;
  }
  1% {
    transform: scale(0.5);
    opacity: 0;
  }
  45% {
    transform: scale(1.05);
    opacity: 1;
  }
  80% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes swal-hide {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.5);
    opacity: 0;
  }
}

@keyframes swal-overlay-show {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes swal-overlay-hide {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.animate-swal-show {
  animation: swal-show 0.3s ease-out forwards;
}

.animate-swal-hide {
  animation: swal-hide 0.15s ease-in forwards;
}

.animate-swal-overlay-show {
  animation: swal-overlay-show 0.3s ease forwards;
}

.animate-swal-overlay-hide {
  animation: swal-overlay-hide 0.15s ease forwards;
}
`;

// 全局状态管理
let openExternalLinkCallback: ((url: string) => void) | null = null;

export function openExternalLink(url: string) {
  if (openExternalLinkCallback) {
    openExternalLinkCallback(url);
  }
}

export function ExternalLinkProvider() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [pendingUrl, setPendingUrl] = useState('');

  useEffect(() => {
    openExternalLinkCallback = (url: string) => {
      // 重置所有状态，准备显示
      setPendingUrl(url);
      setIsClosing(false);
      setShouldRender(true);
      setIsOpen(true);
    };
    return () => {
      openExternalLinkCallback = null;
    };
  }, []);

  // 监听 isOpen 变化，处理关闭动画
  useEffect(() => {
    if (!isOpen && shouldRender) {
      // 开始关闭动画
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false); // 完全关闭后重置
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(pendingUrl);
    toast.success('链接已复制到剪贴板');
  };

  const handleCancel = () => {
    // 触发关闭流程，useEffect 会处理动画
    setIsOpen(false);
  };

  const handleConfirm = () => {
    const url = pendingUrl;
    // 触发关闭流程
    setIsOpen(false);
    // 延迟打开链接，等待关闭动画
    setTimeout(() => {
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }, 150);
  };

  if (!shouldRender) return null;

  return (
    <>
      <style>{swalAnimation}</style>
      
      <div 
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ 
          zIndex: 99999,
        }}
      >
        {/* 背景遮罩 */}
        <div 
          className={`fixed inset-0 bg-black/40 backdrop-blur-sm ${
            isClosing ? 'animate-swal-overlay-hide' : 'animate-swal-overlay-show'
          }`}
          onClick={handleCancel}
        />
        
        {/* 对话框 */}
        <div 
          className={`relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden ${
            isClosing ? 'animate-swal-hide' : 'animate-swal-show'
          }`}
          style={{
            transformOrigin: 'center center',
            zIndex: 99999,
          }}
        >
          {/* 顶部装饰条 */}
          <div className="h-1.5 w-full bg-gradient-to-r from-yellow-500/50 via-orange-500/50 to-red-500/50" />
          
          {/* 关闭按钮 */}
          <button
            onClick={handleCancel}
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
                    {pendingUrl}
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
                onClick={handleCancel}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
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
    </>
  );
}
