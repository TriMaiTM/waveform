import React, { useState, useEffect } from 'react'
import { TftComp, TftCompDetail, TftCompUnit } from '../../shared/tft-types'
import TftHexBoard from './TftHexBoard'
import { 
  IoClose, 
  IoShieldOutline, 
  IoSparklesOutline, 
  IoGridOutline, 
  IoOptionsOutline, 
  IoFlashOutline, 
  IoRefreshOutline,
  IoChevronDownOutline
} from 'react-icons/io5'

interface TftCompDetailModalProps {
  comp: TftComp;
  onClose: () => void;
}

// Helper render a Champion Avatar with Cost Border & Name (used in Early & Options)
function UnitAvatarSlot({ unit, fallbackMap }: { unit: TftCompUnit | string; fallbackMap: Record<string, { cost: number; iconUrl: string }> }) {
  const isObj = typeof unit === 'object' && unit !== null
  const name = isObj ? unit.name : String(unit)
  const cost = isObj ? (unit.cost || 1) : (fallbackMap[name]?.cost || 1)
  const iconUrl = isObj ? unit.iconUrl : (fallbackMap[name]?.iconUrl || '')

  return (
    <div className="tft-modal-unit-slot" title={`${name} (${cost} vàng)`}>
      <div className={`tft-unit-img-wrap cost-${cost}`}>
        {iconUrl ? (
          <img 
            src={iconUrl} 
            alt={name} 
            className="tft-unit-img" 
            onError={(e) => { e.currentTarget.style.display = 'none' }} 
          />
        ) : (
          <div className="tft-unit-fallback">
            {name.slice(0, 2)}
          </div>
        )}
      </div>
      <span className="tft-modal-unit-name" title={name}>
        {name}
      </span>
    </div>
  )
}

