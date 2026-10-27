'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DistrictSummary } from '@/types';
import { MapPin, Thermometer, Droplets, UserCheck, Flame, Crosshair, Radio, Shield } from 'lucide-react';

interface GeoJsonFeature {
  type: string;
  properties: {
    id: string;
    name: string;
    headquarters: string;
    population: number;
    score?: number;
    risk_level?: string;
  };
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

interface GeoJsonCollection {
  type: string;
  features: GeoJsonFeature[];
}

interface OdishaGisMapProps {
  districts: DistrictSummary[];
  selectedDistrictId: string | null;
  onSelectDistrict: (id: string) => void;
  geoJsonData: GeoJsonCollection | null;
}

const DEFAULT_INDIA_BBOX = {
  minLon: 68.0,
  maxLon: 92.5,
  minLat: 8.0,
  maxLat: 33.0
};

export const OdishaGisMap: React.FC<OdishaGisMapProps> = ({
  districts,
  selectedDistrictId,
  onSelectDistrict,
  geoJsonData
}) => {
  const [hoveredDistrict, setHoveredDistrict] = useState<DistrictSummary | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);
  const [radarActive, setRadarActive] = useState<boolean>(true);

  // Map districts by ID for instant lookup
  const districtMap = useMemo(() => {
    const map = new Map<string, DistrictSummary>();
    districts.forEach(d => map.set(d.id.toLowerCase(), d));
    return map;
  }, [districts]);

  // Dynamically compute bounding box from features or fall back to National extent
  const bbox = useMemo(() => {
    if (!geoJsonData?.features || geoJsonData.features.length === 0) {
      return DEFAULT_INDIA_BBOX;
    }
    let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;
    geoJsonData.features.forEach(f => {
      f.geometry?.coordinates?.forEach(ring => {
        ring.forEach(([lon, lat]) => {
          if (lon < minLon) minLon = lon;
          if (lon > maxLon) maxLon = lon;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        });
      });
    });
    if (minLon >= maxLon || minLat >= maxLat) return DEFAULT_INDIA_BBOX;
    const lonPad = Math.max(0.4, (maxLon - minLon) * 0.08);
    const latPad = Math.max(0.4, (maxLat - minLat) * 0.08);
    return {
      minLon: minLon - lonPad,
      maxLon: maxLon + lonPad,
      minLat: minLat - latPad,
      maxLat: maxLat + latPad
    };
  }, [geoJsonData]);

  // Project (lon, lat) to SVG coordinates (width=900, height=650)
  const project = (lon: number, lat: number) => {
    const width = 900;
    const height = 650;
    const padding = 45;

    const x = padding + ((lon - bbox.minLon) / (bbox.maxLon - bbox.minLon)) * (width - 2 * padding);
    const y = height - (padding + ((lat - bbox.minLat) / (bbox.maxLat - bbox.minLat)) * (height - 2 * padding));
    return [x, y];
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return { fill: '#ef4444', stroke: '#fca5a5', glow: 'rgba(239, 68, 68, 0.7)', label: 'CRITICAL' };
    if (score >= 60) return { fill: '#f97316', stroke: '#fdba74', glow: 'rgba(249, 115, 22, 0.5)', label: 'HIGH' };
    if (score >= 35) return { fill: '#eab308', stroke: '#fde047', glow: 'rgba(234, 179, 8, 0.4)', label: 'MODERATE' };
    return { fill: '#10b981', stroke: '#6ee7b7', glow: 'rgba(16, 185, 129, 0.35)', label: 'LOW' };
  };

