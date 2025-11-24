import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, Button, message, Select, Modal } from 'antd';
import { ShoppingCartOutlined, DollarOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons';
import { reservationsAPI, type Reservation } from '../api/reservations';
import { statisticsAPI, type DashboardStats } from '../api/statistics';
import { useAuthStore } from '../store/authStore';
import StatusBadge from '../components/common/StatusBadge';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(utc);
dayjs.extend(isBetween);

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [todayReservations, setTodayReservations] = useState<Reservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [rangeRevenue, setRangeRevenue] = useState<number>(0);
  const [rangeLabel, setRangeLabel] = useState<'today' | 'month' | 'year'>('today');

  useEffect(() => {
    if (!user) return;

    if (user.role === 'ADMIN' || user.role === 'MANAGER') {
      fetchStats();
      fetchReservations('today');
      fetchRevenue('today');
    } else {
      setLoadingStats(false);
    }
  }, [user?.role]);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const data = await statisticsAPI.getDashboard();
      setStats(data);
    } catch (err) {
      console.error(err);
      message.error('Ошибка при загрузке статистики');
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchReservations = async (period: 'today' | 'month' | 'year') => {
    try {
      setLoadingReservations(true);
      const response = await reservationsAPI.getAll(0, 100); // можно потом сделать постранично
      const allReservations = response.content || [];

      const start =
        period === 'today'
          ? dayjs().startOf('day')
          : period === 'month'
          ? dayjs().startOf('month')
          : dayjs().startOf('year');

      const end =
        period === 'today'
          ? dayjs().endOf('day')
          : period === 'month'
          ? dayjs().endOf('month')
          : dayjs().endOf('year');

      const filtered = allReservations.filter((r: { reservationTime: string | number | Date | dayjs.Dayjs | null | undefined; status: string; }) => {
        const resTime = dayjs.utc(r.reservationTime).local();
        return resTime.isBetween(start, end, null, '[]') && r.status === 'ACTIVE';
      });

      if (period === 'today') setTodayReservations(filtered);
    } catch (err) {
      console.error(err);
      message.error('Ошибка при загрузке бронирований');
    } finally {
      setLoadingReservations(false);
    }
  };

  const fetchRevenue = async (period: 'today' | 'month' | 'year') => {
    try {
      let from: string;
      let to: string;

      if (period === 'month') {
        from = dayjs().startOf('month').format('YYYY-MM-DD');
        to = dayjs().endOf('month').format('YYYY-MM-DD');
        const data = await statisticsAPI.getSales(from, to);
        setRangeRevenue(Number(data.totalRevenue || 0));
      } else {
        from = dayjs().startOf('year').format('YYYY-MM-DD');
        to = dayjs().endOf('year').format('YYYY-MM-DD');
        const data = await statisticsAPI.getSales(from, to);
        setRangeRevenue(Number(data.totalRevenue || 0));
        
      }

      if (period === 'today') {
        const data = await statisticsAPI.getDashboard();
        const todayRevenue = data.todayRevenue;
        setRangeRevenue(Number(todayRevenue|| 0));
      }
      setRangeLabel(period);
      
    } catch (err) {
      console.error(err);
      message.error('Ошибка при загрузке выручки');
    }
  };



  const handleCancelReservation = async (id: number) => {
    Modal.confirm({
      title: 'Отменить бронирование?',
      okText: 'Отменить',
      cancelText: 'Отмена',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await reservationsAPI.cancel(id);
          message.success('Бронирование отменено');
          fetchReservations('today');
          fetchStats();
        } catch (err) {
          console.error(err);
          message.error('Ошибка при отмене бронирования');
        }
      },
    });
  };

  if (loadingStats) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Добро пожаловать, {user?.username}!</h1>
      <p style={{ color: '#999' }}>Роль: {user?.role}</p>

      {/* Статистика */}
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic title="Заказов сегодня" value={stats.todayOrders} prefix={<ShoppingCartOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Statistic
                  title={rangeLabel === 'today' ? 'Выручка сегодня' : rangeLabel === 'month' ? 'Выручка месяц' : 'Выручка год'}
                  value={rangeRevenue}
                  prefix={<DollarOutlined />}
                  suffix="₽"
                />
                <Select
                  value={rangeLabel}
                  style={{ width: 120 }}
                  onChange={(val) => {
                    setRangeLabel(val);
                    fetchRevenue(val);
                    fetchReservations(val);
                  }}
                  options={[
                    { label: 'Сегодня', value: 'today' },
                    { label: 'Месяц', value: 'month' },
                    { label: 'Год', value: 'year' },
                  ]}
                />

              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic title="Активные бронирования" value={stats.activeReservations} prefix={<CalendarOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic title="Всего клиентов" value={stats.totalClients} prefix={<UserOutlined />} />
            </Card>
          </Col>
        </Row>
      )}

      {/* Бронирования на сегодня */}
      <h2 style={{ marginBottom: 16 }}>Бронирования на сегодня</h2>
      <Spin spinning={loadingReservations}>
        {todayReservations.length === 0 ? (
          <p>Нет бронирований на сегодня</p>
        ) : (
          <Row gutter={[16, 16]}>
            {todayReservations.map((r) => (
              <Col xs={24} sm={12} md={8} lg={6} key={r.id}>
                <Card hoverable>
                  <p>
                    <strong>Время:</strong> {dayjs.utc(r.reservationTime).local().format('HH:mm')}
                  </p>
                  <p>
                    <strong>Клиент:</strong> {r.clientName || 'Не указан'}
                  </p>
                  <p>
                    <strong>Телефон:</strong> {r.clientPhone || '-'}
                  </p>
                  <p>
                    <strong>Стол:</strong> {r.tableId ?? '-'}
                  </p>
                  <p>
                    <strong>Гостей:</strong> {r.partySize}
                  </p>
                  <p>
                    <strong>Статус:</strong> <StatusBadge status={r.status} type="reservation" />
                  </p>
                  <Button
                    type="primary"
                    block
                    style={{ marginTop: 8, marginBottom: 4 }}
                    onClick={() => (window.location.href = 'http://localhost:5173/reservations')}
                  >
                    Перейти к бронированиям
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Spin>
    </div>
  );
}
