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
  BlacklistReport,
} from '../types';
import { API_BASE } from '../types';

type ConfigSection = 'basic' | 'smtp' | 'ai-analysis' | 'security' | 'file-upload' | 'database-backup';
type ConfigApiMode = 'legacy' | 'sectioned';

const isMethodOrRouteUnsupported = (status: number) => status === 404 || status === 405;

const tryParseJson = async (response: Response): Promise<any | null> => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return null;
  }
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const toSafeNumber = (value: unknown, defaultValue = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return defaultValue;
};

const normalizeSystemInfo = (raw: any): SystemInfo => {
  const memoryRaw = raw?.memory ?? raw?.mem ?? {};
  const diskRaw = raw?.disk ?? raw?.storage ?? {};

  const memoryTotal = toSafeNumber(memoryRaw.total ?? raw?.memory_total ?? raw?.mem_total, 0);
  const memoryAvailable = toSafeNumber(memoryRaw.available ?? raw?.memory_available ?? raw?.mem_available, 0);
  const memoryPercentFromPayload = memoryRaw.percent ?? raw?.memory_percent ?? raw?.mem_percent;
  const memoryPercent = memoryPercentFromPayload !== undefined
    ? toSafeNumber(memoryPercentFromPayload, 0)
    : (memoryTotal > 0 ? Math.min(100, Math.max(0, ((memoryTotal - memoryAvailable) / memoryTotal) * 100)) : 0);

  const diskTotal = toSafeNumber(diskRaw.total ?? raw?.disk_total, 0);
  const diskFree = toSafeNumber(diskRaw.free ?? raw?.disk_free, 0);
  const diskUsed = toSafeNumber(diskRaw.used ?? raw?.disk_used, Math.max(0, diskTotal - diskFree));
  const diskPercentFromPayload = diskRaw.percent ?? raw?.disk_percent;
  const diskPercent = diskPercentFromPayload !== undefined
    ? toSafeNumber(diskPercentFromPayload, 0)
    : (diskTotal > 0 ? Math.min(100, Math.max(0, (diskUsed / diskTotal) * 100)) : 0);

  return {
    platform: raw?.platform || raw?.os || '-',
    python_version: raw?.python_version || raw?.python || '-',
    cpu_percent: toSafeNumber(raw?.cpu_percent ?? raw?.cpu ?? raw?.cpu_usage, 0),
    memory: {
      total: memoryTotal,
      available: memoryAvailable,
      percent: memoryPercent,
    },
    disk: {
      total: diskTotal,
      used: diskUsed,
      free: diskFree,
      percent: diskPercent,
    },
    uptime: toSafeNumber(raw?.uptime ?? raw?.uptime_seconds, 0),
  };
};

const normalizeConfigSectionPayload = (payload: any) => {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }
  if ('config' in payload && payload.config && typeof payload.config === 'object') {
    return payload.config;
  }
  return payload;
};

