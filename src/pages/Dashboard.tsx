import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import { 
  ShoppingCartOutlined, 
  DollarOutlined, 
  CalendarOutlined,
  UserOutlined,
  WarningOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { statisticsAPI, type DashboardStats } from '../api/statistics';
import { useAuthStore } from '../store/authStore';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.role === 'ADMIN' || user?.role === 'MANAGER') {
      fetchStats();
    } else {
      setLoading(false);
      setStats(null);
    }
  }, [user?.role]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await statisticsAPI.getDashboard();
      setStats(data);
    } catch (err) {
      console.error('Failed to load statistics:', err);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      ADMIN: 'Администратор',
      MANAGER: 'Менеджер',
      WAITER: 'Официант',
    };
    return labels[role as keyof typeof labels] || role;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" fullscreen />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1>Добро пожаловать, {user?.username}!</h1>
        <p style={{ color: '#999' }}>Роль: {getRoleLabel(user?.role || '')}</p>
      </div>

      {/* Статистика для ADMIN и MANAGER */}
      {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && stats && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable>
                <Statistic
                  title="Заказов сегодня"
                  value={stats.todayOrders}
                  prefix={<ShoppingCartOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable>
                <Statistic
                  title="Выручка сегодня"
                  value={stats.todayRevenue}
                  suffix="₽"
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                  precision={2}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable>
                <Statistic
                  title="Активные бронирования"
                  value={stats.activeReservations}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable>
                <Statistic
                  title="Всего клиентов"
                  value={stats.totalClients}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {stats.lowStockItems > 0 && (
              <Col xs={24} sm={12}>
                <Card style={{ borderLeft: '4px solid #ff4d4f' }}>
                  <Statistic
                    title="Низкие запасы"
                    value={stats.lowStockItems}
                    prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
            )}
            {stats.pendingOrders > 0 && (
              <Col xs={24} sm={12}>
                <Card style={{ borderLeft: '4px solid #ff7a45' }}>
                  <Statistic
                    title="Ожидающих заказов"
                    value={stats.pendingOrders}
                    prefix={<ShoppingCartOutlined style={{ color: '#ff7a45' }} />}
                    valueStyle={{ color: '#ff7a45' }}
                  />
                </Card>
              </Col>
            )}
          </Row>
        </>
      )}

      {/* Для WAITER — одно сообщение с инструкцией */}
      {user?.role === 'WAITER' && (
        <Card>
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <h3 style={{ margin: '0 0 12px 0' }}>Ваши возможности:</h3>
              <p style={{ margin: '0 0 8px 0', color: '#262626' }}>
                ✓ Просмотр и управление заказами
              </p>
              <p style={{ margin: 0, color: '#8c8c8c', fontSize: 12 }}>
                Перейдите в раздел <strong>"Заказы"</strong> в левом меню для работы с заказами клиентов.
              </p>
            </Col>
            <Col>
              <LockOutlined style={{ fontSize: 32, color: '#bfbfbf' }} />
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
}
