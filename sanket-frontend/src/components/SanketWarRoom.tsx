'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Satellite,
  Map,
  Globe2,
  Activity,
  Package,
  Radio,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Flame,
  AlertTriangle,
  Thermometer,
  Wind,
  Droplets,
  Waves,
  Users,
  Cpu,
  Layers,
  ArrowUpRight,
  ChevronRight,
  Search,
  Filter,
  CheckCircle2,
  Smartphone,
  Send,
  Boxes,
  Truck,
  Zap,
  Info,
  Database
} from 'lucide-react';
import { DistrictSummary, DistrictDetail } from '@/types';
import { OdishaGisMap } from '@/components/OdishaGisMap';
import { ThreeGlobeSurveillance } from '@/components/ThreeGlobeSurveillance';
import { ThreeAnatomicalTwin } from '@/components/ThreeAnatomicalTwin';
import { ThreeFrontlineTelemetryHub } from '@/components/ThreeFrontlineTelemetryHub';
import { HeatwaveAnalyticsGraph } from '@/components/HeatwaveAnalyticsGraph';
import { FrontlineWorkerPwa } from '@/components/FrontlineWorkerPwa';
import { ModelComparisonMatrix } from '@/components/ModelComparisonMatrix';
import { GlassParallaxCard } from '@/components/GlassParallaxCard';
import { GitDatabaseManager } from '@/components/GitDatabaseManager';

const IsroBhuvanMap = dynamic(() => import('@/components/IsroBhuvanMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[580px] bg-[#070b12] border border-[rgba(223,231,224,0.1)] rounded-3xl flex items-center justify-center font-mono text-xs text-[#38bdf8]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 border-2 border-[#38bdf8] border-t-transparent rounded-full animate-spin" />
        <span className="tracking-widest uppercase">INITIALIZING ISRO BHUVAN SATELLITE RADAR...</span>
      </div>
    </div>
  )
});

type TacticalDeck = 'deck-geo' | 'deck-twins' | 'deck-field' | 'deck-git-db';
type GeoSubMode = 'satellite' | 'temperature' | 'wind' | 'vapour' | 'currents' | 'vector' | 'globe3d';

interface SanketWarRoomProps {
  districts: DistrictSummary[];
  selectedDistrictId: string | null;
  selectedDistrictDetail: DistrictDetail | null;
  onSelectDistrict: (id: string) => void;
  activeModel: 'ensemble' | 'xgboost' | 'syndromic' | 'bayesian';
  onSelectModel: (model: 'ensemble' | 'xgboost' | 'syndromic' | 'bayesian') => void;
  geoJsonData: any;
  language: 'odia' | 'hindi' | 'english';
  setLanguage: (lang: 'odia' | 'hindi' | 'english') => void;
  pendingOfflineCount: number;
  onUpdateOfflineCount: () => Promise<void>;
  onPreseedWeather: () => Promise<void>;
  onTriggerOfflineSubmission: () => Promise<void>;
  onTriggerLiveSync: () => Promise<void>;
  onPlayVoiceAdvisory: () => void;
  onOpenCinematic: () => void;
  currentPitchStep: number;
  setCurrentPitchStep: (step: number) => void;
  loading: boolean;
  showToast: (msg: string) => void;
}

