'use client';

import React from 'react';
import { Flame, Activity, ShieldCheck, Radio, Satellite, AlertOctagon } from 'lucide-react';

interface TickerProps {
  criticalDistrictCount: number;
  totalFrontlineCases: number;
}

export const LiveSurveillanceTicker: React.FC<TickerProps> = ({
  criticalDistrictCount,
  totalFrontlineCases
}) => {
  const tickerItems = [
    {
      icon: Flame,
      text: `RED HEATWAVE ALERT: ${criticalDistrictCount > 0 ? `${criticalDistrictCount} DISTRICTS EXCEEDING 42.5°C` : 'MONITORING THERMAL ELEVATION'} • BDO COOLING SHELTERS MANDATED`,
      color: 'text-rose-400'
    },
    {
      icon: Activity,
      text: `SYNDROMIC SURVEILLANCE: ${totalFrontlineCases} FIELD CASES INGESTED VIA DEXIE.JS & REST GATEWAY`,
      color: 'text-amber-300'
    },
    {
      icon: Satellite,
      text: 'IMD & OPEN-METEO INGESTION: 30-MIN NOWCAST RESOLVED ACROSS ALL-INDIA NATIONAL HEAT GRID (200 OK)',
      color: 'text-sky-300'
    },
    {
      icon: Radio,
      text: 'LANGGRAPH AGENT GRAPH: MULTI-FACTOR XGBOOST INFERENCE & SHAP EXPLAINABILITY ACTIVE',
      color: 'text-emerald-400'
    },
    {
      icon: AlertOctagon,
      text: 'AUTOMATED LOCALIZED TTS ADVISORIES ACTIVE IN ODIA (ଓଡ଼ିଆ), HINDI (हिन्दी) & ENGLISH',
      color: 'text-purple-300'
    }
  ];

  return (
    <div className="bg-slate-950/90 border-b border-rose-950/40 py-1.5 px-4 overflow-hidden relative z-20 flex items-center shadow-inner">
      <div className="flex items-center gap-2 bg-rose-600/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest shrink-0 shadow-sm shadow-rose-900/30 mr-3">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping"></span>
        LIVE FEED
      </div>

      <div className="flex space-x-8 animate-marquee whitespace-nowrap text-xs font-mono">
        {tickerItems.concat(tickerItems).map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="flex items-center space-x-1.5 inline-flex">
              <Icon className={`h-3.5 w-3.5 ${item.color} shrink-0 animate-pulse`} />
              <span className="text-slate-300 font-semibold text-[11px]">{item.text}</span>
              <span className="text-slate-600 mx-3">•</span>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          display: inline-flex;
          animation: marquee 35s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};
