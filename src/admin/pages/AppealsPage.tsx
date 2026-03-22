import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FileText, RefreshCw, Trash2, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, Eye, Sparkles, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useImageViewer } from '@/hooks/useImageViewer';
import type { AdminDataContext } from '../hooks/useAdminData';
import type { Appeal } from '../types';
import { API_BASE } from '../types';
import { toast } from 'sonner';
import {
  LoadingSpinner,
  EmptyState,
  AdminDialogContent,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  LoadingButton,
  PageHeader,
  FormInput,
  FormTextarea,
  AnimationLayer,
  DetailView,
} from '../components';
import { useExpandableDetail } from '../hooks';

export function AppealsPage() {
  const { 
    token, adminLevel,
    appeals, appealPage, setAppealPage, appealTotal, appealFilter, setAppealFilter,
    appealsPerPage, setAppealsPerPage, fetchAppeals, loading 
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
  const [deleteReason, setDeleteReason] = useState('');
  const [deletingLoading, setDeletingLoading] = useState(false);
  
  // viewingItem is now from useExpandableDetail hook
  
  // Use expandable detail hook
  const {
    isOpen: detailOpen,
    viewingItem,
    animating,
    animationPhase,
    cardRect,
    refs: cardRefs,
    openDetail,
    closeDetail,
  } = useExpandableDetail<Appeal>();

  useEffect(() => {
    if (token) fetchAppeals();
  }, [token, appealPage, appealFilter, appealsPerPage]);

  const canReviewAppeals = adminLevel >= 2;
  const canManageBlacklist = adminLevel >= 3;
  const canClearProcessed = adminLevel >= 4;  // 仅超级管理员可操作
  const canRefreshAI = adminLevel >= 2;
  const canDeleteAI = adminLevel >= 3;
  const appealTotalPages = appealsPerPage > 0 ? Math.ceil(appealTotal / appealsPerPage) : 0;
  
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
  
  const handleOpenDetail = (appeal: Appeal, appealId: string) => {
    openDetail(appeal, appealId);
  };
  
  const handleCloseDetail = () => {
    closeDetail();
  };

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
        headers: { 
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          delete_reason: deleteReason.trim() || undefined 
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('申诉已删除');
        setDeleteDialogOpen(false);
        setDeleteReason('');
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
      <PageHeader title="申诉管理" description="审核用户申诉请求">
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
      </PageHeader>

      {loading ? (
        <LoadingSpinner />
      ) : appeals.length === 0 ? (
        <EmptyState icon={FileText} description="暂无申诉记录" />
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
                onClick={() => handleOpenDetail(appeal, appeal.appeal_id)}
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
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">每页显示</span>
                <select
                  value={appealsPerPage}
                  onChange={(e) => { setAppealsPerPage(Number(e.target.value)); setAppealPage(1); }}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-muted-foreground">条</span>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={() => setAppealPage(p => Math.max(1, p - 1))} disabled={appealPage === 1} variant="outline" size="icon">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">第 {appealPage} / {appealTotalPages || 1} 页</span>
                <Button onClick={() => setAppealPage(p => Math.min(appealTotalPages, p + 1))} disabled={appealPage === appealTotalPages || appealTotalPages === 0} variant="outline" size="icon">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <AdminDialogContent>
          <DialogHeader>
            <DialogTitle>{reviewAction === 'approve' ? '通过申诉' : '拒绝申诉'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedAppeal && `处理用户 ${selectedAppeal.user_id} 的申诉`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <FormTextarea
              label="审核理由"
              value={reviewReason}
              onChange={(e) => setReviewReason(e.target.value)}
              placeholder="请输入审核理由..."
              textareaClassName="min-h-[100px]"
            />

            {reviewAction === 'approve' && (
              <div className="flex items-center gap-2">
                <input type="checkbox" id="removeFromBlacklist" checked={removeFromBlacklist} onChange={(e) => setRemoveFromBlacklist(e.target.checked)} className="rounded border-slate-700 bg-slate-800" />
                <label htmlFor="removeFromBlacklist" className="text-sm cursor-pointer">同时从黑名单中移除该用户</label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>取消</Button>
            <LoadingButton
              onClick={submitReview}
              loading={submittingReview}
              icon={reviewAction === 'approve' ? CheckCircle : XCircle}
              disabled={!reviewReason.trim()}
              className={reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {reviewAction === 'approve' ? '确认通过' : '确认拒绝'}
            </LoadingButton>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AdminDialogContent>
          <DialogHeader>
            <DialogTitle>删除申诉</DialogTitle>
            <DialogDescription className="text-slate-400">
              {deletingAppeal && `确定要删除用户 ${deletingAppeal.user_id} 的申诉吗？此操作不可恢复。`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <FormTextarea
              label="删除原因（可选）"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="请输入删除原因，如：申诉内容涉及敏感信息，应用户要求删除..."
              textareaClassName="min-h-[80px]"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
            <LoadingButton
              onClick={deleteAppeal}
              loading={deletingLoading}
              icon={Trash2}
              variant="destructive"
            >
              确认删除
            </LoadingButton>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>
      
      {/* Clear Processed Dialog */}
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AdminDialogContent>
          <DialogHeader>
            <DialogTitle>清理已处理申诉</DialogTitle>
            <DialogDescription className="text-slate-400">
              清理所有已批准和已拒绝的申诉记录。待审核的申诉不会被删除。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <FormInput
              label="清理范围（可选）"
              type="number"
              min={0}
              placeholder="输入天数，如：30（只清理30天前的记录），留空则清理所有"
              value={clearDays}
              onChange={(e) => {
                const val = e.target.value;
                setClearDays(val === '' ? '' : parseInt(val) || 0);
              }}
              hint="输入天数阈值，只清理该天数前已处理的申诉。留空则清理所有已处理的申诉。"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDialogOpen(false)}>取消</Button>
            <LoadingButton
              onClick={clearProcessedAppeals}
              loading={clearingLoading}
              icon={Trash2}
              variant="destructive"
            >
              确认清理
            </LoadingButton>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>
      
      {/* Animation Layer */}
      <AnimationLayer
        animating={animating}
        cardRect={cardRect}
        animationPhase={animationPhase}
      />
      
      {/* Detail Dialog */}
      <DetailView
        isOpen={detailOpen}
        title="申诉详情"
        onClose={handleCloseDetail}
      >
        {viewingItem && (
              <div className="space-y-6 py-6 px-8 max-w-6xl mx-auto pb-20">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">申诉ID:</span>
                  <p className="text-white font-mono">{viewingItem.appeal_id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">状态:</span>
                  <div className="mt-1">{getStatusBadge(viewingItem.status)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">用户类型:</span>
                  <p className="text-white">{viewingItem.user_type === 'group' ? '群号' : '个人QQ'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">用户ID:</span>
                  <p className="text-white font-mono">{viewingItem.user_id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">联系邮箱:</span>
                  <p className="text-white">{viewingItem.contact_email || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">提交时间:</span>
                  <p className="text-white">{new Date(viewingItem.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Content */}
              <div>
                <span className="text-muted-foreground text-sm">申诉内容:</span>
                <div className="mt-2 bg-slate-800 rounded-lg p-4">
                  <p className="text-white whitespace-pre-wrap break-words">{viewingItem.content}</p>
                </div>
              </div>

              {/* Images */}
              {viewingItem.images && viewingItem.images.length > 0 && (
                <div>
                  <span className="text-muted-foreground text-sm">相关截图:</span>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {viewingItem.images.map((img, idx) => (
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
              {viewingItem.ai_analysis && viewingItem.ai_analysis.status === 'completed' && viewingItem.ai_analysis.result && (
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
                          onClick={() => viewingItem && refreshAIAnalysis(viewingItem.appeal_id)}
                          className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}
                      {canDeleteAI && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewingItem && deleteAIAnalysis(viewingItem.appeal_id)}
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
                        viewingItem.ai_analysis.result!.recommendation.includes('通过') 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : viewingItem.ai_analysis.result!.recommendation.includes('拒绝')
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }>
                        {viewingItem.ai_analysis.result!.recommendation}
                      </Badge>
                      <span className="text-xs text-slate-500">置信度: {viewingItem.ai_analysis.result!.confidence}%</span>
                    </div>
                    
                    {viewingItem.ai_analysis.result!.summary && (
                      <div>
                        <p className="text-sm text-purple-400 font-medium">申诉要点</p>
                        <p className="text-sm text-slate-300">{viewingItem.ai_analysis.result!.summary}</p>
                      </div>
                    )}
                    
                    {viewingItem.ai_analysis.result!.reason_analysis && (
                      <div>
                        <p className="text-sm text-purple-400 font-medium">理由分析</p>
                        <p className="text-sm text-slate-300">{viewingItem.ai_analysis.result!.reason_analysis}</p>
                      </div>
                    )}
                    
                    {viewingItem.ai_analysis.result!.suggestions && (
                      <div>
                        <p className="text-sm text-purple-400 font-medium">处理建议</p>
                        <p className="text-sm text-slate-300">{viewingItem.ai_analysis.result!.suggestions}</p>
                      </div>
                    )}
                    
                    {viewingItem.ai_analysis.result!.risk_factors && viewingItem.ai_analysis.result!.risk_factors.length > 0 && (
                      <div>
                        <p className="text-sm text-purple-400 font-medium">风险提示</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {viewingItem.ai_analysis.result!.risk_factors.map((risk, idx) => (
                            <Badge key={idx} variant="outline" className="border-red-500/30 text-red-400 text-xs">{risk}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Review Info */}
              {viewingItem.review && (
                <div>
                  <span className="text-muted-foreground text-sm">审核信息:</span>
                  <div className="mt-2 bg-slate-800 rounded-lg p-4 space-y-2">
                    <p className="text-white">
                      <span className="text-muted-foreground">审核结果:</span>{' '}
                      {viewingItem.review.action === 'approve' ? '通过' : '拒绝'}
                    </p>
                    <p className="text-white">
                      <span className="text-muted-foreground">审核人:</span>{' '}
                      {viewingItem.review.admin_name} ({viewingItem.review.admin_id})
                    </p>
                    <p className="text-white">
                      <span className="text-muted-foreground">审核时间:</span>{' '}
                      {new Date(viewingItem.review.reviewed_at).toLocaleString()}
                    </p>
                    <p className="text-white">
                      <span className="text-muted-foreground">审核理由:</span>{' '}
                      {viewingItem.review.reason}
                    </p>
                  </div>
                </div>
              )}
              </div>
            )}
      </DetailView>
    </div>
  );
}
