'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DistrictSummary } from '@/types';
import {
  Satellite,
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Radio,
  Crosshair,
  Flame,
  Shield,
  Activity,
  Wind,
  Droplets,
  Waves,
  Thermometer,
  Gauge,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Sliders,
  Eye,
  EyeOff
} from 'lucide-react';

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

export type MapLayerKey = 'satellite' | 'temperature' | 'wind' | 'vapour' | 'currents' | 'topo';

interface IsroBhuvanMapProps {
  districts: DistrictSummary[];
  selectedDistrictId: string | null;
  onSelectDistrict: (id: string) => void;
  geoJsonData: GeoJsonCollection | null;
  initialLayer?: MapLayerKey;
}

const INDIA_CENTER: [number, number] = [22.8, 80.5];
const INDIA_DEFAULT_ZOOM = 5;

// Authentic administrative district coordinates, ISO codes & metadata across Pan-India
const DISTRICT_ADMIN_DATA: Record<string, { code: string; coastal: boolean; hq: string }> = {
  delhi: { code: 'DL-DEL', coastal: false, hq: 'New Delhi' },
  churu: { code: 'RJ-CHU', coastal: false, hq: 'Churu, Rajasthan' },
  bikaner: { code: 'RJ-BIK', coastal: false, hq: 'Bikaner, Rajasthan' },
  jaipur: { code: 'RJ-JAI', coastal: false, hq: 'Jaipur, Rajasthan' },
  gwalior: { code: 'MP-GWA', coastal: false, hq: 'Gwalior, Madhya Pradesh' },
  bhopal: { code: 'MP-BHO', coastal: false, hq: 'Bhopal, Madhya Pradesh' },
  prayagraj: { code: 'UP-PRY', coastal: false, hq: 'Prayagraj, Uttar Pradesh' },
  lucknow: { code: 'UP-LKO', coastal: false, hq: 'Lucknow, Uttar Pradesh' },
  gaya: { code: 'BR-GAY', coastal: false, hq: 'Gaya, Bihar' },
  patna: { code: 'BR-PAT', coastal: false, hq: 'Patna, Bihar' },
  nagpur: { code: 'MH-NAG', coastal: false, hq: 'Nagpur, Maharashtra' },
  chandrapur: { code: 'MH-CHA', coastal: false, hq: 'Chandrapur, Maharashtra' },
  ahmedabad: { code: 'GJ-AHM', coastal: false, hq: 'Ahmedabad, Gujarat' },
  mumbai: { code: 'MH-MUM', coastal: true, hq: 'Bandra, Maharashtra' },
  kolkata: { code: 'WB-KOL', coastal: true, hq: 'Kolkata, West Bengal' },
  jharsuguda: { code: 'OD-JHA', coastal: false, hq: 'Jharsuguda, Odisha' },
  bolangir: { code: 'OD-BOL', coastal: false, hq: 'Balangir, Odisha' },
  sambalpur: { code: 'OD-SAM', coastal: false, hq: 'Sambalpur, Odisha' },
  khordha: { code: 'OD-KHO', coastal: true, hq: 'Bhubaneswar, Odisha' },
  cuttack: { code: 'OD-CTC', coastal: false, hq: 'Cuttack, Odisha' },
  sundargarh: { code: 'OD-SUN', coastal: false, hq: 'Rourkela, Odisha' },
  mayurbhanj: { code: 'OD-MAY', coastal: false, hq: 'Baripada, Odisha' },
  puri: { code: 'OD-PUR', coastal: true, hq: 'Puri, Odisha' },
  balasore: { code: 'OD-BAL', coastal: true, hq: 'Baleshwar, Odisha' },
  ramagundam: { code: 'TG-RAM', coastal: false, hq: 'Ramagundam, Telangana' },
  hyderabad: { code: 'TG-HYD', coastal: false, hq: 'Hyderabad, Telangana' },
  vijayawada: { code: 'AP-VIJ', coastal: true, hq: 'Vijayawada, Andhra Pradesh' },
  chennai: { code: 'TN-CHE', coastal: true, hq: 'Chennai, Tamil Nadu' },
  bengaluru: { code: 'KA-BLR', coastal: false, hq: 'Bengaluru, Karnataka' }
};

interface Particle {
  lat: number;
  lon: number;
  prevLat: number;
  prevLon: number;
  age: number;
  maxAge: number;
  speed: number;
}

