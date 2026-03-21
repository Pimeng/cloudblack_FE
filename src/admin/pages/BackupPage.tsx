import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Database, RefreshCw, Plus, Trash2, Edit3, Download, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { AdminDataContext } from '../hooks/useAdminData';
import type { BackupItem } from '../types';
import { API_BASE } from '../types';
import { toast } from 'sonner';

export function BackupPage() {
  const { token, adminLevel, backups, backupStatus, backupConfig, backupLoading, fetchBackups, fetchBackupStatus, fetchBackupConfig } = useOutletContext<AdminDataContext>();
  
  // Permissions
  const canCreateBackup = adminLevel >= 4;
  const canDeleteBackup = adminLevel >= 4;
  const canUpdateBackupRemark = adminLevel >= 4;
  const canUpdateBackupConfig = adminLevel >= 4;

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createRemark, setCreateRemark] = useState('');
  const [creatingLoading, setCreatingLoading] = useState(false);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingBackup, setDeletingBackup] = useState<BackupItem | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  
  const [remarkDialogOpen, setRemarkDialogOpen] = useState(false);
  const [editingRemarkBackup, setEditingRemarkBackup] = useState<BackupItem | null>(null);
  const [editRemark, setEditRemark] = useState('');
  const [updatingRemarkLoading, setUpdatingRemarkLoading] = useState(false);
  
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [editBackupConfig, setEditBackupConfig] = useState({
    enabled: true,
    cron: '0 3 * * *',
    backup_dir: 'backups',
    max_backups: 10,
    retention_days: 30,
  });
  const [updatingConfigLoading, setUpdatingConfigLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchBackupStatus();
      fetchBackups();
      fetchBackupConfig();
    }
  }, [token]);

  useEffect(() => {
    if (backupConfig) {
      setEditBackupConfig({
        enabled: backupConfig.enabled ?? true,
        cron: backupConfig.cron || '0 3 * * *',
        backup_dir: backupConfig.backup_dir || 'backups',
        max_backups: backupConfig.max_backups || 10,
        retention_days: backupConfig.retention_days || 30,
      });
    }
  }, [backupConfig]);

  const createBackup = async () => {
    if (!token) return;
    
    setCreatingLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/backup/create`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ remark: createRemark || undefined }),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('备份创建成功');
        setCreateDialogOpen(false);
        setCreateRemark('');
        fetchBackups();
        fetchBackupStatus();
      } else {
        toast.error(data.message || '创建失败');
      }
    } catch (err) {
      toast.error('创建备份失败');
    } finally {
      setCreatingLoading(false);
    }
  };

  const deleteBackup = async () => {
    if (!deletingBackup || !token) return;
    
    setDeletingLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/backup/${encodeURIComponent(deletingBackup.filename)}`, {
        method: 'DELETE',
        headers: { 'Authorization': token },
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('备份已删除');
        setDeleteDialogOpen(false);
        fetchBackups();
        fetchBackupStatus();
      } else {
        toast.error(data.message || '删除失败');
      }
    } catch (err) {
      toast.error('删除备份失败');
    } finally {
      setDeletingLoading(false);
    }
  };

  const updateBackupRemark = async () => {
    if (!editingRemarkBackup || !token) return;
    
    setUpdatingRemarkLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/backup/${encodeURIComponent(editingRemarkBackup.filename)}/remark`, {
        method: 'PUT',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ remark: editRemark }),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('备注已更新');
        setRemarkDialogOpen(false);
        fetchBackups();
      } else {
        toast.error(data.message || '更新失败');
      }
    } catch (err) {
      toast.error('更新备注失败');
    } finally {
      setUpdatingRemarkLoading(false);
    }
  };

  const updateBackupConfig = async () => {
    if (!token) return;
    
    setUpdatingConfigLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/backup/config`, {
        method: 'PUT',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editBackupConfig),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('备份配置已更新');
        setConfigDialogOpen(false);
        fetchBackupConfig();
        fetchBackupStatus();
      } else {
        toast.error(data.message || '更新失败');
      }
    } catch (err) {
      toast.error('更新配置失败');
    } finally {
      setUpdatingConfigLoading(false);
    }
  };

  const openRemarkDialog = (backup: BackupItem) => {
    setEditingRemarkBackup(backup);
    setEditRemark(backup.remark || '');
    setRemarkDialogOpen(true);
  };

  const downloadBackup = (backup: BackupItem) => {
    const url = `${API_BASE}/api/admin/backup/${encodeURIComponent(backup.filename)}/download`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">数据库备份</h2>
          <p className="text-sm text-muted-foreground">管理数据库自动备份和手动备份</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCreateBackup && (
            <Button onClick={() => setCreateDialogOpen(true)} className="bg-brand hover:bg-brand-dark">
              <Plus className="w-4 h-4 mr-2" />
              创建备份
            </Button>
          )}
          {canUpdateBackupConfig && (
            <Button onClick={() => setConfigDialogOpen(true)} variant="outline">
              <Clock className="w-4 h-4 mr-2" />
              备份设置
            </Button>
          )}
          <Button onClick={() => { fetchBackupStatus(); fetchBackups(); }} variant="outline" size="icon">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {backupStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${backupStatus.enabled ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                <Database className={`w-5 h-5 ${backupStatus.enabled ? 'text-green-500' : 'text-gray-500'}`} />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">自动备份</p>
                <p className={`font-medium ${backupStatus.enabled ? 'text-green-400' : 'text-gray-400'}`}>
                  {backupStatus.enabled ? '已启用' : '已禁用'}
                </p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div>
              <p className="text-muted-foreground text-sm">备份频率</p>
              <p className="text-white font-medium">{backupStatus.cron}</p>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div>
              <p className="text-muted-foreground text-sm">备份数量</p>
              <p className="text-white font-medium">{backupStatus.backup_count} / {backupStatus.max_backups}</p>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div>
              <p className="text-muted-foreground text-sm">下次备份</p>
              <p className="text-white font-medium">{backupStatus.next_backup || '未安排'}</p>
            </div>
          </div>
        </div>
      )}

      {backupLoading ? (
        <div className="text-center py-20">
          <span className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin inline-block" />
          <p className="text-muted-foreground mt-4">加载中...</p>
        </div>
      ) : backups.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Database className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">暂无备份文件</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">文件名</th>
                <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">类型</th>
                <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">大小</th>
                <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">创建时间</th>
                <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">备注</th>
                <th className="px-4 md:px-6 py-4 text-right text-sm font-medium text-slate-400">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {backups.map((backup) => (
                <tr key={backup.filename} className="hover:bg-slate-800/30">
                  <td className="px-4 md:px-6 py-4 text-white font-mono text-sm">{backup.filename}</td>
                  <td className="px-4 md:px-6 py-4">
                    <Badge className={backup.is_auto ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}>
                      {backup.is_auto ? '自动' : '手动'}
                    </Badge>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-slate-300">{backup.size_human}</td>
                  <td className="px-4 md:px-6 py-4 text-slate-400 text-sm">{backup.created_at_str}</td>
                  <td className="px-4 md:px-6 py-4 text-slate-300 max-w-[200px] truncate">{backup.remark || '-'}</td>
                  <td className="px-4 md:px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => downloadBackup(backup)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {canUpdateBackupRemark && (
                        <Button
                          onClick={() => openRemarkDialog(backup)}
                          variant="ghost"
                          size="sm"
                          className="text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      )}
                      {canDeleteBackup && (
                        <Button
                          onClick={() => { setDeletingBackup(backup); setDeleteDialogOpen(true); }}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Backup Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-[calc(100%-2rem)] mx-4">
          <DialogHeader>
            <DialogTitle>创建备份</DialogTitle>
            <DialogDescription className="text-slate-400">手动创建数据库备份</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>备注（可选）</Label>
              <Textarea
                value={createRemark}
                onChange={(e) => setCreateRemark(e.target.value)}
                placeholder="输入备份备注..."
                className="bg-slate-800 border-slate-700 min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>取消</Button>
            <Button onClick={createBackup} disabled={creatingLoading} className="bg-brand hover:bg-brand-dark">
              {creatingLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : <><Database className="w-4 h-4 mr-2" />创建备份</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Backup Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-[calc(100%-2rem)] mx-4">
          <DialogHeader>
            <DialogTitle>删除备份</DialogTitle>
            <DialogDescription className="text-slate-400">
              {deletingBackup && `确定要删除 ${deletingBackup.filename} 吗？此操作不可恢复。`}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
            <Button onClick={deleteBackup} disabled={deletingLoading} variant="destructive">
              {deletingLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : <><Trash2 className="w-4 h-4 mr-2" />确认删除</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Remark Dialog */}
      <Dialog open={remarkDialogOpen} onOpenChange={setRemarkDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-[calc(100%-2rem)] mx-4">
          <DialogHeader>
            <DialogTitle>更新备注</DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingRemarkBackup && `更新 ${editingRemarkBackup.filename} 的备注`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>备注</Label>
              <Textarea
                value={editRemark}
                onChange={(e) => setEditRemark(e.target.value)}
                placeholder="输入备份备注..."
                className="bg-slate-800 border-slate-700 min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRemarkDialogOpen(false)}>取消</Button>
            <Button onClick={updateBackupRemark} disabled={updatingRemarkLoading} className="bg-brand hover:bg-brand-dark">
              {updatingRemarkLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : <><Edit3 className="w-4 h-4 mr-2" />保存</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Config Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-[calc(100%-2rem)] mx-4">
          <DialogHeader>
            <DialogTitle>备份设置</DialogTitle>
            <DialogDescription className="text-slate-400">配置自动备份参数</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>启用自动备份</Label>
              <select
                value={editBackupConfig.enabled ? 'true' : 'false'}
                onChange={(e) => setEditBackupConfig({ ...editBackupConfig, enabled: e.target.value === 'true' })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="true">启用</option>
                <option value="false">禁用</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Cron 表达式</Label>
              <Input
                value={editBackupConfig.cron}
                onChange={(e) => setEditBackupConfig({ ...editBackupConfig, cron: e.target.value })}
                className="bg-slate-800 border-slate-700"
                placeholder="0 3 * * *"
              />
              <p className="text-xs text-muted-foreground">默认每天凌晨3点执行</p>
            </div>
            <div className="space-y-2">
              <Label>备份目录</Label>
              <Input
                value={editBackupConfig.backup_dir}
                onChange={(e) => setEditBackupConfig({ ...editBackupConfig, backup_dir: e.target.value })}
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label>最大备份数</Label>
              <Input
                type="number"
                value={editBackupConfig.max_backups}
                onChange={(e) => setEditBackupConfig({ ...editBackupConfig, max_backups: parseInt(e.target.value) || 10 })}
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label>保留天数</Label>
              <Input
                type="number"
                value={editBackupConfig.retention_days}
                onChange={(e) => setEditBackupConfig({ ...editBackupConfig, retention_days: parseInt(e.target.value) || 30 })}
                className="bg-slate-800 border-slate-700"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>取消</Button>
            <Button onClick={updateBackupConfig} disabled={updatingConfigLoading} className="bg-brand hover:bg-brand-dark">
              {updatingConfigLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : <><Clock className="w-4 h-4 mr-2" />保存设置</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
