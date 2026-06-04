import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useWallet } from '../context/WalletContext';
import { Wallet as WalletIcon, ArrowUpRight, Calendar, History, ShieldAlert, Copy, Check, Loader2 } from 'lucide-react';
import { formatDonut } from '../utils/currency';

const Wallet: React.FC = () => {
  const { balance, transactions, loading, refreshBalance, refreshTransactions } = useWallet();
  const [amount, setAmount] = useState<number | ''>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const QUICK_AMOUNTS = [20, 50, 100, 200, 500]; // in Donuts

  const [generatingQr, setGeneratingQr] = useState(false);
  const [qrDetails, setQrDetails] = useState<{
    qrCode: string;
    qrDataURL: string;
    addInfo: string;
    accountNo: string;
    accountName: string;
    acqId: string;
    amount: number;
    transactionId: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [checkingPayment, setCheckingPayment] = useState<boolean>(false);
  const [systemMode, setSystemMode] = useState<string>('REAL');

  useEffect(() => {
    const fetchMode = async () => {
      try {
        const response = await axios.get('/api/system/fund');
        setSystemMode(response.data.systemMode || 'REAL');
      } catch (e) {
        console.error("Không thể lấy chế độ hệ thống:", e);
      }
    };
    fetchMode();
  }, []);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Quản lý đếm ngược và kiểm tra trạng thái tự động
  useEffect(() => {
    if (!qrDetails) return;

    setTimeLeft(300);
    setCheckingPayment(false);

    const countdownTimer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          handleTimeout(qrDetails.transactionId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const statusChecker = setInterval(async () => {
      try {
        const response = await axios.get(`/api/wallet/transactions/${qrDetails.transactionId}/status`);
        const status = response.data.status;

        if (status === 'SUCCESS') {
          clearInterval(statusChecker);
          clearInterval(countdownTimer);
          await refreshBalance();
          await refreshTransactions();
          setSuccess(`Đã nạp thành công ${formatDonut(qrDetails.amount)} vào tài khoản!`);
          setQrDetails(null);
          setAmount('');
        } else if (status === 'EXPIRED' || status === 'CANCELLED') {
          clearInterval(statusChecker);
          clearInterval(countdownTimer);
          setError(status === 'EXPIRED' ? 'Giao dịch nạp tiền đã hết hạn.' : 'Giao dịch đã bị hủy.');
          setQrDetails(null);
          setAmount('');
        }
      } catch (err) {
        console.error('Lỗi khi kiểm tra trạng thái giao dịch:', err);
      }
    }, 3000);

    return () => {
      clearInterval(countdownTimer);
      clearInterval(statusChecker);
    };
  }, [qrDetails]);

  const handleTimeout = async (txId: string) => {
    try {
      await axios.post(`/api/wallet/transactions/${txId}/cancel`);
      setError('Thời gian thanh toán đã hết hạn.');
    } catch (err) {
      console.error('Lỗi khi hủy giao dịch quá hạn:', err);
    } finally {
      setQrDetails(null);
      setAmount('');
    }
  };

  const handleCancelTransaction = async (txId: string) => {
    try {
      await axios.post(`/api/wallet/transactions/${txId}/cancel`);
      setError('Bạn đã hủy giao dịch.');
    } catch (err) {
      console.error('Lỗi khi hủy giao dịch:', err);
    } finally {
      setQrDetails(null);
      setAmount('');
    }
  };

  const handleDeposit = async () => {
    if (!amount || amount <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    setError('');
    setSuccess('');
    setGeneratingQr(true);
    const amountInVnd = amount * 1000;
    try {
      if (systemMode === 'SIMULATION') {
        await axios.post('/api/wallet/deposit', { amount: amountInVnd });
        setSuccess(`Đã nạp thành công ${formatDonut(amountInVnd)} vào tài khoản!`);
        setAmount('');
        await refreshBalance();
        await refreshTransactions();
      } else {
        const response = await axios.post('/api/wallet/deposit/qr', { amount: amountInVnd });
        setQrDetails(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi nạp tiền.');
    } finally {
      setGeneratingQr(false);
    }
  };



  const getTransactionTypeStyle = (type: string, description?: string) => {
    switch (type) {
      case 'DEPOSIT':
        return { color: 'var(--primary)', label: 'Nạp tiền' };
      case 'WITHDRAW':
        if (description && description.includes('Reset')) {
          return { color: 'var(--error)', label: 'Reset số dư' };
        }
        return { color: 'var(--error)', label: 'Rút tiền' };
      case 'BET_PLACED':
        return { color: 'var(--text-muted)', label: 'Đặt cược' };
      case 'WIN_PAYOUT':
        return { color: 'var(--accent)', label: 'Thưởng cược' };
      default:
        return { color: '#fff', label: type };
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            Thành công
          </span>
        );
      case 'PENDING':
        return (
          <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent)', border: '1px solid rgba(245, 158, 11, 0.3)', position: 'relative', paddingLeft: '20px' }}>
            <span style={{
              position: 'absolute',
              left: '6px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--accent)',
              animation: 'blink 1s infinite alternate'
            }} />
            Đang chờ
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="badge" style={{ background: 'rgba(156, 163, 175, 0.15)', color: 'rgb(209, 213, 219)', border: '1px solid rgba(156, 163, 175, 0.3)' }}>
            Hết hạn
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--error)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="badge badge-finished">
            {status}
          </span>
        );
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
        {systemMode === 'SIMULATION'
          ? 'Theo dõi số dư, nạp tiền tự do (Giả lập) và lịch sử giao dịch.'
          : 'Theo dõi số dư, nạp tiền qua VietQR và lịch sử giao dịch.'}
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
                {formatDonut(balance)}
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
                  {val} 🍩
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
            <label className="form-label">Nhập số tiền giao dịch (🍩)</label>
            <input
              type="number"
              className="form-input"
              placeholder="Nhập số lượng 🍩..."
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value === '' ? '' : parseInt(e.target.value));
                setError('');
                setSuccess('');
              }}
              disabled={loading || generatingQr}
            />
          </div>

          <div style={{ display: 'block' }}>
            <button
              className="btn btn-primary"
              style={{ display: 'flex', gap: '8px', padding: '12px', width: '100%', justifyContent: 'center' }}
              onClick={handleDeposit}
              disabled={loading || generatingQr}
            >
              <ArrowUpRight size={16} />
              {generatingQr ? (systemMode === 'SIMULATION' ? 'Đang nạp tiền...' : 'Đang tạo QR...') : 'Nạp tiền'}
            </button>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px', textAlign: 'center' }}>
            {systemMode === 'SIMULATION'
              ? '* Bạn đang ở chế độ giả lập: Tiền sẽ được cộng trực tiếp vào ví ngay lập tức mà không cần quét QR.'
              : '* Hệ thống sử dụng VietQR. Số tiền nạp sẽ tự động quét từ email và cộng vào tài khoản của bạn.'}
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
                  <th style={{ padding: '12px 8px' }}>Loại</th>
                  <th style={{ padding: '12px 8px' }}>Trạng thái</th>
                  <th style={{ padding: '12px 8px' }}>Mô tả</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => {
                  const txType = getTransactionTypeStyle(tx.type, tx.description);
                  const isNegative = tx.amount < 0;
                  
                  // Style based on status for a premium look
                  let amountColor = 'var(--primary)';
                  let amountDecoration = 'none';
                  let amountPrefix = isNegative ? '' : '+';
                  
                  if (tx.status === 'EXPIRED' || tx.status === 'CANCELLED') {
                    amountColor = 'var(--text-muted)';
                    amountDecoration = 'line-through';
                    amountPrefix = ''; // No plus for failed ones
                  } else if (tx.status === 'PENDING') {
                    amountColor = 'var(--accent)';
                    amountPrefix = ''; // No plus sign for pending
                  } else if (isNegative) {
                    amountColor = 'var(--error)';
                  }

                  return (
                    <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '14px' }}>
                      <td style={{ padding: '14px 8px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} />
                        {formatTxDate(tx.createdAt)}
                      </td>
                      <td style={{ padding: '14px 8px', fontWeight: 600, color: txType.color }}>
                        {txType.label}
                      </td>
                      <td style={{ padding: '14px 8px' }}>
                        {renderStatusBadge(tx.status)}
                      </td>
                      <td style={{ padding: '14px 8px', color: '#fff' }}>
                        {tx.description}
                        {tx.bankTxId && (
                          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>
                            Mã GD: {tx.bankTxId}
                          </span>
                        )}
                      </td>
                      <td style={{
                        padding: '14px 8px',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: amountColor,
                        textDecoration: amountDecoration
                      }}>
                        {amountPrefix}{formatDonut(Math.abs(tx.amount))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VietQR Payment Modal */}
      {qrDetails && (
        <div className="modal-overlay" style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="modal-container glass-panel" style={{
            maxWidth: '480px',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(15, 23, 42, 0.95)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            padding: '30px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Header */}
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                Quét mã VietQR nạp tiền
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Sử dụng ứng dụng Ngân hàng (Mobile Banking) để quét mã QR bên dưới
              </p>
            </div>

            {/* Countdown timer */}
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '12px',
              padding: '10px',
              color: 'var(--error)',
              fontSize: '15px',
              fontWeight: 700,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>Hết hạn sau:</span>
              <span style={{ fontFamily: 'monospace', fontSize: '18px' }}>{formatTime(timeLeft)}</span>
            </div>

            {/* QR Code Frame */}
            <div style={{
              background: '#fff',
              padding: '16px',
              borderRadius: '16px',
              display: 'inline-block',
              margin: '0 auto',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              maxWidth: '220px'
            }}>
              <img
                src={qrDetails.qrDataURL}
                alt="VietQR Code"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>

            {/* Payment Details Card */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              textAlign: 'left'
            }}>
              {/* Bank */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Ngân hàng</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>BVBank (Bản Việt)</span>
              </div>

              {/* Account Number */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Số tài khoản</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#fff', fontFamily: 'monospace', fontSize: '15px' }}>{qrDetails.accountNo}</span>
                  <button
                    onClick={() => handleCopy(qrDetails.accountNo, 'accountNo')}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '2px' }}
                    title="Copy"
                  >
                    {copiedField === 'accountNo' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Account Name */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Chủ tài khoản</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>{qrDetails.accountName}</span>
              </div>

              {/* Amount */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Số tiền</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '16px' }}>
                    {formatDonut(qrDetails.amount)}
                  </span>
                  <button
                    onClick={() => handleCopy(qrDetails.amount.toString(), 'amount')}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '2px' }}
                    title="Copy"
                  >
                    {copiedField === 'amount' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Transfer Message / addInfo */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                borderTop: '1px dashed var(--border)',
                paddingTop: '12px'
              }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Nội dung chuyển khoản (bắt buộc ghi đúng)</span>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.5px', fontFamily: 'monospace', fontSize: '15px' }}>
                    {qrDetails.addInfo}
                  </span>
                  <button
                    onClick={() => handleCopy(qrDetails.addInfo, 'addInfo')}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '2px' }}
                    title="Copy"
                  >
                    {copiedField === 'addInfo' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Copy Notification Toast inside modal */}
            {copiedField && (
              <div style={{
                fontSize: '12px',
                color: 'var(--primary)',
                background: 'rgba(16, 185, 129, 0.05)',
                padding: '6px',
                borderRadius: '6px',
                marginTop: '-10px'
              }}>
                Đã sao chép vào bộ nhớ tạm!
              </div>
            )}

            {/* Verification Status display */}
            {checkingPayment ? (
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                fontSize: '13px',
                color: 'var(--primary)',
                fontWeight: 600
              }}>
                <Loader2 size={16} className="animate-spin" />
                <span>Đang quét giao dịch từ ngân hàng của bạn...</span>
              </div>
            ) : (
              <div style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '12px',
                color: 'var(--accent)',
                textAlign: 'left',
                lineHeight: '1.4'
              }}>
                *  Vui lòng bấm <strong>"Tôi đã chuyển khoản"</strong> sau khi thực hiện chuyển tiền thành công. Hệ thống sẽ tự động cộng tiền vào Ví
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px', marginTop: '8px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => handleCancelTransaction(qrDetails.transactionId)}
                disabled={loading}
                style={{ padding: '12px' }}
              >
                Hủy
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setCheckingPayment(true)}
                disabled={loading || checkingPayment}
                style={{ padding: '12px', display: 'flex', gap: '6px', justifyContent: 'center' }}
              >
                Tôi đã chuyển khoản
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
