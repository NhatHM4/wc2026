import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { Trophy, Wallet as WalletIcon, LogOut, LogIn, UserPlus, Award, Calendar, Settings } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { balance } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav style={{
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '16px 0'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Logo */}
        <Link to="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textDecoration: 'none',
          color: '#fff'
        }}>
          <Trophy size={28} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.5px' }}>
            WC26<span style={{ color: 'var(--primary)' }}>BET</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link to="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            textDecoration: 'none',
            color: isActive('/') ? '#fff' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '15px',
            borderBottom: isActive('/') ? '2px solid var(--primary)' : '2px solid transparent',
            paddingBottom: '4px',
            transition: 'all 0.2s'
          }}>
            <Calendar size={16} />
            Lịch thi đấu
          </Link>
          
          <Link to="/leaderboard" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            textDecoration: 'none',
            color: isActive('/leaderboard') ? '#fff' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '15px',
            borderBottom: isActive('/leaderboard') ? '2px solid var(--primary)' : '2px solid transparent',
            paddingBottom: '4px',
            transition: 'all 0.2s'
          }}>
            <Award size={16} />
            Xếp hạng
          </Link>

          {user && (
            <Link to="/wallet" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              color: isActive('/wallet') ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '15px',
              borderBottom: isActive('/wallet') ? '2px solid var(--primary)' : '2px solid transparent',
              paddingBottom: '4px',
              transition: 'all 0.2s'
            }}>
              <WalletIcon size={16} />
              Ví của tôi
            </Link>
          )}

          {user && (user.role === 'OWNER' || user.role === 'ADMIN') && (
            <Link to="/admin" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              color: isActive('/admin') ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '15px',
              borderBottom: isActive('/admin') ? '2px solid var(--primary)' : '2px solid transparent',
              paddingBottom: '4px',
              transition: 'all 0.2s'
            }}>
              <Settings size={16} />
              Quản trị (Admin)
            </Link>
          )}
        </div>

        {/* Auth / Balance Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user ? (
            <>
              {/* Balance display */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '6px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: 600
              }}>
                <WalletIcon size={16} style={{ color: 'var(--primary)' }} />
                <span>{balance.toLocaleString('vi-VN')} VND</span>
              </div>

              {/* Username & LogOut */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>
                  Xin chào, <strong style={{ color: '#fff' }}>{user.username}</strong>
                </span>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                >
                  <LogOut size={14} />
                  Thoát
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '8px 16px', display: 'flex', gap: '6px', fontSize: '14px' }}>
                <LogIn size={14} />
                Đăng nhập
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '8px 16px', display: 'flex', gap: '6px', fontSize: '14px' }}>
                <UserPlus size={14} />
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
