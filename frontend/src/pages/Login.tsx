import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Trophy, Key, User } from 'lucide-react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', { username, password });
      const { token, id, role } = response.data;
      
      login(token, { id, username: response.data.username, role });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '450px',
        padding: '40px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex',
          padding: '16px',
          background: 'rgba(245, 158, 11, 0.1)',
          borderRadius: '50%',
          marginBottom: '20px',
          color: 'var(--accent)'
        }}>
          <Trophy size={40} className="glow-amber" style={{ borderRadius: '50%' }} />
        </div>
        
        <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>World Cup 2026</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Đăng nhập để đặt cược tỉ số các trận cầu đỉnh cao</p>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            color: 'var(--error)',
            padding: '12px',
            fontSize: '14px',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Tên đăng nhập</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '44px' }}
                placeholder="Nhập username của bạn"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label className="form-label">Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <Key size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '44px' }}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '16px', marginBottom: '24px' }}
            disabled={loading}
          >
            {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
          </button>
        </form>

        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Chưa có tài khoản?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
