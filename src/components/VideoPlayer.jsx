import { useEffect, useRef, useState } from 'react';
import {
  Captions,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Settings,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function VideoPlayer({
  src,
  poster,
  title,
  initialTime = 0,
  onProgressSync,
  nextEpisode = null,
  onSelectNextEpisode = null,
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState('1080p');
  const [subtitlesOn, setSubtitlesOn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hasResumed, setHasResumed] = useState(false);
  const hideTimerRef = useRef(null);
  const lastSyncRef = useRef(0);

  useEffect(() => {
    setHasResumed(false);
    setCurrentTime(0);
    setPlaying(false);
  }, [src]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Periodic server-side playback progress sync
  useEffect(() => {
    if (!onProgressSync) return undefined;
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused && video.duration > 0) {
        lastSyncRef.current = video.currentTime;
        onProgressSync({
          progress: Math.floor(video.currentTime),
          duration: Math.floor(video.duration),
          completed: video.currentTime / video.duration >= 0.92,
        });
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      const video = videoRef.current;
      if (video && video.duration > 0 && video.currentTime > 1) {
        onProgressSync({
          progress: Math.floor(video.currentTime),
          duration: Math.floor(video.duration),
          completed: video.currentTime / video.duration >= 0.92,
        });
      }
    };
  }, [onProgressSync, src]);

  const bumpControls = () => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
      }
    }, 3000);
  };

  const togglePlay = async () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      await v.play().catch(() => {});
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
      if (onProgressSync && v.duration > 0) {
        onProgressSync({
          progress: Math.floor(v.currentTime),
          duration: Math.floor(v.duration),
          completed: v.currentTime / v.duration >= 0.92,
        });
      }
    }
    bumpControls();
  };

  const seekBy = (delta) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
    setCurrentTime(v.currentTime);
    bumpControls();
  };

  const handleSeekBar = (e) => {
    const v = videoRef.current;
    if (!v) return;
    const nextTime = Number(e.target.value);
    v.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const handleVolumeChange = (e) => {
    const v = videoRef.current;
    const val = Number(e.target.value);
    setVolume(val);
    if (v) {
      v.volume = val;
      v.muted = val === 0;
      setMuted(val === 0);
    }
  };

  const handleSpeedChange = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) videoRef.current.playbackRate = rate;
    setSettingsOpen(false);
  };

  const toggleSubtitles = () => {
    const v = videoRef.current;
    const next = !subtitlesOn;
    setSubtitlesOn(next);
    if (v && v.textTracks && v.textTracks[0]) {
      v.textTracks[0].mode = next ? 'showing' : 'hidden';
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(() => {});
    } else {
      await document.exitFullscreen().catch(() => {});
    }
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;
  const showNextUpBanner = nextEpisode && duration > 15 && duration - currentTime <= 20;

  return (
    <div
      ref={containerRef}
      onMouseMove={bumpControls}
      onKeyDown={(e) => {
        if (e.code === 'Space') {
          e.preventDefault();
          togglePlay();
        } else if (e.key === 'f' || e.key === 'F') {
          toggleFullscreen();
        } else if (e.key === 'm' || e.key === 'M') {
          toggleMute();
        } else if (e.key === 'ArrowRight') {
          seekBy(10);
        } else if (e.key === 'ArrowLeft') {
          seekBy(-10);
        }
      }}
      tabIndex={0}
      className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 select-none focus:outline-none group"
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        crossOrigin="anonymous"
        onClick={togglePlay}
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          setDuration(v.duration || 0);
          v.playbackRate = playbackRate;
          if (!hasResumed && initialTime > 5 && initialTime < (v.duration || 0) - 10) {
            v.currentTime = initialTime;
            setCurrentTime(initialTime);
            setHasResumed(true);
          }
        }}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          setCurrentTime(v.currentTime);
          if (v.buffered && v.buffered.length > 0) {
            setBuffered(v.buffered.end(v.buffered.length - 1));
          }
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          if (onProgressSync && duration > 0) {
            onProgressSync({
              progress: Math.floor(duration),
              duration: Math.floor(duration),
              completed: true,
            });
          }
        }}
        className="h-full w-full object-contain bg-black cursor-pointer"
      >
        <track
          kind="subtitles"
          src="/api/subtitles/sample.vtt"
          srcLang="en"
          label="English CC"
          default={subtitlesOn}
        />
      </video>

      {/* Center Play Overlay when paused */}
      {!playing && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label={`Play ${title}`}
          className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-[#E50914]/95 hover:bg-[#E50914] text-white flex items-center justify-center shadow-2xl transition-transform hover:scale-105"
        >
          <Play className="w-7 h-7 fill-current ml-0.5" />
        </button>
      )}

      {/* Next Episode Prompt */}
      {showNextUpBanner && onSelectNextEpisode && (
        <div className="absolute bottom-24 right-5 z-20 rounded-xl bg-[#111114]/95 backdrop-blur-md border border-white/15 p-4 max-w-xs shadow-2xl space-y-2">
          <p className="text-xs font-medium text-zinc-400">Up Next · Episode {nextEpisode.episodeNumber}</p>
          <p className="font-display text-sm font-semibold text-white truncate">{nextEpisode.title}</p>
          <button
            type="button"
            onClick={() => onSelectNextEpisode(nextEpisode)}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#E50914] hover:bg-[#c80812] text-white text-xs font-semibold transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
            Play Next Episode
          </button>
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-4 pt-10 pb-3 transition-opacity duration-200 ${
          showControls || !playing ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Seek bar */}
        <div className="relative flex items-center h-4 mb-2 group/seek">
          <div className="absolute inset-x-0 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white/35" style={{ width: `${bufferedPct}%` }} />
          </div>
          <div className="absolute left-0 h-1 bg-[#E50914] rounded-full pointer-events-none" style={{ width: `${progressPct}%` }} />
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.5}
            value={currentTime}
            onChange={handleSeekBar}
            aria-label="Seek video timeline"
            className="relative w-full appearance-none bg-transparent cursor-pointer accent-[#E50914]"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? 'Pause' : 'Play'}
              className="p-1.5 text-white hover:text-[#E50914] transition-colors"
            >
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            <button
              type="button"
              onClick={() => seekBy(-10)}
              aria-label="Rewind 10 seconds"
              className="p-1.5 text-zinc-300 hover:text-white transition-colors hidden sm:inline-flex"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => seekBy(10)}
              aria-label="Forward 10 seconds"
              className="p-1.5 text-zinc-300 hover:text-white transition-colors hidden sm:inline-flex"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? 'Unmute' : 'Mute'}
                className="p-1.5 text-zinc-200 hover:text-white transition-colors"
              >
                {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                aria-label="Volume control"
                className="w-16 sm:w-20 accent-[#E50914] cursor-pointer"
              />
            </div>

            <span className="text-xs font-mono tabular-nums text-zinc-300 ml-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 relative">
            {nextEpisode && onSelectNextEpisode && (
              <button
                type="button"
                onClick={() => onSelectNextEpisode(nextEpisode)}
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors"
              >
                <SkipForward className="w-3.5 h-3.5" />
                Next Ep
              </button>
            )}

            <button
              type="button"
              onClick={toggleSubtitles}
              aria-label="Toggle subtitles"
              className={`p-1.5 rounded-md transition-colors ${
                subtitlesOn ? 'text-[#E50914] bg-white/10' : 'text-zinc-300 hover:text-white'
              }`}
            >
              <Captions className="w-4 h-4" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setSettingsOpen((o) => !o)}
                aria-label="Playback settings"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono text-zinc-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">{quality}</span>
              </button>

              {settingsOpen && (
                <div className="absolute right-0 bottom-10 w-52 rounded-xl bg-[#111114]/95 backdrop-blur-md border border-white/15 p-3 shadow-2xl space-y-3 z-30">
                  <div>
                    <p className="text-[11px] font-medium text-zinc-400 mb-1.5">Playback Speed</p>
                    <div className="grid grid-cols-5 gap-1">
                      {[0.5, 1, 1.25, 1.5, 2].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => handleSpeedChange(r)}
                          className={`py-1 rounded text-xs font-mono ${
                            playbackRate === r
                              ? 'bg-[#E50914] text-white'
                              : 'bg-white/5 text-zinc-300 hover:bg-white/15'
                          }`}
                        >
                          {r}x
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-zinc-400 mb-1.5">Stream Quality</p>
                    <div className="grid grid-cols-3 gap-1">
                      {['1080p', '720p', '480p'].map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => {
                            setQuality(q);
                            setSettingsOpen(false);
                          }}
                          className={`py-1 rounded text-xs font-mono ${
                            quality === q
                              ? 'bg-[#E50914] text-white'
                              : 'bg-white/5 text-zinc-300 hover:bg-white/15'
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              className="p-1.5 text-zinc-200 hover:text-white transition-colors"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
