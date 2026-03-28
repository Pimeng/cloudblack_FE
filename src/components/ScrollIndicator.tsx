interface ScrollIndicatorProps {
  visible: boolean;
}

export function ScrollIndicator({ visible }: ScrollIndicatorProps) {
  return (
    <div
      className="fixed top-1/2 right-4 md:right-8 z-[60] flex flex-col items-center gap-2 transition-all duration-500"
      style={{
        opacity: visible ? 1 : 0,
        transform: `translateY(-50%) translateX(${visible ? '0' : '16px'})`,
        pointerEvents: 'none',
      }}
    >
      {/* 水平滚动提示 - 右箭头 */}
      <div className="flex items-center gap-1 text-foreground/50 bg-background/50 backdrop-blur-sm rounded-full px-2 py-1">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          className="text-foreground/70 animate-scroll-arrow-horizontal"
        >
          <path
            d="M5 12h14M13 5l7 7-7 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* 页面指示器点 - 垂直排列更省空间 */}
      <div className="flex flex-col gap-1.5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-foreground/40"
          />
        ))}
      </div>
    </div>
  );
}
