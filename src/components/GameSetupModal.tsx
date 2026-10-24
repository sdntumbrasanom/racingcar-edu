import React, { useState } from 'react';
import { GameMode, PlayerCarConfig, CarModelType, GameDifficulty } from '../types/game';
import { CAR_PRESETS, COLOR_OPTIONS } from '../game/carModels';
import { sheetService } from '../services/sheetService';
import { CarPreview3D } from './CarPreview3D';
import racingHeroBanner from '../assets/images/racing_hero_banner_1792809824995.jpg';
import {
  Car,
  KeyRound,
  CheckCircle2,
  X,
  Play,
  RotateCcw,
  FileSpreadsheet,
  ExternalLink,
  Gauge,
  Zap,
  Flame,
} from 'lucide-react';

interface GameSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (setup: {
    mode: GameMode;
    token: string;
    difficulty: GameDifficulty;
    p1Name: string;
    p1Car: PlayerCarConfig;
    p2Name?: string;
    p2Car?: PlayerCarConfig;
  }) => void;
  initialMode: GameMode;
  initialToken?: string;
  initialDifficulty?: GameDifficulty;
}

export const GameSetupModal: React.FC<GameSetupModalProps> = ({
  isOpen,
  onClose,
  onStartGame,
  initialMode,
  initialToken = 'BALAP-KILAT',
  initialDifficulty = 'medium',
}) => {
  const mode = initialMode;
  const [token, setToken] = useState<string>(initialToken);
  const [tokenInfo, setTokenInfo] = useState<{ title: string; teacherName: string; total: number } | null>(null);
  const [isValidatingToken, setIsValidatingToken] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<GameDifficulty>(initialDifficulty);

  // Player 1 configuration (Solo / Battle Layar Kiri)
  const [p1Name, setP1Name] = useState<string>(mode === 'solo' ? 'Pembalap Juara' : 'Pembalap 1 (Kiri)');
  const [p1Model, setP1Model] = useState<CarModelType>('f1');
  const [p1Color, setP1Color] = useState<string>('#dc2626');

  // Player 2 configuration (Battle Layar Kanan)
  const [p2Name, setP2Name] = useState<string>('Pembalap 2 (Kanan)');
  const [p2Model, setP2Model] = useState<CarModelType>('gt');
  const [p2Color, setP2Color] = useState<string>('#0284c7');

  // Tab for customization in Battle mode
  const [activeCarTab, setActiveCarTab] = useState<'p1' | 'p2'>('p1');

  // Validate token on change (with instant local check and remote cross-device Apps Script fallback)
  React.useEffect(() => {
    let isCancelled = false;
    const clean = token.trim().toUpperCase();
    if (!clean) {
      setTokenInfo(null);
      return;
    }

    // 1. Immediate local check
    const local = sheetService.getQuestionsByToken(clean);
    if (local) {
      setTokenInfo({
        title: local.title,
        teacherName: local.teacherName,
        total: local.questions.length,
      });
      return;
    }

    // 2. Query remote Google Apps Script database
    setIsValidatingToken(true);
    sheetService
      .getQuestionsByTokenAsync(clean)
      .then((res) => {
        if (isCancelled) return;
        setIsValidatingToken(false);
        if (res) {
          setTokenInfo({
            title: res.title,
            teacherName: res.teacherName,
            total: res.questions.length,
          });
        } else {
          setTokenInfo(null);
        }
      })
      .catch(() => {
        if (!isCancelled) setIsValidatingToken(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [token]);

  if (!isOpen) return null;

  const currentPresetP1 = CAR_PRESETS.find((p) => p.type === p1Model) || CAR_PRESETS[0];
  const currentPresetP2 = CAR_PRESETS.find((p) => p.type === p2Model) || CAR_PRESETS[1];

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();

    if (!tokenInfo) {
      alert('Kode Token Soal tidak valid! Silakan masukkan kode token yang benar atau pilih token bawaan.');
      return;
    }

    onStartGame({
      mode,
      token: token.trim().toUpperCase(),
      difficulty,
      p1Name: p1Name.trim() || (mode === 'solo' ? 'Pembalap' : 'Pembalap 1'),
      p1Car: {
        type: p1Model,
        name: currentPresetP1.name,
        primaryColor: p1Color,
        accentColor: COLOR_OPTIONS.find((c) => c.hex === p1Color)?.accent || '#ffffff',
      },
      ...(mode === 'battle'
        ? {
            p2Name: p2Name.trim() || 'Pembalap 2',
            p2Car: {
              type: p2Model,
              name: currentPresetP2.name,
              primaryColor: p2Color,
              accentColor: COLOR_OPTIONS.find((c) => c.hex === p2Color)?.accent || '#ffffff',
            },
          }
        : {}),
    });
  };

  const isConfiguringP1 = mode === 'solo' || activeCarTab === 'p1';
  const activeModel = isConfiguringP1 ? p1Model : p2Model;
  const activeColor = isConfiguringP1 ? p1Color : p2Color;
  const activeAccent = COLOR_OPTIONS.find((c) => c.hex === activeColor)?.accent || '#ffffff';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 overflow-hidden animate-in fade-in duration-200">
      {/* Fullscreen Racing Circuit Background for Preparation Page */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src={racingHeroBanner}
          alt="Racing Circuit Background"
          className="w-full h-full object-cover object-center filter brightness-[0.72] contrast-[1.15] scale-105"
        />
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[3px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/80" />
      </div>

      <div className="relative z-10 w-full max-w-4xl bg-slate-950/85 backdrop-blur-xl border-2 border-cyan-500/80 rounded-2xl shadow-[0_0_60px_rgba(6,182,212,0.4)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Subtle inner racetrack atmosphere overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-25">
          <img
            src={racingHeroBanner}
            alt=""
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/90" />
        </div>

        {/* Header */}
        <div className="relative z-10 bg-gradient-to-r from-cyan-950/90 via-slate-900/90 to-indigo-950/90 backdrop-blur-md px-5 sm:px-6 py-3.5 sm:py-4 border-b border-cyan-500/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow ${
              mode === 'solo' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-amber-500/20 border-amber-400 text-amber-300'
            }`}>
              {mode === 'solo' ? <Car className="w-6 h-6" /> : <span className="text-xl">⚔️</span>}
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-wider uppercase flex items-center gap-2">
                {mode === 'solo' ? '🏁 PERSIAPAN BALAPAN INDIVIDU' : '⚔️ PERSIAPAN BATTLE 2 PEMAIN'}
              </h2>
              <p className="text-xs text-slate-300">
                {mode === 'solo'
                  ? 'Atur nama pembalap, pilih & kustomisasi mobil 3D, dan masukkan kode token kuis guru'
                  : 'Atur Pembalap 1 (Layar Kiri) & Pembalap 2 (Layar Kanan), pilih mobil 3D, dan masukkan token kuis'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Kembali ke Menu Utama"
            className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border border-slate-700 shadow"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Menu Utama</span>
          </button>
        </div>

        {/* Form Container wrapping both scrollable body & footer */}
        <form onSubmit={handleStart} className="relative z-10 flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-5">
            {/* 1. Token Code from Teacher */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-cyan-400" /> Masukkan Kode Token Soal dari Guru
                </label>
                <span className="text-[11px] text-slate-400">
                  Diberikan oleh Guru untuk membuka soal kuis
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value.toUpperCase())}
                  placeholder="Masukkan Kode Token (contoh: GURU-4821)"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono font-bold text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-400 text-sm uppercase tracking-wider"
                />

                <div className="flex items-center gap-1.5 flex-wrap">
                  {['BALAP-KILAT', 'MAT-SMART', 'IPA-GENIUS', 'DEFAULT'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setToken(preset)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition border cursor-pointer ${
                        token === preset
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {isValidatingToken ? (
                <div className="mt-3 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-center gap-2 text-xs text-cyan-300">
                  <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Memeriksa token ke Database Google Spreadsheet / Apps Script...</span>
                </div>
              ) : tokenInfo ? (
                <div className="mt-3 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/60 flex items-center justify-between text-xs text-emerald-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>{tokenInfo.title}</strong> · Guru: {tokenInfo.teacherName}
                    </span>
                  </div>
                  <span className="font-mono font-bold bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700 text-emerald-200">
                    {tokenInfo.total} Soal Siap
                  </span>
                </div>
              ) : (
                <div className="mt-3 p-3 rounded-xl bg-amber-950/40 border border-amber-600/40 text-xs text-amber-300">
                  ⚠️ Token belum terdaftar. Masukkan token dari guru atau pilih paket soal di atas.
                </div>
              )}
            </div>

            {/* 2. Race Difficulty Selector (Easy, Medium, Hard) */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-amber-400" /> 2. Tingkat Kesulitan (Difficulty)
                </label>
                <span className="text-[11px] text-slate-400">
                  Mengatur kepadatan lalu lintas kompetitor & kecepatan mobil
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Easy */}
                <button
                  type="button"
                  onClick={() => setDifficulty('easy')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    difficulty === 'easy'
                      ? 'bg-emerald-950/70 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-black text-xs uppercase tracking-wide flex items-center gap-1.5 text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        🟢 Mudah
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-800">
                        Top ~260 km/h
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      Trafik lengang (28 mobil), laju santai. Cocok untuk siswa pemula.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Kepadatan:</span>
                    <span className="font-bold text-emerald-400">Lengang</span>
                  </div>
                </button>

                {/* Medium */}
                <button
                  type="button"
                  onClick={() => setDifficulty('medium')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    difficulty === 'medium'
                      ? 'bg-amber-950/70 border-amber-400 text-white shadow-[0_0_20px_rgba(245,158,11,0.35)] ring-1 ring-amber-400'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-black text-xs uppercase tracking-wide flex items-center gap-1.5 text-amber-400">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        🟡 Sedang
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-800">
                        Rekomendasi
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      Trafik seimbang (48 mobil), kecepatan s/d 315 km/h. Standar Grand Prix.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Kepadatan:</span>
                    <span className="font-bold text-amber-400">Standar</span>
                  </div>
                </button>

                {/* Hard */}
                <button
                  type="button"
                  onClick={() => setDifficulty('hard')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    difficulty === 'hard'
                      ? 'bg-rose-950/70 border-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.35)] ring-1 ring-rose-400'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-black text-xs uppercase tracking-wide flex items-center gap-1.5 text-rose-400">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        🔴 Sulit
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/90 text-rose-300 border border-rose-800">
                        Top ~360 km/h
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      Trafik padat & agresif (75 mobil), akselerasi kilat. Butuh refleks tinggi!
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Kepadatan:</span>
                    <span className="font-bold text-rose-400">Sangat Padat</span>
                  </div>
                </button>
              </div>
            </div>

            {/* 3. Live 3D Car Showroom Preview & Customization */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  3. Garasi & Model Mobil Balap 3D
                </label>
                {mode === 'battle' && (
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setActiveCarTab('p1')}
                      className={`px-3 py-1 text-xs font-bold rounded cursor-pointer ${
                        activeCarTab === 'p1' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ◄ Pemain 1 (Layar Kiri)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCarTab('p2')}
                      className={`px-3 py-1 text-xs font-bold rounded cursor-pointer ${
                        activeCarTab === 'p2' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Pemain 2 (Layar Kanan) ►
                    </button>
                  </div>
                )}
              </div>

              {/* 3D Model Interactive Turntable Viewport */}
              <div className="mb-4">
                <CarPreview3D
                  modelType={activeModel}
                  primaryColor={activeColor}
                  accentColor={activeAccent}
                />
              </div>

              {/* Customization Controls (P1 vs P2) */}
              {isConfiguringP1 ? (
                <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/40 flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">
                      Nama Pemain {mode === 'battle' ? '1 (Layar Kiri)' : ''}:
                    </label>
                    <input
                      type="text"
                      value={p1Name}
                      onChange={(e) => setP1Name(e.target.value)}
                      placeholder="Masukkan nama Anda..."
                      className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:outline-none focus:border-cyan-400 text-sm"
                    />
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-300 mb-2 block">
                      Pilih Model Mobil Balap:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {CAR_PRESETS.map((preset) => (
                        <button
                          key={preset.type}
                          type="button"
                          onClick={() => setP1Model(preset.type)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            p1Model === preset.type
                              ? 'bg-cyan-950/90 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white">{preset.name}</span>
                            <span className="text-[10px] text-cyan-400 font-mono">{preset.topSpeed} km/h</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{preset.subtitle}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-300 mb-2 block">
                      Pilih Warna Cat Balap (Livery):
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {COLOR_OPTIONS.map((col) => (
                        <button
                          key={col.hex}
                          type="button"
                          onClick={() => setP1Color(col.hex)}
                          title={col.name}
                          className={`w-9 h-9 rounded-xl border-2 transition-all flex items-center justify-center cursor-pointer ${
                            p1Color === col.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: col.hex }}
                        >
                          {p1Color === col.hex && <span className="text-white text-xs drop-shadow">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/80 p-4 rounded-xl border border-amber-500/40 flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">
                      Nama Pemain 2 (Layar Kanan):
                    </label>
                    <input
                      type="text"
                      value={p2Name}
                      onChange={(e) => setP2Name(e.target.value)}
                      placeholder="Masukkan nama pemain 2..."
                      className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:outline-none focus:border-amber-400 text-sm"
                    />
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-300 mb-2 block">
                      Pilih Model Mobil Balap Pemain 2:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {CAR_PRESETS.map((preset) => (
                        <button
                          key={preset.type}
                          type="button"
                          onClick={() => setP2Model(preset.type)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            p2Model === preset.type
                              ? 'bg-amber-950/90 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white">{preset.name}</span>
                            <span className="text-[10px] text-amber-400 font-mono">{preset.topSpeed} km/h</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{preset.subtitle}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-300 mb-2 block">
                      Pilih Warna Cat Balap Pemain 2:
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {COLOR_OPTIONS.map((col) => (
                        <button
                          key={col.hex}
                          type="button"
                          onClick={() => setP2Color(col.hex)}
                          title={col.name}
                          className={`w-9 h-9 rounded-xl border-2 transition-all flex items-center justify-center cursor-pointer ${
                            p2Color === col.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: col.hex }}
                        >
                          {p2Color === col.hex && <span className="text-white text-xs drop-shadow">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pinned Bottom Action Footer inside the Form */}
          <div className="p-3.5 sm:p-4 bg-slate-950/90 backdrop-blur-md border-t border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition cursor-pointer flex items-center gap-2 border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Kembali ke Menu Utama
            </button>
            <button
              type="submit"
              disabled={!tokenInfo}
              className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              {mode === 'solo' ? 'MULAI BALAPAN INDIVIDU! 🏁' : 'MULAI BATTLE 2 PEMAIN! ⚔️'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
