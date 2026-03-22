import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  LogOut, 
  Settings,
  UserCog,
  ScrollText,
  Menu,
  X,
  Bot,
  Database,
  Edit3,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAdminData } from './hooks/useAdminData';
import { API_BASE } from './types';
import { toast } from 'sonner';

const navItems = [
  { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard, path: '', minLevel: 1 },
  { id: 'appeals', label: '申诉管理', icon: FileText, path: '/appeals', minLevel: 1 },
  { id: 'blacklist', label: '黑名单', icon: Users, path: '/blacklist', minLevel: 1 },
  { id: 'level4-pending', label: '严重违规审核', icon: ShieldAlert, path: '/level4-pending', minLevel: 3 },
  { id: 'admins', label: '管理员', icon: UserCog, path: '/admins', minLevel: 4 },
  { id: 'bots', label: 'Bot Token', icon: Bot, path: '/bots', minLevel: 2 },
  { id: 'logs', label: '审计日志', icon: ScrollText, path: '/logs', minLevel: 2 },
  { id: 'backup', label: '数据库备份', icon: Database, path: '/backup', minLevel: 3 },
  { id: 'settings', label: '系统设置', icon: Settings, path: '/settings', minLevel: 4 },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  
  // Profile dialog state
  const [profileName, setProfileName] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  
  const data = useAdminData();
  const { token, adminLevel, adminInfo, setAdminInfo, stats, isInitialized } = data;

  // Determine active tab from URL
  const currentPath = location.pathname.replace('/admin/dashboard', '');
  const activeTab = navItems.find(item => item.path === currentPath)?.id || 'dashboard';

  // Only redirect after initialization is complete
  useEffect(() => {
    if (isInitialized && !token) {
      // 保存当前路径到 goto 参数，登录后可以跳转回来
      const currentPath = location.pathname + location.search;
      const gotoParam = currentPath !== '/admin' && currentPath !== '/admin/' 
        ? `?goto=${encodeURIComponent(currentPath)}` 
        : '';
      navigate(`/admin${gotoParam}`);
    }
  }, [isInitialized, token, navigate, location]);

  // Stats is already fetched in useAdminData on initialization
  // No need to fetch again here to avoid duplicate requests

  // Initialize profile form when dialog opens
  useEffect(() => {
    if (profileDialogOpen && adminInfo) {
      setProfileName(adminInfo.name || '');
      setProfileAvatar(adminInfo.avatar || '');
      setProfilePassword('');
    }
  }, [profileDialogOpen, adminInfo]);

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch(`${API_BASE}/api/admin/logout`, {
          method: 'POST',
          headers: { 'Authorization': token },
        });
      } catch (err) {
        console.error('登出接口调用失败:', err);
      }
    }
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
    navigate('/admin');
  };

  const handleNavClick = (path: string) => {
    navigate(`/admin/dashboard${path}`);
    setMobileMenuOpen(false);
  };

  const updateProfile = async () => {
    if (!adminInfo || !token) return;
    
    setUpdatingProfile(true);
    try {
      const body: any = {};
      if (profileName !== adminInfo.name) body.name = profileName;
      if (profileAvatar !== adminInfo.avatar) body.avatar = profileAvatar;
      if (profilePassword) {
        if (profilePassword.length < 6) {
          toast.error('密码至少6位');
          setUpdatingProfile(false);
          return;
        }
        body.password = profilePassword;
      }
      
      if (Object.keys(body).length === 0) {
        toast.info('没有修改内容');
        setUpdatingProfile(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/admin/admins/${adminInfo.admin_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('个人信息已更新');
        setProfileDialogOpen(false);
        const updatedInfo = { ...adminInfo, name: profileName, avatar: profileAvatar };
        localStorage.setItem('admin_info', JSON.stringify(updatedInfo));
        setAdminInfo(updatedInfo);
      } else {
        toast.error(data.message || '更新失败');
      }
    } catch (err) {
      toast.error('更新失败');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const visibleNavItems = navItems.filter(item => adminLevel >= item.minLevel);

  const getLevelText = (level?: number) => {
    switch (level) {
      case 4: return '超级管理员 (等级4)';
      case 3: return '普通管理员 (等级3)';
      case 2: return '申诉审核员 (等级2)';
      case 1: return 'Bot持有者 (等级1)';
      default: return '未知';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 z-50 flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand/20 flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-brand" />
          </div>
          <h1 className="font-bold text-white">管理后台</h1>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-800 z-50 transition-transform duration-300 md:translate-x-0 flex flex-col ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header Logo */}
        <div className="p-6 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h1 className="font-bold text-white">管理后台</h1>
              <p className="text-xs text-muted-foreground">云黑库系统</p>
            </div>
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto px-6 py-2 space-y-2">
          {visibleNavItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeTab === item.id 
                  ? 'bg-brand/20 text-brand' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
              {item.id === 'appeals' && stats && stats.pending_appeals > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {stats.pending_appeals}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer - Fixed at bottom */}
        <div className="shrink-0 p-6 border-t border-slate-800 space-y-2">
          <button
            onClick={() => { data.refreshAll(); setMobileMenuOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="清除缓存并刷新数据"
          >
            <RefreshCw className="w-5 h-5" />
            刷新数据
          </button>
          <button
            onClick={() => { setProfileDialogOpen(true); setMobileMenuOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {adminInfo?.avatar ? (
              <img 
                src={adminInfo.avatar} 
                alt={adminInfo.name || adminInfo.admin_id}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                {(adminInfo?.name || adminInfo?.admin_id || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col items-start">
              <span className="text-white text-sm font-medium">
                {adminInfo?.name || adminInfo?.admin_id || '管理员'}
              </span>
              <span className="text-xs text-slate-500">个人设置</span>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            退出登录
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-0 md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
        <Outlet context={data} />
      </main>

      {/* Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-[calc(100%-2rem)] mx-4">
          <DialogHeader>
            <DialogTitle>个人设置</DialogTitle>
            <DialogDescription className="text-slate-400">
              {adminInfo && `修改 ${adminInfo.admin_id} 的个人信息`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>管理员ID</Label>
              <Input value={adminInfo?.admin_id || ''} disabled className="bg-slate-800/50 border-slate-700 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">管理员ID不可修改</p>
            </div>

            <div className="space-y-2">
              <Label>显示名称</Label>
              <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="请输入显示名称" className="bg-slate-800 border-slate-700" />
            </div>

            <div className="space-y-2">
              <Label>头像 URL</Label>
              <Input value={profileAvatar} onChange={(e) => setProfileAvatar(e.target.value)} placeholder="请输入头像图片 URL" className="bg-slate-800 border-slate-700" />
              {profileAvatar && (
                <div className="mt-2">
                  <img src={profileAvatar} alt="头像预览" className="w-16 h-16 rounded-full object-cover border border-slate-700" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>新密码（留空则不修改）</Label>
              <Input type="password" value={profilePassword} onChange={(e) => setProfilePassword(e.target.value)} placeholder="请输入新密码（至少6位）" className="bg-slate-800 border-slate-700" />
            </div>

            <div className="space-y-2">
              <Label>权限等级</Label>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-muted-foreground">
                {getLevelText(adminInfo?.level)}
              </div>
              <p className="text-xs text-muted-foreground">权限等级只能由超级管理员修改</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileDialogOpen(false)}>取消</Button>
            <Button onClick={updateProfile} disabled={updatingProfile} className="bg-brand hover:bg-brand-dark">
              {updatingProfile ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
              保存修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
