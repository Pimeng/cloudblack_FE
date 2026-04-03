import { useState } from 'react';
import { Menu, X, Shield, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

export type PageKey = 'hero' | 'features' | 'process' | 'stats' | 'appeal' | 'report' | 'join';

const navItems: { key: PageKey; label: string; path: string }[] = [
  { key: 'hero', label: '云黑查询', path: '/query' },
  { key: 'features', label: '了解云黑', path: '/about' },
  { key: 'process', label: '申诉流程', path: '/process' },
  { key: 'stats', label: '数据统计', path: '/stats' },
  { key: 'appeal', label: '申诉中心', path: '/appeal' },
  { key: 'report', label: '提交举报', path: '/report' },
  { key: 'join', label: '加入我们', path: '/join' },
];

const PATH_TO_KEY: Record<string, PageKey> = {
  '/query': 'hero',
  '/about': 'features',
  '/process': 'process',
  '/stats': 'stats',
  '/appeal': 'appeal',
  '/report': 'report',
  '/join': 'join',
};

interface NavbarProps {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
  visible: boolean;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export function Navbar({ currentPage, onNavigate, visible, theme, onToggleTheme }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const effectivePage = PATH_TO_KEY[location.pathname] || currentPage;

  const handleNav = (key: PageKey, path: string) => {
    navigate(path);
    onNavigate(key);
    setMenuOpen(false);
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out"
      style={{
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div className="w-full border-b border-foreground/8 bg-background/30 backdrop-blur-2xl" style={{ WebkitBackdropFilter: 'blur(24px)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => handleNav('hero', '/query')}
            className="flex items-center gap-2.5 text-foreground hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-brand/20 border border-brand/40 flex items-center justify-center">
              <Shield className="w-4 h-4 text-brand" />
            </div>
            <span className="font-semibold text-base tracking-tight">皮梦云黑库</span>
          </button>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNav(item.key, item.path)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  effectivePage === item.key
                    ? 'text-foreground bg-foreground/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                {item.label}
                {effectivePage === item.key && (
                  <span className="block mx-auto mt-0.5 h-0.5 w-4 rounded-full bg-brand" />
                )}
              </button>
            ))}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="ml-2 w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-all duration-200"
                aria-label="切换主题"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            )}
          </div>

          <div className="md:hidden flex items-center gap-1">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-all duration-200"
                aria-label="切换主题"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            )}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="relative w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <motion.span
                  animate={{ opacity: menuOpen ? 0 : 1, rotate: menuOpen ? 90 : 0, scale: menuOpen ? 0.5 : 1 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Menu className="w-5 h-5" />
                </motion.span>
                <motion.span
                  animate={{ opacity: menuOpen ? 1 : 0, rotate: menuOpen ? 0 : -90, scale: menuOpen ? 1 : 0.5 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </motion.span>
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -8, transformOrigin: 'top right' }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -8 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute top-12 right-0 w-36 bg-popover/90 backdrop-blur-2xl border border-border rounded-xl p-1.5 flex flex-col gap-0.5 shadow-xl"
                    style={{ transformOrigin: 'top right', WebkitBackdropFilter: 'blur(24px)' }}
                  >
                    {navItems.map((item) => (
                      <button
                        key={item.key}
                        onClick={() => handleNav(item.key, item.path)}
                        className={`px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all duration-200 ${
                          effectivePage === item.key
                            ? 'bg-foreground/15 text-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-foreground/10'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
