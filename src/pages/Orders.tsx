import { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, Select, Spin, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { ordersAPI, type Order, type OrderStatus } from '../api/orders';

const orderStatusColors: Record<OrderStatus, string> = {
  PENDING: 'orange',
  CONFIRMED: 'blue',
  PREPARING: 'cyan',
  READY: 'green',
  COMPLETED: 'success',
  CANCELLED: 'red',
};

const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'В ожидании',
  CONFIRMED: 'Подтверждён',
  PREPARING: 'Готовится',
  READY: 'Готов',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async (page: number = 0, size: number = 10) => {
    try {
      setLoading(true);
      const response = await ordersAPI.getAll(page, size);
      setOrders(response.content || []);
      setPagination({
        current: page + 1,
        pageSize: size,
        total: response.totalElements || 0,
      });
    } catch (error) {
      message.error('Ошибка при загрузке заказов');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: Order) => {
    setEditingOrder(record);
    form.setFieldsValue({
      status: record.status,
      notes: record.notes,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Удалить заказ?',
      content: 'Это действие необратимо.',
      okText: 'Удалить',
      cancelText: 'Отмена',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await ordersAPI.delete(id);
          message.success('Заказ удалён');
          fetchOrders();
        } catch (error) {
          message.error('Ошибка при удалении заказа');
        }
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingOrder) {
        await ordersAPI.update(editingOrder.id, values);
        message.success('Заказ обновлён');
        setIsModalOpen(false);
        fetchOrders();
      }
    } catch (error) {
      message.error('Ошибка при сохранении заказа');
    }
  };

  const columns: TableColumnsType<Order> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
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
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: OrderStatus) => (
        <Tag color={orderStatusColors[status]}>
          {statusLabels[status]}
        </Tag>
      ),
    },
    {
      title: 'Сумма',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price: number) => `${price.toFixed(2)} ₽`,
    },
    {
      title: 'Дата',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString('ru-RU'),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Изменить
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />}>
          Новый заказ (скоро)
        </Button>
      </div>

      <Spin spinning={loading}>
        <Table<Order>
          columns={columns}
          dataSource={orders}
          rowKey="id"
          pagination={{
            ...pagination,
            onChange: (page, pageSize) => fetchOrders(page - 1, pageSize),
          }}
          bordered
          locale={{ emptyText: 'Здесь пока пусто' }}
        />
      </Spin>

      <Modal
        title={`Редактирование заказа #${editingOrder?.id}`}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="status"
            label="Статус"
            rules={[{ required: true, message: 'Выберите статус' }]}
          >
            <Select>
              {Object.entries(statusLabels).map(([key, label]) => (
                <Select.Option key={key} value={key}>
                  {label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="Примечания">
            <Input.TextArea placeholder="Добавьте примечание к заказу" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