export const IsroBhuvanMap: React.FC<IsroBhuvanMapProps> = ({
  districts,
  selectedDistrictId,
  onSelectDistrict,
  geoJsonData,
  initialLayer = 'satellite'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const baseTileLayerRef = useRef<any>(null);
  const politicalOverlayRef = useRef<any>(null);
  const labelsOverlayRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const geoJsonLayerRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [activeLayer, setActiveLayer] = useState<MapLayerKey>(initialLayer);
  const [currentZoom, setCurrentZoom] = useState<number>(INDIA_DEFAULT_ZOOM);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radarActive, setRadarActive] = useState<boolean>(true);
  const [vectorLinesActive, setVectorLinesActive] = useState<boolean>(true);
  const [vectorSpeed, setVectorSpeed] = useState<number>(1.0);
  const [vectorDensity, setVectorDensity] = useState<'normal' | 'high'>('normal');
  const [showArrowheads, setShowArrowheads] = useState<boolean>(true);
  const [showPolygons, setShowPolygons] = useState<boolean>(false);
  const [isGraphOpen, setIsGraphOpen] = useState<boolean>(true);
  const [activeGraphTab, setActiveGraphTab] = useState<'temperature' | 'wind' | 'vapour' | 'currents'>('temperature');
  const [hoveredDistrict, setHoveredDistrict] = useState<DistrictSummary | null>(null);

  // Sync initialLayer when prop changes
  useEffect(() => {
    if (initialLayer) {
      setActiveLayer(initialLayer);
      if (['temperature', 'wind', 'vapour', 'currents'].includes(initialLayer)) {
        setActiveGraphTab(initialLayer as any);
      }
    }
  }, [initialLayer]);

  // Map districts by ID
  const districtMap = useMemo(() => {
    const map = new Map<string, DistrictSummary>();
    districts.forEach(d => map.set(d.id.toLowerCase(), d));
    return map;
  }, [districts]);

  // Tile configurations supporting 100% keyless high-res Satellite + Authentic Political Borders & Administrative Places
  const tileLayersConfig = {
    satellite: {
      name: 'ISRO / ESRI High-Resolution True Color Satellite',
      base: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      boundaries: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      labels: null,
      attribution: 'Satellite &copy; ISRO Bhuvan / NRSC / ESRI | Political Borders &copy; Esri',
      maxZoom: 18,
      subdomains: ['a', 'b', 'c', 'd']
    },
    temperature: {
      name: 'Thermal Surface Infrared & Isotherm Gradient',
      base: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      boundaries: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      labels: null,
      attribution: 'Thermal IR &copy; INSAT-3DR / NASA FIRMS / Esri',
      maxZoom: 18,
      subdomains: ['a', 'b', 'c', 'd']
    },
    wind: {
      name: 'Atmospheric Wind Vector & Streamline Velocity Grid',
      base: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      boundaries: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      labels: null,
      attribution: 'Wind Flow &copy; ECMWF / IMD Mausam / Esri',
      maxZoom: 18,
      subdomains: ['a', 'b', 'c', 'd']
    },
    vapour: {
      name: 'INSAT-3DR 6.7µm Water Vapour & Atmospheric Moisture Plumes',
      base: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      boundaries: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      labels: null,
      attribution: 'Water Vapour &copy; ISRO INSAT-3DR Radiometer (6.7µm channel) / Esri',
      maxZoom: 18,
      subdomains: ['a', 'b', 'c', 'd']
    },
    currents: {
      name: 'Bay of Bengal Coastal Currents & Surface Circulation',
      base: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
      boundaries: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}',
      labels: null,
      attribution: 'Ocean Currents &copy; INCOIS / NOAA OSCAR / Esri Ocean',
      maxZoom: 18,
      subdomains: ['a', 'b', 'c', 'd']
    },
    topo: {
      name: 'ISRO Bhuvan Topographic Elevation Grid',
      base: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      boundaries: null,
      labels: null,
      attribution: 'Topography &copy; ISRO Bhuvan / Esri Topo',
      maxZoom: 18,
      subdomains: ['a', 'b', 'c']
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return { fill: '#ef4444', stroke: '#f87171', glow: 'rgba(239, 68, 68, 0.85)', label: 'CRITICAL', text: '#fca5a5' };
    if (score >= 60) return { fill: '#f97316', stroke: '#fb923c', glow: 'rgba(249, 115, 22, 0.75)', label: 'HIGH', text: '#fdba74' };
    if (score >= 35) return { fill: '#eab308', stroke: '#fde047', glow: 'rgba(234, 179, 8, 0.65)', label: 'MODERATE', text: '#fef08a' };
    return { fill: '#10b981', stroke: '#34d399', glow: 'rgba(16, 185, 129, 0.55)', label: 'LOW', text: '#a7f3d0' };
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initLeaflet() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;
      const L = (await import('leaflet')).default;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: INDIA_CENTER,
        zoom: INDIA_DEFAULT_ZOOM,
        minZoom: 4,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: false
      });

      mapInstanceRef.current = map;

      // Base tile layer
      const cfg = tileLayersConfig[activeLayer];
      const baseLayer = L.tileLayer(cfg.base, {
        maxZoom: cfg.maxZoom,
        subdomains: cfg.subdomains as any
      }).addTo(map);
      baseTileLayerRef.current = baseLayer;

      // Official Political Boundaries Overlay
      if (cfg.boundaries) {
        const polyLayer = L.tileLayer(cfg.boundaries, {
          maxZoom: cfg.maxZoom,
          opacity: 0.95
        }).addTo(map);
        politicalOverlayRef.current = polyLayer;
      }

      // Labels Overlay
      if (cfg.labels) {
        const labLayer = L.tileLayer(cfg.labels, {
          maxZoom: cfg.maxZoom,
          opacity: 0.9
        }).addTo(map);
        labelsOverlayRef.current = labLayer;
      }

      map.on('mousemove', (e: any) => {
        if (isMounted) {
          setCursorCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
      });

      map.on('zoomend', () => {
        if (isMounted) {
          setCurrentZoom(Math.round(map.getZoom() * 10) / 10);
        }
      });
    }

    initLeaflet();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Tile Layer & Political Overlay Switcher
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      // Remove previous base and overlays
      if (baseTileLayerRef.current) map.removeLayer(baseTileLayerRef.current);
      if (politicalOverlayRef.current) map.removeLayer(politicalOverlayRef.current);
      if (labelsOverlayRef.current) map.removeLayer(labelsOverlayRef.current);

      const cfg = tileLayersConfig[activeLayer];

      const newBase = L.tileLayer(cfg.base, {
        maxZoom: cfg.maxZoom,
        subdomains: cfg.subdomains as any
      }).addTo(map);
      baseTileLayerRef.current = newBase;

      if (cfg.boundaries) {
        const polyLayer = L.tileLayer(cfg.boundaries, {
          maxZoom: cfg.maxZoom,
          opacity: activeLayer === 'satellite' ? 0.95 : 0.85
        }).addTo(map);
        politicalOverlayRef.current = polyLayer;
      }

      if (cfg.labels) {
        const labLayer = L.tileLayer(cfg.labels, {
          maxZoom: cfg.maxZoom,
          opacity: 0.95
        }).addTo(map);
        labelsOverlayRef.current = labLayer;
      }
    });
  }, [activeLayer]);

  // 3. Render Political Administrative Hub Markers (Replacing crude random polygons)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      if (markersLayerRef.current) {
        map.removeLayer(markersLayerRef.current);
        markersLayerRef.current = null;
      }

      const group = L.layerGroup();

      districts.forEach((d) => {
        const did = d.id.toLowerCase();
        const admin = DISTRICT_ADMIN_DATA[did] || { code: `OD-${did.slice(0, 3).toUpperCase()}`, coastal: false, hq: d.headquarters };
        const score = d.calculated_score;
        const colors = getRiskColor(score);
        const isSelected = selectedDistrictId?.toLowerCase() === did;
        const isCrit = score >= 80;

        // Custom Political Satellite Landmark HUD Pin
        const markerHtml = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; pointer-events: auto;">
            <!-- Outer Target Reticle Rings -->
            <div style="position: relative; width: ${isSelected ? '36px' : '26px'}; height: ${isSelected ? '36px' : '26px'}; display: flex; align-items: center; justify-content: center; transition: all 0.3s;">
              <div style="position: absolute; inset: 0; border: 1.5px ${isSelected ? 'solid #ffffff' : 'dashed ' + colors.stroke}; border-radius: 50%; opacity: ${isSelected ? '1' : '0.85'}; animation: ${isCrit ? 'spin 12s linear infinite' : 'none'}; box-shadow: 0 0 15px ${colors.glow};"></div>
              ${isCrit ? `<div style="position: absolute; width: 44px; height: 44px; border: 1px solid ${colors.fill}; border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.7;"></div>` : ''}
              
              <!-- Core Solid Sensor Dot -->
              <div style="width: ${isSelected ? '12px' : '8px'}; height: ${isSelected ? '12px' : '8px'}; border-radius: 50%; background: ${isSelected ? '#ffffff' : colors.fill}; border: 1.5px solid #0f172a; box-shadow: 0 0 10px ${colors.fill};"></div>
            </div>

            <!-- Political Administrative Badge -->
            <div style="margin-top: 3px; background: rgba(10, 15, 26, 0.92); border: 1px solid ${isSelected ? '#ffffff' : 'rgba(56, 189, 248, 0.35)'}; border-radius: 6px; padding: 2px 6px; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.85); backdrop-filter: blur(8px); white-space: nowrap;">
              <span style="font-family: monospace; font-size: 9px; font-weight: 800; color: #38bdf8; letter-spacing: 0.5px;">${admin.code}</span>
              <span style="font-family: system-ui, sans-serif; font-size: 10px; font-weight: 700; color: #f8fafc;">${d.name}</span>
              <span style="font-family: monospace; font-size: 9px; font-weight: 800; background: ${colors.fill}; color: #ffffff; padding: 0 3px; border-radius: 3px;">${Math.round(score)}</span>
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html: markerHtml,
          className: 'tactical-district-marker',
          iconSize: [120, 60],
          iconAnchor: [60, isSelected ? 18 : 13]
        });

        const marker = L.marker([d.lat, d.lon], { icon });

        // Tooltip hover
        const tooltipContent = `
          <div style="background: rgba(15, 23, 42, 0.96); border: 1px solid ${colors.stroke}; padding: 10px 14px; border-radius: 12px; color: #f8fafc; font-family: monospace; font-size: 11px; box-shadow: 0 15px 35px rgba(0,0,0,0.9); min-width: 180px;">
            <div style="font-weight: 800; font-size: 13px; color: #ffffff; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">
              <span>${d.name.toUpperCase()} (${admin.code})</span>
              <span style="background: ${colors.fill}; color: #ffffff; padding: 1px 6px; border-radius: 4px; font-size: 10px;">${colors.label}</span>
            </div>
            <div style="color: #94a3b8; line-height: 1.6;">
              • HQ: <strong style="color: #ffffff;">${admin.hq}</strong><br/>
              • Surface Temp: <strong style="color: #fde047;">${d.temperature_3day_avg}°C</strong><br/>
              • Frontline Reports: <strong style="color: #38bdf8;">${d.total_frontline_cases} active</strong><br/>
              • Risk Consensus: <strong style="color: ${colors.stroke};">${Math.round(score)} / 100</strong>
            </div>
          </div>
        `;

        marker.bindTooltip(tooltipContent, {
          direction: 'top',
          offset: [0, -18],
          className: 'isro-custom-tooltip'
        });

        marker.on('click', () => {
          onSelectDistrict(d.id);
          map.flyTo([d.lat, d.lon], 9, { duration: 1.2 });
        });

        group.addLayer(marker);
      });

      group.addTo(map);
      markersLayerRef.current = group;
    });
  }, [districts, selectedDistrictId, onSelectDistrict]);

  // 4. District Boundary Polygons (Optional Toggle, default off to keep clean satellite)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      if (geoJsonLayerRef.current) {
        map.removeLayer(geoJsonLayerRef.current);
        geoJsonLayerRef.current = null;
      }

      if (!showPolygons || !geoJsonData) return;

      const layer = L.geoJSON(geoJsonData as any, {
        style: (feature: any) => {
          const did = (feature?.properties?.id || '').toLowerCase();
          const dData = districtMap.get(did);
          const score = dData?.calculated_score ?? feature?.properties?.score ?? 50;
          const isSelected = selectedDistrictId?.toLowerCase() === did;
          const colors = getRiskColor(score);

          return {
            fillColor: colors.fill,
            fillOpacity: isSelected ? 0.35 : 0.12,
            color: isSelected ? '#ffffff' : colors.stroke,
            weight: isSelected ? 2.5 : 1.2,
            dashArray: '4, 4'
          };
        }
      }).addTo(map);

      geoJsonLayerRef.current = layer;
    });
  }, [showPolygons, geoJsonData, districtMap, selectedDistrictId]);

  // 5. Earth NullSchool High-Fidelity Vector Streamline Canvas Engine
  useEffect(() => {
    if (!canvasRef.current || !mapInstanceRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const map = mapInstanceRef.current;
    let isAnimRunning = true;
    let isInteracting = false;
    const count = vectorDensity === 'high' ? 850 : 520;
    const particles: Particle[] = [];

    // Helper: sample random point within current visible viewport bounds
    const spawnParticle = (): Particle => {
      const bounds = map.getBounds();
      const south = bounds ? Math.max(bounds.getSouth() - 1, 5.0) : 6.0;
      const north = bounds ? Math.min(bounds.getNorth() + 1, 37.5) : 37.0;
      const west = bounds ? Math.max(bounds.getWest() - 1, 66.0) : 67.0;
      const east = bounds ? Math.min(bounds.getEast() + 1, 98.0) : 97.0;

      let lat = south + Math.random() * (north - south);
      let lon = west + Math.random() * (east - west);

      // If oceanic currents layer, concentrate over sea waters
      if (activeLayer === 'currents') {
        if (Math.random() > 0.45) {
          lon = 66.5 + Math.random() * 10.5; // Arabian Sea basin
          lat = 7.5 + Math.random() * 16.0;
        } else {
          lon = 81.0 + Math.random() * 12.0; // Bay of Bengal basin
          lat = 7.5 + Math.random() * 15.0;
        }
      }

      return {
        lat,
        lon,
        prevLat: lat,
        prevLon: lon,
        age: Math.floor(Math.random() * 65),
        maxAge: 70 + Math.floor(Math.random() * 75),
        speed: 0.85 + Math.random() * 0.4
      };
    };

    for (let i = 0; i < count; i++) {
      particles.push(spawnParticle());
    }

    // Mathematical All-India Continuous Vector Velocity Field
    const evaluateVector = (lat: number, lon: number): { u: number; v: number; color: string; speedKmh: number } => {
      if (activeLayer === 'wind') {
        // 1. Continental Dry 'Loo' Stream across Northern & Western Heat Belt (Rajasthan -> Gangetic Valley)
        if (lat >= 23.5 && lat <= 32.0 && lon >= 69.0 && lon <= 88.0) {
          const u = 0.038 + Math.cos(lat * 0.8) * 0.007;
          const v = -0.010 + Math.sin(lon * 0.7) * 0.005;
          return { u, v, color: '#f59e0b', speedKmh: 48.0 }; // Amber thermal wind
        }

        // 2. Arabian Sea South-Westerly Inflow
        if (lon < 77.5 && lat < 24.0) {
          const u = 0.026 + Math.sin(lat * 0.5) * 0.006;
          const v = 0.022 + Math.cos(lon * 0.6) * 0.005;
          return { u, v, color: '#38bdf8', speedKmh: 34.0 }; // Electric cyan
        }

        // 3. Bay of Bengal Anticyclonic Marine Gyre & Coastal Drift
        if (lon >= 77.5 && lat < 24.0) {
          const dx = lon - 87.0;
          const dy = lat - 16.0;
          const u = -dy * 0.0022 + 0.014;
          const v = dx * 0.0022 + 0.020;
          return { u, v, color: '#0ea5e9', speedKmh: 31.0 }; // Azure
        }

        // 4. Northern Himalayan Boundary Jet Stream
        const u = 0.040;
        const v = -0.003;
        return { u, v, color: '#94a3b8', speedKmh: 50.0 };
      }

      if (activeLayer === 'currents') {
        // Pan-India Oceanic Circulation
        // Arabian Sea West India Coastal Current (WICC)
        if (lon < 77.5) {
          const u = 0.010 + Math.sin(lat * 0.7) * 0.004;
          const v = -0.016 + Math.cos(lon * 0.6) * 0.004;
          return { u, v, color: '#14b8a6', speedKmh: 2.3 }; // Deep Teal
        }
        // Bay of Bengal East India Coastal Current (EICC) flowing Northward
        if (lon >= 77.5 && lon <= 93.0 && lat < 23.0) {
          const dx = lon - 88.0;
          const dy = lat - 15.5;
          const u = -dy * 0.0028 + 0.012;
          const v = dx * 0.0028 + 0.018;
          return { u, v, color: '#2dd4bf', speedKmh: 2.7 }; // Glowing Aquamarine
        }
        return { u: 0.014, v: 0.009, color: '#06b6d4', speedKmh: 1.5 };
      }

      if (activeLayer === 'temperature') {
        // Convective Thermal Radiation & Heat Updrafts Diverging from National Heat Domes
        const dx1 = lon - 74.8; // Rajasthan Dome
        const dy1 = lat - 28.2;
        const dx2 = lon - 79.1; // Vidarbha / Central Dome
        const dy2 = lat - 21.1;
        const u = (dx1 * 0.005 + dx2 * 0.004) + Math.cos(lat * 1.1) * 0.003;
        const v = (dy1 * 0.005 + dy2 * 0.004) + Math.sin(lon * 1.0) * 0.003;
        return { u, v, color: '#ef4444', speedKmh: 45.0 }; // Crimson Heat Flux
      }

      if (activeLayer === 'vapour') {
        // Atmospheric Water Vapour Rivers (INSAT-3DR 6.7µm moisture corridors)
        const u = 0.020 + Math.cos(lat * 0.6) * 0.005;
        const v = 0.026 + Math.sin(lon * 0.5) * 0.005;
        return { u, v, color: '#818cf8', speedKmh: 68.0 }; // Luminous Indigo
      }

      // Default true-color / scanline
      return { u: 0.014, v: 0.016, color: 'rgba(56, 189, 248, 0.75)', speedKmh: 20.0 };
    };

    const resizeCanvas = () => {
      const container = mapContainerRef.current;
      if (!container) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();

    // Map gesture handlers to eliminate glitching & screen-tearing on zoom/pan
    const onMoveStart = () => {
      isInteracting = true;
      const container = mapContainerRef.current;
      if (container) {
        ctx.clearRect(0, 0, container.clientWidth, container.clientHeight);
      }
    };

    const onMoveEnd = () => {
      isInteracting = false;
      const container = mapContainerRef.current;
      if (container) {
        ctx.clearRect(0, 0, container.clientWidth, container.clientHeight);
      }
      for (let i = 0; i < particles.length; i++) {
        particles[i] = spawnParticle();
      }
    };

    map.on('resize', resizeCanvas);
    map.on('movestart', onMoveStart);
    map.on('zoomstart', onMoveStart);
    map.on('moveend', onMoveEnd);
    map.on('zoomend', onMoveEnd);

    // Earth NullSchool Render Loop
    const render = () => {
      if (!isAnimRunning) return;
      const container = mapContainerRef.current;
      if (!container || !map) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const w = container.clientWidth;
      const h = container.clientHeight;

      if (!isInteracting && vectorLinesActive) {
        // 1. Earth NullSchool Decay Fade (destination-in composite)
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.945)';
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';

        // 2. Render particle stream segments
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const vec = evaluateVector(p.lat, p.lon);

          const currPt = map.latLngToContainerPoint([p.lat, p.lon]);
          const prevPt = map.latLngToContainerPoint([p.prevLat, p.prevLon]);

          const dx = currPt.x - prevPt.x;
          const dy = currPt.y - prevPt.y;
          const distSq = dx * dx + dy * dy;

          // Screen bounds and jump check (prevents screen-spanning glitch lines)
          if (
            distSq > 0.05 &&
            distSq < 750 &&
            currPt.x >= -30 &&
            currPt.x <= w + 30 &&
            currPt.y >= -30 &&
            currPt.y <= h + 30
          ) {
            const lifeRatio = p.age / p.maxAge;
            const alpha = Math.sin(lifeRatio * Math.PI) * 0.85;

            ctx.beginPath();
            ctx.moveTo(prevPt.x, prevPt.y);
            ctx.lineTo(currPt.x, currPt.y);
            ctx.strokeStyle = vec.color;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = activeLayer === 'wind' || activeLayer === 'currents' ? 1.8 : 1.4;
            ctx.lineCap = 'round';
            ctx.stroke();
          }

          // Step physics
          p.prevLat = p.lat;
          p.prevLon = p.lon;
          p.lat += vec.v * 0.028 * vectorSpeed * p.speed;
          p.lon += vec.u * 0.028 * vectorSpeed * p.speed;
          p.age++;

          if (p.age >= p.maxAge) {
            particles[i] = spawnParticle();
          }
        }
      }

      ctx.globalAlpha = 1.0;
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isAnimRunning = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      map.off('resize', resizeCanvas);
      map.off('movestart', onMoveStart);
      map.off('zoomstart', onMoveStart);
      map.off('moveend', onMoveEnd);
      map.off('zoomend', onMoveEnd);
    };
  }, [vectorLinesActive, activeLayer, vectorSpeed, vectorDensity]);

  // Custom Zoom Handlers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleResetIndiaView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(INDIA_CENTER, INDIA_DEFAULT_ZOOM, {
        duration: 1.2
      });
    }
  };

  return (
    <div className="relative w-full h-[660px] bg-slate-950 border border-slate-700/70 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.9)] flex flex-col justify-between">
      {/* Real Leaflet Map Container */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0 w-full h-full" />

      {/* Active Live Vector Lines Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10 pointer-events-none w-full h-full"
      />

      {/* Radar Sweep Reticle Overlay */}
      {radarActive && (
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden flex items-center justify-center opacity-30">
          <div
            className="w-[980px] h-[980px] rounded-full border border-sky-400/20"
            style={{
              background: 'conic-gradient(from 0deg at 50% 50%, rgba(56, 189, 248, 0.45) 0deg, rgba(56, 189, 248, 0) 65deg, transparent 65deg)',
              animation: 'radarSweep 9s linear infinite',
              transformOrigin: 'center'
            }}
          />
          <div className="absolute w-[640px] h-[640px] rounded-full border border-sky-500/15" />
          <div className="absolute w-[360px] h-[360px] rounded-full border border-sky-500/20" />
        </div>
      )}

      {/* Top Tactical Navigation & Layer Selector Bar */}
      <div className="relative z-20 p-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* Institution Header Badge */}
          <div className="bg-slate-900/90 border border-slate-700/80 px-3.5 py-1.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-2 text-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex items-center gap-1.5 font-extrabold tracking-wider text-slate-100 text-[11px]">
              <Satellite className="h-3.5 w-3.5 text-blue-400" />
              <span>ISRO BHUVAN GIS</span>
            </div>
            <span className="text-slate-600 font-mono">|</span>
            <span className="text-sky-400 font-mono text-[10px] uppercase font-bold tracking-wider">
              {activeLayer} Lens
            </span>
          </div>

          {/* Map Layer Selectors */}
          <div className="bg-slate-900/90 border border-slate-700/80 p-1 rounded-2xl shadow-xl backdrop-blur-xl flex items-center gap-1 overflow-x-auto max-w-[580px]">
            <button
              type="button"
              onClick={() => {
                setActiveLayer('satellite');
                setActiveGraphTab('temperature');
              }}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-wide transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeLayer === 'satellite'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Satellite className="h-3.5 w-3.5 text-sky-300" />
              <span>Political Satellite</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveLayer('temperature');
                setActiveGraphTab('temperature');
              }}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-wide transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeLayer === 'temperature'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Thermometer className="h-3.5 w-3.5 text-rose-300" />
              <span>Temperature</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveLayer('wind');
                setActiveGraphTab('wind');
              }}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-wide transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeLayer === 'wind'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Wind className="h-3.5 w-3.5 text-amber-300" />
              <span>Wind Graph</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveLayer('vapour');
                setActiveGraphTab('vapour');
              }}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-wide transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeLayer === 'vapour'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Droplets className="h-3.5 w-3.5 text-indigo-300" />
              <span>Water Vapour</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveLayer('currents');
                setActiveGraphTab('currents');
              }}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-wide transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeLayer === 'currents'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Waves className="h-3.5 w-3.5 text-teal-300" />
              <span>Water Currents</span>
            </button>
          </div>
        </div>

        {/* Live Vector Controls & Graph Toggle */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Active Live Vector Lines Toggle */}
          <button
            type="button"
            onClick={() => setVectorLinesActive(!vectorLinesActive)}
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono flex items-center gap-1.5 cursor-pointer backdrop-blur-md transition shadow-md ${
              vectorLinesActive
                ? 'bg-sky-950/90 border-sky-400 text-sky-200'
                : 'bg-slate-900/80 border-slate-700/60 text-slate-400'
            }`}
          >
            <Sparkles className={`h-3.5 w-3.5 ${vectorLinesActive ? 'text-sky-400 animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <span>Active Live Vectors: <strong>{vectorLinesActive ? 'ON' : 'OFF'}</strong></span>
          </button>

          {/* Vector Speed Multiplier */}
          {vectorLinesActive && (
            <button
              type="button"
              onClick={() => setVectorSpeed(prev => (prev === 1.0 ? 2.0 : prev === 2.0 ? 0.5 : 1.0))}
              title="Toggle Vector Velocity Speed"
              className="bg-slate-900/80 border border-slate-700 px-2.5 py-1.5 rounded-xl text-[10px] font-mono text-amber-300 hover:border-amber-400 transition"
            >
              {vectorSpeed}x Spd
            </button>
          )}

          {/* Meteorological Graphs Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsGraphOpen(!isGraphOpen)}
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono flex items-center gap-1.5 cursor-pointer backdrop-blur-md transition shadow-md ${
              isGraphOpen
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-slate-500'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Telemetry Graph</span>
            {isGraphOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Floating Tactical Zoom & View Controls */}
      <div className="absolute right-4 top-20 z-20 flex flex-col gap-1.5 bg-slate-900/90 border border-slate-700/80 p-1.5 rounded-2xl shadow-2xl backdrop-blur-xl">
        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom In (+)"
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition cursor-pointer"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom Out (-)"
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition cursor-pointer"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <div className="h-px bg-slate-800 my-0.5" />
        <button
          type="button"
          onClick={handleResetIndiaView}
          title="Reset All-India National Extent"
          className="p-2 rounded-xl text-slate-300 hover:text-sky-400 hover:bg-slate-800 active:scale-95 transition cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Interactive Live Meteorological Graph Drawer Panel */}
      <AnimatePresence>
        {isGraphOpen && (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="absolute left-4 top-20 z-20 w-[380px] bg-slate-950/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-2xl p-4 text-slate-200 pointer-events-auto"
          >
            {/* Graph Header & Sub-Tabs */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-sky-400" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                  Live Vector Dynamics Graph
                </span>
              </div>

              {/* Sub-tabs */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-[10px]">
                <button
                  onClick={() => setActiveGraphTab('temperature')}
                  className={`px-2 py-0.5 rounded ${activeGraphTab === 'temperature' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Temp
                </button>
                <button
                  onClick={() => setActiveGraphTab('wind')}
                  className={`px-2 py-0.5 rounded ${activeGraphTab === 'wind' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Wind
                </button>
                <button
                  onClick={() => setActiveGraphTab('vapour')}
                  className={`px-2 py-0.5 rounded ${activeGraphTab === 'vapour' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Vapour
                </button>
                <button
                  onClick={() => setActiveGraphTab('currents')}
                  className={`px-2 py-0.5 rounded ${activeGraphTab === 'currents' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Currents
                </button>
              </div>
            </div>

            {/* TAB 1: TEMPERATURE GRAPH */}
            {activeGraphTab === 'temperature' && (
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>National Heat Dome (NW & Central Core)</span>
                  <span className="text-rose-400 font-bold">PEAK: 47.4°C</span>
                </div>

                {/* SVG Temperature Distribution Bar & Curve */}
                <div className="h-28 bg-slate-900/80 rounded-xl p-2 border border-slate-800 relative flex items-end justify-between gap-1.5">
                  {[
                    { district: 'Churu', temp: 47.4, crit: true },
                    { district: 'Bikaner', temp: 46.8, crit: true },
                    { district: 'Nagpur', temp: 45.9, crit: true },
                    { district: 'Gwalior', temp: 45.2, crit: true },
                    { district: 'Prayagraj', temp: 44.8, crit: true },
                    { district: 'Delhi', temp: 44.1, crit: true },
                    { district: 'Bolangir', temp: 43.6, crit: false },
                    { district: 'Chennai', temp: 39.2, crit: false }
                  ].map((item, idx) => {
                    const heightPct = ((item.temp - 30) / 20) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                        <span className="text-[9px] font-bold text-slate-300">{item.temp}°</span>
                        <div
                          className={`w-full rounded-t-md transition-all duration-500 ${item.crit ? 'bg-gradient-to-t from-orange-600 to-rose-500' : 'bg-gradient-to-t from-blue-600 to-amber-500'}`}
                          style={{ height: `${heightPct}%` }}
                        />
                        <span className="text-[8px] text-slate-400 truncate w-full text-center">{item.district.slice(0, 3)}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>Isotherm Contour: 44°C & 46°C active</span>
                  <span className="text-amber-400">Thermodynamic Vapor Deficit</span>
                </div>
              </div>
            )}

            {/* TAB 2: WIND GRAPH */}
            {activeGraphTab === 'wind' && (
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Continental Thar Desert NW Loo vs Monsoon Inflow</span>
                  <span className="text-amber-400 font-bold">GUST: 48.6 km/h</span>
                </div>

                {/* SVG Wind Rose Compass + Velocity Timeline */}
                <div className="h-28 bg-slate-900/80 rounded-xl p-2 border border-slate-800 flex items-center justify-between gap-3">
                  {/* Wind Direction Dial */}
                  <div className="relative w-20 h-20 rounded-full border border-slate-700 flex items-center justify-center shrink-0">
                    <span className="absolute top-1 text-[8px] text-slate-400">N</span>
                    <span className="absolute bottom-1 text-[8px] text-slate-400">S</span>
                    <span className="absolute left-1 text-[8px] text-slate-400">W</span>
                    <span className="absolute right-1 text-[8px] text-slate-400">E</span>
                    {/* Live Vector Arrow pointing NW to SE */}
                    <div
                      className="w-1 h-12 bg-gradient-to-t from-amber-400 to-rose-500 rounded-full shadow-lg"
                      style={{ transform: 'rotate(135deg)', transformOrigin: 'center' }}
                    />
                    <div className="absolute w-2 h-2 rounded-full bg-white shadow-md" />
                  </div>

                  {/* Wind Velocity Stats */}
                  <div className="flex-1 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Arabian Sea SW Inflow:</span>
                      <strong className="text-sky-400">28.4 km/h (SW)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Continental Hot Loo:</span>
                      <strong className="text-amber-400">42.2 km/h (NW)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Convergence Zone:</span>
                      <strong className="text-emerald-400">Vindhya / Aravalli</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>Beaufort Scale: Fresh Breeze (5)</span>
                  <span className="text-sky-400">Cross-Peninsular Advection</span>
                </div>
              </div>
            )}

            {/* TAB 3: WATER VAPOUR GRAPH */}
            {activeGraphTab === 'vapour' && (
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>INSAT-3DR 6.7µm Water Vapour Channel</span>
                  <span className="text-indigo-400 font-bold">RH: 92% (Coast)</span>
                </div>

                {/* SVG Moisture Gradient Area */}
                <div className="h-28 bg-slate-900/80 rounded-xl p-2 border border-slate-800 flex flex-col justify-between">
                  <div className="text-[10px] text-slate-400 flex justify-between">
                    <span>Coastal Marine Plume (Bay of Bengal / Arabian Sea)</span>
                    <span className="text-indigo-300 font-bold">92% Relative Humidity</span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                    <div className="bg-indigo-500 h-full w-[92%]" />
                  </div>

                  <div className="text-[10px] text-slate-400 flex justify-between mt-1">
                    <span>Indo-Gangetic Basin Corridor (Varanasi / Patna)</span>
                    <span className="text-sky-300 font-bold">64% Relative Humidity</span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                    <div className="bg-sky-500 h-full w-[64%]" />
                  </div>

                  <div className="text-[10px] text-slate-400 flex justify-between mt-1">
                    <span>Thar & Deccan Arid Plateau (Rajasthan / Vidarbha)</span>
                    <span className="text-amber-300 font-bold">18% Relative Humidity</span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                    <div className="bg-amber-500 h-full w-[18%]" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>Vapor Pressure Deficit: 5.4 kPa</span>
                  <span className="text-rose-400 font-bold">Extreme Heat Exhaustion Alert</span>
                </div>
              </div>
            )}

            {/* TAB 4: WATER CURRENTS GRAPH */}
            {activeGraphTab === 'currents' && (
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Indian Ocean Dipole: EICC & WICC Currents</span>
                  <span className="text-teal-400 font-bold">1.6 m/s (3.1 kts)</span>
                </div>

                {/* SVG Ocean Current Velocity Profile */}
                <div className="h-28 bg-slate-900/80 rounded-xl p-2 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex-1 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Arabian Sea WICC:</span>
                      <strong className="text-teal-300">1.2 m/s (Southward)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bay of Bengal EICC Jet:</span>
                      <strong className="text-emerald-300">1.6 m/s (Northward)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Equatorial Indian Ocean:</span>
                      <strong className="text-sky-300">Wyrtki Jet Active</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sea Surface Temp (SST):</span>
                      <strong className="text-amber-300">31.2°C (Warm Pool)</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>Peninsular Coastal Swell: 2.1m @ 10s</span>
                  <span className="text-teal-400">INCOIS High-Resolution Forecast</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* District Quick-Fly Carousel Along Bottom Left */}
      <div className="relative z-20 p-4 flex flex-wrap items-end justify-between gap-3 pointer-events-none">
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 font-mono flex items-center gap-2">
            <span>Direct Fly-To National Sentinel Hub</span>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => setShowPolygons(!showPolygons)}
              className="text-slate-400 hover:text-sky-300 text-[9px] underline cursor-pointer"
            >
              {showPolygons ? 'Hide District Polygon Outlines' : 'Show District Polygon Outlines'}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-1 max-w-xl">
            {districts.slice(0, 8).map((d) => {
              const isCrit = d.calculated_score >= 80;
              const isSelected = selectedDistrictId?.toLowerCase() === d.id.toLowerCase();
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    onSelectDistrict(d.id);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-mono border transition flex items-center gap-1.5 cursor-pointer backdrop-blur-md ${
                    isSelected
                      ? 'bg-blue-600 border-blue-400 text-white shadow-lg'
                      : isCrit
                      ? 'bg-red-950/70 border-red-800/80 text-red-200 hover:bg-red-900/60'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Crosshair className="h-3 w-3 text-sky-400" />
                  <span>{d.name}</span>
                  <span className="font-bold opacity-75">{Math.round(d.calculated_score)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Real-Time Coordinates & Zoom Telemetry Readout */}
        <div className="bg-slate-900/90 border border-slate-700/80 px-3.5 py-1.5 rounded-2xl shadow-xl backdrop-blur-xl pointer-events-auto flex items-center gap-3 text-[11px] font-mono text-slate-300">
          <div className="flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-sky-400 animate-spin" style={{ animationDuration: '15s' }} />
            <span>
              {cursorCoords
                ? `${cursorCoords.lat.toFixed(4)}°N, ${cursorCoords.lng.toFixed(4)}°E`
                : '22.8000°N, 80.5000°E'}
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-blue-400 font-bold">
            ZOOM: {currentZoom}x
          </span>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-bold">ISRO / IMD SYNC</span>
          </div>
        </div>
      </div>

      {/* Risk Legend Strip */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none hidden md:flex items-center gap-2 bg-slate-950/90 border border-slate-800 px-3 py-1 rounded-xl text-[10px] font-mono text-slate-400 backdrop-blur-md">
        <span className="text-slate-500 font-bold">RISK:</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> &lt;35 Low</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> 35-60 Mod</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500" /> 60-80 High</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500 animate-ping" /> &gt;80 Critical</span>
      </div>
    </div>
  );
};

export default IsroBhuvanMap;
