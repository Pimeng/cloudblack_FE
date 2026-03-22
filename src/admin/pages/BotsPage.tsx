import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Bot, Plus, Edit3, Trash2, Eye, EyeOff, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AdminDataContext } from '../hooks/useAdminData';
import type { BotToken } from '../types';
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
  ConfirmDialog,
  FormInput,
  FormTextarea,
} from '../components';

export function BotsPage() {
  const { token, adminLevel, adminInfo, bots, botsLoading, fetchBots } = useOutletContext<AdminDataContext>();
  
  // Permissions
  // 等级4可以管理所有Bot，等级1只能管理自己的Bot
  const canCreateBot = adminLevel >= 4;
  const canViewToken = adminLevel >= 4;
  const canEditAnyBot = adminLevel >= 4;
  const canDeleteAnyBot = adminLevel >= 4;
  // 等级1+可以查看列表，但只能修改/删除自己的Bot（后端校验）
  const canManageOwnBot = adminLevel >= 1;
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newBotName, setNewBotName] = useState('');
  const [newBotOwner, setNewBotOwner] = useState('');
  const [newBotDescription, setNewBotDescription] = useState('');
  const [newBotToken, setNewBotToken] = useState('');
  const [useCustomToken, setUseCustomToken] = useState(false);
  const [addingLoading, setAddingLoading] = useState(false);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<BotToken | null>(null);
  const [editOwner, setEditOwner] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editToken, setEditToken] = useState('');
  const [editChangeToken, setEditChangeToken] = useState(false);
  const [updatingLoading, setUpdatingLoading] = useState(false);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingBot, setDeletingBot] = useState<BotToken | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  
  const [viewTokenDialogOpen, setViewTokenDialogOpen] = useState(false);
  const [viewingBot, setViewingBot] = useState<BotToken | null>(null);
  const [viewingToken, setViewingToken] = useState('');
  const [tokenLoading, setTokenLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    if (token) fetchBots();
  }, [token]);

  const createBot = async () => {
    if (!newBotName.trim() || !newBotOwner.trim() || !token) return;
    
    setAddingLoading(true);
    try {
      const body: any = {
        bot_name: newBotName,
        owner: newBotOwner,
        description: newBotDescription,
      };
      if (useCustomToken && newBotToken.trim()) {
        body.token = newBotToken.trim();
      }

      const response = await fetch(`${API_BASE}/api/admin/bots`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Bot Token 创建成功');
        setAddDialogOpen(false);
        setNewBotName('');
        setNewBotOwner('');
        setNewBotDescription('');
        setNewBotToken('');
        setUseCustomToken(false);
        fetchBots();
      } else {
        toast.error(data.message || '创建失败');
      }
    } catch (err) {
      toast.error('创建失败');
    } finally {
      setAddingLoading(false);
    }
  };

  const updateBot = async () => {
    if (!editingBot || !token) return;
    
    setUpdatingLoading(true);
    try {
      const body: any = {};
      if (editOwner !== editingBot.owner) body.owner = editOwner;
      if (editDescription !== (editingBot.description || '')) body.description = editDescription;
      if (editChangeToken && editToken.trim()) body.token = editToken.trim();
      
      if (Object.keys(body).length === 0) {
        toast.info('没有修改内容');
        setUpdatingLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/admin/bots/${editingBot.bot_name}`, {
        method: 'PUT',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Bot Token 已更新');
        setEditDialogOpen(false);
        fetchBots();
      } else {
        toast.error(data.message || '更新失败');
      }
    } catch (err) {
      toast.error('更新失败');
    } finally {
      setUpdatingLoading(false);
    }
  };

  const deleteBot = async () => {
    if (!deletingBot || !token) return;
    
    setDeletingLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/bots/${deletingBot.bot_name}`, {
        method: 'DELETE',
        headers: { 'Authorization': token },
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Bot Token 已删除');
        setDeleteDialogOpen(false);
        fetchBots();
      } else {
        toast.error(data.message || '删除失败');
      }
    } catch (err) {
      toast.error('删除失败');
    } finally {
      setDeletingLoading(false);
    }
  };

  const viewToken = async (bot: BotToken) => {
    if (!token) return;
    
    setViewingBot(bot);
    setViewTokenDialogOpen(true);
    setTokenLoading(true);
    setShowToken(false);
    
    try {
      const response = await fetch(`${API_BASE}/api/admin/bots/${bot.bot_name}/token`, {
        headers: { 'Authorization': token },
      });
      
      const data = await response.json();
      if (data.success) {
        setViewingToken(data.data.token);
      } else {
        toast.error(data.message || '获取 Token 失败');
      }
    } catch (err) {
      toast.error('获取 Token 失败');
    } finally {
      setTokenLoading(false);
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(viewingToken);
    toast.success('Token 已复制到剪贴板');
  };

  const openEditDialog = (bot: BotToken) => {
    setEditingBot(bot);
    setEditOwner(bot.owner);
    setEditDescription(bot.description || '');
    setEditToken('');
    setEditChangeToken(false);
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Bot Token 管理" description="管理 Bot Token，用于 Bot 自动化操作">
        {canCreateBot && (
          <Button onClick={() => setAddDialogOpen(true)} className="bg-brand hover:bg-brand-dark">
            <Plus className="w-4 h-4 mr-2" />
            创建 Bot Token
          </Button>
        )}
      </PageHeader>

      {botsLoading ? (
        <LoadingSpinner />
      ) : bots.length === 0 ? (
        <EmptyState icon={Bot} description="暂无 Bot Token" />
      ) : (
        <div className="glass rounded-2xl overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">Bot 名称</th>
                <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">所有者</th>
                <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">描述</th>
                <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">创建时间</th>
                <th className="px-4 md:px-6 py-4 text-right text-sm font-medium text-slate-400">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {bots.map((bot) => (
                <tr key={bot.bot_name} className="hover:bg-slate-800/30">
                  <td className="px-4 md:px-6 py-4 text-white font-mono">{bot.bot_name}</td>
                  <td className="px-4 md:px-6 py-4 text-slate-300">{bot.owner}</td>
                  <td className="px-4 md:px-6 py-4 text-slate-400 max-w-[200px] truncate">{bot.description || '-'}</td>
                  <td className="px-4 md:px-6 py-4 text-slate-400 text-sm">{new Date(bot.created_at).toLocaleString()}</td>
                  <td className="px-4 md:px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {canViewToken && (
                        <Button
                          onClick={() => viewToken(bot)}
                          variant="ghost"
                          size="sm"
                          className="text-purple-500 hover:text-purple-400 hover:bg-purple-500/10"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {/* 等级4可以编辑任何Bot，等级1只能编辑自己的Bot */}
                      {(canEditAnyBot || (canManageOwnBot && bot.owner === adminInfo?.admin_id)) && (
                        <Button
                          onClick={() => openEditDialog(bot)}
                          variant="ghost"
                          size="sm"
                          className="text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                          title={canEditAnyBot ? '编辑 Bot' : '编辑我的 Bot'}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      )}
                      {/* 等级4可以删除任何Bot，等级1只能删除自己的Bot */}
                      {(canDeleteAnyBot || (canManageOwnBot && bot.owner === adminInfo?.admin_id)) && (
                        <Button
                          onClick={() => { setDeletingBot(bot); setDeleteDialogOpen(true); }}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          title={canDeleteAnyBot ? '删除 Bot' : '删除我的 Bot'}
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

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <AdminDialogContent>
          <DialogHeader>
            <DialogTitle>创建 Bot Token</DialogTitle>
            <DialogDescription className="text-slate-400">创建新的 Bot Token 用于自动化操作</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <FormInput
              label="Bot 名称"
              value={newBotName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewBotName(e.target.value)}
              placeholder="请输入 Bot 名称"
            />
            <FormInput
              label="所有者"
              value={newBotOwner}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewBotOwner(e.target.value)}
              placeholder="请输入所有者名称"
            />
            <FormTextarea
              label="描述"
              value={newBotDescription}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewBotDescription(e.target.value)}
              placeholder="请输入描述（可选）"
              textareaClassName="min-h-[80px]"
            />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useCustomToken"
                  checked={useCustomToken}
                  onChange={(e) => setUseCustomToken(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-brand focus:ring-brand"
                />
                <label htmlFor="useCustomToken" className="text-sm cursor-pointer">自定义 Token（可选）</label>
              </div>
              {useCustomToken && (
                <FormInput
                  value={newBotToken}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewBotToken(e.target.value)}
                  placeholder="请输入自定义 Token"
                  inputClassName="font-mono text-sm"
                />
              )}
              <p className="text-xs text-muted-foreground">不勾选则系统自动生成随机 Token</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>取消</Button>
            <LoadingButton
              onClick={createBot}
              loading={addingLoading}
              icon={Plus}
              disabled={!newBotName.trim() || !newBotOwner.trim()}
              className="bg-brand hover:bg-brand-dark"
            >
              创建
            </LoadingButton>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <AdminDialogContent>
          <DialogHeader>
            <DialogTitle>编辑 Bot Token</DialogTitle>
            <DialogDescription className="text-slate-400">{editingBot && `编辑 ${editingBot.bot_name} 的信息`}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <FormInput
              label="Bot 名称"
              value={editingBot?.bot_name || ''}
              disabled
            />
            <FormInput
              label="所有者"
              value={editOwner}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditOwner(e.target.value)}
              placeholder="请输入所有者名称"
            />
            <FormTextarea
              label="描述"
              value={editDescription}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditDescription(e.target.value)}
              placeholder="请输入描述（可选）"
              textareaClassName="min-h-[80px]"
            />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editChangeToken"
                  checked={editChangeToken}
                  onChange={(e) => setEditChangeToken(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-brand focus:ring-brand"
                />
                <label htmlFor="editChangeToken" className="cursor-pointer text-sm text-yellow-500">修改 Token</label>
              </div>
              {editChangeToken && (
                <FormInput
                  value={editToken}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditToken(e.target.value)}
                  placeholder="请输入新的 Token"
                  inputClassName="font-mono text-sm"
                />
              )}
              <p className="text-xs text-muted-foreground">修改 Token 后原 Token 将立即失效</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
            <LoadingButton
              onClick={updateBot}
              loading={updatingLoading}
              icon={Edit3}
              className="bg-brand hover:bg-brand-dark"
            >
              保存
            </LoadingButton>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="删除 Bot Token"
        description={deletingBot && `确定要删除 ${deletingBot.bot_name} 吗？此操作不可恢复。`}
        onConfirm={deleteBot}
        loading={deletingLoading}
        icon={Trash2}
        confirmText="确认删除"
      />

      {/* View Token Dialog */}
      <Dialog open={viewTokenDialogOpen} onOpenChange={setViewTokenDialogOpen}>
        <AdminDialogContent>
          <DialogHeader>
            <DialogTitle>查看 Bot Token</DialogTitle>
            <DialogDescription className="text-slate-400">{viewingBot && `${viewingBot.bot_name} 的 Token`}</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {tokenLoading ? (
              <LoadingSpinner size="sm" text="" className="py-8" />
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <Input 
                    value={showToken ? viewingToken : '•'.repeat(viewingToken.length || 32)} 
                    readOnly 
                    className="bg-slate-800 border-slate-700 pr-24 font-mono text-sm" 
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowToken(!showToken)}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-white"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyToken}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">请妥善保管 Token，不要泄露给他人</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewTokenDialogOpen(false)}>关闭</Button>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>
    </div>
  );
}
