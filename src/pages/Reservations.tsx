import { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, DatePicker, TimePicker, message, InputNumber } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';

type Reservation = {
  id: number;
  clientName: string;
  clientPhone: string;
  tableNumber: number;
  guestCount: number;
  reservationTime: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
};

export default function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>([
    {
      id: 1,
      clientName: 'Иван Петров',
      clientPhone: '+79991234567',
      tableNumber: 5,
      guestCount: 4,
      reservationTime: new Date().toISOString(),
      status: 'ACTIVE',
    },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRes, setEditingRes] = useState<Reservation | null>(null);
  const [form] = Form.useForm();

  const handleEdit = (record: Reservation) => {
    setEditingRes(record);
    form.setFieldsValue({
      clientName: record.clientName,
      clientPhone: record.clientPhone,
      tableNumber: record.tableNumber,
      guestCount: record.guestCount,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Отменить бронирование?',
      okText: 'Отменить',
      cancelText: 'Отмена',
      okButtonProps: { danger: true },
      onOk: () => {
        setReservations(reservations.filter(r => r.id !== id));
        message.success('Бронирование отменено');
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingRes) {
        setReservations(reservations.map(r => r.id === editingRes.id ? { ...r, ...values } : r));
        message.success('Бронирование обновлено');
      } else {
        setReservations([...reservations, { ...values, id: Math.max(...reservations.map(r => r.id), 0) + 1, status: 'ACTIVE' }]);
        message.success('Бронирование добавлено');
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingRes(null);
    } catch {
      message.error('Ошибка при сохранении');
    }
  };

  const columns: TableColumnsType<Reservation> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Клиент', dataIndex: 'clientName', key: 'clientName' },
    { title: 'Телефон', dataIndex: 'clientPhone', key: 'clientPhone' },
    { title: 'Столик', dataIndex: 'tableNumber', key: 'tableNumber' },
    { title: 'Гостей', dataIndex: 'guestCount', key: 'guestCount' },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (s) => {
        const colors = { ACTIVE: 'green', COMPLETED: 'blue', CANCELLED: 'red' };
        const labels = { ACTIVE: 'Активна', COMPLETED: 'Завершена', CANCELLED: 'Отменена' };
        return <span style={{ color: colors[s as keyof typeof colors] }}>{labels[s as keyof typeof labels]}</span>;
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
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
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditingRes(null);
          form.resetFields();
          setIsModalOpen(true);
        }}>
          Новое бронирование
        </Button>
      </div>

      <Table<Reservation>
        columns={columns}
        dataSource={reservations}
        rowKey="id"
        bordered
        locale={{ emptyText: 'Бронирования отсутствуют' }}
      />

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
          <Form.Item name="clientName" label="Имя клиента" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="clientPhone" label="Телефон" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="tableNumber" label="Номер столика" rules={[{ required: true }]}>
            <Select placeholder="Выберите столик">
              {[1,2,3,4,5,6,7,8,9,10].map(n => <Select.Option key={n} value={n}>Столик {n}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="guestCount" label="Количество гостей" rules={[{ required: true }]}>
            <InputNumber min={1} max={20} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
