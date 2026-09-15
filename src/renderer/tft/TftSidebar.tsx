import React from 'react'
import { IoLayersOutline } from 'react-icons/io5'

interface TftSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function TftSidebar({ activeTab, setActiveTab }: TftSidebarProps) {
  return (
    <aside className="sidebar">
      {/* Section Header matching Spotify's library header style */}
      <div className="playlists-header" style={{ borderBottom: 'none', marginBottom: '8px', padding: '0 8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#777777', letterSpacing: '0.8px' }}>
          ĐẤU TRƯỜNG CHÂN LÝ
        </span>
      </div>

      {/* Main navigation links */}
      <nav className="sidebar-nav">
        <button 
          className={`sidebar-nav-item ${activeTab === 'comp' ? 'active' : ''}`}
          onClick={() => setActiveTab('comp')}
          title="Danh sách đội hình Meta Comps"
        >
          <IoLayersOutline size={20} style={{ color: activeTab === 'comp' ? '#1ed760' : undefined }} />
          <span>Comp</span>
        </button>
      </nav>
    </aside>
  )
}
