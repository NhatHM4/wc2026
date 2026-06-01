import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { Trophy, Wallet as WalletIcon, LogOut, LogIn, UserPlus, Award, Calendar, Settings, Menu, X } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { balance } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/hibro');
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
      <div className="container navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={() => setIsOpen(false)}>
          <Trophy size={28} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.5px' }}>
            WC26<span style={{ color: 'var(--primary)' }}>BET</span>
          </span>
        </Link>

        {/* Compact Mobile Balance and Toggle */}
        <div className="navbar-right-mobile">
          {user && (
            <div className="navbar-mobile-balance">
              <WalletIcon size={14} style={{ color: 'var(--primary)' }} />
              <span>{balance.toLocaleString('vi-VN')} VND</span>
            </div>
          )}
          <button
            className="navbar-mobile-toggle"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation"
            style={{ display: 'block' }}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Navigation links & Actions menu */}
        <div className={`navbar-menu ${isOpen ? 'is-open' : ''}`}>
          {/* Navigation Links */}
          <div className="navbar-links">
            <Link to="/" onClick={() => setIsOpen(false)} style={{
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
            
            <Link to="/leaderboard" onClick={() => setIsOpen(false)} style={{
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
               <Link to="/wallet" onClick={() => setIsOpen(false)} style={{
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
              <Link to="/admin" onClick={() => setIsOpen(false)} style={{
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
          <div className="navbar-actions">
            {user ? (
              <>
                {/* Balance display (Desktop only via css display rule desktop-balance) */}
                <div className="navbar-mobile-balance desktop-balance" style={{ display: 'flex' }}>
                  <WalletIcon size={16} style={{ color: 'var(--primary)' }} />
                  <span>{balance.toLocaleString('vi-VN')} VND</span>
                </div>

                {/* Username & LogOut */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>
                    Xin chào, <strong style={{ color: '#fff' }}>{user.username}</strong>
                  </span>
                  <button
                    onClick={() => { handleLogout(); setIsOpen(false); }}
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
                <Link to="/hibro" onClick={() => setIsOpen(false)} className="btn btn-secondary" style={{ padding: '8px 16px', display: 'flex', gap: '6px', fontSize: '14px' }}>
                  <LogIn size={14} />
                  Đăng nhập
                </Link>
                <Link to="/register" onClick={() => setIsOpen(false)} className="btn btn-primary" style={{ padding: '8px 16px', display: 'flex', gap: '6px', fontSize: '14px' }}>
                  <UserPlus size={14} />
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
