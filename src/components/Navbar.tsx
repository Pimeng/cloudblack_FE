import { useState } from 'react';
import { Menu, X } from 'lucide-react';

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
}

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNav = (key: PageKey) => {
    onNavigate(key);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="fixed top-0 right-0 z-50 p-4">
      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-1 glass rounded-2xl px-3 py-2">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => handleNav(item.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              currentPage === item.key
                ? 'bg-brand text-white shadow-glow'
                : 'text-muted-foreground hover:text-white hover:bg-white/10'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Mobile hamburger */}
      <div className="md:hidden">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="glass rounded-xl p-2.5 text-white"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {menuOpen && (
          <div className="absolute top-16 right-0 glass rounded-2xl p-2 min-w-[140px] flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNav(item.key)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all duration-200 ${
                  currentPage === item.key
                    ? 'bg-brand text-white'
                    : 'text-muted-foreground hover:text-white hover:bg-white/10'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
