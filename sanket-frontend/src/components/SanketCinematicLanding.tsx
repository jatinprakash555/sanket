'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  ShieldCheck,
  Activity,
  ArrowUpRight,
  Flame,
  Globe2,
  Cpu,
  Layers,
  Thermometer,
  WifiOff,
  Radio,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Smartphone
} from 'lucide-react';

interface SanketCinematicLandingProps {
  onEnterDashboard: () => void;
  onOpenWorkerPwa?: () => void;
  districtsCount?: number;
  criticalDistrictsCount?: number;
}

export const SanketCinematicLanding: React.FC<SanketCinematicLandingProps> = ({
  onEnterDashboard,
  onOpenWorkerPwa,
  districtsCount = 30,
  criticalDistrictsCount = 3
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const [activeChapter, setActiveChapter] = useState<number>(0);
  const [isPreloaderDone, setIsPreloaderDone] = useState<boolean>(false);
  const [progressPct, setProgressPct] = useState<number>(0);

  // Preloader progress simulation
  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 22) + 12;
      if (current >= 100) {
        current = 100;
        setProgressPct(100);
        clearInterval(interval);
        setTimeout(() => setIsPreloaderDone(true), 400);
      } else {
        setProgressPct(current);
      }
    }, 90);
    return () => clearInterval(interval);
  }, []);

  // Smooth custom cursor follow
  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    let mouseX = -100;
    let mouseY = -100;
    let curX = -100;
    let curY = -100;
    let animId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const onHoverEnter = () => cursor.classList.add('act');
    const onHoverLeave = () => cursor.classList.remove('act');

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    const hoverables = document.querySelectorAll('a, button, [data-cursor]');
    hoverables.forEach(el => {
      el.addEventListener('mouseenter', onHoverEnter);
      el.addEventListener('mouseleave', onHoverLeave);
    });

    const loop = () => {
      curX += (mouseX - curX) * 0.18;
      curY += (mouseY - curY) * 0.18;
      cursor.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animId);
      hoverables.forEach(el => {
        el.removeEventListener('mouseenter', onHoverEnter);
        el.removeEventListener('mouseleave', onHoverLeave);
      });
    };
  }, [isPreloaderDone]);

  // Scroll reveal observer
  useEffect(() => {
    if (!isPreloaderDone) return;

    // Trigger hero reveal sequentially
    setTimeout(() => {
      const heroRv = document.querySelectorAll('#ch-00 [data-rv]');
      heroRv.forEach((el, i) => {
        setTimeout(() => el.classList.add('rv-in'), i * 110);
      });
    }, 120);

    const elements = document.querySelectorAll('[data-rv]');
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('rv-in');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach(el => observer.observe(el));

    // Section chapter observer
    const sections = document.querySelectorAll('section[data-chapter]');
    const secObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const ch = parseInt(entry.target.getAttribute('data-chapter') || '0', 10);
            setActiveChapter(ch);
          }
        });
      },
      { threshold: 0.4 }
    );

    sections.forEach(s => secObserver.observe(s));

    return () => {
      observer.disconnect();
      secObserver.disconnect();
    };
  }, [isPreloaderDone]);

  // 3D WebGL Scene Choreography
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070a, 0.016);

    const camera = new THREE.PerspectiveCamera(
      42,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 8, 38);

    // Damping helper (frame-rate independent)
    const damp = (cur: number, to: number, rate: number, dt: number) =>
      cur + (to - cur) * (1 - Math.exp(-rate * dt));

    // 1. Globe digital twin
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Inner globe core
    const globeGeo = new THREE.SphereGeometry(14, 64, 64);
    const globeMat = new THREE.MeshStandardMaterial({
      color: 0x070b12,
      roughness: 0.85,
      metalness: 0.2,
      wireframe: false
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    // Outer Geodesic Wireframe
    const wireGeo = new THREE.SphereGeometry(14.15, 36, 36);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x1e293b,
      wireframe: true,
      transparent: true,
      opacity: 0.38
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wireMesh);

    // Atmospheric Glow Ring / Halo
    const haloGeo = new THREE.RingGeometry(14.4, 16.2, 64);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.22
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.rotation.x = Math.PI / 2;
    globeGroup.add(haloMesh);

    // Secondary Thermal Equatorial Halo
    const thermalHaloGeo = new THREE.RingGeometry(14.2, 15.1, 64);
    const thermalHaloMat = new THREE.MeshBasicMaterial({
      color: 0xe0231c,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4
    });
    const thermalHaloMesh = new THREE.Mesh(thermalHaloGeo, thermalHaloMat);
    thermalHaloMesh.rotation.x = Math.PI / 2.3;
    globeGroup.add(thermalHaloMesh);

    // 2. Extruded Sentinel Spire Beacons (representing Odisha districts)
    const districtCoords = [
      { name: 'Khordha', lat: 20.18, lon: 85.62, height: 5.6, color: 0xff2222, isCrit: true },
      { name: 'Cuttack', lat: 20.46, lon: 85.88, height: 4.8, color: 0xff5a3c, isCrit: true },
      { name: 'Puri', lat: 19.81, lon: 85.83, height: 3.4, color: 0xf59e0b, isCrit: false },
      { name: 'Mayurbhanj', lat: 21.93, lon: 86.74, height: 4.4, color: 0xe0231c, isCrit: true },
      { name: 'Sundargarh', lat: 22.12, lon: 84.03, height: 3.8, color: 0xf59e0b, isCrit: false },
      { name: 'Balasore', lat: 21.49, lon: 86.93, height: 3.2, color: 0x38bdf8, isCrit: false },
      { name: 'Ganjam', lat: 19.38, lon: 85.06, height: 3.6, color: 0xf59e0b, isCrit: false },
      { name: 'Sambalpur', lat: 21.46, lon: 83.97, height: 4.2, color: 0xff5a3c, isCrit: true }
    ];

    const spiresGroup = new THREE.Group();
    const pulseRings: THREE.Mesh[] = [];

    districtCoords.forEach(d => {
      // Convert lat/lon to 3D Cartesian on sphere of radius R
      const phi = (90 - d.lat) * (Math.PI / 180);
      const theta = (d.lon + 180) * (Math.PI / 180);
      const r = 14.1;

      const x = -(r * Math.sin(phi) * Math.cos(theta));
      const z = r * Math.sin(phi) * Math.sin(theta);
      const y = r * Math.cos(phi);

      // Spire cylinder
      const spireGeo = new THREE.CylinderGeometry(0.08, 0.18, d.height, 8);
      const spireMat = new THREE.MeshBasicMaterial({
        color: d.color,
        transparent: true,
        opacity: 0.95
      });
      const spire = new THREE.Mesh(spireGeo, spireMat);

      // Position and orient outward normal
      const pos = new THREE.Vector3(x, y, z);
      const normal = pos.clone().normalize();
      spire.position.copy(pos.clone().add(normal.clone().multiplyScalar(d.height / 2)));
      spire.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      spiresGroup.add(spire);

      // Tip beacon light sphere
      const tipGeo = new THREE.SphereGeometry(0.24, 16, 16);
      const tipMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const tipMesh = new THREE.Mesh(tipGeo, tipMat);
      tipMesh.position.copy(pos.clone().add(normal.clone().multiplyScalar(d.height)));
      spiresGroup.add(tipMesh);

      // Ground pulse ring
      const ringGeo = new THREE.RingGeometry(0.2, 0.8, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: d.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos.clone().add(normal.clone().multiplyScalar(0.05)));
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      spiresGroup.add(ring);
      pulseRings.push(ring);
    });

    globeGroup.add(spiresGroup);
    // Align Odisha towards the camera on initial chapter
    globeGroup.rotation.y = 0.55;
    globeGroup.rotation.x = 0.22;

    // 3. The Vermilion Thermal Moon (The Kage Emblem of Atmospheric Extreme)
    const moonGeo = new THREE.SphereGeometry(8.5, 48, 48);
    const moonMat = new THREE.MeshBasicMaterial({
      color: 0xe0231c,
      transparent: true,
      opacity: 0.92
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.set(22, 14, -32);
    scene.add(moonMesh);

    // Moon atmospheric aura
    const moonAuraGeo = new THREE.RingGeometry(8.6, 13.5, 48);
    const moonAuraMat = new THREE.MeshBasicMaterial({
      color: 0xff5a3c,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.22
    });
    const moonAura = new THREE.Mesh(moonAuraGeo, moonAuraMat);
    moonAura.position.copy(moonMesh.position);
    moonAura.position.z += 0.2;
    scene.add(moonAura);

    // 4. Atmospheric Particulate & Thermal Ember Field
    const particleCount = 1000;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const cVermilion = new THREE.Color(0xe0231c);
    const cAmber = new THREE.Color(0xff8a3c);
    const cCyan = new THREE.Color(0x38bdf8);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 80;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 60;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 60;

      const pick = Math.random();
      const col = pick < 0.6 ? cVermilion : pick < 0.85 ? cAmber : cCyan;
      particleColors[i * 3] = col.r;
      particleColors[i * 3 + 1] = col.g;
      particleColors[i * 3 + 2] = col.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // Lighting
    const ambLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambLight);

    const thermalDirLight = new THREE.DirectionalLight(0xff4422, 1.8);
    thermalDirLight.position.set(20, 15, -20);
    scene.add(thermalDirLight);

    const coldRimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    coldRimLight.position.set(-20, -10, 20);
    scene.add(coldRimLight);

    // Camera target waypoints for 5 Chapters (0 to 4)
    const cameraWaypoints = [
      { pos: new THREE.Vector3(0, 8, 38), look: new THREE.Vector3(0, 0, 0), rotY: 0.55 },
      { pos: new THREE.Vector3(8, 4, 31), look: new THREE.Vector3(1.5, 0, 0), rotY: 0.85 },
      { pos: new THREE.Vector3(-9, 5, 27), look: new THREE.Vector3(-1, 0.5, 0), rotY: 0.4 },
      { pos: new THREE.Vector3(5, -4, 28), look: new THREE.Vector3(0.5, -0.5, 0), rotY: 1.1 },
      { pos: new THREE.Vector3(0, 10, 32), look: new THREE.Vector3(0, 0, 0), rotY: 0.6 }
    ];

    let targetCamPos = cameraWaypoints[0].pos.clone();
    let targetCamLook = cameraWaypoints[0].look.clone();
    let currentLook = targetCamLook.clone();

    // Mouse parallax
    let pointerX = 0;
    let pointerY = 0;
    const onMouseMove = (e: MouseEvent) => {
      pointerX = (e.clientX / window.innerWidth - 0.5) * 2;
      pointerY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // Scroll progress handler
    const onScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.max(0, Math.min(1, window.scrollY / (maxScroll || 1)));

      // Interpolate between the 5 waypoints
      const scaledP = progress * (cameraWaypoints.length - 1);
      const idx1 = Math.min(Math.floor(scaledP), cameraWaypoints.length - 1);
      const idx2 = Math.min(idx1 + 1, cameraWaypoints.length - 1);
      const factor = scaledP - idx1;

      targetCamPos.lerpVectors(cameraWaypoints[idx1].pos, cameraWaypoints[idx2].pos, factor);
      targetCamLook.lerpVectors(cameraWaypoints[idx1].look, cameraWaypoints[idx2].look, factor);

      // Subtle globe spin based on scroll
      const rotY = cameraWaypoints[idx1].rotY + (cameraWaypoints[idx2].rotY - cameraWaypoints[idx1].rotY) * factor;
      globeGroup.rotation.y = rotY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // Resize handler
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // Animation Render Loop
    let lastTime = performance.now();
    let animId: number;

    const animate = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Smooth camera position with parallax offset
      const targetX = targetCamPos.x + pointerX * 2.2;
      const targetY = targetCamPos.y - pointerY * 1.8;
      const targetZ = targetCamPos.z;

      camera.position.x = damp(camera.position.x, targetX, 3.8, dt);
      camera.position.y = damp(camera.position.y, targetY, 3.8, dt);
      camera.position.z = damp(camera.position.z, targetZ, 3.8, dt);

      currentLook.x = damp(currentLook.x, targetCamLook.x, 4.0, dt);
      currentLook.y = damp(currentLook.y, targetCamLook.y, 4.0, dt);
      currentLook.z = damp(currentLook.z, targetCamLook.z, 4.0, dt);
      camera.lookAt(currentLook);

      // Pulse rings expanding on district spires
      pulseRings.forEach((r, idx) => {
        const timeOffset = (now * 0.0018 + idx * 0.4) % 1;
        r.scale.setScalar(0.7 + timeOffset * 1.6);
        const mat = r.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, 0.85 * (1 - timeOffset));
      });

      // Embers floating upward
      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += 0.035;
        if (positions[i * 3 + 1] > 30) {
          positions[i * 3 + 1] = -30;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Subtle breath on moon aura
      const pulse = 1 + Math.sin(now * 0.0015) * 0.06;
      moonAura.scale.set(pulse, pulse, 1);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      globeGeo.dispose();
      globeMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, []);

  const scrollToChapter = (chapterId: string) => {
    const el = document.getElementById(chapterId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#05070a] text-[#dfe7e0] font-onest selection:bg-[#e0231c] selection:text-white overflow-x-hidden">
      {/* 3D WebGL Background Layer */}
      <canvas
        ref={canvasRef}
        id="sanket-gl"
        className="fixed inset-0 w-full h-full block z-0 pointer-events-none"
      />

      {/* Atmospheric Overlays: Vignette & Subtle Film Grain */}
      <div className="kage-vignette" />
      <div className="kage-grain" />

      {/* Custom Soft Circular Magnetic Cursor */}
      <div ref={cursorRef} className="cinematic-cursor" />

      {/* Preloader Animation */}
      <div
        className={`fixed inset-0 z-50 bg-[#05070a] flex items-center justify-center transition-opacity duration-700 ${
          isPreloaderDone ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="w-[min(440px,76vw)] text-center space-y-6">
          <div className="w-12 h-12 mx-auto">
            <svg viewBox="0 0 44 44" fill="none" className="w-full h-full">
              <circle cx="22" cy="24" r="9.5" stroke="#e0231c" strokeWidth="1.4" />
              <path d="M6 12h32M9.5 17h25M22 8v28" stroke="#dfe7e0" strokeWidth="1.4" />
            </svg>
          </div>
          <div className="text-sm font-serif tracking-[0.45em] text-[#aab4ad]">
            ସଙ୍କେତ • SANKET
          </div>
          <div className="relative h-[2px] bg-[rgba(223,231,224,0.14)] overflow-hidden rounded-full">
            <div
              className="absolute left-0 top-0 bottom-0 bg-[#e0231c] transition-all duration-300 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] tracking-[0.2em] uppercase text-[#78837c] font-mono">
            <span>Synchronizing Digital Twin</span>
            <span className="font-semibold text-[#dfe7e0]">{progressPct}%</span>
          </div>
        </div>
      </div>

      {/* Vertical Side Progress Rail */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-3.5 items-end">
        {[
          { id: 'ch-00', num: '00', label: 'Threshold' },
          { id: 'ch-01', num: '01', label: 'Triple Engine' },
          { id: 'ch-02', num: '02', label: 'Digital Twins' },
          { id: 'ch-03', num: '03', label: 'Frontline' },
          { id: 'ch-04', num: '04', label: 'War Room' }
        ].map((item, idx) => (
          <button
            key={item.id}
            onClick={() => scrollToChapter(item.id)}
            data-cursor
            className="group flex items-center gap-3 py-1 cursor-pointer focus:outline-none"
          >
            <span
              className={`text-[9px] font-mono tracking-widest uppercase transition-colors ${
                activeChapter === idx ? 'text-[#dfe7e0]' : 'text-transparent group-hover:text-[#78837c]'
              }`}
            >
              {item.label}
            </span>
            <div
              className={`h-[1.5px] transition-all duration-300 ${
                activeChapter === idx
                  ? 'w-6 bg-[#e0231c]'
                  : 'w-3 bg-[rgba(223,231,224,0.22)] group-hover:w-4 group-hover:bg-[#dfe7e0]'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Sticky Minimal Navigation */}
      <header className="fixed top-0 left-0 right-0 z-40 h-20 px-6 md:px-12 flex items-center justify-between backdrop-blur-md bg-[rgba(5,7,10,0.65)] border-b border-[rgba(223,231,224,0.06)]">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg border border-[rgba(223,231,224,0.2)] flex items-center justify-center bg-[rgba(223,231,224,0.04)]">
            <ShieldCheck className="w-4 h-4 text-[#e0231c]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-[0.2em] text-[#dfe7e0]">
                SANKET
              </span>
              <span className="text-[10px] text-[#78837c] font-serif">
                संकेत / ସଙ୍କେତ
              </span>
            </div>
            <span className="text-[8px] tracking-[0.28em] text-[#78837c] uppercase">
              Climate & Epidemic Sentinel
            </span>
          </div>
        </div>

        {/* Center Chapter Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          <button
            onClick={() => scrollToChapter('ch-01')}
            data-cursor
            className="text-[11px] uppercase tracking-[0.2em] text-[#aab4ad] hover:text-[#dfe7e0] transition-colors"
          >
            01 • Models
          </button>
          <button
            onClick={() => scrollToChapter('ch-02')}
            data-cursor
            className="text-[11px] uppercase tracking-[0.2em] text-[#aab4ad] hover:text-[#dfe7e0] transition-colors"
          >
            02 • Digital Twins
          </button>
          <button
            onClick={() => scrollToChapter('ch-03')}
            data-cursor
            className="text-[11px] uppercase tracking-[0.2em] text-[#aab4ad] hover:text-[#dfe7e0] transition-colors"
          >
            03 • Frontline Sync
          </button>
          <a
            href="/kage"
            target="_blank"
            rel="noopener noreferrer"
            data-cursor
            className="text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full border border-[rgba(223,231,224,0.18)] text-[#aab4ad] hover:text-[#dfe7e0] hover:border-[#dfe7e0] transition flex items-center gap-1.5"
          >
            <span>Original Kage Temple</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </nav>

        {/* Action Button: Enter War Room */}
        <div className="flex items-center gap-3">
          <button
            onClick={onEnterDashboard}
            data-cursor
            className="group relative inline-flex items-center gap-2.5 px-4 md:px-5 py-2.5 rounded-full border border-[rgba(223,231,224,0.22)] bg-[rgba(223,231,224,0.04)] hover:bg-[#dfe7e0] text-[#dfe7e0] hover:text-[#05070a] transition-all duration-300 text-xs font-semibold tracking-wider uppercase cursor-pointer shadow-lg"
          >
            <span>Enter War Room</span>
            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </button>
        </div>
      </header>

      {/* Main Narrative Content Plane */}
      <main className="relative z-10">
        {/* ========================================================= CHAPTER 00: HERO */}
        <section
          id="ch-00"
          data-chapter="0"
          className="relative min-h-screen px-6 md:px-16 pt-32 pb-20 flex flex-col justify-between"
        >
          {/* Subtle Top Gradient Scrim */}
          <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-[#05070a] via-[rgba(5,7,10,0.4)] to-transparent pointer-events-none -z-10" />

          {/* Large Watermark Wordmark */}
          <div
            className="absolute left-1/2 bottom-[14%] -translate-x-1/2 pointer-events-none -z-10 select-none text-[18vw] font-black tracking-[0.06em] text-transparent bg-clip-text bg-gradient-to-b from-[rgba(223,231,224,0.09)] to-transparent opacity-80"
            aria-hidden="true"
          >
            SANKET
          </div>

          {/* Hero Top Copy */}
          <div className="max-w-2xl space-y-6">
            <div data-rv="fade" className="flex items-center gap-2.5 text-[10px] tracking-[0.24em] uppercase text-[#aab4ad]">
              <span className="w-2 h-2 rounded-full bg-[#e0231c] shadow-[0_0_12px_#e0231c]" />
              <span>Chapter 00 — The Threshold of Heat & Infection</span>
            </div>

            <h1 data-rv="fade" className="text-4xl sm:text-6xl md:text-7xl font-light tracking-tight leading-[1.05] uppercase">
              <span className="mask-line"><span>Where stillness</span></span>
              <span className="mask-line"><span>reveals the unseen</span></span>
              <span className="mask-line"><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#dfe7e0] via-[#ff8a3c] to-[#e0231c] font-normal">climate surge.</span></span>
            </h1>

            <p data-rv="up" className="text-sm md:text-base leading-relaxed text-[#aab4ad] max-w-lg font-light">
              India enters the extreme thermodynamic zone. Three autonomous predictive engines observe 
              deep atmospheric saturation, ground cluster velocity, and spatial correlation — 
              alerting frontline workers across all states before acute hospital saturation.
            </p>

            <div data-rv="fade" className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={onEnterDashboard}
                data-cursor
                className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-[#e0231c] hover:bg-[#ff3b30] text-white font-medium text-xs tracking-widest uppercase transition-all shadow-[0_0_30px_-5px_#e0231c] cursor-pointer"
              >
                <span>Launch Operational Command</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => scrollToChapter('ch-01')}
                data-cursor
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-[rgba(223,231,224,0.18)] hover:border-[rgba(223,231,224,0.4)] text-xs tracking-widest uppercase text-[#dfe7e0] transition"
              >
                <span>Read Story</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Hero Bottom Stats Chips */}
          <div className="pt-16 border-t border-[rgba(223,231,224,0.08)]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { num: '01', title: 'Triple Engine', desc: '45% XGBoost + 35% Syndromic + 20% Bayesian Spatial' },
                { num: '02', title: '3D Digital Twin', desc: 'Planetary Globe, Anatomical Core & Cold-Chain Hub' },
                { num: '03', title: 'Offline First', desc: 'IndexedDB frontline storage with 0-bar network tolerance' },
                { num: '04', title: 'Actionable SHAP', desc: 'Localized audio broadcasts in Odia and Hindi' }
              ].map(chip => (
                <div
                  key={chip.num}
                  data-rv="up"
                  data-cursor
                  onClick={() => scrollToChapter(`ch-${chip.num}`)}
                  className="group cursor-pointer space-y-1.5"
                >
                  <div className="text-2xl md:text-3xl font-light font-mono text-[#aab4ad] group-hover:text-[#ff5a3c] transition-colors">
                    {chip.num}
                  </div>
                  <div className="text-[11px] font-semibold tracking-wider uppercase text-[#dfe7e0]">
                    {chip.title}
                  </div>
                  <p className="text-[11px] text-[#78837c] group-hover:text-[#aab4ad] transition-colors line-clamp-2">
                    {chip.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= CHAPTER 01: TRIPLE ENGINE CONVERGENCE */}
        <section
          id="ch-01"
          data-chapter="1"
          className="relative min-h-screen px-6 md:px-16 py-32 flex flex-col justify-center"
        >
          <div className="max-w-7xl mx-auto w-full space-y-14">
            {/* Section Header */}
            <div data-rv="fade" className="flex items-center gap-4">
              <span className="text-[10px] font-mono tracking-widest text-[#e0231c] uppercase font-bold">
                01 — Mathematical Consensus
              </span>
              <div className="flex-1 h-[1px] bg-[rgba(223,231,224,0.08)]" />
              <span className="text-[11px] font-serif text-[#78837c]">ତ୍ରିବିଧ ଇଞ୍ଜିନ</span>
            </div>

            {/* Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              <div className="lg:col-span-5 space-y-6">
                <h2 data-rv="fade" className="text-3xl sm:text-5xl font-light uppercase leading-[1.08] tracking-tight">
                  <span className="mask-line"><span>Three predictive</span></span>
                  <span className="mask-line"><span>engines.</span></span>
                  <span className="mask-line"><span className="text-[#ff5a3c]">Zero blind spots.</span></span>
                </h2>
                <p className="text-sm md:text-base text-[#aab4ad] leading-relaxed font-light">
                  Traditional surveillance acts days after patient admission. SANKET fuses thermodynamic vapor pressure suppression, 
                  acute frontline cluster velocity, and Bayesian spatial autocorrelation across adjacent districts into an instantaneous 
                  calibrated consensus index.
                </p>
                <div className="p-4 rounded-2xl border border-[rgba(223,231,224,0.1)] bg-[rgba(5,7,10,0.6)] backdrop-blur-md space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-[#aab4ad]">Consensus Agreement</span>
                    <span className="text-[#38bdf8] font-bold">96.4% Concordance</span>
                  </div>
                  <div className="w-full h-1.5 bg-[rgba(223,231,224,0.1)] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#38bdf8] to-[#e0231c] w-[96.4%]" />
                  </div>
                </div>
              </div>

              {/* 3 Model Feature Cards */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    code: 'M1',
                    name: 'XGBoost Thermal',
                    latency: '11.2ms',
                    weight: '45%',
                    accent: '#ff3b30',
                    desc: 'Evaluates non-linear thermodynamic vapor pressure and 30-min rapid rolling surges.'
                  },
                  {
                    code: 'M2',
                    name: 'Syndromic Velocity',
                    latency: '7.8ms',
                    weight: '35%',
                    accent: '#ff5a3c',
                    desc: 'Acute cluster surge detection (dC/dt) for dehydration and severe sunstroke.'
                  },
                  {
                    code: 'M3',
                    name: 'Bayesian Spatial',
                    latency: '26.4ms',
                    weight: '20%',
                    accent: '#38bdf8',
                    desc: 'Spatial autocorrelation with 95% Credible Intervals across district boundaries.'
                  }
                ].map(m => (
                  <div
                    key={m.code}
                    data-rv="up"
                    className="p-6 rounded-2xl border border-[rgba(223,231,224,0.1)] bg-[rgba(9,14,19,0.7)] backdrop-blur-md flex flex-col justify-between h-[280px] hover:border-[rgba(223,231,224,0.3)] transition-all group"
                  >
                    <div>
                      <div className="flex justify-between items-center text-xs font-mono text-[#78837c]">
                        <span>{m.code}</span>
                        <span className="text-[#dfe7e0] font-bold">{m.weight} Blended</span>
                      </div>
                      <h3 className="text-base font-medium text-[#dfe7e0] mt-3 group-hover:text-white transition-colors">
                        {m.name}
                      </h3>
                      <p className="text-xs text-[#aab4ad] mt-2 leading-relaxed font-light">
                        {m.desc}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[rgba(223,231,224,0.06)] flex justify-between items-center text-[10px] font-mono text-[#78837c]">
                      <span>Latency</span>
                      <span className="text-[#dfe7e0] font-bold">{m.latency}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ruled Statistics Band */}
            <div data-rv="up" className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-[rgba(223,231,224,0.08)]">
              <div>
                <span className="text-3xl md:text-4xl font-light font-mono text-[#dfe7e0]">30</span>
                <span className="block text-[10px] tracking-widest text-[#78837c] uppercase mt-1">Districts Monitored</span>
              </div>
              <div>
                <span className="text-3xl md:text-4xl font-light font-mono text-[#ff3b30]">{criticalDistrictsCount}</span>
                <span className="block text-[10px] tracking-widest text-[#78837c] uppercase mt-1">Critical Surge Zones</span>
              </div>
              <div>
                <span className="text-3xl md:text-4xl font-light font-mono text-[#dfe7e0]">30m</span>
                <span className="block text-[10px] tracking-widest text-[#78837c] uppercase mt-1">Rapid Pulse Window</span>
              </div>
              <div>
                <span className="text-3xl md:text-4xl font-light font-mono text-[#38bdf8]">0.0ms</span>
                <span className="block text-[10px] tracking-widest text-[#78837c] uppercase mt-1">Offline Blocking</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= CHAPTER 02: 3D DIGITAL TWIN SANCTUARY */}
        <section
          id="ch-02"
          data-chapter="2"
          className="relative min-h-screen px-6 md:px-16 py-32 flex flex-col justify-center"
        >
          <div className="max-w-7xl mx-auto w-full space-y-14">
            <div data-rv="fade" className="flex items-center gap-4">
              <span className="text-[10px] font-mono tracking-widest text-[#e0231c] uppercase font-bold">
                02 — Spatial & Biological Sanctuary
              </span>
              <div className="flex-1 h-[1px] bg-[rgba(223,231,224,0.08)]" />
              <span className="text-[11px] font-serif text-[#78837c]">ଡିଜିଟାଲ୍ ଟ୍ୱିନ୍</span>
            </div>

            <div className="space-y-4 max-w-2xl">
              <h2 data-rv="fade" className="text-3xl sm:text-5xl font-light uppercase leading-[1.08] tracking-tight">
                <span className="mask-line"><span>Three interactive</span></span>
                <span className="mask-line"><span className="text-[#ff5a3c]">3D Digital Twins.</span></span>
              </h2>
              <p className="text-sm md:text-base text-[#aab4ad] leading-relaxed font-light">
                Inspect physical reality at every tier: from orbital geospatial district beacons, to 
                microscopic human physiological stress in tachycardia organs, down to frontline solar cold-chain buffer stock.
              </p>
            </div>

            {/* 3 Glowing Interactive Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  id: 'twin-globe',
                  title: '3D Geospatial Globe',
                  sub: 'Geospatial Telemetry Spire Network',
                  desc: 'Vertical 3D light pillars extruded at district GPS points. Height and pulsing frequency map to real-time risk severity.',
                  icon: Globe2,
                  gx: '75%',
                  gy: '25%',
                  gc1: 'rgba(56, 189, 248, 0.45)',
                  gc2: 'rgba(14, 165, 233, 0.15)'
                },
                {
                  id: 'twin-anatomy',
                  title: '3D Anatomical Twin',
                  sub: 'Biological Heatstress Organ Model',
                  desc: 'Holographic human organs illuminated by clinical syndromic data: Cranial sunstroke, Cardiac tachycardia, and Renal dehydration.',
                  icon: Activity,
                  gx: '65%',
                  gy: '45%',
                  gc1: 'rgba(255, 59, 48, 0.55)',
                  gc2: 'rgba(224, 35, 28, 0.2)'
                },
                {
                  id: 'twin-hub',
                  title: '3D Frontline Hardware',
                  sub: 'Solar Cold-Chain & Buffer Stock',
                  desc: 'Exploded interactive 3D view of frontline cold container with solar array, satellite dish, and WHO-formula ORS reserves.',
                  icon: Layers,
                  gx: '50%',
                  gy: '20%',
                  gc1: 'rgba(245, 158, 11, 0.5)',
                  gc2: 'rgba(217, 119, 6, 0.18)'
                }
              ].map(card => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.id}
                    data-rv="up"
                    data-cursor
                    onClick={onEnterDashboard}
                    className="card-glow-box group relative p-8 rounded-3xl border border-[rgba(223,231,224,0.1)] bg-[rgba(9,14,19,0.7)] backdrop-blur-xl hover:border-[rgba(223,231,224,0.35)] transition-all cursor-pointer h-[380px] flex flex-col justify-between overflow-hidden shadow-2xl"
                  >
                    {/* Screened Glow */}
                    <div
                      className="card-glow"
                      style={
                        {
                          '--gx': card.gx,
                          '--gy': card.gy,
                          '--gr': '26%',
                          '--gc1': card.gc1,
                          '--gc2': card.gc2
                        } as React.CSSProperties
                      }
                    />

                    <div>
                      <div className="w-12 h-12 rounded-2xl border border-[rgba(223,231,224,0.15)] bg-[rgba(223,231,224,0.05)] flex items-center justify-center text-[#dfe7e0] group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="text-[10px] tracking-widest uppercase text-[#78837c] font-mono mt-6">
                        {card.sub}
                      </div>
                      <h3 className="text-2xl font-light uppercase tracking-tight text-[#dfe7e0] mt-1 group-hover:text-white transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-xs text-[#aab4ad] mt-3 leading-relaxed font-light">
                        {card.desc}
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-[rgba(223,231,224,0.08)] text-xs text-[#dfe7e0] font-mono">
                      <span>Launch 3D View</span>
                      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================= CHAPTER 03: FRONTLINE SYNC & RESILIENCE */}
        <section
          id="ch-03"
          data-chapter="3"
          className="relative min-h-screen px-6 md:px-16 py-32 flex flex-col justify-center"
        >
          <div className="max-w-7xl mx-auto w-full space-y-14">
            <div data-rv="fade" className="flex items-center gap-4">
              <span className="text-[10px] font-mono tracking-widest text-[#e0231c] uppercase font-bold">
                03 — Zero Connectivity Tolerance
              </span>
              <div className="flex-1 h-[1px] bg-[rgba(223,231,224,0.08)]" />
              <span className="text-[11px] font-serif text-[#78837c]">ଅଫଲାଇନ୍ ନେଟୱାର୍କ</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 space-y-6">
                <h2 data-rv="fade" className="text-3xl sm:text-5xl font-light uppercase leading-[1.08] tracking-tight">
                  <span className="mask-line"><span>Offline-first PWA.</span></span>
                  <span className="mask-line"><span className="text-[#38bdf8]">Automatic re-sync.</span></span>
                </h2>
                <p className="text-sm md:text-base text-[#aab4ad] leading-relaxed font-light">
                  When frontline ASHA and ANM workers enter dense rural jungle terrain with zero cellular reception, 
                  SANKET queues observations in IndexedDB via Dexie.js. As soon as connectivity returns, 
                  reports flush instantly to the central reaction engine without human intervention.
                </p>

                <div className="space-y-3 pt-2">
                  {[
                    'Zero latency local transaction guarantees',
                    'Bi-directional synchronization with FastAPI REST gateway',
                    'Automated multi-lingual voice alert broadcasts in Odia & Hindi'
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs text-[#dfe7e0]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <button
                    onClick={onOpenWorkerPwa || onEnterDashboard}
                    data-cursor
                    className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-[rgba(223,231,224,0.2)] bg-[rgba(223,231,224,0.05)] hover:bg-[#dfe7e0] text-[#dfe7e0] hover:text-[#05070a] transition-all text-xs font-semibold tracking-wider uppercase"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Open Frontline Worker PWA</span>
                  </button>
                </div>
              </div>

              {/* Protocol Visual Matrix */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    step: 'Step 1',
                    title: 'Local Client Queue',
                    desc: 'Observations encrypted in browser IndexedDB with SHA-256 fingerprinting.'
                  },
                  {
                    step: 'Step 2',
                    title: 'Network Reconnect',
                    desc: 'Heartbeat daemon triggers non-blocking batch push upon 1-bar signal detection.'
                  },
                  {
                    step: 'Step 3',
                    title: 'SHAP Feature Explainer',
                    desc: 'Calculates exact risk percentage attribution (+34% heat, +33% cases, +12% rain deficit).'
                  },
                  {
                    step: 'Step 4',
                    title: 'Voice Advisory Audio',
                    desc: 'Instant synthesis of localized Odia and Hindi health department warning broadcast.'
                  }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    data-rv="up"
                    className="p-6 rounded-2xl border border-[rgba(223,231,224,0.08)] bg-[rgba(9,14,19,0.5)] backdrop-blur-md space-y-2 hover:border-[rgba(223,231,224,0.2)] transition"
                  >
                    <div className="text-[10px] font-mono tracking-widest uppercase text-[#e0231c]">
                      {item.step}
                    </div>
                    <div className="text-base font-medium text-[#dfe7e0]">
                      {item.title}
                    </div>
                    <p className="text-xs text-[#aab4ad] leading-relaxed font-light">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= CHAPTER 04: WAR ROOM CLOSING */}
        <section
          id="ch-04"
          data-chapter="4"
          className="relative min-h-screen px-6 md:px-16 py-32 flex flex-col justify-center items-center text-center"
        >
          <div className="max-w-3xl space-y-8">
            <div data-rv="fade" className="text-[10px] tracking-[0.3em] uppercase text-[#aab4ad] font-mono">
              Chapter 04 — Command & Control
            </div>

            <h2 data-rv="fade" className="text-4xl sm:text-6xl md:text-8xl font-light uppercase tracking-tight leading-[0.95]">
              <span className="mask-line"><span>The Sentinel</span></span>
              <span className="mask-line"><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#dfe7e0] via-[#ff5a3c] to-[#e0231c]">Is Watching.</span></span>
            </h2>

            <p data-rv="up" className="text-sm md:text-lg text-[#aab4ad] font-light max-w-xl mx-auto leading-relaxed">
              Step across the threshold into the active operational war room. Monitor real-time GIS layers, 
              run predictive simulations, and trigger instant frontline broadcasts.
            </p>

            <div data-rv="fade" className="pt-6">
              <button
                onClick={onEnterDashboard}
                data-cursor
                className="group relative inline-flex items-center gap-4 px-8 py-4 rounded-full bg-[#dfe7e0] hover:bg-[#ff3b30] text-[#05070a] hover:text-white transition-all duration-300 text-sm font-semibold tracking-widest uppercase shadow-[0_0_40px_-5px_rgba(223,231,224,0.3)] cursor-pointer"
              >
                <span>Launch National Command Cockpit</span>
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Editorial Colophon Footer */}
      <footer className="relative z-10 px-6 md:px-16 py-12 border-t border-[rgba(223,231,224,0.08)] bg-[#05070a] text-xs text-[#78837c] font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[#dfe7e0]">SANKET</span>
            <span>•</span>
            <span>Govt. of India • NDMA & MoHFW IDSP National Grid</span>
          </div>

          <div className="text-center font-serif text-[#aab4ad] tracking-widest text-[13px]">
            ସଙ୍କେତ / संकेत — National Heatwave Early Warning & Epidemic Defense
          </div>

          <div className="flex items-center gap-6">
            <a href="/kage" target="_blank" rel="noopener noreferrer" className="hover:text-[#dfe7e0] transition">
              Original Kage Template
            </a>
            <button onClick={onEnterDashboard} className="hover:text-[#dfe7e0] transition">
              War Room
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
