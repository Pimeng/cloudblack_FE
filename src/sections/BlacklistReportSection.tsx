import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, X, CheckCircle, Search, Clock, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useImageViewer } from '@/hooks/useImageViewer';
import { ImageUploadDropzone, type PendingImage } from '@/components/ImageUploadDropzone';
import { ReportPageShell } from '@/components/ReportPageShell';
import { gsap } from 'gsap';
import { useGeetest, type GeetestResult } from '@/hooks/useGeetest';
import type { BlacklistReport } from '@/admin/types';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://cloudblack-api.07210700.xyz';

export function BlacklistReportSection({ active }: { active?: boolean }) {
  const [activeTab, setActiveTab] = useState<'submit' | 'query'>('submit');
  const [formData, setFormData] = useState({
    target_user_id: '',
    target_user_type: 'user' as 'user' | 'group',
    reason: '',
    reporter_contact: '',
    reporter_user_id: '',
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

  const [queryReportId, setQueryReportId] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<BlacklistReport | null>(null);

  const { openImage } = useImageViewer();
  
  // 使用 bind 模式的极验验证，点击提交按钮时触发
  // 使用黑名单举报专用的极验配置端点
  const { 
    isLoading: geetestLoading, 
    isReady, 
    isEnabled,
    verify,
    reset: resetGeetest 
  } = useGeetest({
    product: 'bind',
    configEndpoint: 'blacklist', // 使用黑名单举报配置端点
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
  const reasonTextareaRef = useRef<HTMLTextAreaElement>(null);
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
    if (!shouldAutoResizeRef.current || !reasonTextareaRef.current) return;

    const textarea = reasonTextareaRef.current;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(textarea.scrollHeight, 80)}px`;
  }, [formData.reason]);

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

  const queryReport = async () => {
    if (!queryReportId.trim()) { setError('请输入举报ID'); return; }
    setQueryLoading(true); setError(''); setQueryResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/blacklist/reports/${queryReportId.trim()}`);
      const data = await res.json();
      if (data.success) setQueryResult(data.data);
      else setError(data.message || '查询失败');
    } catch { setError('查询失败，请稍后重试'); }
    finally { setQueryLoading(false); }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'pending')  return <span className="text-yellow-500 flex items-center gap-1"><Clock className="w-4 h-4" />待处理</span>;
    if (status === 'approved') return <span className="text-green-500 flex items-center gap-1"><CheckCircle className="w-4 h-4" />已通过</span>;
    if (status === 'rejected') return <span className="text-red-500 flex items-center gap-1"><X className="w-4 h-4" />已拒绝</span>;
    return null;
  };

  // 实际提交举报的逻辑 - 使用表单上传
  const executeSubmit = useCallback(async (geetestData: GeetestResult | null) => {
    // 防重检查：如果正在处理中，直接返回
    if (isProcessingRef.current) {
      return;
    }
    
    isProcessingRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      // 使用 FormData 一次性提交所有数据（包括图片）
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('target_user_id', formData.target_user_id);
      formDataToSubmit.append('target_user_type', formData.target_user_type);
      formDataToSubmit.append('reason', formData.reason);
      
      // 始终添加联系方式字段（即使是空字符串）
      formDataToSubmit.append('reporter_contact', formData.reporter_contact || '');
      formDataToSubmit.append('reporter_user_id', formData.reporter_user_id || '');
      
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
      
      const res = await fetch(`${API_BASE}/api/blacklist/reports`, {
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
    
    if (!formData.target_user_id.trim()) { setError('请输入被举报人QQ号或群号'); return; }
    if (!/^\d+$/.test(formData.target_user_id.trim())) { setError('QQ号或群号必须为数字'); return; }
    if (!formData.reason.trim()) { setError('请输入举报原因'); return; }
    if (formData.reason.trim().length < 10) { setError('举报原因至少需要10个字符'); return; }
    if (formData.reason.length > 2000) { setError('举报原因不能超过2000字'); return; }
    if (images.length < 1) { setError('请至少上传1张图片作为举报证明'); return; }
    
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
          <h3 className="text-2xl font-bold mb-4">举报提交成功</h3>
          <p className="text-muted-foreground mb-6">我们会尽快审核您的举报，处理结果将通过您提供的联系方式通知。</p>
          <Button onClick={() => { setSubmitted(false); setFormData({ target_user_id: '', target_user_type: 'user', reason: '', reporter_contact: '', reporter_user_id: '' }); setImages([]); resetGeetest(); }} className="bg-brand hover:bg-brand-dark">
            继续提交举报
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative min-h-screen px-4 pt-20 pb-28 md:px-8 md:pt-24 md:pb-28 md:h-screen flex flex-col justify-start items-stretch">
      <ReportPageShell
        title="我要举报"
        description="举报违规用户，共建良好社区环境"
        activeTab={activeTab}
        tabs={[
          {
            key: 'submit',
            label: '提交举报',
            icon: <ShieldAlert className="w-4 h-4" />,
            onClick: () => { setActiveTab('submit'); setError(''); setQueryResult(null); },
          },
          {
            key: 'query',
            label: '查询举报',
            icon: <Search className="w-4 h-4" />,
            onClick: () => { setActiveTab('query'); setError(''); setSubmitted(false); },
          },
        ]}
      >
      <div ref={formRef} style={{ opacity: 0 }}>
        {activeTab === 'submit' ? (
          <div className="glass-strong rounded-3xl p-4 md:p-6">
            <form onSubmit={handleSubmit} className="space-y-3">

              {/* 被举报者类型 */}
              <div className="space-y-1.5">
                <Label>被举报者类型</Label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setFormData({ ...formData, target_user_type: 'user' })}
                    className={`flex-1 py-2 px-4 rounded-xl border transition-all ${formData.target_user_type === 'user' ? 'border-brand bg-brand/10 text-brand' : 'border-border/50 text-muted-foreground hover:border-brand/50'}`}>
                    个人QQ
                  </button>
                  <button type="button" onClick={() => setFormData({ ...formData, target_user_type: 'group' })}
                    className={`flex-1 py-2 px-4 rounded-xl border transition-all ${formData.target_user_type === 'group' ? 'border-brand bg-brand/10 text-brand' : 'border-border/50 text-muted-foreground hover:border-brand/50'}`}>
                    群聊
                  </button>
                </div>
              </div>

              {/* 被举报人QQ号 / 群号 */}
              <div className="space-y-1.5">
                <Label htmlFor="target_user_id">{formData.target_user_type === 'user' ? '被举报人QQ号' : '被举报群号'}</Label>
                <Input id="target_user_id" type="text" inputMode="numeric" pattern="[0-9]*"
                  placeholder={`请输入${formData.target_user_type === 'user' ? '被举报人QQ号' : '被举报群号'}`}
                  value={formData.target_user_id}
                  onChange={(e) => setFormData({ ...formData, target_user_id: e.target.value.replace(/\D/g, '') })}
                  className="bg-background/50 border-border/50 focus:border-brand" />
              </div>

              {/* 举报人联系方式*/}
              <div className="space-y-1.5">
                <Label htmlFor="reporter_contact">联系邮箱 <span className="text-xs text-muted-foreground font-normal">（选填，用于接收处理结果通知）</span></Label>
                <Input id="reporter_contact" type="email" placeholder="您的邮箱地址将严格保密，仅用于通知处理结果"
                  value={formData.reporter_contact}
                  onChange={(e) => setFormData({ ...formData, reporter_contact: e.target.value })}
                  className="bg-background/50 border-border/50 focus:border-brand" />
              </div>

              {/* 举报人用户ID */}
              <div className="space-y-1.5">
                <Label htmlFor="reporter_user_id">您的QQ号 <span className="text-xs text-muted-foreground font-normal">（选填，方便我们核实情况）</span></Label>
                <Input id="reporter_user_id" type="text" inputMode="numeric" pattern="[0-9]*"
                  placeholder="您的QQ号将严格保密，仅用于核实举报内容"
                  value={formData.reporter_user_id}
                  onChange={(e) => setFormData({ ...formData, reporter_user_id: e.target.value.replace(/\D/g, '') })}
                  className="bg-background/50 border-border/50 focus:border-brand" />
              </div>

              {/* 举报原因 */}
              <div className="space-y-1.5">
                <Label htmlFor="reason">举报原因 <span className="text-red-500">*</span></Label>
                <Textarea ref={reasonTextareaRef} id="reason" placeholder="请详细描述违规行为，包括：&#10;1. 违规行为发生的时间和场景&#10;2. 具体的违规内容或行为&#10;3. 是否有其他受害者&#10;请尽量提供详细信息，帮助我们快速核实"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="bg-background/50 border-border/50 focus:border-brand min-h-[80px] resize-y overflow-hidden"
                  maxLength={2000} />
                <p className="text-xs text-muted-foreground text-right">{formData.reason.length}/2000</p>
              </div>

              {/* 截图上传 */}
              <div className="space-y-1.5">
                <Label>证据截图 <span className="text-red-500">*</span> <span className="text-xs text-muted-foreground font-normal">（至少1张，最多3张，请上传能证明违规行为的真实截图）</span></Label>
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
                    : <span className="flex items-center gap-2"><Send className="w-5 h-5" />提交举报</span>}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  我们会对您的举报信息严格保密，审核通过后将及时处理
                </p>
              </div>
            </form>
          </div>
        ) : (
          <div className="glass-strong rounded-3xl p-6">
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm text-blue-400">
                  💡 提示：使用举报时获得的举报ID可查询处理进度和结果
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="query_report_id">举报ID</Label>
                <Input id="query_report_id" type="text"
                  placeholder="请输入举报ID，如：REP-1234567890"
                  value={queryReportId}
                  onChange={(e) => setQueryReportId(e.target.value)}
                  className="bg-background/50 border-border/50 focus:border-brand" />
                <p className="text-xs text-muted-foreground">举报提交成功后会返回举报ID，请妥善保存以便查询</p>
              </div>

              {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">{error}</div>}

              <Button onClick={queryReport} disabled={queryLoading}
                className="w-full py-5 text-lg font-medium bg-brand hover:bg-brand-dark text-white rounded-xl transition-all duration-300 hover:shadow-glow">
                {queryLoading
                  ? <span className="flex items-center gap-2"><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />查询中...</span>
                  : <span className="flex items-center gap-2"><Search className="w-5 h-5" />查询举报状态</span>}
              </Button>

              {queryResult && (
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-sm text-muted-foreground">{queryResult.report_id}</span>
                      {getStatusBadge(queryResult.status)}
                    </div>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">被举报者:</span> {queryResult.target_user_id} ({queryResult.target_user_type === 'group' ? '群聊' : '个人'})</p>
                      <p><span className="text-muted-foreground">举报原因:</span> {queryResult.reason}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">提交时间: {new Date(queryResult.created_at).toLocaleString()}</p>
                    {queryResult.review && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-xs text-muted-foreground">审核人: {queryResult.review.admin_name}</p>
                        <p className="text-xs text-muted-foreground">审核时间: {new Date(queryResult.review.reviewed_at).toLocaleString()}</p>
                        <p className="text-xs text-foreground/80 mt-1">审核理由: {queryResult.review.reason}</p>
                        {queryResult.admin_note && (
                          <p className="text-xs text-foreground/80 mt-1">处理备注: {queryResult.admin_note}</p>
                        )}
                      </div>
                    )}
                    {/* 证据图片 */}
                    {queryResult.evidence && queryResult.evidence.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-xs text-muted-foreground mb-2">证据:</p>
                        <div className="flex gap-2 flex-wrap">
                          {queryResult.evidence.map((img, idx) => (
                            <button
                              key={idx}
                              onClick={() => openImage(img.startsWith('http') ? img : `${API_BASE}${img}`)}
                              className="w-16 h-16 rounded-lg overflow-hidden bg-muted relative group cursor-pointer"
                            >
                              <img 
                                src={img.startsWith('http') ? img : `${API_BASE}${img}`}
                                alt={`证据 ${idx + 1}`}
                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
