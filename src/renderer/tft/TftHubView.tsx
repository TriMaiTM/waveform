import React, { useState, useEffect, useRef } from 'react'
import { TftComp } from '../../shared/tft-types'
import TftCompCard from './TftCompCard'
import TftCompDetailModal from './TftCompDetailModal'
import { 
  IoSearchOutline, 
  IoRefreshOutline, 
  IoGameControllerOutline, 
  IoChevronDownOutline,
  IoCheckmarkOutline,
  IoFilterOutline,
  IoArrowBackOutline
} from 'react-icons/io5'

interface RankDef {
  id: string;
  name: string;
  count: string;
  wing?: string;
  color?: string;
}

const ALL_RANKS: RankDef[] = [
  { id: 'UNKNOWN', name: 'Unknown', count: '24.760' },
  { id: 'IRON', name: 'Iron', count: '13.841', wing: 'https://cdn.metatft.com/file/metatft/ranks/wings_iron.png' },
  { id: 'BRONZE', name: 'Bronze', count: '266.255', wing: 'https://cdn.metatft.com/file/metatft/ranks/wings_bronze.png' },
  { id: 'SILVER', name: 'Silver', count: '827.476', wing: 'https://cdn.metatft.com/file/metatft/ranks/wings_silver.png' },
  { id: 'GOLD', name: 'Gold', count: '1.779.040', wing: 'https://cdn.metatft.com/file/metatft/ranks/wings_gold.png' },
  { id: 'PLATINUM', name: 'Platinum', count: '1.173.416', wing: 'https://cdn.metatft.com/file/metatft/ranks/wings_platinum.png' },
  { id: 'EMERALD', name: 'Emerald', count: '469.088', wing: 'https://cdn.metatft.com/file/metatft/ranks/wings_emerald.png' },
  { id: 'DIAMOND', name: 'Diamond', count: '138.520', wing: 'https://cdn.metatft.com/file/metatft/ranks/wings_diamond.png' },
  { id: 'MASTER', name: 'Master', count: '37.016', wing: 'https://cdn.metatft.com/file/metatft/ranks/wings_master.png' },
  { id: 'GRANDMASTER', name: 'Grandmaster', count: '11.296', wing: 'https://cdn.metatft.com/file/metatft/ranks/wings_grandmaster.png' },
  { id: 'CHALLENGER', name: 'Challenger', count: '5.088', wing: 'https://cdn.metatft.com/file/metatft/ranks/wings_challenger.png' }
];

const DEFAULT_RANKS = ['PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];

const UnknownRankIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="5" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </svg>
);

