import { useState } from 'react';
import { Menu, X, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type PageKey = 'hero' | 'features' | 'process' | 'stats' | 'appeal';

const navItems: { key: PageKey; label: string }[] = [
  { key: 'hero', label: '云黑查询' },
  { key: 'features', label: '了解云黑' },
  { key: 'process', label: '申诉流程' },
  { key: 'stats', label: '数据统计' },
  { key: 'appeal', label: '申诉中心' },
];

interface NavbarProps {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
  visible: boolean;
}

export function Navbar({ currentPage, onNavigate, visible }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNav = (key: PageKey) => {
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
      <div className="w-full border-b border-white/8 bg-white/5 backdrop-blur-2xl" style={{ WebkitBackdropFilter: 'blur(24px)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo / Brand */}
          <button
            onClick={() => handleNav('hero')}
            className="flex items-center gap-2.5 text-white hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-brand/20 border border-brand/40 flex items-center justify-center">
              <Shield className="w-4 h-4 text-brand" />
            </div>
            <span className="font-semibold text-base tracking-tight">皮梦云黑库</span>
          </button>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNav(item.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentPage === item.key
                    ? 'text-white bg-white/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
                {currentPage === item.key && (
                  <span className="block mx-auto mt-0.5 h-0.5 w-4 rounded-full bg-brand" />
                )}
              </button>
            ))}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="relative w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              {/* Menu / X icon crossfade */}
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

            {/* Dropdown menu */}
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -8, transformOrigin: 'top right' }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -8 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute top-12 right-0 w-36 bg-slate-900/70 backdrop-blur-2xl border border-white/10 rounded-xl p-1.5 flex flex-col gap-0.5 shadow-xl"
                  style={{ transformOrigin: 'top right', WebkitBackdropFilter: 'blur(24px)' }}
                >
                  {navItems.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => handleNav(item.key)}
                      className={`px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all duration-200 ${
                        currentPage === item.key
                          ? 'bg-white/15 text-white'
                          : 'text-slate-300 hover:text-white hover:bg-white/10'
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
    </nav>
  );
}
