import React, { useState, useEffect } from 'react'
import { GdDemonLevel } from '../../shared/types'
import { 
  IoCloseOutline, 
  IoCopyOutline, 
  IoCheckmarkOutline, 
  IoFlame, 
  IoTrophyOutline,
  IoVideocamOutline,
  IoPersonOutline,
  IoShieldCheckmarkOutline
} from 'react-icons/io5'

interface DemonDetailModalProps {
  demon: GdDemonLevel;
  onClose: () => void;
}

export default function DemonDetailModal({ demon, onClose }: DemonDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadDetail() {
      try {
        setLoadingDetail(true);
        const data = await window.api.gd.getDemonDetail(demon.id);
        if (isMounted && data) {
          setDetailData(data);
        }
      } catch (err) {
        console.warn('Failed to load extra demon detail:', err);
      } finally {
        if (isMounted) setLoadingDetail(false);
      }
    }
    loadDetail();
    return () => { isMounted = false; };
  }, [demon.id]);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(String(demon.level_id));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Extract YouTube Video ID from detail verification video, video_url or thumbnail
  const extractVideoId = (): string | null => {
    const rawUrl = detailData?.verifications?.[0]?.video_url || demon.video_url;
    if (rawUrl) {
      const match = rawUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (match) return match[1];
    }
    if (demon.thumbnail) {
      const match = demon.thumbnail.match(/\/vi\/([\w-]{11})\//);
      if (match) return match[1];
    }
    return null;
  };

  const videoId = extractVideoId();
  const publisherName = detailData?.publisher?.global_name || detailData?.publisher?.username || demon.publisher;
  const verifierName = detailData?.verifications?.[0]?.submitted_by?.global_name || 
                       detailData?.verifications?.[0]?.submitted_by?.username || 
                       demon.verifier;
  const victorsList: any[] = detailData?.victors || [];

  return (
    <div className="gd-modal-backdrop" onClick={onClose}>
      <div className="gd-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="gd-modal-header">
          <h2>
            <span style={{ color: '#ff5e00', marginRight: '6px' }}>{demon.position}</span>
            <span>{demon.name}</span>
          </h2>
          <button className="gd-modal-close-btn" onClick={onClose}>
            <IoCloseOutline size={24} />
          </button>
        </div>

        <div className="gd-modal-content">
          {/* Video or Thumbnail */}
          {videoId ? (
            <div className="gd-video-container">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0`}
                title={`${demon.name} Verification Video`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : demon.thumbnail ? (
            <div className="gd-video-container">
              <img src={demon.thumbnail} alt={demon.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <div className="gd-video-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
              <IoVideocamOutline size={36} />
            </div>
          )}

          {/* Quick Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            <div style={{ background: '#222', padding: '10px 14px', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>LEVEL ID</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{demon.level_id}</span>
                <button 
                  onClick={handleCopyId}
                  title="Copy Level ID"
                  style={{ background: 'transparent', border: 'none', color: copied ? '#57f287' : '#aaa', cursor: 'pointer', display: 'flex', padding: 0 }}
                >
                  {copied ? <IoCheckmarkOutline size={16} /> : <IoCopyOutline size={16} />}
                </button>
              </div>
            </div>

            {demon.points !== undefined && (
              <div style={{ background: '#222', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>LIST POINTS</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#f1c40f', marginTop: '4px', display: 'block' }}>
                  {demon.points.toLocaleString()} pts
                </span>
              </div>
            )}

            {demon.gddl_tier && (
              <div style={{ background: '#222', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>GDDL TIER</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#ff7824', marginTop: '4px', display: 'block' }}>
                  Tier {demon.gddl_tier !== undefined && demon.gddl_tier !== null ? Math.round(demon.gddl_tier * 10) / 10 : '-'}
                </span>
              </div>
            )}

            {demon.status && (
              <div style={{ background: '#222', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>STATUS</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: demon.status === 'Legacy' ? '#ed4245' : '#57f287', marginTop: '4px', display: 'block' }}>
                  {demon.status === 'Legacy' ? 'Legacy List' : 'Main List'}
                </span>
              </div>
            )}
          </div>

          {/* Publisher & Verifier Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: '#202020', padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <IoPersonOutline size={20} color="#ff8c00" />
              <div>
                <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>ĐĂNG TẢI BỞI</span>
                <strong style={{ fontSize: '14px', color: '#fff' }}>{publisherName || 'Đang cập nhật...'}</strong>
              </div>
            </div>

            <div style={{ background: '#202020', padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <IoShieldCheckmarkOutline size={20} color="#5865f2" />
              <div>
                <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>VERIFIED BỞI</span>
                <strong style={{ fontSize: '14px', color: '#5865f2' }}>{verifierName || 'Đang cập nhật...'}</strong>
              </div>
            </div>
          </div>

          {/* Description / Lore */}
          {demon.description && (
            <div style={{ background: '#202020', padding: '14px 16px', borderRadius: '8px', borderLeft: '3px solid #ff5e00' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#ff5e00', display: 'block', marginBottom: '6px' }}>
                THÔNG TIN & CỐT TRUYỆN LEVEL
              </span>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: '#ddd' }}>
                {demon.description}
              </p>
            </div>
          )}

          {/* Gameplay Tags */}
          {demon.tags && demon.tags.length > 0 && (
            <div>
              <span style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '6px' }}>TAGS GAMEPLAY</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {demon.tags.map((tag) => (
                  <span key={tag} className="gd-tag-pill" style={{ padding: '4px 10px', fontSize: '11px' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Victors List (AREDL records) */}
          <div style={{ marginTop: '8px', borderTop: '1px solid #282828', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#f1c40f', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IoTrophyOutline size={16} />
                <span>DANH SÁCH VICTORS ({victorsList.length})</span>
              </span>
              {loadingDetail && <span style={{ fontSize: '11px', color: '#888' }}>Đang nạp victors...</span>}
            </div>

            {victorsList.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#777', margin: 0, fontStyle: 'italic' }}>
                {loadingDetail ? 'Đang tải danh sách...' : 'Chưa có kỷ lục victor nào được ghi nhận cho level này.'}
              </p>
            ) : (
              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px' }}>
                {victorsList.map((rec: any, idx: number) => {
                  const victorName = rec.submitted_by?.global_name || rec.submitted_by?.username || 'Unknown Victor';
                  return (
                    <div 
                      key={rec.id || idx}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        background: '#222', 
                        padding: '8px 12px', 
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#888', fontWeight: 600, fontSize: '11px', width: '20px' }}>#{idx + 1}</span>
                        <strong style={{ color: '#fff' }}>{victorName}</strong>
                        {rec.mobile && (
                          <span style={{ fontSize: '10px', background: '#333', color: '#aaa', padding: '1px 5px', borderRadius: '3px' }}>
                            Mobile
                          </span>
                        )}
                      </div>

                      {rec.video_url && (
                        <a 
                          href={rec.video_url} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ 
                            color: '#ff5e00', 
                            fontSize: '11px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            textDecoration: 'none',
                            background: 'rgba(255, 94, 0, 0.1)',
                            padding: '3px 8px',
                            borderRadius: '4px'
                          }}
                        >
                          <IoVideocamOutline size={14} />
                          <span>Xem Video</span>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
