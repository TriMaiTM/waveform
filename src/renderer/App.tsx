import React, { useState, useEffect, useRef } from 'react'
import { Track, Playlist } from '../shared/types'
import { PlayerProvider } from './spotify/player/player-context'
import { usePlayer } from './spotify/player/use-player'
import NowPlayingBar from './spotify/NowPlayingBar'
import Sidebar from './spotify/Sidebar'
import Visualizer from './spotify/Visualizer'
import EqualizerTab from './spotify/EqualizerTab'
import AnalyticsTab from './spotify/AnalyticsTab'
import ArtistAlbumDetail from './spotify/ArtistAlbumDetail'
import DownloadTab from './spotify/DownloadTab'
import TftHubView from './tft/TftHubView'
import TftSidebar from './tft/TftSidebar'
import DemonSidebar from './demonlist/DemonSidebar'
import DemonlistView from './demonlist/DemonlistView'
import DemonChangelogView from './demonlist/DemonChangelogView'
import HubSidebar from './hub/HubSidebar'
import HubView from './hub/HubView'
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
  IoRefresh,
  IoPlaySkipBack,
  IoPlaySkipForward,
  IoPause,
  IoOptionsOutline,
  IoCreateOutline,
  IoArrowBackOutline
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
  const [activeApp, setActiveApp] = useState<'hub' | 'music' | 'tft' | 'gd'>('hub')
  const [gdTab, setGdTab] = useState<'demonlist' | 'changelog'>('demonlist')
  const [tftTab, setTftTab] = useState<string>('comp')
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
    volume,
    skipNext,
    skipPrevious,
    crossfadeTime,
    setCrossfadeTime,
    updateTrackMetadataInPlayer
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

  useEffect(() => {
    const unregisterPlayPause = window.api.onGlobalShortcut('global-media-play-pause', () => {
      if (isPlaying) {
        pause()
      } else {
        resume()
      }
    })

    const unregisterNext = window.api.onGlobalShortcut('global-media-next', () => {
      skipNext()
    })

    const unregisterPrev = window.api.onGlobalShortcut('global-media-prev', () => {
      skipPrevious()
    })

    return () => {
      unregisterPlayPause()
      unregisterNext()
      unregisterPrev()
    }
  }, [isPlaying, pause, resume, skipNext, skipPrevious])

  // Recently Played state
  const [recentlyTracks, setRecentlyTracks] = useState<Track[]>([])
  const recordedTracksRef = useRef<Set<number>>(new Set())
  const [musicDir, setMusicDir] = useState<string>('')
  const [isMiniPlayer, setIsMiniPlayer] = useState<boolean>(false)

  // Phase 5 States: Tag Editor
  const [editingTrack, setEditingTrack] = useState<Track | null>(null)
  const [isTagPanelOpen, setIsTagPanelOpen] = useState(false)
  const [tagTitle, setTagTitle] = useState('')
  const [tagArtist, setTagArtist] = useState('')
  const [tagAlbum, setTagAlbum] = useState('')
  const [tagGenre, setTagGenre] = useState('')
  const [tagYear, setTagYear] = useState<string>('')
  const [tagCover, setTagCover] = useState<string | null>(null)
  const [isSavingTags, setIsSavingTags] = useState(false)

  const handleOpenTagEditor = (track: Track) => {
    setEditingTrack(track)
    setTagTitle(track.title || '')
    setTagArtist(track.artist || '')
    setTagAlbum(track.album || '')
    setTagGenre(track.genre || '')
    setTagYear(track.year ? track.year.toString() : '')
    setTagCover(track.coverPath || null)
    setIsTagPanelOpen(true)
  }

  const handleCloseTagPanel = () => {
    setIsTagPanelOpen(false)
    setTimeout(() => {
      setEditingTrack(null)
    }, 350)
  }

  const handleSelectCover = async () => {
    try {
      const newPath = await window.api.selectCoverImage()
      if (newPath) {
        setTagCover(newPath)
      }
    } catch (err) {
      console.error('Failed to select cover image:', err)
    }
  }

  const handleSaveTags = async () => {
    if (!editingTrack) return
    setIsSavingTags(true)
    try {
      const yearNum = tagYear.trim() ? parseInt(tagYear, 10) : null
      const success = await window.api.updateTrackMetadata(editingTrack.id, {
        title: tagTitle,
        artist: tagArtist,
        album: tagAlbum,
        genre: tagGenre,
        year: yearNum,
        coverPath: tagCover
      })
      if (success) {
        setStatusMessage('Đã cập nhật thông tin bài hát!')
        setTimeout(() => setStatusMessage(''), 3000)
        
        // Synchronize state immediately in Player Context
        updateTrackMetadataInPlayer(editingTrack.id, {
          title: tagTitle,
          artist: tagArtist,
          album: tagAlbum,
          genre: tagGenre,
          year: yearNum,
          coverPath: tagCover
        })
        
        // Refresh tracks lists
        const updatedTracks = await window.api.getLibraryTracks()
        setTracks(updatedTracks)
        
        if (activeTab.startsWith('playlist-')) {
          const playlistId = parseInt(activeTab.split('-')[1])
          const pTracks = await window.api.getPlaylistTracks(playlistId)
          setPlaylistTracks(pTracks)
        }
        
        handleCloseTagPanel()
      } else {
        alert('Không thể lưu thông tin!')
      }
    } catch (err) {
      console.error('Failed to save tags:', err)
    } finally {
      setIsSavingTags(false)
    }
  }
  const [shortcuts, setShortcuts] = useState<{ playPause: string, next: string, prev: string }>({
    playPause: 'MediaPlayPause',
    next: 'MediaNextTrack',
    prev: 'MediaPreviousTrack'
  })
  const [miniPlayerType, setMiniPlayerType] = useState<string>('standard')
  const params = new URLSearchParams(window.location.search)
  const isWidgetView = params.get('view') === 'widget'

  const handleUpdateShortcut = async (key: string, value: string) => {
    try {
      const success = await window.api.updateGlobalShortcut(key, value)
      if (success) {
        setShortcuts(prev => ({
          ...prev,
          playPause: key === 'shortcut_play_pause' ? value : prev.playPause,
          next: key === 'shortcut_next' ? value : prev.next,
          prev: key === 'shortcut_prev' ? value : prev.prev
        }))
        setStatusMessage('Đã cập nhật phím tắt mới!')
        setTimeout(() => setStatusMessage(''), 3000)
      } else {
        setStatusMessage('Không thể đăng ký phím tắt này (có thể bị trùng lặp).')
        setTimeout(() => setStatusMessage(''), 3000)
      }
    } catch (err) {
      console.error('Failed to update shortcut:', err)
    }
  }

  const handleEnterMiniPlayer = async () => {
    await window.api.enterMiniPlayer()
  }

  const handleExitMiniPlayer = async () => {
    await window.api.exitMiniPlayer()
  }

  useEffect(() => {
    const unregister = window.api.onMiniPlayerStatus((isMini) => {
      setIsMiniPlayer(isMini)
    })
    return () => {
      unregister()
    }
  }, [])

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

  // Sync active track to Main process for widget window usage (ONLY from primary window, NOT from widget window)
  useEffect(() => {
    if (!isWidgetView) {
      window.api.setActiveTrack(currentTrack, isPlaying)
        .catch(err => console.error('[IPC] Failed to sync active track:', err))
    }
  }, [currentTrack, isPlaying, isWidgetView])

  // Load playlists and auto-scan default library folder on startup
  useEffect(() => {
    const initApp = async () => {
      setIsScanning(true)
      setStatusMessage('Đang kết nối thư viện nhạc...')
      try {
        // Load existing playlists
        const existingPlaylists = await window.api.getPlaylists()
        setPlaylists(existingPlaylists)

        // Get music folder directory
        const dir = await window.api.getMusicDirectory()
        setMusicDir(dir)

        // Get custom global shortcuts
        const savedShortcuts = await window.api.getGlobalShortcuts()
        setShortcuts(savedShortcuts)
        if (savedShortcuts.miniPlayerType) {
          setMiniPlayerType(savedShortcuts.miniPlayerType)
        }

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

  const handleDeleteTrackFileConfirm = async (track: Track) => {
    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa bài hát "${track.title}" khỏi thư viện và xóa file vật lý trên ổ đĩa không?`)
    if (!confirmDelete) return

    setIsScanning(true)
    setStatusMessage(`Đang xóa "${track.title}"...`)
    try {
      const remainingTracks = await window.api.deleteTrackFile(track.id)
      setTracks(remainingTracks)
      setPlaylistTracks(prev => prev.filter(t => t.id !== track.id))
      setStatusMessage('Đã xóa bài hát thành công!')
      setTimeout(() => setStatusMessage(''), 3000)
    } catch (err) {
      console.error('Failed to delete track file:', err)
      setStatusMessage('Xóa bài hát thất bại.')
      setTimeout(() => setStatusMessage(''), 3000)
    } finally {
      setIsScanning(false)
    }
  }

  const handleChangeMusicDir = async () => {
    const selected = await window.api.selectMusicDirectory()
    if (selected) {
      setMusicDir(selected)
      setIsScanning(true)
      setStatusMessage('Đang quét thư mục nhạc mới...')
      try {
        const updatedTracks = await window.api.scanLibrary()
        setTracks(updatedTracks)
        setStatusMessage('Đã chuyển thư mục và quét xong!')
        setTimeout(() => setStatusMessage(''), 3000)
      } catch (err) {
        console.error('Failed to scan new music directory:', err)
        setStatusMessage('Quét thư mục mới thất bại.')
        setTimeout(() => setStatusMessage(''), 3000)
      } finally {
        setIsScanning(false)
      }
    }
  }

  const handleResetMusicDir = async () => {
    const defaultDir = await window.api.resetMusicDirectory()
    setMusicDir(defaultDir)
    setIsScanning(true)
    setStatusMessage('Đang quét lại thư mục nhạc mặc định...')
    try {
      const updatedTracks = await window.api.scanLibrary()
      setTracks(updatedTracks)
      setStatusMessage('Đã đặt lại thư mục mặc định!')
      setTimeout(() => setStatusMessage(''), 3000)
    } catch (err) {
      console.error('Failed to scan default music directory:', err)
      setStatusMessage('Quét thư mục mặc định thất bại.')
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
    handleCloseTagPanel()
  }, [activeTab])

  // Auto-sync tag editor panel with the current playing track when it changes
  useEffect(() => {
    if (isTagPanelOpen && currentTrack) {
      setEditingTrack(currentTrack)
      setTagTitle(currentTrack.title || '')
      setTagArtist(currentTrack.artist || '')
      setTagAlbum(currentTrack.album || '')
      setTagGenre(currentTrack.genre || '')
      setTagYear(currentTrack.year ? currentTrack.year.toString() : '')
      setTagCover(currentTrack.coverPath || null)
    }
  }, [currentTrack, isTagPanelOpen])

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
          onDeleteTrack={handleDeleteTrackFileConfirm}
          onClose={() => setActiveDetail(null)}
        />
      )
    }

    if (activeTab === 'settings') {
      return (
        <div className="tab-view">
          <h2 className="tab-title" style={{ marginBottom: '24px' }}>Cài đặt ứng dụng</h2>
          <div className="settings-section-card" style={{ backgroundColor: '#181818', padding: '24px', borderRadius: '8px', border: '1px solid #282828' }}>
            <h3 className="settings-section-title" style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 'bold' }}>Thư mục thư viện nhạc</h3>
            <p className="settings-description" style={{ color: '#b3b3b3', fontSize: '14px', lineHeight: '1.6', margin: '0 0 20px 0' }}>
              Chọn thư mục lưu trữ và quét nhạc của bạn. Toàn bộ file nhạc khi bạn thêm bằng nút "Add Music" sẽ được sao chép vào thư mục này để phát nhạc và đồng bộ thư viện.
            </p>
            
            <div className="settings-dir-box" style={{ backgroundColor: '#121212', padding: '16px', borderRadius: '6px', border: '1px solid #282828', marginBottom: '24px' }}>
              <div className="settings-dir-label" style={{ fontSize: '12px', fontWeight: 'bold', color: '#b3b3b3', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Đường dẫn hiện tại:</div>
              <div className="settings-dir-value" style={{ fontSize: '14px', color: '#1db954', wordBreak: 'break-all', fontFamily: 'monospace' }}>{musicDir || 'Đang tải...'}</div>
            </div>

            <div className="settings-actions-row" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button 
                className="btn-create-playlist" 
                style={{ background: '#1db954', color: '#000', fontWeight: 'bold', padding: '10px 20px', borderRadius: '50px', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                onClick={handleChangeMusicDir}
              >
                Thay đổi thư mục
              </button>
              <button 
                className="btn-create-playlist" 
                style={{ background: '#282828', color: '#fff', border: '1px solid #7c7c7c', fontWeight: 'bold', padding: '10px 20px', borderRadius: '50px', cursor: 'pointer', fontSize: '14px' }}
                onClick={() => window.api.openMusicFolder()}
              >
                Mở thư mục
              </button>
              <button 
                className="btn-create-playlist" 
                style={{ background: 'transparent', color: '#b3b3b3', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px', marginLeft: '12px' }}
                onClick={handleResetMusicDir}
              >
                Đặt lại mặc định
              </button>
            </div>
          </div>

          <div className="settings-section-card" style={{ backgroundColor: '#181818', padding: '24px', borderRadius: '8px', border: '1px solid #282828', marginTop: '24px' }}>
            <h3 className="settings-section-title" style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 'bold' }}>Chế độ Mini Player</h3>
            <p className="settings-description" style={{ color: '#b3b3b3', fontSize: '14px', lineHeight: '1.6', margin: '0 0 20px 0' }}>
              Chọn kiểu hiển thị khi bạn kích hoạt chế độ thu nhỏ (Mini Player).
            </p>

            <div style={{ display: 'flex', gap: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#fff', fontSize: '14px' }}>
                <input 
                  type="radio" 
                  name="mini_player_type" 
                  value="standard" 
                  checked={miniPlayerType === 'standard'}
                  onChange={async () => {
                    setMiniPlayerType('standard')
                    await window.api.updateGlobalShortcut('mini_player_type', 'standard')
                  }}
                  style={{ accentColor: '#1db954' }}
                />
                Giao diện nhỏ đầy đủ (360x195 có nút bấm & thanh tiến trình)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#fff', fontSize: '14px' }}>
                <input 
                  type="radio" 
                  name="mini_player_type" 
                  value="cover_only" 
                  checked={miniPlayerType === 'cover_only'}
                  onChange={async () => {
                    setMiniPlayerType('cover_only')
                    await window.api.updateGlobalShortcut('mini_player_type', 'cover_only')
                  }}
                  style={{ accentColor: '#1db954' }}
                />
                Widget viên thuốc tối giản (240x60 không viền có nút điều khiển)
              </label>
            </div>
          </div>
          <div className="settings-section-card" style={{ backgroundColor: '#181818', padding: '24px', borderRadius: '8px', border: '1px solid #282828', marginTop: '24px' }}>
            <h3 className="settings-section-title" style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 'bold' }}>Chuyển bài đè âm lượng (Crossfade)</h3>
            <p className="settings-description" style={{ color: '#b3b3b3', fontSize: '14px', lineHeight: '1.6', margin: '0 0 20px 0' }}>
              Tự động giảm âm lượng bài hát cũ và tăng âm lượng bài hát mới đè lên nhau khi chuyển bài, giúp loại bỏ khoảng lặng.
            </p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', maxWidth: '500px' }}>
              <span style={{ fontSize: '14px', color: '#fff', width: '100px', flexShrink: 0 }}>Crossfade:</span>
              <input 
                type="range" 
                min={0} 
                max={10} 
                step={1} 
                value={crossfadeTime}
                onChange={(e) => setCrossfadeTime(parseInt(e.target.value, 10))}
                style={{ flexGrow: 1, accentColor: '#1db954', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1db954', width: '60px', textAlign: 'right', fontFamily: 'monospace' }}>
                {crossfadeTime === 0 ? 'Tắt' : `${crossfadeTime} giây`}
              </span>
            </div>
          </div>
          <div className="settings-section-card" style={{ backgroundColor: '#181818', padding: '24px', borderRadius: '8px', border: '1px solid #282828', marginTop: '24px' }}>
            <h3 className="settings-section-title" style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 'bold' }}>Phím tắt toàn hệ thống (Global Shortcuts)</h3>
            <p className="settings-description" style={{ color: '#b3b3b3', fontSize: '14px', lineHeight: '1.6', margin: '0 0 20px 0' }}>
              Cấu hình các phím nóng để điều khiển nhạc ngay cả khi ứng dụng đang ẩn. Nhập phím và ấn Lưu để cập nhật. Nhập "none" để tắt phím nóng đó.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: '#fff' }}>Phát / Tạm dừng:</span>
                <input 
                  type="text" 
                  value={shortcuts.playPause}
                  onChange={(e) => setShortcuts(prev => ({ ...prev, playPause: e.target.value }))}
                  style={{ backgroundColor: '#121212', border: '1px solid #282828', color: '#1db954', padding: '8px 12px', borderRadius: '4px', width: '220px', fontSize: '14px', fontFamily: 'monospace' }}
                  placeholder="MediaPlayPause hoặc Alt+P"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: '#fff' }}>Bài tiếp theo:</span>
                <input 
                  type="text" 
                  value={shortcuts.next}
                  onChange={(e) => setShortcuts(prev => ({ ...prev, next: e.target.value }))}
                  style={{ backgroundColor: '#121212', border: '1px solid #282828', color: '#1db954', padding: '8px 12px', borderRadius: '4px', width: '220px', fontSize: '14px', fontFamily: 'monospace' }}
                  placeholder="MediaNextTrack hoặc Alt+Right"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: '#fff' }}>Bài trước đó:</span>
                <input 
                  type="text" 
                  value={shortcuts.prev}
                  onChange={(e) => setShortcuts(prev => ({ ...prev, prev: e.target.value }))}
                  style={{ backgroundColor: '#121212', border: '1px solid #282828', color: '#1db954', padding: '8px 12px', borderRadius: '4px', width: '220px', fontSize: '14px', fontFamily: 'monospace' }}
                  placeholder="MediaPreviousTrack hoặc Alt+Left"
                />
              </div>

              <button 
                className="btn-create-playlist" 
                style={{ background: '#1db954', color: '#000', fontWeight: 'bold', padding: '10px 20px', borderRadius: '50px', border: 'none', cursor: 'pointer', fontSize: '14px', alignSelf: 'flex-start', marginTop: '8px' }}
                onClick={async () => {
                  const s1 = await window.api.updateGlobalShortcut('shortcut_play_pause', shortcuts.playPause)
                  const s2 = await window.api.updateGlobalShortcut('shortcut_next', shortcuts.next)
                  const s3 = await window.api.updateGlobalShortcut('shortcut_prev', shortcuts.prev)
                  if (s1 && s2 && s3) {
                    setStatusMessage('Đã lưu và áp dụng phím tắt thành công!')
                    setTimeout(() => setStatusMessage(''), 3000)
                  } else {
                    setStatusMessage('Có lỗi xảy ra khi lưu hoặc phím tắt không hợp lệ!')
                    setTimeout(() => setStatusMessage(''), 3000)
                  }
                }}
              >
                Lưu phím tắt
              </button>
            </div>

            <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#121212', borderRadius: '6px', fontSize: '12px', color: '#b3b3b3', lineHeight: '1.5' }}>
              <strong>Hướng dẫn cấu hình:</strong>
              <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                <li>Phím đa phương tiện: <code>MediaPlayPause</code>, <code>MediaNextTrack</code>, <code>MediaPreviousTrack</code></li>
                <li>Tổ hợp phím: Dùng dấu cộng, ví dụ <code>Ctrl+Alt+P</code>, <code>Alt+Right</code>, <code>Ctrl+Shift+Space</code></li>
                <li>Hỗ trợ phím bổ trợ: <code>Ctrl</code>, <code>Alt</code>, <code>Shift</code></li>
              </ul>
            </div>
          </div>
        </div>
      )
    }

    if (activeTab === 'download') {
      return (
        <DownloadTab 
          onDownloadSuccess={(updatedTracks) => {
            setTracks(updatedTracks)
          }}
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
              <button 
                className="btn-rescan-library btn-open-folder" 
                onClick={() => window.api.openMusicFolder()}
                title="Mở thư mục nhạc trên máy tính"
              >
                <IoFolderOpen size={18} />
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
                          className="btn-row-edit"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenTagEditor(track)
                          }}
                          title="Chỉnh sửa thông tin"
                        >
                          <IoCreateOutline size={16} />
                        </button>

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
                                className="dropdown-item delete-highlight"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteTrackFileConfirm(track)
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
                          className="btn-row-edit"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenTagEditor(track)
                          }}
                          title="Chỉnh sửa thông tin"
                        >
                          <IoCreateOutline size={16} />
                        </button>

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
                          className="btn-row-edit"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenTagEditor(track)
                          }}
                          title="Chỉnh sửa thông tin"
                        >
                          <IoCreateOutline size={16} />
                        </button>

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

    if (activeTab === 'analytics') {
      return <AnalyticsTab />
    }

    if (activeTab === 'tft') {
      return <TftHubView />
    }

    return null
  }

  if (isWidgetView) {
    const [widgetTrack, setWidgetTrack] = useState<any>(null)
    const [isWidgetPlaying, setIsWidgetPlaying] = useState<boolean>(false)
    const [isReady, setIsReady] = useState<boolean>(false)

    useEffect(() => {
      // Delay to ensure the window is fully painted before initiating animation
      const timer = setTimeout(() => {
        setIsReady(true)
      }, 300)

      // Get initial active track
      window.api.getCurrentActiveTrack().then(({ track, isPlaying }) => {
        setWidgetTrack(track)
        setIsWidgetPlaying(isPlaying)
      }).catch(err => console.error(err))

      // Listen for live track updates from Main
      const unregister = window.api.onWidgetTrackUpdate((data) => {
        setWidgetTrack(data.track)
        setIsWidgetPlaying(data.isPlaying)
      })

      return () => {
        unregister()
        clearTimeout(timer)
      }
    }, [])

    useEffect(() => {
      // Làm trong suốt hoàn toàn html và body để lộ bo tròn 100% của widget viên thuốc
      document.documentElement.style.backgroundColor = 'transparent'
      document.body.style.backgroundColor = 'transparent'
      document.body.style.backgroundImage = 'none'
      document.body.style.background = 'transparent'
    }, [])

    const coverUrl = widgetTrack?.coverPath 
      ? `media://get-file?path=${encodeURIComponent(widgetTrack.coverPath)}` 
      : null

    const shouldSpin = isReady && isWidgetPlaying

    return (
      <div 
        className="widget-pill-layout" 
        onDoubleClick={async () => {
          await window.api.exitMiniPlayer()
        }}
        title={widgetTrack ? `Đang phát: ${widgetTrack.title} - ${widgetTrack.artist}. Nhấp đúp hoặc bấm nút Options để khôi phục giao diện lớn.` : "Chưa có nhạc phát. Nhấp đúp hoặc bấm nút Options để khôi phục giao diện lớn."}
        style={{ 
          width: '100vw', 
          height: '100vh', 
          borderRadius: '30px', 
          overflow: 'hidden', 
          backgroundColor: 'rgba(18, 18, 18, 0.95)', 
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0 12px 0 6px',
          boxSizing: 'border-box',
          WebkitAppRegion: 'no-drag', 
          position: 'relative',
          userSelect: 'none'
        } as any}
      >
        {/* Album Art (Left) - Drag region for window moving with rotation */}
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#282828', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, WebkitAppRegion: 'drag', cursor: 'move', animation: shouldSpin ? 'spin 12s linear infinite' : 'none' } as any}>
          {coverUrl ? (
            <img src={coverUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          ) : (
            <IoMusicalNote size={20} style={{ color: '#b3b3b3', animation: shouldSpin ? 'spin 6s linear infinite' : 'none' }} />
          )}
        </div>

        {/* Playback Controls (Center) - Set no-drag so they can be clicked */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', WebkitAppRegion: 'no-drag' } as any}>
          <button 
            onClick={() => window.api.widgetControlPrev()}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
          >
            <IoPlaySkipBack size={16} />
          </button>

          <button 
            onClick={() => window.api.widgetControlPlayPause()}
            style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#fff', color: '#000', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
          >
            {isWidgetPlaying ? <IoPause size={14} /> : <IoPlay size={14} style={{ transform: 'translateX(1px)' }} />}
          </button>

          <button 
            onClick={() => window.api.widgetControlNext()}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
          >
            <IoPlaySkipForward size={16} />
          </button>
        </div>

        {/* Restore/Maximize Button (Right) - Set no-drag */}
        <div style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button 
            onClick={async () => {
              await window.api.exitMiniPlayer()
            }}
            title="Mở giao diện lớn"
            style={{ background: 'transparent', border: 'none', color: '#b3b3b3', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
          >
            <IoOptionsOutline size={16} />
          </button>
        </div>
      </div>
    )
  }

  if (isMiniPlayer) {
    const coverUrl = currentTrack?.coverPath 
      ? `media://get-file?path=${encodeURIComponent(currentTrack.coverPath)}` 
      : null

    return (
      <div className="mini-player-layout" style={{ width: '100vw', height: '100vh', backgroundColor: '#121212', padding: '16px', boxSizing: 'border-box', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid #282828', userSelect: 'none', position: 'relative' }}>
        {/* Drag handle area (since borderless) */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '30px', WebkitAppRegion: 'drag', cursor: 'move', zIndex: 1 } as any} />
        
        {/* Main Info Row */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px', zIndex: 2 }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#282828', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {coverUrl ? (
              <img src={coverUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <IoMusicalNote size={24} style={{ color: '#b3b3b3' }} />
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flexGrow: 1 }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentTrack?.title || 'Chưa phát nhạc'}
            </span>
            <span style={{ fontSize: '12px', color: '#b3b3b3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '4px' }}>
              {currentTrack?.artist || 'Unknown Artist'}
            </span>
          </div>
        </div>

        {/* Progress bar info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 2, margin: '8px 0' }}>
          <div 
            onClick={(e) => {
              if (!duration) return
              const rect = e.currentTarget.getBoundingClientRect()
              const clickX = e.clientX - rect.left
              const width = rect.width
              const percentage = clickX / width
              seek(percentage * duration)
            }}
            style={{ width: '100%', height: '4px', backgroundColor: '#282828', borderRadius: '2px', cursor: 'pointer', position: 'relative' }}
          >
            <div style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%`, height: '100%', backgroundColor: '#1db954', borderRadius: '2px' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#b3b3b3' }}>
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Controls Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2, marginBottom: '4px' }}>
          {/* Exit mini mode button */}
          <button 
            className="control-btn" 
            onClick={handleExitMiniPlayer}
            title="Mở giao diện lớn"
            style={{ background: 'transparent', border: 'none', color: '#b3b3b3', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <IoOptionsOutline size={18} />
          </button>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button 
              className="control-btn" 
              onClick={skipPrevious} 
              disabled={!currentTrack}
              style={{ background: 'transparent', border: 'none', color: currentTrack ? '#fff' : '#4d4d4d', cursor: currentTrack ? 'pointer' : 'default' }}
            >
              <IoPlaySkipBack size={20} />
            </button>

            <button 
              className="control-btn btn-play-pause" 
              onClick={isPlaying ? pause : resume} 
              disabled={!currentTrack}
              style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#fff', color: '#000', border: 'none', cursor: currentTrack ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isPlaying ? <IoPause size={18} /> : <IoPlay size={18} style={{ transform: 'translateX(1px)' }} />}
            </button>

            <button 
              className="control-btn" 
              onClick={skipNext} 
              disabled={!currentTrack}
              style={{ background: 'transparent', border: 'none', color: currentTrack ? '#fff' : '#4d4d4d', cursor: currentTrack ? 'pointer' : 'default' }}
            >
              <IoPlaySkipForward size={20} />
            </button>
          </div>

          <div style={{ width: '18px' }} />
        </div>
      </div>
    )
  }

  const renderTagEditorPanel = () => {
    const coverUrl = tagCover
      ? (tagCover.startsWith('media://') ? tagCover : `media://get-file?path=${encodeURIComponent(tagCover)}`)
      : null

    return (
      <div className={`tag-editor-panel ${isTagPanelOpen && editingTrack ? 'open' : ''}`}>
        <div className="panel-header">
          <h2>Chỉnh sửa thông tin</h2>
          <button className="panel-close-btn" onClick={handleCloseTagPanel} title="Đóng">
            <IoCloseOutline size={20} />
          </button>
        </div>

        {editingTrack && (
          <div className="panel-body">
            {/* Album Cover Section */}
            <div className="panel-cover-section">
              <div className="panel-cover-container" onClick={handleSelectCover} title="Nhấp vào để chọn ảnh bìa mới">
                {coverUrl ? (
                  <img src={coverUrl} alt="Cover Preview" className="panel-cover-image" />
                ) : (
                  <div className="panel-cover-fallback">
                    <IoMusicalNote size={40} />
                    <span style={{ fontSize: '11px' }}>Chọn ảnh bìa</span>
                  </div>
                )}
                <div className="panel-cover-overlay">
                  <IoCreateOutline size={24} />
                  <span>Thay đổi ảnh</span>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="panel-form">
              <div className="panel-form-group">
                <label>Tiêu đề</label>
                <input 
                  type="text" 
                  className="panel-input"
                  value={tagTitle} 
                  onChange={(e) => setTagTitle(e.target.value)}
                  placeholder="Nhập tiêu đề bài hát..."
                />
              </div>

              <div className="panel-form-group">
                <label>Nghệ sĩ</label>
                <input 
                  type="text" 
                  className="panel-input"
                  value={tagArtist} 
                  onChange={(e) => setTagArtist(e.target.value)}
                  placeholder="Nhập nghệ sĩ..."
                />
              </div>

              <div className="panel-form-group">
                <label>Album</label>
                <input 
                  type="text" 
                  className="panel-input"
                  value={tagAlbum} 
                  onChange={(e) => setTagAlbum(e.target.value)}
                  placeholder="Nhập tên album..."
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="panel-form-group" style={{ flex: 1 }}>
                  <label>Thể loại</label>
                  <input 
                    type="text" 
                    className="panel-input"
                    value={tagGenre} 
                    onChange={(e) => setTagGenre(e.target.value)}
                    placeholder="Thể loại..."
                  />
                </div>

                <div className="panel-form-group" style={{ width: '90px' }}>
                  <label>Năm</label>
                  <input 
                    type="text" 
                    className="panel-input"
                    style={{ textAlign: 'center' }}
                    value={tagYear} 
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '')
                      setTagYear(v)
                    }}
                    placeholder="YYYY"
                    maxLength={4}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' , marginBottom: '42px' }}>
                <button className="btn-panel-cancel" onClick={handleCloseTagPanel}>
                  Hủy
                </button>
                <button className="btn-panel-save" onClick={handleSaveTags} disabled={isSavingTags}>
                  {isSavingTags ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="app-container">
      {/* Spotify Top Header */}
      <header className="top-header">
        <div className="top-header-left">
          <div 
            className="header-brand-logo" 
            onClick={() => setActiveApp('hub')} 
            style={{ cursor: 'pointer' }}
            title="Quay về Waveform Hub"
          >
            <IoFlash size={22} color="#1ed760" />
            <span className="logo-text">Waveform</span>
          </div>
          
          {activeApp !== 'hub' && (
            <button 
              className="header-home-btn"
              onClick={() => setActiveApp('hub')}
              title="Quay lại Waveform Hub"
            >
              <IoArrowBackOutline size={20} />
            </button>
          )}
        </div>

        <div className="top-header-center">
          {activeApp === 'music' && (
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
          )}
        </div>
      </header>

      {/* Main Layout containing Sidebar and Content Container */}
      <div className={`app-main-layout ${activeApp !== 'music' ? 'no-player' : ''}`}>
        {activeApp === 'hub' && (
          <>
            <HubSidebar 
              activeApp={activeApp} 
              setActiveApp={setActiveApp} 
              trackCount={tracks.length} 
            />
            <div className="content-container">
              <HubView />
            </div>
          </>
        )}

        {activeApp === 'music' && (
          <>
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
              {renderTagEditorPanel()}
            </div>
          </>
        )}

        {activeApp === 'tft' && (
          <>
            <TftSidebar activeTab={tftTab} setActiveTab={setTftTab} />
            <div className="content-container">
              <TftHubView />
            </div>
          </>
        )}
        {activeApp === 'gd' && (
          <>
            <DemonSidebar activeTab={gdTab} setActiveTab={setGdTab} />
            <div className="content-container">
              {gdTab === 'demonlist' ? <DemonlistView /> : <DemonChangelogView />}
            </div>
          </>
        )}
      </div>

      {/* Spotify bottom NowPlayingBar control - ONLY visible in Spotify */}
      <div style={{ display: activeApp === 'music' ? 'block' : 'none' }}>
        <NowPlayingBar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onEnterMiniPlayer={handleEnterMiniPlayer}
        />
      </div>
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
