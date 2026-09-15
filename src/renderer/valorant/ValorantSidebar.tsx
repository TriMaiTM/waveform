import React from 'react'
import { ValorantSearchItem } from '../../shared/valorant-types'
import { 
  IoBookmark, 
  IoTimeOutline, 
  IoStatsChart, 
  IoShieldOutline, 
  IoPeopleOutline,
  IoCubeOutline
} from 'react-icons/io5'

export type ValorantSubtab = 'tracker' | 'weapons' | 'agents' | 'collection';

interface ValorantSidebarProps {
  activeSubtab?: ValorantSubtab;
  onSelectSubtab?: (tab: ValorantSubtab) => void;
  pinnedPlayer: ValorantSearchItem | null;
  history: ValorantSearchItem[];
  onSelectPlayer: (name: string, tag: string) => void;
  activePlayer: string | null;
}

export default function ValorantSidebar({ 
  activeSubtab = 'tracker',
  onSelectSubtab,
  pinnedPlayer, 
  history, 
  onSelectPlayer, 
  activePlayer 
}: ValorantSidebarProps) {
  return (
    <aside className="val-sidebar">
      {/* Top Navigation Tabs: Tracker / Weapons / Agents / Collection */}
      <div className="val-sidebar-nav-block">
        <div className="val-sidebar-title">DANH MỤC VALORANT</div>
        <div className="val-sidebar-nav-tabs">
          <button
            type="button"
            className={`val-nav-tab-btn ${activeSubtab === 'tracker' ? 'active' : ''}`}
            onClick={() => onSelectSubtab && onSelectSubtab('tracker')}
          >
            <IoStatsChart size={18} />
            <span>Tracker</span>
          </button>

          <button
            type="button"
            className={`val-nav-tab-btn ${activeSubtab === 'weapons' ? 'active' : ''}`}
            onClick={() => onSelectSubtab && onSelectSubtab('weapons')}
          >
            <IoShieldOutline size={18} />
            <span>Weapon</span>
          </button>

          <button
            type="button"
            className={`val-nav-tab-btn ${activeSubtab === 'agents' ? 'active' : ''}`}
            onClick={() => onSelectSubtab && onSelectSubtab('agents')}
          >
            <IoPeopleOutline size={18} />
            <span>Agent</span>
          </button>

          <button
            type="button"
            className={`val-nav-tab-btn ${activeSubtab === 'collection' ? 'active' : ''}`}
            onClick={() => onSelectSubtab && onSelectSubtab('collection')}
          >
            <IoCubeOutline size={18} />
            <span>Collection</span>
          </button>
        </div>
      </div>

      {/* Dynamic Content based on Active Subtab */}
      {activeSubtab === 'tracker' && (
        <>
          {/* Pinned / My Account */}
          <div className="val-sidebar-section">
            <div className="val-sidebar-title">Tài khoản đã ghim</div>
            {pinnedPlayer ? (
              <button 
                type="button"
                className={`val-history-item ${activePlayer === `${pinnedPlayer.name}#${pinnedPlayer.tag}` ? 'active' : ''}`}
                onClick={() => onSelectPlayer(pinnedPlayer.name, pinnedPlayer.tag)}
              >
                <div className="val-history-icon-wrap">
                  <IoBookmark color="#ff4655" size={16} />
                </div>
                <div className="val-history-info">
                  <span className="val-history-name">{pinnedPlayer.name}</span>
                  <span className="val-history-tag">#{pinnedPlayer.tag}</span>
                </div>
                {pinnedPlayer.tier_name && (
                  <span className="val-history-tier-pill">{pinnedPlayer.tier_name}</span>
                )}
              </button>
            ) : (
              <div className="val-sidebar-empty">
                Chưa có tài khoản nào được ghim. Nhấn nút <strong>Ghim hồ sơ</strong> khi tra cứu để lưu lại.
              </div>
            )}
          </div>

          {/* Search History */}
          <div className="val-sidebar-section val-sidebar-history-section">
            <div className="val-sidebar-title">Tìm kiếm gần đây</div>
            <div className="val-history-list">
              {history && history.length > 0 ? (
                history.map((h, i) => (
                  <button 
                    type="button"
                    key={`${h.name}-${h.tag}-${i}`}
                    className={`val-history-item ${activePlayer === `${h.name}#${h.tag}` ? 'active' : ''}`}
                    onClick={() => onSelectPlayer(h.name, h.tag)}
                  >
                    <div className="val-history-icon-wrap">
                      <IoTimeOutline size={16} color="#7b8b9a" />
                    </div>
                    <div className="val-history-info">
                      <span className="val-history-name">{h.name}</span>
                      <span className="val-history-tag">#{h.tag}</span>
                    </div>
                    {h.tier_name && (
                      <span className="val-history-tier-pill">{h.tier_name}</span>
                    )}
                  </button>
                ))
              ) : (
                <div className="val-sidebar-empty">
                  Chưa có lịch sử tìm kiếm.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeSubtab === 'weapons' && (
        <div className="val-sidebar-wiki-summary">
          <div className="val-sidebar-title">ARSENAL BLUEPRINT</div>
          <div className="val-wiki-guide-card">
            <div className="val-guide-tag">BẢN VẼ KỸ THUẬT</div>
            <p>Kho thông số 20 loại vũ khí chính thức từ Riot Games.</p>
            <div className="val-guide-feature-list">
              <div className="val-guide-feature-item">
                <span className="val-bullet">■</span>
                <span>Hình nộm đo sát thương 3 vùng (Đầu, Thân, Chân).</span>
              </div>
              <div className="val-guide-feature-item">
                <span className="val-bullet">■</span>
                <span>Bộ chọn cự ly đạn bắn (0-30m, 30-50m).</span>
              </div>
              <div className="val-guide-feature-item">
                <span className="val-bullet">■</span>
                <span>Độ xuyên tường, cỡ băng đạn & tốc độ nạp.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubtab === 'agents' && (
        <div className="val-sidebar-wiki-summary">
          <div className="val-sidebar-title">PROTOCOL ROSTER</div>
          <div className="val-wiki-guide-card">
            <div className="val-guide-tag" style={{ color: '#ff4655', borderColor: 'rgba(255, 70, 85, 0.4)' }}>
              HỒ SƠ TÁC CHIẾN
            </div>
            <p>Hồ sơ 29 Đặc vụ trong Giao thức Valorant.</p>
            <div className="val-guide-feature-list">
              <div className="val-guide-feature-item">
                <span className="val-bullet" style={{ color: '#ff4655' }}>■</span>
                <span>Tranh chân dung toàn thân sắc nét.</span>
              </div>
              <div className="val-guide-feature-item">
                <span className="val-bullet" style={{ color: '#ff4655' }}>■</span>
                <span>Toàn bộ 4-5 kỹ năng (C, Q, E, X) & mô tả.</span>
              </div>
              <div className="val-guide-feature-item">
                <span className="val-bullet" style={{ color: '#ff4655' }}>■</span>
                <span>4 Vai trò: Duelist, Initiator, Controller, Sentinel.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubtab === 'collection' && (
        <div className="val-sidebar-wiki-summary">
          <div className="val-sidebar-title">ARSENAL COLLECTION</div>
          <div className="val-wiki-guide-card">
            <div className="val-guide-tag" style={{ color: '#00f0ff', borderColor: 'rgba(0, 240, 255, 0.4)' }}>
              BỘ SƯU TẬP SKIN
            </div>
            <p>Phòng trưng bày toàn bộ skin vũ khí trong Valorant.</p>
            <div className="val-guide-feature-list">
              <div className="val-guide-feature-item">
                <span className="val-bullet" style={{ color: '#00f0ff' }}>■</span>
                <span>Hiển thị vũ khí to rõ chính giữa màn hình.</span>
              </div>
              <div className="val-guide-feature-item">
                <span className="val-bullet" style={{ color: '#00f0ff' }}>■</span>
                <span>Thanh trượt ngang carousel chuẩn Valorant.</span>
              </div>
              <div className="val-guide-feature-item">
                <span className="val-bullet" style={{ color: '#00f0ff' }}>■</span>
                <span>Đổi biến thể màu Chroma & xem video Finisher.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
