'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Heart, Activity, AlertTriangle, Rotate3d, Flame, Thermometer } from 'lucide-react';

interface AnatomicalTwinProps {
  currentTemp: number;
  caseCount: number;
  onSelectOrgan?: (organ: string) => void;
}

export const ThreeAnatomicalTwin: React.FC<AnatomicalTwinProps> = ({
  currentTemp = 42.5,
  caseCount = 15
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [selectedOrgan, setSelectedOrgan] = useState<string>('Kidneys (Acute Dehydration)');
  const [coreBodyTemp, setCoreBodyTemp] = useState<number>(39.8);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 5, 55);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const bodyGroup = new THREE.Group();
    scene.add(bodyGroup);

    // 1. Lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(amb);

    const pointLight = new THREE.PointLight(0xf43f5e, 2, 80);
    pointLight.position.set(0, 10, 20);
    scene.add(pointLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rimLight.position.set(20, 30, -20);
    scene.add(rimLight);

    // 2. Procedural Holographic Anatomy Wireframe
    // Head / Cranium
    const headGeo = new THREE.SphereGeometry(3.5, 24, 24);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x334155,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const headMesh = new THREE.Mesh(headGeo, wireMat);
    headMesh.position.y = 16;
    bodyGroup.add(headMesh);

    // Torso Cage
    const torsoGeo = new THREE.CylinderGeometry(4.8, 3.8, 14, 16);
    const torsoMesh = new THREE.Mesh(torsoGeo, wireMat);
    torsoMesh.position.y = 6;
    bodyGroup.add(torsoMesh);

    // Pelvis
    const pelvisGeo = new THREE.CylinderGeometry(3.8, 4.4, 5, 16);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, wireMat);
    pelvisMesh.position.y = -3;
    bodyGroup.add(pelvisMesh);

    // Limbs
    const limbMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, wireframe: true, transparent: true, opacity: 0.25 });
    // Left Arm
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.9, 13, 8), limbMat);
    armL.position.set(-6.5, 6, 0);
    armL.rotation.z = 0.2;
    bodyGroup.add(armL);
    // Right Arm
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.9, 13, 8), limbMat);
    armR.position.set(6.5, 6, 0);
    armR.rotation.z = -0.2;
    bodyGroup.add(armR);
    // Legs
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.1, 17, 8), limbMat);
    legL.position.set(-2.5, -14, 0);
    bodyGroup.add(legL);
    const legR = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.1, 17, 8), limbMat);
    legR.position.set(2.5, -14, 0);
    bodyGroup.add(legR);

    // 3. Volumetric Vulnerable Organs
    const organMeshes: THREE.Mesh[] = [];

    // Brain (Cerebral Hyperthermia)
    const brainGeo = new THREE.SphereGeometry(2.3, 20, 20);
    const brainMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0x991b1b,
      roughness: 0.3,
      transparent: true,
      opacity: 0.9
    });
    const brainMesh = new THREE.Mesh(brainGeo, brainMat);
    brainMesh.position.y = 16.2;
    brainMesh.userData = { name: 'Cranial Core (Sunstroke & Delirium)', stress: 'CRITICAL (40.4°C)' };
    organMeshes.push(brainMesh);
    bodyGroup.add(brainMesh);

    // Heart (Tachycardia / 138 BPM)
    const heartGeo = new THREE.SphereGeometry(1.8, 18, 18);
    const heartMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xbe123c,
      roughness: 0.2
    });
    const heartMesh = new THREE.Mesh(heartGeo, heartMat);
    heartMesh.position.set(0.6, 8.5, 1.5);
    heartMesh.userData = { name: 'Cardiac Core (138 BPM Tachycardia)', stress: 'HIGH THERMAL LOAD' };
    organMeshes.push(heartMesh);
    bodyGroup.add(heartMesh);

    // Kidneys (Renal Dehydration Failure Risk)
    const kidneyGeo = new THREE.CapsuleGeometry(1.1, 1.6, 8, 16);
    const kidneyMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xb45309,
      roughness: 0.4
    });
    const kidneyL = new THREE.Mesh(kidneyGeo, kidneyMat);
    kidneyL.position.set(-2.2, 2.5, -0.5);
    kidneyL.userData = { name: 'Left Kidney (Acute Dehydration)', stress: 'SEVERE FILTRATION DEFICIT' };
    organMeshes.push(kidneyL);
    bodyGroup.add(kidneyL);

    const kidneyR = new THREE.Mesh(kidneyGeo, kidneyMat);
    kidneyR.position.set(2.2, 2.5, -0.5);
    kidneyR.userData = { name: 'Right Kidney (Acute Dehydration)', stress: 'SEVERE FILTRATION DEFICIT' };
    organMeshes.push(kidneyR);
    bodyGroup.add(kidneyR);

    // 4. Interactive Drag-To-Rotate
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / height) * 2 + 1;

      if (isDragging) {
        const dx = e.clientX - prevMouse.x;
        bodyGroup.rotation.y += dx * 0.01;
        prevMouse = { x: e.clientX, y: e.clientY };
      }

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(organMeshes);
      if (intersects.length > 0) {
        setSelectedOrgan(intersects[0].object.userData.name);
        container.style.cursor = 'pointer';
      } else {
        container.style.cursor = isDragging ? 'grabbing' : 'grab';
      }
    };

    const onMouseUp = () => { isDragging = false; };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // 5. Animation Loop (Cardiac Beating Pulse)
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      if (!isDragging) {
        bodyGroup.rotation.y += 0.003;
      }

      // Heartbeat pulse rate
      const beat = 1 + Math.sin(time * 8) * 0.12;
      heartMesh.scale.set(beat, beat, beat);

      // Brain pulse
      const brainPulse = 1 + Math.sin(time * 3) * 0.04;
      brainMesh.scale.set(brainPulse, brainPulse, brainPulse);

      renderer.render(scene, camera);
    };
    animate();

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
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [currentTemp]);

  return (
    <div className="relative w-full h-[620px] bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl flex flex-col justify-between">
      {/* 3D Model Header */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3.5 py-1.5 rounded-xl shadow-lg flex items-center space-x-2 text-xs">
          <Activity className="h-4 w-4 text-rose-400 animate-pulse" />
          <span className="font-extrabold text-slate-100 uppercase tracking-wide">
            3D HUMAN PHYSIOLOGICAL TWIN
          </span>
          <span className="text-slate-500 font-mono">|</span>
          <span className="text-slate-400 font-mono text-[11px]">THERMAL ORGANS IMPACT</span>
        </div>

        <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 px-3.5 py-1.5 rounded-xl shadow-lg text-xs font-mono font-bold backdrop-blur-md">
          {selectedOrgan}
        </div>
      </div>

      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab" />

      {/* Interactive Clinical Controls */}
      <div className="absolute bottom-4 left-4 right-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Heart className="h-4 w-4 text-rose-400 animate-ping" />
            <span className="font-mono text-slate-200 font-bold">CARDIAC RATE: 138 BPM</span>
          </div>
          <div className="flex items-center space-x-2">
            <Thermometer className="h-4 w-4 text-amber-400" />
            <span className="font-mono text-slate-200 font-bold">CORE TEMP: {coreBodyTemp}°C</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-[11px] text-slate-400 font-mono">Simulate Heat Stress:</span>
          <input
            type="range"
            min="37.0"
            max="42.5"
            step="0.1"
            value={coreBodyTemp}
            onChange={(e) => setCoreBodyTemp(parseFloat(e.target.value))}
            className="accent-rose-500 cursor-pointer w-28"
          />
        </div>
      </div>
    </div>
  );
};
