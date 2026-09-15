import React, { useState, useEffect, useRef } from 'react'
import { WeaponWithSkins, WeaponSkin, SkinChroma } from '../../shared/valorant-skin-types'
import { 
  IoChevronBack, 
  IoChevronForward, 
  IoPlayCircleOutline, 
  IoClose,
  IoSparklesOutline
} from 'react-icons/io5'

export default function ValorantCollectionView() {
  const [weapons, setWeapons] = useState<WeaponWithSkins[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedWeaponUuid, setSelectedWeaponUuid] = useState<string>('');
  const [activeSkinIdx, setActiveSkinIdx] = useState<number>(0);
  const [activeChromaIdx, setActiveChromaIdx] = useState<number>(0);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  const carouselRef = useRef<HTMLDivElement>(null);
  const weaponPillsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchWeaponsAndSkins();
  }, []);

  const fetchWeaponsAndSkins = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://valorant-api.com/v1/weapons');
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        // Filter and organize weapons that have skins with valid icons
        const parsedWeapons: WeaponWithSkins[] = json.data.map((w: any) => {
          const validSkins: WeaponSkin[] = (w.skins || []).filter((s: any) => {
            // Exclude test / random dummy skins with no icon
            return s.displayIcon && !s.displayName.includes('Standard') && !s.displayName.includes('Random');
          });

          // Also include the standard skin at the beginning if available
          const standardSkin = (w.skins || []).find((s: any) => s.displayName.includes('Standard'));
          if (standardSkin && standardSkin.displayIcon) {
            validSkins.unshift(standardSkin);
          }

          return {
            uuid: w.uuid,
            displayName: w.displayName,
            category: w.shopData?.categoryText || w.category?.replace('EEquippableCategory::', '') || 'Weapon',
            displayIcon: w.displayIcon,
            skins: validSkins
          };
        });

        setWeapons(parsedWeapons);

        // Default to Vandal if present, else first weapon
        const defaultWeapon = parsedWeapons.find(w => w.displayName.toLowerCase() === 'vandal') || parsedWeapons[0];
        if (defaultWeapon) {
          setSelectedWeaponUuid(defaultWeapon.uuid);
        }
      }
    } catch (err) {
      console.error('Failed to fetch weapons for collection:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentWeapon = weapons.find(w => w.uuid === selectedWeaponUuid) || weapons[0] || null;
  const currentSkins = currentWeapon?.skins || [];
  // Enable mouse wheel up/down to scroll horizontally on carousel and weapon pills
  useEffect(() => {
    const track = carouselRef.current;
    if (!track) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        track.scrollBy({ left: e.deltaY, behavior: 'auto' });
      }
    };

    track.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      track.removeEventListener('wheel', handleWheel);
    };
  }, [currentSkins]);

  useEffect(() => {
    const pills = weaponPillsRef.current;
    if (!pills) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        pills.scrollBy({ left: e.deltaY, behavior: 'auto' });
      }
    };

    pills.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      pills.removeEventListener('wheel', handleWheel);
    };
  }, [weapons]);



  const activeSkin: WeaponSkin | null = currentSkins[activeSkinIdx] || currentSkins[0] || null;

  // Active chroma or fallback to base skin
  const activeChromas = activeSkin?.chromas || [];
  const activeChroma: SkinChroma | null = activeChromas[activeChromaIdx] || activeChromas[0] || null;

  // Handle switching weapon
  const handleSelectWeapon = (uuid: string) => {
    setSelectedWeaponUuid(uuid);
    setActiveSkinIdx(0);
    setActiveChromaIdx(0);
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  // Handle selecting a skin card
  const handleSelectSkin = (idx: number) => {
    setActiveSkinIdx(idx);
    setActiveChromaIdx(0);

    // Center the card in the carousel track
    if (carouselRef.current) {
      const cards = carouselRef.current.querySelectorAll('.val-skin-carousel-card');
      if (cards[idx]) {
        cards[idx].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  };

  // Scroll carousel left / right
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 360;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Image source for giant hero gun
  const heroGunImg = 
    activeChroma?.fullRender || 
    activeChroma?.displayIcon || 
    activeSkin?.displayIcon || 
    currentWeapon?.displayIcon;

  // Find finisher or video level if available
  const finisherLevel = activeSkin?.levels?.find(l => l.streamedVideo);

  return (
    <div className="val-collection-container">
      {/* Background Ambience */}
      <div className="val-collection-bg-grid" />
      <div className="val-collection-spotlight" />

      {/* Top Header & Weapon Switcher Bar */}
      <div className="val-collection-top-bar">
        <div className="val-collection-brand">
          <div className="val-blueprint-tag" style={{ color: '#00f0ff', borderColor: 'rgba(0, 240, 255, 0.4)' }}>
            ARSENAL // COLLECTION
          </div>
          <h2>COLLECTION</h2>
        </div>

        {/* Weapons Silhouette Icon Selector */}
        <div className="val-weapon-pills-scroll" ref={weaponPillsRef}>
          {weapons.map((w) => (
            <button
              key={w.uuid}
              type="button"
              className={`val-weapon-silhouette-btn ${selectedWeaponUuid === w.uuid ? 'active' : ''}`}
              onClick={() => handleSelectWeapon(w.uuid)}
              title={`${w.displayName} (${w.skins.length} skins)`}
            >
              <img 
                src={w.displayIcon} 
                alt={w.displayName} 
                className="val-weapon-silhouette-icon" 
              />
            </button>
          ))}
        </div>
      </div>

      {/* Main Center: Giant Hero Skin Showcase */}
      <div className="val-skin-hero-stage">
        {loading ? (
          <div className="val-wiki-loading">
            <div className="spinner" style={{ borderColor: 'rgba(0, 240, 255, 0.2)', borderTopColor: '#00f0ff' }}></div>
            <span>Đang nạp dữ liệu kho vũ khí...</span>
          </div>
        ) : activeSkin ? (
          <>
            {/* Skin Metadata Header */}
            <div className="val-skin-info-overlay">
              <div className="val-skin-weapon-tag">
                {currentWeapon?.displayName.toUpperCase()} // {currentWeapon?.category.toUpperCase()}
              </div>
              <h1 className="val-skin-hero-title">
                {activeChroma?.displayName && activeChroma.displayName !== activeSkin.displayName
                  ? activeChroma.displayName
                  : activeSkin.displayName}
              </h1>

              {/* Chroma Color Swatches (Biến thể màu sắc) */}
              {activeChromas.length > 1 && (
                <div className="val-chroma-swatches-row">
                  <span className="val-chroma-row-lbl">BIẾN THỂ MÀU:</span>
                  <div className="val-chroma-buttons-wrap">
                    {activeChromas.map((c, cIdx) => (
                      <button
                        key={c.uuid}
                        type="button"
                        className={`val-chroma-btn ${activeChromaIdx === cIdx ? 'active' : ''}`}
                        onClick={() => setActiveChromaIdx(cIdx)}
                        title={c.displayName}
                      >
                        {c.swatch ? (
                          <img src={c.swatch} alt="" className="val-chroma-swatch-img" />
                        ) : (
                          <div className="val-chroma-swatch-fallback" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Levels / Finisher Video Trigger */}
              {finisherLevel?.streamedVideo && (
                <button
                  type="button"
                  className="val-finisher-preview-btn"
                  onClick={() => setPreviewVideoUrl(finisherLevel.streamedVideo || null)}
                >
                  <IoPlayCircleOutline size={18} />
                  <span>XEM HIỆU ỨNG & KẾT LIỄU (FINISHER)</span>
                </button>
              )}
            </div>

            {/* Giant Center Gun Artwork */}
            <div className="val-skin-giant-wrap">
              <div className="val-skin-podium-pedestal" />
              {heroGunImg && (
                <img
                  src={heroGunImg}
                  alt={activeSkin.displayName}
                  className="val-skin-giant-img"
                />
              )}
            </div>
          </>
        ) : (
          <div className="val-wiki-empty">
            <span>Không có dữ liệu skin cho vũ khí này.</span>
          </div>
        )}
      </div>

      {/* Bottom Horizontal Skin Carousel (Thanh trượt ngang chọn skin chuẩn Valorant) */}
      <div className="val-skin-carousel-wrap">
        <button
          type="button"
          className="val-carousel-arrow-btn left"
          onClick={() => scrollCarousel('left')}
          title="Cuộn sang trái"
        >
          <IoChevronBack size={22} />
        </button>

        <div className="val-skin-carousel-track" ref={carouselRef}>
          {currentSkins.map((skin, idx) => {
            const isSelected = idx === activeSkinIdx;
            return (
              <div
                key={skin.uuid}
                className={`val-skin-carousel-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectSkin(idx)}
              >
                {/* Tactical Corner Accents */}
                <div className="val-carousel-corner-tl" />
                <div className="val-carousel-corner-br" />

                <div className="val-carousel-img-wrap">
                  {skin.displayIcon && (
                    <img
                      src={skin.displayIcon}
                      alt={skin.displayName}
                      className="val-carousel-card-img"
                    />
                  )}
                </div>

                <div className="val-carousel-card-title">
                  {skin.displayName}
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="val-carousel-arrow-btn right"
          onClick={() => scrollCarousel('right')}
          title="Cuộn sang phải"
        >
          <IoChevronForward size={22} />
        </button>
      </div>

      {/* Finisher Video Modal */}
      {previewVideoUrl && (
        <div className="val-video-modal-backdrop" onClick={() => setPreviewVideoUrl(null)}>
          <div className="val-video-modal" onClick={(e) => e.stopPropagation()}>
            <div className="val-video-modal-head">
              <div className="val-video-modal-title">
                <span>HIỆU ỨNG VŨ KHÍ // {activeSkin?.displayName.toUpperCase()}</span>
              </div>
              <button 
                type="button" 
                className="val-blueprint-close-btn"
                onClick={() => setPreviewVideoUrl(null)}
              >
                <IoClose size={20} />
              </button>
            </div>
            <div className="val-video-player-wrap">
              <video
                src={previewVideoUrl}
                controls
                autoPlay
                className="val-finisher-video"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
