import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { UserCog, Edit3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AdminDataContext } from '../hooks/useAdminData';
import type { Admin } from '../types';
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
  FormSelect,
  AdminLevelBadge,
} from '../components';
import { useApiMutation } from '../hooks';

export function AdminsPage() {
  const { token, adminLevel, adminInfo, admins, adminLoading, fetchAdmins } = useOutletContext<AdminDataContext>();
  
  // Permissions
  const canCreateAdmin = adminLevel >= 4;  // 仅超级管理员可创建
  const canDeleteAdmin = adminLevel >= 4;  // 仅超级管理员可删除
  const canEditLevel = adminLevel >= 4;    // 仅超级管理员可修改等级
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newAdminId, setNewAdminId] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminLevel, setNewAdminLevel] = useState(3);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editLevel, setEditLevel] = useState(3);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAdmin, setDeletingAdmin] = useState<Admin | null>(null);
  
  // API mutations
  const { mutate: addAdminMutate, loading: addingLoading } = useApiMutation(token, {
    successMessage: '管理员创建成功',
  });
  const { mutate: updateAdminMutate, loading: updatingLoading } = useApiMutation(token, {
    successMessage: '管理员信息已更新',
  });
  const { mutate: deleteAdminMutate, loading: deletingLoading } = useApiMutation(token, {
    successMessage: '管理员已删除',
  });

  useEffect(() => {
    if (token) fetchAdmins();
  }, [token]);



  const addAdmin = async () => {
    if (!newAdminId.trim() || !newAdminName.trim() || !newAdminPassword.trim()) return;
    
    if (newAdminPassword.length < 6) {
      toast.error('密码至少6位');
      return;
    }
    
    const result = await addAdminMutate(
      '/api/admin/admins',
      { method: 'POST' },
      {
        admin_id: newAdminId,
        name: newAdminName,
        password: newAdminPassword,
        level: newAdminLevel,
      }
    );
    
    if (result) {
      setAddDialogOpen(false);
      setNewAdminId('');
      setNewAdminName('');
      setNewAdminPassword('');
      setNewAdminLevel(3);
      fetchAdmins();
    }
  };

  const updateAdmin = async () => {
    if (!editingAdmin) return;
    
    const body: Record<string, unknown> = {};
    if (editName !== editingAdmin.name) body.name = editName;
    if (editPassword) {
      if (editPassword.length < 6) {
        toast.error('密码至少6位');
        return;
      }
      body.password = editPassword;
    }
    if (editLevel !== editingAdmin.level && adminLevel >= 4) {
      body.level = editLevel;
    }
    
    if (Object.keys(body).length === 0) {
      toast.info('没有修改内容');
      return;
    }

    const result = await updateAdminMutate(
      `/api/admin/admins/${editingAdmin.admin_id}`,
      { method: 'PUT' },
      body
    );
    
    if (result) {
      setEditDialogOpen(false);
      fetchAdmins();
    }
  };

  const deleteAdmin = async () => {
    if (!deletingAdmin) return;
    
    const result = await deleteAdminMutate(
      `/api/admin/admins/${deletingAdmin.admin_id}`,
      { method: 'DELETE' }
    );
    
    if (result) {
      setDeleteDialogOpen(false);
      fetchAdmins();
    }
  };

  const openEditDialog = (admin: Admin) => {
    setEditingAdmin(admin);
    setEditName(admin.name);
    setEditPassword('');
    setEditLevel(admin.level);
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="管理员管理" description="管理系统管理员账号">
        {canCreateAdmin && (
          <Button onClick={() => setAddDialogOpen(true)} className="bg-brand hover:bg-brand-dark">
            <UserCog className="w-4 h-4 mr-2" />
            添加管理员
          </Button>
        )}
      </PageHeader>

      {adminLoading ? (
        <LoadingSpinner />
      ) : admins.length === 0 ? (
        <EmptyState icon={UserCog} description="暂无管理员" />
      ) : (
        <div className="glass rounded-2xl overflow-x-auto">
          <table className="w-full" style={{ tableLayout: 'auto' }}>
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">头像</th>
                <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">管理员ID</th>
                <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">名称</th>
                <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">等级</th>
                <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">创建时间</th>
                <th className="px-4 md:px-6 py-4 text-right text-sm font-medium text-slate-400">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {admins.map((admin) => (
                <tr key={admin.admin_id} className="hover:bg-slate-800/30">
                  <td className="px-4 md:px-6 py-4">
                    {admin.avatar ? (
                      <img src={admin.avatar} alt={admin.name} className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-medium">
                        {admin.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 md:px-6 py-4 text-white font-mono">{admin.admin_id}</td>
                  <td className="px-4 md:px-6 py-4 text-slate-300">{admin.name}</td>
                  <td className="px-4 md:px-6 py-4"><AdminLevelBadge level={admin.level} /></td>
                  <td className="px-4 md:px-6 py-4 text-slate-400 text-sm whitespace-nowrap">{new Date(admin.created_at).toLocaleString()}</td>
                  <td className="px-4 md:px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {/* 等级4可以编辑任何管理员，等级3只能编辑自己 */}
                      {(canEditLevel || admin?.admin_id === adminInfo?.admin_id) && (
                        <Button 
                          onClick={() => openEditDialog(admin)} 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                          title={canEditLevel ? '编辑管理员' : '编辑我的信息'}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      )}
                      {/* 等级4可以删除管理员，但不能删除自己 */}
                      {canDeleteAdmin && admin?.admin_id !== adminInfo?.admin_id && (
                        <Button 
                          onClick={() => { setDeletingAdmin(admin); setDeleteDialogOpen(true); }} 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          title="删除管理员"
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
            <DialogTitle>添加管理员</DialogTitle>
            <DialogDescription className="text-slate-400">创建新的管理员账号</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <FormInput
              label="管理员ID"
              value={newAdminId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAdminId(e.target.value)}
              placeholder="请输入管理员唯一ID"
            />
            <FormInput
              label="显示名称"
              value={newAdminName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAdminName(e.target.value)}
              placeholder="请输入显示名称"
            />
            <FormInput
              label="密码"
              type="password"
              value={newAdminPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAdminPassword(e.target.value)}
              placeholder="请输入密码（至少6位）"
            />
            <FormSelect
              label="权限等级"
              value={String(newAdminLevel)}
              onChange={(e) => setNewAdminLevel(parseInt(e.target.value))}
              options={[
                { value: '3', label: '普通管理员 (等级3)' },
                { value: '2', label: '申诉审核员 (等级2)' },
                { value: '1', label: 'Bot持有者 (等级1)' },
              ]}
              hint="等级4超级管理员只能由现有超级管理员手动在配置文件中设置"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>取消</Button>
            <LoadingButton
              onClick={addAdmin}
              loading={addingLoading}
              icon={UserCog}
              className="bg-brand hover:bg-brand-dark"
            >
              创建管理员
            </LoadingButton>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <AdminDialogContent>
          <DialogHeader>
            <DialogTitle>修改管理员</DialogTitle>
            <DialogDescription className="text-slate-400">{editingAdmin && `修改管理员 ${editingAdmin.admin_id} 的信息`}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <FormInput
              label="显示名称"
              value={editName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
              placeholder="请输入显示名称"
            />
            <FormInput
              label="新密码（留空则不修改）"
              type="password"
              value={editPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditPassword(e.target.value)}
              placeholder="请输入新密码（至少6位）"
            />
            {adminLevel >= 4 && (
              <FormSelect
                label="权限等级"
                value={String(editLevel)}
                onChange={(e) => setEditLevel(parseInt(e.target.value))}
                options={[
                  { value: '4', label: '超级管理员 (等级4)' },
                  { value: '3', label: '普通管理员 (等级3)' },
                  { value: '2', label: '申诉审核员 (等级2)' },
                  { value: '1', label: 'Bot持有者 (等级1)' },
                ]}
              />
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
            <LoadingButton
              onClick={updateAdmin}
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
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="删除管理员"
        description={deletingAdmin && `确定要删除管理员 ${deletingAdmin.admin_id} (${deletingAdmin.name}) 吗？此操作不可恢复。`}
        onConfirm={deleteAdmin}
        loading={deletingLoading}
        icon={Trash2}
        confirmText="确认删除"
      />
    </div>
  );
}
