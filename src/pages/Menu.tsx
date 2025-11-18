import { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, message, Spin } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';

type Dish = {
  id: number;
  name: string;
  description: string;
  price: number;
  available: boolean;
};

export default function Menu() {
  const [dishes, setDishes] = useState<Dish[]>([
    { id: 1, name: 'Борщ', description: 'Украинский борщ', price: 150, available: true },
    { id: 2, name: 'Пельмени', description: 'Сибирские пельмени', price: 200, available: true },
    { id: 3, name: 'Салат Цезарь', description: 'С курицей и сухариками', price: 250, available: false },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [form] = Form.useForm();

  const handleEdit = (record: Dish) => {
    setEditingDish(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Удалить блюдо?',
      content: 'Это действие необратимо.',
      okText: 'Удалить',
      cancelText: 'Отмена',
      okButtonProps: { danger: true },
      onOk: () => {
        setDishes(dishes.filter(d => d.id !== id));
        message.success('Блюдо удалено');
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingDish) {
        setDishes(dishes.map(d => d.id === editingDish.id ? { ...d, ...values } : d));
        message.success('Блюдо обновлено');
      } else {
        setDishes([...dishes, { ...values, id: Math.max(...dishes.map(d => d.id), 0) + 1 }]);
        message.success('Блюдо добавлено');
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingDish(null);
    } catch {
      message.error('Ошибка при сохранении');
    }
  };

  const columns: TableColumnsType<Dish> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Название', dataIndex: 'name', key: 'name' },
    { title: 'Описание', dataIndex: 'description', key: 'description' },
    { title: 'Цена', dataIndex: 'price', key: 'price', render: (p) => `${p} ₽` },
    {
      title: 'Статус',
      dataIndex: 'available',
      key: 'available',
      render: (a) => a ? '✓ Доступно' : '✗ Недоступно',
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
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditingDish(null);
          form.resetFields();
          setIsModalOpen(true);
        }}>
          Добавить блюдо
        </Button>
      </div>

      <Table<Dish>
        columns={columns}
        dataSource={dishes}
        rowKey="id"
        bordered
        locale={{ emptyText: 'Здесь пока пусто' }}
      />

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
            <Input placeholder="Название блюда" />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <Input.TextArea placeholder="Описание" />
          </Form.Item>
          <Form.Item name="price" label="Цена" rules={[{ required: true }]}>
            <InputNumber min={0} prefix="₽" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