const applySectionToConfig = (
  previousConfig: SystemConfig | null,
  section: ConfigSection,
  payload: any
): SystemConfig => {
  const prev = previousConfig || ({} as SystemConfig);

  switch (section) {
    case 'basic':
      return { ...prev, ...(payload || {}) };
    case 'smtp':
      return { ...prev, smtp: payload || {} };
    case 'ai-analysis':
      return { ...prev, ai_analysis: payload || {} };
    case 'security': {
      const merged = { ...prev, ...(payload || {}) };
      if (merged.rate_limit && !('rate_limit_max_requests' in merged)) {
        merged.rate_limit_max_requests = merged.rate_limit.rate_limit_max_requests;
      }
      if (merged.rate_limit && !('rate_limit_window' in merged)) {
        merged.rate_limit_window = merged.rate_limit.rate_limit_window;
      }
      return merged;
    }
    case 'file-upload': {
      const uploadPayload = payload?.upload || payload || {};
      return { ...prev, ...uploadPayload };
    }
    case 'database-backup':
      return { ...prev, database_backup: payload || {} };
    default:
      return prev;
  }
};

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
  const [configApiMode, setConfigApiMode] = useState<ConfigApiMode | null>(null);
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
  
  // Blacklist Reports
  const [blacklistReports, setBlacklistReports] = useState<BlacklistReport[]>([]);
  const [blacklistReportsLoading, setBlacklistReportsLoading] = useState(false);
  const [blacklistReportsPage, setBlacklistReportsPage] = useState(1);
  const [blacklistReportsTotal, setBlacklistReportsTotal] = useState(0);
  const [blacklistReportsFilter, setBlacklistReportsFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [blacklistReportsPerPage, setBlacklistReportsPerPage] = useState(20);
  
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
        setAppeals(data.data.items);
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

  const fetchConfig = useCallback(async (
    authToken: string,
    sections: ConfigSection[] = ['basic', 'smtp', 'ai-analysis', 'security', 'file-upload', 'database-backup']
  ) => {
    setConfigLoading(true);
    try {
      if (configApiMode !== 'legacy') {
        try {
          const sectionResults = await Promise.all(
            sections.map(async (section) => {
              const response = await fetch(`${API_BASE}/api/admin/config/${section}`, {
                headers: { 'Authorization': authToken },
              });

              if (response.status === 401 || response.status === 403) {
                throw new Error('AUTH_ERROR');
              }

              if (isMethodOrRouteUnsupported(response.status)) {
                throw new Error('SECTIONED_UNSUPPORTED');
              }

              const data = await tryParseJson(response);
              return {
                section,
                success: Boolean(data?.success),
                payload: normalizeConfigSectionPayload(data?.data),
              };
            })
          );

          setConfig((previousConfig) => {
            return sectionResults.reduce((acc, item) => {
              if (!item.success) return acc;
              return applySectionToConfig(acc, item.section as ConfigSection, item.payload);
            }, previousConfig as SystemConfig | null) as SystemConfig;
          });
          setConfigApiMode('sectioned');
          return;
        } catch (err) {
          if (err instanceof Error && (err.message === 'AUTH_ERROR' || err.message === 'SECTIONED_UNSUPPORTED')) {
            if (err.message === 'AUTH_ERROR') {
              throw err;
            }
          } else {
            throw err;
          }
        }
      }

      const legacyResponse = await fetch(`${API_BASE}/api/admin/config`, {
        headers: { 'Authorization': authToken },
      });

      if (legacyResponse.status === 401 || legacyResponse.status === 403) {
        handleAuthError();
        return;
      }

      const legacyData = await tryParseJson(legacyResponse);
      if (legacyData?.success && legacyData?.data) {
        setConfig(legacyData.data);
        setConfigApiMode('legacy');
        return;
      }

      toast.error(legacyData?.message || '获取系统配置失败');
    } catch (err) {
      if (err instanceof Error && err.message === 'AUTH_ERROR') {
        handleAuthError();
        return;
      }
      toast.error('获取系统配置失败');
    } finally {
      setConfigLoading(false);
    }
  }, [configApiMode, handleAuthError]);

  const fetchSystemInfo = useCallback(async (authToken: string) => {
    try {
      const sectionedUrl = `${API_BASE}/api/admin/config/server-status`;
      const legacyUrl = `${API_BASE}/api/admin/system-info`;

      const candidateUrls = configApiMode === 'legacy' ? [legacyUrl] : [sectionedUrl, legacyUrl];

      for (const url of candidateUrls) {
        const response = await fetch(url, {
          headers: { 'Authorization': authToken },
        });

        if (response.status === 401 || response.status === 403) {
          handleAuthError();
          return;
        }

        if (isMethodOrRouteUnsupported(response.status)) {
          continue;
        }

        const data = await tryParseJson(response);
        if (data?.success) {
          setSystemInfo(normalizeSystemInfo(data.data));
          if (url === legacyUrl) {
            setConfigApiMode('legacy');
          }
          return;
        }
      }
    } catch (err) {
      console.error('获取系统信息失败:', err);
    }
  }, [configApiMode, handleAuthError]);

  const fetchLogs = useCallback(async (authToken: string, page = 1, perPage = 50, action = '', status: 'all' | 'success' | 'failure' = 'all', startDate = '', endDate = '') => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });
      if (action) params.append('action_type', action);
      if (status !== 'all') params.append('status', status);
      if (startDate) params.append('start_time', startDate);
      if (endDate) params.append('end_time', endDate);

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
  }, [handleAuthError]);

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
      const sectionedUrl = `${API_BASE}/api/admin/config/database-backup`;
      const legacyUrl = `${API_BASE}/api/admin/backup/config`;
      const candidateUrls = configApiMode === 'legacy' ? [legacyUrl] : [sectionedUrl, legacyUrl];

      for (const url of candidateUrls) {
        const response = await fetch(url, {
          headers: { 'Authorization': authToken },
        });
        
        if (response.status === 401 || response.status === 403) {
          return;
        }

        if (isMethodOrRouteUnsupported(response.status)) {
          continue;
        }
        
        const data = await tryParseJson(response);
        if (data?.success) {
          setBackupConfig(data.data);
          if (url === legacyUrl) {
            setConfigApiMode('legacy');
          }
          return;
        }
      }
    } catch (err) {
      console.error('获取备份配置失败:', err);
    } finally {
      setBackupConfigLoading(false);
    }
  }, [configApiMode]);

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

  const fetchBlacklistReports = useCallback(async (
    authToken: string,
    page = blacklistReportsPage,
    filter = blacklistReportsFilter,
    perPage = blacklistReportsPerPage,
    includeAI = true
  ) => {
    setBlacklistReportsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });
      if (filter !== 'all') {
        params.append('status', filter);
      }
      if (includeAI) {
        params.append('include_ai', 'true');
      }
      
      const response = await fetch(`${API_BASE}/api/admin/blacklist/reports?${params}`, {
        headers: { 'Authorization': authToken },
      });
      
      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setBlacklistReports(data.data.items);
        setBlacklistReportsTotal(data.data.total);
      }
    } catch (err) {
      toast.error('获取举报列表失败');
    } finally {
      setBlacklistReportsLoading(false);
    }
  }, [blacklistReportsPage, blacklistReportsFilter, blacklistReportsPerPage, handleAuthError]);

  // 强制刷新所有数据（清除缓存后重新获取）
  const refreshAll = useCallback(() => {
    if (token) {
      clearAllCache();
      fetchStats(token, true);
      toast.success('数据已刷新');
    }
  }, [token, fetchStats]);

  // Stable wrappers for settings page effects to avoid repeated requests caused by new function identities.
  const fetchConfigForView = useCallback((sections?: ConfigSection[]) => {
    if (!token) return;
    return fetchConfig(token, sections);
  }, [token, fetchConfig]);

  const fetchSystemInfoForView = useCallback(() => {
    if (!token) return;
    return fetchSystemInfo(token);
  }, [token, fetchSystemInfo]);

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
      if (token) fetchBlacklist(token, blacklistPage, blacklistSearch, blacklistTypeFilter);
    }, [token, fetchBlacklist, blacklistPage, blacklistSearch, blacklistTypeFilter]),
    
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
    fetchLogs: useCallback((params?: { page?: number; perPage?: number; action?: string; status?: 'all' | 'success' | 'failure'; startDate?: string; endDate?: string }) => {
      if (token) fetchLogs(
        token,
        params?.page ?? 1,
        params?.perPage ?? 50,
        params?.action ?? '',
        params?.status ?? 'all',
        params?.startDate ?? '',
        params?.endDate ?? '',
      );
    }, [token, fetchLogs]),
    fetchActionTypes: () => fetchActionTypes(token),
    fetchLogStats: () => fetchLogStats(token),
    
    // Settings
    config,
    configApiMode,
    setConfig,
    systemInfo,
    configLoading,
    fetchConfig: fetchConfigForView,
    fetchSystemInfo: fetchSystemInfoForView,
    
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
    
    // Blacklist Reports
    blacklistReports,
    setBlacklistReports,
    blacklistReportsLoading,
    blacklistReportsPage,
    setBlacklistReportsPage,
    blacklistReportsTotal,
    blacklistReportsFilter,
    setBlacklistReportsFilter,
    blacklistReportsPerPage,
    setBlacklistReportsPerPage,
    fetchBlacklistReports: useCallback(() => {
      if (token) fetchBlacklistReports(token);
    }, [token, fetchBlacklistReports]),
    
    // Common
    loading,
    refreshAll,
    handleAuthError,
  };
}
