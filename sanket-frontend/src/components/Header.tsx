'use client';

import React from 'react';
import { ShieldCheck, Smartphone, MapPin, Globe, Activity, Terminal } from 'lucide-react';

interface HeaderProps {
  activeTab: 'map' | 'worker';
  setActiveTab: (tab: 'map' | 'worker') => void;
  language: 'odia' | 'hindi' | 'english';
  setLanguage: (lang: 'odia' | 'hindi' | 'english') => void;
  pendingOfflineCount: number;
  onOpenCinematic?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  pendingOfflineCount,
  onOpenCinematic
}) => {
  return (
    <header className="border-b border-slate-800 bg-[#070b14]/90 backdrop-blur-xl sticky top-0 z-50 px-5 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Institutional Branding */}
        <div className="flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 flex items-center justify-center shadow-md shadow-black/40">
            <ShieldCheck className="h-5 w-5 text-rose-500" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                SANKET
                <span className="text-slate-500 font-normal">|</span>
                <span className="text-xs font-semibold text-slate-300 font-serif">
                  संकेत / ସଙ୍କେତ
                </span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                v1.2 ENTERPRISE
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>Govt. of India • NDMA & MoHFW</span>
              <span>•</span>
              <span className="text-slate-300 font-medium">National Heatwave & IDSP Grid</span>
            </div>
          </div>
        </div>

        {/* View Switcher Segmented Control */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 shadow-inner">
          {onOpenCinematic && (
            <button
              onClick={onOpenCinematic}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-all cursor-pointer border-r border-slate-800/80 mr-1"
              title="Return to the buttery smooth cinematic landing experience"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Cinematic Story</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'map'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            National GIS Command Cockpit
          </button>
          <button
            onClick={() => setActiveTab('worker')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all relative cursor-pointer ${
              activeTab === 'worker'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            Frontline Worker PWA
            {pendingOfflineCount > 0 && (
              <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full shadow-sm">
                {pendingOfflineCount}
              </span>
            )}
          </button>
        </div>

        {/* Telemetry Status & Localization */}
        <div className="flex items-center space-x-3">
          <div className="hidden xl:flex items-center space-x-2 text-[11px] text-slate-400 bg-slate-950 border border-slate-800/80 px-3 py-1.5 rounded-xl font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>3 Models Converged: <strong className="text-emerald-400">96.4% Agree</strong></span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-300">
            <Globe className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'odia' | 'hindi' | 'english')}
              className="bg-transparent border-none text-xs font-medium text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="odia" className="bg-slate-900 text-white">ଓଡ଼ିଆ (Odia)</option>
              <option value="hindi" className="bg-slate-900 text-white">हिन्दी (Hindi)</option>
              <option value="english" className="bg-slate-900 text-white">English</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
