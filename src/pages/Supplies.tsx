import { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Select, Spin, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, MinusCircleOutlined, PlusCircleOutlined, CheckOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { suppliersAPI, type Supplier } from '../api/suppliers';
import { ingredientsAPI, type Ingredient } from '../api/ingredients';
import { useAuthStore } from '../store/authStore';
import { formatPrice } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import { suppliesAPI, type Supply, type SupplyStatus, type CreateSupplyRequest, type CreateSupplyItemRequest } from '../api/supplies';

export default function Supplies() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupply, setEditingSupply] = useState<Supply | null>(null);
  const [form] = Form.useForm();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const { user } = useAuthStore();

  const fetchSupplies = async (page = 0, size = 10, sortBy = 'supplyTime', direction: 'asc' | 'desc' = 'desc') => {
    try {
      setLoading(true);
      const response = await suppliesAPI.getAll(page, size, sortBy, direction);
      setSupplies(response.content || []);
      setPagination({
        current: (response.currentPage ?? page) + 1,
        pageSize: response.pageSize ?? size,
        total: response.totalElements ?? 0,
      });
    } catch (error) {
      message.error('Ошибка при загрузке поставок');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplies();
    fetchSuppliers();
    fetchIngredients();
  }, []);

  const handleTableChange = (pageObj: any, _filters: any, sorter: any) => {
    const page = (pageObj?.current ?? 1) - 1;
    const size = pageObj?.pageSize ?? 10;
    const sortBy = sorter?.field ?? 'supplyTime';
    const direction = sorter?.order === 'ascend' ? 'asc' : sorter?.order === 'descend' ? 'desc' : 'desc';
    fetchSupplies(page, size, sortBy, direction);
  };

  const fetchSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const response = await suppliersAPI.getAll(0, 1000);
      setSuppliers(response.content || []);
    } catch (error) {
      console.error('Ошибка при загрузке поставщиков:', error);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      setLoadingIngredients(true);
      const response = await ingredientsAPI.getAll(0, 1000);
      setIngredients(response.content || []);
    } catch (error) {
      console.error('Ошибка при загрузке ингредиентов:', error);
    } finally {
      setLoadingIngredients(false);
    }
  };

  const handleEdit = (record: Supply) => {
    setEditingSupply(record);
    form.setFieldsValue({
      supplierId: record.supplierId,
      notes: record.notes,
      items: record.items?.map((item) => ({
        ingredientId: item.ingredientId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })) || [{}],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: 'Удалить поставку?',
      content: 'Это действие необратимо.',
      okText: 'Удалить',
      cancelText: 'Отмена',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await suppliesAPI.delete(id);
          message.success('Поставка удалена');
          // Обновляем список напрямую, без повторного fetch
          setSupplies((prev) => prev.filter((s) => s.id !== id));
        } catch (error: any) {
          const errorMessage = error?.response?.data?.message || error?.message || 'Ошибка при удалении поставки';
          message.error(errorMessage);
        }
      },
    });
  };


  const handleConfirm = async (id: number) => {
    try {
      await suppliesAPI.confirm(id);
      message.success('Поставка подтверждена');
      fetchSupplies();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Ошибка при подтверждении поставки';
      message.error(errorMessage);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (!values.supplierId) {
        message.error('Выберите поставщика');
        return;
      }

      if (!values.items || values.items.length === 0) {
        message.error('Добавьте хотя бы одну позицию в поставку');
        return;
      }

      const supplyRequest: CreateSupplyRequest = {
        supplierId: values.supplierId,
        notes: values.notes,
        items: values.items.map((item: any) => ({
          ingredientId: item.ingredientId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      if (editingSupply) {
  // Сначала обновляем саму поставку
  await suppliesAPI.update(editingSupply.id, {
    supplierId: values.supplierId,
    notes: values.notes,
  });

  // Потом позиции
  const existingItemIds = editingSupply.items?.map(i => i.id) || [];
  for (const item of values.items) {
    if (item.id) {
        // уже существует — обновляем
        // здесь API нет updateItem, только remove + add?
        await suppliesAPI.removeItem(editingSupply.id, item.id);
      }
      // добавляем новую или обновлённую
      await suppliesAPI.addItem(editingSupply.id, {
        ingredientId: item.ingredientId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      });
    }
    message.success('Поставка обновлена');
  } else {
        // Создание новой поставки сразу с позициями
        await suppliesAPI.create(supplyRequest);
        message.success('Поставка создана');
      }

      setIsModalOpen(false);
      form.resetFields();
      setEditingSupply(null);
      fetchSupplies();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Ошибка при сохранении поставки';
      message.error(errorMessage);
      console.error('Ошибка при сохранении поставки:', error);
    }
  };


  const columns: TableColumnsType<Supply> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80, sorter: true },
    { title: 'Поставщик', dataIndex: 'supplierName', key: 'supplierName', sorter: true },
    {
      title: 'Дата поставки',
      dataIndex: 'supplyTime',
      key: 'supplyTime',
      render: (value: string) => new Date(value).toLocaleString('ru-RU'),
      sorter: true,
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: SupplyStatus) => <StatusBadge status={status} type="supply" />,
      sorter: true,
    },
    {
      title: 'Сумма',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (value: number) => formatPrice(value),
      sorter: true,
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 200,
      render: (_, record) =>
        (user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
          <Space size="small">
            <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              Изменить
            </Button>
            {record.status === 'PENDING' && (
              <Button type="default" size="small" icon={<CheckOutlined />} onClick={() => handleConfirm(record.id)}>
                Подтвердить
              </Button>
            )}
            {user?.role === 'ADMIN' && (
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
      {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingSupply(null);
              form.resetFields();
              form.setFieldsValue({ items: [{}] });
              setIsModalOpen(true);
            }}
          >
            Добавить поставку
          </Button>
        </div>
      )}

      <Spin spinning={loading}>
        <Table<Supply>
          columns={columns}
          dataSource={supplies}
          rowKey="id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page, size) => fetchSupplies(page - 1, size),
          }}
          onChange={handleTableChange}
          bordered
          locale={{ emptyText: <EmptyState message="Поставки отсутствуют" /> }}
        />
      </Spin>

      <Modal
        title={editingSupply ? `Редактирование поставки #${editingSupply.id}` : 'Новая поставка'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingSupply(null);
          form.resetFields();
        }}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="supplierId" label="Поставщик" rules={[{ required: true, message: 'Выберите поставщика' }]}>
            <Select
              placeholder="Выберите поставщика"
              loading={loadingSuppliers}
              showSearch
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name }))}
            />
          </Form.Item>

          <Form.List name="items" initialValue={[{}]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'ingredientId']}
                      label="Ингредиент"
                      rules={[{ required: true, message: 'Выберите ингредиент' }]}
                      style={{ flex: 1 }}
                    >
                      <Select
                        placeholder="Выберите ингредиент"
                        loading={loadingIngredients}
                        showSearch
                        filterOption={(input, option) =>
                          String(option?.label ?? '').toLowerCase().includes(String(input).toLowerCase())
                        }
                        options={ingredients.map((ingredient) => ({
                          value: ingredient.id,
                          label: `${ingredient.name} (${ingredient.unit})`,
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
                      <InputNumber min={0.01} step={0.01} placeholder="Кол-во" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'unitPrice']}
                      label="Цена за ед."
                      rules={[{ required: true, message: 'Укажите цену' }]}
                      style={{ width: 120 }}
                    >
                      <InputNumber min={0.01} step={0.01} placeholder="Цена" prefix="₽" />
                    </Form.Item>
                    {fields.length > 1 && (
                      <MinusCircleOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f', fontSize: 20, marginTop: 8 }} />
                    )}
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusCircleOutlined />}>
                    Добавить позицию
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item name="notes" label="Примечания">
            <Input.TextArea placeholder="Добавьте примечание к поставке" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
