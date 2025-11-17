import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Statistic, Spin, Alert } from 'antd';
import { 
  ShoppingCartOutlined, 
  DollarOutlined, 
  CalendarOutlined,
  UserOutlined,
  WarningOutlined,
  LogoutOutlined 
} from '@ant-design/icons';
import { statisticsAPI, type DashboardStats } from '../api/statistics';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '../api/auth';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await statisticsAPI.getDashboard();
      setStats(data);
      setError(null);
    } catch (err) {
      setError('Ошибка при загрузке статистики');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authAPI.logout();
    logout();
    navigate('/login');
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
      {/* Заголовок с выходом */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1>Добро пожаловать, {user?.username}! 👋</h1>
          <p style={{ color: '#999' }}>Панель управления рестораном</p>
        </div>
      </div>

      {/* Ошибка */}
      {error && (
        <Alert 
          type="error" 
          message={error}
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Статистика */}
      {stats && (
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

          {/* Предупреждения */}
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

    </div>
  );
}
