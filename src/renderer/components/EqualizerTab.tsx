import React from 'react'
import { usePlayer } from '../player/use-player'
import { EqualizerGains } from '../player/player-context'

export default function EqualizerTab() {
  const { eqGains, setEqGain } = usePlayer()

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
    </div>
  )
}
