import React, { useState, useEffect, useRef } from 'react'
import { Track, Playlist } from '../shared/types'
import { PlayerProvider } from './player/player-context'
import { usePlayer } from './player/use-player'
import NowPlayingBar from './components/NowPlayingBar'
import Sidebar from './components/Sidebar'
import Visualizer from './components/Visualizer'
import EqualizerTab from './components/EqualizerTab'
import ArtistAlbumDetail from './components/ArtistAlbumDetail'
import { 
  IoFlash, 
  IoMusicalNote, 
  IoFolderOpen, 
  IoHeart, 
  IoHeartOutline, 
  IoTrashOutline, 
  IoPlay, 
  IoAdd,
  IoEllipsisHorizontal,
  IoCloseOutline,
  IoVolumeMedium,
  IoTimeOutline,
  IoHome,
  IoSearchOutline,
  IoPersonOutline,
  IoListOutline,
  IoRefresh
} from 'react-icons/io5'

const getDominantColor = (imgUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = imgUrl
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve('#282828')
          return
        }
        canvas.width = 1
        canvas.height = 1
        ctx.drawImage(img, 0, 0, 1, 1)
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
        resolve(`#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`)
      } catch (e) {
        resolve('#282828')
      }
    }
    img.onerror = () => {
      resolve('#282828')
    }
  })
}

