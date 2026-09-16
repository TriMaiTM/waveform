import React, { useState, useEffect } from 'react'
import { SiValorant } from 'react-icons/si'
import { IoChevronBackOutline, IoChevronForwardOutline, IoFlash } from 'react-icons/io5'
import { usePlayer } from '../player/use-player'
import spotifyLogo from '../../assets/spotify-logo.png'
import tftLogo from '../../assets/teamfight-tactics-logo.png'
import gdLogo from '../../assets/geometry-dash-logo.png'

interface HubSidebarProps {
  activeApp: 'hub' | 'music' | 'tft' | 'gd' | 'valorant';
  setActiveApp: (app: 'hub' | 'music' | 'tft' | 'gd' | 'valorant') => void;
  trackCount?: number;
}

export interface AppOrderItem {
  id: 'music' | 'tft' | 'gd' | 'valorant';
  enabled: boolean;
}

export const DEFAULT_APP_ORDER: AppOrderItem[] = [
  { id: 'music', enabled: true },
  { id: 'tft', enabled: true },
  { id: 'gd', enabled: true },
  { id: 'valorant', enabled: true }
];

export function getStoredAppOrder(): AppOrderItem[] {
  try {
    const raw = localStorage.getItem('waveform_hub_app_order');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const ids = ['music', 'tft', 'gd', 'valorant'];
        const existingIds = parsed.map((p: any) => p.id);
        const complete = [...parsed];
        ids.forEach(id => {
          if (!existingIds.includes(id)) {
            complete.push({ id, enabled: true });
          }
        });
        return complete;
      }
    }
  } catch (e) {}
  return DEFAULT_APP_ORDER;
}

export default function HubSidebar({ activeApp, setActiveApp, trackCount = 0 }: HubSidebarProps) {
  const { currentTrack, isPlaying } = usePlayer();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [appOrder, setAppOrder] = useState<AppOrderItem[]>(getStoredAppOrder);

  useEffect(() => {
    const handleUpdate = () => {
      setAppOrder(getStoredAppOrder());
    };
    window.addEventListener('waveform-hub-settings-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('waveform-hub-settings-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const renderAppItem = (id: 'music' | 'tft' | 'gd' | 'valorant') => {
    switch (id) {
      case 'music':
        return (
          <button 
            key="music"
            className={`hub-app-item ${activeApp === 'music' ? 'active' : ''}`}
            onClick={() => setActiveApp('music')}
            title="Spotify Music"
          >
            <div className="hub-app-icon-wrap">
              <img src={spotifyLogo} alt="Spotify" className="hub-app-icon-img spotify" />
              {isPlaying && isCollapsed && (
                <div className="hub-sound-waves mini" title="Đang phát nhạc">
                  <span className="hub-sound-bar bar-1"></span>
                  <span className="hub-sound-bar bar-2"></span>
                  <span className="hub-sound-bar bar-3"></span>
                </div>
              )}
            </div>
            <div className="hub-app-details">
              <div className="hub-app-title-row">
                <span className="hub-app-name">Spotify</span>
                {isPlaying && (
                  <div className="hub-sound-waves" title="Đang phát nhạc">
                    <span className="hub-sound-bar bar-1"></span>
                    <span className="hub-sound-bar bar-2"></span>
                    <span className="hub-sound-bar bar-3"></span>
                  </div>
                )}
              </div>
              <span className="hub-app-sub">
                {currentTrack 
                  ? `${currentTrack.title} • ${currentTrack.artist || 'Unknown'}` 
                  : `${trackCount} bài hát trong thư viện`}
              </span>
            </div>
          </button>
        );

      case 'tft':
        return (
          <button 
            key="tft"
            className={`hub-app-item ${activeApp === 'tft' ? 'active' : ''}`}
            onClick={() => setActiveApp('tft')}
            title="Teamfight Tactics"
          >
            <div className="hub-app-icon-wrap">
              <img src={tftLogo} alt="Teamfight Tactics" className="hub-app-icon-img tft" />
            </div>
            <div className="hub-app-details">
              <div className="hub-app-title-row">
                <span className="hub-app-name">Teamfight Tactics</span>
              </div>
              <span className="hub-app-sub">Latest TFT Comps</span>
            </div>
          </button>
        );

      case 'gd':
        return (
          <button 
            key="gd"
            className={`hub-app-item ${activeApp === 'gd' ? 'active' : ''}`}
            onClick={() => setActiveApp('gd')}
            title="Geometry Dash Demonlist"
          >
            <div className="hub-app-icon-wrap">
              <img src={gdLogo} alt="Demonlist" className="hub-app-icon-img gd" />
            </div>
            <div className="hub-app-details">
              <div className="hub-app-title-row">
                <span className="hub-app-name">Demonlist</span>
              </div>
              <span className="hub-app-sub">Extreme Demons & Changelog</span>
            </div>
          </button>
        );

      case 'valorant':
        return (
          <button 
            key="valorant"
            className={`hub-app-item ${activeApp === 'valorant' ? 'active' : ''}`}
            onClick={() => setActiveApp('valorant')}
            title="Valorant Tracker"
          >
            <div className="hub-app-icon-wrap">
              <SiValorant size={26} color="#ff4655" className="hub-app-icon-img valorant" />
            </div>
            <div className="hub-app-details">
              <div className="hub-app-title-row">
                <span className="hub-app-name">Valorant</span>
              </div>
              <span className="hub-app-sub">Player Stats & Rank Tracker</span>
            </div>
          </button>
        );

      default:
        return null;
    }
  };

  return (
    <aside className={`hub-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Header with Waveform Brand Logo & Collapse toggle */}
      <div className="hub-sidebar-header">
        <div 
          className="hub-brand-logo-btn" 
          onClick={() => setActiveApp('hub')} 
          title="Waveform Hub"
        >
          <IoFlash size={22} color="#1ed760" className="hub-brand-flash" />
          {!isCollapsed && <span className="hub-brand-text">Waveform</span>}
        </div>
        <button 
          className="hub-collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
          aria-label={isCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
        >
          {isCollapsed ? <IoChevronForwardOutline size={16} /> : <IoChevronBackOutline size={16} />}
        </button>
      </div>

      <nav className="hub-app-list">
        {appOrder.filter(item => item.enabled).map(item => renderAppItem(item.id))}
      </nav>
    </aside>
  );
}
