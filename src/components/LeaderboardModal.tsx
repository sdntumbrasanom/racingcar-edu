import React, { useState } from 'react';
import { leaderboardService } from '../services/leaderboardService';
import { LeaderboardEntry, GameMode } from '../types/game';
import {
  Trophy,
  Medal,
  Flame,
  Gauge,
  CheckCircle2,
  X,
  Filter,
  Globe,
  Award,
} from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTokenFilter?: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  initialTokenFilter = 'ALL',
}) => {
  const [tokenFilter, setTokenFilter] = useState<string>(initialTokenFilter);
  const [modeFilter, setModeFilter] = useState<GameMode | 'all'>('all');

  if (!isOpen) return null;

  const entries: LeaderboardEntry[] = leaderboardService.getFilteredEntries(tokenFilter, modeFilter);
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  // Available tokens for filter
  const allTokens = Array.from(new Set(leaderboardService.getEntries().map((e) => e.token)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-900 border-2 border-amber-500/70 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.3)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950/90 via-slate-800 to-indigo-950/90 px-6 py-4 border-b border-amber-500/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 shadow">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-wider uppercase flex items-center gap-2">
                PAPAN PERINGKAT DUNIA (LEADERBOARD)
              </h2>
              <p className="text-xs text-slate-300">
                Pembalap tercepat dan peraih skor tertinggi dari seluruh dunia
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Mode Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setModeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                modeFilter === 'all' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua Mode
            </button>
            <button
              onClick={() => setModeFilter('solo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                modeFilter === 'solo' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Individu (Solo)
            </button>
            <button
              onClick={() => setModeFilter('battle')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                modeFilter === 'battle' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Battle 2P
            </button>
          </div>

          {/* Token Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-amber-400" /> Filter Token:
            </span>
            <select
              value={tokenFilter}
              onChange={(e) => setTokenFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-400"
            >
              <option value="ALL">Semua Token (Global)</option>
              {allTokens.map((tok) => (
                <option key={tok} value={tok}>
                  Token: {tok}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Top 3 Podium (if available) */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Silver: Rank 2 */}
              {top3[1] && (
                <div className="bg-slate-950/80 border border-slate-700 rounded-2xl p-4 flex flex-col items-center text-center order-2 sm:order-1 sm:mt-4 shadow-lg">
                  <div className="w-10 h-10 rounded-full bg-slate-400/20 text-slate-200 border-2 border-slate-400 flex items-center justify-center font-black text-sm mb-2 shadow">
                    🥈 2
                  </div>
                  <h4 className="font-black text-sm text-white truncate max-w-full">{top3[1].playerName}</h4>
                  <p className="text-[11px] text-slate-400">{top3[1].carModel}</p>
                  <span className="mt-2 text-xl font-black font-mono text-slate-200">{top3[1].score.toLocaleString()}</span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                    <span>{top3[1].maxSpeedKmH} KM/H</span> · <span>Akurasi {top3[1].accuracy}%</span>
                  </div>
                </div>
              )}

              {/* Gold: Rank 1 */}
              {top3[0] && (
                <div className="bg-amber-950/40 border-2 border-amber-400/80 rounded-2xl p-5 flex flex-col items-center text-center order-1 sm:order-2 shadow-[0_0_30px_rgba(245,158,11,0.25)] relative">
                  <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                    👑 JUARA 1 DUNIA
                  </div>
                  <div className="w-12 h-12 rounded-full bg-amber-500/30 text-amber-300 border-2 border-amber-400 flex items-center justify-center font-black text-lg mb-2 shadow-lg mt-1">
                    🥇 1
                  </div>
                  <h4 className="font-black text-base text-amber-200 truncate max-w-full">{top3[0].playerName}</h4>
                  <p className="text-xs text-amber-300/80">{top3[0].carModel}</p>
                  <span className="mt-2 text-2xl font-black font-mono text-amber-400">{top3[0].score.toLocaleString()}</span>
                  <div className="flex items-center gap-2 text-xs text-amber-200/80 mt-1 font-semibold">
                    <span>{top3[0].maxSpeedKmH} KM/H</span> · <span>Akurasi {top3[0].accuracy}%</span>
                  </div>
                </div>
              )}

              {/* Bronze: Rank 3 */}
              {top3[2] && (
                <div className="bg-slate-950/80 border border-amber-700/60 rounded-2xl p-4 flex flex-col items-center text-center order-3 sm:order-3 sm:mt-6 shadow-lg">
                  <div className="w-10 h-10 rounded-full bg-amber-700/20 text-amber-500 border-2 border-amber-600 flex items-center justify-center font-black text-sm mb-2 shadow">
                    🥉 3
                  </div>
                  <h4 className="font-black text-sm text-white truncate max-w-full">{top3[2].playerName}</h4>
                  <p className="text-[11px] text-slate-400">{top3[2].carModel}</p>
                  <span className="mt-2 text-xl font-black font-mono text-amber-500">{top3[2].score.toLocaleString()}</span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                    <span>{top3[2].maxSpeedKmH} KM/H</span> · <span>Akurasi {top3[2].accuracy}%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full Table */}
          <div className="bg-slate-950/90 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Peringkat</th>
                    <th className="py-3 px-4">Nama Pemain</th>
                    <th className="py-3 px-4">Mobil</th>
                    <th className="py-3 px-4">Token</th>
                    <th className="py-3 px-4 text-right">Top Speed</th>
                    <th className="py-3 px-4 text-right">Akurasi</th>
                    <th className="py-3 px-4 text-right">Skor Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs font-medium">
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Belum ada catatan skor untuk filter ini. Mainkan balapan sekarang!
                      </td>
                    </tr>
                  ) : (
                    entries.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg font-bold font-mono text-xs ${
                            idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                          }`}>
                            #{idx + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-white">
                          {item.playerName}
                        </td>
                        <td className="py-3 px-4 text-slate-300 flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.carColor }} />
                          <span className="truncate max-w-[140px]">{item.carModel}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded text-cyan-300 border border-slate-700">
                            {item.token}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-cyan-400">
                          {item.maxSpeedKmH} km/h
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-400">
                          {item.accuracy}%
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-amber-400 text-sm">
                          {item.score.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
