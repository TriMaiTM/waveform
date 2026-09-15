import React, { useState, useEffect } from 'react'
import { ValorantWeapon } from '../../shared/valorant-wiki-types'
import ValorantMannequin from './ValorantMannequin'
import { IoClose, IoFlashOutline, IoShieldOutline, IoSearch } from 'react-icons/io5'

export default function ValorantWeaponsView() {
  const [weapons, setWeapons] = useState<ValorantWeapon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeWeapon, setActiveWeapon] = useState<ValorantWeapon | null>(null);
  const [selectedRangeIdx, setSelectedRangeIdx] = useState<number>(0);

  useEffect(() => {
    fetchWeapons();
  }, []);

  const fetchWeapons = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://valorant-api.com/v1/weapons');
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        // Sort weapons logically by shop order or cost
        const sorted = (json.data as ValorantWeapon[]).sort((a, b) => {
          const costA = a.shopData?.cost || 0;
          const costB = b.shopData?.cost || 0;
          return costA - costB;
        });
        setWeapons(sorted);
      }
    } catch (err) {
      console.error('Failed to fetch Valorant weapons:', err);
    } finally {
      setLoading(false);
    }
  };

  // Extract clean category
  const getCategoryLabel = (w: ValorantWeapon): string => {
    if (w.shopData?.categoryText) return w.shopData.categoryText;
    if (w.category) {
      return w.category.replace('EEquippableCategory::', '');
    }
    return 'Melee';
  };

  // Category definition with representative gun silhouettes
  const CATEGORY_TABS = [
    { id: 'all', label: 'TẤT CẢ VŨ KHÍ', repGun: null },
    { id: 'sidearm', label: 'SÚNG LỤC (SIDEARMS)', repGun: 'Classic' },
    { id: 'smg', label: 'TIỂU LIÊN (SMG)', repGun: 'Spectre' },
    { id: 'shotgun', label: 'SHOTGUN', repGun: 'Judge' },
    { id: 'rifle', label: 'SÚNG TRƯỜNG (RIFLE)', repGun: 'Vandal' },
    { id: 'sniper', label: 'BẮN TỈA (SNIPER)', repGun: 'Operator' },
    { id: 'heavy', label: 'HẠNG NẶNG (HEAVY)', repGun: 'Odin' },
    { id: 'melee', label: 'CẬN CHIẾN (MELEE)', repGun: 'Melee' }
  ];

  const getRepGunIcon = (gunName: string | null) => {
    if (!gunName) return null;
    const found = weapons.find((w) => w.displayName.toLowerCase() === gunName.toLowerCase());
    return found ? found.displayIcon : null;
  };

  // Filter weapons
  const filteredWeapons = weapons.filter((w) => {
    const cat = getCategoryLabel(w).toLowerCase();
    const matchesCat = 
      selectedCategory === 'all' || 
      cat.includes(selectedCategory.toLowerCase()) ||
      (selectedCategory === 'sidearm' && (cat.includes('pistol') || cat.includes('sidearm'))) ||
      (selectedCategory === 'rifle' && (cat.includes('rifle') || cat.includes('assault'))) ||
      (selectedCategory === 'heavy' && cat.includes('heavy'));
    
    const matchesSearch = !searchQuery || w.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleOpenWeapon = (w: ValorantWeapon) => {
    setActiveWeapon(w);
    setSelectedRangeIdx(0);
  };

  const handleCloseModal = () => {
    setActiveWeapon(null);
  };

  // Current active weapon's damage ranges
  const activeDamageRanges = activeWeapon?.weaponStats?.damageRanges || [];
  const currentRange = activeDamageRanges[selectedRangeIdx] || activeDamageRanges[0] || null;

  return (
    <div className="val-wiki-container val-blueprint-theme">
      {/* Blueprint Grid Background */}
      <div className="val-blueprint-bg" />

      {/* Top Bar / Header */}
      <div className="val-wiki-header">
        <div className="val-wiki-header-title">
          <div className="val-blueprint-tag">ARSENAL SPECIFICATION</div>
          <h2>WEAPON</h2>
        </div>
      </div>

      {/* Category Silhouette Filter Tabs */}
      <div className="val-blueprint-tabs">
        {CATEGORY_TABS.map((tab) => {
          const iconUrl = getRepGunIcon(tab.repGun);
          return (
            <button
              key={tab.id}
              type="button"
              className={`val-blueprint-silhouette-tab-btn ${selectedCategory === tab.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(tab.id)}
              title={tab.label}
            >
              {tab.id === 'all' || !iconUrl ? (
                <span className="val-all-weapons-tag">ALL</span>
              ) : (
                <img
                  src={iconUrl}
                  alt={tab.label}
                  className="val-tab-silhouette-icon"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Weapons Blueprint Grid */}
      <div className="val-blueprint-scroll-area">
        {loading ? (
          <div className="val-wiki-loading">
            <div className="spinner" style={{ borderColor: 'rgba(0, 240, 255, 0.2)', borderTopColor: '#00f0ff' }}></div>
            <span>Đang tải thông số Blueprint từ kho vũ khí...</span>
          </div>
        ) : filteredWeapons.length === 0 ? (
          <div className="val-wiki-empty">
            <span>Không tìm thấy vũ khí nào phù hợp với bộ lọc.</span>
          </div>
        ) : (
          <div className="val-blueprint-grid">
            {filteredWeapons.map((w) => {
              const ranges = w.weaponStats?.damageRanges || [];
              const baseRange = ranges[0];
              const cost = w.shopData?.cost !== undefined ? w.shopData.cost : 0;
              const catLabel = getCategoryLabel(w);

              return (
                <div
                  key={w.uuid}
                  className="val-blueprint-card"
                  onClick={() => handleOpenWeapon(w)}
                >
                  {/* Technical Blueprint Corner Decors */}
                  <div className="val-blueprint-corner-tl" />
                  <div className="val-blueprint-corner-br" />

                  {/* Header: Name & Cost */}
                  <div className="val-blueprint-card-head">
                    <div>
                      <div className="val-blueprint-card-name">{w.displayName}</div>
                      <div className="val-blueprint-card-cat">{catLabel.toUpperCase()}</div>
                    </div>
                    <div className="val-blueprint-card-cost">
                      {cost > 0 ? (
                        <>
                          <span className="val-cred-sym">¤</span>
                          <span>{cost.toLocaleString()}</span>
                        </>
                      ) : (
                        <span className="val-cred-free">MIỄN PHÍ</span>
                      )}
                    </div>
                  </div>

                  {/* Gun Silhouette Visual */}
                  <div className="val-blueprint-card-visual">
                    <img
                      src={w.displayIcon}
                      alt={w.displayName}
                      className="val-blueprint-gun-img"
                    />
                  </div>

                  {/* Footer Damage Indicator (Head / Body / Leg) */}
                  {baseRange ? (
                    <div className="val-blueprint-card-dmg-bar">
                      <div className="val-blueprint-dmg-unit">
                        <span className="dmg-lbl">ĐẦU</span>
                        <span className="dmg-val head">{Math.round(baseRange.headDamage)}</span>
                      </div>
                      <div className="val-blueprint-dmg-unit">
                        <span className="dmg-lbl">THÂN</span>
                        <span className="dmg-val body">{Math.round(baseRange.bodyDamage)}</span>
                      </div>
                      <div className="val-blueprint-dmg-unit">
                        <span className="dmg-lbl">CHÂN</span>
                        <span className="dmg-val legs">{Math.round(baseRange.legDamage)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="val-blueprint-card-dmg-bar melee">
                      <span>VŨ KHÍ CẬN CHIẾN</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Weapon Blueprint Inspection Modal (With SVG Mannequin Target Dummy) */}
      {activeWeapon && (
        <div className="val-blueprint-modal-backdrop" onClick={handleCloseModal}>
          <div 
            className="val-blueprint-modal" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="val-blueprint-modal-head">
              <div className="val-modal-head-left">
                <div className="val-blueprint-tech-code">BLUEPRINT // SPEC-0{activeWeapon.displayName.toUpperCase()}</div>
                <h3>{activeWeapon.displayName}</h3>
                <span className="val-modal-cat-badge">{getCategoryLabel(activeWeapon).toUpperCase()}</span>
              </div>

              <div className="val-modal-head-right">
                <div className="val-modal-cost-box">
                  <span className="val-modal-cost-lbl">GIÁ MUA</span>
                  <span className="val-modal-cost-val">
                    {activeWeapon.shopData?.cost ? `¤ ${activeWeapon.shopData.cost.toLocaleString()}` : 'MIỄN PHÍ'}
                  </span>
                </div>
                <button 
                  type="button" 
                  className="val-blueprint-close-btn"
                  onClick={handleCloseModal}
                  title="Đóng bản vẽ"
                >
                  <IoClose size={22} />
                </button>
              </div>
            </div>

            {/* Modal Body: Two Columns */}
            <div className="val-blueprint-modal-body">
              {/* Left Column: Gun Artwork & Specs Table */}
              <div className="val-blueprint-modal-left">
                <div className="val-blueprint-inspect-hero">
                  <div className="val-blueprint-grid-accent" />
                  <img
                    src={activeWeapon.displayIcon}
                    alt={activeWeapon.displayName}
                    className="val-blueprint-inspect-img"
                  />
                </div>

                {/* Gun Technical Specs Table */}
                {activeWeapon.weaponStats ? (
                  <div className="val-blueprint-specs-table">
                    <div className="val-spec-row">
                      <span className="val-spec-name">CỠ BĂNG ĐẠN (MAGAZINE)</span>
                      <span className="val-spec-val">{activeWeapon.weaponStats.magazineSize} viên</span>
                    </div>
                    <div className="val-spec-row">
                      <span className="val-spec-name">TỐC ĐỘ BẮN (FIRE RATE)</span>
                      <span className="val-spec-val">{activeWeapon.weaponStats.fireRate} viên/giây</span>
                    </div>
                    <div className="val-spec-row">
                      <span className="val-spec-name">THỜI GIAN NẠP ĐẠN (RELOAD)</span>
                      <span className="val-spec-val">{activeWeapon.weaponStats.reloadTimeSeconds} giây</span>
                    </div>
                    <div className="val-spec-row">
                      <span className="val-spec-name">THỜI GIAN RÚT SÚNG (EQUIP)</span>
                      <span className="val-spec-val">{activeWeapon.weaponStats.equipTimeSeconds} giây</span>
                    </div>
                    <div className="val-spec-row">
                      <span className="val-spec-name">ĐỘ CHÍNH XÁC VIÊN ĐẦU</span>
                      <span className="val-spec-val">{(activeWeapon.weaponStats.firstBulletAccuracy * 100).toFixed(1)}%</span>
                    </div>
                    <div className="val-spec-row">
                      <span className="val-spec-name">ĐỘ XUYÊN TƯỜNG (PENETRATION)</span>
                      <span className="val-spec-val highlight">
                        {activeWeapon.weaponStats.wallPenetration.replace('EWallPenetrationDisplayType::', '')}
                      </span>
                    </div>
                    <div className="val-spec-row">
                      <span className="val-spec-name">TỐC ĐỘ DI CHUYỂN CẦM SÚNG</span>
                      <span className="val-spec-val">
                        {Math.round(activeWeapon.weaponStats.runSpeedMultiplier * 100)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="val-spec-melee-note">
                    Vũ khí cận chiến dùng để tấn công cận cảnh với sát thương đâm chém chuẩn xác.
                  </div>
                )}
              </div>

              {/* Right Column: Mannequin Target Dummy & Range Selector */}
              <div className="val-blueprint-modal-right">
                <div className="val-mannequin-panel-header">
                  <div className="val-mannequin-title">MÔ HÌNH ĐO SÁT THƯƠNG (TARGET DUMMY)</div>
                  <div className="val-mannequin-sub">Sát thương bắn trúng vào từng bộ phận cơ thể theo cự ly</div>
                </div>

                {/* Range Selector Buttons */}
                {activeDamageRanges.length > 0 ? (
                  <>
                    <div className="val-range-selector">
                      {activeDamageRanges.map((r, idx) => {
                        const label = `${r.rangeStartMeters}m - ${r.rangeEndMeters}m`;
                        return (
                          <button
                            key={idx}
                            type="button"
                            className={`val-range-btn ${selectedRangeIdx === idx ? 'active' : ''}`}
                            onClick={() => setSelectedRangeIdx(idx)}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    {/* SVG Mannequin Target */}
                    {currentRange && (
                      <ValorantMannequin
                        headDamage={currentRange.headDamage}
                        bodyDamage={currentRange.bodyDamage}
                        legDamage={currentRange.legDamage}
                        rangeText={`${currentRange.rangeStartMeters}m - ${currentRange.rangeEndMeters}m`}
                      />
                    )}
                  </>
                ) : (
                  <div className="val-no-range-dummy">
                    <ValorantMannequin
                      headDamage={50}
                      bodyDamage={50}
                      legDamage={50}
                      rangeText="Cận cảnh (0m)"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
