import { Tag } from 'antd';

interface StatusBadgeProps {
  status: string;
  type?: 'order' | 'reservation' | 'supply';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'order' }) => {
  const getStatusColor = (s: string, t: string): string => {
    if (t === 'order') {
      const colors: Record<string, string> = {
        PENDING: 'orange',
        IN_PROGRESS: 'blue',
        COMPLETED: 'green',
        CANCELLED: 'red',
      };
      return colors[s] || 'default';
    }

    if (t === 'reservation') {
      const colors: Record<string, string> = {
        ACTIVE: 'green',
        CANCELLED: 'red',
        EXPIRED: 'orange',
      };
      return colors[s] || 'default';
    }

    if (t === 'supply') {
      const colors: Record<string, string> = {
        PENDING: 'orange',
        CONFIRMED: 'green',
        CANCELLED: 'red',
      };
      return colors[s] || 'default';
    }

    return 'default';
  };

  const getStatusLabel = (s: string, t: string): string => {
    if (t === 'order') {
      const labels: Record<string, string> = {
        PENDING: 'В ожидании',
        IN_PROGRESS: 'Готовится',
        COMPLETED: 'Завершён',
        CANCELLED: 'Отменён',
      };
      return labels[s] || s;
    }

    if (t === 'reservation') {
      const labels: Record<string, string> = {
        ACTIVE: 'Активна',
        CANCELLED: 'Отменена',
        EXPIRED: 'Истекла',
      };
      return labels[s] || s;
    }

    if (t === 'supply') {
      const labels: Record<string, string> = {
        PENDING: 'Ожидание',
        CONFIRMED: 'Подтверждена',
        CANCELLED: 'Отменена',
      };
      return labels[s] || s;
    }

    return s;
  };

  return <Tag color={getStatusColor(status, type)}>{getStatusLabel(status, type)}</Tag>;
};

export default StatusBadge;
