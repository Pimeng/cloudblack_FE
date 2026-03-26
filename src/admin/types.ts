// Admin Dashboard Types

export const API_BASE = import.meta.env.VITE_API_BASE || 'https://cloudblack-api.07210700.xyz';

export type Tab = 'dashboard' | 'appeals' | 'blacklist' | 'admins' | 'bots' | 'logs' | 'settings' | 'backup' | 'images';

export interface Stats {
  pending_appeals: number;
  total_appeals: number;
  blacklist_count: number;
}

export interface Appeal {
  appeal_id: string;
  user_id: string;
  user_type: 'user' | 'group';
  content: string;
  contact_email: string;
  images: string[];
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at?: string;
  review?: {
    action: string;
    reason: string;
    admin_id: string;
    admin_name: string;
    reviewed_at: string;
  };
  ai_analysis?: AIAnalysisResult;
}

export interface BlacklistItem {
  user_id: string;
  user_type: 'user' | 'group';
  reason: string;
  level?: number;
  added_by?: string;
  added_at: string;
  updated_at?: string;
}

// Level 4 待确认记录
export interface Level4PendingItem {
  id: number;
  user_id: string;
  user_type: 'user' | 'group';
  reason: string;
  first_admin_id: string;
  first_admin_name: string;
  first_confirmed_at: string;
  second_admin_id?: string;
  second_admin_name?: string;
  second_confirmed_at?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
  cancelled_by?: string;
  cancel_reason?: string;
}

export interface Admin {
  admin_id: string;
  name: string;
  level: number;
  created_at: string;
  avatar?: string;
  force_sso?: boolean;
}

export interface BotToken {
  bot_name: string;
  owner: string;
  description: string;
  created_at: string;
  token?: string;
}

export interface SMTPConfig {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  from?: string;
  from_name?: string;
  security?: string;
}

export interface GeetestConfig {
  enabled?: boolean;
  captcha_id?: string;
  captcha_key?: string;
}

export interface AIAnalysisConfig {
  enabled?: boolean;
  api_key?: string;
  base_url?: string;
  model?: string;
  max_tokens?: number;
  temperature?: number;
  timeout?: number;
  cache_file?: string;
  public_url?: string;
}

export interface DatabaseBackupConfig {
  enabled?: boolean;
  cron?: string;
  backup_dir?: string;
  max_backups?: number;
  retention_days?: number;
}

export interface CORSConfig {
  enabled: boolean;
  allowed_origins: string[];
  allowed_methods: string[];
  allowed_headers: string[];
  supports_credentials: boolean;
}

export interface RateLimitConfig {
  rate_limit_max_requests: number;
  rate_limit_window: number;
  ip_limit_max_attempts: number;
  ip_limit_window: number;
}

export interface UploadConfig {
  max_upload_size: number;
  allowed_extensions: string[];
  upload_folder: string;
}

export interface HotlinkProtectionConfig {
  enabled: boolean;
  allowed_empty_referer: boolean;
  protected_paths: string[];
}

export interface AuditLogConfig {
  audit_log_file: string;
  audit_log_max_size: number;
  audit_log_retention_days: number;
}

export interface AIAnalysisResult {
  status: string;
  recommendation?: string;
  result?: {
    summary: string;
    reason_analysis: string;
    recommendation: string;
    confidence: number;
    suggestions: string;
    risk_factors: string[];
  };
  error?: string;
  updated_at?: string;
}

export interface BackupStatus {
  enabled: boolean;
  cron: string;
  cron_available: boolean;
  running: boolean;
  backup_dir: string;
  max_backups: number;
  retention_days: number;
  next_backup: string;
  db_file: string;
  backup_count: number;
}

export interface BackupItem {
  filename: string;
  path: string;
  created_at: number;
  created_at_str: string;
  size: number;
  size_human: string;
  remark: string;
  is_auto: boolean;
}

export interface BackupConfig {
  enabled: boolean;
  cron: string;
  backup_dir: string;
  max_backups: number;
  retention_days: number;
}

export interface SystemConfig {
  host: string;
  port: number;
  debug: boolean;
  temp_token_ttl: number;
  timezone: string;
  log_level: string;
  ip_header: string;
  root_redirect_url: string;
  public_url?: string;
  frontend_url?: string;
  secret_key?: string;
  smtp?: SMTPConfig;
  geetest?: GeetestConfig;
  ai_analysis?: AIAnalysisConfig;
  database_backup?: DatabaseBackupConfig;
  cors?: CORSConfig;
  rate_limit?: RateLimitConfig;
  upload?: UploadConfig;
  hotlink_protection?: HotlinkProtectionConfig;
  audit_log?: AuditLogConfig;
  logto?: LogtoConfig;
  [key: string]: any;
}

export interface SystemInfo {
  platform: string;
  python_version: string;
  cpu_percent: number;
  memory: {
    total: number;
    available: number;
    percent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percent: number;
  };
  uptime: number;
}

// Logto SSO Types
export interface AuthMethods {
  methods: string[];
  logto?: {
    enabled: boolean;
    login_url: string;
  };
}

export interface LogtoStatus {
  enabled: boolean;
  bound: boolean;
  logto_id?: string;
  logto_email?: string;
}

export interface LogtoBindUrl {
  url: string;
  expires_in: number;
}

export interface LogtoBindResult {
  logto_id: string;
  logto_email?: string;
}

export interface LogtoLoginResult {
  admin_id: string;
  name: string;
  level: number;
  temp_token: string;
  expires_in: number;
}

export interface LogtoConfig {
  enabled?: boolean;
  endpoint?: string;
  app_id?: string;
  app_secret?: string;
}
