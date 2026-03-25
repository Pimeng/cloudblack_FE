import { useEffect, useState, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ScrollText, RefreshCw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AdminDataContext } from '../hooks/useAdminData';
import { API_BASE } from '../types';
import { toast } from 'sonner';
import {
  LoadingSpinner,
  EmptyState,
  PageHeader,
  DetailView,
  DetailInfoItem,
  DetailInfoGrid,
  DetailContentBlock,
  Pagination,
  OperatorTypeBadge,
  OperationStatusBadge,
} from '../components';

interface LogDetails {
  // 黑名单相关
  target_id?: string;
  user_type?: string;
  reason?: string;
  original_user_id?: string;
  new_user_id?: string;
  new_reason?: string;
  updated_fields?: string[];
  
  // 申诉相关
  appeal_id?: string;
  action?: string;
  remove_from_blacklist?: boolean;
  updates?: string[];
  delete_reason?: string;
  deleted_by_admin?: boolean;
  deleted_by_owner?: boolean;
  admin_name?: string;
  appeal_status?: string;
  days_threshold?: number;
  deleted_count?: number;
  deleted_ids?: string[];
  
  // 管理员相关
  target_admin_id?: string;
  target_level?: number;
  updated_fields_admin?: string[];
  success?: boolean;
  level?: number;
  
  // Bot 相关
  bot_name?: string;
  owner?: string;
  description?: string;
  custom_token?: boolean;
  has_token_update?: boolean;
  deleted_by?: string;
  exists?: boolean;
  
  // 系统配置相关
  updated_sections?: string[];
  updated_paths?: string[];
  original_values?: Record<string, unknown>;
  update_reason?: string;
  restart_type?: string;
  triggered_by?: string;
  token_revoked?: boolean;
  
  // AI 分析相关
  status?: string;
  refresh?: boolean;
  
  // 备份相关
  filename?: string;
  size?: string;
  remark?: string;
  count?: number;
  enabled?: boolean;
  cron?: string;
  backup_dir?: string;
  max_backups?: number;
  retention_days?: number;
  
  // 其他
  error?: string;
  [key: string]: unknown;
}

interface LogItem {
  timestamp: string;
  action_type: string;
  operator_id: string;
  operator_type: string;
  operator_level?: number;
  details: LogDetails;
  ip: string;
  status: string;
}

