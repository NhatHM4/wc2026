import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';

export interface User {
  id: string;
  username: string;
  role: string;
  approved: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { decryptData } from '../utils/crypto';

// Cấu hình URL cơ sở của backend API
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Tự động giải mã dữ liệu trả về từ API nếu ở chế độ mã hóa
axios.interceptors.response.use(
  (response) => {
    if (response.data && response.data.encryptedData) {
      const decryptedStr = decryptData(response.data.encryptedData);
      if (decryptedStr) {
        try {
          response.data = JSON.parse(decryptedStr);
        } catch (e) {
          console.error("Lỗi khi parse JSON đã giải mã:", e);
        }
      }
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const login = useCallback((newToken: string, userData: User) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  useEffect(() => {
    // Khôi phục token và thông tin người dùng từ localStorage khi tải lại trang
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken) {
      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Lỗi khi parse user từ localStorage:", e);
        }
      }

      // Tải thông tin người dùng mới nhất từ backend để đảm bảo trạng thái duyệt (approved) là chính xác
      axios.get('/api/auth/me')
        .then(response => {
          const freshUser = response.data;
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        })
        .catch(error => {
          console.error("Lỗi khi đồng bộ thông tin người dùng từ backend:", error);
          if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            logout();
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [logout]);

  // Tự động kiểm tra trạng thái kích hoạt mỗi 10 giây nếu tài khoản chưa được duyệt
  useEffect(() => {
    if (!token || !user || user.approved) return;

    const interval = setInterval(() => {
      axios.get('/api/auth/me')
        .then(response => {
          const freshUser = response.data;
          if (freshUser.approved) {
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          }
        })
        .catch(error => {
          console.error("Lỗi khi kiểm tra trạng thái kích hoạt ngầm:", error);
          if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            logout();
          }
        });
    }, 10000); // 10 giây

    return () => clearInterval(interval);
  }, [token, user, logout]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
};
