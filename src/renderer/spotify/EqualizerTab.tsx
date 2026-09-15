import React from 'react'
import { usePlayer } from '../player/use-player'
import { EqualizerGains } from '../player/player-context'

export default function EqualizerTab() {
  const { eqGains, setEqGain, speed, setSpeed, preservesPitch, setPreservesPitch } = usePlayer()

  const presets: Array<{ name: string; gains: EqualizerGains }> = [
    {
      name: 'Flat (Mặc định)',
      gains: { hz60: 0, hz230: 0, hz910: 0, hz4k: 0, hz14k: 0 }
    },
    {
      name: 'Bass Boost (Tăng Trầm)',
      gains: { hz60: 8, hz230: 4, hz910: 0, hz4k: 0, hz14k: 0 }
    },
    {
      name: 'Vocal Boost (Giọng Hát)',
      gains: { hz60: -2, hz230: 0, hz910: 7, hz4k: 5, hz14k: 1 }
    },
    {
      name: 'Treble Boost (Tăng Treble)',
      gains: { hz60: -3, hz230: -1, hz910: 1, hz4k: 5, hz14k: 8 }
    },
    {
      name: 'Electronic (Điện tử)',
      gains: { hz60: 7, hz230: 3, hz910: -2, hz4k: 4, hz14k: 6 }
    }
  ]

  const handleApplyPreset = (gains: EqualizerGains) => {
    setEqGain('hz60', gains.hz60)
    setEqGain('hz230', gains.hz230)
    setEqGain('hz910', gains.hz910)
    setEqGain('hz4k', gains.hz4k)
    setEqGain('hz14k', gains.hz14k)
  }

  const bands: Array<{ id: keyof EqualizerGains; label: string; freq: string }> = [
    { id: 'hz60', label: 'Trầm (Bass)', freq: '60 Hz' },
    { id: 'hz230', label: 'Ấm (Low-Mid)', freq: '230 Hz' },
    { id: 'hz910', label: 'Lời (Mid)', freq: '910 Hz' },
    { id: 'hz4k', label: 'Bổng (Treble)', freq: '4 kHz' },
    { id: 'hz14k', label: 'Sáng (Presence)', freq: '14 kHz' }
  ]

  return (
    <div className="tab-view equalizer-view">
      <div className="tab-header-row">
        <div>
          <h2 className="tab-title">Bộ chỉnh âm (Equalizer)</h2>
          <div className="folder-path-display">Tinh chỉnh tần số âm thanh theo sở thích của bạn</div>
        </div>
      </div>

      {/* Preset Selectors */}
      <div className="eq-presets-container">
        <span className="eq-presets-label">Thiết lập sẵn (Presets):</span>
        <div className="eq-presets-list">
          {presets.map((preset, idx) => {
            // Check if current gains match preset
            const isMatch =
              eqGains.hz60 === preset.gains.hz60 &&
              eqGains.hz230 === preset.gains.hz230 &&
              eqGains.hz910 === preset.gains.hz910 &&
              eqGains.hz4k === preset.gains.hz4k &&
              eqGains.hz14k === preset.gains.hz14k

            return (
              <button
                key={idx}
                className={`eq-preset-btn ${isMatch ? 'active' : ''}`}
                onClick={() => handleApplyPreset(preset.gains)}
              >
                {preset.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* 5 Vertical Sliders */}
      <div className="eq-sliders-container">
        {bands.map((band) => {
          const val = eqGains[band.id]
          const percentage = ((val + 12) / 24) * 100

          return (
            <div key={band.id} className="eq-slider-card">
              <span className="eq-db-value">{val > 0 ? `+${val}` : val} dB</span>
              
              <div className="eq-vertical-track-container">
                <input
                  type="range"
                  className="eq-vertical-slider"
                  min={-12}
                  max={12}
                  step={1}
                  value={val}
                  onChange={(e) => setEqGain(band.id, parseInt(e.target.value, 10))}
                  style={{
                    '--slider-progress': `${percentage}%`
                  } as React.CSSProperties}
                />
              </div>

              <div className="eq-band-info">
                <span className="eq-band-freq">{band.freq}</span>
                <span className="eq-band-label">{band.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pitch & Speed Control Section */}
      <div style={{ backgroundColor: '#181818', border: '1px solid #282828', borderRadius: '8px', padding: '20px', marginTop: '24px', display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
        {/* Speed Slider - Balanced 1.0x at Center (50%) */}
        <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>Tốc độ phát (Speed):</span>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1db954', fontFamily: 'monospace' }}>{speed.toFixed(2)}x</span>
          </div>
          <input 
            type="range" 
            min={0} 
            max={100} 
            step={1} 
            value={speed <= 1.0 ? (speed - 0.5) * 100 : 50 + (speed - 1.0) * 50}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              const sp = v <= 50 ? 0.5 + (v / 50) * 0.5 : 1.0 + ((v - 50) / 50) * 1.0;
              setSpeed(parseFloat(sp.toFixed(2)));
            }}
            style={{ 
              width: '100%', 
              accentColor: '#1db954',
              cursor: 'pointer'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#b3b3b3' }}>
            <span>0.5x (Chậm)</span>
            <button 
              onClick={() => setSpeed(1.0)} 
              style={{ background: 'transparent', border: 'none', color: '#b3b3b3', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
            >
              Mặc định (1.0x)
            </button>
            <span>2.0x (Nhanh)</span>
          </div>
        </div>

        {/* Pitch Lock Switch */}
        <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', display: 'block' }}>Khóa tông giọng (Keep Pitch):</span>
              <span style={{ fontSize: '11px', color: '#b3b3b3' }}>
                {preservesPitch 
                  ? "Giữ nguyên tông giọng ban đầu khi tăng/giảm tốc độ" 
                  : "Méo giọng theo tốc độ (Tự động Nightcore / Slowed & Reverb)"}
              </span>
            </div>
            {/* Toggle switch */}
            <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px', cursor: 'pointer', flexShrink: 0 }}>
              <input 
                type="checkbox" 
                checked={preservesPitch}
                onChange={(e) => setPreservesPitch(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{ 
                position: 'absolute', 
                top: 0, left: 0, right: 0, bottom: 0, 
                backgroundColor: preservesPitch ? '#1db954' : '#282828', 
                borderRadius: '24px', 
                transition: '0.3s' 
              }}>
                <span style={{ 
                  position: 'absolute', 
                  content: '""', 
                  height: '18px', width: '18px', 
                  left: preservesPitch ? '26px' : '4px', 
                  bottom: '3px', 
                  backgroundColor: '#fff', 
                  borderRadius: '50%', 
                  transition: '0.3s' 
                }} />
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
