import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, AlertCircle, Shield, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGeetest, type GeetestResult } from '@/hooks/useGeetest';
import { gsap } from 'gsap';

interface BlacklistResult {
  in_blacklist: boolean;
  data?: {
    user_id: string;
    reason: string;
    added_by?: string;
    added_at: string;
  };
}

export function HeroSection() {
  const [userId, setUserId] = useState('');
  const [userType, setUserType] = useState<'user' | 'group'>('user');
  const [searchedUserId, setSearchedUserId] = useState('');
  const [searchedUserType, setSearchedUserType] = useState<'user' | 'group'>('user');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BlacklistResult | null>(null);
  const [queryTime, setQueryTime] = useState<string>('');
  const [error, setError] = useState('');
  
  // 使用 bind 模式的极验验证，点击查询按钮时触发
  const { 
    isLoading: geetestLoading, 
    isReady, 
    isEnabled,
    verify
  } = useGeetest({
    product: 'bind',
    onSuccess: (result) => {
      // 验证成功后自动执行查询
      executeSearch(result);
    },
    onError: (err) => {
      setError(`人机验证失败：${err}`);
      setLoading(false);
    },
  });
  
  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const queryIdRef = useRef(0);
  const isQueryingRef = useRef(false);

  useEffect(() => {
    // Entrance animation
    const ctx = gsap.context(() => {
      gsap.fromTo(cardRef.current,
        { rotateX: 90, scale: 0.8, opacity: 0 },
        { rotateX: 0, scale: 1, opacity: 1, duration: 1.2, ease: 'elastic.out(1, 0.5)' }
      );
      
      gsap.fromTo(titleRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, delay: 0.4, ease: 'power2.out' }
      );
      
      gsap.fromTo(inputRef.current,
        { width: '0%', opacity: 0 },
        { width: '100%', opacity: 1, duration: 0.6, delay: 0.6, ease: 'power2.out' }
      );
      
      gsap.fromTo(avatarRef.current,
        { scale: 0, rotation: -180 },
        { scale: 1, rotation: 0, duration: 1, delay: 0.8, ease: 'elastic.out(1, 0.5)' }
      );
    });
    
    return () => ctx.revert();
  }, []);

  // 实际执行查询的逻辑
  const executeSearch = useCallback(async (geetestData: GeetestResult | null) => {
    // 保存查询的QQ号和时间，防止输入框修改时结果跟着变
    setSearchedUserId(userId.trim());
    setSearchedUserType(userType);
    setQueryTime(new Date().toLocaleString());
    
    // 防止重复查询
    if (isQueryingRef.current) return;
    isQueryingRef.current = true;
    
    setLoading(true);
    setError('');
    
    // 生成唯一查询ID，防止旧查询覆盖新结果
    const currentQueryId = ++queryIdRef.current;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE || 'https://cloudblack-api.07210700.xyz'}/api/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: userId.trim(),
          user_type: userType,
          geetest: geetestData 
        }),
      });
      const data = await response.json();
      
      // 检查是否是最新的查询
      if (currentQueryId !== queryIdRef.current) return;
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.message || '查询失败');
      }
    } catch (err) {
      // 检查是否是最新的查询
      if (currentQueryId !== queryIdRef.current) return;
      
      // For demo, simulate a response
      const mockResult: BlacklistResult = {
        in_blacklist: Math.random() > 0.7,
        data: {
          user_id: userId,
          reason: '发布违规广告',
          added_by: 'system',
          added_at: '2026-03-10 14:30:00'
        }
      };
      if (!mockResult.in_blacklist) {
        delete mockResult.data;
      }
      setResult(mockResult);
    } finally {
      if (currentQueryId === queryIdRef.current) {
        setLoading(false);
        isQueryingRef.current = false;
      }
    }
  }, [userId]);

  const handleSearch = async () => {
    if (!userId.trim()) {
      setError(userType === 'group' ? '请输入群号' : '请输入QQ号');
      return;
    }
    
    // 如果启用了极验，先触发验证
    if (isEnabled) {
      verify();
    } else {
      // 极验未启用，直接查询
      await executeSearch(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <section className="relative h-screen flex items-center justify-center px-4 py-10">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-brand/10 blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-40 h-40 rounded-full bg-brand/5 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>
      
      {/* Main card */}
      <div 
        ref={cardRef}
        className="relative w-full max-w-lg perspective-1000"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="glass-strong rounded-3xl p-8 shadow-2xl">
          {/* Avatar */}
          <div ref={avatarRef} className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-brand/30 animate-pulse-glow">
                <img 
                  src="https://q1.qlogo.cn/g?b=qq&nk=1470458485&s=640" 
                  alt="皮梦"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-background flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          
          {/* Title */}
          <h1 
            ref={titleRef}
            className="text-3xl md:text-4xl font-bold text-center mb-2 text-gradient"
          >
            皮梦 の 云黑库
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            查询黑名单状态 · 提交申诉解封
          </p>
          
          {/* Search input */}
          <div ref={inputRef} className="space-y-4 overflow-hidden">
            {/* User Type Selector */}
            <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
              <button
                type="button"
                onClick={() => setUserType('user')}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  userType === 'user'
                    ? 'bg-brand text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <User className="w-4 h-4" />
                个人QQ
              </button>
              <button
                type="button"
                onClick={() => setUserType('group')}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  userType === 'group'
                    ? 'bg-brand text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Users className="w-4 h-4" />
                群号
              </button>
            </div>
            
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={userType === 'group' ? '输入群号查询...' : '输入QQ号查询...'}
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-12 pr-4 py-6 text-lg bg-muted/80 border-border/50 rounded-xl
                  focus:border-brand/60 focus:ring-2 focus:ring-brand/20 
                  transition-all duration-200 ease-out
                  placeholder:text-muted-foreground"
              />
            </div>
            
            <Button
              onClick={handleSearch}
              disabled={loading || geetestLoading || (isEnabled && !isReady)}
              className="w-full py-6 text-lg font-medium bg-brand hover:bg-brand-dark text-white rounded-xl transition-all duration-300 hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  查询中...
                </span>
              ) : geetestLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  加载中...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  查询
                </span>
              )}
            </Button>
            
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm animate-fade-in">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
          
          {/* Result */}
          {result && (
            <div 
              ref={resultRef} 
              className="mt-6 overflow-hidden animate-fade-in-up"
            >
              <div className={`relative rounded-2xl p-6 md:p-8 min-h-[180px] md:min-h-[200px] overflow-hidden flex flex-col ${result.in_blacklist ? 'bg-red-600/70' : 'bg-green-600/70'}`}>
                {/* 内容 */}
                <div className="relative z-10 flex-1">
                  <h3 className="font-bold text-2xl md:text-3xl text-white">
                    {searchedUserType === 'group' 
                      ? (result.in_blacklist ? '该群聊在黑名单中' : '该群聊不在黑名单中')
                      : (result.in_blacklist ? '该用户在黑名单中' : '该用户不在黑名单中')
                    }
                  </h3>
                  <p className="text-white/80 text-base md:text-lg mt-2">
                    {searchedUserType === 'group' ? '群号: ' : 'QQ: '}{searchedUserId}
                  </p>
                  
                  {result.in_blacklist && result.data && (
                    <div className="mt-6 space-y-2 text-base pr-20 md:pr-28">
                      <p className="text-white/90">
                        <span className="text-white/60">封禁原因:</span> {result.data.reason}
                      </p>
                      <p className="text-white/90">
                        <span className="text-white/60">添加时间:</span> {result.data.added_at}
                      </p>
                      {result.data.added_by && (
                        <p className="text-white/90">
                          <span className="text-white/60">操作者:</span> {result.data.added_by}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                {/* 不在黑名单时显示查询时间 - 放在底部 */}
                {!result.in_blacklist && queryTime && (
                  <p className="relative z-10 mt-auto pt-4 text-white/50 text-sm">查询时间: {queryTime}</p>
                )}
                
                {/* 右下角同心圆装饰 - 更大更靠右下 */}
                <div className="absolute -right-16 -bottom-16 md:-right-20 md:-bottom-20 z-0 w-56 h-56 md:w-72 md:h-72 flex items-center justify-center">
                  {/* 外层大圆 */}
                  <div className={`absolute w-full h-full rounded-full ${result.in_blacklist ? 'bg-red-500/40' : 'bg-green-500/30'}`} />
                  {/* 中层圆 */}
                  <div className={`absolute w-44 h-44 md:w-56 md:h-56 rounded-full ${result.in_blacklist ? 'bg-red-400/30' : 'bg-green-400/25'}`} />
                  {/* 状态图标 - 空心圆+对勾/叉号 */}
                  <div className="relative z-10 w-28 h-28 md:w-36 md:h-36 rounded-full border-[3px] border-white/80 flex items-center justify-center">
                    {result.in_blacklist ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" className="text-white">
                        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" className="text-white">
                        <path d="M20 6 9 17l-5-5"/>
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Decorative glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-brand/20 via-brand/10 to-brand/20 rounded-3xl blur-xl -z-10 opacity-50" />
      </div>
    </section>
  );
}
