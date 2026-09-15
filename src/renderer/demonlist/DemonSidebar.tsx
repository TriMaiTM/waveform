import React from 'react'
import { IoFlameOutline, IoChatbubbleEllipsesOutline } from 'react-icons/io5'

interface DemonSidebarProps {
  activeTab: 'demonlist' | 'changelog';
  setActiveTab: (tab: 'demonlist' | 'changelog') => void;
}

export default function DemonSidebar({ activeTab, setActiveTab }: DemonSidebarProps) {
  return (
    <aside className="sidebar">
      {/* Section Header matching Spotify and TFT sidebar style */}
      <div className="playlists-header" style={{ borderBottom: 'none', marginBottom: '8px', padding: '4px 8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#b3b3b3', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
          GEOMETRY DASH DEMONLIST
        </span>
      </div>

      {/* Main navigation links */}
      <nav className="sidebar-nav">
        <button 
          className={`sidebar-nav-item ${activeTab === 'demonlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('demonlist')}
          title="Bảng xếp hạng Extreme Demons"
        >
          <IoFlameOutline size={20} style={{ color: activeTab === 'demonlist' ? '#ff5e00' : undefined }} />
          <span>Demonlist</span>
        </button>

        <button 
          className={`sidebar-nav-item ${activeTab === 'changelog' ? 'active' : ''}`}
          onClick={() => setActiveTab('changelog')}
          title="Nhật ký thay đổi thứ hạng (Discord style)"
        >
          <IoChatbubbleEllipsesOutline size={20} style={{ color: activeTab === 'changelog' ? '#5865f2' : undefined }} />
          <span>Changelog</span>
        </button>
      </nav>
    </aside>
  )
}
