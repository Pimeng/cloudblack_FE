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
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const API_BASE = 'https://cloudblack-api.07210700.xyz';

type Tab = 'dashboard' | 'appeals' | 'blacklist';

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
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [token, setToken] = useState('');
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
  
  // Add to blacklist dialog
  const [addBlacklistDialogOpen, setAddBlacklistDialogOpen] = useState(false);
  const [newBlacklistUserId, setNewBlacklistUserId] = useState('');
  const [newBlacklistReason, setNewBlacklistReason] = useState('');
  const [addingBlacklist, setAddingBlacklist] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    if (!storedToken) {
      navigate('/admin');
      return;
    }
    setToken(storedToken);
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

  const fetchStats = async (authToken: string) => {
    try {
      // 获取管理员统计数据
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

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin');
  };

  const openReviewDialog = (appeal: Appeal, action: 'approve' | 'reject') => {
    setSelectedAppeal(appeal);
    setReviewAction(action);
    setReviewReason('');
    setRemoveFromBlacklist(action === 'approve');
    setReviewDialogOpen(true);
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

  const appealTotalPages = Math.ceil(appealTotal / 20);
  const blacklistTotalPages = Math.ceil(blacklistTotal / 50);

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
                            <span className="font-semibold text-white">QQ: {appeal.user_id}</span>
                            {getStatusBadge(appeal.status)}
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

                      {appeal.status === 'pending' ? (
                        <div className="flex gap-2">
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
                        </div>
                      ) : appeal.review && (
                        <div className="bg-slate-800/50 rounded-lg p-4">
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
                <Button onClick={() => setAddBlacklistDialogOpen(true)} className="bg-brand hover:bg-brand-dark">
                  <Ban className="w-4 h-4 mr-2" />
                  添加黑名单
                </Button>
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
                            <Button
                              onClick={() => removeFromBlacklistFn(item.user_id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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
    </div>
  );
}