export default function TftCompDetailModal({ comp, onClose }: TftCompDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'units' | 'options' | 'quickStart' | 'positioning' | 'augments'>('units')
  const [details, setDetails] = useState<TftCompDetail | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedLevels, setExpandedLevels] = useState<Record<string, boolean>>({})

  const compTitle = typeof comp?.name === 'string'
    ? comp.name
    : Array.isArray(comp?.name)
      ? (comp.name as any[]).map(x => (typeof x === 'object' && x?.name ? x.name : String(x))).join(' ')
      : typeof comp?.name === 'object' && (comp?.name as any)?.name
        ? String((comp.name as any).name)
        : 'Đội hình TFT'

  const tier = typeof comp?.tier === 'string' ? comp.tier : 'D'
  const levelling = typeof comp?.levelling === 'string' ? comp.levelling : 'Standard'
  const unitsList = Array.isArray(comp?.units) ? comp.units : []

  // Create fallback map for fast unit lookup
  const fallbackUnitMap: Record<string, { cost: number; iconUrl: string }> = {}
  for (const u of unitsList) {
    if (u && u.name) {
      fallbackUnitMap[u.name] = { cost: u.cost || 1, iconUrl: u.iconUrl || '' }
      fallbackUnitMap[u.id] = { cost: u.cost || 1, iconUrl: u.iconUrl || '' }
    }
  }

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    if (!window.api?.tft?.getCompDetails) {
      setError('API chi tiết đội hình không khả dụng.')
      setLoading(false)
      return
    }

    window.api.tft.getCompDetails(comp.clusterId)
      .then((data: TftCompDetail) => {
        if (isMounted) {
          setDetails(data)
          setLoading(false)
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          console.error('[CompDetail] Fetch failed:', err)
          setError(err.message || 'Không thể tải chi tiết đội hình')
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [comp.clusterId])

  const toggleExpandLevel = (lvl: string) => {
    setExpandedLevels(prev => ({ ...prev, [lvl]: !prev[lvl] }))
  }

  return (
    <div className="tft-modal-overlay" onClick={onClose}>
      <div className="tft-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header - Fixed */}
        <div className="tft-modal-header">
          <div className="tft-modal-header-title">
            <span className={`tft-tier-square tier-${tier.toLowerCase()}`}>
              {tier}
            </span>
            <span className="tft-modal-comp-name">{compTitle}</span>
            <span className="tft-tag-pill">
              {levelling}
            </span>
          </div>
          <button className="tft-btn-close" onClick={onClose} title="Đóng">
            <IoClose size={22} />
          </button>
        </div>

        {/* Navigation Tabs - Fixed */}
        <div className="tft-modal-tabs">
          <button 
            className={`tft-modal-tab-btn ${activeTab === 'units' ? 'active' : ''}`}
            onClick={() => setActiveTab('units')}
          >
            <IoShieldOutline size={15} />
            Tướng & Trang bị
          </button>
          <button 
            className={`tft-modal-tab-btn ${activeTab === 'options' ? 'active' : ''}`}
            onClick={() => setActiveTab('options')}
          >
            <IoOptionsOutline size={15} />
            Biến thể (Options)
          </button>
          <button 
            className={`tft-modal-tab-btn ${activeTab === 'quickStart' ? 'active' : ''}`}
            onClick={() => setActiveTab('quickStart')}
          >
            <IoFlashOutline size={15} />
            Khởi đầu (Early)
          </button>
          <button 
            className={`tft-modal-tab-btn ${activeTab === 'positioning' ? 'active' : ''}`}
            onClick={() => setActiveTab('positioning')}
          >
            <IoGridOutline size={15} />
            Xếp cờ (Positioning)
          </button>
          <button 
            className={`tft-modal-tab-btn ${activeTab === 'augments' ? 'active' : ''}`}
            onClick={() => setActiveTab('augments')}
          >
            <IoSparklesOutline size={15} />
            Lõi nâng cấp
          </button>
        </div>

        {/* Modal Body - Independent Scroll Container */}
        <div className="tft-modal-body">
          {loading && (
            <div className="tft-loading-state" style={{ minHeight: '300px' }}>
              <IoRefreshOutline size={36} className="tft-spin" />
              <p>Đang tải chi tiết đội hình từ MetaTFT...</p>
            </div>
          )}

          {error && !loading && (
            <div className="tft-error-banner" style={{ margin: '16px 0' }}>
              <span>⚠️ {error}</span>
            </div>
          )}

          {!loading && details && (
            <>
              {/* TAB 1: UNITS & ITEMS */}
              {activeTab === 'units' && (
                <div>
                  <h4 style={{ fontSize: '14px', color: '#fff', margin: '0 0 14px 0' }}>
                    Tướng và Trang Bị Khuyên Dùng
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                    {unitsList.map((unit) => {
                      const items = Array.isArray(unit.items) ? unit.items : []
                      return (
                        <div 
                          key={unit.id || unit.name}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px', 
                            backgroundColor: '#202020', 
                            border: '1px solid #2e2e2e',
                            borderRadius: '8px', 
                            padding: '10px 14px' 
                          }}
                        >
                          <div className={`tft-unit-img-wrap cost-${unit.cost || 1}`} style={{ width: '46px', height: '46px', flexShrink: 0 }}>
                            {unit.iconUrl ? (
                              <img src={unit.iconUrl} alt={unit.name} className="tft-unit-img" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#888' }}>
                                {unit.name?.slice(0, 2)}
                              </div>
                            )}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, color: '#fff', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{unit.name}</span>
                              <span style={{ fontSize: '11px', color: '#b3b3b3' }}>({unit.cost || 1}★)</span>
                            </div>

                            <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                              {items.length === 0 ? (
                                <span style={{ fontSize: '11px', color: '#666', fontStyle: 'italic' }}>Không đồ ưu tiên</span>
                              ) : (
                                items.map((item, i) => (
                                  <div 
                                    key={i} 
                                    style={{ 
                                      display: 'inline-flex', 
                                      alignItems: 'center', 
                                      gap: '4px', 
                                      backgroundColor: '#161616', 
                                      padding: '2px 6px', 
                                      borderRadius: '4px', 
                                      border: '1px solid #333',
                                      fontSize: '11px',
                                      color: '#eee'
                                    }}
                                  >
                                    {item.iconUrl && (
                                      <img src={item.iconUrl} alt={item.name} style={{ width: '16px', height: '16px', borderRadius: '2px', objectFit: 'cover' }} />
                                    )}
                                    <span>{item.name}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Top Items Table */}
                  {details.itemStats && details.itemStats.length > 0 && (
                    <div style={{ marginTop: '24px' }}>
                      <h4 style={{ fontSize: '14px', color: '#fff', marginBottom: '12px' }}>Hiệu quả trang bị trong đội hình</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                        {details.itemStats.slice(0, 8).map((item: any, idx: number) => (
                          <div key={idx} style={{ backgroundColor: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: '6px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {item.iconUrl && (
                              <img src={item.iconUrl} alt={item.itemName || item.name} style={{ width: '30px', height: '30px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }} />
                            )}
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontWeight: 600, color: '#fff', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.itemName || item.name}
                              </div>
                              <div style={{ fontSize: '11px', color: '#b3b3b3', marginTop: '3px' }}>
                                Avg Place: <span style={{ color: item.avg <= 4.25 ? '#1ed760' : '#fff', fontWeight: 600 }}>{item.avg?.toFixed(2)}</span>
                                {item.count ? <span style={{ color: '#777', marginLeft: '4px' }}>({item.count.toLocaleString()})</span> : null}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: OPTIONS (BIẾN THỂ) */}
              {activeTab === 'options' && (
                <div>
                  <div style={{ marginBottom: '16px', fontSize: '13px', color: '#b3b3b3' }}>
                    Các biến thể kẹp tướng tối ưu theo từng cấp độ (Level 7, 8, 9).
                  </div>

                  {!details.options || Object.keys(details.options).length === 0 ? (
                    <div style={{ color: '#888', fontStyle: 'italic', padding: '16px 0' }}>Chưa có đủ dữ liệu biến thể cho đội hình này.</div>
                  ) : (
                    Object.entries(details.options).map(([lvl, optList]) => {
                      const isExpanded = !!expandedLevels[lvl]
                      const displayList = isExpanded ? optList : optList.slice(0, 5)

                      return (
                        <div key={lvl} style={{ marginBottom: '24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #282828', paddingBottom: '6px' }}>
                            <h4 style={{ fontSize: '15px', color: '#1ed760', margin: 0 }}>
                              Biến thể Cấp {lvl}
                            </h4>
                            <span style={{ fontSize: '12px', color: '#888' }}>
                              Tổng {optList.length} đội hình mẫu
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {displayList.map((opt, i) => (
                              <div key={i} className="tft-sub-card">
                                <div className="tft-sub-card-header">
                                  <span style={{ color: '#fff', fontSize: '13px' }}>Form #{i + 1}</span>
                                  <span style={{ color: opt.avg <= 4.25 ? '#1ed760' : '#b3b3b3', fontSize: '12px' }}>
                                    Avg Place: <b>{opt.avg.toFixed(2)}</b> ({opt.count.toLocaleString()} trận)
                                  </span>
                                </div>
                                <div className="tft-modal-units-list">
                                  {opt.units.map((u, uIdx) => (
                                    <UnitAvatarSlot key={uIdx} unit={u} fallbackMap={fallbackUnitMap} />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          {optList.length > 5 && (
                            <button 
                              className="tft-btn-expand-more"
                              onClick={() => toggleExpandLevel(lvl)}
                            >
                              <span>{isExpanded ? 'Thu gọn' : `Xem thêm ${optList.length - 5} biến thể khác`}</span>
                              <IoChevronDownOutline style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </button>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {/* TAB 3: QUICK START (KHỞI ĐẦU) */}
              {activeTab === 'quickStart' && (
                <div>
                  <div style={{ marginBottom: '16px', fontSize: '13px', color: '#b3b3b3' }}>
                    Khởi đầu trận đấu (Level 4, 5, 6): Các bộ khung tướng giữ máu tốt nhất trước khi hoàn thiện form chính.
                  </div>

                  {!details.earlyOptions || Object.keys(details.earlyOptions).length === 0 ? (
                    <div style={{ color: '#888', fontStyle: 'italic', padding: '16px 0' }}>Chưa có dữ liệu khởi đầu cho đội hình này.</div>
                  ) : (
                    Object.entries(details.earlyOptions).map(([lvl, eList]) => (
                      <div key={lvl} style={{ marginBottom: '22px' }}>
                        <h4 style={{ fontSize: '15px', color: '#3b82f6', margin: '0 0 12px 0', borderBottom: '1px solid #282828', paddingBottom: '6px' }}>
                          Khung tướng Cấp {lvl}
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {eList.map((eOpt, i) => (
                            <div key={i} className="tft-sub-card">
                              <div className="tft-sub-card-header">
                                <span style={{ color: '#fff', fontSize: '13px' }}>Khung #{i + 1}</span>
                                <span style={{ color: '#1ed760', fontSize: '12px' }}>
                                  Tỉ lệ thắng: <b>{eOpt.win > 1 ? eOpt.win.toFixed(1) : (eOpt.win * 100).toFixed(1)}%</b> | Avg: <b>{eOpt.avg.toFixed(2)}</b> ({eOpt.count.toLocaleString()} trận)
                                </span>
                              </div>
                              <div className="tft-modal-units-list">
                                {eOpt.units.map((u, uIdx) => (
                                  <UnitAvatarSlot key={uIdx} unit={u} fallbackMap={fallbackUnitMap} />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: POSITIONING (XẾP CỜ BÀN CỜ HEX) */}
              {activeTab === 'positioning' && (
                <TftHexBoard positioning={details.positioning || {}} compUnits={unitsList} />
              )}

              {/* TAB 5: AUGMENTS (LÕI NÂNG CẤP) */}
              {activeTab === 'augments' && (
                <div>
                  <div style={{ marginBottom: '16px', fontSize: '13px', color: '#b3b3b3' }}>
                    Các Lõi Nâng Cấp (Augments) Tier S & Tier A tối ưu nhất trong Meta hiện tại:
                  </div>

                  {(!details.augments || details.augments.length === 0) ? (
                    <div style={{ color: '#888', fontStyle: 'italic', padding: '16px 0' }}>Chưa có dữ liệu lõi nâng cấp.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                      {details.augments.map((aug, i) => {
                        const isTierS = aug.tier === 'S'
                        return (
                          <div key={i} className="tft-augment-card">
                            <div className="tft-augment-header">
                              <div className="tft-augment-icon-wrap">
                                {aug.iconUrl ? (
                                  <img 
                                    src={aug.iconUrl} 
                                    alt={aug.name} 
                                    className="tft-augment-img"
                                    onError={(e) => { e.currentTarget.style.display = 'none' }} 
                                  />
                                ) : (
                                  <IoSparklesOutline color="#1ed760" size={20} />
                                )}
                              </div>
                              <div className="tft-augment-info">
                                <div className="tft-augment-title">
                                  <span>{aug.name}</span>
                                  {aug.tier && (
                                    <span className={`tft-augment-tier-badge tier-${aug.tier.toLowerCase()}`}>
                                      Tier {aug.tier}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {aug.desc && (
                              <div className="tft-augment-desc" title={aug.desc}>
                                {aug.desc}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
