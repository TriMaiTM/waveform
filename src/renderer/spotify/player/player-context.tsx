import React, { createContext, useState, useEffect, useRef } from 'react'
import { Howl } from 'howler'
import { Track } from '../../shared/types'

export interface EqualizerGains {
  hz60: number;   // Bass
  hz230: number;  // Low-Mid
  hz910: number;  // Mid
  hz4k: number;   // Treble
  hz14k: number;  // Presence
}

export interface PlayerContextProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  queue: Track[];
  currentIndex: number;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  analyser: AnalyserNode | null;
  eqGains: EqualizerGains;
  speed: number;
  setSpeed: (speed: number) => void;
  preservesPitch: boolean;
  setPreservesPitch: (preserve: boolean) => void;
  crossfadeTime: number;
  setCrossfadeTime: (seconds: number) => void;
  sleepTimerOption: string | null;
  sleepTimeLeft: number | null;
  setSleepTimer: (option: string | null) => void;
  playTrack: (track: Track, newQueue?: Track[]) => void;
  pause: () => void;
  resume: () => void;
  skipNext: () => void;
  skipPrevious: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleFavorite: (track: Track) => Promise<void>;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  removeFromQueue: (trackId: number) => void;
  addToQueue: (track: Track) => void;
  setEqGain: (band: keyof EqualizerGains, gainValue: number) => void;
  updateTrackMetadataInPlayer: (trackId: number, updatedFields: Partial<Track>) => void;
}

