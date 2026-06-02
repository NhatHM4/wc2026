import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Users, ShieldCheck, Activity,
  ArrowUpRight, ArrowDownLeft, Landmark, RefreshCw, AlertCircle, Sparkles, BookOpen, Calendar
} from 'lucide-react';

interface SystemStats {
  totalUsers: number;
  totalBetsCount: number;
  totalBetsAmount: number;
  totalPayoutsAmount: number;
  totalDepositsAmount: number;
  totalWithdrawalsAmount: number;
  totalActiveMatchPools: number;
  totalWalletsBalance: number;
  jackpotAmount: number;
  platformFeeCollected: number;
  systemMode: 'REAL' | 'SIMULATION';
}

interface SettleLog {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  matchTime: string;
  poolAmount: number;
  platformFee: number;
  netPool: number;
  winnersCount: number;
  rolledToJackpot: boolean;
}

interface AdminResetLog {
  id: string;
  username: string;
  amount: number;
  description: string;
  createdAt: string;
}

const StatsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [historyData, setHistoryData] = useState<{ settleLogs: SettleLog[]; adminResetLogs: AdminResetLog[] }>({
    settleLogs: [],
    adminResetLogs: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'settle' | 'admin'>('settle');

  const fetchData = async () => {
    try {
      const [statsRes, historyRes] = await Promise.all([
        axios.get('/api/system/stats'),
        axios.get('/api/system/history')
      ]);
      setStats(statsRes.data);
      setHistoryData(historyRes.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải thống kê hệ thống.');
    }
  };

  useEffect(() => {
    if (stats && stats.systemMode !== 'REAL') {
      navigate('/');
    }
  }, [stats, navigate]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    init();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const formatDateTime = (dateString: string) => {
    const formatted = dateString.endsWith('Z') || dateString.includes('+') ? dateString : dateString + 'Z';
    const d = new Date(formatted);
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px' }}>
          <RefreshCw className="spin-anim" size={40} style={{ color: 'var(--primary)' }} />
          <p style={{ fontWeight: 500 }}>Đang tải dữ liệu tổng quan hệ thống...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="container" style={{ padding: '80px 16px', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
          <AlertCircle size={48} style={{ color: 'var(--error)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Đã xảy ra lỗi</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px', marginBottom: '24px' }}>{error || 'Không có dữ liệu.'}</p>
          <button className="btn btn-primary" onClick={fetchData}>Thử lại</button>
        </div>
      </div>
    );
  }

  // Zero-Sum Math calculations
  const netDeposits = stats.totalDepositsAmount - stats.totalWithdrawalsAmount;
  const netAssets = stats.totalWalletsBalance + stats.totalActiveMatchPools + stats.jackpotAmount + stats.platformFeeCollected;
  const discrepancy = Math.abs(netDeposits - netAssets);
  const isBalanced = discrepancy < 1; // tolerance for double precision float rounding

  // Asset distribution percentages
  const totalAssets = netAssets > 0 ? netAssets : 1;
  const walletPct = (stats.totalWalletsBalance / totalAssets) * 100;
  const activePoolPct = (stats.totalActiveMatchPools / totalAssets) * 100;
  const jackpotPct = (stats.jackpotAmount / totalAssets) * 100;
  const feePct = (stats.platformFeeCollected / totalAssets) * 100;

  return (
    <div className="container" style={{ padding: '40px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>Tổng quan hệ thống</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Theo dõi tính chất Tổng bằng không (Zero-sum) và phân phối dòng tiền trong hệ thống.
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={handleRefresh}
          disabled={refreshing}
          style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
        >
          <RefreshCw size={16} className={refreshing ? 'spin-anim' : ''} />
          {refreshing ? 'Đang cập nhật...' : 'Cập nhật số liệu'}
        </button>
      </div>

      {/* Main Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>

        {/* Deposit Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', padding: '12px', color: 'var(--primary)' }}>
            <ArrowUpRight size={28} />
          </div>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tổng tiền nạp</span>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>
              +{stats.totalDepositsAmount.toLocaleString('vi-VN')}đ
            </h3>
          </div>
        </div>

        {/* Withdrawals/Reset Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', padding: '12px', color: 'var(--error)' }}>
            <ArrowDownLeft size={28} />
          </div>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tiền rút / Admin Reset</span>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>
              -{stats.totalWithdrawalsAmount.toLocaleString('vi-VN')}đ
            </h3>
          </div>
        </div>

        {/* Total Users Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', padding: '12px', color: '#60a5fa' }}>
            <Users size={28} />
          </div>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tổng thành viên</span>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>
              {stats.totalUsers} thành viên
            </h3>
          </div>
        </div>

        {/* Total Bets Count Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', padding: '12px', color: 'var(--accent)' }}>
            <Activity size={28} />
          </div>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tổng lượt đặt cược</span>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>
              {stats.totalBetsCount} lượt cược
            </h3>
          </div>
        </div>
      </div>

      {/* Zero-Sum Audit Equation Panel */}
      <div className="glass-panel" style={{
        padding: '30px',
        marginBottom: '32px',
        border: isBalanced ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
        background: isBalanced ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(0, 0, 0, 0.1))' : 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(0, 0, 0, 0.1))',
        borderRadius: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={24} style={{ color: isBalanced ? 'var(--primary)' : 'var(--error)' }} />
              <h2 style={{ fontSize: '22px', fontWeight: 800 }}>Kiểm toán Zero-Sum hệ thống</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
              Trong game có tổng bằng 0, lượng tiền ròng chảy vào (Nạp - Rút) phải khớp chính xác với tổng tài sản hiện có trong hệ thống.
            </p>
          </div>
          <span style={{
            padding: '6px 14px',
            borderRadius: '99px',
            fontSize: '13px',
            fontWeight: 700,
            background: isBalanced ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: isBalanced ? 'var(--primary)' : 'var(--error)',
            border: isBalanced ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            {isBalanced ? '✓ KHỚP 100% (KHÔNG THẤT THOÁT)' : '⚠ CHÊNH LỆCH'}
          </span>
        </div>

        {/* Visual Balance Scales */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '30px', alignItems: 'center', flexWrap: 'wrap', margin: '20px 0' }}>

          {/* Left: Money Inflow */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Nguồn tiền ròng (Inflow)</span>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#fff', margin: '8px 0' }}>
              {netDeposits.toLocaleString('vi-VN')}đ
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Tổng Nạp ({stats.totalDepositsAmount.toLocaleString('vi-VN')}đ) - Tổng Rút/Reset ({stats.totalWithdrawalsAmount.toLocaleString('vi-VN')}đ)
            </span>
          </div>

          {/* Equal Sign */}
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'center' }}>=</div>

          {/* Right: Asset Allocation */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Tổng tài sản hiện tại (Assets)</span>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--primary)', margin: '8px 0' }}>
              {netAssets.toLocaleString('vi-VN')}đ
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Ví ({stats.totalWalletsBalance.toLocaleString('vi-VN')}đ) + Active Pools ({stats.totalActiveMatchPools.toLocaleString('vi-VN')}đ) + Jackpot + Quỹ nhậu
            </span>
          </div>
        </div>
      </div>

      {/* Asset Allocation & Zero Sum Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '30px', marginBottom: '32px' }}>

        {/* Money Allocation Details */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Landmark size={20} style={{ color: 'var(--primary)' }} />
            Phân bổ tài sản trong hệ thống
          </h3>

          {/* Custom Visual Distribution Chart Bar */}
          <div style={{ display: 'flex', height: '24px', borderRadius: '12px', overflow: 'hidden', margin: '24px 0 32px 0', background: 'rgba(255,255,255,0.05)' }}>
            <div style={{ width: `${walletPct}%`, background: 'var(--primary)' }} title={`Số dư ví: ${walletPct.toFixed(1)}%`} />
            <div style={{ width: `${activePoolPct}%`, background: '#60a5fa' }} title={`Quỹ cược active: ${activePoolPct.toFixed(1)}%`} />
            <div style={{ width: `${jackpotPct}%`, background: 'var(--accent)' }} title={`Jackpot: ${jackpotPct.toFixed(1)}%`} />
            <div style={{ width: `${feePct}%`, background: 'var(--error)' }} title={`Quỹ nhậu: ${feePct.toFixed(1)}%`} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Wallet Balances */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)' }} />
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>Số dư ví thành viên</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ fontSize: '15px' }}>{stats.totalWalletsBalance.toLocaleString('vi-VN')}đ</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>({walletPct.toFixed(1)}%)</span>
              </div>
            </div>

            {/* Active Pools */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#60a5fa' }} />
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>Quỹ cược trận chưa quyết toán</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ fontSize: '15px' }}>{stats.totalActiveMatchPools.toLocaleString('vi-VN')}đ</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>({activePoolPct.toFixed(1)}%)</span>
              </div>
            </div>

            {/* Jackpot pool */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent)' }} />
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>Quỹ Jackpot tích lũy</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ fontSize: '15px' }}>{stats.jackpotAmount.toLocaleString('vi-VN')}đ</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>({jackpotPct.toFixed(1)}%)</span>
              </div>
            </div>

            {/* Platform Fees */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--error)' }} />
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>Doanh thu hệ thống (Quỹ nhậu 10%)</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ fontSize: '15px' }}>{stats.platformFeeCollected.toLocaleString('vi-VN')}đ</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>({feePct.toFixed(1)}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Explain Closed Loop system */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} style={{ color: 'var(--accent)' }} />
            Quy trình luân chuyển dòng tiền
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px', lineHeight: '1.5', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ fontWeight: 800, color: 'var(--primary)' }}>1.</div>
              <div>
                <strong style={{ color: '#fff' }}>Nạp tiền:</strong> Người chơi nạp tiền qua VietQR, tiền được chuyển vào tài khoản ngân hàng thật của Admin và số dư tương ứng được cộng vào Ví của người chơi.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ fontWeight: 800, color: 'var(--primary)' }}>2.</div>
              <div>
                <strong style={{ color: '#fff' }}>Đặt cược:</strong> Khi dự đoán tỉ số, người chơi bị trừ cố định <strong style={{ color: 'var(--accent)' }}>10.000 VND</strong> từ ví. Số tiền này chuyển trực tiếp vào Quỹ cược trận đấu (Match Pool).
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ fontWeight: 800, color: 'var(--primary)' }}>3.</div>
              <div>
                <strong style={{ color: '#fff' }}>Quyết toán trận đấu (Settle):</strong>
                <ul style={{ paddingLeft: '20px', marginTop: '6px', listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Trích <strong style={{ color: 'var(--error)' }}>10%</strong> làm Quỹ nhậu của hệ thống.</li>
                  <li>Còn lại <strong style={{ color: 'var(--primary)' }}>90%</strong> net pool sẽ được chia đều cho những người đoán trúng.</li>
                  <li>Nếu trận đấu <strong style={{ color: 'var(--accent)' }}>không có ai đoán trúng</strong>, toàn bộ 90% net pool được chuyển vào Quỹ Jackpot tích lũy và sẽ cộng dồn vào trận thắng tiếp theo.</li>
                </ul>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', borderTop: '1px dashed var(--border)', paddingTop: '12px', marginTop: '4px' }}>
              <Sparkles size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <div style={{ fontStyle: 'italic', fontSize: '13px' }}>
                Hệ thống luôn khép kín, tiền không tự mất đi hay sinh ra, chỉ được tái phân phối giữa những người chơi dựa trên kết quả các trận đấu thực tế.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ledger History upgrade - Applied tabbed viewer */}
      <div className="glass-panel" style={{ padding: '28px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} style={{ color: 'var(--primary)' }} />
            Nhật ký giao dịch hệ thống (System Ledgers)
          </h3>

          {/* Tab buttons */}
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <button
              onClick={() => setActiveHistoryTab('settle')}
              style={{
                background: activeHistoryTab === 'settle' ? 'var(--primary)' : 'transparent',
                color: activeHistoryTab === 'settle' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                transition: 'all 0.2s'
              }}
            >
              Quyết toán & Phí hệ thống
            </button>
            <button
              onClick={() => setActiveHistoryTab('admin')}
              style={{
                background: activeHistoryTab === 'admin' ? 'var(--primary)' : 'transparent',
                color: activeHistoryTab === 'admin' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                transition: 'all 0.2s'
              }}
            >
              Nhật ký Admin Reset số dư
            </button>
          </div>
        </div>

        {activeHistoryTab === 'settle' ? (
          historyData.settleLogs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '16px 0' }}>Chưa có trận đấu nào được quyết toán chia thưởng.</p>
          ) : (
            <div className="table-scroll-container">
              <table>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '13px' }}>
                    <th style={{ padding: '10px 8px' }}>Thời gian đá</th>
                    <th style={{ padding: '10px 8px' }}>Trận đấu</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Tỉ số</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>Tổng Pool cược</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>Quỹ nhậu (10%)</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>Net Pool (90%)</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Chi tiết chia thưởng</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.settleLogs.map((log, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '13px' }}>
                      <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>
                        {formatDateTime(log.matchTime)}
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                        {log.homeTeam} vs {log.awayTeam}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 700, color: 'var(--accent)' }}>
                        {log.homeScore} - {log.awayScore}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>
                        {log.poolAmount.toLocaleString('vi-VN')}đ
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--error)', fontWeight: 600 }}>
                        {log.platformFee.toLocaleString('vi-VN')}đ
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--primary)', fontWeight: 600 }}>
                        {log.netPool.toLocaleString('vi-VN')}đ
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        {log.rolledToJackpot ? (
                          <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                            Không ai trúng $\rightarrow$ Vào Jackpot
                          </span>
                        ) : log.winnersCount > 0 ? (
                          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                            Chia cho {log.winnersCount} vé thắng cuộc
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Pool rỗng</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          historyData.adminResetLogs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '16px 0' }}>Chưa có bản ghi reset số dư nào được thực hiện.</p>
          ) : (
            <div className="table-scroll-container">
              <table>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '13px' }}>
                    <th style={{ padding: '10px 8px' }}>Thời gian thực hiện</th>
                    <th style={{ padding: '10px 8px' }}>Tài khoản reset</th>
                    <th style={{ padding: '10px 8px' }}>Mô tả hành động</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>Số dư thu hồi</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.adminResetLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '13px' }}>
                      <td style={{ padding: '12px 8px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} />
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--text-main)' }}>
                        @{log.username}
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>
                        {log.description}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--error)' }}>
                        -{log.amount.toLocaleString('vi-VN')} VND
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default StatsDashboard;
