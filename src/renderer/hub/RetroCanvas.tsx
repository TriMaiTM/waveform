import React, { useEffect, useRef, useState } from 'react'
import { usePlayer } from '../player/use-player'
import { 
  IoCheckmark, 
  IoCheckmarkCircle,
  IoLockClosedOutline,
  IoFlame,
  IoSettingsOutline,
  IoChevronUpOutline,
  IoChevronDownOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoColorPaletteOutline,
  IoImageOutline,
  IoTrashOutline, 
  IoPencilOutline, 
  IoCloseOutline,
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoDiamondOutline,
  IoTimeOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoRefreshOutline,
  IoFolderOpenOutline,
  IoAppsOutline,
  IoMusicalNotesOutline,
  IoPersonOutline,
  IoInformationCircleOutline,
  IoSparklesOutline,
  IoVolumeHighOutline,
  IoVolumeMuteOutline,
  IoCloudUploadOutline,
  IoCloudDownloadOutline,
  IoWarningOutline
} from 'react-icons/io5'
import { SiValorant } from 'react-icons/si'
import { 
  BEJEWELED_131_RANKS, 
  getBejeweledLevelBySeconds, 
  getNextBejeweledLevel, 
  GemAsset 
} from './bejeweled-data'
import { AppOrderItem, getStoredAppOrder, DEFAULT_APP_ORDER } from './HubSidebar'
import retroSakuraBg from '../../assets/retro-sakura-forest.jpg'
import spotifyLogo from '../../assets/spotify-logo.png'
import tftLogo from '../../assets/teamfight-tactics-logo.png'
import gdLogo from '../../assets/geometry-dash-logo.png'

interface NoteItem {
  id: string;
  text: string;
  completed: boolean;
}

const DEFAULT_NOTES: NoteItem[] = [
  { id: '1', text: 'Chơi playlist yêu thích trên Spotify', completed: true },
  { id: '2', text: 'Leo rank Valorant tối nay', completed: false },
  { id: '3', text: 'Xem thử bài comp ĐTCL mới', completed: false }
];

type ActiveDrawer = 'none' | 'notes' | 'calendar' | 'ranks';
type MasterSettingsTab = 'appearance' | 'apps' | 'clock' | 'sound' | 'profile' | 'about';

const WALLPAPER_PRESETS = [
  { 
    id: 'sakura', 
    name: 'Rừng Anh Đào Pixel', 
    desc: 'Phong cách 8-bit lãng mạn hoài niệm',
    preview: '#1a0d1b', 
    url: retroSakuraBg 
  },
  { 
    id: 'cyberpunk', 
    name: 'Thành Phố Cyberpunk', 
    desc: 'Ánh đèn Neon tương lai huyền ảo',
    preview: '#0f172a', 
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1920&auto=format&fit=crop' 
  },
  { 
    id: 'aurora', 
    name: 'Cực Quang Vũ Trụ', 
    desc: 'Bầu trời đêm & dải ngân hà kỳ diệu',
    preview: '#0a192f', 
    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=1920&auto=format&fit=crop' 
  },
  { 
    id: 'lofi', 
    name: 'Quán Cafe Mưa Lofi', 
    desc: 'Không gian ấm cúng thư thái',
    preview: '#1f1625', 
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1920&auto=format&fit=crop' 
  },
  { 
    id: 'obsidian', 
    name: 'Obsidian Studio', 
    desc: 'Tối giản sang trọng bí ẩn',
    preview: '#0a0a0c', 
    url: 'obsidian' 
  }
];

