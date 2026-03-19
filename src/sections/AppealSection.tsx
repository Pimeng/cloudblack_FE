import { useState, useRef, useEffect } from 'react';
import { Send, X, Image as ImageIcon, CheckCircle, Shield, Search, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGeetest, type GeetestResult } from '@/hooks/useGeetest';

const API_BASE = 'https://cloudblack-api.07210700.xyz';

interface AppealItem {
  appeal_id: string;
  user_id: string;
  user_type: 'user' | 'group';
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  review?: {
    action: string;
    reason: string;
    admin_name: string;
    reviewed_at: string;
  };
}

export function AppealSection() {
  const [activeTab, setActiveTab] = useState<'submit' | 'query'>('submit');
  const [formData, setFormData] = useState({
    user_id: '',
    user_type: 'user' as 'user' | 'group',
    content: '',
    contact_email: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  // Query appeal states
  const [queryUserId, setQueryUserId] = useState('');
  const [queryUserType, setQueryUserType] = useState<'user' | 'group'>('user');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<AppealItem[] | null>(null);
  
  // Geetest 相关状态
  const [geetestResult, setGeetestResult] = useState<GeetestResult | null>(null);
  const { containerRef, isLoading: geetestLoading, reset: resetGeetest, isEnabled } = useGeetest({
    product: 'float',
    onSuccess: (result) => {
      setGeetestResult(result);
      setError('');
    },
    onError: (err) => {
      setError('人机验证失败：' + err);
    },
  });
  
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

  const queryAppeals = async () => {
    if (!queryUserId.trim()) {
      setError('请输入QQ号或群号');
      return;
    }

    setQueryLoading(true);
    setError('');
    setQueryResult(null);

    try {
      const params = new URLSearchParams();
      params.append('user_type', queryUserType);
      
      const response = await fetch(`${API_BASE}/api/appeals/user/${queryUserId}?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setQueryResult(data.data);
      } else {
        setError(data.message || '查询失败');
      }
    } catch (err) {
      setError('查询失败，请稍后重试');
    } finally {
      setQueryLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="text-yellow-500 flex items-center gap-1"><Clock className="w-4 h-4" />待审核</span>;
      case 'approved':
        return <span className="text-green-500 flex items-center gap-1"><CheckCircle className="w-4 h-4" />已通过</span>;
      case 'rejected':
        return <span className="text-red-500 flex items-center gap-1"><X className="w-4 h-4" />已拒绝</span>;
      default:
        return null;
    }
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
    // 如果启用了极验，需要完成验证
    if (isEnabled && !geetestResult) {
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
          user_type: formData.user_type,
          content: formData.content,
          contact_email: formData.contact_email,
          images: images,
          geetest: geetestResult,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setError(data.message || '提交失败');
        // 重置 Geetest
        resetGeetest();
        setGeetestResult(null);
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
                setFormData({ user_id: '', user_type: 'user', content: '', contact_email: '' });
                setImages([]);
                resetGeetest();
                setGeetestResult(null);
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
          申诉中心
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          提交申诉或查询您的申诉记录
        </p>
      </div>

      {/* Tab Switch */}
      <div className="max-w-lg mx-auto mb-8">
        <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('submit');
              setError('');
              setQueryResult(null);
            }}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'submit'
                ? 'bg-brand text-white'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            提交申诉
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('query');
              setError('');
              setSubmitted(false);
            }}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'query'
                ? 'bg-brand text-white'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" />
            查询申诉
          </button>
        </div>
      </div>

      {/* Form */}
      <div 
        ref={formRef}
        className="max-w-lg mx-auto"
      >
        {activeTab === 'submit' ? (
        <div className="glass-strong rounded-3xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Type Selection */}
            <div className="space-y-2">
              <Label>申诉类型</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, user_type: 'user' })}
                  className={`flex-1 py-3 px-4 rounded-xl border transition-all ${
                    formData.user_type === 'user'
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-border/50 text-muted-foreground hover:border-brand/50'
                  }`}
                >
                  个人QQ
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, user_type: 'group' })}
                  className={`flex-1 py-3 px-4 rounded-xl border transition-all ${
                    formData.user_type === 'group'
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-border/50 text-muted-foreground hover:border-brand/50'
                  }`}
                >
                  群号
                </button>
              </div>
            </div>

            {/* QQ Number / Group Number */}
            <div className="space-y-2">
              <Label htmlFor="user_id">{formData.user_type === 'user' ? 'QQ号' : '群号'}</Label>
              <Input
                id="user_id"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={`请输入您的${formData.user_type === 'user' ? 'QQ号' : '群号'}`}
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

            {/* Geetest Verification - 仅在启用时显示 */}
            {isEnabled && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>人机验证</span>
                  {geetestResult && (
                    <span className="text-green-500 text-xs">(已完成)</span>
                  )}
                </div>
                <div className="relative">
                  {geetestLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                      <span className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                      <span>加载验证组件...</span>
                    </div>
                  )}
                  <div 
                    ref={containerRef} 
                    className={geetestLoading ? 'hidden' : ''}
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitting || (isEnabled && !geetestResult)}
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
        ) : (
        /* Query Appeal Form */
        <div className="glass-strong rounded-3xl p-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>查询类型</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setQueryUserType('user')}
                  className={`flex-1 py-3 px-4 rounded-xl border transition-all ${
                    queryUserType === 'user'
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-border/50 text-muted-foreground hover:border-brand/50'
                  }`}
                >
                  个人QQ
                </button>
                <button
                  type="button"
                  onClick={() => setQueryUserType('group')}
                  className={`flex-1 py-3 px-4 rounded-xl border transition-all ${
                    queryUserType === 'group'
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-border/50 text-muted-foreground hover:border-brand/50'
                  }`}
                >
                  群号
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="query_user_id">{queryUserType === 'user' ? 'QQ号' : '群号'}</Label>
              <Input
                id="query_user_id"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={`请输入您的${queryUserType === 'user' ? 'QQ号' : '群号'}`}
                value={queryUserId}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setQueryUserId(value);
                }}
                className="bg-background/50 border-border/50 focus:border-brand"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={queryAppeals}
              disabled={queryLoading}
              className="w-full py-6 text-lg font-medium bg-brand hover:bg-brand-dark text-white rounded-xl transition-all duration-300 hover:shadow-glow"
            >
              {queryLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  查询中...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  查询申诉记录
                </span>
              )}
            </Button>

            {/* Query Results */}
            {queryResult && (
              <div className="mt-6 space-y-4">
                {queryResult.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    未找到申诉记录
                  </div>
                ) : (
                  queryResult.map((appeal) => (
                    <div key={appeal.appeal_id} className="bg-slate-800/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-sm text-muted-foreground">
                          {appeal.appeal_id}
                        </span>
                        {getStatusBadge(appeal.status)}
                      </div>
                      <p className="text-sm text-slate-300 mb-2 line-clamp-2">{appeal.content}</p>
                      <p className="text-xs text-muted-foreground">
                        提交时间: {new Date(appeal.created_at).toLocaleString()}
                      </p>
                      {appeal.review && (
                        <div className="mt-3 pt-3 border-t border-slate-700/50">
                          <p className="text-xs text-muted-foreground">
                            审核人: {appeal.review.admin_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            审核时间: {new Date(appeal.review.reviewed_at).toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-300 mt-1">
                            审核理由: {appeal.review.reason}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </section>
  );
}
