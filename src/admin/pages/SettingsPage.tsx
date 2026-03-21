import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Server, TrendingUp, Shield, RotateCcw, Power, Mail, Bot, Database, Globe, FileUp, Activity, Clock, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
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
        const { smtp, geetest, ai_analysis, database_backup, ...allowedConfig } = editConfig;
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

  const canEditSensitiveConfig = adminLevel >= 4;

  const renderConfigInput = (key: string, value: any, onChange: (val: any) => void, type: string = 'text') => {
    if (typeof value === 'boolean') {
      return (
        <select
          value={value ? 'true' : 'false'}
          onChange={(e) => onChange(e.target.value === 'true')}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
        >
          <option value="true">启用</option>
          <option value="false">禁用</option>
        </select>
      );
    }
    if (typeof value === 'number') {
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="bg-slate-800 border-slate-700"
        />
      );
    }
    return (
      <Input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="bg-slate-800 border-slate-700"
      />
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">系统设置</h2>
        <p className="text-sm text-muted-foreground">管理系统配置和服务器状态</p>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="bg-slate-800 flex-wrap h-auto">
          <TabsTrigger value="basic">基础配置</TabsTrigger>
          <TabsTrigger value="smtp">邮件服务</TabsTrigger>
          <TabsTrigger value="ai">AI分析</TabsTrigger>
          <TabsTrigger value="security">安全设置</TabsTrigger>
          <TabsTrigger value="upload">文件上传</TabsTrigger>
          <TabsTrigger value="backup">自动备份</TabsTrigger>
          <TabsTrigger value="server">服务器状态</TabsTrigger>
        </TabsList>

        {/* Basic Config */}
        <TabsContent value="basic" className="space-y-6">
          {configLoading ? (
            <div className="text-center py-20">
              <span className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin inline-block" />
            </div>
          ) : editConfig ? (
            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-brand" />
                基础配置
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>监听地址</Label>
                  {renderConfigInput('host', editConfig.host, (v) => setEditConfig({ ...editConfig, host: v }))}
                </div>
                <div className="space-y-2">
                  <Label>端口</Label>
                  {renderConfigInput('port', editConfig.port, (v) => setEditConfig({ ...editConfig, port: v }))}
                </div>
                <div className="space-y-2">
                  <Label>调试模式</Label>
                  {renderConfigInput('debug', editConfig.debug, (v) => setEditConfig({ ...editConfig, debug: v }))}
                </div>
                <div className="space-y-2">
                  <Label>Token有效期（秒）</Label>
                  {renderConfigInput('temp_token_ttl', editConfig.temp_token_ttl, (v) => setEditConfig({ ...editConfig, temp_token_ttl: v }))}
                </div>
                <div className="space-y-2">
                  <Label>时区</Label>
                  <Input
                    value={editConfig.timezone || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, timezone: e.target.value })}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>日志级别</Label>
                  <select
                    value={editConfig.log_level || 'INFO'}
                    onChange={(e) => setEditConfig({ ...editConfig, log_level: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="DEBUG">DEBUG</option>
                    <option value="INFO">INFO</option>
                    <option value="WARNING">WARNING</option>
                    <option value="ERROR">ERROR</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>根域名重定向 URL</Label>
                  <Input
                    value={editConfig.root_redirect_url || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, root_redirect_url: e.target.value })}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>IP Header</Label>
                  <Input
                    value={editConfig.ip_header || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, ip_header: e.target.value })}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">无法加载配置</p>
            </div>
          )}
        </TabsContent>

        {/* SMTP Config */}
        <TabsContent value="smtp" className="space-y-6">
          {configLoading ? (
            <div className="text-center py-20">
              <span className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin inline-block" />
            </div>
          ) : editConfig ? (
            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-500" />
                SMTP 邮件服务配置
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SMTP 服务器</Label>
                  <Input
                    value={editConfig.smtp?.host || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, smtp: { ...editConfig.smtp, host: e.target.value } })}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                  {!canEditSensitiveConfig && <p className="text-xs text-muted-foreground">需要超级管理员权限</p>}
                </div>
                <div className="space-y-2">
                  <Label>SMTP 端口</Label>
                  <Input
                    type="number"
                    value={editConfig.smtp?.port || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, smtp: { ...editConfig.smtp, port: parseInt(e.target.value) || 0 } })}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>用户名</Label>
                  <Input
                    value={editConfig.smtp?.username || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, smtp: { ...editConfig.smtp, username: e.target.value } })}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>密码</Label>
                  <Input
                    type="password"
                    value={editConfig.smtp?.password || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, smtp: { ...editConfig.smtp, password: e.target.value } })}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>发件人邮箱</Label>
                  <Input
                    value={editConfig.smtp?.from || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, smtp: { ...editConfig.smtp, from: e.target.value } })}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>发件人名称</Label>
                  <Input
                    value={editConfig.smtp?.from_name || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, smtp: { ...editConfig.smtp, from_name: e.target.value } })}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>安全类型</Label>
                  <select
                    value={editConfig.smtp?.security || 'tls'}
                    onChange={(e) => setEditConfig({ ...editConfig, smtp: { ...editConfig.smtp, security: e.target.value } })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    disabled={!canEditSensitiveConfig}
                  >
                    <option value="tls">TLS</option>
                    <option value="ssl">SSL</option>
                    <option value="starttls">STARTTLS</option>
                    <option value="none">无</option>
                  </select>
                </div>
              </div>
            </div>
          ) : null}
        </TabsContent>

        {/* AI Analysis Config */}
        <TabsContent value="ai" className="space-y-6">
          {configLoading ? (
            <div className="text-center py-20">
              <span className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin inline-block" />
            </div>
          ) : editConfig ? (
            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-500" />
                AI 分析配置
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>启用 AI 分析</Label>
                  <select
                    value={editConfig.ai_analysis?.enabled ? 'true' : 'false'}
                    onChange={(e) => setEditConfig({ ...editConfig, ai_analysis: { ...editConfig.ai_analysis, enabled: e.target.value === 'true' } })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    disabled={!canEditSensitiveConfig}
                  >
                    <option value="true">启用</option>
                    <option value="false">禁用</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    value={editConfig.ai_analysis?.api_key || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, ai_analysis: { ...editConfig.ai_analysis, api_key: e.target.value } })}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Base URL</Label>
                  <Input
                    value={editConfig.ai_analysis?.base_url || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, ai_analysis: { ...editConfig.ai_analysis, base_url: e.target.value } })}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>模型</Label>
                  <Input
                    value={editConfig.ai_analysis?.model || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, ai_analysis: { ...editConfig.ai_analysis, model: e.target.value } })}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>最大 Token 数</Label>
                  <Input
                    type="number"
                    value={editConfig.ai_analysis?.max_tokens || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, ai_analysis: { ...editConfig.ai_analysis, max_tokens: parseInt(e.target.value) || 0 } })}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Temperature</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={editConfig.ai_analysis?.temperature || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, ai_analysis: { ...editConfig.ai_analysis, temperature: parseFloat(e.target.value) || 0 } })}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>超时时间（秒）</Label>
                  <Input
                    type="number"
                    value={editConfig.ai_analysis?.timeout || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, ai_analysis: { ...editConfig.ai_analysis, timeout: parseInt(e.target.value) || 0 } })}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>缓存文件</Label>
                  <Input
                    value={editConfig.ai_analysis?.cache_file || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, ai_analysis: { ...editConfig.ai_analysis, cache_file: e.target.value } })}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Public URL</Label>
                  <Input
                    value={editConfig.ai_analysis?.public_url || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, ai_analysis: { ...editConfig.ai_analysis, public_url: e.target.value } })}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </TabsContent>

        {/* Security Config */}
        <TabsContent value="security" className="space-y-6">
          {configLoading ? (
            <div className="text-center py-20">
              <span className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin inline-block" />
            </div>
          ) : editConfig ? (
            <>
              {/* Geetest */}
              <div className="glass rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  极验验证配置
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>启用极验</Label>
                    <select
                      value={editConfig.geetest?.enabled ? 'true' : 'false'}
                      onChange={(e) => setEditConfig({ ...editConfig, geetest: { ...editConfig.geetest, enabled: e.target.value === 'true' } })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                      disabled={!canEditSensitiveConfig}
                    >
                      <option value="true">启用</option>
                      <option value="false">禁用</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Captcha ID</Label>
                    <Input
                      value={editConfig.geetest?.captcha_id || ''}
                      onChange={(e) => setEditConfig({ ...editConfig, geetest: { ...editConfig.geetest, captcha_id: e.target.value } })}
                      className="bg-slate-800 border-slate-700"
                      disabled={!canEditSensitiveConfig}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Captcha Key</Label>
                    <Input
                      type="password"
                      value={editConfig.geetest?.captcha_key || ''}
                      onChange={(e) => setEditConfig({ ...editConfig, geetest: { ...editConfig.geetest, captcha_key: e.target.value } })}
                      className="bg-slate-800 border-slate-700"
                      disabled={!canEditSensitiveConfig}
                    />
                  </div>
                </div>
              </div>

              {/* Rate Limit */}
              <div className="glass rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-orange-500" />
                  速率限制
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>最大请求数（每窗口）</Label>
                    <Input
                      type="number"
                      value={editConfig.rate_limit_max_requests || ''}
                      onChange={(e) => setEditConfig({ ...editConfig, rate_limit_max_requests: parseInt(e.target.value) || 0 })}
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>窗口时间（秒）</Label>
                    <Input
                      type="number"
                      value={editConfig.rate_limit_window || ''}
                      onChange={(e) => setEditConfig({ ...editConfig, rate_limit_window: parseInt(e.target.value) || 0 })}
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IP 最大尝试次数</Label>
                    <Input
                      type="number"
                      value={editConfig.ip_limit_max_attempts || ''}
                      onChange={(e) => setEditConfig({ ...editConfig, ip_limit_max_attempts: parseInt(e.target.value) || 0 })}
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IP 限制窗口（秒）</Label>
                    <Input
                      type="number"
                      value={editConfig.ip_limit_window || ''}
                      onChange={(e) => setEditConfig({ ...editConfig, ip_limit_window: parseInt(e.target.value) || 0 })}
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </TabsContent>

        {/* Upload Config */}
        <TabsContent value="upload" className="space-y-6">
          {configLoading ? (
            <div className="text-center py-20">
              <span className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin inline-block" />
            </div>
          ) : editConfig ? (
            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileUp className="w-5 h-5 text-pink-500" />
                文件上传配置
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>最大上传大小（字节）</Label>
                  <Input
                    type="number"
                    value={editConfig.max_upload_size || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, max_upload_size: parseInt(e.target.value) || 0 })}
                    className="bg-slate-800 border-slate-700"
                  />
                  <p className="text-xs text-muted-foreground">{formatBytes(editConfig.max_upload_size || 0)}</p>
                </div>
                <div className="space-y-2">
                  <Label>上传目录</Label>
                  <Input
                    value={editConfig.upload_folder || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, upload_folder: e.target.value })}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>允许的文件扩展名</Label>
                  <Input
                    value={editConfig.allowed_extensions?.join(', ') || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, allowed_extensions: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    className="bg-slate-800 border-slate-700"
                    placeholder="png, jpg, jpeg, gif, webp"
                  />
                  <p className="text-xs text-muted-foreground">用逗号分隔</p>
                </div>
              </div>
            </div>
          ) : null}
        </TabsContent>

        {/* Backup Config */}
        <TabsContent value="backup" className="space-y-6">
          {configLoading ? (
            <div className="text-center py-20">
              <span className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin inline-block" />
            </div>
          ) : editConfig ? (
            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-500" />
                数据库自动备份配置
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>启用自动备份</Label>
                  <select
                    value={editConfig.database_backup?.enabled ? 'true' : 'false'}
                    onChange={(e) => setEditConfig({ ...editConfig, database_backup: { ...editConfig.database_backup, enabled: e.target.value === 'true' } })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    disabled={!canEditSensitiveConfig}
                  >
                    <option value="true">启用</option>
                    <option value="false">禁用</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Cron 表达式</Label>
                  <Input
                    value={editConfig.database_backup?.cron || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, database_backup: { ...editConfig.database_backup, cron: e.target.value } })}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                    placeholder="0 3 * * *"
                  />
                </div>
                <div className="space-y-2">
                  <Label>备份目录</Label>
                  <Input
                    value={editConfig.database_backup?.backup_dir || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, database_backup: { ...editConfig.database_backup, backup_dir: e.target.value } })}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>最大备份数</Label>
                  <Input
                    type="number"
                    value={editConfig.database_backup?.max_backups || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, database_backup: { ...editConfig.database_backup, max_backups: parseInt(e.target.value) || 0 } })}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>保留天数</Label>
                  <Input
                    type="number"
                    value={editConfig.database_backup?.retention_days || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, database_backup: { ...editConfig.database_backup, retention_days: parseInt(e.target.value) || 0 } })}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </TabsContent>

        {/* Server Status */}
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
                  <Database className="w-5 h-5 text-orange-500" />
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

      {/* Save Button */}
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
