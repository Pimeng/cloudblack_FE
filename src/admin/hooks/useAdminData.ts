import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

// 全局请求锁，防止重复请求
const requestLocks = new Map<string, Promise<any>>();

// 缓存过期时间：3分钟（毫秒）
const CACHE_TTL = 3 * 60 * 1000;

// 全局缓存存储
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const cacheStore = new Map<string, CacheEntry<any>>();

// 清除所有缓存
const clearAllCache = () => {
  cacheStore.clear();
};

// 获取缓存数据（如果未过期）
const getCache = <T>(key: string): T | null => {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cacheStore.delete(key);
    return null;
  }
  return entry.data;
};

// 设置缓存数据
const setCache = <T>(key: string, data: T) => {
  cacheStore.set(key, { data, timestamp: Date.now() });
};
import type {
  Stats,
  Appeal,
  BlacklistItem,
  Admin,
  BotToken,
  SystemConfig,
  SystemInfo,
  BackupItem,
  BackupStatus,
  BackupConfig,
  Level4PendingItem,
} from '../types';
import { API_BASE } from '../types';

// Type definition for the context provided by useAdminData
export type AdminDataContext = ReturnType<typeof useAdminData>;

export function useAdminData() {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState('');
  const [adminLevel, setAdminLevel] = useState<number>(0);
  const [adminInfo, setAdminInfo] = useState<Admin | null>(null);
  
  // Stats
  const [stats, setStats] = useState<Stats | null>(null);
  
  // Appeals
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [appealPage, setAppealPage] = useState(1);
  const [appealTotal, setAppealTotal] = useState(0);
  const [appealFilter, setAppealFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [appealsPerPage, setAppealsPerPage] = useState(20);
  const [loading, setLoading] = useState(false);
  
  // Blacklist
  const [blacklist, setBlacklist] = useState<BlacklistItem[]>([]);
  const [blacklistPage, setBlacklistPage] = useState(1);
  const [blacklistTotal, setBlacklistTotal] = useState(0);
  const [blacklistSearch, setBlacklistSearch] = useState('');
  const [blacklistTypeFilter, setBlacklistTypeFilter] = useState<'all' | 'user' | 'group'>('all');
  
  // Admins
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  
  // Bots
  const [bots, setBots] = useState<BotToken[]>([]);
  const [botsLoading, setBotsLoading] = useState(false);
  
  // Logs
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPerPage, setLogsPerPage] = useState(50);
  const [logFilterAction, setLogFilterAction] = useState('');
  const [logFilterStatus, setLogFilterStatus] = useState<'all' | 'success' | 'failure'>('all');
  const [logStartDate, setLogStartDate] = useState('');
  const [logEndDate, setLogEndDate] = useState('');
  const [actionTypes, setActionTypes] = useState<Record<string, string>>({});
  const [logStats, setLogStats] = useState<any>(null);
  
  // Settings
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  
  // Backup
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null);
  const [backupConfig, setBackupConfig] = useState<BackupConfig | null>(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupConfigLoading, setBackupConfigLoading] = useState(false);
  
  // Level4 Pending
  const [level4Pending, setLevel4Pending] = useState<Level4PendingItem[]>([]);
  const [level4PendingLoading, setLevel4PendingLoading] = useState(false);
  const [level4PendingPage, setLevel4PendingPage] = useState(1);
  const [level4PendingTotal, setLevel4PendingTotal] = useState(0);
  const [level4PendingStatus, setLevel4PendingStatus] = useState<'pending' | 'confirmed' | 'cancelled' | 'all'>('pending');
  
  // Initialization state
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize token and admin info - only run once on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    const storedAdminInfo = localStorage.getItem('admin_info');
    if (!storedToken) {
      // 记录当前页面路径到 goto 参数
      const currentPath = location.pathname + location.search;
      const gotoParam = currentPath !== '/admin' ? `?goto=${encodeURIComponent(currentPath)}` : '';
      navigate(`/admin${gotoParam}`);
      setIsInitialized(true);
      return;
    }
    setToken(storedToken);
    if (storedAdminInfo) {
      try {
        const info = JSON.parse(storedAdminInfo);
        setAdminLevel(info.level || 0);
        setAdminInfo(info);
      } catch {
        setAdminLevel(0);
      }
    }
    // Only fetch stats once during initialization
    fetchStats(storedToken);
    setIsInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuthError = useCallback(() => {
    toast.error('登录已过期，请重新登录');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
    // 记录当前页面路径到 goto 参数，登录后可以返回
    const currentPath = location.pathname + location.search;
    const gotoParam = currentPath !== '/admin' ? `?goto=${encodeURIComponent(currentPath)}` : '';
    navigate(`/admin${gotoParam}`);
  }, [navigate, location]);

  const fetchStats = useCallback(async (authToken: string, forceRefresh = false) => {
    const cacheKey = `stats-${authToken}`;
    const lockKey = `stats-lock-${authToken}`;
    
    // 如果不是强制刷新，先检查缓存
    if (!forceRefresh) {
      const cached = getCache<Stats>(cacheKey);
      if (cached) {
        setStats(cached);
        return;
      }
    }
    
    // 如果已有请求在进行中，等待它完成
    if (requestLocks.has(lockKey)) {
      return requestLocks.get(lockKey);
    }
    
    const requestPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE}/api/admin/stats`, {
          headers: { 'Authorization': authToken },
        });
        
        if (response.status === 401 || response.status === 403) {
          handleAuthError();
          return;
        }
        
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
          setCache(cacheKey, data.data);
        }
      } catch (err) {
        toast.error('获取统计数据失败');
      } finally {
        // 请求完成后移除锁
        requestLocks.delete(lockKey);
      }
    })();
    
    requestLocks.set(lockKey, requestPromise);
    return requestPromise;
  }, [handleAuthError]);

  const fetchAppeals = useCallback(async (authToken: string, page = appealPage, filter = appealFilter, perPage = appealsPerPage) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });
      if (filter !== 'all') {
        params.append('status', filter);
      }
      
      const response = await fetch(`${API_BASE}/api/admin/appeals?${params}`, {
        headers: { 'Authorization': authToken },
      });
      
      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        const appealsWithAI = await Promise.all(
          data.data.items.map(async (appeal: Appeal) => {
            if (appeal.ai_analysis?.status === 'completed' && !appeal.ai_analysis?.result) {
              try {
                const detailRes = await fetch(`${API_BASE}/api/admin/appeals/${appeal.appeal_id}/ai-analysis`, {
                  headers: { 'Authorization': authToken },
                });
                if (detailRes.ok) {
                  const detailData = await detailRes.json();
                  if (detailData.success && detailData.data) {
                    return { ...appeal, ai_analysis: detailData.data };
                  }
                }
              } catch {
                // 忽略单个请求失败
              }
            }
            return appeal;
          })
        );
        setAppeals(appealsWithAI);
        setAppealTotal(data.data.total);
      }
    } catch (err) {
      toast.error('获取申诉列表失败');
    } finally {
      setLoading(false);
    }
  }, [appealPage, appealFilter, appealsPerPage, handleAuthError]);

  const fetchBlacklist = useCallback(async (authToken: string, page = blacklistPage, search = blacklistSearch, typeFilter = blacklistTypeFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '50',
      });
      if (search) {
        params.append('search', search);
      }
      if (typeFilter !== 'all') {
        params.append('user_type', typeFilter);
      }
      
      const response = await fetch(`${API_BASE}/api/admin/blacklist?${params}`, {
        headers: { 'Authorization': authToken },
      });
      
      if (response.status === 401 || response.status === 403) {
        handleAuthError();
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
  }, [blacklistPage, blacklistSearch, blacklistTypeFilter, handleAuthError]);

  const fetchAdmins = useCallback(async (authToken: string) => {
    setAdminLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/admins`, {
        headers: { 'Authorization': authToken },
      });
      
      if (response.status === 401 || response.status === 403) {
        handleAuthError();
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
  }, [handleAuthError]);

  const fetchBots = useCallback(async (authToken: string) => {
    setBotsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/bots`, {
        headers: { 'Authorization': authToken },
      });
      
      if (response.status === 401 || response.status === 403) {
        handleAuthError();
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
  }, [handleAuthError]);

  const fetchConfig = useCallback(async (authToken: string) => {
    setConfigLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/config`, {
        headers: { 'Authorization': authToken },
      });
      
      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }
      
      const data = await response.json();
      if (data.success && data.data.config) {
        setConfig(data.data.config);
      }
    } catch (err) {
      toast.error('获取系统配置失败');
    } finally {
      setConfigLoading(false);
    }
  }, [handleAuthError]);

  const fetchSystemInfo = useCallback(async (authToken: string) => {
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
  }, []);

  const fetchLogs = useCallback(async (authToken: string, page = logsPage, perPage = logsPerPage, action = logFilterAction, status = logFilterStatus, startDate = logStartDate, endDate = logEndDate) => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });
      if (action) params.append('action_type', action);
      if (status !== 'all') params.append('status', status);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(`${API_BASE}/api/admin/logs?${params}`, {
        headers: { 'Authorization': authToken },
      });
      
      if (response.status === 401 || response.status === 403) {
        handleAuthError();
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
  }, [logsPage, logsPerPage, logFilterAction, logFilterStatus, logStartDate, logEndDate, handleAuthError]);

  const fetchActionTypes = useCallback(async (authToken: string) => {
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
  }, []);

  const fetchLogStats = useCallback(async (authToken: string) => {
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
  }, []);

  const fetchBackupStatus = useCallback(async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/backup/status`, {
        headers: { 'Authorization': authToken },
      });
      
      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setBackupStatus(data.data);
      }
    } catch (err) {
      console.error('获取备份状态失败:', err);
    }
  }, [handleAuthError]);

  const fetchBackups = useCallback(async (authToken: string) => {
    setBackupLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/backup/list`, {
        headers: { 'Authorization': authToken },
      });
      
      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setBackups(data.data.backups);
      }
    } catch (err) {
      toast.error('获取备份列表失败');
    } finally {
      setBackupLoading(false);
    }
  }, [handleAuthError]);

  const fetchBackupConfig = useCallback(async (authToken: string) => {
    setBackupConfigLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/backup/config`, {
        headers: { 'Authorization': authToken },
      });
      
      if (response.status === 401 || response.status === 403) {
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setBackupConfig(data.data);
      }
    } catch (err) {
      console.error('获取备份配置失败:', err);
    } finally {
      setBackupConfigLoading(false);
    }
  }, []);

  const fetchLevel4Pending = useCallback(async (
    authToken: string,
    page = level4PendingPage,
    status = level4PendingStatus,
    perPage = 20
  ) => {
    setLevel4PendingLoading(true);
    try {
      const params = new URLSearchParams({
        status,
        page: page.toString(),
        per_page: perPage.toString(),
      });
      
      const response = await fetch(`${API_BASE}/api/admin/blacklist/level4-pending?${params}`, {
        headers: { 'Authorization': authToken },
      });
      
      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setLevel4Pending(data.data.items);
        setLevel4PendingTotal(data.data.total);
      }
    } catch (err) {
      toast.error('获取等级4待确认列表失败');
    } finally {
      setLevel4PendingLoading(false);
    }
  }, [level4PendingPage, level4PendingStatus, handleAuthError]);

  // 强制刷新所有数据（清除缓存后重新获取）
  const refreshAll = useCallback(() => {
    if (token) {
      clearAllCache();
      fetchStats(token, true);
      toast.success('数据已刷新');
    }
  }, [token, fetchStats]);

  return {
    // Auth
    token,
    adminLevel,
    adminInfo,
    setAdminInfo,
    isInitialized,
    
    // Stats
    stats,
    refreshStats: useCallback(() => {
      if (token) fetchStats(token);
    }, [token, fetchStats]),
    
    // Appeals
    appeals,
    setAppeals,
    appealPage,
    setAppealPage,
    appealTotal,
    appealFilter,
    setAppealFilter,
    appealsPerPage,
    setAppealsPerPage,
    fetchAppeals: useCallback(() => {
      if (token) fetchAppeals(token);
    }, [token, fetchAppeals]),
    
    // Blacklist
    blacklist,
    blacklistPage,
    setBlacklistPage,
    blacklistTotal,
    blacklistSearch,
    setBlacklistSearch,
    blacklistTypeFilter,
    setBlacklistTypeFilter,
    fetchBlacklist: useCallback(() => {
      if (token) fetchBlacklist(token);
    }, [token, fetchBlacklist]),
    
    // Admins
    admins,
    setAdmins,
    adminLoading,
    fetchAdmins: () => fetchAdmins(token),
    
    // Bots
    bots,
    setBots,
    botsLoading,
    fetchBots: () => fetchBots(token),
    
    // Logs
    logs,
    logsLoading,
    logsPage,
    setLogsPage,
    logsTotal,
    logsPerPage,
    setLogsPerPage,
    logFilterAction,
    setLogFilterAction,
    logFilterStatus,
    setLogFilterStatus,
    logStartDate,
    setLogStartDate,
    logEndDate,
    setLogEndDate,
    actionTypes,
    logStats,
    fetchLogs: () => fetchLogs(token),
    fetchActionTypes: () => fetchActionTypes(token),
    fetchLogStats: () => fetchLogStats(token),
    
    // Settings
    config,
    setConfig,
    systemInfo,
    configLoading,
    fetchConfig: () => fetchConfig(token),
    fetchSystemInfo: () => fetchSystemInfo(token),
    
    // Backup
    backups,
    setBackups,
    backupStatus,
    setBackupStatus,
    backupConfig,
    setBackupConfig,
    backupLoading,
    backupConfigLoading,
    fetchBackupStatus: () => fetchBackupStatus(token),
    fetchBackups: () => fetchBackups(token),
    fetchBackupConfig: () => fetchBackupConfig(token),
    
    // Level4 Pending
    level4Pending,
    setLevel4Pending,
    level4PendingLoading,
    level4PendingPage,
    setLevel4PendingPage,
    level4PendingTotal,
    level4PendingStatus,
    setLevel4PendingStatus,
    fetchLevel4Pending: () => fetchLevel4Pending(token),
    
    // Common
    loading,
    refreshAll,
    handleAuthError,
  };
}
