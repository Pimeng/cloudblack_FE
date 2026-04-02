﻿import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, X, CheckCircle, Search, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useImageViewer } from '@/hooks/useImageViewer';
import { ImageUploadDropzone, type PendingImage } from '@/components/ImageUploadDropzone';
import { ReportPageShell } from '@/components/ReportPageShell';
import { gsap } from 'gsap';
import { useGeetest, type GeetestResult } from '@/hooks/useGeetest';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://cloudblack-api.07210700.xyz';

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
  // 改用 PendingImage 存储文件和预览
  const [images, setImages] = useState<PendingImage[]>([]);
  const maxImages = 3;
  const maxSizeMB = 5;
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
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const shouldAutoResizeRef = useRef(false);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!active || hasAnimated.current) return;
    hasAnimated.current = true;
    gsap.fromTo(formRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
    );
  }, [active]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    shouldAutoResizeRef.current = window.matchMedia('(pointer: coarse)').matches;
  }, []);

  useEffect(() => {
    if (!shouldAutoResizeRef.current || !contentTextareaRef.current) return;

    const textarea = contentTextareaRef.current;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(textarea.scrollHeight, 80)}px`;
  }, [formData.content]);

  useEffect(() => {
    if (!formRef.current || submitted) return;

    if (!hasAnimated.current) {
      gsap.set(formRef.current, { opacity: active ? 1 : 0, y: active ? 0 : 50 });
      return;
    }

    gsap.set(formRef.current, { opacity: 1, y: 0 });
  }, [active, submitted, activeTab]);

  // 处理图片上传错误
  const handleImageError = useCallback((message: string) => {
    setError(message);
  }, []);

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

  // 实际提交申诉的逻辑 - 使用表单上传
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
      
      // 使用 FormData 一次性提交所有数据（包括图片）
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('user_id', formData.user_id);
      formDataToSubmit.append('user_type', formData.user_type);
      formDataToSubmit.append('content', formData.content);
      formDataToSubmit.append('contact_email', formData.contact_email);
      
      // 添加图片文件
      images.forEach((img) => {
        formDataToSubmit.append('files', img.file);
      });
      
      // 添加极验验证数据（表单方式）
      if (geetestData) {
        formDataToSubmit.append('geetest_lot_number', geetestData.lot_number);
        formDataToSubmit.append('geetest_captcha_output', geetestData.captcha_output);
        formDataToSubmit.append('geetest_pass_token', geetestData.pass_token);
        formDataToSubmit.append('geetest_gen_time', geetestData.gen_time);
      }
      
      const res = await fetch(`${API_BASE}/api/appeals`, {
        method: 'POST',
        body: formDataToSubmit, // 不使用 Content-Type header，让浏览器自动设置
      });
      const data = await res.json();
      if (!data.success) { 
        setError(data.message || '提交失败'); 
        resetGeetest();
        setSubmitting(false); 
        return; 
      }
      
      // 清理预览 URL
      images.forEach(img => URL.revokeObjectURL(img.preview));
      setImages([]);
      
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
    if (images.length < 1) { setError('请至少上传1张图片作为申诉证明'); return; }
    
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
      <section ref={sectionRef} className="relative min-h-screen px-4 pt-24 pb-28 md:px-8 md:py-10 md:h-screen flex flex-col justify-start md:justify-center items-center">
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
    <section ref={sectionRef} className="relative min-h-screen px-4 pt-20 pb-28 md:px-8 md:pt-24 md:pb-28 md:h-screen flex flex-col justify-start items-stretch">
      <ReportPageShell
        title="申诉中心"
        description="提交申诉或查询您的申诉记录"
        activeTab={activeTab}
        tabs={[
          {
            key: 'submit',
            label: '提交申诉',
            icon: <FileText className="w-4 h-4" />,
            onClick: () => { setActiveTab('submit'); setError(''); setQueryResult(null); },
          },
          {
            key: 'query',
            label: '查询申诉',
            icon: <Search className="w-4 h-4" />,
            onClick: () => { setActiveTab('query'); setError(''); setSubmitted(false); },
          },
        ]}
      >
      <div ref={formRef} style={{ opacity: 0 }}>
        {activeTab === 'submit' ? (
          <div className="glass-strong rounded-3xl p-4 md:p-6">
            <form onSubmit={handleSubmit} className="space-y-3">

              {/* 申诉类型 */}
              <div className="space-y-1.5">
                <Label>申诉类型</Label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setFormData({ ...formData, user_type: 'user' })}
                    className={`flex-1 py-2 px-4 rounded-xl border transition-all ${formData.user_type === 'user' ? 'border-brand bg-brand/10 text-brand' : 'border-border/50 text-muted-foreground hover:border-brand/50'}`}>
                    个人QQ
                  </button>
                  <button type="button" onClick={() => setFormData({ ...formData, user_type: 'group' })}
                    className={`flex-1 py-2 px-4 rounded-xl border transition-all ${formData.user_type === 'group' ? 'border-brand bg-brand/10 text-brand' : 'border-border/50 text-muted-foreground hover:border-brand/50'}`}>
                    群号
                  </button>
                </div>
              </div>

              {/* QQ号 / 群号 */}
              <div className="space-y-1.5">
                <Label htmlFor="user_id">{formData.user_type === 'user' ? 'QQ号' : '群号'}</Label>
                <Input id="user_id" type="text" inputMode="numeric" pattern="[0-9]*"
                  placeholder={`请输入您的${formData.user_type === 'user' ? 'QQ号' : '群号'}`}
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value.replace(/\D/g, '') })}
                  className="bg-background/50 border-border/50 focus:border-brand" />
              </div>

              {/* 联系邮箱 */}
              <div className="space-y-1.5">
                <Label htmlFor="email">联系邮箱</Label>
                <Input id="email" type="email" placeholder="请输入您的邮箱地址"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  className="bg-background/50 border-border/50 focus:border-brand" />
              </div>

              {/* 申诉内容 */}
              <div className="space-y-1.5">
                <Label htmlFor="content">申诉内容 <span className="text-red-500">*</span></Label>
                <Textarea ref={contentTextareaRef} id="content" placeholder="请详细描述您被拉黑的情况，包括：&#10;1. 您认为被误封的原因&#10;2. 相关事件经过&#10;3. 您希望如何处理"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="bg-background/50 border-border/50 focus:border-brand min-h-[80px] resize-y overflow-hidden"
                  maxLength={2000} />
                <p className="text-xs text-muted-foreground text-right">{formData.content.length}/2000</p>
              </div>

              {/* 截图上传 */}
              <div className="space-y-1.5">
                <Label>相关截图 <span className="text-red-500">*</span> <span className="text-xs text-muted-foreground font-normal">（至少1张，最多3张，用于证明您的申诉理由）</span></Label>
                <ImageUploadDropzone
                  images={images}
                  onImagesChange={setImages}
                  maxImages={maxImages}
                  maxSizeMB={maxSizeMB}
                  onError={handleImageError}
                  onImageClick={(src) => openImage(src)}
                />
              </div>

              {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">{error}</div>}

              <div className="space-y-2">
                <Button type="submit" disabled={submitting || geetestLoading || (isEnabled && !isReady)}
                  className="w-full py-3 text-base font-medium bg-brand hover:bg-brand-dark text-white rounded-xl transition-all duration-300 hover:shadow-glow">
                  {submitting
                    ? <span className="flex items-center gap-2"><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />提交中...</span>
                    : <span className="flex items-center gap-2"><Send className="w-5 h-5" />提交申诉</span>}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  提交后我们会尽快审核，处理结果将发送至您的邮箱
                </p>
              </div>
            </form>
          </div>
        ) : (
          <div className="glass-strong rounded-3xl p-6">
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm text-blue-400">
                  💡 提示：输入您的QQ号或群号可查询所有相关的申诉记录及处理状态
                </p>
              </div>
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
                    <div key={appeal.appeal_id} className="bg-muted/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-sm text-muted-foreground">{appeal.appeal_id}</span>
                        {getStatusBadge(appeal.status)}
                      </div>
                      <p className="text-sm text-foreground/80 mb-2 line-clamp-2">{appeal.content}</p>
                      <p className="text-xs text-muted-foreground">提交时间: {new Date(appeal.created_at).toLocaleString()}</p>
                      {appeal.review && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <p className="text-xs text-muted-foreground">审核人: {appeal.review.admin_name}</p>
                          <p className="text-xs text-muted-foreground">审核时间: {new Date(appeal.review.reviewed_at).toLocaleString()}</p>
                          <p className="text-xs text-foreground/80 mt-1">审核理由: {appeal.review.reason}</p>
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
      </ReportPageShell>
    </section>
  );
}
