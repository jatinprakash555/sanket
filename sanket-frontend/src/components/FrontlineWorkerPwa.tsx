'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { db, submitReport, syncOfflineReports, setSimulatedOffline, GroundReport } from '@/lib/offlineStore';
import {
  Wifi,
  WifiOff,
  Send,
  Database,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Plus,
  Minus,
  Signal,
  SignalZero,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

interface FrontlineWorkerPwaProps {
  onSyncComplete?: () => void;
}

export const FrontlineWorkerPwa: React.FC<FrontlineWorkerPwaProps> = ({
  onSyncComplete
}) => {
  const [isSimOffline, setIsSimOffline] = useState(false);
  const [districtId, setDistrictId] = useState('khordha');
  const [village, setVillage] = useState('Jatni Basti (Cluster 4)');
  const workerName = 'Mamata Sethi (ASHA Worker)';
  const [symptom, setSymptom] = useState('Severe Dehydration & Heat Cramps');
  const [cases, setCases] = useState(15);
  const [severity, setSeverity] = useState('Severe');
  const [notes, setNotes] = useState('15 farm laborers working under 42.5°C sun collapsed with severe dehydration');

  const [lastSubmissionStatus, setLastSubmissionStatus] = useState<{
    type: 'offline' | 'online' | null;
    message: string;
  }>({ type: null, message: '' });

  const [queuedReports, setQueuedReports] = useState<GroundReport[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadLocalReports();
  }, []);

  const loadLocalReports = async () => {
    try {
      const records = await db.groundReports.toArray();
      setQueuedReports(records.reverse());
    } catch (e) {
      console.error('Dexie fetch error:', e);
    }
  };

  const handleToggleOffline = (val: boolean) => {
    setIsSimOffline(val);
    setSimulatedOffline(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await submitReport({
      district_id: districtId,
      village,
      worker_name: workerName,
      symptom,
      cases: Number(cases),
      severity,
      notes
    });

    if (result.status === 'queued_offline') {
      setLastSubmissionStatus({
        type: 'offline',
        message: 'Status: Queued Offline. Saved locally in IndexedDB (Dexie.js). Will sync on reconnection.'
      });
    } else {
      setLastSubmissionStatus({
        type: 'online',
        message: 'Status: Synced Live! Ingested into FastAPI & LangGraph Reaction Engine.'
      });
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 }
      });
      if (onSyncComplete) onSyncComplete();
    }

    await loadLocalReports();
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    handleToggleOffline(false);
    const res = await syncOfflineReports();
    await loadLocalReports();
    setIsSyncing(false);
    setLastSubmissionStatus({
      type: 'online',
      message: `Background Sync Complete! Synchronized ${res.syncedCount} queued reports to state surveillance database.`
    });
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });
    if (onSyncComplete) onSyncComplete();
  };

  const pendingCount = queuedReports.filter(r => r.synced === 0).length;

  return (
    <div className="max-w-md mx-auto my-6 px-2">
      {/* Smartphone Titanium Outer Frame */}
      <div className="bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-4 border-slate-600/80 rounded-[44px] p-3.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] relative">
        {/* Specular Edge Highlight */}
        <div className="absolute inset-x-12 top-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"></div>

        {/* Speaker & Dynamic Notch */}
        <div className="w-36 h-4.5 bg-slate-950 rounded-full mx-auto mb-2.5 flex items-center justify-between px-3 shadow-inner">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800"></div>
          <div className="w-12 h-1 bg-slate-900 rounded-full"></div>
          <div className="w-2 h-2 rounded-full bg-indigo-950"></div>
        </div>

        {/* Screen Display Container */}
        <div className="bg-[#050811] rounded-[32px] overflow-hidden border border-slate-800/90 flex flex-col min-h-[690px] shadow-2xl relative">
          {/* Top Status Bar */}
          <div className="bg-slate-950/90 px-5 py-2.5 flex items-center justify-between text-xs text-slate-300 border-b border-slate-800/80">
            <span className="font-mono font-bold tracking-wider">12:45 PM • SANKET-MESH</span>

            <div className="flex items-center space-x-2.5">
              {isSimOffline ? (
                <span className="flex items-center text-rose-400 font-black text-[11px] gap-1 animate-pulse">
                  <SignalZero className="h-3.5 w-3.5" /> 0 BARS (OFFLINE)
                </span>
              ) : (
                <span className="flex items-center text-emerald-400 font-black text-[11px] gap-1">
                  <Signal className="h-3.5 w-3.5" /> 5G FULL
                </span>
              )}
              <span className="font-mono text-slate-400 font-bold">88% 🔋</span>
            </div>
          </div>

          {/* Worker Identity & Simulation Toggle */}
          <div className="p-4 bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center font-black text-white shadow-lg text-sm">
                MS
              </div>
              <div>
                <div className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                  {workerName}
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                  <MapPin className="h-3 w-3 text-rose-400" /> Khordha Sector 4
                </div>
              </div>
            </div>

            {/* Offline Simulation Switch */}
            <div className="flex items-center bg-slate-950 border border-slate-700/80 p-1 rounded-2xl shadow-inner">
              <button
                type="button"
                onClick={() => handleToggleOffline(false)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase transition cursor-pointer ${
                  !isSimOffline
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Online
              </button>
              <button
                type="button"
                onClick={() => handleToggleOffline(true)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase transition cursor-pointer ${
                  isSimOffline
                    ? 'bg-rose-600 text-white shadow-[0_0_12px_#ef4444] animate-pulse'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Offline
              </button>
            </div>
          </div>

          {/* Submission Feedback Banner */}
          <AnimatePresence>
            {lastSubmissionStatus.type && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-3.5 text-xs border-b ${
                  lastSubmissionStatus.type === 'offline'
                    ? 'bg-amber-950/60 border-amber-800/80 text-amber-200'
                    : 'bg-emerald-950/60 border-emerald-800/80 text-emerald-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {lastSubmissionStatus.type === 'offline' ? (
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                  )}
                  <div>
                    <div className="font-black text-[11px] uppercase tracking-wide">
                      {lastSubmissionStatus.type === 'offline' ? 'Queued in Offline IndexedDB (Dexie.js)' : 'Direct Ingestion Confirmed'}
                    </div>
                    <div className="text-[11px] leading-snug mt-0.5 opacity-90">
                      {lastSubmissionStatus.message}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Syndromic Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4 flex-1 overflow-y-auto text-xs">
            {/* District & Village */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Target District</label>
                <select
                  value={districtId}
                  onChange={(e) => setDistrictId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500 font-semibold cursor-pointer"
                >
                  <option value="khordha">Khordha (Bhubaneswar)</option>
                  <option value="cuttack">Cuttack</option>
                  <option value="mayurbhanj">Mayurbhanj</option>
                  <option value="sundargarh">Sundargarh</option>
                  <option value="bolangir">Bolangir</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Village / Basti</label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500 font-medium"
                  required
                />
              </div>
            </div>

            {/* Symptom Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Syndromic Cluster</label>
              <select
                value={symptom}
                onChange={(e) => setSymptom(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500 font-semibold cursor-pointer"
              >
                <option value="Severe Dehydration & Heat Cramps">Severe Dehydration & Heat Cramps</option>
                <option value="High Remittent Fever / Heat Stroke">High Remittent Fever / Heat Stroke</option>
                <option value="Acute Diarrheal Dehydration">Acute Diarrheal Dehydration</option>
                <option value="Sunstroke & Fainting Cluster">Sunstroke & Fainting Cluster</option>
              </select>
            </div>

            {/* Cases Counter */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Patients / Cases Observed Today
              </label>
              <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 shadow-inner">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => setCases(Math.max(1, cases - 1))}
                  className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-lg cursor-pointer"
                >
                  <Minus className="h-4 w-4" />
                </motion.button>
                <div className="text-center">
                  <span className="text-3xl font-black font-mono text-white drop-shadow-md">{cases}</span>
                  <span className="text-[10px] text-rose-400 block font-bold uppercase tracking-wider">Confirmed</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => setCases(cases + 1)}
                  className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-lg cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </motion.button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex gap-2 mt-2">
                {[5, 10, 15, 20].map((num) => (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    key={num}
                    type="button"
                    onClick={() => setCases(num)}
                    className="flex-1 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono font-bold text-slate-300 hover:text-white hover:border-slate-700 cursor-pointer shadow-sm"
                  >
                    +{num}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Severity Radio Pills */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Clinical Severity</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Mild', 'Moderate', 'Severe'] as const).map((sev) => (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    key={sev}
                    type="button"
                    onClick={() => setSeverity(sev)}
                    className={`py-2 rounded-xl font-black text-xs transition cursor-pointer ${
                      severity === sev
                        ? sev === 'Severe'
                          ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                          : 'bg-amber-600 text-white shadow-md'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {sev}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Field Notes */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Ground Field Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500 text-xs"
              />
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className={`w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-xl cursor-pointer ${
                isSimOffline
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-950/40'
                  : 'bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-900/40'
              }`}
            >
              <Send className="h-4 w-4" />
              {isSimOffline ? 'Queue in Offline DB (Dexie.js)' : 'Submit Direct Report to Gateway'}
            </motion.button>
          </form>

          {/* Dexie.js Queue Drawer */}
          <div className="bg-slate-950 border-t border-slate-800/80 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-slate-200 font-black">
                <Database className="h-4 w-4 text-amber-400" />
                <span>IndexedDB Queue</span>
                {pendingCount > 0 ? (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                    {pendingCount} Pending Sync
                  </span>
                ) : (
                  <span className="text-emerald-400 text-[10px] font-mono font-bold">✓ Synced</span>
                )}
              </div>

              {pendingCount > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sync Live Now
                </motion.button>
              )}
            </div>

            {/* Queue items list */}
            <div className="max-h-24 overflow-y-auto space-y-1 text-[11px] pr-1">
              {queuedReports.slice(0, 4).map((r, i) => (
                <div
                  key={i}
                  className="bg-slate-900 p-2 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                >
                  <span className="text-slate-200 truncate max-w-[190px] font-medium">
                    {r.village} ({r.cases} cases)
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-black ${
                    r.synced === 1
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  }`}>
                    {r.synced === 1 ? 'SYNCED' : 'QUEUED OFFLINE'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
