import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ScrollText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AdminDataContext } from '../hooks/useAdminData';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function LogsPage() {
  const { token, logs, logsLoading, logsPage, setLogsPage, logsTotal, logsPerPage, setLogsPerPage, logFilterAction, setLogFilterAction, logFilterStatus, setLogFilterStatus, actionTypes, logStats, fetchLogs, fetchActionTypes, fetchLogStats } = useOutletContext<AdminDataContext>();

  useEffect(() => {
    if (token) {
      fetchLogs();
      fetchActionTypes();
      fetchLogStats();
    }
  }, [token, logsPage, logsPerPage, logFilterAction, logFilterStatus]);

  const totalPages = Math.ceil(logsTotal / logsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">审计日志</h2>
          <p className="text-sm text-muted-foreground">查看系统操作记录</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={logFilterAction}
            onChange={(e) => { setLogFilterAction(e.target.value); setLogsPage(1); }}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="">所有操作</option>
            {Object.entries(actionTypes).map(([key, label]) => (
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
          <Button onClick={() => fetchLogs()} variant="outline" size="icon">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {logStats && (
        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">最近7天操作统计</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(logStats.action_counts || {}).map(([action, count]) => (
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
                  <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">时间</th>
                  <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">操作类型</th>
                  <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">操作者</th>
                  <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">IP地址</th>
                  <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logs.map((log, index) => (
                  <tr key={index} className="hover:bg-slate-800/30">
                    <td className="px-4 md:px-6 py-4 text-slate-400 text-sm">{log.timestamp}</td>
                    <td className="px-4 md:px-6 py-4 text-white">{actionTypes[log.action_type] || log.action_type}</td>
                    <td className="px-4 md:px-6 py-4 text-slate-300">
                      <div className="flex items-center gap-2">
                        <span>{log.operator_id}</span>
                        {log.operator_type === 'admin' && (
                          <Badge variant="secondary" className="bg-slate-800 text-slate-400 border-slate-700 text-xs">管理员</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-slate-400 text-sm font-mono">{log.ip}</td>
                    <td className="px-4 md:px-6 py-4">
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">每页显示</span>
                <select
                  value={logsPerPage}
                  onChange={(e) => { setLogsPerPage(Number(e.target.value)); setLogsPage(1); }}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-muted-foreground">条</span>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={() => setLogsPage(p => Math.max(1, p - 1))} disabled={logsPage === 1} variant="outline" size="icon">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">第 {logsPage} / {totalPages} 页</span>
                <Button onClick={() => setLogsPage(p => Math.min(totalPages, p + 1))} disabled={logsPage === totalPages} variant="outline" size="icon">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
