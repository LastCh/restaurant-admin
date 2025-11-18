import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, Card, Spin } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import type { AxiosError } from 'axios';
import { authAPI } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import type { ErrorResponse } from '../types';

const { Title } = Typography;

export default function Login() {
  const setUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleLogin = async (values: { username: string; password: string }) => {
  setLoading(true);
  console.log('🔍 Attempting login with:', values.username); // ← ДОБАВЬТЕ
  
  try {
    const user = await authAPI.login(values);
    console.log('✅ Login response:', user); // ← ДОБАВЬТЕ
    setUser(user);
    form.resetFields();
    navigate('/dashboard');
  } catch (e) {
    const err = e as AxiosError<ErrorResponse>;
    console.error('❌ Login error:', err.response?.status, err.response?.data); // ← ДОБАВЬТЕ
    
    let errorMsg = 'Неверные учетные данные';
    
    if (err.response?.status === 429) {
      errorMsg = 'Слишком много попыток входа. Попробуйте позже.';
    } else if (err.response?.data?.message) {
      errorMsg = err.response.data.message;
    } else if (err.message === 'Network Error') {
      errorMsg = 'Ошибка подключения к серверу';
    }
    
    form.setFields([
      {
        name: 'password',
        errors: [errorMsg],
      },
    ]);
  } finally {
    setLoading(false);
  }
};


  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Spin spinning={loading}>
        <Card style={{ width: 400, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <Title level={2} style={{ margin: 0, color: '#667eea' }}>
              Админ-панель
            </Title>
            <p style={{ color: '#999', marginTop: 8 }}>Ресторан - Управление</p>
          </div>

          <Form 
            form={form}
            layout="vertical" 
            onFinish={handleLogin}
            requiredMark="optional"
            autoComplete="off"
          >
            <Form.Item 
              name="username" 
              label="Логин" 
              rules={[
                { required: true, message: 'Введите логин' },
                { min: 3, message: 'Логин должен быть минимум 3 символа' }
              ]}
            >
              <Input 
                prefix={<UserOutlined />}
                placeholder="admin" 
                size="large"
                autoFocus
                autoComplete="off"
              />
            </Form.Item>

            <Form.Item 
              name="password" 
              label="Пароль" 
              rules={[
                { required: true, message: 'Введите пароль' },
                { min: 6, message: 'Пароль должен быть минимум 6 символов' }
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined />}
                placeholder="password123" 
                size="large"
                autoComplete="off"
              />
            </Form.Item>

            <Button 
              block 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
              style={{ marginTop: 10 }}
              disabled={loading}
            >
              Войти
            </Button>
          </Form>

          <div style={{ 
            marginTop: 20, 
            paddingTop: 20, 
            borderTop: '1px solid #eee',
            textAlign: 'center',
            fontSize: 12,
            color: '#999'
          }}>
            <p>Демо учетные данные:</p>
            <p>Логин: <strong>admin</strong></p>
            <p>Пароль: <strong>password123</strong></p>
          </div>
        </Card>
      </Spin>
    </div>
  );
}
