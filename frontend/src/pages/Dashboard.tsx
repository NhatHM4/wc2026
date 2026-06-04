import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import BetModal from '../components/BetModal';
import { Trophy, RefreshCw, AlertCircle, Coins, CheckCircle, Clock } from 'lucide-react';
import { formatDonut } from '../utils/currency';

interface Match {
  id: string;
  apiMatchId: number;
  homeTeam: string;
  awayTeam: string;
  matchTime: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  poolAmount: number;
  settled: boolean;
}

interface SystemFund {
  jackpotAmount: number;
  platformFeeCollected: number;
  systemMode?: 'REAL' | 'SIMULATION';
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { refreshBalance } = useWallet();
  const [matches, setMatches] = useState<Match[]>([]);
  const [systemFund, setSystemFund] = useState<SystemFund>({ jackpotAmount: 0, platformFeeCollected: 0 });
  const [activeTab, setActiveTab] = useState<'SCHEDULED' | 'IN_PLAY' | 'FINISHED'>('SCHEDULED');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [myBets, setMyBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [matchLimit, setMatchLimit] = useState<number | 'ALL'>(3);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [matchBets, setMatchBets] = useState<Record<string, any[]>>({});
  const [loadingMatchBets, setLoadingMatchBets] = useState<Record<string, boolean>>({});

  const fetchMatches = async () => {
    try {
      const response = await axios.get('/api/matches');
      setMatches(response.data);
    } catch (error) {
      console.error('Không thể lấy lịch thi đấu:', error);
    }
  };

  const fetchSystemFund = async () => {
    try {
      const response = await axios.get('/api/system/fund');
      setSystemFund(response.data);
    } catch (error) {
      console.error('Không thể lấy thông tin quỹ chung:', error);
    }
  };

  const fetchMyBets = async () => {
    if (!user) return;
    try {
      const response = await axios.get('/api/bets/my');
      setMyBets(response.data);
    } catch (error) {
      console.error('Không thể lấy danh sách vé cược cá nhân:', error);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await axios.post('/api/matches/sync');
      await fetchMatches();
      await fetchSystemFund();
      if (user) {
        await fetchMyBets();
        await refreshBalance();
      }
    } catch (error) {
      alert('Đồng bộ thất bại, vui lòng kiểm tra kết nối API');
    } finally {
      setSyncing(false);
    }
  };

  const handleSettle = async (matchId: string) => {
    setSettlingId(matchId);
    try {
      await axios.post(`/api/bets/settle/${matchId}`);
      await fetchMatches();
      await fetchSystemFund();
      if (user) {
        await fetchMyBets();
        await refreshBalance();
      }
      alert('Đã thanh toán tiền thưởng trận đấu thành công!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Thanh toán thất bại');
    } finally {
      setSettlingId(null);
    }
  };

  const reloadBets = async (matchId: string) => {
    try {
      const response = await axios.get(`/api/bets/match/${matchId}`);
      setMatchBets(prev => ({ ...prev, [matchId]: response.data }));
    } catch (err) {
      console.error('Không thể tải chi tiết cược:', err);
    }
  };

  const handleToggleExpand = async (matchId: string) => {
    if (expandedMatchId === matchId) {
      setExpandedMatchId(null);
      return;
    }

    setExpandedMatchId(matchId);

    if (!matchBets[matchId]) {
      setLoadingMatchBets(prev => ({ ...prev, [matchId]: true }));
      try {
        const response = await axios.get(`/api/bets/match/${matchId}`);
        setMatchBets(prev => ({ ...prev, [matchId]: response.data }));
      } catch (err) {
        console.error('Không thể tải chi tiết cược:', err);
      } finally {
        setLoadingMatchBets(prev => ({ ...prev, [matchId]: false }));
      }
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchMatches(), fetchSystemFund(), fetchMyBets()]);
      setLoading(false);
    };
    initData();
  }, [user]);

  const isRealAPIMatch = (apiMatchId: number) => {
    return apiMatchId > 100004 && apiMatchId < 1000000000;
  };

  let filteredMatches = matches.filter(m =>
    m.status === activeTab &&
    (m.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Nếu ở chế độ REAL, chỉ hiển thị các trận lấy từ API
  if (systemFund.systemMode === 'REAL') {
    filteredMatches = filteredMatches.filter(m => isRealAPIMatch(m.apiMatchId));
  }

  // Lọc theo giới hạn số lượng trận đấu gần nhất
  if (matchLimit !== 'ALL') {
    filteredMatches = [...filteredMatches];
    if (activeTab === 'SCHEDULED') {
      // Sắp đá: trận sắp diễn ra nhất xếp trước (tăng dần)
      filteredMatches.sort((a, b) => new Date(a.matchTime + 'Z').getTime() - new Date(b.matchTime + 'Z').getTime());
    } else if (activeTab === 'FINISHED') {
      // Đã đấu: trận vừa xong nhất xếp trước (giảm dần)
      filteredMatches.sort((a, b) => new Date(b.matchTime + 'Z').getTime() - new Date(a.matchTime + 'Z').getTime());
    } else {
      // Đang diễn ra: giảm dần
      filteredMatches.sort((a, b) => new Date(b.matchTime + 'Z').getTime() - new Date(a.matchTime + 'Z').getTime());
    }
    filteredMatches = filteredMatches.slice(0, matchLimit);
  }

  const getMatchDateString = (utcString: string) => {
    const formattedString = (utcString.endsWith('Z') || utcString.includes('+'))
      ? utcString
      : utcString + 'Z';
    const d = new Date(formattedString);
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Map Match ID sang Teams để hiển thị thông tin vé cược dễ nhìn hơn
  const getMatchDetails = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    return match ? `${match.homeTeam} vs ${match.awayTeam}` : 'Trận đấu ẩn';
  };

  const getMatchStatusText = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return 'Không rõ';
    if (match.status === 'SCHEDULED') return 'Chưa đá';
    if (match.status === 'IN_PLAY') return 'Đang diễn ra';
    return `Đã kết thúc (${match.homeScore}-${match.awayScore})`;
  };

  return (
    <div className="container" style={{ padding: '40px 16px' }}>
      {/* Header & Sync */}
      <div className="dashboard-header">
        <div className="dashboard-title-group">
          <h1>WORLD CUP 2026</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Dự đoán chính xác tỉ số - Chia nhau giải thưởng khổng lồ
          </p>
        </div>

        {systemFund.systemMode === 'REAL' && (
          <button
            className="btn btn-secondary"
            onClick={handleSync}
            disabled={syncing}
            style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
          >
            <RefreshCw size={16} className={syncing ? 'spin-anim' : ''} />
            {syncing ? 'Đang đồng bộ...' : 'Đồng bộ dữ liệu'}
          </button>
        )}
      </div>

      {/* Jackpot & Platform Stats */}
      <div className="glass-panel glow-amber jackpot-panel">
        <div className="jackpot-info">
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            borderRadius: '16px',
            padding: '20px',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Trophy size={48} />
          </div>
          <div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Jackpot
            </span>
            <h2 className="jackpot-amount">
              {formatDonut(systemFund.jackpotAmount)}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              * Quỹ này được dồn từ các trận đấu không có người thắng cược tỉ số!
            </p>
          </div>
        </div>

        <div className="jackpot-stats">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500 }}>
            <Coins size={16} style={{ color: 'var(--primary)' }} />
            Quỹ nhậu đã trích (10%) từ mỗi trận:
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginTop: '6px' }}>
            {formatDonut(systemFund.platformFeeCollected)}
          </div>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="tabs-container">
        {[
          { key: 'SCHEDULED', label: 'Sắp thi đấu' },
          { key: 'IN_PLAY', label: 'Đang diễn ra' },
          { key: 'FINISHED', label: 'Đã kết thúc' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
              fontSize: '16px',
              fontWeight: 700,
              padding: '12px 8px',
              cursor: 'pointer',
              borderBottom: activeTab === tab.key ? '3px solid var(--primary)' : '3px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bộ lọc Tìm kiếm & Lọc giới hạn trận đấu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, maxWidth: '400px', minWidth: '280px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Tìm kiếm nhanh trận đấu theo tên đội..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>Hiển thị:</span>
          <select
            value={matchLimit}
            onChange={(e) => {
              const val = e.target.value;
              setMatchLimit(val === 'ALL' ? 'ALL' : parseInt(val));
            }}
            className="form-input"
            style={{
              width: '180px',
              padding: '8px 12px',
              background: 'var(--card)',
              color: '#fff',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            <option value={3}>3 trận gần nhất</option>
            <option value={5}>5 trận gần nhất</option>
            <option value={10}>10 trận gần nhất</option>
            <option value="ALL">Tất cả trận đấu</option>
          </select>
        </div>
      </div>

      {/* Matches Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Đang tải dữ liệu trận đấu...
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <AlertCircle size={40} style={{ marginBottom: '16px', color: 'var(--text-muted)' }} />
          <div>Không có trận đấu nào trong trạng thái này.</div>
        </div>
      ) : (
        <div className="matches-grid">
          {filteredMatches.map(match => (
            <div key={match.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Match Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {getMatchDateString(match.matchTime)}
                </span>

                {match.status === 'SCHEDULED' && <span className="badge badge-scheduled">Chưa đá</span>}
                {match.status === 'IN_PLAY' && <span className="badge badge-inplay">Đang đá</span>}
                {match.status === 'FINISHED' && <span className="badge badge-finished">Đã kết thúc</span>}
              </div>

              {/* Teams & Score */}
              <div className="match-teams-container">
                <div className="match-team-name-left">{match.homeTeam}</div>

                <div className="match-score-display" style={{
                  color: match.status === 'FINISHED' ? 'var(--accent)' : '#fff',
                }}>
                  {match.status === 'SCHEDULED' ? 'vs' : `${match.homeScore} - ${match.awayScore}`}
                </div>

                <div className="match-team-name-right">{match.awayTeam}</div>
              </div>

              {/* Match Footer */}
              <div style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '16px',
                marginTop: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span
                  onClick={() => handleToggleExpand(match.id)}
                  style={{ fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', userSelect: 'none' }}
                  title="Click để xem chi tiết người đặt cược"
                >
                  Tổng cược: <strong style={{ color: '#fff' }}>{formatDonut(match.poolAmount)}</strong>
                  <span style={{ color: 'var(--primary)', fontSize: '11px', display: 'inline-flex', alignItems: 'center' }}>
                    {expandedMatchId === match.id ? '▲ Thu gọn' : '▼ Chi tiết'}
                  </span>
                </span>

                {match.status === 'SCHEDULED' && (
                  new Date() < new Date(match.matchTime.endsWith('Z') || match.matchTime.includes('+') ? match.matchTime : match.matchTime + 'Z') ? (
                    user ? (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '8px 16px', fontSize: '13px' }}
                        onClick={() => setSelectedMatch(match)}
                      >
                        Dự đoán tỉ số
                      </button>
                    ) : (
                      <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>
                        Đăng nhập để đặt cược
                      </span>
                    )
                  ) : (
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Đã đóng cổng đặt cược
                    </span>
                  )
                )}

                {match.status === 'FINISHED' && (
                  match.settled ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontSize: '13px', fontWeight: 600 }}>
                      <CheckCircle size={14} /> Đã trả thưởng
                    </span>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontSize: '12px', fontWeight: 600 }}>
                        <Clock size={12} /> Chờ giải ngân
                      </span>
                      {/* Cho phép dev click settle nhanh để kiểm tra kết quả */}
                      <button
                        className="btn btn-primary"
                        style={{ padding: '6px 10px', fontSize: '11px', background: 'var(--accent)', boxShadow: 'none' }}
                        onClick={() => handleSettle(match.id)}
                        disabled={settlingId === match.id}
                      >
                        {settlingId === match.id ? '...' : 'Settle'}
                      </button>
                    </div>
                  )
                )}
              </div>

              {expandedMatchId === match.id && (
                <div style={{
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px dashed var(--border)',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  textAlign: 'left'
                }}>
                  <div style={{ fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                    Danh sách dự đoán ({matchBets[match.id]?.length || 0}):
                  </div>
                  {loadingMatchBets[match.id] ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Đang tải danh sách...</div>
                  ) : !matchBets[match.id] || matchBets[match.id].length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>Chưa có người nào đặt cược.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto', paddingRight: '4px' }}>
                      {matchBets[match.id].map((bet: any) => (
                        <div key={bet.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          background: 'rgba(255, 255, 255, 0.02)',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid rgba(255, 255, 255, 0.03)'
                        }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>@{bet.username}</span>
                          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
                            {bet.predictedHomeScore} - {bet.predictedAwayScore}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* User Bets History */}
      {user && (
        <div className="glass-panel" style={{ padding: '32px', marginTop: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px', textAlign: 'left', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            Vé cược tỉ số của bạn
          </h3>

          {myBets.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'left' }}>Bạn chưa đặt cược trận đấu nào.</p>
          ) : (
            <div className="table-scroll-container">
              <table>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '14px' }}>
                    <th style={{ padding: '12px 8px' }}>Trận đấu</th>
                    <th style={{ padding: '12px 8px' }}>Trạng thái trận</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>Dự đoán tỉ số</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Tiền đặt cược</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Thưởng nhận được</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>Kết quả cược</th>
                  </tr>
                </thead>
                <tbody>
                  {myBets.map((bet: any) => (
                    <tr key={bet.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '14px' }}>
                      <td style={{ padding: '14px 8px', fontWeight: 600 }}>{getMatchDetails(bet.matchId)}</td>
                      <td style={{ padding: '14px 8px', color: 'var(--text-muted)' }}>{getMatchStatusText(bet.matchId)}</td>
                      <td style={{ padding: '14px 8px', textAlign: 'center', fontWeight: 700, color: 'var(--accent)' }}>
                        {bet.predictedHomeScore} - {bet.predictedAwayScore}
                      </td>
                      <td style={{ padding: '14px 8px', textAlign: 'right' }}>{formatDonut(bet.betAmount)}</td>
                      <td style={{ padding: '14px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                        {bet.settled && bet.payoutAmount > 0 ? `+${formatDonut(bet.payoutAmount)}` : '-'}
                      </td>
                      <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                        {bet.settled ? (
                          bet.payoutAmount > 0 ? (
                            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Thắng</span>
                          ) : (
                            <span style={{ color: 'var(--error)', fontWeight: 600 }}>Thua</span>
                          )
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Đang chờ</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Bet Modal */}
      {selectedMatch && (
        <BetModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onSuccess={async () => {
            const matchId = selectedMatch.id;
            setSelectedMatch(null);
            await fetchMatches();
            await fetchMyBets();
            await reloadBets(matchId);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