export function LogsPage() {
  const { token } = useOutletContext<AdminDataContext>();

  const [logsPage, setLogsPage] = useState(1);
  const [logsPerPage, setLogsPerPage] = useState(50);
  const [logFilterAction, setLogFilterAction] = useState('');
  const [logFilterStatus, setLogFilterStatus] = useState<'all' | 'success' | 'failure'>('all');
  const [logStartDate, setLogStartDate] = useState('');
  const [logEndDate, setLogEndDate] = useState('');

  const [logs, setLogs] = useState<LogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsTotal, setLogsTotal] = useState(0);
  const [actionTypes, setActionTypes] = useState<Record<string, string>>({});
  const [logStats, setLogStats] = useState<any>(null);

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);

  const localActionTypeMap: Record<string, string> = { 'file_delete': '删除图片' };
  const getActionTypeLabel = (t: string) => localActionTypeMap[t] || actionTypes[t] || t;

  // 用 ref 持有最新过滤值，避免闭包问题
  const filterRef = useRef({ logsPage, logsPerPage, logFilterAction, logFilterStatus, logStartDate, logEndDate });
  useEffect(() => {
    filterRef.current = { logsPage, logsPerPage, logFilterAction, logFilterStatus, logStartDate, logEndDate };
  });

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    const { logsPage, logsPerPage, logFilterAction, logFilterStatus, logStartDate, logEndDate } = filterRef.current;
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({ page: logsPage.toString(), per_page: logsPerPage.toString() });
      if (logFilterAction) params.append('action_type', logFilterAction);
      if (logFilterStatus !== 'all') params.append('status', logFilterStatus);
      if (logStartDate) params.append('start_time', logStartDate);
      if (logEndDate) params.append('end_time', logEndDate);
      const res = await fetch(`${API_BASE}/api/admin/logs?${params}`, { headers: { Authorization: token } });
      const data = await res.json();
      if (data.success) { setLogs(data.data.items); setLogsTotal(data.data.total); }
    } catch { toast.error('获取审计日志失败'); }
    finally { setLogsLoading(false); }
  }, [token]);

  useEffect(() => {
    fetchLogs();
  }, [token, logsPage, logsPerPage, logFilterAction, logFilterStatus, logStartDate, logEndDate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/admin/logs/action-types`, { headers: { Authorization: token } })
      .then(r => r.json()).then(d => { if (d.success) setActionTypes(d.data); }).catch(() => {});
    fetch(`${API_BASE}/api/admin/logs/statistics?days=7`, { headers: { Authorization: token } })
      .then(r => r.json()).then(d => { if (d.success) setLogStats(d.data); }).catch(() => {});
  }, [token]);

  const totalPages = Math.ceil(logsTotal / logsPerPage);

  const openDetailDialog = (log: LogItem) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const closeDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedLog(null);
  };

  // 提取日志中的关键信息摘要
  const extractLogSummary = (log: LogItem): string | null => {
    const details = log.details;
    if (!details) return null;

    const parts: string[] = [];

    // 根据操作类型提取关键信息
    switch (log.action_type) {
      case 'blacklist_add':
        if (details.reason) parts.push(`原因: ${details.reason}`);
        break;
      case 'blacklist_remove':
        if (details.reason) parts.push(`移除原因: ${details.reason}`);
        break;
      case 'blacklist_update':
        if (details.updated_fields?.length) parts.push(`修改: ${details.updated_fields.join(', ')}`);
        break;
      case 'appeal_create':
        if (details.appeal_id) parts.push(`申诉ID: ${details.appeal_id}`);
        break;
      case 'appeal_update':
        if (details.update_reason) parts.push(`修改原因: ${details.update_reason}`);
        if (details.updates?.length) parts.push(`更新字段: ${details.updates.join(', ')}`);
        break;
      case 'appeal_delete':
        if (details.delete_reason) parts.push(`删除原因: ${details.delete_reason}`);
        if (details.deleted_by_admin) parts.push('管理员删除');
        if (details.deleted_by_owner) parts.push('用户自删');
        break;
      case 'appeal_review':
        if (details.action) parts.push(`操作: ${details.action === 'approve' ? '通过' : '拒绝'}`);
        if (details.reason) parts.push(`审核原因: ${details.reason}`);
        if (details.remove_from_blacklist) parts.push('已移除黑名单');
        break;
      case 'appeal_clear_processed':
        if (details.deleted_count !== undefined) parts.push(`清理数量: ${details.deleted_count}`);
        break;
      case 'admin_create':
        if (details.target_admin_id) parts.push(`新管理员: ${details.target_admin_id}`);
        if (details.target_level) parts.push(`等级: ${details.target_level}`);
        break;
      case 'admin_update':
        if (details.updated_fields?.length) parts.push(`修改字段: ${details.updated_fields.join(', ')}`);
        break;
      case 'admin_delete':
        if (details.target_admin_id) parts.push(`被删管理员: ${details.target_admin_id}`);
        break;
      case 'admin_login':
        if (details.level) parts.push(`等级: ${details.level}`);
        if (details.success === false) parts.push('登录失败');
        break;
      case 'bot_create':
        if (details.bot_name) parts.push(`Bot: ${details.bot_name}`);
        break;
      case 'bot_delete':
        if (details.bot_name) parts.push(`Bot: ${details.bot_name}`);
        break;
      case 'config_update':
        if (details.update_reason) parts.push(`更新原因: ${details.update_reason}`);
        if (details.updated_sections?.length) parts.push(`更新配置: ${details.updated_sections.join(', ')}`);
        break;
      case 'system_restart':
        if (details.triggered_by) parts.push(`触发者: ${details.triggered_by}`);
        break;
      case 'backup_create':
        if (details.filename) parts.push(`文件: ${details.filename}`);
        if (details.remark) parts.push(`备注: ${details.remark}`);
        break;
      case 'backup_delete':
        if (details.filename) parts.push(`文件: ${details.filename}`);
        break;
      default:
        break;
    }

    // 如果有错误信息，始终显示
    if (details.error) parts.push(`错误: ${details.error}`);

    return parts.length > 0 ? parts.join(' | ') : null;
  };

  // 渲染详细信息为可读格式
  const renderDetails = (details: LogDetails): React.ReactNode => {
    if (!details || Object.keys(details).length === 0) return null;

    const items: React.ReactElement[] = [];
    
    Object.entries(details).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      
      let displayValue: string;
      if (typeof value === 'boolean') {
        displayValue = value ? '是' : '否';
      } else if (typeof value === 'object') {
        displayValue = JSON.stringify(value);
      } else {
        displayValue = String(value);
      }

      // 为特定字段提供更友好的标签
      const labelMap: Record<string, string> = {
        target_id: '目标ID',
        user_type: '用户类型',
        reason: '原因',
        new_reason: '新原因',
        updated_fields: '更新字段',
        appeal_id: '申诉ID',
        action: '操作',
        remove_from_blacklist: '移除黑名单',
        updates: '更新内容',
        update_reason: '更新原因',
        delete_reason: '删除原因',
        deleted_by_admin: '管理员删除',
        deleted_by_owner: '用户自删',
        admin_name: '管理员',
        appeal_status: '申诉状态',
        days_threshold: '天数阈值',
        deleted_count: '删除数量',
        target_admin_id: '目标管理员',
        target_level: '目标等级',
        bot_name: 'Bot名称',
        owner: '所有者',
        updated_sections: '更新配置段',
        updated_paths: '更新路径',
        restart_type: '重启类型',
        triggered_by: '触发者',
        token_revoked: 'Token已撤销',
        filename: '文件名',
        size: '大小',
        remark: '备注',
        enabled: '是否启用',
        cron: '定时表达式',
        max_backups: '最大备份数',
        retention_days: '保留天数',
        error: '错误',
        success: '是否成功',
        level: '等级',
        custom_token: '自定义Token',
        has_token_update: '更新Token',
        deleted_by: '删除者',
        exists: '是否存在',
        status: '状态',
        refresh: '刷新',
        count: '数量',
        backup_dir: '备份目录',
      };

      const label = labelMap[key] || key;
      
      items.push(
        <div key={key} className="flex items-start gap-2 text-xs">
          <span className="text-slate-500 shrink-0">{label}:</span>
          <span className="text-slate-300 break-all">{displayValue}</span>
        </div>
      );
    });

    return <div className="space-y-1 mt-2">{items}</div>;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="审计日志" description="查看系统操作记录，点击行可展开详细信息">
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={logFilterAction}
            onChange={(e) => { setLogFilterAction(e.target.value); setLogsPage(1); }}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="">所有操作</option>
            {Object.entries({ ...localActionTypeMap, ...actionTypes }).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={logFilterStatus}
            onChange={(e) => { setLogFilterStatus(e.target.value as any); setLogsPage(1); }}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="all">所有状态</option>
            <option value="success">成功</option>
            <option value="failure">失败</option>
          </select>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="datetime-local"
              value={logStartDate}
              onChange={(e) => { setLogStartDate(e.target.value); setLogsPage(1); }}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-sm text-white w-44 [color-scheme:dark]"
            />
            <span className="text-slate-400">-</span>
            <input
              type="datetime-local"
              value={logEndDate}
              onChange={(e) => { setLogEndDate(e.target.value); setLogsPage(1); }}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-sm text-white w-44 [color-scheme:dark]"
            />
            {(logStartDate || logEndDate) && (
              <Button 
                onClick={() => { setLogStartDate(''); setLogEndDate(''); setLogsPage(1); }}
                variant="ghost" 
                size="sm"
                className="text-white hover:text-white hover:bg-slate-700"
              >
                清除
              </Button>
            )}
          </div>
          <Button onClick={fetchLogs} variant="outline" size="icon">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </PageHeader>

      {logStats && (
        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">最近7天操作统计</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(logStats.action_counts || {}).map(([action, count]) => (
              <button
                key={action}
                type="button"
                onClick={() => {
                  setLogFilterAction(logFilterAction === action ? '' : action);
                  setLogsPage(1);
                }}
                title={logFilterAction === action ? '点击取消筛选' : '点击筛选此操作'}
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer
                  ${logFilterAction === action
                    ? 'bg-brand/30 text-brand border-brand/50'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
              >
                {getActionTypeLabel(action)}: {count as number}
              </button>
            ))}
          </div>
        </div>
      )}

      {logsLoading ? (
        <LoadingSpinner />
      ) : logs.length === 0 ? (
        <EmptyState icon={ScrollText} description="暂无日志记录" />
      ) : (
        <>
          <div className="glass rounded-2xl overflow-x-auto">
            <table className="w-full" style={{ tableLayout: 'auto' }}>
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400 w-10"></th>
                  <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">时间</th>
                  <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">操作类型</th>
                  <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">操作者</th>
                  <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">IP地址</th>
                  <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logs.map((log: LogItem, index: number) => (
                  <tr 
                    key={index} 
                    className="hover:bg-slate-800/30"
                  >
                    <td className="px-4 md:px-6 py-4">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-slate-500 hover:text-slate-300"
                        onClick={() => openDetailDialog(log)}
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-slate-400 text-sm whitespace-nowrap">{log.timestamp}</td>
                    <td className="px-4 md:px-6 py-4 text-white">{getActionTypeLabel(log.action_type)}</td>
                    <td className="px-4 md:px-6 py-4 text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>{log.operator_id}</span>
                        <OperatorTypeBadge 
                          type={log.operator_type} 
                          level={log.operator_level} 
                        />
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-slate-400 text-sm font-mono whitespace-nowrap">{log.ip}</td>
                    <td className="px-4 md:px-6 py-4">
                      <OperationStatusBadge status={log.status === 'success'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={logsPage}
            totalPages={totalPages}
            onPageChange={(page) => setLogsPage(page)}
            perPage={logsPerPage}
            onPerPageChange={(perPage) => { setLogsPerPage(perPage); setLogsPage(1); }}
            showPerPage
          />
        </>
      )}

      {/* Detail Dialog */}
      <DetailView
        isOpen={detailDialogOpen}
        title="日志详情"
        onClose={closeDetailDialog}
      >
        {selectedLog && (
          <>
            <DetailInfoGrid>
              <DetailInfoItem label="时间">
                <p className="text-white">{selectedLog.timestamp}</p>
              </DetailInfoItem>
              <DetailInfoItem label="操作类型">
                <p className="text-white">{getActionTypeLabel(selectedLog.action_type)}</p>
              </DetailInfoItem>
              <DetailInfoItem label="操作者">
                <div className="flex items-center gap-2">
                  <span className="text-white">{selectedLog.operator_id}</span>
                  <OperatorTypeBadge 
                    type={selectedLog.operator_type} 
                    level={selectedLog.operator_level} 
                  />
                </div>
              </DetailInfoItem>
              <DetailInfoItem label="IP地址">
                <p className="text-white font-mono">{selectedLog.ip}</p>
              </DetailInfoItem>
              <DetailInfoItem label="状态">
                <OperationStatusBadge status={selectedLog.status === 'success'} />
              </DetailInfoItem>
            </DetailInfoGrid>

            {extractLogSummary(selectedLog) && (
              <DetailContentBlock label="摘要">
                <p className="text-slate-300">{extractLogSummary(selectedLog)}</p>
              </DetailContentBlock>
            )}

            <DetailContentBlock label="详细信息">
              {renderDetails(selectedLog.details)}
            </DetailContentBlock>
          </>
        )}
      </DetailView>
    </div>
  );
}