export const PlayerContext = createContext<PlayerContextProps | undefined>(undefined)

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [duration, setDuration] = useState<number>(0)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [volume, setVolumeState] = useState<number>(0.5) // Default 50%

  // Spotify Playback Queues
  const [userQueue, setUserQueue] = useState<Track[]>([])       // Manual queue (Right click -> Add to Queue)
  const [contextQueue, setContextQueue] = useState<Track[]>([])   // Implicit queue (from Playlist / Library)
  const [contextIndex, setContextIndex] = useState<number>(-1)     // Current playing index in implicit queue

  // Shuffle and Repeat state
  const [isShuffle, setIsShuffle] = useState<boolean>(false)
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off')

  // Equalizer Gains state (from -12dB to +12dB)
  const [eqGains, setEqGains] = useState<EqualizerGains>({
    hz60: 0,
    hz230: 0,
    hz910: 0,
    hz4k: 0,
    hz14k: 0
  })

  // Phase 4 States: Speed, Pitch & Crossfade
  const [speed, setSpeed] = useState<number>(1.0)
  const [preservesPitch, setPreservesPitch] = useState<boolean>(true)
  const [crossfadeTime, setCrossfadeTime] = useState<number>(0) // in seconds, 0 = off

  // Phase 5 States: Sleep Timer
  const [sleepTimerOption, setSleepTimerOption] = useState<string | null>(null)
  const [sleepTimeLeft, setSleepTimeLeft] = useState<number | null>(null)

  // Phase 4 Refs for Crossfade
  const fadingHowlRef = useRef<Howl | null>(null)
  const crossfadeTriggeredRef = useRef<boolean>(false)
  const crossfadeTimeRef = useRef<number>(0)

  // Phase 5 Refs for Sleep Timer
  const sleepTimerOptionRef = useRef<string | null>(null)

  useEffect(() => {
    crossfadeTimeRef.current = crossfadeTime
  }, [crossfadeTime])

  useEffect(() => {
    sleepTimerOptionRef.current = sleepTimerOption
  }, [sleepTimerOption])

  const howlRef = useRef<Howl | null>(null)
  const isSeekingRef = useRef<boolean>(false) // Prevents jitter during user sliding

  // Web Audio Context, Analyser & Equalizer Filter Nodes refs
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const filter60Ref = useRef<BiquadFilterNode | null>(null)
  const filter230Ref = useRef<BiquadFilterNode | null>(null)
  const filter910Ref = useRef<BiquadFilterNode | null>(null)
  const filter4kRef = useRef<BiquadFilterNode | null>(null)
  const filter14kRef = useRef<BiquadFilterNode | null>(null)

  // Refs to prevent stale closure inside Howler callbacks
  const isShuffleRef = useRef<boolean>(false)
  const repeatModeRef = useRef<'off' | 'all' | 'one'>('off')
  const userQueueRef = useRef<Track[]>([])
  const contextQueueRef = useRef<Track[]>([])
  const contextIndexRef = useRef<number>(-1)
  const currentTrackRef = useRef<Track | null>(null)

  useEffect(() => {
    isShuffleRef.current = isShuffle
  }, [isShuffle])

  useEffect(() => {
    repeatModeRef.current = repeatMode
  }, [repeatMode])

  useEffect(() => {
    userQueueRef.current = userQueue
  }, [userQueue])

  useEffect(() => {
    contextQueueRef.current = contextQueue
  }, [contextQueue])

  useEffect(() => {
    contextIndexRef.current = contextIndex
  }, [contextIndex])

  useEffect(() => {
    currentTrackRef.current = currentTrack
  }, [currentTrack])

  // Update Howler volume when state changes (unless sleep timer is in the last 30s fade phase)
  useEffect(() => {
    if (howlRef.current) {
      if (sleepTimeLeft === null || sleepTimeLeft > 30) {
        howlRef.current.volume(volume)
      }
    }
  }, [volume, sleepTimeLeft])



  const setSleepTimer = (option: string | null) => {
    setSleepTimerOption(option)
    if (!option) {
      setSleepTimeLeft(null)
      // Restore volume if it was fading
      if (howlRef.current) {
        howlRef.current.volume(volume)
      }
      return
    }

    if (option === 'end-of-track') {
      setSleepTimeLeft(null)
      return
    }

    // Map option to seconds
    let mins = 0
    if (option === '5m') mins = 5
    else if (option === '15m') mins = 15
    else if (option === '30m') mins = 30
    else if (option === '45m') mins = 45
    else if (option === '60m') mins = 60

    setSleepTimeLeft(mins * 60)
  }

  // Sync playback speed rate
  useEffect(() => {
    if (howlRef.current) {
      howlRef.current.rate(speed)
    }
  }, [speed])

  // Sync preservesPitch to underlying HTMLAudioElement
  useEffect(() => {
    if (howlRef.current) {
      const activeSound = (howlRef.current as any)._sounds?.[0]
      const audioEl = activeSound?._node as HTMLAudioElement | undefined
      if (audioEl) {
        audioEl.preservesPitch = preservesPitch
      }
    }
  }, [preservesPitch])

  // Track elapsed time smoothly using requestAnimationFrame
  useEffect(() => {
    let animationFrameId: number

    const updateProgress = () => {
      if (howlRef.current && isPlaying && !isSeekingRef.current) {
        const seekTime = howlRef.current.seek()
        if (typeof seekTime === 'number') {
          setCurrentTime(seekTime)
          
          // Crossfade triggers when time reaches the crossfade threshold near the end
          if (crossfadeTimeRef.current > 0 && !crossfadeTriggeredRef.current) {
            const dur = howlRef.current.duration()
            if (dur && dur > crossfadeTimeRef.current && seekTime >= dur - crossfadeTimeRef.current) {
              crossfadeTriggeredRef.current = true
              console.log(`[Crossfade] Triggered next track ${crossfadeTimeRef.current}s early`)
              handleNextAuto()
            }
          }
        }
        animationFrameId = requestAnimationFrame(updateProgress)
      }
    }

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(updateProgress)
    }

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isPlaying])

  const createFilter = (ctx: AudioContext, frequency: number): BiquadFilterNode => {
    const filter = ctx.createBiquadFilter()
    filter.type = 'peaking'
    filter.frequency.value = frequency
    filter.Q.value = 1.0 // Peak bandwidth factor
    filter.gain.value = 0
    return filter
  }

  const playTrack = (track: Track, newQueue?: Track[]) => {
    // 1. Clean up current playing track
    crossfadeTriggeredRef.current = false
    if (howlRef.current) {
      if (crossfadeTimeRef.current > 0) {
        // Stop any currently fading track
        if (fadingHowlRef.current) {
          try { fadingHowlRef.current.unload(); } catch {}
        }
        fadingHowlRef.current = howlRef.current
        fadingHowlRef.current.off() // Unsubscribe all events to prevent repeat end event
        fadingHowlRef.current.fade(fadingHowlRef.current.volume(), 0, crossfadeTimeRef.current * 1000)
        
        const oldHowl = fadingHowlRef.current
        const fadeDuration = crossfadeTimeRef.current
        setTimeout(() => {
          try { oldHowl.unload(); } catch {}
        }, fadeDuration * 1000 + 200)
      } else {
        howlRef.current.unload()
      }
      howlRef.current = null
    }

    // 2. Set context queue and index
    if (newQueue) {
      setContextQueue(newQueue)
      const idx = newQueue.findIndex((t) => t.id === track.id)
      setContextIndex(idx === -1 ? 0 : idx)
    } else {
      const idx = contextQueue.findIndex((t) => t.id === track.id)
      if (idx !== -1) {
        setContextIndex(idx)
      }
    }

    setCurrentTrack(track)
    setCurrentTime(0)
    setDuration(track.durationSeconds || 0)

    // 3. Create local media scheme URL
    const trackUrl = `media://get-file?path=${encodeURIComponent(track.filePath)}`

    // 4. Initialize Howl
    const sound = new Howl({
      src: [trackUrl],
      html5: true, // Stream directly, handles range requests for instant seek
      volume: crossfadeTimeRef.current > 0 ? 0 : volume, // Start at 0 volume if crossfade is enabled
      rate: speed,
      onload: () => {
        const d = sound.duration()
        if (d && d !== Infinity && !isNaN(d)) {
          setDuration(d)
        }
      },
      onplay: (soundId?: number) => {
        setIsPlaying(true)
        
        // Connect to Web Audio API nodes (Analyser & EQ Filters)
        try {
          if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
            analyserRef.current = audioCtxRef.current.createAnalyser()
            analyserRef.current.fftSize = 512 // Generates 256 frequency bins
          }
          
          const ctx = audioCtxRef.current
          const analyser = analyserRef.current
          const activeSound = (sound as any)._sounds?.find((s: any) => s._id === soundId) || (sound as any)._sounds?.[0]
          const audioEl = activeSound?._node as HTMLAudioElement | undefined
          if (audioEl) {
            audioEl.preservesPitch = preservesPitch
          }
          
          if (audioEl && analyser && ctx && !audioEl.dataset.connected) {
            audioEl.crossOrigin = 'anonymous'
            
            // Lazy initialize filter nodes
            if (!filter60Ref.current) {
              filter60Ref.current = createFilter(ctx, 60)
              filter230Ref.current = createFilter(ctx, 230)
              filter910Ref.current = createFilter(ctx, 910)
              filter4kRef.current = createFilter(ctx, 4000)
              filter14kRef.current = createFilter(ctx, 14000)
            }
            
            const f60 = filter60Ref.current
            const f230 = filter230Ref.current
            const f910 = filter910Ref.current
            const f4k = filter4kRef.current
            const f14k = filter14kRef.current

            if (f60 && f230 && f910 && f4k && f14k) {
              // Connect current gain values
              f60.gain.value = eqGains.hz60
              f230.gain.value = eqGains.hz230
              f910.gain.value = eqGains.hz910
              f4k.gain.value = eqGains.hz4k
              f14k.gain.value = eqGains.hz14k
              
              const source = ctx.createMediaElementSource(audioEl)
              
              // Connect in cascade: Source -> EQ Filters -> Analyser -> Output Destination
              source
                .connect(f60)
                .connect(f230)
                .connect(f910)
                .connect(f4k)
                .connect(f14k)
                .connect(analyser)
              
              analyser.connect(ctx.destination)
              
              audioEl.dataset.connected = 'true'
            }
          }
        } catch (err) {
          console.warn('[AudioContext] Failed to connect analyser & filters:', err)
        }
      },
      onpause: () => {
        setIsPlaying(false)
      },
      onstop: () => {
        setIsPlaying(false)
        setCurrentTime(0)
      },
      onend: () => {
        setIsPlaying(false)
        setCurrentTime(0)
        handleNextAuto()
      },
      onloaderror: (_id, err) => {
        console.error('[Howler] Load error:', err)
        setIsPlaying(false)
      },
      onplayerror: (_id, err) => {
        console.error('[Howler] Play error:', err)
        setIsPlaying(false)
        sound.unload()
      }
    })

    howlRef.current = sound
    sound.play()
    if (crossfadeTimeRef.current > 0) {
      sound.fade(0, volume, crossfadeTimeRef.current * 1000)
    }
  }

  const pause = () => {
    if (howlRef.current && isPlaying) {
      howlRef.current.pause()
    }
  }

  const resume = () => {
    if (howlRef.current && !isPlaying) {
      howlRef.current.play()
    }
  }

  const handleNextAuto = () => {
    // Check if sleep timer end-of-track is active
    if (sleepTimerOptionRef.current === 'end-of-track') {
      console.log('[Sleep Timer] Stopping playback at end of track')
      pause()
      setSleepTimerOption(null)
      setSleepTimeLeft(null)
      // Restore volume if it was fading
      if (howlRef.current) {
        howlRef.current.volume(volume)
      }
      return
    }

    const currentRepeat = repeatModeRef.current
    const currentShuffle = isShuffleRef.current
    const uQueue = [...userQueueRef.current]
    const cQueue = contextQueueRef.current
    const cIdx = contextIndexRef.current

    if (currentRepeat === 'one' && currentTrackRef.current) {
      seek(0)
      if (howlRef.current) {
        howlRef.current.play()
      }
      setIsPlaying(true)
      return
    }

    if (uQueue.length > 0) {
      const nextTrack = uQueue[0]
      setUserQueue(uQueue.slice(1))
      playTrack(nextTrack)
      return
    }

    if (cQueue.length === 0 || cIdx === -1) return

    if (currentShuffle) {
      const unplayedIndices: number[] = []
      for (let i = 0; i < cQueue.length; i++) {
        if (i !== cIdx) {
          unplayedIndices.push(i)
        }
      }
      if (unplayedIndices.length > 0) {
        const randomIdx = unplayedIndices[Math.floor(Math.random() * unplayedIndices.length)]
        playTrack(cQueue[randomIdx])
      } else {
        seek(0)
        if (howlRef.current) {
          howlRef.current.play()
        }
        setIsPlaying(true)
      }
      return
    }

    const nextIdx = cIdx + 1
    if (nextIdx < cQueue.length) {
      playTrack(cQueue[nextIdx])
    } else {
      playTrack(cQueue[0])
    }
  }

  const skipNext = () => {
    handleNextAuto()
  }

  const skipPrevious = () => {
    if (currentTime > 3) {
      seek(0)
      return
    }

    if (repeatMode === 'one') {
      seek(0)
      return
    }

    const cQueue = contextQueue
    const cIdx = contextIndex
    if (cQueue.length === 0 || cIdx === -1) return

    const prevIdx = cIdx - 1
    if (prevIdx >= 0) {
      playTrack(cQueue[prevIdx])
    } else {
      if (repeatMode === 'all') {
        playTrack(cQueue[cQueue.length - 1])
      } else {
        seek(0)
      }
    }
  }

  const seek = (seconds: number) => {
    if (howlRef.current) {
      howlRef.current.seek(seconds)
      setCurrentTime(seconds)
    }
  }

  const setVolume = (vol: number) => {
    const clampedVol = Math.max(0, Math.min(1, vol))
    setVolumeState(clampedVol)
  }

  const toggleShuffle = () => {
    setIsShuffle(prev => !prev)
  }

  const toggleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all'
      if (prev === 'all') return 'one'
      return 'off'
    })
  }

  const removeFromQueue = (trackId: number) => {
    setUserQueue(prev => prev.filter(t => t.id !== trackId))
  }

  const addToQueue = (track: Track) => {
    setUserQueue(prev => [...prev, track])
  }

  const setEqGain = (band: keyof EqualizerGains, gainValue: number) => {
    const clampedGain = Math.max(-12, Math.min(12, gainValue))
    setEqGains(prev => ({
      ...prev,
      [band]: clampedGain
    }))

    // Directly update Web Audio filter nodes if active
    if (band === 'hz60' && filter60Ref.current) filter60Ref.current.gain.value = clampedGain
    if (band === 'hz230' && filter230Ref.current) filter230Ref.current.gain.value = clampedGain
    if (band === 'hz910' && filter910Ref.current) filter910Ref.current.gain.value = clampedGain
    if (band === 'hz4k' && filter4kRef.current) filter4kRef.current.gain.value = clampedGain
    if (band === 'hz14k' && filter14kRef.current) filter14kRef.current.gain.value = clampedGain
  }

  const toggleFavorite = async (track: Track) => {
    try {
      const isFav = await window.api.toggleFavorite(track.id)
      const updatedFavorite = isFav ? 1 : 0
      
      if (currentTrack && currentTrack.id === track.id) {
        setCurrentTrack({
          ...currentTrack,
          isFavorite: updatedFavorite
        })
      }
      
      setUserQueue(prev => 
        prev.map(t => t.id === track.id ? { ...t, isFavorite: updatedFavorite } : t)
      )
      setContextQueue(prev =>
        prev.map(t => t.id === track.id ? { ...t, isFavorite: updatedFavorite } : t)
      )
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    }
  }

  const displayQueue = currentTrack 
    ? [currentTrack, ...userQueue, ...contextQueue.slice(contextIndex + 1)] 
    : []

  const displayIndex = currentTrack ? 0 : -1

  // Sleep Timer Countdown Effect
  useEffect(() => {
    if (sleepTimeLeft === null || !isPlaying) return

    const timer = setInterval(() => {
      setSleepTimeLeft(prev => {
        if (prev === null) return null
        if (prev <= 1) {
          // Time's up! Stop music
          clearInterval(timer)
          pause()
          setSleepTimerOption(null)
          // Restore volume to original
          if (howlRef.current) {
            howlRef.current.volume(volume)
          }
          return null
        }
        
        const nextTime = prev - 1
        
        // Start fading out in the last 30 seconds
        if (nextTime <= 30 && howlRef.current) {
          const fadeVolume = (nextTime / 30) * volume
          howlRef.current.volume(fadeVolume)
        }

        return nextTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [sleepTimeLeft, isPlaying, volume, pause])

  const updateTrackMetadataInPlayer = (trackId: number, updatedFields: Partial<Track>) => {
    setCurrentTrack(prev => {
      if (prev && prev.id === trackId) {
        return { ...prev, ...updatedFields }
      }
      return prev
    })
    setUserQueue(prev => prev.map(t => t.id === trackId ? { ...t, ...updatedFields } : t))
    setContextQueue(prev => prev.map(t => t.id === trackId ? { ...t, ...updatedFields } : t))
  }

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        duration,
        currentTime,
        volume,
        queue: displayQueue,
        currentIndex: displayIndex,
        isShuffle,
        repeatMode,
        analyser: analyserRef.current,
        eqGains,
        speed,
        setSpeed,
        preservesPitch,
        setPreservesPitch,
        crossfadeTime,
        setCrossfadeTime,
        sleepTimerOption,
        sleepTimeLeft,
        setSleepTimer,
        playTrack,
        pause,
        resume,
        skipNext,
        skipPrevious,
        seek,
        setVolume,
        toggleFavorite,
        toggleShuffle,
        toggleRepeat,
        removeFromQueue,
        addToQueue,
        setEqGain,
        updateTrackMetadataInPlayer
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}
