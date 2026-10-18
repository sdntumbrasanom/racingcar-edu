import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameMode, PlayerState } from '../types/game';
import { leaderboardService } from '../services/leaderboardService';
import {
  Trophy,
  Share2,
  RotateCcw,
  Award,
  Flame,
  CheckCircle2,
  Gauge,
  Flag,
  HeartCrack,
  Swords,
} from 'lucide-react';

import { sheetService } from '../services/sheetService';

interface GameOverModalProps {
  mode: GameMode;
  token: string;
  p1: PlayerState;
  p2?: PlayerState;
  winnerName?: string;
  onRestart: () => void;
  onOpenLeaderboard: () => void;
  onBackToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  mode,
  token,
  p1,
  p2,
  winnerName,
  onRestart,
  onOpenLeaderboard,
  onBackToMenu,
}) => {
  const isSolo = mode === 'solo';

  // Retrieve teacher details for this room/token
  const roomData = sheetService.getQuestionsByToken(token);
  const teacherName = roomData?.teacherName || 'Bapak/Ibu Guru';
  const teacherPhone = roomData?.teacherPhone || '';

  // Clean and format phone for WhatsApp wa.me link
  const formatWaPhone = (rawPhone: string): string => {
    let clean = rawPhone.replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    return clean;
  };

  const cleanPhone = formatWaPhone(teacherPhone);

  // Automatically save results to leaderboard and trigger confetti
  useEffect(() => {
    // Confetti celebration if high score or won
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    // Save P1 record
    const p1Acc = p1.questionsAnswered > 0 ? Math.round((p1.correctAnswers / p1.questionsAnswered) * 100) : 100;
    leaderboardService.addEntry({
      playerName: p1.name,
      token,
      mode,
      score: p1.score,
      maxSpeedKmH: p1.car.type === 'f1' ? 318 : 295,
      accuracy: p1Acc,
      timeSec: Math.max(30, Math.floor(p1.distance / 12)),
      carModel: p1.car.name,
      carColor: p1.car.primaryColor,
    });

    // Save P2 record if battle
    if (mode === 'battle' && p2) {
      const p2Acc = p2.questionsAnswered > 0 ? Math.round((p2.correctAnswers / p2.questionsAnswered) * 100) : 100;
      leaderboardService.addEntry({
        playerName: p2.name,
        token,
        mode,
        score: p2.score,
        maxSpeedKmH: 290,
        accuracy: p2Acc,
        timeSec: Math.max(30, Math.floor(p2.distance / 12)),
        carModel: p2.car.name,
        carColor: p2.car.primaryColor,
      });
    }
  }, []);

  const handleShareWhatsApp = (player: PlayerState) => {
    const accuracy = player.questionsAnswered > 0 ? Math.round((player.correctAnswers / player.questionsAnswered) * 100) : 100;
    const msg = `🏁 *LAPORAN HASIL BALAPAN KUIS EDUKASI* 🏁\n\nYth. ${teacherName},\nBerikut adalah hasil kuis balap mobil edukasi saya:\n\n👤 *Nama Siswa:* ${player.name}\n🏷️ *Kode Token Soal:* ${token}\n🎮 *Mode:* ${isSolo ? 'Individu (Solo)' : 'Battle (2 Pemain)'}\n⭐ *Skor Akhir:* ${player.score.toLocaleString()} Poin\n🎯 *Soal Terjawab:* ${player.correctAnswers} dari ${player.questionsAnswered} Soal (${accuracy}%)\n🏎️ *Mobil:* ${player.car.name}\n🏁 *Jarak Tempuh:* ${(player.distance / 1000).toFixed(2)} KM (${player.distance} meter)\n\nDilaporkan secara otomatis dari Game Apex Racer Edukasi. Terima kasih! 🏆`;

    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-amber-500/80 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.3)] overflow-hidden flex flex-col">
        {/* Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 p-6 text-center text-slate-950 relative">
          <div className="w-16 h-16 rounded-2xl bg-slate-950/20 backdrop-blur border border-white/40 mx-auto flex items-center justify-center mb-2 shadow-xl">
            {isSolo ? (
              p1.lives <= 0 ? <HeartCrack className="w-10 h-10 text-white" /> : <Trophy className="w-10 h-10 text-amber-200" />
            ) : (
              <Swords className="w-10 h-10 text-white" />
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white drop-shadow">
            {isSolo
              ? p1.lives <= 0
                ? 'GAME OVER! BALAPAN SELESAI'
                : 'FINISH! MISI SELESAI'
              : `JUARA: ${winnerName || 'Pemenang'}! 🏆`}
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-amber-100 mt-1">
            {isSolo
              ? 'Luar biasa! Jangan lupa laporkan skor dan jawaban Anda ke Guru.'
              : 'Pertarungan sengit! Nilai ditentukan dari perolehan poin terbanyak.'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5">
          {/* Solo View */}
          {isSolo ? (
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full border border-white/60"
                    style={{ backgroundColor: p1.car.primaryColor }}
                  />
                  <div>
                    <h3 className="font-bold text-base text-white">{p1.name}</h3>
                    <p className="text-xs text-slate-400">{p1.car.name} · Token: {token}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Total Skor</span>
                  <p className="text-2xl font-black font-mono text-amber-400">{p1.score.toLocaleString()}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Soal Benar</span>
                  <span className="text-lg font-bold text-emerald-400">{p1.correctAnswers} / {p1.questionsAnswered}</span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Jarak Ditempuh</span>
                  <span className="text-lg font-bold text-cyan-400">{p1.distance}m</span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Sisa Nyawa</span>
                  <span className="text-lg font-bold text-rose-400">{p1.lives} / {p1.maxLives}</span>
                </div>
              </div>

              {/* Primary WhatsApp Action */}
              <button
                onClick={() => handleShareWhatsApp(p1)}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer"
              >
                <Share2 className="w-5 h-5 shrink-0" />
                <span>
                  Kirim Hasil ke WhatsApp {teacherName ? teacherName : 'Guru'} {teacherPhone ? `(${teacherPhone})` : ''} 📲
                </span>
              </button>
            </div>
          ) : (
            /* Battle View: 2 Players Comparison */
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Player 1 Card */}
                <div className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                  p1.score >= (p2?.score || 0)
                    ? 'bg-amber-950/40 border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                    : 'bg-slate-950/60 border-slate-800'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-cyan-500 text-slate-950">
                        Pemain 1
                      </span>
                      {p1.score >= (p2?.score || 0) && (
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                          👑 WINNER
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-base text-white">{p1.name}</h4>
                    <p className="text-xs text-slate-400">{p1.car.name}</p>
                    <div className="mt-3 text-2xl font-black font-mono text-cyan-300">
                      {p1.score.toLocaleString()} <span className="text-xs text-slate-400 font-sans">Poin</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Kuis: {p1.correctAnswers} benar dari {p1.questionsAnswered} soal
                    </p>
                  </div>
                  <button
                    onClick={() => handleShareWhatsApp(p1)}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" /> WA Guru (Pemain 1)
                  </button>
                </div>

                {/* Player 2 Card */}
                {p2 && (
                  <div className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                    p2.score > p1.score
                      ? 'bg-amber-950/40 border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                          Pemain 2
                        </span>
                        {p2.score > p1.score && (
                          <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                            👑 WINNER
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-base text-white">{p2.name}</h4>
                      <p className="text-xs text-slate-400">{p2.car.name}</p>
                      <div className="mt-3 text-2xl font-black font-mono text-amber-300">
                        {p2.score.toLocaleString()} <span className="text-xs text-slate-400 font-sans">Poin</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Kuis: {p2.correctAnswers} benar dari {p2.questionsAnswered} soal
                      </p>
                    </div>
                    <button
                      onClick={() => handleShareWhatsApp(p2)}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" /> WA Guru (Pemain 2)
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={onBackToMenu}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              Menu Utama
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenLeaderboard}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Award className="w-4 h-4" /> Leaderboard Dunia
              </button>
              <button
                onClick={onRestart}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow"
              >
                <RotateCcw className="w-4 h-4" /> Main Lagi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
