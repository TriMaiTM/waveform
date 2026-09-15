import React, { useEffect, useState } from 'react'
import { IoBarChartOutline, IoTimeOutline, IoMusicalNotesOutline, IoPersonOutline, IoMusicalNote } from 'react-icons/io5'

interface AnalyticsData {
  totalHours: number;
  topArtists: Array<{ artist: string, count: number }>;
  topTracks: Array<{ id: number, title: string, artist: string, count: number, coverPath: string | null }>;
  hourlyStats: Array<{ hour: number, count: number }>;
}

export default function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [hoveredHour, setHoveredHour] = useState<{ hour: number, count: number } | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const res = await window.api.getListeningAnalytics()
        setData(res)
      } catch (err) {
        console.error('[Analytics] Failed to fetch analytics data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="tab-view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ color: '#b3b3b3', fontSize: '16px' }}>Đang phân tích dữ liệu nghe nhạc của bạn...</div>
      </div>
    )
  }

  if (!data || (data.totalHours === 0 && data.topArtists.length === 0 && data.topTracks.length === 0)) {
    return (
      <div className="tab-view" style={{ padding: '24px' }}>
        <h2 className="tab-title" style={{ marginBottom: '24px' }}>Thống kê cá nhân</h2>
        <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', backgroundColor: '#181818', borderRadius: '8px', border: '1px solid #282828', padding: '40px' }}>
          <IoBarChartOutline size={48} style={{ color: '#4d4d4d', marginBottom: '16px' }} />
          <p style={{ color: '#b3b3b3', fontSize: '15px', textAlign: 'center', margin: 0 }}>
            Chưa có đủ dữ liệu để thống kê. Hãy nghe thêm vài bài nhạc để Waveform Wrapped phân tích thói quen của bạn nhé!
          </p>
        </div>
      </div>
    )
  }

  // Calculate total listens for percentage calculations
  const totalArtistListens = data.topArtists.reduce((acc, curr) => acc + curr.count, 0)
  
  // Find max hourly count for scale
  const maxHourlyCount = Math.max(...data.hourlyStats.map(h => h.count), 1)

  return (
    <div className="tab-view" style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
      <h2 className="tab-title" style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 'bold' }}>Thống kê cá nhân (Waveform Wrapped)</h2>

      {/* Grid: Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* Card 1: Total Listening Time */}
        <div style={{ backgroundColor: '#181818', border: '1px solid #282828', borderRadius: '12px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(29, 185, 84, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1db954' }}>
            <IoTimeOutline size={28} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#b3b3b3', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Tổng thời gian nghe</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>
              {data.totalHours < 1 ? `${Math.round(data.totalHours * 60)} phút` : `${data.totalHours} giờ`}
            </div>
          </div>
        </div>

        {/* Card 2: Favorite Artist */}
        <div style={{ backgroundColor: '#181818', border: '1px solid #282828', borderRadius: '12px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(54, 162, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#36a2eb' }}>
            <IoPersonOutline size={28} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#b3b3b3', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Nghệ sĩ nghe nhiều nhất</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }} title={data.topArtists[0]?.artist || 'N/A'}>
              {data.topArtists[0]?.artist || 'Không rõ'}
            </div>
            {data.topArtists[0] && (
              <div style={{ fontSize: '12px', color: '#b3b3b3', marginTop: '2px' }}>{data.topArtists[0].count} lượt nghe</div>
            )}
          </div>
        </div>

        {/* Card 3: Favorite Track */}
        <div style={{ backgroundColor: '#181818', border: '1px solid #282828', borderRadius: '12px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(255, 99, 132, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff6384' }}>
            <IoMusicalNotesOutline size={28} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#b3b3b3', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Bài hát phát nhiều nhất</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }} title={data.topTracks[0]?.title || 'N/A'}>
              {data.topTracks[0]?.title || 'Không rõ'}
            </div>
            {data.topTracks[0] && (
              <div style={{ fontSize: '12px', color: '#b3b3b3', marginTop: '2px' }}>{data.topTracks[0].count} lượt phát</div>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        {/* Chart 1: Top 5 Artists (Horizontal Bars) */}
        <div style={{ backgroundColor: '#181818', border: '1px solid #282828', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', margin: '0 0 20px 0' }}>Top 5 Nghệ sĩ yêu thích</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data.topArtists.map((artist, idx) => {
              const percentage = totalArtistListens > 0 ? (artist.count / totalArtistListens) * 100 : 0
              // Beautiful color palettes for ranking
              const colors = ['#1db954', '#1ed760', '#535353', '#3e3e3e', '#282828']
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#fff' }}>
                    <span style={{ fontWeight: idx === 0 ? 'bold' : 'normal' }}>
                      {idx + 1}. {artist.artist}
                    </span>
                    <span style={{ color: '#b3b3b3' }}>{artist.count} lượt nghe</span>
                  </div>
                  {/* Progress bar container */}
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#121212', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${percentage}%`, 
                      height: '100%', 
                      backgroundColor: colors[idx] || '#535353', 
                      borderRadius: '4px',
                      transition: 'width 0.8s ease-in-out'
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Chart 2: Top 5 Tracks (List View) */}
        <div style={{ backgroundColor: '#181818', border: '1px solid #282828', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', margin: '0 0 20px 0' }}>Top 5 Bài hát nghe nhiều nhất</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.topTracks.map((track, idx) => {
              const coverUrl = track.coverPath 
                ? `media://get-file?path=${encodeURIComponent(track.coverPath)}`
                : null
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '8px', borderRadius: '8px', backgroundColor: '#121212', border: '1px solid #282828' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#b3b3b3', width: '20px', textAlign: 'center' }}>
                    {idx + 1}
                  </div>
                  
                  {/* Cover image */}
                  <div style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#282828', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {coverUrl ? (
                      <img src={coverUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <IoMusicalNote size={18} style={{ color: '#b3b3b3' }} />
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {track.title}
                    </span>
                    <span style={{ fontSize: '12px', color: '#b3b3b3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {track.artist}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: '#1db954', fontWeight: 'bold', backgroundColor: 'rgba(29, 185, 84, 0.1)', padding: '4px 10px', borderRadius: '20px', flexShrink: 0 }}>
                    {track.count} lượt phát
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Full Width Chart: Listening Hours by Time of Day (Bar Chart) */}
      <div style={{ backgroundColor: '#181818', border: '1px solid #282828', borderRadius: '12px', padding: '24px', position: 'relative' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', margin: '0 0 8px 0' }}>Khung giờ nghe nhạc trong ngày</h3>
        <p style={{ color: '#b3b3b3', fontSize: '13px', margin: '0 0 24px 0' }}>Xem khung giờ nào bạn hay nghe nhạc nhất (Rê chuột vào cột để xem số lượt nghe cụ thể).</p>
        
        {/* SVG Container */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <svg viewBox="0 0 1000 300" style={{ width: '100%', height: '220px', overflow: 'visible' }}>
            {/* Grid Lines */}
            <line x1="40" y1="20" x2="980" y2="20" stroke="#282828" strokeDasharray="4 4" />
            <line x1="40" y1="120" x2="980" y2="120" stroke="#282828" strokeDasharray="4 4" />
            <line x1="40" y1="220" x2="980" y2="220" stroke="#282828" strokeDasharray="4 4" />
            <line x1="40" y1="250" x2="980" y2="250" stroke="#4d4d4d" strokeWidth="2" />

            {/* Render Bars */}
            {data.hourlyStats.map((item, idx) => {
              const x = 50 + idx * 38
              const barMaxHeight = 220
              const barHeight = (item.count / maxHourlyCount) * barMaxHeight
              const y = 250 - barHeight
              const isHovered = hoveredHour?.hour === item.hour

              return (
                <g key={idx}>
                  {/* Interactive invisible bar for easy hover */}
                  <rect 
                    x={x - 4} 
                    y="10" 
                    width="32" 
                    height="240" 
                    fill="transparent" 
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredHour(item)}
                    onMouseLeave={() => setHoveredHour(null)}
                  />
                  
                  {/* Main visible bar */}
                  <rect 
                    x={x} 
                    y={y} 
                    width="24" 
                    height={barHeight} 
                    fill={isHovered ? '#1db954' : 'rgba(29, 185, 84, 0.7)'} 
                    rx="4"
                    style={{ 
                      transition: 'all 0.2s ease',
                      filter: isHovered ? 'drop-shadow(0px 0px 8px rgba(29,185,84,0.5))' : 'none'
                    }}
                  />
                  
                  {/* X Axis Labels */}
                  {idx % 2 === 0 && (
                    <text 
                      x={x + 12} 
                      y="275" 
                      fill="#b3b3b3" 
                      fontSize="12" 
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {String(item.hour).padStart(2, '0')}h
                    </text>
                  )}
                </g>
              )
            })}
          </svg>

          {/* Simple Tooltip representation inside the component layout */}
          <div style={{ 
            height: '24px', 
            marginTop: '16px', 
            fontSize: '14px', 
            color: '#1db954', 
            fontWeight: 'bold', 
            visibility: hoveredHour ? 'visible' : 'hidden',
            transition: 'opacity 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <IoTimeOutline size={16} />
            <span>Khung giờ: {hoveredHour ? `${String(hoveredHour.hour).padStart(2, '0')}:00 - ${String((hoveredHour.hour + 1) % 24).padStart(2, '0')}:00` : ''} ➜ {hoveredHour?.count} lượt phát nhạc</span>
          </div>
        </div>
      </div>
    </div>
  )
}
