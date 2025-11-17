import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';  // ← НОВАЯ
import MainLayout from './components/layout/MainLayout';
import { useAuthStore } from './store/authStore';

function MenuPage() { return <div style={{ padding: 24 }}>Страница меню (скоро)</div>; }
function ReservationsPage() { return <div style={{ padding: 24 }}>Страница бронирований (скоро)</div>; }

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const token = localStorage.getItem('accessToken');
  
  if (!user && !token) {
    return <Navigate to="/login" replace />;
  }
  
  return <MainLayout>{children}</MainLayout>;
}

export default function App() {
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem('user');
        }
      }
    }
  }, [setUser]);

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
            <PrivateRoute>
              <Orders />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/menu" 
          element={
            <PrivateRoute>
              <MenuPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/reservations" 
          element={
            <PrivateRoute>
              <ReservationsPage />
            </PrivateRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
