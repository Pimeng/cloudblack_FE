import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  ShieldAlert, 
  RefreshCw, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Eye, 
  ZoomIn,
  User,
  Users,
  Mail,
  Phone,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useImageViewer } from '@/hooks/useImageViewer';
import type { AdminDataContext } from '../hooks/useAdminData';
import type { BlacklistReport, BlacklistReportDetail, ReportAIAnalysisResult } from '../types';
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
  FormTextarea,
  Pagination,
} from '../components';
import { useApiMutation } from '../hooks';

interface ReviewDialogState {
  open: boolean;
  report: BlacklistReport | null;
  action: 'approve' | 'reject';
  reason: string;
  adminNote: string;
  addToBlacklist: boolean;
  level: number;
}

interface DeleteDialogState {
  open: boolean;
  report: BlacklistReport | null;
  reason: string;
}

// AI建议标签组件
function AIRecommendationBadge({ recommendation }: { recommendation: string }) {
  const isApprove = recommendation?.includes('通过');
  const isReject = recommendation?.includes('拒绝');
  
  return (
    <Badge className={
      isApprove 
        ? 'bg-green-500/20 text-green-400 border-green-500/30'
        : isReject
        ? 'bg-red-500/20 text-red-400 border-red-500/30'
        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    }>
      {recommendation}
    </Badge>
  );
}