  return (
    <div className="relative w-full h-[620px] bg-slate-950/80 border border-slate-700/60 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col justify-between">
      {/* Top HUD Telemetry Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center space-x-2">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3.5 py-1.5 rounded-2xl shadow-xl flex items-center space-x-2 text-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-extrabold tracking-wider text-slate-100 uppercase text-[11px]">
              GIS SURVEILLANCE RADAR
            </span>
            <span className="text-slate-600 font-mono">|</span>
            <span className="text-slate-400 font-mono text-[11px]">GRID: 22.80°N 80.50°E</span>
          </div>

          <button
            type="button"
            onClick={() => setRadarActive(!radarActive)}
            className="pointer-events-auto bg-slate-900/80 border border-slate-700/70 hover:border-slate-500 px-2.5 py-1 rounded-xl text-[10px] font-mono text-slate-300 flex items-center gap-1.5 cursor-pointer transition shadow-md"
          >
            <Radio className={`h-3 w-3 ${radarActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            RADAR: {radarActive ? 'ACTIVE' : 'STANDBY'}
          </button>
        </div>

        {districts.some(d => d.calculated_score >= 80) && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-red-500/25 border border-red-500/60 text-red-300 px-3.5 py-1.5 rounded-2xl shadow-2xl flex items-center space-x-2 text-xs backdrop-blur-md"
          >
            <Flame className="h-4 w-4 text-red-400 animate-bounce" />
            <strong className="font-black tracking-wide text-white">RED ALERT: HEATWAVE CONVECTION SURGE</strong>
          </motion.div>
        )}
      </div>

      {/* Cyber Reticle Markers in Corners */}
      <div className="absolute top-3 left-3 text-slate-600 pointer-events-none text-xs font-mono select-none">
        ┌─ [SYS: ACTIVE]
      </div>
      <div className="absolute top-3 right-3 text-slate-600 pointer-events-none text-xs font-mono select-none">
        [BAND: UHF-900] ─┐
      </div>
      <div className="absolute bottom-3 right-3 text-slate-600 pointer-events-none text-xs font-mono select-none">
        [ALL-INDIA NATIONAL GRID] ─┘
      </div>

      {/* Bottom Floating Legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3.5 py-2.5 rounded-2xl text-xs space-y-1.5 shadow-2xl">
        <div className="font-extrabold text-slate-200 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-rose-400" />
          LangGraph Thermal Severity
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
          <div className="flex items-center space-x-2">
            <span className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse"></span>
            <span className="text-slate-200 font-bold">Critical (&gt;80)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-3 w-3 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]"></span>
            <span className="text-slate-300 font-semibold">High (60-80)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
            <span className="text-slate-400">Moderate (35-60)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
            <span className="text-slate-400">Normal (&lt;35)</span>
          </div>
        </div>
      </div>

      {/* Main SVG Vector Layer */}
      <div className="w-full h-full flex items-center justify-center p-3 relative">
        <svg
          viewBox="0 0 900 650"
          className="w-full h-full max-h-[580px] object-contain select-none"
        >
          <defs>
            {/* Tech grid texture */}
            <pattern id="gisGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(71, 85, 105, 0.22)" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="1.5" fill="rgba(100, 116, 139, 0.35)" />
            </pattern>

            {/* Glowing filter for critical elements */}
            <filter id="neonGlowRed" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur1" />
              <feGaussianBlur stdDeviation="14" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Holographic sweep gradient */}
            <radialGradient id="radarSweepGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(56, 189, 248, 0.25)" />
              <stop offset="70%" stopColor="rgba(56, 189, 248, 0.05)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          {/* Background Tech Grid */}
          <rect width="900" height="650" fill="url(#gisGrid)" opacity="0.8" />

          {/* Radar Sweep Arc Beam */}
          {radarActive && (
            <g className="pointer-events-none opacity-45">
              <circle cx="450" cy="325" r="280" fill="none" stroke="rgba(56, 189, 248, 0.2)" strokeDasharray="6 6" />
              <circle cx="450" cy="325" r="180" fill="none" stroke="rgba(56, 189, 248, 0.15)" />
              <circle cx="450" cy="325" r="80" fill="none" stroke="rgba(56, 189, 248, 0.25)" />
              {/* Sweeping Beam */}
              <g className="animate-radar origin-[450px_325px]">
                <line x1="450" y1="325" x2="740" y2="325" stroke="rgba(56, 189, 248, 0.85)" strokeWidth="2" />
                <path d="M 450 325 L 740 325 A 290 290 0 0 0 680 140 Z" fill="url(#radarSweepGrad)" />
              </g>
            </g>
          )}

          {/* Active Live Vector Flow Streamlines (Marine Sea Breeze & Continental Wind Vectors) */}
          <g className="pointer-events-none opacity-60">
            {/* Marine Breeze Vectors entering from Bay of Bengal */}
            <path
              d="M 860 580 C 780 500 680 440 560 380 S 380 320 240 290"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.2"
              strokeDasharray="10 10"
            >
              <animate attributeName="stroke-dashoffset" from="80" to="0" dur="2.2s" repeatCount="indefinite" />
            </path>
            <path
              d="M 880 500 C 800 440 700 390 580 340 S 420 280 280 250"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
              strokeDasharray="8 8"
            >
              <animate attributeName="stroke-dashoffset" from="64" to="0" dur="1.8s" repeatCount="indefinite" />
            </path>
            <path
              d="M 820 620 C 740 560 640 500 520 440 S 340 380 200 350"
              fill="none"
              stroke="#2dd4bf"
              strokeWidth="2"
              strokeDasharray="8 8"
            >
              <animate attributeName="stroke-dashoffset" from="64" to="0" dur="2.6s" repeatCount="indefinite" />
            </path>

            {/* Hot Continental Loo Vectors from North-West */}
            <path
              d="M 120 120 C 240 180 360 240 480 300 S 680 400 800 460"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="10 10"
            >
              <animate attributeName="stroke-dashoffset" from="80" to="0" dur="2.4s" repeatCount="indefinite" />
            </path>
            <path
              d="M 160 80 C 280 140 400 200 520 260 S 720 360 840 420"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="8 8"
            >
              <animate attributeName="stroke-dashoffset" from="64" to="0" dur="2.0s" repeatCount="indefinite" />
            </path>
          </g>

