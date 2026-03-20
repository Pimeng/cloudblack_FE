import { useEffect, useState, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FluidBackground } from './components/FluidBackground';
import { HeroSection } from './sections/HeroSection';
import { FeaturesSection } from './sections/FeaturesSection';
import { ProcessSection } from './sections/ProcessSection';
import { StatsSection } from './sections/StatsSection';
import { AppealSection } from './sections/AppealSection';
import { Footer } from './sections/Footer';
import { AdminLogin } from './admin/AdminLogin';
import { AdminDashboard } from './admin/AdminDashboard';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Toaster } from '@/components/ui/sonner';
import { ImageViewerProvider } from '@/hooks/useImageViewer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

gsap.registerPlugin(ScrollTrigger);

type PageKey = 'hero' | 'features' | 'process' | 'stats' | 'appeal';
const PAGES: PageKey[] = ['hero', 'features', 'process', 'stats', 'appeal'];
const PAGE_LABELS: Record<PageKey, string> = {
  hero: '云黑查询',
  features: '了解云黑',
  process: '申诉流程',
  stats: '数据统计',
  appeal: '申诉中心',
};

function PageDots({ currentIndex, onGoTo }: { currentIndex: number; onGoTo: (i: number) => void }) {
  // Each dot is h-2 (8px) or h-6 (24px) for active, gap-3 (12px) between
  // We calculate the center Y of each dot relative to the container
  const DOT_H_INACTIVE = 8;
  const DOT_H_ACTIVE = 24;
  const GAP = 12;

  // Compute cumulative center positions
  const centers = PAGES.map((_, i) => {
    let y = 0;
    for (let j = 0; j < i; j++) {
      y += (j === currentIndex ? DOT_H_ACTIVE : DOT_H_INACTIVE) + GAP;
    }
    y += (i === currentIndex ? DOT_H_ACTIVE : DOT_H_INACTIVE) / 2;
    return y;
  });

  const totalHeight = PAGES.reduce((acc, _, i) => {
    return acc + (i === currentIndex ? DOT_H_ACTIVE : DOT_H_INACTIVE) + (i < PAGES.length - 1 ? GAP : 0);
  }, 0);

  const activeCenterY = centers[currentIndex];
  // tooltip top relative to container top = activeCenterY - totalHeight/2
  const tooltipOffset = activeCenterY - totalHeight / 2;

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-3">
      {/* Tooltip — positioned relative to the dots container center */}
      <div
        className="absolute left-5 z-50 pointer-events-none"
        style={{
          top: '50%',
          transform: `translateY(calc(-50% + ${tooltipOffset}px))`,
          transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div className="glass rounded-lg px-3 py-1.5 text-sm text-white whitespace-nowrap flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
          {PAGE_LABELS[PAGES[currentIndex]]}
        </div>
      </div>

      {PAGES.map((_, i) => (
        <button
          key={i}
          onClick={() => onGoTo(i)}
          className={`w-2 rounded-full transition-all duration-300 ${
            i === currentIndex
              ? 'h-6 bg-brand shadow-glow'
              : 'h-2 bg-white/30 hover:bg-white/60'
          }`}
        />
      ))}
    </div>
  );
}

function HomePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isAnimating = useRef(false);
  const touchStartY = useRef(0);


  const goTo = useCallback((index: number) => {
    if (index < 0 || index >= PAGES.length || isAnimating.current) return;
    isAnimating.current = true;
    setCurrentIndex(index);
    // Refresh ScrollTrigger after transition so section animations fire
    setTimeout(() => {
      ScrollTrigger.refresh();
      isAnimating.current = false;
    }, 750);
  }, []);

  // Wheel handler
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      // If the event target is inside a scrollable panel, only let it
      // bubble up to page-switching when the panel has hit its scroll limit.
      const target = e.target as HTMLElement;
      const panel = target.closest<HTMLElement>('[data-scrollable]');
      if (panel) {
        const atTop = panel.scrollTop === 0;
        const atBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 1;
        // Still has room to scroll internally — don't switch page
        if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) return;
      }

      e.preventDefault();
      if (e.deltaY > 0) goTo(currentIndex + 1);
      else goTo(currentIndex - 1);
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [currentIndex, goTo]);

  // Touch handler
  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const delta = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(delta) < 30) return;
      if (delta > 0) goTo(currentIndex + 1);
      else goTo(currentIndex - 1);
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [currentIndex, goTo]);

  return (
    <div className="relative h-screen overflow-hidden">
      <FluidBackground />
      <PageDots currentIndex={currentIndex} onGoTo={goTo} />

      {/* Fullpage slider */}
      <div
        className="relative z-10 w-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateY(-${currentIndex * 100}vh)` }}
      >
        {PAGES.map((page, i) => (
          <div key={page} className="h-screen w-full overflow-y-auto" data-scrollable>
            {page === 'hero' && <HeroSection />}
            {page === 'features' && <FeaturesSection active={currentIndex === i} />}
            {page === 'process' && <ProcessSection active={currentIndex === i} />}
            {page === 'stats' && <StatsSection active={currentIndex === i} />}
            {page === 'appeal' && <AppealSection active={currentIndex === i} />}
            {page === 'appeal' && <Footer />}
          </div>
        ))}
      </div>
    </div>
  );
}

function WelcomeAlert() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // 检查是否首次访问
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasVisited', 'true');
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold text-white">重要提示</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-300 text-base leading-relaxed">
            云黑正在开发，如遇Token/API不可用属正常现象，有问题请联系QQ：1470458485（注明：云黑API）
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogAction 
            onClick={handleClose}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            我知道了
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ImageViewerProvider>
      <WelcomeAlert />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ImageViewerProvider>
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(30, 41, 59, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
