import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Bot, Plus, Edit3, Trash2, Eye, EyeOff, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { AdminDataContext } from '../hooks/useAdminData';
import type { BotToken } from '../types';
import { API_BASE } from '../types';
import { toast } from 'sonner';

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
  const [addingLoading, setAddingLoading] = useState(false);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<BotToken | null>(null);
  const [editOwner, setEditOwner] = useState('');
  const [editDescription, setEditDescription] = useState('');
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
      const response = await fetch(`${API_BASE}/api/admin/bots`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bot_name: newBotName,
          owner: newBotOwner,
          description: newBotDescription,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Bot Token 创建成功');
        setAddDialogOpen(false);
        setNewBotName('');
        setNewBotOwner('');
        setNewBotDescription('');
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
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">Bot Token 管理</h2>
          <p className="text-sm text-muted-foreground">管理 Bot Token，用于 Bot 自动化操作</p>
        </div>
        {canCreateBot && (
          <Button onClick={() => setAddDialogOpen(true)} className="bg-brand hover:bg-brand-dark">
            <Plus className="w-4 h-4 mr-2" />
            创建 Bot Token
          </Button>
        )}
      </div>

      {botsLoading ? (
        <div className="text-center py-20">
          <span className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin inline-block" />
          <p className="text-muted-foreground mt-4">加载中...</p>
        </div>
      ) : bots.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Bot className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-muted-foreground">暂无 Bot Token</p>
        </div>
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
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-[calc(100%-2rem)] mx-4">
          <DialogHeader>
            <DialogTitle>创建 Bot Token</DialogTitle>
            <DialogDescription className="text-slate-400">创建新的 Bot Token 用于自动化操作</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Bot 名称</Label>
              <Input value={newBotName} onChange={(e) => setNewBotName(e.target.value)} placeholder="请输入 Bot 名称" className="bg-slate-800 border-slate-700" />
            </div>
            <div className="space-y-2">
              <Label>所有者</Label>
              <Input value={newBotOwner} onChange={(e) => setNewBotOwner(e.target.value)} placeholder="请输入所有者名称" className="bg-slate-800 border-slate-700" />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea value={newBotDescription} onChange={(e) => setNewBotDescription(e.target.value)} placeholder="请输入描述（可选）" className="bg-slate-800 border-slate-700 min-h-[100px]" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>取消</Button>
            <Button onClick={createBot} disabled={!newBotName.trim() || !newBotOwner.trim() || addingLoading} className="bg-brand hover:bg-brand-dark">
              {addingLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : <><Plus className="w-4 h-4 mr-2" />创建</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-[calc(100%-2rem)] mx-4">
          <DialogHeader>
            <DialogTitle>编辑 Bot Token</DialogTitle>
            <DialogDescription className="text-slate-400">{editingBot && `编辑 ${editingBot.bot_name} 的信息`}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Bot 名称</Label>
              <Input value={editingBot?.bot_name || ''} disabled className="bg-slate-800/50 border-slate-700 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <Label>所有者</Label>
              <Input value={editOwner} onChange={(e) => setEditOwner(e.target.value)} placeholder="请输入所有者名称" className="bg-slate-800 border-slate-700" />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="请输入描述（可选）" className="bg-slate-800 border-slate-700 min-h-[100px]" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
            <Button onClick={updateBot} disabled={updatingLoading} className="bg-brand hover:bg-brand-dark">
              {updatingLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : <><Edit3 className="w-4 h-4 mr-2" />保存</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-[calc(100%-2rem)] mx-4">
          <DialogHeader>
            <DialogTitle>删除 Bot Token</DialogTitle>
            <DialogDescription className="text-slate-400">{deletingBot && `确定要删除 ${deletingBot.bot_name} 吗？此操作不可恢复。`}</DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
            <Button onClick={deleteBot} disabled={deletingLoading} variant="destructive">
              {deletingLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : <><Trash2 className="w-4 h-4 mr-2" />确认删除</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Token Dialog */}
      <Dialog open={viewTokenDialogOpen} onOpenChange={setViewTokenDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-[calc(100%-2rem)] mx-4">
          <DialogHeader>
            <DialogTitle>查看 Bot Token</DialogTitle>
            <DialogDescription className="text-slate-400">{viewingBot && `${viewingBot.bot_name} 的 Token`}</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {tokenLoading ? (
              <div className="flex items-center justify-center py-8">
                <span className="w-6 h-6 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
              </div>
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
