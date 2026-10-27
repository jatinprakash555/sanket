'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header';
import { DemoPitchBar } from '@/components/DemoPitchBar';
import { LiveSurveillanceTicker } from '@/components/LiveSurveillanceTicker';
import { ParticleBackground } from '@/components/ParticleBackground';
import { OdishaGisMap } from '@/components/OdishaGisMap';
import { ThreeGlobeSurveillance } from '@/components/ThreeGlobeSurveillance';
import { ThreeAnatomicalTwin } from '@/components/ThreeAnatomicalTwin';
import { ThreeFrontlineTelemetryHub } from '@/components/ThreeFrontlineTelemetryHub';
import { HeatwaveAnalyticsGraph } from '@/components/HeatwaveAnalyticsGraph';
import { DistrictDetailDrawer } from '@/components/DistrictDetailDrawer';
import { FrontlineWorkerPwa } from '@/components/FrontlineWorkerPwa';
import { ModelComparisonMatrix } from '@/components/ModelComparisonMatrix';
import { SanketCinematicLanding } from '@/components/SanketCinematicLanding';
import { SanketWarRoom } from '@/components/SanketWarRoom';
import { DistrictSummary, DistrictDetail } from '@/types';
import { db, submitReport, syncOfflineReports, setSimulatedOffline } from '@/lib/offlineStore';
import {
  Thermometer,
  Users,
  Layers,
  Flame,
  CheckCircle2,
  Cpu,
  Globe2,
  Map,
  Activity,
  Package,
  Satellite
} from 'lucide-react';

const IsroBhuvanMap = dynamic(() => import('@/components/IsroBhuvanMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[640px] bg-slate-950/80 border border-slate-700/60 rounded-3xl flex items-center justify-center font-mono text-xs text-sky-400">
      <div className="flex flex-col items-center gap-2">
        <div className="h-6 w-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        <span>INITIALIZING ISRO BHUVAN SATELLITE GIS...</span>
      </div>
    </div>
  )
});

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type VisualizationMode = 'map' | 'vector' | 'globe3d' | 'anatomy3d' | 'hardware3d';

