import React from 'react';
import { PlayerState, GameControls } from '../types/game';
import { Zap, Heart, Trophy, Flag, Volume2, VolumeX } from 'lucide-react';

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

      {/* Speedometer Cluster & Touch Controls (Bottom Dock) */}
      <div className="flex items-end justify-between w-full">
        {/* Left Side: Steering Touch Buttons */}
        <div className="pointer-events-auto flex items-center gap-1.5 pb-1">
          <button
            onTouchStart={(e) => { e.preventDefault(); onControlChange('steerLeft', true); }}
            onTouchEnd={(e) => { e.preventDefault(); onControlChange('steerLeft', false); }}
            onMouseDown={() => onControlChange('steerLeft', true)}
            onMouseUp={() => onControlChange('steerLeft', false)}
            onMouseLeave={() => onControlChange('steerLeft', false)}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex flex-col items-center justify-center font-bold border transition-all active:scale-95 shadow-lg select-none ${
              controls.steerLeft
                ? isP1 ? 'bg-cyan-500 text-slate-950 border-cyan-300' : 'bg-amber-500 text-slate-950 border-amber-300'
                : 'bg-slate-900/90 text-cyan-400 border-cyan-500/40 hover:bg-slate-800'
            }`}
          >
            <span className="text-xl leading-none">◄</span>
            <span className="text-[9px] uppercase tracking-wider">KIRI</span>
          </button>

          <button
            onTouchStart={(e) => { e.preventDefault(); onControlChange('steerRight', true); }}
            onTouchEnd={(e) => { e.preventDefault(); onControlChange('steerRight', false); }}
            onMouseDown={() => onControlChange('steerRight', true)}
            onMouseUp={() => onControlChange('steerRight', false)}
            onMouseLeave={() => onControlChange('steerRight', false)}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex flex-col items-center justify-center font-bold border transition-all active:scale-95 shadow-lg select-none ${
              controls.steerRight
                ? isP1 ? 'bg-cyan-500 text-slate-950 border-cyan-300' : 'bg-amber-500 text-slate-950 border-amber-300'
                : 'bg-slate-900/90 text-cyan-400 border-cyan-500/40 hover:bg-slate-800'
            }`}
          >
            <span className="text-xl leading-none">►</span>
            <span className="text-[9px] uppercase tracking-wider">KANAN</span>
          </button>
        </div>

        {/* Center: Speedometer & Nitro Bar */}
        <div className="flex flex-col items-center pb-1">
          <div className="bg-slate-900/95 border border-slate-700/80 px-2.5 sm:px-3 py-1.5 rounded-xl shadow-2xl flex flex-col items-center">
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight tabular-nums ${
                playerState.isNitroActive ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'text-white'
              }`}>
                {playerState.speed}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">KM/H</span>
            </div>

            <div className="w-20 sm:w-28 mt-0.5 flex flex-col gap-0.5">
              <div className="flex justify-between items-center text-[8px] font-bold uppercase tracking-wider">
                <span className="flex items-center gap-0.5 text-amber-400">
                  <Zap className="w-2 h-2 fill-amber-400" /> NITRO
                </span>
                <span className="text-slate-300 font-mono">{playerState.nitro}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-100"
                  style={{ width: `${playerState.nitro}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Nitro, Brake & Gas Touch Buttons */}
        <div className="pointer-events-auto flex items-center gap-1.5 pb-1">
          {/* Nitro */}
          <button
            onTouchStart={(e) => { e.preventDefault(); onControlChange('nitro', true); }}
            onTouchEnd={(e) => { e.preventDefault(); onControlChange('nitro', false); }}
            onMouseDown={() => onControlChange('nitro', true)}
            onMouseUp={() => onControlChange('nitro', false)}
            onMouseLeave={() => onControlChange('nitro', false)}
            className={`w-11 h-12 sm:w-12 sm:h-14 rounded-xl flex flex-col items-center justify-center font-bold border transition-all active:scale-95 shadow-lg select-none ${
              controls.nitro
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                : 'bg-slate-900/90 text-amber-400 border-amber-500/40 hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4 fill-current" />
            <span className="text-[8px] uppercase tracking-wider">NITRO</span>
          </button>

          {/* Brake */}
          <button
            onTouchStart={(e) => { e.preventDefault(); onControlChange('brake', true); }}
            onTouchEnd={(e) => { e.preventDefault(); onControlChange('brake', false); }}
            onMouseDown={() => onControlChange('brake', true)}
            onMouseUp={() => onControlChange('brake', false)}
            onMouseLeave={() => onControlChange('brake', false)}
            className={`w-11 h-12 sm:w-13 sm:h-14 rounded-xl flex flex-col items-center justify-center font-bold border transition-all active:scale-95 shadow-lg select-none ${
              controls.brake
                ? 'bg-rose-500 text-white border-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                : 'bg-slate-900/90 text-rose-400 border-rose-500/40 hover:bg-slate-800'
            }`}
          >
            <span className="text-xl leading-none">▼</span>
            <span className="text-[9px] uppercase tracking-wider">REM</span>
          </button>

          {/* Gas */}
          <button
            onTouchStart={(e) => { e.preventDefault(); onControlChange('accelerate', true); }}
            onTouchEnd={(e) => { e.preventDefault(); onControlChange('accelerate', false); }}
            onMouseDown={() => onControlChange('accelerate', true)}
            onMouseUp={() => onControlChange('accelerate', false)}
            onMouseLeave={() => onControlChange('accelerate', false)}
            className={`w-13 h-12 sm:w-16 sm:h-14 rounded-xl flex flex-col items-center justify-center font-bold border transition-all active:scale-95 shadow-lg select-none ${
              controls.accelerate
                ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.8)]'
                : 'bg-emerald-950/80 text-emerald-400 border-emerald-500/60 hover:bg-emerald-900'
            }`}
          >
            <span className="text-xl leading-none">▲</span>
            <span className="text-[10px] font-black uppercase tracking-wider">GAS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
