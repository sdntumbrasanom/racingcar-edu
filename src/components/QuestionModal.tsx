import React, { useState, useEffect } from 'react';
import { Question, GameMode } from '../types/game';
import { sound } from '../services/soundService';
import { HelpCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface QuestionModalProps {
  question: Question;
  playerId: 'p1' | 'p2';
  playerName: string;
  mode: GameMode;
  onAnswer: (isCorrect: boolean) => void;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  question,
  playerId,
  playerName,
  mode,
  onAnswer,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(15);

  const isSolo = mode === 'solo';
  const isP1 = playerId === 'p1';

  // Countdown timer
  useEffect(() => {
    if (isAnswered) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSelect(null); // Time out = wrong
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isAnswered]);

  const handleSelect = (option: string | null) => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedOption(option);

    const correct =
      option !== null &&
      option.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
    setIsCorrect(correct);

    if (correct) {
      sound.playCorrectAnswer();
    } else {
      sound.playWrongAnswer();
    }

    // Delay briefly so the student sees their feedback, then returns to driving
    setTimeout(() => {
      onAnswer(correct);
    }, 1400);
  };

  // Determine split screen container wrapper
  // In Battle: P1 is anchored strictly to LEFT HALF (0 to 50%), P2 to RIGHT HALF (50% to 100%)
  // This ensures the other player's half of the screen is 100% uncovered and unhindered!
  let containerPositionClasses =
    'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none pointer-events-auto';

  if (!isSolo) {
    if (isP1) {
      containerPositionClasses =
        'absolute top-0 bottom-0 left-0 w-1/2 z-40 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs select-none pointer-events-auto border-r border-cyan-500/30';
    } else {
      containerPositionClasses =
        'absolute top-0 bottom-0 left-1/2 right-0 w-1/2 z-40 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs select-none pointer-events-auto border-l border-amber-500/30';
    }
  }

  const badgeColor = isP1
    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
    : 'bg-amber-500 text-slate-950 border-amber-400';

  const borderColor = isP1 ? 'border-cyan-500/80' : 'border-amber-500/80';
  const shadowGlow = isP1
    ? 'shadow-[0_0_40px_rgba(6,182,212,0.45)]'
    : 'shadow-[0_0_40px_rgba(245,158,11,0.45)]';

  return (
    <div className={containerPositionClasses}>
      <div
        className={`w-full max-w-lg bg-slate-900/95 border-2 ${borderColor} rounded-2xl ${shadowGlow} overflow-hidden flex flex-col max-h-[95vh] shadow-2xl animate-in zoom-in-95 duration-200`}
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow shrink-0">
              <HelpCircle className="w-5 h-5 animate-bounce" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`text-[10px] sm:text-xs font-black tracking-widest uppercase px-2 py-0.5 rounded border ${badgeColor}`}
                >
                  {isSolo ? 'BONUS KUIS' : isP1 ? 'P1 • LAYAR KIRI' : 'P2 • LAYAR KANAN'}
                </span>
                {!isSolo && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/60 text-emerald-300">
                    🛡️ Acak (Anti-Contek)
                  </span>
                )}
                <span className="text-xs font-bold text-slate-200 truncate">
                  {playerName}
                </span>
              </div>
              <h3 className="text-xs text-slate-300 mt-0.5 truncate">
                {isSolo
                  ? 'Jawab Benar: +1 Nyawa & +150 Skor!'
                  : 'Jawab Benar: +100 Poin Balap!'}
              </h3>
            </div>
          </div>

          {/* Countdown Timer Badge */}
          <div className="flex items-center gap-1 bg-slate-950/90 px-2.5 py-1 rounded-lg border border-slate-700 shrink-0">
            <Clock
              className={`w-3.5 h-3.5 ${
                timeLeft <= 5 ? 'text-rose-400 animate-pulse' : 'text-amber-400'
              }`}
            />
            <span
              className={`font-mono font-black text-xs sm:text-sm ${
                timeLeft <= 5 ? 'text-rose-400' : 'text-white'
              }`}
            >
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Linear Timer Bar */}
        <div className="w-full h-1.5 bg-slate-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              timeLeft <= 5
                ? 'bg-rose-500'
                : isP1
                ? 'bg-gradient-to-r from-cyan-400 to-indigo-500'
                : 'bg-gradient-to-r from-amber-400 to-rose-500'
            }`}
            style={{ width: `${(timeLeft / 15) * 100}%` }}
          />
        </div>

        {/* Question & Options Content */}
        <div className="p-4 sm:p-5 flex flex-col gap-3.5 overflow-y-auto">
          {/* Question Box */}
          <div className="bg-slate-950/90 p-3 sm:p-4 rounded-xl border border-slate-800">
            <p className="text-sm sm:text-base font-bold text-slate-100 leading-snug">
              {question.text}
            </p>
          </div>

          {/* Options (A, B, C, D) */}
          <div className="grid grid-cols-1 gap-2 sm:gap-2.5">
            {question.options.map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const isSelected = selectedOption === opt;
              const isOptionCorrect =
                opt.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();

              let btnStyle =
                'bg-slate-800/80 border-slate-700 hover:border-cyan-400 hover:bg-slate-800 text-slate-200';
              if (isAnswered) {
                if (isOptionCorrect) {
                  btnStyle =
                    'bg-emerald-600/90 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]';
                } else if (isSelected && !isCorrect) {
                  btnStyle = 'bg-rose-600/90 border-rose-400 text-white';
                } else {
                  btnStyle = 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(opt)}
                  disabled={isAnswered}
                  className={`p-2.5 sm:p-3 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer text-left font-medium active:scale-98 ${btnStyle}`}
                >
                  <span
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black text-xs sm:text-sm shrink-0 border ${
                      isSelected
                        ? 'bg-white text-slate-950 border-white'
                        : 'bg-slate-900 border-slate-600 text-slate-300'
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold flex-1 leading-snug break-words">
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Answer Feedback Banner */}
          {isAnswered && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2.5 animate-in zoom-in-95 duration-200 ${
                isCorrect
                  ? 'bg-emerald-950/95 border-emerald-500 text-emerald-200'
                  : 'bg-rose-950/95 border-rose-500 text-rose-200'
              }`}
            >
              {isCorrect ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
              )}
              <div className="flex flex-col min-w-0">
                <span className="font-black text-xs sm:text-sm uppercase tracking-wide">
                  {isCorrect ? 'Luar Biasa! Jawaban Benar! 🏁' : 'Jawaban Kurang Tepat! ⚠️'}
                </span>
                <span className="text-[11px] sm:text-xs">
                  {isCorrect
                    ? isSolo
                      ? 'Kamu mendapatkan +1 Nyawa dan +150 Skor!'
                      : '+100 Poin berhasil diraih!'
                    : `Jawaban benar: "${question.correctAnswer}". Lanjut balap!`}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
