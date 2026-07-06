import React, { useState, useEffect } from 'react'
import { usePlayer } from '../player/use-player'
import { 
  IoPlaySkipBack, 
  IoPlaySkipForward, 
  IoPlay, 
  IoPause, 
  IoVolumeMute, 
  IoVolumeLow, 
  IoVolumeMedium, 
  IoVolumeHigh, 
  IoMusicalNote,
  IoHeart,
  IoHeartOutline,
  IoShuffle,
  IoRepeat,
  IoListOutline,
  IoMicOutline
} from 'react-icons/io5'

interface NowPlayingBarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export default function NowPlayingBar({ activeTab, setActiveTab }: NowPlayingBarProps) {
  const {
    currentTrack,
    isPlaying,
    duration,
    currentTime,
    volume,
    isShuffle,
    repeatMode,
    pause,
    resume,
    skipNext,
    skipPrevious,
    seek,
    setVolume,
    toggleFavorite,
    toggleShuffle,
    toggleRepeat
  } = usePlayer()

  const [isSeeking, setIsSeeking] = useState(false)
  const [localTime, setLocalTime] = useState(0)

  useEffect(() => {
    if (!isSeeking) {
      setLocalTime(currentTime)
    }
  }, [currentTime, isSeeking])

  const formatTime = (secs: number): string => {
    if (isNaN(secs) || secs === null || secs === Infinity) return '0:00'
    const mins = Math.floor(secs / 60)
    const remainingSecs = Math.floor(secs % 60)
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`
  }

  const handlePlayPause = () => {
    if (!currentTrack) return
    if (isPlaying) {
      pause()
    } else {
      resume()
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTime(parseFloat(e.target.value))
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value))
  }

  const coverUrl = currentTrack?.coverPath
    ? `media://get-file?path=${encodeURIComponent(currentTrack.coverPath)}`
    : null

  return (
    <div className="now-playing-bar">
      {/* Left: Track Details */}
      <div className="now-playing-left">
        {currentTrack ? (
          <>
            <div className="track-cover">
              {coverUrl ? (
                <img src={coverUrl} alt="Cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              ) : (
                <span className="track-cover-fallback">
                  <IoMusicalNote size={20} style={{ color: '#b3b3b3' }} />
                </span>
              )}
            </div>
            <div className="track-title-info">
              <div className="track-title" title={currentTrack.title || ''}>
                {currentTrack.title || 'Unknown Title'}
              </div>
              <div className="track-artist" title={currentTrack.artist || ''} style={{ color: '#b3b3b3' }}>
                {currentTrack.artist || 'Unknown Artist'}
              </div>
            </div>
            <button 
              className={`btn-favorite ${currentTrack.isFavorite === 1 ? 'active' : ''}`}
              onClick={() => toggleFavorite(currentTrack)}
              title={currentTrack.isFavorite === 1 ? 'Xóa khỏi Yêu thích' : 'Thêm vào Yêu thích'}
            >
              {currentTrack.isFavorite === 1 ? (
                <IoHeart size={20} color="#1ed760" />
              ) : (
                <IoHeartOutline size={20} />
              )}
            </button>
          </>
        ) : (
          <div style={{ color: '#b3b3b3', fontSize: '14px', fontStyle: 'italic' }}>
            Không có bài hát nào được chọn
          </div>
        )}
      </div>

      {/* Center: Playback Controls & Timeline */}
      <div className="now-playing-center">
        <div className="playback-controls">
          <button 
            className={`control-btn btn-shuffle ${isShuffle ? 'active' : ''}`} 
            onClick={toggleShuffle} 
            disabled={!currentTrack}
            title={isShuffle ? 'Tắt phát ngẫu nhiên (Shuffle)' : 'Bật phát ngẫu nhiên (Shuffle)'}
          >
            <IoShuffle size={18} />
          </button>

          <button 
            className="control-btn" 
            onClick={skipPrevious} 
            disabled={!currentTrack}
            title="Bài trước (Previous)"
          >
            <IoPlaySkipBack size={20} />
          </button>
          
          <button 
            className="control-btn btn-play-pause" 
            onClick={handlePlayPause} 
            disabled={!currentTrack}
            title={isPlaying ? 'Tạm dừng (Pause)' : 'Phát (Play)'}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isPlaying ? (
              <IoPause size={18} />
            ) : (
              <IoPlay size={18} style={{ transform: 'translateX(1px)' }} />
            )}
          </button>
          
          <button 
            className="control-btn" 
            onClick={skipNext} 
            disabled={!currentTrack}
            title="Bài tiếp (Next)"
          >
            <IoPlaySkipForward size={20} />
          </button>

          <button 
            className={`control-btn btn-repeat ${repeatMode !== 'off' ? 'active' : ''}`} 
            onClick={toggleRepeat} 
            disabled={!currentTrack}
            title={
              repeatMode === 'one' 
                ? 'Lặp lại 1 bài (Click để tắt)' 
                : repeatMode === 'all' 
                ? 'Lặp lại tất cả (Click để lặp 1 bài)' 
                : 'Bật lặp lại tất cả (Click để lặp tất cả)'
            }
            style={{ position: 'relative' }}
          >
            <IoRepeat size={18} />
            {repeatMode === 'one' && <span className="repeat-badge-one">1</span>}
          </button>
        </div>

        <div className="playback-bar">
          <span className="time-display">{formatTime(isSeeking ? localTime : currentTime)}</span>
          <div className="progress-slider-container">
            <input
              type="range"
              className="slider"
              min={0}
              max={duration || 100}
              value={isSeeking ? localTime : currentTime}
              onMouseDown={() => setIsSeeking(true)}
              onTouchStart={() => setIsSeeking(true)}
              onChange={handleSeek}
              onMouseUp={() => {
                seek(localTime)
                setIsSeeking(false)
              }}
              onTouchEnd={() => {
                seek(localTime)
                setIsSeeking(false)
              }}
              disabled={!currentTrack}
              style={{
                '--slider-progress': `${duration > 0 ? ((isSeeking ? localTime : currentTime) / duration) * 100 : 0}%`
              } as React.CSSProperties}
            />
          </div>
          <span className="time-display right">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right: Volume & Utilities */}
      <div className="now-playing-right">
        {setActiveTab && (
          <>
            <button 
              className={`control-btn btn-lyrics-utility ${activeTab === 'lyrics' ? 'active' : ''}`}
              onClick={() => setActiveTab(activeTab === 'lyrics' ? 'library' : 'lyrics')}
              title="Lời bài hát (Lyrics)"
              disabled={!currentTrack}
              style={{ marginRight: '12px', background: 'transparent', border: 'none', cursor: currentTrack ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: currentTrack ? 1 : 0.4 }}
            >
              <IoMicOutline size={18} />
            </button>

            <button 
              className={`control-btn btn-queue-utility ${activeTab === 'queue' ? 'active' : ''}`}
              onClick={() => setActiveTab(activeTab === 'queue' ? 'library' : 'queue')}
              title="Hàng đợi phát nhạc (Queue)"
              style={{ marginRight: '16px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <IoListOutline size={20} />
            </button>
          </>
        )}

        <div className="volume-controls">
          <button 
            className="volume-icon" 
            onClick={() => setVolume(volume > 0 ? 0 : 0.5)}
            title={volume === 0 ? 'Bật âm' : 'Tắt âm'}
          >
            {volume === 0 ? (
              <IoVolumeMute size={20} />
            ) : volume < 0.4 ? (
              <IoVolumeLow size={20} />
            ) : volume < 0.7 ? (
              <IoVolumeMedium size={20} />
            ) : (
              <IoVolumeHigh size={20} />
            )}
          </button>
          <input
            type="range"
            className="slider"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={handleVolumeChange}
            title={`Âm lượng: ${Math.round(volume * 100)}%`}
            style={{
              '--slider-progress': `${volume * 100}%`
            } as React.CSSProperties}
          />
        </div>
      </div>
    </div>
  )
}
