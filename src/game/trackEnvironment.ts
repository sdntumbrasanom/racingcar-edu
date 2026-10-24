import * as THREE from 'three';
import { buildProceduralCar, ProceduralCarResult } from './carModels';
import { CarModelType, WeatherType, GameDifficulty } from '../types/game';

export interface BonusOrb {
  mesh: THREE.Group;
  cube: THREE.Mesh;
  z: number;
  x: number;
  collected: boolean;
}

export interface RivalCar {
  modelResult: ProceduralCarResult;
  x: number;
  z: number;
  baseSpeed: number;
  targetX: number;
  laneChangeTimer: number;
}

export interface TrackData {
  trackLength: number;
  trackWidth: number;
  bonusOrbs: BonusOrb[];
  rivals: RivalCar[];
  getTrackXAtZ: (z: number) => number;
}

// Procedural high-contrast asphalt road texture with crisp painted lines
export function createAsphaltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Rich asphalt base
    ctx.fillStyle = '#1c2128';
    ctx.fillRect(0, 0, 512, 512);

    // Asphalt noise grain
    for (let i = 0; i < 6000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const gray = Math.floor(35 + Math.random() * 30);
      ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Outer white solid edge lines (high visibility)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(14, 0, 14, 512);
    ctx.fillRect(484, 0, 14, 512);

    // Center double bright yellow dividing lines
    ctx.fillStyle = '#facc15';
    for (let y = 8; y < 512; y += 64) {
      ctx.fillRect(246, y, 8, 42);
      ctx.fillRect(258, y, 8, 42);
    }

    // Lane division dashed lines
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let y = 8; y < 512; y += 64) {
      ctx.fillRect(130, y, 8, 32);
      ctx.fillRect(374, y, 8, 32);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Red and white rumble kerb texture
export function createKerbTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 64, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 40);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Glowing bonus question crystal
export function createBonusQuestionOrb(x: number, z: number): BonusOrb {
  const orbGroup = new THREE.Group();
  orbGroup.position.set(x, 1.25, z);

  const cubeGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
  const cubeMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.1,
    roughness: 0.1,
    metalness: 0.85,
    transparent: true,
    opacity: 0.88,
  });
  const cube = new THREE.Mesh(cubeGeo, cubeMat);
  orbGroup.add(cube);

  const innerGeo = new THREE.OctahedronGeometry(0.48, 1);
  const innerMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    wireframe: true,
  });
  const inner = new THREE.Mesh(innerGeo, innerMat);
  orbGroup.add(inner);

  const ringGeo = new THREE.TorusGeometry(0.75, 0.04, 8, 24);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  orbGroup.add(ring);

  const spotGeo = new THREE.CircleGeometry(0.9, 16);
  const spotMat = new THREE.MeshBasicMaterial({
    color: 0x0284c7,
    transparent: true,
    opacity: 0.45,
  });
  const spot = new THREE.Mesh(spotGeo, spotMat);
  spot.rotation.x = -Math.PI / 2;
  spot.position.y = -1.22;
  orbGroup.add(spot);

  return {
    mesh: orbGroup,
    cube,
    x,
    z,
    collected: false,
  };
}

function createTree(x: number, z: number, scale = 1): THREE.Group {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);
  tree.scale.set(scale, scale, scale);

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.9 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 3.2, 7), trunkMat);
  trunk.position.y = 1.6;
  trunk.castShadow = true;
  tree.add(trunk);

  const foliageMat = new THREE.MeshStandardMaterial({
    color: Math.random() > 0.5 ? 0x15803d : 0x166534,
    roughness: 0.8,
  });

  [2.8, 4.0, 5.0].forEach((y, idx) => {
    const radius = 1.5 - idx * 0.35;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(radius, 1.8, 7), foliageMat);
    cone.position.y = y;
    cone.castShadow = true;
    tree.add(cone);
  });

  return tree;
}

/**
 * Builds an expansive Grand Prix circuit with 3D mountains, dynamic sky, and finish line
 */
