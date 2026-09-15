import React, { useState, useEffect, useRef } from 'react'
import { ValorantPlayerProfile, ValorantSearchItem } from '../../shared/valorant-types'
import ValorantMatchCard from './ValorantMatchCard'
import valorantTextLogo from '../../assets/valorant-text.png'
import { IoSearch, IoBookmark, IoBookmarkOutline, IoRefresh, IoWarningOutline, IoFlame } from 'react-icons/io5'
import './valorant.css'

interface ValorantTrackerViewProps {
  onProfileLoaded?: (item: ValorantSearchItem) => void;
  initialSearch?: { name: string; tag: string } | null;
}

const DEFAULT_NAME = 'Insxne';
const DEFAULT_TAG = '2907';

export default function ValorantTrackerView({ onProfileLoaded, initialSearch }: ValorantTrackerViewProps) {
  const [nameInput, setNameInput] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('');
  const [profile, setProfile] = useState<ValorantPlayerProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [selectedOutcome, setSelectedOutcome] = useState<'all' | 'win' | 'loss'>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const hasInitialized = useRef<boolean>(false);

  // Handle external search triggered from sidebar
  useEffect(() => {
    if (initialSearch && initialSearch.name && initialSearch.tag) {
      setNameInput(initialSearch.name);
      setTagInput(initialSearch.tag);
      handleSearch(initialSearch.name, initialSearch.tag);
    }
  }, [initialSearch]);

  // Load pinned or initial default profile on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    try {
      const savedPin = localStorage.getItem('val_pinned_player') || localStorage.getItem('val_pinned_profile');
      if (savedPin) {
        const parsed = JSON.parse(savedPin);
        if (parsed.name && parsed.tag) {
          setNameInput(parsed.name);
          setTagInput(parsed.tag);
          setIsPinned(true);
          handleSearch(parsed.name, parsed.tag);
          return;
        }
      }

      // Default quick start
      setNameInput(DEFAULT_NAME);
      setTagInput(DEFAULT_TAG);
      handleSearch(DEFAULT_NAME, DEFAULT_TAG);
    } catch {
      setNameInput(DEFAULT_NAME);
      setTagInput(DEFAULT_TAG);
      handleSearch(DEFAULT_NAME, DEFAULT_TAG);
    }
  }, []);

  const handleSearch = async (searchName?: string, searchTag?: string) => {
    const targetName = (searchName !== undefined ? searchName : nameInput).trim();
    const targetTag = (searchTag !== undefined ? searchTag : tagInput).trim();

    if (!targetName || !targetTag) {
      setErrorMsg('Vui lòng nhập đầy đủ Ingame và Tag (ví dụ: TenNhanVat#TAG).');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      if (window.api && window.api.valorant) {
        const data = await window.api.valorant.getPlayerProfile(targetName, targetTag);
        setProfile(data);

        // Notify parent to update search history
        if (data && onProfileLoaded) {
          onProfileLoaded({
            name: data.name,
            tag: data.tag,
            region: data.region,
            card_small: data.card?.small,
            tier_name: data.current_rank?.tier_name,
            tier_icon: data.current_rank?.icon
          });
        }

        // Check if currently pinned
        const savedPin = localStorage.getItem('val_pinned_player') || localStorage.getItem('val_pinned_profile');
        if (savedPin) {
          const parsed = JSON.parse(savedPin);
          setIsPinned(parsed.name?.toLowerCase() === targetName.toLowerCase() && parsed.tag?.toLowerCase() === targetTag.toLowerCase());
        } else {
          setIsPinned(false);
        }
      } else {
        throw new Error('Valorant API service is not available in current window.');
      }
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      setErrorMsg(err.message || 'Không thể lấy thông tin người chơi. Hãy kiểm tra lại Ingame và Tag.');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePin = () => {
    if (!profile) return;
    if (isPinned) {
      localStorage.removeItem('val_pinned_player');
      localStorage.removeItem('val_pinned_profile');
      setIsPinned(false);
    } else {
      const pinData = {
        name: profile.name,
        tag: profile.tag,
        tier_name: profile.current_rank?.tier_name,
        tier_icon: profile.current_rank?.icon
      };
      localStorage.setItem('val_pinned_player', JSON.stringify(pinData));
      localStorage.setItem('val_pinned_profile', JSON.stringify(pinData));
      setIsPinned(true);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes('#')) {
      const parts = val.split('#');
      setNameInput(parts[0]);
      setTagInput(parts[1] || '');
    } else {
      setNameInput(val);
    }
  };

  // Recent Form Streak & Filtered Matches
  const allMatches = profile?.recent_matches || [];
  const streakMatches = allMatches.slice(0, 10);
  const streakWins = streakMatches.filter(m => m.has_won).length;
  const streakLosses = streakMatches.length - streakWins;
  const streakWinrate = streakMatches.length > 0 ? Math.round((streakWins / streakMatches.length) * 100) : 0;

  // Filtered matches
  const filteredMatches = allMatches.filter((m) => {
    const mMode = (m.mode || '').toLowerCase();
    const matchMode = selectedMode === 'all' || mMode.includes(selectedMode.toLowerCase());
    const matchOutcome = 
      selectedOutcome === 'all' ||
      (selectedOutcome === 'win' && m.has_won) ||
      (selectedOutcome === 'loss' && !m.has_won);
    return matchMode && matchOutcome;
  });

  // Mode tabs
  const MODE_TABS = [
    { id: 'all', label: 'TẤT CẢ CHẾ ĐỘ' },
    { id: 'competitive', label: 'XẾP HẠNG' },
    { id: 'unrated', label: 'ĐẤU THƯỜNG' },
    { id: 'swiftplay', label: 'SWIFTPLAY' },
    { id: 'deathmatch', label: 'SINH TỬ' }
  ];

  return (
    <div className="val-container">
      {/* High-opacity Background Illustrator */}
      <div className="val-bg-illustrator" />

      {/* Top Bar / Search */}
      <div className="val-top-bar">
        <div className="val-brand-title">
          <div className="val-brand-logo-wrap">
            <img src={valorantTextLogo} alt="Valorant" className="val-brand-text-logo" />
          </div>
        </div>

        <form 
          className="val-search-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
        >
          <input
            type="text"
            className="val-search-input-name"
            placeholder="Ingame name..."
            value={nameInput}
            onChange={handleNameChange}
          />
          <span className="val-search-tag-separator">#</span>
          <input
            type="text"
            className="val-search-input-tag"
            placeholder="Tag"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
          />
          <button type="submit" className="val-search-btn" disabled={loading}>
            {loading ? <IoRefresh className="spinner" size={16} /> : <IoSearch size={16} />}
            <span>Tìm</span>
          </button>
        </form>
      </div>

      {/* Main Body */}
      <div className="val-scroll-body">
        {errorMsg && (
          <div className="val-error-state">
            <IoWarningOutline size={28} style={{ marginBottom: '8px' }} />
            <div style={{ fontWeight: 700 }}>{errorMsg}</div>
          </div>
        )}

        {loading && (
          <div className="val-loading-state">
            <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto 12px auto' }}></div>
            <div style={{ fontWeight: 700, color: '#ece8e1' }}>Đang tải dữ liệu từ máy chủ Riot Games...</div>
          </div>
        )}

        {!profile && !loading && !errorMsg && (
          <div className="val-empty-state">
            <IoFlame size={48} className="val-empty-icon" />
            <h3>Tra cứu Hồ sơ Valorant</h3>
            <p>Nhập Ingame và Tag để xem Rank hiện tại, điểm RR, K/D, Tỉ lệ Headshot và Lịch sử các trận đấu gần đây.</p>
            <div className="val-quick-tags">
              <span style={{ fontSize: '13px', color: '#666', alignSelf: 'center' }}>Thử tìm:</span>
              <button type="button" className="val-quick-tag-btn" onClick={() => { setNameInput('f0rsakeN'); setTagInput('ap'); handleSearch('f0rsakeN', 'ap'); }}>
                f0rsakeN#ap
              </button>
              <button type="button" className="val-quick-tag-btn" onClick={() => { setNameInput('something'); setTagInput('000'); handleSearch('something', '000'); }}>
                something#000
              </button>
            </div>
          </div>
        )}

        {profile && !loading && (
          <>
            {/* Player Header Card */}
            <div className="val-player-header">
              <div 
                className="val-player-banner"
                style={{ 
                  backgroundImage: profile.card?.wide ? `url(${profile.card.wide})` : 'none',
                  backgroundColor: '#16202c'
                }}
              >
                <div className="val-player-banner-overlay" />
              </div>

              <div className="val-player-meta-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                  <div className="val-avatar-wrap">
                    {profile.card?.small ? (
                      <img src={profile.card.small} alt={profile.name} className="val-avatar-img" />
                    ) : null}
                  </div>

                  <div className="val-name-col">
                    <div className="val-player-name">
                      <span>{profile.name}</span>
                      <span className="val-player-tag">#{profile.tag}</span>
                    </div>

                    <div className="val-badge-row">
                      <span className="val-level-badge">LVL {profile.account_level}</span>
                      <span className="val-region-badge">{profile.region?.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <button 
                  className={`val-pin-btn ${isPinned ? 'pinned' : ''}`}
                  onClick={handleTogglePin}
                  title={isPinned ? 'Bỏ ghim tài khoản' : 'Ghim tài khoản này'}
                >
                  {isPinned ? <IoBookmark size={16} /> : <IoBookmarkOutline size={16} />}
                  <span>{isPinned ? 'Đã ghim' : 'Ghim hồ sơ'}</span>
                </button>
              </div>
            </div>

            {/* Rank & Compact Balanced Stats Grid */}
            <div className="val-overview-grid">
              {/* Current Rank Card */}
              <div className="val-rank-card">
                <div className="val-rank-icon-wrap">
                  <img src={profile.current_rank.icon} alt={profile.current_rank.tier_name} className="val-rank-icon" />
                </div>
                <span className="val-rank-tier-name">{profile.current_rank.tier_name}</span>
                
                <div className="val-rr-display">
                  <span className="val-rr-number">{profile.current_rank.rr}</span>
                  <span className="val-rr-label">/ 100 RR</span>
                  {profile.current_rank.last_change !== 0 && (
                    <span className={`val-rr-change ${profile.current_rank.last_change > 0 ? 'positive' : 'negative'}`}>
                      {profile.current_rank.last_change > 0 ? `+${profile.current_rank.last_change}` : profile.current_rank.last_change}
                    </span>
                  )}
                </div>

                <div className="val-peak-rank-box">
                  <span>Peak Rank</span>
                  <span className="val-peak-val">{profile.peak_rank?.tier_name || 'Unrated'}</span>
                </div>
              </div>

              {/* Core Stats 6 Compact Tiles */}
              <div className="val-stats-panel">
                <div className="val-stat-box">
                  <span className="val-stat-title">TỈ LỆ THẮNG</span>
                  <span className="val-stat-number" style={{ color: profile.stats.winrate >= 50 ? '#1ed760' : '#ff4655' }}>
                    {profile.stats.winrate}%
                  </span>
                  <span className="val-stat-sub">{profile.stats.wins}W - {profile.stats.losses}L</span>
                </div>

                <div className="val-stat-box">
                  <span className="val-stat-title">K/D RATIO</span>
                  <span className="val-stat-number" style={{ color: profile.stats.kd >= 1.0 ? '#1ed760' : '#ff4655' }}>
                    {profile.stats.kd}
                  </span>
                  <span className="val-stat-sub">
                    {profile.stats.total_kills ? `${profile.stats.total_kills}K / ${profile.stats.total_deaths}D` : 'Hiệu số mạng'}
                  </span>
                </div>

                <div className="val-stat-box">
                  <span className="val-stat-title">HEADSHOT %</span>
                  <span className="val-stat-number" style={{ color: '#fbbf24' }}>
                    {profile.stats.headshot_pct}%
                  </span>
                  <span className="val-stat-sub">Tỉ lệ trúng đầu</span>
                </div>

                <div className="val-stat-box">
                  <span className="val-stat-title">AVG ACS</span>
                  <span className="val-stat-number" style={{ color: '#60a5fa' }}>
                    {profile.stats.avg_acs}
                  </span>
                  <span className="val-stat-sub">Điểm giao tranh</span>
                </div>

                <div className="val-stat-box">
                  <span className="val-stat-title">AVG ADR</span>
                  <span className="val-stat-number" style={{ color: '#f43f5e' }}>
                    {profile.stats.avg_adr || (profile.stats.avg_acs ? Math.round(profile.stats.avg_acs * 0.72) : 0)}
                  </span>
                  <span className="val-stat-sub">Sát thương / hiệp</span>
                </div>

                <div className="val-stat-box">
                  <span className="val-stat-title">KILLS / TRẬN</span>
                  <span className="val-stat-number" style={{ color: '#a855f7' }}>
                    {profile.stats.avg_kills_per_match || (profile.stats.games_analyzed > 0 ? (profile.stats.total_kills / profile.stats.games_analyzed).toFixed(1) : '—')}
                  </span>
                  <span className="val-stat-sub">Kills trung bình</span>
                </div>
              </div>
            </div>

            {/* Top Agents Breakdown Section */}
            {profile.agent_stats && profile.agent_stats.length > 0 && (
              <div className="val-breakdown-section">
                <div className="val-section-title">
                  <span>Tướng thường dùng ({profile.agent_stats.length})</span>
                </div>
                <div className="val-agents-grid">
                  {profile.agent_stats.map((agent) => (
                    <div key={agent.name} className="val-agent-card">
                      <div className="val-agent-card-left">
                        {agent.icon ? (
                          <img src={agent.icon} alt={agent.name} className="val-agent-card-img" />
                        ) : (
                          <div className="val-agent-card-img-placeholder" />
                        )}
                        <div>
                          <div className="val-agent-card-name">{agent.name}</div>
                          <div className="val-agent-card-played">{agent.matches} trận ({agent.wins}W - {agent.losses}L)</div>
                        </div>
                      </div>
                      <div className="val-agent-card-right">
                        <div className="val-agent-card-stat">
                          <span className="val-agent-card-val" style={{ color: agent.winrate >= 50 ? '#1ed760' : '#ff4655' }}>
                            {agent.winrate}%
                          </span>
                          <span className="val-agent-card-lbl">Winrate</span>
                        </div>
                        <div className="val-agent-card-stat">
                          <span className="val-agent-card-val" style={{ color: agent.kd >= 1.0 ? '#1ed760' : '#ff4655' }}>
                            {agent.kd}
                          </span>
                          <span className="val-agent-card-lbl">K/D</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map Performance Breakdown Section */}
            {profile.map_stats && profile.map_stats.length > 0 && (
              <div className="val-breakdown-section">
                <div className="val-section-title">
                  <span>Hiệu suất theo Map ({profile.map_stats.length})</span>
                </div>
                <div className="val-maps-grid">
                  {profile.map_stats.map((map) => (
                    <div key={map.name} className="val-map-card">
                      {map.splash && (
                        <div 
                          className="val-map-card-bg"
                          style={{ backgroundImage: `url(${map.splash})` }}
                        />
                      )}
                      <div className="val-map-card-overlay" />
                      <div className="val-map-card-content">
                        <div className="val-map-card-name">{map.name}</div>
                        <div className="val-map-card-sub">{map.matches} trận ({map.wins}W - {map.losses}L)</div>
                        <div 
                          className="val-map-card-badge"
                          style={{ 
                            color: map.winrate >= 50 ? '#1ed760' : '#ff4655',
                            borderColor: map.winrate >= 50 ? 'rgba(30, 215, 96, 0.4)' : 'rgba(255, 70, 85, 0.4)'
                          }}
                        >
                          {map.winrate}% Win
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Weapons Analytics Section */}
            {profile.top_weapons && profile.top_weapons.length > 0 && (
              <div className="val-breakdown-section">
                <div className="val-section-title">
                  <span>Hiệu suất vũ khí hàng đầu ({profile.top_weapons.length})</span>
                </div>
                <div className="val-tracker-weapons-grid">
                  {profile.top_weapons.map((w) => (
                    <div key={w.name} className="val-tracker-weapon-card">
                      <div className="val-weapon-card-head">
                        <span className="val-weapon-name">{w.name}</span>
                        <span className="val-weapon-kills">{w.kills} KILLS</span>
                      </div>
                      <div className="val-weapon-silhouette-box">
                        {w.icon ? (
                          <img src={w.icon} alt={w.name} className="val-weapon-silhouette-thumb" />
                        ) : (
                          <div className="val-weapon-silhouette-thumb" />
                        )}
                      </div>
                      <div className="val-weapon-card-foot">
                        <div className="val-weapon-stat-unit">
                          <span className="lbl">HEADSHOT</span>
                          <span className="val" style={{ color: '#fbbf24' }}>{w.hs_pct}%</span>
                        </div>
                        <div className="val-weapon-stat-unit">
                          <span className="lbl">HẠ GỤC</span>
                          <span className="val">{w.kills}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Matches Section with Recent Form Streak & Filter Bar */}
            <div className="val-matches-section">
              {/* Recent Form Streak Banner */}
              {allMatches.length > 0 && (
                <div className="val-recent-form-banner">
                  <div className="val-form-left">
                    <span className="val-form-title">PHONG ĐỘ GẦN ĐÂY</span>
                    <div className="val-streak-pills-row">
                      {streakMatches.map((m, idx) => (
                        <div 
                          key={`streak-${m.match_id}-${idx}`}
                          className={`val-streak-pill ${m.has_won ? 'win' : 'loss'}`}
                          title={`${m.map} - ${m.mode}: ${m.has_won ? 'Chiến thắng' : 'Thất bại'} (${m.team_score} : ${m.enemy_score})`}
                        >
                          {m.has_won ? 'W' : 'L'}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="val-form-right">
                    <div className="val-form-metric">
                      <span className="metric-lbl">TỈ LỆ THẮNG (10 TRẬN)</span>
                      <span className="metric-val" style={{ color: streakWinrate >= 50 ? '#1ed760' : '#ff4655' }}>
                        {streakWinrate}% ({streakWins}W - {streakLosses}L)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Match Header with Filter Controls */}
              <div className="val-matches-controls-bar">
                <div className="val-section-title" style={{ margin: 0 }}>
                  <span>Lịch sử trận đấu ({filteredMatches.length}/{allMatches.length})</span>
                </div>

                {/* Filters */}
                <div className="val-matches-filters-row">
                  {/* Mode Filter Tabs */}
                  <div className="val-mode-filter-tabs">
                    {MODE_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        className={`val-match-filter-btn ${selectedMode === tab.id ? 'active' : ''}`}
                        onClick={() => setSelectedMode(tab.id)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Outcome Filter (All / Win / Loss) */}
                  <div className="val-outcome-filter-tabs">
                    <button
                      type="button"
                      className={`val-outcome-filter-btn ${selectedOutcome === 'all' ? 'active' : ''}`}
                      onClick={() => setSelectedOutcome('all')}
                    >
                      TẤT CẢ
                    </button>
                    <button
                      type="button"
                      className={`val-outcome-filter-btn win ${selectedOutcome === 'win' ? 'active' : ''}`}
                      onClick={() => setSelectedOutcome('win')}
                    >
                      THẮNG
                    </button>
                    <button
                      type="button"
                      className={`val-outcome-filter-btn loss ${selectedOutcome === 'loss' ? 'active' : ''}`}
                      onClick={() => setSelectedOutcome('loss')}
                    >
                      THUA
                    </button>
                  </div>
                </div>
              </div>

              {/* Matches List */}
              <div className="val-matches-list">
                {filteredMatches.length > 0 ? (
                  filteredMatches.map((m) => (
                    <ValorantMatchCard key={m.match_id} match={m} />
                  ))
                ) : (
                  <div className="val-matches-empty-state">
                    Không có trận đấu nào phù hợp với bộ lọc được chọn.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
