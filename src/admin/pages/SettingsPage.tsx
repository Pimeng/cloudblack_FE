import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Server, TrendingUp, Shield, RotateCcw, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import type { AdminDataContext } from '../hooks/useAdminData';

import { formatBytes, formatUptime } from '../utils';
import type { SystemConfig } from '../types';
import { API_BASE } from '../types';
import { toast } from 'sonner';

export function SettingsPage() {
  const { token, adminLevel, config, setConfig, systemInfo, configLoading, fetchConfig, fetchSystemInfo } = useOutletContext<AdminDataContext>();
  const [editConfig, setEditConfig] = useState<Partial<SystemConfig>>({});
  const [updatingConfig, setUpdatingConfig] = useState(false);
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);
  const [restarting, setRestarting] = useState(false);

  useEffect(() => {
    if (token) {
      fetchConfig();
      fetchSystemInfo();
    }
  }, [token]);

  useEffect(() => {
    if (config) {
      setEditConfig(config);
    }
  }, [config]);

  const updateConfig = async () => {
    if (!config || !token) return;
    
    setUpdatingConfig(true);
    try {
      let configToUpdate: Partial<SystemConfig>;
      if (adminLevel >= 4) {
        configToUpdate = editConfig;
      } else {
        const { smtp, geetest, ...allowedConfig } = editConfig;
        configToUpdate = allowedConfig;
      }
      
      const response = await fetch(`https://cloudblack-api.07210700.xyz/api/admin/config`, {
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
    if (!token) return;
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

  return (
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
              <div className="glass rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-brand" />
                  基础配置
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="flex gap-2 pt-4">
                <Button onClick={updateConfig} disabled={updatingConfig} className="bg-brand hover:bg-brand-dark">
                  {updatingConfig && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />}
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
                    <div className="h-full bg-green-500 transition-all" style={{ width: `${systemInfo.cpu_percent}%` }} />
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
                    <div className="h-full bg-blue-500 transition-all" style={{ width: `${systemInfo.memory.percent}%` }} />
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
                    <div className="h-full bg-orange-500 transition-all" style={{ width: `${systemInfo.disk.percent}%` }} />
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

      {/* Restart Dialog */}
      <Dialog open={restartDialogOpen} onOpenChange={setRestartDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-[calc(100%-2rem)] mx-4">
          <DialogHeader>
            <DialogTitle>重启服务器</DialogTitle>
            <DialogDescription className="text-slate-400">
              确定要重启服务器吗？此操作会立即终止当前进程，Docker环境将自动重新启动容器。
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRestartDialogOpen(false)}>取消</Button>
            <Button onClick={restartServer} disabled={restarting} variant="destructive">
              {restarting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : <><Power className="w-4 h-4 mr-2" />确认重启</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
