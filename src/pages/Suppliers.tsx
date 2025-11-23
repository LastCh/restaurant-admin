import { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Spin, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { suppliersAPI, type Supplier, type CreateSupplierRequest } from '../api/suppliers';
import { useAuthStore } from '../store/authStore';
import EmptyState from '../components/common/EmptyState';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [form] = Form.useForm();
  const { user } = useAuthStore();

  const fetchSuppliers = async (page = 0, size = 10, sortBy = 'name', direction: 'asc' | 'desc' = 'asc') => {
    try {
      setLoading(true);
      const response = await suppliersAPI.getAll(page, size, sortBy, direction);
      setSuppliers(response.content || []);
      setPagination({
        current: (response.currentPage ?? page) + 1,
        pageSize: response.pageSize ?? size,
        total: response.totalElements ?? 0,
      });
    } catch (error) {
      message.error('Ошибка при загрузке поставщиков');
      // eslint-disable-next-line no-console
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleTableChange = (pageObj: any, _filters: any, sorter: any) => {
    const page = (pageObj?.current ?? 1) - 1;
    const size = pageObj?.pageSize ?? 10;
    const sortBy = sorter?.field ?? 'name';
    const direction = sorter?.order === 'ascend' ? 'asc' : sorter?.order === 'descend' ? 'desc' : 'asc';
    fetchSuppliers(page, size, sortBy, direction);
  };

  const handleEdit = (record: Supplier) => {
    setEditingSupplier(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: 'Удалить поставщика?',
      content: 'Это действие необратимо.',
      okText: 'Удалить',
      cancelText: 'Отмена',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await suppliersAPI.delete(id);
          message.success('Поставщик удалён');
          fetchSuppliers();
        } catch (error: any) {
          const errorMessage = error?.response?.data?.message || error?.message || 'Ошибка при удалении поставщика';
          message.error(errorMessage);
        }
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      console.log('Создание/обновление поставщика с данными:', values);
      
      if (editingSupplier) {
        await suppliersAPI.update(editingSupplier.id, values);
        message.success('Поставщик обновлён');
      } else {
        const supplierData: CreateSupplierRequest = {
          name: String(values.name || '').trim(),
          ...(values.inn ? { inn: String(values.inn).trim() } : {}),
          ...(values.phone ? { phone: String(values.phone).trim() } : {}),
          ...(values.email ? { email: String(values.email).trim() } : {}),
          ...(values.address ? { address: String(values.address).trim() } : {}),
          ...(values.contactPerson ? { contactPerson: String(values.contactPerson).trim() } : {}),
        };
        
        if (!supplierData.name) {
          message.error('Название поставщика обязательно');
          return;
        }
        
        console.log('Отправка данных поставщика:', JSON.stringify(supplierData, null, 2));
        
        try {
          await suppliersAPI.create(supplierData);
          message.success('Поставщик добавлен');
        } catch (apiError: any) {
          // Если API не существует (404), показываем более понятное сообщение
          if (apiError?.response?.status === 404) {
            message.error('API для работы с поставщиками не реализовано на сервере. Обратитесь к администратору.');
          } else {
            throw apiError;
          }
        }
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingSupplier(null);
      fetchSuppliers();
    } catch (error: any) {
      console.error('Полная ошибка при сохранении поставщика:', error);
      const errorMessage = 
        error?.response?.data?.message || 
        error?.response?.data?.error || 
        error?.message || 
        'Ошибка при сохранении поставщика';
      message.error(errorMessage);
    }
  };

  const columns: TableColumnsType<Supplier> = [
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
    { title: 'ИНН', dataIndex: 'inn', key: 'inn', width: 150 },
    { title: 'Телефон', dataIndex: 'phone', key: 'phone', width: 160 },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 200 },
    { title: 'Контактное лицо', dataIndex: 'contactPerson', key: 'contactPerson' },
    {
      title: 'Действия',
      key: 'actions',
      width: 150,
      render: (_, record) =>
        (user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
          <Space size="small">
            <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              Изменить
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
              setEditingSupplier(null);
              form.resetFields();
              setIsModalOpen(true);
            }}
          >
            Добавить поставщика
          </Button>
        </div>
      )}

      <Spin spinning={loading}>
        <Table<Supplier>
          columns={columns}
          dataSource={suppliers}
          rowKey="id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page, size) => fetchSuppliers(page - 1, size),
          }}
          onChange={handleTableChange}
          bordered
          locale={{ emptyText: <EmptyState message="Поставщики отсутствуют" /> }}
        />
      </Spin>

      <Modal
        title={editingSupplier ? `Редактирование: ${editingSupplier.name}` : 'Добавить поставщика'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingSupplier(null);
          form.resetFields();
        }}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Название" rules={[{ required: true, message: 'Введите название' }]}>
            <Input placeholder="Название компании" />
          </Form.Item>
          <Form.Item name="inn" label="ИНН">
            <Input placeholder="ИНН" />
          </Form.Item>
          <Form.Item name="phone" label="Телефон">
            <Input placeholder="+7 (999) 123-45-67" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Введите корректный email' }]}>
            <Input placeholder="email@example.com" />
          </Form.Item>
          <Form.Item name="address" label="Адрес">
            <Input.TextArea placeholder="Адрес" rows={2} />
          </Form.Item>
          <Form.Item name="contactPerson" label="Контактное лицо">
            <Input placeholder="ФИО контактного лица" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
