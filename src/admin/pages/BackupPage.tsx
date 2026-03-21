import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Database, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AdminDataContext } from '../hooks/useAdminData';

export function BackupPage() {
  const { token, backups, backupStatus, backupLoading, fetchBackups, fetchBackupStatus } = useOutletContext<AdminDataContext>();

  useEffect(() => {
    if (token) {
      fetchBackupStatus();
      fetchBackups();
    }
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">数据库备份</h2>
          <p className="text-sm text-muted-foreground">管理数据库自动备份和手动备份</p>
        </div>
        <Button onClick={() => { fetchBackupStatus(); fetchBackups(); }} variant="outline" size="icon">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {backupStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${backupStatus.enabled ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                <Database className={`w-5 h-5 ${backupStatus.enabled ? 'text-green-500' : 'text-gray-500'}`} />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">自动备份</p>
                <p className={`font-medium ${backupStatus.enabled ? 'text-green-400' : 'text-gray-400'}`}>
                  {backupStatus.enabled ? '已启用' : '已禁用'}
                </p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div>
              <p className="text-muted-foreground text-sm">备份频率</p>
              <p className="text-white font-medium">{backupStatus.cron}</p>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div>
              <p className="text-muted-foreground text-sm">备份数量</p>
              <p className="text-white font-medium">{backupStatus.backup_count} / {backupStatus.max_backups}</p>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div>
              <p className="text-muted-foreground text-sm">下次备份</p>
              <p className="text-white font-medium">{backupStatus.next_backup || '未安排'}</p>
            </div>
          </div>
        </div>
      )}

      {backupLoading ? (
        <div className="text-center py-20">
          <span className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin inline-block" />
          <p className="text-muted-foreground mt-4">加载中...</p>
        </div>
      ) : backups.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Database className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">暂无备份文件</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">文件名</th>
                <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">类型</th>
                <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">大小</th>
                <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">创建时间</th>
                <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">备注</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {backups.map((backup) => (
                <tr key={backup.filename} className="hover:bg-slate-800/30">
                  <td className="px-4 md:px-6 py-4 text-white font-mono text-sm">{backup.filename}</td>
                  <td className="px-4 md:px-6 py-4">
                    <Badge className={backup.is_auto ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}>
                      {backup.is_auto ? '自动' : '手动'}
                    </Badge>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-slate-300">{backup.size_human}</td>
                  <td className="px-4 md:px-6 py-4 text-slate-400 text-sm">{backup.created_at_str}</td>
                  <td className="px-4 md:px-6 py-4 text-slate-300 max-w-[200px] truncate">{backup.remark || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
