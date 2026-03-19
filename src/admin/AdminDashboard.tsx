import { useState, useEffect, useRef } from 'react';
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
  EyeOff,
  ScrollText,
  Mail,
  Sparkles,
  Menu,
  X,
  Bot,
  Key,
  User
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

type Tab = 'dashboard' | 'appeals' | 'blacklist' | 'admins' | 'bots' | 'logs' | 'settings';

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
  ai_analysis?: AIAnalysisResult;
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
  avatar?: string;
}

interface BotToken {
  bot_name: string;
  owner: string;
  description: string;
  created_at: string;
  token?: string;
}

interface SMTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

interface GeetestConfig {
  enabled: boolean;
  captcha_id: string;
  captcha_key: string;
}

interface AIAnalysisConfig {
  enabled: boolean;
  api_key: string;
  base_url: string;
  model: string;
  max_tokens: number;
  temperature: number;
  timeout: number;
  cache_file: string;
}

interface AIAnalysisResult {
  status: string;
  // 列表接口返回的简化字段
  recommendation?: string;
  // 详情接口返回的完整结果
  result?: {
    summary: string;
    reason_analysis: string;
    recommendation: string;
    confidence: number;
    suggestions: string;
    risk_factors: string[];
  };
  updated_at?: string;
}

interface SystemConfig {
  host: string;
  port: number;
  debug: boolean;
  temp_token_ttl: number;
  smtp?: SMTPConfig;
  geetest?: GeetestConfig;
  ai_analysis?: AIAnalysisConfig;
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
  const [requestingAIAnalysis, setRequestingAIAnalysis] = useState(false);
  const [deletingAIAnalysis, setDeletingAIAnalysis] = useState(false);
  const aiAnalysisRef = useRef<HTMLDivElement>(null);
  
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
  
  // Clear processed appeals dialog
  const [clearProcessedDialogOpen, setClearProcessedDialogOpen] = useState(false);
  const [clearProcessedDays, setClearProcessedDays] = useState(30);
  const [clearingProcessed, setClearingProcessed] = useState(false);

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

  // Bot Token management
  const [bots, setBots] = useState<BotToken[]>([]);
  const [botsLoading, setBotsLoading] = useState(false);
  const [addBotDialogOpen, setAddBotDialogOpen] = useState(false);
  const [newBotName, setNewBotName] = useState('');
  const [newBotOwner, setNewBotOwner] = useState('');
  const [newBotDescription, setNewBotDescription] = useState('');
  const [newBotToken, setNewBotToken] = useState('');
  const [addingBot, setAddingBot] = useState(false);
  const [createdBotToken, setCreatedBotToken] = useState('');
  const [showCreatedTokenDialog, setShowCreatedTokenDialog] = useState(false);
  
  // Edit bot dialog
  const [editBotDialogOpen, setEditBotDialogOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<BotToken | null>(null);
  const [editBotDescription, setEditBotDescription] = useState('');
  const [editBotOwner, setEditBotOwner] = useState('');
  const [editBotToken, setEditBotToken] = useState('');
  const [updatingBot, setUpdatingBot] = useState(false);
  
  // Delete bot dialog
  const [deleteBotDialogOpen, setDeleteBotDialogOpen] = useState(false);
  const [deletingBot, setDeletingBot] = useState<BotToken | null>(null);
  const [deletingBotLoading, setDeletingBotLoading] = useState(false);
  
  // View bot token dialog
  const [viewTokenDialogOpen, setViewTokenDialogOpen] = useState(false);
  const [viewingBot, setViewingBot] = useState<BotToken | null>(null);
  const [viewingBotToken, setViewingBotToken] = useState('');
  const [viewingBotLoading, setViewingBotLoading] = useState(false);

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
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);
  const [updatingConfig, setUpdatingConfig] = useState(false);

