import * as THREE from 'three';
import { CarModelType, CarSpecs } from '../types/game';

export const CAR_PRESETS: CarSpecs[] = [
  {
    type: 'f1',
    name: 'Apex Formula F1',
    subtitle: 'Kecepatan Murni & Downforce Aerodinamis',
    topSpeed: 320,
    acceleration: 9.5,
    handling: 9.2,
    nitroBoost: 1.6,
    primaryColor: '#ef4444', // Racing Red
    accentColor: '#ffffff',
  },
  {
    type: 'gt',
    name: 'Viper GT3 Supercar',
    subtitle: 'Stabilitas Tikungan & Tenaga Twin-Turbo',
    topSpeed: 295,
    acceleration: 8.8,
    handling: 9.0,
    nitroBoost: 1.5,
    primaryColor: '#0ea5e9', // Gulf Cyan
    accentColor: '#f97316',
  },
  {
    type: 'cyber',
    name: 'Cyberpunk Hypercar',
    subtitle: 'Teknologi Masa Depan & Nitro Quantum',
    topSpeed: 310,
    acceleration: 9.8,
    handling: 8.5,
    nitroBoost: 1.8,
    primaryColor: '#a855f7', // Cyber Purple
    accentColor: '#06b6d4',
  },
  {
    type: 'muscle',
    name: 'Falcon V8 Muscle',
    subtitle: 'Torsi Brutal Amerika & Suara Gahar',
    topSpeed: 280,
    acceleration: 8.2,
    handling: 7.8,
    nitroBoost: 1.7,
    primaryColor: '#f59e0b', // Amber Gold
    accentColor: '#1e293b',
  },
  {
    type: 'rally',
    name: 'Rally Turbo 4WD',
    subtitle: 'Manuver Lincah & Daya Cengkeram Ekstrem',
    topSpeed: 270,
    acceleration: 9.0,
    handling: 9.6,
    nitroBoost: 1.45,
    primaryColor: '#22c55e', // Acid Lime
    accentColor: '#ffffff',
  },
  {
    type: 'prototype',
    name: 'Le Mans Prototype',
    subtitle: 'Ketahanan Balap 24 Jam & Efisiensi Puncak',
    topSpeed: 305,
    acceleration: 9.2,
    handling: 9.1,
    nitroBoost: 1.55,
    primaryColor: '#3b82f6', // Cobalt Racing Blue
    accentColor: '#ef4444',
  },
];

export const COLOR_OPTIONS = [
  { name: 'Rosso Corsa (Merah Balap)', hex: '#dc2626', accent: '#ffffff' },
  { name: 'Gulf Electric (Biru Muda)', hex: '#0284c7', accent: '#f97316' },
  { name: 'Acid Toxic (Hijau Neon)', hex: '#16a34a', accent: '#000000' },
  { name: 'Imperial Gold (Emas Juara)', hex: '#d97706', accent: '#18181b' },
  { name: 'Cyber Violet (Ungu Neon)', hex: '#7c3aed', accent: '#06b6d4' },
  { name: 'Stealth Carbon (Hitam Matte)', hex: '#18181b', accent: '#ef4444' },
  { name: 'Alpine Frost (Putih Kristal)', hex: '#f8fafc', accent: '#2563eb' },
  { name: 'Sunset Blaze (Oranye Menyala)', hex: '#ea580c', accent: '#ffffff' },
];

// Helper to create detailed wheel assembly (tire + alloy rim + center cap + brake disc)
function createWheel(wheelRadius = 0.35, wheelWidth = 0.28, rimColor = 0xc0c0c0): THREE.Group {
  const wheelGroup = new THREE.Group();

  // Rubber tire
  const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 20);
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x181818,
    roughness: 0.9,
    metalness: 0.1,
  });
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = true;
  wheelGroup.add(tire);

  // Alloy Rim
  const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.72, wheelRadius * 0.72, wheelWidth + 0.01, 16);
  const rimMat = new THREE.MeshStandardMaterial({
    color: rimColor,
    roughness: 0.25,
    metalness: 0.85,
  });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.z = Math.PI / 2;
  wheelGroup.add(rim);

  // Center hub nut
  const hubGeo = new THREE.CylinderGeometry(wheelRadius * 0.2, wheelRadius * 0.2, wheelWidth + 0.03, 10);
  const hubMat = new THREE.MeshStandardMaterial({
    color: 0xff1010,
    metalness: 0.9,
    roughness: 0.2,
  });
  const hub = new THREE.Mesh(hubGeo, hubMat);
  hub.rotation.z = Math.PI / 2;
  wheelGroup.add(hub);

  return wheelGroup;
}

