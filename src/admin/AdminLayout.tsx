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
  Image,
  ExternalLink,
  Link2,
  Link2Off,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  MoreHorizontal,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAdminData } from './hooks/useAdminData';
import { API_BASE } from './types';
import { toast } from 'sonner';
import { DocReminder, ExternalLinkProvider } from './components';
import { openExternalLink } from './components/ExternalLinkProvider';

const DOC_URL = 'https://cloudblack.apifox.cn?pwd=PIMENGNB';

// 独立菜单项
type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  minLevel: number;
};

// 分组菜单项
type NavGroup = {
  id: string;
  label: string;
  icon: React.ElementType;
  minLevel: number;
  items: { id: string; label: string; path: string; minLevel: number; external?: boolean }[];
};

const standaloneNavItems: NavItem[] = [
  { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard, path: '', minLevel: 1 },
  { id: 'blacklist', label: '黑名单', icon: Users, path: '/blacklist', minLevel: 1 },
];

const groupedNavItems: NavGroup[] = [
  {
    id: 'review',
    label: '审核',
    icon: ClipboardList,
    minLevel: 1,
    items: [
      { id: 'appeals', label: '申诉管理', path: '/appeals', minLevel: 1 },
      { id: 'level4-pending', label: '严重违规审核', path: '/level4-pending', minLevel: 3 },
    ],
  },
  {
    id: 'others',
    label: '其他',
    icon: MoreHorizontal,
    minLevel: 2,
    items: [
      { id: 'bots', label: 'Bot Token', path: '/bots', minLevel: 2 },
      { id: 'bot-docs', label: '对接文档', path: DOC_URL, minLevel: 2, external: true },
    ],
  },
  {
    id: 'system',
    label: '系统管理',
    icon: Shield,
    minLevel: 2,
    items: [
      { id: 'admins', label: '管理员', path: '/admins', minLevel: 4 },
      { id: 'images', label: '图片管理', path: '/images', minLevel: 3 },
      { id: 'logs', label: '审计日志', path: '/logs', minLevel: 2 },
      { id: 'backup', label: '数据库备份', path: '/backup', minLevel: 3 },
      { id: 'settings', label: '系统设置', path: '/settings', minLevel: 4 },
    ],
  },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  
  // 折叠菜单状态
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    // 默认展开所有分组
    return {
      review: true,
      others: true,
      system: true,
    };
  });
  
  // Profile dialog state
  const [profileName, setProfileName] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  
  // Logto binding state
  const [logtoStatus, setLogtoStatus] = useState<{ enabled: boolean; bound: boolean; logto_id?: string; logto_email?: string } | null>(null);
  const [loadingLogtoStatus, setLoadingLogtoStatus] = useState(false);
  const [bindingLogto, setBindingLogto] = useState(false);
  const [unbindingLogto, setUnbindingLogto] = useState(false);
  const [unbindPassword, setUnbindPassword] = useState('');
  const [showUnbindDialog, setShowUnbindDialog] = useState(false);
  
  const data = useAdminData();
  const { token, adminLevel, adminInfo, setAdminInfo, stats, isInitialized } = data;

  // Determine active tab from URL
  const currentPath = location.pathname.replace('/admin/dashboard', '');
  const activeTab = 
    standaloneNavItems.find(item => item.path === currentPath)?.id ||
    groupedNavItems.flatMap(g => g.items).find(item => item.path === currentPath)?.id ||
    'dashboard';

  // 切换分组展开状态
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

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
      fetchLogtoStatus();
    }
  }, [profileDialogOpen, adminInfo]);

  // Fetch Logto binding status
  const fetchLogtoStatus = async () => {
    if (!token) return;
    setLoadingLogtoStatus(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/logto/status`, {
        headers: { 'Authorization': token },
      });
      const data = await response.json();
      if (data.success) {
        setLogtoStatus(data.data);
      }
    } catch (err) {
      console.error('获取Logto绑定状态失败:', err);
    } finally {
      setLoadingLogtoStatus(false);
    }
  };

  // Bind Logto account
  const bindLogto = async () => {
    if (!token) {
      toast.error('未登录，请先登录');
      return;
    }
    setBindingLogto(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/logto/bind/url`, {
        method: 'POST',
        headers: { 
          'Authorization': token,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      
      if (data.success && data.data?.url) {
        // Redirect to Logto authorization page
        window.location.href = data.data.url;
      } else {
        toast.error(data.message || '获取绑定链接失败');
      }
    } catch (err) {
      console.error('绑定请求失败:', err);
      toast.error('绑定请求失败');
    } finally {
      setBindingLogto(false);
    }
  };

  // Unbind Logto account
  const unbindLogto = async () => {
    if (!token || !unbindPassword) return;
    setUnbindingLogto(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/logto/unbind`, {
        method: 'POST',
        headers: { 
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: unbindPassword }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Logto 账户解绑成功');
        setLogtoStatus(prev => prev ? { ...prev, bound: false, logto_id: undefined, logto_email: undefined } : null);
        setShowUnbindDialog(false);
        setUnbindPassword('');
      } else {
        toast.error(data.message || '解绑失败');
      }
    } catch (err) {
      toast.error('解绑请求失败');
    } finally {
      setUnbindingLogto(false);
    }
  };

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

  // 过滤可见的独立菜单项
  const visibleStandaloneItems = standaloneNavItems.filter(item => adminLevel >= item.minLevel);
  
  // 过滤可见的分组菜单
  const visibleGroups = groupedNavItems
    .map(group => ({
      ...group,
      items: group.items.filter(item => adminLevel >= item.minLevel),
    }))
    .filter(group => group.items.length > 0 && adminLevel >= group.minLevel);

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
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50 flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand/20 flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-brand" />
          </div>
          <h1 className="font-bold text-foreground">管理后台</h1>
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
      <aside className={`fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-50 transition-transform duration-300 md:translate-x-0 flex flex-col ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header Logo */}
        <div className="p-6 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">管理后台</h1>
              <p className="text-xs text-muted-foreground">云黑库系统</p>
            </div>
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto px-6 py-2 space-y-1">
          {/* 独立菜单项 */}
          {visibleStandaloneItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeTab === item.id 
                  ? 'bg-brand/20 text-brand' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
          
          {/* 分组菜单 */}
          {visibleGroups.map(group => (
            <div key={group.id} className="space-y-1">
              {/* 分组标题按钮 */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <group.icon className="w-5 h-5" />
                <span className="flex-1 text-left text-sm font-medium">{group.label}</span>
                {expandedGroups[group.id] ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              
              {/* 分组子项 */}
              {expandedGroups[group.id] && (
                <div className="ml-4 pl-4 border-l border-border space-y-1">
                  {group.items.map(subItem => (
                    <button
                      key={subItem.id}
                      onClick={() => {
                        if (subItem.external) {
                          openExternalLink(subItem.path);
                        } else {
                          handleNavClick(subItem.path);
                        }
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
                        activeTab === subItem.id 
                          ? 'bg-brand/20 text-brand' 
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <span className="text-sm font-medium">{subItem.label}</span>
                      {subItem.id === 'appeals' && stats && stats.pending_appeals > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                          {stats.pending_appeals}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer - Fixed at bottom */}
        <div className="shrink-0 p-6 border-t border-border space-y-2">
          <button
            onClick={() => { data.refreshAll(); setMobileMenuOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="清除缓存并刷新数据"
          >
            <RefreshCw className="w-5 h-5" />
            刷新数据
          </button>
          <button
            onClick={() => { setProfileDialogOpen(true); setMobileMenuOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
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
              <span className="text-foreground text-sm font-medium">
                {adminInfo?.name || adminInfo?.admin_id || '管理员'}
              </span>
              <span className="text-xs text-muted-foreground">个人设置</span>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
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
        <DialogContent className="bg-card border-border text-foreground max-w-lg w-[calc(100%-2rem)] mx-4">
          <DialogHeader>
            <DialogTitle>个人设置</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {adminInfo && `修改 ${adminInfo.admin_id} 的个人信息`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>管理员ID</Label>
              <Input value={adminInfo?.admin_id || ''} disabled className="bg-muted/50 border-border text-muted-foreground" />
              <p className="text-xs text-muted-foreground">管理员ID不可修改</p>
            </div>

            <div className="space-y-2">
              <Label>显示名称</Label>
              <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="请输入显示名称" className="bg-muted border-border" />
            </div>

            <div className="space-y-2">
              <Label>头像 URL</Label>
              <Input value={profileAvatar} onChange={(e) => setProfileAvatar(e.target.value)} placeholder="请输入头像图片 URL" className="bg-muted border-border" />
              {profileAvatar && (
                <div className="mt-2">
                  <img src={profileAvatar} alt="头像预览" className="w-16 h-16 rounded-full object-cover border border-border" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>新密码（留空则不修改）</Label>
              <Input type="password" value={profilePassword} onChange={(e) => setProfilePassword(e.target.value)} placeholder="请输入新密码（至少6位）" className="bg-muted border-border" />
            </div>

            <div className="space-y-2">
              <Label>权限等级</Label>
              <div className="bg-muted/50 border border-border rounded-lg px-3 py-2 text-muted-foreground">
                {getLevelText(adminInfo?.level)}
              </div>
              <p className="text-xs text-muted-foreground">权限等级只能由超级管理员修改</p>
            </div>

            {/* Logto SSO Binding */}
            {logtoStatus?.enabled && (
              <div className="space-y-2 pt-4 border-t border-border">
                <Label className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Logto SSO 绑定
                </Label>
                
                {loadingLogtoStatus ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                    加载中...
                  </div>
                ) : logtoStatus?.bound ? (
                  <div className="space-y-3">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 text-green-500 text-sm">
                        <Link2 className="w-4 h-4" />
                        <span>已绑定 Logto 账户</span>
                      </div>
                      {logtoStatus.logto_email && (
                        <p className="text-xs text-muted-foreground mt-1">
                          邮箱: {logtoStatus.logto_email}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUnbindDialog(true)}
                      className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                    >
                      <Link2Off className="w-4 h-4 mr-2" />
                      解绑 Logto 账户
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground">
                      未绑定 Logto 账户，绑定后可使用 SSO 登录
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={bindLogto}
                      disabled={bindingLogto}
                      className="w-full"
                    >
                      {bindingLogto ? (
                        <span className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin mr-2" />
                      ) : (
                        <Link2 className="w-4 h-4 mr-2" />
                      )}
                      绑定 Logto 账户
                    </Button>
                  </div>
                )}
              </div>
            )}
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

      {/* Unbind Logto Dialog */}
      <Dialog open={showUnbindDialog} onOpenChange={setShowUnbindDialog}>
        <DialogContent className="bg-card border-border text-foreground max-w-md w-[calc(100%-2rem)] mx-4">
          <DialogHeader>
            <DialogTitle>解绑 Logto 账户</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              解绑后您将无法使用 SSO 登录，请确保您记得当前账户的密码。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>当前密码</Label>
              <Input
                type="password"
                value={unbindPassword}
                onChange={(e) => setUnbindPassword(e.target.value)}
                placeholder="请输入当前密码以确认解绑"
                className="bg-muted border-border"
              />
              <p className="text-xs text-muted-foreground">需要验证密码以确保账户安全</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnbindDialog(false)}>取消</Button>
            <Button
              variant="destructive"
              onClick={unbindLogto}
              disabled={unbindingLogto || !unbindPassword}
            >
              {unbindingLogto ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <Link2Off className="w-4 h-4 mr-2" />
              )}
              确认解绑
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bot 对接文档提醒 */}
      <DocReminder />

      {/* 全局外链警告对话框 */}
      <ExternalLinkProvider />
    </div>
  );
}