export function buildRaceCircuit(
  scene: THREE.Scene,
  trackLength = 10000,
  weather: WeatherType = 'cerah',
  finishDistance = 3000,
  difficulty: GameDifficulty = 'medium'
): TrackData {
  const trackWidth = 14.5;
  const startZ = -100;
  const endZ = trackLength + 200;
  const stepZ = 5; // 5 meter slices for silky smooth curves
  const numSlices = Math.floor((endZ - startZ) / stepZ);

  // Smooth realistic track curvature formula
  const getTrackXAtZ = (z: number): number => {
    return Math.sin(z * 0.003) * 16 + Math.sin(z * 0.009) * 8;
  };

  // --- 1. BUILD CONTINUOUS ROAD SURFACE BUFFERGEOMETRY ---
  const roadPositions: number[] = [];
  const roadNormals: number[] = [];
  const roadUvs: number[] = [];
  const roadIndices: number[] = [];

  for (let i = 0; i <= numSlices; i++) {
    const z = startZ + i * stepZ;
    const cx = getTrackXAtZ(z);
    const leftX = cx + trackWidth / 2; // +X is Left on screen
    const rightX = cx - trackWidth / 2; // -X is Right on screen
    const y = 0.02;

    // Left vertex
    roadPositions.push(leftX, y, z);
    roadNormals.push(0, 1, 0);
    roadUvs.push(0, z / 22);

    // Right vertex
    roadPositions.push(rightX, y, z);
    roadNormals.push(0, 1, 0);
    roadUvs.push(1, z / 22);

    if (i < numSlices) {
      const v0 = i * 2;
      const v1 = i * 2 + 1;
      const v2 = (i + 1) * 2;
      const v3 = (i + 1) * 2 + 1;
      // Two triangles per quad
      roadIndices.push(v0, v1, v2);
      roadIndices.push(v1, v3, v2);
    }
  }

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPositions, 3));
  roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(roadNormals, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
  roadGeo.setIndex(roadIndices);

  const asphaltTex = createAsphaltTexture();
  const roadMat = new THREE.MeshStandardMaterial({
    map: asphaltTex,
    roughness: 0.75,
    metalness: 0.2,
  });
  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.receiveShadow = true;
  scene.add(roadMesh);

  // --- 2. BUILD CONTINUOUS RED-WHITE APEX KERBS ---
  const kerbTex = createKerbTexture();
  const kerbMat = new THREE.MeshStandardMaterial({
    map: kerbTex,
    roughness: 0.6,
    metalness: 0.2,
  });

  // Left kerb ribbon
  const leftKerbPos: number[] = [];
  const leftKerbUvs: number[] = [];
  const leftKerbIdx: number[] = [];
  const kerbW = 0.85;

  for (let i = 0; i <= numSlices; i++) {
    const z = startZ + i * stepZ;
    const cx = getTrackXAtZ(z);
    const innerX = cx + trackWidth / 2;
    const outerX = innerX + kerbW;

    leftKerbPos.push(outerX, 0.03, z);
    leftKerbUvs.push(0, z / 4);

    leftKerbPos.push(innerX, 0.03, z);
    leftKerbUvs.push(1, z / 4);

    if (i < numSlices) {
      const v0 = i * 2;
      const v1 = i * 2 + 1;
      const v2 = (i + 1) * 2;
      const v3 = (i + 1) * 2 + 1;
      leftKerbIdx.push(v0, v1, v2, v1, v3, v2);
    }
  }

  const leftKerbGeo = new THREE.BufferGeometry();
  leftKerbGeo.setAttribute('position', new THREE.Float32BufferAttribute(leftKerbPos, 3));
  leftKerbGeo.setAttribute('uv', new THREE.Float32BufferAttribute(leftKerbUvs, 2));
  leftKerbGeo.computeVertexNormals();
  leftKerbGeo.setIndex(leftKerbIdx);
  const leftKerbMesh = new THREE.Mesh(leftKerbGeo, kerbMat);
  scene.add(leftKerbMesh);

  // Right kerb ribbon
  const rightKerbPos: number[] = [];
  const rightKerbUvs: number[] = [];
  const rightKerbIdx: number[] = [];

  for (let i = 0; i <= numSlices; i++) {
    const z = startZ + i * stepZ;
    const cx = getTrackXAtZ(z);
    const innerX = cx - trackWidth / 2;
    const outerX = innerX - kerbW;

    rightKerbPos.push(innerX, 0.03, z);
    rightKerbUvs.push(0, z / 4);

    rightKerbPos.push(outerX, 0.03, z);
    rightKerbUvs.push(1, z / 4);

    if (i < numSlices) {
      const v0 = i * 2;
      const v1 = i * 2 + 1;
      const v2 = (i + 1) * 2;
      const v3 = (i + 1) * 2 + 1;
      rightKerbIdx.push(v0, v1, v2, v1, v3, v2);
    }
  }

  const rightKerbGeo = new THREE.BufferGeometry();
  rightKerbGeo.setAttribute('position', new THREE.Float32BufferAttribute(rightKerbPos, 3));
  rightKerbGeo.setAttribute('uv', new THREE.Float32BufferAttribute(rightKerbUvs, 2));
  rightKerbGeo.computeVertexNormals();
  rightKerbGeo.setIndex(rightKerbIdx);
  const rightKerbMesh = new THREE.Mesh(rightKerbGeo, kerbMat);
  scene.add(rightKerbMesh);

  // --- 3. EXPANSIVE RUNOFF VERGES (GRASS & GRAVEL RUNOFF BEDS) ---
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.95 });
  [1, -1].forEach((dir) => {
    const vPos: number[] = [];
    const vIdx: number[] = [];
    for (let i = 0; i <= numSlices; i++) {
      const z = startZ + i * stepZ;
      const cx = getTrackXAtZ(z);
      const innerX = cx + dir * (trackWidth / 2 + kerbW);
      const outerX = cx + dir * (trackWidth / 2 + 11.5);
      vPos.push(innerX, 0.015, z);
      vPos.push(outerX, 0.015, z);
      if (i < numSlices) {
        const v0 = i * 2;
        const v1 = i * 2 + 1;
        const v2 = (i + 1) * 2;
        const v3 = (i + 1) * 2 + 1;
        vIdx.push(v0, v1, v2, v1, v3, v2);
      }
    }
    const vGeo = new THREE.BufferGeometry();
    vGeo.setAttribute('position', new THREE.Float32BufferAttribute(vPos, 3));
    vGeo.computeVertexNormals();
    vGeo.setIndex(vIdx);
    scene.add(new THREE.Mesh(vGeo, grassMat));
  });

  // --- 4. SLEEK PERIMETER SPONSOR BARRIERS (AT EDGE OF RUNOFF) ---
  const barrierMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.85,
    roughness: 0.3,
  });
  const neonMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

  [trackWidth / 2 + 11.5, -trackWidth / 2 - 11.5].forEach((offset) => {
    const bPos: number[] = [];
    const bIdx: number[] = [];
    for (let i = 0; i <= numSlices; i++) {
      const z = startZ + i * stepZ;
      const x = getTrackXAtZ(z) + offset;
      bPos.push(x, 0.05, z);
      bPos.push(x, 0.85, z);
      if (i < numSlices) {
        const v0 = i * 2;
        const v1 = i * 2 + 1;
        const v2 = (i + 1) * 2;
        const v3 = (i + 1) * 2 + 1;
        bIdx.push(v0, v1, v2, v1, v3, v2);
      }
    }
    const bGeo = new THREE.BufferGeometry();
    bGeo.setAttribute('position', new THREE.Float32BufferAttribute(bPos, 3));
    bGeo.computeVertexNormals();
    bGeo.setIndex(bIdx);
    scene.add(new THREE.Mesh(bGeo, barrierMat));

    // Top glowing neon rail
    const nPos: number[] = [];
    const nIdx: number[] = [];
    for (let i = 0; i <= numSlices; i++) {
      const z = startZ + i * stepZ;
      const x = getTrackXAtZ(z) + offset;
      nPos.push(x, 0.85, z);
      nPos.push(x, 0.95, z);
      if (i < numSlices) {
        const v0 = i * 2;
        const v1 = i * 2 + 1;
        const v2 = (i + 1) * 2;
        const v3 = (i + 1) * 2 + 1;
        nIdx.push(v0, v1, v2, v1, v3, v2);
      }
    }
    const nGeo = new THREE.BufferGeometry();
    nGeo.setAttribute('position', new THREE.Float32BufferAttribute(nPos, 3));
    nGeo.computeVertexNormals();
    nGeo.setIndex(nIdx);
    scene.add(new THREE.Mesh(nGeo, neonMat));
  });

  // --- 5. EXPANSIVE GROUND TERRAIN ---
  const terrainGeo = new THREE.PlaneGeometry(1800, trackLength + 1000, 16, 64);
  terrainGeo.rotateX(-Math.PI / 2);
  const terrainMat = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.95,
  });
  const terrain = new THREE.Mesh(terrainGeo, terrainMat);
  terrain.position.set(0, -0.05, trackLength / 2);
  terrain.receiveShadow = true;
  scene.add(terrain);

  // --- 6. FLOODLIGHT TOWERS & STREET LAMPS EVERY 75 METERS ---
  const lightPoleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
  const lightGlowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

  for (let lz = 20; lz < trackLength; lz += 75) {
    const isLeft = (lz / 75) % 2 === 0;
    const lx = getTrackXAtZ(lz) + (isLeft ? trackWidth / 2 + 13.0 : -trackWidth / 2 - 13.0);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 9, 8), lightPoleMat);
    pole.position.set(lx, 4.5, lz);
    scene.add(pole);

    const lampBox = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 0.6), lightGlowMat);
    lampBox.position.set(lx, 9.0, lz);
    scene.add(lampBox);

    // Pine trees along outer perimeter
    const tx = lx + (isLeft ? 5 : -5);
    scene.add(createTree(tx, lz, 0.9 + Math.random() * 0.3));
  }

  // --- 7. OVERHEAD CHECKPOINT GANTRIES EVERY 300 METERS ---
  const gantryPillarMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85 });
  for (let gz = 250; gz < trackLength; gz += 300) {
    const gx = getTrackXAtZ(gz);
    const gantry = new THREE.Group();
    gantry.position.set(gx, 0, gz);

    // Left pillar
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 7.0, 0.8), gantryPillarMat);
    p1.position.set(trackWidth / 2 + 12.2, 3.5, 0);
    gantry.add(p1);

    // Right pillar
    const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 7.0, 0.8), gantryPillarMat);
    p2.position.set(-trackWidth / 2 - 12.2, 3.5, 0);
    gantry.add(p2);

    // Truss spanning across track and runoff
    const truss = new THREE.Mesh(new THREE.BoxGeometry(trackWidth + 25.5, 1.2, 0.9), gantryPillarMat);
    truss.position.set(0, 6.4, 0);
    gantry.add(truss);

    // Electronic LED Distance / Speed Sign
    const signMat = new THREE.MeshBasicMaterial({ color: gz % 600 === 0 ? 0x06b6d4 : 0xf59e0b });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(trackWidth + 18, 0.8), signMat);
    sign.position.set(0, 6.4, 0.48);
    gantry.add(sign);

    scene.add(gantry);
  }

  // --- 8. SPECTATOR GRANDSTANDS ---
  for (let sz = 150; sz < trackLength - 200; sz += 450) {
    const isLeft = (sz / 450) % 2 === 0;
    const sx = getTrackXAtZ(sz) + (isLeft ? trackWidth / 2 + 18 : -trackWidth / 2 - 18);

    const standGroup = new THREE.Group();
    standGroup.position.set(sx, 0, sz);

    const stand = new THREE.Mesh(
      new THREE.BoxGeometry(10, 5, 45),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 })
    );
    stand.position.y = 2.5;
    standGroup.add(stand);

    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(11, 0.4, 46),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 })
    );
    roof.position.y = 5.2;
    roof.rotation.z = isLeft ? -0.06 : 0.06;
    standGroup.add(roof);

    scene.add(standGroup);
  }

  // --- 9. POPULATE BONUS QUESTION ORBS (EVERY 110M) ---
  const bonusOrbs: BonusOrb[] = [];
  for (let z = 100; z < trackLength - 100; z += 110) {
    const trackCenter = getTrackXAtZ(z);
    const laneOffset = ((z / 110) % 3 - 1) * 3.6;
    const orb = createBonusQuestionOrb(trackCenter + laneOffset, z);
    scene.add(orb.mesh);
    bonusOrbs.push(orb);
  }

  // --- 10. POPULATE COMPETITOR RACE CARS ("PESERTA LAIN") BASED ON DIFFICULTY ---
  const rivals: RivalCar[] = [];
  const rivalTypes: CarModelType[] = ['gt', 'muscle', 'cyber', 'rally', 'f1', 'prototype'];
  const rivalColors = [
    '#e11d48', '#2563eb', '#16a34a', '#d97706', '#9333ea', '#0284c7',
    '#ea580c', '#059669', '#4f46e5', '#db2777', '#ca8a04', '#0891b2',
  ];

  // Difficulty configurations:
  // - Easy: 28 cars spaced ~135m, base speed 115-155 km/h, calm lane change
  // - Medium: 48 cars spaced ~85m, base speed 135-215 km/h, balanced lane change
  // - Hard: 75 cars spaced ~52m, base speed 165-255 km/h, fast & frequent lane changes
  const diffConfig = {
    easy: {
      count: 28,
      spacing: 135,
      minSpeed: 115,
      speedSpread: 40,
      laneTimerMin: 3.5,
      laneTimerSpread: 3.0,
    },
    medium: {
      count: 48,
      spacing: 85,
      minSpeed: 135,
      speedSpread: 80,
      laneTimerMin: 2.0,
      laneTimerSpread: 2.5,
    },
    hard: {
      count: 75,
      spacing: 52,
      minSpeed: 165,
      speedSpread: 90,
      laneTimerMin: 1.2,
      laneTimerSpread: 1.8,
    },
  }[difficulty] || {
    count: 48,
    spacing: 85,
    minSpeed: 135,
    speedSpread: 80,
    laneTimerMin: 2.0,
    laneTimerSpread: 2.5,
  };

  for (let i = 0; i < diffConfig.count; i++) {
    const rz = 45 + i * diffConfig.spacing;
    const rx = getTrackXAtZ(rz) + (Math.random() * 8.5 - 4.25);
    const type = rivalTypes[i % rivalTypes.length];
    const color = rivalColors[i % rivalColors.length];

    const modelResult = buildProceduralCar(type, color, '#ffffff');
    modelResult.root.position.set(rx, 0, rz);
    scene.add(modelResult.root);

    rivals.push({
      modelResult,
      x: rx,
      z: rz,
      baseSpeed: diffConfig.minSpeed + Math.random() * diffConfig.speedSpread,
      targetX: rx,
      laneChangeTimer: diffConfig.laneTimerMin + Math.random() * diffConfig.laneTimerSpread,
    });
  }

  // --- 11. BUILD 3D MOUNTAIN RANGES & ATMOSPHERIC SKY FEATURES ---
  buildMountainsAndSky(scene, trackLength, getTrackXAtZ, weather);

  // --- 12. BUILD FINISH LINE GANTRY AT TARGET DISTANCE ---
  buildFinishLine(scene, finishDistance, getTrackXAtZ(finishDistance), trackWidth);

  return {
    trackLength,
    trackWidth,
    bonusOrbs,
    rivals,
    getTrackXAtZ,
  };
}

