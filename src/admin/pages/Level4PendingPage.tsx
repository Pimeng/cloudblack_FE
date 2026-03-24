import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ShieldAlert, CheckCircle, XCircle, UserCheck, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AdminDataContext } from '../hooks/useAdminData';
import type { Level4PendingItem } from '../types';
import { toast } from 'sonner';
import { API_BASE } from '../types';
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
  SimplePagination,
  Level4StatusBadge,
  UserTypeBadge,
} from '../components';
import { useApiMutation } from '../hooks';

export function Level4PendingPage() {
  const { token, adminInfo, adminLevel } = useOutletContext<AdminDataContext>();
  
  const [pendingItems, setPendingItems] = useState<Level4PendingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'confirmed' | 'cancelled' | 'all'>('pending');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 20;
  
  // Confirm dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmingItem, setConfirmingItem] = useState<Level4PendingItem | null>(null);
  // Cancel dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellingItem, setCancellingItem] = useState<Level4PendingItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  
  // API mutations
  const { mutate: confirmMutate, loading: confirmingLoading } = useApiMutation(token, {
    successMessage: '确认成功，该用户已正式加入黑名单',
  });
  const { mutate: cancelMutate, loading: cancellingLoading } = useApiMutation(token, {
    successMessage: '待确认记录已取消',
  });

  const canConfirm = adminLevel >= 3;
  const canCancel = adminLevel >= 3;

  useEffect(() => {
    if (token) fetchPendingItems();
  }, [token, statusFilter, page]);

  const fetchPendingItems = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        per_page: perPage.toString(),
      });
      
      const response = await fetch(`${API_BASE}/api/admin/blacklist/level4-pending?${params}`, {
        headers: { 'Authorization': token },
      });
      
      const data = await response.json();
      if (data.success) {
        setPendingItems(data.data.items);
        setTotal(data.data.total);
      }
    } catch (err) {
      toast.error('获取待确认记录失败');
    } finally {
      setLoading(false);
    }
  };

  const confirmLevel4 = async () => {
    if (!confirmingItem) return;
    
    const result = await confirmMutate(
      '/api/admin/blacklist/level4-confirm',
      { method: 'POST' },
      { confirmation_id: confirmingItem.id }
    );
    
    if (result) {
      setConfirmDialogOpen(false);
      fetchPendingItems();
    }
  };

  const cancelLevel4 = async () => {
    if (!cancellingItem) return;
    
    const params = new URLSearchParams();
    if (cancelReason.trim()) params.append('reason', cancelReason.trim());
    
    const result = await cancelMutate(
      `/api/admin/blacklist/level4-pending/${cancellingItem.id}?${params}`,
      { method: 'DELETE' }
    );
    
    if (result) {
      setCancelDialogOpen(false);
      setCancelReason('');
      fetchPendingItems();
    }
  };

  const openConfirmDialog = (item: Level4PendingItem) => {
    // 不能确认自己的提交
    if (item.first_admin_id === adminInfo?.admin_id) {
      toast.error('您不能确认自己提交的等级4记录');
      return;
    }
    setConfirmingItem(item);
    setConfirmDialogOpen(true);
  };

  const openCancelDialog = (item: Level4PendingItem) => {
    // 只有提交者本人或 level 4 管理员可以取消
    if (item.first_admin_id !== adminInfo?.admin_id && adminLevel < 4) {
      toast.error('只有提交者本人或超级管理员可以取消');
      return;
    }
    setCancellingItem(item);
    setCancelDialogOpen(true);
  };



  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="严重违规审核" 
        description="等级4黑名单需要两名管理员共同确认"
      >
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="pending">待确认</option>
            <option value="confirmed">已确认</option>
            <option value="cancelled">已取消</option>
            <option value="all">全部</option>
          </select>
          <Button onClick={fetchPendingItems} variant="outline" size="icon">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </PageHeader>

      {/* Info Card */}
      <div className="glass rounded-2xl p-6 bg-gradient-to-r from-red-900/20 to-slate-900 border-red-500/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">双管理员确认机制</h3>
            <p className="text-slate-400 text-sm">
              等级4（严重违规）需要两名管理员共同确认才能生效。
              第一位管理员提交后，需要另一位管理员进行确认。
              您不能确认自己提交的记录。
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : pendingItems.length === 0 ? (
        <EmptyState 
          icon={ShieldAlert} 
          description={statusFilter === 'pending' ? '暂无待确认的等级4记录' : '暂无记录'} 
        />
      ) : (
        <>
          <div className="space-y-4">
            {pendingItems.map((item) => (
              <div
                key={item.id}
                className={`glass rounded-2xl p-6 ${
                  item.status === 'pending' ? 'border-yellow-500/20' : ''
                } ${item.first_admin_id === adminInfo?.admin_id ? 'bg-slate-800/30' : ''}`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-red-500">等级 4</Badge>
                      <Level4StatusBadge status={item.status} />
                      {item.first_admin_id === adminInfo?.admin_id && (
                        <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                          我提交的
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                      <div>
                        <span className="text-slate-500">用户ID:</span>
                        <span className="text-white font-mono ml-2">{item.user_id}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">类型:</span>
                        <span className="text-white ml-2">
                          <UserTypeBadge type={item.user_type} className="ml-2" />
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500">封禁原因:</span>
                        <span className="text-white ml-2">{item.reason}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <div className="flex items-center gap-2 text-sm">
                        <UserCheck className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-500">提交者:</span>
                        <span className="text-white">{item.first_admin_name}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-500">
                          {new Date(item.first_confirmed_at).toLocaleString()}
                        </span>
                      </div>
                      
                      {item.second_admin_name && (
                        <div className="flex items-center gap-2 text-sm mt-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-slate-500">确认者:</span>
                          <span className="text-white">{item.second_admin_name}</span>
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-500">
                            {item.second_confirmed_at && new Date(item.second_confirmed_at).toLocaleString()}
                          </span>
                        </div>
                      )}

                      {item.cancelled_by && (
                        <div className="flex items-center gap-2 text-sm mt-1">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-slate-500">取消者:</span>
                          <span className="text-white">{item.cancelled_by}</span>
                          {item.cancel_reason && (
                            <span className="text-slate-500">({item.cancel_reason})</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {item.status === 'pending' && (
                    <div className="flex gap-2">
                      {canConfirm && item.first_admin_id !== adminInfo?.admin_id && (
                        <Button
                          onClick={() => openConfirmDialog(item)}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          确认
                        </Button>
                      )}
                      {canCancel && (
                        <Button
                          onClick={() => openCancelDialog(item)}
                          variant="outline"
                          size="sm"
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          取消
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <SimplePagination
            page={page}
            totalPages={totalPages}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </>
      )}

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AdminDialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              确认等级4黑名单
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {confirmingItem && (
                <div className="space-y-2 mt-2">
                  <p>您即将确认将 <span className="text-white font-mono">{confirmingItem.user_id}</span> 加入等级4黑名单。</p>
                  <p className="text-sm">封禁原因: {confirmingItem.reason}</p>
                  <p className="text-yellow-500 text-sm">此操作不可撤销，确认后该用户将被正式封禁。</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              取消
            </Button>
            <LoadingButton
              onClick={confirmLevel4}
              loading={confirmingLoading}
              icon={CheckCircle}
              className="bg-green-600 hover:bg-green-700"
            >
              确认加入黑名单
            </LoadingButton>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AdminDialogContent>
          <DialogHeader>
            <DialogTitle>取消待确认记录</DialogTitle>
            <DialogDescription className="text-slate-400">
              {cancellingItem && `确定要取消 ${cancellingItem.user_id} 的等级4待确认记录吗？`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <FormTextarea
              label="取消原因（可选）"
              value={cancelReason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCancelReason(e.target.value)}
              placeholder="请输入取消原因..."
              textareaClassName="min-h-[80px]"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              取消
            </Button>
            <LoadingButton
              onClick={cancelLevel4}
              loading={cancellingLoading}
              icon={Trash2}
              variant="destructive"
            >
              确认取消
            </LoadingButton>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>
    </div>
  );
}
