import React, { useState } from 'react';
import { TftTrait } from '../../shared/tft-types';

interface Props {
  trait: TftTrait;
}

export const TftTraitBadge: React.FC<Props> = ({ trait }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!trait) return null;

  // Style class: 1 -> bronze, 3 -> silver, 4 -> gold, 5 -> prismatic
  const getStyleClass = (style: number) => {
    switch (style) {
      case 5:
        return 'style-prismatic';
      case 4:
        return 'style-gold';
      case 3:
        return 'style-silver';
      case 1:
      default:
        return 'style-bronze';
    }
  };

  const effectsList = Array.isArray(trait.effects) ? trait.effects : [];
  const unitsList = Array.isArray(trait.units) ? trait.units : [];

  return (
    <div 
      className={`tft-trait-badge-container ${getStyleClass(trait.style)}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="tft-trait-badge">
        {trait.iconUrl && (
          <img 
            src={trait.iconUrl} 
            alt={trait.name || 'Trait'} 
            className="tft-trait-badge-icon" 
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        )}
        <span className="tft-trait-badge-count">{trait.count || 1}</span>
      </div>

      {showTooltip && (
        <div className="tft-trait-tooltip" onClick={(e) => e.stopPropagation()}>
          <div className="tft-trait-tooltip-header">
            <span className="tft-trait-tooltip-title">{trait.count} {trait.name}</span>
          </div>

          {trait.innate && (
            <div className="tft-trait-tooltip-innate">
              <span className="tft-trait-innate-label">Innate: </span>
              {trait.innate}
            </div>
          )}

          {trait.description && (
            <div className="tft-trait-tooltip-desc">
              {trait.description}
            </div>
          )}

          {effectsList.length > 0 && (
            <div className="tft-trait-tooltip-effects">
              {effectsList.map((eff, idx) => {
                const isActive = eff.minUnits === trait.count;
                return (
                  <div 
                    key={idx} 
                    className={`tft-trait-tooltip-effect-row ${isActive ? 'active-breakpoint' : ''}`}
                  >
                    {eff.text}
                  </div>
                );
              })}
            </div>
          )}

          {unitsList.length > 0 && (
            <div className="tft-trait-tooltip-units-section">
              <span className="tft-trait-tooltip-units-label">Units:</span>
              <div className="tft-trait-tooltip-units-list">
                {unitsList.map((u) => (
                  <div key={u.id} className={`tft-trait-unit-avatar cost-${u.cost || 1}`} title={`${u.name} (${u.cost || 1}g)`}>
                    {u.iconUrl && (
                      <img 
                        src={u.iconUrl} 
                        alt={u.name}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TftTraitBadge;
