import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, X, Image as ImageIcon, CheckCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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

export function AppealSection() {
  const [formData, setFormData] = useState({
    user_id: '',
    content: '',
    contact_email: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  // Turnstile 相关状态
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileLoading, setTurnstileLoading] = useState(true);
  const [turnstileError, setTurnstileError] = useState('');
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  
  const sectionRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      triggerRef.current = ScrollTrigger.create({
        trigger: formRef.current,
        start: 'top 80%',
        onEnter: () => {
          gsap.fromTo(formRef.current,
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
          );
        },
        once: true
      });
    }, sectionRef);

    return () => {
      if (triggerRef.current) {
        triggerRef.current.kill();
      }
      ctx.revert();
    };
  }, []);

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
        setTurnstileError('');
      },
      'error-callback': (code: string) => {
        console.error('[Turnstile] Error code:', code);
        const errorMessages: Record<string, string> = {
          '110200': '配置错误：域名未授权或 Site Key 无效，请检查 Cloudflare Turnstile 设置',
          '110201': '密钥类型不匹配',
          '110210': 'Widget 已过期',
          '300030': '请求频率过高，请稍后重试',
        };
        setTurnstileError(errorMessages[code] || `验证失败 (${code})，请刷新页面重试`);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (images.length + files.length > 3) {
      setError('最多只能上传3张图片');
      return;
    }

    setUploading(true);
    setError('');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.size > 5 * 1024 * 1024) {
        setError('图片大小不能超过5MB');
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/api/upload`, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        
        if (data.success) {
          setImages(prev => [...prev, data.data.url]);
        } else {
          setError(data.message || '上传失败');
        }
      } catch (err) {
        // Fallback: use object URL for preview
        const url = URL.createObjectURL(file);
        setImages(prev => [...prev, url]);
      }
    }

    setUploading(false);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // QQ号校验：不能为空且必须为数字
    if (!formData.user_id.trim()) {
      setError('请输入QQ号');
      return;
    }
    if (!/^\d+$/.test(formData.user_id.trim())) {
      setError('QQ号必须为数字');
      return;
    }
    
    // 邮箱校验：不能为空且必须符合邮箱格式
    if (!formData.contact_email.trim()) {
      setError('请输入联系邮箱');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contact_email.trim())) {
      setError('请输入有效的邮箱地址');
      return;
    }
    
    // 申诉内容校验：至少20个字符
    if (!formData.content.trim()) {
      setError('请输入申诉内容');
      return;
    }
    if (formData.content.trim().length < 20) {
      setError('申诉内容至少需要20个字符');
      return;
    }
    if (formData.content.length > 2000) {
      setError('申诉内容不能超过2000字');
      return;
    }
    if (!turnstileToken) {
      setError('请完成人机验证');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // 先检查用户是否在黑名单中
      const checkResponse = await fetch(`${API_BASE}/api/check?user_id=${formData.user_id.trim()}`);
      const checkData = await checkResponse.json();
      
      if (!checkData.success || !checkData.in_blacklist) {
        setError('该用户不在黑名单中，无需提交申诉');
        setSubmitting(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/appeals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: formData.user_id,
          content: formData.content,
          contact_email: formData.contact_email,
          images: images,
          turnstile_token: turnstileToken,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setError(data.message || '提交失败');
        // 重置 Turnstile
        if (widgetIdRef.current && (window as any).turnstile) {
          (window as any).turnstile.reset(widgetIdRef.current);
        }
        setTurnstileToken('');
        setSubmitting(false);
        return;
      }
      
      setSubmitted(true);
      gsap.fromTo('.success-message',
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' }
      );
    } catch (err) {
      setError('提交失败，请稍后重试');
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section ref={sectionRef} className="relative py-32 px-4">
        <div className="max-w-lg mx-auto">
          <div className="success-message glass-strong rounded-3xl p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold mb-4">申诉提交成功</h3>
            <p className="text-muted-foreground mb-6">
              我们会尽快审核您的申诉，处理结果将发送至您的邮箱。
            </p>
            <Button
              onClick={() => {
                setSubmitted(false);
                setFormData({ user_id: '', content: '', contact_email: '' });
                setImages([]);
                // 重置 Turnstile
                if (widgetIdRef.current && (window as any).turnstile) {
                  (window as any).turnstile.reset(widgetIdRef.current);
                }
                setTurnstileToken('');
              }}
              className="bg-brand hover:bg-brand-dark"
            >
              继续提交申诉
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative py-32 px-4">
      {/* Section title */}
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-gradient mb-4">
          提交申诉
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          如果您认为被封禁有误，请填写以下表单提交申诉
        </p>
      </div>

      {/* Form */}
      <div 
        ref={formRef}
        className="max-w-lg mx-auto"
      >
        <div className="glass-strong rounded-3xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* QQ Number */}
            <div className="space-y-2">
              <Label htmlFor="user_id">QQ号</Label>
              <Input
                id="user_id"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="请输入您的QQ号"
                value={formData.user_id}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, user_id: value });
                }}
                className="bg-background/50 border-border/50 focus:border-brand"
              />
            </div>

            {/* Contact Email */}
            <div className="space-y-2">
              <Label htmlFor="email">联系邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="请输入您的邮箱地址"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="bg-background/50 border-border/50 focus:border-brand"
              />
            </div>

            {/* Appeal Content */}
            <div className="space-y-2">
              <Label htmlFor="content">申诉内容</Label>
              <Textarea
                id="content"
                placeholder="请详细说明您的情况..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="bg-background/50 border-border/50 focus:border-brand min-h-[150px] resize-none"
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.content.length}/2000
              </p>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>相关截图（可选，最多3张）</Label>
              <div className="flex flex-wrap gap-3">
                {images.map((url, index) => (
                  <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden group">
                    <img 
                      src={url.startsWith('http') ? url : `${API_BASE}${url}`} 
                      alt={`上传图片 ${index + 1}`} 
                      className="w-full h-full object-cover" 
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                ))}
                
                {images.length < 3 && (
                  <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border/50 flex flex-col items-center justify-center cursor-pointer hover:border-brand/50 hover:bg-brand/5 transition-colors">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    {uploading ? (
                      <span className="w-5 h-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="w-5 h-5 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">上传</span>
                      </>
                    )}
                  </label>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                支持 png, jpg, jpeg, gif, webp 格式，单张最大5MB
              </p>
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
                    <span className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                    <span>加载验证组件...</span>
                  </div>
                )}
                <div 
                  ref={turnstileRef} 
                  className={turnstileLoading ? 'hidden' : ''}
                />
                {turnstileError && (
                  <div className="text-sm text-destructive mt-2">
                    {turnstileError}
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitting || !turnstileToken}
              className="w-full py-6 text-lg font-medium bg-brand hover:bg-brand-dark text-white rounded-xl transition-all duration-300 hover:shadow-glow"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  提交中...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  提交申诉
                </span>
              )}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
