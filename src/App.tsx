import React, { useState, useEffect, useRef } from 'react';
import { GameMode, PlayerState, GameControls, Question, PlayerCarConfig, WeatherType } from './types/game';
import { CAR_PRESETS } from './game/carModels';
import { sheetService } from './services/sheetService';
import { sound } from './services/soundService';
import { RacingCanvas } from './game/RacingCanvas';
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

      // Player 1 controls (WASD / Arrows in Solo)
      if (gameMode === 'solo') {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          setP1Controls((c: GameControls) => ({ ...c, accelerate: true }));
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          setP1Controls((c: GameControls) => ({ ...c, brake: true }));
        } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          setP1Controls((c: GameControls) => ({ ...c, steerLeft: true }));
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          setP1Controls((c: GameControls) => ({ ...c, steerRight: true }));
        } else if (e.key === 'Shift' || e.key === ' ' || e.key === 'f' || e.key === 'F') {
          setP1Controls((c: GameControls) => ({ ...c, nitro: true }));
        }
      } else {
        // Battle mode: P1 uses WASD + Shift
        if (e.key === 'w' || e.key === 'W') {
          setP1Controls((c: GameControls) => ({ ...c, accelerate: true }));
        } else if (e.key === 's' || e.key === 'S') {
          setP1Controls((c: GameControls) => ({ ...c, brake: true }));
        } else if (e.key === 'a' || e.key === 'A') {
          setP1Controls((c: GameControls) => ({ ...c, steerLeft: true }));
        } else if (e.key === 'd' || e.key === 'D') {
          setP1Controls((c: GameControls) => ({ ...c, steerRight: true }));
        } else if (e.key === 'Shift' || e.key === 'q' || e.key === 'Q') {
          setP1Controls((c: GameControls) => ({ ...c, nitro: true }));
        }

        // Battle mode: P2 uses Arrow Keys + Enter / Numpad 0
        if (e.key === 'ArrowUp') {
          setP2Controls((c: GameControls) => ({ ...c, accelerate: true }));
        } else if (e.key === 'ArrowDown') {
          setP2Controls((c: GameControls) => ({ ...c, brake: true }));
        } else if (e.key === 'ArrowLeft') {
          setP2Controls((c: GameControls) => ({ ...c, steerLeft: true }));
        } else if (e.key === 'ArrowRight') {
          setP2Controls((c: GameControls) => ({ ...c, steerRight: true }));
        } else if (e.key === 'Enter' || e.key === '0' || e.key === 'Control') {
          setP2Controls((c: GameControls) => ({ ...c, nitro: true }));
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameMode === 'solo') {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          setP1Controls((c: GameControls) => ({ ...c, accelerate: false }));
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          setP1Controls((c: GameControls) => ({ ...c, brake: false }));
        } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          setP1Controls((c: GameControls) => ({ ...c, steerLeft: false }));
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          setP1Controls((c: GameControls) => ({ ...c, steerRight: false }));
        } else if (e.key === 'Shift' || e.key === ' ' || e.key === 'f' || e.key === 'F') {
          setP1Controls((c: GameControls) => ({ ...c, nitro: false }));
        }
      } else {
        if (e.key === 'w' || e.key === 'W') {
          setP1Controls((c: GameControls) => ({ ...c, accelerate: false }));
        } else if (e.key === 's' || e.key === 'S') {
          setP1Controls((c: GameControls) => ({ ...c, brake: false }));
        } else if (e.key === 'a' || e.key === 'A') {
          setP1Controls((c: GameControls) => ({ ...c, steerLeft: false }));
        } else if (e.key === 'd' || e.key === 'D') {
          setP1Controls((c: GameControls) => ({ ...c, steerRight: false }));
        } else if (e.key === 'Shift' || e.key === 'q' || e.key === 'Q') {
          setP1Controls((c: GameControls) => ({ ...c, nitro: false }));
        }

        if (e.key === 'ArrowUp') {
          setP2Controls((c: GameControls) => ({ ...c, accelerate: false }));
        } else if (e.key === 'ArrowDown') {
          setP2Controls((c: GameControls) => ({ ...c, brake: false }));
        } else if (e.key === 'ArrowLeft') {
          setP2Controls((c: GameControls) => ({ ...c, steerLeft: false }));
        } else if (e.key === 'ArrowRight') {
          setP2Controls((c: GameControls) => ({ ...c, steerRight: false }));
        } else if (e.key === 'Enter' || e.key === '0' || e.key === 'Control') {
          setP2Controls((c: GameControls) => ({ ...c, nitro: false }));
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
    p1Name: string;
    p1Car: PlayerCarConfig;
    p2Name?: string;
    p2Car?: PlayerCarConfig;
  }) => {
    setGameMode(setup.mode);
    setActiveToken(setup.token);

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
            isP1Answering={Boolean(p1Question)}
            isP2Answering={Boolean(p2Question)}
            weather={weather}
            targetDistanceMeters={TARGET_DISTANCE_METERS}
            totalQuestions={questionBank.length}
          />

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
              onClick={() => setGameState('title')}
              className="pointer-events-auto px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition shadow cursor-pointer flex items-center gap-1"
            >
              Menu
            </button>
            <button
              onClick={() => setWeather((w) => (w === 'cerah' ? 'mendung' : 'cerah'))}
              className="pointer-events-auto px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition shadow cursor-pointer flex items-center gap-1"
              title={`Ganti Cuaca: ${weather === 'cerah' ? '☀️ Cerah' : '☁️ Mendung'}`}
            >
              <span>{weather === 'cerah' ? '☀️ Cerah' : '☁️ Mendung'}</span>
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
        /* 2. Title Screen & Hero Shell */
        <div className="relative w-full h-full flex flex-col justify-between p-6 sm:p-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black overflow-y-auto">
          {/* Background Ambient Glow & Racing Grid Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Bar: Weather, Fullscreen (symbol only), Sound & Masuk Guru */}
          <div className="relative z-10 flex items-center justify-between w-full max-w-6xl mx-auto flex-wrap gap-3">
            {/* Brand Logo Badge */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center text-slate-950 font-black shadow-[0_0_20px_rgba(6,182,212,0.6)]">
                🏎️
              </div>
              <div>
                <span className="font-mono font-black text-xs text-cyan-400 tracking-widest uppercase">
                  SIMULATOR BALAP 3D
                </span>
                <h1 className="text-sm font-bold text-slate-200">Kuis Edukasi Sekolah</h1>
              </div>
            </div>

            {/* Top Quick Actions (Spreadsheet & Leaderboard hidden from title screen as requested) */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              {/* Weather Switcher (☀️ Cerah / ☁️ Mendung) */}
              <button
                type="button"
                onClick={() => setWeather((w) => (w === 'cerah' ? 'mendung' : 'cerah'))}
                className="px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition shadow cursor-pointer text-xs font-bold flex items-center gap-1.5"
                title={`Pilih Suasana Cuaca Sirkuit: ${weather === 'cerah' ? '☀️ Langit Cerah' : '☁️ Langit Mendung'}`}
              >
                <span>{weather === 'cerah' ? '☀️ Cerah' : '☁️ Mendung'}</span>
              </button>

              {/* Sound Toggle Button */}
              <button
                onClick={handleToggleMute}
                className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white transition shadow cursor-pointer"
                title={isMuted ? 'Nyalakan Audio' : 'Bisukan Audio'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>

              {/* Symbol-Only Fullscreen Button */}
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/50 text-cyan-300 hover:text-white transition shadow-lg cursor-pointer flex items-center justify-center"
                title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh (Full Screen)'}
                aria-label={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh (Full Screen)'}
              >
                {isFullscreen ? <Minimize className="w-4 h-4 text-cyan-400" /> : <Maximize className="w-4 h-4 text-cyan-400" />}
              </button>

              {/* Portal Guru Action */}
              <button
                onClick={() => setShowTeacherModal(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(99,102,241,0.5)] cursor-pointer"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Masuk Guru</span>
              </button>
            </div>
          </div>

          {/* Hero Centerpiece: Race Title & Mode Selection Cards */}
          <div className="relative z-10 max-w-4xl mx-auto w-full text-center my-auto py-8">
            <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold backdrop-blur-sm shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Turnamen Balap & Kuis Interaktif Google Spreadsheet</span>
              </div>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 tracking-tight uppercase leading-none font-sans drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
              APEX RACER
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto mt-3 font-normal">
              Kemudikan mobil balap 3D impianmu, hindari peserta lain di sirkuit profesional, dan raih poin tertinggi dengan menjawab kuis edukasi!
            </p>

            {/* Game Mode Choice Cards (Individu vs Battle) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto mt-8">
              {/* Option 1: Solo Race */}
              <button
                type="button"
                data-testid="btn-mode-solo"
                onClick={() => {
                  setGameMode('solo');
                  setShowSetupModal(true);
                }}
                className="group relative p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border-2 border-slate-700/80 hover:border-cyan-400 hover:shadow-[0_0_35px_rgba(6,182,212,0.4)] transition-all cursor-pointer flex flex-col items-center text-center overflow-hidden"
              >
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 mb-4 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all duration-300 shadow">
                  <Play className="w-7 h-7 fill-current ml-0.5" />
                </div>
                <h3 className="text-xl font-black text-white group-hover:text-cyan-300 transition-colors">
                  Balapan Individu
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  3 Nyawa, lintasan penuh tantangan peserta lain. Jawab soal bonus untuk menambah nyawa dan kirim nilai ke WhatsApp guru!
                </p>
                <span className="mt-4 px-4 py-1.5 rounded-xl bg-slate-800 text-cyan-400 text-xs font-bold border border-slate-700 group-hover:bg-cyan-500 group-hover:text-slate-950 group-hover:border-cyan-400 transition-colors">
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
                className="group relative p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border-2 border-slate-700/80 hover:border-amber-400 hover:shadow-[0_0_35px_rgba(245,158,11,0.4)] transition-all cursor-pointer flex flex-col items-center text-center overflow-hidden"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 mb-4 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-300 shadow">
                  <Swords className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-white group-hover:text-amber-300 transition-colors">
                  Battle 2 Pemain
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Layar terbelah (Kiri P1 & Kanan P2). Soal muncul di layar masing-masing tanpa mengganggu lawan. Skor tertinggi yang menang!
                </p>
                <span className="mt-4 px-4 py-1.5 rounded-xl bg-slate-800 text-amber-400 text-xs font-bold border border-slate-700 group-hover:bg-amber-500 group-hover:text-slate-950 group-hover:border-amber-400 transition-colors">
                  PILIH BATTLE ➔
                </span>
              </button>
            </div>

            {/* Quick Token Badge */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
              <span>Token Aktif:</span>
              <span className="font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700 font-bold">
                {activeToken}
              </span>
              <span className="text-slate-500">•</span>
              <span>{questionBank.length} Soal Terisi</span>
            </div>
          </div>

          {/* Footer Info Bar */}
          <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-4 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-slate-400 font-medium">Sirkuit Balap Aktif: 10,000 Meter Continuous Track</span>
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
