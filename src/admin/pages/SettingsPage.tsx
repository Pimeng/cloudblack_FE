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
import { CronEditor } from '../components/CronEditor';

export function SettingsPage() {
  const { token, adminLevel, config, systemInfo, configLoading, fetchConfig, fetchSystemInfo } = useOutletContext<AdminDataContext>();
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

      const changedFieldList = Array.from(changedFields);
      const hasFieldPrefix = (prefix: string) => changedFieldList.some((field) => field === prefix || field.startsWith(`${prefix}.`));
      const hasAnyFieldPrefix = (prefixes: string[]) => prefixes.some((prefix) => hasFieldPrefix(prefix));
      
      // 非超级管理员需要过滤敏感字段
      if (adminLevel < 4) {
        const { smtp, geetest, ai_analysis, database_backup, ...allowedConfig } = configToUpdate;
        configToUpdate = allowedConfig;
        
        // 检查是否有尝试修改敏感字段
        const hasSensitiveChanges = hasAnyFieldPrefix([
          'smtp',
          'geetest',
          'ai_analysis',
          'database_backup',
          'secret_key',
          'logto',
          'audit_log',
          'hotlink_protection',
          'rate_limit',
          'rate_limit_max_requests',
          'rate_limit_window',
        ]);
        
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

      const sectionsToUpdate = new Set<string>();

      if (hasAnyFieldPrefix(['smtp'])) sectionsToUpdate.add('smtp');
      if (hasAnyFieldPrefix(['ai_analysis'])) sectionsToUpdate.add('ai-analysis');
      if (hasAnyFieldPrefix(['geetest', 'secret_key', 'logto', 'audit_log', 'hotlink_protection', 'rate_limit', 'rate_limit_max_requests', 'rate_limit_window', 'ip_header'])) {
        sectionsToUpdate.add('security');
      }
      if (hasAnyFieldPrefix(['upload', 'max_upload_size', 'upload_folder', 'allowed_extensions'])) {
        sectionsToUpdate.add('file-upload');
      }
      if (hasAnyFieldPrefix(['database_backup'])) sectionsToUpdate.add('database-backup');

      const nonBasicPrefixes = ['smtp', 'ai_analysis', 'geetest', 'secret_key', 'logto', 'audit_log', 'hotlink_protection', 'rate_limit', 'rate_limit_max_requests', 'rate_limit_window', 'ip_header', 'upload', 'max_upload_size', 'upload_folder', 'allowed_extensions', 'database_backup'];
      const hasBasicChanges = changedFieldList.some((field) => {
        const topLevel = field.split('.')[0];
        return !nonBasicPrefixes.includes(topLevel);
      });
      if (hasBasicChanges) {
        sectionsToUpdate.add('basic');
      }

      const sectionPayloads: Record<string, any> = {};

      if (sectionsToUpdate.has('basic')) {
        const {
          smtp,
          ai_analysis,
          geetest,
          database_backup,
          logto,
          audit_log,
          hotlink_protection,
          rate_limit,
          upload,
          max_upload_size,
          upload_folder,
          allowed_extensions,
          _update_reason,
          ...basicPayload
        } = requestBody;
        sectionPayloads.basic = basicPayload;
      }

      if (sectionsToUpdate.has('smtp')) {
        sectionPayloads.smtp = requestBody.smtp || {};
      }

      if (sectionsToUpdate.has('ai-analysis')) {
        sectionPayloads['ai-analysis'] = requestBody.ai_analysis || {};
      }

      if (sectionsToUpdate.has('security')) {
        const securityPayload: Record<string, any> = {};

        if ('secret_key' in requestBody) securityPayload.secret_key = requestBody.secret_key;
        if ('ip_header' in requestBody) securityPayload.ip_header = requestBody.ip_header;
        if ('geetest' in requestBody) securityPayload.geetest = requestBody.geetest;
        if ('logto' in requestBody) securityPayload.logto = requestBody.logto;
        if ('audit_log' in requestBody) securityPayload.audit_log = requestBody.audit_log;
        if ('hotlink_protection' in requestBody) securityPayload.hotlink_protection = requestBody.hotlink_protection;
        if ('rate_limit' in requestBody) securityPayload.rate_limit = requestBody.rate_limit;
        if ('rate_limit_max_requests' in requestBody) securityPayload.rate_limit_max_requests = requestBody.rate_limit_max_requests;
        if ('rate_limit_window' in requestBody) securityPayload.rate_limit_window = requestBody.rate_limit_window;

        sectionPayloads.security = securityPayload;
      }

      if (sectionsToUpdate.has('file-upload')) {
        const fileUploadPayload = requestBody.upload || {};
        if ('max_upload_size' in requestBody) fileUploadPayload.max_upload_size = requestBody.max_upload_size;
        if ('upload_folder' in requestBody) fileUploadPayload.upload_folder = requestBody.upload_folder;
        if ('allowed_extensions' in requestBody) fileUploadPayload.allowed_extensions = requestBody.allowed_extensions;
        sectionPayloads['file-upload'] = fileUploadPayload;
      }

      if (sectionsToUpdate.has('database-backup')) {
        sectionPayloads['database-backup'] = requestBody.database_backup || {};
      }

      if (Object.keys(sectionPayloads).length === 0) {
        toast.info('没有可提交的配置变更');
        setUpdatingConfig(false);
        return;
      }

      const updateResults = await Promise.all(
        Object.entries(sectionPayloads).map(async ([section, payload]) => {
          const payloadWithReason = updateReason.trim()
            ? { ...payload, _update_reason: updateReason.trim() }
            : payload;

          const response = await fetch(`${API_BASE}/api/admin/config/${section}`, {
            method: 'PUT',
            headers: {
              'Authorization': token,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payloadWithReason),
          });

          const data = await response.json();
          return { section, success: data.success, message: data.message };
        })
      );

      const failedResult = updateResults.find((result) => !result.success);
      if (failedResult) {
        toast.error(failedResult.message || `更新 ${failedResult.section} 配置失败`);
        return;
      }

      toast.success('配置已更新，重启后生效');
      fetchConfig();
      setUpdateReason('');
      setChangedFields(new Set());
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

  const validateDatabaseBackupCron = async (cron: string) => {
    if (!token) {
      return { valid: false, message: '未登录，无法校验' };
    }

    try {
      const response = await fetch(`${API_BASE}/api/admin/config/database-backup/validate-cron`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cron }),
      });

      const data = await response.json();
      if (response.status === 401 || response.status === 403) {
        return { valid: false, message: '登录已过期，请重新登录' };
      }

      if (!data.success) {
        return { valid: false, message: data.message || 'CRON 表达式无效' };
      }

      const payload = data.data || {};
      const nextRuns = Array.isArray(payload.next_runs)
        ? payload.next_runs
        : payload.next_run
          ? [payload.next_run]
          : [];

      return {
        valid: payload.valid ?? true,
        message: data.message || (payload.valid === false ? 'CRON 表达式无效' : 'CRON 表达式有效'),
        nextRuns,
      };
    } catch {
      return { valid: false, message: '校验请求失败，请稍后重试' };
    }
  };

  const renderConfigInput = (_key: string, value: any, onChange: (val: any) => void, type: string = 'text') => {
    if (typeof value === 'boolean') {
      return (
        <select
          value={value ? 'true' : 'false'}
          onChange={(e) => onChange(e.target.value === 'true')}
          className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground"
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
          className="bg-muted border-border"
        />
      );
    }
    return (
      <Input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="bg-muted border-border"
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
              : 'bg-muted/60 hover:bg-muted text-muted-foreground'
          }`}
        >
          {showSensitiveInfo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {showSensitiveInfo ? '隐藏敏感信息' : '显示敏感信息'}
        </button>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full">
        <TabsList className="bg-muted flex-wrap h-auto">
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
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
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
                    className="bg-muted border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>日志级别</Label>
                  <select
                    value={editConfig.log_level || 'INFO'}
                    onChange={(e) => updateEditConfig('log_level', e.target.value)}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground"
                  >
                    <option value="DEBUG">DEBUG</option>
                    <option value="INFO">INFO</option>
                    <option value="WARNING">WARNING</option>
                    <option value="ERROR">ERROR</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>IP Header</Label>
                  <Input
                    value={editConfig.ip_header || ''}
                    onChange={(e) => updateEditConfig('ip_header', e.target.value)}
                    className="bg-muted border-border"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Public URL (后端 API 地址)</Label>
                  <Input
                    value={editConfig.public_url || ''}
                    onChange={(e) => updateEditConfig('public_url', e.target.value)}
                    className="bg-muted border-border"
                    placeholder="https://api.example.com"
                  />
                  <p className="text-xs text-muted-foreground">用于生成回调地址和 CORS 配置</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Frontend URL (前端地址)</Label>
                  <Input
                    value={editConfig.frontend_url || ''}
                    onChange={(e) => updateEditConfig('frontend_url', e.target.value)}
                    className="bg-muted border-border"
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
                    className="bg-muted border-border"
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
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-500" />
                SMTP 邮件服务配置
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SMTP 服务器</Label>
                  <Input
                    value={editConfig.smtp?.host || ''}
                    onChange={(e) => updateEditConfig('smtp.host', e.target.value)}
                    className="bg-muted border-border"
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
                    className="bg-muted border-border"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>用户名</Label>
                  <Input
                    value={editConfig.smtp?.username || ''}
                    onChange={(e) => updateEditConfig('smtp.username', e.target.value)}
                    className="bg-muted border-border"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>密码</Label>
                  <Input
                    type={showSensitiveInfo ? 'text' : 'password'}
                    value={editConfig.smtp?.password || ''}
                    onChange={(e) => updateEditConfig('smtp.password', e.target.value)}
                    className="bg-muted border-border"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>发件人邮箱</Label>
                  <Input
                    value={editConfig.smtp?.from || ''}
                    onChange={(e) => updateEditConfig('smtp.from', e.target.value)}
                    className="bg-muted border-border"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>发件人名称</Label>
                  <Input
                    value={editConfig.smtp?.from_name || ''}
                    onChange={(e) => updateEditConfig('smtp.from_name', e.target.value)}
                    className="bg-muted border-border"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>安全类型</Label>
                  <select
                    value={editConfig.smtp?.security || 'tls'}
                    onChange={(e) => updateEditConfig('smtp.security', e.target.value)}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground"
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
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-500" />
                AI 分析配置
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>启用 AI 分析</Label>
                  <select
                    value={editConfig.ai_analysis?.enabled ? 'true' : 'false'}
                    onChange={(e) => updateEditConfig('ai_analysis.enabled', e.target.value === 'true')}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground"
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
                    className="bg-muted border-border"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Base URL</Label>
                  <Input
                    value={editConfig.ai_analysis?.base_url || ''}
                    onChange={(e) => updateEditConfig('ai_analysis.base_url', e.target.value)}
                    className="bg-muted border-border"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>模型</Label>
                  <Input
                    value={editConfig.ai_analysis?.model || ''}
                    onChange={(e) => updateEditConfig('ai_analysis.model', e.target.value)}
                    className="bg-muted border-border"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>最大 Token 数</Label>
                  <Input
                    type="number"
                    value={editConfig.ai_analysis?.max_tokens || ''}
                    onChange={(e) => updateEditConfig('ai_analysis.max_tokens', parseInt(e.target.value) || 0)}
                    className="bg-muted border-border"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>采样温度 (0-2)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={editConfig.ai_analysis?.temperature || ''}
                    onChange={(e) => updateEditConfig('ai_analysis.temperature', parseFloat(e.target.value) || 0)}
                    className="bg-muted border-border"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>API 超时时间（秒）</Label>
                  <Input
                    type="number"
                    value={editConfig.ai_analysis?.timeout || ''}
                    onChange={(e) => updateEditConfig('ai_analysis.timeout', parseInt(e.target.value) || 0)}
                    className="bg-muted border-border"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>最大工作线程数</Label>
                  <Input
                    type="number"
                    value={editConfig.ai_analysis?.max_workers || ''}
                    onChange={(e) => updateEditConfig('ai_analysis.max_workers', parseInt(e.target.value) || 0)}
                    className="bg-muted border-border"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>最大重试次数</Label>
                  <Input
                    type="number"
                    value={editConfig.ai_analysis?.max_retries || ''}
                    onChange={(e) => updateEditConfig('ai_analysis.max_retries', parseInt(e.target.value) || 0)}
                    className="bg-muted border-border"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>图片最大边长（像素）</Label>
                  <Input
                    type="number"
                    value={editConfig.ai_analysis?.image_max_size || ''}
                    onChange={(e) => updateEditConfig('ai_analysis.image_max_size', parseInt(e.target.value) || 0)}
                    className="bg-muted border-border"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>JPEG 压缩质量 (1-100)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={editConfig.ai_analysis?.image_quality || ''}
                    onChange={(e) => updateEditConfig('ai_analysis.image_quality', parseInt(e.target.value) || 0)}
                    className="bg-muted border-border"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground mt-4">
                <p>配置说明:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>采样温度: 控制AI输出的随机性，0表示确定性输出，2表示最大随机性</li>
                  <li>最大工作线程数: 批量分析时的并发数</li>
                  <li>图片最大边长: 超过此尺寸的图片会被压缩</li>
                  <li>JPEG压缩质量: 数值越高图片质量越好，但文件越大</li>
                </ul>
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
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  极验验证配置
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>启用极验</Label>
                    <select
                      value={editConfig.geetest?.enabled ? 'true' : 'false'}
                      onChange={(e) => updateEditConfig('geetest.enabled', e.target.value === 'true')}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground"
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
                      className="bg-muted border-border"
                      disabled={!canEditSensitiveConfig}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Captcha Key</Label>
                    <Input
                      type={showSensitiveInfo ? 'text' : 'password'}
                      value={editConfig.geetest?.captcha_key || ''}
                      onChange={(e) => updateEditConfig('geetest.captcha_key', e.target.value)}
                      className="bg-muted border-border"
                      disabled={!canEditSensitiveConfig}
                    />
                  </div>
                </div>
              </div>

              {/* Logto SSO Config */}
              <div className="glass rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-indigo-500" />
                  Logto SSO 配置
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>启用 Logto SSO</Label>
                    <select
                      value={editConfig.logto?.enabled ? 'true' : 'false'}
                      onChange={(e) => updateEditConfig('logto.enabled', e.target.value === 'true')}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground"
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
                      className="bg-muted border-border"
                      disabled={!canEditSensitiveConfig}
                      placeholder="https://login.example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>App ID</Label>
                    <Input
                      value={editConfig.logto?.app_id || ''}
                      onChange={(e) => updateEditConfig('logto.app_id', e.target.value)}
                      className="bg-muted border-border"
                      disabled={!canEditSensitiveConfig}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>App Secret</Label>
                    <Input
                      type={showSensitiveInfo ? 'text' : 'password'}
                      value={editConfig.logto?.app_secret || ''}
                      onChange={(e) => updateEditConfig('logto.app_secret', e.target.value)}
                      className="bg-muted border-border"
                      disabled={!canEditSensitiveConfig}
                    />
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                  <p>Logto 控制台配置:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Redirect URI: <code className="bg-muted px-1 rounded">{'{public_url}'}/api/auth/logto/callback</code></li>
                    <li>Post Sign-out Redirect URI: <code className="bg-muted px-1 rounded">{'{frontend_url}'}/login</code></li>
                  </ul>
                </div>
              </div>

              {/* Rate Limit */}
              <div className="glass rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
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
                      className="bg-muted border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>窗口时间（秒）</Label>
                    <Input
                      type="number"
                      value={editConfig.rate_limit_window || ''}
                      onChange={(e) => updateEditConfig('rate_limit_window', parseInt(e.target.value) || 0)}
                      className="bg-muted border-border"
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
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <FileUp className="w-5 h-5 text-pink-500" />
                文件上传配置
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>最大上传大小</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={(() => {
                        const bytes = editConfig.max_upload_size || 0;
                        if (bytes >= 1024 * 1024 * 1024) return Math.round(bytes / (1024 * 1024 * 1024));
                        if (bytes >= 1024 * 1024) return Math.round(bytes / (1024 * 1024));
                        if (bytes >= 1024) return Math.round(bytes / 1024);
                        return bytes;
                      })()}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        const bytes = editConfig.max_upload_size || 0;
                        let unit = 1;
                        if (bytes >= 1024 * 1024 * 1024) unit = 1024 * 1024 * 1024;
                        else if (bytes >= 1024 * 1024) unit = 1024 * 1024;
                        else if (bytes >= 1024) unit = 1024;
                        updateEditConfig('max_upload_size', val * unit);
                      }}
                      className="bg-muted border-border flex-1"
                    />
                    <select
                      value={(() => {
                        const bytes = editConfig.max_upload_size || 0;
                        if (bytes >= 1024 * 1024 * 1024) return 'GB';
                        if (bytes >= 1024 * 1024) return 'MB';
                        if (bytes >= 1024) return 'KB';
                        return 'B';
                      })()}
                      onChange={(e) => {
                        const unit = e.target.value;
                        const bytes = editConfig.max_upload_size || 0;
                        let newBytes = bytes;
                        if (unit === 'GB') newBytes = Math.round(bytes / (1024 * 1024 * 1024)) * 1024 * 1024 * 1024;
                        else if (unit === 'MB') newBytes = Math.round(bytes / (1024 * 1024)) * 1024 * 1024;
                        else if (unit === 'KB') newBytes = Math.round(bytes / 1024) * 1024;
                        else newBytes = bytes;
                        updateEditConfig('max_upload_size', newBytes);
                      }}
                      className="bg-muted border border-border rounded-lg px-3 py-2 text-foreground w-20"
                    >
                      <option value="B">B</option>
                      <option value="KB">KB</option>
                      <option value="MB">MB</option>
                      <option value="GB">GB</option>
                    </select>
                  </div>
                  <p className="text-xs text-muted-foreground">实际存储: {formatBytes(editConfig.max_upload_size || 0)}</p>
                </div>
                <div className="space-y-2">
                  <Label>上传目录</Label>
                  <Input
                    value={editConfig.upload_folder || ''}
                    onChange={(e) => updateEditConfig('upload_folder', e.target.value)}
                    className="bg-muted border-border"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>允许的文件扩展名</Label>
                  <Input
                    value={editConfig.allowed_extensions?.join(', ') || ''}
                    onChange={(e) => updateEditConfig('allowed_extensions', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    className="bg-muted border-border"
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
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-500" />
                数据库自动备份配置
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>启用自动备份</Label>
                  <select
                    value={editConfig.database_backup?.enabled ? 'true' : 'false'}
                    onChange={(e) => updateEditConfig('database_backup.enabled', e.target.value === 'true')}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground"
                    disabled={!canEditSensitiveConfig}
                  >
                    <option value="true">启用</option>
                    <option value="false">禁用</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Cron 表达式</Label>
                  <CronEditor
                    value={editConfig.database_backup?.cron || ''}
                    onChange={(value) => updateEditConfig('database_backup.cron', value)}
                    disabled={!canEditSensitiveConfig}
                    onValidateCron={validateDatabaseBackupCron}
                  />
                </div>
                <div className="space-y-2">
                  <Label>备份目录</Label>
                  <Input
                    value={editConfig.database_backup?.backup_dir || ''}
                    onChange={(e) => updateEditConfig('database_backup.backup_dir', e.target.value)}
                    className="bg-muted border-border"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>最大备份数</Label>
                  <Input
                    type="number"
                    value={editConfig.database_backup?.max_backups || ''}
                    onChange={(e) => updateEditConfig('database_backup.max_backups', parseInt(e.target.value) || 0)}
                    className="bg-muted border-border"
                    disabled={!canEditSensitiveConfig}
                  />
                </div>
                <div className="space-y-2">
                  <Label>保留天数</Label>
                  <Input
                    type="number"
                    value={editConfig.database_backup?.retention_days || ''}
                    onChange={(e) => updateEditConfig('database_backup.retention_days', parseInt(e.target.value) || 0)}
                    className="bg-muted border-border"
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
                  <h3 className="font-semibold text-foreground">系统信息</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">平台</span>
                    <span className="text-foreground">{systemInfo.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Python版本</span>
                    <span className="text-foreground">{systemInfo.python_version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">运行时间</span>
                    <span className="text-foreground">{formatUptime(systemInfo.uptime)}</span>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <h3 className="font-semibold text-foreground">CPU使用率</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">使用率</span>
                    <span className="text-foreground">{systemInfo.cpu_percent}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 transition-all" style={{ width: `${systemInfo.cpu_percent}%` }} />
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold text-foreground">内存使用</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">使用率</span>
                    <span className="text-foreground">{systemInfo.memory.percent}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
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
                  <h3 className="font-semibold text-foreground">磁盘使用</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">使用率</span>
                    <span className="text-foreground">{systemInfo.disk.percent}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
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
          className="bg-muted border-border"
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
            <DialogDescription className="text-muted-foreground">
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
