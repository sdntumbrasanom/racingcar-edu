import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CarModelType } from '../types/game';
import { buildProceduralCar, ProceduralCarResult } from '../game/carModels';

interface CarPreview3DProps {
  modelType: CarModelType;
  primaryColor: string;
  accentColor: string;
}

export const CarPreview3D: React.FC<CarPreview3DProps> = ({
  modelType,
  primaryColor,
  accentColor,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 200;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1120);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(3.2, 1.8, 4.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Studio Environment lighting
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // Studio Key & Fill Lights
    const hemiLight = new THREE.HemisphereLight(0xa5f3fc, 0x1e293b, 1.4);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 2.0);
    dirLight.position.set(5, 8, 6);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    rimLight.position.set(-6, 4, -4);
    scene.add(rimLight);

    // Circular podium showroom base
    const podiumGeo = new THREE.CylinderGeometry(2.4, 2.6, 0.15, 32);
    const podiumMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.2,
    });
    const podium = new THREE.Mesh(podiumGeo, podiumMat);
    podium.position.y = -0.08;
    podium.receiveShadow = true;
    scene.add(podium);

    // Neon edge ring around showroom podium
    const ringGeo = new THREE.TorusGeometry(2.45, 0.03, 16, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.01;
    scene.add(ring);

    // Build the selected 3D car
    const carResult: ProceduralCarResult = buildProceduralCar(modelType, primaryColor, accentColor);
    scene.add(carResult.root);

    camera.lookAt(0, 0.45, 0);

    // Smooth turntable animation loop
    let animId: number;
    let rotationAngle = 0.4;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      rotationAngle += 0.008;
      carResult.root.rotation.y = rotationAngle;

      // Slight wheel rotation
      carResult.wheels.forEach((w) => {
        w.children.forEach((c) => {
          c.rotation.x += 0.02;
        });
      });

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [modelType, primaryColor, accentColor]);

  return (
    <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden border border-cyan-500/40 bg-slate-950 shadow-inner flex items-center justify-center">
      <div ref={mountRef} className="w-full h-full" />
      {/* 3D Model Badge */}
      <div className="absolute top-2.5 left-3 px-2.5 py-0.5 rounded-lg bg-slate-900/90 border border-cyan-400 text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-widest pointer-events-none shadow">
        3D Live Showroom
      </div>
      <div className="absolute bottom-2.5 right-3 px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-700 text-[9px] font-semibold text-slate-400 pointer-events-none">
        Putar Otomatis 360°
      </div>
    </div>
  );
};
