import React, { useState } from 'react';
import axios from 'axios';
import { useWallet } from '../context/WalletContext';
import { X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  matchTime: string;
  poolAmount: number;
}

interface BetModalProps {
  match: Match;
  onClose: () => void;
  onSuccess: () => void;
}

const BetModal: React.FC<BetModalProps> = ({ match, onClose, onSuccess }) => {
  const { balance, refreshBalance } = useWallet();
  const [homeScore, setHomeScore] = useState<number | ''>('');
  const [awayScore, setAwayScore] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const FIXED_BET_AMOUNT = 10000;
  const isBalanceInsufficient = balance < FIXED_BET_AMOUNT;

  // Danh sách các tỉ số phổ biến để lựa chọn
  const scoreOptions = {
    homeWins: [
      [1, 0], [2, 0], [2, 1], [3, 0], [3, 1], [3, 2], [4, 0], [4, 1]
    ],
    draws: [
      [0, 0], [1, 1], [2, 2], [3, 3]
    ],
    awayWins: [
      [0, 1], [0, 2], [1, 2], [0, 3], [1, 3], [2, 3], [0, 4], [1, 4]
    ]
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (homeScore === '' || awayScore === '') {
      setError('Vui lòng chọn tỉ số dự đoán');
      return;
    }

    if (isBalanceInsufficient) {
      setError('Số dư ví không đủ 10,000 VND. Vui lòng nạp thêm tiền.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await axios.post('/api/bets', {
        matchId: match.id,
        predictedHomeScore: homeScore,
        predictedAwayScore: awayScore
      });

      setSuccess('Đặt cược tỉ số thành công!');
      await refreshBalance();
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã có lỗi xảy ra khi đặt cược.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-container">
        {/* Close Button */}
        <button onClick={onClose} style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer'
        }}>
          <X size={24} />
        </button>

        <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>
          Đặt cược tỉ số
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
          Dự đoán kết quả chính xác cho trận đấu
        </p>

        {/* Team Match Info */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <span style={{ fontWeight: 700, fontSize: '16px' }}>{match.homeTeam}</span>
            <span style={{ color: 'var(--accent)', fontWeight: 800 }}>VS</span>
            <span style={{ fontWeight: 700, fontSize: '16px' }}>{match.awayTeam}</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Tổng tiền cược hiện tại: <strong>{match.poolAmount.toLocaleString('vi-VN')} VND</strong>
          </div>
        </div>

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
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Chọn tỉ số */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ marginBottom: '12px', fontWeight: 600 }}>Chọn tỉ số dự đoán</label>
            
            <div className="score-columns-container">
              {/* Cột Đội nhà thắng */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: 'rgba(16, 185, 129, 0.05)',
                  padding: '6px 4px',
                  borderRadius: '6px',
                  border: '1px solid rgba(16, 185, 129, 0.1)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {match.homeTeam} thắng
                </div>
                <div className="score-buttons-list">
                  {scoreOptions.homeWins.map(([h, a]) => {
                    const isSelected = homeScore === h && awayScore === a;
                    return (
                      <button
                        key={`${h}-${a}`}
                        type="button"
                        className={`score-option-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          setHomeScore(h);
                          setAwayScore(a);
                        }}
                        disabled={loading || success !== ''}
                      >
                        {h} - {a}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cột Hòa */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '6px 4px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  Hòa
                </div>
                <div className="score-buttons-list">
                  {scoreOptions.draws.map(([h, a]) => {
                    const isSelected = homeScore === h && awayScore === a;
                    return (
                      <button
                        key={`${h}-${a}`}
                        type="button"
                        className={`score-option-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          setHomeScore(h);
                          setAwayScore(a);
                        }}
                        disabled={loading || success !== ''}
                      >
                        {h} - {a}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cột Đội khách thắng */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--error)',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: 'rgba(239, 68, 68, 0.05)',
                  padding: '6px 4px',
                  borderRadius: '6px',
                  border: '1px solid rgba(239, 68, 68, 0.1)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {match.awayTeam} thắng
                </div>
                <div className="score-buttons-list">
                  {scoreOptions.awayWins.map(([h, a]) => {
                    const isSelected = homeScore === h && awayScore === a;
                    return (
                      <button
                        key={`${h}-${a}`}
                        type="button"
                        className={`score-option-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          setHomeScore(h);
                          setAwayScore(a);
                        }}
                        disabled={loading || success !== ''}
                      >
                        {h} - {a}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Hiển thị tỉ số đã chọn */}
            {homeScore !== '' && awayScore !== '' && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px dashed var(--primary)',
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'center',
                fontSize: '15px',
                fontWeight: 600,
                color: '#fff',
                marginBottom: '16px'
              }}>
                Tỉ số dự đoán đã chọn: <span style={{ color: 'var(--primary)', fontSize: '18px', fontWeight: 800 }}>{homeScore} - {awayScore}</span>
              </div>
            )}
          </div>

          {/* Bet Amount (Read-only) */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Số tiền đặt cược</label>
            <input
              type="text"
              className="form-input"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--accent)',
                fontWeight: 700,
                cursor: 'not-allowed'
              }}
              value="10,000 VND (Mặc định cố định)"
              readOnly
            />
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Mỗi vé cược tỉ số được quy định cố định là 10,000 VND. Số dư ví hiện tại: <strong>{balance.toLocaleString('vi-VN')} VND</strong>
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || isBalanceInsufficient || success !== ''}
            >
              {loading ? 'Đang cược...' : 'Đặt Cược'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BetModal;
