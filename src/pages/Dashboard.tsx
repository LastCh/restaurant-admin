import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, Table, Button, Space, Modal, message } from 'antd';
import { 
  ShoppingCartOutlined, 
  DollarOutlined, 
  CalendarOutlined,
  UserOutlined,
  WarningOutlined,
  LockOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { statisticsAPI, type DashboardStats } from '../api/statistics';
import { Select } from 'antd';
import { reservationsAPI, type Reservation } from '../api/reservations';
import { useAuthStore } from '../store/authStore';
import StatusBadge from '../components/common/StatusBadge';
import dayjs from 'dayjs';
import type { TableColumnsType } from 'antd';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [rangeRevenue, setRangeRevenue] = useState<number | null>(null);
  const [rangeLabel, setRangeLabel] = useState<string>('today');
  const [todayReservations, setTodayReservations] = useState<Reservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.role === 'ADMIN' || user?.role === 'MANAGER') {
      fetchStats();
      fetchTodayReservations();
      fetchRangeRevenue('today');
    } else {
      setLoading(false);
      setStats(null);
    }
  }, [user?.role]);

  const fetchRangeRevenue = async (period: 'today' | 'month' | 'year' | 'custom', from?: string, to?: string) => {
    try {
      let fromDate: string;
      let toDate: string;
      if (period === 'today') {
        fromDate = dayjs().format('YYYY-MM-DD');
        toDate = fromDate;
      } else if (period === 'month') {
        fromDate = dayjs().startOf('month').format('YYYY-MM-DD');
        toDate = dayjs().endOf('month').format('YYYY-MM-DD');
      } else if (period === 'year') {
        fromDate = dayjs().startOf('year').format('YYYY-MM-DD');
        toDate = dayjs().endOf('year').format('YYYY-MM-DD');
      } else if (period === 'custom' && from && to) {
        fromDate = from;
        toDate = to;
      } else {
        return;
      }

      const data = await statisticsAPI.getSales(fromDate, toDate);
      setRangeRevenue(Number(data.totalRevenue || 0));
      setRangeLabel(period);
    } catch (err) {
      console.error('Failed to load range revenue:', err);
    }
  };

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

  const fetchTodayReservations = async () => {
    try {
      setLoadingReservations(true);
      const today = dayjs().startOf('day');
      const tomorrow = dayjs().endOf('day');
      
      const response = await reservationsAPI.getAll(0, 100);
      const allReservations = response.content || [];
      
      // Фильтруем бронирования на сегодня
      const todayRes = allReservations.filter((res) => {
        const resTime = dayjs(res.reservationTime);
        return resTime.isAfter(today) && resTime.isBefore(tomorrow) && res.status === 'ACTIVE';
      });
      
      setTodayReservations(todayRes);
    } catch (err) {
      console.error('Failed to load today reservations:', err);
      message.error('Ошибка при загрузке бронирований');
    } finally {
      setLoadingReservations(false);
    }
  };

  const handleEditReservation = (reservation: Reservation) => {
    setEditingReservation(reservation);
    // Можно открыть модальное окно для редактирования или перейти на страницу бронирований
    window.location.href = '/reservations';
  };

  const handleDeleteReservation = async (id: number) => {
    Modal.confirm({
      title: 'Отменить бронирование?',
      okText: 'Отменить',
      cancelText: 'Нет',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await reservationsAPI.cancel(id);
          message.success('Бронирование отменено');
          fetchTodayReservations();
          fetchStats();
        } catch (error) {
          message.error('Ошибка при отмене бронирования');
        }
      },
    });
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Statistic
                      title={rangeLabel === 'today' ? 'Выручка сегодня' : rangeLabel === 'month' ? 'Выручка (месяц)' : rangeLabel === 'year' ? 'Выручка (год)' : 'Выручка'}
                      value={rangeRevenue ?? Number(stats.todayRevenue)}
                      suffix="₽"
                      prefix={<DollarOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                      precision={2}
                    />
                    <Select
                      defaultValue="today"
                      style={{ width: 140, marginLeft: 12 }}
                      onChange={(val) => {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        fetchRangeRevenue(val);
                      }}
                      options={[
                        { value: 'today', label: 'Сегодня' },
                        { value: 'month', label: 'Месяц' },
                        { value: 'year', label: 'Год' },
                      ]}
                    />
                  </div>
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

          {/* Бронирования на сегодня */}
          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={24}>
              <Card title="Бронирования на сегодня" extra={<span style={{ color: '#999' }}>{todayReservations.length} шт.</span>}>
                <Spin spinning={loadingReservations}>
                  <Table<Reservation>
                    dataSource={todayReservations}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    columns={[
                      {
                        title: 'Время',
                        dataIndex: 'reservationTime',
                        key: 'reservationTime',
                        render: (time: string) => dayjs(time).format('HH:mm'),
                        width: 80,
                      },
                      {
                        title: 'Клиент',
                        dataIndex: 'clientName',
                        key: 'clientName',
                      },
                      {
                        title: 'Телефон',
                        dataIndex: 'clientPhone',
                        key: 'clientPhone',
                      },
                      {
                        title: 'Столик',
                        dataIndex: 'tableId',
                        key: 'tableId',
                        width: 80,
                      },
                      {
                        title: 'Гостей',
                        dataIndex: 'partySize',
                        key: 'partySize',
                        width: 80,
                      },
                      {
                        title: 'Статус',
                        dataIndex: 'status',
                        key: 'status',
                        render: (status: string) => <StatusBadge status={status} type="reservation" />,
                        width: 120,
                      },
                      {
                        title: 'Действия',
                        key: 'actions',
                        width: 150,
                        render: (_, record) => (
                          <Space size="small">
                            <Button
                              type="link"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => handleEditReservation(record)}
                            >
                              Изменить
                            </Button>
                            <Button
                              type="link"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => handleDeleteReservation(record.id)}
                            >
                              Отменить
                            </Button>
                          </Space>
                        ),
                      },
                    ]}
                    locale={{ emptyText: 'Нет бронирований на сегодня' }}
                  />
                </Spin>
              </Card>
            </Col>
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
