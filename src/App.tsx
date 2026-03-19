import { useEffect, useState } from 'react';
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

function HomePage() {
  useEffect(() => {
    // Configure ScrollTrigger defaults
    ScrollTrigger.defaults({
      toggleActions: 'play none none none',
    });

    // Smooth scroll behavior
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href^="#"]');
      if (anchor) {
        e.preventDefault();
        const href = anchor.getAttribute('href');
        if (href && href !== '#') {
          const element = document.querySelector(href);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);

    return () => {
      document.removeEventListener('click', handleAnchorClick);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div className="relative min-h-screen">
      <FluidBackground />
      <main className="relative z-10">
        <HeroSection />
        <FeaturesSection />
        <ProcessSection />
        <StatsSection />
        <AppealSection />
        <Footer />
      </main>
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
      <WelcomeAlert />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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
