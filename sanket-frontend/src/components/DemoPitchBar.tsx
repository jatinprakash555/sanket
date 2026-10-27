'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { CloudRain, WifiOff, RefreshCw, AlertTriangle, Volume2, Play, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';

interface DemoPitchBarProps {
  onPreseedWeather: () => Promise<void>;
  onTriggerOfflineSubmission: () => Promise<void>;
  onTriggerLiveSync: () => Promise<void>;
  onFocusDistrict: (districtId: string) => void;
  onPlayVoiceAdvisory: () => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  loading: boolean;
}

export const DemoPitchBar: React.FC<DemoPitchBarProps> = ({
  onPreseedWeather,
  onTriggerOfflineSubmission,
  onTriggerLiveSync,
  onFocusDistrict,
  onPlayVoiceAdvisory,
  currentStep,
  setCurrentStep,
  loading
}) => {
  const [isRunningAll, setIsRunningAll] = useState(false);

  const runAllSteps = async () => {
    setIsRunningAll(true);
    try {
      // Step 1: Preseed weather
      setCurrentStep(1);
      await onPreseedWeather();
      await new Promise(r => setTimeout(r, 1100));

      // Step 2: Offline report
      setCurrentStep(2);
      await onTriggerOfflineSubmission();
      await new Promise(r => setTimeout(r, 1300));

      // Step 3: Sync to backend
      setCurrentStep(3);
      await onTriggerLiveSync();
      await new Promise(r => setTimeout(r, 1100));

      // Step 4: Focus Khordha and turn red
      setCurrentStep(4);
      onFocusDistrict('khordha');
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 }
      });
      await new Promise(r => setTimeout(r, 1100));

      // Step 5: Play voice alert
      setCurrentStep(5);
      onPlayVoiceAdvisory();
    } catch (e) {
      console.error('Demo run error:', e);
    } finally {
      setIsRunningAll(false);
    }
  };

  const steps = [
    {
      num: 1,
      title: 'Pre-seed Weather',
      desc: 'Query Open-Meteo live API for 30-min heat pulse',
      icon: CloudRain,
      action: async () => {
        setCurrentStep(1);
        await onPreseedWeather();
      }
    },
    {
      num: 2,
      title: 'Offline Worker Mode',
      desc: 'Simulate 0G network; queue 15 dehydration cases in Dexie.js',
      icon: WifiOff,
      action: async () => {
        setCurrentStep(2);
        await onTriggerOfflineSubmission();
      }
    },
    {
      num: 3,
      title: 'Live Sync Trigger',
      desc: 'Flush IndexedDB queue to FastAPI /api/v1/reports',
      icon: RefreshCw,
      action: async () => {
        setCurrentStep(3);
        await onTriggerLiveSync();
      }
    },
    {
      num: 4,
      title: 'Map Red Alert Reaction',
      desc: 'Watch GIS boundary turn RED (84/100 LangGraph Score)',
      icon: AlertTriangle,
      action: () => {
        setCurrentStep(4);
        onFocusDistrict('khordha');
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
    },
    {
      num: 5,
      title: 'SHAP & Voice Advisory',
      desc: 'Inspect feature attributions & play Odia/Hindi voice broadcast',
      icon: Volume2,
      action: () => {
        setCurrentStep(5);
        onFocusDistrict('khordha');
        onPlayVoiceAdvisory();
      }
    }
  ];

  return (
    <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-rose-900/40 px-4 py-3 shadow-xl relative z-20">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Banner Title & Master Play Button */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black text-xs tracking-wider uppercase shadow-md shadow-amber-950/40">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            HACKATHON DEMO
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={runAllSteps}
            disabled={isRunningAll || loading}
            className="flex items-center gap-2 text-xs font-black tracking-wide px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-rose-500 to-red-600 hover:from-amber-300 hover:to-red-500 text-slate-950 shadow-[0_0_20px_rgba(244,63,94,0.4)] transition cursor-pointer disabled:opacity-50"
          >
            <Play className="h-4 w-4 fill-current" />
            {isRunningAll ? 'Executing Story Walkthrough...' : '⚡ 1-Click Stage Demo Story'}
          </motion.button>
        </div>

        {/* Interactive Step Strip */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto w-full lg:w-auto py-1">
          {steps.map((st, i) => {
            const Icon = st.icon;
            const isCompleted = currentStep > st.num;
            const isCurrent = currentStep === st.num;

            return (
              <React.Fragment key={st.num}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={st.action}
                  disabled={loading || isRunningAll}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition text-left whitespace-nowrap cursor-pointer shadow-sm ${
                    isCurrent
                      ? 'bg-rose-500/30 text-white border border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse'
                      : isCompleted
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/25'
                      : 'bg-slate-900/90 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                  title={st.desc}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Icon className={`h-4 w-4 shrink-0 ${isCurrent ? 'text-rose-400 animate-spin-slow' : 'text-slate-400'}`} />
                  )}
                  <span>
                    <strong className="text-[10px] opacity-75 font-mono">#{st.num}</strong> {st.title}
                  </span>
                </motion.button>
                {i < steps.length - 1 && (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-700 shrink-0 hidden sm:block" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
