'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { DistrictDetail } from '@/types';
import {
  X,
  Thermometer,
  CloudRain,
  Users,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  ShieldAlert,
  ArrowUpRight,
  CheckCircle2,
  AlertOctagon,
  Radio,
  Clock,
  Layers
} from 'lucide-react';

interface DistrictDetailDrawerProps {
  district: DistrictDetail | null;
  onClose: () => void;
  language: 'odia' | 'hindi' | 'english';
  setLanguage: (lang: 'odia' | 'hindi' | 'english') => void;
  autoPlayVoice?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const DistrictDetailDrawer: React.FC<DistrictDetailDrawerProps> = ({
  district,
  onClose,
  language,
  setLanguage,
  autoPlayVoice = false
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [voiceData, setVoiceData] = useState<{
    transcript: string;
    phonetic: string;
    audioUrl?: string;
  } | null>(null);
  const [smsDispatched, setSmsDispatched] = useState(false);
  const [loadingVoice, setLoadingVoice] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<{ [key: number]: boolean }>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadVoiceScript = useCallback(async (districtId: string, lang: string) => {
    setLoadingVoice(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/alerts/voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          district_id: districtId,
          language: lang,
          recipient_role: 'Block Development Officer'
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        setVoiceData({
          transcript: data.transcript,
          phonetic: data.phonetic_preview,
          audioUrl: data.audio_url ? `${API_BASE_URL}${data.audio_url}` : undefined
        });
      }
    } catch (e) {
      console.warn('Voice API call failed, using local script preview:', e);
    } finally {
      setLoadingVoice(false);
    }
  }, []);

  const fallbackBrowserTTS = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsPlayingAudio(false);
      return;
    }
    window.speechSynthesis.cancel();
    const textToSpeak = voiceData?.phonetic || voiceData?.transcript || 'Warning: Critical heat alert active in district.';
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.92;
    utterance.pitch = 1.05;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
  }, [voiceData]);

  const handlePlayVoice = useCallback(() => {
    if (isPlayingAudio) {
      if (audioRef.current) audioRef.current.pause();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);

    if (voiceData?.audioUrl) {
      const audio = new Audio(voiceData.audioUrl);
      audioRef.current = audio;
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => {
        fallbackBrowserTTS();
      };
      audio.play().catch(() => fallbackBrowserTTS());
    } else {
      fallbackBrowserTTS();
    }
  }, [isPlayingAudio, voiceData, fallbackBrowserTTS]);

  useEffect(() => {
    if (!district) return;
    loadVoiceScript(district.id, language);
  }, [district, language, loadVoiceScript]);

  useEffect(() => {
    if (autoPlayVoice && voiceData) {
      handlePlayVoice();
    }
  }, [autoPlayVoice, voiceData, handlePlayVoice]);

  const handleSendSMS = async () => {
    if (!district) return;
    try {
      await fetch(`${API_BASE_URL}/api/v1/alerts/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          district_id: district.id,
          recipient_phone: '+919437012345',
          recipient_role: 'CDMO & BDO Team',
          language
        })
      });
      setSmsDispatched(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 }
      });
      setTimeout(() => setSmsDispatched(false), 4000);
    } catch (e) {
      console.error('SMS dispatch error:', e);
    }
  };

  const toggleTask = (index: number) => {
    setCompletedTasks(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (!district) return null;

  const isCritical = district.calculated_score >= 80;
  const isHigh = district.calculated_score >= 60;

  return (
    <motion.aside
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 w-full sm:w-[520px] bg-slate-950/95 border-l border-slate-700/80 z-50 flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.9)] backdrop-blur-3xl"
    >
      {/* Header Bar */}
      <div className={`p-5 border-b border-slate-800 relative overflow-hidden ${
        isCritical
          ? 'bg-gradient-to-r from-red-950/70 via-slate-900 to-slate-950 border-red-900/60'
          : 'bg-slate-900/90'
      }`}>
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-64 h-32 bg-rose-500/10 blur-3xl pointer-events-none"></div>

        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-md">
                {district.name}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                isCritical
                  ? 'bg-red-500/25 text-red-300 border border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse'
                  : isHigh
                  ? 'bg-orange-500/25 text-orange-300 border border-orange-500/50'
                  : 'bg-yellow-500/25 text-yellow-300 border border-yellow-500/50'
              }`}>
                {district.risk_level} ALERT
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-mono">
              <span className="text-slate-200">HQ: {district.headquarters}</span> • Pop: {(district.population / 100000).toFixed(1)} Lakh
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer border border-slate-700/60 shadow-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Big Holographic Score Meter */}
        <div className="mt-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-700/80 shadow-inner">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-extrabold text-slate-200 flex items-center gap-2 uppercase tracking-wide">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              Composite Thermal & Syndromic Risk
            </span>
            <span className="text-2xl font-black font-mono text-white">
              {district.calculated_score} <span className="text-xs text-slate-500 font-normal">/ 100</span>
            </span>
          </div>

          {/* Animated Gradient Bar */}
          <div className="w-full bg-slate-950 rounded-full h-3.5 p-0.5 overflow-hidden border border-slate-800">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(district.calculated_score, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                isCritical
                  ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 shadow-[0_0_15px_#ef4444]'
                  : isHigh
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 shadow-[0_0_12px_#f97316]'
                  : 'bg-gradient-to-r from-emerald-500 to-yellow-500'
              }`}
            />
          </div>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-2.5 mt-3.5 text-xs">
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <div className="text-slate-400 flex items-center gap-1 text-[11px] font-semibold">
              <Thermometer className="h-3.5 w-3.5 text-amber-400" /> Temp 30-min Mean
            </div>
            <div className="text-base font-extrabold font-mono text-slate-100 mt-0.5">
              {district.temperature_3day_avg}°C
            </div>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <div className="text-slate-400 flex items-center gap-1 text-[11px] font-semibold">
              <CloudRain className="h-3.5 w-3.5 text-blue-400" /> Rainfall Sum
            </div>
            <div className="text-base font-extrabold font-mono text-slate-100 mt-0.5">
              {district.rainfall_mm} mm
            </div>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <div className="text-slate-400 flex items-center gap-1 text-[11px] font-semibold">
              <Users className="h-3.5 w-3.5 text-rose-400" /> Ground Cases
            </div>
            <div className="text-base font-extrabold font-mono text-rose-400 mt-0.5">
              +{district.total_frontline_cases} Cases
            </div>
          </div>
        </div>
      </div>

      {/* Drawer Body Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Localized Voice Advisory Player */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-rose-900/50 rounded-2xl p-4 space-y-3.5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-2">
              <Radio className="h-4 w-4 text-rose-400 animate-pulse" />
              Automated Localized Voice Advisory
            </h3>

            {/* Language Switcher */}
            <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-[11px]">
              {(['odia', 'hindi', 'english'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    language === l ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {l === 'odia' ? 'ଓଡ଼ିଆ' : l === 'hindi' ? 'हिन्दी' : 'EN'}
                </button>
              ))}
            </div>
          </div>

          {/* Transcript Box */}
          <div className="bg-slate-950/90 border border-slate-800/90 p-3.5 rounded-xl text-xs leading-relaxed text-slate-100 font-medium">
            {voiceData?.transcript || 'Synthesizing voice advisory parameters...'}
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2 pt-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handlePlayVoice}
              disabled={loadingVoice}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-lg cursor-pointer ${
                isPlayingAudio
                  ? 'bg-rose-600 text-white shadow-rose-900/50 animate-pulse'
                  : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-900/30'
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="h-4 w-4" /> Stop Voice Broadcast
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" /> Play Voice Alert ({language.toUpperCase()})
                </>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSendSMS}
              className={`flex items-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold transition border cursor-pointer ${
                smsDispatched
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-900 text-slate-300 border-slate-700/80 hover:bg-slate-800'
              }`}
            >
              {smsDispatched ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Dispatched!
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> SMS Alert
                </>
              )}
            </motion.button>
          </div>

          {/* 32-Band Dynamic Audio Visualizer Bar */}
          {isPlayingAudio && (
            <div className="pt-2 border-t border-rose-900/30">
              <div className="flex items-end justify-between h-9 px-2 gap-1">
                {[...Array(28)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: [
                        `${6 + Math.random() * 12}px`,
                        `${15 + Math.random() * 20}px`,
                        `${8 + Math.random() * 15}px`
                      ]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.25 + (i % 5) * 0.05,
                      ease: 'easeInOut'
                    }}
                    className="w-1.5 bg-gradient-to-t from-rose-600 to-amber-400 rounded-full"
                  />
                ))}
              </div>
              <div className="text-[10px] text-center text-rose-400 font-mono font-bold mt-1 tracking-widest uppercase">
                ✦ LIVE LOCALIZED AUDIO TRANSMISSION ✦
              </div>
            </div>
          )}
        </div>

        {/* SHAP Feature Attribution Card */}
        <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 space-y-3.5 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-400" />
              SHAP Explainability Attribution
            </h3>
            <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
              XGBoost Tool
            </span>
          </div>

          <div className="space-y-2">
            {district.shap_reasons?.map((reason, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="text-xs p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-200 flex items-start gap-2.5 shadow-sm"
              >
                <ArrowUpRight className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{reason}</span>
              </motion.div>
            ))}
          </div>

          {/* Animated Relative Feature Progress Bars */}
          {district.shap_impacts && district.shap_impacts.length > 0 && (
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Relative Impact Contribution Breakdown
              </div>
              {district.shap_impacts.map((imp, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">{imp.feature}</span>
                    <span className="font-mono text-rose-400 font-black">+{imp.impact_percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(imp.impact_percentage * 2, 100)}%` }}
                      transition={{ duration: 0.8, delay: 0.2 + idx * 0.1 }}
                      className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full shadow-[0_0_8px_#f43f5e]"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Prescriptive Action Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-rose-400" />
              Prescriptive Action Cards ({district.action_cards?.length || 0})
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Role Directives</span>
          </div>

          <div className="space-y-2.5">
            {district.action_cards?.map((card, idx) => {
              const isChecked = !!completedTasks[idx];
              return (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.01 }}
                  className={`p-3.5 rounded-2xl border transition text-xs space-y-2 ${
                    isChecked
                      ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md shadow-emerald-950/20'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${isChecked ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                      {card.role}
                    </span>

                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        card.priority === 'Critical' ? 'bg-red-500/25 text-red-300 border border-red-500/40' :
                        card.priority === 'High' ? 'bg-orange-500/25 text-orange-300 border border-orange-500/40' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {card.priority}
                      </span>

                      <button
                        type="button"
                        onClick={() => toggleTask(idx)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        {isChecked ? '✓ DEPLOYED' : 'MARK DONE'}
                      </button>
                    </div>
                  </div>

                  <p className={`text-slate-300 text-xs leading-relaxed ${isChecked ? 'line-through opacity-70' : ''}`}>
                    {card.task}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Recent Ingestion History */}
        {district.recent_reports && district.recent_reports.length > 0 && (
          <div className="space-y-2.5 pt-3 border-t border-slate-800">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">
              Recent Frontline Reports ({district.recent_reports.length})
            </h3>
            <div className="space-y-2">
              {district.recent_reports.map((rep) => (
                <div key={rep.id} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 text-xs flex justify-between items-center shadow-sm">
                  <div>
                    <div className="font-bold text-slate-100">{rep.village}</div>
                    <div className="text-[11px] text-slate-400">{rep.worker_name} • {rep.symptom}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-rose-400 text-sm">+{rep.cases} cases</span>
                    <div className="text-[10px] text-emerald-400 font-mono font-semibold">Synced Live</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
};
