import { useEffect, useState, useRef, useCallback, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { FluidBackground } from './components/FluidBackground';
import { Sun, Moon } from 'lucide-react';
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
import { MarkdownPage } from '@/pages/MarkdownPage';
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
  const getIndexFromPath = useCallback((pathname: string) => {
    const normalizedPath = pathname.replace(/^\/+/, '') || 'query';
    const pageKey = PAGE_PATHS[normalizedPath];
    return pageKey ? PAGES.indexOf(pageKey) : 0;
  }, []);
  
  // 从 URL 路径确定当前页面索引
  const [currentIndex, setCurrentIndex] = useState(() => getIndexFromPath(location.pathname));
  const isAnimating = useRef(false);
  const animationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef(0);
  const { theme, toggle: toggleTheme } = useTheme();
  
  // 当 URL 路径变化时更新当前索引
  useEffect(() => {
    if (pagePath && !PAGE_PATHS[pagePath]) {
      navigate('/query', { replace: true });
    }
  }, [navigate, pagePath]);

  useEffect(() => {
    const newIndex = getIndexFromPath(location.pathname);
    if (newIndex !== currentIndex && !isAnimating.current) {
      setCurrentIndex(newIndex);
    }
  }, [location.pathname, getIndexFromPath, currentIndex]);

  useEffect(() => {
    return () => {
      if (animationTimer.current) {
        clearTimeout(animationTimer.current);
      }
    };
  }, []);



  const goTo = useCallback((index: number) => {
    if (index < 0 || index >= PAGES.length || index === currentIndex || isAnimating.current) return;
    
    // 如果正在动画中，清除之前的定时器，打断当前动画
    isAnimating.current = true;
    setCurrentIndex(index);
    // 同步 URL
    const pageKey = PAGES[index];
    const targetPath = PATH_TO_URL[pageKey];
    if (location.pathname !== targetPath) {
      navigate(targetPath, { replace: true });
    }
    // Refresh ScrollTrigger after transition so section animations fire
    animationTimer.current = setTimeout(() => {
      ScrollTrigger.refresh();
      isAnimating.current = false;
      animationTimer.current = null;
    }, 700);
  }, [currentIndex, navigate, location.pathname]);

  // Wheel handler - 水平滚动
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      // If the event target is inside a scrollable panel, only let it
      // bubble up to page-switching when the panel has hit its scroll limit.
      const target = e.target as HTMLElement;
      const panel = target.closest<HTMLElement>('[data-scrollable]');
      if (panel) {
        const atLeft = panel.scrollLeft === 0;
        const atRight = panel.scrollLeft + panel.clientWidth >= panel.scrollWidth - 1;
        // Still has room to scroll internally — don't switch page
        if ((e.deltaX < 0 && !atLeft) || (e.deltaX > 0 && !atRight)) return;
      }

      // 优先使用 deltaX，如果没有则使用 deltaY（兼容普通鼠标滚轮）
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      
      e.preventDefault();
      if (delta > 0) goTo(currentIndex + 1);
      else goTo(currentIndex - 1);
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [currentIndex, goTo]);

  // 键盘左右箭头支持
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goTo(currentIndex + 1);
      else if (e.key === 'ArrowLeft') goTo(currentIndex - 1);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentIndex, goTo]);

  // Touch handler - 水平滑动
  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const delta = touchStartX.current - e.changedTouches[0].clientX;
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

      {/* Fullpage slider - 水平滑动 */}
      <div
        className="relative z-10 h-full flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}vw)` }}
      >
        {PAGES.map((page, i) => (
          <div key={page} className="h-screen w-screen flex-shrink-0 overflow-y-auto" data-scrollable>
            {page === 'hero' && <HeroSection />}
            {page === 'features' && <FeaturesSection active={currentIndex === i} />}
            {page === 'process' && <ProcessSection active={currentIndex === i} />}
            {page === 'stats' && <StatsSection active={currentIndex === i} />}
            {page === 'appeal' && <AppealSection active={currentIndex === i} />}
            {page === 'report' && <BlacklistReportSection active={currentIndex === i} />}
          </div>
        ))}
      </div>

      {/* Footer - 固定在页面底部 */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <Footer />
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
        <Route path="/:pagePath" element={<HomePage />} />
        <Route path="/docs/:fileKey" element={<MarkdownPage />} />
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
