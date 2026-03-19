import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const API_BASE = 'https://cloudblack-api.07210700.xyz';

// 声明 Turnstile 全局变量
declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export function AdminLogin() {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Turnstile 相关状态
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileLoading, setTurnstileLoading] = useState(true);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  
  const navigate = useNavigate();

  // 渲染 Turnstile Widget
  const renderTurnstile = useCallback(() => {
    if (!turnstileRef.current || !(window as any).turnstile) {
      return;
    }

    // 如果已经渲染过，先移除
    if (widgetIdRef.current) {
      (window as any).turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    }

    // 渲染新的 widget - 使用 Site Key: 0x4AAAAAACruupvqw7h1JtFH
    widgetIdRef.current = (window as any).turnstile.render(turnstileRef.current, {
      sitekey: '0x4AAAAAACruupvqw7h1JtFH',
      callback: (token: string) => {
        setTurnstileToken(token);
      },
      'error-callback': () => {
        setError('验证失败，请刷新页面重试');
      },
      'expired-callback': () => {
        setTurnstileToken('');
      },
    });
  }, []);

  // 加载 Turnstile
  useEffect(() => {
    setTurnstileLoading(true);
    
    const initTurnstile = () => {
      if ((window as any).turnstile) {
        renderTurnstile();
        setTurnstileLoading(false);
      } else {
        setTimeout(initTurnstile, 100);
      }
    };

    initTurnstile();

    return () => {
      if (widgetIdRef.current && (window as any).turnstile) {
        (window as any).turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [renderTurnstile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminId.trim()) {
      setError('请输入管理员ID');
      return;
    }
    
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }
    
    if (!turnstileToken) {
      setError('请完成人机验证');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 使用 admin_id + password 登录，带上 turnstile_token
      const response = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_id: adminId.trim(),
          password: password.trim(),
          turnstile_token: turnstileToken,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || '登录失败，请检查账号密码');
        // 重置 Turnstile
        if (widgetIdRef.current && (window as any).turnstile) {
          (window as any).turnstile.reset(widgetIdRef.current);
        }
        setTurnstileToken('');
        setLoading(false);
        return;
      }

      // 登录成功，存储 temp_token 并跳转
      // data.data.temp_token 是临时 token
      localStorage.setItem('admin_token', data.data.temp_token);
      localStorage.setItem('admin_info', JSON.stringify({
        admin_id: data.data.admin_id,
        name: data.data.name,
      }));
      navigate('/admin/dashboard');
    } catch (err) {
      setError('连接失败，请检查网络');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-brand/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-brand" />
          </div>
          <h1 className="text-2xl font-bold text-gradient">管理员登录</h1>
          <p className="text-muted-foreground mt-2">皮梦 の 云黑库 管理后台</p>
        </div>

        {/* Login Form */}
        <div className="glass-strong rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="admin_id">管理员 ID</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="admin_id"
                  type="text"
                  placeholder="请输入管理员ID"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  className="pl-10 py-6 bg-background/50 border-border/50 focus:border-brand"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 py-6 bg-background/50 border-border/50 focus:border-brand"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Turnstile Verification */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>人机验证</span>
                {turnstileToken && (
                  <span className="text-green-500 text-xs">(已完成)</span>
                )}
              </div>
              <div className="relative">
                {turnstileLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>加载验证组件...</span>
                  </div>
                )}
                <div 
                  ref={turnstileRef} 
                  className={turnstileLoading ? 'hidden' : ''}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !turnstileToken}
              className="w-full py-6 text-lg font-medium bg-brand hover:bg-brand-dark text-white rounded-xl"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  登录中...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  登录
                </span>
              )}
            </Button>
          </form>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <a 
            href="/" 
            className="text-sm text-muted-foreground hover:text-brand transition-colors"
          >
            ← 返回首页
          </a>
        </div>
      </div>
    </div>
  );
}
