'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Package, Radio, BatteryCharging, Rotate3d, Layers } from 'lucide-react';

interface TelemetryHubProps {
  districtName?: string;
  storageTemp?: number;
}

export const ThreeFrontlineTelemetryHub: React.FC<TelemetryHubProps> = ({
  districtName = 'Khordha Primary Health Centre',
  storageTemp = 3.8
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [explodedView, setExplodedView] = useState<boolean>(false);
  const [hoveredPart, setHoveredPart] = useState<string>('PHC Cold-Chain Container Unit');

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(25, 20, 35);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const hubGroup = new THREE.Group();
    scene.add(hubGroup);

    // 1. Lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(amb);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    keyLight.position.set(30, 40, 20);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf43f5e, 1.0);
    fillLight.position.set(-20, -20, -10);
    scene.add(fillLight);

    // 2. 3D Cold-Chain Chassis Parts
    const bodyGeo = new THREE.BoxGeometry(14, 9, 10);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.7,
      roughness: 0.25
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.userData = { name: 'Main Insulated Polyurethane Cold Chamber' };
    hubGroup.add(bodyMesh);

    // Lid (Displaces upwards in exploded view)
    const lidGeo = new THREE.BoxGeometry(14.4, 2, 10.4);
    const lidMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.6,
      roughness: 0.3
    });
    const lidMesh = new THREE.Mesh(lidGeo, lidMat);
    lidMesh.position.y = 5.5;
    lidMesh.userData = { name: 'Hermetic Solar Insulated Lid' };
    hubGroup.add(lidMesh);

    // Solar Telemetry Panel on Lid
    const solarGeo = new THREE.BoxGeometry(11, 0.3, 7.5);
    const solarMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.9
    });
    const solarMesh = new THREE.Mesh(solarGeo, solarMat);
    solarMesh.position.set(0, 6.7, 0);
    solarMesh.userData = { name: 'Monocrystalline Solar Harvesting Array' };
    hubGroup.add(solarMesh);

    // Satellite / Cellular Transceiver Dish
    const dishGroup = new THREE.Group();
    dishGroup.position.set(5.5, 7.5, 3.5);
    const mastGeo = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.y = 2;
    dishGroup.add(mast);

    const dishGeo = new THREE.ConeGeometry(2, 1.2, 16, 1, true);
    const dishMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, side: THREE.DoubleSide, metalness: 0.5 });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.y = 4;
    dish.rotation.x = Math.PI * 0.8;
    dishGroup.add(dish);
    dishGroup.userData = { name: 'C-DAC Satellite & 5G Frontline Mesh Transceiver' };
    hubGroup.add(dishGroup);

    // Digital Temperature LCD Plate
    const lcdGeo = new THREE.BoxGeometry(4.5, 2, 0.4);
    const lcdMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const lcdMesh = new THREE.Mesh(lcdGeo, lcdMat);
    lcdMesh.position.set(0, 0, 5.2);
    lcdMesh.userData = { name: 'Digital IoT Temp Display (+3.8°C Safe)' };
    hubGroup.add(lcdMesh);

    // Internal ORS Sachets / Buffer Stock Cylinders (Visible in exploded view)
    const stockGroup = new THREE.Group();
    const orsGeo = new THREE.BoxGeometry(2.5, 3.5, 1.5);
    const orsMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4 });
    for (let x = -3; x <= 3; x += 3) {
      const orsMesh = new THREE.Mesh(orsGeo, orsMat);
      orsMesh.position.set(x, 1, 0);
      stockGroup.add(orsMesh);
    }
    stockGroup.userData = { name: 'WHO-Formula ORS & IV Saline Buffer Chamber' };
    hubGroup.add(stockGroup);

    // 3. Interactive Mouse Controls
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
        const dy = e.clientY - prevMouse.y;
        hubGroup.rotation.y += dx * 0.008;
        hubGroup.rotation.x += dy * 0.008;
        prevMouse = { x: e.clientX, y: e.clientY };
      }

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects([bodyMesh, lidMesh, solarMesh, lcdMesh]);
      if (intersects.length > 0) {
        setHoveredPart(intersects[0].object.userData.name);
        container.style.cursor = 'pointer';
      } else {
        container.style.cursor = isDragging ? 'grabbing' : 'grab';
      }
    };

    const onMouseUp = () => { isDragging = false; };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // 4. Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Satellite dish sweeps
      dishGroup.rotation.y = Math.sin(time * 1.5) * 0.4;

      // Handle smooth exploded view displacement
      const targetLidY = explodedView ? 14 : 5.5;
      const targetSolarY = explodedView ? 15.2 : 6.7;
      const targetDishY = explodedView ? 16 : 7.5;
      const targetStockY = explodedView ? 6 : 0;

      lidMesh.position.y += (targetLidY - lidMesh.position.y) * 0.1;
      solarMesh.position.y += (targetSolarY - solarMesh.position.y) * 0.1;
      dishGroup.position.y += (targetDishY - dishGroup.position.y) * 0.1;
      stockGroup.position.y += (targetStockY - stockGroup.position.y) * 0.1;

      if (!isDragging) {
        hubGroup.rotation.y += 0.003;
      }

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
  }, [explodedView]);

  return (
    <div className="relative w-full h-[620px] bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl flex flex-col justify-between">
      {/* 3D Header Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3.5 py-1.5 rounded-xl shadow-lg flex items-center space-x-2 text-xs">
          <Package className="h-4 w-4 text-sky-400" />
          <span className="font-extrabold text-slate-100 uppercase tracking-wide">
            3D HARDWARE TWIN • COLD-CHAIN IOT UNIT
          </span>
          <span className="text-slate-500 font-mono">|</span>
          <span className="text-slate-400 font-mono text-[11px]">{districtName}</span>
        </div>

        <div className="bg-sky-500/20 border border-sky-500/40 text-sky-300 px-3.5 py-1.5 rounded-xl shadow-lg text-xs font-mono font-bold backdrop-blur-md">
          {hoveredPart}
        </div>
      </div>

      {/* Canvas */}
      <div ref={mountRef} className="w-full h-full cursor-grab" />

      {/* Bottom Controls */}
      <div className="absolute bottom-4 left-4 right-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono text-slate-200 font-bold">CHAMBER TEMP: +{storageTemp}°C (SAFE)</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-400 font-mono">
            <BatteryCharging className="h-4 w-4 text-emerald-400" />
            <span>SOLAR POWER: 98% (GRID BACKED)</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExplodedView(!explodedView)}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shadow-md ${
            explodedView
              ? 'bg-sky-600 text-white shadow-sky-900/50'
              : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
          }`}
        >
          <Layers className="h-4 w-4" />
          {explodedView ? 'Collapse 3D Unit' : '3D Exploded Inspection View'}
        </button>
      </div>
    </div>
  );
};
