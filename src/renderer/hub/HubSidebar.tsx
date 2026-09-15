import { SiValorant } from 'react-icons/si'
import React from 'react'
import { IoVolumeHighOutline } from 'react-icons/io5'
import { usePlayer } from '../player/use-player'
import spotifyLogo from '../../assets/spotify-logo.png'
import tftLogo from '../../assets/teamfight-tactics-logo.png'
import gdLogo from '../../assets/geometry-dash-logo.png'

interface HubSidebarProps {
  activeApp: 'hub' | 'music' | 'tft' | 'gd' | 'valorant';
  setActiveApp: (app: 'hub' | 'music' | 'tft' | 'gd' | 'valorant') => void;
  trackCount?: number;
}

export default function HubSidebar({ activeApp, setActiveApp, trackCount = 0 }: HubSidebarProps) {
  const { currentTrack, isPlaying } = usePlayer();

  return (
    <aside className="hub-sidebar">
      <nav className="hub-app-list">
        {/* App 1: Spotify / Music Player */}
        <button 
          className={`hub-app-item ${activeApp === 'music' ? 'active' : ''}`}
          onClick={() => setActiveApp('music')}
          title="Mở ứng dụng nghe nhạc Spotify"
        >
          <div className="hub-app-icon-wrap music-theme">
            <img src={spotifyLogo} alt="Spotify" className="hub-app-icon-img" />
          </div>
          <div className="hub-app-details">
            <div className="hub-app-title-row">
              <span className="hub-app-name">Spotify</span>
              {isPlaying && (
                <span className="hub-playing-badge" title="Đang phát nhạc ngầm">
                  <IoVolumeHighOutline size={13} />
                  <span>Đang phát</span>
                </span>
              )}
            </div>
            <span className="hub-app-sub">
              {currentTrack 
                ? `${currentTrack.title} • ${currentTrack.artist || 'Unknown'}` 
                : `${trackCount} bài hát trong thư viện`}
            </span>
          </div>
        </button>

        {/* App 2: Đấu Trường Chân Lý (TFT Hub) */}
        <button 
          className={`hub-app-item ${activeApp === 'tft' ? 'active' : ''}`}
          onClick={() => setActiveApp('tft')}
          title="Mở cẩm nang Đấu Trường Chân Lý (MetaTFT)"
        >
          <div className="hub-app-icon-wrap tft-theme">
            <img src={tftLogo} alt="Teamfight Tactics" className="hub-app-icon-img" />
          </div>
          <div className="hub-app-details">
            <div className="hub-app-title-row">
              <span className="hub-app-name">Teamfight Tactics</span>
            </div>
            <span className="hub-app-sub">Latest TFT Comps</span>
          </div>
        </button>

        {/* App 3: Geometry Dash Demonlist */}
        <button 
          className={`hub-app-item ${activeApp === 'gd' ? 'active' : ''}`}
          onClick={() => setActiveApp('gd')}
          title="Mở bảng xếp hạng Geometry Dash Demonlist & Changelog"
        >
          <div className="hub-app-icon-wrap gd-theme">
            <img src={gdLogo} alt="Geometry Dash Demonlist" className="hub-app-icon-img" />
          </div>
          <div className="hub-app-details">
            <div className="hub-app-title-row">
              <span className="hub-app-name">Demonlist</span>
            </div>
            <span className="hub-app-sub">Extreme Demons & Changelog</span>
          </div>
        </button>
              {/* App 4: Valorant Tracker */}
        <button 
          className={`hub-app-item ${activeApp === 'valorant' ? 'active' : ''}`}
          onClick={() => setActiveApp('valorant')}
          title="Mở Valorant Player Tracker"
        >
          <div className="hub-app-icon-wrap val-theme">
            <SiValorant size={22} color="#ff4655" />
          </div>
          <div className="hub-app-details">
            <div className="hub-app-title-row">
              <span className="hub-app-name">Valorant</span>
            </div>
            <span className="hub-app-sub">Player Stats & Rank Tracker</span>
          </div>
        </button>
      </nav>
    </aside>
  )
}
