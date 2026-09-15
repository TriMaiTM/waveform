import React from 'react'
import { Playlist } from '../../shared/types'
import { IoFlash, IoMusicalNotes, IoHeart, IoAdd, IoMusicalNote, IoTimeOutline, IoOptionsOutline, IoSettingsOutline, IoBarChartOutline, IoDownloadOutline } from 'react-icons/io5'

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  playlists: Playlist[];
  onCreatePlaylist: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, playlists, onCreatePlaylist }: SidebarProps) {
  return (
    <aside className="sidebar">
      {/* Playlists / Thư viện Section Title */}
      <div className="playlists-header" style={{ borderBottom: 'none', marginBottom: '8px', padding: '0 8px' }}>
        <button 
          className="btn-create-playlist-icon" 
          onClick={() => onCreatePlaylist()}
          title="Tạo danh sách phát mới"
        >
          <IoAdd size={20} />
        </button>
      </div>

      {/* Main navigation links inside Sidebar Card */}
      <nav className="sidebar-nav" style={{ marginBottom: '16px' }}>
        <button 
          className={`sidebar-nav-item ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveTab('library')}
        >
          <IoMusicalNotes size={20} />
          <span>Thư viện nhạc</span>
        </button>

        <button 
          className={`sidebar-nav-item ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          <IoHeart size={20} className="heart-icon" />
          <span>Bài hát đã thích</span>
        </button>

        <button 
          className={`sidebar-nav-item ${activeTab === 'recently' ? 'active' : ''}`}
          onClick={() => setActiveTab('recently')}
        >
          <IoTimeOutline size={20} />
          <span>Nghe gần đây</span>
        </button>

        <button 
          className={`sidebar-nav-item ${activeTab === 'equalizer' ? 'active' : ''}`}
          onClick={() => setActiveTab('equalizer')}
        >
          <IoOptionsOutline size={20} />
          <span>Equalizer (EQ)</span>
        </button>

        <button 
          className={`sidebar-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <IoBarChartOutline size={20} />
          <span>Thống kê</span>
        </button>

        <button 
          className={`sidebar-nav-item ${activeTab === 'download' ? 'active' : ''}`}
          onClick={() => setActiveTab('download')}
        >
          <IoDownloadOutline size={20} />
          <span>Tải nhạc từ Youtube</span>
        </button>

        <button 
          className={`sidebar-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <IoSettingsOutline size={20} />
          <span>Cài đặt</span>
        </button>
      </nav>

      {/* Playlists list section */}
      <div className="sidebar-playlists-section">
        <div className="sidebar-playlists-list">
          {playlists.length > 0 ? (
            playlists.map((playlist) => {
              const tabId = `playlist-${playlist.id}`
              const isActive = activeTab === tabId
              const coverUrl = playlist.coverPath 
                ? `media://get-file?path=${encodeURIComponent(playlist.coverPath)}`
                : null

              return (
                <button
                  key={playlist.id}
                  className={`sidebar-playlist-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(tabId)}
                  title={playlist.name}
                >
                  <div className="sidebar-playlist-cover">
                    {coverUrl ? (
                      <img src={coverUrl} alt="Cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    ) : (
                      <span className="sidebar-playlist-fallback">
                        <IoMusicalNote size={20} style={{ color: '#b3b3b3' }} />
                      </span>
                    )}
                  </div>
                  <div className="sidebar-playlist-details">
                    <span className="playlist-name">{playlist.name}</span>
                    <span className="playlist-info">Danh sách phát</span>
                  </div>
                </button>
              )
            })
          ) : (
            <div className="playlists-empty">
              Chưa có playlist nào. Hãy nhấn dấu + để tạo.
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
