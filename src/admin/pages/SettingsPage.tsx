import { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { useUrlState } from '../hooks';
import { Server, TrendingUp, Shield, RotateCcw, Power, Mail, Bot, Database, FileUp, Activity, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { AdminDataContext } from '../hooks/useAdminData';
import { formatBytes, formatUptime } from '../utils';
import type { SystemConfig } from '../types';
import { API_BASE } from '../types';
import { toast } from 'sonner';
import {
  AdminDialogContent,
  LoadingButton,
  InlineSpinner,
  PageHeader,
} from '../components';

export function SettingsPage() {
  const { token, adminLevel, config, setConfig, systemInfo, configLoading, fetchConfig, fetchSystemInfo } = useOutletContext<AdminDataContext>();
  const [editConfig, setEditConfig] = useState<Partial<SystemConfig>>({});
  const [changedFields, setChangedFields] = useState<Set<string>>(new Set());
  const [updatingConfig, setUpdatingConfig] = useState(false);
  const [updateReason, setUpdateReason] = useState('');
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);
  
  // 从 URL 获取 tab 状态
  const [activeTab, setActiveTab] = useUrlState<'basic' | 'smtp' | 'ai' | 'security' | 'upload' | 'backup' | 'server'>('tab', 'basic');
  
  // 处理 Logto 绑定结果
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const bindResult = searchParams.get('bind');
    const bindMessage = searchParams.get('message');
    
    if (bindResult) {
      if (bindResult === 'success') {
        toast.success('Logto 账户绑定成功！');
      } else if (bindResult === 'error') {
        toast.error(bindMessage || 'Logto 账户绑定失败');
      }
      // 清除 URL 参数
      searchParams.delete('bind');
      searchParams.delete('message');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (token) {
      fetchConfig();
      fetchSystemInfo();
    }
  }, [token]);

  useEffect(() => {
    if (config) {
      setEditConfig(config);
      setChangedFields(new Set()); // 重置修改记录
    }
  }, [config]);

  // 辅助函数：更新配置并记录修改的字段
  const updateEditConfig = (field: string, value: any) => {
    const keys = field.split('.');
    setEditConfig((prev) => {
      const newConfig = { ...prev };
      let current: any = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        current[key] = { ...current[key] };
        current = current[key];
      }
      
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
    setChangedFields((prev) => new Set(prev).add(field));
  };

  // 辅助函数：提取修改过的字段
  const extractChangedFields = (): Partial<SystemConfig> => {
    const result: Partial<SystemConfig> = {};
    
    changedFields.forEach((field) => {
      const keys = field.split('.');
      let current: any = result;
      let source: any = editConfig;
      
      // 获取嵌套值
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current)) {
          current[key] = {};
        }
        current = current[key];
        source = source?.[key];
      }
      
      const lastKey = keys[keys.length - 1];
      current[lastKey] = source?.[lastKey];
    });
    
    return result;
  };

  const updateConfig = async () => {
    if (!config || !token || changedFields.size === 0) {
      if (changedFields.size === 0) {
        toast.info('没有需要更新的配置');
      }
      return;
    }
    
    setUpdatingConfig(true);
    try {
      // 只提取修改过的字段
      let configToUpdate = extractChangedFields();
      
      // 非超级管理员需要过滤敏感字段
      if (adminLevel < 4) {
        const { smtp, geetest, ai_analysis, database_backup, ...allowedConfig } = configToUpdate;
        configToUpdate = allowedConfig;
        
        // 检查是否有尝试修改敏感字段
        const hasSensitiveChanges = changedFields.has('smtp') || 
          changedFields.has('geetest') || 
          changedFields.has('ai_analysis') || 
          changedFields.has('database_backup');
        
        if (hasSensitiveChanges) {
          toast.error('您没有权限修改敏感配置（SMTP、极验、AI分析、数据库备份）');
          setUpdatingConfig(false);
          return;
        }
      }
      
      // 添加更新原因到请求体
      const requestBody: any = {
        ...configToUpdate,
      };
      if (updateReason.trim()) {
        requestBody._update_reason = updateReason.trim();
      }
      
      const response = await fetch(`${API_BASE}/api/admin/config`, {
        method: 'PUT',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('配置已更新，重启后生效');
        // 使用后端返回的完整配置数据
        if (data.data) {
          setConfig(data.data);
          setEditConfig(data.data);
        }
        setUpdateReason('');
        setChangedFields(new Set()); // 清空修改记录
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

  const renderConfigInput = (_key: string, value: any, onChange: (val: any) => void, type: string = 'text') => {
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
      <PageHeader title="系统设置" description="管理系统配置和服务器状态">
        <button
          onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
            showSensitiveInfo
              ? 'bg-brand hover:bg-brand-dark text-white'
              : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
          }`}
        >
          {showSensitiveInfo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {showSensitiveInfo ? '隐藏敏感信息' : '显示敏感信息'}
        </button>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full">
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
                  {renderConfigInput('host', editConfig.host, (v) => updateEditConfig('host', v))}
                </div>
                <div className="space-y-2">
                  <Label>端口</Label>
                  {renderConfigInput('port', editConfig.port, (v) => updateEditConfig('port', v))}
                </div>
                <div className="space-y-2">
                  <Label>调试模式</Label>
                  {renderConfigInput('debug', editConfig.debug, (v) => updateEditConfig('debug', v))}
                </div>
                <div className="space-y-2">
                  <Label>Token有效期（秒）</Label>
                  {renderConfigInput('temp_token_ttl', editConfig.temp_token_ttl, (v) => updateEditConfig('temp_token_ttl', v))}
                </div>
                <div className="space-y-2">
                  <Label>时区</Label>
                  <Input
                    value={editConfig.timezone || ''}
                    onChange={(e) => updateEditConfig('timezone', e.target.value)}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>日志级别</Label>
                  <select
                    value={editConfig.log_level || 'INFO'}
                    onChange={(e) => updateEditConfig('log_level', e.target.value)}
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
                    onChange={(e) => updateEditConfig('root_redirect_url', e.target.value)}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>IP Header</Label>
                  <Input
                    value={editConfig.ip_header || ''}
                    onChange={(e) => updateEditConfig('ip_header', e.target.value)}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Public URL (后端 API 地址)</Label>
                  <Input
                    value={editConfig.public_url || ''}
                    onChange={(e) => updateEditConfig('public_url', e.target.value)}
                    className="bg-slate-800 border-slate-700"
                    placeholder="https://api.example.com"
                  />
                  <p className="text-xs text-muted-foreground">用于生成回调地址和 CORS 配置</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Frontend URL (前端地址)</Label>
                  <Input
                    value={editConfig.frontend_url || ''}
                    onChange={(e) => updateEditConfig('frontend_url', e.target.value)}
                    className="bg-slate-800 border-slate-700"
                    placeholder="https://example.com"
                  />
                  <p className="text-xs text-muted-foreground">用于 CORS 和登出跳转</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Secret Key (Session 密钥)</Label>
                  <Input
                    type={showSensitiveInfo ? 'text' : 'password'}
                    value={editConfig.secret_key || ''}
                    onChange={(e) => updateEditConfig('secret_key', e.target.value)}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                  {!canEditSensitiveConfig && <p className="text-xs text-muted-foreground">需要超级管理员权限</p>}
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
                    onChange={(e) => updateEditConfig('smtp.host', e.target.value)}
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
                    onChange={(e) => updateEditConfig('smtp.port', parseInt(e.target.value) || 0)}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>用户名</Label>
                  <Input
                    value={editConfig.smtp?.username || ''}
                    onChange={(e) => updateEditConfig('smtp.username', e.target.value)}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>密码</Label>
                  <Input
                    type={showSensitiveInfo ? 'text' : 'password'}
                    value={editConfig.smtp?.password || ''}
                    onChange={(e) => updateEditConfig('smtp.password', e.target.value)}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>发件人邮箱</Label>
                  <Input
                    value={editConfig.smtp?.from || ''}
                    onChange={(e) => updateEditConfig('smtp.from', e.target.value)}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>发件人名称</Label>
                  <Input
                    value={editConfig.smtp?.from_name || ''}
                    onChange={(e) => updateEditConfig('smtp.from_name', e.target.value)}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>安全类型</Label>
                  <select
                    value={editConfig.smtp?.security || 'tls'}
                    onChange={(e) => updateEditConfig('smtp.security', e.target.value)}
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
                    onChange={(e) => updateEditConfig('ai_analysis.enabled', e.target.value === 'true')}
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
                    type={showSensitiveInfo ? 'text' : 'password'}
                    value={editConfig.ai_analysis?.api_key || ''}
                    onChange={(e) => updateEditConfig('ai_analysis.api_key', e.target.value)}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Base URL</Label>
                  <Input
                    value={editConfig.ai_analysis?.base_url || ''}
                    onChange={(e) => updateEditConfig('ai_analysis.base_url', e.target.value)}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>模型</Label>
                  <Input
                    value={editConfig.ai_analysis?.model || ''}
                    onChange={(e) => updateEditConfig('ai_analysis.model', e.target.value)}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>最大 Token 数</Label>
                  <Input
                    type="number"
                    value={editConfig.ai_analysis?.max_tokens || ''}
                    onChange={(e) => updateEditConfig('ai_analysis.max_tokens', parseInt(e.target.value) || 0)}
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
                    onChange={(e) => updateEditConfig('ai_analysis.temperature', parseFloat(e.target.value) || 0)}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>超时时间（秒）</Label>
                  <Input
                    type="number"
                    value={editConfig.ai_analysis?.timeout || ''}
                    onChange={(e) => updateEditConfig('ai_analysis.timeout', parseInt(e.target.value) || 0)}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>缓存文件</Label>
                  <Input
                    value={editConfig.ai_analysis?.cache_file || ''}
                    onChange={(e) => updateEditConfig('ai_analysis.cache_file', e.target.value)}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Public URL</Label>
                  <Input
                    value={editConfig.ai_analysis?.public_url || ''}
                    onChange={(e) => updateEditConfig('ai_analysis.public_url', e.target.value)}
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
                      onChange={(e) => updateEditConfig('geetest.enabled', e.target.value === 'true')}
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
                      onChange={(e) => updateEditConfig('geetest.captcha_id', e.target.value)}
                      className="bg-slate-800 border-slate-700"
                      disabled={!canEditSensitiveConfig}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Captcha Key</Label>
                    <Input
                      type={showSensitiveInfo ? 'text' : 'password'}
                      value={editConfig.geetest?.captcha_key || ''}
                      onChange={(e) => updateEditConfig('geetest.captcha_key', e.target.value)}
                      className="bg-slate-800 border-slate-700"
                      disabled={!canEditSensitiveConfig}
                    />
                  </div>
                </div>
              </div>

              {/* Logto SSO Config */}
              <div className="glass rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-indigo-500" />
                  Logto SSO 配置
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>启用 Logto SSO</Label>
                    <select
                      value={editConfig.logto?.enabled ? 'true' : 'false'}
                      onChange={(e) => updateEditConfig('logto.enabled', e.target.value === 'true')}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                      disabled={!canEditSensitiveConfig}
                    >
                      <option value="true">启用</option>
                      <option value="false">禁用</option>
                    </select>
                    {!canEditSensitiveConfig && <p className="text-xs text-muted-foreground">需要超级管理员权限</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Logto Endpoint</Label>
                    <Input
                      value={editConfig.logto?.endpoint || ''}
                      onChange={(e) => updateEditConfig('logto.endpoint', e.target.value)}
                      className="bg-slate-800 border-slate-700"
                      disabled={!canEditSensitiveConfig}
                      placeholder="https://login.example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>App ID</Label>
                    <Input
                      value={editConfig.logto?.app_id || ''}
                      onChange={(e) => updateEditConfig('logto.app_id', e.target.value)}
                      className="bg-slate-800 border-slate-700"
                      disabled={!canEditSensitiveConfig}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>App Secret</Label>
                    <Input
                      type={showSensitiveInfo ? 'text' : 'password'}
                      value={editConfig.logto?.app_secret || ''}
                      onChange={(e) => updateEditConfig('logto.app_secret', e.target.value)}
                      className="bg-slate-800 border-slate-700"
                      disabled={!canEditSensitiveConfig}
                    />
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-xs text-muted-foreground">
                  <p>Logto 控制台配置:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Redirect URI: <code className="bg-slate-700 px-1 rounded">{'{public_url}'}/api/auth/logto/callback</code></li>
                    <li>Post Sign-out Redirect URI: <code className="bg-slate-700 px-1 rounded">{'{frontend_url}'}/login</code></li>
                  </ul>
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
                      onChange={(e) => updateEditConfig('rate_limit_max_requests', parseInt(e.target.value) || 0)}
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>窗口时间（秒）</Label>
                    <Input
                      type="number"
                      value={editConfig.rate_limit_window || ''}
                      onChange={(e) => updateEditConfig('rate_limit_window', parseInt(e.target.value) || 0)}
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IP 最大尝试次数</Label>
                    <Input
                      type="number"
                      value={editConfig.ip_limit_max_attempts || ''}
                      onChange={(e) => updateEditConfig('ip_limit_max_attempts', parseInt(e.target.value) || 0)}
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IP 限制窗口（秒）</Label>
                    <Input
                      type="number"
                      value={editConfig.ip_limit_window || ''}
                      onChange={(e) => updateEditConfig('ip_limit_window', parseInt(e.target.value) || 0)}
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
                    onChange={(e) => updateEditConfig('max_upload_size', parseInt(e.target.value) || 0)}
                    className="bg-slate-800 border-slate-700"
                  />
                  <p className="text-xs text-muted-foreground">{formatBytes(editConfig.max_upload_size || 0)}</p>
                </div>
                <div className="space-y-2">
                  <Label>上传目录</Label>
                  <Input
                    value={editConfig.upload_folder || ''}
                    onChange={(e) => updateEditConfig('upload_folder', e.target.value)}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>允许的文件扩展名</Label>
                  <Input
                    value={editConfig.allowed_extensions?.join(', ') || ''}
                    onChange={(e) => updateEditConfig('allowed_extensions', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
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
                    onChange={(e) => updateEditConfig('database_backup.enabled', e.target.value === 'true')}
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
                    onChange={(e) => updateEditConfig('database_backup.cron', e.target.value)}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                    placeholder="0 3 * * *"
                  />
                </div>
                <div className="space-y-2">
                  <Label>备份目录</Label>
                  <Input
                    value={editConfig.database_backup?.backup_dir || ''}
                    onChange={(e) => updateEditConfig('database_backup.backup_dir', e.target.value)}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>最大备份数</Label>
                  <Input
                    type="number"
                    value={editConfig.database_backup?.max_backups || ''}
                    onChange={(e) => updateEditConfig('database_backup.max_backups', parseInt(e.target.value) || 0)}
                    className="bg-slate-800 border-slate-700"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>保留天数</Label>
                  <Input
                    type="number"
                    value={editConfig.database_backup?.retention_days || ''}
                    onChange={(e) => updateEditConfig('database_backup.retention_days', parseInt(e.target.value) || 0)}
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

      {/* Update Reason */}
      <div className="glass rounded-2xl p-4 space-y-2">
        <Label>更新原因（可选）</Label>
        <Input
          value={updateReason}
          onChange={(e) => setUpdateReason(e.target.value)}
          placeholder="请输入配置更新原因，将记录到审计日志..."
          className="bg-slate-800 border-slate-700"
        />
        <p className="text-xs text-muted-foreground">提供更新原因有助于后续审计追踪</p>
      </div>

      {/* Save Button */}
      <div className="flex gap-2 pt-4">
        <Button onClick={updateConfig} disabled={updatingConfig} className="bg-brand hover:bg-brand-dark">
          {updatingConfig && <InlineSpinner className="mr-2" />}
          保存配置
        </Button>
        <Button onClick={() => setRestartDialogOpen(true)} variant="destructive">
          <RotateCcw className="w-4 h-4 mr-2" />
          重启服务器
        </Button>
      </div>

      {/* Restart Dialog */}
      <Dialog open={restartDialogOpen} onOpenChange={setRestartDialogOpen}>
        <AdminDialogContent>
          <DialogHeader>
            <DialogTitle>重启服务器</DialogTitle>
            <DialogDescription className="text-slate-400">
              确定要重启服务器吗？此操作会立即终止当前进程，Docker环境将自动重新启动容器。
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRestartDialogOpen(false)}>取消</Button>
            <LoadingButton
              onClick={restartServer}
              loading={restarting}
              icon={Power}
              variant="destructive"
            >
              确认重启
            </LoadingButton>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>
    </div>
  );
}
