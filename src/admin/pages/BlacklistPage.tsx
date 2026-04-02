import { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { useUrlState } from '../hooks';
import { Users, Search, RefreshCw, Ban, Edit3, Trash2, User, UsersRound, Eye, ShieldAlert } from 'lucide-react';
import { useImageViewer } from '@/hooks/useImageViewer';
import { ImageUploadDropzone, type PendingImage } from '@/components/ImageUploadDropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { AdminDataContext } from '../hooks/useAdminData';
import type { BlacklistItem } from '../types';
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
  FormInput,
  FormTextarea,
  FormSelect,
  AnimationLayer,
  DetailView,
  DetailInfoItem,
  DetailInfoGrid,
  DetailContentBlock,
  SimplePagination,
  UserTypeBadge,
  ViolationLevelBadge,
} from '../components';
import { useExpandableDetail, useApiMutation } from '../hooks';

interface AddBlacklistResponse {
  status?: string;
  confirmation_id: number;
}

export function BlacklistPage() {
  const { token, adminLevel, blacklist, blacklistPage, setBlacklistPage, blacklistTotal, blacklistSearch, setBlacklistSearch, fetchBlacklist, loading, setBlacklistTypeFilter } = useOutletContext<AdminDataContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // 从 URL 获取 tab 状态和详情 ID
  const [blacklistTypeFilter, setBlacklistTypeFilterUrl] = useUrlState<'all' | 'user' | 'group'>('tab', 'all');
  const detailId = searchParams.get('id');
  const detailType = searchParams.get('type') as 'user' | 'group' | null;
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newUserType, setNewUserType] = useState<'user' | 'group'>('user');
  const [newReason, setNewReason] = useState('');
  const [newLevel, setNewLevel] = useState(1);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    confirmation_id: number;
    user_id: string;
  } | null>(null);
  
  // 图片上传相关状态
  const [evidenceImages, setEvidenceImages] = useState<PendingImage[]>([]);
  const maxImages = 3;
  const maxSizeMB = 5;
  const { openImage } = useImageViewer();
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BlacklistItem | null>(null);
  const [editReason, setEditReason] = useState('');
  const [editUserId, setEditUserId] = useState('');
  const [editUserType, setEditUserType] = useState<'user' | 'group'>('user');
  const [editLevel, setEditLevel] = useState(1);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<BlacklistItem | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  
  // Detail edit mode states
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  
  // API mutations
  const { mutate: addToBlacklistMutate, loading: addingLoading } = useApiMutation<AddBlacklistResponse>(token, {
    successMessage: '',
    showSuccessToast: false,
  });
  const { mutate: updateBlacklistMutate, loading: updatingLoading } = useApiMutation(token, {
    successMessage: '黑名单条目已更新',
  });
  const { mutate: deleteBlacklistMutate, loading: deletingLoading } = useApiMutation(token, {
    successMessage: '已移出黑名单',
  });
  
  // Use expandable detail hook
  const {
    isOpen: detailOpen,
    viewingItem,
    animating,
    animationPhase,
    cardRect,
    refs: rowRefs,
    openDetail,
    closeDetail,
  } = useExpandableDetail<BlacklistItem>();

  // 将 URL 中的 tab 状态同步到 useAdminData 的上下文
  useEffect(() => {
    setBlacklistTypeFilter(blacklistTypeFilter);
  }, [blacklistTypeFilter, setBlacklistTypeFilter]);

  useEffect(() => {
    if (token) fetchBlacklist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, blacklistPage, blacklistSearch, blacklistTypeFilter]);

  const canManageBlacklist = adminLevel >= 3;
  const blacklistTotalPages = Math.ceil(blacklistTotal / 50);

  const typeTabs = [
    { key: 'all', label: '全部', icon: Users },
    { key: 'user', label: '用户', icon: User },
    { key: 'group', label: '群聊', icon: UsersRound },
  ] as const;

  const addToBlacklist = async () => {
    if (!newUserId.trim() || !newReason.trim()) return;
    if (evidenceImages.length < 1) {
      toast.error('请至少上传1张图片作为添加黑名单的证明');
      return;
    }
    
    setPendingConfirmation(null);
    
    // 使用 FormData 进行表单上传
    const formData = new FormData();
    formData.append('user_id', newUserId);
    formData.append('user_type', newUserType);
    formData.append('reason', newReason);
    formData.append('level', String(newLevel));
    
    // 添加图片文件
    evidenceImages.forEach((img) => {
      formData.append('files', img.file);
    });
    
    const result = await addToBlacklistMutate(
      '/api/admin/blacklist',
      { method: 'POST' },
      formData
    );
    
    if (result) {
      // Level 4 需要二次确认
      if (result.status === 'pending' && newLevel === 4) {
        setPendingConfirmation({
          confirmation_id: result.confirmation_id,
          user_id: newUserId,
        });
        toast.success('严重违规记录已提交，需要另一名管理员确认');
      } else {
        toast.success('已添加到黑名单');
        setAddDialogOpen(false);
        setNewUserId('');
        setNewUserType('user');
        setNewReason('');
        setNewLevel(1);
        // 清理图片预览
        evidenceImages.forEach(img => URL.revokeObjectURL(img.preview));
        setEvidenceImages([]);
        fetchBlacklist();
      }
    }
  };

  const updateBlacklistItem = async () => {
    if (!editingItem) return;
    
    const body: Record<string, unknown> = {};
    // user_type 是原类型，用于定位记录
    body.user_type = editingItem.user_type || 'user';
    if (editReason !== editingItem.reason) body.reason = editReason;
    if (editUserId !== editingItem.user_id) body.new_user_id = editUserId;
    // 如果要修改类型，使用 new_user_type
    if (editUserType !== editingItem.user_type) body.new_user_type = editUserType;
    if (editLevel !== (editingItem.level || 1)) body.level = editLevel;
    
    if (Object.keys(body).length <= 1) { // 只有 user_type 时没有实质修改
      toast.info('没有修改内容');
      return;
    }

    const result = await updateBlacklistMutate(
      `/api/admin/blacklist/${editingItem.user_id}`,
      { method: 'PUT' },
      body
    );
    
    if (result) {
      setEditDialogOpen(false);
      fetchBlacklist();
    }
  };

  const openEditDialog = (item: BlacklistItem) => {
    setEditingItem(item);
    setEditReason(item.reason);
    setEditUserId(item.user_id);
    setEditUserType(item.user_type || 'user');
    setEditLevel(item.level || 1);
    setEditDialogOpen(true);
  };

  const openDetailEditMode = () => {
    if (viewingItem) {
      setEditingItem(viewingItem);
      setEditReason(viewingItem.reason);
      setEditUserId(viewingItem.user_id);
      setEditUserType(viewingItem.user_type || 'user');
      setEditLevel(viewingItem.level || 1);
      setIsEditingDetail(true);
    }
  };

  const closeDetailEditMode = () => {
    setIsEditingDetail(false);
    setEditingItem(null);
  };

  const saveDetailEdit = async () => {
    if (!viewingItem) return;
    
    const body: { reason?: string; user_type?: 'user' | 'group'; new_user_type?: 'user' | 'group'; level?: number } = {};
    // user_type 是原类型，用于定位记录
    body.user_type = viewingItem.user_type || 'user';
    if (editReason.trim() !== viewingItem.reason) body.reason = editReason.trim();
    // 如果要修改类型，使用 new_user_type
    if (editUserType !== viewingItem.user_type) body.new_user_type = editUserType;
    if (editLevel !== viewingItem.level) body.level = editLevel;
    
    if (Object.keys(body).length <= 1) { // 只有 user_type 时没有实质修改
      toast.info('没有需要更新的内容');
      setIsEditingDetail(false);
      return;
    }

    const result = await updateBlacklistMutate(
      `/api/admin/blacklist/${viewingItem.user_id}`,
      { method: 'PUT' },
      body
    );
    
    if (result) {
      setIsEditingDetail(false);
      fetchBlacklist();
    }
  };

  const deleteBlacklistItem = async () => {
    if (!deletingItem) return;
    
    const params = new URLSearchParams();
    params.append('user_type', deletingItem.user_type || 'user');
    if (deleteReason.trim()) {
      params.append('reason', deleteReason.trim());
    }

    const result = await deleteBlacklistMutate(`/api/admin/blacklist/${deletingItem.user_id}?${params}`, {
      method: 'DELETE',
    });
    
    if (result) {
      setDeleteDialogOpen(false);
      setDeleteReason('');
      fetchBlacklist();
    }
  };

  const handleOpenDetail = useCallback((item: BlacklistItem) => {
    const rowKey = `${item.user_id}-${item.user_type || 'user'}`;
    openDetail(item, rowKey);
    // 更新 URL 添加 id 和 type 参数
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set('id', item.user_id);
      if (item.user_type && item.user_type !== 'user') {
        newParams.set('type', item.user_type);
      }
      return newParams;
    });
  }, [openDetail, setSearchParams]);

  const handleCloseDetail = useCallback(() => {
    closeDetail();
    // 清除 URL 中的 id 和 type 参数
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.delete('id');
      newParams.delete('type');
      return newParams;
    });
  }, [closeDetail, setSearchParams]);

  // 页面加载时检查 URL 参数，自动打开详情
  useEffect(() => {
    if (detailId && blacklist.length > 0 && !viewingItem) {
      const item = blacklist.find(
        (i) => i.user_id === detailId && (detailType ? i.user_type === detailType : true)
      );
      if (item) {
        const rowKey = `${item.user_id}-${item.user_type || 'user'}`;
        // 延迟一点执行，确保 DOM 已经渲染
        setTimeout(() => {
          openDetail(item, rowKey);
        }, 100);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailId, detailType, blacklist, viewingItem]);

  const getUserTypeLabel = (type: 'user' | 'group') => {
    return type === 'group' ? '群聊' : '用户';
  };

  const getUserTypeBadgeClass = (type: 'user' | 'group') => {
    return type === 'group' 
      ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
      : 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1 md:mb-2">黑名单管理</h2>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">查看和管理黑名单用户/群聊</p>
            <div className="flex bg-muted/50 rounded-lg p-1 gap-1">
              {typeTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setBlacklistTypeFilterUrl(tab.key as typeof blacklistTypeFilter);
                      setBlacklistTypeFilter(tab.key as typeof blacklistTypeFilter);
                      setBlacklistPage(1);
                    }}
                    type="button"
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium transition-all ${
                      blacklistTypeFilter === tab.key
                        ? 'bg-brand/20 text-brand'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索用户ID、群号或原因..."
              value={blacklistSearch}
              onChange={(e) => { setBlacklistSearch(e.target.value); setBlacklistPage(1); }}
              className="pl-10 w-full md:w-64 bg-muted border-border"
            />
          </div>
          {canManageBlacklist && (
            <Button onClick={() => setAddDialogOpen(true)} className="bg-brand hover:bg-brand-dark whitespace-nowrap">
              <Ban className="w-4 h-4 mr-2" />
              添加黑名单
            </Button>
          )}
          <Button onClick={() => fetchBlacklist()} variant="outline" size="icon">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : blacklist.length === 0 ? (
        <EmptyState icon={Users} description="黑名单为空" />
      ) : (
        <>
          <div className="glass rounded-2xl overflow-x-auto">
            <table className="w-full" style={{ tableLayout: 'auto' }}>
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-muted-foreground">ID</th>
                  <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-muted-foreground">等级</th>
                  <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-muted-foreground">封禁原因</th>
                  <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-muted-foreground">操作者</th>
                  <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-muted-foreground">添加时间</th>
                  <th className="px-4 md:px-6 py-4 text-right text-sm font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {blacklist.map((item) => (
                  <tr 
                    key={`${item.user_id}-${item.user_type || 'user'}`} 
                    ref={(el) => {
                      if (el) rowRefs.current.set(`${item.user_id}-${item.user_type || 'user'}`, el);
                    }}
                    className="hover:bg-muted/30"
                  >
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground font-mono">{item.user_id}</span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border shrink-0 ${getUserTypeBadgeClass(item.user_type || 'user')}`}>
                          {getUserTypeLabel(item.user_type || 'user')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <ViolationLevelBadge level={item.level || 1} />
                    </td>
                    <td className="px-4 md:px-6 py-4 text-foreground/80 max-w-[300px] truncate" title={item.reason}>{item.reason}</td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-muted-foreground">{item.added_by?.startsWith('admin:') ? item.added_by.slice(6) : item.added_by}</span>
                        <Badge 
                          variant="secondary" 
                          className={`ml-1.5 text-[10px] px-1.5 py-0 whitespace-nowrap shrink-0 ${item.added_by?.startsWith('admin:') ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-muted text-muted-foreground border-border'}`}
                        >
                          {item.added_by?.startsWith('admin:') ? '管理' : 'Bot'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-muted-foreground text-sm whitespace-nowrap">{new Date(item.added_at).toLocaleString()}</td>
                    <td className="px-4 md:px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleOpenDetail(item)}
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {canManageBlacklist && (
                          <>
                            <Button
                              onClick={() => openEditDialog(item)}
                              variant="ghost"
                              size="sm"
                              className="text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => { setDeletingItem(item); setDeleteReason(''); setDeleteDialogOpen(true); }}
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SimplePagination
            page={blacklistPage}
            totalPages={blacklistTotalPages}
            onPageChange={(page) => setBlacklistPage(page)}
            className="pt-4"
          />
        </>
      )}

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <AdminDialogContent>
          <DialogHeader>
            <DialogTitle>添加黑名单</DialogTitle>
            <DialogDescription className="text-muted-foreground">将用户或群聊添加到黑名单</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">类型</label>
              <Select value={newUserType} onValueChange={(value: 'user' | 'group') => setNewUserType(value)}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">用户（QQ号）</SelectItem>
                  <SelectItem value="group">群聊（群号）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <FormInput
              label={newUserType === 'group' ? '群号' : '用户ID (QQ号)'}
              value={newUserId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUserId(e.target.value)}
              placeholder={`请输入${newUserType === 'group' ? '群号' : 'QQ号'}`}
            />
            <FormSelect
              label="违规等级"
              value={String(newLevel)}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewLevel(parseInt(e.target.value))}
              options={[
                { value: '1', label: '等级 1 - 轻微违规' },
                { value: '2', label: '等级 2 - 一般违规' },
                { value: '3', label: '等级 3 - 严重违规' },
                { value: '4', label: '等级 4 - 极其严重（需双管理员确认）' },
              ]}
              hint={newLevel === 4 ? '等级4需要另一名管理员确认后才能生效' : undefined}
            />
            {newLevel === 4 && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">
                  等级4（极其严重）需要双管理员确认机制。提交后需要另一名管理员确认才能正式生效。
                </p>
              </div>
            )}
            <FormTextarea
              label="封禁原因 *"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="请详细说明封禁原因，包括违规行为的描述、发生时间、证据来源等，便于后续审核和申诉处理..."
              textareaClassName="min-h-[100px]"
            />
            
            {/* 证据图片上传 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                证据图片 <span className="text-red-500">*</span> <span className="text-xs text-muted-foreground font-normal">（至少1张，最多3张）</span>
              </label>
              <p className="text-xs text-muted-foreground">
                上传能证明违规行为的截图，系统将对图片进行安全检测和去重处理
              </p>
              <ImageUploadDropzone
                images={evidenceImages}
                onImagesChange={setEvidenceImages}
                maxImages={maxImages}
                maxSizeMB={maxSizeMB}
                onError={(msg) => toast.error(msg)}
                onImageClick={(src) => openImage(src)}
              />
            </div>
            
            {pendingConfirmation && (
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <p className="text-sm text-yellow-400 mb-2">
                  <strong>待确认记录已创建</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  记录ID: {pendingConfirmation.confirmation_id}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  需要另一名管理员在「严重违规审核」页面确认后才能生效。
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { 
              setAddDialogOpen(false); 
              setPendingConfirmation(null);
              // 清理图片预览
              evidenceImages.forEach(img => URL.revokeObjectURL(img.preview));
              setEvidenceImages([]);
            }}>
              {pendingConfirmation ? '关闭' : '取消'}
            </Button>
            {!pendingConfirmation && (
              <LoadingButton
                onClick={addToBlacklist}
                loading={addingLoading}
                icon={Ban}
                disabled={!newUserId.trim() || !newReason.trim() || evidenceImages.length < 1}
                className={newLevel === 4 ? 'bg-red-600 hover:bg-red-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {newLevel === 4 ? '提交审核' : '确认添加'}
              </LoadingButton>
            )}
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <AdminDialogContent>
          <DialogHeader>
            <DialogTitle>修改黑名单条目</DialogTitle>
            <DialogDescription className="text-muted-foreground">修改黑名单中的用户/群聊信息</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">类型</label>
              <Select value={editUserType} onValueChange={(value: 'user' | 'group') => setEditUserType(value)}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">用户（QQ号）</SelectItem>
                  <SelectItem value="group">群聊（群号）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <FormInput
              label={editUserType === 'group' ? '群号' : '用户ID (QQ号)'}
              value={editUserId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditUserId(e.target.value)}
              placeholder={`请输入${editUserType === 'group' ? '群号' : 'QQ号'}`}
              hint={`如需修改${editUserType === 'group' ? '群号' : 'QQ号'}，请输入新的号码`}
            />
            <FormSelect
              label="违规等级"
              value={String(editLevel)}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditLevel(parseInt(e.target.value))}
              options={[
                { value: '1', label: '等级 1 - 轻微违规' },
                { value: '2', label: '等级 2 - 一般违规' },
                { value: '3', label: '等级 3 - 严重违规' },
                { value: '4', label: '等级 4 - 极其严重（需双管理员确认）' },
              ]}
              hint={editLevel === 4 && editingItem?.level !== 4 ? '升级到等级4需要另一名管理员确认' : undefined}
            />
            {editLevel === 4 && editingItem?.level !== 4 && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">
                  升级到等级4需要双管理员确认机制。保存后需要另一名管理员确认才能正式生效。
                </p>
              </div>
            )}
            <FormTextarea
              label="封禁原因"
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder="请输入封禁原因..."
              textareaClassName="min-h-[100px]"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
            <LoadingButton
              onClick={updateBlacklistItem}
              loading={updatingLoading}
              icon={Edit3}
              className="bg-brand hover:bg-brand-dark"
            >
              保存修改
            </LoadingButton>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AdminDialogContent>
          <DialogHeader>
            <DialogTitle>移除黑名单</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {deletingItem && (
                <>
                  确定要将 <span className="text-foreground font-mono">{deletingItem.user_id}</span> ({getUserTypeLabel(deletingItem.user_type || 'user')}) 移出黑名单吗？
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <FormTextarea
              label="移除原因（可选）"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="请输入移除原因，如：误封已处理..."
              textareaClassName="min-h-[80px]"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
            <LoadingButton
              onClick={deleteBlacklistItem}
              loading={deletingLoading}
              icon={Trash2}
              variant="destructive"
            >
              确认移除
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
      
      {/* Detail View */}
      <DetailView isOpen={detailOpen} title={isEditingDetail ? '编辑黑名单' : '黑名单详情'} onClose={handleCloseDetail}>
        {viewingItem && (
          <>
            {isEditingDetail ? (
              // Edit Mode
              <div className="space-y-4">
                <DetailInfoGrid>
                  <DetailInfoItem label="类型">
                    <Select value={editUserType} onValueChange={(value: 'user' | 'group') => setEditUserType(value)}>
                      <SelectTrigger className="bg-muted border-border h-9">
                        <SelectValue placeholder="选择类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">用户（QQ号）</SelectItem>
                        <SelectItem value="group">群聊（群号）</SelectItem>
                      </SelectContent>
                    </Select>
                  </DetailInfoItem>
                  <DetailInfoItem label="ID">
                    <Input
                      value={editUserId}
                      onChange={(e) => setEditUserId(e.target.value)}
                      className="bg-muted border-border h-9"
                      placeholder={`请输入${editUserType === 'group' ? '群号' : 'QQ号'}`}
                    />
                  </DetailInfoItem>
                  <DetailInfoItem label="违规等级">
                    <Select value={String(editLevel)} onValueChange={(value) => setEditLevel(parseInt(value))}>
                      <SelectTrigger className="bg-muted border-border h-9">
                        <SelectValue placeholder="选择等级" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">等级 1 - 轻微违规</SelectItem>
                        <SelectItem value="2">等级 2 - 一般违规</SelectItem>
                        <SelectItem value="3">等级 3 - 严重违规</SelectItem>
                        <SelectItem value="4">等级 4 - 极其严重</SelectItem>
                      </SelectContent>
                    </Select>
                  </DetailInfoItem>
                  {viewingItem.added_by && (
                    <DetailInfoItem label="操作者">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground">{viewingItem.added_by?.startsWith('admin:') ? viewingItem.added_by.slice(6) : viewingItem.added_by}</span>
                        <Badge 
                          variant="secondary" 
                          className={`text-[10px] px-1.5 py-0 ${viewingItem.added_by?.startsWith('admin:') ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-muted text-muted-foreground border-border'}`}
                        >
                          {viewingItem.added_by?.startsWith('admin:') ? '管理' : 'Bot'}
                        </Badge>
                      </div>
                    </DetailInfoItem>
                  )}
                  <DetailInfoItem label="添加时间">
                    <p className="text-foreground">{new Date(viewingItem.added_at).toLocaleString()}</p>
                  </DetailInfoItem>
                </DetailInfoGrid>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80">封禁原因</label>
                  <textarea
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/50 min-h-[100px] resize-none"
                    placeholder="请输入封禁原因..."
                  />
                </div>

                {editLevel === 4 && viewingItem.level !== 4 && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                    <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">
                      升级到等级4需要双管理员确认机制。保存后需要另一名管理员确认才能正式生效。
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
                  <Button variant="outline" size="sm" onClick={closeDetailEditMode}>取消</Button>
                  <LoadingButton
                    onClick={saveDetailEdit}
                    loading={updatingLoading}
                    icon={Edit3}
                    size="sm"
                    className="bg-brand hover:bg-brand-dark"
                  >
                    保存修改
                  </LoadingButton>
                </div>
              </div>
            ) : (
              // View Mode
              <>
                <DetailInfoGrid>
                  <DetailInfoItem label="类型">
                    <UserTypeBadge type={viewingItem.user_type || 'user'} />
                  </DetailInfoItem>
                  <DetailInfoItem label="ID">
                    <p className="text-foreground font-mono">{viewingItem.user_id}</p>
                  </DetailInfoItem>
                  <DetailInfoItem label="违规等级">
                    <ViolationLevelBadge level={viewingItem.level || 1} />
                  </DetailInfoItem>
                  {viewingItem.added_by && (
                    <DetailInfoItem label="操作者">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground">{viewingItem.added_by?.startsWith('admin:') ? viewingItem.added_by.slice(6) : viewingItem.added_by}</span>
                        <Badge 
                          variant="secondary" 
                          className={`text-[10px] px-1.5 py-0 ${viewingItem.added_by?.startsWith('admin:') ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-muted text-muted-foreground border-border'}`}
                        >
                          {viewingItem.added_by?.startsWith('admin:') ? '管理' : 'Bot'}
                        </Badge>
                      </div>
                    </DetailInfoItem>
                  )}
                  <DetailInfoItem label="添加时间">
                    <p className="text-foreground">{new Date(viewingItem.added_at).toLocaleString()}</p>
                  </DetailInfoItem>
                </DetailInfoGrid>

                {canManageBlacklist && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground w-16">操作</span>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={openDetailEditMode}
                          variant="outline"
                          size="sm"
                          className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                        >
                          <Edit3 className="w-4 h-4 mr-1.5" />
                          编辑
                        </Button>
                        <Button
                          onClick={() => { setDeletingItem(viewingItem); setDeleteReason(''); setDeleteDialogOpen(true); }}
                          variant="outline"
                          size="sm"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4 mr-1.5" />
                          删除
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <DetailContentBlock label="封禁原因">
                  <p className="text-foreground whitespace-pre-wrap break-words">{viewingItem.reason}</p>
                </DetailContentBlock>
              </>
            )}
          </>
        )}
      </DetailView>
    </div>
  );
}
