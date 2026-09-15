import React, { useState, useEffect, useRef } from 'react'
import { IoDownloadOutline, IoFolderOpenOutline, IoCheckmarkCircleOutline, IoAlertCircleOutline, IoTerminalOutline } from 'react-icons/io5'
import { Track } from '../../shared/types'

interface DownloadTabProps {
  onDownloadSuccess: (updatedTracks: Track[]) => void;
}

export default function DownloadTab({ onDownloadSuccess }: DownloadTabProps) {
  const [url, setUrl] = useState('')
  const [yesPlaylist, setYesPlaylist] = useState(true)
  const [embedThumbnail, setEmbedThumbnail] = useState(true)
  const [addMetadata, setAddMetadata] = useState(true)
  const [ytdlpPath, setYtdlpPath] = useState(() => {
    return localStorage.getItem('waveform_ytdlp_path') || ''
  })
  
  // Download State
  const [isDownloading, setIsDownloading] = useState(false)
  const [percentage, setPercentage] = useState(0)
  const [speed, setSpeed] = useState('')
  const [eta, setEta] = useState('')
  const [statusText, setStatusText] = useState('Sẵn sàng tải xuống')
  const [logs, setLogs] = useState<string[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const logEndRef = useRef<HTMLDivElement>(null)

  // Save custom path to localStorage on change
  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setYtdlpPath(val)
    localStorage.setItem('waveform_ytdlp_path', val)
  }

  // Scroll to log end automatically
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  // Setup download progress listener
  useEffect(() => {
    const unsubscribe = window.api.onDownloadProgress((data) => {
      if (data.percentage > 0) {
        setPercentage(data.percentage)
      }
      if (data.speed) {
        setSpeed(data.speed)
      }
      if (data.eta) {
        setEta(data.eta)
      }
      
      // Add line to log console
      if (data.log) {
        setLogs((prev) => [...prev, data.log].slice(-100)) // Keep last 100 lines
        
        // Dynamic status based on log contents
        if (data.log.includes('[ExtractAudio]')) {
          setStatusText('Đang trích xuất file âm thanh...')
        } else if (data.log.includes('[Thumbnails]')) {
          setStatusText('Đang tải ảnh bìa video...')
        } else if (data.log.includes('[Metadata]')) {
          setStatusText('Đang ghi tag metadata...')
        } else if (data.log.includes('[download]')) {
          setStatusText('Đang tải dữ liệu video...')
        }
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const handleStartDownload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setIsDownloading(true)
    setPercentage(0)
    setSpeed('')
    setEta('')
    setErrorMsg('')
    setSuccessMsg('')
    setLogs(['[Hệ thống] Bắt đầu khởi chạy yt-dlp...'])
    setStatusText('Đang kết nối tới YouTube...')

    try {
      const result = await window.api.downloadYoutubeMusic(url.trim(), {
        yesPlaylist,
        embedThumbnail,
        addMetadata,
        ytdlpPath: ytdlpPath.trim()
      })

      if (result.success) {
        setPercentage(100)
        setStatusText('Tải xuống hoàn tất!')
        setSuccessMsg('Đã tải nhạc thành công và đồng bộ vào thư viện!')
        
        if (result.tracks) {
          onDownloadSuccess(result.tracks)
        }
      } else {
        setErrorMsg(result.error || 'Quá trình tải xuống gặp lỗi không xác định.')
        setStatusText('Thất bại')
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối IPC: ' + (err as Error).message)
      setStatusText('Thất bại')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleOpenFolder = async () => {
    await window.api.openMusicFolder()
  }

  return (
    <div className="tab-view" style={{ maxWidth: '800px', margin: '0 auto', padding: '16px' }}>
      <div className="tab-header-row">
        <h2 className="tab-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <IoDownloadOutline size={30} style={{ color: '#1db954' }} />
          Tải nhạc từ YouTube
        </h2>
        <button
          className="btn-create-playlist"
          style={{
            background: 'transparent',
            color: '#b3b3b3',
            border: '1px solid #282828',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            fontSize: '13px'
          }}
          onClick={handleOpenFolder}
        >
          <IoFolderOpenOutline size={16} />
          Thư mục nhạc của app
        </button>
      </div>

      {/* Main glassmorphism card */}
      <div 
        className="settings-section-card" 
        style={{ 
          backgroundColor: '#181818', 
          padding: '28px', 
          borderRadius: '12px', 
          border: '1px solid #282828',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <form onSubmit={handleStartDownload}>
          <div className="panel-form-group" style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#b3b3b3', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'block' }}>
              Link video hoặc playlist YouTube
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                className="panel-input"
                style={{ 
                  flex: 1, 
                  fontSize: '14px', 
                  padding: '12px 16px',
                  backgroundColor: '#282828',
                  border: '1px solid #3e3e3e',
                  borderRadius: '6px',
                  color: '#fff'
                }}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Dán link https://www.youtube.com/watch?v=... hoặc link playlist vào đây"
                disabled={isDownloading}
              />
              <button
                type="submit"
                className="btn-create-playlist"
                style={{
                  background: isDownloading || !url.trim() ? '#4a4a4a' : '#1db954',
                  color: '#000',
                  fontWeight: 'bold',
                  padding: '0 28px',
                  borderRadius: '50px',
                  border: 'none',
                  cursor: isDownloading || !url.trim() ? 'default' : 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                disabled={isDownloading || !url.trim()}
              >
                {isDownloading ? 'Đang tải...' : 'Tải nhạc'}
              </button>
            </div>
          </div>

          {/* Options grid */}
          <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#fff', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={yesPlaylist}
                onChange={(e) => setYesPlaylist(e.target.checked)}
                disabled={isDownloading}
                style={{ accentColor: '#1db954', width: '16px', height: '16px' }}
              />
              Tải cả playlist nếu là link danh sách
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#fff', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={embedThumbnail}
                onChange={(e) => setEmbedThumbnail(e.target.checked)}
                disabled={isDownloading}
                style={{ accentColor: '#1db954', width: '16px', height: '16px' }}
              />
              Nhúng ảnh bìa Thumbnail
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#fff', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={addMetadata}
                onChange={(e) => setAddMetadata(e.target.checked)}
                disabled={isDownloading}
                style={{ accentColor: '#1db954', width: '16px', height: '16px' }}
              />
              Ghi đè tag Metadata bài hát
            </label>
          </div>

          {/* Tool path configurations */}
          <div className="panel-form-group" style={{ borderTop: '1px solid #282828', paddingTop: '20px', marginBottom: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#b3b3b3', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', display: 'block' }}>
              Cấu hình đường dẫn thư mục chứa yt-dlp / ffmpeg (Tùy chọn)
            </label>
            <p style={{ color: '#8e8e8e', fontSize: '11px', margin: '0 0 10px 0', lineHeight: '1.4' }}>
              Nếu hệ thống của bạn chưa cài yt-dlp toàn cục, hãy nhập đường dẫn tới thư mục chứa file `yt-dlp.exe` và `ffmpeg.exe` (ví dụ: `D:\tools\`). Để trống nếu đã cài đặt toàn cục.
            </p>
            <input
              type="text"
              className="panel-input"
              style={{
                width: '100%',
                fontSize: '13px',
                padding: '10px 14px',
                backgroundColor: '#1f1f1f',
                border: '1px solid #2e2e2e',
                borderRadius: '6px',
                color: '#ddd'
              }}
              value={ytdlpPath}
              onChange={handlePathChange}
              placeholder="Ví dụ: D:\tools"
              disabled={isDownloading}
            />
          </div>
        </form>
      </div>

      {/* Progress & Output Log Box */}
      {(isDownloading || percentage > 0 || errorMsg || successMsg) && (
        <div 
          className="settings-section-card" 
          style={{ 
            backgroundColor: '#181818', 
            padding: '24px', 
            borderRadius: '12px', 
            border: '1px solid #282828',
            marginTop: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
          }}
        >
          {/* Status header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isDownloading && <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderTopColor: '#1db954', display: 'inline-block' }}></div>}
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{statusText}</span>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1db954' }}>{percentage}%</span>
          </div>

          {/* Progress Bar Container */}
          <div style={{ width: '100%', height: '8px', backgroundColor: '#282828', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
            <div 
              style={{ 
                width: `${percentage}%`, 
                height: '100%', 
                backgroundColor: errorMsg ? '#e91e63' : '#1db954', 
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }}
            ></div>
          </div>

          {/* Speed & ETA stats */}
          {isDownloading && (speed || eta) && (
            <div style={{ display: 'flex', gap: '24px', fontSize: '12px', color: '#b3b3b3', marginBottom: '16px' }}>
              {speed && <div>Tốc độ: <strong style={{ color: '#fff' }}>{speed}</strong></div>}
              {eta && <div>Thời gian còn lại: <strong style={{ color: '#fff' }}>{eta}</strong></div>}
            </div>
          )}

          {/* Success Notification */}
          {successMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(29, 185, 84, 0.1)', border: '1px solid rgba(29, 185, 84, 0.3)', padding: '12px 16px', borderRadius: '6px', color: '#1db954', fontSize: '13px', marginBottom: '16px' }}>
              <IoCheckmarkCircleOutline size={20} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Notification */}
          {errorMsg && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: 'rgba(233, 30, 99, 0.1)', border: '1px solid rgba(233, 30, 99, 0.3)', padding: '12px 16px', borderRadius: '6px', color: '#ff5c8a', fontSize: '13px', marginBottom: '16px', lineHeight: '1.4' }}>
              <IoAlertCircleOutline size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Lỗi tải xuống:</strong>
                <span style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '11px' }}>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Console Log Window */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#8e8e8e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              <IoTerminalOutline size={14} />
              Bảng xuất log dòng lệnh (yt-dlp output)
            </div>
            <div 
              style={{ 
                width: '100%', 
                height: '150px', 
                backgroundColor: '#0c0c0c', 
                border: '1px solid #222',
                borderRadius: '6px',
                padding: '12px',
                fontFamily: '"Consolas", "Courier New", monospace',
                fontSize: '11px',
                color: '#2aff2a',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.5'
              }}
            >
              {logs.map((log, idx) => (
                <div key={idx} style={{ color: log.startsWith('[Hệ thống]') ? '#ffcc00' : log.includes('ERROR') ? '#ff5c8a' : '#2aff2a' }}>
                  {log}
                </div>
              ))}
              <div ref={logEndRef}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