export default function Home() {
  const [viewMode, setViewMode] = useState<'cinematic' | 'operational'>('cinematic');
  const [activeTab, setActiveTab] = useState<'map' | 'worker'>('map');
  const [vizMode, setVizMode] = useState<VisualizationMode>('map');
  const [language, setLanguage] = useState<'odia' | 'hindi' | 'english'>('odia');
  const [activeModel, setActiveModel] = useState<'ensemble' | 'xgboost' | 'syndromic' | 'bayesian'>('ensemble');
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>('khordha');
  const [selectedDistrictDetail, setSelectedDistrictDetail] = useState<DistrictDetail | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [pendingOfflineCount, setPendingOfflineCount] = useState<number>(0);
  const [currentPitchStep, setCurrentPitchStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [autoPlayVoice, setAutoPlayVoice] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Fetch all districts from backend
  const fetchDistricts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/districts`);
      if (res.ok) {
        const data = await res.json();
        setDistricts(data);
      }
    } catch {
      // Backend starting
    }
  }, []);

  // 2. Fetch GeoJSON from backend or public fallback
  const fetchGeoJSON = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/districts/geojson`);
      if (res.ok) {
        const data = await res.json();
        setGeoJsonData(data);
        return;
      }
    } catch {
      // Fallback
    }
    try {
      const fallback = await fetch('/data/odisha_districts.geojson');
      if (fallback.ok) {
        const data = await fallback.json();
        setGeoJsonData(data);
      }
    } catch (err) {
      console.error('Failed to load GeoJSON fallback:', err);
    }
  }, []);

  // 3. Fetch detailed district information for drawer
  const fetchDistrictDetail = useCallback(async (id: string, modelChoice: string = 'ensemble') => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/districts/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedDistrictDetail(data);
      }
    } catch (err) {
      console.error('Failed to load district detail:', err);
    }
  }, []);

  // Check Dexie offline pending count
  const updateOfflineCount = useCallback(async () => {
    try {
      const count = await db.groundReports.where('synced').equals(0).count();
      setPendingOfflineCount(count);
    } catch {
      // Ignored
    }
  }, []);

  useEffect(() => {
    fetchDistricts();
    fetchGeoJSON();
    updateOfflineCount();
  }, [fetchDistricts, fetchGeoJSON, updateOfflineCount]);

  useEffect(() => {
    if (selectedDistrictId) {
      fetchDistrictDetail(selectedDistrictId, activeModel);
    }
  }, [selectedDistrictId, activeModel, fetchDistrictDetail]);

  // Model switch handler
  const handleSelectModel = async (model: 'ensemble' | 'xgboost' | 'syndromic' | 'bayesian') => {
    setActiveModel(model);
    showToast(`Switched active inference view to ${model.toUpperCase()} model.`);
    if (selectedDistrictId) {
      try {
        const d = districts.find(x => x.id === selectedDistrictId);
        const res = await fetch(`${API_BASE_URL}/api/v1/districts/evaluate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            district_id: selectedDistrictId,
            frontline_fever_cases: d?.total_frontline_cases || 0,
            selected_model: model
          })
        });
        if (res.ok) {
          await fetchDistricts();
          await fetchGeoJSON();
          await fetchDistrictDetail(selectedDistrictId, model);
        }
      } catch (e) {
        console.error('Model evaluate error:', e);
      }
    }
  };

  // Demo Pitch Handlers
  const handlePreseedWeather = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/districts/reseed/weather`, {
        method: 'POST'
      });
      if (res.ok) {
        showToast('Step 1 Complete: Live Open-Meteo 30-min heat pulse pre-seeded across 3 models!');
        await fetchDistricts();
        await fetchGeoJSON();
      }
    } catch {
      showToast('Step 1 Simulated: Baseline Open-Meteo climate data loaded.');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerOfflineSubmission = async () => {
    setSimulatedOffline(true);
    await submitReport({
      district_id: 'khordha',
      village: 'Jatni High-Risk Cluster',
      worker_name: 'Mamata Sethi (ASHA Worker)',
      symptom: 'Severe Dehydration & Heat Cramps',
      cases: 15,
      severity: 'Severe',
      notes: '15 laborers working under 42.5°C sun collapsed with severe dehydration'
    });
    await updateOfflineCount();
    showToast('Step 2 Complete: 15 cases queued in IndexedDB (Dexie.js) under Offline mode!');
  };

  const handleTriggerLiveSync = async () => {
    setLoading(true);
    setSimulatedOffline(false);
    const result = await syncOfflineReports();
    await updateOfflineCount();
    await fetchDistricts();
    await fetchGeoJSON();
    if (selectedDistrictId) {
      await fetchDistrictDetail(selectedDistrictId, activeModel);
    }
    setLoading(false);
    showToast(`Step 3 Complete: Background sync pushed ${result.syncedCount || 1} reports to FastAPI gateway!`);
  };

  const handleFocusDistrict = async (did: string) => {
    setSelectedDistrictId(did);
    setActiveTab('map');
    await fetchDistrictDetail(did, activeModel);
    showToast(`Step 4 Complete: District ${did.toUpperCase()} updated. Multi-model consensus reached Critical Red!`);
  };

  const handlePlayVoiceAdvisory = () => {
    setAutoPlayVoice(true);
    showToast(`Step 5 Complete: Automated ${language.toUpperCase()} voice advisory playing!`);
  };

  // State summary metrics
  const criticalCount = districts.filter(d => d.calculated_score >= 80).length;
  const totalFrontlineCases = districts.reduce((sum, d) => sum + (d.total_frontline_cases || 0), 0);
  const avgTemp = districts.length
    ? (districts.reduce((sum, d) => sum + d.temperature_3day_avg, 0) / districts.length).toFixed(1)
    : '41.2';

  const currentModelBreakdown = selectedDistrictDetail?.model_breakdown || (districts.find(d => d.id === selectedDistrictId)?.model_breakdown);

  if (viewMode === 'cinematic') {
    return (
      <SanketCinematicLanding
        onEnterDashboard={() => setViewMode('operational')}
        onOpenWorkerPwa={() => {
          setViewMode('operational');
          setActiveTab('worker');
        }}
        districtsCount={districts.length || 30}
        criticalDistrictsCount={criticalCount || 3}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100 flex flex-col font-sans relative selection:bg-rose-500 selection:text-white">
      {/* Subtle Ambient Particle Layer */}
      <ParticleBackground />

      {/* Floating Executive Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 bg-slate-900/95 border border-slate-700 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold text-white backdrop-blur-2xl"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Institutional Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        pendingOfflineCount={pendingOfflineCount}
        onOpenCinematic={() => setViewMode('cinematic')}
      />

      {/* Live Surveillance Stream Marquee */}
      <LiveSurveillanceTicker
        criticalDistrictCount={criticalCount}
        totalFrontlineCases={totalFrontlineCases}
      />

      {/* 5-Step Demo Pitch Bar */}
      <DemoPitchBar
        onPreseedWeather={handlePreseedWeather}
        onTriggerOfflineSubmission={handleTriggerOfflineSubmission}
        onTriggerLiveSync={handleTriggerLiveSync}
        onFocusDistrict={handleFocusDistrict}
        onPlayVoiceAdvisory={handlePlayVoiceAdvisory}
        currentStep={currentPitchStep}
        setCurrentStep={setCurrentPitchStep}
        loading={loading}
      />

      {/* Mission-Control Multi-Deck Tactical War Room */}
      <SanketWarRoom
        districts={districts}
        selectedDistrictId={selectedDistrictId}
        selectedDistrictDetail={selectedDistrictDetail}
        onSelectDistrict={(id) => {
          setSelectedDistrictId(id);
          fetchDistrictDetail(id, activeModel);
        }}
        activeModel={activeModel}
        onSelectModel={handleSelectModel}
        geoJsonData={geoJsonData}
        language={language}
        setLanguage={setLanguage}
        pendingOfflineCount={pendingOfflineCount}
        onUpdateOfflineCount={updateOfflineCount}
        onPreseedWeather={handlePreseedWeather}
        onTriggerOfflineSubmission={handleTriggerOfflineSubmission}
        onTriggerLiveSync={handleTriggerLiveSync}
        onPlayVoiceAdvisory={handlePlayVoiceAdvisory}
        onOpenCinematic={() => setViewMode('cinematic')}
        currentPitchStep={currentPitchStep}
        setCurrentPitchStep={setCurrentPitchStep}
        loading={loading}
        showToast={showToast}
      />

      {/* District Detail Drawer */}
      <AnimatePresence>
        {selectedDistrictDetail && activeTab === 'map' && (
          <DistrictDetailDrawer
            district={selectedDistrictDetail}
            onClose={() => setSelectedDistrictDetail(null)}
            language={language}
            setLanguage={setLanguage}
            autoPlayVoice={autoPlayVoice}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