export function BlacklistReportsPage() {
  const { 
    token, 
    adminLevel,
    blacklistReports, 
    blacklistReportsPage, 
    setBlacklistReportsPage, 
    blacklistReportsTotal,
    blacklistReportsFilter,
    setBlacklistReportsFilter,
    blacklistReportsPerPage,
    setBlacklistReportsPerPage,
    fetchBlacklistReports, 
    blacklistReportsLoading 
  } = useOutletContext<AdminDataContext>();
  
  const { openImage } = useImageViewer();
  
  // 详情弹窗状态
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailReport, setDetailReport] = useState<BlacklistReportDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // AI分析详情状态
  const [aiAnalysisDetail, setAiAnalysisDetail] = useState<ReportAIAnalysisResult | null>(null);
  const [aiAnalysisLoading] = useState(false);
  
  // 审核弹窗状态
  const [reviewDialog, setReviewDialog] = useState<ReviewDialogState>({
    open: false,
    report: null,
    action: 'approve',
    reason: '',
    adminNote: '',
    addToBlacklist: true,
    level: 2,
  });
  
  // 删除弹窗状态
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    open: false,
    report: null,
    reason: '',
  });

  useEffect(() => {
    if (token) fetchBlacklistReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, blacklistReportsPage, blacklistReportsFilter, blacklistReportsPerPage]);

  const canReviewReports = adminLevel >= 2;
  const canDeleteReports = adminLevel >= 3;
  const canRefreshAI = adminLevel >= 2;
  const canDeleteAI = adminLevel >= 3;
  const reportsTotalPages = blacklistReportsPerPage > 0 ? Math.ceil(blacklistReportsTotal / blacklistReportsPerPage) : 0;

  // API mutations
  interface ReviewResponse {
    report_id: string;
    status: string;
    added_to_blacklist?: boolean | 'level4_pending';
  }
  
  const { mutate: reviewReportMutate, loading: reviewingLoading } = useApiMutation<ReviewResponse>(token, {
    successMessage: '',
    showSuccessToast: false,
  });
  const { mutate: deleteReportMutate, loading: deletingLoading } = useApiMutation(token, {
    successMessage: '举报已删除',
  });
  const { mutate: refreshAIMutate } = useApiMutation(token, {
    successMessage: 'AI 分析已刷新',
  });
  const { mutate: deleteAIMutate } = useApiMutation(token, {
    successMessage: 'AI 分析已删除',
  });

  // 获取举报详情
  const fetchReportDetail = useCallback(async (reportId: string) => {
    if (!token) return;
    setDetailLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/blacklist/reports/${reportId}`, {
        headers: { 'Authorization': token },
      });
      const data = await response.json();
      if (data.success && data.data) {
        setDetailReport(data.data);
        setAiAnalysisDetail(data.data.ai_analysis || null);
        setDetailOpen(true);
      } else {
        toast.error(data.message || '获取举报详情失败');
      }
    } catch (err) {
      toast.error('获取举报详情失败');
    } finally {
      setDetailLoading(false);
    }
  }, [token]);



  // 刷新AI分析
  const refreshAIAnalysis = async (reportId: string) => {
    const result = await refreshAIMutate(`/api/admin/blacklist/reports/${reportId}/ai-analysis`, {
      method: 'POST',
    });
    if (result) {
      setAiAnalysisDetail(result as ReportAIAnalysisResult);
      fetchBlacklistReports();
    }
  };

  // 删除AI分析
  const deleteAIAnalysis = async (reportId: string) => {
    const result = await deleteAIMutate(`/api/admin/blacklist/reports/${reportId}/ai-analysis`, {
      method: 'DELETE',
    });
    if (result) {
      setAiAnalysisDetail(null);
      fetchBlacklistReports();
    }
  };

  // 提交审核
  const submitReview = async () => {
    if (!reviewDialog.report || !reviewDialog.reason.trim()) return;
    
    const result = await reviewReportMutate(
      `/api/admin/blacklist/reports/${reviewDialog.report.report_id}/review`,
      { method: 'POST' },
      {
        action: reviewDialog.action,
        reason: reviewDialog.reason,
        admin_note: reviewDialog.adminNote || undefined,
        add_to_blacklist: reviewDialog.action === 'approve' ? reviewDialog.addToBlacklist : undefined,
        level: reviewDialog.action === 'approve' && reviewDialog.addToBlacklist ? reviewDialog.level : undefined,
      }
    );
    
    if (result) {
      const message = reviewDialog.action === 'approve' 
        ? (result.added_to_blacklist === 'level4_pending' ? '举报已批准，等待等级4确认' : '举报已批准')
        : '举报已拒绝';
      toast.success(message);
      setReviewDialog({ ...reviewDialog, open: false, reason: '', adminNote: '' });
      fetchBlacklistReports();
    }
  };

  // 删除举报
  const deleteReport = async () => {
    if (!deleteDialog.report) return;
    
    const result = await deleteReportMutate(
      `/api/admin/blacklist/reports/${deleteDialog.report.report_id}`,
      { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      },
      { delete_reason: deleteDialog.reason.trim() || undefined }
    );
    
    if (result) {
      setDeleteDialog({ open: false, report: null, reason: '' });
      fetchBlacklistReports();
    }
  };

  // 打开审核弹窗
  const openReviewDialog = (report: BlacklistReport, action: 'approve' | 'reject') => {
    setReviewDialog({
      open: true,
      report,
      action,
      reason: '',
      adminNote: '',
      addToBlacklist: true,
      level: 2,
    });
  };

  // 打开删除弹窗
  const openDeleteDialog = (report: BlacklistReport) => {
    setDeleteDialog({ open: true, report, reason: '' });
  };

  // 状态标签
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">待处理</Badge>;
      case 'approved':
        return <Badge variant="outline" className="border-green-500/30 text-green-400">已通过</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="border-red-500/30 text-red-400">已拒绝</Badge>;
      default:
        return null;
    }
  };

  // 类型标签
  const getTypeBadge = (type: string) => {
    return type === 'group' 
      ? <Badge variant="outline" className="border-blue-500/30 text-blue-400"><Users className="w-3 h-3 mr-1" />群聊</Badge>
      : <Badge variant="outline" className="border-purple-500/30 text-purple-400"><User className="w-3 h-3 mr-1" />个人</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="用户举报管理" description="审核用户提交的举报">
        <div className="flex flex-wrap gap-2">
          <select
            value={blacklistReportsFilter}
            onChange={(e) => {
              setBlacklistReportsFilter(e.target.value as any);
              setBlacklistReportsPage(1);
            }}
            className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
          >
            <option value="all">全部状态</option>
            <option value="pending">待处理</option>
            <option value="approved">已通过</option>
            <option value="rejected">已拒绝</option>
          </select>
          <Button onClick={() => fetchBlacklistReports()} variant="outline" size="icon">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </PageHeader>

      {blacklistReportsLoading ? (
        <LoadingSpinner />
      ) : blacklistReports.length === 0 ? (
        <EmptyState icon={ShieldAlert} description="暂无举报" />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {blacklistReports.map((report: BlacklistReport & { ai_analysis?: ReportAIAnalysisResult }) => (
              <div 
                key={report.report_id} 
                className="glass rounded-2xl p-6 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeBadge(report.target_user_type)}
                      <span className="font-semibold text-foreground">
                        {report.target_user_id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(report.status)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap break-words line-clamp-3">
                    {report.reason}
                  </p>
                </div>
                
                {/* AI Analysis Summary */}
                {report.ai_analysis && (
                  <div className="mb-4 p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-card border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-purple-400">AI 建议</span>
                      {report.ai_analysis.status === 'pending' && (
                        <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 text-xs">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          分析中
                        </Badge>
                      )}
                      {report.ai_analysis.status === 'failed' && (
                        <Badge variant="outline" className="border-red-500/30 text-red-400 text-xs">
                          分析失败
                        </Badge>
                      )}
                      {report.ai_analysis.status === 'completed' && (
                        (report.ai_analysis.recommendation || report.ai_analysis.result?.recommendation) ? (
                          <AIRecommendationBadge 
                            recommendation={report.ai_analysis.recommendation || report.ai_analysis.result?.recommendation || ''} 
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">分析完成</span>
                        )
                      )}
                    </div>
                    {/* AI Analysis Summary Content - 仅completed状态展示 */}
                    {report.ai_analysis.status === 'completed' && report.ai_analysis.result?.summary && (
                      <p className="text-xs text-foreground/80 line-clamp-2 mb-1">
                        <span className="text-purple-400">举报要点：</span>
                        {report.ai_analysis.result.summary}
                      </p>
                    )}
                    {report.ai_analysis.status === 'completed' && report.ai_analysis.result?.confidence && (
                      <p className="text-xs text-muted-foreground">
                        置信度：{report.ai_analysis.result.confidence}%
                      </p>
                    )}
                  </div>
                )}
                
                {/* 证据图片预览 */}
                {report.evidence && report.evidence.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    {report.evidence.slice(0, 3).map((img, idx) => (
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
                    {report.evidence.length > 3 && (
                      <span className="text-xs text-muted-foreground self-center">+{report.evidence.length - 3}</span>
                    )}
                  </div>
                )}

                {/* 举报人信息 */}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
                  {report.reporter_contact && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {report.reporter_contact}
                    </span>
                  )}
                  {report.reporter_user_id && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {report.reporter_user_id}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => fetchReportDetail(report.report_id)} 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    查看详情
                  </Button>
                  {report.status === 'pending' && canReviewReports && (
                    <>
                      <Button 
                        onClick={() => openReviewDialog(report, 'approve')} 
                        className="bg-green-600 hover:bg-green-700" 
                        size="sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        通过
                      </Button>
                      <Button 
                        onClick={() => openReviewDialog(report, 'reject')} 
                        variant="destructive" 
                        size="sm"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        拒绝
                      </Button>
                    </>
                  )}
                  {canDeleteReports && (
                    <Button 
                      onClick={() => openDeleteDialog(report)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={blacklistReportsPage}
            totalPages={reportsTotalPages}
            onPageChange={(page) => setBlacklistReportsPage(page)}
            perPage={blacklistReportsPerPage}
            onPerPageChange={(perPage) => { setBlacklistReportsPerPage(perPage); setBlacklistReportsPage(1); }}
            showPerPage
          />
        </>
      )}

      {/* 详情弹窗 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <AdminDialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>举报详情</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {detailReport && `举报ID: ${detailReport.report_id}`}
            </DialogDescription>
          </DialogHeader>
          
          {detailLoading ? (
            <LoadingSpinner />
          ) : detailReport ? (
            <div className="space-y-6 py-4">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">被举报者类型:</span>
                  <p className="text-foreground">{getTypeBadge(detailReport.target_user_type)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">被举报者ID:</span>
                  <p className="text-foreground font-mono">{detailReport.target_user_id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">状态:</span>
                  <p className="text-foreground">{getStatusBadge(detailReport.status)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">提交时间:</span>
                  <p className="text-foreground">{new Date(detailReport.created_at).toLocaleString()}</p>
                </div>
                {detailReport.reporter_contact && (
                  <div>
                    <span className="text-muted-foreground">举报人邮箱:</span>
                    <p className="text-foreground">{detailReport.reporter_contact}</p>
                  </div>
                )}
                {detailReport.reporter_user_id && (
                  <div>
                    <span className="text-muted-foreground">举报人ID:</span>
                    <p className="text-foreground font-mono">{detailReport.reporter_user_id}</p>
                  </div>
                )}
              </div>

              {/* 举报原因 */}
              <div>
                <span className="text-muted-foreground text-sm">举报原因:</span>
                <div className="mt-2 bg-muted rounded-lg p-4">
                  <p className="text-foreground whitespace-pre-wrap break-words">{detailReport.reason}</p>
                </div>
              </div>

              {/* AI 智能分析 */}
              {(aiAnalysisDetail || detailReport.ai_analysis) && (
                <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-card border border-purple-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                      <span className="text-lg font-medium text-purple-400">AI 智能分析</span>
                      {(aiAnalysisDetail || detailReport.ai_analysis)?.status === 'pending' && (
                        <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 text-xs">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          分析中
                        </Badge>
                      )}
                      {(aiAnalysisDetail || detailReport.ai_analysis)?.status === 'failed' && (
                        <Badge variant="outline" className="border-red-500/30 text-red-400 text-xs">
                          分析失败
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {canRefreshAI && (aiAnalysisDetail?.status === 'completed' || detailReport.ai_analysis?.status === 'completed') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => detailReport && refreshAIAnalysis(detailReport.report_id)}
                          className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}
                      {canDeleteAI && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => detailReport && deleteAIAnalysis(detailReport.report_id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* AI分析中 */}
                  {((aiAnalysisDetail?.status === 'pending') || (!aiAnalysisDetail && detailReport.ai_analysis?.status === 'pending')) && (
                    <div className="flex items-center gap-3 text-muted-foreground py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                      <span>AI正在分析中，请稍后再查看...</span>
                    </div>
                  )}
                  
                  {/* AI分析失败 */}
                  {((aiAnalysisDetail?.status === 'failed') || (!aiAnalysisDetail && detailReport.ai_analysis?.status === 'failed')) && (
                    <div className="text-muted-foreground py-2">
                      <span className="text-red-400">分析失败</span>
                      {(aiAnalysisDetail?.error || detailReport.ai_analysis?.error) && (
                        <p className="text-sm mt-1">{aiAnalysisDetail?.error || detailReport.ai_analysis?.error}</p>
                      )}
                    </div>
                  )}
                  
                  {/* AI分析完成 - 获取详情中 */}
                  {aiAnalysisLoading && (
                    <div className="flex items-center gap-3 text-muted-foreground py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                      <span>正在获取AI分析详情...</span>
                    </div>
                  )}
                  
                  {/* AI分析完成 - 展示详情 */}
                  {((aiAnalysisDetail?.status === 'completed' && !aiAnalysisLoading) || 
                    (!aiAnalysisDetail && detailReport.ai_analysis?.status === 'completed')) && (
                    <div className="space-y-3">
                      {((aiAnalysisDetail?.result?.recommendation || detailReport.ai_analysis?.result?.recommendation)) && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">AI 建议:</span>
                          <AIRecommendationBadge 
                            recommendation={aiAnalysisDetail?.result?.recommendation || detailReport.ai_analysis?.result?.recommendation || ''} 
                          />
                          {(aiAnalysisDetail?.result?.confidence || detailReport.ai_analysis?.result?.confidence) && (
                            <span className="text-xs text-muted-foreground">
                              置信度: {aiAnalysisDetail?.result?.confidence || detailReport.ai_analysis?.result?.confidence}%
                            </span>
                          )}
                        </div>
                      )}
                      
                      {(aiAnalysisDetail?.result?.summary || detailReport.ai_analysis?.result?.summary) && (
                        <div>
                          <p className="text-sm text-purple-400 font-medium">举报要点</p>
                          <p className="text-sm text-foreground/80">
                            {aiAnalysisDetail?.result?.summary || detailReport.ai_analysis?.result?.summary}
                          </p>
                        </div>
                      )}
                      
                      {(aiAnalysisDetail?.result?.reason_analysis || detailReport.ai_analysis?.result?.reason_analysis) && (
                        <div>
                          <p className="text-sm text-purple-400 font-medium">理由分析</p>
                          <p className="text-sm text-foreground/80">
                            {aiAnalysisDetail?.result?.reason_analysis || detailReport.ai_analysis?.result?.reason_analysis}
                          </p>
                        </div>
                      )}
                      
                      {(aiAnalysisDetail?.result?.category || detailReport.ai_analysis?.result?.category) && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">举报类别:</span>
                          <Badge variant="outline" className="text-xs">
                            {aiAnalysisDetail?.result?.category || detailReport.ai_analysis?.result?.category}
                          </Badge>
                        </div>
                      )}
                      
                      {(aiAnalysisDetail?.result?.evidence_strength || detailReport.ai_analysis?.result?.evidence_strength) !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">证据强度:</span>
                          <span className="text-sm text-foreground">
                            {(aiAnalysisDetail?.result?.evidence_strength || detailReport.ai_analysis?.result?.evidence_strength)}%
                          </span>
                        </div>
                      )}
                      
                      {(aiAnalysisDetail?.result?.risk_factors || detailReport.ai_analysis?.result?.risk_factors) && 
                       (aiAnalysisDetail?.result?.risk_factors || detailReport.ai_analysis?.result?.risk_factors || []).length > 0 && (
                        <div>
                          <p className="text-sm text-purple-400 font-medium">风险提示</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {(aiAnalysisDetail?.result?.risk_factors || detailReport.ai_analysis?.result?.risk_factors || []).map((risk: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="border-red-500/30 text-red-400 text-xs">{risk}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {(aiAnalysisDetail?.result?.suggestions || detailReport.ai_analysis?.result?.suggestions) && (
                        <div>
                          <p className="text-sm text-purple-400 font-medium">处理建议</p>
                          <p className="text-sm text-foreground/80">
                            {aiAnalysisDetail?.result?.suggestions || detailReport.ai_analysis?.result?.suggestions}
                          </p>
                        </div>
                      )}
                      
                      {/* 如果没有获取到详细结果，显示提示 */}
                      {!aiAnalysisDetail?.result && !detailReport.ai_analysis?.result && (
                        <div className="text-muted-foreground py-2">
                          <span>暂无详细分析结果</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 证据图片 */}
              {detailReport.evidence && detailReport.evidence.length > 0 && (
                <div>
                  <span className="text-muted-foreground text-sm">证据图片:</span>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {detailReport.evidence.map((img, idx) => (
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

              {/* 审核信息 */}
              {detailReport.review && (
                <div>
                  <span className="text-muted-foreground text-sm">审核信息:</span>
                  <div className="mt-2 bg-muted rounded-lg p-4 space-y-2">
                    <p className="text-foreground">
                      <span className="text-muted-foreground">审核结果:</span>{' '}
                      {detailReport.review.action === 'approved' ? '通过' : '拒绝'}
                    </p>
                    <p className="text-foreground">
                      <span className="text-muted-foreground">审核人:</span>{' '}
                      {detailReport.review.admin_name} ({detailReport.review.admin_id})
                    </p>
                    <p className="text-foreground">
                      <span className="text-muted-foreground">审核时间:</span>{' '}
                      {new Date(detailReport.review.reviewed_at).toLocaleString()}
                    </p>
                    <p className="text-foreground">
                      <span className="text-muted-foreground">审核理由:</span>{' '}
                      {detailReport.review.reason}
                    </p>
                  </div>
                </div>
              )}

              {/* 管理员备注 */}
              {detailReport.admin_note && (
                <div>
                  <span className="text-muted-foreground text-sm">管理员备注:</span>
                  <div className="mt-2 bg-muted rounded-lg p-4">
                    <p className="text-foreground">{detailReport.admin_note}</p>
                  </div>
                </div>
              )}
            </div>
          ) : null}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>关闭</Button>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>

      {/* 审核弹窗 */}
      <Dialog open={reviewDialog.open} onOpenChange={(open) => setReviewDialog({ ...reviewDialog, open })}>
        <AdminDialogContent>
          <DialogHeader>
            <DialogTitle>{reviewDialog.action === 'approve' ? '批准举报' : '拒绝举报'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {reviewDialog.report && `处理对 ${reviewDialog.report.target_user_id} 的举报`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <FormTextarea
              label="审核理由"
              value={reviewDialog.reason}
              onChange={(e) => setReviewDialog({ ...reviewDialog, reason: e.target.value })}
              placeholder="请输入审核理由..."
              textareaClassName="min-h-[100px]"
            />
            
            <FormTextarea
              label="管理员备注（仅内部可见）"
              value={reviewDialog.adminNote}
              onChange={(e) => setReviewDialog({ ...reviewDialog, adminNote: e.target.value })}
              placeholder="可选，仅管理员可见..."
              textareaClassName="min-h-[80px]"
            />

            {reviewDialog.action === 'approve' && (
              <>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="addToBlacklist" 
                    checked={reviewDialog.addToBlacklist} 
                    onChange={(e) => setReviewDialog({ ...reviewDialog, addToBlacklist: e.target.checked })} 
                    className="rounded border-border bg-muted" 
                  />
                  <label htmlFor="addToBlacklist" className="text-sm cursor-pointer">同时将被举报者加入黑名单</label>
                </div>
                
                {reviewDialog.addToBlacklist && (
                  <div className="space-y-2">
                    <label className="text-sm">黑名单等级</label>
                    <select
                      value={reviewDialog.level}
                      onChange={(e) => setReviewDialog({ ...reviewDialog, level: parseInt(e.target.value) })}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                    >
                      <option value={1}>等级1 - 轻微违规</option>
                      <option value={2}>等级2 - 一般违规</option>
                      <option value={3}>等级3 - 严重违规</option>
                      <option value={4}>等级4 - 极端违规（需双管理员确认）</option>
                    </select>
                    {reviewDialog.level === 4 && (
                      <p className="text-xs text-yellow-500">
                        等级4需要另一名管理员确认后才会生效
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog({ ...reviewDialog, open: false })}>取消</Button>
            <LoadingButton
              onClick={submitReview}
              loading={reviewingLoading}
              icon={reviewDialog.action === 'approve' ? CheckCircle : XCircle}
              disabled={!reviewDialog.reason.trim()}
              className={reviewDialog.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {reviewDialog.action === 'approve' ? '确认批准' : '确认拒绝'}
            </LoadingButton>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>

      {/* 删除弹窗 */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AdminDialogContent>
          <DialogHeader>
            <DialogTitle>删除举报</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {deleteDialog.report && `确定要删除对 ${deleteDialog.report.target_user_id} 的举报吗？此操作不可恢复。`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <FormTextarea
              label="删除原因（可选）"
              value={deleteDialog.reason}
              onChange={(e) => setDeleteDialog({ ...deleteDialog, reason: e.target.value })}
              placeholder="请输入删除原因，如：重复举报，已合并处理..."
              textareaClassName="min-h-[80px]"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}>取消</Button>
            <LoadingButton
              onClick={deleteReport}
              loading={deletingLoading}
              icon={Trash2}
              variant="destructive"
            >
              确认删除
            </LoadingButton>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>
    </div>
  );
}
