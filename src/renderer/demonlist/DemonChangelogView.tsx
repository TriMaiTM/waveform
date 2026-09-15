import React, { useState, useEffect, useMemo } from 'react'
import { GdChangelogItem } from '../../shared/types'
import { 
  IoRefreshOutline, 
  IoSearchOutline, 
  IoChatbubblesOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoAddOutline
} from 'react-icons/io5'
import './demonlist.css'

export default function DemonChangelogView() {
  const [items, setItems] = useState<GdChangelogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterAction, setFilterAction] = useState<'all' | 'Raised' | 'Lowered' | 'Placed'>('all');
  
  const [userReactions, setUserReactions] = useState<{ [key: string]: { [emoji: string]: boolean } }>({});

  const loadData = async (forceRefresh: boolean = false) => {
    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const list = await window.api.gd.getChangelog(forceRefresh);
      setItems(list || []);
    } catch (err: any) {
      console.error('[GD Changelog] Load error:', err);
      setError(err.message || 'Không thể tải Changelog');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleReaction = (itemId: string, emojiKey: 'thumbsUp' | 'thumbsDown' | 'angry' | 'skull') => {
    setUserReactions(prev => {
      const itemReactions = prev[itemId] || {};
      const isCurrentlyActive = !!itemReactions[emojiKey];
      return {
        ...prev,
        [itemId]: {
          ...itemReactions,
          [emojiKey]: !isCurrentlyActive
        }
      };
    });
  };

  const formatTimestamp = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      
      if (isToday) {
        return `Hôm nay, lúc ${timeStr}`;
      }
      return `${date.toLocaleDateString('vi-VN')}, lúc ${timeStr}`;
    } catch (e) {
      return isoString;
    }
  };

  const filteredItems = useMemo(() => {
    let result = items;

    if (filterAction !== 'all') {
      result = result.filter(i => i.action_type === filterAction);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(i => 
        i.affected_level.name.toLowerCase().includes(q) ||
        (i.level_above && i.level_above.name.toLowerCase().includes(q)) ||
        (i.level_below && i.level_below.name.toLowerCase().includes(q))
      );
    }

    return result;
  }, [items, filterAction, searchQuery]);

  return (
    <div className="gd-page-wrapper">
      {/* Pinned Top Area: Header + Toolbar (Never scrolls, zero gap) */}
      <div className="gd-top-section">
        <div className="gd-header-row">
          <div className="gd-title-area">
            <h1>
              <IoChatbubblesOutline style={{ color: '#5865f2' }} />
              Demonlist Changelog
            </h1>
            <p className="gd-subtitle">
              Nhật ký cập nhật biến động thứ hạng thời gian thực (Discord Feed format)
            </p>
          </div>

          <div className="gd-header-actions">
            <button 
              className="gd-btn-refresh"
              onClick={() => loadData(true)}
              disabled={loading || refreshing}
              title="Tải lại nhật ký mới nhất"
            >
              <IoRefreshOutline size={16} className={refreshing ? 'spinner' : ''} />
              <span>{refreshing ? 'Đang cập nhật...' : 'Làm mới'}</span>
            </button>
          </div>
        </div>

        <div className="gd-toolbar-row">
          <div className="gd-search-group" style={{ maxWidth: '420px' }}>
            <div className="gd-search-box">
              <IoSearchOutline size={18} color="#888" />
              <input 
                type="text" 
                placeholder="Tìm theo tên Demon trong log..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="gd-filter-tabs">
            <button 
              className={`gd-tab-btn ${filterAction === 'all' ? 'active' : ''}`}
              onClick={() => setFilterAction('all')}
            >
              Tất cả ({items.length})
            </button>
            <button 
              className={`gd-tab-btn ${filterAction === 'Raised' ? 'active' : ''}`}
              onClick={() => setFilterAction('Raised')}
              style={filterAction === 'Raised' ? { backgroundColor: '#57f287', borderColor: '#57f287', color: '#000' } : {}}
            >
              <IoArrowUpOutline size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Raised (Tăng hạng)
            </button>
            <button 
              className={`gd-tab-btn ${filterAction === 'Lowered' ? 'active' : ''}`}
              onClick={() => setFilterAction('Lowered')}
              style={filterAction === 'Lowered' ? { backgroundColor: '#ed4245', borderColor: '#ed4245', color: '#fff' } : {}}
            >
              <IoArrowDownOutline size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Lowered (Giảm hạng)
            </button>
            <button 
              className={`gd-tab-btn ${filterAction === 'Placed' ? 'active' : ''}`}
              onClick={() => setFilterAction('Placed')}
              style={filterAction === 'Placed' ? { backgroundColor: '#faa81a', borderColor: '#faa81a', color: '#000' } : {}}
            >
              <IoAddOutline size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Placed (Thêm mới)
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Body: Discord container stretches all the way down */}
      <div className="gd-scroll-body" style={{ background: '#181818' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#a7a7a7' }}>
            <div className="spinner" style={{ margin: '0 auto 16px auto', width: '32px', height: '32px' }} />
            <p style={{ margin: 0, fontSize: '14px' }}>Đang nạp Discord Changelog feed...</p>
          </div>
        )}

        {error && !loading && (
          <div style={{ background: '#3b1c1c', border: '1px solid #702e2e', padding: '16px 20px', borderRadius: '8px', marginBottom: '20px' }}>
            <p style={{ color: '#ff7b7b', margin: '0 0 10px 0' }}>{error}</p>
            <button className="gd-btn-refresh" onClick={() => loadData(true)}>Thử lại</button>
          </div>
        )}

        {!loading && !error && (
          <div className="discord-feed-container">
            {/* Channel Bar */}
            <div className="discord-feed-header">
              <div className="discord-channel-info">
                <span className="discord-channel-hashtag">#</span>
                <span className="discord-channel-title">changelog</span>
                <span className="discord-channel-desc">Demonlist placement & ranking change notifications</span>
              </div>
              <span style={{ fontSize: '12px', color: '#949ba4' }}>
                {filteredItems.length} thông báo
              </span>
            </div>

            {filteredItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#80848e' }}>
                <p>Không có thông báo nào phù hợp với tìm kiếm.</p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const activeReactions = userReactions[item.id] || {};
                const thumbsUpCount = (item.reactions?.thumbsUp || 100) + (activeReactions.thumbsUp ? 1 : 0);
                const thumbsDownCount = (item.reactions?.thumbsDown || 20) + (activeReactions.thumbsDown ? 1 : 0);
                const angryCount = (item.reactions?.angry || 50) + (activeReactions.angry ? 1 : 0);
                const skullCount = (item.reactions?.skull || 40) + (activeReactions.skull ? 1 : 0);

                const roleBadge = item.author_name === 'Arkane' ? '🎂 LEADER' : item.author_name === '#RateTTG' ? '📑 MOD' : 'BOT';
                const roleClass = item.author_name === 'Arkane' ? 'mod' : item.author_name === '#RateTTG' ? 'mod' : 'bot';

                return (
                  <div key={item.id} className="discord-message">
                    <img 
                      src={item.author_avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                      alt={item.author_name} 
                      className="discord-avatar"
                    />

                    <div className="discord-message-content">
                      <div className="discord-author-row">
                        <span className="discord-author-name">{item.author_name || '#RateTTG'}</span>
                        <span className={`discord-role-badge ${roleClass}`}>{roleBadge}</span>
                        <span className="discord-timestamp">{formatTimestamp(item.created_at)}</span>
                      </div>

                      <p className="discord-text">
                        <span className="discord-level-name">{item.affected_level.name}</span>
                        {' has been '}
                        {item.action_type === 'Raised' && (
                          <>
                            <span className="discord-action-raised">raised</span>
                            {' from '}
                            <span className="discord-rank-highlight">#{item.old_position}</span>
                            {' to '}
                            <span className="discord-rank-highlight">#{item.new_position}</span>
                            {item.level_above && item.level_below ? (
                              <>, above <span className="discord-level-name">{item.level_below.name}</span> and below <span className="discord-level-name">{item.level_above.name}</span>.</>
                            ) : '.'}
                          </>
                        )}

                        {item.action_type === 'Lowered' && (
                          <>
                            <span className="discord-action-lowered">lowered</span>
                            {' from '}
                            <span className="discord-rank-highlight">#{item.old_position}</span>
                            {' to '}
                            <span className="discord-rank-highlight">#{item.new_position}</span>
                            {item.level_above && item.level_below ? (
                              <>, above <span className="discord-level-name">{item.level_below.name}</span> and below <span className="discord-level-name">{item.level_above.name}</span>.</>
                            ) : '.'}
                          </>
                        )}

                        {item.action_type === 'Placed' && (
                          <>
                            <span className="discord-action-placed">placed</span>
                            {' at '}
                            <span className="discord-rank-highlight">#{item.new_position}</span>
                            {item.level_above && item.level_below ? (
                              <>, above <span className="discord-level-name">{item.level_below.name}</span> and below <span className="discord-level-name">{item.level_above.name}</span>.</>
                            ) : '.'}
                          </>
                        )}

                        {item.action_type === 'Removed' && (
                          <>
                            <span className="discord-action-lowered">removed</span>
                            {' from '}
                            <span className="discord-rank-highlight">#{item.old_position}</span>.
                          </>
                        )}

                        {item.action_type === 'Unknown' && (
                          <>
                            {'updated on the list at '}
                            <span className="discord-rank-highlight">#{item.new_position}</span>.
                          </>
                        )}
                      </p>

                      <div className="discord-mention" title="Ping notification role">
                        @Notify Changelog
                      </div>

                      <div className="discord-reactions-row">
                        <button 
                          className={`discord-reaction-pill ${activeReactions.thumbsUp ? 'active' : ''}`}
                          onClick={() => handleToggleReaction(item.id, 'thumbsUp')}
                          title="Reaction Thumbs Up"
                        >
                          <span>👍</span>
                          <span>{thumbsUpCount}</span>
                        </button>

                        <button 
                          className={`discord-reaction-pill ${activeReactions.thumbsDown ? 'active' : ''}`}
                          onClick={() => handleToggleReaction(item.id, 'thumbsDown')}
                          title="Reaction Thumbs Down"
                        >
                          <span>👎</span>
                          <span>{thumbsDownCount}</span>
                        </button>

                        <button 
                          className={`discord-reaction-pill ${activeReactions.angry ? 'active' : ''}`}
                          onClick={() => handleToggleReaction(item.id, 'angry')}
                          title="Reaction Angry"
                        >
                          <span>🤬</span>
                          <span>{angryCount}</span>
                        </button>

                        <button 
                          className={`discord-reaction-pill ${activeReactions.skull ? 'active' : ''}`}
                          onClick={() => handleToggleReaction(item.id, 'skull')}
                          title="Reaction Skull"
                        >
                          <span>💀</span>
                          <span>{skullCount}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
