import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGeetest, type GeetestResult } from '@/hooks/useGeetest';

const API_BASE = 'https://cloudblack-api.07210700.xyz';

export function AdminLogin() {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [geetestResult, setGeetestResult] = useState<GeetestResult | null>(null);
  
  const navigate = useNavigate();

  // 使用 bind 模式的极验验证
  const { 
    isLoading: geetestLoading, 
    isReady, 
    isEnabled,
    verify,
    reset: resetGeetest 
  } = useGeetest({
    product: 'bind',
    onSuccess: (result) => {
      setGeetestResult(result);
      setError('');
      // 验证成功后自动提交登录
      handleLogin(result);
    },
    onError: (err) => {
      setError('人机验证失败：' + err);
      setLoading(false);
    },
    onClose: () => {
      // 用户关闭验证框，恢复登录按钮状态
      setLoading(false);
    },
  });

  // 实际登录逻辑
  const handleLogin = useCallback(async (geetestData: GeetestResult | null) => {
    // 如果启用了极验但没有验证结果，不提交
    if (isEnabled && !geetestData) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_id: adminId.trim(),
          password: password.trim(),
          geetest: geetestData,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || '登录失败，请检查账号密码');
        setLoading(false);
        // 登录失败，重置极验
        resetGeetest();
        setGeetestResult(null);
        return;
      }

      // 登录成功，存储 temp_token 并跳转
      localStorage.setItem('admin_token', data.data.temp_token);
      
      const adminLevel = data.data.level ?? 3;
      
      localStorage.setItem('admin_info', JSON.stringify({
        admin_id: data.data.admin_id,
        name: data.data.name,
        level: adminLevel,
        avatar: data.data.avatar || '',
      }));
      
      // 导航到后台首页
      navigate('/admin/dashboard');
      
      // 异步获取管理员列表来更新完整信息（不阻塞导航）
      try {
        const adminsResponse = await fetch(`${API_BASE}/api/admin/admins`, {
          headers: { 'Authorization': data.data.temp_token },
        });
        const adminsData = await adminsResponse.json();
        if (adminsData.success) {
          const currentAdmin = adminsData.data.find((a: any) => a.admin_id === data.data.admin_id);
          if (currentAdmin) {
            localStorage.setItem('admin_info', JSON.stringify({
              admin_id: currentAdmin.admin_id,
              name: currentAdmin.name,
              level: currentAdmin.level,
              avatar: currentAdmin.avatar || data.data.avatar || '',
            }));
          }
        }
      } catch (e) {
        // 忽略错误，使用登录返回的默认值
      }
    } catch (err) {
      setError('连接失败，请检查网络');
      setLoading(false);
      // 出错时重置极验
      resetGeetest();
      setGeetestResult(null);
    }
  }, [adminId, password, isEnabled, navigate, resetGeetest]);

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

    setLoading(true);
    setError('');

    // 如果启用了极验，先触发验证
    if (isEnabled) {
      if (!geetestResult) {
        // 触发极验验证
        verify();
        // 等待 onSuccess 回调中继续登录流程
        return;
      }
      // 已有验证结果，直接登录
      await handleLogin(geetestResult);
    } else {
      // 极验未启用，直接登录
      await handleLogin(null);
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

            {/* Geetest Verification Status */}
            {isEnabled && geetestResult && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>人机验证</span>
                  <span className="text-green-500 text-xs">(已完成)</span>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || geetestLoading || (isEnabled && !isReady)}
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
