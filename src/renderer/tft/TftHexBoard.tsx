import React from 'react'
import { TftUnit, TftPosition } from '../../shared/tft-types'

interface TftHexBoardProps {
  positioning: Record<string, TftPosition[]>;
  compUnits: TftUnit[];
}

const COST_COLORS: Record<number, string> = {
  1: '#8e929b', // 1 vàng - Xám bạc
  2: '#22c55e', // 2 vàng - Xanh lá
  3: '#0ea5e9', // 3 vàng - Xanh biển
  4: '#c084fc', // 4 vàng - Tím
  5: '#eab308'  // 5 vàng - Vàng kim
}

export default function TftHexBoard({ positioning, compUnits = [] }: TftHexBoardProps) {
  // Chỉ xếp duy nhất các tướng thuộc compUnits
  const boardCells: Record<string, TftUnit> = {}
  const occupiedCells = new Set<string>()

  // Sort units to give carry/high-cost units their preferred spot first
  const sortedCompUnits = [...compUnits].sort((a, b) => {
    const aItems = a.items?.length || 0
    const bItems = b.items?.length || 0
    if (aItems !== bItems) return bItems - aItems
    return (b.cost || 1) - (a.cost || 1)
  })

  for (const unit of sortedCompUnits) {
    if (!unit) continue
    const posList = positioning[unit.name] || positioning[unit.id] || []
    let placed = false

    for (const p of posList) {
      if (p.cell && !occupiedCells.has(p.cell)) {
        boardCells[p.cell] = unit
        occupiedCells.add(p.cell)
        placed = true
        break
      }
    }

    if (!placed) {
      for (let i = 1; i <= 28; i++) {
        const cellId = `cell_${i}`
        if (!occupiedCells.has(cellId)) {
          boardCells[cellId] = unit
          occupiedCells.add(cellId)
          break
        }
      }
    }
  }

  // Geometry:
  // R = Grid center distance radius
  // R_draw = Hexagon drawing radius (smaller by ~3.5px to create clean gap/padding between all hex edges)
  const R = 38
  const R_draw = 34.5
  const W = R * Math.sqrt(3) // ~65.82px
  const H = R * 2 // 76px
  const paddingX = 28
  const paddingY = 20
  const svgWidth = 7 * W + W / 2 + paddingX * 2 // ~550px
  const svgHeight = 3 * (H * 0.75) + H + paddingY * 2 // ~270px
  const imgSize = R_draw * 2.15 // Slightly larger to ensure full hexagonal coverage

  const hexPoints = (cx: number, cy: number, r: number): string => {
    const points: [number, number][] = [
      [cx, cy - r],
      [cx + (Math.sqrt(3) * r) / 2, cy - r / 2],
      [cx + (Math.sqrt(3) * r) / 2, cy + r / 2],
      [cx, cy + r],
      [cx - (Math.sqrt(3) * r) / 2, cy + r / 2],
      [cx - (Math.sqrt(3) * r) / 2, cy - r / 2]
    ]
    return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  }

  // 28 hex cells generated according to official MetaTFT coordinate mapping:
  // cellId = "cell_" + (28 - (row * 7 + 6 - col))
  // Row 0 (Top/Frontline): cell_22 .. cell_28
  // Row 1 (Mid-front): cell_15 .. cell_21 (offset W/2)
  // Row 2 (Mid-back): cell_8 .. cell_14
  // Row 3 (Bottom/Backline): cell_1 .. cell_7 (offset W/2)
  const hexCells = []
  for (let b = 0; b < 28; b++) {
    const row = Math.floor(b / 7)
    const col = b % 7
    const cellId = `cell_${28 - (row * 7 + 6 - col)}`
    const cx = (col + 0.5) * W + (row % 2) * (W / 2) + paddingX
    const cy = row * (H * 0.75) + H / 2 + paddingY
    const unit = boardCells[cellId]

    hexCells.push({
      cellId,
      cx,
      cy,
      unit
    })
  }

  return (
    <div className="tft-hex-container">
      <div className="tft-hex-header-info">
        <span>Gợi ý vị trí đặt tướng chuẩn TFT (Frontline ở trên, Backline ở dưới)</span>
      </div>

      <div className="tft-hex-svg-wrap">
        <svg 
          width={svgWidth} 
          height={svgHeight} 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="tft-hex-svg-board"
        >
          {/* Define ClipPath for each occupied cell so avatar is clipped perfectly to the pointy-topped hexagon */}
          <defs>
            {hexCells.map(({ cellId, cx, cy, unit }) => {
              if (!unit) return null
              return (
                <clipPath key={`clip-${cellId}`} id={`hex-clip-${cellId}`}>
                  <polygon points={hexPoints(cx, cy, R_draw)} />
                </clipPath>
              )
            })}
          </defs>

          {/* Render 28 hex cells with proper gaps and crystal clear avatars */}
          {hexCells.map(({ cellId, cx, cy, unit }) => {
            const points = hexPoints(cx, cy, R_draw)
            const costColor = unit ? (COST_COLORS[unit.cost || 1] || '#888') : '#232936'

            return (
              <g 
                key={cellId} 
                className={`tft-hex-node ${unit ? 'occupied' : 'empty'}`}
              >
                {/* 1. Base dark background hexagon */}
                <polygon
                  points={points}
                  fill={unit ? '#12151c' : '#161920'}
                />

                {/* 2. Champion Portrait Avatar (Sharply clipped, perfectly centered) */}
                {unit && unit.iconUrl && (
                  <image
                    href={unit.iconUrl}
                    x={cx - imgSize / 2}
                    y={cy - imgSize / 2}
                    width={imgSize}
                    height={imgSize}
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#hex-clip-${cellId})`}
                  />
                )}

                {/* 3. Pure Hexagonal Stroke Border on Top */}
                <polygon
                  points={points}
                  fill="none"
                  stroke={costColor}
                  strokeWidth={unit ? 2.5 : 1.5}
                  className="tft-hex-polygon"
                />

                {/* 4. Champion Name Label */}
                {unit && (
                  <text
                    x={cx}
                    y={cy + R_draw * 0.68}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="700"
                    className="tft-hex-svg-label"
                  >
                    {unit.name}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
