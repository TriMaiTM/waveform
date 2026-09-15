import React, { useState, useEffect } from 'react'
import { Track, Playlist } from '../../shared/types'
import { 
  IoArrowBack, 
  IoMusicalNote, 
  IoHeart, 
  IoHeartOutline, 
  IoEllipsisHorizontal, 
  IoPlay, 
  IoAdd,
  IoListOutline
} from 'react-icons/io5'

interface ArtistAlbumDetailProps {
  type: 'artist' | 'album';
  name: string;
  allTracks: Track[];
  currentTrack: Track | null;
  playTrack: (track: Track, newQueue?: Track[]) => void;
  toggleFavorite: (track: Track) => Promise<void>;
  playlists: Playlist[];
  onAddTrackToPlaylist: (playlistId: number, trackId: number) => Promise<void>;
  onCreatePlaylist: () => void;
  onDeleteTrack: (track: Track) => Promise<void>;
  onClose: () => void;
}

export default function ArtistAlbumDetail({
  type,
  name,
  allTracks,
  currentTrack,
  playTrack,
  toggleFavorite,
  playlists,
  onAddTrackToPlaylist,
  onCreatePlaylist,
  onDeleteTrack,
  onClose
}: ArtistAlbumDetailProps) {
  const [activeTrackForPlaylistMenu, setActiveTrackForPlaylistMenu] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<'default' | 'title' | 'album'>('default')
  const [showSortMenu, setShowSortMenu] = useState<boolean>(false)

  useEffect(() => {
    const closeMenu = () => setShowSortMenu(false)
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [])

  // Filter tracks belonging to this artist or album
  const filteredTracks = allTracks.filter(track => {
    if (type === 'artist') {
      return (track.artist || '').toLowerCase() === name.toLowerCase()
    } else {
      return (track.album || '').toLowerCase() === name.toLowerCase()
    }
  })

  // Get cover image from the first track of this artist or album
  const firstTrackWithCover = filteredTracks.find(t => t.coverPath)
  const coverUrl = firstTrackWithCover?.coverPath 
    ? `media://get-file?path=${encodeURIComponent(firstTrackWithCover.coverPath)}`
    : null

  // Sort tracks list
  const sortedTracks = [...filteredTracks].sort((a, b) => {
    if (sortBy === 'title') {
      return (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase())
    }
    if (sortBy === 'album' && type === 'artist') {
      return (a.album || '').toLowerCase().localeCompare((b.album || '').toLowerCase())
    }
    // Default sorting by ID (order added)
    return a.id - b.id
  })

  const formatDuration = (seconds: number | null): string => {
    if (seconds === null || isNaN(seconds)) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handlePlayAll = () => {
    if (sortedTracks.length === 0) return
    playTrack(sortedTracks[0], sortedTracks)
  }

  return (
    <div className="tab-view artist-album-detail-view">
      {/* Back button and path header */}
      <div className="detail-navigation-header">
        <button className="btn-detail-back" onClick={onClose} title="Quay lại">
          <IoArrowBack size={20} />
          <span>Quay lại</span>
        </button>
      </div>

      {/* Banner Area */}
      <div 
        className="playlist-banner detail-banner"
        style={{
          background: type === 'artist' 
            ? 'linear-gradient(180deg, #3d3d3d 0%, rgba(18, 18, 18, 0.4) 100%)'
            : 'linear-gradient(180deg, #1e3c72 0%, rgba(18, 18, 18, 0.4) 100%)'
        }}
      >
        <div className={`banner-icon-container ${type === 'artist' ? 'artist-circle' : ''}`}>
          {coverUrl ? (
            <img src={coverUrl} alt="Cover" className="detail-banner-image" />
          ) : (
            <IoMusicalNote size={48} color="#ffffff" />
          )}
        </div>

        <div className="banner-details">
          <span className="banner-tag">
            {type === 'artist' ? 'NGHỆ SĨ' : 'ALBUM'}
          </span>
          <h1 className="banner-title detail-title">{name}</h1>
          <span className="banner-info">
            {type === 'artist' 
              ? `${sortedTracks.length} bài hát trong thư viện`
              : `Bởi ${firstTrackWithCover?.artist || 'Unknown Artist'} • ${sortedTracks.length} bài hát`
            }
          </span>
        </div>
      </div>

      {/* Action bar (Play button & Sort Filter) */}
      <div className="playlist-action-bar detail-action-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {sortedTracks.length > 0 && (
          <button 
            className="btn-play-playlist" 
            onClick={handlePlayAll}
            title={`Phát tất cả bài hát`}
          >
            <IoPlay size={24} color="#000000" />
          </button>
        )}

        {/* Sorting Dropdown */}
        <div className="sort-dropdown-container">
          <button 
            className="btn-sort-trigger"
            onClick={(e) => {
              e.stopPropagation()
              setShowSortMenu(!showSortMenu)
            }}
          >
            <IoListOutline size={16} />
            <span>Sắp xếp</span>
          </button>

          {showSortMenu && (
            <div className="sort-menu-dropdown">
              <button 
                className={`sort-item ${sortBy === 'default' ? 'active' : ''}`}
                onClick={() => setSortBy('default')}
              >
                Mặc định
              </button>
              <button 
                className={`sort-item ${sortBy === 'title' ? 'active' : ''}`}
                onClick={() => setSortBy('title')}
              >
                Tiêu đề (A-Z)
              </button>
              {type === 'artist' && (
                <button 
                  className={`sort-item ${sortBy === 'album' ? 'active' : ''}`}
                  onClick={() => setSortBy('album')}
                >
                  Album (A-Z)
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tracks table list */}
      {sortedTracks.length > 0 ? (
        <div className="track-table-container">
          <div className="track-list-header">
            <div className="col-index">#</div>
            <div className="col-title">Tiêu đề</div>
            {type === 'artist' && <div className="col-album">Album</div>}
            <div className="col-actions"></div>
            <div className="col-duration">Thời lượng</div>
          </div>

          <div className="track-list">
            {sortedTracks.map((track, index) => {
              const trackCover = track.coverPath 
                ? `media://get-file?path=${encodeURIComponent(track.coverPath)}`
                : null
              const isActive = currentTrack?.id === track.id

              return (
                <div 
                  key={track.id} 
                  className={`track-item ${isActive ? 'active' : ''}`}
                  onClick={() => playTrack(track, sortedTracks)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setActiveTrackForPlaylistMenu(activeTrackForPlaylistMenu === track.id ? null : track.id)
                  }}
                >
                  <div className="track-index">{index + 1}</div>
                  
                  {type === 'artist' && (
                    <div className="track-cover">
                      {trackCover ? (
                        <img src={trackCover} alt="Cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                      ) : (
                        <span className="track-cover-fallback">
                          <IoMusicalNote size={18} style={{ color: '#b3b3b3' }} />
                        </span>
                      )}
                    </div>
                  )}

                  <div className="col-title track-title-info">
                    <span className="track-title">{track.title || 'Unknown Title'}</span>
                    <span className="track-artist">{track.artist || 'Unknown Artist'}</span>
                  </div>

                  {type === 'artist' && (
                    <div className="col-album track-album-cell">
                      {track.album || 'Unknown Album'}
                    </div>
                  )}

                  {/* Dropdown và favorite action buttons */}
                  <div className="col-actions track-action-buttons">
                    <button 
                      className={`btn-row-favorite ${track.isFavorite === 1 ? 'liked' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(track)
                      }}
                    >
                      {track.isFavorite === 1 ? <IoHeart size={16} /> : <IoHeartOutline size={16} />}
                    </button>

                    <div className="dropdown-container">
                      <button 
                        className="btn-row-more"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveTrackForPlaylistMenu(activeTrackForPlaylistMenu === track.id ? null : track.id)
                        }}
                      >
                        <IoEllipsisHorizontal size={16} />
                      </button>

                      {activeTrackForPlaylistMenu === track.id && (
                        <div className="playlist-menu-dropdown">
                          <div className="dropdown-subheader">Thêm vào playlist</div>
                          {playlists.length > 0 ? (
                            playlists.map(p => (
                              <button
                                key={p.id}
                                className="dropdown-item sub-item"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onAddTrackToPlaylist(p.id, track.id)
                                  setActiveTrackForPlaylistMenu(null)
                                }}
                              >
                                {p.name}
                              </button>
                            ))
                          ) : (
                            <button
                              className="dropdown-item sub-item highlight"
                              onClick={(e) => {
                                e.stopPropagation()
                                onCreatePlaylist()
                                setActiveTrackForPlaylistMenu(null)
                              }}
                            >
                              + Tạo playlist mới
                            </button>
                          )}
                          <div className="dropdown-divider"></div>
                          <button 
                            className="dropdown-item delete-highlight"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteTrack(track)
                              setActiveTrackForPlaylistMenu(null)
                            }}
                          >
                            Xóa khỏi thư viện
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-duration track-duration-cell">
                    {formatDuration(track.durationSeconds)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <p className="empty-text">Không tìm thấy bài hát nào.</p>
        </div>
      )}
    </div>
  )
}