// Error boundary to prevent black screen crashes
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class TftErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[TFT Hub Crash Caught]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '32px', color: '#fff', backgroundColor: '#181818', borderRadius: '8px', margin: '24px', border: '1px solid #333' }}>
          <h2 style={{ color: '#ef4444', margin: '0 0 12px 0', fontSize: '20px' }}>⚠️ Đã xảy ra lỗi khi hiển thị Đấu Trường Chân Lý</h2>
          <p style={{ color: '#aaa', fontSize: '14px', margin: '0 0 16px 0' }}>{this.state.error?.message}</p>
          <pre style={{ backgroundColor: '#121212', padding: '12px', borderRadius: '4px', overflowX: 'auto', fontSize: '12px', color: '#ff7b72', maxHeight: '200px' }}>
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: '16px', padding: '10px 20px', background: '#1ed760', color: '#000', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 700, fontSize: '14px' }}
          >
            Thử lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function TftHubContent({ onBackToHub }: { onBackToHub?: () => void }) {
  const [comps, setComps] = useState<TftComp[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Filters & Controls
  const [selectedRanks, setSelectedRanks] = useState<string[]>(DEFAULT_RANKS)
  const [tempRanks, setTempRanks] = useState<string[]>(DEFAULT_RANKS)
  const [selectedDays, setSelectedDays] = useState<number>(1) // Default to Last Day (24h) like MetaTFT
  const [sortBy, setSortBy] = useState<'avg' | 'pick' | 'win' | 'top4'>('avg')
  const [playstyleFilter, setPlaystyleFilter] = useState<'all' | 'fast' | 'reroll'>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedComp, setSelectedComp] = useState<TftComp | null>(null)

  // Custom Rank Popover
  const [isRankOpen, setIsRankOpen] = useState<boolean>(false)
  const rankRef = useRef<HTMLDivElement>(null)

  // Sync temp ranks when opening
  const handleOpenRank = () => {
    setTempRanks(selectedRanks)
    setIsRankOpen(!isRankOpen)
  }

  // Close rank popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rankRef.current && !rankRef.current.contains(event.target as Node)) {
        setIsRankOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadData = (forceRefresh: boolean = false, rankList: string[] = selectedRanks, days: number = selectedDays) => {
    if (forceRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    const rankQuery = rankList && rankList.length > 0 ? rankList.join(',') : DEFAULT_RANKS.join(',')

    if (!window.api || !window.api.tft) {
      setError('window.api.tft không khả dụng. Vui lòng khởi động lại ứng dụng.')
      setLoading(false)
      setRefreshing(false)
      return
    }

    const req: Promise<TftComp[]> = forceRefresh 
      ? window.api.tft.refreshData(rankQuery, days) 
      : window.api.tft.getTierList(rankQuery, days)

    req
      .then((data: TftComp[]) => {
        setComps(Array.isArray(data) ? data : [])
        setLoading(false)
        setRefreshing(false)
      })
      .catch((err: any) => {
        console.error('Failed to load TFT comps:', err)
        setError(err.message || 'Không thể tải dữ liệu đội hình TFT.')
        setLoading(false)
        setRefreshing(false)
      })
  }

  useEffect(() => {
    loadData(false, selectedRanks, selectedDays)
  }, [selectedRanks, selectedDays])

  const toggleRank = (id: string) => {
    if (tempRanks.includes(id)) {
      if (tempRanks.length > 1) {
        setTempRanks(tempRanks.filter(r => r !== id))
      }
    } else {
      setTempRanks([...tempRanks, id])
    }
  }

  const applyRankSelection = () => {
    const nextRanks = tempRanks.length > 0 ? tempRanks : DEFAULT_RANKS
    setSelectedRanks(nextRanks)
    setIsRankOpen(false)
  }

  // Filter comps safely
  const safeComps = Array.isArray(comps) ? comps : []
  const filteredComps = safeComps.filter((c) => {
    if (!c) return false

    // 1. Playstyle filter
    const levelling = (c.levelling || '').toLowerCase()
    if (playstyleFilter === 'fast' && !levelling.includes('fast')) {
      return false
    }
    if (playstyleFilter === 'reroll' && !levelling.includes('reroll') && !levelling.includes('lvl')) {
      return false
    }

    // 2. Search query (Filter Comps)
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true

    const matchName = (c.name || '').toLowerCase().includes(q)
    const matchLevelling = levelling.includes(q)
    const units = Array.isArray(c.units) ? c.units : []
    const traits = Array.isArray(c.traits) ? c.traits : []
    const matchUnit = units.some((u) => (u?.name || '').toLowerCase().includes(q))
    const matchTrait = traits.some((t) => (t?.name || '').toLowerCase().includes(q))

    return matchName || matchLevelling || matchUnit || matchTrait
  })

  // Sort comps safely
  const sortedComps = [...filteredComps].sort((a, b) => {
    if (sortBy === 'avg') return (a.avgPlacement || 5) - (b.avgPlacement || 5)
    if (sortBy === 'pick') return (b.pickRate || 0) - (a.pickRate || 0)
    if (sortBy === 'win') return (b.winRate || 0) - (a.winRate || 0)
    if (sortBy === 'top4') return (b.top4Rate || 0) - (a.top4Rate || 0)
    return 0
  })

  // Group by Tier
  const tierOrder: Array<'S' | 'A' | 'B' | 'C' | 'D'> = ['S', 'A', 'B', 'C', 'D']
  const compsByTier: Record<string, TftComp[]> = {
    S: [], A: [], B: [], C: [], D: []
  }

  for (const c of sortedComps) {
    const t = c.tier || 'D'
    if (compsByTier[t]) {
      compsByTier[t].push(c)
    } else {
      compsByTier.D.push(c)
    }
  }

  // Determine button icon and label safely
  const primaryRankDef = ALL_RANKS.find(r => selectedRanks.includes(r.id)) || ALL_RANKS[5]
  const isDefaultGroup = DEFAULT_RANKS.every(r => selectedRanks.includes(r)) && selectedRanks.length === DEFAULT_RANKS.length
  const rankLabel = isDefaultGroup 
    ? 'Platinum+' 
    : selectedRanks.length === 1 
      ? (ALL_RANKS.find(r => r.id === selectedRanks[0])?.name || selectedRanks[0])
      : `${ALL_RANKS.find(r => r.id === selectedRanks[0])?.name || 'Rank'} (${selectedRanks.length})`

  return (
    <div className="tft-hub-container">
      {/* 1. Header & Title */}
      <div className="tft-header">
        <div className="tft-title-row">
          <div className="tft-title-area">
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '4px' }}>
              
              <h1 style={{ margin: 0 }}>
                <IoGameControllerOutline style={{ color: '#1ed760' }} />
                Đấu Trường Chân Lý - Meta Tier List
              </h1>
            </div>
            <p className="tft-subtitle">
              Thống kê trận đấu Xếp Hạng (Ranked 1100) theo thời gian thực từ MetaTFT
            </p>
          </div>

          <button 
            className="tft-btn-refresh" 
            onClick={() => loadData(true, selectedRanks, selectedDays)}
            disabled={loading || refreshing}
            title="Tải lại dữ liệu mới nhất từ máy chủ"
          >
            <IoRefreshOutline 
              size={16} 
              style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} 
            />
            <span>{refreshing ? 'Đang cập nhật...' : 'Làm mới'}</span>
          </button>
        </div>

        {/* 2. Controls Toolbar */}
        <div className="tft-toolbar">
          <div className="tft-toolbar-left">
            {/* Mode: Always Ranked */}
            <span className="tft-badge-pill" title="Chế độ đấu Xếp Hạng">
              <IoFilterOutline size={14} style={{ color: '#1ed760' }} />
              Ranked
            </span>

            {/* Timeframe Dropdown (24h / 3 ngày / 7 ngày) */}
            <div className="tft-select-wrapper" title="Khoảng thời gian thống kê">
              <select 
                className="tft-select" 
                value={selectedDays}
                onChange={(e: any) => setSelectedDays(Number(e.target.value))}
                disabled={loading || refreshing}
              >
                <option value={1}>24h qua (Last Day)</option>
                <option value={3}>3 ngày qua</option>
                <option value={7}>7 ngày qua</option>
              </select>
              <IoChevronDownOutline className="tft-select-arrow" />
            </div>

            {/* Full Rank Multi-Select Popover with Wings and Checkboxes */}
            <div className="tft-rank-dropdown-container" ref={rankRef}>
              <button 
                type="button"
                className="tft-rank-btn"
                onClick={handleOpenRank}
                title="Lựa chọn đầy đủ các bậc xếp hạng"
              >
                {primaryRankDef.wing ? (
                  <img src={primaryRankDef.wing} alt={primaryRankDef.name} className="tft-rank-wing-icon" />
                ) : (
                  <UnknownRankIcon />
                )}
                <span>{rankLabel}</span>
                <IoChevronDownOutline size={12} style={{ color: '#888' }} />
              </button>

              {isRankOpen && (
                <div className="tft-rank-full-popover">
                  <div className="tft-rank-list">
                    {ALL_RANKS.map((item) => {
                      const isChecked = tempRanks.includes(item.id)
                      return (
                        <div 
                          key={item.id} 
                          className={`tft-rank-item-row ${isChecked ? 'is-checked' : ''}`}
                          onClick={() => toggleRank(item.id)}
                        >
                          <div className="tft-rank-item-left">
                            {item.wing ? (
                              <img src={item.wing} alt={item.name} className="tft-rank-wing-icon" />
                            ) : (
                              <UnknownRankIcon />
                            )}
                            <span className="tft-rank-item-name">{item.name}</span>
                          </div>

                          <div className="tft-rank-item-right">
                            <span className="tft-rank-item-count">{item.count}</span>
                            <div className={`tft-rank-checkbox ${isChecked ? 'checked' : ''}`}>
                              {isChecked && (
                                <IoCheckmarkOutline size={14} color="#ef4444" strokeWidth={3} />
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <button 
                    type="button" 
                    className="tft-rank-apply-btn"
                    onClick={applyRankSelection}
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="tft-select-wrapper">
              <span style={{ fontSize: '12px', color: '#888', marginRight: '6px' }}>Sắp xếp:</span>
              <select 
                className="tft-select" 
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
              >
                <option value="avg">Avg Placement (Hạng TB)</option>
                <option value="pick">Pick Rate (Tỉ lệ chọn)</option>
                <option value="win">Win Rate (Tỉ lệ thắng)</option>
                <option value="top4">Top 4 Rate (Tỉ lệ Top 4)</option>
              </select>
              <IoChevronDownOutline className="tft-select-arrow" />
            </div>

            {/* Unified Playstyle Dropdown */}
            <div className="tft-select-wrapper">
              <span style={{ fontSize: '12px', color: '#888', marginRight: '6px' }}>Lối chơi:</span>
              <select 
                className="tft-select" 
                value={playstyleFilter}
                onChange={(e: any) => setPlaystyleFilter(e.target.value)}
              >
                <option value="all">Tất cả bài đấu</option>
                <option value="fast">Fast 8 / Fast 9</option>
                <option value="reroll">Reroll (lvl 5/6/7)</option>
              </select>
              <IoChevronDownOutline className="tft-select-arrow" />
            </div>
          </div>

          <div className="tft-toolbar-right">
            {/* Filter Comps Search Box */}
            <div className="tft-search-box">
              <IoSearchOutline size={16} style={{ color: '#888' }} />
              <input 
                type="text" 
                placeholder="Filter Comps (Tướng, bài...)" 
                value={searchQuery}
                onChange={(e: any) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  className="tft-search-clear" 
                  onClick={() => setSearchQuery('')}
                  title="Xóa tìm kiếm"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Error Banner */}
      {error && (
        <div className="tft-error-banner">
          <span>{error}</span>
          <button onClick={() => loadData(true, selectedRanks, selectedDays)}>Thử lại</button>
        </div>
      )}

      {/* 4. Main Content: Comps Grouped by Tier */}
      {loading ? (
        <div className="tft-loading-state">
          <IoRefreshOutline size={36} className="tft-spin" />
          <p>Đang tổng hợp dữ liệu Meta Tier List từ MetaTFT...</p>
        </div>
      ) : filteredComps.length === 0 ? (
        <div className="tft-empty-state">
          <p>Không tìm thấy đội hình nào phù hợp với bộ lọc.</p>
          <button 
            className="tft-btn-reset" 
            onClick={() => {
              setSearchQuery('')
              setPlaystyleFilter('all')
              setSelectedRanks(DEFAULT_RANKS)
            }}
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="tft-comps-tier-groups">
          {tierOrder.map((tier) => {
            const list = compsByTier[tier] || []
            if (list.length === 0) return null

            return (
              <div key={tier} className="tft-tier-group">
                <div className="tft-tier-group-header">
                  <div className={`tft-tier-group-badge tier-${tier.toLowerCase()}`}>
                    Tier {tier}
                  </div>
                  <span className="tft-tier-group-count">
                    {list.length} đội hình
                  </span>
                </div>

                <div className="tft-comps-grid">
                  {list.map((comp) => (
                    <TftCompCard 
                      key={comp.clusterId || Math.random().toString()} 
                      comp={comp} 
                      onClick={() => setSelectedComp(comp)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 5. Detail Modal */}
      {selectedComp && (
        <TftCompDetailModal 
          comp={selectedComp} 
          onClose={() => setSelectedComp(null)} 
        />
      )}
    </div>
  )
}

export default function TftHubView({ onBackToHub }: { onBackToHub?: () => void } = {}) {
  return (
    <TftErrorBoundary>
      <TftHubContent onBackToHub={onBackToHub} />
    </TftErrorBoundary>
  );
}