export const SanketWarRoom: React.FC<SanketWarRoomProps> = ({
  districts,
  selectedDistrictId,
  selectedDistrictDetail,
  onSelectDistrict,
  activeModel,
  onSelectModel,
  geoJsonData,
  language,
  setLanguage,
  pendingOfflineCount,
  onUpdateOfflineCount,
  onPreseedWeather,
  onTriggerOfflineSubmission,
  onTriggerLiveSync,
  onPlayVoiceAdvisory,
  onOpenCinematic,
  currentPitchStep,
  setCurrentPitchStep,
  loading,
  showToast
}) => {
  // Current active tactical deck
  const [activeDeck, setActiveDeck] = useState<TacticalDeck>('deck-geo');
  // Sub-mode for Deck 1
  const [geoMode, setGeoMode] = useState<GeoSubMode>('satellite');
  // District filter in sidebar
  const [districtSearch, setDistrictSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState<'all' | 'critical' | 'warning' | 'safe'>('all');
  // Twin controls in Deck 2
  const [simulatedStressTemp, setSimulatedStressTemp] = useState<number>(42.5);
  // Audio state
  const [isPlayingBroadcast, setIsPlayingBroadcast] = useState(false);
  // Emergency dispatch states
  const [dispatchedUnits, setDispatchedUnits] = useState<{ [key: string]: boolean }>({});

  const activeDistrict =
    districts.find(d => d.id.toLowerCase() === selectedDistrictId?.toLowerCase()) ||
    districts[0] ||
    null;

  const criticalCount = districts.filter(d => d.calculated_score >= 80).length;
  const totalFrontlineCases = districts.reduce((sum, d) => sum + (d.total_frontline_cases || 0), 0);
  const avgTemp = districts.length
    ? (districts.reduce((sum, d) => sum + d.temperature_3day_avg, 0) / districts.length).toFixed(1)
    : '41.2';

  // Filtered districts list
  const filteredDistricts = districts.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(districtSearch.toLowerCase());
    if (!matchesSearch) return false;
    if (districtFilter === 'critical') return d.calculated_score >= 80;
    if (districtFilter === 'warning') return d.calculated_score >= 60 && d.calculated_score < 80;
    if (districtFilter === 'safe') return d.calculated_score < 60;
    return true;
  });

  const handleDispatchOrs = (districtId: string, districtName: string) => {
    setDispatchedUnits(prev => ({ ...prev, [districtId]: true }));
    showToast(`🚨 Priority Dispatch: 250 WHO-formula ORS units & mobile cooling buffer routed to ${districtName}!`);
  };

  const handleTriggerTTS = () => {
    setIsPlayingBroadcast(true);
    onPlayVoiceAdvisory();
    setTimeout(() => setIsPlayingBroadcast(false), 5500);
  };

  return (
    <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 py-4 space-y-4 relative z-20 font-onest text-[#dfe7e0]">
      {/* Ambient Sanctuary Glow Orbs */}
      <div className="fixed top-1/4 -left-48 w-96 h-96 rounded-full bg-[#e0231c]/10 blur-[130px] pointer-events-none -z-10" />
      <div className="fixed bottom-1/4 -right-48 w-96 h-96 rounded-full bg-[#38bdf8]/10 blur-[130px] pointer-events-none -z-10" />
      <div className="fixed top-2/3 left-1/3 w-80 h-80 rounded-full bg-[#c9a24a]/8 blur-[110px] pointer-events-none -z-10" />

      {/* ============================================================== TACTICAL COCKPIT HUD */}
      <div className="relative overflow-hidden p-4 sm:p-5 rounded-3xl border border-white/[0.09] bg-gradient-to-b from-[#111928]/80 via-[#0a0f19]/85 to-[#05070a]/95 backdrop-blur-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.85)] flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        {/* Specular Top Edge Highlight Line */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />

        {/* Left Status Alert Level */}
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-[#05070a]/90 border border-white/[0.12] flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-5 h-5 text-[#e0231c]" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#e0231c] shadow-[0_0_10px_#e0231c] animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold tracking-wider text-white">
                SANKET COMMAND COCKPIT
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#e0231c]/15 text-[#ff5a3c] border border-[#e0231c]/30 shadow-sm">
                CRISIS TIER: RED ALPHA
              </span>
              <span className="text-[10px] text-[#78837c] font-mono hidden sm:inline">
                IDSP • ALL-INDIA-HEAT-30M
              </span>
            </div>
            <div className="text-[11px] text-[#aab4ad] font-mono flex items-center gap-2 mt-0.5">
              <span>Peak Solar Zenith: <strong>14:00 IST (2h 14m)</strong></span>
              <span>•</span>
              <span className="text-[#38bdf8]">3 Models Blended: 96.4% Agreement</span>
            </div>
          </div>
        </div>

        {/* Center: Mission-Control Multi-Deck Switcher */}
        <div className="flex items-center bg-[#05070a]/80 border border-white/[0.08] p-1.5 rounded-2xl shadow-inner w-full sm:w-auto overflow-x-auto backdrop-blur-md">
          {[
            {
              id: 'deck-geo' as TacticalDeck,
              num: 'DECK 01',
              title: 'GIS & Satellite Radar',
              icon: Satellite,
              color: 'text-[#38bdf8]'
            },
            {
              id: 'deck-twins' as TacticalDeck,
              num: 'DECK 02',
              title: '3D Digital Twins',
              icon: Activity,
              color: 'text-[#ff5a3c]'
            },
            {
              id: 'deck-field' as TacticalDeck,
              num: 'DECK 03',
              title: 'Field PWA & Dispatch',
              icon: Smartphone,
              color: 'text-[#10b981]'
            },
            {
              id: 'deck-git-db' as TacticalDeck,
              num: 'DECK 04',
              title: 'Git Database Manager',
              icon: Database,
              color: 'text-[#34d399]'
            }
          ].map(deck => {
            const Icon = deck.icon;
            const isActive = activeDeck === deck.id;
            return (
              <button
                key={deck.id}
                onClick={() => setActiveDeck(deck.id)}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#182332] text-white border border-white/[0.22] shadow-[0_4px_16px_rgba(0,0,0,0.6)]'
                    : 'text-[#78837c] hover:text-[#dfe7e0] hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? deck.color : 'text-current'}`} />
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-mono tracking-widest text-[#78837c]">
                    {deck.num}
                  </span>
                  <span className="font-semibold text-xs leading-none">
                    {deck.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Quick Controls */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleTriggerTTS}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-mono font-medium transition-all cursor-pointer ${
              isPlayingBroadcast
                ? 'bg-[#e0231c]/20 border-[#e0231c] text-[#ff5a3c] animate-pulse shadow-[0_0_20px_rgba(224,35,28,0.3)]'
                : 'border-white/[0.09] bg-white/[0.03] hover:bg-white/[0.08] text-[#dfe7e0]'
            }`}
            title="Broadcast emergency advisory in selected language"
          >
            {isPlayingBroadcast ? <Volume2 className="w-3.5 h-3.5 text-[#ff3b30]" /> : <Radio className="w-3.5 h-3.5 text-[#38bdf8]" />}
            <span>TTS Advisory ({language.toUpperCase()})</span>
          </button>

          <button
            onClick={onOpenCinematic}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-mono font-semibold transition cursor-pointer shadow-sm"
            title="Return to the buttery smooth cinematic landing page"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Cinematic Sanctuary</span>
          </button>
        </div>
      </div>

      {/* ============================================================== KPI STATS STRIP (GLASS PARALLAX CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
        <GlassParallaxCard
          glowColor="rgba(245, 158, 11, 0.45)"
          maxTilt={7}
          className="p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono tracking-wider text-[#78837c] uppercase">
                National Mean Heat Index
              </div>
              <div className="text-2xl font-light font-mono text-[#dfe7e0] mt-1">
                {avgTemp}°C
              </div>
              <div className="text-[10px] font-mono text-[#aab4ad] mt-0.5">
                Open-Meteo 30-Min Mean
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[rgba(245,158,11,0.12)] border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Thermometer className="w-5 h-5" />
            </div>
          </div>
        </GlassParallaxCard>

        <GlassParallaxCard
          glowColor="rgba(224, 35, 28, 0.55)"
          maxTilt={7}
          className="p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono tracking-wider text-[#ff5a3c] uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] animate-ping" />
                <span>Critical Red Districts</span>
              </div>
              <div className="text-2xl font-light font-mono text-[#ff3b30] mt-1">
                {criticalCount} <span className="text-xs text-[#78837c]">/ {districts.length}</span>
              </div>
              <div className="text-[10px] font-mono text-[#ff5a3c]/80 mt-0.5">
                Risk Score &ge; 80 / 100
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[rgba(224,35,28,0.15)] border border-[#e0231c]/40 flex items-center justify-center text-[#ff3b30] shadow-[0_0_15px_rgba(224,35,28,0.2)]">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
          </div>
        </GlassParallaxCard>

        <GlassParallaxCard
          glowColor="rgba(56, 189, 248, 0.45)"
          maxTilt={7}
          className="p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono tracking-wider text-[#78837c] uppercase">
                Frontline Case Logs (24h)
              </div>
              <div className="text-2xl font-light font-mono text-[#38bdf8] mt-1">
                {totalFrontlineCases}
              </div>
              <div className="text-[10px] font-mono text-[#aab4ad] mt-0.5">
                Dexie.js Offline + REST
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[rgba(56,189,248,0.12)] border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8] shadow-inner">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </GlassParallaxCard>

        <GlassParallaxCard
          glowColor="rgba(16, 185, 129, 0.45)"
          maxTilt={7}
          className="p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono tracking-wider text-[#78837c] uppercase">
                Consensus Concordance
              </div>
              <div className="text-2xl font-light font-mono text-[#10b981] mt-1">
                96.4%
              </div>
              <div className="text-[10px] font-mono text-[#aab4ad] mt-0.5">
                XGB + LGBM + Bayesian
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[rgba(16,185,129,0.12)] border border-[#10b981]/30 flex items-center justify-center text-[#10b981] shadow-inner">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
        </GlassParallaxCard>
      </div>

      {/* Model Lens Matrix Bar */}
      {selectedDistrictDetail?.model_breakdown && (
        <ModelComparisonMatrix
          modelBreakdown={selectedDistrictDetail.model_breakdown}
          activeModel={activeModel}
          onSelectModel={onSelectModel}
        />
      )}

      {/* ============================================================== DECK CONTENT (ANIMATED SWITCH) */}
      <AnimatePresence mode="wait">
        {/* =================================================== DECK 01: GEOSPATIAL & SATELLITE COMMAND */}
        {activeDeck === 'deck-geo' && (
          <motion.div
            key="deck-geo"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            {/* Geo Sub-Mode Segmented Selector */}
            <div className="relative overflow-hidden flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl border border-white/[0.09] bg-gradient-to-b from-[#111928]/70 via-[#0a0f19]/80 to-[#05070a]/90 backdrop-blur-2xl shadow-lg">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-[850px]">
                <button
                  onClick={() => setGeoMode('satellite')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer whitespace-nowrap ${
                    geoMode === 'satellite'
                      ? 'bg-[#182330] text-[#38bdf8] border border-[#38bdf8]/40 shadow-sm'
                      : 'text-[#78837c] hover:text-[#dfe7e0] hover:bg-white/[0.04]'
                  }`}
                >
                  <Satellite className="w-3.5 h-3.5" />
                  <span>Political Satellite</span>
                </button>

                <button
                  onClick={() => setGeoMode('temperature')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer whitespace-nowrap ${
                    geoMode === 'temperature'
                      ? 'bg-[#182330] text-[#ef4444] border border-[#ef4444]/40 shadow-sm'
                      : 'text-[#78837c] hover:text-[#dfe7e0] hover:bg-white/[0.04]'
                  }`}
                >
                  <Thermometer className="w-3.5 h-3.5" />
                  <span>Temperature Graph</span>
                </button>

                <button
                  onClick={() => setGeoMode('wind')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer whitespace-nowrap ${
                    geoMode === 'wind'
                      ? 'bg-[#182330] text-[#f59e0b] border border-[#f59e0b]/40 shadow-sm'
                      : 'text-[#78837c] hover:text-[#dfe7e0] hover:bg-white/[0.04]'
                  }`}
                >
                  <Wind className="w-3.5 h-3.5" />
                  <span>Wind Vectors</span>
                </button>

                <button
                  onClick={() => setGeoMode('vapour')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer whitespace-nowrap ${
                    geoMode === 'vapour'
                      ? 'bg-[#182330] text-[#818cf8] border border-[#818cf8]/40 shadow-sm'
                      : 'text-[#78837c] hover:text-[#dfe7e0] hover:bg-white/[0.04]'
                  }`}
                >
                  <Droplets className="w-3.5 h-3.5" />
                  <span>Water Vapour</span>
                </button>

                <button
                  onClick={() => setGeoMode('currents')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer whitespace-nowrap ${
                    geoMode === 'currents'
                      ? 'bg-[#182330] text-[#2dd4bf] border border-[#2dd4bf]/40 shadow-sm'
                      : 'text-[#78837c] hover:text-[#dfe7e0] hover:bg-white/[0.04]'
                  }`}
                >
                  <Waves className="w-3.5 h-3.5" />
                  <span>Water Currents</span>
                </button>

                <button
                  onClick={() => setGeoMode('vector')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer whitespace-nowrap ${
                    geoMode === 'vector'
                      ? 'bg-[#182330] text-[#ff5a3c] border border-[#ff5a3c]/40 shadow-sm'
                      : 'text-[#78837c] hover:text-[#dfe7e0] hover:bg-white/[0.04]'
                  }`}
                >
                  <Map className="w-3.5 h-3.5" />
                  <span>Vector GIS</span>
                </button>

                <button
                  onClick={() => setGeoMode('globe3d')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer whitespace-nowrap ${
                    geoMode === 'globe3d'
                      ? 'bg-[#182330] text-[#38bdf8] border border-[#38bdf8]/40 shadow-sm'
                      : 'text-[#78837c] hover:text-[#dfe7e0] hover:bg-white/[0.04]'
                  }`}
                >
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>3D Globe</span>
                </button>
              </div>

              <div className="text-[11px] font-mono text-[#78837c] px-3">
                Lens: <strong className="text-[#dfe7e0] uppercase">{geoMode}</strong>
              </div>
            </div>

            {/* Main GIS Viewport + District Triage Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Primary Map / Globe Display */}
              <div className="lg:col-span-8 rounded-3xl overflow-hidden border border-white/[0.1] bg-[#05070a] shadow-2xl">
                {(geoMode === 'satellite' ||
                  geoMode === 'temperature' ||
                  geoMode === 'wind' ||
                  geoMode === 'vapour' ||
                  geoMode === 'currents') && (
                  <IsroBhuvanMap
                    districts={districts}
                    selectedDistrictId={selectedDistrictId}
                    onSelectDistrict={onSelectDistrict}
                    geoJsonData={geoJsonData}
                    initialLayer={geoMode as any}
                  />
                )}

                {geoMode === 'vector' && (
                  <OdishaGisMap
                    districts={districts}
                    selectedDistrictId={selectedDistrictId}
                    onSelectDistrict={onSelectDistrict}
                    geoJsonData={geoJsonData}
                  />
                )}

                {geoMode === 'globe3d' && (
                  <ThreeGlobeSurveillance
                    districts={districts}
                    selectedDistrictId={selectedDistrictId}
                    onSelectDistrict={onSelectDistrict}
                  />
                )}
              </div>

              {/* District Triage Column (Obsidian Glassmorphic Panel) */}
              <div className="relative overflow-hidden lg:col-span-4 p-5 rounded-3xl border border-white/[0.09] bg-gradient-to-b from-[#111928]/85 via-[#0b101a]/90 to-[#05070a]/95 backdrop-blur-2xl flex flex-col justify-between shadow-[0_20px_45px_-12px_rgba(0,0,0,0.85)]">
                {/* Specular Top Edge Highlight Line */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
                    <span className="text-xs font-mono font-bold tracking-wider text-[#dfe7e0] uppercase">
                      District Triage Roster
                    </span>
                    <span className="text-[10px] font-mono text-[#78837c]">
                      {filteredDistricts.length} of {districts.length} active
                    </span>
                  </div>

                  {/* Search and Filters */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#78837c]" />
                      <input
                        type="text"
                        placeholder="Search district name..."
                        value={districtSearch}
                        onChange={e => setDistrictSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#05070a]/80 border border-white/[0.08] text-xs text-[#dfe7e0] placeholder-[#78837c] focus:outline-none focus:border-[#38bdf8] backdrop-blur-sm"
                      />
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-mono">
                      {(['all', 'critical', 'warning', 'safe'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setDistrictFilter(tab)}
                          className={`flex-1 py-1 rounded-lg uppercase tracking-wider transition cursor-pointer ${
                            districtFilter === tab
                              ? 'bg-[#182330] text-[#dfe7e0] border border-white/[0.18] shadow-sm'
                              : 'text-[#78837c] hover:text-[#aab4ad] hover:bg-white/[0.03]'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scrollable District Items with 3D Parallax Tilt */}
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {filteredDistricts.map(d => {
                      const isSelected = d.id.toLowerCase() === selectedDistrictId?.toLowerCase();
                      const isCrit = d.calculated_score >= 80;
                      return (
                        <GlassParallaxCard
                          key={d.id}
                          maxTilt={4}
                          onClick={() => onSelectDistrict(d.id)}
                          isSelected={isSelected}
                          selectedBorderColor="#38bdf8"
                          glowColor={
                            isCrit
                              ? 'rgba(224, 35, 28, 0.45)'
                              : d.calculated_score >= 60
                              ? 'rgba(245, 158, 11, 0.4)'
                              : 'rgba(16, 185, 129, 0.35)'
                          }
                          className={`p-3 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#121c28]/95'
                              : 'bg-[#06090e]/70 hover:bg-[#0d141e]/80'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs font-semibold text-white flex items-center gap-2">
                                <span>{d.name}</span>
                                {isCrit && <span className="w-2 h-2 rounded-full bg-[#ff3b30] animate-ping" />}
                              </div>
                              <div className="text-[10px] text-[#78837c] font-mono mt-0.5">
                                {d.temperature_3day_avg}°C • {d.total_frontline_cases} ground cases
                              </div>
                            </div>

                            <div className="text-right">
                              <span
                                className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg border ${
                                  isCrit
                                    ? 'bg-[#ff3b30]/15 text-[#ff5a3c] border-[#ff3b30]/40 shadow-sm'
                                    : d.calculated_score >= 60
                                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                    : 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30'
                                }`}
                              >
                                {Math.round(d.calculated_score)}
                              </span>
                              <div className="text-[9px] font-mono text-[#78837c] uppercase mt-0.5">
                                {d.risk_level}
                              </div>
                            </div>
                          </div>
                        </GlassParallaxCard>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Insight in Sidebar */}
                <div className="pt-3 border-t border-white/[0.08] flex justify-between items-center text-[10px] font-mono text-[#78837c]">
                  <span>Active Lens: <strong>{activeModel.toUpperCase()}</strong></span>
                  <span className="text-[#10b981]">Concordance: 96.4%</span>
                </div>
              </div>
            </div>

            {/* Comprehensive Analytical Graph */}
            <HeatwaveAnalyticsGraph
              selectedDistrict={activeDistrict}
              districts={districts}
              onSelectDistrict={onSelectDistrict}
            />
          </motion.div>
        )}

        {/* =================================================== DECK 02: 3D BIOLOGICAL & HARDWARE DIGITAL TWINS */}
        {activeDeck === 'deck-twins' && (
          <motion.div
            key="deck-twins"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            {/* Deck 2 Header Banner */}
            <div className="relative overflow-hidden p-4 rounded-2xl border border-white/[0.09] bg-gradient-to-b from-[#111928]/80 via-[#0a0f19]/85 to-[#05070a]/95 backdrop-blur-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[rgba(255,90,60,0.12)] border border-[#ff5a3c]/30 flex items-center justify-center text-[#ff5a3c] shadow-inner">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Biological & Frontline Cold-Chain Digital Twins
                  </h3>
                  <p className="text-xs text-[#aab4ad]">
                    Synchronized Three.js WebGL simulation of patient physiology under extreme heat and solar cold-chain buffer stock.
                  </p>
                </div>
              </div>

              {/* Stress Slider */}
              <div className="flex items-center gap-3 bg-[#05070a]/80 px-4 py-2 rounded-xl border border-white/[0.1] backdrop-blur-sm">
                <span className="text-xs font-mono text-[#78837c]">Simulate Heat Stress:</span>
                <input
                  type="range"
                  min="37.0"
                  max="42.5"
                  step="0.1"
                  value={simulatedStressTemp}
                  onChange={e => setSimulatedStressTemp(parseFloat(e.target.value))}
                  className="w-32 accent-[#ff3b30] cursor-pointer"
                />
                <span className="font-mono text-xs font-bold text-[#ff3b30]">
                  {simulatedStressTemp.toFixed(1)}°C
                </span>
              </div>
            </div>

            {/* Dual Twin 3D Viewport Grid (Glass Parallax Cards) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Twin 1: Human Anatomical Twin */}
              <GlassParallaxCard
                glowColor="rgba(255, 90, 60, 0.45)"
                maxTilt={4}
                className="p-5 flex flex-col justify-between space-y-4"
              >
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#ff5a3c]">
                      Twin 01 • Human Organ Physiology
                    </span>
                    <h4 className="text-base font-medium text-white">
                      Holographic Heatstress Anatomy
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#aab4ad]">
                    <span className="w-2 h-2 rounded-full bg-[#ff3b30] animate-pulse" />
                    <span>Tachycardia: 138 BPM</span>
                  </div>
                </div>

                <div className="rounded-2xl overflow-hidden border border-white/[0.07] bg-[#05070a]">
                  <ThreeAnatomicalTwin
                    currentTemp={simulatedStressTemp}
                    caseCount={activeDistrict?.total_frontline_cases || 15}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5 pt-2">
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center backdrop-blur-sm">
                    <span className="block text-[9px] font-mono uppercase text-[#78837c]">Cranial</span>
                    <span className="text-xs font-bold text-[#ff3b30]">Sunstroke Alert</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center backdrop-blur-sm">
                    <span className="block text-[9px] font-mono uppercase text-[#78837c]">Cardiac</span>
                    <span className="text-xs font-bold text-amber-400">Tachycardia Surge</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center backdrop-blur-sm">
                    <span className="block text-[9px] font-mono uppercase text-[#78837c]">Renal</span>
                    <span className="text-xs font-bold text-amber-300">Stress Filtration</span>
                  </div>
                </div>
              </GlassParallaxCard>

              {/* Twin 2: IoT Cold-Chain Hardware Hub */}
              <GlassParallaxCard
                glowColor="rgba(56, 189, 248, 0.45)"
                maxTilt={4}
                className="p-5 flex flex-col justify-between space-y-4"
              >
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#38bdf8]">
                      Twin 02 • Frontline Infrastructure
                    </span>
                    <h4 className="text-base font-medium text-white">
                      Solar Cold-Chain & Buffer Storage
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#aab4ad]">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                    <span>Target Range: +2°C to +8°C</span>
                  </div>
                </div>

                <div className="rounded-2xl overflow-hidden border border-white/[0.07] bg-[#05070a]">
                  <ThreeFrontlineTelemetryHub
                    districtName={`${activeDistrict?.name || 'Khordha'} Health Subcentre`}
                    storageTemp={3.8}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5 pt-2">
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center backdrop-blur-sm">
                    <span className="block text-[9px] font-mono uppercase text-[#78837c]">Buffer Temp</span>
                    <span className="text-xs font-bold text-[#10b981]">3.8°C Nom.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center backdrop-blur-sm">
                    <span className="block text-[9px] font-mono uppercase text-[#78837c]">ORS Reserves</span>
                    <span className="text-xs font-bold text-[#38bdf8]">1,400 Packets</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center backdrop-blur-sm">
                    <span className="block text-[9px] font-mono uppercase text-[#78837c]">Solar Battery</span>
                    <span className="text-xs font-bold text-amber-400">94% Charge</span>
                  </div>
                </div>
              </GlassParallaxCard>
            </div>
          </motion.div>
        )}

        {/* =================================================== DECK 03: FRONTLINE PWA & EMERGENCY DISPATCH */}
        {activeDeck === 'deck-field' && (
          <motion.div
            key="deck-field"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            {/* Deck 3 Header */}
            <div className="relative overflow-hidden p-4 rounded-2xl border border-white/[0.09] bg-gradient-to-b from-[#111928]/80 via-[#0a0f19]/85 to-[#05070a]/95 backdrop-blur-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[rgba(16,185,129,0.12)] border border-[#10b981]/30 flex items-center justify-center text-[#10b981] shadow-inner">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Frontline Field Operations & Rapid Dispatch Cockpit
                  </h3>
                  <p className="text-xs text-[#aab4ad]">
                    Zero-connectivity offline Dexie sync, emergency ORS dispatch, and automated localized voice broadcast.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-xs font-mono text-[#aab4ad] bg-[#05070a]/80 px-3 py-1.5 rounded-xl border border-white/[0.1] backdrop-blur-sm">
                  Pending Offline Queue: <strong className="text-amber-400">{pendingOfflineCount}</strong>
                </div>
              </div>
            </div>

            {/* Split Grid: PWA Client + Emergency Action Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column: Frontline Worker PWA Simulation */}
              <div className="lg:col-span-7">
                <FrontlineWorkerPwa
                  onSyncComplete={async () => {
                    await onUpdateOfflineCount();
                    showToast('Frontline IndexedDB records successfully flushed to FastAPI gateway!');
                  }}
                />
              </div>

              {/* Right Column: Emergency Logistics & Audio Dispatch Console */}
              <div className="lg:col-span-5 space-y-4">
                {/* 1. Rapid Logistics Dispatcher */}
                <GlassParallaxCard
                  glowColor="rgba(255, 90, 60, 0.45)"
                  maxTilt={4}
                  className="p-5 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#ff5a3c]" />
                      <h4 className="text-sm font-semibold text-white">
                        Rapid ORS Logistics Routing
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono uppercase text-[#78837c]">
                      Automated Buffer Pool
                    </span>
                  </div>

                  <p className="text-xs text-[#aab4ad] font-light leading-relaxed">
                    Deploy emergency rehydration kits and cooling buffer vehicles to districts reporting surge index &gt; 80.
                  </p>

                  <div className="space-y-2.5">
                    {districts
                      .filter(d => d.calculated_score >= 70)
                      .slice(0, 4)
                      .map(d => {
                        const isDispatched = dispatchedUnits[d.id];
                        return (
                          <div
                            key={d.id}
                            className="p-3 rounded-2xl border border-white/[0.08] bg-[#05070a]/80 backdrop-blur-sm flex items-center justify-between"
                          >
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-2">
                                <span>{d.name}</span>
                                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-[#ff3b30]/15 text-[#ff5a3c] border border-[#ff3b30]/30">
                                  {Math.round(d.calculated_score)} Risk
                                </span>
                              </div>
                              <div className="text-[10px] font-mono text-[#78837c] mt-0.5">
                                {d.total_frontline_cases} frontline logs reported
                              </div>
                            </div>

                            <button
                              onClick={() => handleDispatchOrs(d.id, d.name)}
                              disabled={isDispatched}
                              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                                isDispatched
                                  ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
                                  : 'bg-[#e0231c] hover:bg-[#ff3b30] text-white shadow-md'
                              }`}
                            >
                              {isDispatched ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Dispatched</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Route ORS Buffer</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </GlassParallaxCard>

                {/* 2. Automated Multi-Lingual Voice Advisory Station */}
                <GlassParallaxCard
                  glowColor="rgba(56, 189, 248, 0.45)"
                  maxTilt={4}
                  className="p-5 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-[#38bdf8]" />
                      <h4 className="text-sm font-semibold text-white">
                        Localized Audio Broadcast (TTS)
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-[#10b981]">
                      Engine: Web Audio API
                    </span>
                  </div>

                  <p className="text-xs text-[#aab4ad] font-light leading-relaxed">
                    Automated voice alert synthesized directly from SHAP attribution weights to warn frontline field workers in their native language.
                  </p>

                  <div className="p-3.5 rounded-2xl bg-[#05070a]/80 border border-white/[0.08] space-y-2 backdrop-blur-sm">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-[#78837c]">Broadcast Channel</span>
                      <span className="text-white font-bold">{language === 'odia' ? 'ଓଡ଼ିଆ (Odia)' : language === 'hindi' ? 'हिन्दी (Hindi)' : 'English'}</span>
                    </div>

                    <div className="flex items-center gap-2 py-2">
                      <div className="flex-1 flex items-end gap-1 h-6">
                        {[40, 75, 20, 90, 60, 100, 35, 80, 50, 95, 30, 85].map((h, i) => (
                          <div
                            key={i}
                            className={`flex-1 rounded-full transition-all duration-300 ${
                              isPlayingBroadcast ? 'bg-[#ff5a3c]' : 'bg-white/[0.15]'
                            }`}
                            style={{ height: isPlayingBroadcast ? `${h}%` : '25%' }}
                          />
                        ))}
                      </div>

                      <button
                        onClick={handleTriggerTTS}
                        className="px-4 py-2 rounded-xl bg-[#dfe7e0] hover:bg-white text-[#05070a] text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{isPlayingBroadcast ? 'Broadcasting...' : 'Play Advisory'}</span>
                      </button>
                    </div>
                  </div>
                </GlassParallaxCard>
              </div>
            </div>
          </motion.div>
        )}

        {/* =================================================== DECK 04: AUTONOMOUS GIT REPOSITORY DATABASE */}
        {activeDeck === 'deck-git-db' && (
          <motion.div
            key="deck-git-db"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <GitDatabaseManager />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
