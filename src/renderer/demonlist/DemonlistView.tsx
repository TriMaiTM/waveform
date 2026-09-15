import React, { useState, useEffect, useMemo } from 'react'
import { GdDemonLevel } from '../../shared/types'
import { 
  IoFlame, 
  IoSearchOutline, 
  IoRefreshOutline, 
  IoCopyOutline, 
  IoCheckmarkOutline, 
  IoHelpCircleOutline
} from 'react-icons/io5'
import DemonDetailModal from './DemonDetailModal'
import DemonTagHelpModal from './DemonTagHelpModal'
import './demonlist.css'

export default function DemonlistView() {
  const [demons, setDemons] = useState<GdDemonLevel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'extreme' | 'main' | 'extended' | 'legacy' | 'all'>('extreme');
  const [selectedDemon, setSelectedDemon] = useState<GdDemonLevel | null>(null);
  const [showTagHelp, setShowTagHelp] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const loadData = async (forceRefresh: boolean = false) => {
    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const list = await window.api.gd.getDemons(forceRefresh);
      setDemons(list || []);
    } catch (err: any) {
      console.error('[GD Demonlist] Load error:', err);
      setError(err.message || 'Không thể tải danh sách Demonlist');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyId = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    navigator.clipboard.writeText(String(id));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredDemons = useMemo(() => {
    let result = demons;

    if (activeFilter === 'extreme') {
      result = result.filter(d => d.position <= 1582);
    } else if (activeFilter === 'main') {
      result = result.filter(d => d.position <= 75);
    } else if (activeFilter === 'extended') {
      result = result.filter(d => d.position > 75 && d.position <= 150);
    } else if (activeFilter === 'legacy') {
      result = result.filter(d => d.position > 1582);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(d => 
        d.name.toLowerCase().includes(q) ||
        String(d.level_id).includes(q) ||
        (d.publisher && d.publisher.toLowerCase().includes(q)) ||
        (d.verifier && d.verifier.toLowerCase().includes(q))
      );
    }

    return result;
  }, [demons, activeFilter, searchQuery]);

  return (
    <div className="gd-page-wrapper">
      {/* Pinned Top Area: Header + Toolbar (Never scrolls, zero gap) */}
      <div className="gd-top-section">
        <div className="gd-header-row">
          <div className="gd-title-area">
            <h1>
              <IoFlame style={{ color: '#ff5e00' }} />
              Extreme Demonlist
            </h1>
            <p className="gd-subtitle">
              Bảng xếp hạng 1.582 Extreme Demons chính thức & 33 Legacy Demons từ Pointercrate & AREDL
            </p>
          </div>

          <div className="gd-header-actions">
            <button 
              className="gd-btn-refresh"
              onClick={() => loadData(true)}
              disabled={loading || refreshing}
              title="Làm mới danh sách Demonlist"
            >
              <IoRefreshOutline size={16} className={refreshing ? 'spinner' : ''} />
              <span>{refreshing ? 'Đang cập nhật...' : 'Làm mới'}</span>
            </button>
          </div>
        </div>

        <div className="gd-toolbar-row">
          <div className="gd-search-group">
            <div className="gd-search-box">
              <IoSearchOutline size={18} color="#888" />
              <input 
                type="text" 
                placeholder="Tìm theo tên Demon, Level ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button 
              className="gd-help-btn"
              onClick={() => setShowTagHelp(true)}
              title="Xem bảng giải thích các Tag (2.1, 2.2, timings, wave...)"
            >
              <IoHelpCircleOutline size={20} />
            </button>
          </div>

          <div className="gd-filter-tabs">
            <button 
              className={`gd-tab-btn ${activeFilter === 'extreme' ? 'active' : ''}`}
              onClick={() => setActiveFilter('extreme')}
            >
              Extreme Demons (1 - 1582)
            </button>
            <button 
              className={`gd-tab-btn ${activeFilter === 'main' ? 'active' : ''}`}
              onClick={() => setActiveFilter('main')}
            >
              Main List (1 - 75)
            </button>
            <button 
              className={`gd-tab-btn ${activeFilter === 'extended' ? 'active' : ''}`}
              onClick={() => setActiveFilter('extended')}
            >
              Extended (76 - 150)
            </button>
            <button 
              className={`gd-tab-btn ${activeFilter === 'legacy' ? 'active' : ''}`}
              onClick={() => setActiveFilter('legacy')}
            >
              Legacy (1583+)
            </button>
            <button 
              className={`gd-tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              Toàn bộ ({demons.length})
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Body containing Demon rows */}
      <div className="gd-scroll-body">
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#a7a7a7' }}>
            <div className="spinner" style={{ margin: '0 auto 16px auto', width: '32px', height: '32px' }} />
            <p style={{ margin: 0, fontSize: '14px' }}>Đang nạp dữ liệu Extreme Demonlist...</p>
          </div>
        )}

        {error && !loading && (
          <div style={{ background: '#3b1c1c', border: '1px solid #702e2e', padding: '16px 20px', borderRadius: '8px', marginBottom: '20px' }}>
            <p style={{ color: '#ff7b7b', margin: '0 0 10px 0' }}>{error}</p>
            <button className="gd-btn-refresh" onClick={() => loadData(true)}>Thử lại</button>
          </div>
        )}

        {!loading && !error && (
          <>
            {filteredDemons.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#777' }}>
                <p>Không tìm thấy Demon nào phù hợp với bộ lọc.</p>
              </div>
            ) : (
              <div className="gd-demons-list">
                {filteredDemons.map((demon) => {
                  const isTop1 = demon.position === 1;
                  const isTop3 = demon.position <= 3;
                  const rankClass = isTop1 ? 'top-1' : isTop3 ? 'top-3' : '';

                  return (
                    <div 
                      key={demon.id}
                      className="gd-demon-row"
                      onClick={() => setSelectedDemon(demon)}
                      title={`Nhấp để xem video gameplay và chi tiết ${demon.name}`}
                    >
                      {/* Rank: Placement number without '#' */}
                      <div className={`gd-row-rank ${rankClass}`}>
                        {demon.position}
                      </div>

                      {/* Thumbnail: YouTube verification banner */}
                      <div className="gd-row-thumbnail">
                        {demon.thumbnail ? (
                          <img 
                            src={demon.thumbnail} 
                            alt={demon.name} 
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }} 
                          />
                        ) : null}

                        <div 
                          className="gd-row-thumb-fallback" 
                          style={{ display: demon.thumbnail ? 'none' : 'flex' }}
                        >
                          <IoFlame size={24} />
                          <span>DEMON</span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="gd-row-info">
                        <div className="gd-row-title-line">
                          <span className="gd-row-name">{demon.name}</span>
                          {demon.points !== undefined && demon.points > 0 && (
                            <span className="gd-row-points">
                              {demon.points} pts
                            </span>
                          )}
                          {demon.gddl_tier && (
                            <span className="gd-row-tier">
                              Tier {demon.gddl_tier !== undefined && demon.gddl_tier !== null ? Math.round(demon.gddl_tier * 10) / 10 : '-'}
                            </span>
                          )}
                        </div>

                        <div className="gd-row-meta-line">
                          <div className="gd-row-id-pill">
                            <span>ID: {demon.level_id}</span>
                            <button 
                              className="gd-row-copy-btn"
                              onClick={(e) => handleCopyId(e, demon.level_id)}
                              title={`Copy Level ID: ${demon.level_id}`}
                            >
                              {copiedId === demon.level_id ? (
                                <IoCheckmarkOutline size={14} style={{ color: '#57f287' }} />
                              ) : (
                                <IoCopyOutline size={14} />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Tags */}
                        {demon.tags && demon.tags.length > 0 && (
                          <div className="gd-row-tags-line">
                            {demon.tags.slice(0, 5).map((tag) => (
                              <span key={tag} className="gd-tag-pill">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {selectedDemon && (
        <DemonDetailModal 
          demon={selectedDemon} 
          onClose={() => setSelectedDemon(null)} 
        />
      )}

      {showTagHelp && (
        <DemonTagHelpModal 
          onClose={() => setShowTagHelp(false)} 
        />
      )}
    </div>
  );
}
