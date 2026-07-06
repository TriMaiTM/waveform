import React, { useEffect, useRef } from 'react'
import { usePlayer } from '../player/use-player'

export default function Visualizer() {
  const { isPlaying, volume, analyser } = usePlayer()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number>(0)
  const heightsRef = useRef<number[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas high resolution for crisp rendering
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // fftSize is 512, which gives 256 frequency bins
    // We map these 256 bins onto 64 canvas bars using logarithmic scaling
    const barCount = 64
    // We allocate a buffer size matching the analyser bin count (256)
    const dataArray = new Uint8Array(256)

    if (heightsRef.current.length === 0) {
      heightsRef.current = Array(barCount).fill(4)
    }

    const render = () => {
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)

      // Make the bars narrower (0.55 width, 0.45 gap ratio) to create a sleeker visual
      const barWidth = (w / barCount) * 0.55
      const gap = (w / barCount) * 0.45

      // Get real audio frequency data if playing and analyser is connected
      if (isPlaying && analyser) {
        analyser.getByteFrequencyData(dataArray)
      } else {
        dataArray.fill(0)
      }

      // Draw custom visualizer gradient
      const gradient = ctx.createLinearGradient(0, h, 0, 0)
      gradient.addColorStop(0, '#1db954') // Spotify Green
      gradient.addColorStop(0.5, '#00d2ff') // Cyan
      gradient.addColorStop(1, '#8e44ad') // Purple/Violet

      ctx.fillStyle = gradient

      for (let i = 0; i < barCount; i++) {
        let targetHeight = 4

        if (isPlaying) {
          // 1. Logarithmic mapping: focus many more bars on lower frequencies (bass/kick)
          // i runs from 0 to 63. Pow index (1.7) stretches the bass bins over the left-most columns.
          const rawIndex = Math.pow(i / barCount, 1.7) * (dataArray.length - 1)
          const binIndex = Math.floor(rawIndex)
          
          // 2. Linear interpolation between adjacent frequency bins for ultra-smooth rendering
          const nextBinIndex = Math.min(binIndex + 1, dataArray.length - 1)
          const weight = rawIndex - binIndex
          const freqValue = dataArray[binIndex] * (1 - weight) + dataArray[nextBinIndex] * weight

          if (freqValue > 0) {
            // 3. Bass Boost: amplify the left columns (lower Hz) to make the kick drum extremely visible
            let boost = 1.0
            if (i < 18) {
              // Smoothly scale down boost from 2.2x at the leftmost column down to 1.0x at mid
              boost = 2.2 - (i / 18) * 1.2
            }
            
            const scale = 0.45 + volume * 0.55 // Scale peak height by volume
            targetHeight = (freqValue / 255) * (h - 4) * scale * 1.6 * boost
          } else {
            // Ambient motion if active but frequency is 0
            targetHeight = (Math.sin(Date.now() * 0.003 + i * 0.2) * 0.12 + 0.12) * (h - 20)
          }
        } else {
          // Slowly decay heights to static base when paused
          targetHeight = heightsRef.current[i] * 0.85
        }

        // Keep heights within bounds
        if (targetHeight > h - 4) targetHeight = h - 4
        if (targetHeight < 4) targetHeight = 4

        // Smooth height changes using interpolation (ease-out)
        heightsRef.current[i] += (targetHeight - heightsRef.current[i]) * 0.3

        const barHeight = heightsRef.current[i]
        const x = i * (barWidth + gap) + gap / 2
        const y = h - barHeight

        ctx.beginPath()
        ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0])
        ctx.fill()
      }

      animationRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationRef.current)
    }
  }, [isPlaying, volume, analyser])

  return (
    <div className="visualizer-container-wrapper" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div className="visualizer-container" style={{ width: '100%', height: '55px' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>
      {/* Studio-grade Frequency labels underneath the canvas bars */}
      <div className="visualizer-labels" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        padding: '0 8px', 
        fontSize: '10px', 
        color: 'rgba(255,255,255,0.4)', 
        fontFamily: 'monospace',
        letterSpacing: '0.5px'
      }}>
        <span>20Hz (Bass)</span>
        <span>60Hz (Kick)</span>
        <span>250Hz (Low-Mid)</span>
        <span>1kHz (Mid)</span>
        <span>4kHz (Treble)</span>
        <span>15kHz (Presence)</span>
      </div>
    </div>
  )
}
