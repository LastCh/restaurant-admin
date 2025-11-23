import { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, DatePicker, InputNumber, message, Spin } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { reservationsAPI, type Reservation } from '../api/reservations';
import { clientsAPI, type ClientDTO } from '../api/clients';
import { tablesAPI, type TableDTO } from '../api/tables';
import { useAuthStore } from '../store/authStore';
import dayjs from 'dayjs';
import StatusBadge from '../components/common/StatusBadge';

export default function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRes, setEditingRes] = useState<Reservation | null>(null);
  const [form] = Form.useForm();
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [tables, setTables] = useState<TableDTO[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' }>({
    field: 'reservationTime',
    direction: 'asc',
  });
  const { user } = useAuthStore();

  useEffect(() => {
    fetchReservations();
    fetchClients();
    fetchTables();
  }, []);

  const fetchReservations = async (page = 0, size = 10, sortBy = 'reservationTime', direction: 'asc' | 'desc' = 'asc') => {
    try {
      setLoading(true);
      const response = await reservationsAPI.getAll(page, size);
      setReservations(response.content || []);
      setPagination({
        current: page + 1,
        pageSize: size,
        total: response.totalElements || 0,
      });
    } catch (error) {
      message.error('Ошибка при загрузке бронирований');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const response = await clientsAPI.getAll(0, 1000);
      setClients(response.content || []);
    } catch (error) {
      console.error('Ошибка при загрузке клиентов:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchTables = async () => {
    try {
      setLoadingTables(true);
      // Пробуем сначала получить доступные столы, если эндпоинт есть
      try {
        const availableTables = await tablesAPI.getAvailable();
        setTables(availableTables || []);
      } catch (err1) {
        // Если эндпоинт не работает, получаем все столы
        try {
          const response = await tablesAPI.getAll(0, 1000);
          setTables(response.content || []);
        } catch (err2) {
          // Если API не существует, создаем заглушку с несколькими столами
          console.warn('API столов не доступен, используем заглушку');
          setTables([
            { id: 1, tableNumber: '1', capacity: 2, isAvailable: true, location: 'Зал', createdAt: '', updatedAt: '' },
            { id: 2, tableNumber: '2', capacity: 4, isAvailable: true, location: 'Зал', createdAt: '', updatedAt: '' },
            { id: 3, tableNumber: '3', capacity: 4, isAvailable: true, location: 'Зал', createdAt: '', updatedAt: '' },
            { id: 4, tableNumber: '4', capacity: 6, isAvailable: true, location: 'VIP', createdAt: '', updatedAt: '' },
            { id: 5, tableNumber: '5', capacity: 2, isAvailable: true, location: 'Терраса', createdAt: '', updatedAt: '' },
          ]);
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке столов:', error);
      // Не показываем ошибку пользователю, просто используем заглушку
      setTables([
        { id: 1, tableNumber: '1', capacity: 2, isAvailable: true, location: 'Зал', createdAt: '', updatedAt: '' },
        { id: 2, tableNumber: '2', capacity: 4, isAvailable: true, location: 'Зал', createdAt: '', updatedAt: '' },
        { id: 3, tableNumber: '3', capacity: 4, isAvailable: true, location: 'Зал', createdAt: '', updatedAt: '' },
      ]);
    } finally {
      setLoadingTables(false);
    }
  };

  const handleEdit = (record: Reservation) => {
    setEditingRes(record);
    form.setFieldsValue({
      clientId: record.clientId,
      tableId: record.tableId,
      partySize: record.partySize,
      durationMinutes: record.durationMinutes,
      notes: record.notes,
      reservationTime: dayjs(record.reservationTime),
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Отменить бронирование?',
      okText: 'Отменить',
      cancelText: 'Отмена',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await reservationsAPI.cancel(id);
          message.success('Бронирование отменено');
          fetchReservations();
        } catch {
          message.error('Ошибка при отмене');
        }
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Проверяем, что время бронирования в будущем
      if (values.reservationTime && dayjs(values.reservationTime).isBefore(dayjs())) {
        message.error('Время бронирования должно быть в будущем');
        return;
      }

      const data = {
        reservationTime: values.reservationTime ? dayjs(values.reservationTime).toISOString() : undefined,
        durationMinutes: values.durationMinutes || 60,
        partySize: values.partySize,
        clientId: values.clientId,
        tableId: values.tableId || undefined,
        notes: values.notes || undefined,
      };

      if (editingRes) {
        await reservationsAPI.update(editingRes.id, data);
        message.success('Бронирование обновлено');
      } else {
        await reservationsAPI.create(data);
        message.success('Бронирование добавлено');
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingRes(null);
      fetchReservations(pagination.current - 1, pagination.pageSize, sortConfig.field, sortConfig.direction);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Ошибка при сохранении бронирования';
      message.error(errorMessage);
      console.error('Ошибка при сохранении бронирования:', error);
    }
  };

  const columns: TableColumnsType<Reservation> = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id', 
      width: 80,
      sorter: true,
    },
    { 
      title: 'Клиент', 
      dataIndex: 'clientName', 
      key: 'clientName',
      sorter: true,
    },
    { 
      title: 'Телефон', 
      dataIndex: 'clientPhone', 
      key: 'clientPhone' 
    },
    { 
      title: 'Столик', 
      dataIndex: 'tableId', 
      key: 'tableId',
      sorter: true,
    },
    { 
      title: 'Гостей', 
      dataIndex: 'partySize', 
      key: 'partySize',
      sorter: true,
    },
    {
      title: 'Время',
      dataIndex: 'reservationTime',
      key: 'reservationTime',
      render: (time) => dayjs(time).format('DD.MM.YYYY HH:mm'),
      sorter: true,
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <StatusBadge status={s} type="reservation" />,
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) =>
        (user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
          <Space size="small">
            <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              Изменить
            </Button>
            <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
              Отменить
            </Button>
          </Space>
        ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingRes(null);
              form.resetFields();
              setIsModalOpen(true);
            }}
          >
            Новое бронирование
          </Button>
        </div>
      )}

      <Spin spinning={loading}>
        <Table<Reservation>
          columns={columns}
          dataSource={reservations}
          rowKey="id"
          pagination={{ ...pagination, onChange: (p, s) => fetchReservations(p - 1, s, sortConfig.field, sortConfig.direction) }}
          bordered
          locale={{ emptyText: 'Бронирования отсутствуют' }}
          onChange={(paginationConfig, filters, sorter) => {
            if (sorter && 'field' in sorter && sorter.field) {
              const sortBy = sorter.field as string;
              const direction = sorter.order === 'ascend' ? 'asc' : 'desc';
              setSortConfig({ field: sortBy, direction });
              fetchReservations(paginationConfig.current! - 1, paginationConfig.pageSize!, sortBy, direction);
            } else if (paginationConfig.current !== pagination.current || paginationConfig.pageSize !== pagination.pageSize) {
              fetchReservations(paginationConfig.current! - 1, paginationConfig.pageSize!, sortConfig.field, sortConfig.direction);
            }
          }}
        />
      </Spin>

      <Modal
        title={editingRes ? 'Редактирование бронирования' : 'Новое бронирование'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingRes(null);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="clientId" label="Клиент" rules={[{ required: true, message: 'Выберите клиента' }]}>
            <Select
              placeholder="Выберите клиента"
              loading={loadingClients}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={clients.map((client) => ({
                value: client.id,
                label: `${client.fullName}${client.phone ? ` (${client.phone})` : ''}`,
              }))}
            />
          </Form.Item>
          <Form.Item 
            name="tableId" 
            label="Столик" 
            rules={[{ required: false, message: 'Выберите столик' }]}
            tooltip="Столик можно выбрать позже или оставить пустым"
          >
            <Select
              placeholder="Выберите столик (необязательно)"
              allowClear
              loading={loadingTables}
              showSearch
              disabled={tables.length === 0}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={tables.map((table) => ({
                value: table.id,
                label: `Столик ${table.tableNumber} (${table.capacity} мест)${table.location ? ` - ${table.location}` : ''}${!table.isAvailable ? ' [Недоступен]' : ''}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="partySize" label="Гостей" rules={[{ required: true }]}>
            <InputNumber min={1} max={20} />
          </Form.Item>
          <Form.Item name="durationMinutes" label="Длительность (минуты)" rules={[{ required: true }]}>
            <InputNumber min={15} max={480} />
          </Form.Item>
          <Form.Item 
            name="reservationTime" 
            label="Время" 
            rules={[
              { required: true, message: 'Выберите время бронирования' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  if (dayjs(value).isBefore(dayjs())) {
                    return Promise.reject(new Error('Время бронирования должно быть в будущем'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <DatePicker 
              showTime 
              format="DD.MM.YYYY HH:mm" 
              style={{ width: '100%' }}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>
          <Form.Item name="notes" label="Примечания">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