export interface ProceduralCarResult {
  root: THREE.Group;
  wheels: THREE.Group[];
  frontLeftWheel: THREE.Group;
  frontRightWheel: THREE.Group;
  exhaustPipes: THREE.Mesh[];
  headlights: THREE.Mesh[];
  bodyMesh: THREE.Mesh;
  nitroFlames: THREE.Mesh[];
}

/**
 * Builds a highly realistic 3D racing car composite assembly (8-14 parts per car)
 */
export function buildProceduralCar(
  modelType: CarModelType,
  primaryColorHex: string,
  accentColorHex: string
): ProceduralCarResult {
  const carRoot = new THREE.Group();
  const wheels: THREE.Group[] = [];
  const headlights: THREE.Mesh[] = [];
  const exhaustPipes: THREE.Mesh[] = [];
  const nitroFlames: THREE.Mesh[] = [];

  const primColor = new THREE.Color(primaryColorHex);
  const accColor = new THREE.Color(accentColorHex);

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: primColor,
    roughness: 0.2,
    metalness: 0.7,
  });

  const accentMaterial = new THREE.MeshStandardMaterial({
    color: accColor,
    roughness: 0.35,
    metalness: 0.5,
  });

  const carbonMaterial = new THREE.MeshStandardMaterial({
    color: 0x151515,
    roughness: 0.6,
    metalness: 0.3,
  });

  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x112233,
    roughness: 0.1,
    metalness: 0.9,
    transparent: true,
    opacity: 0.75,
  });

  const headlightMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x88ccff,
    emissiveIntensity: 1.5,
    roughness: 0.1,
  });

  const taillightMaterial = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xff1111,
    emissiveIntensity: 1.2,
    roughness: 0.2,
  });

  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: 0xe0e0e0,
    metalness: 0.95,
    roughness: 0.1,
  });

  let mainBody: THREE.Mesh;
  const wheelBaseX = 0.85;
  const wheelY = 0.35;
  let frontZ = 1.3;
  let rearZ = -1.3;

  if (modelType === 'f1') {
    // 1. APEX FORMULA 1 CAR
    // Main narrow chassis
    const bodyGeo = new THREE.BoxGeometry(0.7, 0.35, 3.4);
    mainBody = new THREE.Mesh(bodyGeo, bodyMaterial);
    mainBody.position.y = 0.35;
    mainBody.castShadow = true;
    carRoot.add(mainBody);

    // Tapered front nose cone
    const noseGeo = new THREE.ConeGeometry(0.35, 1.2, 8);
    const nose = new THREE.Mesh(noseGeo, bodyMaterial);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.32, 2.2);
    carRoot.add(nose);

    // Front aerofoil wing
    const fWingGeo = new THREE.BoxGeometry(1.9, 0.05, 0.45);
    const fWing = new THREE.Mesh(fWingGeo, carbonMaterial);
    fWing.position.set(0, 0.2, 2.3);
    fWing.castShadow = true;
    carRoot.add(fWing);

    // Side aerodynamic pods
    [-0.55, 0.55].forEach((xSide) => {
      const podGeo = new THREE.BoxGeometry(0.35, 0.35, 1.6);
      const pod = new THREE.Mesh(podGeo, bodyMaterial);
      pod.position.set(xSide, 0.35, 0.1);
      carRoot.add(pod);

      // Intake grille
      const grilleGeo = new THREE.BoxGeometry(0.3, 0.25, 0.05);
      const grille = new THREE.Mesh(grilleGeo, carbonMaterial);
      grille.position.set(xSide, 0.35, 0.92);
      carRoot.add(grille);
    });

    // Cockpit opening and Halo bar
    const cockpitGeo = new THREE.BoxGeometry(0.45, 0.25, 0.7);
    const cockpit = new THREE.Mesh(cockpitGeo, carbonMaterial);
    cockpit.position.set(0, 0.45, 0.2);
    carRoot.add(cockpit);

    const haloGeo = new THREE.TorusGeometry(0.28, 0.04, 8, 16, Math.PI);
    const halo = new THREE.Mesh(haloGeo, chromeMaterial);
    halo.position.set(0, 0.65, 0.25);
    halo.rotation.x = Math.PI / 4;
    carRoot.add(halo);

    // Rear wing assembly
    const rWingGeo = new THREE.BoxGeometry(1.6, 0.08, 0.4);
    const rWing = new THREE.Mesh(rWingGeo, accentMaterial);
    rWing.position.set(0, 0.95, -1.8);
    carRoot.add(rWing);

    // Rear wing struts
    [-0.4, 0.4].forEach((xSide) => {
      const strutGeo = new THREE.BoxGeometry(0.04, 0.6, 0.2);
      const strut = new THREE.Mesh(strutGeo, carbonMaterial);
      strut.position.set(xSide, 0.65, -1.8);
      carRoot.add(strut);
    });

    // Wheels config (wider track for F1)
    frontZ = 1.4;
    rearZ = -1.4;

  } else if (modelType === 'gt') {
    // 2. GT3 SUPERCAR
    // Main sculpted wedge body
    const bodyGeo = new THREE.BoxGeometry(1.5, 0.45, 3.6);
    mainBody = new THREE.Mesh(bodyGeo, bodyMaterial);
    mainBody.position.y = 0.4;
    mainBody.castShadow = true;
    carRoot.add(mainBody);

    // Sleek cockpit greenhouse canopy
    const cabinGeo = new THREE.BoxGeometry(1.2, 0.45, 1.8);
    const cabin = new THREE.Mesh(cabinGeo, glassMaterial);
    cabin.position.set(0, 0.75, -0.1);
    cabin.castShadow = true;
    carRoot.add(cabin);

    // Roof scoop
    const scoopGeo = new THREE.BoxGeometry(0.35, 0.12, 0.5);
    const scoop = new THREE.Mesh(scoopGeo, accentMaterial);
    scoop.position.set(0, 1.02, 0.05);
    carRoot.add(scoop);

    // Front splitter
    const splitterGeo = new THREE.BoxGeometry(1.6, 0.06, 0.5);
    const splitter = new THREE.Mesh(splitterGeo, carbonMaterial);
    splitter.position.set(0, 0.18, 1.8);
    carRoot.add(splitter);

    // Aggressive GT rear wing
    const gtWingGeo = new THREE.BoxGeometry(1.65, 0.08, 0.45);
    const gtWing = new THREE.Mesh(gtWingGeo, accentMaterial);
    gtWing.position.set(0, 0.95, -1.75);
    carRoot.add(gtWing);

    [-0.45, 0.45].forEach((x) => {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.45, 0.15), carbonMaterial);
      strut.position.set(x, 0.72, -1.75);
      carRoot.add(strut);
    });

    // Side aero skirts
    [-0.78, 0.78].forEach((x) => {
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 2.2), carbonMaterial);
      skirt.position.set(x, 0.22, 0);
      carRoot.add(skirt);
    });

  } else if (modelType === 'cyber') {
    // 3. CYBERPUNK HYPERCAR
    const bodyGeo = new THREE.BoxGeometry(1.55, 0.4, 3.8);
    mainBody = new THREE.Mesh(bodyGeo, bodyMaterial);
    mainBody.position.y = 0.38;
    carRoot.add(mainBody);

    // Angular cockpit visor
    const canopyGeo = new THREE.ConeGeometry(0.8, 1.6, 4);
    const canopy = new THREE.Mesh(canopyGeo, glassMaterial);
    canopy.rotation.x = Math.PI / 2;
    canopy.rotation.y = Math.PI / 4;
    canopy.position.set(0, 0.75, 0.1);
    canopy.scale.set(1.2, 1.2, 0.45);
    carRoot.add(canopy);

    // Neon Dorsal Fin
    const finGeo = new THREE.BoxGeometry(0.06, 0.4, 1.8);
    const fin = new THREE.Mesh(finGeo, accentMaterial);
    fin.position.set(0, 0.85, -0.7);
    carRoot.add(fin);

    // Cyber Underglow Strip
    const underglowGeo = new THREE.PlaneGeometry(1.4, 3.2);
    const underglowMat = new THREE.MeshBasicMaterial({
      color: accColor,
      transparent: true,
      opacity: 0.3,
    });
    const underglow = new THREE.Mesh(underglowGeo, underglowMat);
    underglow.rotation.x = -Math.PI / 2;
    underglow.position.y = 0.12;
    carRoot.add(underglow);

  } else if (modelType === 'muscle') {
    // 4. FALCON V8 MUSCLE
    const bodyGeo = new THREE.BoxGeometry(1.6, 0.55, 3.7);
    mainBody = new THREE.Mesh(bodyGeo, bodyMaterial);
    mainBody.position.y = 0.45;
    carRoot.add(mainBody);

    // High cabin roof
    const roofGeo = new THREE.BoxGeometry(1.35, 0.45, 1.6);
    const roof = new THREE.Mesh(roofGeo, glassMaterial);
    roof.position.set(0, 0.85, -0.2);
    carRoot.add(roof);

    // Protruding Hood Blower / Supercharger scoop
    const blowerGeo = new THREE.BoxGeometry(0.5, 0.28, 0.7);
    const blower = new THREE.Mesh(blowerGeo, chromeMaterial);
    blower.position.set(0, 0.8, 0.95);
    carRoot.add(blower);

    // Front Chrome Bumper & Grille
    const grilleGeo = new THREE.BoxGeometry(1.5, 0.35, 0.1);
    const grille = new THREE.Mesh(grilleGeo, carbonMaterial);
    grille.position.set(0, 0.45, 1.86);
    carRoot.add(grille);

    // Classic Ducktail Spoiler
    const ducktailGeo = new THREE.BoxGeometry(1.5, 0.18, 0.25);
    const ducktail = new THREE.Mesh(ducktailGeo, accentMaterial);
    ducktail.position.set(0, 0.78, -1.8);
    ducktail.rotation.x = 0.25;
    carRoot.add(ducktail);

  } else if (modelType === 'rally') {
    // 5. RALLY CROSS TURBO
    const bodyGeo = new THREE.BoxGeometry(1.48, 0.55, 3.5);
    mainBody = new THREE.Mesh(bodyGeo, bodyMaterial);
    mainBody.position.y = 0.5; // higher ground clearance
    carRoot.add(mainBody);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1.25, 0.5, 1.6);
    const cabin = new THREE.Mesh(cabinGeo, glassMaterial);
    cabin.position.set(0, 0.92, -0.15);
    carRoot.add(cabin);

    // Roof intake vent
    const roofVent = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.5), accentMaterial);
    roofVent.position.set(0, 1.2, 0.1);
    carRoot.add(roofVent);

    // Round rally auxiliary lights
    [-0.35, 0.35].forEach((x) => {
      const lightGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 12);
      const light = new THREE.Mesh(lightGeo, headlightMaterial);
      light.rotation.x = Math.PI / 2;
      light.position.set(x, 0.65, 1.8);
      carRoot.add(light);
    });

    // High WRC Rear Wing
    const rallyWing = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.45), accentMaterial);
    rallyWing.position.set(0, 1.15, -1.65);
    carRoot.add(rallyWing);

  } else {
    // 6. LE MANS PROTOTYPE (LMP)
    const bodyGeo = new THREE.BoxGeometry(1.65, 0.38, 3.8);
    mainBody = new THREE.Mesh(bodyGeo, bodyMaterial);
    mainBody.position.y = 0.35;
    carRoot.add(mainBody);

    // Bubble Canopy
    const bubbleGeo = new THREE.SphereGeometry(0.55, 16, 16);
    const bubble = new THREE.Mesh(bubbleGeo, glassMaterial);
    bubble.scale.set(1.1, 0.8, 1.8);
    bubble.position.set(0, 0.65, 0.1);
    carRoot.add(bubble);

    // Long endurance shark fin
    const spineGeo = new THREE.BoxGeometry(0.05, 0.5, 2.0);
    const spine = new THREE.Mesh(spineGeo, accentMaterial);
    spine.position.set(0, 0.8, -0.8);
    carRoot.add(spine);

    // Wide prototype rear wing
    const lmpWing = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.07, 0.45), carbonMaterial);
    lmpWing.position.set(0, 0.9, -1.9);
    carRoot.add(lmpWing);
  }

  // --- Common Features: Dual Racing Stripes on Roof/Hood ---
  const stripeGeo = new THREE.PlaneGeometry(0.2, 3.4);
  const stripe1 = new THREE.Mesh(stripeGeo, accentMaterial);
  stripe1.rotation.x = -Math.PI / 2;
  stripe1.position.set(-0.16, mainBody.position.y + 0.23, 0);
  carRoot.add(stripe1);

  const stripe2 = new THREE.Mesh(stripeGeo, accentMaterial);
  stripe2.rotation.x = -Math.PI / 2;
  stripe2.position.set(0.16, mainBody.position.y + 0.23, 0);
  carRoot.add(stripe2);

  // --- Headlights ---
  [-0.6, 0.6].forEach((xSide) => {
    const hlGeo = new THREE.BoxGeometry(0.25, 0.12, 0.08);
    const hl = new THREE.Mesh(hlGeo, headlightMaterial);
    hl.position.set(xSide, mainBody.position.y + 0.05, frontZ + 0.45);
    carRoot.add(hl);
    headlights.push(hl);
  });

  // --- Taillights ---
  [-0.6, 0.6].forEach((xSide) => {
    const tlGeo = new THREE.BoxGeometry(0.25, 0.1, 0.06);
    const tl = new THREE.Mesh(tlGeo, taillightMaterial);
    tl.position.set(xSide, mainBody.position.y + 0.08, rearZ - 0.45);
    carRoot.add(tl);
  });

  // --- Dual Exhaust Pipes ---
  [-0.25, 0.25].forEach((xSide) => {
    const exGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.35, 10);
    const ex = new THREE.Mesh(exGeo, chromeMaterial);
    ex.rotation.x = Math.PI / 2;
    ex.position.set(xSide, mainBody.position.y - 0.1, rearZ - 0.5);
    carRoot.add(ex);
    exhaustPipes.push(ex);

    // Dual Nitro Flame Emitters (Outer plume + Inner plasma cone)
    const flameGeo = new THREE.ConeGeometry(0.16, 1.2, 10);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8, // Electric Cyan-Blue Fire
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.rotation.x = -Math.PI / 2;
    flame.position.set(xSide, mainBody.position.y - 0.1, rearZ - 1.25);
    flame.visible = false;
    carRoot.add(flame);
    nitroFlames.push(flame);

    // Inner bright plasma core
    const coreGeo = new THREE.ConeGeometry(0.08, 0.8, 8);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.rotation.x = -Math.PI / 2;
    core.position.set(xSide, mainBody.position.y - 0.1, rearZ - 1.05);
    core.visible = false;
    carRoot.add(core);
    nitroFlames.push(core);
  });

  // --- 4 Wheels (with steering group on front) ---
  const flWheel = createWheel(0.35, 0.28, 0xd0d0d0);
  flWheel.position.set(-wheelBaseX, wheelY, frontZ);
  carRoot.add(flWheel);
  wheels.push(flWheel);

  const frWheel = createWheel(0.35, 0.28, 0xd0d0d0);
  frWheel.position.set(wheelBaseX, wheelY, frontZ);
  carRoot.add(frWheel);
  wheels.push(frWheel);

  const rlWheel = createWheel(0.36, 0.32, 0xd0d0d0);
  rlWheel.position.set(-wheelBaseX, wheelY, rearZ);
  carRoot.add(rlWheel);
  wheels.push(rlWheel);

  const rrWheel = createWheel(0.36, 0.32, 0xd0d0d0);
  rrWheel.position.set(wheelBaseX, wheelY, rearZ);
  carRoot.add(rrWheel);
  wheels.push(rrWheel);

  // Soft Contact Shadow Plane directly beneath the car (per threejs skill)
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d');
  if (sCtx) {
    const gradient = sCtx.createRadialGradient(64, 64, 15, 64, 64, 60);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.35)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = gradient;
    sCtx.fillRect(0, 0, 128, 128);
  }
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 4.4),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.02;
  carRoot.add(shadowPlane);

  return {
    root: carRoot,
    wheels,
    frontLeftWheel: flWheel,
    frontRightWheel: frWheel,
    exhaustPipes,
    headlights,
    bodyMesh: mainBody,
    nitroFlames,
  };
}
