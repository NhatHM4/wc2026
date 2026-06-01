import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, LogOut, ShieldAlert } from 'lucide-react';

const PendingApproval: React.FC = () => {
  const { user, logout } = useAuth();

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
      zIndex: 99999,
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Light glow effects */}
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        background: 'rgba(245, 158, 11, 0.15)',
        filter: 'blur(100px)',
        borderRadius: '50%',
        top: '20%',
        left: '30%',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: '350px',
        height: '350px',
        background: 'rgba(59, 130, 246, 0.1)',
        filter: 'blur(120px)',
        borderRadius: '50%',
        bottom: '20%',
        right: '25%',
        pointerEvents: 'none'
      }} />

      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '40px 32px',
        textAlign: 'center',
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Animated Icon Container */}
        <div style={{
          position: 'relative',
          padding: '20px',
          background: 'rgba(245, 158, 11, 0.08)',
          borderRadius: '50%',
          marginBottom: '28px',
          color: 'var(--accent)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Clock size={48} className="glow-amber" style={{
            animation: 'pulse 2s infinite ease-in-out'
          }} />
          <ShieldAlert size={20} style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            color: 'var(--primary)',
            background: '#0f172a',
            borderRadius: '50%'
          }} />
        </div>

        <h2 style={{
          fontSize: '26px',
          fontWeight: 800,
          marginBottom: '12px',
          color: '#fff',
          letterSpacing: '-0.5px'
        }}>
          Chờ phê duyệt tài khoản
        </h2>
        
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '15px',
          lineHeight: '1.6',
          marginBottom: '32px'
        }}>
          Xin chào <strong style={{ color: '#fff' }}>{user?.username}</strong>, tài khoản của bạn đã được đăng ký thành công nhưng cần được Admin kích hoạt trước khi sử dụng. Vui lòng liên hệ quản trị viên.
        </p>

        <div style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
            style={{
              padding: '12px 24px',
              fontSize: '15px',
              fontWeight: 600,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            Kiểm tra trạng thái
          </button>
          
          <button
            onClick={logout}
            className="btn btn-secondary"
            style={{
              padding: '12px 24px',
              fontSize: '15px',
              fontWeight: 600,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'var(--text-muted)'
            }}
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </div>
      
      {/* Styles for pulse animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 1; filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.5)); }
          100% { transform: scale(1); opacity: 0.9; }
        }
      `}} />
    </div>
  );
};

export default PendingApproval;
