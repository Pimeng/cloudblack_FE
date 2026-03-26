import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { API_BASE } from './types';

export function LogtoBindCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('正在处理绑定...');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // 处理 Logto 返回的错误
    if (error) {
      setStatus('error');
      setMessage(errorDescription || `绑定失败: ${error}`);
      return;
    }

    // 如果没有 code，说明参数错误
    if (!code) {
      setStatus('error');
      setMessage('绑定参数错误，请重试');
      return;
    }

    // 处理绑定回调
    const handleBindCallback = async () => {
      try {
        // 构建回调 URL（保留所有查询参数）
        const callbackUrl = new URL(`${API_BASE}/api/auth/logto/bind/callback`);
        callbackUrl.searchParams.set('code', code);
        if (state) callbackUrl.searchParams.set('state', state);

        const response = await fetch(callbackUrl.toString(), {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        const data = await response.json();

        if (data.success) {
          // 绑定成功
          setStatus('success');
          setMessage('Logto 账户绑定成功！');

          // 延迟跳转回仪表盘
          setTimeout(() => {
            navigate('/admin/dashboard');
          }, 1500);
        } else {
          // 绑定失败
          setStatus('error');
          setMessage(data.message || '绑定失败');
        }
      } catch (err) {
        setStatus('error');
        setMessage('连接失败，请检查网络');
      }
    };

    handleBindCallback();
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
          <h1 className="text-2xl font-bold text-gradient">SSO 账户绑定</h1>
          <p className="text-muted-foreground mt-2">皮梦 の 云黑库 管理后台</p>
        </div>

        {/* Status Card */}
        <div className="glass-strong rounded-2xl p-8">
          <div className="flex flex-col items-center gap-6">
            {status === 'processing' && (
              <>
                <Spinner className="w-12 h-12 text-brand" />
                <p className="text-lg text-foreground">{message}</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <p className="text-lg text-foreground">{message}</p>
                <p className="text-sm text-muted-foreground">正在跳转到管理后台...</p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-destructive" />
                </div>
                <div className="text-center">
                  <p className="text-lg text-foreground mb-2">绑定失败</p>
                  <p className="text-muted-foreground">{message}</p>
                </div>
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  className="px-6 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors"
                >
                  返回管理后台
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
