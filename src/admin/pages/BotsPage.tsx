import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Bot } from 'lucide-react';
import type { AdminDataContext } from '../hooks/useAdminData';

export function BotsPage() {
  const { token, bots, botsLoading, fetchBots } = useOutletContext<AdminDataContext>();

  useEffect(() => {
    if (token) fetchBots();
  }, [token]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">Bot Token 管理</h2>
        <p className="text-sm text-muted-foreground">管理 Bot Token，用于 Bot 自动化操作</p>
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
                <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">Bot 名称</th>
                <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">所有者</th>
                <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">描述</th>
                <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-400">创建时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {bots.map((bot) => (
                <tr key={bot.bot_name} className="hover:bg-slate-800/30">
                  <td className="px-4 md:px-6 py-4 text-white font-mono">{bot.bot_name}</td>
                  <td className="px-4 md:px-6 py-4 text-slate-300">{bot.owner}</td>
                  <td className="px-4 md:px-6 py-4 text-slate-400 max-w-[200px] truncate">{bot.description || '-'}</td>
                  <td className="px-4 md:px-6 py-4 text-slate-400 text-sm">{new Date(bot.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
