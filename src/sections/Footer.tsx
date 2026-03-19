import { useRef, useEffect } from 'react';
import { Shield, Mail, FileText, Heart } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      triggerRef.current = ScrollTrigger.create({
        trigger: footerRef.current,
        start: 'top 90%',
        onEnter: () => {
          gsap.fromTo(contentRef.current,
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
          );
        },
        once: true
      });
    }, footerRef);

    return () => {
      if (triggerRef.current) {
        triggerRef.current.kill();
      }
      ctx.revert();
    };
  }, []);

  return (
    <footer 
      ref={footerRef}
      className="relative py-16 px-4 border-t border-border/30"
    >
      <div 
        ref={contentRef}
        className="max-w-4xl mx-auto"
      >
        {/* Logo and description */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-brand/30">
              <img 
                src="https://q1.qlogo.cn/g?b=qq&nk=1470458485&s=640" 
                alt="皮梦"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xl font-bold text-gradient">皮梦 の 云黑库</span>
          </div>
          <p className="text-muted-foreground text-sm max-w-md">
            提供透明、公正的黑名单查询与申诉服务，共建和谐社区环境
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-6 mb-10">
          <a 
            href="#" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-brand transition-colors"
          >
            <FileText className="w-4 h-4" />
            隐私政策
          </a>
          <a 
            href="#" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-brand transition-colors"
          >
            <Shield className="w-4 h-4" />
            服务条款
          </a>
          <a 
            href="mailto:i@pmya.xyz" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-brand transition-colors"
          >
            <Mail className="w-4 h-4" />
            联系我们
          </a>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent mb-6" />

        {/* Copyright */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            © 2026 皮梦 の 云黑库 · Made with 
            <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" /> 
            by 皮梦
          </p>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent" />
    </footer>
  );
}
