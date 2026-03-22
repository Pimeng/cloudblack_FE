import { useEffect, useState } from 'react';
import { X, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ClarityNotice() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // 检查是否已经关闭过
    const dismissed = localStorage.getItem('clarity-notice-dismissed');
    if (!dismissed) {
      // 延迟显示，避免页面加载时直接弹出
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('clarity-notice-dismissed', 'true');
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="fixed top-4 right-4 z-[100] max-w-sm"
        >
          <div
            className="relative overflow-hidden rounded-xl border border-amber-400/50 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 p-4 backdrop-blur-xl"
            style={{
              boxShadow: `
                /* 内发光边框 */
                inset 0 0 0 1px rgba(245, 158, 11, 0.3),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.15),
                /* 主光晕 - 琥珀色 */
                0 0 20px rgba(245, 158, 11, 0.4),
                0 0 40px rgba(245, 158, 11, 0.3),
                0 0 80px rgba(245, 158, 11, 0.2),
                /* 蓝色辅助光晕 */
                0 0 30px rgba(59, 130, 246, 0.25),
                /* 外阴影 */
                0 10px 50px -10px rgba(0, 0, 0, 0.5)
              `,
            }}
          >
            {/* 强光效背景 - 右上角大光晕 */}
            <div
              className="pointer-events-none absolute -right-32 -top-32 h-64 w-64 rounded-full"
              style={{
                background: `
                  radial-gradient(circle at center,
                    rgba(251, 191, 36, 0.6) 0%,
                    rgba(245, 158, 11, 0.4) 20%,
                    rgba(245, 158, 11, 0.2) 40%,
                    rgba(245, 158, 11, 0.05) 60%,
                    transparent 70%
                  )
                `,
                filter: 'blur(30px)',
              }}
            />
            
            {/* 强光效背景 - 左下角蓝色光晕 */}
            <div
              className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full"
              style={{
                background: `
                  radial-gradient(circle at center,
                    rgba(96, 165, 250, 0.5) 0%,
                    rgba(59, 130, 246, 0.3) 30%,
                    rgba(59, 130, 246, 0.1) 50%,
                    transparent 70%
                  )
                `,
                filter: 'blur(25px)',
              }}
            />

            {/* 顶部高光线条 - 增强版 */}
            <div
              className="pointer-events-none absolute left-0 right-0 top-0 h-[2px]"
              style={{
                background: `
                  linear-gradient(90deg,
                    transparent 0%,
                    rgba(251, 191, 36, 1) 15%,
                    rgba(245, 158, 11, 0.9) 35%,
                    rgba(96, 165, 250, 0.7) 65%,
                    rgba(59, 130, 246, 0.5) 85%,
                    transparent 100%
                  )
                `,
                boxShadow: `
                  0 0 10px rgba(251, 191, 36, 0.8),
                  0 0 20px rgba(245, 158, 11, 0.6),
                  0 0 30px rgba(245, 158, 11, 0.4)
                `,
              }}
            />

            {/* 左侧垂直光条 */}
            <div
              className="pointer-events-none absolute bottom-4 left-0 top-4 w-[2px]"
              style={{
                background: `
                  linear-gradient(180deg,
                    transparent 0%,
                    rgba(251, 191, 36, 0.8) 30%,
                    rgba(245, 158, 11, 0.6) 50%,
                    rgba(59, 130, 246, 0.4) 70%,
                    transparent 100%
                  )
                `,
                boxShadow: '0 0 10px rgba(251, 191, 36, 0.5)',
              }}
            />

            {/* 关闭按钮 - 增强发光 */}
            <button
              onClick={handleDismiss}
              className="absolute right-2 top-2 rounded-full p-1.5 text-slate-300 transition-all duration-200 hover:bg-white/15 hover:text-white"
              style={{
                textShadow: '0 0 8px rgba(255, 255, 255, 0.3)',
              }}
              aria-label="关闭通知"
            >
              <X className="h-4 w-4" />
            </button>

            {/* 内容区域 */}
            <div className="relative flex items-start gap-3 pr-6">
              {/* 图标 - 超级发光版 */}
              <div
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: `
                    linear-gradient(135deg,
                      rgba(251, 191, 36, 0.35) 0%,
                      rgba(245, 158, 11, 0.25) 50%,
                      rgba(59, 130, 246, 0.2) 100%
                    )
                  `,
                  boxShadow: `
                    inset 0 1px 0 0 rgba(255, 255, 255, 0.2),
                    inset 0 0 20px rgba(251, 191, 36, 0.2),
                    0 0 15px rgba(245, 158, 11, 0.4),
                    0 0 30px rgba(245, 158, 11, 0.3),
                    0 0 45px rgba(245, 158, 11, 0.2)
                  `,
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                }}
              >
                <BarChart3
                  className="h-6 w-6"
                  style={{
                    color: '#fbbf24',
                    filter: `
                      drop-shadow(0 0 4px rgba(251, 191, 36, 0.8))
                      drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))
                      drop-shadow(0 0 12px rgba(245, 158, 11, 0.4))
                    `,
                  }}
                />
              </div>

              {/* 文字内容 - 增强发光 */}
              <div className="flex-1">
                <h4
                  className="mb-1.5 text-sm font-bold tracking-wide"
                  style={{
                    color: '#fff',
                    textShadow: `
                      0 0 10px rgba(255, 255, 255, 0.5),
                      0 0 20px rgba(251, 191, 36, 0.3),
                      0 0 30px rgba(245, 158, 11, 0.2)
                    `,
                  }}
                >
                  数据分析声明
                </h4>
                <p 
                  className="text-xs leading-relaxed"
                  style={{
                    color: 'rgba(226, 232, 240, 0.95)',
                    textShadow: '0 0 10px rgba(255, 255, 255, 0.1)',
                  }}
                >
                  本站使用 Clarity 来分析用户行为，帮助我们更好地改进站点。如需禁用，请开启浏览器的跟踪防护。
                </p>
              </div>
            </div>

            {/* 底部装饰线 - 增强版 */}
            <div
              className="pointer-events-none absolute bottom-0 left-4 right-4 h-[2px]"
              style={{
                background: `
                  linear-gradient(90deg,
                    transparent 0%,
                    rgba(251, 191, 36, 0.6) 20%,
                    rgba(96, 165, 250, 0.5) 50%,
                    rgba(59, 130, 246, 0.4) 80%,
                    transparent 100%
                  )
                `,
                boxShadow: `
                  0 -1px 10px rgba(251, 191, 36, 0.3),
                  0 -2px 20px rgba(59, 130, 246, 0.2)
                `,
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
