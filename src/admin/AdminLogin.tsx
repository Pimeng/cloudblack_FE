import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRecaptcha } from '@/hooks/useRecaptcha';

const API_BASE = 'https://cloudblack-api.07210700.xyz';

export function AdminLogin() {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // reCaptcha
  const { execute: executeRecaptcha, isLoading: recaptchaLoading, isReady } = useRecaptcha({
    action: 'ADMIN_LOGIN',
  });
  
  const navigate = useNavigate();

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

    try {
      // 执行 reCaptcha 验证
      const recaptchaToken = await executeRecaptcha();
      if (!recaptchaToken) {
        setError('人机验证失败，请重试');
        setLoading(false);
        return;
      }

      // 使用 admin_id + password 登录，带上 recaptcha_token
      const response = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_id: adminId.trim(),
          password: password.trim(),
          recaptcha_token: recaptchaToken,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || '登录失败，请检查账号密码');
        setLoading(false);
        return;
      }

      // 登录成功，存储 temp_token 并跳转
      // data.data.temp_token 是临时 token
      localStorage.setItem('admin_token', data.data.temp_token);
      
      // 如果后端返回了 level，使用返回的值
      // 建议后端在登录响应中添加 level 字段
      const adminLevel = data.data.level ?? 3;
      
      localStorage.setItem('admin_info', JSON.stringify({
        admin_id: data.data.admin_id,
        name: data.data.name,
        level: adminLevel,
        avatar: data.data.avatar || '',
      }));
      
      // 尝试获取管理员列表来确认等级（如果后端登录响应没有返回level）
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
        // 忽略错误，使用默认值
      }
      
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

            {/* reCaptcha Verification Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>人机验证</span>
                {isReady && (
                  <span className="text-green-500 text-xs">(已启用)</span>
                )}
              </div>
              <div className="relative">
                {recaptchaLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <span className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                    <span>加载验证组件...</span>
                  </div>
                )}
                {!recaptchaLoading && (
                  <p className="text-xs text-muted-foreground">
                    此站点受 reCaptcha 保护
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || recaptchaLoading}
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
