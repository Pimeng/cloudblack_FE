interface ScrollIndicatorProps {
  visible: boolean;
}

export function ScrollIndicator({ visible }: ScrollIndicatorProps) {
  return (
    <div
      className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 transition-all duration-500"
      style={{
        opacity: visible ? 1 : 0,
        transform: `translateX(-50%) translateY(${visible ? '0' : '16px'})`,
        pointerEvents: 'none',
      }}
    >
      {/* Mouse shell */}
      <div className="relative w-5 h-8 rounded-full border-2 border-white/50">
        {/* Static dot, positioned in upper third */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[6px] w-[3px] h-[8px] rounded-full bg-white/80" />
      </div>

      {/* Arrow */}
      <svg
        width="10"
        height="14"
        viewBox="0 0 10 14"
        fill="none"
        className="text-white/50 animate-scroll-arrow"
      >
        <path
          d="M5 0v11M1 8l4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
