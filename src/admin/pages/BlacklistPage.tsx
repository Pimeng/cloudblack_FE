import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users, Search, RefreshCw, Ban, Edit3, Trash2, User, UsersRound, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AdminDataContext } from '../hooks/useAdminData';
import type { BlacklistItem } from '../types';
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
  FormInput,
  FormTextarea,
  AnimationLayer,
  DetailView,
  DetailInfoItem,
  DetailInfoGrid,
  DetailContentBlock,
} from '../components';
import { useExpandableDetail } from '../hooks';

export function BlacklistPage() {
  const { token, adminLevel, blacklist, blacklistPage, setBlacklistPage, blacklistTotal, blacklistSearch, setBlacklistSearch, blacklistTypeFilter, setBlacklistTypeFilter, fetchBlacklist, loading } = useOutletContext<AdminDataContext>();
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newUserType, setNewUserType] = useState<'user' | 'group'>('user');
  const [newReason, setNewReason] = useState('');
  const [addingLoading, setAddingLoading] = useState(false);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BlacklistItem | null>(null);
  const [editReason, setEditReason] = useState('');
  const [editUserId, setEditUserId] = useState('');
  const [editUserType, setEditUserType] = useState<'user' | 'group'>('user');
  const [updatingLoading, setUpdatingLoading] = useState(false);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<BlacklistItem | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deletingLoading, setDeletingLoading] = useState(false);
  
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

  useEffect(() => {
    if (token) fetchBlacklist();
  }, [token, blacklistPage, blacklistSearch, blacklistTypeFilter, fetchBlacklist]);

  const canManageBlacklist = adminLevel >= 3;
  const blacklistTotalPages = Math.ceil(blacklistTotal / 50);

  const typeTabs = [
    { key: 'all', label: '全部', icon: Users },
    { key: 'user', label: '用户', icon: User },
    { key: 'group', label: '群聊', icon: UsersRound },
  ] as const;

  const addToBlacklist = async () => {
    if (!newUserId.trim() || !newReason.trim() || !token) return;
    
    setAddingLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/blacklist`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: newUserId, user_type: newUserType, reason: newReason }),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('已添加到黑名单');
        setAddDialogOpen(false);
        setNewUserId('');
        setNewUserType('user');
        setNewReason('');
        fetchBlacklist();
      } else {
        toast.error(data.message || '添加失败');
      }
    } catch (err) {
      toast.error('添加失败');
    } finally {
      setAddingLoading(false);
    }
  };

  const updateBlacklistItem = async () => {
    if (!editingItem || !token) return;
    
    setUpdatingLoading(true);
    try {
      const body: any = {};
      if (editReason !== editingItem.reason) body.reason = editReason;
      if (editUserId !== editingItem.user_id) body.new_user_id = editUserId;
      if (editUserType !== editingItem.user_type) body.user_type = editUserType;
      
      if (Object.keys(body).length === 0) {
        toast.info('没有修改内容');
        setUpdatingLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/admin/blacklist/${editingItem.user_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('黑名单条目已更新');
        setEditDialogOpen(false);
        fetchBlacklist();
      } else {
        toast.error(data.message || '更新失败');
      }
    } catch (err) {
      toast.error('更新失败');
    } finally {
      setUpdatingLoading(false);
    }
  };

  const openEditDialog = (item: BlacklistItem) => {
    setEditingItem(item);
    setEditReason(item.reason);
    setEditUserId(item.user_id);
    setEditUserType(item.user_type || 'user');
    setEditDialogOpen(true);
  };

  const deleteBlacklistItem = async () => {
    if (!deletingItem || !token) return;
    
    setDeletingLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('user_type', deletingItem.user_type || 'user');
      if (deleteReason.trim()) {
        params.append('reason', deleteReason.trim());
      }

      const response = await fetch(`${API_BASE}/api/admin/blacklist/${deletingItem.user_id}?${params}`, {
        method: 'DELETE',
        headers: { 'Authorization': token },
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('已移出黑名单');
        setDeleteDialogOpen(false);
        setDeleteReason('');
        fetchBlacklist();
      } else {
        toast.error(data.message || '移除失败');
      }
    } catch (err) {
      toast.error('移除失败');
    } finally {
      setDeletingLoading(false);
    }
  };

  const handleOpenDetail = (item: BlacklistItem) => {
    const rowKey = `${item.user_id}-${item.user_type || 'user'}`;
    openDetail(item, rowKey);
  };

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
          <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">黑名单管理</h2>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">查看和管理黑名单用户/群聊</p>
            <div className="flex bg-slate-800/50 rounded-lg p-1 gap-1">
              {typeTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setBlacklistTypeFilter(tab.key as typeof blacklistTypeFilter);
                      setBlacklistPage(1);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium transition-all ${
                      blacklistTypeFilter === tab.key
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
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
              className="pl-10 w-full md:w-64 bg-slate-800 border-slate-700"
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
            <table className="w-full min-w-[600px]">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">ID</th>
                  <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">封禁原因</th>
                  <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">操作者</th>
                  <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">添加时间</th>
                  <th className="px-4 md:px-6 py-4 text-right text-sm font-medium text-slate-400">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {blacklist.map((item) => (
                  <tr 
                    key={`${item.user_id}-${item.user_type || 'user'}`} 
                    ref={(el) => {
                      if (el) rowRefs.current.set(`${item.user_id}-${item.user_type || 'user'}`, el);
                    }}
                    className="hover:bg-slate-800/30"
                  >
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono">{item.user_id}</span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${getUserTypeBadgeClass(item.user_type || 'user')}`}>
                          {getUserTypeLabel(item.user_type || 'user')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-slate-300 max-w-[200px] truncate" title={item.reason}>{item.reason}</td>
                    <td className="px-4 md:px-6 py-4 text-slate-400">{item.added_by}</td>
                    <td className="px-4 md:px-6 py-4 text-slate-400 text-sm">{new Date(item.added_at).toLocaleString()}</td>
                    <td className="px-4 md:px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleOpenDetail(item)}
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
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

          {blacklistTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button onClick={() => setBlacklistPage(p => Math.max(1, p - 1))} disabled={blacklistPage === 1} variant="outline" size="icon">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </Button>
              <span className="text-sm text-muted-foreground">第 {blacklistPage} / {blacklistTotalPages} 页</span>
              <Button onClick={() => setBlacklistPage(p => Math.min(blacklistTotalPages, p + 1))} disabled={blacklistPage === blacklistTotalPages} variant="outline" size="icon">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Button>
            </div>
          )}
        </>
      )}

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <AdminDialogContent>
          <DialogHeader>
            <DialogTitle>添加黑名单</DialogTitle>
            <DialogDescription className="text-slate-400">将用户或群聊添加到黑名单</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">类型</label>
              <Select value={newUserType} onValueChange={(value: 'user' | 'group') => setNewUserType(value)}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
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
            <FormTextarea
              label="封禁原因"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="请输入封禁原因..."
              textareaClassName="min-h-[100px]"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>取消</Button>
            <LoadingButton
              onClick={addToBlacklist}
              loading={addingLoading}
              icon={Ban}
              disabled={!newUserId.trim() || !newReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              确认添加
            </LoadingButton>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <AdminDialogContent>
          <DialogHeader>
            <DialogTitle>修改黑名单条目</DialogTitle>
            <DialogDescription className="text-slate-400">修改黑名单中的用户/群聊信息</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">类型</label>
              <Select value={editUserType} onValueChange={(value: 'user' | 'group') => setEditUserType(value)}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
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
            <DialogDescription className="text-slate-400">
              {deletingItem && (
                <>
                  确定要将 <span className="text-white font-mono">{deletingItem.user_id}</span> ({getUserTypeLabel(deletingItem.user_type || 'user')}) 移出黑名单吗？
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
      <DetailView isOpen={detailOpen} title="黑名单详情" onClose={closeDetail}>
        {viewingItem && (
          <>
            <DetailInfoGrid>
              <DetailInfoItem label="类型">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getUserTypeBadgeClass(viewingItem.user_type || 'user')}`}>
                  {getUserTypeLabel(viewingItem.user_type || 'user')}
                </span>
              </DetailInfoItem>
              <DetailInfoItem label="ID">
                <p className="text-white font-mono">{viewingItem.user_id}</p>
              </DetailInfoItem>
              {viewingItem.added_by && (
                <DetailInfoItem label="操作者">
                  <p className="text-white">{viewingItem.added_by}</p>
                </DetailInfoItem>
              )}
              <DetailInfoItem label="添加时间">
                <p className="text-white">{new Date(viewingItem.added_at).toLocaleString()}</p>
              </DetailInfoItem>
            </DetailInfoGrid>

            <DetailContentBlock label="封禁原因">
              <p className="text-white whitespace-pre-wrap break-words">{viewingItem.reason}</p>
            </DetailContentBlock>
          </>
        )}
      </DetailView>
    </div>
  );
}
