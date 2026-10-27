'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { DistrictSummary } from '@/types';
import { Rotate3d, ZoomIn, ZoomOut, Flame, Compass } from 'lucide-react';

interface ThreeGlobeProps {
  districts: DistrictSummary[];
  selectedDistrictId: string | null;
  onSelectDistrict: (id: string) => void;
}

export const ThreeGlobeSurveillance: React.FC<ThreeGlobeProps> = ({
  districts,
  selectedDistrictId,
  onSelectDistrict
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 180);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Earth Sphere / Wireframe Globe
    const globeRadius = 55;
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Dark core sphere
    const coreGeo = new THREE.SphereGeometry(globeRadius, 48, 48);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x070d1a,
      emissive: 0x050811,
      shininess: 25,
      transparent: true,
      opacity: 0.95
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    globeGroup.add(coreMesh);

    // Longitude/Latitude Wireframe Grid
    const wireGeo = new THREE.SphereGeometry(globeRadius * 1.002, 24, 24);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x1e293b,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wireMesh);

    // Outer Atmospheric Glow Rim
    const glowGeo = new THREE.SphereGeometry(globeRadius * 1.15, 32, 32);
    const glowMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(0.22, 0.55, 0.95, 1.0) * intensity * 0.7;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glowMesh);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    dirLight.position.set(100, 80, 100);
    scene.add(dirLight);

    // 4. District Beacons & 3D Extrusions
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const beaconMeshes: THREE.Mesh[] = [];

    // Helper: Convert lat/lon to 3D Cartesian coordinates on sphere
    const latLonToVector3 = (lat: number, lon: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    };

    districts.forEach((d) => {
      const basePos = latLonToVector3(d.lat, d.lon, globeRadius);
      const isCritical = d.calculated_score >= 80;
      const isSelected = selectedDistrictId?.toLowerCase() === d.id.toLowerCase();

      const colorHex = isCritical ? 0xef4444 : d.calculated_score >= 60 ? 0xf97316 : 0x10b981;
      const spireHeight = 6 + (d.calculated_score / 100) * 22;

      // Vertical 3D Light Spire
      const spireGeo = new THREE.CylinderGeometry(0.5, 1.2, spireHeight, 8);
      const spireMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: isSelected ? 1 : 0.85
      });
      const spireMesh = new THREE.Mesh(spireGeo, spireMat);

      // Position & orient spire outward from sphere center
      const normal = basePos.clone().normalize();
      const spirePos = basePos.clone().add(normal.clone().multiplyScalar(spireHeight / 2));
      spireMesh.position.copy(spirePos);
      spireMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

      spireMesh.userData = { districtId: d.id, name: d.name, score: d.calculated_score };
      beaconMeshes.push(spireMesh);
      globeGroup.add(spireMesh);

      // Glowing Base Ring
      const ringGeo = new THREE.RingGeometry(1.2, 2.5, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(basePos.clone().add(normal.clone().multiplyScalar(0.2)));
      ringMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      globeGroup.add(ringMesh);
    });

    // Rotate globe initially to center on India National Subcontinent (Lat ~22.8, Lon ~80.5)
    globeGroup.rotation.y = -Math.PI / 1.35;
    globeGroup.rotation.x = 0.35;

    // 5. Drag-to-Rotate Interaction
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / height) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - prevMousePos.x;
        const deltaY = e.clientY - prevMousePos.y;
        globeGroup.rotation.y += deltaX * 0.006;
        globeGroup.rotation.x += deltaY * 0.006;
        prevMousePos = { x: e.clientX, y: e.clientY };
      }

      // Raycast hover test
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(beaconMeshes);
      if (intersects.length > 0) {
        const d = intersects[0].object.userData;
        setHoveredName(`${d.name} (Risk: ${Math.round(d.score)}/100)`);
        container.style.cursor = 'pointer';
      } else {
        setHoveredName(null);
        container.style.cursor = isDragging ? 'grabbing' : 'grab';
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(beaconMeshes);
      if (intersects.length > 0) {
        const d = intersects[0].object.userData;
        onSelectDistrict(d.districtId);
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.min(Math.max(camera.position.z + e.deltaY * 0.1, 100), 280);
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('click', onClick);
    container.addEventListener('wheel', onWheel, { passive: false });

    // 6. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Slow gentle auto-rotation when not dragging
      if (!isDragging) {
        globeGroup.rotation.y += 0.0015;
      }

      // Spire beacon height pulse
      beaconMeshes.forEach((mesh, idx) => {
        const isCrit = mesh.userData.score >= 80;
        if (isCrit) {
          const s = 1 + Math.sin(elapsedTime * 4 + idx) * 0.15;
          mesh.scale.set(s, s, s);
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
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
      container.removeEventListener('click', onClick);
      container.removeEventListener('wheel', onWheel);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [districts, selectedDistrictId, onSelectDistrict]);

  return (
    <div className="relative w-full h-[620px] bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl flex flex-col justify-between">
      {/* 3D Model Header Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3.5 py-1.5 rounded-xl shadow-lg flex items-center space-x-2 text-xs">
          <Rotate3d className="h-4 w-4 text-blue-400 animate-spin-slow" />
          <span className="font-extrabold text-slate-100 uppercase tracking-wide">
            3D DIGITAL TWIN • SURVEILLANCE GLOBE
          </span>
          <span className="text-slate-500 font-mono">|</span>
          <span className="text-slate-400 font-mono text-[11px]">DRAG TO ORBIT • SCROLL TO ZOOM</span>
        </div>

        {hoveredName && (
          <div className="bg-blue-500/20 border border-blue-500/40 text-blue-300 px-3.5 py-1.5 rounded-xl shadow-lg text-xs font-mono font-bold backdrop-blur-md">
            📍 {hoveredName}
          </div>
        )}
      </div>

      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab" />

      {/* Bottom Floating Legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-2 rounded-xl text-xs space-y-1 shadow-lg">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
          3D Beacon Spire Height = Risk Intensity
        </div>
        <div className="flex items-center space-x-3 text-[11px] font-mono">
          <span className="flex items-center gap-1 text-red-400">
            <span className="h-2 w-2 rounded-full bg-red-500"></span> Critical (&gt;80)
          </span>
          <span className="flex items-center gap-1 text-orange-400">
            <span className="h-2 w-2 rounded-full bg-orange-500"></span> High (60-80)
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Normal (&lt;35)
          </span>
        </div>
      </div>
    </div>
  );
};
