import { useState, useRef, useEffect } from 'react';
import { Search, UserX, UserCheck, AlertCircle, Shield, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { gsap } from 'gsap';

interface BlacklistResult {
  in_blacklist: boolean;
  data?: {
    user_id: string;
    reason: string;
    added_by: string;
    added_at: string;
  };
}

export function HeroSection() {
  const [userId, setUserId] = useState('');
  const [searchedUserId, setSearchedUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BlacklistResult | null>(null);
  const [error, setError] = useState('');
  
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

  const handleSearch = async () => {
    if (!userId.trim()) {
      setError('请输入QQ号');
      return;
    }
    
    // 保存查询的QQ号，防止输入框修改时结果跟着变
    setSearchedUserId(userId.trim());
    
    // 防止重复查询
    if (isQueryingRef.current) return;
    isQueryingRef.current = true;
    
    setLoading(true);
    setError('');
    
    // 生成唯一查询ID，防止旧查询覆盖新结果
    const currentQueryId = ++queryIdRef.current;
    
    try {
      const response = await fetch(`https://cloudblack-api.07210700.xyz/api/check?user_id=${userId.trim()}`);
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
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
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
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="输入QQ号查询..."
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-12 pr-4 py-6 text-lg bg-slate-800/80 border-slate-700/50 rounded-xl
                  focus:border-brand/60 focus:ring-2 focus:ring-brand/20 
                  transition-all duration-200 ease-out
                  placeholder:text-slate-500"
              />
            </div>
            
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="w-full py-6 text-lg font-medium bg-brand hover:bg-brand-dark text-white rounded-xl transition-all duration-300 hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  查询中...
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
              <div className={`rounded-xl p-4 min-h-[100px] flex flex-col justify-center ${result.in_blacklist ? 'bg-destructive/10 border border-destructive/30' : 'bg-green-500/10 border border-green-500/30'}`}>
                <div className="flex items-center gap-3">
                  {result.in_blacklist ? (
                    <>
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                        <UserX className="w-6 h-6 md:w-7 md:h-7 text-destructive" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-destructive text-[clamp(1rem,4vw,1.5rem)] leading-tight">该用户在黑名单中</h3>
                        <p className="text-muted-foreground text-[clamp(0.75rem,3vw,1rem)] mt-1">QQ: {searchedUserId}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                        <UserCheck className="w-6 h-6 md:w-7 md:h-7 text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-green-500 text-[clamp(1rem,4vw,1.5rem)] leading-tight">该用户不在黑名单中</h3>
                        <p className="text-muted-foreground text-[clamp(0.75rem,3vw,1rem)] mt-1">QQ: {searchedUserId}</p>
                      </div>
                    </>
                  )}
                </div>
                
                {result.in_blacklist && result.data && (
                  <div className="mt-3 pt-3 border-t border-border/30 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-muted-foreground text-[clamp(0.7rem,2.5vw,0.875rem)]">封禁原因:</span>
                        <p className="text-[clamp(0.75rem,3vw,1rem)] break-words">{result.data.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground text-[clamp(0.7rem,2.5vw,0.875rem)]">添加时间: {result.data.added_at}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground text-[clamp(0.7rem,2.5vw,0.875rem)]">操作者: {result.data.added_by}</span>
                    </div>
                  </div>
                )}
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
