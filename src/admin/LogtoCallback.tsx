import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { API_BASE } from './types';

export function LogtoCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('正在处理登录...');
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      // 后端重定向回来的参数
      const token = searchParams.get('token');
      const adminId = searchParams.get('admin_id');
      const name = searchParams.get('name');
      const level = searchParams.get('level');
      
      // 错误信息
      const error = searchParams.get('error');
      const errorMessage = searchParams.get('message');
      
      // 跳转目标
      const next = searchParams.get('next') || '/admin/dashboard';

      // 处理后端返回的错误
      if (error) {
        setStatus('error');
        setMessage(errorMessage || `登录失败: ${error}`);
        setErrorCode(error);
        return;
      }

      // 处理登录成功
      if (token) {
        // 存储 token
        localStorage.setItem('admin_token', token);
        
        // 如果 URL 中有完整的用户信息，直接使用
        if (adminId && name && level) {
          const adminLevel = parseInt(level, 10);
          localStorage.setItem('admin_info', JSON.stringify({
            admin_id: adminId,
            name: name,
            level: adminLevel,
            avatar: '',
          }));
          setStatus('success');
          setMessage('登录成功，正在跳转...');
          setTimeout(() => navigate(next), 500);
          return;
        }
        
        // 否则，调用 API 获取管理员信息
        try {
          setMessage('正在获取用户信息...');
          
          // 尝试调用 /api/admin/me 获取个人信息
          const meResponse = await fetch(`${API_BASE}/api/admin/me`, {
            headers: { 'Authorization': token },
          });
          
          if (meResponse.ok) {
            const meData = await meResponse.json();
            if (meData.success && meData.data) {
              localStorage.setItem('admin_info', JSON.stringify({
                admin_id: meData.data.admin_id,
                name: meData.data.name,
                level: meData.data.level,
                avatar: meData.data.avatar || '',
              }));
              setStatus('success');
              setMessage('登录成功，正在跳转...');
              setTimeout(() => navigate(next), 500);
              return;
            }
          }
          
          // 如果 /api/admin/me 不存在或失败，尝试获取管理员列表
          const adminsResponse = await fetch(`${API_BASE}/api/admin/admins`, {
            headers: { 'Authorization': token },
          });
          
          if (adminsResponse.ok) {
            const adminsData = await adminsResponse.json();
            if (adminsData.success && adminsData.data && adminsData.data.length > 0) {
              // 获取第一个管理员（通常 SSO 登录返回的 token 对应一个管理员）
              // 或者查找与 adminId 匹配的管理员
              const admin = adminId 
                ? adminsData.data.find((a: any) => a.admin_id === adminId)
                : adminsData.data[0];
                
              if (admin) {
                localStorage.setItem('admin_info', JSON.stringify({
                  admin_id: admin.admin_id,
                  name: admin.name,
                  level: admin.level,
                  avatar: admin.avatar || '',
                }));
                setStatus('success');
                setMessage('登录成功，正在跳转...');
                setTimeout(() => navigate(next), 500);
                return;
              }
            }
          }
          
          // 如果都失败了，使用基本信息
          localStorage.setItem('admin_info', JSON.stringify({
            admin_id: adminId || 'unknown',
            name: name || '管理员',
            level: parseInt(level || '3', 10),
            avatar: '',
          }));
          setStatus('success');
          setMessage('登录成功，正在跳转...');
          setTimeout(() => navigate(next), 500);
          
        } catch (err) {
          console.error('获取用户信息失败:', err);
          // 使用基本信息继续
          localStorage.setItem('admin_info', JSON.stringify({
            admin_id: adminId || 'unknown',
            name: name || '管理员',
            level: parseInt(level || '3', 10),
            avatar: '',
          }));
          setStatus('success');
          setMessage('登录成功，正在跳转...');
          setTimeout(() => navigate(next), 500);
        }
        return;
      }

      // 如果没有 token 也没有 error，说明参数错误
      setStatus('error');
      setMessage('登录参数错误，请重试');
    };
    
    handleCallback();
  }, [searchParams, navigate]);

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
          <h1 className="text-2xl font-bold text-gradient">SSO 登录</h1>
          <p className="text-muted-foreground mt-2">皮梦 の 云黑库 管理后台</p>
        </div>

        {/* Status Card */}
        <div className="glass-strong rounded-2xl p-8">
          <div className="flex flex-col items-center gap-6">
            {status === 'processing' && (
              <>
                <Spinner className="w-12 h-12 text-brand" />
                <p className="text-lg text-white">{message}</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <p className="text-lg text-white">{message}</p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-destructive" />
                </div>
                <div className="text-center">
                  <p className="text-lg text-white mb-2">登录失败</p>
                  <p className="text-muted-foreground">{message}</p>
                  {errorCode === 'ACCOUNT_NOT_BOUND' && (
                    <p className="text-sm text-muted-foreground mt-2">
                      请先使用密码登录，然后在个人设置中绑定 Logto 账户
                    </p>
                  )}
                </div>
                <button
                  onClick={() => navigate('/admin')}
                  className="px-6 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors"
                >
                  返回登录页
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
