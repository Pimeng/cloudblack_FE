﻿import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, X, Image as ImageIcon, CheckCircle, Search, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useImageViewer } from '@/hooks/useImageViewer';
import { gsap } from 'gsap';
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

export function AppealSection({ active }: { active?: boolean }) {
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
  
  // 防重提交锁 - 防止极验 pass_token 被二次使用
  const isProcessingRef = useRef(false);

  const [queryUserId, setQueryUserId] = useState('');
  const [queryUserType, setQueryUserType] = useState<'user' | 'group'>('user');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<AppealItem[] | null>(null);

  const { openImage } = useImageViewer();
  
  // 使用 bind 模式的极验验证，点击提交按钮时触发
  const { 
    isLoading: geetestLoading, 
    isReady, 
    isEnabled,
    verify,
    reset: resetGeetest 
  } = useGeetest({
    product: 'bind',
    onSuccess: (result) => {
      // 验证成功后自动提交
      executeSubmit(result);
    },
    onError: (err) => {
      setError(`人机验证失败：${err}`);
      setSubmitting(false);
    },
  });

  const sectionRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!active || hasAnimated.current) return;
    hasAnimated.current = true;
    gsap.fromTo(formRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
    );
  }, [active]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (images.length + files.length > 3) { setError('最多只能上传3张图片'); return; }
    setUploading(true);
    setError('');
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) { setError('图片大小不能超过5MB'); continue; }
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: fd });
        const data = await res.json();
        if (data.success) setImages(prev => [...prev, data.data.url]);
        else setError(data.message || '上传失败');
      } catch {
        setImages(prev => [...prev, URL.createObjectURL(file)]);
      }
    }
    setUploading(false);
  };

  const removeImage = (index: number) => setImages(prev => prev.filter((_, i) => i !== index));

  const queryAppeals = async () => {
    if (!queryUserId.trim()) { setError('请输入QQ号或群号'); return; }
    setQueryLoading(true); setError(''); setQueryResult(null);
    try {
      const params = new URLSearchParams({ user_type: queryUserType });
      const res = await fetch(`${API_BASE}/api/appeals/user/${queryUserId}?${params}`);
      const data = await res.json();
      if (data.success) setQueryResult(data.data);
      else setError(data.message || '查询失败');
    } catch { setError('查询失败，请稍后重试'); }
    finally { setQueryLoading(false); }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'pending')  return <span className="text-yellow-500 flex items-center gap-1"><Clock className="w-4 h-4" />待审核</span>;
    if (status === 'approved') return <span className="text-green-500 flex items-center gap-1"><CheckCircle className="w-4 h-4" />已通过</span>;
    if (status === 'rejected') return <span className="text-red-500 flex items-center gap-1"><X className="w-4 h-4" />已拒绝</span>;
    return null;
  };

  // 实际提交申诉的逻辑
  const executeSubmit = useCallback(async (geetestData: GeetestResult | null) => {
    // 防重检查：如果正在处理中，直接返回
    if (isProcessingRef.current) {
      return;
    }
    
    isProcessingRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      const checkRes = await fetch(`${API_BASE}/api/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: formData.user_id.trim(),
          user_type: formData.user_type,
          geetest: geetestData 
        }),
      });
      const checkData = await checkRes.json();
      if (!checkData.success || !checkData.in_blacklist) {
        setError('该用户不在黑名单中，无需提交申诉');
        setSubmitting(false);
        resetGeetest();
        return;
      }
      const res = await fetch(`${API_BASE}/api/appeals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: formData.user_id, 
          user_type: formData.user_type, 
          content: formData.content, 
          contact_email: formData.contact_email, 
          images, 
          geetest: geetestData 
        }),
      });
      const data = await res.json();
      if (!data.success) { 
        setError(data.message || '提交失败'); 
        resetGeetest();
        setSubmitting(false); 
        return; 
      }
      setSubmitted(true);
      gsap.fromTo('.success-message', { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
    } catch { 
      setError('提交失败，请稍后重试'); 
    } finally {
      isProcessingRef.current = false;
      setSubmitting(false); 
    }
  }, [formData, images, resetGeetest]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 防重检查：如果正在处理中，忽略本次点击
    if (isProcessingRef.current || submitting) {
      return;
    }
    
    if (!formData.user_id.trim()) { setError('请输入QQ号'); return; }
    if (!/^\d+$/.test(formData.user_id.trim())) { setError('QQ号必须为数字'); return; }
    if (!formData.contact_email.trim()) { setError('请输入联系邮箱'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email.trim())) { setError('请输入有效的邮箱地址'); return; }
    if (!formData.content.trim()) { setError('请输入申诉内容'); return; }
    if (formData.content.trim().length < 20) { setError('申诉内容至少需要20个字符'); return; }
    if (formData.content.length > 2000) { setError('申诉内容不能超过2000字'); return; }
    
    // 如果启用了极验，先触发验证
    if (isEnabled) {
      verify();
    } else {
      // 极验未启用，直接提交
      await executeSubmit(null);
    }
  };

  if (submitted) {
    return (
      <section ref={sectionRef} className="relative py-10 px-8 h-screen flex flex-col justify-center items-center">
        <div className="success-message glass-strong rounded-3xl p-10 text-center max-w-md w-full">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold mb-4">申诉提交成功</h3>
          <p className="text-muted-foreground mb-6">我们会尽快审核您的申诉，处理结果将发送至您的邮箱。</p>
          <Button onClick={() => { setSubmitted(false); setFormData({ user_id: '', user_type: 'user', content: '', contact_email: '' }); setImages([]); resetGeetest(); }} className="bg-brand hover:bg-brand-dark">
            继续提交申诉
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative py-10 px-8 min-h-screen md:h-screen flex flex-col justify-center items-stretch">
      <div className="text-center mb-6">
        <h2 className="text-3xl md:text-4xl font-bold text-gradient mb-2">申诉中心</h2>
        <p className="text-muted-foreground">提交申诉或查询您的申诉记录</p>
      </div>

      <div className="w-full max-w-md mx-auto mb-4">
        <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl">
          <button type="button" onClick={() => { setActiveTab('submit'); setError(''); setQueryResult(null); }}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'submit' ? 'bg-brand text-white' : 'text-muted-foreground hover:text-white'}`}>
            <FileText className="w-4 h-4" />提交申诉
          </button>
          <button type="button" onClick={() => { setActiveTab('query'); setError(''); setSubmitted(false); }}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'query' ? 'bg-brand text-white' : 'text-muted-foreground hover:text-white'}`}>
            <Search className="w-4 h-4" />查询申诉
          </button>
        </div>
      </div>

      <div ref={formRef} className="w-full max-w-md mx-auto" style={{ opacity: 0 }}>
        {activeTab === 'submit' ? (
          <div className="glass-strong rounded-3xl p-6">
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* 申诉类型 */}
              <div className="space-y-2">
                <Label>申诉类型</Label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setFormData({ ...formData, user_type: 'user' })}
                    className={`flex-1 py-2.5 px-4 rounded-xl border transition-all ${formData.user_type === 'user' ? 'border-brand bg-brand/10 text-brand' : 'border-border/50 text-muted-foreground hover:border-brand/50'}`}>
                    个人QQ
                  </button>
                  <button type="button" onClick={() => setFormData({ ...formData, user_type: 'group' })}
                    className={`flex-1 py-2.5 px-4 rounded-xl border transition-all ${formData.user_type === 'group' ? 'border-brand bg-brand/10 text-brand' : 'border-border/50 text-muted-foreground hover:border-brand/50'}`}>
                    群号
                  </button>
                </div>
              </div>

              {/* QQ号 / 群号 */}
              <div className="space-y-2">
                <Label htmlFor="user_id">{formData.user_type === 'user' ? 'QQ号' : '群号'}</Label>
                <Input id="user_id" type="text" inputMode="numeric" pattern="[0-9]*"
                  placeholder={`请输入您的${formData.user_type === 'user' ? 'QQ号' : '群号'}`}
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value.replace(/\D/g, '') })}
                  className="bg-background/50 border-border/50 focus:border-brand" />
              </div>

              {/* 联系邮箱 */}
              <div className="space-y-2">
                <Label htmlFor="email">联系邮箱</Label>
                <Input id="email" type="email" placeholder="请输入您的邮箱地址"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  className="bg-background/50 border-border/50 focus:border-brand" />
              </div>

              {/* 申诉内容 */}
              <div className="space-y-2">
                <Label htmlFor="content">申诉内容</Label>
                <Textarea id="content" placeholder="请详细说明您的情况..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="bg-background/50 border-border/50 focus:border-brand min-h-[100px] resize-none"
                  maxLength={2000} />
                <p className="text-xs text-muted-foreground text-right">{formData.content.length}/2000</p>
              </div>

              {/* 截图上传 */}
              <div className="space-y-2">
                <Label>相关截图（可选，最多3张）</Label>
                <div className="flex flex-wrap gap-3">
                  {images.map((url, index) => (
                    <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden group cursor-pointer"
                      onClick={() => openImage(url.startsWith('http') ? url : `${API_BASE}${url}`)}>
                      <img src={url.startsWith('http') ? url : `${API_BASE}${url}`} alt={`上传图片 ${index + 1}`} className="w-full h-full object-cover" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                  {images.length < 3 && (
                    <label className="w-16 h-16 rounded-lg border-2 border-dashed border-border/50 flex flex-col items-center justify-center cursor-pointer hover:border-brand/50 hover:bg-brand/5 transition-colors">
                      <input type="file" accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
                      {uploading
                        ? <span className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                        : <><ImageIcon className="w-4 h-4 text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">上传</span></>}
                    </label>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">png/jpg/gif/webp，单张最大5MB</p>
              </div>

              {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">{error}</div>}

              <Button type="submit" disabled={submitting || geetestLoading || (isEnabled && !isReady)}
                className="w-full py-5 text-lg font-medium bg-brand hover:bg-brand-dark text-white rounded-xl transition-all duration-300 hover:shadow-glow">
                {submitting
                  ? <span className="flex items-center gap-2"><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />提交中...</span>
                  : <span className="flex items-center gap-2"><Send className="w-5 h-5" />提交申诉</span>}
              </Button>
            </form>
          </div>
        ) : (
          <div className="glass-strong rounded-3xl p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>查询类型</Label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setQueryUserType('user')}
                    className={`flex-1 py-3 px-4 rounded-xl border transition-all ${queryUserType === 'user' ? 'border-brand bg-brand/10 text-brand' : 'border-border/50 text-muted-foreground hover:border-brand/50'}`}>
                    个人QQ
                  </button>
                  <button type="button" onClick={() => setQueryUserType('group')}
                    className={`flex-1 py-3 px-4 rounded-xl border transition-all ${queryUserType === 'group' ? 'border-brand bg-brand/10 text-brand' : 'border-border/50 text-muted-foreground hover:border-brand/50'}`}>
                    群号
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="query_user_id">{queryUserType === 'user' ? 'QQ号' : '群号'}</Label>
                <Input id="query_user_id" type="text" inputMode="numeric" pattern="[0-9]*"
                  placeholder={`请输入您的${queryUserType === 'user' ? 'QQ号' : '群号'}`}
                  value={queryUserId}
                  onChange={(e) => setQueryUserId(e.target.value.replace(/\D/g, ''))}
                  className="bg-background/50 border-border/50 focus:border-brand" />
              </div>

              {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">{error}</div>}

              <Button onClick={queryAppeals} disabled={queryLoading}
                className="w-full py-5 text-lg font-medium bg-brand hover:bg-brand-dark text-white rounded-xl transition-all duration-300 hover:shadow-glow">
                {queryLoading
                  ? <span className="flex items-center gap-2"><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />查询中...</span>
                  : <span className="flex items-center gap-2"><Search className="w-5 h-5" />查询申诉记录</span>}
              </Button>

              {queryResult && (
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {queryResult.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">未找到申诉记录</div>
                  ) : queryResult.map((appeal) => (
                    <div key={appeal.appeal_id} className="bg-slate-800/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-sm text-muted-foreground">{appeal.appeal_id}</span>
                        {getStatusBadge(appeal.status)}
                      </div>
                      <p className="text-sm text-slate-300 mb-2 line-clamp-2">{appeal.content}</p>
                      <p className="text-xs text-muted-foreground">提交时间: {new Date(appeal.created_at).toLocaleString()}</p>
                      {appeal.review && (
                        <div className="mt-3 pt-3 border-t border-slate-700/50">
                          <p className="text-xs text-muted-foreground">审核人: {appeal.review.admin_name}</p>
                          <p className="text-xs text-muted-foreground">审核时间: {new Date(appeal.review.reviewed_at).toLocaleString()}</p>
                          <p className="text-xs text-slate-300 mt-1">审核理由: {appeal.review.reason}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