/**
 * Builds 3D procedural low-poly mountain ranges along the track horizon
 * with snow caps and dynamic sky elements (Cerah vs Mendung)
 */
export function buildMountainsAndSky(
  scene: THREE.Scene,
  trackLength: number,
  getTrackXAtZ: (z: number) => number,
  weather: WeatherType
): void {
  const isCerah = weather === 'cerah';

  // 1. Mountain Rock & Snow Materials
  const rockMat = new THREE.MeshStandardMaterial({
    color: isCerah ? 0x475569 : 0x334155,
    roughness: 0.92,
    metalness: 0.1,
    flatShading: true,
  });

  const distantRockMat = new THREE.MeshStandardMaterial({
    color: isCerah ? 0x64748b : 0x1e293b,
    roughness: 0.95,
    flatShading: true,
  });

  const snowMat = new THREE.MeshStandardMaterial({
    color: isCerah ? 0xf8fafc : 0x94a3b8,
    roughness: 0.6,
    metalness: 0.05,
    flatShading: true,
  });

  // Staggered Mountain Peaks on Left (+X) and Right (-X)
  const mountainSegments = 6;
  const stepZ = 120;

  for (let z = -200; z < trackLength + 600; z += stepZ) {
    const cx = getTrackXAtZ(z);

    // Left Mountains: Inner ridge
    const leftPeakHeight1 = 70 + ((z * 37) % 55);
    const leftRad1 = 60 + ((z * 13) % 40);
    const leftDist1 = cx + 170 + ((z * 23) % 45);

    const mLeft1 = new THREE.Mesh(
      new THREE.ConeGeometry(leftRad1, leftPeakHeight1, mountainSegments),
      rockMat
    );
    mLeft1.position.set(leftDist1, leftPeakHeight1 / 2, z);
    scene.add(mLeft1);

    // Snow cap for tall peaks
    if (leftPeakHeight1 > 88) {
      const snowHeight = leftPeakHeight1 * 0.28;
      const snowCap = new THREE.Mesh(
        new THREE.ConeGeometry(leftRad1 * 0.28, snowHeight, mountainSegments),
        snowMat
      );
      snowCap.position.set(leftDist1, leftPeakHeight1 - snowHeight / 2, z);
      scene.add(snowCap);
    }

    // Far Left Mountains: Taller mountain ridge
    const leftPeakHeight2 = 125 + ((z * 71) % 70);
    const leftRad2 = 110 + ((z * 31) % 60);
    const leftDist2 = cx + 330 + ((z * 17) % 60);
    const mLeft2 = new THREE.Mesh(
      new THREE.ConeGeometry(leftRad2, leftPeakHeight2, mountainSegments),
      distantRockMat
    );
    mLeft2.position.set(leftDist2, leftPeakHeight2 / 2, z + 60);
    scene.add(mLeft2);

    if (leftPeakHeight2 > 130) {
      const snowHeight2 = leftPeakHeight2 * 0.26;
      const snowCap2 = new THREE.Mesh(
        new THREE.ConeGeometry(leftRad2 * 0.26, snowHeight2, mountainSegments),
        snowMat
      );
      snowCap2.position.set(leftDist2, leftPeakHeight2 - snowHeight2 / 2, z + 60);
      scene.add(snowCap2);
    }

    // Right Mountains: Inner ridge
    const rightPeakHeight1 = 68 + ((z * 43) % 60);
    const rightRad1 = 58 + ((z * 19) % 45);
    const rightDist1 = cx - 170 - ((z * 29) % 50);

    const mRight1 = new THREE.Mesh(
      new THREE.ConeGeometry(rightRad1, rightPeakHeight1, mountainSegments),
      rockMat
    );
    mRight1.position.set(rightDist1, rightPeakHeight1 / 2, z + 30);
    scene.add(mRight1);

    if (rightPeakHeight1 > 85) {
      const snowHeight = rightPeakHeight1 * 0.28;
      const snowCap = new THREE.Mesh(
        new THREE.ConeGeometry(rightRad1 * 0.28, snowHeight, mountainSegments),
        snowMat
      );
      snowCap.position.set(rightDist1, rightPeakHeight1 - snowHeight / 2, z + 30);
      scene.add(snowCap);
    }

    // Far Right Mountains: Taller mountain ridge
    const rightPeakHeight2 = 120 + ((z * 67) % 75);
    const rightRad2 = 105 + ((z * 23) % 65);
    const rightDist2 = cx - 340 - ((z * 41) % 60);
    const mRight2 = new THREE.Mesh(
      new THREE.ConeGeometry(rightRad2, rightPeakHeight2, mountainSegments),
      distantRockMat
    );
    mRight2.position.set(rightDist2, rightPeakHeight2 / 2, z - 25);
    scene.add(mRight2);

    if (rightPeakHeight2 > 130) {
      const snowHeight2 = rightPeakHeight2 * 0.26;
      const snowCap2 = new THREE.Mesh(
        new THREE.ConeGeometry(rightRad2 * 0.26, snowHeight2, mountainSegments),
        snowMat
      );
      snowCap2.position.set(rightDist2, rightPeakHeight2 - snowHeight2 / 2, z - 25);
      scene.add(snowCap2);
    }
  }

  // 2. Clouds in the sky
  const cloudMat = new THREE.MeshStandardMaterial({
    color: isCerah ? 0xffffff : 0x64748b,
    roughness: 1.0,
    flatShading: true,
    transparent: true,
    opacity: isCerah ? 0.92 : 0.78,
  });

  for (let cz = 0; cz < trackLength; cz += 190) {
    const cloud = new THREE.Group();
    const cx = getTrackXAtZ(cz) + ((cz * 17) % 240 - 120);
    const cy = 90 + ((cz * 7) % 45);

    const p1 = new THREE.Mesh(new THREE.DodecahedronGeometry(14, 1), cloudMat);
    p1.position.set(0, 0, 0);
    cloud.add(p1);

    const p2 = new THREE.Mesh(new THREE.DodecahedronGeometry(10, 1), cloudMat);
    p2.position.set(11, 2, 0);
    cloud.add(p2);

    const p3 = new THREE.Mesh(new THREE.DodecahedronGeometry(11, 1), cloudMat);
    p3.position.set(-11, -1, 3);
    cloud.add(p3);

    cloud.position.set(cx, cy, cz);
    scene.add(cloud);
  }

  // 3. Glowing Sun for Cerah mode
  if (isCerah) {
    const sunGeo = new THREE.SphereGeometry(35, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
    });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.set(160, 240, 500);
    scene.add(sunMesh);
  }
}

