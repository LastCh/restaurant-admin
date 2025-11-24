import { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Select, Spin, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { ordersAPI, type Order, type OrderStatus } from '../api/orders';
import { salesAPI } from '../api/sales';
import { clientsAPI } from '../api/clients';
import type { ClientDTO } from '../types/api';
import { menuAPI, type Dish } from '../api/menu';
import { useAuthStore } from '../store/authStore';
import StatusBadge from '../components/common/StatusBadge';
import { formatPrice } from '../utils/formatters';
import { ORDER_STATUSES } from '../utils/constants';

const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  ORDER_STATUSES.PENDING,
  ORDER_STATUSES.IN_PROGRESS,
  ORDER_STATUSES.COMPLETED,
  ORDER_STATUSES.CANCELLED,
];

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [form] = Form.useForm();
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingDishes, setLoadingDishes] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' }>({
    field: 'createdAt',
    direction: 'desc',
  });
  const { user } = useAuthStore();

  const availableStatusOptions: OrderStatus[] =
    editingOrder && (!editingOrder.items || editingOrder.items.length === 0)
      ? ORDER_STATUS_OPTIONS.filter((s) => s !== ORDER_STATUSES.COMPLETED)
      : ORDER_STATUS_OPTIONS;

  useEffect(() => {
    fetchOrders();
    if (!editingOrder) {
      fetchClients();
      fetchDishes();
    }
  }, []);

  const fetchOrders = async (page = 0, size = 10, sortBy = 'createdAt', direction: 'asc' | 'desc' = 'desc') => {
    try {
      setLoading(true);
      const response = await ordersAPI.getAll(page, size, sortBy, direction);
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

  const fetchDishes = async () => {
    try {
      setLoadingDishes(true);
      const response = await menuAPI.getAll(0, 1000);
      setDishes(response.content || []);
    } catch (error) {
      console.error('Ошибка при загрузке блюд:', error);
    } finally {
      setLoadingDishes(false);
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
          console.log('Удаление заказа с ID:', id);
          await ordersAPI.delete(id);
          message.success('Заказ удалён');
          fetchOrders();
        } catch (error: any) {
          console.error('Полная ошибка при удалении заказа:', error);
          console.error('Детали ответа сервера:', error?.response?.data);
          
          let errorMessage = 'Ошибка при удалении заказа';
          
          if (error?.response?.status === 404) {
            errorMessage = 'Заказ не найден';
          } else if (error?.response?.status === 403) {
            errorMessage = 'Недостаточно прав для удаления заказа';
          } else if (error?.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error?.response?.data?.error) {
            errorMessage = error.response.data.error;
          } else if (error?.message) {
            errorMessage = error.message;
          }
          
          message.error(errorMessage);
        }
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      console.log('Данные формы заказа:', values);
      
      if (editingOrder) {
        await ordersAPI.updateStatus(editingOrder.id, values.status as OrderStatus);
        message.success('Статус заказа обновлён');

        // Если заказ помечен как COMPLETED, предложим оформить продажу
        if (values.status === 'COMPLETED') {
          Modal.confirm({
            title: 'Заказ завершён',
            content: 'Оформить продажу для этого заказа сейчас?',
            okText: 'Оформить',
            cancelText: 'Позже',
            onOk: async () => {
              try {
                const createReq = {
                  orderId: editingOrder.id,
                  total: editingOrder.total,
                };
                await salesAPI.create(createReq as any);
                message.success('Продажа создана');
              } catch (err: any) {
                const errMsg = err?.response?.data?.message || err?.message || 'Ошибка при создании продажи';
                message.error(errMsg);
              }
            },
          });
        }
      } else {
        // Проверяем, что есть хотя бы один элемент заказа
        if (!values.items || values.items.length === 0) {
          message.error('Добавьте хотя бы одно блюдо в заказ');
          return;
        }

        // Проверяем, что все элементы заказа заполнены
        const invalidItems = values.items.filter((item: any) => !item.dishId || !item.quantity);
        if (invalidItems.length > 0) {
          message.error('Заполните все поля для каждого блюда');
          return;
        }

        // Фильтруем пустые элементы
        const validItems = values.items
          .filter((item: any) => item.dishId && item.quantity)
          .map((item: any) => ({
            dishId: Number(item.dishId),
            quantity: Number(item.quantity),
          }));

        if (validItems.length === 0) {
          message.error('Добавьте хотя бы одно блюдо в заказ');
          return;
        }

        const orderData = {
          ...(values.clientId ? { clientId: Number(values.clientId) } : {}),
          ...(values.notes ? { notes: String(values.notes) } : {}),
          items: validItems,
        };
        
        console.log('Отправка заказа:', JSON.stringify(orderData, null, 2));
        await ordersAPI.create(orderData);
        message.success('Заказ создан');
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingOrder(null);
      fetchOrders();
    } catch (error: any) {
      console.error('Полная ошибка при сохранении заказа:', error);
      console.error('Детали ответа сервера:', error?.response?.data);
      
      let errorMessage = 'Ошибка при сохранении заказа';
      
      if (error?.response?.status === 500) {
        errorMessage = error?.response?.data?.message || 
                      error?.response?.data?.error || 
                      'Ошибка сервера при создании заказа. Проверьте логи сервера.';
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
    }
  };

  const columns: TableColumnsType<Order> = [
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
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: OrderStatus) => <StatusBadge status={status} type="order" />,
      sorter: true,
    },
    {
      title: 'Сумма',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => formatPrice(total),
      sorter: true,
    },
    {
      title: 'Дата',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString('ru-RU'),
      sorter: true,
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 200,
      render: (_, record) =>
        (user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'WAITER') && (
          <Space size="small">
            <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              Изменить
            </Button>
            {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
              <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
                Удалить
              </Button>
            )}
          </Space>
        ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {user && ['ADMIN', 'MANAGER', 'WAITER'].includes(user.role) && (
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingOrder(null);
              form.resetFields();
              setIsModalOpen(true);
            }}
          >
            Новый заказ
          </Button>
        </div>
      )}

      <Spin spinning={loading}>
        <Table<Order>
          columns={columns}
          dataSource={orders}
          rowKey="id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page, size) => fetchOrders(page - 1, size),
          }}
          bordered
          locale={{ emptyText: 'Здесь пока пусто' }}
          scroll={{ x: 1200 }}
          onChange={(paginationConfig, _filters, sorter) => {
            if (sorter && 'field' in sorter && sorter.field) {
              const sortBy = sorter.field as string;
              const direction = sorter.order === 'ascend' ? 'asc' : 'desc';
              setSortConfig({ field: sortBy, direction });
              fetchOrders(paginationConfig.current! - 1, paginationConfig.pageSize!, sortBy, direction);
            } else if (paginationConfig.current !== pagination.current || paginationConfig.pageSize !== pagination.pageSize) {
              fetchOrders(paginationConfig.current! - 1, paginationConfig.pageSize!, sortConfig.field, sortConfig.direction);
            }
          }}
        />
      </Spin>

      <Modal
        title={editingOrder ? `Редактирование заказа #${editingOrder.id}` : 'Новый заказ'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingOrder(null);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical">
          {editingOrder ? (
            <>
              <Form.Item
                name="status"
                label="Статус"
                rules={[{ required: true, message: 'Выберите статус' }]}
              >
                <Select>
                  {availableStatusOptions.map((status) => (
                    <Select.Option key={status} value={status}>
                      {status}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="notes" label="Примечания">
                <Input.TextArea placeholder="Добавьте примечание к заказу" />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item
                name="clientId"
                label="Клиент"
                rules={[{ required: false }]}
                tooltip="Оставьте пустым для заказа без регистрации"
              >
                <Select
                  placeholder="Выберите клиента (необязательно)"
                  allowClear
                  loading={loadingClients}
                  showSearch
                  filterOption={(input, option) =>
                              String(option?.label ?? '').toLowerCase().includes(String(input).toLowerCase())
                  }
                  options={clients.map((client) => ({
                    value: client.id,
                    label: `${client.fullName}${client.phone ? ` (${client.phone})` : ''}`,
                  }))}
                />
              </Form.Item>

              <Form.List name="items" initialValue={[{}]}>
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                        <Form.Item
                          {...restField}
                          name={[name, 'dishId']}
                          label="Блюдо"
                          rules={[{ required: true, message: 'Выберите блюдо' }]}
                          style={{ flex: 1 }}
                        >
                          <Select
                            placeholder="Выберите блюдо"
                            loading={loadingDishes}
                            showSearch
                            filterOption={(input, option) =>
                              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            options={dishes
                              .filter((d) => d.isAvailable)
                              .map((dish) => ({
                                value: dish.id,
                                label: `${dish.name} - ${formatPrice(dish.price)}`,
                              }))}
                          />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'quantity']}
                          label="Количество"
                          rules={[{ required: true, message: 'Укажите количество' }]}
                          style={{ width: 120 }}
                        >
                          <InputNumber min={1} placeholder="Кол-во" />
                        </Form.Item>
                        {fields.length > 1 && (
                          <MinusCircleOutlined
                            onClick={() => remove(name)}
                            style={{ color: '#ff4d4f', fontSize: 20, marginTop: 8 }}
                          />
                        )}
                      </Space>
                    ))}
                    <Form.Item>
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        block
                        icon={<PlusCircleOutlined />}
                      >
                        Добавить блюдо
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>

              <Form.Item name="notes" label="Примечания">
                <Input.TextArea placeholder="Добавьте примечание к заказу" rows={3} />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}
