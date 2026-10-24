import React, { useState, useEffect, useRef } from 'react';
import { GameMode, PlayerState, GameControls, Question, PlayerCarConfig, WeatherType, GameDifficulty } from './types/game';
import { CAR_PRESETS } from './game/carModels';
import { sheetService } from './services/sheetService';
import { sound } from './services/soundService';
import { RacingCanvas } from './game/RacingCanvas';
import racingHeroBanner from './assets/images/racing_hero_banner_1792809824995.jpg';
import { RacingHud } from './components/RacingHud';
import { QuestionModal } from './components/QuestionModal';
import { TeacherPortalModal } from './components/TeacherPortalModal';
import { GameSetupModal } from './components/GameSetupModal';
import { GameOverModal } from './components/GameOverModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import {
  Trophy,
  GraduationCap,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Swords,
  Maximize,
  Minimize,
  Sun,
  Cloud,
} from 'lucide-react';

const TARGET_DISTANCE_METERS = 3000; // 3.0 KM track target

export default function App() {
  // Screen views: 'title' | 'playing'
  const [gameState, setGameState] = useState<'title' | 'playing'>('title');

  // Modals state
  const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
  const [showTeacherModal, setShowTeacherModal] = useState<boolean>(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(false);
  const [showGameOverModal, setShowGameOverModal] = useState<boolean>(false);

  // Weather state (Cerah vs Mendung)
  const [weather, setWeather] = useState<WeatherType>('cerah');

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Countdown state before race start: 3, 2, 1, GO!
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout[]>([]);

  // Independent question challenge state for Player 1 & Player 2
  // In Battle mode: if P1 gets a question, it stays on P1's screen and DOES NOT block P2!
  const [p1Question, setP1Question] = useState<Question | null>(null);
  const [p2Question, setP2Question] = useState<Question | null>(null);

  // Separate randomized question decks for P1 and P2 (anti-cheat in Battle mode)
  const p1DeckRef = useRef<Question[]>([]);
  const p2DeckRef = useRef<Question[]>([]);

  // Sound state
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());

  // Game configuration
  const [gameMode, setGameMode] = useState<GameMode>('solo');
  const [difficulty, setDifficulty] = useState<GameDifficulty>('medium');
  const [activeToken, setActiveToken] = useState<string>('BALAP-KILAT');
  const [questionBank, setQuestionBank] = useState<Question[]>([]);
  const [winnerName, setWinnerName] = useState<string | undefined>();

  // Player 1 State
  const [p1State, setP1State] = useState<PlayerState>({
    id: 'p1',
    name: 'Pembalap 1',
    car: {
      type: 'f1',
      name: 'Apex Formula F1',
      primaryColor: '#dc2626',
      accentColor: '#ffffff',
    },
    lives: 3,
    maxLives: 3,
    score: 0,
    distance: 0,
    speed: 0,
    nitro: 100,
    isNitroActive: false,
    isInvulnerable: false,
    invulnerableTimer: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    isGameOver: false,
    position: { x: 0, y: 0, z: 0 },
    steerAngle: 0,
  });

  // Player 2 State (Battle mode)
  const [p2State, setP2State] = useState<PlayerState>({
    id: 'p2',
    name: 'Pembalap 2',
    car: {
      type: 'gt',
      name: 'Viper GT3 Supercar',
      primaryColor: '#0284c7',
      accentColor: '#f97316',
    },
    lives: 3,
    maxLives: 3,
    score: 0,
    distance: 0,
    speed: 0,
    nitro: 100,
    isNitroActive: false,
    isInvulnerable: false,
    invulnerableTimer: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    isGameOver: false,
    position: { x: 0, y: 0, z: 0 },
    steerAngle: 0,
  });

  // Active Key Controls
  const [p1Controls, setP1Controls] = useState<GameControls>({
    steerLeft: false,
    steerRight: false,
    accelerate: false,
    brake: false,
    nitro: false,
  });

  const [p2Controls, setP2Controls] = useState<GameControls>({
    steerLeft: false,
    steerRight: false,
    accelerate: false,
    brake: false,
    nitro: false,
  });

  // Load question bank on token change
  useEffect(() => {
    const qData = sheetService.getQuestionsByToken(activeToken);
    if (qData) {
      setQuestionBank(qData.questions);
    }
  }, [activeToken]);

  // Global Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      // Player 1 controls (Solo: ArrowLeft / A for left, ArrowRight / D for right)
      if (gameMode === 'solo') {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          setP1Controls((c: GameControls) => ({ ...c, steerLeft: true }));
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          setP1Controls((c: GameControls) => ({ ...c, steerRight: true }));
        }
      } else {
        // Battle mode: P1 uses A / D, P2 uses ArrowLeft / ArrowRight
        if (e.key === 'a' || e.key === 'A') {
          setP1Controls((c: GameControls) => ({ ...c, steerLeft: true }));
        } else if (e.key === 'd' || e.key === 'D') {
          setP1Controls((c: GameControls) => ({ ...c, steerRight: true }));
        }

        if (e.key === 'ArrowLeft') {
          setP2Controls((c: GameControls) => ({ ...c, steerLeft: true }));
        } else if (e.key === 'ArrowRight') {
          setP2Controls((c: GameControls) => ({ ...c, steerRight: true }));
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameMode === 'solo') {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          setP1Controls((c: GameControls) => ({ ...c, steerLeft: false }));
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          setP1Controls((c: GameControls) => ({ ...c, steerRight: false }));
        }
      } else {
        if (e.key === 'a' || e.key === 'A') {
          setP1Controls((c: GameControls) => ({ ...c, steerLeft: false }));
        } else if (e.key === 'd' || e.key === 'D') {
          setP1Controls((c: GameControls) => ({ ...c, steerRight: false }));
        }

        if (e.key === 'ArrowLeft') {
          setP2Controls((c: GameControls) => ({ ...c, steerLeft: false }));
        } else if (e.key === 'ArrowRight') {
          setP2Controls((c: GameControls) => ({ ...c, steerRight: false }));
        }
      }
    };

    // Clear held keys on window blur
    const handleBlur = () => {
      setP1Controls({ steerLeft: false, steerRight: false, accelerate: false, brake: false, nitro: false });
      setP2Controls({ steerLeft: false, steerRight: false, accelerate: false, brake: false, nitro: false });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameMode]);

  // Monitor fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.warn('Fullscreen request failed:', err);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.warn('Exit fullscreen failed:', err);
        });
      }
    }
  };

  // Handle Game Setup submission
  const handleStartRace = (setup: {
    mode: GameMode;
    token: string;
    difficulty: GameDifficulty;
    p1Name: string;
    p1Car: PlayerCarConfig;
    p2Name?: string;
    p2Car?: PlayerCarConfig;
  }) => {
    setGameMode(setup.mode);
    setActiveToken(setup.token);
    setDifficulty(setup.difficulty);

    const qData = sheetService.getQuestionsByToken(setup.token);
    const questions = qData ? qData.questions : [];
    setQuestionBank(questions);

    // Initialize independent randomized question decks for P1 and P2 (anti-cheat)
    p1DeckRef.current = sheetService.shuffleArray([...questions]);
    p2DeckRef.current = sheetService.shuffleArray([...questions]);

    setP1State((prev: PlayerState) => ({
      ...prev,
      name: setup.p1Name,
      car: setup.p1Car,
      lives: 3,
      score: 0,
      distance: 0,
      speed: 0,
      nitro: 100,
      questionsAnswered: 0,
      correctAnswers: 0,
      isGameOver: false,
    }));

    if (setup.mode === 'battle' && setup.p2Name && setup.p2Car) {
      setP2State((prev: PlayerState) => ({
        ...prev,
        name: setup.p2Name!,
        car: setup.p2Car!,
        lives: 3,
        score: 0,
        distance: 0,
        speed: 0,
        nitro: 100,
        questionsAnswered: 0,
        correctAnswers: 0,
        isGameOver: false,
      }));
    }

    setP1Question(null);
    setP2Question(null);
    setShowSetupModal(false);
    setShowGameOverModal(false);
    setGameState('playing');

    // Arcade Countdown Sequence: 3, 2, 1, GO!
    countdownTimerRef.current.forEach(clearTimeout);
    countdownTimerRef.current = [];
    setCountdownValue(3);
    sound.playCountdownBeep(false);

    const t1 = setTimeout(() => {
      setCountdownValue(2);
      sound.playCountdownBeep(false);
    }, 1000);

    const t2 = setTimeout(() => {
      setCountdownValue(1);
      sound.playCountdownBeep(false);
    }, 2000);

    const t3 = setTimeout(() => {
      setCountdownValue(0); // 0 = GO!
      sound.playCountdownBeep(true);
    }, 3000);

    const t4 = setTimeout(() => {
      setCountdownValue(null); // Active race begins!
    }, 3900);

    countdownTimerRef.current = [t1, t2, t3, t4];
  };

  // Trigger bonus question popup for either P1 or P2 with anti-cheat randomization
  // In Battle mode: both question sequence and option letters A, B, C, D are randomized independently!
  const handleTriggerQuestion = (playerId: 'p1' | 'p2', orbIndex: number) => {
    if (questionBank.length === 0) return;

    if (gameMode === 'battle') {
      const deckRef = playerId === 'p1' ? p1DeckRef : p2DeckRef;
      if (deckRef.current.length === 0) {
        deckRef.current = sheetService.shuffleArray([...questionBank]);
      }
      const rawQ = deckRef.current.shift() || questionBank[orbIndex % questionBank.length];
      // Crucial: freshly randomize option positions (A, B, C, D) so opponents cannot copy choices!
      const randomizedQ = sheetService.createRandomizedQuestion(rawQ);

      if (playerId === 'p1') {
        setP1Question(randomizedQ);
      } else {
        setP2Question(randomizedQ);
      }
    } else {
      // Solo mode: also randomize options dynamically
      const rawQ = questionBank[orbIndex % questionBank.length];
      const randomizedQ = sheetService.createRandomizedQuestion(rawQ);
      setP1Question(randomizedQ);
    }
  };

  // When Player 1 answers a question (Solo or Battle Layar Kiri)
  const handleAnswerResultP1 = (isCorrect: boolean) => {
    setP1State((prev: PlayerState) => ({
      ...prev,
      questionsAnswered: prev.questionsAnswered + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      // In Solo: Correct answer adds 1 life!
      lives: isCorrect ? Math.min(prev.maxLives, prev.lives + 1) : prev.lives,
      score: prev.score + (isCorrect ? (gameMode === 'solo' ? 150 : 100) : 0),
    }));
    setP1Question(null);
  };

  // When Player 2 answers a question (Battle Layar Kanan)
  const handleAnswerResultP2 = (isCorrect: boolean) => {
    setP2State((prev: PlayerState) => ({
      ...prev,
      questionsAnswered: prev.questionsAnswered + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      lives: isCorrect ? Math.min(prev.maxLives, prev.lives + 1) : prev.lives,
      score: prev.score + (isCorrect ? 100 : 0),
    }));
    setP2Question(null);
  };

  const handleGameOver = (winner?: string) => {
    setWinnerName(winner);
    setShowGameOverModal(true);
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 1. Playing Game Screen */}
      {gameState === 'playing' ? (
        <div className="relative w-full h-full">
          {/* Three.js 3D Viewport with decoupled non-blocking battle physics */}
          <RacingCanvas
            mode={gameMode}
            p1State={p1State}
            p2State={gameMode === 'battle' ? p2State : undefined}
            onUpdateP1={setP1State}
            onUpdateP2={setP2State}
            onTriggerQuestion={handleTriggerQuestion}
            onGameOver={handleGameOver}
            p1Controls={p1Controls}
            p2Controls={p2Controls}
            isPaused={gameMode === 'solo' ? Boolean(p1Question) || showGameOverModal : showGameOverModal}
            isCountdown={countdownValue !== null}
            isP1Answering={Boolean(p1Question)}
            isP2Answering={Boolean(p2Question)}
            weather={weather}
            difficulty={difficulty}
            targetDistanceMeters={TARGET_DISTANCE_METERS}
            totalQuestions={questionBank.length}
          />

          {/* Arcade Countdown Overlay: 3, 2, 1, GO! */}
          {countdownValue !== null && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/50 backdrop-blur-[2px] pointer-events-none select-none">
              <div className="flex flex-col items-center animate-in zoom-in-75 duration-200">
                <div className="px-5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-400 text-cyan-300 text-xs font-mono font-black tracking-widest uppercase mb-4 shadow-[0_0_20px_rgba(6,182,212,0.6)]">
                  🏁 GARIS START
                </div>

                <div
                  key={countdownValue}
                  className={`font-black font-mono tracking-tighter text-center transition-all duration-300 animate-in zoom-in-50 drop-shadow-[0_10px_35px_rgba(0,0,0,0.9)] ${
                    countdownValue === 0
                      ? 'text-8xl sm:text-[160px] text-emerald-400 drop-shadow-[0_0_60px_rgba(52,211,153,0.95)] scale-110'
                      : countdownValue === 1
                      ? 'text-8xl sm:text-[150px] text-amber-400 drop-shadow-[0_0_50px_rgba(251,191,36,0.9)]'
                      : countdownValue === 2
                      ? 'text-8xl sm:text-[150px] text-cyan-400 drop-shadow-[0_0_50px_rgba(6,182,212,0.9)]'
                      : 'text-8xl sm:text-[150px] text-rose-500 drop-shadow-[0_0_50px_rgba(244,63,94,0.9)]'
                  }`}
                >
                  {countdownValue === 0 ? 'GAS!' : countdownValue}
                </div>

                <div className="mt-4 px-5 py-2 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl flex flex-col items-center text-center">
                  <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                    {countdownValue === 0
                      ? '🏎️ TANCAP GAS OTOMATIS! FOKUS BELOK KIRI & KANAN!'
                      : 'Mobil akan melaju otomatis semakin lama semakin cepat!'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Hindari menabrak peserta lain & batas jalan agar kecepatan tidak turun
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Player 1 HUD & Mobile Controls */}
          <RacingHud
            playerState={p1State}
            playerId="p1"
            isBattleMode={gameMode === 'battle'}
            controls={p1Controls}
            onControlChange={(k, v) => setP1Controls((c: GameControls) => ({ ...c, [k]: v }))}
            onToggleMute={handleToggleMute}
            isMuted={isMuted}
            targetDistanceMeters={TARGET_DISTANCE_METERS}
            totalQuestions={questionBank.length}
          />

          {/* Player 2 HUD & Mobile Controls (Battle Mode only) */}
          {gameMode === 'battle' && (
            <RacingHud
              playerState={p2State}
              playerId="p2"
              isBattleMode={true}
              controls={p2Controls}
              onControlChange={(k, v) => setP2Controls((c: GameControls) => ({ ...c, [k]: v }))}
              targetDistanceMeters={TARGET_DISTANCE_METERS}
              totalQuestions={questionBank.length}
            />
          )}

          {/* Player 1 Question Challenge Modal (Solo Center OR Battle Layar Kiri) */}
          {p1Question && (
            <QuestionModal
              question={p1Question}
              playerId="p1"
              playerName={p1State.name}
              mode={gameMode}
              onAnswer={handleAnswerResultP1}
            />
          )}

          {/* Player 2 Question Challenge Modal (Battle Layar Kanan) */}
          {gameMode === 'battle' && p2Question && (
            <QuestionModal
              question={p2Question}
              playerId="p2"
              playerName={p2State.name}
              mode="battle"
              onAnswer={handleAnswerResultP2}
            />
          )}

          {/* Top Center Pause / Menu Bar, Weather & Symbol-Only Fullscreen Dock */}
          <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-2xl">
            <button
              onClick={() => {
                countdownTimerRef.current.forEach(clearTimeout);
                countdownTimerRef.current = [];
                setCountdownValue(null);
                setGameState('title');
              }}
              className="pointer-events-auto px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition shadow cursor-pointer flex items-center gap-1"
            >
              Menu
            </button>
            <button
              onClick={() => setWeather((w) => (w === 'cerah' ? 'mendung' : 'cerah'))}
              className="pointer-events-auto p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition shadow cursor-pointer flex items-center justify-center"
              title={`Ganti Cuaca: ${weather === 'cerah' ? 'Cerah (Klik untuk Mendung)' : 'Mendung (Klik untuk Cerah)'}`}
              aria-label={weather === 'cerah' ? 'Cuaca Cerah' : 'Cuaca Mendung'}
            >
              {weather === 'cerah' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Cloud className="w-4 h-4 text-slate-300" />
              )}
            </button>
            {/* Symbol-Only Fullscreen Button */}
            <button
              onClick={handleToggleFullscreen}
              className="pointer-events-auto p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/60 text-cyan-300 hover:text-white transition shadow flex items-center justify-center cursor-pointer"
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh'}
              aria-label={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4 text-cyan-400" /> : <Maximize className="w-4 h-4 text-cyan-400" />}
            </button>
          </div>
        </div>
      ) : (
        /* 2. Title Screen & Hero Shell with Fullscreen Dynamic Background (Single Viewport - No Scroll) */
        <div className="relative w-full h-full max-h-screen overflow-hidden flex flex-col justify-between p-3 sm:p-5 md:p-6 select-none">
          {/* Fullscreen Atmospheric Background Image (Clearer & More Vivid) */}
          <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            <img
              src={racingHeroBanner}
              alt="Racing Circuit Background"
              className="w-full h-full object-cover object-center scale-105 filter brightness-[0.78] contrast-[1.12] saturate-[1.2]"
            />
            {/* Soft Cinematic Overlays for Clear Visibility & Legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-slate-950/55" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(2,6,23,0.55)_90%)]" />
            {/* Ambient Grid lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#38bdf806_1px,transparent_1px),linear-gradient(to_bottom,#38bdf806_1px,transparent_1px)] bg-[size:4rem_4rem]" />
          </div>

          {/* Top Bar: Weather, Fullscreen, Sound & Portal Guru (Floating Glassmorphism) */}
          <div className="relative z-10 flex items-center justify-between w-full max-w-6xl mx-auto flex-wrap gap-2 shrink-0">
            {/* Brand Logo Badge */}
            <div className="flex items-center gap-2 bg-slate-950/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-lg">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center text-slate-950 font-black shadow-[0_0_15px_rgba(6,182,212,0.6)] text-base">
                🏎️
              </div>
              <div>
                <span className="font-mono font-black text-[10px] text-cyan-400 tracking-wider capitalize block leading-tight">
                  Developed By Misbahul Munir
                </span>
                <span className="text-[11px] font-bold text-slate-200 leading-none">Racing Car Edu</span>
              </div>
            </div>

            {/* Top Quick Action Symbols: Cuaca, Suara, Fullscreen, Portal Guru */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap bg-slate-950/75 backdrop-blur-md p-1 rounded-xl border border-slate-700/60 shadow-lg">
              {/* Weather Switcher (Symbol Only) */}
              <button
                type="button"
                onClick={() => setWeather((w) => (w === 'cerah' ? 'mendung' : 'cerah'))}
                className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition shadow cursor-pointer flex items-center justify-center"
                title={weather === 'cerah' ? 'Cuaca: Cerah (Klik untuk Cuaca Mendung)' : 'Cuaca: Mendung (Klik untuk Cuaca Cerah)'}
                aria-label={weather === 'cerah' ? 'Cuaca Cerah' : 'Cuaca Mendung'}
              >
                {weather === 'cerah' ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Cloud className="w-3.5 h-3.5 text-slate-300" />
                )}
              </button>

              {/* Sound Toggle Button (Symbol Only) */}
              <button
                type="button"
                onClick={handleToggleMute}
                className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition shadow cursor-pointer flex items-center justify-center"
                title={isMuted ? 'Nyalakan Audio' : 'Bisukan Audio'}
                aria-label={isMuted ? 'Nyalakan Audio' : 'Bisukan Audio'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>

              {/* Symbol-Only Fullscreen Button */}
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/50 text-cyan-300 hover:text-white transition shadow cursor-pointer flex items-center justify-center"
                title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh (Full Screen)'}
                aria-label={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh (Full Screen)'}
              >
                {isFullscreen ? <Minimize className="w-3.5 h-3.5 text-cyan-400" /> : <Maximize className="w-3.5 h-3.5 text-cyan-400" />}
              </button>

              {/* Portal Guru Action (Symbol Only) */}
              <button
                type="button"
                onClick={() => setShowTeacherModal(true)}
                className="p-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white transition shadow-[0_0_15px_rgba(99,102,241,0.5)] cursor-pointer flex items-center justify-center"
                title="Portal Guru (Kelola Soal & Spreadsheet)"
                aria-label="Portal Guru"
              >
                <GraduationCap className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Hero Centerpiece: Floating Race Title & Floating Mode Selection Cards (Single Viewport Fit) */}
          <div className="relative z-10 max-w-4xl mx-auto w-full text-center my-auto py-1 sm:py-2 flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 border border-cyan-400/40 text-cyan-300 text-[10px] sm:text-xs font-semibold backdrop-blur-md shadow mb-1.5">
              <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>Game Balap Edukatif Untuk Kamu yang Suka Tantangan</span>
            </div>

            {/* Smaller Single-Line RACING CAR EDU Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-slate-200 tracking-wider uppercase leading-tight font-sans drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] whitespace-nowrap">
              RACING CAR EDU
            </h1>

            <p className="text-xs sm:text-[13px] text-slate-200 max-w-xl mx-auto mt-1.5 font-normal drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] leading-snug">
              "Akselerasikan pikiranmu, kendalikan kecepatannya, dan buktikan bahwa kecerdasan adalah mesin terhebat di lintasan!"
            </p>

            {/* Floating Circuit Features Badges in One Line */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap mt-2">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-cyan-400/40 text-cyan-300 text-[10px] font-semibold shadow">
                🏁 Sirkuit Grand Prix Pegunungan
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-amber-400/40 text-amber-300 text-[10px] font-mono font-bold shadow">
                ⚡ Top Speed 360+ km/h
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-indigo-400/40 text-indigo-300 text-[10px] font-semibold shadow">
                🎮 Auto-Gas & Refleks Kemudi
              </span>
            </div>

            {/* Compact Floating Game Mode Choice Cards (Individu vs Battle) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-xl mx-auto mt-3.5 w-full">
              {/* Option 1: Solo Race */}
              <button
                type="button"
                data-testid="btn-mode-solo"
                onClick={() => {
                  setGameMode('solo');
                  setShowSetupModal(true);
                }}
                className="group relative p-3.5 sm:p-4 rounded-2xl bg-slate-950/85 hover:bg-slate-900/95 backdrop-blur-xl border-2 border-slate-700/80 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all duration-300 cursor-pointer flex flex-col items-center text-center overflow-hidden"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 mb-2 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all duration-300 shadow">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
                <h3 className="text-base font-black text-white group-hover:text-cyan-300 transition-colors leading-tight">
                  Balapan Individu
                </h3>
                <p className="text-[11px] text-slate-300 mt-1 leading-snug line-clamp-2">
                  3 Nyawa, tantangan peserta lain & kuis bonus. Kirim nilai ke WA guru!
                </p>
                <span className="mt-3 px-3.5 py-1 rounded-lg bg-slate-900 text-cyan-400 text-[10px] sm:text-xs font-bold border border-slate-700 group-hover:bg-cyan-500 group-hover:text-slate-950 group-hover:border-cyan-400 transition-all shadow">
                  PILIH INDIVIDU ➔
                </span>
              </button>

              {/* Option 2: Split-Screen Battle */}
              <button
                type="button"
                data-testid="btn-mode-battle"
                onClick={() => {
                  setGameMode('battle');
                  setShowSetupModal(true);
                }}
                className="group relative p-3.5 sm:p-4 rounded-2xl bg-slate-950/85 hover:bg-slate-900/95 backdrop-blur-xl border-2 border-slate-700/80 hover:border-amber-400 hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all duration-300 cursor-pointer flex flex-col items-center text-center overflow-hidden"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 mb-2 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-300 shadow">
                  <Swords className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors leading-tight">
                  Battle 2 Pemain
                </h3>
                <p className="text-[11px] text-slate-300 mt-1 leading-snug line-clamp-2">
                  Layar terbelah (P1 Kiri & P2 Kanan). Kuis mandiri tanpa ganggu lawan!
                </p>
                <span className="mt-3 px-3.5 py-1 rounded-lg bg-slate-900 text-amber-400 text-[10px] sm:text-xs font-bold border border-slate-700 group-hover:bg-amber-500 group-hover:text-slate-950 group-hover:border-amber-400 transition-all shadow">
                  PILIH BATTLE ➔
                </span>
              </button>
            </div>

            {/* Quick Token Badge Floating */}
            <div className="mt-3 inline-flex items-center justify-center gap-2 text-[10px] sm:text-[11px] text-slate-300 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/80 shadow">
              <span>Token Aktif:</span>
              <span className="font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                {activeToken}
              </span>
              <span className="text-slate-500">•</span>
              <span>{questionBank.length} Soal Terisi</span>
            </div>
          </div>

          {/* Footer Info Bar Floating */}
          <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 bg-slate-950/75 backdrop-blur-md border border-slate-800/80 rounded-xl px-4 py-1.5 shadow-lg gap-1 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-slate-300 font-medium">Sirkuit Balap Aktif: 10,000 Meter Continuous Track</span>
            </div>
            <div>
              Apex Racer Edukasi • 6 Model Mobil Balap • Keyboard WASD / Panah & Touch Screen Mobile
            </div>
          </div>
        </div>
      )}

      {/* Game Setup / Car Customizer Modal */}
      <GameSetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onStartGame={handleStartRace}
        initialMode={gameMode}
        initialToken={activeToken}
        initialDifficulty={difficulty}
      />

      {/* Teacher Portal Modal */}
      <TeacherPortalModal
        isOpen={showTeacherModal}
        onClose={() => setShowTeacherModal(false)}
        onSelectTokenForGame={(tok) => {
          setActiveToken(tok);
          setShowSetupModal(true);
        }}
        onOpenLeaderboard={() => setShowLeaderboardModal(true)}
      />

      {/* Global Leaderboard Modal (viewed via Teacher Portal or upon race completion) */}
      <LeaderboardModal
        isOpen={showLeaderboardModal}
        onClose={() => setShowLeaderboardModal(false)}
        initialTokenFilter={activeToken}
      />

      {/* Game Over / Victory Modal */}
      {showGameOverModal && (
        <GameOverModal
          mode={gameMode}
          token={activeToken}
          p1={p1State}
          p2={gameMode === 'battle' ? p2State : undefined}
          winnerName={winnerName}
          onRestart={() => {
            setShowGameOverModal(false);
            setP1State((p: PlayerState) => ({ ...p, lives: 3, score: 0, distance: 0, speed: 0, nitro: 100, isGameOver: false }));
            if (gameMode === 'battle') {
              setP2State((p: PlayerState) => ({ ...p, lives: 3, score: 0, distance: 0, speed: 0, nitro: 100, isGameOver: false }));
            }
          }}
          onOpenLeaderboard={() => {
            setShowGameOverModal(false);
            setShowLeaderboardModal(true);
          }}
          onBackToMenu={() => {
            setShowGameOverModal(false);
            setGameState('title');
          }}
        />
      )}
    </div>
  );
}
