import { useNavigate, useOutletContext } from 'react-router-dom';
import { Clock, FileText, CheckCircle, TrendingUp, UserX, AlertCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AdminDataContext } from '../hooks/useAdminData';
import { LoadingSpinner, PageHeader } from '../components';

export function DashboardPage() {
  const navigate = useNavigate();
  const { stats } = useOutletContext<AdminDataContext>();

  if (!stats) {
    return <LoadingSpinner text="" />;
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader title="仪表盘" description="系统概览与统计数据" />

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

      <div className="glass rounded-2xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-brand mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">快速操作</h3>
        <p className="text-muted-foreground mb-6">选择左侧菜单开始管理</p>
        <div className="flex justify-center gap-4">
          <Button onClick={() => navigate('/admin/dashboard/appeals')} className="bg-brand hover:bg-brand-dark">
            <FileText className="w-4 h-4 mr-2" />
            处理申诉
          </Button>
          <Button onClick={() => navigate('/admin/dashboard/blacklist')} variant="outline">
            <Users className="w-4 h-4 mr-2" />
            管理黑名单
          </Button>
        </div>
      </div>
    </div>
  );
}
