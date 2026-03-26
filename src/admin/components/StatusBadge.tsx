import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  type LucideIcon 
} from 'lucide-react';

// 申诉状态徽章
interface AppealStatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | string;
  className?: string;
}

export function AppealStatusBadge({ status, className }: AppealStatusBadgeProps) {
  const config = {
    pending: {
      icon: Clock,
      label: '待审核',
      className: 'border-yellow-500/50 text-yellow-500',
    },
    approved: {
      icon: CheckCircle,
      label: '已通过',
      className: 'border-green-500/50 text-green-500',
    },
    rejected: {
      icon: XCircle,
      label: '已拒绝',
      className: 'border-red-500/50 text-red-500',
    },
  };

  const { icon: Icon, label, className: badgeClassName } = config[status as keyof typeof config] || {
    icon: AlertCircle,
    label: status,
    className: 'border-gray-500/50 text-gray-500',
  };

  return (
    <Badge variant="outline" className={cn(badgeClassName, className)}>
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </Badge>
  );
}

// Level4 待确认状态徽章
interface Level4StatusBadgeProps {
  status: 'pending' | 'confirmed' | 'cancelled' | string;
  className?: string;
}

export function Level4StatusBadge({ status, className }: Level4StatusBadgeProps) {
  const config = {
    pending: {
      icon: Clock,
      label: '待确认',
      className: 'border-yellow-500/50 text-yellow-500',
    },
    confirmed: {
      icon: CheckCircle,
      label: '已确认',
      className: 'border-green-500/50 text-green-500',
    },
    cancelled: {
      icon: XCircle,
      label: '已取消',
      className: 'border-red-500/50 text-red-500',
    },
  };

  const { icon: Icon, label, className: badgeClassName } = config[status as keyof typeof config] || {
    icon: AlertCircle,
    label: status,
    className: 'border-gray-500/50 text-gray-500',
  };

  return (
    <Badge variant="outline" className={cn(badgeClassName, className)}>
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </Badge>
  );
}

// 通用状态徽章配置
interface StatusConfig {
  icon: LucideIcon;
  label: string;
  className: string;
}

type StatusMap = Record<string, StatusConfig>;

interface GenericStatusBadgeProps {
  status: string;
  statusMap: StatusMap;
  defaultLabel?: string;
  className?: string;
}

export function GenericStatusBadge({ 
  status, 
  statusMap, 
  defaultLabel = status,
  className 
}: GenericStatusBadgeProps) {
  const config = statusMap[status] || {
    icon: AlertCircle,
    label: defaultLabel,
    className: 'border-gray-500/50 text-gray-500',
  };

  const { icon: Icon, label, className: badgeClassName } = config;

  return (
    <Badge variant="outline" className={cn(badgeClassName, className)}>
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </Badge>
  );
}

// 操作结果状态徽章
interface OperationStatusBadgeProps {
  status: 'success' | 'failure' | boolean;
  className?: string;
}

export function OperationStatusBadge({ status, className }: OperationStatusBadgeProps) {
  const isSuccess = typeof status === 'boolean' ? status : status === 'success';
  
  return isSuccess ? (
    <Badge className={cn('bg-green-500/20 text-green-500 border-green-500/50', className)}>
      成功
    </Badge>
  ) : (
    <Badge className={cn('bg-red-500/20 text-red-500 border-red-500/50', className)}>
      失败
    </Badge>
  );
}

// 用户类型徽章
interface UserTypeBadgeProps {
  type: 'user' | 'group' | string;
  className?: string;
}

export function UserTypeBadge({ type, className }: UserTypeBadgeProps) {
  const config = {
    user: {
      label: '用户',
      className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    group: {
      label: '群聊',
      className: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    },
  };

  const { label, className: badgeClassName } = config[type as keyof typeof config] || {
    label: type,
    className: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  return (
    <span className={cn(
      'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border shrink-0',
      badgeClassName,
      className
    )}>
      {label}
    </span>
  );
}

// 管理员等级徽章
interface AdminLevelBadgeProps {
  level: number;
  className?: string;
}

export function AdminLevelBadge({ level, className }: AdminLevelBadgeProps) {
  const config: Record<number, { label: string; className: string }> = {
    4: { label: '超级管理员', className: 'bg-purple-500' },
    3: { label: '普通管理员', className: 'bg-blue-500' },
    2: { label: '申诉审核员', className: 'bg-yellow-500' },
    1: { label: 'Bot持有者', className: 'bg-gray-500' },
  };

  const { label, className: badgeClassName } = config[level] || {
    label: '未知',
    className: 'bg-gray-500',
  };

  return (
    <Badge className={cn(badgeClassName, className)}>{label}</Badge>
  );
}

// 违规等级徽章
interface ViolationLevelBadgeProps {
  level: number;
  className?: string;
}

export function ViolationLevelBadge({ level, className }: ViolationLevelBadgeProps) {
  const getClassName = () => {
    switch (level) {
      case 4: return 'bg-red-500';
      case 3: return 'bg-orange-500';
      case 2: return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <Badge className={cn(getClassName(), className)}>
      等级 {level || 1}
    </Badge>
  );
}

// 操作者类型徽章
interface OperatorTypeBadgeProps {
  type: 'admin' | 'bot' | string;
  level?: number;
  className?: string;
}

export function OperatorTypeBadge({ type, level, className }: OperatorTypeBadgeProps) {
  if (type === 'admin') {
    return (
      <Badge 
        variant="secondary" 
        className={cn(
          'bg-muted text-muted-foreground border-border text-xs',
          level !== undefined && 'bg-muted text-muted-foreground border-border'
        )}
      >
        {level !== undefined ? `L${level}` : '管理员'}
      </Badge>
    );
  }

  if (type === 'bot') {
    return (
      <Badge 
        variant="secondary" 
        className={cn('bg-purple-900/30 text-purple-400 border-purple-700/50 text-xs', className)}
      >
        Bot
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={cn('text-xs', className)}>
      {type}
    </Badge>
  );
}

// AI 建议徽章
interface AIRecommendationBadgeProps {
  recommendation: string;
  className?: string;
}

export function AIRecommendationBadge({ recommendation, className }: AIRecommendationBadgeProps) {
  const getClassName = () => {
    if (recommendation.includes('通过')) {
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
    if (recommendation.includes('拒绝')) {
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  };

  return (
    <Badge className={cn(getClassName(), className)}>
      {recommendation}
    </Badge>
  );
}

// 备份类型徽章
interface BackupTypeBadgeProps {
  isAuto: boolean;
  className?: string;
}

export function BackupTypeBadge({ isAuto, className }: BackupTypeBadgeProps) {
  return isAuto ? (
    <Badge className={cn('bg-blue-500/20 text-blue-400', className)}>自动</Badge>
  ) : (
    <Badge className={cn('bg-green-500/20 text-green-400', className)}>手动</Badge>
  );
}
