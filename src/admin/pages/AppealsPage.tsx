import { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FileText, RefreshCw, Trash2, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, Eye, Sparkles, X, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useImageViewer } from '@/hooks/useImageViewer';
import type { AdminDataContext } from '../hooks/useAdminData';
import type { Appeal } from '../types';
import { API_BASE } from '../types';
import { toast } from 'sonner';

export function AppealsPage() {
  const { 
    token, adminLevel,
    appeals, appealPage, setAppealPage, appealTotal, appealFilter, setAppealFilter,
    fetchAppeals, loading 
  } = useOutletContext<AdminDataContext>();
  
  const { openImage } = useImageViewer();
  
  // Review dialog state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewReason, setReviewReason] = useState('');
  const [removeFromBlacklist, setRemoveFromBlacklist] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAppeal, setDeletingAppeal] = useState<Appeal | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  
  // Detail dialog state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [viewingAppeal, setViewingAppeal] = useState<Appeal | null>(null);
  
  // Animation state
  const [animating, setAnimating] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'initial' | 'expanding' | 'content' | 'closing-start' | 'closing'>('initial');
  const [cardRect, setCardRect] = useState<DOMRect | null>(null);
  const [lastAppealId, setLastAppealId] = useState<string | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (token) fetchAppeals();
  }, [token, appealPage, appealFilter]);

  const canReviewAppeals = adminLevel >= 2;
  const canManageBlacklist = adminLevel >= 3;
  const canClearProcessed = adminLevel >= 4;  // 仅超级管理员可操作
  const canRefreshAI = adminLevel >= 2;
  const canDeleteAI = adminLevel >= 3;
  const appealTotalPages = Math.ceil(appealTotal / 20);
  
  // Clear processed dialog state
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearDays, setClearDays] = useState<number | ''>('');
  const [clearingLoading, setClearingLoading] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500/50 text-yellow-500"><Clock className="w-3 h-3 mr-1" />待审核</Badge>;
      case 'approved':
        return <Badge variant="outline" className="border-green-500/50 text-green-500"><CheckCircle className="w-3 h-3 mr-1" />已通过</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="border-red-500/50 text-red-500"><XCircle className="w-3 h-3 mr-1" />已拒绝</Badge>;
      default:
        return null;
    }
  };

  const openReviewDialog = (appeal: Appeal, action: 'approve' | 'reject') => {
    setSelectedAppeal(appeal);
    setReviewAction(action);
    setReviewReason('');
    setRemoveFromBlacklist(action === 'approve');
    setReviewDialogOpen(true);
  };
  
  const openDetailDialog = useCallback((appeal: Appeal, appealId: string) => {
    const cardEl = cardRefs.current.get(appealId);
    if (cardEl) {
      // Get position and store it in a ref to avoid React batching issues
      const rect = cardEl.getBoundingClientRect();
      
      // Store appeal ID first
      setLastAppealId(appealId);
      setViewingAppeal(appeal);
      
      // Set rect and animating synchronously
      setCardRect({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      } as DOMRect);
      setAnimating(true);
      setAnimationPhase('initial');
      
      // Double RAF to ensure DOM has painted
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimationPhase('expanding');
        });
      });
      
      // Show detail when animation is almost complete
      setTimeout(() => {
        setDetailDialogOpen(true);
      }, 250);
      
      // Remove mask after animation fully completes
      setTimeout(() => {
        setAnimationPhase('content');
      }, 350);
    } else {
      // Fallback if ref not found
      setViewingAppeal(appeal);
      setDetailDialogOpen(true);
    }
  }, []);
  
  const closeDetailDialog = useCallback(() => {
    // Get current card position for closing animation
    if (lastAppealId) {
      const cardEl = cardRefs.current.get(lastAppealId);
      if (cardEl) {
        const rect = cardEl.getBoundingClientRect();
        setCardRect({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        } as DOMRect);
      }
    }
    
    // Step 1: Set mask at full screen (no transition, z-40 below dialog's z-50)
    setAnimationPhase('closing-start');
    
    // Step 2: Start transition to card position
    requestAnimationFrame(() => {
      setAnimationPhase('closing');
    });
    
    // Step 3: Hide detail content mid-animation
    setTimeout(() => {
      setDetailDialogOpen(false);
    }, 150);
    
    // Step 4: Finish animation and cleanup
    setTimeout(() => {
      setAnimationPhase('initial');
      setAnimating(false);
      setCardRect(null);
      setLastAppealId(null);
      setViewingAppeal(null);
    }, 350);
  }, [lastAppealId]);

  const submitReview = async () => {
    if (!selectedAppeal || !reviewReason.trim() || !token) return;
    
    setSubmittingReview(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/appeals/${selectedAppeal.appeal_id}/review`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: reviewAction,
          reason: reviewReason,
          remove_from_blacklist: removeFromBlacklist,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(reviewAction === 'approve' ? '申诉已通过' : '申诉已拒绝');
        setReviewDialogOpen(false);
        fetchAppeals();
      } else {
        toast.error(data.message || '操作失败');
      }
    } catch (err) {
      toast.error('提交审核失败');
    } finally {
      setSubmittingReview(false);
    }
  };

  const deleteAppeal = async () => {
    if (!deletingAppeal || !token) return;
    
    setDeletingLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/appeals/${deletingAppeal.appeal_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token },
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('申诉已删除');
        setDeleteDialogOpen(false);
        fetchAppeals();
      } else {
        toast.error(data.message || '删除失败');
      }
    } catch (err) {
      toast.error('删除失败');
    } finally {
      setDeletingLoading(false);
    }
  };

  const refreshAIAnalysis = async (appealId: string) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/admin/appeals/${appealId}/ai-analysis`, {
        method: 'POST',
        headers: { 'Authorization': token },
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('AI 分析已刷新');
        fetchAppeals();
      } else {
        toast.error(data.message || '刷新失败');
      }
    } catch (err) {
      toast.error('刷新失败');
    }
  };

  const deleteAIAnalysis = async (appealId: string) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/admin/appeals/${appealId}/ai-analysis`, {
        method: 'DELETE',
        headers: { 'Authorization': token },
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('AI 分析已删除');
        fetchAppeals();
      } else {
        toast.error(data.message || '删除失败');
      }
    } catch (err) {
      toast.error('删除失败');
    }
  };
  
  const clearProcessedAppeals = async () => {
    if (!token) return;
    
    setClearingLoading(true);
    try {
      const body: { days?: number } = {};
      if (clearDays !== '' && clearDays > 0) {
        body.days = clearDays;
      }
      
      const response = await fetch(`${API_BASE}/api/admin/appeals/clear-processed`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      if (data.success) {
        const deletedCount = data.data?.deleted_count || 0;
        if (deletedCount > 0) {
          toast.success(`已清理 ${deletedCount} 条已处理申诉`);
        } else {
          toast.info('没有需要清理的已处理申诉');
        }
        setClearDialogOpen(false);
        setClearDays('');
        fetchAppeals();
      } else {
        toast.error(data.message || '清理失败');
      }
    } catch (err) {
      toast.error('清理失败');
    } finally {
      setClearingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">申诉管理</h2>
          <p className="text-sm text-muted-foreground">审核用户申诉请求</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={appealFilter}
            onChange={(e) => {
              setAppealFilter(e.target.value as any);
              setAppealPage(1);
            }}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="all">全部状态</option>
            <option value="pending">待审核</option>
            <option value="approved">已通过</option>
            <option value="rejected">已拒绝</option>
          </select>
          <Button onClick={() => fetchAppeals()} variant="outline" size="icon">
            <RefreshCw className="w-4 h-4" />
          </Button>
          {canClearProcessed && (
            <Button 
              onClick={() => setClearDialogOpen(true)}
              variant="outline" 
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              清理已处理
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <span className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin inline-block" />
          <p className="text-muted-foreground mt-4">加载中...</p>
        </div>
      ) : appeals.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-muted-foreground">暂无申诉记录</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {appeals.map((appeal) => (
              <div 
                key={appeal.appeal_id} 
                ref={(el) => {
                  if (el) cardRefs.current.set(appeal.appeal_id, el);
                }}
                className="glass rounded-2xl p-6 cursor-pointer hover:bg-slate-800/50 transition-colors"
                onClick={() => openDetailDialog(appeal, appeal.appeal_id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-white">
                        {appeal.user_type === 'group' ? '群号' : 'QQ'}: {appeal.user_id}
                      </span>
                      {getStatusBadge(appeal.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      提交时间: {new Date(appeal.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 text-sm">
                    <Eye className="w-4 h-4" />
                    查看详情
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-slate-300 whitespace-pre-wrap break-words line-clamp-3">{appeal.content}</p>
                </div>
                
                {/* Images */}
                {appeal.images && appeal.images.length > 0 && (
                  <div className="flex gap-2 mb-4" onClick={(e) => e.stopPropagation()}>
                    {appeal.images.slice(0, 3).map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => openImage(img.startsWith('http') ? img : `${API_BASE}${img}`)}
                        className="w-16 h-16 rounded-lg overflow-hidden bg-slate-800 relative group cursor-pointer"
                      >
                        <img 
                          src={img.startsWith('http') ? img : `${API_BASE}${img}`}
                          alt={`证据 ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ZoomIn className="w-5 h-5 text-white" />
                        </div>
                      </button>
                    ))}
                    {appeal.images.length > 3 && (
                      <span className="text-xs text-slate-500 self-center">+{appeal.images.length - 3}</span>
                    )}
                  </div>
                )}
                
                {/* AI Analysis Summary */}
                {appeal.ai_analysis && appeal.ai_analysis.status === 'completed' && (
                  <div className="mb-4 p-3 rounded-lg bg-gradient-to-br from-purple-900/30 to-slate-800 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-purple-400">AI 建议</span>
                      {(appeal.ai_analysis.recommendation || appeal.ai_analysis.result?.recommendation) ? (
                        <Badge className={
                          ((appeal.ai_analysis.recommendation || appeal.ai_analysis.result?.recommendation) || '').includes('通过') 
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : ((appeal.ai_analysis.recommendation || appeal.ai_analysis.result?.recommendation) || '').includes('拒绝')
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        }>
                          {appeal.ai_analysis.recommendation || appeal.ai_analysis.result?.recommendation}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-500">分析完成</span>
                      )}
                    </div>
                    {/* AI Analysis Summary Content */}
                    {appeal.ai_analysis.result?.summary && (
                      <p className="text-xs text-slate-300 line-clamp-2 mb-1">
                        <span className="text-purple-400">申诉要点：</span>
                        {appeal.ai_analysis.result.summary}
                      </p>
                    )}
                    {appeal.ai_analysis.result?.confidence && (
                      <p className="text-xs text-slate-400">
                        置信度：{appeal.ai_analysis.result.confidence}%
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  {appeal.status === 'pending' && canReviewAppeals && (
                    <>
                      <Button onClick={() => openReviewDialog(appeal, 'approve')} className="bg-green-600 hover:bg-green-700" size="sm">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        通过
                      </Button>
                      <Button onClick={() => openReviewDialog(appeal, 'reject')} variant="destructive" size="sm">
                        <XCircle className="w-4 h-4 mr-2" />
                        拒绝
                      </Button>
                    </>
                  )}
                  {canManageBlacklist && (
                    <Button 
                      onClick={() => { setDeletingAppeal(appeal); setDeleteDialogOpen(true); }}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-400 hover:bg-red-500/10 ml-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {appealTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button onClick={() => setAppealPage(p => Math.max(1, p - 1))} disabled={appealPage === 1} variant="outline" size="icon">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">第 {appealPage} / {appealTotalPages} 页</span>
              <Button onClick={() => setAppealPage(p => Math.min(appealTotalPages, p + 1))} disabled={appealPage === appealTotalPages} variant="outline" size="icon">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-[calc(100%-2rem)] mx-4">
          <DialogHeader>
            <DialogTitle>{reviewAction === 'approve' ? '通过申诉' : '拒绝申诉'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedAppeal && `处理用户 ${selectedAppeal.user_id} 的申诉`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>审核理由</Label>
              <Textarea value={reviewReason} onChange={(e) => setReviewReason(e.target.value)} placeholder="请输入审核理由..." className="bg-slate-800 border-slate-700 min-h-[100px]" />
            </div>

            {reviewAction === 'approve' && (
              <div className="flex items-center gap-2">
                <input type="checkbox" id="removeFromBlacklist" checked={removeFromBlacklist} onChange={(e) => setRemoveFromBlacklist(e.target.checked)} className="rounded border-slate-700 bg-slate-800" />
                <Label htmlFor="removeFromBlacklist" className="text-sm cursor-pointer">同时从黑名单中移除该用户</Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>取消</Button>
            <Button onClick={submitReview} disabled={!reviewReason.trim() || submittingReview} className={reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}>
              {submittingReview ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : reviewAction === 'approve' ? <><CheckCircle className="w-4 h-4 mr-2" />确认通过</> : <><XCircle className="w-4 h-4 mr-2" />确认拒绝</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-[calc(100%-2rem)] mx-4">
          <DialogHeader>
            <DialogTitle>删除申诉</DialogTitle>
            <DialogDescription className="text-slate-400">
              {deletingAppeal && `确定要删除用户 ${deletingAppeal.user_id} 的申诉吗？此操作不可恢复。`}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
            <Button onClick={deleteAppeal} disabled={deletingLoading} variant="destructive">
              {deletingLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : <><Trash2 className="w-4 h-4 mr-2" />确认删除</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Clear Processed Dialog */}
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-[calc(100%-2rem)] mx-4">
          <DialogHeader>
            <DialogTitle>清理已处理申诉</DialogTitle>
            <DialogDescription className="text-slate-400">
              清理所有已批准和已拒绝的申诉记录。待审核的申诉不会被删除。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>清理范围（可选）</Label>
              <Input
                type="number"
                min={0}
                placeholder="输入天数，如：30（只清理30天前的记录），留空则清理所有"
                value={clearDays}
                onChange={(e) => {
                  const val = e.target.value;
                  setClearDays(val === '' ? '' : parseInt(val) || 0);
                }}
                className="bg-slate-800 border-slate-700"
              />
              <p className="text-xs text-slate-500">
                输入天数阈值，只清理该天数前已处理的申诉。留空则清理所有已处理的申诉。
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDialogOpen(false)}>取消</Button>
            <Button onClick={clearProcessedAppeals} disabled={clearingLoading} variant="destructive">
              {clearingLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : <><Trash2 className="w-4 h-4 mr-2" />确认清理</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Animation Layer - Behind the detail dialog */}
      {animating && cardRect && animationPhase !== 'content' && (
        (() => {
          const isMobile = window.innerWidth < 768;
          const fullLeft = isMobile ? 0 : 256;
          const fullWidth = isMobile ? '100%' : 'calc(100% - 256px)';
          
          // Determine target state based on phase
          // initial/closing: at card position (animation target)
          // expanding/closing-start: at full screen
          const isAtCardPosition = animationPhase === 'initial' || animationPhase === 'closing';
          
          return (
            <div 
              className="fixed z-40 bg-slate-900/90 backdrop-blur-xl rounded-2xl overflow-hidden border border-slate-700/50"
              style={{
                left: isAtCardPosition ? cardRect.left : fullLeft,
                top: isAtCardPosition ? cardRect.top : 0,
                width: isAtCardPosition ? cardRect.width : fullWidth,
                height: isAtCardPosition ? cardRect.height : '100%',
                transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          );
        })()
      )}
      
      {/* Detail Dialog */}
      {detailDialogOpen && (
        <div className="fixed inset-0 left-0 md:left-64 bg-slate-950 z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-8 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
            <h2 className="text-xl font-semibold text-white">申诉详情</h2>
            <Button variant="ghost" size="icon" onClick={closeDetailDialog} className="text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {viewingAppeal && (
              <div className="space-y-6 py-6 px-8 max-w-6xl mx-auto pb-20">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">申诉ID:</span>
                  <p className="text-white font-mono">{viewingAppeal.appeal_id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">状态:</span>
                  <div className="mt-1">{getStatusBadge(viewingAppeal.status)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">用户类型:</span>
                  <p className="text-white">{viewingAppeal.user_type === 'group' ? '群号' : '个人QQ'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">用户ID:</span>
                  <p className="text-white font-mono">{viewingAppeal.user_id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">联系邮箱:</span>
                  <p className="text-white">{viewingAppeal.contact_email || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">提交时间:</span>
                  <p className="text-white">{new Date(viewingAppeal.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Content */}
              <div>
                <span className="text-muted-foreground text-sm">申诉内容:</span>
                <div className="mt-2 bg-slate-800 rounded-lg p-4">
                  <p className="text-white whitespace-pre-wrap break-words">{viewingAppeal.content}</p>
                </div>
              </div>

              {/* Images */}
              {viewingAppeal.images && viewingAppeal.images.length > 0 && (
                <div>
                  <span className="text-muted-foreground text-sm">相关截图:</span>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {viewingAppeal.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => openImage(img.startsWith('http') ? img : `${API_BASE}${img}`)}
                        className="w-24 h-24 rounded-lg overflow-hidden bg-slate-800 relative group cursor-pointer"
                      >
                        <img 
                          src={img.startsWith('http') ? img : `${API_BASE}${img}`}
                          alt={`证据 ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ZoomIn className="w-6 h-6 text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* AI Analysis */}
              {viewingAppeal.ai_analysis && viewingAppeal.ai_analysis.status === 'completed' && viewingAppeal.ai_analysis.result && (
                <div className="p-4 rounded-lg bg-gradient-to-br from-purple-900/30 to-slate-800 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                      <span className="text-lg font-medium text-purple-400">AI 智能分析</span>
                    </div>
                    <div className="flex gap-2">
                      {canRefreshAI && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewingAppeal && refreshAIAnalysis(viewingAppeal.appeal_id)}
                          className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}
                      {canDeleteAI && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewingAppeal && deleteAIAnalysis(viewingAppeal.appeal_id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">AI 建议:</span>
                      <Badge className={
                        viewingAppeal.ai_analysis.result!.recommendation.includes('通过') 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : viewingAppeal.ai_analysis.result!.recommendation.includes('拒绝')
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }>
                        {viewingAppeal.ai_analysis.result!.recommendation}
                      </Badge>
                      <span className="text-xs text-slate-500">置信度: {viewingAppeal.ai_analysis.result!.confidence}%</span>
                    </div>
                    
                    {viewingAppeal.ai_analysis.result!.summary && (
                      <div>
                        <p className="text-sm text-purple-400 font-medium">申诉要点</p>
                        <p className="text-sm text-slate-300">{viewingAppeal.ai_analysis.result!.summary}</p>
                      </div>
                    )}
                    
                    {viewingAppeal.ai_analysis.result!.reason_analysis && (
                      <div>
                        <p className="text-sm text-purple-400 font-medium">理由分析</p>
                        <p className="text-sm text-slate-300">{viewingAppeal.ai_analysis.result!.reason_analysis}</p>
                      </div>
                    )}
                    
                    {viewingAppeal.ai_analysis.result!.suggestions && (
                      <div>
                        <p className="text-sm text-purple-400 font-medium">处理建议</p>
                        <p className="text-sm text-slate-300">{viewingAppeal.ai_analysis.result!.suggestions}</p>
                      </div>
                    )}
                    
                    {viewingAppeal.ai_analysis.result!.risk_factors && viewingAppeal.ai_analysis.result!.risk_factors.length > 0 && (
                      <div>
                        <p className="text-sm text-purple-400 font-medium">风险提示</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {viewingAppeal.ai_analysis.result!.risk_factors.map((risk, idx) => (
                            <Badge key={idx} variant="outline" className="border-red-500/30 text-red-400 text-xs">{risk}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Review Info */}
              {viewingAppeal.review && (
                <div>
                  <span className="text-muted-foreground text-sm">审核信息:</span>
                  <div className="mt-2 bg-slate-800 rounded-lg p-4 space-y-2">
                    <p className="text-white">
                      <span className="text-muted-foreground">审核结果:</span>{' '}
                      {viewingAppeal.review.action === 'approve' ? '通过' : '拒绝'}
                    </p>
                    <p className="text-white">
                      <span className="text-muted-foreground">审核人:</span>{' '}
                      {viewingAppeal.review.admin_name} ({viewingAppeal.review.admin_id})
                    </p>
                    <p className="text-white">
                      <span className="text-muted-foreground">审核时间:</span>{' '}
                      {new Date(viewingAppeal.review.reviewed_at).toLocaleString()}
                    </p>
                    <p className="text-white">
                      <span className="text-muted-foreground">审核理由:</span>{' '}
                      {viewingAppeal.review.reason}
                    </p>
                  </div>
                </div>
              )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
