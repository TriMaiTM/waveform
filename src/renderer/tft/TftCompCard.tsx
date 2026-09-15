import React from 'react'
import { TftComp } from '../../shared/tft-types'
import { IoChevronForward } from 'react-icons/io5'
import { TftTraitBadge } from './TftTraitBadge'

interface TftCompCardProps {
  comp: TftComp;
  onClick: () => void;
}

export default function TftCompCard({ comp, onClick }: TftCompCardProps) {
  if (!comp) return null;

  const tier = typeof comp.tier === 'string' ? comp.tier : 'D'
  const tierLower = tier.toLowerCase()
  const diffStr = typeof comp.difficulty === 'string' 
    ? comp.difficulty 
    : typeof comp.difficulty === 'number'
      ? (comp.difficulty < -0.05 ? 'Easy' : comp.difficulty > 0.05 ? 'Hard' : 'Medium')
      : 'Medium'
  const diffClass = `diff-${diffStr.toLowerCase()}`

  const avgPlacementText = typeof comp.avgPlacement === 'number' ? comp.avgPlacement.toFixed(2) : '4.50'
  const pickRateText = typeof comp.pickRate === 'number' ? comp.pickRate.toFixed(2) : '0.00'
  const winRateText = typeof comp.winRate === 'number' ? comp.winRate.toFixed(1) : '0.0'
  const top4RateText = typeof comp.top4Rate === 'number' ? comp.top4Rate.toFixed(1) : '0.0'

  const unitsList = Array.isArray(comp.units) ? comp.units : []
  const traitsList = Array.isArray(comp.traits) ? comp.traits : []

  const compTitle = typeof comp.name === 'string'
    ? comp.name
    : Array.isArray(comp.name)
      ? (comp.name as any[]).map(x => (typeof x === 'object' && x?.name ? x.name : String(x))).join(' ')
      : typeof comp.name === 'object' && (comp.name as any)?.name
        ? String((comp.name as any).name)
        : 'Đội hình TFT';

  // Find carry champion image for background artwork at head of card
  const carryUnit = unitsList.find(u => u.isCarry || (comp.carryUnitId && u.id === comp.carryUnitId))
    || unitsList.slice().sort((a, b) => (b.items?.length || 0) - (a.items?.length || 0))[0]
    || unitsList[0];
  // High-resolution splash artwork for comp banner (MetaTFT official 256x256 crop)
  const carrySplashFromId = carryUnit?.id
    ? `https://cdn.metatft.com/file/metatft/championsplashes/${carryUnit.id.toLowerCase()}.png`
    : '';
  const carryImgUrl = comp.carrySplashUrl || carryUnit?.splashUrl || carrySplashFromId || carryUnit?.iconUrl || '';

  return (
    <div 
      className={`tft-comp-card border-tier-${tierLower}`} 
      onClick={onClick}
      title="Nhấn để xem chi tiết biến thể, đồ chuẩn và cách xếp cờ"
    >
      {/* Background artwork of carry champion at head of comp card with smooth gradient fade */}
      {carryImgUrl && (
        <>
          <div 
            className="tft-card-carry-bg" 
            style={{ backgroundImage: `url(${carryImgUrl})` }} 
          />
          <div className="tft-card-carry-overlay" />
        </>
      )}

      {/* 1. Left Section: Big Tier Letter + Comp Name + Tags */}
      <div className="tft-card-left">
        {/* Big Tier Letter */}
        <div className={`tft-tier-big-letter tier-${tierLower}`}>
          {tier}
        </div>
        
        <div className="tft-comp-info-box">
          <div className="tft-comp-title" title={compTitle}>
            {compTitle}
          </div>
          <div className="tft-comp-tags">
            <span className="tft-tag-pill">
              {comp.levelling || 'Standard'}
            </span>
            <span className={`tft-tag-pill ${diffClass}`}>
              {diffStr}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Middle Section: Traits on Top (Badge only), Champions Below */}
      <div className="tft-card-center">
        {/* Traits Row */}
        {traitsList.length > 0 && (
          <div className="tft-traits-row" onClick={(e) => e.stopPropagation()}>
            {traitsList.map((trait) => (
              <TftTraitBadge key={trait.id || Math.random().toString()} trait={trait} />
            ))}
          </div>
        )}

        {/* Champions Row */}
        <div className="tft-units-row">
          {unitsList.map((unit) => {
            if (!unit) return null;
            const items = Array.isArray(unit.items) ? unit.items : [];

            return (
              <div key={unit.id || Math.random().toString()} className="tft-unit-slot">
                {/* 3 Stars indicator */}
                {unit.tier === 3 && (
                  <div className="tft-unit-stars">★★★</div>
                )}

                {/* Avatar Portrait with Cost Border */}
                <div className={`tft-unit-img-wrap cost-${unit.cost || 1}`} title={`${unit.name} (${unit.cost || 1} vàng)`}>
                  {unit.iconUrl ? (
                    <img 
                      src={unit.iconUrl} 
                      alt={unit.name || 'Unit'} 
                      className="tft-unit-img"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  ) : (
                    <div className="tft-unit-fallback">
                      {(unit.name || 'U').slice(0, 2)}
                    </div>
                  )}

                  {/* Items attached */}
                  {items.length > 0 && (
                    <div className="tft-avatar-items">
                      {items.map((item, idx) => (
                        <div key={idx} className="tft-avatar-item-icon" title={item?.name || 'Trang bị'}>
                          {item?.iconUrl ? (
                            <img 
                              src={item.iconUrl} 
                              alt={item?.name || 'Item'} 
                              onError={(e) => { e.currentTarget.style.display = 'none' }} 
                            />
                          ) : (
                            <span style={{ fontSize: '7px', color: '#1ed760' }}>●</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Champion Name Below Items */}
                <span className="tft-unit-name" title={unit.name}>
                  {unit.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Right Section: 4 Stat Columns */}
      <div className="tft-card-stats">
        <div className="tft-stat-column">
          <span className={`tft-stat-number ${comp.avgPlacement <= 4.25 ? 'avg-good' : ''}`}>
            {avgPlacementText}
          </span>
          <span className="tft-stat-label">Avg Place</span>
        </div>

        <div className="tft-stat-column">
          <span className="tft-stat-number">
            {pickRateText}
          </span>
          <span className="tft-stat-label">Pick Rate</span>
        </div>

        <div className="tft-stat-column">
          <span className="tft-stat-number">
            {winRateText}%
          </span>
          <span className="tft-stat-label">Win Rate</span>
        </div>

        <div className="tft-stat-column">
          <span className="tft-stat-number">
            {top4RateText}%
          </span>
          <span className="tft-stat-label">Top 4 Rate</span>
        </div>

        <IoChevronForward className="tft-card-arrow" />
      </div>
    </div>
  )
}
