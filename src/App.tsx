import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Spin } from 'antd';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Menu from './pages/Menu';
import Reservations from './pages/Reservations';
import MainLayout from './components/layout/MainLayout';
import { useAuthStore } from './store/authStore';

function PrivateRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const user = useAuthStore((state) => state.user);
  const token = localStorage.getItem('accessToken');
  
  if (!user && !token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <MainLayout>{children}</MainLayout>;
}

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    restoreSession();
    setIsInitialized(true);
  }, [restoreSession]);

  if (!isInitialized) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#f0f2f5'
      }}>
        <Spin size="large" tip="Загрузка..." />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/orders" 
          element={
            <PrivateRoute allowedRoles={['ADMIN', 'MANAGER', 'WAITER']}>
              <Orders />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/menu" 
          element={
            <PrivateRoute allowedRoles={['ADMIN', 'MANAGER']}>
              <Menu />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/reservations" 
          element={
            <PrivateRoute allowedRoles={['ADMIN', 'MANAGER']}>
              <Reservations />
            </PrivateRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
