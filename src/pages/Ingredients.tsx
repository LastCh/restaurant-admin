import { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Select, Spin, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { ingredientsAPI, type Ingredient, type CreateIngredientRequest } from '../api/ingredients';
import { useAuthStore } from '../store/authStore';
import { formatPrice } from '../utils/formatters';
import EmptyState from '../components/common/EmptyState';

import { formatUnit } from '../utils/formatters';

const UNITS = ['kg', 'g', 'l', 'ml', 'piece', 'pcs', 'unit'] as const;

export default function Ingredients() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [form] = Form.useForm();
  const { user } = useAuthStore();

  const [addStockFor, setAddStockFor] = useState<Ingredient | null>(null);
  const [addStockQty, setAddStockQty] = useState<number>(0);

  const openAddStockModal = (ingredient: Ingredient) => {
    setAddStockFor(ingredient);
    setAddStockQty(0);
  };

  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' }>({
    field: 'createdAt',
    direction: 'desc',
  });

  const fetchIngredients = async (page = 0, size = 10, sortBy = 'createdAt', direction: 'asc' | 'desc' = 'desc') => {
    try {
      setLoading(true);
      const response = await ingredientsAPI.getAll(page, size, sortBy, direction);
      setIngredients(response.content || []);
      setPagination({
        current: (response.currentPage ?? page) + 1,
        pageSize: response.pageSize ?? size,
        total: response.totalElements ?? 0,
      });
    } catch (error) {
      message.error('Ошибка при загрузке ингредиентов');
      // eslint-disable-next-line no-console
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients(0, 10, sortConfig.field, sortConfig.direction);
  }, []);

  const handleEdit = (record: Ingredient) => {
    setEditingIngredient(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: 'Удалить ингредиент?',
      content: 'Это действие необратимо.',
      okText: 'Удалить',
      cancelText: 'Отмена',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          console.log('Удаление ингредиента с ID:', id);
          await ingredientsAPI.delete(id);
          message.success('Ингредиент удалён');
          fetchIngredients(pagination.current - 1, pagination.pageSize, sortConfig.field, sortConfig.direction);
        } catch (error: any) {
          console.error('Полная ошибка при удалении ингредиента:', error);
          console.error('Детали ответа сервера:', error?.response?.data);
          
          let errorMessage = 'Ошибка при удалении ингредиента';
          
          if (error?.response?.status === 404) {
            errorMessage = 'Ингредиент не найден';
          } else if (error?.response?.status === 403) {
            errorMessage = 'Недостаточно прав для удаления ингредиента';
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
      if (editingIngredient) {
        await ingredientsAPI.update(editingIngredient.id, values);
        message.success('Ингредиент обновлён');
      } else {
        await ingredientsAPI.create(values as CreateIngredientRequest);
        message.success('Ингредиент добавлен');
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingIngredient(null);
      fetchIngredients(pagination.current - 1, pagination.pageSize, sortConfig.field, sortConfig.direction);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Ошибка при сохранении ингредиента';
      message.error(errorMessage);
      console.error('Ошибка при сохранении ингредиента:', error);
    }
  };

  const columns: TableColumnsType<Ingredient> = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id', 
      width: 80,
      sorter: true,
    },
    { 
      title: 'Название', 
      dataIndex: 'name', 
      key: 'name',
      sorter: true,
    },
    { 
      title: 'Ед. изм.', 
      dataIndex: 'unit', 
      key: 'unit', 
      width: 120,
      sorter: true,
      render: (u: string) => formatUnit(u),
    },
    {
      title: 'Запас',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      width: 120,
      sorter: true,
      render: (value: number, record: Ingredient) => {
        const isLow = value <= record.minStockLevel;
        return (
          <span style={{ color: isLow ? '#ff4d4f' : undefined, fontWeight: isLow ? 'bold' : undefined }}>
            {value} {formatUnit(record.unit)}
          </span>
        );
      },
    },
    {
      title: 'Цена за ед.',
      dataIndex: 'costPerUnit',
      key: 'costPerUnit',
      render: (value: number) => formatPrice(value),
      width: 160,
      sorter: true,
    },
    {
      title: 'Минимальный запас',
      dataIndex: 'minStockLevel',
      key: 'minStockLevel',
      width: 140,
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
            <Button size="small" onClick={() => openAddStockModal(record)}>
              Пополнить
            </Button>
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
              setEditingIngredient(null);
              form.resetFields();
              setIsModalOpen(true);
            }}
          >
            Добавить ингредиент
          </Button>
        </div>
      )}

      <Spin spinning={loading}>
        <Table<Ingredient>
          columns={columns}
          dataSource={ingredients}
          rowKey="id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page, size) => fetchIngredients(page - 1, size, sortConfig.field, sortConfig.direction),
          }}
          bordered
          locale={{ emptyText: <EmptyState message="Ингредиенты отсутствуют" /> }}
          onChange={(paginationConfig, _filters, sorter) => {
            if (sorter && 'field' in sorter && sorter.field) {
              const sortBy = sorter.field as string;
              const direction = sorter.order === 'ascend' ? 'asc' : 'desc';
              setSortConfig({ field: sortBy, direction });
              fetchIngredients(paginationConfig.current! - 1, paginationConfig.pageSize!, sortBy, direction);
            } else if (paginationConfig.current !== pagination.current || paginationConfig.pageSize !== pagination.pageSize) {
              fetchIngredients(paginationConfig.current! - 1, paginationConfig.pageSize!, sortConfig.field, sortConfig.direction);
            }
          }}
        />
      </Spin>

      <Modal
        title={editingIngredient ? `Редактирование: ${editingIngredient.name}` : 'Добавить ингредиент'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingIngredient(null);
          form.resetFields();
        }}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Название" rules={[{ required: true, message: 'Введите название' }]}>
            <Input placeholder="Название ингредиента" />
          </Form.Item>
          <Form.Item name="unit" label="Единица измерения" rules={[{ required: true, message: 'Выберите единицу измерения' }]}>
            <Select placeholder="Выберите единицу измерения">
              {UNITS.map((unit) => (
                <Select.Option key={unit} value={unit}>
                  {unit}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="stockQuantity" label="Запас" rules={[{ required: true, message: 'Введите запас' }]}>
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="costPerUnit" label="Цена за единицу" rules={[{ required: true, message: 'Введите цену' }]}>
            <InputNumber min={0.01} step={0.01} prefix="₽" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="minStockLevel" label="Минимальный запас" rules={[{ required: true, message: 'Введите минимальный запас' }]}>
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal to add stock */}
      <Modal
        title={addStockFor ? `Пополнить запас: ${addStockFor.name}` : 'Пополнить запас'}
        open={!!addStockFor}
        onOk={async () => {
          try {
            const q = Number(addStockQty) || 0;
            if (q <= 0) {
              message.error('Введите корректное количество');
              return;
            }
            await ingredientsAPI.updateStock(addStockFor!.id, q);
            message.success('Запас обновлён');
            setAddStockFor(null);
            setAddStockQty(0);
            fetchIngredients(pagination.current - 1, pagination.pageSize, sortConfig.field, sortConfig.direction);
          } catch (err: any) {
            message.error(err?.response?.data?.message || err?.message || 'Ошибка при обновлении запаса');
          }
        }}
        onCancel={() => {
          setAddStockFor(null);
          setAddStockQty(0);
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <InputNumber min={0.01} step={0.01} style={{ width: 160 }} value={addStockQty} onChange={(v) => setAddStockQty(Number(v) || 0)} />
          <span>{addStockFor ? formatUnit(addStockFor.unit) : ''}</span>
        </div>
      </Modal>
    </div>
  );
}
