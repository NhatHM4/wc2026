import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Award, Trophy, User } from 'lucide-react';
import { formatDonut } from '../utils/currency';

interface LeaderboardEntry {
  rank: number;
  username: string;
  totalBets: number;
  winBets: number;
  lossBets: number;
  totalWinAmount: number;
  winRate: number;
  lossRate: number;
}

const Leaderboard: React.FC = () => {
  const [sortBy, setSortBy] = useState<'win_rate' | 'total_win_amount' | 'loss_rate'>('win_rate');
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/leaderboard?sortBy=${sortBy}`);
      setData(response.data);
    } catch (error) {
      console.error('Không thể lấy bảng xếp hạng:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy]);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy size={20} style={{ color: 'var(--accent)' }} />;
      case 2:
        return <Trophy size={20} style={{ color: '#cbd5e1' }} />; // Silver
      case 3:
        return <Trophy size={20} style={{ color: '#b45309' }} />; // Bronze
      default:
        return <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{rank}</span>;
    }
  };


  const getCategoryDetails = () => {
    switch (sortBy) {
      case 'total_win_amount':
        return {
          title: 'Đại gia thắng cược',
          description: 'Top 10 người chơi nhận được tổng số tiền ăn thưởng cá cược nhiều nhất hệ thống.',
          badgeColor: 'rgba(245, 158, 11, 0.1)',
          textColor: 'var(--accent)'
        };
      case 'loss_rate':
        return {
          title: 'Thần đèn đen đủi',
          description: 'Top 10 người chơi có tỉ lệ đoán sai (thua cược) cao nhất hệ thống (tối thiểu 1 trận).',
          badgeColor: 'rgba(239, 68, 68, 0.1)',
          textColor: 'var(--error)'
        };
      default: // win_rate
        return {
          title: 'Cao thủ đoán tỉ số',
          description: 'Top 10 cao thủ có tỉ lệ dự đoán kết quả trận đấu chính xác cao nhất hệ thống.',
          badgeColor: 'rgba(16, 185, 129, 0.1)',
          textColor: 'var(--primary)'
        };
    }
  };

  const renderHighlightStats = (entry: LeaderboardEntry) => {
    if (sortBy === 'win_rate') {
      return (
        <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600, marginTop: '4px' }}>
          Tỉ lệ thắng: {(entry.winRate * 100).toFixed(0)}% ({entry.winBets}/{entry.totalBets} trận)
        </div>
      );
    } else if (sortBy === 'loss_rate') {
      return (
        <div style={{ fontSize: '13px', color: 'var(--error)', fontWeight: 600, marginTop: '4px' }}>
          Tỉ lệ thua: {(entry.lossRate * 100).toFixed(0)}% ({entry.lossBets}/{entry.totalBets} trận)
        </div>
      );
    } else {
      return (
        <div style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600, marginTop: '4px' }}>
          Ăn cược: +{formatDonut(entry.totalWinAmount)}
        </div>
      );
    }
  };

  const renderEntryStats = (entry: LeaderboardEntry) => {
    if (sortBy === 'win_rate') {
      return (
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--primary)' }}>
            {(entry.winRate * 100).toFixed(0)}%
          </span>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Thắng {entry.winBets}/{entry.totalBets} trận
          </div>
        </div>
      );
    } else if (sortBy === 'loss_rate') {
      return (
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--error)' }}>
            {(entry.lossRate * 100).toFixed(0)}%
          </span>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Thua {entry.lossBets}/{entry.totalBets} trận
          </div>
        </div>
      );
    } else {
      return (
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--accent)' }}>
            {formatDonut(entry.totalWinAmount)}
          </span>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Trúng {entry.winBets} trận
          </div>
        </div>
      );
    }
  };

  const cat = getCategoryDetails();

  return (
    <div className="container" style={{ padding: '40px 24px', maxWidth: '800px' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          display: 'inline-flex',
          padding: '16px',
          background: cat.badgeColor,
          borderRadius: '50%',
          color: cat.textColor,
          marginBottom: '16px',
          transition: 'all 0.3s'
        }}>
          <Award size={48} className="glow-amber" style={{ borderRadius: '50%' }} />
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px', transition: 'all 0.3s' }}>
          {cat.title}
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto' }}>
          {cat.description}
        </p>
      </div>

      {/* Tabs lựa chọn bảng xếp hạng */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '6px',
        maxWidth: '500px',
        margin: '0 auto 32px auto',
        gap: '4px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setSortBy('win_rate')}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: '8px',
            border: 'none',
            background: sortBy === 'win_rate' ? 'var(--primary)' : 'transparent',
            color: sortBy === 'win_rate' ? '#fff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: sortBy === 'win_rate' ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none'
          }}
        >
          Tỉ lệ thắng
        </button>
        <button
          onClick={() => setSortBy('total_win_amount')}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: '8px',
            border: 'none',
            background: sortBy === 'total_win_amount' ? 'var(--primary)' : 'transparent',
            color: sortBy === 'total_win_amount' ? '#fff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: sortBy === 'total_win_amount' ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none'
          }}
        >
          Tiền ăn cược
        </button>
        <button
          onClick={() => setSortBy('loss_rate')}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: '8px',
            border: 'none',
            background: sortBy === 'loss_rate' ? 'var(--primary)' : 'transparent',
            color: sortBy === 'loss_rate' ? '#fff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: sortBy === 'loss_rate' ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none'
          }}
        >
          Tỉ lệ thua
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Đang tải bảng xếp hạng...
        </div>
      ) : data.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Chưa có dữ liệu xếp hạng người chơi.
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '16px', overflow: 'hidden' }}>
          {/* Top 3 highlights */}
          <div className="podium-container">
            {/* Rank 2 */}
            {data[1] && (
              <div className="podium-rank-2">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>{getRankBadge(2)}</div>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>{data[1].username}</div>
                {renderHighlightStats(data[1])}
              </div>
            )}

            {/* Rank 1 */}
            {data[0] && (
              <div className="podium-rank-1">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                  <Trophy size={28} className="glow-amber" style={{ color: 'var(--accent)', borderRadius: '50%' }} />
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent)' }}>{data[0].username}</div>
                {renderHighlightStats(data[0])}
              </div>
            )}

            {/* Rank 3 */}
            {data[2] && (
              <div className="podium-rank-3">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>{getRankBadge(3)}</div>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>{data[2].username}</div>
                {renderHighlightStats(data[2])}
              </div>
            )}
          </div>

          {/* Detailed List */}
          <div style={{ padding: '8px' }}>
            {data.map((entry, index) => (
              <div
                key={entry.username}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 12px',
                  borderBottom: index === data.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.03)',
                  background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'none',
                  borderRadius: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '32px', display: 'flex', justifyContent: 'center' }}>
                    {getRankBadge(entry.rank)}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '50%',
                      padding: '8px',
                      color: 'var(--text-muted)'
                    }}>
                      <User size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '15px' }}>{entry.username}</div>
                    </div>
                  </div>
                </div>

                {renderEntryStats(entry)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
