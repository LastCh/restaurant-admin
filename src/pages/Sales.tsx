import { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Select, Spin, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { salesAPI, type Sale, type PaymentMethod, type CreateSaleRequest } from '../api/sales';
import { ordersAPI, type Order } from '../api/orders';
import { useAuthStore } from '../store/authStore';
import { formatPrice, formatPaymentMethod } from '../utils/formatters';
import EmptyState from '../components/common/EmptyState';

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'CARD', 'ONLINE', 'OTHER'];

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [form] = Form.useForm();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const { user } = useAuthStore();

  const fetchSales = async (page = 0, size = 10, sortBy = 'saleTime', direction: 'asc' | 'desc' = 'desc') => {
    try {
      setLoading(true);
      const response = await salesAPI.getAll(page, size, sortBy, direction);
      setSales(response.content || []);
      setPagination({
        current: (response.currentPage ?? page) + 1,
        pageSize: response.pageSize ?? size,
        total: response.totalElements ?? 0,
      });
    } catch (error) {
      message.error('Ошибка при загрузке продаж');
      // eslint-disable-next-line no-console
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchOrders();
  }, []);

  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' }>({
    field: 'saleTime',
    direction: 'desc',
  });

  const handleTableChange = (pageObj: any, _filters: any, sorter: any) => {
    const page = (pageObj?.current ?? 1) - 1;
    const size = pageObj?.pageSize ?? 10;
    const sortBy = sorter?.field ?? 'saleTime';
    const direction = sorter?.order === 'ascend' ? 'asc' : sorter?.order === 'descend' ? 'desc' : 'desc';
    setSortConfig({ field: sortBy, direction });
    fetchSales(page, size, sortBy, direction);
  };

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await ordersAPI.getAll(0, 1000);
      // Фильтруем только завершенные заказы без продажи
      const completedOrders = (response.content || []).filter(
        (order) => order.status === 'COMPLETED'
      );
      setOrders(completedOrders);
    } catch (error) {
      console.error('Ошибка при загрузке заказов:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleEdit = (record: Sale) => {
    setEditingSale(record);
    form.setFieldsValue({
      orderId: record.orderId,
      total: record.total,
      paymentMethod: record.paymentMethod,
      receiptNumber: record.receiptNumber,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: 'Удалить продажу?',
      content: 'Это действие необратимо.',
      okText: 'Удалить',
      cancelText: 'Отмена',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await salesAPI.delete(id);
          message.success('Продажа удалена');
          fetchSales();
        } catch (error: any) {
          const errorMessage = error?.response?.data?.message || error?.message || 'Ошибка при удалении продажи';
          message.error(errorMessage);
        }
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingSale) {
        // Обновление продажи - в API может не быть метода update, поэтому просто показываем сообщение
        message.warning('Редактирование продаж пока не поддерживается');
        setIsModalOpen(false);
        form.resetFields();
        setEditingSale(null);
      } else {
        await salesAPI.create({
          orderId: values.orderId,
          total: values.total,
          paymentMethod: values.paymentMethod,
          receiptNumber: values.receiptNumber,
        } as CreateSaleRequest);
        message.success('Продажа создана');
        setIsModalOpen(false);
        form.resetFields();
        fetchSales();
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Ошибка при сохранении продажи';
      message.error(errorMessage);
      console.error('Ошибка при сохранении продажи:', error);
    }
  };

  const columns: TableColumnsType<Sale> = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id', 
      width: 80,
      sorter: true,
    },
    {
      title: 'Дата продажи',
      dataIndex: 'saleTime',
      key: 'saleTime',
      render: (value: string) => new Date(value).toLocaleString('ru-RU'),
      sorter: true,
    },
    {
      title: 'Сумма',
      dataIndex: 'total',
      key: 'total',
      render: (value: number) => formatPrice(value),
      sorter: true,
    },
    {
      title: 'Метод оплаты',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (value: PaymentMethod | undefined) => (value ? formatPaymentMethod(value) : '—'),
      sorter: true,
    },
    { 
      title: 'Номер заказа', 
      dataIndex: 'orderId', 
      key: 'orderId', 
      width: 140,
      sorter: true,
    },
    { 
      title: 'Чек', 
      dataIndex: 'receiptNumber', 
      key: 'receiptNumber', 
      width: 160 
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_, record) =>
        user?.role === 'ADMIN' && (
          <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            Удалить
          </Button>
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
              setEditingSale(null);
              form.resetFields();
              setIsModalOpen(true);
            }}
          >
            Добавить продажу
          </Button>
        </div>
      )}

      <Spin spinning={loading}>
        <Table<Sale>
          columns={columns}
          dataSource={sales}
          rowKey="id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page, size) => fetchSales(page - 1, size, sortConfig.field, sortConfig.direction),
          }}
          onChange={handleTableChange}
          bordered
          locale={{ emptyText: <EmptyState message="Продажи отсутствуют" /> }}
        />
      </Spin>

      <Modal
        title={editingSale ? `Редактирование продажи #${editingSale.id}` : 'Новая продажа'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingSale(null);
          form.resetFields();
        }}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="orderId" label="Заказ" rules={[{ required: true, message: 'Выберите заказ' }]}>
            <Select
              placeholder="Выберите заказ"
              loading={loadingOrders}
              disabled={!!editingSale}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={orders.map((order) => ({
                value: order.id,
                label: `Заказ #${order.id} - ${formatPrice(order.total)}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="total" label="Сумма" rules={[{ required: true, message: 'Введите сумму' }]}>
            <InputNumber min={0.01} step={0.01} prefix="₽" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="paymentMethod" label="Метод оплаты" rules={[{ required: true, message: 'Выберите метод оплаты' }]}>
            <Select placeholder="Выберите метод оплаты">
              {PAYMENT_METHODS.map((method) => (
                <Select.Option key={method} value={method}>
                  {formatPaymentMethod(method)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="receiptNumber" label="Номер чека">
            <Input placeholder="Номер чека" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
