import { useEffect, useState, useRef, useCallback, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { FluidBackground } from './components/FluidBackground';
import { FileText, ArrowUp, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { ScrollIndicator } from './components/ScrollIndicator';
import { HeroSection } from './sections/HeroSection';
import { FeaturesSection } from './sections/FeaturesSection';
import { ProcessSection } from './sections/ProcessSection';
import { StatsSection } from './sections/StatsSection';
import { AppealSection } from './sections/AppealSection';
import { BlacklistReportSection } from './sections/BlacklistReportSection';
import { Footer } from './sections/Footer';
import { Toaster } from '@/components/ui/sonner';
import { ImageViewerProvider } from '@/hooks/useImageViewer';
import { useTheme } from '@/hooks/useTheme';
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
const LogtoCallback = lazy(() => import('./admin/LogtoCallback').then(m => ({ default: m.LogtoCallback })));
const LogtoBindCallback = lazy(() => import('./admin/LogtoBindCallback').then(m => ({ default: m.LogtoBindCallback })));
const DashboardPage = lazy(() => import('./admin/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AppealsPage = lazy(() => import('./admin/pages/AppealsPage').then(m => ({ default: m.AppealsPage })));
const BlacklistPage = lazy(() => import('./admin/pages/BlacklistPage').then(m => ({ default: m.BlacklistPage })));
const BlacklistReportsPage = lazy(() => import('./admin/pages/BlacklistReportsPage').then(m => ({ default: m.BlacklistReportsPage })));
const AdminsPage = lazy(() => import('./admin/pages/AdminsPage').then(m => ({ default: m.AdminsPage })));
const BotsPage = lazy(() => import('./admin/pages/BotsPage').then(m => ({ default: m.BotsPage })));
const LogsPage = lazy(() => import('./admin/pages/LogsPage').then(m => ({ default: m.LogsPage })));
const SettingsPage = lazy(() => import('./admin/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const BackupPage = lazy(() => import('./admin/pages/BackupPage').then(m => ({ default: m.BackupPage })));
const Level4PendingPage = lazy(() => import('./admin/pages/Level4PendingPage').then(m => ({ default: m.Level4PendingPage })));
const ImagesPage = lazy(() => import('./admin/pages/ImagesPage').then(m => ({ default: m.ImagesPage })));

gsap.registerPlugin(ScrollTrigger);

export type PageKey = 'hero' | 'features' | 'process' | 'stats' | 'appeal' | 'report';
const PAGES: PageKey[] = ['hero', 'features', 'process', 'stats', 'appeal', 'report'];

// URL 路径映射
const PAGE_PATHS: Record<string, PageKey> = {
  'query': 'hero',
  'about': 'features', 
  'process': 'process',
  'stats': 'stats',
  'appeal': 'appeal',
  'report': 'report',
};

const PATH_TO_URL: Record<PageKey, string> = {
  'hero': '/query',
  'features': '/about',
  'process': '/process', 
  'stats': '/stats',
  'appeal': '/appeal',
  'report': '/report',
};

// Admin 页面加载中的占位组件
function AdminPageFallback() {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="w-10 h-10 text-brand" />
        <p className="text-muted-foreground">加载中...</p>
      </div>
    </div>
  );
}


function HomePageContent() {
  const { pagePath } = useParams<{ pagePath?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // 从 URL 路径确定当前页面索引
  const getInitialIndex = useCallback(() => {
    if (pagePath && PAGE_PATHS[pagePath]) {
      return PAGES.indexOf(PAGE_PATHS[pagePath]);
    }
    return 0;
  }, [pagePath]);
  
  const [currentIndex, setCurrentIndex] = useState(getInitialIndex);
  const isAnimating = useRef(false);
  const touchStartY = useRef(0);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const { theme, toggle: toggleTheme } = useTheme();
  
  // 当 URL 路径变化时更新当前索引
  useEffect(() => {
    const newIndex = getInitialIndex();
    if (newIndex !== currentIndex && !isAnimating.current) {
      setCurrentIndex(newIndex);
    }
  }, [pagePath, getInitialIndex, currentIndex]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const goTo = useCallback((index: number) => {
    if (index < 0 || index >= PAGES.length || isAnimating.current) return;
    isAnimating.current = true;
    setCurrentIndex(index);
    // 同步 URL
    const pageKey = PAGES[index];
    const targetPath = PATH_TO_URL[pageKey];
    if (location.pathname !== targetPath) {
      navigate(targetPath, { replace: true });
    }
    // Refresh ScrollTrigger after transition so section animations fire
    setTimeout(() => {
      ScrollTrigger.refresh();
      isAnimating.current = false;
    }, 750);
  }, [navigate, location.pathname]);

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
      <Navbar currentPage={PAGES[currentIndex]} onNavigate={(page) => goTo(PAGES.indexOf(page))} visible={currentIndex > 0} theme={theme} onToggleTheme={toggleTheme} />

      {/* Theme toggle — fixed top-right on home page, same position as Navbar button.
          Navbar slides down and covers this when navigating away from hero. */}
      <div
        className="fixed top-0 right-0 z-40 h-16 flex items-center pr-6 transition-all duration-500 ease-in-out"
        style={{
          opacity: currentIndex === 0 ? 1 : 0,
          pointerEvents: currentIndex === 0 ? 'auto' : 'none',
        }}
      >
        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-foreground/60 hover:text-foreground hover:bg-foreground/10 transition-all duration-200"
          aria-label="切换主题"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>

      <ScrollIndicator visible={currentIndex === 0} />

      {/* Quick Access Button — morphs between appeal and back-to-top */}
      <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50">
        <motion.button
          onClick={() => goTo(currentIndex === 0 ? 4 : 0)}
          animate={{ width: currentIndex === 0 ? (isMobile ? 40 : 140) : 40 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="btn-brand relative flex items-center justify-center
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
            {page === 'report' && <BlacklistReportSection active={currentIndex === i} />}
            {page === 'report' && <Footer />}
          </div>
        ))}
      </div>
    </div>
  );
}

// 包装组件，用于在 Routes 中使用
function HomePage() {
  return <HomePageContent />;
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
      <AlertDialogContent className="bg-card border-border text-foreground max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold">重要提示</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-base leading-relaxed">
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
  // 在根组件初始化主题，确保所有路由（包括 admin）都能正确应用
  useTheme();

  return (
    <BrowserRouter>
      <ImageViewerProvider>
      <ClarityNotice />
      <WelcomeAlert />
      <Routes>
        <Route path="/" element={<Navigate to="/query" replace />} />
        <Route path="/query" element={<HomePage />} />
        <Route path="/about" element={<HomePage />} />
        <Route path="/process" element={<HomePage />} />
        <Route path="/stats" element={<HomePage />} />
        <Route path="/appeal" element={<HomePage />} />
        <Route path="/report" element={<HomePage />} />
        <Route path="/admin" element={
          <Suspense fallback={<AdminPageFallback />}>
            <AdminLogin />
          </Suspense>
        } />
        <Route path="/admin/callback" element={
          <Suspense fallback={<AdminPageFallback />}>
            <LogtoCallback />
          </Suspense>
        } />
        <Route path="/auth/callback" element={
          <Suspense fallback={<AdminPageFallback />}>
            <LogtoCallback />
          </Suspense>
        } />
        <Route path="/admin/bind-callback" element={
          <Suspense fallback={<AdminPageFallback />}>
            <LogtoBindCallback />
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
          <Route path="blacklist-reports" element={
            <Suspense fallback={<AdminPageFallback />}>
              <BlacklistReportsPage />
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
        <Route path="/report" element={
          <div className="relative min-h-screen">
            <FluidBackground />
            <div className="relative z-10">
              <BlacklistReportSection active={true} />
            </div>
          </div>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ImageViewerProvider>
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: 'hsl(var(--card))',
            backdropFilter: 'blur(10px)',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
