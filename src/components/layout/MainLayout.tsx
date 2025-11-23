import { Layout, Menu, Button, Avatar, Space, Select } from 'antd';
import { 
  DashboardOutlined, 
  ShoppingCartOutlined, 
  AppstoreOutlined, 
  CalendarOutlined,
  LogoutOutlined,
  UserOutlined,
  CoffeeOutlined,
  ExperimentOutlined,
  ShopOutlined,
  TruckOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../api/auth';
import { useLocale, useT } from '../../i18n';

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
  const t = useT();
  const { locale, setLocale } = useLocale();

  const getMenuItems = () => {
    const baseItems = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: t('menu.dashboard'),
        onClick: () => navigate('/dashboard'),
      },
    ];

    const managerItems = [
      {
        key: '/orders',
        icon: <ShoppingCartOutlined />,
        label: t('menu.orders'),
        onClick: () => navigate('/orders'),
      },
      {
        key: '/menu',
        icon: <CoffeeOutlined />,
        label: t('menu.menu'),
        onClick: () => navigate('/menu'),
      },
      {
        key: '/reservations',
        icon: <CalendarOutlined />,
        label: t('menu.reservations'),
        onClick: () => navigate('/reservations'),
      },
      {
        key: '/ingredients',
        icon: <ExperimentOutlined />,
        label: t('menu.ingredients'),
        onClick: () => navigate('/ingredients'),
      },
      {
        key: '/suppliers',
        icon: <ShopOutlined />,
        label: t('menu.suppliers'),
        onClick: () => navigate('/suppliers'),
      },
      {
        key: '/supplies',
        icon: <TruckOutlined />,
        label: t('menu.supplies'),
        onClick: () => navigate('/supplies'),
      },
      {
        key: '/sales',
        icon: <DollarOutlined />,
        label: t('menu.sales'),
        onClick: () => navigate('/sales'),
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
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <h2 style={{ margin: 0 }}>{t('title')}</h2>
          <Space>
            <Select value={locale} onChange={(val) => setLocale(val as 'ru' | 'en')} style={{ width: 90 }} options={[{ value: 'ru', label: 'RU' }, { value: 'en', label: 'EN' }]} />
            <Avatar icon={<UserOutlined />} />
            <span style={{ marginRight: 8 }}>{user?.username}</span>
            <Button 
              type="primary" 
              danger 
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              {t('logout')}
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
