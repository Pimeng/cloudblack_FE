import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  LogOut, 
  CheckCircle, 
  XCircle, 
  Clock,
  Search,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  UserX,
  UserCheck,
  Ban,
  Trash2,
  TrendingUp,
  Settings,
  UserCog,
  Edit3,
  RotateCcw,
  Server,
  Shield,
  Power,
  Eye,
  ScrollText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const API_BASE = 'https://cloudblack-api.07210700.xyz';

type Tab = 'dashboard' | 'appeals' | 'blacklist' | 'admins' | 'logs' | 'settings';

interface Stats {
  pending_appeals: number;
  total_appeals: number;
  blacklist_count: number;
  processed_appeals: number;
  success_rate: number;
  avg_processing_hours: number;
}

interface Appeal {
  appeal_id: string;
  user_id: string;
  user_type: 'user' | 'group';
  content: string;
  contact_email: string;
  images: string[];
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at?: string;
  review?: {
    action: string;
    reason: string;
    admin_id: string;
    admin_name: string;
    reviewed_at: string;
  };
}

interface BlacklistItem {
  user_id: string;
  reason: string;
  added_by: string;
  added_at: string;
  updated_at?: string;
}

interface Admin {
  admin_id: string;
  name: string;
  level: number;
  created_at: string;
}

interface SystemConfig {
  host: string;
  port: number;
  debug: boolean;
  temp_token_ttl: number;
  [key: string]: any;
}

interface SystemInfo {
  platform: string;
  python_version: string;
  cpu_percent: number;
  memory: {
    total: number;
    available: number;
    percent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percent: number;
  };
  uptime: number;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [token, setToken] = useState('');
  const [adminLevel, setAdminLevel] = useState<number>(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [appealPage, setAppealPage] = useState(1);
  const [blacklistPage, setBlacklistPage] = useState(1);
  const [appealTotal, setAppealTotal] = useState(0);
  const [blacklistTotal, setBlacklistTotal] = useState(0);
  const [blacklistSearch, setBlacklistSearch] = useState('');
  const [appealFilter, setAppealFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  // Review dialog
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewReason, setReviewReason] = useState('');
  const [removeFromBlacklist, setRemoveFromBlacklist] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // Appeal detail dialog
  const [appealDetailOpen, setAppealDetailOpen] = useState(false);
  const [viewingAppeal, setViewingAppeal] = useState<Appeal | null>(null);
  
  // Add to blacklist dialog
  const [addBlacklistDialogOpen, setAddBlacklistDialogOpen] = useState(false);
  const [newBlacklistUserId, setNewBlacklistUserId] = useState('');
  const [newBlacklistReason, setNewBlacklistReason] = useState('');
  const [addingBlacklist, setAddingBlacklist] = useState(false);
  
  // Edit blacklist dialog
  const [editBlacklistDialogOpen, setEditBlacklistDialogOpen] = useState(false);
  const [editingBlacklistItem, setEditingBlacklistItem] = useState<BlacklistItem | null>(null);
  const [editBlacklistReason, setEditBlacklistReason] = useState('');
  const [editBlacklistUserId, setEditBlacklistUserId] = useState('');
  const [updatingBlacklist, setUpdatingBlacklist] = useState(false);
  
  // Delete appeal dialog
  const [deleteAppealDialogOpen, setDeleteAppealDialogOpen] = useState(false);
  const [deletingAppeal, setDeletingAppeal] = useState<Appeal | null>(null);
  const [deletingAppealLoading, setDeletingAppealLoading] = useState(false);

  // Admin management
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [addAdminDialogOpen, setAddAdminDialogOpen] = useState(false);
  const [newAdminId, setNewAdminId] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminLevel, setNewAdminLevel] = useState(3);
  const [addingAdmin, setAddingAdmin] = useState(false);
  
  // Edit admin dialog
  const [editAdminDialogOpen, setEditAdminDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [editAdminName, setEditAdminName] = useState('');
  const [editAdminPassword, setEditAdminPassword] = useState('');
  const [editAdminLevel, setEditAdminLevel] = useState(3);
  const [updatingAdmin, setUpdatingAdmin] = useState(false);
  
  // Delete admin dialog
  const [deleteAdminDialogOpen, setDeleteAdminDialogOpen] = useState(false);
  const [deletingAdmin, setDeletingAdmin] = useState<Admin | null>(null);
  const [deletingAdminLoading, setDeletingAdminLoading] = useState(false);

  // Audit Logs
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logFilterAction, setLogFilterAction] = useState('');
  const [logFilterStatus, setLogFilterStatus] = useState<'all' | 'success' | 'failure'>('all');
  const [actionTypes, setActionTypes] = useState<Record<string, string>>({});
  const [logStats, setLogStats] = useState<any>(null);

