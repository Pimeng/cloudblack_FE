import { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { useUrlState } from '../hooks';
import { FileText, RefreshCw, Trash2, CheckCircle, XCircle, Eye, Sparkles, ZoomIn, Loader2, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useImageViewer } from '@/hooks/useImageViewer';
import type { AdminDataContext } from '../hooks/useAdminData';
import type { Appeal, AIAnalysisResult } from '../types';
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
  Pagination,
  AppealStatusBadge,
  AIRecommendationBadge,
} from '../components';
import { useExpandableDetail, useApiMutation } from '../hooks';

interface ClearProcessedResponse {
  deleted_count?: number;
}

interface BatchAIResponse {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  results: Array<{
    appeal_id: string;
    status: string;
    result?: AIAnalysisResult;
  }>;
}

export function AppealsPage() {
  const { 
    token, adminLevel,
    appeals, appealPage, setAppealPage, appealTotal,
    appealsPerPage, setAppealsPerPage, fetchAppeals, loading 
  } = useOutletContext<AdminDataContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // 从 URL 获取 status 状态和详情 ID
  const [appealFilter, setAppealFilter] = useUrlState<'all' | 'pending' | 'approved' | 'rejected'>('status', 'all');
  const detailId = searchParams.get('id');
  
  const { openImage } = useImageViewer();
  
  // Review dialog state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewReason, setReviewReason] = useState('');
  const [removeFromBlacklist, setRemoveFromBlacklist] = useState(true);
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAppeal, setDeletingAppeal] = useState<Appeal | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  
  // AI Analysis state
  const [aiAnalysisDetail, setAiAnalysisDetail] = useState<AIAnalysisResult | null>(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, appealPage, appealFilter, appealsPerPage]);

  const canReviewAppeals = adminLevel >= 2;
  const canManageBlacklist = adminLevel >= 3;
  const canClearProcessed = adminLevel >= 4;  // 仅超级管理员可操作
  const canRefreshAI = adminLevel >= 2;
  const canDeleteAI = adminLevel >= 3;
  const canBatchAI = adminLevel >= 2;  // 批量分析需要等级2+
  const appealTotalPages = appealsPerPage > 0 ? Math.ceil(appealTotal / appealsPerPage) : 0;
  
  // Clear processed dialog state
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearDays, setClearDays] = useState<number | ''>('');

  // API mutations
  const { mutate: submitReviewMutate, loading: submittingReview } = useApiMutation(token, {
    successMessage: '',
    showSuccessToast: false,
  });
  const { mutate: deleteAppealMutate, loading: deletingLoading } = useApiMutation(token, {
    successMessage: '申诉已删除',
  });
  const { mutate: clearProcessedMutate, loading: clearingLoading } = useApiMutation<ClearProcessedResponse>(token, {
    successMessage: '',
    showSuccessToast: false,
  });
  const { mutate: refreshAIMutate } = useApiMutation(token, {
    successMessage: 'AI 分析已刷新',
  });
  const { mutate: deleteAIMutate } = useApiMutation(token, {
    successMessage: 'AI 分析已删除',
  });
  const { mutate: batchAIMutate, loading: batchAILoading } = useApiMutation<BatchAIResponse>(token, {
    successMessage: '',
    showSuccessToast: false,
  });

  const openReviewDialog = (appeal: Appeal, action: 'approve' | 'reject') => {
    setSelectedAppeal(appeal);
    setReviewAction(action);
    setReviewReason('');
    setRemoveFromBlacklist(action === 'approve');
    setReviewDialogOpen(true);
  };
  
  const handleOpenDetail = useCallback((appeal: Appeal, appealId: string) => {
    openDetail(appeal, appealId);
    // 更新 URL 添加 id 参数
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set('id', appeal.appeal_id);
      return newParams;
    });
  }, [openDetail, setSearchParams]);
  
  const handleCloseDetail = useCallback(() => {
    closeDetail();
    // 清除 URL 中的 id 参数
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.delete('id');
      return newParams;
    });
  }, [closeDetail, setSearchParams]);

  // 页面加载时检查 URL 参数，自动打开详情
  useEffect(() => {
    if (detailId && appeals.length > 0 && !viewingItem) {
      const appeal = appeals.find((a) => a.appeal_id === detailId);
      if (appeal) {
        // 延迟一点执行，确保 DOM 已经渲染
        setTimeout(() => {
          openDetail(appeal, appeal.appeal_id);
        }, 100);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailId, appeals, viewingItem]);

  const submitReview = async () => {
    if (!selectedAppeal || !reviewReason.trim()) return;
    
    const result = await submitReviewMutate(
      `/api/admin/appeals/${selectedAppeal.appeal_id}/review`,
      { method: 'POST' },
      {
        action: reviewAction,
        reason: reviewReason,
        remove_from_blacklist: removeFromBlacklist,
      }
    );
    
    if (result) {
      toast.success(reviewAction === 'approve' ? '申诉已通过' : '申诉已拒绝');
      setReviewDialogOpen(false);
      fetchAppeals();
    }
  };

  const deleteAppeal = async () => {
    if (!deletingAppeal) return;
    
    const result = await deleteAppealMutate(
      `/api/admin/appeals/${deletingAppeal.appeal_id}`,
      { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      },
      { delete_reason: deleteReason.trim() || undefined }
    );
    
    if (result) {
      setDeleteDialogOpen(false);
      setDeleteReason('');
      fetchAppeals();
    }
  };

  const refreshAIAnalysis = async (appealId: string) => {
    const result = await refreshAIMutate(`/api/admin/appeals/${appealId}/ai-analysis`, {
      method: 'POST',
    });
    if (result) fetchAppeals();
  };

  const deleteAIAnalysis = async (appealId: string) => {
    const result = await deleteAIMutate(`/api/admin/appeals/${appealId}/ai-analysis`, {
      method: 'DELETE',
    });
    if (result) {
      setAiAnalysisDetail(null);
      fetchAppeals();
    }
  };
  
  // 获取AI分析详情
  const fetchAIAnalysisDetail = useCallback(async (appealId: string) => {
    if (!token) return;
    setAiAnalysisLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/appeals/${appealId}/ai-analysis`, {
        headers: { 'Authorization': token },
      });
      const data = await response.json();
      if (data.success && data.data) {
        setAiAnalysisDetail(data.data);
      }
    } catch (err) {
      console.error('获取AI分析详情失败:', err);
    } finally {
      setAiAnalysisLoading(false);
    }
  }, [token]);
  
  // 当打开详情时，如果AI分析已完成但没有详情，则获取
  useEffect(() => {
    if (detailOpen && viewingItem) {
      if (viewingItem.ai_analysis?.status === 'completed' && !viewingItem.ai_analysis?.result) {
        fetchAIAnalysisDetail(viewingItem.appeal_id);
      } else if (viewingItem.ai_analysis) {
        setAiAnalysisDetail(viewingItem.ai_analysis);
      } else {
        setAiAnalysisDetail(null);
      }
    } else {
      setAiAnalysisDetail(null);
    }
  }, [detailOpen, viewingItem, fetchAIAnalysisDetail]);
  
  const clearProcessedAppeals = async () => {
    const body: { days?: number } = {};
    if (clearDays !== '' && clearDays > 0) {
      body.days = clearDays;
    }
    
    const result = await clearProcessedMutate(
      '/api/admin/appeals/clear-processed',
      { method: 'POST' },
      body
    );
    
    if (result) {
      const deletedCount = result?.deleted_count || 0;
      if (deletedCount > 0) {
        toast.success(`已清理 ${deletedCount} 条已处理申诉`);
      } else {
        toast.info('没有需要清理的已处理申诉');
      }
      setClearDialogOpen(false);
      setClearDays('');
      fetchAppeals();
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
            className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
          >
            <option value="all">全部状态</option>
            <option value="pending">待审核</option>
            <option value="approved">已通过</option>
            <option value="rejected">已拒绝</option>
          </select>
          <Button onClick={() => fetchAppeals()} variant="outline" size="icon">
            <RefreshCw className="w-4 h-4" />
          </Button>
          {canBatchAI && (
            <Button 
              onClick={async () => {
                // 筛选出待审核且没有AI分析或AI分析失败的申诉
                const pendingAppeals = appeals.filter(
                  a => a.status === 'pending' && (!a.ai_analysis || a.ai_analysis.status === 'failed')
                );
                if (pendingAppeals.length === 0) {
                  toast.info('没有需要批量分析的待审核申诉');
                  return;
                }
                
                const result = await batchAIMutate(
                  '/api/admin/ai-analysis/batch',
                  { method: 'POST' },
                  {
                    appeals: pendingAppeals.map(a => ({
                      appeal_id: a.appeal_id,
                      user_id: a.user_id,
                      user_type: a.user_type,
                      content: a.content,
                      images: a.images,
                      created_at: a.created_at,
                    })),
                  }
                );
                
                if (result) {
                  const { total, completed, failed, pending } = result;
                  toast.success(`批量分析完成: 总计${total}条, 成功${completed}条, 失败${failed}条, 进行中${pending}条`);
                  fetchAppeals();
                }
              }}
              variant="outline" 
              disabled={batchAILoading}
              className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
            >
              {batchAILoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Bot className="w-4 h-4 mr-2" />
              )}
              批量AI分析
            </Button>
          )}
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
                className="glass rounded-2xl p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleOpenDetail(appeal, appeal.appeal_id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-foreground">
                        {appeal.user_type === 'group' ? '群号' : 'QQ'}: {appeal.user_id}
                      </span>
                      <AppealStatusBadge status={appeal.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      提交时间: {new Date(appeal.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Eye className="w-4 h-4" />
                    查看详情
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap break-words line-clamp-3">{appeal.content}</p>
                </div>
                
                {/* Images */}
                {appeal.images && appeal.images.length > 0 && (
                  <div className="flex gap-2 mb-4" onClick={(e) => e.stopPropagation()}>
                    {appeal.images.slice(0, 3).map((img, idx) => (
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
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ZoomIn className="w-5 h-5 text-foreground" />
                        </div>
                      </button>
                    ))}
                    {appeal.images.length > 3 && (
                      <span className="text-xs text-muted-foreground self-center">+{appeal.images.length - 3}</span>
                    )}
                  </div>
                )}
                
                {/* AI Analysis Summary */}
                {appeal.ai_analysis && (
                  <div className="mb-4 p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-card border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-purple-400">AI 建议</span>
                      {appeal.ai_analysis.status === 'pending' && (
                        <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 text-xs">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          分析中
                        </Badge>
                      )}
                      {appeal.ai_analysis.status === 'retrying' && (
                        <Badge variant="outline" className="border-orange-500/30 text-orange-400 text-xs">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          重试中
                        </Badge>
                      )}
                      {appeal.ai_analysis.status === 'failed' && (
                        <Badge variant="outline" className="border-red-500/30 text-red-400 text-xs">
                          分析失败
                        </Badge>
                      )}
                      {appeal.ai_analysis.status === 'completed' && (
                        (appeal.ai_analysis.recommendation || appeal.ai_analysis.result?.recommendation) ? (
                          <AIRecommendationBadge 
                            recommendation={appeal.ai_analysis.recommendation || appeal.ai_analysis.result?.recommendation || ''} 
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">分析完成</span>
                        )
                      )}
                    </div>
                    {/* AI Analysis Summary Content - 仅completed状态展示 */}
                    {appeal.ai_analysis.status === 'completed' && appeal.ai_analysis.result?.summary && (
                      <p className="text-xs text-foreground/80 line-clamp-2 mb-1">
                        <span className="text-purple-400">申诉要点：</span>
                        {appeal.ai_analysis.result.summary}
                      </p>
                    )}
                    {appeal.ai_analysis.status === 'completed' && appeal.ai_analysis.result?.confidence && (
                      <p className="text-xs text-muted-foreground">
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

          <Pagination
            page={appealPage}
            totalPages={appealTotalPages}
            onPageChange={(page) => setAppealPage(page)}
            perPage={appealsPerPage}
            onPerPageChange={(perPage) => { setAppealsPerPage(perPage); setAppealPage(1); }}
            showPerPage
          />
        </>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <AdminDialogContent>
          <DialogHeader>
            <DialogTitle>{reviewAction === 'approve' ? '通过申诉' : '拒绝申诉'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedAppeal && `处理用户 ${selectedAppeal.user_id} 的申诉`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <FormTextarea
              label="审核理由 *"
              value={reviewReason}
              onChange={(e) => setReviewReason(e.target.value)}
              placeholder="请详细说明您的审核理由，包括：&#10;- 通过：说明申诉成立的原因，如误封、已改正等&#10;- 拒绝：说明申诉不成立的具体原因"
              textareaClassName="min-h-[100px]"
            />

            {reviewAction === 'approve' && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <input type="checkbox" id="removeFromBlacklist" checked={removeFromBlacklist} onChange={(e) => setRemoveFromBlacklist(e.target.checked)} className="rounded border-border bg-muted" />
                  <label htmlFor="removeFromBlacklist" className="text-sm cursor-pointer font-medium text-green-400">同时从黑名单中移除该用户</label>
                </div>
                <p className="text-xs text-muted-foreground ml-5">
                  建议勾选：如果申诉通过，通常应该将用户从黑名单中移除
                </p>
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
            <DialogDescription className="text-muted-foreground">
              {deletingAppeal && `确定要删除用户 ${deletingAppeal.user_id} 的申诉吗？此操作不可恢复。`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-sm text-yellow-400 font-medium mb-1">⚠️ 警告</p>
              <p className="text-xs text-muted-foreground">删除申诉后，该记录将永久消失且无法恢复。此操作会被记录到审计日志。</p>
            </div>
            <FormTextarea
              label="删除原因（建议填写）"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="请说明删除原因，如：申诉内容涉及敏感信息、重复提交、测试数据等..."
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
            <DialogDescription className="text-muted-foreground">
              批量清理已处理的申诉记录以释放存储空间
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-400 font-medium mb-1">ℹ️ 说明</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>仅清理状态为<span className="text-green-400">已通过</span>或<span className="text-red-400">已拒绝</span>的申诉</li>
                <li><span className="text-yellow-400">待审核</span>的申诉不会被删除</li>
                <li>清理后的记录无法恢复，请谨慎操作</li>
              </ul>
            </div>
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
              hint="建议保留最近30天的记录以便查阅。输入天数阈值，只清理该天数前已处理的申诉。"
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
                  <p className="text-foreground font-mono">{viewingItem.appeal_id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">状态:</span>
                  <div className="mt-1"><AppealStatusBadge status={viewingItem.status} /></div>
                </div>
                <div>
                  <span className="text-muted-foreground">用户类型:</span>
                  <p className="text-foreground">{viewingItem.user_type === 'group' ? '群号' : '个人QQ'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">用户ID:</span>
                  <p className="text-foreground font-mono">{viewingItem.user_id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">联系邮箱:</span>
                  <p className="text-foreground">{viewingItem.contact_email || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">提交时间:</span>
                  <p className="text-foreground">{new Date(viewingItem.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Content */}
              <div>
                <span className="text-muted-foreground text-sm">申诉内容:</span>
                <div className="mt-2 bg-muted rounded-lg p-4">
                  <p className="text-foreground whitespace-pre-wrap break-words">{viewingItem.content}</p>
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
                        className="w-24 h-24 rounded-lg overflow-hidden bg-muted relative group cursor-pointer"
                      >
                        <img 
                          src={img.startsWith('http') ? img : `${API_BASE}${img}`}
                          alt={`证据 ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ZoomIn className="w-6 h-6 text-foreground" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* AI Analysis */}
              {viewingItem.ai_analysis && (
                <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-card border border-purple-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                      <span className="text-lg font-medium text-purple-400">AI 智能分析</span>
                      {viewingItem.ai_analysis.status === 'pending' && (
                        <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 text-xs">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          分析中
                        </Badge>
                      )}
                      {viewingItem.ai_analysis.status === 'retrying' && (
                        <Badge variant="outline" className="border-orange-500/30 text-orange-400 text-xs">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          重试中
                          {viewingItem.ai_analysis.retry_count !== undefined && (
                            <span className="ml-1">({viewingItem.ai_analysis.retry_count})</span>
                          )}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {canRefreshAI && viewingItem.ai_analysis.status === 'completed' && (
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
                  
                  {/* AI分析中 */}
                  {viewingItem.ai_analysis.status === 'pending' && (
                    <div className="flex items-center gap-3 text-muted-foreground py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                      <span>AI正在分析中，请稍后再查看...</span>
                    </div>
                  )}
                  
                  {/* AI重试中 */}
                  {viewingItem.ai_analysis.status === 'retrying' && (
                    <div className="flex items-center gap-3 text-orange-400 py-4">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <div>
                        <span>API调用失败，正在自动重试...</span>
                        {viewingItem.ai_analysis.retry_count !== undefined && (
                          <p className="text-xs text-muted-foreground mt-1">
                            第 {viewingItem.ai_analysis.retry_count} 次尝试
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* AI分析失败 */}
                  {viewingItem.ai_analysis.status === 'failed' && (
                    <div className="text-muted-foreground py-2">
                      <span className="text-red-400">分析失败</span>
                      {viewingItem.ai_analysis.error && (
                        <p className="text-sm mt-1">{viewingItem.ai_analysis.error}</p>
                      )}
                    </div>
                  )}
                  
                  {/* AI分析完成 - 获取详情中 */}
                  {viewingItem.ai_analysis.status === 'completed' && aiAnalysisLoading && (
                    <div className="flex items-center gap-3 text-muted-foreground py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                      <span>正在获取AI分析详情...</span>
                    </div>
                  )}
                  
                  {/* AI分析完成 - 展示详情 */}
                  {viewingItem.ai_analysis.status === 'completed' && !aiAnalysisLoading && (
                    <div className="space-y-3">
                      {/* 使用获取到的详情或列表中的简要信息 */}
                      {(aiAnalysisDetail?.result || viewingItem.ai_analysis.recommendation) && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">AI 建议:</span>
                          <Badge className={
                            (aiAnalysisDetail?.result?.recommendation || viewingItem.ai_analysis.recommendation || '').includes('通过') 
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : (aiAnalysisDetail?.result?.recommendation || viewingItem.ai_analysis.recommendation || '').includes('拒绝')
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          }>
                            {aiAnalysisDetail?.result?.recommendation || viewingItem.ai_analysis.recommendation}
                          </Badge>
                          {(aiAnalysisDetail?.result?.confidence || viewingItem.ai_analysis.result?.confidence) && (
                            <span className="text-xs text-muted-foreground">
                              置信度: {aiAnalysisDetail?.result?.confidence || viewingItem.ai_analysis.result?.confidence}%
                            </span>
                          )}
                        </div>
                      )}
                      
                      {aiAnalysisDetail?.result?.summary && (
                        <div>
                          <p className="text-sm text-purple-400 font-medium">申诉要点</p>
                          <p className="text-sm text-foreground/80">{aiAnalysisDetail.result.summary}</p>
                        </div>
                      )}
                      
                      {aiAnalysisDetail?.result?.reason_analysis && (
                        <div>
                          <p className="text-sm text-purple-400 font-medium">理由分析</p>
                          <p className="text-sm text-foreground/80">{aiAnalysisDetail.result.reason_analysis}</p>
                        </div>
                      )}
                      
                      {aiAnalysisDetail?.result?.suggestions && (
                        <div>
                          <p className="text-sm text-purple-400 font-medium">处理建议</p>
                          <p className="text-sm text-foreground/80">{aiAnalysisDetail.result.suggestions}</p>
                        </div>
                      )}
                      
                      {aiAnalysisDetail?.result?.risk_factors && aiAnalysisDetail.result.risk_factors.length > 0 && (
                        <div>
                          <p className="text-sm text-purple-400 font-medium">风险提示</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {aiAnalysisDetail.result.risk_factors.map((risk, idx) => (
                              <Badge key={idx} variant="outline" className="border-red-500/30 text-red-400 text-xs">{risk}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* 新增字段展示 */}
                      {(aiAnalysisDetail?.result?.category || aiAnalysisDetail?.result?.sentiment_score !== undefined || aiAnalysisDetail?.result?.evidence_strength !== undefined) && (
                        <div className="border-t border-border/50 pt-3 mt-3 space-y-2">
                          <p className="text-sm text-purple-400 font-medium">详细评估</p>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {aiAnalysisDetail?.result?.category && (
                              <div>
                                <span className="text-muted-foreground">申诉分类:</span>
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {aiAnalysisDetail.result.category}
                                </Badge>
                              </div>
                            )}
                            {aiAnalysisDetail?.result?.sentiment_score !== undefined && (
                              <div>
                                <span className="text-muted-foreground">情感评分:</span>
                                <span className="ml-2 text-foreground">
                                  {(aiAnalysisDetail.result.sentiment_score * 100).toFixed(0)}%
                                </span>
                              </div>
                            )}
                            {aiAnalysisDetail?.result?.evidence_strength !== undefined && (
                              <div>
                                <span className="text-muted-foreground">证据强度:</span>
                                <span className="ml-2 text-foreground">
                                  {aiAnalysisDetail.result.evidence_strength}%
                                </span>
                              </div>
                            )}
                            {aiAnalysisDetail?.result?.processing_time_ms !== undefined && (
                              <div>
                                <span className="text-muted-foreground">处理耗时:</span>
                                <span className="ml-2 text-foreground">
                                  {aiAnalysisDetail.result.processing_time_ms}ms
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {aiAnalysisDetail?.result?.parse_error && (
                        <div className="flex items-center gap-2 text-xs text-yellow-400 mt-2">
                          <span className="text-muted-foreground">解析状态:</span>
                          <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 text-xs">
                            解析异常
                          </Badge>
                          <span className="text-muted-foreground">(已自动修正)</span>
                        </div>
                      )}
                      
                      {/* 如果没有获取到详细结果，显示提示 */}
                      {!aiAnalysisDetail?.result && !viewingItem.ai_analysis.recommendation && (
                        <div className="text-muted-foreground py-2">
                          <span>暂无详细分析结果</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Review Info */}
              {viewingItem.review && (
                <div>
                  <span className="text-muted-foreground text-sm">审核信息:</span>
                  <div className="mt-2 bg-muted rounded-lg p-4 space-y-2">
                    <p className="text-foreground">
                      <span className="text-muted-foreground">审核结果:</span>{' '}
                      {viewingItem.review.action === 'approve' ? '通过' : '拒绝'}
                    </p>
                    <p className="text-foreground">
                      <span className="text-muted-foreground">审核人:</span>{' '}
                      {viewingItem.review.admin_name} ({viewingItem.review.admin_id})
                    </p>
                    <p className="text-foreground">
                      <span className="text-muted-foreground">审核时间:</span>{' '}
                      {new Date(viewingItem.review.reviewed_at).toLocaleString()}
                    </p>
                    <p className="text-foreground">
                      <span className="text-muted-foreground">审核理由:</span>{' '}
                      {viewingItem.review.reason}
                    </p>
                  </div>
                </div>
              )}
              
              {/* 操作按钮区域 */}
              <div className="pt-6 border-t border-border/50">
                <span className="text-muted-foreground text-sm mb-3 block">操作:</span>
                <div className="flex flex-wrap gap-3">
                  {/* 待审核状态显示通过/拒绝按钮 */}
                  {viewingItem.status === 'pending' && canReviewAppeals && (
                    <>
                      <Button 
                        onClick={() => openReviewDialog(viewingItem, 'approve')} 
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        通过申诉
                      </Button>
                      <Button 
                        onClick={() => openReviewDialog(viewingItem, 'reject')} 
                        variant="destructive"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        拒绝申诉
                      </Button>
                    </>
                  )}
                  {/* 删除按钮 - 待审核显示在通过拒绝后面，已处理状态单独显示 */}
                  {canManageBlacklist && (
                    <Button 
                      onClick={() => { 
                        setDeletingAppeal(viewingItem); 
                        setDeleteReason(''); 
                        setDeleteDialogOpen(true); 
                      }}
                      variant="outline"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      删除申诉
                    </Button>
                  )}
                </div>
              </div>
              </div>
            )}
      </DetailView>
    </div>
  );
}
