import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GameMode, PlayerState, GameControls, WeatherType, GameDifficulty } from '../types/game';
import { buildProceduralCar, ProceduralCarResult } from './carModels';
import { buildRaceCircuit, TrackData, BonusOrb } from './trackEnvironment';
import { NitroParticleTrail } from './nitroParticles';
import { sound } from '../services/soundService';

interface RacingCanvasProps {
  mode: GameMode;
  p1State: PlayerState;
  p2State?: PlayerState;
  onUpdateP1: (updater: (prev: PlayerState) => PlayerState) => void;
  onUpdateP2?: (updater: (prev: PlayerState) => PlayerState) => void;
  onTriggerQuestion: (playerId: 'p1' | 'p2', orbIndex: number) => void;
  onGameOver: (winnerId?: string) => void;
  p1Controls: GameControls;
  p2Controls?: GameControls;
  isPaused: boolean;
  isCountdown?: boolean;
  isP1Answering?: boolean;
  isP2Answering?: boolean;
  weather?: WeatherType;
  difficulty?: GameDifficulty;
  targetDistanceMeters?: number;
  totalQuestions?: number;
}

export const RacingCanvas: React.FC<RacingCanvasProps> = ({
  mode,
  p1State,
  p2State,
  onUpdateP1,
  onUpdateP2,
  onTriggerQuestion,
  onGameOver,
  p1Controls,
  p2Controls,
  isPaused,
  isCountdown = false,
  isP1Answering = false,
  isP2Answering = false,
  weather = 'cerah',
  difficulty = 'medium',
  targetDistanceMeters = 3000,
  totalQuestions = 4,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const controlsRef = useRef({ p1: p1Controls, p2: p2Controls });
  controlsRef.current = { p1: p1Controls, p2: p2Controls };

  const p1QuestionsAnsweredRef = useRef(p1State.questionsAnswered);
  p1QuestionsAnsweredRef.current = p1State.questionsAnswered;

  const pausedRef = useRef(isPaused);
  pausedRef.current = isPaused;

  const isCountdownRef = useRef(isCountdown);
  isCountdownRef.current = isCountdown;

  const answeringRef = useRef({ p1: isP1Answering, p2: isP2Answering });
  answeringRef.current = { p1: isP1Answering, p2: isP2Answering };

  const callbacksRef = useRef({ onUpdateP1, onUpdateP2, onTriggerQuestion, onGameOver });
  callbacksRef.current = { onUpdateP1, onUpdateP2, onTriggerQuestion, onGameOver };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Scene Setup with Dynamic Weather (Cerah vs Mendung) ---
    const isCerah = weather === 'cerah';
    const skyColor = isCerah ? 0x38bdf8 : 0x475569;
    const fogColor = isCerah ? 0xbae6fd : 0x64748b;
    const fogDensity = isCerah ? 0.0012 : 0.0022;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(skyColor);
    scene.fog = new THREE.FogExp2(fogColor, fogDensity);

    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isCerah ? 1.25 : 1.05;
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // Lighting for Cerah vs Mendung
    const hemiLight = new THREE.HemisphereLight(
      isCerah ? 0x60a5fa : 0x64748b,
      isCerah ? 0x15803d : 0x1e293b,
      isCerah ? 1.6 : 1.1
    );
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(
      isCerah ? 0xfffbeb : 0x94a3b8,
      isCerah ? 2.5 : 1.3
    );
    sunLight.position.set(60, 110, 80);
    sunLight.castShadow = !isHeadless;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 300;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Build the expansive circuit with mountains and finish line
    const trackData: TrackData = buildRaceCircuit(scene, 10000, weather, targetDistanceMeters, difficulty);

    // Cameras
    const aspect = container.clientWidth / container.clientHeight;
    const camera1 = new THREE.PerspectiveCamera(65, aspect, 0.5, 750);
    const camera2 = new THREE.PerspectiveCamera(65, aspect, 0.5, 750);

    // Build Player 1 3D Car
    const p1CarResult: ProceduralCarResult = buildProceduralCar(
      p1State.car.type,
      p1State.car.primaryColor,
      p1State.car.accentColor
    );
    scene.add(p1CarResult.root);

    // Dynamic Nitro Flame and Particle Trail Emitter for Player 1
    const p1NitroTrail = new NitroParticleTrail(
      scene,
      p1State.car.type === 'cyber' ? 'plasma' : 'fire'
    );

    // Build Player 2 3D Car & Particle Emitter (if battle mode)
    let p2CarResult: ProceduralCarResult | null = null;
    let p2NitroTrail: NitroParticleTrail | null = null;
    if (mode === 'battle' && p2State) {
      p2CarResult = buildProceduralCar(
        p2State.car.type,
        p2State.car.primaryColor,
        p2State.car.accentColor
      );
      scene.add(p2CarResult.root);
      p2NitroTrail = new NitroParticleTrail(
        scene,
        p2State.car.type === 'cyber' ? 'plasma' : 'fire'
      );
    }

    // Starting positions: In world coordinates, +X is left on screen, -X is right on screen
    const p1Sim = {
      x: trackData.getTrackXAtZ(0) + (mode === 'battle' ? 2.8 : 0), // P1 starts on left lane
      z: 0,
      speed: 0,
      steerAngle: 0,
      lives: p1State.lives,
      score: p1State.score,
      nitro: p1State.nitro,
      isNitro: false,
      invulnerableTimer: 0,
      shake: 0,
      distance: 0,
      isGameOver: false,
    };

    const p2Sim = {
      x: trackData.getTrackXAtZ(0) - (mode === 'battle' ? 2.8 : 0), // P2 starts on right lane
      z: 0,
      speed: 0,
      steerAngle: 0,
      lives: p2State ? p2State.lives : 3,
      score: p2State ? p2State.score : 0,
      nitro: p2State ? p2State.nitro : 100,
      isNitro: false,
      invulnerableTimer: 0,
      shake: 0,
      distance: 0,
      isGameOver: false,
    };

    const _camTarget = new THREE.Vector3();

    sound.startEngine();

    const clock = new THREE.Clock();
    let animFrameId: number;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);

      const rawDt = clock.getDelta();
      const dt = Math.min(rawDt, 0.05);

      if (pausedRef.current) {
        sound.updateEnginePitch(0, false);
        return;
      }

      // --- COUNTDOWN FREEZE: 3, 2, 1, GO! ---
      if (isCountdownRef.current) {
        sound.updateEnginePitch(0.08, false);

        // Keep cars poised at starting line with subtle idling vibration
        const idleVibe = Math.sin(clock.getElapsedTime() * 30) * 0.01;
        p1CarResult.root.position.set(p1Sim.x, idleVibe, 0);
        p1CarResult.root.rotation.set(0, 0, 0);
        camera1.position.set(p1Sim.x, 2.5, -6.8);
        _camTarget.set(p1Sim.x, 1.2, 10);
        camera1.lookAt(_camTarget);
        camera1.fov = 65;
        camera1.updateProjectionMatrix();

        if (mode === 'battle' && p2CarResult) {
          p2CarResult.root.position.set(p2Sim.x, idleVibe, 0);
          p2CarResult.root.rotation.set(0, 0, 0);
          camera2.position.set(p2Sim.x, 2.5, -6.8);
          _camTarget.set(p2Sim.x, 1.2, 10);
          camera2.lookAt(_camTarget);
          camera2.fov = 65;
          camera2.updateProjectionMatrix();
        }

        // Render starting grid viewports
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (mode === 'battle') {
          const halfW = Math.floor(w / 2);
          renderer.setScissorTest(true);
          camera1.aspect = halfW / h;
          camera1.updateProjectionMatrix();
          renderer.setViewport(0, 0, halfW, h);
          renderer.setScissor(0, 0, halfW, h);
          renderer.render(scene, camera1);

          camera2.aspect = halfW / h;
          camera2.updateProjectionMatrix();
          renderer.setViewport(halfW, 0, halfW, h);
          renderer.setScissor(halfW, 0, halfW, h);
          renderer.render(scene, camera2);
        } else {
          renderer.setScissorTest(false);
          camera1.aspect = w / h;
          camera1.updateProjectionMatrix();
          renderer.setViewport(0, 0, w, h);
          renderer.render(scene, camera1);
        }
        return;
      }

      const p1IsAnswering = answeringRef.current.p1;
      const p2IsAnswering = answeringRef.current.p2;

      // --- 1. SIMULATE PLAYER 1 (LAYAR KIRI) ---
      if (!p1Sim.isGameOver) {
        const baseMaxSpd = p1State.car.type === 'f1' ? 320 : p1State.car.type === 'cyber' ? 310 : 290;
        const diffSpeedMult = difficulty === 'easy' ? 0.85 : difficulty === 'hard' ? 1.15 : 1.0;
        const maxSpd = Math.round(baseMaxSpd * diffSpeedMult);

        if (p1IsAnswering) {
          // Player 1 is answering question on Layar Kiri:
          // Safe cruise, maintain lane, temporary shield, NO control interference with P2!
          p1Sim.speed = THREE.MathUtils.damp(p1Sim.speed, 40, 4, dt);
          p1Sim.steerAngle = THREE.MathUtils.damp(p1Sim.steerAngle, 0, 8, dt);
          p1Sim.invulnerableTimer = Math.max(p1Sim.invulnerableTimer, 1.5);

          const worldSpeed = (p1Sim.speed / 3.6) * 1.5;
          p1Sim.z += worldSpeed * dt;
          p1Sim.distance += worldSpeed * dt;

          p1CarResult.root.position.set(p1Sim.x, 0, p1Sim.z);
          p1CarResult.root.rotation.y = 0;
          p1CarResult.root.rotation.z = 0;
          p1CarResult.frontLeftWheel.rotation.y = 0;
          p1CarResult.frontRightWheel.rotation.y = 0;

          const wheelRotSpeed = (worldSpeed / 0.35) * dt;
          p1CarResult.wheels.forEach((w) => {
            w.children.forEach((c) => {
              c.rotation.x += wheelRotSpeed;
            });
          });

          const camDist = 6.8 + (p1Sim.speed / maxSpd) * 1.8;
          const camHeight = 2.4 + (p1Sim.speed / maxSpd) * 0.4;
          camera1.position.set(
            THREE.MathUtils.damp(camera1.position.x, p1Sim.x, 8, dt),
            THREE.MathUtils.damp(camera1.position.y, camHeight, 8, dt),
            p1Sim.z - camDist
          );
          _camTarget.set(p1Sim.x, 1.2, p1Sim.z + 10);
          camera1.lookAt(_camTarget);
          camera1.fov = 65;
          camera1.updateProjectionMatrix();
        } else {
          // Normal active racing simulation for P1:
          // AUTO-ACCELERATION: The car keeps moving forward and accelerates automatically
          // unless colliding with obstacles or walls!
          const ctrl1 = controlsRef.current.p1;
          const diffAccelMult = difficulty === 'easy' ? 0.8 : difficulty === 'hard' ? 1.25 : 1.0;
          const rawAccel = p1Sim.speed < 120 ? 55 : p1Sim.speed < 220 ? 30 : 15;
          const accelRate = rawAccel * diffAccelMult;
          p1Sim.speed = Math.min(maxSpd, p1Sim.speed + accelRate * dt);

          // Steering (KIRI moves left +X, KANAN moves right -X)
          const steerSpeed = 3.2;
          if (ctrl1.steerLeft) {
            p1Sim.steerAngle = THREE.MathUtils.damp(p1Sim.steerAngle, 0.45, 12, dt);
            p1Sim.x += steerSpeed * (p1Sim.speed / 100 + 0.35) * 6 * dt;
            if (p1Sim.speed > 160) sound.playTireSkid();
          } else if (ctrl1.steerRight) {
            p1Sim.steerAngle = THREE.MathUtils.damp(p1Sim.steerAngle, -0.45, 12, dt);
            p1Sim.x -= steerSpeed * (p1Sim.speed / 100 + 0.35) * 6 * dt;
            if (p1Sim.speed > 160) sound.playTireSkid();
          } else {
            p1Sim.steerAngle = THREE.MathUtils.damp(p1Sim.steerAngle, 0, 9, dt);
          }

          const worldSpeed = (p1Sim.speed / 3.6) * 1.5;
          p1Sim.z += worldSpeed * dt;
          p1Sim.distance += worldSpeed * dt;
          p1Sim.score += Math.floor(worldSpeed * dt * 0.8);

          p1CarResult.root.position.set(p1Sim.x, 0, p1Sim.z);
          p1CarResult.root.rotation.y = p1Sim.steerAngle * 0.45;
          p1CarResult.root.rotation.z = -p1Sim.steerAngle * 0.35;

          const wheelRotSpeed = (worldSpeed / 0.35) * dt;
          p1CarResult.wheels.forEach((w) => {
            w.children.forEach((c) => {
              c.rotation.x += wheelRotSpeed;
            });
          });
          p1CarResult.frontLeftWheel.rotation.y = p1Sim.steerAngle;
          p1CarResult.frontRightWheel.rotation.y = p1Sim.steerAngle;

          if (p1Sim.invulnerableTimer > 0) {
            p1Sim.invulnerableTimer -= dt;
            p1CarResult.root.visible = Math.floor(p1Sim.invulnerableTimer * 10) % 2 === 0;
          } else {
            p1CarResult.root.visible = true;
          }

          p1Sim.shake = THREE.MathUtils.damp(p1Sim.shake, 0, 8, dt);

          const camDist = 6.8 + (p1Sim.speed / maxSpd) * 1.8;
          const camHeight = 2.4 + (p1Sim.speed / maxSpd) * 0.4;
          const shakeX = (Math.random() - 0.5) * p1Sim.shake;
          const shakeY = (Math.random() - 0.5) * p1Sim.shake;

          camera1.position.set(
            THREE.MathUtils.damp(camera1.position.x, p1Sim.x + shakeX, 8, dt),
            THREE.MathUtils.damp(camera1.position.y, camHeight + shakeY, 8, dt),
            p1Sim.z - camDist
          );
          _camTarget.set(p1Sim.x, 1.2, p1Sim.z + 10);
          camera1.lookAt(_camTarget);

          camera1.fov = 65 + (p1Sim.speed / maxSpd) * 12;
          camera1.updateProjectionMatrix();

          // Track boundary collision check: drops speed sharply if player scrapes outer barriers!
          const trackCenter = trackData.getTrackXAtZ(p1Sim.z);
          const distFromCenter = Math.abs(p1Sim.x - trackCenter);
          if (distFromCenter > trackData.trackWidth / 2 - 0.5) {
            p1Sim.speed = Math.max(45, p1Sim.speed * 0.90);
            p1Sim.shake = 0.35;
            p1Sim.x = THREE.MathUtils.damp(
              p1Sim.x,
              trackCenter + Math.sign(p1Sim.x - trackCenter) * (trackData.trackWidth / 2 - 0.7),
              12,
              dt
            );
            sound.playCrash();
          }
        }
      }

      // --- 2. SIMULATE PLAYER 2 (LAYAR KANAN) ---
      if (mode === 'battle' && p2CarResult && p2State && !p2Sim.isGameOver) {
        const p2BaseMaxSpd = p2State.car.type === 'f1' ? 320 : p2State.car.type === 'cyber' ? 310 : 290;
        const p2DiffSpeedMult = difficulty === 'easy' ? 0.85 : difficulty === 'hard' ? 1.15 : 1.0;
        const maxSpd = Math.round(p2BaseMaxSpd * p2DiffSpeedMult);

        if (p2IsAnswering) {
          // Player 2 is answering on Layar Kanan:
          // Safe cruise, temporary shield, NO disruption to Player 1's racing!
          p2Sim.speed = THREE.MathUtils.damp(p2Sim.speed, 40, 4, dt);
          p2Sim.steerAngle = THREE.MathUtils.damp(p2Sim.steerAngle, 0, 8, dt);
          p2Sim.invulnerableTimer = Math.max(p2Sim.invulnerableTimer, 1.5);

          const worldSpeed2 = (p2Sim.speed / 3.6) * 1.5;
          p2Sim.z += worldSpeed2 * dt;
          p2Sim.distance += worldSpeed2 * dt;

          p2CarResult.root.position.set(p2Sim.x, 0, p2Sim.z);
          p2CarResult.root.rotation.y = 0;
          p2CarResult.root.rotation.z = 0;
          p2CarResult.frontLeftWheel.rotation.y = 0;
          p2CarResult.frontRightWheel.rotation.y = 0;

          const wheelRotSpeed2 = (worldSpeed2 / 0.35) * dt;
          p2CarResult.wheels.forEach((w) => {
            w.children.forEach((c) => {
              c.rotation.x += wheelRotSpeed2;
            });
          });

          const camDist2 = 6.8 + (p2Sim.speed / maxSpd) * 1.8;
          const camHeight2 = 2.4 + (p2Sim.speed / maxSpd) * 0.4;
          camera2.position.set(
            THREE.MathUtils.damp(camera2.position.x, p2Sim.x, 8, dt),
            THREE.MathUtils.damp(camera2.position.y, camHeight2, 8, dt),
            p2Sim.z - camDist2
          );
          _camTarget.set(p2Sim.x, 1.2, p2Sim.z + 10);
          camera2.lookAt(_camTarget);
          camera2.fov = 65;
          camera2.updateProjectionMatrix();
        } else {
          // Normal active racing simulation for P2 with auto-acceleration
          const ctrl2 = controlsRef.current.p2 || {
            steerLeft: false,
            steerRight: false,
            accelerate: false,
            brake: false,
            nitro: false,
          };

          const p2DiffAccelMult = difficulty === 'easy' ? 0.8 : difficulty === 'hard' ? 1.25 : 1.0;
          const rawAccel2 = p2Sim.speed < 120 ? 55 : p2Sim.speed < 220 ? 30 : 15;
          const accelRate2 = rawAccel2 * p2DiffAccelMult;
          p2Sim.speed = Math.min(maxSpd, p2Sim.speed + accelRate2 * dt);

          const steerSpeed = 3.2;
          if (ctrl2.steerLeft) {
            p2Sim.steerAngle = THREE.MathUtils.damp(p2Sim.steerAngle, 0.45, 12, dt);
            p2Sim.x += steerSpeed * (p2Sim.speed / 100 + 0.35) * 6 * dt;
          } else if (ctrl2.steerRight) {
            p2Sim.steerAngle = THREE.MathUtils.damp(p2Sim.steerAngle, -0.45, 12, dt);
            p2Sim.x -= steerSpeed * (p2Sim.speed / 100 + 0.35) * 6 * dt;
          } else {
            p2Sim.steerAngle = THREE.MathUtils.damp(p2Sim.steerAngle, 0, 9, dt);
          }

          const worldSpeed2 = (p2Sim.speed / 3.6) * 1.5;
          p2Sim.z += worldSpeed2 * dt;
          p2Sim.distance += worldSpeed2 * dt;
          p2Sim.score += Math.floor(worldSpeed2 * dt * 0.8);

          p2CarResult.root.position.set(p2Sim.x, 0, p2Sim.z);
          p2CarResult.root.rotation.y = p2Sim.steerAngle * 0.45;
          p2CarResult.root.rotation.z = -p2Sim.steerAngle * 0.35;

          const wheelRotSpeed2 = (worldSpeed2 / 0.35) * dt;
          p2CarResult.wheels.forEach((w) => {
            w.children.forEach((c) => {
              c.rotation.x += wheelRotSpeed2;
            });
          });
          p2CarResult.frontLeftWheel.rotation.y = p2Sim.steerAngle;
          p2CarResult.frontRightWheel.rotation.y = p2Sim.steerAngle;

          if (p2Sim.invulnerableTimer > 0) {
            p2Sim.invulnerableTimer -= dt;
            p2CarResult.root.visible = Math.floor(p2Sim.invulnerableTimer * 10) % 2 === 0;
          } else {
            p2CarResult.root.visible = true;
          }

          p2Sim.shake = THREE.MathUtils.damp(p2Sim.shake, 0, 8, dt);

          const camDist2 = 6.8 + (p2Sim.speed / maxSpd) * 1.8;
          const camHeight2 = 2.4 + (p2Sim.speed / maxSpd) * 0.4;
          const sX2 = (Math.random() - 0.5) * p2Sim.shake;
          const sY2 = (Math.random() - 0.5) * p2Sim.shake;

          camera2.position.set(
            THREE.MathUtils.damp(camera2.position.x, p2Sim.x + sX2, 8, dt),
            THREE.MathUtils.damp(camera2.position.y, camHeight2 + sY2, 8, dt),
            p2Sim.z - camDist2
          );
          _camTarget.set(p2Sim.x, 1.2, p2Sim.z + 10);
          camera2.lookAt(_camTarget);

          camera2.fov = 65 + (p2Sim.speed / maxSpd) * 12;
          camera2.updateProjectionMatrix();

          // Track boundary collision check for P2
          const trackCenter2 = trackData.getTrackXAtZ(p2Sim.z);
          const distFromCenter2 = Math.abs(p2Sim.x - trackCenter2);
          if (distFromCenter2 > trackData.trackWidth / 2 - 0.5) {
            p2Sim.speed = Math.max(45, p2Sim.speed * 0.90);
            p2Sim.shake = 0.35;
            p2Sim.x = THREE.MathUtils.damp(
              p2Sim.x,
              trackCenter2 + Math.sign(p2Sim.x - trackCenter2) * (trackData.trackWidth / 2 - 0.7),
              12,
              dt
            );
            sound.playCrash();
          }
        }

        // Check bump between P1 and P2 (only if neither is answering)
        if (!p1IsAnswering && !p2IsAnswering) {
          const p1p2Dist = Math.hypot(p1Sim.x - p2Sim.x, p1Sim.z - p2Sim.z);
          if (p1p2Dist < 2.2) {
            const pushX = p1Sim.x > p2Sim.x ? 1 : -1;
            p1Sim.x += pushX * 0.45;
            p2Sim.x -= pushX * 0.45;
            sound.playCrash();
          }
        }
      }

      // --- Audio Engine Pitch ---
      if (mode === 'battle') {
        const p1Norm = p1IsAnswering ? 0.15 : p1Sim.speed / 320;
        const p2Norm = p2IsAnswering ? 0.15 : p2Sim.speed / 300;
        const maxNorm = Math.max(p1Norm, p2Norm);
        sound.updateEnginePitch(maxNorm, false);
      } else {
        const maxSpd = p1State.car.type === 'f1' ? 320 : p1State.car.type === 'cyber' ? 310 : 290;
        sound.updateEnginePitch(p1Sim.speed / maxSpd, false);
      }

      // --- 3. ANIMATE COMPETITOR CARS ("PESERTA LAIN") ---
      trackData.rivals.forEach((rival) => {
        const rivalSpeedWorld = (rival.baseSpeed / 3.6) * 1.5;
        rival.z += rivalSpeedWorld * dt;

        const roadCenter = trackData.getTrackXAtZ(rival.z);
        rival.laneChangeTimer -= dt;
        if (rival.laneChangeTimer <= 0) {
          rival.targetX = roadCenter + (Math.random() * 8.5 - 4.25);
          rival.laneChangeTimer = 2.5 + Math.random() * 3.5;
        }
        rival.x = THREE.MathUtils.damp(rival.x, rival.targetX, 2, dt);

        rival.modelResult.root.position.set(rival.x, 0, rival.z);

        rival.modelResult.wheels.forEach((w) => {
          w.children.forEach((c) => {
            c.rotation.x += (rivalSpeedWorld / 0.35) * dt;
          });
        });

        // Collision with P1 (Layar Kiri) - only if P1 is active (not shielded while answering)
        if (p1Sim.invulnerableTimer <= 0 && !p1Sim.isGameOver && !p1IsAnswering) {
          const dx = Math.abs(p1Sim.x - rival.x);
          const dz = Math.abs(p1Sim.z - rival.z);
          if (dx < 1.6 && dz < 3.2) {
            p1Sim.lives -= 1;
            p1Sim.speed = Math.max(20, p1Sim.speed * 0.4);
            p1Sim.shake = 0.55;
            p1Sim.invulnerableTimer = 2.0;
            sound.playCrash();

            if (p1Sim.lives <= 0) {
              p1Sim.isGameOver = true;
              p1Sim.lives = 0;
              callbacksRef.current.onGameOver(mode === 'battle' ? 'Pemain 2 (Kanan)' : undefined);
            }
          }
        }

        // Collision with P2 (Layar Kanan) - only if P2 is active
        if (
          mode === 'battle' &&
          p2CarResult &&
          p2Sim.invulnerableTimer <= 0 &&
          !p2Sim.isGameOver &&
          !p2IsAnswering
        ) {
          const dx = Math.abs(p2Sim.x - rival.x);
          const dz = Math.abs(p2Sim.z - rival.z);
          if (dx < 1.6 && dz < 3.2) {
            p2Sim.lives -= 1;
            p2Sim.speed = Math.max(20, p2Sim.speed * 0.4);
            p2Sim.shake = 0.55;
            p2Sim.invulnerableTimer = 2.0;
            sound.playCrash();

            if (p2Sim.lives <= 0) {
              p2Sim.isGameOver = true;
              p2Sim.lives = 0;
              callbacksRef.current.onGameOver('Pemain 1 (Kiri)');
            }
          }
        }
      });

      // --- 4. BONUS QUESTION ORBS ---
      trackData.bonusOrbs.forEach((orb: BonusOrb, idx: number) => {
        if (!orb.collected) {
          orb.mesh.rotation.y += dt * 1.5;
          orb.mesh.position.y = 1.25 + Math.sin(clock.getElapsedTime() * 3 + idx) * 0.2;

          // Pickup by P1 (Kiri) - only if P1 is not already answering
          if (!p1IsAnswering) {
            const distP1 = Math.hypot(p1Sim.x - orb.x, p1Sim.z - orb.z);
            if (distP1 < 2.2) {
              orb.collected = true;
              orb.mesh.visible = false;
              sound.playBonusPickup();
              callbacksRef.current.onTriggerQuestion('p1', idx);
            }
          }

          // Pickup by P2 (Kanan) - only if P2 is not already answering
          if (mode === 'battle' && !orb.collected && !p2IsAnswering) {
            const distP2 = Math.hypot(p2Sim.x - orb.x, p2Sim.z - orb.z);
            if (distP2 < 2.2) {
              orb.collected = true;
              orb.mesh.visible = false;
              sound.playBonusPickup();
              callbacksRef.current.onTriggerQuestion('p2', idx);
            }
          }
        }
      });

      // Check finish conditions
      if (mode === 'solo') {
        const kmReached = p1Sim.distance >= targetDistanceMeters;
        const allQuestionsAnswered = p1QuestionsAnsweredRef.current >= totalQuestions;

        // Finish condition: Both target KM reached AND all questions answered
        if (kmReached && allQuestionsAnswered && !p1Sim.isGameOver) {
          p1Sim.isGameOver = true;
          sound.playVictory();
          callbacksRef.current.onGameOver();
        } else if (kmReached && !allQuestionsAnswered && !p1IsAnswering) {
          // If km reached but still has unanswered questions, trigger next question so player can finish
          callbacksRef.current.onTriggerQuestion('p1', Math.floor(clock.getElapsedTime()));
        }
      } else {
        // Battle mode finish
        const p1Finished = p1Sim.distance >= targetDistanceMeters;
        const p2Finished = p2Sim && p2Sim.distance >= targetDistanceMeters;

        if ((p1Finished || p2Finished) && !p1Sim.isGameOver) {
          p1Sim.isGameOver = true;
          sound.playVictory();
          callbacksRef.current.onGameOver(
            p1Sim.score >= p2Sim.score ? 'Pemain 1 (Kiri)' : 'Pemain 2 (Kanan)'
          );
        }
      }

      callbacksRef.current.onUpdateP1((prev) => ({
        ...prev,
        speed: Math.round(p1Sim.speed),
        nitro: 0,
        isNitroActive: false,
        distance: Math.round(p1Sim.distance),
        score: p1Sim.score,
        lives: p1Sim.lives,
        isGameOver: p1Sim.isGameOver,
      }));

      if (mode === 'battle' && callbacksRef.current.onUpdateP2) {
        callbacksRef.current.onUpdateP2((prev) => ({
          ...prev,
          speed: Math.round(p2Sim.speed),
          nitro: 0,
          isNitroActive: false,
          distance: Math.round(p2Sim.distance),
          score: p2Sim.score,
          lives: p2Sim.lives,
          isGameOver: p2Sim.isGameOver,
        }));
      }

      // --- 5. RENDER VIEWPORTS: LEFT (P1) AND RIGHT (P2) FOR BATTLE ---
      const w = container.clientWidth;
      const h = container.clientHeight;

      if (mode === 'battle') {
        const halfW = Math.floor(w / 2);
        renderer.setScissorTest(true);

        // --- LAYAR KIRI: Pemain 1 ---
        camera1.aspect = halfW / h;
        camera1.updateProjectionMatrix();
        renderer.setViewport(0, 0, halfW, h);
        renderer.setScissor(0, 0, halfW, h);
        renderer.render(scene, camera1);

        // --- LAYAR KANAN: Pemain 2 ---
        camera2.aspect = halfW / h;
        camera2.updateProjectionMatrix();
        renderer.setViewport(halfW, 0, halfW, h);
        renderer.setScissor(halfW, 0, halfW, h);
        renderer.render(scene, camera2);
      } else {
        // Solo: Full Screen
        renderer.setScissorTest(false);
        camera1.aspect = w / h;
        camera1.updateProjectionMatrix();
        renderer.setViewport(0, 0, w, h);
        renderer.render(scene, camera1);
      }
    };

    animFrameId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      sound.stopEngine();
      p1NitroTrail.dispose(scene);
      if (p2NitroTrail) {
        p2NitroTrail.dispose(scene);
      }
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [
    mode,
    weather,
    targetDistanceMeters,
    totalQuestions,
    p1State.car.type,
    p1State.car.primaryColor,
    p1State.car.accentColor,
    p2State?.car.type,
    p2State?.car.primaryColor,
    p2State?.car.accentColor,
  ]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Vertical split screen divider line for battle mode (Layar Kiri & Kanan) */}
      {mode === 'battle' && (
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1.5 bg-gradient-to-b from-cyan-400 via-amber-400 to-rose-500 shadow-[0_0_15px_rgba(6,182,212,0.8)] z-30 pointer-events-none flex flex-col items-center justify-center">
          <div className="bg-slate-900 border border-cyan-400 text-cyan-300 px-2 py-1 text-[10px] font-black tracking-widest uppercase rounded shadow whitespace-nowrap -rotate-90">
            ◄ KIRI (P1) | KANAN (P2) ►
          </div>
        </div>
      )}
    </div>
  );
};
