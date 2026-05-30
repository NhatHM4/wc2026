import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Calendar, History, ShieldAlert } from 'lucide-react';

const Wallet: React.FC = () => {
  const { balance, transactions, loading, deposit, withdraw } = useWallet();
  const [amount, setAmount] = useState<number | ''>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const QUICK_AMOUNTS = [20000, 50000, 100000, 200000, 500000];

  const handleDeposit = async () => {
    if (!amount || amount <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    setError('');
    setSuccess('');
    try {
      await deposit(amount);
      setSuccess(`Đã nạp thành công ${amount.toLocaleString('vi-VN')} VND vào tài khoản!`);
      setAmount('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi nạp tiền.');
    }
  };

  const handleWithdraw = async () => {
    if (!amount || amount <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    if (amount > balance) {
      setError('Số dư ví không đủ để rút số tiền này');
      return;
    }
    setError('');
    setSuccess('');
    try {
      await withdraw(amount);
      setSuccess(`Đã rút thành công ${amount.toLocaleString('vi-VN')} VND về ngân hàng giả lập!`);
      setAmount('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi rút tiền.');
    }
  };

  const getTransactionTypeStyle = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return { color: 'var(--primary)', label: 'Nạp tiền' };
      case 'WITHDRAW':
        return { color: 'var(--error)', label: 'Rút tiền' };
      case 'BET_PLACED':
        return { color: 'var(--text-muted)', label: 'Đặt cược' };
      case 'WIN_PAYOUT':
        return { color: 'var(--accent)', label: 'Thưởng cược' };
      default:
        return { color: '#fff', label: type };
    }
  };

  const formatTxDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container" style={{ padding: '40px 16px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>Quản lý ví tiền</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
        Theo dõi số dư, nạp rút tiền giả lập và lịch sử giao dịch.
      </p>

      {/* Main Grid */}
      <div className="wallet-grid">
        
        {/* Left Column: Balance & Quick actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Balance card */}
          <div className="glass-panel" style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.05))',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            padding: '24px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '12px',
              padding: '16px',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <WalletIcon size={36} />
            </div>
            <div style={{ minWidth: '180px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Số Dư Ví Hiện Tại
              </span>
              <h2 style={{ fontSize: '30px', fontWeight: 800, color: '#fff', marginTop: '4px', wordBreak: 'break-all' }}>
                {balance.toLocaleString('vi-VN')} <span style={{ fontSize: '18px', color: 'var(--primary)' }}>VND</span>
              </h2>
            </div>
          </div>

          {/* Quick Amounts */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '16px' }}>
              Chọn nhanh số tiền:
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {QUICK_AMOUNTS.map(val => (
                <button
                  key={val}
                  className="btn btn-secondary"
                  style={{
                    padding: '8px 14px',
                    fontSize: '13px',
                    borderColor: amount === val ? 'var(--primary)' : 'var(--border)',
                    color: amount === val ? 'var(--primary)' : 'var(--text-main)',
                    background: amount === val ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.03)'
                  }}
                  onClick={() => {
                    setAmount(val);
                    setError('');
                    setSuccess('');
                  }}
                >
                  {val.toLocaleString('vi-VN')} VND
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Transaction Actions */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>Giao dịch ví</h3>
          
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              color: 'var(--error)',
              padding: '12px',
              fontSize: '14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '8px',
              color: 'var(--primary)',
              padding: '12px',
              fontSize: '14px',
              marginBottom: '20px'
            }}>
              {success}
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Nhập số tiền giao dịch (VND)</label>
            <input
              type="number"
              className="form-input"
              placeholder="Nhập số tiền..."
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value === '' ? '' : parseInt(e.target.value));
                setError('');
                setSuccess('');
              }}
              disabled={loading}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <button
              className="btn btn-secondary"
              style={{
                display: 'flex',
                gap: '8px',
                padding: '12px',
                color: 'var(--error)',
                borderColor: 'rgba(239, 68, 68, 0.2)',
                background: 'rgba(239, 68, 68, 0.02)',
                justifyContent: 'center'
              }}
              onClick={handleWithdraw}
              disabled={loading}
            >
              <ArrowDownLeft size={16} />
              Rút tiền
            </button>
            
            <button
              className="btn btn-primary"
              style={{ display: 'flex', gap: '8px', padding: '12px', justifyContent: 'center' }}
              onClick={handleDeposit}
              disabled={loading}
            >
              <ArrowUpRight size={16} />
              Nạp tiền
            </button>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px', textAlign: 'center' }}>
            * Đây là hệ thống giả lập. Nạp và rút sẽ cập nhật số dư ví ảo ngay lập tức.
          </p>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 700,
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '12px',
          textAlign: 'left'
        }}>
          <History size={18} style={{ color: 'var(--primary)' }} />
          Lịch sử giao dịch
        </h3>

        {transactions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'left' }}>Chưa có giao dịch nào được ghi nhận.</p>
        ) : (
          <div className="table-scroll-container">
            <table>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '14px' }}>
                  <th style={{ padding: '12px 8px' }}>Thời gian</th>
                  <th style={{ padding: '12px 8px' }}>Loại giao dịch</th>
                  <th style={{ padding: '12px 8px' }}>Mô tả</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => {
                  const txType = getTransactionTypeStyle(tx.type);
                  const isNegative = tx.amount < 0;
                  return (
                    <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '14px' }}>
                      <td style={{ padding: '14px 8px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} />
                        {formatTxDate(tx.createdAt)}
                      </td>
                      <td style={{ padding: '14px 8px', fontWeight: 600, color: txType.color }}>
                        {txType.label}
                      </td>
                      <td style={{ padding: '14px 8px', color: '#fff' }}>{tx.description}</td>
                      <td style={{
                        padding: '14px 8px',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: isNegative ? 'var(--error)' : 'var(--primary)'
                      }}>
                        {isNegative ? '' : '+'}{tx.amount.toLocaleString('vi-VN')} VND
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