function AppContent() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [activeTab, setActiveTab] = useState<string>('library')
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([])
  const [isScanning, setIsScanning] = useState<boolean>(false)
  const [statusMessage, setStatusMessage] = useState<string>('')
  
  // Dropdown menu state
  const [activeTrackForPlaylistMenu, setActiveTrackForPlaylistMenu] = useState<number | null>(null)

  // Playlist renaming state
  const [isEditingPlaylistName, setIsEditingPlaylistName] = useState<boolean>(false)
  const [editingPlaylistId, setEditingPlaylistId] = useState<number | null>(null)
  const [editingPlaylistNameVal, setEditingPlaylistNameVal] = useState<string>('')

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activeDetail, setActiveDetail] = useState<{ type: 'artist' | 'album', name: string } | null>(null)
  const [searchChip, setSearchChip] = useState<'all' | 'tracks' | 'artists' | 'albums'>('all')

  // Sorting state
  const [sortBy, setSortBy] = useState<'default' | 'title' | 'artist' | 'album'>('default')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showSortMenu, setShowSortMenu] = useState<boolean>(false)

  const sortTracks = (tracksList: Track[]): Track[] => {
    return [...tracksList].sort((a, b) => {
      if (sortBy === 'default') {
        return sortOrder === 'desc' ? b.id - a.id : a.id - b.id
      }
      let valA = ''
      let valB = ''
      if (sortBy === 'title') {
        valA = (a.title || '').toLowerCase()
        valB = (b.title || '').toLowerCase()
      } else if (sortBy === 'artist') {
        valA = (a.artist || '').toLowerCase()
        valB = (b.artist || '').toLowerCase()
      } else if (sortBy === 'album') {
        valA = (a.album || '').toLowerCase()
        valB = (b.album || '').toLowerCase()
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }

  const { 
    playTrack, 
    currentTrack, 
    toggleFavorite, 
    isPlaying, 
    resume, 
    pause, 
    queue, 
    currentIndex, 
    removeFromQueue, 
    addToQueue, 
    duration,
    currentTime,
    seek,
    volume
  } = usePlayer()

  const [dominantColor, setDominantColor] = useState<string>('#282828')

  // Lyrics state
  const [lyricsData, setLyricsData] = useState<{ synced: boolean; lyrics: any[] | string }>({
    synced: false,
    lyrics: 'Chưa phát bài hát nào.'
  })
  const [currentLyricIndex, setCurrentLyricIndex] = useState<number>(-1)
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null)

  // Fetch lyrics when currentTrack changes
  useEffect(() => {
    if (currentTrack) {
      window.api.getLyrics(currentTrack.id).then((res) => {
        setLyricsData(res)
      }).catch((err) => {
        console.error('[Lyrics] Fetch error:', err)
        setLyricsData({ synced: false, lyrics: 'Không nạp được lời bài hát.' })
      })
    } else {
      setLyricsData({ synced: false, lyrics: 'Chưa phát bài hát nào.' })
    }
    setCurrentLyricIndex(-1)
  }, [currentTrack])

  // Track current lyric line index based on play progress
  useEffect(() => {
    if (lyricsData.synced && Array.isArray(lyricsData.lyrics) && lyricsData.lyrics.length > 0) {
      const idx = lyricsData.lyrics.findIndex((line, index) => {
        const nextLine = (lyricsData.lyrics as any[])[index + 1]
        return currentTime >= line.time && (!nextLine || currentTime < nextLine.time)
      })
      if (idx !== -1 && idx !== currentLyricIndex) {
        setCurrentLyricIndex(idx)
      }
    }
  }, [currentTime, lyricsData, currentLyricIndex])

  // Auto scroll to current lyric line
  useEffect(() => {
    if (currentLyricIndex !== -1 && lyricsContainerRef.current) {
      const activeElement = lyricsContainerRef.current.querySelector(`.lyric-line-${currentLyricIndex}`)
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }
    }
  }, [currentLyricIndex])

  // Recently Played state
  const [recentlyTracks, setRecentlyTracks] = useState<Track[]>([])
  const recordedTracksRef = useRef<Set<number>>(new Set())

  const loadRecentlyPlayed = async () => {
    try {
      const list = await window.api.getRecentlyPlayed()
      setRecentlyTracks(list)
    } catch (err) {
      console.error('Failed to load recently played:', err)
    }
  }

  useEffect(() => {
    if (activeTab === 'recently') {
      loadRecentlyPlayed()
    }
  }, [activeTab])

  // Log to recently played when song has been playing for at least 10 seconds
  useEffect(() => {
    if (currentTrack) {
      if (currentTime >= 10 && !recordedTracksRef.current.has(currentTrack.id)) {
        recordedTracksRef.current.add(currentTrack.id)
        window.api.addToRecentlyPlayed(currentTrack.id)
          .then(() => {
            if (activeTab === 'recently') {
              loadRecentlyPlayed()
            }
          })
          .catch(err => console.error('Failed to log recently played:', err))
      }
    }
  }, [currentTime, currentTrack, activeTab])

  // Reset the logged status when currentTrack changes to allow logging again if re-played
  useEffect(() => {
    if (currentTrack) {
      recordedTracksRef.current.delete(currentTrack.id)
    }
  }, [currentTrack])

  // Load playlists and auto-scan default library folder on startup
  useEffect(() => {
    const initApp = async () => {
      setIsScanning(true)
      setStatusMessage('Đang kết nối thư viện nhạc...')
      try {
        // Load existing playlists
        const existingPlaylists = await window.api.getPlaylists()
        setPlaylists(existingPlaylists)

        // Scan library
        const initialTracks = await window.api.scanLibrary()
        setTracks(initialTracks)
        if (initialTracks.length > 0) {
          setStatusMessage(`Đã tải thư viện: ${initialTracks.length} bài hát.`)
        } else {
          setStatusMessage('')
        }
      } catch (error) {
        console.error('Failed to initialize app data:', error)
        setStatusMessage('Không thể kết nối thư viện nhạc tự động.')
      } finally {
        setIsScanning(false)
      }
    }

    initApp()
  }, [])

  // Reload playlist tracks when tab changes
  useEffect(() => {
    if (activeTab.startsWith('playlist-')) {
      const playlistId = parseInt(activeTab.split('-')[1])
      if (!isNaN(playlistId)) {
        loadPlaylistTracks(playlistId)
      }
    }
  }, [activeTab])

  // Close dropdown menu when clicking anywhere else
  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveTrackForPlaylistMenu(null)
    }
    window.addEventListener('click', handleGlobalClick)
    return () => window.removeEventListener('click', handleGlobalClick)
  }, [])

  // Sync favorite state from player context to local list when updated on NowPlayingBar
  useEffect(() => {
    if (currentTrack) {
      setTracks(prev => 
        prev.map(t => t.id === currentTrack.id ? { ...t, isFavorite: currentTrack.isFavorite } : t)
      )
      setPlaylistTracks(prev =>
        prev.map(t => t.id === currentTrack.id ? { ...t, isFavorite: currentTrack.isFavorite } : t)
      )
    }
  }, [currentTrack?.isFavorite])

  // Extract dominant color of the current active playlist/favorites cover
  useEffect(() => {
    if (activeTab.startsWith('playlist-')) {
      const playlistId = parseInt(activeTab.split('-')[1])
      const playlist = playlists.find(p => p.id === playlistId)
      if (playlist && playlist.coverPath) {
        const coverUrl = `media://get-file?path=${encodeURIComponent(playlist.coverPath)}`
        getDominantColor(coverUrl).then(color => {
          setDominantColor(color)
        })
      } else {
        setDominantColor('#282828')
      }
    } else if (activeTab === 'favorites') {
      setDominantColor('#450af5')
    } else {
      setDominantColor('#121212')
    }
  }, [activeTab, playlists])

  const loadPlaylistTracks = async (id: number) => {
    try {
      const pTracks = await window.api.getPlaylistTracks(id)
      setPlaylistTracks(pTracks)
    } catch (err) {
      console.error('Failed to load playlist tracks:', err)
    }
  }

  const handleAddMusic = async () => {
    try {
      setIsScanning(true)
      setStatusMessage('Đang sao chép các tệp nhạc vào thư viện...')
      
      const updatedTracks = await window.api.addMusicFiles()
      setTracks(updatedTracks)
      setStatusMessage(`Đã thêm nhạc thành công! Tổng số bài hát: ${updatedTracks.length}.`)
    } catch (error) {
      console.error('Error adding music files:', error)
      setStatusMessage('Có lỗi xảy ra khi thêm bài hát.')
    } finally {
      setIsScanning(false)
    }
  }

  const handleCreatePlaylist = async (name?: any): Promise<boolean> => {
    const finalName = typeof name === 'string' && name.trim() 
      ? name.trim() 
      : undefined
    try {
      const newPlaylist = await window.api.createPlaylist(finalName)
      setPlaylists(prev => [...prev, newPlaylist])
      setActiveTab(`playlist-${newPlaylist.id}`)
      return true
    } catch (err) {
      alert('Không thể tạo playlist.')
      return false
    }
  }

  const handleDeletePlaylist = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa playlist "${name}"?`)) return
    try {
      await window.api.deletePlaylist(id)
      setPlaylists(prev => prev.filter(p => p.id !== id))
      setActiveTab('library')
    } catch (err) {
      console.error('Failed to delete playlist:', err)
    }
  }

  const handleStartRenamePlaylist = (playlist: Playlist) => {
    setEditingPlaylistNameVal(playlist.name)
    setEditingPlaylistId(playlist.id)
    setIsEditingPlaylistName(true)
  }

  const handleRenamePlaylistConfirm = async (playlistId: number) => {
    const newName = editingPlaylistNameVal.trim()
    if (!newName) {
      setIsEditingPlaylistName(false)
      return
    }
    try {
      await window.api.updatePlaylistName(playlistId, newName)
      setPlaylists(prev =>
        prev.map(p => p.id === playlistId ? { ...p, name: newName } : p)
      )
      setIsEditingPlaylistName(false)
    } catch (err) {
      alert('Không thể đổi tên playlist (tên có thể bị trùng).')
    }
  }

  const handleRescanLibrary = async () => {
    setIsScanning(true)
    setStatusMessage('Đang quét lại thư viện nhạc...')
    try {
      const updatedTracks = await window.api.scanLibrary()
      setTracks(updatedTracks)
      setStatusMessage('Đã quét xong thư viện nhạc!')
      setTimeout(() => setStatusMessage(''), 3000)
    } catch (err) {
      console.error('Failed to rescan library:', err)
      setStatusMessage('Quét lại thư viện thất bại.')
      setTimeout(() => setStatusMessage(''), 3000)
    } finally {
      setIsScanning(false)
    }
  }

  const handleUpdatePlaylistCover = async (playlistId: number) => {
    try {
      const newCoverPath = await window.api.selectAndSetPlaylistCover(playlistId)
      if (newCoverPath) {
        setPlaylists(prev =>
          prev.map(p => p.id === playlistId ? { ...p, coverPath: newCoverPath } : p)
        )
      }
    } catch (err) {
      console.error('Failed to update playlist cover:', err)
    }
  }

  const handleToggleFavorite = async (e: React.MouseEvent, track: Track) => {
    e.stopPropagation()
    await toggleFavorite(track)
    // Update local state list to instantly sync UI
    const updatedFav = track.isFavorite === 1 ? 0 : 1
    setTracks(prev => 
      prev.map(t => t.id === track.id ? { ...t, isFavorite: updatedFav } : t)
    )
    // If active tab is playlist or favorites, sync playlistTracks too
    setPlaylistTracks(prev =>
      prev.map(t => t.id === track.id ? { ...t, isFavorite: updatedFav } : t)
    )
  }

  useEffect(() => {
    const closeMenu = () => setShowSortMenu(false)
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [])

  useEffect(() => {
    setActiveDetail(null)
  }, [activeTab])

  const renderSortDropdown = () => {
    const sortLabels = {
      default: 'Mới thêm',
      title: 'Tiêu đề (A-Z)',
      artist: 'Nghệ sĩ (A-Z)',
      album: 'Album (A-Z)'
    }

    return (
      <div className="sort-dropdown-container">
        <button 
          className="btn-sort-trigger"
          onClick={(e) => {
            e.stopPropagation()
            setShowSortMenu(!showSortMenu)
          }}
          title="Sắp xếp danh sách"
        >
          <IoListOutline size={16} />
          <span>Sắp xếp: {sortLabels[sortBy]}</span>
        </button>

        {showSortMenu && (
          <div className="sort-menu-dropdown">
            <button 
              className={`sort-item ${sortBy === 'default' ? 'active' : ''}`}
              onClick={() => {
                setSortBy('default')
                setSortOrder('desc')
                setShowSortMenu(false)
              }}
            >
              Mới thêm
            </button>
            <button 
              className={`sort-item ${sortBy === 'title' ? 'active' : ''}`}
              onClick={() => {
                setSortBy('title')
                setSortOrder('asc')
                setShowSortMenu(false)
              }}
            >
              Tiêu đề (A-Z)
            </button>
            <button 
              className={`sort-item ${sortBy === 'artist' ? 'active' : ''}`}
              onClick={() => {
                setSortBy('artist')
                setSortOrder('asc')
                setShowSortMenu(false)
              }}
            >
              Nghệ sĩ (A-Z)
            </button>
            <button 
              className={`sort-item ${sortBy === 'album' ? 'active' : ''}`}
              onClick={() => {
                setSortBy('album')
                setSortOrder('asc')
                setShowSortMenu(false)
              }}
            >
              Album (A-Z)
            </button>
          </div>
        )}
      </div>
    )
  }

  const handleAddTrackToPlaylist = async (playlistId: number, trackId: number) => {
    try {
      await window.api.addTrackToPlaylist(playlistId, trackId)
      if (activeTab === `playlist-${playlistId}`) {
        await loadPlaylistTracks(playlistId)
      }
    } catch (err) {
      console.error('Failed to add track to playlist:', err)
    }
  }

  const handleRemoveTrackFromPlaylist = async (e: React.MouseEvent, playlistId: number, trackId: number) => {
    e.stopPropagation()
    try {
      await window.api.removeTrackFromPlaylist(playlistId, trackId)
      setPlaylistTracks(prev => prev.filter(t => t.id !== trackId))
    } catch (err) {
      console.error('Failed to remove track from playlist:', err)
    }
  }

  const handlePlayCollection = (collectionTracks: Track[]) => {
    if (collectionTracks.length === 0) return
    playTrack(collectionTracks[0], collectionTracks)
  }

  const formatDuration = (seconds: number | null): string => {
    if (seconds === null || isNaN(seconds)) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleContextMenu = (e: React.MouseEvent, trackId: number) => {
    e.preventDefault()
    e.stopPropagation()
    setActiveTrackForPlaylistMenu(activeTrackForPlaylistMenu === trackId ? null : trackId)
  }

  // Render components according to active tab
  const renderContent = () => {
    if (activeDetail) {
      return (
        <ArtistAlbumDetail
          type={activeDetail.type}
          name={activeDetail.name}
          allTracks={tracks}
          currentTrack={currentTrack}
          playTrack={playTrack}
          toggleFavorite={async (track) => {
            await toggleFavorite(track)
            const updatedFav = track.isFavorite === 1 ? 0 : 1
            setTracks(prev => prev.map(t => t.id === track.id ? { ...t, isFavorite: updatedFav } : t))
            setPlaylistTracks(prev => prev.map(t => t.id === track.id ? { ...t, isFavorite: updatedFav } : t))
          }}
          playlists={playlists}
          onAddTrackToPlaylist={handleAddTrackToPlaylist}
          onCreatePlaylist={handleCreatePlaylist}
          onClose={() => setActiveDetail(null)}
        />
      )
    }

    if (activeTab === 'library') {
      const filteredTracks = tracks.filter(track => {
        const q = searchQuery.toLowerCase().trim()
        if (!q) return true
        
        if (searchChip === 'tracks') {
          return (track.title || '').toLowerCase().includes(q)
        } else if (searchChip === 'artists') {
          return (track.artist || '').toLowerCase().includes(q)
        } else if (searchChip === 'albums') {
          return (track.album || '').toLowerCase().includes(q)
        } else {
          return (
            (track.title || '').toLowerCase().includes(q) ||
            (track.artist || '').toLowerCase().includes(q) ||
            (track.album || '').toLowerCase().includes(q)
          )
        }
      })

      const sortedTracks = sortTracks(filteredTracks)

      return (
        <div className="tab-view">
          <div className="tab-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 className="tab-title" style={{ margin: 0 }}>Thư viện nhạc</h2>
              <button 
                className="btn-rescan-library" 
                onClick={handleRescanLibrary}
                disabled={isScanning}
                title="Quét lại thư viện nhạc"
              >
                <IoRefresh size={18} className={isScanning ? 'spinning' : ''} />
              </button>
            </div>
            {renderSortDropdown()}
          </div>

          {searchQuery && (
            <div className="search-chips-container" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button 
                className={`search-chip ${searchChip === 'all' ? 'active' : ''}`}
                onClick={() => setSearchChip('all')}
              >
                Tất cả
              </button>
              <button 
                className={`search-chip ${searchChip === 'tracks' ? 'active' : ''}`}
                onClick={() => setSearchChip('tracks')}
              >
                Bài hát
              </button>
              <button 
                className={`search-chip ${searchChip === 'artists' ? 'active' : ''}`}
                onClick={() => setSearchChip('artists')}
              >
                Nghệ sĩ
              </button>
              <button 
                className={`search-chip ${searchChip === 'albums' ? 'active' : ''}`}
                onClick={() => setSearchChip('albums')}
              >
                Album
              </button>
            </div>
          )}

          {sortedTracks.length > 0 ? (
            <div className="track-table-container">
              <div className="track-list-header">
                <div className="col-index">#</div>
                <div className="col-title">Tiêu đề</div>
                <div className="col-album">Album</div>
                <div className="col-actions"></div>
                <div className="col-duration">Thời lượng</div>
              </div>

              <div className="track-list">
                {sortedTracks.map((track, index) => {
                  const coverUrl = track.coverPath 
                    ? `media://get-file?path=${encodeURIComponent(track.coverPath)}` 
                    : null
                  const isActive = currentTrack?.id === track.id

                  return (
                    <div 
                      key={track.id} 
                      className={`track-item ${isActive ? 'active' : ''}`}
                      onClick={() => playTrack(track, sortedTracks)}
                      onContextMenu={(e) => handleContextMenu(e, track.id)}
                    >
                      <div className="track-index">{index + 1}</div>
                      
                      <div className="track-cover">
                        {coverUrl ? (
                          <img src={coverUrl} alt="Cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                        ) : (
                          <span className="track-cover-fallback">
                            <IoMusicalNote size={18} style={{ color: '#b3b3b3' }} />
                          </span>
                        )}
                      </div>

                      <div className="col-title track-title-info">
                        <span className="track-title">{track.title || 'Unknown Title'}</span>
                        <span 
                          className="track-artist click-link"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (track.artist && track.artist !== 'Unknown Artist') {
                              setActiveDetail({ type: 'artist', name: track.artist })
                            }
                          }}
                        >
                          {track.artist || 'Unknown Artist'}
                        </span>
                      </div>

                      <div className="col-album track-album-cell">
                        <span 
                          className="click-link"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (track.album && track.album !== 'Unknown Album') {
                              setActiveDetail({ type: 'album', name: track.album })
                            }
                          }}
                        >
                          {track.album || 'Unknown Album'}
                        </span>
                      </div>

                      <div className="col-actions track-action-buttons">
                        <button 
                          className={`btn-row-favorite ${track.isFavorite === 1 ? 'liked' : ''}`}
                          onClick={(e) => handleToggleFavorite(e, track)}
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
                            title="Tùy chọn bài hát"
                          >
                            <IoEllipsisHorizontal size={16} />
                          </button>
                          {activeTrackForPlaylistMenu === track.id && (
                            <div className="playlist-menu-dropdown">
                              <button 
                                className="dropdown-item"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  addToQueue(track)
                                  setActiveTrackForPlaylistMenu(null)
                                }}
                              >
                                Thêm vào hàng đợi
                              </button>
                              <div className="dropdown-divider"></div>
                              <div className="dropdown-subheader">Thêm vào playlist</div>
                              {playlists.length > 0 ? (
                                playlists.map(p => (
                                  <button
                                    key={p.id}
                                    className="dropdown-item sub-item"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleAddTrackToPlaylist(p.id, track.id)
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
                                    handleCreatePlaylist()
                                    setActiveTrackForPlaylistMenu(null)
                                  }}
                                >
                                  + Tạo playlist mới
                                </button>
                              )}
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
            !isScanning && (
              <div className="empty-state">
                <div className="empty-icon">
                  <IoFolderOpen size={48} style={{ color: '#539df5' }} />
                </div>
                <p className="empty-text">Thư viện nhạc đang trống.</p>
                <p className="empty-text" style={{ fontSize: '14px', marginTop: '8px' }}>
                  Nhấn nút <strong>Add Music</strong> ở trên để nhập các tệp nhạc vào thư viện của bạn.
                </p>
              </div>
            )
          )}
        </div>
      )
    }

    if (activeTab === 'favorites') {
      const favTracks = tracks.filter(t => t.isFavorite === 1)
      const sortedFavTracks = sortTracks(favTracks)

      return (
        <div className="tab-view">
          <div 
            className="playlist-banner"
            style={{ 
              background: `linear-gradient(180deg, ${dominantColor} 0%, rgba(18, 18, 18, 0.4) 100%)` 
            }}
          >
            <div className="banner-icon-container" style={{ background: 'linear-gradient(135deg, #450af5 0%, #8e8ee0 100%)' }}>
              <IoHeart size={48} color="#ffffff" />
            </div>
            <div className="banner-details">
              <span className="banner-tag">PLAYLIST</span>
              <h1 className="banner-title">Bài hát đã thích</h1>
              <span className="banner-info">{favTracks.length} bài hát</span>
            </div>
          </div>

          <div className="playlist-action-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {favTracks.length > 0 && (
              <button 
                className="btn-play-playlist" 
                onClick={() => handlePlayCollection(sortedFavTracks)}
                title="Phát toàn bộ bài hát đã thích"
              >
                <IoPlay size={24} color="#000000" />
              </button>
            )}
            {renderSortDropdown()}
          </div>

          {sortedFavTracks.length > 0 ? (
            <div className="track-table-container">
              <div className="track-list-header">
                <div className="col-index">#</div>
                <div className="col-title">Tiêu đề</div>
                <div className="col-album">Album</div>
                <div className="col-actions"></div>
                <div className="col-duration">Thời lượng</div>
              </div>

              <div className="track-list">
                {sortedFavTracks.map((track, index) => {
                  const coverUrl = track.coverPath 
                    ? `media://get-file?path=${encodeURIComponent(track.coverPath)}` 
                    : null
                  const isActive = currentTrack?.id === track.id

                  return (
                    <div 
                      key={track.id} 
                      className={`track-item ${isActive ? 'active' : ''}`}
                      onClick={() => playTrack(track, sortedFavTracks)}
                      onContextMenu={(e) => handleContextMenu(e, track.id)}
                    >
                      <div className="track-index">{index + 1}</div>
                      <div className="track-cover">
                        {coverUrl ? (
                          <img src={coverUrl} alt="Cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                        ) : (
                          <span className="track-cover-fallback">
                            <IoMusicalNote size={18} style={{ color: '#b3b3b3' }} />
                          </span>
                        )}
                      </div>

                      <div className="col-title track-title-info">
                        <span className="track-title">{track.title || 'Unknown Title'}</span>
                        <span 
                          className="track-artist click-link"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (track.artist && track.artist !== 'Unknown Artist') {
                              setActiveDetail({ type: 'artist', name: track.artist })
                            }
                          }}
                        >
                          {track.artist || 'Unknown Artist'}
                        </span>
                      </div>

                      <div className="col-album track-album-cell">
                        <span 
                          className="click-link"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (track.album && track.album !== 'Unknown Album') {
                              setActiveDetail({ type: 'album', name: track.album })
                            }
                          }}
                        >
                          {track.album || 'Unknown Album'}
                        </span>
                      </div>

                      <div className="col-actions track-action-buttons">
                        <button 
                          className="btn-row-favorite liked"
                          onClick={(e) => handleToggleFavorite(e, track)}
                        >
                          <IoHeart size={16} />
                        </button>
                        
                        <div className="dropdown-container">
                          <button 
                            className="btn-row-more"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveTrackForPlaylistMenu(activeTrackForPlaylistMenu === track.id ? null : track.id)
                            }}
                            title="Tùy chọn bài hát"
                          >
                            <IoEllipsisHorizontal size={16} />
                          </button>
                          {activeTrackForPlaylistMenu === track.id && (
                            <div className="playlist-menu-dropdown">
                              <button 
                                className="dropdown-item"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  addToQueue(track)
                                  setActiveTrackForPlaylistMenu(null)
                                }}
                              >
                                Thêm vào hàng đợi
                              </button>
                              <div className="dropdown-divider"></div>
                              <div className="dropdown-subheader">Thêm vào playlist</div>
                              {playlists.length > 0 ? (
                                playlists.map(p => (
                                  <button
                                    key={p.id}
                                    className="dropdown-item sub-item"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleAddTrackToPlaylist(p.id, track.id)
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
                                    handleCreatePlaylist()
                                    setActiveTrackForPlaylistMenu(null)
                                  }}
                                >
                                  + Tạo playlist mới
                                </button>
                              )}
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
              <div className="empty-icon">
                <IoHeart size={48} style={{ color: '#4d4d4d' }} />
              </div>
              <p className="empty-text">Chưa có bài hát đã thích nào.</p>
              <p className="empty-text" style={{ fontSize: '12px', marginTop: '8px' }}>
                Nhấn biểu tượng trái tim trên các bài hát ở thư viện để thêm vào mục này.
              </p>
            </div>
          )}
        </div>
      )
    }

    if (activeTab.startsWith('playlist-')) {
      const playlistId = parseInt(activeTab.split('-')[1])
      const playlist = playlists.find(p => p.id === playlistId)

      if (!playlist) return <div className="tab-view">Không tìm thấy playlist.</div>

      // Recommend tracks (tracks in library but NOT in this playlist)
      const inPlaylistIds = new Set(playlistTracks.map(t => t.id))
      const recommendedTracks = tracks.filter(t => !inPlaylistIds.has(t.id)).slice(0, 5)
      
      const sortedPlaylistTracks = sortTracks(playlistTracks)

      return (
        <div className="tab-view">
          <div 
            className="playlist-banner"
            style={{ 
              background: `linear-gradient(180deg, ${dominantColor} 0%, rgba(18, 18, 18, 0.4) 100%)` 
            }}
          >
            <div 
              className="banner-icon-container playlist-custom-banner editable"
              onClick={() => handleUpdatePlaylistCover(playlist.id)}
              title="Click để chọn ảnh bìa mới cho playlist"
            >
              {playlist.coverPath ? (
                <img 
                  src={`media://get-file?path=${encodeURIComponent(playlist.coverPath)}`} 
                  alt="Playlist Cover" 
                  className="playlist-cover-image"
                />
              ) : (
                <IoMusicalNote size={48} color="#ffffff" />
              )}
              <div className="cover-edit-overlay">
                <span>Thay đổi ảnh</span>
              </div>
            </div>
            <div className="banner-details">
              <span className="banner-tag">PLAYLIST</span>
              {isEditingPlaylistName && editingPlaylistId === playlist.id ? (
                <input
                  type="text"
                  className="playlist-rename-input"
                  value={editingPlaylistNameVal}
                  onChange={(e) => setEditingPlaylistNameVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenamePlaylistConfirm(playlist.id)
                    if (e.key === 'Escape') setIsEditingPlaylistName(false)
                  }}
                  onBlur={() => handleRenamePlaylistConfirm(playlist.id)}
                  autoFocus
                />
              ) : (
                <h1 
                  className="banner-title editable" 
                  onClick={() => handleStartRenamePlaylist(playlist)}
                  title="Nhấp vào để đổi tên Playlist"
                >
                  {playlist.name}
                </h1>
              )}
              <span className="banner-info">{playlistTracks.length} bài hát</span>
            </div>
          </div>

          <div className="playlist-action-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {playlistTracks.length > 0 && (
                <button 
                  className="btn-play-playlist" 
                  onClick={() => handlePlayCollection(sortedPlaylistTracks)}
                  title="Phát playlist này"
                >
                  <IoPlay size={24} color="#000000" />
                </button>
              )}
              
              <button 
                className="btn-delete-playlist"
                onClick={() => handleDeletePlaylist(playlist.id, playlist.name)}
                title="Xóa Playlist này"
              >
                <IoTrashOutline size={20} />
                <span>Xóa Playlist</span>
              </button>
            </div>
            {renderSortDropdown()}
          </div>

          {sortedPlaylistTracks.length > 0 ? (
            <div className="track-table-container">
              <div className="track-list-header">
                <div className="col-index">#</div>
                <div className="col-title">Tiêu đề</div>
                <div className="col-album">Album</div>
                <div className="col-actions"></div>
                <div className="col-duration">Thời lượng</div>
              </div>

              <div className="track-list">
                {sortedPlaylistTracks.map((track, index) => {
                  const coverUrl = track.coverPath 
                    ? `media://get-file?path=${encodeURIComponent(track.coverPath)}` 
                    : null
                  const isActive = currentTrack?.id === track.id

                  return (
                    <div 
                      key={track.id} 
                      className={`track-item ${isActive ? 'active' : ''}`}
                      onClick={() => playTrack(track, sortedPlaylistTracks)}
                      onContextMenu={(e) => handleContextMenu(e, track.id)}
                    >
                      <div className="track-index">{index + 1}</div>
                      <div className="track-cover">
                        {coverUrl ? (
                          <img src={coverUrl} alt="Cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                        ) : (
                          <span className="track-cover-fallback">
                            <IoMusicalNote size={18} style={{ color: '#b3b3b3' }} />
                          </span>
                        )}
                      </div>

                      <div className="col-title track-title-info">
                        <span className="track-title">{track.title || 'Unknown Title'}</span>
                        <span 
                          className="track-artist click-link"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (track.artist && track.artist !== 'Unknown Artist') {
                              setActiveDetail({ type: 'artist', name: track.artist })
                            }
                          }}
                        >
                          {track.artist || 'Unknown Artist'}
                        </span>
                      </div>

                      <div className="col-album track-album-cell">
                        <span 
                          className="click-link"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (track.album && track.album !== 'Unknown Album') {
                              setActiveDetail({ type: 'album', name: track.album })
                            }
                          }}
                        >
                          {track.album || 'Unknown Album'}
                        </span>
                      </div>

                      <div className="col-actions track-action-buttons">
                        <button 
                          className={`btn-row-favorite ${track.isFavorite === 1 ? 'liked' : ''}`}
                          onClick={(e) => handleToggleFavorite(e, track)}
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
                            title="Tùy chọn bài hát"
                          >
                            <IoEllipsisHorizontal size={16} />
                          </button>
                          {activeTrackForPlaylistMenu === track.id && (
                            <div className="playlist-menu-dropdown">
                              <button 
                                className="dropdown-item"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  addToQueue(track)
                                  setActiveTrackForPlaylistMenu(null)
                                }}
                              >
                                Thêm vào hàng đợi
                              </button>
                              <div className="dropdown-divider"></div>
                              <div className="dropdown-subheader">Thêm vào playlist</div>
                              {playlists.length > 0 ? (
                                playlists.map(p => (
                                  <button
                                    key={p.id}
                                    className="dropdown-item sub-item"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleAddTrackToPlaylist(p.id, track.id)
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
                                    handleCreatePlaylist()
                                    setActiveTrackForPlaylistMenu(null)
                                  }}
                                >
                                  + Tạo playlist mới
                                </button>
                              )}
                              <div className="dropdown-divider"></div>
                              <button 
                                className="dropdown-item danger"
                                onClick={(e) => {
                                  handleRemoveTrackFromPlaylist(e, playlist.id, track.id)
                                  setActiveTrackForPlaylistMenu(null)
                                }}
                              >
                                Xóa khỏi Playlist
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
              <div className="empty-icon">
                <IoMusicalNote size={48} style={{ color: '#4d4d4d' }} />
              </div>
              <p className="empty-text">Playlist này chưa có bài hát nào.</p>
              <p className="empty-text" style={{ fontSize: '12px', marginTop: '8px' }}>
                Thêm các bài hát được đề xuất bên dưới để lấp đầy playlist của bạn.
              </p>
            </div>
          )}

          {/* Recommended Songs Section (Spotify-like) */}
          {recommendedTracks.length > 0 && (
            <div className="recommended-section">
              <h3 className="section-subtitle">Đề xuất cho playlist của bạn</h3>
              <p className="section-description">Dựa trên các bài hát có trong thư viện của bạn</p>
              
              <div className="recommended-list">
                {recommendedTracks.map(track => {
                  const coverUrl = track.coverPath 
                    ? `media://get-file?path=${encodeURIComponent(track.coverPath)}` 
                    : null

                  return (
                    <div key={track.id} className="recommended-item">
                      <div className="track-cover">
                        {coverUrl ? (
                          <img src={coverUrl} alt="Cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                        ) : (
                          <span className="track-cover-fallback">
                            <IoMusicalNote size={18} style={{ color: '#b3b3b3' }} />
                          </span>
                        )}
                      </div>
                      
                      <div className="recommended-info">
                        <span className="track-title">{track.title || 'Unknown Title'}</span>
                        <span className="track-artist">{track.artist || 'Unknown Artist'}</span>
                      </div>

                      <div className="recommended-album">
                        {track.album || 'Unknown Album'}
                      </div>

                      <button 
                        className="btn-add-recommended"
                        onClick={() => handleAddTrackToPlaylist(playlist.id, track.id)}
                        title="Thêm vào playlist"
                      >
                        <IoAdd size={16} />
                        <span>Thêm</span>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )
    }

    if (activeTab === 'queue') {
      const nextTracks = queue.slice(currentIndex + 1)

      return (
        <div className="tab-view queue-view">
          <div className="tab-header-row">
            <div>
              <h2 className="tab-title">Hàng đợi phát nhạc</h2>
              <div className="folder-path-display">Danh sách bài hát chuẩn bị phát</div>
            </div>
          </div>

          {/* Now Playing Section */}
          <div className="queue-section">
            <h3 className="queue-section-title">Đang phát</h3>
            {currentTrack ? (
              <div className="track-item active playing-now" onClick={() => resume()}>
                <div className="track-index" style={{ display: 'flex', alignItems: 'center' }}>
                  <IoVolumeMedium size={18} style={{ color: 'var(--color-green)' }} />
                </div>
                <div className="track-cover">
                  {currentTrack.coverPath ? (
                    <img 
                      src={`media://get-file?path=${encodeURIComponent(currentTrack.coverPath)}`} 
                      alt="Cover" 
                      onError={(e) => { e.currentTarget.style.display = 'none' }} 
                    />
                  ) : (
                    <span className="track-cover-fallback">
                      <IoMusicalNote size={18} style={{ color: '#b3b3b3' }} />
                    </span>
                  )}
                </div>
                <div className="col-title track-title-info">
                  <span className="track-title">{currentTrack.title || 'Unknown Title'}</span>
                  <span className="track-artist">{currentTrack.artist || 'Unknown Artist'}</span>
                </div>
                <div className="col-album track-album-cell">
                  {currentTrack.album || 'Unknown Album'}
                </div>
                <div className="col-duration track-duration-cell">
                  {formatDuration(duration || currentTrack.durationSeconds)}
                </div>
              </div>
            ) : (
              <p className="queue-empty-text">Không có bài hát nào đang phát.</p>
            )}
          </div>

          {/* Next Up Section */}
          <div className="queue-section" style={{ marginTop: '32px' }}>
            <h3 className="queue-section-title">Tiếp theo</h3>
            {nextTracks.length > 0 ? (
              <div className="track-table-container">
                <div className="track-list-header">
                  <div className="col-index">#</div>
                  <div className="col-title">Tiêu đề</div>
                  <div className="col-album">Album</div>
                  <div className="col-actions"></div>
                  <div className="col-duration">Thời lượng</div>
                </div>

                <div className="track-list">
                  {nextTracks.map((track, idx) => {
                    const coverUrl = track.coverPath 
                      ? `media://get-file?path=${encodeURIComponent(track.coverPath)}` 
                      : null

                    return (
                      <div 
                        key={`${track.id}-${idx}`} 
                        className="track-item"
                        onClick={() => playTrack(track)}
                      >
                        <div className="track-index">{idx + 1}</div>
                        <div className="track-cover">
                          {coverUrl ? (
                            <img src={coverUrl} alt="Cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                          ) : (
                            <span className="track-cover-fallback">
                              <IoMusicalNote size={18} style={{ color: '#b3b3b3' }} />
                            </span>
                          )}
                        </div>

                        <div className="col-title track-title-info">
                          <span className="track-title">{track.title || 'Unknown Title'}</span>
                          <span className="track-artist">{track.artist || 'Unknown Artist'}</span>
                        </div>

                        <div className="col-album track-album-cell">
                          {track.album || 'Unknown Album'}
                        </div>

                        <div className="col-actions track-action-buttons">
                          <button 
                            className={`btn-row-favorite ${track.isFavorite === 1 ? 'liked' : ''}`}
                            onClick={(e) => handleToggleFavorite(e, track)}
                          >
                            {track.isFavorite === 1 ? <IoHeart size={16} /> : <IoHeartOutline size={16} />}
                          </button>
                          
                          <button 
                            className="btn-row-remove"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeFromQueue(track.id)
                            }}
                            title="Xóa khỏi hàng đợi phát"
                          >
                            <IoCloseOutline size={18} />
                          </button>
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
              <p className="queue-empty-text">Hàng đợi trống. Nhạc tiếp theo sẽ dừng.</p>
            )}
          </div>
        </div>
      )
    }

    if (activeTab === 'lyrics') {
      return (
        <div className="tab-view lyrics-view">
          <div className="lyrics-header">
            {currentTrack ? (
              <div className="lyrics-track-info">
                <div className="lyrics-track-cover">
                  {currentTrack.coverPath ? (
                    <img src={`media://get-file?path=${encodeURIComponent(currentTrack.coverPath)}`} alt="Cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  ) : (
                    <span className="track-cover-fallback">
                      <IoMusicalNote size={24} style={{ color: '#b3b3b3' }} />
                    </span>
                  )}
                </div>
                <div className="lyrics-track-details">
                  <h2>{currentTrack.title || 'Unknown Title'}</h2>
                  <p>{currentTrack.artist || 'Unknown Artist'}</p>
                </div>
              </div>
            ) : (
              <div className="lyrics-track-info">
                <h2>Chưa phát bài hát nào</h2>
              </div>
            )}
          </div>

          <div className="lyrics-visualizer-row">
            <Visualizer />
          </div>

          <div className="lyrics-body-scrollable" ref={lyricsContainerRef}>
            {lyricsData.synced && Array.isArray(lyricsData.lyrics) ? (
              <div className="synced-lyrics-list">
                {lyricsData.lyrics.map((line, index) => {
                  const isActive = index === currentLyricIndex
                  const isPassed = index < currentLyricIndex
                  return (
                    <div
                      key={index}
                      className={`lyric-line lyric-line-${index} ${isActive ? 'active' : ''} ${isPassed ? 'passed' : ''}`}
                      onClick={() => seek(line.time)}
                      title="Click để tua tới dòng này"
                    >
                      {line.text}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="plain-lyrics-container">
                {typeof lyricsData.lyrics === 'string' ? (
                  lyricsData.lyrics.split('\n').map((line, idx) => (
                    <div key={idx} className="plain-lyric-line">
                      {line}
                    </div>
                  ))
                ) : (
                  <div className="plain-lyric-line">Chưa có lời bài hát.</div>
                )}
              </div>
            )}
          </div>
        </div>
      )
    }

    if (activeTab === 'recently') {
      return (
        <div className="tab-view favorites-view">
          <div 
            className="playlist-banner playlist-custom-banner"
            style={{
              background: 'linear-gradient(135deg, #1f351f 0%, #121212 100%)'
            }}
          >
            <div className="banner-icon-container" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
              <IoTimeOutline size={48} color="#ffffff" />
            </div>
            <div className="banner-details">
              <span className="banner-tag">LỊCH SỬ</span>
              <h1 className="banner-title">Bài hát nghe gần đây</h1>
              <span className="banner-info">{recentlyTracks.length} bài hát</span>
            </div>
          </div>

          <div className="playlist-action-bar">
            {recentlyTracks.length > 0 && (
              <button 
                className="btn-play-playlist" 
                onClick={() => handlePlayCollection(recentlyTracks)}
                title="Phát toàn bộ bài hát nghe gần đây"
              >
                <IoPlay size={24} color="#000000" />
              </button>
            )}
          </div>

          {recentlyTracks.length > 0 ? (
            <div className="track-table-container">
              <div className="track-list-header">
                <div className="col-index">#</div>
                <div className="col-title">Tiêu đề</div>
                <div className="col-album">Album</div>
                <div className="col-actions"></div>
                <div className="col-duration">Thời lượng</div>
              </div>

              <div className="track-list">
                {recentlyTracks.map((track, index) => {
                  const coverUrl = track.coverPath 
                    ? `media://get-file?path=${encodeURIComponent(track.coverPath)}` 
                    : null
                  const isActive = currentTrack?.id === track.id

                  return (
                    <div 
                      key={track.id} 
                      className={`track-item ${isActive ? 'active' : ''}`}
                      onClick={() => playTrack(track, recentlyTracks)}
                      onContextMenu={(e) => handleContextMenu(e, track.id)}
                    >
                      <div className="track-index">{index + 1}</div>
                      <div className="track-cover">
                        {coverUrl ? (
                          <img src={coverUrl} alt="Cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                        ) : (
                          <span className="track-cover-fallback">
                            <IoMusicalNote size={18} style={{ color: '#b3b3b3' }} />
                          </span>
                        )}
                      </div>

                      <div className="col-title track-title-info">
                        <span className="track-title">{track.title || 'Unknown Title'}</span>
                        <span className="track-artist">{track.artist || 'Unknown Artist'}</span>
                      </div>

                      <div className="col-album track-album-cell">
                        {track.album || 'Unknown Album'}
                      </div>

                      <div className="col-actions track-action-buttons">
                        <button 
                          className={`btn-row-favorite ${track.isFavorite === 1 ? 'liked' : ''}`}
                          onClick={(e) => handleToggleFavorite(e, track)}
                        >
                          {track.isFavorite === 1 ? <IoHeart size={16} /> : <IoHeartOutline size={16} />}
                        </button>
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
              <div className="empty-icon">
                <IoTimeOutline size={48} style={{ color: '#4d4d4d' }} />
              </div>
              <p className="empty-text">Bạn chưa nghe bài hát nào gần đây.</p>
            </div>
          )}
        </div>
      )
    }

    if (activeTab === 'equalizer') {
      return <EqualizerTab />
    }

    return null
  }

  return (
    <div className="app-container">
      {/* Spotify Top Header */}
      <header className="top-header">
        <div className="top-header-left">
          <div className="header-brand-logo">
            <IoFlash size={22} color="#1ed760" />
            <span className="logo-text">Waveform</span>
          </div>
          
          <button 
            className={`header-home-btn ${activeTab === 'library' && !searchQuery ? 'active' : ''}`}
            onClick={() => {
              setSearchQuery('')
              setActiveTab('library')
            }}
            title="Trang chủ / Thư viện"
          >
            <IoHome size={20} />
          </button>
        </div>

        <div className="top-header-center">
          <div className="header-search-bar">
            <IoSearchOutline className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Bạn muốn phát nội dung gì?"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (activeTab !== 'library') {
                  setActiveTab('library')
                }
              }}
              className="header-search-input"
            />
          </div>
        </div>

        <div className="top-header-right">
          <button 
            className="btn-primary btn-add-music-header" 
            onClick={handleAddMusic} 
            disabled={isScanning}
          >
            {isScanning ? 'Đang xử lý...' : 'Add Music'}
          </button>
          
          <div className="header-avatar" title="Người dùng">
            <IoPersonOutline size={18} />
          </div>
        </div>
      </header>

      {/* Main Layout containing Sidebar and Content Container */}
      <div className="app-main-layout">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          playlists={playlists}
          onCreatePlaylist={handleCreatePlaylist}
        />

        <div className="content-container">
          {/* Notification status bar */}
          {statusMessage && !isScanning && (
            <div className="status-toast-bar">
              <span>{statusMessage}</span>
            </div>
          )}

          {isScanning && (
            <div className="top-scan-loader">
              <div className="spinner"></div>
              <span>Đang xử lý thư viện...</span>
            </div>
          )}

          <main className="main-content">
            {renderContent()}
          </main>
        </div>
      </div>

      {/* Spotify bottom NowPlayingBar control */}
      <NowPlayingBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}

export default function App() {
  return (
    <PlayerProvider>
      <AppContent />
    </PlayerProvider>
  )
}
