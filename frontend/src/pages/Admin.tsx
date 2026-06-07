import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Users, Calendar, Key, CheckCircle, AlertCircle, RefreshCw, X, Play, Coins } from 'lucide-react';
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

interface UserEntry {
  id: string;
  username: string;
  role: string;
  approved: boolean;
  createdAt: string;
}

interface Transaction {
  id: string;
  walletId: string;
  username: string;
  amount: number;
  type: string;
  description: string;
  status: string;
  bankTxId: string | null;
  createdAt: string;
}

const Admin: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'matches' | 'users' | 'transactions'>('matches');
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  
  // Notification states
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // System mode states
  const [systemMode, setSystemMode] = useState<'REAL' | 'SIMULATION'>('SIMULATION');
  const [togglingMode, setTogglingMode] = useState(false);

  // Encryption mode states
  const [encryptModeEnabled, setEncryptModeEnabled] = useState(false);
  const [togglingEncrypt, setTogglingEncrypt] = useState(false);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states for updating scores
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [homeScoreInput, setHomeScoreInput] = useState<number>(0);
  const [awayScoreInput, setAwayScoreInput] = useState<number>(0);
  const [submittingScore, setSubmittingScore] = useState(false);

  // Modal states for resetting password
  const [selectedUser, setSelectedUser] = useState<UserEntry | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);

  // Modal states for creating matches
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);
  const [newHomeTeam, setNewHomeTeam] = useState('');
  const [newAwayTeam, setNewAwayTeam] = useState('');
  const [newMatchTime, setNewMatchTime] = useState('');
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [syncingAPI, setSyncingAPI] = useState(false);

  // Modal states for manual deposit
  const [selectedUserForDeposit, setSelectedUserForDeposit] = useState<UserEntry | null>(null);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [depositDescription, setDepositDescription] = useState('');
  const [submittingDeposit, setSubmittingDeposit] = useState(false);

  // Modal states for manual transaction approve
  const [selectedTransactionForApprove, setSelectedTransactionForApprove] = useState<Transaction | null>(null);
  const [manualBankTxId, setManualBankTxId] = useState('');
  const [submittingApprove, setSubmittingApprove] = useState(false);

  // Protection Check: only allow OWNER
  useEffect(() => {
    if (!user || user.role !== 'OWNER') {
      navigate('/');
    }
  }, [user, navigate]);

  const fetchMatches = async () => {
    setLoadingMatches(true);
    try {
      const response = await axios.get('/api/matches');
      setMatches(response.data);
    } catch (err: any) {
      setErrorMsg('Không thể tải lịch thi đấu: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingMatches(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await axios.get('/api/admin/users');
      setUsers(response.data);
    } catch (err: any) {
      setErrorMsg('Không thể tải danh sách người dùng: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchSystemMode = async () => {
    try {
      const response = await axios.get('/api/system/fund');
      if (response.data) {
        if (response.data.systemMode) {
          setSystemMode(response.data.systemMode);
        }
        if (response.data.encryptMode !== undefined) {
          setEncryptModeEnabled(response.data.encryptMode);
        }
      }
    } catch (err) {
      console.error('Không thể lấy chế độ hệ thống:', err);
    }
  };

  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const response = await axios.get('/api/admin/transactions');
      setTransactions(response.data);
    } catch (err: any) {
      setErrorMsg('Không thể tải danh sách giao dịch: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'OWNER') {
      fetchMatches();
      fetchUsers();
      fetchSystemMode();
      fetchTransactions();
    }
  }, [user]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg('');
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const handleToggleMode = async (newMode: 'REAL' | 'SIMULATION') => {
    if (newMode === systemMode) return;
    
    let resetAll = false;
    if (newMode === 'REAL') {
      const confirmText = 'Bạn đang chuyển sang chế độ THỰC TẾ. Bạn có muốn RESET toàn bộ số dư ví người dùng, quỹ Jackpot, doanh thu hệ thống và lịch sử giao dịch cược về 0 🍩 để làm sạch dữ liệu không?\n\n(Khuyến nghị Bấm OK)';
      if (window.confirm(confirmText)) {
        resetAll = true;
      }
    }

    setTogglingMode(true);
    try {
      const response = await axios.post('/api/admin/system/mode', { mode: newMode });
      setSystemMode(response.data.systemMode);
      
      let message = `Đã chuyển hệ thống sang chế độ ${newMode === 'REAL' ? 'THỰC TẾ' : 'GIẢ LẬP'}!`;
      
      if (resetAll) {
        try {
          const resetRes = await axios.post('/api/admin/system/reset-all-data');
          message += ' ' + resetRes.data.message;
        } catch (resetErr: any) {
          showError('Chuyển chế độ thành công nhưng Reset dữ liệu thất bại: ' + (resetErr.response?.data?.message || resetErr.message));
        }
      }
      
      showSuccess(message);
      fetchMatches();
      fetchUsers();
    } catch (err: any) {
      showError('Chuyển đổi chế độ thất bại: ' + (err.response?.data?.message || err.message));
    } finally {
      setTogglingMode(false);
    }
  };

  const handleUpdateScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;

    setSubmittingScore(true);
    try {
      await axios.put(`/api/admin/matches/${selectedMatch.id}/result`, {
        status: 'FINISHED',
        homeScore: homeScoreInput,
        awayScore: awayScoreInput
      });
      showSuccess(`Đã cập nhật tỉ số trận ${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam} thành ${homeScoreInput}-${awayScoreInput} và chia thưởng thành công!`);
      setSelectedMatch(null);
      fetchMatches();
      fetchUsers(); // Tải lại số dư mới của người dùng trong bảng xếp hạng/quản lý
    } catch (err: any) {
      showError('Cập nhật thất bại: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingScore(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!newPassword.trim()) {
      showError('Mật khẩu mới không được để trống');
      return;
    }

    setSubmittingPassword(true);
    try {
      await axios.post('/api/admin/users/reset-password', {
        userId: selectedUser.id,
        newPassword: newPassword
      });
      showSuccess(`Đã đặt lại mật khẩu cho tài khoản '${selectedUser.username}' thành công!`);
      setSelectedUser(null);
      setNewPassword('');
    } catch (err: any) {
      showError('Đặt lại mật khẩu thất bại: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingPassword(false);
    }
  };

  const handleResetBalance = async (userId: string, username: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn reset số dư ví của tài khoản '${username}' về 0 🍩 không?`)) {
      return;
    }
    try {
      const response = await axios.post(`/api/admin/users/${userId}/reset-balance`);
      showSuccess(response.data.message || 'Đã reset số dư về 0 🍩 thành công!');
      fetchUsers();
    } catch (err: any) {
      showError('Reset số dư thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHomeTeam.trim() || !newAwayTeam.trim() || !newMatchTime) {
      showError('Vui lòng nhập đầy đủ thông tin trận đấu');
      return;
    }

    setCreatingMatch(true);
    try {
      // Chuyển đổi thời gian local từ datetime-local sang thời gian UTC trước khi gửi
      const localDate = new Date(newMatchTime);
      const utcString = localDate.toISOString().replace('Z', '').split('.')[0];

      await axios.post('/api/admin/matches', {
        homeTeam: newHomeTeam,
        awayTeam: newAwayTeam,
        matchTime: utcString
      });

      showSuccess(`Đã tạo thành công trận đấu: ${newHomeTeam} VS ${newAwayTeam}!`);
      setShowCreateMatchModal(false);
      setNewHomeTeam('');
      setNewAwayTeam('');
      setNewMatchTime('');
      fetchMatches();
    } catch (err: any) {
      showError('Tạo trận đấu thất bại: ' + (err.response?.data?.message || err.message));
    } finally {
      setCreatingMatch(false);
    }
  };

  const handleForceSyncAPI = async () => {
    setSyncingAPI(true);
    try {
      const response = await axios.post('/api/admin/sync-matches');
      showSuccess(response.data.message || 'Đồng bộ từ API thành công!');
      fetchMatches();
      fetchUsers();
    } catch (err: any) {
      showError('Đồng bộ từ API thất bại: ' + (err.response?.data?.message || err.message));
    } finally {
      setSyncingAPI(false);
    }
  };

  const handleToggleEncryptMode = async (enabled: boolean) => {
    if (enabled === encryptModeEnabled) return;
    setTogglingEncrypt(true);
    try {
      const response = await axios.post('/api/admin/system/encrypt-mode', { encryptMode: enabled });
      setEncryptModeEnabled(response.data.encryptMode);
      showSuccess(`Đã ${enabled ? 'BẬT' : 'TẮT'} chế độ mã hóa dữ liệu thành công!`);
    } catch (err: any) {
      showError('Chuyển đổi chế độ mã hóa thất bại: ' + (err.response?.data?.message || err.message));
    } finally {
      setTogglingEncrypt(false);
    }
  };

  const handleApproveUser = async (userId: string, username: string) => {
    try {
      const response = await axios.post(`/api/admin/users/${userId}/approve`);
      showSuccess(response.data.message || `Đã phê duyệt tài khoản '${username}' thành công!`);
      fetchUsers();
    } catch (err: any) {
      showError('Phê duyệt tài khoản thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleManualDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForDeposit) return;
    if (depositAmount <= 0) {
      showError('Số tiền cộng phải lớn hơn 0');
      return;
    }

    setSubmittingDeposit(true);
    try {
      const response = await axios.post(`/api/admin/users/${selectedUserForDeposit.id}/deposit`, {
        amount: depositAmount,
        description: depositDescription
      });
      showSuccess(response.data.message || 'Cộng tiền thành công!');
      setSelectedUserForDeposit(null);
      setDepositAmount(0);
      setDepositDescription('');
      fetchUsers();
      fetchTransactions();
    } catch (err: any) {
      showError('Cộng tiền thất bại: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingDeposit(false);
    }
  };

  const handleApproveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransactionForApprove) return;

    setSubmittingApprove(true);
    try {
      const response = await axios.post(`/api/admin/transactions/${selectedTransactionForApprove.id}/approve`, {
        bankTxId: manualBankTxId
      });
      showSuccess(response.data.message || 'Duyệt giao dịch thành công!');
      setSelectedTransactionForApprove(null);
      setManualBankTxId('');
      fetchUsers();
      fetchTransactions();
    } catch (err: any) {
      showError('Duyệt giao dịch thất bại: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingApprove(false);
    }
  };

  const getStatusBadge = (status: string, settled: boolean) => {
    if (settled) {
      return <span className="badge badge-finished" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>Đã kết toán</span>;
    }
    switch (status) {
      case 'FINISHED':
        return <span className="badge badge-finished">Chưa kết toán</span>;
      case 'IN_PLAY':
        return <span className="badge badge-inplay">Đang đá</span>;
      default:
        return <span className="badge badge-scheduled">Sắp đá</span>;
    }
  };

  if (!user || user.role !== 'OWNER') {
    return null;
  }

  const isRealAPIMatch = (apiMatchId: number) => {
    return apiMatchId > 100004 && apiMatchId < 1000000000;
  };

  // Filter matches based on search term
  let filteredMatches = matches.filter(m => 
    m.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.awayTeam.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (systemMode === 'REAL') {
    filteredMatches = filteredMatches.filter(m => isRealAPIMatch(m.apiMatchId));
  }

  return (
    <div className="container" style={{ padding: '40px 16px', maxWidth: '1000px' }}>
      {/* Header */}
      <div className="admin-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', marginBottom: '8px' }}>
            <ShieldAlert size={20} />
            <span style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Khu vực quản trị tối cao</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800 }}>Admin Control Panel</h1>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowCreateMatchModal(true)}
            className="btn btn-primary"
            style={{ display: 'flex', gap: '8px', padding: '10px 16px' }}
            disabled={systemMode === 'REAL'}
            title={systemMode === 'REAL' ? 'Không thể tạo trận đấu thủ công khi ở chế độ THỰC TẾ' : ''}
          >
            + Tạo trận đấu
          </button>
          <button
            onClick={handleForceSyncAPI}
            className="btn"
            style={{
              display: 'flex',
              gap: '8px',
              padding: '10px 16px',
              background: systemMode === 'SIMULATION' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 185, 129, 0.15)',
              color: systemMode === 'SIMULATION' ? 'var(--text-muted)' : 'var(--primary)',
              border: systemMode === 'SIMULATION' ? '1px solid var(--border)' : '1px solid rgba(16, 185, 129, 0.3)',
            }}
            disabled={syncingAPI || systemMode === 'SIMULATION'}
            title={systemMode === 'SIMULATION' ? 'Không thể đồng bộ từ API khi ở chế độ GIẢ LẬP' : ''}
          >
            <RefreshCw size={16} className={syncingAPI ? 'animate-spin' : ''} />
            {syncingAPI ? 'Đang đồng bộ...' : 'Đồng bộ API'}
          </button>
          <button 
            onClick={() => { fetchMatches(); fetchUsers(); fetchSystemMode(); fetchTransactions(); showSuccess('Đã cập nhật dữ liệu mới nhất!'); }}
            className="btn btn-secondary" 
            style={{ display: 'flex', gap: '8px', padding: '10px 16px' }}
          >
            <RefreshCw size={16} />
            Làm mới
          </button>
        </div>
      </div>

      {/* System Mode Config Card */}
      <div className="glass-panel" style={{
        padding: '20px 16px',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        borderLeft: systemMode === 'REAL' ? '4px solid var(--primary)' : '4px solid var(--accent)'
      }}>
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ fontWeight: 700, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Chế độ hệ thống hiện tại:</span>
            <span style={{
              color: systemMode === 'REAL' ? 'var(--primary)' : 'var(--accent)',
              textTransform: 'uppercase',
              background: systemMode === 'REAL' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 800,
              border: systemMode === 'REAL' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)'
            }}>
              {systemMode === 'REAL' ? 'THỰC TẾ (REAL)' : 'GIẢ LẬP (SIMULATION)'}
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '8px', lineHeight: '1.5' }}>
            {systemMode === 'REAL' 
              ? 'Hệ thống tự động đồng bộ kết quả từ Football API mỗi 30 phút. Khóa cập nhật tỉ số thủ công để bảo vệ dữ liệu.'
              : 'Cho phép Admin tự do tạo thêm trận đấu và tùy chỉnh kết quả tỉ số để kiểm thử logic chia tiền thưởng.'
            }
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }} className="admin-system-buttons">
          <button
            onClick={() => handleToggleMode('SIMULATION')}
            className="btn"
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              background: systemMode === 'SIMULATION' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              color: systemMode === 'SIMULATION' ? 'var(--accent)' : 'var(--text-muted)',
              border: systemMode === 'SIMULATION' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border)'
            }}
            disabled={togglingMode}
          >
            Chế độ Giả lập
          </button>
          <button
            onClick={() => handleToggleMode('REAL')}
            className="btn"
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              background: systemMode === 'REAL' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              color: systemMode === 'REAL' ? 'var(--primary)' : 'var(--text-muted)',
              border: systemMode === 'REAL' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border)'
            }}
            disabled={togglingMode}
          >
            Chế độ Thực tế
          </button>
        </div>
      </div>

      {/* Encryption Config Card */}
      <div className="glass-panel" style={{
        padding: '20px 16px',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        borderLeft: encryptModeEnabled ? '4px solid var(--primary)' : '4px solid var(--text-muted)'
      }}>
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ fontWeight: 700, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Chế độ mã hóa dữ liệu (Encrypt Mode):</span>
            <span style={{
              color: encryptModeEnabled ? 'var(--primary)' : 'var(--text-muted)',
              textTransform: 'uppercase',
              background: encryptModeEnabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 800,
              border: encryptModeEnabled ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border)'
            }}>
              {encryptModeEnabled ? 'ĐANG BẬT (ON)' : 'ĐANG TẮT (OFF)'}
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '8px', lineHeight: '1.5' }}>
            Khi BẬT, toàn bộ dữ liệu trả về từ API và thông tin hiển thị trên màn hình sẽ bị mã hóa bằng khóa bí mật. Người dùng cần nhập khóa để giải mã trước khi xem.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleToggleEncryptMode(false)}
            className="btn"
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              background: !encryptModeEnabled ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
              color: !encryptModeEnabled ? '#fff' : 'var(--text-muted)',
              border: !encryptModeEnabled ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid var(--border)'
            }}
            disabled={togglingEncrypt}
          >
            Tắt Mã Hóa
          </button>
          <button
            onClick={() => handleToggleEncryptMode(true)}
            className="btn"
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              background: encryptModeEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              color: encryptModeEnabled ? 'var(--primary)' : 'var(--text-muted)',
              border: encryptModeEnabled ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border)'
            }}
            disabled={togglingEncrypt}
          >
            Bật Mã Hóa
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '8px',
          color: 'var(--primary)',
          padding: '12px 16px',
          fontSize: '14px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '8px',
          color: 'var(--error)',
          padding: '12px 16px',
          fontSize: '14px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        borderBottom: '1px solid var(--border)', 
        marginBottom: '32px',
        paddingBottom: '2px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setActiveTab('matches')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'matches' ? '#fff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '16px',
            padding: '12px 16px',
            cursor: 'pointer',
            borderBottom: activeTab === 'matches' ? '3px solid var(--primary)' : '3px solid transparent',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Calendar size={18} />
          Quản lý tỉ số trận đấu
        </button>

        <button
          onClick={() => setActiveTab('users')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'users' ? '#fff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '16px',
            padding: '12px 16px',
            cursor: 'pointer',
            borderBottom: activeTab === 'users' ? '3px solid var(--primary)' : '3px solid transparent',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Users size={18} />
          Quản lý người dùng
        </button>

        <button
          onClick={() => { setActiveTab('transactions'); fetchTransactions(); }}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'transactions' ? '#fff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '16px',
            padding: '12px 16px',
            cursor: 'pointer',
            borderBottom: activeTab === 'transactions' ? '3px solid var(--primary)' : '3px solid transparent',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Coins size={18} />
          Quản lý giao dịch nạp
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'matches' ? (
        <div>
          {/* Search bar */}
          <div style={{ marginBottom: '24px', maxWidth: '400px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Tìm kiếm nhanh tên đội tuyển..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loadingMatches ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Đang tải danh sách trận đấu...
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Không tìm thấy trận đấu nào khớp với từ khóa tìm kiếm.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {filteredMatches.map((match) => (
                <div key={match.id} className="glass-panel" style={{ padding: '20px 16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
                  
                  {/* Match Info */}
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      {getStatusBadge(match.status, match.settled)}
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(match.matchTime.endsWith('Z') || match.matchTime.includes('+') ? match.matchTime : match.matchTime + 'Z').toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '18px', fontWeight: 800 }}>
                      <span>{match.homeTeam}</span>
                      <span style={{ color: 'var(--accent)' }}>
                        {match.status === 'FINISHED' || match.status === 'IN_PLAY' 
                          ? `${match.homeScore} - ${match.awayScore}` 
                          : 'VS'
                        }
                      </span>
                      <span>{match.awayTeam}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      Tổng tiền cược hiện tại: <strong style={{ color: '#fff' }}>{formatDonut(match.poolAmount)}</strong>
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    {!match.settled && (
                      <button
                        onClick={() => {
                          setSelectedMatch(match);
                          setHomeScoreInput(match.homeScore || 0);
                          setAwayScoreInput(match.awayScore || 0);
                        }}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
                        disabled={systemMode === 'REAL'}
                        title={systemMode === 'REAL' ? 'Không thể cập nhật tỉ số thủ công khi ở chế độ THỰC TẾ' : ''}
                      >
                        <Play size={14} />
                        {systemMode === 'REAL' ? 'Khóa (Chế độ Thực tế)' : 'Nhập tỉ số & Quyết toán'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'users' ? (
        <div>
          {loadingUsers ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Đang tải danh sách người dùng...
            </div>
          ) : users.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Chưa có tài khoản người dùng nào.
            </div>
          ) : (
            <div className="glass-panel table-scroll-container" style={{ padding: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '650px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '16px' }}>Tên đăng nhập</th>
                    <th style={{ padding: '16px' }}>Vai trò</th>
                    <th style={{ padding: '16px' }}>Trạng thái</th>
                    <th style={{ padding: '16px' }}>Ngày tạo</th>
                    <th style={{ padding: '16px', textAlign: 'right' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '16px', fontWeight: 600 }}>{u.username}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: u.role === 'OWNER' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.05)',
                          color: u.role === 'OWNER' ? 'var(--accent)' : 'var(--text-muted)',
                          border: u.role === 'OWNER' ? '1px solid rgba(245,158,11,0.2)' : '1px solid var(--border)'
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        {u.approved ? (
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            color: 'var(--primary)',
                            border: '1px solid rgba(16, 185, 129, 0.2)'
                          }}>
                            Đã duyệt
                          </span>
                        ) : (
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: 'var(--error)',
                            border: '1px solid rgba(239, 68, 68, 0.2)'
                          }}>
                            Chờ duyệt
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                        {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {!u.approved && (
                          <button
                            onClick={() => handleApproveUser(u.id, u.username)}
                            className="btn btn-primary"
                            style={{ 
                              padding: '6px 12px', 
                              display: 'inline-flex', 
                              gap: '6px', 
                              fontSize: '13px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: 'var(--primary)',
                              border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            Duyệt
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedUserForDeposit(u);
                            setDepositAmount(10000);
                            setDepositDescription('Cộng tiền thủ công bởi Admin');
                          }}
                          className="btn btn-primary"
                          style={{ 
                            padding: '6px 12px', 
                            display: 'inline-flex', 
                            gap: '6px', 
                            fontSize: '13px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: 'var(--primary)',
                            border: '1px solid rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          <Coins size={12} />
                          Cộng Tiền
                        </button>
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', display: 'inline-flex', gap: '6px', fontSize: '13px' }}
                        >
                          <Key size={12} />
                          Reset Pass
                        </button>
                        <button
                          onClick={() => handleResetBalance(u.id, u.username)}
                          className="btn btn-secondary"
                          style={{ 
                            padding: '6px 12px', 
                            display: 'inline-flex', 
                            gap: '6px', 
                            fontSize: '13px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: 'var(--error)',
                            border: '1px solid rgba(239, 68, 68, 0.2)'
                          }}
                        >
                          <Coins size={12} />
                          Reset Tiền
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div>
          {loadingTransactions ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Đang tải danh sách giao dịch...
            </div>
          ) : transactions.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Chưa có giao dịch nào trên hệ thống.
            </div>
          ) : (
            <div className="glass-panel table-scroll-container" style={{ padding: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '16px' }}>Thời gian</th>
                    <th style={{ padding: '16px' }}>Người dùng</th>
                    <th style={{ padding: '16px' }}>Số tiền</th>
                    <th style={{ padding: '16px' }}>Loại</th>
                    <th style={{ padding: '16px' }}>Mô tả</th>
                    <th style={{ padding: '16px' }}>Trạng thái</th>
                    <th style={{ padding: '16px' }}>Mã NH</th>
                    <th style={{ padding: '16px', textAlign: 'right' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        {new Date(t.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td style={{ padding: '16px', fontWeight: 600 }}>{t.username}</td>
                      <td style={{ 
                        padding: '16px', 
                        fontWeight: 700, 
                        color: t.amount > 0 ? 'var(--primary)' : 'var(--error)' 
                      }}>
                        {t.amount > 0 ? '+' : ''}{formatDonut(t.amount)}
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: t.type === 'DEPOSIT' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: t.type === 'DEPOSIT' ? 'var(--primary)' : 'var(--error)',
                          border: t.type === 'DEPOSIT' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
                        }}>
                          {t.type}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>{t.description}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: 
                            t.status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.1)' : 
                            t.status === 'PENDING' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.05)',
                          color: 
                            t.status === 'SUCCESS' ? 'var(--primary)' : 
                            t.status === 'PENDING' ? 'var(--accent)' : 'var(--text-muted)',
                          border: 
                            t.status === 'SUCCESS' ? '1px solid rgba(16, 185, 129, 0.2)' : 
                            t.status === 'PENDING' ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid var(--border)'
                        }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', fontFamily: 'monospace' }}>
                        {t.bankTxId || '-'}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        {t.type === 'DEPOSIT' && t.status !== 'SUCCESS' && (
                          <button
                            onClick={() => {
                              setSelectedTransactionForApprove(t);
                              setManualBankTxId('');
                            }}
                            className="btn btn-primary"
                            style={{ 
                              padding: '6px 12px', 
                              fontSize: '13px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: 'var(--primary)',
                              border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            Duyệt
                          </button>
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

      {/* Modal: Nhập tỉ số & Kết toán */}
      {selectedMatch && (
        <div className="modal-overlay">
          <div className="glass-panel modal-container">
            <button onClick={() => setSelectedMatch(null)} style={{
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

            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Cập nhật tỉ số & Kết toán</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
              Thiết lập tỉ số cuối cùng. Hệ thống sẽ tự động chuyển trạng thái trận đấu thành <strong>FINISHED</strong> và chia thưởng cho người dự đoán đúng.
            </p>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <span style={{ fontWeight: 700, fontSize: '16px' }}>{selectedMatch.homeTeam}</span>
              <span style={{ color: 'var(--accent)', fontWeight: 800, margin: '0 12px' }}>VS</span>
              <span style={{ fontWeight: 700, fontSize: '16px' }}>{selectedMatch.awayTeam}</span>
            </div>

            <form onSubmit={handleUpdateScore}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div>
                  <label className="form-label" style={{ textAlign: 'center' }}>Tỉ số {selectedMatch.homeTeam}</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    style={{ textAlign: 'center', fontSize: '24px', fontWeight: 700 }}
                    value={homeScoreInput}
                    onChange={(e) => setHomeScoreInput(parseInt(e.target.value) || 0)}
                    disabled={submittingScore}
                  />
                </div>
                
                <span style={{ fontSize: '24px', fontWeight: 700, marginTop: '20px', color: 'var(--text-muted)' }}>-</span>
                
                <div>
                  <label className="form-label" style={{ textAlign: 'center' }}>Tỉ số {selectedMatch.awayTeam}</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    style={{ textAlign: 'center', fontSize: '24px', fontWeight: 700 }}
                    value={awayScoreInput}
                    onChange={(e) => setAwayScoreInput(parseInt(e.target.value) || 0)}
                    disabled={submittingScore}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedMatch(null)}
                  disabled={submittingScore}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingScore}
                >
                  {submittingScore ? 'Đang cập nhật...' : 'Xác nhận & Chia thưởng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Mật khẩu */}
      {selectedUser && (
        <div className="modal-overlay">
          <div className="glass-panel modal-container" style={{ maxWidth: '400px' }}>
            <button onClick={() => setSelectedUser(null)} style={{
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

            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Reset Mật Khẩu</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
              Đặt lại mật khẩu đăng nhập cho tài khoản <strong style={{ color: '#fff' }}>{selectedUser.username}</strong>.
            </p>

            <form onSubmit={handleResetPassword}>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Mật khẩu mới</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập mật khẩu mới..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={submittingPassword}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedUser(null)}
                  disabled={submittingPassword}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingPassword}
                >
                  {submittingPassword ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tạo trận đấu mới */}
      {showCreateMatchModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-container" style={{ maxWidth: '450px' }}>
            <button onClick={() => setShowCreateMatchModal(false)} style={{
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

            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Tạo trận đấu mới</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
              Thêm trận đấu mới vào danh sách thi đấu World Cup 2026.
            </p>

            <form onSubmit={handleCreateMatch}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Đội nhà (Home Team)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập tên đội nhà..."
                  value={newHomeTeam}
                  onChange={(e) => setNewHomeTeam(e.target.value)}
                  disabled={creatingMatch}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Đội khách (Away Team)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập tên đội khách..."
                  value={newAwayTeam}
                  onChange={(e) => setNewAwayTeam(e.target.value)}
                  disabled={creatingMatch}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Thời gian thi đấu</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={newMatchTime}
                  onChange={(e) => setNewMatchTime(e.target.value)}
                  disabled={creatingMatch}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateMatchModal(false)}
                  disabled={creatingMatch}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creatingMatch}
                >
                  {creatingMatch ? 'Đang tạo...' : 'Tạo trận đấu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cộng tiền thủ công */}
      {selectedUserForDeposit && (
        <div className="modal-overlay">
          <div className="glass-panel modal-container" style={{ maxWidth: '400px' }}>
            <button onClick={() => setSelectedUserForDeposit(null)} style={{
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

            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Cộng tiền thủ công</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
              Cộng tiền trực tiếp vào tài khoản <strong style={{ color: '#fff' }}>{selectedUserForDeposit.username}</strong>.
            </p>

            <form onSubmit={handleManualDeposit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Số tiền cộng (VND)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="form-input"
                  placeholder="Nhập số tiền..."
                  value={depositAmount || ''}
                  onChange={(e) => setDepositAmount(parseInt(e.target.value) || 0)}
                  disabled={submittingDeposit}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Mô tả giao dịch</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Lý do cộng tiền..."
                  value={depositDescription}
                  onChange={(e) => setDepositDescription(e.target.value)}
                  disabled={submittingDeposit}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedUserForDeposit(null)}
                  disabled={submittingDeposit}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingDeposit}
                >
                  {submittingDeposit ? 'Đang cộng...' : 'Xác nhận cộng tiền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Duyệt giao dịch nạp tiền */}
      {selectedTransactionForApprove && (
        <div className="modal-overlay">
          <div className="glass-panel modal-container" style={{ maxWidth: '400px' }}>
            <button onClick={() => setSelectedTransactionForApprove(null)} style={{
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

            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Duyệt giao dịch lỗi</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
              Xác nhận duyệt giao dịch nạp tiền trị giá <strong style={{ color: 'var(--primary)' }}>{formatDonut(selectedTransactionForApprove.amount)}</strong> cho người dùng <strong style={{ color: '#fff' }}>{selectedTransactionForApprove.username}</strong>.
            </p>
            <div style={{
              fontSize: '13px',
              background: 'rgba(255,255,255,0.03)',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '24px',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)'
            }}>
              <div>Mã chuyển khoản: <strong>{selectedTransactionForApprove.description}</strong></div>
              <div>Trạng thái hiện tại: <strong>{selectedTransactionForApprove.status}</strong></div>
            </div>

            <form onSubmit={handleApproveTransaction}>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Mã giao dịch ngân hàng (Tùy chọn)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập mã GD ngân hàng nếu có..."
                  value={manualBankTxId}
                  onChange={(e) => setManualBankTxId(e.target.value)}
                  disabled={submittingApprove}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedTransactionForApprove(null)}
                  disabled={submittingApprove}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingApprove}
                >
                  {submittingApprove ? 'Đang duyệt...' : 'Xác nhận duyệt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