export default function RetroCanvas() {
  const { currentTrack, isPlaying } = usePlayer();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundNodeRef = useRef<AudioNode | null>(null);

  // Side drawers (Notes, Calendar, Ranks)
  const [activeDrawer, setActiveDrawer] = useState<ActiveDrawer>('none');

  // Master Settings Modal (Full dialog overlay)
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<MasterSettingsTab>('appearance');

  // Customization settings state
  const [bgType, setBgType] = useState<string>(() => localStorage.getItem('waveform_hub_bg_type') || 'sakura');
  const [customBgUrl, setCustomBgUrl] = useState<string>(() => localStorage.getItem('waveform_hub_custom_bg') || '');
  const [bgDim, setBgDim] = useState<number>(() => {
    const saved = localStorage.getItem('waveform_hub_bg_dim');
    return saved !== null ? parseInt(saved, 10) : 25;
  });
  const [bgBlur, setBgBlur] = useState<number>(() => {
    const saved = localStorage.getItem('waveform_hub_bg_blur');
    return saved !== null ? parseInt(saved, 10) : 0;
  });

  const [showPetals, setShowPetals] = useState<boolean>(() => localStorage.getItem('waveform_hub_show_petals') !== 'false');
  const [petalDensity, setPetalDensity] = useState<number>(() => {
    const saved = localStorage.getItem('waveform_hub_petal_density');
    return saved !== null ? parseInt(saved, 10) : 45;
  });
  const [showCRT, setShowCRT] = useState<boolean>(() => localStorage.getItem('waveform_hub_show_crt') !== 'false');

  const [clockFormat, setClockFormat] = useState<'24h' | '12h'>(() => (localStorage.getItem('waveform_hub_clock_format') as any) || '24h');
  const [showSeconds, setShowSeconds] = useState<boolean>(() => localStorage.getItem('waveform_hub_show_seconds') !== 'false');
  const [showDate, setShowDate] = useState<boolean>(() => localStorage.getItem('waveform_hub_show_date') !== 'false');
  const [clockFont, setClockFont] = useState<string>(() => localStorage.getItem('waveform_hub_clock_font') || 'vt323');
  const [customGreeting, setCustomGreeting] = useState<string>(() => localStorage.getItem('waveform_hub_custom_greeting') || '');

  // Soundscape ambient audio
  const [ambientSound, setAmbientSound] = useState<string>(() => localStorage.getItem('waveform_hub_ambient_sound') || 'none');
  const [ambientVolume, setAmbientVolume] = useState<number>(() => {
    const saved = localStorage.getItem('waveform_hub_ambient_vol');
    return saved !== null ? parseInt(saved, 10) : 30;
  });
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(() => localStorage.getItem('waveform_hub_sfx_enabled') !== 'false');

  // App order state
  const [appOrder, setAppOrder] = useState<AppOrderItem[]>(getStoredAppOrder);
  const [defaultApp, setDefaultApp] = useState<string>(() => localStorage.getItem('waveform_default_app') || 'hub');

  // Greeting & Clock State
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [greeting, setGreeting] = useState<string>('Good afternoon');

  // User Name State
  const [userName, setUserName] = useState<string>(() => localStorage.getItem('waveform_retro_username') || 'Trí');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>('');

  // XP / Usage seconds
  const [totalSeconds, setTotalSeconds] = useState<number>(() => {
    const saved = localStorage.getItem('waveform_retro_total_seconds');
    return saved ? parseInt(saved, 10) : 4460;
  });

  // Notes state
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    const saved = localStorage.getItem('waveform_retro_notes');
    return saved ? JSON.parse(saved) : DEFAULT_NOTES;
  });
  const [newNoteText, setNewNoteText] = useState<string>('');

  // Calendar State
  const [calDate, setCalDate] = useState<Date>(new Date());

  // Rank Search State
  const [rankSearch, setRankSearch] = useState<string>('');

  // Save notes
  useEffect(() => {
    localStorage.setItem('waveform_retro_notes', JSON.stringify(notes));
  }, [notes]);

  // Save seconds every 10s
  useEffect(() => {
    const id = setInterval(() => {
      localStorage.setItem('waveform_retro_total_seconds', String(totalSeconds));
    }, 10000);
    return () => clearInterval(id);
  }, [totalSeconds]);

  // Clock & Greeting Effect
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let h = now.getHours();
      let ampm = '';
      if (clockFormat === '12h') {
        ampm = h >= 12 ? ' PM' : ' AM';
        h = h % 12 || 12;
      }
      const hoursStr = String(h).padStart(2, '0');
      const minutesStr = String(now.getMinutes()).padStart(2, '0');
      const secondsStr = String(now.getSeconds()).padStart(2, '0');

      setTimeStr(showSeconds ? `${hoursStr}:${minutesStr}:${secondsStr}${ampm}` : `${hoursStr}:${minutesStr}${ampm}`);

      const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayName = dayNames[now.getDay()];
      const dayNum = String(now.getDate()).padStart(2, '0');
      const monthNum = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      setDateStr(`${dayName}, ${dayNum}/${monthNum}/${year}`);

      if (customGreeting.trim()) {
        setGreeting(customGreeting.trim());
      } else {
        const hourNum = now.getHours();
        if (hourNum >= 5 && hourNum < 12) setGreeting('Good morning');
        else if (hourNum >= 12 && hourNum < 18) setGreeting('Good afternoon');
        else if (hourNum >= 18 && hourNum < 22) setGreeting('Good evening');
        else setGreeting('Good night');
      }

      setTotalSeconds(prev => prev + 1);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [clockFormat, showSeconds, customGreeting]);

  // Falling Petals Canvas Animation
  useEffect(() => {
    if (!showPetals) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    const petals: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      angle: number;
      spin: number;
      color: string;
    }> = [];

    const colors = ['#57e78d', '#1ed760', '#a7f3d0', '#10b981', '#34d399', '#ffffff'];

    for (let i = 0; i < petalDensity; i++) {
      petals.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 4 + 2.5,
        speedX: Math.random() * 1.2 - 0.4,
        speedY: Math.random() * 1.1 + 0.5,
        angle: Math.random() * Math.PI * 2,
        spin: Math.random() * 0.03 - 0.015,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    const fireflies = Array.from({ length: 18 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2 + 1,
      alpha: Math.random(),
      speedAlpha: Math.random() * 0.02 + 0.01,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render Fireflies (Emerald Glow)
      fireflies.forEach(f => {
        f.x += f.vx;
        f.y += f.vy;
        f.alpha += f.speedAlpha;
        if (f.alpha > 1 || f.alpha < 0.1) f.speedAlpha = -f.speedAlpha;
        if (f.x < 0) f.x = width;
        if (f.x > width) f.x = 0;
        if (f.y < 0) f.y = height;
        if (f.y > height) f.y = 0;

        ctx.fillStyle = `rgba(30, 215, 96, ${Math.max(0, f.alpha)})`;
        ctx.shadowColor = '#1ed760';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Render Petals
      petals.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.angle += p.spin;

        if (p.y > height) {
          p.y = -10;
          p.x = Math.random() * width;
        }
        if (p.x > width) p.x = 0;
        if (p.x < 0) p.x = width;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.shadowColor = '#1ed760';
        ctx.shadowBlur = 4;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [showPetals, petalDensity]);

  // Ambient Web Audio Soundscape Generator
  useEffect(() => {
    if (ambientSound === 'none') {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      if (ambientSound === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.value = 850;
      } else if (ambientSound === 'wind') {
        filter.type = 'bandpass';
        filter.frequency.value = 450;
        filter.Q.value = 1.2;
      } else {
        filter.type = 'highpass';
        filter.frequency.value = 1200;
      }

      const gain = ctx.createGain();
      gain.gain.value = (ambientVolume / 100) * 0.12;

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start(0);
      soundNodeRef.current = whiteNoise;
    } catch (err) {
      console.warn('AudioContext initialization deferred', err);
    }

    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [ambientSound, ambientVolume]);

  // Handle local file selection for Custom Wallpaper
  const handleLocalImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCustomBgUrl(dataUrl);
        setBgType('custom');
        try {
          localStorage.setItem('waveform_hub_custom_bg', dataUrl);
          localStorage.setItem('waveform_hub_bg_type', 'custom');
        } catch (err) {
          console.warn('Image stored in-memory due to localStorage quota', err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // App order update helper
  const updateAppOrder = (newOrder: AppOrderItem[]) => {
    setAppOrder(newOrder);
    localStorage.setItem('waveform_hub_app_order', JSON.stringify(newOrder));
    window.dispatchEvent(new Event('waveform-hub-settings-updated'));
  };

  const moveApp = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...appOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    updateAppOrder(newOrder);
  };

  const toggleAppEnabled = (id: 'music' | 'tft' | 'gd' | 'valorant') => {
    const newOrder = appOrder.map(item => {
      if (item.id === id) return { ...item, enabled: !item.enabled };
      return item;
    });
    updateAppOrder(newOrder);
  };

  // Bejeweled Rank computations
  const currentRank = getBejeweledLevelBySeconds(totalSeconds);
  const nextRank = getNextBejeweledLevel(currentRank.level);
  const hoursUsed = Math.floor(totalSeconds / 3600);
  const minsUsed = Math.floor((totalSeconds % 3600) / 60);

  let xpPercent = 100;
  if (nextRank) {
    const prevReqSec = currentRank.minutesReq * 60;
    const nextReqSec = nextRank.minutesReq * 60;
    const span = nextReqSec - prevReqSec;
    const progress = totalSeconds - prevReqSec;
    xpPercent = Math.min(100, Math.max(0, Math.round((progress / span) * 100)));
  }

  // Handle Note Actions
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const newNote: NoteItem = {
      id: Date.now().toString(),
      text: newNoteText.trim(),
      completed: false
    };
    setNotes([newNote, ...notes]);
    setNewNoteText('');
  };

  const handleToggleNote = (id: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, completed: !n.completed } : n));
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  // Drawer Toggle
  const toggleDrawer = (drawer: ActiveDrawer) => {
    setActiveDrawer(prev => prev === drawer ? 'none' : drawer);
  };

  // Calendar Helpers
  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const monthNames = ['THÁNG 1', 'THÁNG 2', 'THÁNG 3', 'THÁNG 4', 'THÁNG 5', 'THÁNG 6', 'THÁNG 7', 'THÁNG 8', 'THÁNG 9', 'THÁNG 10', 'THÁNG 11', 'THÁNG 12'];
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  // Filtered Ranks
  const filteredRanks = BEJEWELED_131_RANKS.filter(r => 
    r.title.toLowerCase().includes(rankSearch.toLowerCase()) || 
    String(r.level).includes(rankSearch)
  );

  // Background display selection
  const getBgSrc = () => {
    if (bgType === 'custom' && customBgUrl) return customBgUrl;
    const found = WALLPAPER_PRESETS.find(p => p.id === bgType);
    return found ? found.url : retroSakuraBg;
  };

  const appMeta: Record<'music' | 'tft' | 'gd' | 'valorant', { name: string; icon: React.ReactNode }> = {
    music: { name: 'Spotify Music', icon: <img src={spotifyLogo} alt="Spotify" style={{ width: 24, height: 24, objectFit: 'contain' }} /> },
    tft: { name: 'Teamfight Tactics', icon: <img src={tftLogo} alt="TFT" style={{ width: 24, height: 24, objectFit: 'contain' }} /> },
    gd: { name: 'Demonlist (GD)', icon: <img src={gdLogo} alt="GD" style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 3 }} /> },
    valorant: { name: 'Valorant Tracker', icon: <SiValorant size={22} color="#ff4655" /> }
  };

  return (
    <div className="retro-hub-container">
      {/* Background artwork */}
      {getBgSrc() === 'obsidian' ? (
        <div className="retro-bg-obsidian" />
      ) : (
        <img 
          src={getBgSrc()} 
          alt="Hub Background Wallpaper" 
          className="retro-bg-art" 
          style={{ 
            filter: bgBlur > 0 ? `blur(${bgBlur}px)` : 'none',
            transform: bgBlur > 0 ? 'scale(1.04)' : 'none' 
          }}
        />
      )}

      {/* Dim / Darkness Overlay */}
      {bgDim > 0 && (
        <div 
          className="retro-bg-dim-overlay" 
          style={{ backgroundColor: `rgba(0, 0, 0, ${bgDim / 100})` }} 
        />
      )}

      {/* Falling Petals & Fireflies Canvas */}
      {showPetals && <canvas ref={canvasRef} className="retro-pixel-canvas" />}

      {/* CRT Scanline Overlay */}
      {showCRT && <div className="retro-crt-overlay" />}

      {/* Main Retro Content Layout */}
      <div className="retro-hub-content clean-layout">
        
        {/* =========================================================================
            TOP HEADER: METALLIC BEJEWELED BADGE & PROGRESS BAR (SPOTIFY GREEN)
            ========================================================================= */}
        <header className="retro-xp-header">
          {/* SPECIAL EVOLVING METALLIC BEJEWELED GEM BADGE */}
          <button 
            className={`bejeweled-metal-crest tier-${currentRank.tier}`}
            onClick={() => toggleDrawer('ranks')}
            title="Bấm để mở Bảng 131 cấp bậc Bejeweled"
          >
            <div className="crest-gem-socket">
              <GemAsset type={currentRank.gemType} size={24} className="crest-svg-gem" />
            </div>
            <div className="crest-info-col">
              <span className="crest-lvl-label">LEVEL</span>
              <span className="crest-lvl-num">{currentRank.level}</span>
            </div>
          </button>

          {/* XP PROGRESS BAR & RANK TITLE */}
          <div className="retro-xp-center">
            <div className="retro-xp-info-row">
              <div 
                className="retro-rank-title-wrap cursor-pointer"
                onClick={() => toggleDrawer('ranks')}
                title="Bấm xem bảng cấp bậc"
              >
                <span className={`retro-rank-title tier-text-${currentRank.tier}`}>
                  [{currentRank.title.toUpperCase()}]
                </span>
                <span className="retro-rank-time">
                  <IoTimeOutline size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                  {hoursUsed}h {minsUsed}m ONLINE
                </span>
              </div>
              <span className="retro-xp-stats">
                {nextRank ? `NEXT: LV. ${nextRank.level} (${xpPercent}%)` : 'MAX LEVEL (ELDER)'}
              </span>
            </div>

            {/* Smooth solid continuous XP track */}
            <div className="retro-xp-track">
              <div 
                className="retro-xp-fill" 
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        </header>

        {/* =========================================================================
            TOP-LEFT: GREETING & COMPACT DIGITAL CLOCK
            ========================================================================= */}
        <div className="retro-top-left-widget">
          {/* Greeting */}
          <div className="retro-greeting-row left-aligned">
            <span className="retro-terminal-prompt">&gt;</span>
            {isEditingName ? (
              <div className="retro-name-edit-form">
                <span className="retro-greeting-text">{greeting},</span>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (tempName.trim()) {
                        setUserName(tempName.trim());
                        localStorage.setItem('waveform_retro_username', tempName.trim());
                      }
                      setIsEditingName(false);
                    }
                  }}
                  className="retro-name-input"
                  autoFocus
                  maxLength={16}
                />
                <button 
                  onClick={() => {
                    if (tempName.trim()) {
                      setUserName(tempName.trim());
                      localStorage.setItem('waveform_retro_username', tempName.trim());
                    }
                    setIsEditingName(false);
                  }} 
                  className="retro-name-save-btn"
                >
                  LƯU
                </button>
              </div>
            ) : (
              <div className="retro-greeting-display">
                <span className="retro-greeting-text">
                  {greeting}, <strong className="retro-user-name">{userName}</strong>
                </span>
                <button 
                  onClick={() => { setTempName(userName); setIsEditingName(true); }}
                  className="retro-edit-name-btn"
                  title="Đổi tên"
                >
                  <IoPencilOutline size={13} />
                </button>
              </div>
            )}
            <span className="retro-cursor-blink">_</span>
          </div>

          {/* Digital Clock Right Below Greeting */}
          <div className="retro-top-clock-display">
            <div className={`retro-digital-clock-compact font-${clockFont}`}>{timeStr}</div>
            {showDate && <div className="retro-calendar-date-compact">{dateStr}</div>}
          </div>

          {/* Now Playing Mini Ribbon with 3-stripe wave animation */}
          {isPlaying && currentTrack && (
            <div className="retro-now-playing-mini">
              <div className="mini-equalizer">
                <span className="mini-eq-bar bar-1"></span>
                <span className="mini-eq-bar bar-2"></span>
                <span className="mini-eq-bar bar-3"></span>
              </div>
              <span className="mini-playing-label">Playing :</span>
              <span className="mini-track">{currentTrack.title} {currentTrack.artist ? `— ${currentTrack.artist}` : ''}</span>
            </div>
          )}
        </div>

        {/* =========================================================================
            RIGHT FLOATING ACTION DOCK (Vertical icon bar)
            ========================================================================= */}
        <aside className="retro-right-dock">
          {/* 1. Quest Log / Ghi chú */}
          <button 
            className={`dock-btn ${activeDrawer === 'notes' ? 'active' : ''}`}
            onClick={() => toggleDrawer('notes')}
            title="Sổ ghi chú & Nhiệm vụ"
          >
            <IoDocumentTextOutline size={18} />
            {notes.length > 0 && (
              <span className="dock-badge">{notes.filter(n => !n.completed).length}</span>
            )}
          </button>

          {/* 2. Lịch (Calendar) */}
          <button 
            className={`dock-btn ${activeDrawer === 'calendar' ? 'active' : ''}`}
            onClick={() => toggleDrawer('calendar')}
            title="Xem Lịch"
          >
            <IoCalendarOutline size={18} />
          </button>

          {/* 3. Bảng cấp bậc Bejeweled 131 Ranks */}
          <button 
            className={`dock-btn ${activeDrawer === 'ranks' ? 'active' : ''}`}
            onClick={() => toggleDrawer('ranks')}
            title="Bảng cấp bậc Bejeweled (131 Cấp Độ)"
          >
            <IoDiamondOutline size={18} />
          </button>

          {/* 4. Cài đặt Hệ Thống - Opens Master Modal Panel */}
          <button 
            className={`dock-btn ${isSettingsOpen ? 'active' : ''}`}
            onClick={() => {
              setActiveDrawer('none');
              setIsSettingsOpen(true);
            }}
            title="Cài đặt hệ thống Waveform"
          >
            <IoSettingsOutline size={18} />
          </button>
        </aside>

        {/* =========================================================================
            ANIMATED SLIDE-IN SIDE DRAWERS (Notes, Calendar, Ranks)
            ========================================================================= */}
        {activeDrawer !== 'none' && (
          <div className="retro-drawer-panel">
            <div className="drawer-header">
              <span className="drawer-title">
                {activeDrawer === 'notes' && 'USER QUEST LOG / GHI CHÚ'}
                {activeDrawer === 'calendar' && 'LỊCH HỆ THỐNG'}
                {activeDrawer === 'ranks' && 'BEJEWELED RANKS (131 LEVELS)'}
              </span>
              <button 
                className="drawer-close-btn" 
                onClick={() => setActiveDrawer('none')}
                title="Đóng bảng"
              >
                <IoCloseOutline size={18} />
              </button>
            </div>

            <div className="drawer-body">
              {/* DRAWER 1: NOTES / QUEST LOG */}
              {activeDrawer === 'notes' && (
                <div className="drawer-notes-wrap">
                  <div className="drawer-meta-row">
                    <span>HOÀN THÀNH: {notes.filter(n => n.completed).length}/{notes.length}</span>
                    <span className="drawer-hint">Enter để thêm</span>
                  </div>

                  <form onSubmit={handleAddNote} className="retro-note-add-form">
                    <span className="note-input-prompt">+</span>
                    <input
                      type="text"
                      placeholder="Thêm nhiệm vụ mới..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="retro-note-input"
                    />
                  </form>

                  <div className="drawer-note-list">
                    {notes.map(note => (
                      <div key={note.id} className={`retro-note-item ${note.completed ? 'completed' : ''}`}>
                        <button
                          type="button"
                          className={`retro-checkbox ${note.completed ? 'checked' : ''}`}
                          onClick={() => handleToggleNote(note.id)}
                        >
                          {note.completed && <IoCheckmark size={13} />}
                        </button>
                        <span 
                          className="retro-note-text"
                          onClick={() => handleToggleNote(note.id)}
                        >
                          {note.text}
                        </span>
                        <button 
                          className="retro-note-del-btn"
                          onClick={() => handleDeleteNote(note.id)}
                          title="Xóa"
                        >
                          <IoTrashOutline size={13} />
                        </button>
                      </div>
                    ))}
                    {notes.length === 0 && (
                      <div className="retro-empty-notes">Chưa có ghi chú nào.</div>
                    )}
                  </div>
                </div>
              )}

              {/* DRAWER 2: INTERACTIVE CALENDAR */}
              {activeDrawer === 'calendar' && (
                <div className="drawer-calendar-wrap">
                  <div className="calendar-nav-bar">
                    <button 
                      className="cal-nav-btn"
                      onClick={() => setCalDate(new Date(year, month - 1, 1))}
                    >
                      <IoChevronBackOutline size={14} />
                    </button>
                    <div className="cal-title-wrap">
                      <span className="cal-month-title">{monthNames[month]} {year}</span>
                      <button 
                        className="cal-today-btn"
                        onClick={() => setCalDate(new Date())}
                      >
                        Hôm nay
                      </button>
                    </div>
                    <button 
                      className="cal-nav-btn"
                      onClick={() => setCalDate(new Date(year, month + 1, 1))}
                    >
                      <IoChevronForwardOutline size={14} />
                    </button>
                  </div>

                  <div className="calendar-retro-grid">
                    {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
                      <div key={d} className="cal-head">{d}</div>
                    ))}
                    {Array.from({ length: firstDayIndex }).map((_, i) => (
                      <div key={`empty-${i}`} className="cal-cell empty" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const isToday = 
                        today.getDate() === day && 
                        today.getMonth() === month && 
                        today.getFullYear() === year;
                      return (
                        <div key={day} className={`cal-cell ${isToday ? 'today' : ''}`}>
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* DRAWER 3: BEJEWELED 131 RANKS (MODERN ICONS & HIGH CONTRAST) */}
              {activeDrawer === 'ranks' && (
                <div className="drawer-ranks-wrap">
                  {/* Current Active Rank Spotlight (Minimalist: only shows current rank) */}
                  <div className="ranks-header-summary">
                    <div className="current-rank-card">
                      <div className={`summary-gem-socket tier-${currentRank.tier}`}>
                        <GemAsset type={currentRank.gemType} size={32} />
                      </div>
                      <div className="summary-details">
                        <span className="summary-label">BẬC HIỆN TẠI</span>
                        <span className={`summary-title tier-text-${currentRank.tier}`}>
                          {currentRank.title}
                        </span>
                      </div>
                    </div>

                    {/* Quick Search */}
                    <div className="ranks-search-box">
                      <input 
                        type="text" 
                        placeholder="Tìm cấp độ hoặc tên danh hiệu..."
                        value={rankSearch}
                        onChange={(e) => setRankSearch(e.target.value)}
                        className="ranks-search-input"
                      />
                      {rankSearch && (
                        <button onClick={() => setRankSearch('')} className="ranks-search-clear">
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 131 Levels List */}
                  <div className="ranks-table-list">
                    {filteredRanks.map((rk) => {
                      const isUnlocked = currentRank.level >= rk.level;
                      const isCurrent = currentRank.level === rk.level;

                      return (
                        <div 
                          key={rk.level}
                          className={`rank-row-item ${isCurrent ? 'current-rank' : ''} ${isUnlocked ? 'unlocked' : 'locked'}`}
                        >
                          <div className="rank-level-num">
                            #{rk.level}
                          </div>

                          <div className={`rank-gem-socket tier-${rk.tier}`}>
                            <GemAsset type={rk.gemType} size={22} />
                          </div>

                          <div className="rank-info-col">
                            <span className="rank-name-text">{rk.title}</span>
                          </div>

                          <span className="rank-req-tag">
                            {rk.timeFormatted}
                          </span>

                          <div className="rank-status-icon-col">
                            {isCurrent ? (
                              <div className="status-current-badge" title="Cấp bậc hiện tại">
                                <span className="current-pulse-dot" />
                                <IoFlame size={20} color="#1ed760" />
                              </div>
                            ) : isUnlocked ? (
                              <IoCheckmarkCircle size={22} color="#1ed760" title="Đã đạt" />
                            ) : (
                              <IoLockClosedOutline size={18} color="#64748b" title="Chưa mở khóa" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            MASTER SETTINGS MODAL DIALOG (OVERLAY WITH VERTICAL SIDEBAR)
            ========================================================================= */}
        {isSettingsOpen && (
          <div 
            className="settings-master-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsSettingsOpen(false);
            }}
          >
            <div className="settings-master-modal">
              {/* Modal Header */}
              <div className="settings-master-header">
                <div className="settings-header-left">
                  <IoSettingsOutline size={20} color="#1ed760" />
                  <span className="settings-master-title">WAVEFORM SETTINGS / CÀI ĐẶT HỆ THỐNG</span>
                </div>
                <button 
                  className="settings-close-modal-btn"
                  onClick={() => setIsSettingsOpen(false)}
                  title="Đóng bảng cài đặt (ESC)"
                >
                  <IoCloseOutline size={22} />
                </button>
              </div>

              {/* Modal Body with Vertical Sidebar */}
              <div className="settings-master-body">
                {/* Vertical Sidebar Navigation */}
                <aside className="settings-vertical-sidebar">
                  <button 
                    className={`settings-vtab-btn ${activeSettingsTab === 'appearance' ? 'active' : ''}`}
                    onClick={() => setActiveSettingsTab('appearance')}
                  >
                    <IoImageOutline size={18} className="settings-vtab-icon" />
                    <span>Giao diện & Nền</span>
                  </button>

                  <button 
                    className={`settings-vtab-btn ${activeSettingsTab === 'apps' ? 'active' : ''}`}
                    onClick={() => setActiveSettingsTab('apps')}
                  >
                    <IoAppsOutline size={18} className="settings-vtab-icon" />
                    <span>Quản lý App Hub</span>
                  </button>

                  <button 
                    className={`settings-vtab-btn ${activeSettingsTab === 'clock' ? 'active' : ''}`}
                    onClick={() => setActiveSettingsTab('clock')}
                  >
                    <IoTimeOutline size={18} className="settings-vtab-icon" />
                    <span>Đồng hồ & Hiển thị</span>
                  </button>

                  <button 
                    className={`settings-vtab-btn ${activeSettingsTab === 'sound' ? 'active' : ''}`}
                    onClick={() => setActiveSettingsTab('sound')}
                  >
                    <IoMusicalNotesOutline size={18} className="settings-vtab-icon" />
                    <span>Âm thanh Môi trường</span>
                  </button>

                  <button 
                    className={`settings-vtab-btn ${activeSettingsTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveSettingsTab('profile')}
                  >
                    <IoPersonOutline size={18} className="settings-vtab-icon" />
                    <span>Hồ sơ & Cày cấp</span>
                  </button>

                  <button 
                    className={`settings-vtab-btn ${activeSettingsTab === 'about' ? 'active' : ''}`}
                    onClick={() => setActiveSettingsTab('about')}
                  >
                    <IoInformationCircleOutline size={18} className="settings-vtab-icon" />
                    <span>Thông tin ứng dụng</span>
                  </button>
                </aside>

                {/* Main Content Area */}
                <div className="settings-master-content">
                  
                  {/* TAB 1: GIAO DIỆN & HÌNH NỀN */}
                  {activeSettingsTab === 'appearance' && (
                    <>
                      {/* Custom Local File Browser */}
                      <div className="settings-card-section">
                        <div className="settings-section-head">
                          <span className="settings-section-title">HÌNH NỀN TÙY CHỌN TỪ MÁY TÍNH</span>
                          <span className="settings-section-desc">
                            Mở trực tiếp ảnh (JPG, PNG, WebP) từ ổ đĩa máy tính của bạn làm hình nền Hub Waveform.
                          </span>
                        </div>

                        <div className="custom-file-browse-box">
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            accept="image/png, image/jpeg, image/jpg, image/webp, image/gif" 
                            style={{ display: 'none' }} 
                            onChange={handleLocalImageSelect} 
                          />
                          
                          {bgType === 'custom' && customBgUrl && (
                            <div className="custom-current-preview">
                              <img src={customBgUrl} alt="Custom Background" className="custom-current-img" />
                            </div>
                          )}

                          <button 
                            className="btn-spotify-primary"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <IoFolderOpenOutline size={18} />
                            <span>Chọn ảnh từ máy tính</span>
                          </button>

                          {bgType === 'custom' && customBgUrl && (
                            <button 
                              className="btn-spotify-secondary"
                              onClick={() => {
                                setBgType('sakura');
                                setCustomBgUrl('');
                                localStorage.setItem('waveform_hub_bg_type', 'sakura');
                                localStorage.removeItem('waveform_hub_custom_bg');
                              }}
                            >
                              Khôi phục ảnh mặc định
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Wallpaper Presets */}
                      <div className="settings-card-section">
                        <div className="settings-section-head">
                          <span className="settings-section-title">BỘ SƯU TẬP HÌNH NỀN CÓ SẴN</span>
                          <span className="settings-section-desc">Nhấp chọn bất kỳ mẫu nào để áp dụng tức thì.</span>
                        </div>

                        <div className="wallpaper-modal-grid">
                          {WALLPAPER_PRESETS.map(p => (
                            <div 
                              key={p.id}
                              className={`wallpaper-modal-card ${bgType === p.id ? 'selected' : ''}`}
                              onClick={() => {
                                setBgType(p.id);
                                localStorage.setItem('waveform_hub_bg_type', p.id);
                              }}
                            >
                              <div className="wallpaper-card-thumb">
                                {p.id === 'obsidian' ? (
                                  <div className="preset-obsidian-preview" />
                                ) : (
                                  <img src={p.url} alt={p.name} />
                                )}
                                {bgType === p.id && (
                                  <div className="wallpaper-active-badge">
                                    <IoCheckmark size={14} />
                                  </div>
                                )}
                              </div>
                              <div className="wallpaper-card-info">
                                <span className="wallpaper-card-name">{p.name}</span>
                                <span className="wallpaper-card-sub">{p.desc}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Lighting & Filters */}
                      <div className="settings-card-section">
                        <div className="settings-section-head">
                          <span className="settings-section-title">ÁNH SÁNG & HIỆU ỨNG HẬU CẢNH</span>
                          <span className="settings-section-desc">
                            Cân chỉnh độ tối hoặc làm mờ nhẹ hậu cảnh để chữ số và widget luôn nổi bật rõ nét.
                          </span>
                        </div>

                        <div className="settings-slider-row">
                          <div className="slider-label-col">
                            <span className="slider-label">Độ tối hình nền (Dim Overlay): {bgDim}%</span>
                            <span className="slider-sub">Giúp tăng độ tương phản của chữ trên nền sáng</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="80" 
                            value={bgDim}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setBgDim(val);
                              localStorage.setItem('waveform_hub_bg_dim', String(val));
                            }}
                            className="spotify-range-slider"
                          />
                        </div>

                        <div className="settings-slider-row">
                          <div className="slider-label-col">
                            <span className="slider-label">Độ mờ hậu cảnh (Blur): {bgBlur}px</span>
                            <span className="slider-sub">Làm mờ ảnh nền phong cách cinematic depth-of-field</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="15" 
                            value={bgBlur}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setBgBlur(val);
                              localStorage.setItem('waveform_hub_bg_blur', String(val));
                            }}
                            className="spotify-range-slider"
                          />
                        </div>
                      </div>

                      {/* Canvas Graphics */}
                      <div className="settings-card-section">
                        <div className="settings-section-head">
                          <span className="settings-section-title">HIỆU ỨNG ĐỒ HỌA ĐỘNG</span>
                        </div>

                        <div className="settings-toggle-row">
                          <div className="toggle-label-wrap">
                            <span className="toggle-main-label">Cánh hoa rơi & Đom đóm phát sáng</span>
                            <span className="toggle-sub-label">Các hạt pixel hoa anh đào bay lơ lửng theo gió</span>
                          </div>
                          <button 
                            className={`settings-toggle-switch ${showPetals ? 'active' : ''}`}
                            onClick={() => {
                              const val = !showPetals;
                              setShowPetals(val);
                              localStorage.setItem('waveform_hub_show_petals', String(val));
                            }}
                          >
                            <span className="toggle-handle" />
                          </button>
                        </div>

                        {showPetals && (
                          <div className="settings-slider-row">
                            <div className="slider-label-col">
                              <span className="slider-label">Mật độ hạt cánh hoa: {petalDensity} hạt</span>
                              <span className="slider-sub">Số lượng cánh hoa xuất hiện cùng lúc trên màn hình</span>
                            </div>
                            <input 
                              type="range" 
                              min="20" 
                              max="80" 
                              step="5"
                              value={petalDensity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                setPetalDensity(val);
                                localStorage.setItem('waveform_hub_petal_density', String(val));
                              }}
                              className="spotify-range-slider"
                            />
                          </div>
                        )}

                        <div className="settings-toggle-row">
                          <div className="toggle-label-wrap">
                            <span className="toggle-main-label">Đường quét tia CRT Retro</span>
                            <span className="toggle-sub-label">Màn hình sọc ngang scanlines hoài niệm arcade</span>
                          </div>
                          <button 
                            className={`settings-toggle-switch ${showCRT ? 'active' : ''}`}
                            onClick={() => {
                              const val = !showCRT;
                              setShowCRT(val);
                              localStorage.setItem('waveform_hub_show_crt', String(val));
                            }}
                          >
                            <span className="toggle-handle" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* TAB 2: QUẢN LÝ APP HUB */}
                  {activeSettingsTab === 'apps' && (
                    <>
                      <div className="settings-card-section">
                        <div className="settings-section-head">
                          <span className="settings-section-title">SẮP XẾP & ẨN/HIỆN CÁC APP TRÊN THANH BÊN</span>
                          <span className="settings-section-desc">
                            Bấm nút mũi tên Lên/Xuống để đổi vị trí app trên thanh bên trái. Bấm icon Mắt để ẩn/hiện app tức thời.
                          </span>
                        </div>

                        <div className="app-manage-modal-list">
                          {appOrder.map((item, idx) => {
                            const meta = appMeta[item.id];
                            return (
                              <div key={item.id} className={`app-manage-modal-row ${!item.enabled ? 'disabled' : ''}`}>
                                <div className="app-manage-info">
                                  <div className="app-manage-icon">{meta.icon}</div>
                                  <span className="app-manage-title">{meta.name}</span>
                                </div>

                                <div className="app-manage-btns">
                                  <button 
                                    className="app-btn-round" 
                                    onClick={() => moveApp(idx, 'up')}
                                    disabled={idx === 0}
                                    title="Di chuyển lên"
                                  >
                                    <IoChevronUpOutline size={16} />
                                  </button>
                                  <button 
                                    className="app-btn-round" 
                                    onClick={() => moveApp(idx, 'down')}
                                    disabled={idx === appOrder.length - 1}
                                    title="Di chuyển xuống"
                                  >
                                    <IoChevronDownOutline size={16} />
                                  </button>
                                  <button 
                                    className={`app-btn-round ${item.enabled ? 'active' : 'inactive'}`}
                                    onClick={() => toggleAppEnabled(item.id)}
                                    title={item.enabled ? 'Đang hiển thị (Click để ẩn)' : 'Đang ẩn (Click để hiện)'}
                                  >
                                    {item.enabled ? <IoEyeOutline size={16} /> : <IoEyeOffOutline size={16} />}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div style={{ marginTop: 8 }}>
                          <button 
                            className="btn-spotify-secondary"
                            onClick={() => updateAppOrder(DEFAULT_APP_ORDER)}
                          >
                            Khôi phục thứ tự mặc định
                          </button>
                        </div>
                      </div>

                      <div className="settings-card-section">
                        <div className="settings-section-head">
                          <span className="settings-section-title">ỨNG DỤNG KHỞI ĐỘNG MẶC ĐỊNH</span>
                          <span className="settings-section-desc">Màn hình tự động mở mỗi khi bật Waveform.</span>
                        </div>

                        <div className="clock-options-grid">
                          {[
                            { id: 'hub', label: 'Trang chủ Hub' },
                            { id: 'music', label: 'Spotify Music' },
                            { id: 'tft', label: 'Teamfight Tactics' },
                            { id: 'gd', label: 'Demonlist' },
                            { id: 'valorant', label: 'Valorant Tracker' }
                          ].map(app => (
                            <button
                              key={app.id}
                              className={`clock-option-card ${defaultApp === app.id ? 'selected' : ''}`}
                              onClick={() => {
                                setDefaultApp(app.id);
                                localStorage.setItem('waveform_default_app', app.id);
                              }}
                            >
                              <span className="clock-preview-title">{app.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* TAB 3: ĐỒNG HỒ & THỜI GIAN */}
                  {activeSettingsTab === 'clock' && (
                    <>
                      <div className="settings-card-section">
                        <div className="settings-section-head">
                          <span className="settings-section-title">ĐỊNH DẠNG GIỜ</span>
                          <span className="settings-section-desc">Lựa chọn chế độ hiển thị 24 tiếng hoặc 12 tiếng (AM/PM).</span>
                        </div>

                        <div className="clock-options-grid">
                          <button 
                            className={`clock-option-card ${clockFormat === '24h' ? 'selected' : ''}`}
                            onClick={() => {
                              setClockFormat('24h');
                              localStorage.setItem('waveform_hub_clock_format', '24h');
                            }}
                          >
                            <span className="clock-preview-title">Hệ 24 giờ (Quân đội)</span>
                            <span className="clock-preview-sample">15:20:45</span>
                          </button>
                          <button 
                            className={`clock-option-card ${clockFormat === '12h' ? 'selected' : ''}`}
                            onClick={() => {
                              setClockFormat('12h');
                              localStorage.setItem('waveform_hub_clock_format', '12h');
                            }}
                          >
                            <span className="clock-preview-title">Hệ 12 giờ (AM / PM)</span>
                            <span className="clock-preview-sample">03:20 PM</span>
                          </button>
                        </div>
                      </div>

                      <div className="settings-card-section">
                        <div className="settings-section-head">
                          <span className="settings-section-title">TÙY CHỌN HIỂN THỊ</span>
                        </div>

                        <div className="settings-toggle-row">
                          <div className="toggle-label-wrap">
                            <span className="toggle-main-label">Hiển thị số giây (:ss)</span>
                            <span className="toggle-sub-label">Đếm giây nhịp nhàng theo thời gian thực</span>
                          </div>
                          <button 
                            className={`settings-toggle-switch ${showSeconds ? 'active' : ''}`}
                            onClick={() => {
                              const val = !showSeconds;
                              setShowSeconds(val);
                              localStorage.setItem('waveform_hub_show_seconds', String(val));
                            }}
                          >
                            <span className="toggle-handle" />
                          </button>
                        </div>

                        <div className="settings-toggle-row">
                          <div className="toggle-label-wrap">
                            <span className="toggle-main-label">Hiển thị dòng ngày tháng</span>
                            <span className="toggle-sub-label">Hiện thứ, ngày, tháng, năm bên dưới đồng hồ</span>
                          </div>
                          <button 
                            className={`settings-toggle-switch ${showDate ? 'active' : ''}`}
                            onClick={() => {
                              const val = !showDate;
                              setShowDate(val);
                              localStorage.setItem('waveform_hub_show_date', String(val));
                            }}
                          >
                            <span className="toggle-handle" />
                          </button>
                        </div>
                      </div>

                      <div className="settings-card-section">
                        <div className="settings-section-head">
                          <span className="settings-section-title">KIỂU CHỮ SỐ ĐỒNG HỒ</span>
                        </div>

                        <div className="clock-font-options">
                          {[
                            { id: 'vt323', name: 'VT323 Digital (Mặc định hoài niệm)', sample: '15:20:45' },
                            { id: 'silkscreen', name: 'Silkscreen Pixel 8-Bit', sample: '15:20' },
                            { id: 'modern', name: 'Modern Monospace Clean', sample: '15:20:45' }
                          ].map(f => (
                            <div 
                              key={f.id}
                              className={`clock-font-row ${clockFont === f.id ? 'selected' : ''}`}
                              onClick={() => {
                                setClockFont(f.id);
                                localStorage.setItem('waveform_hub_clock_font', f.id);
                              }}
                            >
                              <span className="font-name">{f.name}</span>
                              <span className={`font-preview font-${f.id}`}>{f.sample}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="settings-card-section">
                        <div className="settings-section-head">
                          <span className="settings-section-title">LỜI CHÀO TÙY CHỈNH</span>
                          <span className="settings-section-desc">Nhập lời chào riêng của bạn hoặc để trống để tự động theo buổi.</span>
                        </div>

                        <div className="custom-bg-input-row">
                          <input 
                            type="text" 
                            placeholder="Ví dụ: Xin chào, Welcome back, Konnichiwa..."
                            value={customGreeting}
                            onChange={(e) => setCustomGreeting(e.target.value)}
                            className="settings-text-input"
                          />
                          <button 
                            className="btn-spotify-primary"
                            onClick={() => {
                              localStorage.setItem('waveform_hub_custom_greeting', customGreeting);
                              alert('Đã lưu lời chào!');
                            }}
                          >
                            Lưu
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* TAB 4: ÂM THANH & MÔI TRƯỜNG */}
                  {activeSettingsTab === 'sound' && (
                    <>
                      <div className="settings-card-section">
                        <div className="settings-section-head">
                          <span className="settings-section-title">ÂM THANH MÔI TRƯỜNG (SOUNDSCAPE)</span>
                          <span className="settings-section-desc">
                            Tiếng ồn trắng tự nhiên phát nền khi bạn ngồi thư giãn tại Hub mà không cần mở nhạc.
                          </span>
                        </div>

                        <div className="clock-options-grid">
                          {[
                            { id: 'none', title: 'Tắt (Mặc định)', desc: 'Im lặng hoàn toàn' },
                            { id: 'wind', title: 'Gió Rừng Anh Đào', desc: 'Tiếng gió thoảng qua tán lá' },
                            { id: 'rain', title: 'Mưa Rơi Rả Rích', desc: 'Tiếng mưa êm đềm thư thái' },
                            { id: 'vinyl', title: 'Lofi Vinyl Crackle', desc: 'Tiếng xước đĩa than cổ điển' }
                          ].map(snd => (
                            <button
                              key={snd.id}
                              className={`clock-option-card ${ambientSound === snd.id ? 'selected' : ''}`}
                              onClick={() => {
                                setAmbientSound(snd.id);
                                localStorage.setItem('waveform_hub_ambient_sound', snd.id);
                              }}
                            >
                              <span className="clock-preview-title">{snd.title}</span>
                              <span className="clock-preview-sample" style={{ fontSize: 13, color: '#888888' }}>{snd.desc}</span>
                            </button>
                          ))}
                        </div>

                        {ambientSound !== 'none' && (
                          <div className="settings-slider-row" style={{ marginTop: 12 }}>
                            <div className="slider-label-col">
                              <span className="slider-label">Âm lượng môi trường: {ambientVolume}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="5" 
                              max="100" 
                              value={ambientVolume}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                setAmbientVolume(val);
                                localStorage.setItem('waveform_hub_ambient_vol', String(val));
                              }}
                              className="spotify-range-slider"
                            />
                          </div>
                        )}
                      </div>

                      <div className="settings-card-section">
                        <div className="settings-section-head">
                          <span className="settings-section-title">HIỆU ỨNG ÂM THANH NÚT BẤM (SFX)</span>
                        </div>

                        <div className="settings-toggle-row">
                          <div className="toggle-label-wrap">
                            <span className="toggle-main-label">Âm thanh click retro khi tương tác</span>
                            <span className="toggle-sub-label">Tiếng bíp nhẹ arcade khi bấm các nút chức năng</span>
                          </div>
                          <button 
                            className={`settings-toggle-switch ${sfxEnabled ? 'active' : ''}`}
                            onClick={() => {
                              const val = !sfxEnabled;
                              setSfxEnabled(val);
                              localStorage.setItem('waveform_hub_sfx_enabled', String(val));
                            }}
                          >
                            <span className="toggle-handle" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* TAB 5: HỒ SƠ & CÀY CẤP */}
                  {activeSettingsTab === 'profile' && (
                    <>
                      <div className="settings-card-section">
                        <div className="settings-section-head">
                          <span className="settings-section-title">THÔNG TIN NGƯỜI DÙNG</span>
                        </div>

                        <div className="custom-bg-input-row">
                          <input 
                            type="text" 
                            value={userName}
                            onChange={(e) => setTempName(e.target.value)}
                            onBlur={() => {
                              if (tempName.trim()) {
                                setUserName(tempName.trim());
                                localStorage.setItem('waveform_retro_username', tempName.trim());
                              }
                            }}
                            className="settings-text-input"
                            maxLength={16}
                          />
                          <button 
                            className="btn-spotify-primary"
                            onClick={() => {
                              if (tempName.trim()) {
                                setUserName(tempName.trim());
                                localStorage.setItem('waveform_retro_username', tempName.trim());
                              }
                              alert('Đã cập nhật tên!');
                            }}
                          >
                            Lưu tên
                          </button>
                        </div>
                      </div>

                      <div className="settings-card-section">
                        <div className="settings-section-head">
                          <span className="settings-section-title">THỐNG KÊ CÀY CẤP BEJEWELED</span>
                          <span className="settings-section-desc">
                            Tiến trình cày cấp độ dựa trên tổng thời gian bạn sử dụng Waveform.
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 4 }}>
                          <div className="clock-option-card">
                            <span className="clock-preview-title">CẤP BẬC HIỆN TẠI</span>
                            <span className="clock-preview-sample" style={{ fontSize: 16, color: '#1ed760' }}>
                              LV. {currentRank.level}
                            </span>
                            <span style={{ fontSize: 10, color: '#ffffff' }}>{currentRank.title}</span>
                          </div>

                          <div className="clock-option-card">
                            <span className="clock-preview-title">THỜI GIAN ONLINE</span>
                            <span className="clock-preview-sample" style={{ fontSize: 16, color: '#1ed760' }}>
                              {hoursUsed}h {minsUsed}m
                            </span>
                            <span style={{ fontSize: 10, color: '#888888' }}>Tổng tích lũy</span>
                          </div>

                          <div className="clock-option-card">
                            <span className="clock-preview-title">MỐC KẾ TIẾP</span>
                            <span className="clock-preview-sample" style={{ fontSize: 16, color: '#1ed760' }}>
                              {nextRank ? `LV. ${nextRank.level}` : 'MAX'}
                            </span>
                            <span style={{ fontSize: 10, color: '#888888' }}>
                              {nextRank ? nextRank.title : 'Đạt đỉnh'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="settings-card-section">
                        <div className="settings-section-head">
                          <span className="settings-section-title">QUẢN TRỊ DỮ LIỆU</span>
                          <span className="settings-section-desc">Sao lưu cấu hình hoặc khởi tạo lại các thông số.</span>
                        </div>

                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <button 
                            className="btn-spotify-secondary"
                            onClick={() => {
                              const config = {
                                username: userName,
                                totalSeconds,
                                bgType,
                                clockFormat,
                                showSeconds,
                                showCRT,
                                showPetals,
                                appOrder
                              };
                              const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `waveform-settings-${Date.now()}.json`;
                              a.click();
                            }}
                          >
                            <IoCloudDownloadOutline size={16} />
                            <span>Xuất file cài đặt (.json)</span>
                          </button>

                          <button 
                            className="btn-spotify-danger"
                            onClick={() => {
                              if (window.confirm('CẢNH BÁO: Đặt lại toàn bộ số giờ online và cấp bậc Bejeweled về cấp 1 (0 giây)?')) {
                                setTotalSeconds(0);
                                localStorage.setItem('waveform_retro_total_seconds', '0');
                                alert('Đã đặt lại cấp bậc về 0.');
                              }
                            }}
                          >
                            <IoWarningOutline size={16} />
                            <span>Đặt lại Level về 0</span>
                          </button>

                          <button 
                            className="btn-spotify-secondary"
                            onClick={() => {
                              if (window.confirm('Khôi phục toàn bộ giao diện, hình nền và đồng hồ về mặc định?')) {
                                localStorage.clear();
                                window.location.reload();
                              }
                            }}
                          >
                            <IoRefreshOutline size={16} />
                            <span>Khôi phục cài đặt gốc</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* TAB 6: THÔNG TIN ỨNG DỤNG */}
                  {activeSettingsTab === 'about' && (
                    <div className="settings-card-section">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0' }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#1ed760', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IoMusicalNotesOutline size={30} color="#121212" />
                        </div>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#ffffff' }}>Waveform SuperApp</div>
                          <div style={{ fontSize: 11, color: '#1ed760', fontWeight: 600 }}>Phiên bản v1.1.0 (Spotify Master Dark Edition)</div>
                        </div>
                      </div>

                      <p style={{ fontSize: 12, color: '#b3b3b3', lineHeight: 1.6, margin: '8px 0' }}>
                        Waveform là siêu ứng dụng tất cả trong một dành cho Game thủ & Người yêu âm nhạc: tích hợp Trình nghe nhạc chuẩn Spotify, Bảng xếp hạng Đấu Trường Chân Lý (Meta TFT), Geometry Dash Demonlist và Tra cứu chỉ số Valorant Tracker.
                      </p>

                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 8, marginTop: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#1ed760', marginBottom: 8 }}>PHÍM TẮT TIỆN LỢI:</div>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: '#b3b3b3', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <li><strong>Space:</strong> Phát / Tạm dừng bài hát hiện tại</li>
                          <li><strong>Ctrl + Mũi tên Phải:</strong> Chuyển bài kế tiếp</li>
                          <li><strong>Ctrl + Mũi tên Trái:</strong> Quay lại bài trước</li>
                          <li><strong>Ctrl + Shift + M:</strong> Thu nhỏ trình phát nhạc Mini Player</li>
                        </ul>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
