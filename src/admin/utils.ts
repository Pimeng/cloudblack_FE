// Admin Dashboard Utilities

export const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}天${hours}小时${minutes}分钟`;
};

export const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'pending':
      return 'border-yellow-500/50 text-yellow-500';
    case 'approved':
      return 'border-green-500/50 text-green-500';
    case 'rejected':
      return 'border-red-500/50 text-red-500';
    default:
      return '';
  }
};

export const getLevelBadgeClass = (level: number) => {
  switch (level) {
    case 4:
      return 'bg-purple-500';
    case 3:
      return 'bg-blue-500';
    case 2:
      return 'bg-yellow-500';
    case 1:
      return 'bg-gray-500';
    default:
      return '';
  }
};

export const getLevelBadgeText = (level: number) => {
  switch (level) {
    case 4:
      return '超级管理员';
    case 3:
      return '普通管理员';
    case 2:
      return '申诉审核员';
    case 1:
      return 'Bot持有者';
    default:
      return '未知';
  }
};