/**
 * Builds the iconic Checkered Finish Line arch and road markings
 */
export function buildFinishLine(scene: THREE.Scene, finishZ: number, cx: number, trackWidth: number): void {
  const gantryGroup = new THREE.Group();
  gantryGroup.position.set(cx, 0, finishZ);

  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85 });
  const p1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 9.5, 1.2), pillarMat);
  p1.position.set(trackWidth / 2 + 2.5, 4.75, 0);
  gantryGroup.add(p1);

  const p2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 9.5, 1.2), pillarMat);
  p2.position.set(-trackWidth / 2 - 2.5, 4.75, 0);
  gantryGroup.add(p2);

  const arch = new THREE.Mesh(new THREE.BoxGeometry(trackWidth + 6.2, 2.2, 1.4), pillarMat);
  arch.position.set(0, 8.6, 0);
  gantryGroup.add(arch);

  // Finish Board Text / Texture
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Checkered background
    const size = 16;
    for (let x = 0; x < 512; x += size) {
      for (let y = 0; y < 128; y += size) {
        ctx.fillStyle = ((x / size + y / size) % 2 === 0) ? '#ffffff' : '#000000';
        ctx.fillRect(x, y, size, size);
      }
    }
    // Red center banner
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(40, 20, 432, 88);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏁 GARIS FINISH 🏁', 256, 64);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const bannerMat = new THREE.MeshBasicMaterial({ map: tex });
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(trackWidth + 2, 2.0), bannerMat);
  banner.position.set(0, 8.6, 0.73);
  gantryGroup.add(banner);

  scene.add(gantryGroup);
}
