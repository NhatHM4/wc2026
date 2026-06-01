import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Wallet from './pages/Wallet';
import Leaderboard from './pages/Leaderboard';
import Admin from './pages/Admin';
import Nginx504 from './components/Nginx504';


const LogoutRoute: React.FC = () => {
  const { logout } = useAuth();
  useEffect(() => {
    logout();
  }, [logout]);
  return <Navigate to="/hibro" replace />;
};

// Hợp phần bảo vệ các Route yêu cầu xác thực
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        color: 'var(--text-muted)'
      }}>
        Đang tải...
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/hibro" replace />;
};

// Hợp phần bảo vệ các Route dành cho khách (chưa đăng nhập hoặc chưa được duyệt)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        color: 'var(--text-muted)'
      }}>
        Đang tải...
      </div>
    );
  }

  return (!user || !user.approved) ? <>{children}</> : <Navigate to="/" replace />;
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        color: 'var(--text-muted)'
      }}>
        Đang tải...
      </div>
    );
  }

  const isPublicRoute = location.pathname === '/hibro' || location.pathname === '/tambiet' || location.pathname === '/register';

  if (!user && !isPublicRoute) {
    return <Nginx504 />;
  }

  if (user && !user.approved && !isPublicRoute) {
    return <Nginx504 />;
  }

  return (
    <>
      <Navbar />
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leaderboard" element={<Leaderboard />} />

          <Route path="/hibro" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />

          <Route path="/tambiet" element={<LogoutRoute />} />

          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />

          <Route path="/wallet" element={
            <PrivateRoute>
              <Wallet />
            </PrivateRoute>
          } />

          <Route path="/admin" element={
            <PrivateRoute>
              <Admin />
            </PrivateRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '32px 24px',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border)',
        fontSize: '14px',
        background: 'rgba(0, 0, 0, 0.1)'
      }}>
        <div className="container">
          <p>© 2026 World Cup Bet. Ích nước lợi nhà</p>
          <p style={{ marginTop: '8px', fontSize: '12px' }}>
            Dự án mô phỏng phục vụ mục đích giải trí.
          </p>
        </div>
      </footer>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <Router>
          <AppContent />
        </Router>
      </WalletProvider>
    </AuthProvider>
  );
}

export default App;