          {/* District Polygons */}
          {geoJsonData?.features?.map((feature: GeoJsonFeature) => {
            const did = feature.properties.id.toLowerCase();
            const districtInfo = districtMap.get(did);
            const score = districtInfo?.calculated_score ?? feature.properties.score ?? 40;
            const isSelected = selectedDistrictId?.toLowerCase() === did;
            const isCritical = score >= 80;
            const colors = getRiskColor(score);

            const coords = feature.geometry.coordinates[0];
            const pathData = coords
              .map(([lon, lat]: number[], index: number) => {
                const [x, y] = project(lon, lat);
                return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
              })
              .join(' ') + ' Z';

            // Calculate polygon centroid for label and isobar pulses
            const centroidLon = coords.reduce((acc: number, c: number[]) => acc + c[0], 0) / coords.length;
            const centroidLat = coords.reduce((acc: number, c: number[]) => acc + c[1], 0) / coords.length;
            const [labelX, labelY] = project(centroidLon, centroidLat);

            return (
              <g
                key={did}
                className="cursor-pointer transition-all duration-300 group"
                onClick={() => onSelectDistrict(did)}
                onMouseEnter={(e) => {
                  if (districtInfo) {
                    setHoveredDistrict(districtInfo);
                    setHoverCoords({ x: e.clientX, y: e.clientY });
                  }
                }}
                onMouseLeave={() => setHoveredDistrict(null)}
              >
                {/* Critical District Radial Expanding Isobar Wave */}
                {isCritical && (
                  <circle
                    cx={labelX}
                    cy={labelY}
                    r="40"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    className="animate-pulse-ring pointer-events-none"
                  />
                )}

                {/* Base Polygon with Specular Stroke */}
                <path
                  d={pathData}
                  fill={colors.fill}
                  fillOpacity={isSelected ? 0.95 : isCritical ? 0.85 : 0.65}
                  stroke={isSelected ? '#ffffff' : colors.stroke}
                  strokeWidth={isSelected ? 3.5 : isCritical ? 2.5 : 1.5}
                  filter={isCritical ? 'url(#neonGlowRed)' : undefined}
                  className="transition-all duration-300 hover:fill-opacity-95"
                />

                {/* Tactical Corner Pins for Selected District */}
                {isSelected && (
                  <circle
                    cx={labelX}
                    cy={labelY}
                    r="5"
                    fill="#ffffff"
                    stroke="#f43f5e"
                    strokeWidth="2"
                    className="animate-ping pointer-events-none"
                  />
                )}

                {/* District Name */}
                <text
                  x={labelX}
                  y={labelY - 6}
                  textAnchor="middle"
                  className="text-[12px] font-black fill-white tracking-wide pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                >
                  {feature.properties.name}
                </text>

                {/* Score Pill Text */}
                <g className="pointer-events-none">
                  <rect
                    x={labelX - 25}
                    y={labelY + 2}
                    width="50"
                    height="18"
                    rx="9"
                    fill="rgba(15, 23, 42, 0.85)"
                    stroke={colors.stroke}
                    strokeWidth="1.2"
                  />
                  <text
                    x={labelX}
                    y={labelY + 15}
                    textAnchor="middle"
                    className="text-[10px] font-mono font-black fill-slate-100"
                  >
                    {Math.round(score)}/100
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Floating Holographic Inspection Tooltip */}
      <AnimatePresence>
        {hoveredDistrict && hoverCoords && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50 pointer-events-none glass-panel-glow p-4 rounded-2xl text-xs space-y-2 w-64 shadow-2xl"
            style={{
              left: Math.min(hoverCoords.x + 18, window.innerWidth - 270),
              top: Math.min(hoverCoords.y - 60, window.innerHeight - 220)
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
              <span className="font-black text-white text-sm flex items-center gap-1.5">
                <Crosshair className="h-4 w-4 text-rose-400" />
                {hoveredDistrict.name}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                hoveredDistrict.calculated_score >= 80 ? 'bg-red-500/30 text-red-300 border border-red-500/60' :
                hoveredDistrict.calculated_score >= 60 ? 'bg-orange-500/30 text-orange-300 border border-orange-500/60' :
                'bg-yellow-500/30 text-yellow-300 border border-yellow-500/60'
              }`}>
                {hoveredDistrict.risk_level}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-200">
              <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                <Thermometer className="h-3.5 w-3.5 text-amber-400" />
                <span className="font-mono font-bold">{hoveredDistrict.temperature_3day_avg}°C</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                <Droplets className="h-3.5 w-3.5 text-blue-400" />
                <span className="font-mono font-bold">{hoveredDistrict.rainfall_mm}mm</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2 bg-rose-950/40 p-1.5 rounded-lg border border-rose-900/40 text-rose-300">
                <UserCheck className="h-3.5 w-3.5 text-rose-400" />
                <span className="font-semibold">{hoveredDistrict.total_frontline_cases} Frontline Cases Reported</span>
              </div>
            </div>

            <div className="pt-1 text-[10px] text-slate-400 italic text-center font-mono">
              ✦ Click polygon to inspect SHAP attributions ✦
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
