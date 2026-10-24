import React from 'react';
import { PlayerState, GameControls } from '../types/game';
import { Heart, Trophy, Flag, Volume2, VolumeX, Gauge } from 'lucide-react';

interface RacingHudProps {
  playerState: PlayerState;
  playerId: 'p1' | 'p2';
  isBattleMode: boolean;
  onControlChange: (key: keyof GameControls, active: boolean) => void;
  controls: GameControls;
  onToggleMute?: () => void;
  isMuted?: boolean;
  targetDistanceMeters?: number;
  totalQuestions?: number;
}

export const RacingHud: React.FC<RacingHudProps> = ({
  playerState,
  playerId,
  isBattleMode,
  onControlChange,
  controls,
  onToggleMute,
  isMuted,
  targetDistanceMeters = 3000,
  totalQuestions = 4,
}) => {
  const isP1 = playerId === 'p1';

  // In Battle mode, split horizontally: P1 on LEFT half, P2 on RIGHT half
  const battlePositionClass = isBattleMode
    ? isP1
      ? 'w-1/2 left-0 right-auto top-0 bottom-0'
      : 'w-1/2 left-1/2 right-0 top-0 bottom-0'
    : 'inset-0';

  return (
    <div className={`pointer-events-none absolute flex flex-col justify-between p-2.5 sm:p-4 select-none ${battlePositionClass}`}>
      {/* Top Status Bar with clearance for center dock */}
      <div className={`flex items-center justify-between w-full gap-2 ${isBattleMode && !isP1 ? 'pl-20 sm:pl-28' : isBattleMode && isP1 ? 'pr-20 sm:pr-28' : ''}`}>
        {/* Player Badge & Lives */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className={`pointer-events-auto px-2.5 py-1 rounded-lg border shadow-lg flex items-center gap-2 ${
            isP1 ? 'bg-slate-900/90 border-cyan-500/70 shadow-cyan-950/50' : 'bg-slate-900/90 border-amber-500/70 shadow-amber-950/50'
          }`}>
            <div
              className="w-3 h-3 rounded-full border border-white/60 shadow shrink-0"
              style={{ backgroundColor: playerState.car.primaryColor }}
            />
            <div className="flex flex-col">
              <span className={`text-[10px] font-black tracking-wider uppercase ${isP1 ? 'text-cyan-400' : 'text-amber-400'}`}>
                {isBattleMode ? (isP1 ? '◄ P1 (Kiri)' : 'P2 (Kanan) ►') : '🏎️ Pembalap'}
              </span>
              <span className="text-xs font-bold text-white truncate max-w-[90px] sm:max-w-[130px]">
                {playerState.name || 'Pembalap'}
              </span>
            </div>
          </div>

          {/* Lives (Nyawa) */}
          <div className="pointer-events-auto bg-slate-900/90 border border-slate-700/80 px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
            <span className="text-[9px] uppercase font-bold text-slate-400 hidden sm:inline">Nyawa:</span>
            {Array.from({ length: playerState.maxLives }).map((_, i) => (
              <Heart
                key={i}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-300 ${
                  i < playerState.lives
                    ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.8)] scale-100'
                    : 'text-slate-600 scale-90 opacity-40'
                }`}
              />
            ))}
          </div>

          {/* Solo Target Missions Indicator */}
          {!isBattleMode && (
            <div className="hidden md:flex items-center gap-2 bg-slate-900/90 border border-indigo-500/50 px-2.5 py-1 rounded-lg shadow-lg text-[11px]">
              <div className="flex items-center gap-1 text-cyan-300">
                <Flag className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-mono font-bold">{(playerState.distance / 1000).toFixed(1)} / {(targetDistanceMeters / 1000).toFixed(1)} KM</span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center gap-1 text-emerald-300">
                <span className="font-mono font-bold">Soal: {playerState.questionsAnswered} / {totalQuestions}</span>
              </div>
            </div>
          )}
        </div>

        {/* Score & Sound Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Score */}
          <div className="bg-slate-900/90 border border-slate-700/80 px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase font-bold text-slate-400">Poin</span>
              <span className="text-xs sm:text-sm font-black font-mono tracking-tight text-white tabular-nums">
                {playerState.score.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Sound Toggle (only shown on P1) */}
          {isP1 && onToggleMute && !isBattleMode && (
            <button
              onClick={onToggleMute}
              className="pointer-events-auto bg-slate-900/90 hover:bg-slate-800 border border-slate-700 p-2 rounded-lg text-slate-300 hover:text-white transition shadow-lg cursor-pointer"
              title={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          )}
        </div>
      </div>

      {/* Simplified Reflex Controls: Only Left (◄ KIRI) and Right (► KANAN), Car Auto-Accelerates */}
      <div className="flex items-end justify-between w-full px-1 pb-1">
        {/* Left Side: Steering Left Touch Button */}
        <div className="pointer-events-auto">
          <button
            onTouchStart={(e) => { e.preventDefault(); onControlChange('steerLeft', true); }}
            onTouchEnd={(e) => { e.preventDefault(); onControlChange('steerLeft', false); }}
            onMouseDown={() => onControlChange('steerLeft', true)}
            onMouseUp={() => onControlChange('steerLeft', false)}
            onMouseLeave={() => onControlChange('steerLeft', false)}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center font-black border-2 transition-all active:scale-95 shadow-2xl select-none cursor-pointer ${
              controls.steerLeft
                ? isP1
                  ? 'bg-cyan-500 text-slate-950 border-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.8)] scale-95'
                  : 'bg-amber-500 text-slate-950 border-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.8)] scale-95'
                : 'bg-slate-900/95 text-cyan-400 border-cyan-500/50 hover:bg-slate-800/95 hover:border-cyan-400'
            }`}
          >
            <span className="text-2xl sm:text-3xl leading-none">◄</span>
            <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase mt-0.5">KIRI</span>
          </button>
        </div>

        {/* Center: Digital Speedometer with Auto-Acceleration indicator */}
        <div className="flex flex-col items-center pb-0.5">
          <div className="bg-slate-900/95 border-2 border-slate-700/85 px-4 sm:px-6 py-2 rounded-2xl shadow-2xl flex flex-col items-center backdrop-blur-md">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight tabular-nums text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                {playerState.speed}
              </span>
              <span className="text-xs font-black text-cyan-400 uppercase tracking-widest">KM/H</span>
            </div>

            <div className="mt-1 flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>Jalan Otomatis</span>
            </div>
          </div>
        </div>

        {/* Right Side: Steering Right Touch Button */}
        <div className="pointer-events-auto">
          <button
            onTouchStart={(e) => { e.preventDefault(); onControlChange('steerRight', true); }}
            onTouchEnd={(e) => { e.preventDefault(); onControlChange('steerRight', false); }}
            onMouseDown={() => onControlChange('steerRight', true)}
            onMouseUp={() => onControlChange('steerRight', false)}
            onMouseLeave={() => onControlChange('steerRight', false)}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center font-black border-2 transition-all active:scale-95 shadow-2xl select-none cursor-pointer ${
              controls.steerRight
                ? isP1
                  ? 'bg-cyan-500 text-slate-950 border-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.8)] scale-95'
                  : 'bg-amber-500 text-slate-950 border-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.8)] scale-95'
                : 'bg-slate-900/95 text-cyan-400 border-cyan-500/50 hover:bg-slate-800/95 hover:border-cyan-400'
            }`}
          >
            <span className="text-2xl sm:text-3xl leading-none">►</span>
            <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase mt-0.5">KANAN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