  // Profile (Edit own info)
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [adminInfo, setAdminInfo] = useState<Admin | null>(null);

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
        setAdminInfo(info);
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
    if (token && activeTab === 'bots') {
      fetchBots(token);
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
      
      if (response.status === 401 || response.status === 403) {
        toast.error('登录已过期，请重新登录');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_info');
        navigate('/admin');
        return;
      }
      
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
      
      if (response.status === 401 || response.status === 403) {
        toast.error('登录已过期，请重新登录');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_info');
        navigate('/admin');
        return;
      }
      
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
      
      if (response.status === 401 || response.status === 403) {
        toast.error('登录已过期，请重新登录');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_info');
        navigate('/admin');
        return;
      }
      
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
      
      if (response.status === 401 || response.status === 403) {
        toast.error('登录已过期，请重新登录');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_info');
        navigate('/admin');
        return;
      }
      
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

  const fetchBots = async (authToken: string) => {
    setBotsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/bots`, {
        headers: { 'Authorization': authToken },
      });
      
      if (response.status === 401 || response.status === 403) {
        toast.error('登录已过期，请重新登录');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_info');
        navigate('/admin');
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setBots(data.data);
      }
    } catch (err) {
      toast.error('获取 Bot Token 列表失败');
    } finally {
      setBotsLoading(false);
    }
  };

  const fetchConfig = async (authToken: string) => {
    setConfigLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/config`, {
        headers: { 'Authorization': authToken },
      });
      
      if (response.status === 401 || response.status === 403) {
        toast.error('登录已过期，请重新登录');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_info');
        navigate('/admin');
        return;
      }
      
      const data = await response.json();
      if (data.success && data.data.config) {
        setConfig(data.data.config);
        setEditConfig(data.data.config);
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
      
      if (response.status === 401 || response.status === 403) {
        toast.error('登录已过期，请重新登录');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_info');
        navigate('/admin');
        return;
      }
      
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

  const openAppealDetail = async (appeal: Appeal, scrollToAI = false) => {
    setViewingAppeal(appeal);
    setAppealDetailOpen(true);
    // 如果没有AI分析数据，或者只有简化数据（没有result详情），则请求详情API
    const needsDetail = !appeal.ai_analysis || (appeal.ai_analysis.status === 'completed' && !appeal.ai_analysis.result);
    if (needsDetail) {
      try {
        const response = await fetch(`${API_BASE}/api/admin/appeals/${appeal.appeal_id}`, {
          headers: { 'Authorization': token },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.ai_analysis) {
            setViewingAppeal(prev => prev ? { ...prev, ai_analysis: data.data.ai_analysis } : null);
          }
        }
      } catch (err) {
        console.error('获取AI分析详情失败:', err);
      }
    }
    // 如果需要滚动到AI分析部分，在对话框打开后执行滚动
    if (scrollToAI && appeal.ai_analysis) {
      setTimeout(() => {
        aiAnalysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const requestAIAnalysis = async () => {
    if (!viewingAppeal || !token) return;
    
    setRequestingAIAnalysis(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/appeals/${viewingAppeal.appeal_id}/ai-analysis`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('AI 分析已启动，请稍后刷新查看结果');
        // 更新本地状态为分析中
        setViewingAppeal({
          ...viewingAppeal,
          ai_analysis: {
            status: 'processing',
          }
        });
      } else {
        toast.error(data.message || '启动 AI 分析失败');
      }
    } catch (err) {
      toast.error('请求 AI 分析失败');
    } finally {
      setRequestingAIAnalysis(false);
    }
  };

  const deleteAIAnalysis = async () => {
    if (!viewingAppeal || !token) return;
    
    setDeletingAIAnalysis(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/appeals/${viewingAppeal.appeal_id}/ai-analysis`, {
        method: 'DELETE',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('AI 分析缓存已删除');
        // 更新本地状态，移除 AI 分析
        setViewingAppeal({
          ...viewingAppeal,
          ai_analysis: undefined
        });
        // 同时更新申诉列表中的数据
        setAppeals(prev => prev.map(a => 
          a.appeal_id === viewingAppeal.appeal_id 
            ? { ...a, ai_analysis: undefined }
            : a
        ));
      } else {
        toast.error(data.message || '删除 AI 分析缓存失败');
      }
    } catch (err) {
      toast.error('删除 AI 分析缓存失败');
    } finally {
      setDeletingAIAnalysis(false);
    }
  };

  const refreshAppealDetail = async () => {
    if (!viewingAppeal || !token) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/admin/appeals/${viewingAppeal.appeal_id}`, {
        headers: { 'Authorization': token },
      });
      
      if (response.status === 401 || response.status === 403) {
        toast.error('登录已过期，请重新登录');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_info');
        navigate('/admin');
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setViewingAppeal(data.data);
        toast.success('申诉详情已刷新');
      } else {
        toast.error(data.message || '刷新失败');
      }
    } catch (err) {
      toast.error('刷新申诉详情失败');
    }
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

  const clearProcessedAppeals = async () => {
    if (!token) return;
    
    setClearingProcessed(true);
    try {
      const body: any = {};
      if (clearProcessedDays > 0) {
        body.days = clearProcessedDays;
      }
      
      const response = await fetch(`${API_BASE}/api/admin/appeals/clear-processed`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(`已清理 ${data.data.deleted_count} 条已处理申诉`);
        setClearProcessedDialogOpen(false);
        fetchAppeals(token);
        fetchStats(token);
      } else {
        toast.error(data.message || '清理失败');
      }
    } catch (err) {
      toast.error('清理失败');
    } finally {
      setClearingProcessed(false);
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

  const openProfileDialog = () => {
    if (adminInfo) {
      setProfileName(adminInfo.name || '');
      setProfileAvatar(adminInfo.avatar || '');
      setProfilePassword('');
      setProfileDialogOpen(true);
    }
  };

  const updateProfile = async () => {
    if (!adminInfo) return;
    
    setUpdatingProfile(true);
    try {
      const body: any = {};
      if (profileName !== adminInfo.name) {
        body.name = profileName;
      }
      if (profileAvatar !== adminInfo.avatar) {
        body.avatar = profileAvatar;
      }
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
        // 更新本地存储的 admin_info
        const updatedInfo = { ...adminInfo, name: profileName, avatar: profileAvatar };
        localStorage.setItem('admin_info', JSON.stringify(updatedInfo));
        setAdminInfo(updatedInfo);
        // 刷新管理员列表
        fetchAdmins(token);
      } else {
        toast.error(data.message || '更新失败');
      }
    } catch (err) {
      toast.error('更新失败');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const addBot = async () => {
    if (!newBotName.trim() || !newBotOwner.trim()) {
      toast.error('请填写 Bot 名称和所有者');
      return;
    }
    
    setAddingBot(true);
    try {
      const body: any = {
        bot_name: newBotName.trim(),
        owner: newBotOwner.trim(),
        description: newBotDescription.trim(),
      };
      if (newBotToken.trim()) {
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
        setAddBotDialogOpen(false);
        setNewBotName('');
        setNewBotOwner('');
        setNewBotDescription('');
        setNewBotToken('');
        // 如果后端返回了生成的 token，显示给用户
        if (data.data.token) {
          setCreatedBotToken(data.data.token);
          setShowCreatedTokenDialog(true);
        }
        fetchBots(token);
      } else {
        toast.error(data.message || '创建失败');
      }
    } catch (err) {
      toast.error('创建失败');
    } finally {
      setAddingBot(false);
    }
  };

  const openEditBotDialog = (bot: BotToken) => {
    setEditingBot(bot);
    setEditBotDescription(bot.description);
    setEditBotOwner(bot.owner);
    setEditBotToken('');
    setEditBotDialogOpen(true);
  };

  const updateBot = async () => {
    if (!editingBot) return;
    
    setUpdatingBot(true);
    try {
      const body: any = {};
      if (editBotDescription !== editingBot.description) {
        body.description = editBotDescription;
      }
      if (editBotOwner !== editingBot.owner && adminLevel >= 4) {
        body.owner = editBotOwner;
      }
      if (editBotToken.trim()) {
        body.token = editBotToken.trim();
      }
      
      if (Object.keys(body).length === 0) {
        toast.info('没有修改内容');
        setUpdatingBot(false);
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
        toast.success('Bot Token 更新成功');
        setEditBotDialogOpen(false);
        fetchBots(token);
      } else {
        toast.error(data.message || '更新失败');
      }
    } catch (err) {
      toast.error('更新失败');
    } finally {
      setUpdatingBot(false);
    }
  };

  const openDeleteBotDialog = (bot: BotToken) => {
    setDeletingBot(bot);
    setDeleteBotDialogOpen(true);
  };

  const deleteBotFn = async () => {
    if (!deletingBot) return;
    
    setDeletingBotLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/bots/${deletingBot.bot_name}`, {
        method: 'DELETE',
        headers: { 'Authorization': token },
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Bot Token 已删除');
        setDeleteBotDialogOpen(false);
        fetchBots(token);
      } else {
        toast.error(data.message || '删除失败');
      }
    } catch (err) {
      toast.error('删除失败');
    } finally {
      setDeletingBotLoading(false);
    }
  };

  const fetchBotToken = async (bot: BotToken) => {
    if (!token) return;
    
    setViewingBot(bot);
    setViewingBotToken('');
    setViewingBotLoading(true);
    setViewTokenDialogOpen(true);
    
    try {
      const response = await fetch(`${API_BASE}/api/admin/bots/${bot.bot_name}/token`, {
        headers: { 'Authorization': token },
      });
      
      const data = await response.json();
      if (data.success) {
        setViewingBotToken(data.data.token);
      } else {
        toast.error(data.message || '获取 Token 失败');
        setViewTokenDialogOpen(false);
      }
    } catch (err) {
      toast.error('获取 Token 失败');
      setViewTokenDialogOpen(false);
    } finally {
      setViewingBotLoading(false);
    }
  };

  const updateConfig = async () => {
    if (!config) return;
    
    setUpdatingConfig(true);
    try {
      // 等级4管理员可以修改任何配置，包括敏感配置
      // 低等级管理员只能修改非敏感配置
      let configToUpdate: Partial<SystemConfig>;
      if (adminLevel >= 4) {
        configToUpdate = editConfig;
      } else {
        // 非等级4管理员：过滤掉敏感字段
        const { smtp, geetest, ...allowedConfig } = editConfig;
        configToUpdate = allowedConfig;
      }
      
      const response = await fetch(`${API_BASE}/api/admin/config`, {
        method: 'PUT',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configToUpdate),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('配置已更新，重启后生效');
        setConfig({ ...config, ...configToUpdate });
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
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand/20 flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-brand" />
          </div>
          <h1 className="font-bold text-white">管理后台</h1>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-800 z-50 transition-transform duration-300 md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
              onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
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
              onClick={() => { setActiveTab('appeals'); setMobileMenuOpen(false); }}
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
              onClick={() => { setActiveTab('blacklist'); setMobileMenuOpen(false); }}
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
                onClick={() => { setActiveTab('admins'); setMobileMenuOpen(false); }}
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
                onClick={() => { setActiveTab('bots'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  activeTab === 'bots' 
                    ? 'bg-brand/20 text-brand' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Bot className="w-5 h-5" />
                Bot Token
              </button>
            )}
            {adminLevel >= 2 && (
              <button
                onClick={() => { setActiveTab('logs'); setMobileMenuOpen(false); }}
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
                onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
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

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-800 space-y-2">
          <button
            onClick={() => { openProfileDialog(); setMobileMenuOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <User className="w-5 h-5" />
            个人设置
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
        {activeTab === 'dashboard' && (
          <div className="space-y-6 md:space-y-8">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">仪表盘</h2>
              <p className="text-sm text-muted-foreground">系统概览与统计数据</p>
            </div>

            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">申诉管理</h2>
                <p className="text-sm text-muted-foreground">审核用户申诉请求</p>
              </div>
              <div className="flex flex-wrap gap-2">
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
                {adminLevel >= 4 && (
                  <Button 
                    onClick={() => setClearProcessedDialogOpen(true)} 
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    清理已处理
                  </Button>
                )}
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
                        <p className="text-sm text-slate-300 whitespace-pre-wrap break-words">{appeal.content}</p>
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

                      {/* AI 分析概览 - 列表接口返回简化数据 */}
                      {appeal.ai_analysis && appeal.ai_analysis.status === 'completed' && appeal.ai_analysis.recommendation && (
                        <div className="mt-4 bg-gradient-to-br from-purple-900/30 to-slate-800 rounded-lg p-4 border border-purple-500/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-purple-500" />
                              <span className="text-sm font-medium text-purple-400">AI 建议</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={
                                appeal.ai_analysis.recommendation.includes('通过') 
                                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                  : appeal.ai_analysis.recommendation.includes('拒绝')
                                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                  : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                              }>
                                {appeal.ai_analysis.recommendation}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openAppealDetail(appeal, true)}
                                className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 h-7 px-2"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                详情
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* AI 分析中状态 - pending 状态 */}
                      {appeal.ai_analysis && appeal.ai_analysis.status === 'pending' && (
                        <div className="mt-4 bg-slate-800/50 rounded-lg p-4 border border-purple-500/20">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-500" />
                            <span className="text-sm text-purple-400">AI 正在分析中...</span>
                            <span className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin ml-auto" />
                          </div>
                        </div>
                      )}

                      {/* AI 分析失败 */}
                      {appeal.ai_analysis && appeal.ai_analysis.status === 'failed' && (
                        <div className="mt-4 bg-slate-800/50 rounded-lg p-4 border border-red-500/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-red-500" />
                              <span className="text-sm text-red-400">AI 分析失败</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                setViewingAppeal(appeal);
                                // 临时更新本地状态为分析中
                                const updatedAppeals = appeals.map(a => 
                                  a.appeal_id === appeal.appeal_id 
                                    ? { ...a, ai_analysis: { status: 'pending' } }
                                    : a
                                );
                                setAppeals(updatedAppeals);
                                // 请求重新分析
                                try {
                                  const response = await fetch(`${API_BASE}/api/admin/appeals/${appeal.appeal_id}/ai-analysis`, {
                                    method: 'POST',
                                    headers: {
                                      'Authorization': token,
                                      'Content-Type': 'application/json',
                                    },
                                  });
                                  const data = await response.json();
                                  if (data.success) {
                                    toast.success('AI 分析已重新启动');
                                  } else {
                                    toast.error(data.message || '启动 AI 分析失败');
                                    fetchAppeals(token);
                                  }
                                } catch (err) {
                                  toast.error('请求 AI 分析失败');
                                  fetchAppeals(token);
                                }
                              }}
                              className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                            >
                              重新分析
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* 无 AI 分析 - 显示启动按钮 */}
                      {!appeal.ai_analysis && appeal.status === 'pending' && (
                        <div className="mt-4 bg-slate-800/30 rounded-lg p-4 border border-dashed border-slate-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-500">
                              <Sparkles className="w-4 h-4" />
                              <span className="text-sm">尚未进行 AI 分析</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                // 临时更新本地状态为分析中
                                const updatedAppeals = appeals.map(a => 
                                  a.appeal_id === appeal.appeal_id 
                                    ? { ...a, ai_analysis: { status: 'pending' } }
                                    : a
                                );
                                setAppeals(updatedAppeals);
                                // 请求分析
                                try {
                                  const response = await fetch(`${API_BASE}/api/admin/appeals/${appeal.appeal_id}/ai-analysis`, {
                                    method: 'POST',
                                    headers: {
                                      'Authorization': token,
                                      'Content-Type': 'application/json',
                                    },
                                  });
                                  const data = await response.json();
                                  if (data.success) {
                                    toast.success('AI 分析已启动');
                                  } else {
                                    toast.error(data.message || '启动 AI 分析失败');
                                    fetchAppeals(token);
                                  }
                                } catch (err) {
                                  toast.error('请求 AI 分析失败');
                                  fetchAppeals(token);
                                }
                              }}
                              className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                            >
                              <Sparkles className="w-4 h-4 mr-1" />
                              启动 AI 分析
                            </Button>
                          </div>
                        </div>
                      )}

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">黑名单管理</h2>
                <p className="text-sm text-muted-foreground">查看和管理黑名单用户</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 md:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索用户ID或原因..."
                    value={blacklistSearch}
                    onChange={(e) => {
                      setBlacklistSearch(e.target.value);
                      setBlacklistPage(1);
                    }}
                    className="pl-10 w-full md:w-64 bg-slate-800 border-slate-700"
                  />
                </div>
                {canManageBlacklist && (
                  <Button onClick={() => setAddBlacklistDialogOpen(true)} className="bg-brand hover:bg-brand-dark whitespace-nowrap">
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
                <div className="glass rounded-2xl overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-slate-800/50">
                      <tr>
                        <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400 whitespace-nowrap">用户ID</th>
                        <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400 whitespace-nowrap">封禁原因</th>
                        <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400 whitespace-nowrap">操作者</th>
                        <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400 whitespace-nowrap">添加时间</th>
                        <th className="px-4 md:px-6 py-4 text-right text-sm font-medium text-slate-400 whitespace-nowrap">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {blacklist.map((item) => (
                        <tr key={item.user_id} className="hover:bg-slate-800/30">
                          <td className="px-4 md:px-6 py-4 text-white font-mono whitespace-nowrap">{item.user_id}</td>
                          <td className="px-4 md:px-6 py-4 text-slate-300 max-w-[200px] truncate" title={item.reason}>{item.reason}</td>
                          <td className="px-4 md:px-6 py-4 text-slate-400 whitespace-nowrap">{item.added_by}</td>
                          <td className="px-4 md:px-6 py-4 text-slate-400 text-sm whitespace-nowrap">
                            {new Date(item.added_at).toLocaleString()}
                          </td>
                          <td className="px-4 md:px-6 py-4 text-right">
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">管理员管理</h2>
                <p className="text-sm text-muted-foreground">管理系统管理员账号</p>
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
              <div className="glass rounded-2xl overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400 whitespace-nowrap">头像</th>
                      <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400 whitespace-nowrap">管理员ID</th>
                      <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400 whitespace-nowrap">名称</th>
                      <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400 whitespace-nowrap">等级</th>
                      <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400 whitespace-nowrap">创建时间</th>
                      <th className="px-4 md:px-6 py-4 text-right text-sm font-medium text-slate-400 whitespace-nowrap">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {admins.map((admin) => (
                      <tr key={admin.admin_id} className="hover:bg-slate-800/30">
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                          {admin.avatar ? (
                            <img 
                              src={admin.avatar} 
                              alt={admin.name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-700"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-medium">
                              {admin.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-white font-mono whitespace-nowrap">{admin.admin_id}</td>
                        <td className="px-4 md:px-6 py-4 text-slate-300 whitespace-nowrap">{admin.name}</td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">{getLevelBadge(admin.level)}</td>
                        <td className="px-4 md:px-6 py-4 text-slate-400 text-sm whitespace-nowrap">
                          {new Date(admin.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-right">
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

        {activeTab === 'bots' && adminLevel >= 2 && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">Bot Token 管理</h2>
                <p className="text-sm text-muted-foreground">管理 Bot Token，用于 Bot 自动化操作</p>
              </div>
              {adminLevel >= 4 && (
                <Button onClick={() => setAddBotDialogOpen(true)} className="bg-brand hover:bg-brand-dark">
                  <Bot className="w-4 h-4 mr-2" />
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
                      <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400 whitespace-nowrap">Bot 名称</th>
                      <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400 whitespace-nowrap">所有者</th>
                      <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400 whitespace-nowrap">描述</th>
                      <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400 whitespace-nowrap">创建时间</th>
                      <th className="px-4 md:px-6 py-4 text-right text-sm font-medium text-slate-400 whitespace-nowrap">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {bots.map((bot) => (
                      <tr key={bot.bot_name} className="hover:bg-slate-800/30">
                        <td className="px-4 md:px-6 py-4 text-white font-mono whitespace-nowrap">{bot.bot_name}</td>
                        <td className="px-4 md:px-6 py-4 text-slate-300 whitespace-nowrap">{bot.owner}</td>
                        <td className="px-4 md:px-6 py-4 text-slate-400 max-w-[200px] truncate" title={bot.description}>{bot.description || '-'}</td>
                        <td className="px-4 md:px-6 py-4 text-slate-400 text-sm whitespace-nowrap">
                          {new Date(bot.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {adminLevel >= 4 && (
                              <Button
                                onClick={() => fetchBotToken(bot)}
                                variant="ghost"
                                size="sm"
                                className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                                title="查看 Token"
                              >
                                <Key className="w-4 h-4" />
                              </Button>
                            )}
                            {(adminLevel >= 4 || bot.owner === JSON.parse(localStorage.getItem('admin_info') || '{}').admin_id) && (
                              <>
                                <Button
                                  onClick={() => openEditBotDialog(bot)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() => openDeleteBotDialog(bot)}
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
            )}
          </div>
        )}

        {activeTab === 'logs' && adminLevel >= 2 && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">审计日志</h2>
                <p className="text-sm text-muted-foreground">查看系统操作记录</p>
              </div>
              <div className="flex flex-wrap gap-2">
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
                <div className="glass rounded-2xl overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-slate-800/50">
                      <tr>
                        <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400 whitespace-nowrap">时间</th>
                        <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400 whitespace-nowrap">操作类型</th>
                        <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400 whitespace-nowrap">操作者</th>
                        <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400 whitespace-nowrap">IP地址</th>
                        <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400 whitespace-nowrap">状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {logs.map((log, index) => (
                        <tr key={index} className="hover:bg-slate-800/30">
                          <td className="px-4 md:px-6 py-4 text-slate-400 text-sm whitespace-nowrap">
                            {log.timestamp}
                          </td>
                          <td className="px-4 md:px-6 py-4 text-white whitespace-nowrap">
                            {actionTypes[log.action_type] || log.action_type}
                          </td>
                          <td className="px-4 md:px-6 py-4 text-slate-300 whitespace-nowrap">
                            {log.operator_id}
                            <span className="text-xs text-muted-foreground ml-1">({log.operator_type})</span>
                          </td>
                          <td className="px-4 md:px-6 py-4 text-slate-400 text-sm font-mono whitespace-nowrap">
                            {log.ip}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap">
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
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">系统设置</h2>
              <p className="text-sm text-muted-foreground">管理系统配置和服务器状态</p>
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
                  <div className="space-y-6">
                    {/* 基础配置 */}
                    <div className="glass rounded-2xl p-6 space-y-4">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Server className="w-5 h-5 text-brand" />
                        基础配置
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>服务器地址（只读）</Label>
                          <Input
                            value={editConfig.host || ''}
                            disabled
                            className="bg-slate-800/50 border-slate-700 text-muted-foreground cursor-not-allowed"
                          />
                          <p className="text-xs text-muted-foreground">服务器地址不可修改，需手动修改配置文件</p>
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
                    </div>

                    {/* SMTP 配置 - 仅等级4管理员可见 */}
                    {adminLevel >= 4 && (
                      <div className="glass rounded-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Mail className="w-5 h-5 text-blue-500" />
                            SMTP 邮件配置
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                            className="text-slate-400 hover:text-white"
                          >
                            {showSensitiveInfo ? (
                              <><EyeOff className="w-4 h-4 mr-1" />隐藏敏感信息</>
                            ) : (
                              <><Eye className="w-4 h-4 mr-1" />显示敏感信息</>
                            )}
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>SMTP 服务器地址</Label>
                            <Input
                              value={editConfig.smtp?.host || ''}
                              onChange={(e) => setEditConfig({ 
                                ...editConfig, 
                                smtp: { ...editConfig.smtp, host: e.target.value } as SMTPConfig 
                              })}
                              placeholder="smtp.example.com"
                              className="bg-slate-800 border-slate-700"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>SMTP 端口</Label>
                            <Input
                              type="number"
                              value={editConfig.smtp?.port || ''}
                              onChange={(e) => setEditConfig({ 
                                ...editConfig, 
                                smtp: { ...editConfig.smtp, port: parseInt(e.target.value) } as SMTPConfig 
                              })}
                              placeholder="465"
                              className="bg-slate-800 border-slate-700"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>SMTP 用户名</Label>
                            <Input
                              value={editConfig.smtp?.username || ''}
                              onChange={(e) => setEditConfig({ 
                                ...editConfig, 
                                smtp: { ...editConfig.smtp, username: e.target.value } as SMTPConfig 
                              })}
                              placeholder="user@example.com"
                              className="bg-slate-800 border-slate-700"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>SMTP 密码</Label>
                            <div className="relative">
                              <Input
                                type={showSensitiveInfo ? 'text' : 'password'}
                                value={editConfig.smtp?.password || ''}
                                onChange={(e) => setEditConfig({ 
                                  ...editConfig, 
                                  smtp: { ...editConfig.smtp, password: e.target.value } as SMTPConfig 
                                })}
                                placeholder="留空则不修改"
                                className="bg-slate-800 border-slate-700 pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                              >
                                {showSensitiveInfo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Geetest 极验配置 - 仅等级4管理员可见 */}
                    {adminLevel >= 4 && (
                      <div className="glass rounded-2xl p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Shield className="w-5 h-5 text-green-500" />
                          极验 GT4 验证码配置
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="geetestEnabled"
                              checked={editConfig.geetest?.enabled || false}
                              onChange={(e) => setEditConfig({ 
                                ...editConfig, 
                                geetest: { ...editConfig.geetest, enabled: e.target.checked } as GeetestConfig 
                              })}
                              className="rounded border-slate-700 bg-slate-800"
                            />
                            <Label htmlFor="geetestEnabled" className="cursor-pointer">
                              启用极验验证码
                            </Label>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Captcha ID</Label>
                              <Input
                                value={editConfig.geetest?.captcha_id || ''}
                                onChange={(e) => setEditConfig({ 
                                  ...editConfig, 
                                  geetest: { ...editConfig.geetest, captcha_id: e.target.value } as GeetestConfig 
                                })}
                                placeholder="76443218de0908087c97c1e5f9a59272"
                                className="bg-slate-800 border-slate-700"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Captcha Key</Label>
                              <div className="relative">
                                <Input
                                  type={showSensitiveInfo ? 'text' : 'password'}
                                  value={editConfig.geetest?.captcha_key || ''}
                                  onChange={(e) => setEditConfig({ 
                                    ...editConfig, 
                                    geetest: { ...editConfig.geetest, captcha_key: e.target.value } as GeetestConfig 
                                  })}
                                  placeholder="your-geetest-captcha-key"
                                  className="bg-slate-800 border-slate-700 pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                >
                                  {showSensitiveInfo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI 分析配置 - 仅等级4管理员可见 */}
                    {adminLevel >= 4 && (
                      <div className="glass rounded-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-500" />
                            AI 智能分析配置
                          </h3>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="aiAnalysisEnabled"
                              checked={editConfig.ai_analysis?.enabled || false}
                              onChange={(e) => setEditConfig({ 
                                ...editConfig, 
                                ai_analysis: { ...editConfig.ai_analysis, enabled: e.target.checked } as AIAnalysisConfig 
                              })}
                              className="rounded border-slate-700 bg-slate-800"
                            />
                            <Label htmlFor="aiAnalysisEnabled" className="cursor-pointer text-sm">
                              启用 AI 分析
                            </Label>
                          </div>
                        </div>
                        
                        {editConfig.ai_analysis?.enabled && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>API Key</Label>
                                <div className="relative">
                                  <Input
                                    type={showSensitiveInfo ? 'text' : 'password'}
                                    value={editConfig.ai_analysis?.api_key || ''}
                                    onChange={(e) => setEditConfig({ 
                                      ...editConfig, 
                                      ai_analysis: { ...editConfig.ai_analysis, api_key: e.target.value } as AIAnalysisConfig 
                                    })}
                                    placeholder="your-api-key"
                                    className="bg-slate-800 border-slate-700 pr-10"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                  >
                                    {showSensitiveInfo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Base URL</Label>
                                <Input
                                  value={editConfig.ai_analysis?.base_url || ''}
                                  onChange={(e) => setEditConfig({ 
                                    ...editConfig, 
                                    ai_analysis: { ...editConfig.ai_analysis, base_url: e.target.value } as AIAnalysisConfig 
                                  })}
                                  placeholder="https://api.kimi.com/coding/v1"
                                  className="bg-slate-800 border-slate-700"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>模型名称</Label>
                                <Input
                                  value={editConfig.ai_analysis?.model || ''}
                                  onChange={(e) => setEditConfig({ 
                                    ...editConfig, 
                                    ai_analysis: { ...editConfig.ai_analysis, model: e.target.value } as AIAnalysisConfig 
                                  })}
                                  placeholder="kimi-for-coding"
                                  className="bg-slate-800 border-slate-700"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>缓存文件名</Label>
                                <Input
                                  value={editConfig.ai_analysis?.cache_file || ''}
                                  onChange={(e) => setEditConfig({ 
                                    ...editConfig, 
                                    ai_analysis: { ...editConfig.ai_analysis, cache_file: e.target.value } as AIAnalysisConfig 
                                  })}
                                  placeholder="ai_analysis_cache.json"
                                  className="bg-slate-800 border-slate-700"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>最大 Tokens</Label>
                                <Input
                                  type="number"
                                  value={editConfig.ai_analysis?.max_tokens || ''}
                                  onChange={(e) => setEditConfig({ 
                                    ...editConfig, 
                                    ai_analysis: { ...editConfig.ai_analysis, max_tokens: parseInt(e.target.value) } as AIAnalysisConfig 
                                  })}
                                  placeholder="4096"
                                  className="bg-slate-800 border-slate-700"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Temperature</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="1"
                                  value={editConfig.ai_analysis?.temperature || ''}
                                  onChange={(e) => setEditConfig({ 
                                    ...editConfig, 
                                    ai_analysis: { ...editConfig.ai_analysis, temperature: parseFloat(e.target.value) } as AIAnalysisConfig 
                                  })}
                                  placeholder="0.7"
                                  className="bg-slate-800 border-slate-700"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>超时时间（秒）</Label>
                                <Input
                                  type="number"
                                  value={editConfig.ai_analysis?.timeout || ''}
                                  onChange={(e) => setEditConfig({ 
                                    ...editConfig, 
                                    ai_analysis: { ...editConfig.ai_analysis, timeout: parseInt(e.target.value) } as AIAnalysisConfig 
                                  })}
                                  placeholder="60"
                                  className="bg-slate-800 border-slate-700"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 保存按钮 */}
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
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-[calc(100%-2rem)] mx-4">
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
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl w-[calc(100%-2rem)] mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>申诉详情</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshAppealDetail}
                className="text-slate-400 hover:text-white"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                刷新
              </Button>
            </div>
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
                  <p className="text-white whitespace-pre-wrap break-words">{viewingAppeal.content}</p>
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

              {/* AI 分析结果 */}
              {viewingAppeal.ai_analysis && viewingAppeal.ai_analysis.status === 'completed' && viewingAppeal.ai_analysis.result && (
                <div ref={aiAnalysisRef}>
                  <span className="text-muted-foreground text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    AI 智能分析:
                    <span className="text-xs text-slate-500">
                      ({new Date(viewingAppeal.ai_analysis.updated_at!).toLocaleString()})
                    </span>
                  </span>
                  <div className="mt-2 bg-gradient-to-br from-purple-900/30 to-slate-800 rounded-lg p-4 space-y-3 border border-purple-500/20">
                    {/* 推荐结果 */}
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground text-sm">AI 建议:</span>
                      <Badge className={
                        viewingAppeal.ai_analysis.result.recommendation.includes('通过') 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : viewingAppeal.ai_analysis.result.recommendation.includes('拒绝')
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }>
                        {viewingAppeal.ai_analysis.result.recommendation}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        置信度: {viewingAppeal.ai_analysis.result.confidence}%
                      </span>
                    </div>

                    {/* 申诉要点总结 */}
                    <div className="space-y-1">
                      <p className="text-sm text-purple-400 font-medium">申诉要点</p>
                      <p className="text-sm text-slate-300 break-words whitespace-pre-wrap">{viewingAppeal.ai_analysis.result.summary}</p>
                    </div>

                    {/* 理由合理性分析 */}
                    <div className="space-y-1">
                      <p className="text-sm text-purple-400 font-medium">理由分析</p>
                      <p className="text-sm text-slate-300 break-words whitespace-pre-wrap">{viewingAppeal.ai_analysis.result.reason_analysis}</p>
                    </div>

                    {/* 具体建议 */}
                    <div className="space-y-1">
                      <p className="text-sm text-purple-400 font-medium">处理建议</p>
                      <p className="text-sm text-slate-300 break-words whitespace-pre-wrap">{viewingAppeal.ai_analysis.result.suggestions}</p>
                    </div>

                    {/* 风险因素 */}
                    {viewingAppeal.ai_analysis.result.risk_factors && viewingAppeal.ai_analysis.result.risk_factors.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm text-purple-400 font-medium">风险提示</p>
                        <div className="flex flex-wrap gap-2">
                          {viewingAppeal.ai_analysis.result.risk_factors.map((risk, idx) => (
                            <Badge key={idx} variant="outline" className="border-red-500/30 text-red-400 text-xs">
                              {risk}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 删除缓存按钮 */}
                    {adminLevel >= 3 && (
                      <div className="pt-3 border-t border-purple-500/20 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={deleteAIAnalysis}
                          disabled={deletingAIAnalysis}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        >
                          {deletingAIAnalysis ? (
                            <span className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin mr-2" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-2" />
                          )}
                          删除分析缓存
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI 分析中状态 */}
              {viewingAppeal.ai_analysis && viewingAppeal.ai_analysis.status === 'processing' && (
                <div>
                  <span className="text-muted-foreground text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    AI 分析状态
                  </span>
                  <div className="mt-2 bg-slate-800 rounded-lg p-4 flex items-center gap-3">
                    <span className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                    <span className="text-sm text-slate-300">AI 正在分析申诉内容，请稍候...</span>
                  </div>
                </div>
              )}

              {/* AI 分析失败状态 */}
              {viewingAppeal.ai_analysis && viewingAppeal.ai_analysis.status === 'failed' && (
                <div>
                  <span className="text-muted-foreground text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    AI 分析状态
                  </span>
                  <div className="mt-2 bg-slate-800 rounded-lg p-4 space-y-3">
                    <span className="text-sm text-slate-400">AI 分析失败，请手动审核</span>
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={requestAIAnalysis}
                        disabled={requestingAIAnalysis}
                        className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                      >
                        {requestingAIAnalysis ? (
                          <span className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mr-2" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        重新分析
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* 无 AI 分析结果时显示请求按钮 */}
              {!viewingAppeal.ai_analysis && (
                <div>
                  <span className="text-muted-foreground text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    AI 智能分析
                  </span>
                  <div className="mt-2 bg-slate-800 rounded-lg p-4 space-y-3">
                    <p className="text-sm text-slate-400">尚未进行 AI 分析，可点击下方按钮启动智能分析辅助审核</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={requestAIAnalysis}
                      disabled={requestingAIAnalysis}
                      className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                    >
                      {requestingAIAnalysis ? (
                        <span className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mr-2" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      启动 AI 分析
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add to Blacklist Dialog */}
      <Dialog open={addBlacklistDialogOpen} onOpenChange={setAddBlacklistDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-[calc(100%-2rem)] mx-4">
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
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-[calc(100%-2rem)] mx-4">
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
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-[calc(100%-2rem)] mx-4">
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

      {/* Clear Processed Appeals Dialog */}
      <Dialog open={clearProcessedDialogOpen} onOpenChange={setClearProcessedDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-[calc(100%-2rem)] mx-4">
          <DialogHeader>
            <DialogTitle>清理已处理申诉</DialogTitle>
            <DialogDescription className="text-slate-400">
              清理已处理的申诉记录，释放存储空间
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>清理范围</Label>
              <select
                value={clearProcessedDays}
                onChange={(e) => setClearProcessedDays(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                <option value={0}>全部已处理申诉（谨慎使用）</option>
                <option value={30}>30天前的已处理申诉（推荐）</option>
                <option value={60}>60天前的已处理申诉</option>
                <option value={90}>90天前的已处理申诉</option>
              </select>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
              <AlertCircle className="w-4 h-4 inline-block mr-2" />
              {clearProcessedDays === 0 
                ? '将删除所有已处理的申诉记录，此操作不可恢复！' 
                : `将删除 ${clearProcessedDays} 天前已处理的申诉记录`}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setClearProcessedDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={clearProcessedAppeals}
              disabled={clearingProcessed}
              variant="destructive"
            >
              {clearingProcessed ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Trash2 className="w-4 h-4 mr-2" />确认清理</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Admin Dialog */}
      <Dialog open={addAdminDialogOpen} onOpenChange={setAddAdminDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-[calc(100%-2rem)] mx-4">
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
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-[calc(100%-2rem)] mx-4">
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
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-[calc(100%-2rem)] mx-4">
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

      {/* Add Bot Token Dialog */}
      <Dialog open={addBotDialogOpen} onOpenChange={setAddBotDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-[calc(100%-2rem)] mx-4">
          <DialogHeader>
            <DialogTitle>创建 Bot Token</DialogTitle>
            <DialogDescription className="text-slate-400">
              创建新的 Bot Token 用于 Bot 自动化操作
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Bot 名称</Label>
              <Input
                value={newBotName}
                onChange={(e) => setNewBotName(e.target.value)}
                placeholder="请输入 Bot 名称"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label>所有者</Label>
              <Input
                value={newBotOwner}
                onChange={(e) => setNewBotOwner(e.target.value)}
                placeholder="请输入所有者管理员ID"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea
                value={newBotDescription}
                onChange={(e) => setNewBotDescription(e.target.value)}
                placeholder="请输入 Bot 描述..."
                className="bg-slate-800 border-slate-700 min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label>自定义 Token（可选，留空则自动生成）</Label>
              <Input
                value={newBotToken}
                onChange={(e) => setNewBotToken(e.target.value)}
                placeholder="请输入自定义 Token"
                className="bg-slate-800 border-slate-700"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddBotDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={addBot}
              disabled={!newBotName.trim() || !newBotOwner.trim() || addingBot}
              className="bg-brand hover:bg-brand-dark"
            >
              {addingBot ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Bot className="w-4 h-4 mr-2" />创建</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show Created Token Dialog */}
      <Dialog open={showCreatedTokenDialog} onOpenChange={setShowCreatedTokenDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-[calc(100%-2rem)] mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-yellow-500" />
              Bot Token 创建成功
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              请妥善保存以下 Token，此信息仅显示一次
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Token:</p>
              <code className="block bg-slate-950 rounded p-3 text-green-400 font-mono text-sm break-all">
                {createdBotToken}
              </code>
            </div>
            <p className="text-xs text-yellow-500 mt-3">
              警告：请立即复制保存此 Token，关闭后将无法再次查看！
            </p>
          </div>

          <DialogFooter>
            <Button 
              onClick={() => {
                setShowCreatedTokenDialog(false);
                setCreatedBotToken('');
              }}
              className="bg-brand hover:bg-brand-dark"
            >
              我已保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bot Token Dialog */}
      <Dialog open={editBotDialogOpen} onOpenChange={setEditBotDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-[calc(100%-2rem)] mx-4">
          <DialogHeader>
            <DialogTitle>修改 Bot Token</DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingBot && `修改 ${editingBot.bot_name} 的信息`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Bot 名称</Label>
              <Input
                value={editingBot?.bot_name || ''}
                disabled
                className="bg-slate-800/50 border-slate-700 text-muted-foreground"
              />
            </div>

            {adminLevel >= 4 && (
              <div className="space-y-2">
                <Label>所有者</Label>
                <Input
                  value={editBotOwner}
                  onChange={(e) => setEditBotOwner(e.target.value)}
                  placeholder="请输入所有者管理员ID"
                  className="bg-slate-800 border-slate-700"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea
                value={editBotDescription}
                onChange={(e) => setEditBotDescription(e.target.value)}
                placeholder="请输入 Bot 描述..."
                className="bg-slate-800 border-slate-700 min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label>新 Token（留空则不修改）</Label>
              <Input
                value={editBotToken}
                onChange={(e) => setEditBotToken(e.target.value)}
                placeholder="请输入新 Token"
                className="bg-slate-800 border-slate-700"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBotDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={updateBot}
              disabled={updatingBot}
              className="bg-brand hover:bg-brand-dark"
            >
              {updatingBot ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Edit3 className="w-4 h-4 mr-2" />保存修改</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Bot Token Dialog */}
      <Dialog open={deleteBotDialogOpen} onOpenChange={setDeleteBotDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-[calc(100%-2rem)] mx-4">
          <DialogHeader>
            <DialogTitle>删除 Bot Token</DialogTitle>
            <DialogDescription className="text-slate-400">
              {deletingBot && `确定要删除 Bot ${deletingBot.bot_name} 吗？此操作不可恢复。`}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteBotDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={deleteBotFn}
              disabled={deletingBotLoading}
              variant="destructive"
            >
              {deletingBotLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Trash2 className="w-4 h-4 mr-2" />确认删除</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Bot Token Dialog */}
      <Dialog open={viewTokenDialogOpen} onOpenChange={setViewTokenDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl w-[calc(100%-2rem)] mx-4">
          <DialogHeader>
            <DialogTitle>查看 Bot Token</DialogTitle>
            <DialogDescription className="text-slate-400">
              {viewingBot && `Bot: ${viewingBot.bot_name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {viewingBotLoading ? (
              <div className="text-center py-8">
                <span className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin inline-block" />
                <p className="text-muted-foreground mt-4">加载中...</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Token 原文</Label>
                  <div className="relative">
                    <textarea
                      value={viewingBotToken}
                      readOnly
                      className="w-full h-32 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm resize-none"
                    />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(viewingBotToken);
                        toast.success('Token 已复制到剪贴板');
                      }}
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                    >
                      复制
                    </Button>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
                  <AlertCircle className="w-4 h-4 inline-block mr-2" />
                  请妥善保管 Token，不要分享给他人。此操作已被记录到审计日志。
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewTokenDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <Input
                value={adminInfo?.admin_id || ''}
                disabled
                className="bg-slate-800/50 border-slate-700 text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">管理员ID不可修改</p>
            </div>

            <div className="space-y-2">
              <Label>显示名称</Label>
              <Input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="请输入显示名称"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label>头像 URL</Label>
              <Input
                value={profileAvatar}
                onChange={(e) => setProfileAvatar(e.target.value)}
                placeholder="请输入头像图片 URL"
                className="bg-slate-800 border-slate-700"
              />
              {profileAvatar && (
                <div className="mt-2">
                  <img 
                    src={profileAvatar} 
                    alt="头像预览" 
                    className="w-16 h-16 rounded-full object-cover border border-slate-700"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>新密码（留空则不修改）</Label>
              <Input
                type="password"
                value={profilePassword}
                onChange={(e) => setProfilePassword(e.target.value)}
                placeholder="请输入新密码（至少6位）"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label>权限等级</Label>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-muted-foreground">
                {adminInfo?.level === 4 ? '超级管理员 (等级4)' :
                 adminInfo?.level === 3 ? '普通管理员 (等级3)' :
                 adminInfo?.level === 2 ? '申诉审核员 (等级2)' :
                 adminInfo?.level === 1 ? 'Bot持有者 (等级1)' : '未知'}
              </div>
              <p className="text-xs text-muted-foreground">权限等级只能由超级管理员修改</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={updateProfile}
              disabled={updatingProfile}
              className="bg-brand hover:bg-brand-dark"
            >
              {updatingProfile ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Edit3 className="w-4 h-4 mr-2" />保存修改</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restart Server Dialog */}
      <Dialog open={restartDialogOpen} onOpenChange={setRestartDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-[calc(100%-2rem)] mx-4">
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
