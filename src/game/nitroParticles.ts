import * as THREE from 'three';

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  colorR: number;
  colorG: number;
  colorB: number;
  startR: number;
  startG: number;
  startB: number;
  endR: number;
  endG: number;
  endB: number;
  active: boolean;
}

/**
 * Creates a soft radial glow sprite texture for high-speed fire/plasma particles
 */
function createFireSpriteTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.25, 'rgba(255, 230, 120, 0.95)');
  gradient.addColorStop(0.5, 'rgba(255, 110, 30, 0.7)');
  gradient.addColorStop(0.8, 'rgba(220, 30, 10, 0.3)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

export class NitroParticleTrail {
  public points: THREE.Points;
  public exhaustGlowLight: THREE.PointLight;
  private particles: Particle[] = [];
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private maxParticles: number = 180;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private texture: THREE.Texture;
  private theme: 'fire' | 'plasma';

  constructor(scene: THREE.Scene, theme: 'fire' | 'plasma' = 'fire') {
    this.theme = theme;
    this.maxParticles = 180;
    this.texture = createFireSpriteTexture();

    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);

    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        x: 0,
        y: -100,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1,
        size: 0,
        colorR: 1,
        colorG: 1,
        colorB: 1,
        startR: 1,
        startG: 0.9,
        startB: 0.5,
        endR: 0.8,
        endG: 0.1,
        endB: 0.05,
        active: false,
      });

      this.positions[i * 3 + 0] = 0;
      this.positions[i * 3 + 1] = -100;
      this.positions[i * 3 + 2] = 0;

      this.colors[i * 3 + 0] = 1;
      this.colors[i * 3 + 1] = 0.8;
      this.colors[i * 3 + 2] = 0.2;

      this.sizes[i] = 0;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    this.material = new THREE.PointsMaterial({
      size: 0.75,
      map: this.texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    scene.add(this.points);

    // Dynamic ground glow light attached behind exhaust
    const lightColor = this.theme === 'plasma' ? 0x06b6d4 : 0xf97316;
    this.exhaustGlowLight = new THREE.PointLight(lightColor, 0, 7.5);
    scene.add(this.exhaustGlowLight);
  }

  /**
   * Spawns new fiery exhaust particles from left and right tail pipes
   */
  public emit(
    carX: number,
    carY: number,
    carZ: number,
    carSpeed: number,
    steerAngle: number,
    count: number = 4
  ) {
    const rearZ = carZ - 1.25;
    const rearY = carY + 0.35;
    const exhaustOffsets = [-0.25, 0.25];

    for (let c = 0; c < count; c++) {
      const xSide = exhaustOffsets[c % exhaustOffsets.length];
      // Find inactive particle
      const p = this.particles.find((item) => !item.active);
      if (!p) break;

      p.active = true;
      p.maxLife = 0.25 + Math.random() * 0.35; // Short fiery lifespan
      p.life = p.maxLife;

      // Jitter spawn location near exhaust tip
      p.x = carX + xSide + (Math.random() - 0.5) * 0.08;
      p.y = rearY + (Math.random() - 0.5) * 0.08;
      p.z = rearZ + (Math.random() - 0.5) * 0.1;

      // Turbulent backwards exhaust thrust
      const speedFactor = (carSpeed / 100) * 1.2;
      p.vx = -steerAngle * 1.5 + (Math.random() - 0.5) * 0.6;
      p.vy = Math.random() * 0.5 + 0.1;
      p.vz = -speedFactor * 8.0 - (Math.random() * 4.0 + 3.0); // Shoots backwards rapidly

      p.size = 0.5 + Math.random() * 0.6;

      if (this.theme === 'plasma') {
        // Cyan-electric blue plasma trail
        p.startR = 0.9;
        p.startG = 1.0;
        p.startB = 1.0;
        p.endR = 0.05;
        p.endG = 0.45;
        p.endB = 0.95;
      } else {
        // Blazing orange/yellow fire trail
        p.startR = 1.0;
        p.startG = 0.95;
        p.startB = 0.6;
        p.endR = 0.95;
        p.endG = 0.18;
        p.endB = 0.02;
      }
    }
  }

  /**
   * Updates all active particles and syncs GPU buffers
   */
  public update(dt: number, isNitroActive: boolean, carX: number, carY: number, carZ: number) {
    let hasActive = false;

    // Update exhaust glow light
    if (isNitroActive) {
      this.exhaustGlowLight.position.set(carX, carY + 0.3, carZ - 1.2);
      this.exhaustGlowLight.intensity = THREE.MathUtils.damp(
        this.exhaustGlowLight.intensity,
        3.5 + Math.random() * 1.5,
        15,
        dt
      );
    } else {
      this.exhaustGlowLight.intensity = THREE.MathUtils.damp(this.exhaustGlowLight.intensity, 0, 15, dt);
    }

    const posAttr = this.geometry.attributes.position as THREE.BufferAttribute;
    const colAttr = this.geometry.attributes.color as THREE.BufferAttribute;
    const sizeAttr = this.geometry.attributes.size as THREE.BufferAttribute;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) {
        this.positions[i * 3 + 1] = -100;
        this.sizes[i] = 0;
        continue;
      }

      hasActive = true;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        this.positions[i * 3 + 1] = -100;
        this.sizes[i] = 0;
        continue;
      }

      // Physics integration
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;

      // Drag
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.vz *= 0.92;

      const progress = 1 - p.life / p.maxLife; // 0 to 1

      // Expand particle as it dissipates into flame cloud
      this.sizes[i] = p.size * (1 + progress * 1.8) * (1 - progress * 0.4);

      // Color interpolation from white-hot to fiery glow
      const r = THREE.MathUtils.lerp(p.startR, p.endR, progress);
      const g = THREE.MathUtils.lerp(p.startG, p.endG, progress);
      const b = THREE.MathUtils.lerp(p.startB, p.endB, progress);
      const fade = Math.max(0, 1 - progress);

      this.positions[i * 3 + 0] = p.x;
      this.positions[i * 3 + 1] = p.y;
      this.positions[i * 3 + 2] = p.z;

      this.colors[i * 3 + 0] = r * fade;
      this.colors[i * 3 + 1] = g * fade;
      this.colors[i * 3 + 2] = b * fade;
    }

    if (hasActive || isNitroActive) {
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;
    }
  }

  public dispose(scene: THREE.Scene) {
    scene.remove(this.points);
    scene.remove(this.exhaustGlowLight);
    this.geometry.dispose();
    this.material.dispose();
    this.texture.dispose();
    this.exhaustGlowLight.dispose();
  }
}
