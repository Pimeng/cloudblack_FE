import { Mail, FileText, Shield, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative py-4 px-4 border-t border-border/30 bg-background/50 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto">
        {/* Links - 紧凑排列 */}
        <div className="flex flex-wrap justify-center gap-4 mb-3">
          {/* <a 
            href="#" 
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-brand transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            隐私政策
          </a>
          <a 
            href="#" 
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-brand transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            服务条款
          </a> */}
          <a 
            href="mailto:i@pmya.xyz" 
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-brand transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            联系我们
          </a>
        </div>

        {/* Copyright */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            © 2026 皮梦の云黑库 · Made with 
            <Heart className="w-3 h-3 text-red-500 fill-red-500" /> 
            by 皮梦
          </p>
        </div>
      </div>
    </footer>
  );
}
