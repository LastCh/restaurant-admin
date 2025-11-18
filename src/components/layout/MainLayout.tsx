import { Layout, Menu, Button, Avatar, Space } from 'antd';
import { 
  DashboardOutlined, 
  ShoppingCartOutlined, 
  AppstoreOutlined, 
  CalendarOutlined,
  LogoutOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../api/auth';

const { Sider, Content, Header } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await authAPI.logout();
    logout();
    navigate('/login');
  };

  // Меню в зависимости от роли
  const getMenuItems = () => {
    const baseItems = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
        onClick: () => navigate('/dashboard'),
      },
    ];

    const managerItems = [
      {
        key: '/orders',
        icon: <ShoppingCartOutlined />,
        label: 'Заказы',
        onClick: () => navigate('/orders'),
      },
      {
        key: '/menu',
        icon: <AppstoreOutlined />,
        label: 'Меню',
        onClick: () => navigate('/menu'),
      },
      {
        key: '/reservations',
        icon: <CalendarOutlined />,
        label: 'Бронирования',
        onClick: () => navigate('/reservations'),
      },
    ];

    const waiterItems = [
      {
        key: '/orders',
        icon: <ShoppingCartOutlined />,
        label: 'Заказы',
        onClick: () => navigate('/orders'),
      },
    ];

    if (user?.role === 'ADMIN') {
      return [...baseItems, ...managerItems];
    } else if (user?.role === 'MANAGER') {
      return [...baseItems, ...managerItems];
    } else if (user?.role === 'WAITER') {
      return [...baseItems, ...waiterItems];
    }
    return baseItems;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        breakpoint="lg" 
        collapsedWidth={0}
        style={{ backgroundColor: '#001529' }}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: 20,
          color: 'white',
          fontWeight: 'bold',
          fontSize: 18
        }}>
          Ресторан
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
        />
      </Sider>

      <Layout>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: 0 }}>Админ-панель</h2>
          <Space>
            <Avatar icon={<UserOutlined />} />
            <span>{user?.username}</span>
            <Button 
              type="primary" 
              danger 
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              Выход
            </Button>
          </Space>
        </Header>

        <Content style={{ margin: 0, padding: 0, background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
