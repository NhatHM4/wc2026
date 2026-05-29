import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

interface Transaction {
  id: string;
  walletId: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

interface WalletContextType {
  balance: number;
  transactions: Transaction[];
  loading: boolean;
  refreshBalance: () => Promise<number>;
  refreshTransactions: () => Promise<void>;
  deposit: (amount: number) => Promise<void>;
  withdraw: (amount: number) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const refreshBalance = async (): Promise<number> => {
    if (!user) return 0;
    try {
      const response = await axios.get('/api/wallet/balance');
      const val = response.data.balance;
      setBalance(val);
      return val;
    } catch (error) {
      console.error('Không thể lấy số dư ví:', error);
      return 0;
    }
  };

  const refreshTransactions = async () => {
    if (!user) return;
    try {
      const response = await axios.get('/api/wallet/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error('Không thể lấy lịch sử giao dịch:', error);
    }
  };

  const deposit = async (amount: number) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/wallet/deposit', { amount });
      setBalance(response.data.balance);
      await refreshTransactions();
    } finally {
      setLoading(false);
    }
  };

  const withdraw = async (amount: number) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/wallet/withdraw', { amount });
      setBalance(response.data.balance);
      await refreshTransactions();
    } finally {
      setLoading(false);
    }
  };

  // Tự động tải lại số dư và lịch sử giao dịch khi người dùng đăng nhập
  useEffect(() => {
    if (user) {
      refreshBalance();
      refreshTransactions();
    } else {
      setBalance(0);
      setTransactions([]);
    }
  }, [user]);

  return (
    <WalletContext.Provider
      value={{
        balance,
        transactions,
        loading,
        refreshBalance,
        refreshTransactions,
        deposit,
        withdraw,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet phải được sử dụng bên trong WalletProvider');
  }
  return context;
};
