import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users, Search, RefreshCw, Ban, Edit3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AdminDataContext } from '../hooks/useAdminData';
import type { BlacklistItem } from '../types';
import { API_BASE } from '../types';
import { toast } from 'sonner';

export function BlacklistPage() {
  const { token, adminLevel, blacklist, blacklistPage, setBlacklistPage, blacklistTotal, blacklistSearch, setBlacklistSearch, fetchBlacklist, loading } = useOutletContext<AdminDataContext>();
  
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

  useEffect(() => {
    if (token) fetchBlacklist();
  }, [token, blacklistPage, blacklistSearch]);

  const canManageBlacklist = adminLevel >= 3;
  const blacklistTotalPages = Math.ceil(blacklistTotal / 50);

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
          <p className="text-sm text-muted-foreground">查看和管理黑名单用户/群聊</p>
        </div>
        <div className="flex flex-wrap gap-2">
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
        <div className="text-center py-20">
          <span className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin inline-block" />
          <p className="text-muted-foreground mt-4">加载中...</p>
        </div>
      ) : blacklist.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-muted-foreground">黑名单为空</p>
        </div>
      ) : (
        <>
          <div className="glass rounded-2xl overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">类型</th>
                  <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">ID</th>
                  <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">封禁原因</th>
                  <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">操作者</th>
                  <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">添加时间</th>
                  <th className="px-4 md:px-6 py-4 text-right text-sm font-medium text-slate-400">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {blacklist.map((item) => (
                  <tr key={`${item.user_id}-${item.user_type || 'user'}`} className="hover:bg-slate-800/30">
                    <td className="px-4 md:px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getUserTypeBadgeClass(item.user_type || 'user')}`}>
                        {getUserTypeLabel(item.user_type || 'user')}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-white font-mono">{item.user_id}</td>
                    <td className="px-4 md:px-6 py-4 text-slate-300 max-w-[200px] truncate" title={item.reason}>{item.reason}</td>
                    <td className="px-4 md:px-6 py-4 text-slate-400">{item.added_by}</td>
                    <td className="px-4 md:px-6 py-4 text-slate-400 text-sm">{new Date(item.added_at).toLocaleString()}</td>
                    <td className="px-4 md:px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
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
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-[calc(100%-2rem)] mx-4">
          <DialogHeader>
            <DialogTitle>添加黑名单</DialogTitle>
            <DialogDescription className="text-slate-400">将用户或群聊添加到黑名单</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>类型</Label>
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
            <div className="space-y-2">
              <Label>{newUserType === 'group' ? '群号' : '用户ID (QQ号)'}</Label>
              <Input value={newUserId} onChange={(e) => setNewUserId(e.target.value)} placeholder={`请输入${newUserType === 'group' ? '群号' : 'QQ号'}`} className="bg-slate-800 border-slate-700" />
            </div>
            <div className="space-y-2">
              <Label>封禁原因</Label>
              <Textarea value={newReason} onChange={(e) => setNewReason(e.target.value)} placeholder="请输入封禁原因..." className="bg-slate-800 border-slate-700 min-h-[100px]" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>取消</Button>
            <Button onClick={addToBlacklist} disabled={!newUserId.trim() || !newReason.trim() || addingLoading} className="bg-red-600 hover:bg-red-700">
              {addingLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Ban className="w-4 h-4 mr-2" />确认添加</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-[calc(100%-2rem)] mx-4">
          <DialogHeader>
            <DialogTitle>修改黑名单条目</DialogTitle>
            <DialogDescription className="text-slate-400">修改黑名单中的用户/群聊信息</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>类型</Label>
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
            <div className="space-y-2">
              <Label>{editUserType === 'group' ? '群号' : '用户ID (QQ号)'}</Label>
              <Input value={editUserId} onChange={(e) => setEditUserId(e.target.value)} placeholder={`请输入${editUserType === 'group' ? '群号' : 'QQ号'}`} className="bg-slate-800 border-slate-700" />
              <p className="text-xs text-muted-foreground">如需修改{editUserType === 'group' ? '群号' : 'QQ号'}，请输入新的号码</p>
            </div>
            <div className="space-y-2">
              <Label>封禁原因</Label>
              <Textarea value={editReason} onChange={(e) => setEditReason(e.target.value)} placeholder="请输入封禁原因..." className="bg-slate-800 border-slate-700 min-h-[100px]" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
            <Button onClick={updateBlacklistItem} disabled={updatingLoading} className="bg-brand hover:bg-brand-dark">
              {updatingLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Edit3 className="w-4 h-4 mr-2" />保存修改</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-[calc(100%-2rem)] mx-4">
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
            <div className="space-y-2">
              <Label>移除原因（可选）</Label>
              <Textarea 
                value={deleteReason} 
                onChange={(e) => setDeleteReason(e.target.value)} 
                placeholder="请输入移除原因，如：误封已处理..." 
                className="bg-slate-800 border-slate-700 min-h-[80px]" 
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
            <Button onClick={deleteBlacklistItem} disabled={deletingLoading} variant="destructive">
              {deletingLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : <><Trash2 className="w-4 h-4 mr-2" />确认移除</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
