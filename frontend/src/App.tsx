import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
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
  const [encryptMode, setEncryptMode] = useState(false);
  const [unlocked, setUnlocked] = useState(() => {
    return sessionStorage.getItem('appUnlocked') === 'true';
  });
  const [passcode, setPasscode] = useState('');
  const [passError, setPassError] = useState('');
  const [checkingConfig, setCheckingConfig] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get('/api/system/fund');
        if (response.data && response.data.encryptMode) {
          setEncryptMode(true);
        } else {
          setEncryptMode(false);
        }
      } catch (e) {
        console.error("Lỗi khi tải cấu hình mã hóa:", e);
      } finally {
        setCheckingConfig(false);
      }
    };
    fetchConfig();
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === 'tatcavianhchiemthanyeu') {
      sessionStorage.setItem('appUnlocked', 'true');
      setUnlocked(true);
      setPassError('');
    } else {
      setPassError('Khóa giải mã không chính xác!');
    }
  };

  if (loading || checkingConfig) {
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

  if (encryptMode && !unlocked) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        background: 'radial-gradient(circle at top left, #1e1b4b, #0f172a, #020617)',
        padding: '24px',
        boxSizing: 'border-box',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 999999,
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{
          position: 'absolute',
          width: '350px',
          height: '350px',
          background: 'rgba(59, 130, 246, 0.12)',
          filter: 'blur(120px)',
          borderRadius: '50%',
          top: '15%',
          left: '20%',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          background: 'rgba(239, 68, 68, 0.08)',
          filter: 'blur(100px)',
          borderRadius: '50%',
          bottom: '20%',
          right: '25%',
          pointerEvents: 'none'
        }} />

        <div className="glass-panel" style={{
          width: '100%',
          maxWidth: '440px',
          padding: '44px 36px',
          textAlign: 'center',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          boxShadow: '0 24px 50px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{
            display: 'inline-flex',
            padding: '18px',
            background: 'rgba(59, 130, 246, 0.08)',
            borderRadius: '50%',
            marginBottom: '24px',
            color: 'var(--primary)',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <svg viewBox="0 0 24 24" width="36" height="36" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px', color: '#fff' }}>
            Ứng dụng đã được mã hóa
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5', marginBottom: '28px' }}>
            Hệ thống đang hoạt động ở chế độ bảo mật cao. Vui lòng cung cấp khóa giải mã để tải giao diện.
          </p>

          {passError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              color: 'var(--error)',
              padding: '10px 12px',
              fontSize: '13px',
              marginBottom: '20px',
              textAlign: 'center',
              fontWeight: 500
            }}>
              {passError}
            </div>
          )}

          <form onSubmit={handleUnlock}>
            <div style={{ marginBottom: '24px' }}>
              <input
                type="password"
                className="form-input"
                style={{
                  textAlign: 'center',
                  fontSize: '16px',
                  letterSpacing: '4px',
                  background: 'rgba(0,0,0,0.2)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  padding: '12px',
                  width: '100%',
                  color: '#fff',
                  borderRadius: '8px',
                  boxSizing: 'border-box'
                }}
                placeholder="Nhập khóa giải mã..."
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '15px', fontWeight: 600 }}
            >
              Giải Mã Giao Diện
            </button>
          </form>
        </div>
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
