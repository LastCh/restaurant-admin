import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, Alert } from 'antd';
import { authAPI } from '../api/auth';
import { useAuthStore } from '../store/authStore';

const { Title } = Typography;

export default function Login() {
  const setUser = useAuthStore((state) => state.setUser);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const user = await authAPI.login(values);
      setUser(user);
      navigate('/dashboard');
    } catch (e) {
      setError('Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ margin: '0 auto', maxWidth: 400, paddingTop: 80 }}>
      <Title level={2}>Вход в админ-панель</Title>
      <Form layout="vertical" onFinish={handleLogin}>
        <Form.Item name="username" label="Логин" rules={[{ required: true }]}>
          <Input autoFocus />
        </Form.Item>
        <Form.Item name="password" label="Пароль" rules={[{ required: true }]}>
          <Input.Password />
        </Form.Item>
        {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
        <Button block type="primary" htmlType="submit" loading={loading}>
          Войти
        </Button>
      </Form>
    </div>
  );
}
