import { useEffect, useState, useRef, useCallback, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FluidBackground } from './components/FluidBackground';
import { FileText, ArrowUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { ScrollIndicator } from './components/ScrollIndicator';
import { HeroSection } from './sections/HeroSection';
import { FeaturesSection } from './sections/FeaturesSection';
import { ProcessSection } from './sections/ProcessSection';
import { StatsSection } from './sections/StatsSection';
import { AppealSection } from './sections/AppealSection';
import { Footer } from './sections/Footer';
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
import { ClarityNotice } from '@/components/ClarityNotice';
import { Spinner } from '@/components/ui/spinner';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// 懒加载 Admin 模块
const AdminLogin = lazy(() => import('./admin/AdminLogin').then(m => ({ default: m.AdminLogin })));
const AdminLayout = lazy(() => import('./admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const DashboardPage = lazy(() => import('./admin/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AppealsPage = lazy(() => import('./admin/pages/AppealsPage').then(m => ({ default: m.AppealsPage })));
const BlacklistPage = lazy(() => import('./admin/pages/BlacklistPage').then(m => ({ default: m.BlacklistPage })));
const AdminsPage = lazy(() => import('./admin/pages/AdminsPage').then(m => ({ default: m.AdminsPage })));
const BotsPage = lazy(() => import('./admin/pages/BotsPage').then(m => ({ default: m.BotsPage })));
const LogsPage = lazy(() => import('./admin/pages/LogsPage').then(m => ({ default: m.LogsPage })));
const SettingsPage = lazy(() => import('./admin/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const BackupPage = lazy(() => import('./admin/pages/BackupPage').then(m => ({ default: m.BackupPage })));
const Level4PendingPage = lazy(() => import('./admin/pages/Level4PendingPage').then(m => ({ default: m.Level4PendingPage })));
const ImagesPage = lazy(() => import('./admin/pages/ImagesPage').then(m => ({ default: m.ImagesPage })));

gsap.registerPlugin(ScrollTrigger);

type PageKey = 'hero' | 'features' | 'process' | 'stats' | 'appeal';
const PAGES: PageKey[] = ['hero', 'features', 'process', 'stats', 'appeal'];

// Admin 页面加载中的占位组件
function AdminPageFallback() {
  return (
    <div className="flex items-center justify-center h-screen bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="w-10 h-10 text-brand" />
        <p className="text-slate-400">加载中...</p>
      </div>
    </div>
  );
}


function HomePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isAnimating = useRef(false);
  const touchStartY = useRef(0);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
      <Navbar currentPage={PAGES[currentIndex]} onNavigate={(page) => goTo(PAGES.indexOf(page))} visible={currentIndex > 0} />
      <ScrollIndicator visible={currentIndex === 0} />

      {/* Quick Access Button — morphs between appeal and back-to-top */}
      <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50">
        <motion.button
          onClick={() => goTo(currentIndex === 0 ? 4 : 0)}
          animate={{ width: currentIndex === 0 ? (isMobile ? 40 : 140) : 40 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="relative flex items-center justify-center
                     bg-brand/90 hover:bg-brand text-white rounded-full overflow-hidden
                     shadow-lg shadow-brand/30 backdrop-blur-md
                     hover:scale-105 hover:shadow-xl hover:shadow-brand/40
                     border border-white/10"
          style={{
            height: isMobile ? 40 : 44,
            minWidth: isMobile ? 40 : 44,
            transition: 'background-color 0.3s, box-shadow 0.3s, transform 0.3s',
          }}
        >
          {/* Appeal label — desktop only */}
          <motion.span
            animate={{ opacity: currentIndex === 0 ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 hidden md:flex items-center justify-center gap-2 px-4 whitespace-nowrap text-sm font-medium pointer-events-none"
          >
            <FileText className="w-4 h-4 flex-shrink-0" />
            申诉中心
          </motion.span>
          {/* Mobile: always show icon, fade between FileText and ArrowUp */}
          <motion.span
            animate={{ opacity: currentIndex === 0 ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex md:hidden items-center justify-center pointer-events-none"
          >
            <FileText className="w-4 h-4" />
          </motion.span>
          {/* Back to top icon */}
          <motion.span
            animate={{ opacity: currentIndex === 0 ? 0 : 1 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <ArrowUp className="w-4 h-4 md:w-5 md:h-5" />
          </motion.span>
        </motion.button>
      </div>

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
      <ClarityNotice />
      <WelcomeAlert />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={
          <Suspense fallback={<AdminPageFallback />}>
            <AdminLogin />
          </Suspense>
        } />
        <Route path="/admin/dashboard" element={
          <Suspense fallback={<AdminPageFallback />}>
            <AdminLayout />
          </Suspense>
        }>
          <Route index element={
            <Suspense fallback={<AdminPageFallback />}>
              <DashboardPage />
            </Suspense>
          } />
          <Route path="appeals" element={
            <Suspense fallback={<AdminPageFallback />}>
              <AppealsPage />
            </Suspense>
          } />
          <Route path="blacklist" element={
            <Suspense fallback={<AdminPageFallback />}>
              <BlacklistPage />
            </Suspense>
          } />
          <Route path="admins" element={
            <Suspense fallback={<AdminPageFallback />}>
              <AdminsPage />
            </Suspense>
          } />
          <Route path="bots" element={
            <Suspense fallback={<AdminPageFallback />}>
              <BotsPage />
            </Suspense>
          } />
          <Route path="logs" element={
            <Suspense fallback={<AdminPageFallback />}>
              <LogsPage />
            </Suspense>
          } />
          <Route path="settings" element={
            <Suspense fallback={<AdminPageFallback />}>
              <SettingsPage />
            </Suspense>
          } />
          <Route path="backup" element={
            <Suspense fallback={<AdminPageFallback />}>
              <BackupPage />
            </Suspense>
          } />
          <Route path="level4-pending" element={
            <Suspense fallback={<AdminPageFallback />}>
              <Level4PendingPage />
            </Suspense>
          } />
          <Route path="images" element={
            <Suspense fallback={<AdminPageFallback />}>
              <ImagesPage />
            </Suspense>
          } />
        </Route>
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