  // Settings
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [editConfig, setEditConfig] = useState<Partial<SystemConfig>>({});
  const [updatingConfig, setUpdatingConfig] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    const storedAdminInfo = localStorage.getItem('admin_info');
    if (!storedToken) {
      navigate('/admin');
      return;
    }
    setToken(storedToken);
    if (storedAdminInfo) {
      try {
        const info = JSON.parse(storedAdminInfo);
        // 从admin_info中获取等级，如果没有则默认为0
        setAdminLevel(info.level || 0);
      } catch {
        setAdminLevel(0);
      }
    }
    fetchStats(storedToken);
  }, [navigate]);

  useEffect(() => {
    if (token && activeTab === 'appeals') {
      fetchAppeals(token);
    }
  }, [token, activeTab, appealPage, appealFilter]);

  useEffect(() => {
    if (token && activeTab === 'blacklist') {
      fetchBlacklist(token);
    }
  }, [token, activeTab, blacklistPage, blacklistSearch]);

  useEffect(() => {
    if (token && activeTab === 'admins') {
      fetchAdmins(token);
    }
  }, [token, activeTab]);

  useEffect(() => {
    if (token && activeTab === 'settings') {
      fetchConfig(token);
      fetchSystemInfo(token);
    }
  }, [token, activeTab]);

  useEffect(() => {
    if (token && activeTab === 'logs') {
      fetchLogs(token);
      fetchActionTypes(token);
      fetchLogStats(token);
    }
  }, [token, activeTab, logsPage, logFilterAction, logFilterStatus]);

  const fetchStats = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/stats`, {
        headers: { 'Authorization': authToken },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      toast.error('获取统计数据失败');
    }
  };

  const fetchAppeals = async (authToken: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: appealPage.toString(),
        per_page: '20',
      });
      if (appealFilter !== 'all') {
        params.append('status', appealFilter);
      }
      
      const response = await fetch(`${API_BASE}/api/admin/appeals?${params}`, {
        headers: { 'Authorization': authToken },
      });
      const data = await response.json();
      if (data.success) {
        setAppeals(data.data.items);
        setAppealTotal(data.data.total);
      }
    } catch (err) {
      toast.error('获取申诉列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchBlacklist = async (authToken: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: blacklistPage.toString(),
        per_page: '50',
      });
      if (blacklistSearch) {
        params.append('search', blacklistSearch);
      }
      
      const response = await fetch(`${API_BASE}/api/admin/blacklist?${params}`, {
        headers: { 'Authorization': authToken },
      });
      const data = await response.json();
      if (data.success) {
        setBlacklist(data.data.items);
        setBlacklistTotal(data.data.total);
      }
    } catch (err) {
      toast.error('获取黑名单失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async (authToken: string) => {
    setAdminLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/admins`, {
        headers: { 'Authorization': authToken },
      });
      const data = await response.json();
      if (data.success) {
        setAdmins(data.data);
      }
    } catch (err) {
      toast.error('获取管理员列表失败');
    } finally {
      setAdminLoading(false);
    }
  };

  const fetchConfig = async (authToken: string) => {
    setConfigLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/config`, {
        headers: { 'Authorization': authToken },
      });
      const data = await response.json();
      if (data.success) {
        setConfig(data.data);
        setEditConfig(data.data);
      }
    } catch (err) {
      toast.error('获取系统配置失败');
    } finally {
      setConfigLoading(false);
    }
  };

  const fetchSystemInfo = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/system-info`, {
        headers: { 'Authorization': authToken },
      });
      const data = await response.json();
      if (data.success) {
        setSystemInfo(data.data);
      }
    } catch (err) {
      console.error('获取系统信息失败:', err);
    }
  };

  const fetchLogs = async (authToken: string) => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({
        page: logsPage.toString(),
        per_page: '50',
      });
      if (logFilterAction) params.append('action_type', logFilterAction);
      if (logFilterStatus !== 'all') params.append('status', logFilterStatus);

      const response = await fetch(`${API_BASE}/api/admin/logs?${params}`, {
        headers: { 'Authorization': authToken },
      });
      const data = await response.json();
      if (data.success) {
        setLogs(data.data.items);
        setLogsTotal(data.data.total);
      }
    } catch (err) {
      toast.error('获取审计日志失败');
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchActionTypes = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/logs/action-types`, {
        headers: { 'Authorization': authToken },
      });
      const data = await response.json();
      if (data.success) {
        setActionTypes(data.data);
      }
    } catch (err) {
      console.error('获取操作类型失败:', err);
    }
  };

  const fetchLogStats = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/logs/statistics?days=7`, {
        headers: { 'Authorization': authToken },
      });
      const data = await response.json();
      if (data.success) {
        setLogStats(data.data);
      }
    } catch (err) {
      console.error('获取日志统计失败:', err);
    }
  };

  const handleLogout = async () => {
    const authToken = localStorage.getItem('admin_token');
    
    if (authToken) {
      try {
        await fetch(`${API_BASE}/api/admin/logout`, {
          method: 'POST',
          headers: { 'Authorization': authToken },
        });
      } catch (err) {
        console.error('登出接口调用失败:', err);
      }
    }
    
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
    navigate('/admin');
  };

  const openReviewDialog = (appeal: Appeal, action: 'approve' | 'reject') => {
    setSelectedAppeal(appeal);
    setReviewAction(action);
    setReviewReason('');
    setRemoveFromBlacklist(action === 'approve');
    setReviewDialogOpen(true);
  };

  const openAppealDetail = (appeal: Appeal) => {
    setViewingAppeal(appeal);
    setAppealDetailOpen(true);
  };

  const submitReview = async () => {
    if (!selectedAppeal || !reviewReason.trim()) return;
    
    setSubmittingReview(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/appeals/${selectedAppeal.appeal_id}/review`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: reviewAction,
          reason: reviewReason,
          remove_from_blacklist: removeFromBlacklist,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(reviewAction === 'approve' ? '申诉已通过' : '申诉已拒绝');
        setReviewDialogOpen(false);
        fetchAppeals(token);
        fetchStats(token);
      } else {
        toast.error(data.message || '操作失败');
      }
    } catch (err) {
      toast.error('提交审核失败');
    } finally {
      setSubmittingReview(false);
    }
  };

  const addToBlacklist = async () => {
    if (!newBlacklistUserId.trim() || !newBlacklistReason.trim()) return;
    
    setAddingBlacklist(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/blacklist`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: newBlacklistUserId,
          reason: newBlacklistReason,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('已添加到黑名单');
        setAddBlacklistDialogOpen(false);
        setNewBlacklistUserId('');
        setNewBlacklistReason('');
        fetchBlacklist(token);
        fetchStats(token);
      } else {
        toast.error(data.message || '添加失败');
      }
    } catch (err) {
      toast.error('添加失败');
    } finally {
      setAddingBlacklist(false);
    }
  };

  const openEditBlacklistDialog = (item: BlacklistItem) => {
    setEditingBlacklistItem(item);
    setEditBlacklistReason(item.reason);
    setEditBlacklistUserId(item.user_id);
    setEditBlacklistDialogOpen(true);
  };

  const updateBlacklistItem = async () => {
    if (!editingBlacklistItem) return;
    
    setUpdatingBlacklist(true);
    try {
      const body: any = {};
      if (editBlacklistReason !== editingBlacklistItem.reason) {
        body.reason = editBlacklistReason;
      }
      if (editBlacklistUserId !== editingBlacklistItem.user_id) {
        body.new_user_id = editBlacklistUserId;
      }
      
      if (Object.keys(body).length === 0) {
        toast.info('没有修改内容');
        setUpdatingBlacklist(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/admin/blacklist/${editingBlacklistItem.user_id}`, {
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
        setEditBlacklistDialogOpen(false);
        fetchBlacklist(token);
      } else {
        toast.error(data.message || '更新失败');
      }
    } catch (err) {
      toast.error('更新失败');
    } finally {
      setUpdatingBlacklist(false);
    }
  };

  const removeFromBlacklistFn = async (userId: string) => {
    if (!confirm(`确定要将用户 ${userId} 从黑名单中移除吗？`)) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/admin/blacklist/delete`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          reason: '管理员手动移除',
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('已从黑名单移除');
        fetchBlacklist(token);
        fetchStats(token);
      } else {
        toast.error(data.message || '移除失败');
      }
    } catch (err) {
      toast.error('移除失败');
    }
  };

  const openDeleteAppealDialog = (appeal: Appeal) => {
    setDeletingAppeal(appeal);
    setDeleteAppealDialogOpen(true);
  };

  const deleteAppealFn = async () => {
    if (!deletingAppeal) return;
    
    setDeletingAppealLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/appeals/${deletingAppeal.appeal_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token },
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('申诉已删除');
        setDeleteAppealDialogOpen(false);
        fetchAppeals(token);
        fetchStats(token);
      } else {
        toast.error(data.message || '删除失败');
      }
    } catch (err) {
      toast.error('删除失败');
    } finally {
      setDeletingAppealLoading(false);
    }
  };

  const addAdmin = async () => {
    if (!newAdminId.trim() || !newAdminName.trim() || !newAdminPassword.trim()) {
      toast.error('请填写所有必填项');
      return;
    }
    
    if (newAdminPassword.length < 6) {
      toast.error('密码至少6位');
      return;
    }
    
    setAddingAdmin(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/admins`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_id: newAdminId,
          name: newAdminName,
          password: newAdminPassword,
          level: newAdminLevel,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('管理员创建成功');
        setAddAdminDialogOpen(false);
        setNewAdminId('');
        setNewAdminName('');
        setNewAdminPassword('');
        setNewAdminLevel(3);
        fetchAdmins(token);
      } else {
        toast.error(data.message || '创建失败');
      }
    } catch (err) {
      toast.error('创建失败');
    } finally {
      setAddingAdmin(false);
    }
  };

  const openEditAdminDialog = (admin: Admin) => {
    setEditingAdmin(admin);
    setEditAdminName(admin.name);
    setEditAdminPassword('');
    setEditAdminLevel(admin.level);
    setEditAdminDialogOpen(true);
  };

  const updateAdmin = async () => {
    if (!editingAdmin) return;
    
    setUpdatingAdmin(true);
    try {
      const body: any = {};
      if (editAdminName !== editingAdmin.name) {
        body.name = editAdminName;
      }
      if (editAdminPassword) {
        if (editAdminPassword.length < 6) {
          toast.error('密码至少6位');
          setUpdatingAdmin(false);
          return;
        }
        body.password = editAdminPassword;
      }
      if (editAdminLevel !== editingAdmin.level && adminLevel >= 4) {
        body.level = editAdminLevel;
      }
      
      if (Object.keys(body).length === 0) {
        toast.info('没有修改内容');
        setUpdatingAdmin(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/admin/admins/${editingAdmin.admin_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('管理员信息已更新');
        setEditAdminDialogOpen(false);
        fetchAdmins(token);
      } else {
        toast.error(data.message || '更新失败');
      }
    } catch (err) {
      toast.error('更新失败');
    } finally {
      setUpdatingAdmin(false);
    }
  };

  const openDeleteAdminDialog = (admin: Admin) => {
    setDeletingAdmin(admin);
    setDeleteAdminDialogOpen(true);
  };

  const deleteAdminFn = async () => {
    if (!deletingAdmin) return;
    
    setDeletingAdminLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/admins/${deletingAdmin.admin_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token },
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('管理员已删除');
        setDeleteAdminDialogOpen(false);
        fetchAdmins(token);
      } else {
        toast.error(data.message || '删除失败');
      }
    } catch (err) {
      toast.error('删除失败');
    } finally {
      setDeletingAdminLoading(false);
    }
  };

  const updateConfig = async () => {
    if (!config) return;
    
    setUpdatingConfig(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/config`, {
        method: 'PUT',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editConfig),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('配置已更新，重启后生效');
        setConfig({ ...config, ...editConfig });
      } else {
        toast.error(data.message || '更新失败');
      }
    } catch (err) {
      toast.error('更新失败');
    } finally {
      setUpdatingConfig(false);
    }
  };

  const restartServer = async () => {
    setRestarting(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/restart`, {
        method: 'POST',
        headers: { 'Authorization': token },
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('服务器正在重启...');
        setRestartDialogOpen(false);
      } else {
        toast.error(data.message || '重启失败');
      }
    } catch (err) {
      toast.error('重启请求失败');
    } finally {
      setRestarting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500/50 text-yellow-500"><Clock className="w-3 h-3 mr-1" />待审核</Badge>;
      case 'approved':
        return <Badge variant="outline" className="border-green-500/50 text-green-500"><CheckCircle className="w-3 h-3 mr-1" />已通过</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="border-red-500/50 text-red-500"><XCircle className="w-3 h-3 mr-1" />已拒绝</Badge>;
      default:
        return null;
    }
  };

  const getLevelBadge = (level: number) => {
    switch (level) {
      case 4:
        return <Badge className="bg-purple-500">超级管理员</Badge>;
      case 3:
        return <Badge className="bg-blue-500">普通管理员</Badge>;
      case 2:
        return <Badge className="bg-yellow-500">申诉审核员</Badge>;
      case 1:
        return <Badge className="bg-gray-500">Bot持有者</Badge>;
      default:
        return <Badge>未知</Badge>;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}天${hours}小时${minutes}分钟`;
  };

  const appealTotalPages = Math.ceil(appealTotal / 20);
  const blacklistTotalPages = Math.ceil(blacklistTotal / 50);

  const canManageAdmins = adminLevel >= 4;
  const canManageSettings = adminLevel >= 4;
  const canManageBlacklist = adminLevel >= 3;
  const canReviewAppeals = adminLevel >= 2;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-800 z-50">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h1 className="font-bold text-white">管理后台</h1>
              <p className="text-xs text-muted-foreground">云黑库系统</p>
            </div>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeTab === 'dashboard' 
                  ? 'bg-brand/20 text-brand' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              仪表盘
            </button>
            <button
              onClick={() => setActiveTab('appeals')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeTab === 'appeals' 
                  ? 'bg-brand/20 text-brand' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileText className="w-5 h-5" />
              申诉管理
              {stats && stats.pending_appeals > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {stats.pending_appeals}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('blacklist')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeTab === 'blacklist' 
                  ? 'bg-brand/20 text-brand' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-5 h-5" />
              黑名单
            </button>
            {canManageAdmins && (
              <button
                onClick={() => setActiveTab('admins')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  activeTab === 'admins' 
                    ? 'bg-brand/20 text-brand' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <UserCog className="w-5 h-5" />
                管理员
              </button>
            )}
            {adminLevel >= 2 && (
              <button
                onClick={() => setActiveTab('logs')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  activeTab === 'logs' 
                    ? 'bg-brand/20 text-brand' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <ScrollText className="w-5 h-5" />
                审计日志
              </button>
            )}
            {canManageSettings && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  activeTab === 'settings' 
                    ? 'bg-brand/20 text-brand' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Settings className="w-5 h-5" />
                系统设置
              </button>
            )}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-800">
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
      <main className="ml-64 p-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">仪表盘</h2>
              <p className="text-muted-foreground">系统概览与统计数据</p>
            </div>

            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">待处理申诉</p>
                      <p className="text-3xl font-bold text-white">{stats.pending_appeals}</p>
                    </div>
                  </div>
                </div>

                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">总申诉数</p>
                      <p className="text-3xl font-bold text-white">{stats.total_appeals}</p>
                    </div>
                  </div>
                </div>

                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">已处理申诉</p>
                      <p className="text-3xl font-bold text-white">{stats.processed_appeals ?? 0}</p>
                    </div>
                  </div>
                </div>

                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">申诉成功率</p>
                      <p className="text-3xl font-bold text-white">{stats.success_rate ?? 0}%</p>
                    </div>
                  </div>
                </div>

                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">平均处理时间</p>
                      <p className="text-3xl font-bold text-white">{stats.avg_processing_hours ?? 0}h</p>
                    </div>
                  </div>
                </div>

                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <UserX className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">黑名单用户</p>
                      <p className="text-3xl font-bold text-white">{stats.blacklist_count}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="glass rounded-2xl p-8 text-center">
              <AlertCircle className="w-12 h-12 text-brand mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">快速操作</h3>
              <p className="text-muted-foreground mb-6">选择左侧菜单开始管理</p>
              <div className="flex justify-center gap-4">
                <Button onClick={() => setActiveTab('appeals')} className="bg-brand hover:bg-brand-dark">
                  <FileText className="w-4 h-4 mr-2" />
                  处理申诉
                </Button>
                <Button onClick={() => setActiveTab('blacklist')} variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  管理黑名单
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appeals' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">申诉管理</h2>
                <p className="text-muted-foreground">审核用户申诉请求</p>
              </div>
              <div className="flex gap-2">
                <select
                  value={appealFilter}
                  onChange={(e) => {
                    setAppealFilter(e.target.value as any);
                    setAppealPage(1);
                  }}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="all">全部状态</option>
                  <option value="pending">待审核</option>
                  <option value="approved">已通过</option>
                  <option value="rejected">已拒绝</option>
                </select>
                <Button onClick={() => fetchAppeals(token)} variant="outline" size="icon">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <span className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin inline-block" />
                <p className="text-muted-foreground mt-4">加载中...</p>
              </div>
            ) : appeals.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-muted-foreground">暂无申诉记录</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {appeals.map((appeal) => (
                    <div key={appeal.appeal_id} className="glass rounded-2xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-white">
                              {appeal.user_type === 'group' ? '群号' : 'QQ'}: {appeal.user_id}
                            </span>
                            {getStatusBadge(appeal.status)}
                            {appeal.user_type === 'group' && (
                              <Badge variant="outline" className="border-purple-500/50 text-purple-500">
                                群聊
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            提交时间: {new Date(appeal.created_at).toLocaleString()}
                          </p>
                          {appeal.contact_email && (
                            <p className="text-sm text-muted-foreground">
                              联系邮箱: {appeal.contact_email}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openAppealDetail(appeal)}
                          className="text-slate-400 hover:text-white"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          查看详情
                        </Button>
                      </div>

                      <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                        <p className="text-sm text-slate-300 whitespace-pre-wrap">{appeal.content}</p>
                      </div>

                      {appeal.images && appeal.images.length > 0 && (
                        <div className="flex gap-2 mb-4">
                          {appeal.images.map((img, idx) => (
                            <a 
                              key={idx} 
                              href={img.startsWith('http') ? img : `${API_BASE}${img}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-16 h-16 rounded-lg overflow-hidden bg-slate-800"
                            >
                              <img 
                                src={img.startsWith('http') ? img : `${API_BASE}${img}`}
                                alt={`证据 ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        {appeal.status === 'pending' && canReviewAppeals && (
                          <>
                            <Button 
                              onClick={() => openReviewDialog(appeal, 'approve')}
                              className="bg-green-600 hover:bg-green-700"
                              size="sm"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              通过
                            </Button>
                            <Button 
                              onClick={() => openReviewDialog(appeal, 'reject')}
                              variant="destructive"
                              size="sm"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              拒绝
                            </Button>
                          </>
                        )}
                        {canManageBlacklist && (
                          <Button 
                            onClick={() => openDeleteAppealDialog(appeal)}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10 ml-auto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      {appeal.review && (
                        <div className="bg-slate-800/50 rounded-lg p-4 mt-4">
                          <p className="text-sm text-muted-foreground mb-1">
                            审核人: {appeal.review.admin_name} ({appeal.review.admin_id})
                          </p>
                          <p className="text-sm text-muted-foreground mb-1">
                            审核时间: {new Date(appeal.review.reviewed_at).toLocaleString()}
                          </p>
                          <p className="text-sm text-white">
                            审核理由: {appeal.review.reason}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {appealTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      onClick={() => setAppealPage(p => Math.max(1, p - 1))}
                      disabled={appealPage === 1}
                      variant="outline"
                      size="icon"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      第 {appealPage} / {appealTotalPages} 页
                    </span>
                    <Button
                      onClick={() => setAppealPage(p => Math.min(appealTotalPages, p + 1))}
                      disabled={appealPage === appealTotalPages}
                      variant="outline"
                      size="icon"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'blacklist' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">黑名单管理</h2>
                <p className="text-muted-foreground">查看和管理黑名单用户</p>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索用户ID或原因..."
                    value={blacklistSearch}
                    onChange={(e) => {
                      setBlacklistSearch(e.target.value);
                      setBlacklistPage(1);
                    }}
                    className="pl-10 w-64 bg-slate-800 border-slate-700"
                  />
                </div>
                {canManageBlacklist && (
                  <Button onClick={() => setAddBlacklistDialogOpen(true)} className="bg-brand hover:bg-brand-dark">
                    <Ban className="w-4 h-4 mr-2" />
                    添加黑名单
                  </Button>
                )}
                <Button onClick={() => fetchBlacklist(token)} variant="outline" size="icon">
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
                <UserCheck className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-muted-foreground">黑名单为空</p>
              </div>
            ) : (
              <>
                <div className="glass rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-800/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">用户ID</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">封禁原因</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">操作者</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">添加时间</th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-slate-400">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {blacklist.map((item) => (
                        <tr key={item.user_id} className="hover:bg-slate-800/30">
                          <td className="px-6 py-4 text-white font-mono">{item.user_id}</td>
                          <td className="px-6 py-4 text-slate-300">{item.reason}</td>
                          <td className="px-6 py-4 text-slate-400">{item.added_by}</td>
                          <td className="px-6 py-4 text-slate-400 text-sm">
                            {new Date(item.added_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              {canManageBlacklist && (
                                <>
                                  <Button
                                    onClick={() => openEditBlacklistDialog(item)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    onClick={() => removeFromBlacklistFn(item.user_id)}
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
                    <Button
                      onClick={() => setBlacklistPage(p => Math.max(1, p - 1))}
                      disabled={blacklistPage === 1}
                      variant="outline"
                      size="icon"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      第 {blacklistPage} / {blacklistTotalPages} 页
                    </span>
                    <Button
                      onClick={() => setBlacklistPage(p => Math.min(blacklistTotalPages, p + 1))}
                      disabled={blacklistPage === blacklistTotalPages}
                      variant="outline"
                      size="icon"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'admins' && canManageAdmins && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">管理员管理</h2>
                <p className="text-muted-foreground">管理系统管理员账号</p>
              </div>
              <Button onClick={() => setAddAdminDialogOpen(true)} className="bg-brand hover:bg-brand-dark">
                <UserCog className="w-4 h-4 mr-2" />
                添加管理员
              </Button>
            </div>

            {adminLoading ? (
              <div className="text-center py-20">
                <span className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin inline-block" />
                <p className="text-muted-foreground mt-4">加载中...</p>
              </div>
            ) : admins.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <UserCog className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-muted-foreground">暂无管理员</p>
              </div>
            ) : (
              <div className="glass rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">管理员ID</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">名称</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">等级</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">创建时间</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-slate-400">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {admins.map((admin) => (
                      <tr key={admin.admin_id} className="hover:bg-slate-800/30">
                        <td className="px-6 py-4 text-white font-mono">{admin.admin_id}</td>
                        <td className="px-6 py-4 text-slate-300">{admin.name}</td>
                        <td className="px-6 py-4">{getLevelBadge(admin.level)}</td>
                        <td className="px-6 py-4 text-slate-400 text-sm">
                          {new Date(admin.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => openEditAdminDialog(admin)}
                              variant="ghost"
                              size="sm"
                              className="text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => openDeleteAdminDialog(admin)}
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && adminLevel >= 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">审计日志</h2>
                <p className="text-muted-foreground">查看系统操作记录</p>
              </div>
              <div className="flex gap-2">
                <select
                  value={logFilterAction}
                  onChange={(e) => {
                    setLogFilterAction(e.target.value);
                    setLogsPage(1);
                  }}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="">所有操作</option>
                  {Object.entries(actionTypes).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <select
                  value={logFilterStatus}
                  onChange={(e) => {
                    setLogFilterStatus(e.target.value as any);
                    setLogsPage(1);
                  }}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="all">所有状态</option>
                  <option value="success">成功</option>
                  <option value="failure">失败</option>
                </select>
                <Button onClick={() => fetchLogs(token)} variant="outline" size="icon">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Log Stats */}
            {logStats && (
              <div className="glass rounded-2xl p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">最近7天操作统计</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(logStats.action_counts).map(([action, count]) => (
                    <Badge key={action} variant="secondary" className="bg-slate-800">
                      {actionTypes[action] || action}: {count as number}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {logsLoading ? (
              <div className="text-center py-20">
                <span className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin inline-block" />
                <p className="text-muted-foreground mt-4">加载中...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <ScrollText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-muted-foreground">暂无日志记录</p>
              </div>
            ) : (
              <>
                <div className="glass rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-800/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">时间</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">操作类型</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">操作者</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">IP地址</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {logs.map((log, index) => (
                        <tr key={index} className="hover:bg-slate-800/30">
                          <td className="px-6 py-4 text-slate-400 text-sm whitespace-nowrap">
                            {log.timestamp}
                          </td>
                          <td className="px-6 py-4 text-white">
                            {actionTypes[log.action_type] || log.action_type}
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            {log.operator_id}
                            <span className="text-xs text-muted-foreground ml-1">({log.operator_type})</span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-sm font-mono">
                            {log.ip}
                          </td>
                          <td className="px-6 py-4">
                            {log.status === 'success' ? (
                              <Badge className="bg-green-500/20 text-green-500 border-green-500/50">成功</Badge>
                            ) : (
                              <Badge className="bg-red-500/20 text-red-500 border-red-500/50">失败</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {Math.ceil(logsTotal / 50) > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                      disabled={logsPage === 1}
                      variant="outline"
                      size="icon"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      第 {logsPage} / {Math.ceil(logsTotal / 50)} 页
                    </span>
                    <Button
                      onClick={() => setLogsPage(p => Math.min(Math.ceil(logsTotal / 50), p + 1))}
                      disabled={logsPage === Math.ceil(logsTotal / 50)}
                      variant="outline"
                      size="icon"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'settings' && canManageSettings && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">系统设置</h2>
              <p className="text-muted-foreground">管理系统配置和服务器状态</p>
            </div>

            <Tabs defaultValue="config" className="w-full">
              <TabsList className="bg-slate-800">
                <TabsTrigger value="config">系统配置</TabsTrigger>
                <TabsTrigger value="server">服务器状态</TabsTrigger>
              </TabsList>

              <TabsContent value="config" className="space-y-6">
                {configLoading ? (
                  <div className="text-center py-20">
                    <span className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin inline-block" />
                  </div>
                ) : config ? (
                  <div className="glass rounded-2xl p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>服务器地址</Label>
                        <Input
                          value={editConfig.host || ''}
                          onChange={(e) => setEditConfig({ ...editConfig, host: e.target.value })}
                          className="bg-slate-800 border-slate-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>端口</Label>
                        <Input
                          type="number"
                          value={editConfig.port || ''}
                          onChange={(e) => setEditConfig({ ...editConfig, port: parseInt(e.target.value) })}
                          className="bg-slate-800 border-slate-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>调试模式</Label>
                        <select
                          value={editConfig.debug ? 'true' : 'false'}
                          onChange={(e) => setEditConfig({ ...editConfig, debug: e.target.value === 'true' })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                        >
                          <option value="false">关闭</option>
                          <option value="true">开启</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Token有效期（秒）</Label>
                        <Input
                          type="number"
                          value={editConfig.temp_token_ttl || ''}
                          onChange={(e) => setEditConfig({ ...editConfig, temp_token_ttl: parseInt(e.target.value) })}
                          className="bg-slate-800 border-slate-700"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={updateConfig} disabled={updatingConfig} className="bg-brand hover:bg-brand-dark">
                        {updatingConfig ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        ) : null}
                        保存配置
                      </Button>
                      <Button onClick={() => setRestartDialogOpen(true)} variant="destructive">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        重启服务器
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">无法加载配置</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="server" className="space-y-6">
                {systemInfo ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Server className="w-5 h-5 text-brand" />
                        <h3 className="font-semibold text-white">系统信息</h3>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">平台</span>
                          <span className="text-white">{systemInfo.platform}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Python版本</span>
                          <span className="text-white">{systemInfo.python_version}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">运行时间</span>
                          <span className="text-white">{formatUptime(systemInfo.uptime)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="glass rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        <h3 className="font-semibold text-white">CPU使用率</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">使用率</span>
                          <span className="text-white">{systemInfo.cpu_percent}%</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 transition-all"
                            style={{ width: `${systemInfo.cpu_percent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="glass rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Shield className="w-5 h-5 text-blue-500" />
                        <h3 className="font-semibold text-white">内存使用</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">使用率</span>
                          <span className="text-white">{systemInfo.memory.percent}%</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all"
                            style={{ width: `${systemInfo.memory.percent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>可用: {formatBytes(systemInfo.memory.available)}</span>
                          <span>总计: {formatBytes(systemInfo.memory.total)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="glass rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Server className="w-5 h-5 text-orange-500" />
                        <h3 className="font-semibold text-white">磁盘使用</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">使用率</span>
                          <span className="text-white">{systemInfo.disk.percent}%</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-orange-500 transition-all"
                            style={{ width: `${systemInfo.disk.percent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>可用: {formatBytes(systemInfo.disk.free)}</span>
                          <span>总计: {formatBytes(systemInfo.disk.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">无法加载系统信息</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? '通过申诉' : '拒绝申诉'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedAppeal && `处理用户 ${selectedAppeal.user_id} 的申诉`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>审核理由</Label>
              <Textarea
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                placeholder="请输入审核理由..."
                className="bg-slate-800 border-slate-700 min-h-[100px]"
              />
            </div>

            {reviewAction === 'approve' && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="removeFromBlacklist"
                  checked={removeFromBlacklist}
                  onChange={(e) => setRemoveFromBlacklist(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800"
                />
                <Label htmlFor="removeFromBlacklist" className="text-sm cursor-pointer">
                  同时从黑名单中移除该用户
                </Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={submitReview}
              disabled={!reviewReason.trim() || submittingReview}
              className={reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {submittingReview ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : reviewAction === 'approve' ? (
                <><CheckCircle className="w-4 h-4 mr-2" />确认通过</>
              ) : (
                <><XCircle className="w-4 h-4 mr-2" />确认拒绝</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appeal Detail Dialog */}
      <Dialog open={appealDetailOpen} onOpenChange={setAppealDetailOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>申诉详情</DialogTitle>
          </DialogHeader>
          {viewingAppeal && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">申诉ID:</span>
                  <p className="text-white font-mono">{viewingAppeal.appeal_id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">状态:</span>
                  <div className="mt-1">{getStatusBadge(viewingAppeal.status)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">用户类型:</span>
                  <p className="text-white">{viewingAppeal.user_type === 'group' ? '群号' : '个人QQ'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">用户ID:</span>
                  <p className="text-white font-mono">{viewingAppeal.user_id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">联系邮箱:</span>
                  <p className="text-white">{viewingAppeal.contact_email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">提交时间:</span>
                  <p className="text-white">{new Date(viewingAppeal.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground text-sm">申诉内容:</span>
                <div className="mt-2 bg-slate-800 rounded-lg p-4">
                  <p className="text-white whitespace-pre-wrap">{viewingAppeal.content}</p>
                </div>
              </div>

              {viewingAppeal.images && viewingAppeal.images.length > 0 && (
                <div>
                  <span className="text-muted-foreground text-sm">相关截图:</span>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {viewingAppeal.images.map((img, idx) => (
                      <a 
                        key={idx}
                        href={img.startsWith('http') ? img : `${API_BASE}${img}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-32 h-32 rounded-lg overflow-hidden bg-slate-800"
                      >
                        <img 
                          src={img.startsWith('http') ? img : `${API_BASE}${img}`}
                          alt={`证据 ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {viewingAppeal.review && (
                <div>
                  <span className="text-muted-foreground text-sm">审核信息:</span>
                  <div className="mt-2 bg-slate-800 rounded-lg p-4 space-y-2">
                    <p className="text-white">
                      <span className="text-muted-foreground">审核结果:</span>{' '}
                      {viewingAppeal.review.action === 'approve' ? '通过' : '拒绝'}
                    </p>
                    <p className="text-white">
                      <span className="text-muted-foreground">审核人:</span>{' '}
                      {viewingAppeal.review.admin_name} ({viewingAppeal.review.admin_id})
                    </p>
                    <p className="text-white">
                      <span className="text-muted-foreground">审核时间:</span>{' '}
                      {new Date(viewingAppeal.review.reviewed_at).toLocaleString()}
                    </p>
                    <p className="text-white">
                      <span className="text-muted-foreground">审核理由:</span>{' '}
                      {viewingAppeal.review.reason}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add to Blacklist Dialog */}
      <Dialog open={addBlacklistDialogOpen} onOpenChange={setAddBlacklistDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>添加黑名单</DialogTitle>
            <DialogDescription className="text-slate-400">
              将用户添加到黑名单
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>用户ID (QQ号)</Label>
              <Input
                value={newBlacklistUserId}
                onChange={(e) => setNewBlacklistUserId(e.target.value)}
                placeholder="请输入用户ID"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label>封禁原因</Label>
              <Textarea
                value={newBlacklistReason}
                onChange={(e) => setNewBlacklistReason(e.target.value)}
                placeholder="请输入封禁原因..."
                className="bg-slate-800 border-slate-700 min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddBlacklistDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={addToBlacklist}
              disabled={!newBlacklistUserId.trim() || !newBlacklistReason.trim() || addingBlacklist}
              className="bg-red-600 hover:bg-red-700"
            >
              {addingBlacklist ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Ban className="w-4 h-4 mr-2" />确认添加</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Blacklist Dialog */}
      <Dialog open={editBlacklistDialogOpen} onOpenChange={setEditBlacklistDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>修改黑名单条目</DialogTitle>
            <DialogDescription className="text-slate-400">
              修改黑名单中的用户信息
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>用户ID (QQ号)</Label>
              <Input
                value={editBlacklistUserId}
                onChange={(e) => setEditBlacklistUserId(e.target.value)}
                placeholder="请输入用户ID"
                className="bg-slate-800 border-slate-700"
              />
              <p className="text-xs text-muted-foreground">如需修改QQ号，请输入新的QQ号</p>
            </div>

            <div className="space-y-2">
              <Label>封禁原因</Label>
              <Textarea
                value={editBlacklistReason}
                onChange={(e) => setEditBlacklistReason(e.target.value)}
                placeholder="请输入封禁原因..."
                className="bg-slate-800 border-slate-700 min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBlacklistDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={updateBlacklistItem}
              disabled={updatingBlacklist}
              className="bg-brand hover:bg-brand-dark"
            >
              {updatingBlacklist ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Edit3 className="w-4 h-4 mr-2" />保存修改</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Appeal Dialog */}
      <Dialog open={deleteAppealDialogOpen} onOpenChange={setDeleteAppealDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>删除申诉</DialogTitle>
            <DialogDescription className="text-slate-400">
              {deletingAppeal && `确定要删除用户 ${deletingAppeal.user_id} 的申诉吗？此操作不可恢复。`}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAppealDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={deleteAppealFn}
              disabled={deletingAppealLoading}
              variant="destructive"
            >
              {deletingAppealLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Trash2 className="w-4 h-4 mr-2" />确认删除</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Admin Dialog */}
      <Dialog open={addAdminDialogOpen} onOpenChange={setAddAdminDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>添加管理员</DialogTitle>
            <DialogDescription className="text-slate-400">
              创建新的管理员账号
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>管理员ID</Label>
              <Input
                value={newAdminId}
                onChange={(e) => setNewAdminId(e.target.value)}
                placeholder="请输入管理员唯一ID"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label>显示名称</Label>
              <Input
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                placeholder="请输入显示名称"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label>密码</Label>
              <Input
                type="password"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="请输入密码（至少6位）"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label>权限等级</Label>
              <select
                value={newAdminLevel}
                onChange={(e) => setNewAdminLevel(parseInt(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                <option value={3}>普通管理员 (等级3)</option>
                <option value={2}>申诉审核员 (等级2)</option>
                <option value={1}>Bot持有者 (等级1)</option>
              </select>
              <p className="text-xs text-muted-foreground">
                等级4超级管理员只能由现有超级管理员手动在配置文件中设置
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddAdminDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={addAdmin}
              disabled={addingAdmin}
              className="bg-brand hover:bg-brand-dark"
            >
              {addingAdmin ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><UserCog className="w-4 h-4 mr-2" />创建管理员</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Admin Dialog */}
      <Dialog open={editAdminDialogOpen} onOpenChange={setEditAdminDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>修改管理员</DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingAdmin && `修改管理员 ${editingAdmin.admin_id} 的信息`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>显示名称</Label>
              <Input
                value={editAdminName}
                onChange={(e) => setEditAdminName(e.target.value)}
                placeholder="请输入显示名称"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label>新密码（留空则不修改）</Label>
              <Input
                type="password"
                value={editAdminPassword}
                onChange={(e) => setEditAdminPassword(e.target.value)}
                placeholder="请输入新密码（至少6位）"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            {adminLevel >= 4 && (
              <div className="space-y-2">
                <Label>权限等级</Label>
                <select
                  value={editAdminLevel}
                  onChange={(e) => setEditAdminLevel(parseInt(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value={4}>超级管理员 (等级4)</option>
                  <option value={3}>普通管理员 (等级3)</option>
                  <option value={2}>申诉审核员 (等级2)</option>
                  <option value={1}>Bot持有者 (等级1)</option>
                </select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAdminDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={updateAdmin}
              disabled={updatingAdmin}
              className="bg-brand hover:bg-brand-dark"
            >
              {updatingAdmin ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Edit3 className="w-4 h-4 mr-2" />保存修改</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Admin Dialog */}
      <Dialog open={deleteAdminDialogOpen} onOpenChange={setDeleteAdminDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>删除管理员</DialogTitle>
            <DialogDescription className="text-slate-400">
              {deletingAdmin && `确定要删除管理员 ${deletingAdmin.admin_id} (${deletingAdmin.name}) 吗？此操作不可恢复。`}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAdminDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={deleteAdminFn}
              disabled={deletingAdminLoading}
              variant="destructive"
            >
              {deletingAdminLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Trash2 className="w-4 h-4 mr-2" />确认删除</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restart Server Dialog */}
      <Dialog open={restartDialogOpen} onOpenChange={setRestartDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>重启服务器</DialogTitle>
            <DialogDescription className="text-slate-400">
              确定要重启服务器吗？此操作会立即终止当前进程，Docker环境将自动重新启动容器。
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRestartDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={restartServer}
              disabled={restarting}
              variant="destructive"
            >
              {restarting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Power className="w-4 h-4 mr-2" />确认重启</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
