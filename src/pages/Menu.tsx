import { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Select, message, Spin, Image, Radio, Upload } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { menuAPI, type Dish } from '../api/menu';
import { useAuthStore } from '../store/authStore';
import { formatPrice } from '../utils/formatters';
import { DISH_CATEGORIES } from '../utils/constants';

export default function Menu() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [form] = Form.useForm();
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' }>({
    field: 'createdAt',
    direction: 'desc',
  });
  const { user } = useAuthStore();

  useEffect(() => {
    fetchDishes();
  }, []);

  const fetchDishes = async (page = 0, size = 10, sortBy = 'createdAt', direction: 'asc' | 'desc' = 'desc') => {
    try {
      setLoading(true);
      const response = await menuAPI.getAll(page, size);
      setDishes(response.content || []);
      setPagination({
        current: page + 1,
        pageSize: size,
        total: response.totalElements || 0,
      });
    } catch (error) {
      message.error('Ошибка при загрузке меню');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: Dish) => {
    setEditingDish(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: 'Удалить блюдо?',
      content: 'Это действие необратимо.',
      okText: 'Удалить',
      cancelText: 'Отмена',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          console.log('Удаление блюда с ID:', id);
          await menuAPI.delete(id);
          message.success('Блюдо удалено');
          fetchDishes(pagination.current - 1, pagination.pageSize, sortConfig.field, sortConfig.direction);
        } catch (error: any) {
          console.error('Полная ошибка при удалении блюда:', error);
          console.error('Детали ответа сервера:', error?.response?.data);
          
          let errorMessage = 'Ошибка при удалении блюда';
          
          if (error?.response?.status === 404) {
            errorMessage = 'Блюдо не найдено';
          } else if (error?.response?.status === 403) {
            errorMessage = 'Недостаточно прав для удаления блюда';
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
      if (editingDish) {
        const payload = {
          ...values,
          preparationTimeMinutes: values.preparationTimeMinutes,
        };

        await menuAPI.update(editingDish.id, {
          ...payload,
          isAvailable: editingDish.isAvailable,
        });
        message.success('Блюдо обновлено');
      } else {
        const payload = {
          ...values,
          preparationTimeMinutes: values.preparationTimeMinutes,
        };

        await menuAPI.create({
          ...payload,
          isAvailable: true,
        });
        message.success('Блюдо добавлено');
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingDish(null);
      fetchDishes();
    } catch (error) {
      message.error('Ошибка при сохранении блюда');
      // eslint-disable-next-line no-console
      console.error(error);
    }
  };

  const columns: TableColumnsType<Dish> = [
    {
      title: 'Фото',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 80,
      render: (imageUrl) =>
        imageUrl ? (
          <Image src={imageUrl} width={60} height={60} style={{ objectFit: 'cover', borderRadius: '4px' }} />
        ) : (
          <div style={{ width: 60, height: 60, background: '#f0f0f0', borderRadius: '4px' }} />
        ),
    },
    { 
      title: 'Название', 
      dataIndex: 'name', 
      key: 'name',
      sorter: true,
    },
    { 
      title: 'Описание', 
      dataIndex: 'description', 
      key: 'description' 
    },
    {
      title: 'Категория',
      dataIndex: 'category',
      key: 'category',
      sorter: true,
    },
    {
      title: 'Цена',
      dataIndex: 'price',
      key: 'price',
      render: (p: number) => formatPrice(p),
      sorter: true,
    },
    {
      title: 'Статус',
      dataIndex: 'isAvailable',
      key: 'isAvailable',
      render: (a: boolean) => (a ? '✓ Доступно' : '✗ Недоступно'),
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
              Удалить
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
              setEditingDish(null);
              form.resetFields();
              setIsModalOpen(true);
            }}
          >
            Добавить блюдо
          </Button>
        </div>
      )}

      <Spin spinning={loading}>
        <Table<Dish>
          columns={columns}
          dataSource={dishes}
          rowKey="id"
          pagination={{ ...pagination, onChange: (p, s) => fetchDishes(p - 1, s, sortConfig.field, sortConfig.direction) }}
          bordered
          locale={{ emptyText: 'Меню пусто' }}
          onChange={(paginationConfig, filters, sorter) => {
            if (sorter && 'field' in sorter && sorter.field) {
              const sortBy = sorter.field as string;
              const direction = sorter.order === 'ascend' ? 'asc' : 'desc';
              setSortConfig({ field: sortBy, direction });
              fetchDishes(paginationConfig.current! - 1, paginationConfig.pageSize!, sortBy, direction);
            } else if (paginationConfig.current !== pagination.current || paginationConfig.pageSize !== pagination.pageSize) {
              fetchDishes(paginationConfig.current! - 1, paginationConfig.pageSize!, sortConfig.field, sortConfig.direction);
            }
          }}
        />
      </Spin>

      <Modal
        title={editingDish ? `Редактирование: ${editingDish.name}` : 'Добавить блюдо'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingDish(null);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Название" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="category" label="Категория" rules={[{ required: true, message: 'Выберите категорию' }]}>
            <Select placeholder="Выберите категорию" showSearch filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }>
              {DISH_CATEGORIES.map((category) => (
                <Select.Option key={category} value={category}>
                  {category}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="price" label="Цена" rules={[{ required: true }]}>
            <InputNumber min={0.01} step={0.01} prefix="₽" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="imageUrl" label="URL фото">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item label="Источник изображения">
            <Form.Item name="imageSource" noStyle initialValue="url">
              <Radio.Group>
                <Radio value="url">URL</Radio>
                <Radio value="upload">Загрузить</Radio>
              </Radio.Group>
            </Form.Item>
          </Form.Item>
          <Form.Item shouldUpdate={(prev, cur) => prev.imageSource !== cur.imageSource} style={{ marginBottom: 12 }}>
            {() => (
              form.getFieldValue('imageSource') === 'upload' ? (
                <Form.Item name="imageFile" label="Файл изображения" valuePropName="file">
                  <Upload
                    accept="image/*"
                    maxCount={1}
                    beforeUpload={(file) => {
                      const reader = new FileReader();
                      reader.onload = () => {
                        form.setFieldsValue({ imageUrl: reader.result });
                      };
                      reader.readAsDataURL(file);
                      // prevent upload
                      return false;
                    }}
                  >
                    <Button>Выбрать файл</Button>
                  </Upload>
                </Form.Item>
              ) : null
            )}
          </Form.Item>
          <Form.Item
            name="preparationTimeMinutes"
            label="Время приготовления (минуты)"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={480} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
