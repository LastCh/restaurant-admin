import { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, DatePicker, InputNumber, message, Spin } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { reservationsAPI, type Reservation } from '../api/reservations';
import { clientsAPI } from '../api/clients';
import { tablesAPI } from '../api/tables';
import type { ClientDTO, TableDTO } from '../types/api';
import { useAuthStore } from '../store/authStore';
import dayjs from 'dayjs';
import StatusBadge from '../components/common/StatusBadge';

export default function Reservations() {
  const { user } = useAuthStore();
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

  useEffect(() => {
    fetchReservations();
    fetchClients();
    fetchTables();
  }, []);

  const fetchReservations = async (
    page = 0,
    size = 10,
    sortBy = sortConfig.field,
    direction: 'asc' | 'desc' = sortConfig.direction
  ) => {
    try {
      setLoading(true);
      const response = await reservationsAPI.getAll(page, size, sortBy, direction);
      setReservations(response.content || []);
      setPagination({
        current: page + 1,
        pageSize: size,
        total: response.totalElements || 0,
      });
    } catch (error) {
      console.error(error);
      message.error('Ошибка при загрузке бронирований');
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
      try {
        const availableTables = await tablesAPI.getAvailable();
        setTables(availableTables || []);
      } catch {
        const response = await tablesAPI.getAll(0, 1000);
        setTables(response.content || []);
      }
    } catch (error) {
      console.error('Ошибка при загрузке столов:', error);
      setTables([]);
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
      title: 'Удалить бронирование?',
      okText: 'Удалить',
      cancelText: 'Отмена',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await reservationsAPI.delete(id);
          message.success('Бронирование удалено');
          fetchReservations();
        } catch (err) {
          console.error(err);
          message.error('Ошибка при удалении бронирования');
        }
      },
    });
  };


  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (values.reservationTime && dayjs(values.reservationTime).isBefore(dayjs())) {
        message.error('Время бронирования должно быть в будущем');
        return;
      }

      const data = {
        reservationTime: values.reservationTime.toISOString(),
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
      fetchReservations(pagination.current - 1, pagination.pageSize);
    } catch (error: any) {
      if (error?.response?.status === 409) {
        message.error(error?.response?.data?.message || 'Столик уже забронирован на это время');
      } else {
        message.error(error?.response?.data?.message || 'Ошибка при сохранении бронирования');
      }
      console.error(error);
    }
  };

  const columns: TableColumnsType<Reservation> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80, sorter: true },
    { title: 'Клиент', dataIndex: 'clientName', key: 'clientName', sorter: true },
    { title: 'Телефон', dataIndex: 'clientPhone', key: 'clientPhone' },
    { title: 'Столик', dataIndex: 'tableId', key: 'tableId', sorter: true },
    { title: 'Гостей', dataIndex: 'partySize', key: 'partySize', sorter: true },
    { title: 'Время', dataIndex: 'reservationTime', key: 'reservationTime', render: (time) => dayjs(time).format('DD.MM.YYYY HH:mm'), sorter: true },
    { title: 'Статус', dataIndex: 'status', key: 'status', render: (s) => <StatusBadge status={s} type="reservation" /> },
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
    <div style={{ padding: 24 }}>
      {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
        <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={() => { setEditingRes(null); form.resetFields(); setIsModalOpen(true); }}>
          Новое бронирование
        </Button>
      )}

      <Spin spinning={loading}>
        <Table<Reservation>
          columns={columns}
          dataSource={reservations}
          rowKey="id"
          pagination={{ ...pagination, onChange: (p, s) => fetchReservations(p - 1, s) }}
          bordered
          locale={{ emptyText: 'Бронирования отсутствуют' }}
          onChange={(paginationConfig, _filters, sorter) => {
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

      <Modal title={editingRes ? 'Редактирование бронирования' : 'Новое бронирование'} open={isModalOpen} onOk={handleModalOk} onCancel={() => { setIsModalOpen(false); form.resetFields(); setEditingRes(null); }}>
        <Form form={form} layout="vertical">
          <Form.Item name="clientId" label="Клиент" rules={[{ required: true, message: 'Выберите клиента' }]}>
            <Select
              placeholder="Выберите клиента"
              loading={loadingClients}
              showSearch
              filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(String(input).toLowerCase())}
              options={clients.map((client) => ({ value: client.id, label: `${client.fullName}${client.phone ? ` (${client.phone})` : ''}` }))}
            />
          </Form.Item>
          <Form.Item name="tableId" label="Столик" rules={[]}>
            <Select
              placeholder="Выберите столик"
              allowClear
              loading={loadingTables}
              showSearch
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={tables.map((table) => ({ value: table.id, label: `Столик ${table.tableNumber} (${table.capacity} мест)` }))}
            />
          </Form.Item>
          <Form.Item name="partySize" label="Гостей" rules={[{ required: true }]}>
            <InputNumber min={1} max={20} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="durationMinutes" label="Длительность (минуты)" rules={[{ required: true }]}>
            <InputNumber min={15} max={480} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="reservationTime"
            label="Время"
            rules={[{ required: true, message: 'Выберите время бронирования' }]}
          >
            <DatePicker showTime format="DD.MM.YYYY HH:mm" style={{ width: '100%' }} disabledDate={(current) => current && current < dayjs().startOf('day')} />
          </Form.Item>
          <Form.Item name="notes" label="Примечания">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
