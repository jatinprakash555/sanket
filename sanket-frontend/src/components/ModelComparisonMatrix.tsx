'use client';

import React from 'react';
import { ModelBreakdown } from '@/types';
import { Cpu, Zap, Activity, Globe2, Layers, CheckCircle2, Sliders } from 'lucide-react';
import { GlassParallaxCard } from '@/components/GlassParallaxCard';

interface ModelComparisonMatrixProps {
  modelBreakdown: ModelBreakdown | undefined;
  activeModel: 'ensemble' | 'xgboost' | 'syndromic' | 'bayesian';
  onSelectModel: (model: 'ensemble' | 'xgboost' | 'syndromic' | 'bayesian') => void;
}

export const ModelComparisonMatrix: React.FC<ModelComparisonMatrixProps> = ({
  modelBreakdown,
  activeModel,
  onSelectModel
}) => {
  if (!modelBreakdown) return null;

  const models = [
    {
      key: 'ensemble' as const,
      name: 'Consensus Ensemble',
      tag: 'Weighted Multi-Model',
      icon: Layers,
      score: modelBreakdown.ensemble_score,
      badge: `${modelBreakdown.concordance_pct}% Agreement`,
      description: 'Calibrated consensus blending 45% XGBoost, 35% Syndromic Spike, and 20% Bayesian Spatial models.',
      latency: '14.2ms avg',
      stats: 'Ensemble Weight: 100%',
      glowColor: 'rgba(56, 189, 248, 0.45)',
      activeBorder: '#38bdf8'
    },
    {
      key: 'xgboost' as const,
      name: modelBreakdown.xgboost.name,
      tag: 'Meteorological Extreme',
      icon: Zap,
      score: modelBreakdown.xgboost.score,
      badge: `${modelBreakdown.xgboost.latency_ms}ms Latency`,
      description: modelBreakdown.xgboost.focus_domain,
      latency: `${modelBreakdown.xgboost.latency_ms}ms`,
      stats: `Ensemble Weight: ${(modelBreakdown.xgboost.weight * 100).toFixed(0)}%`,
      glowColor: 'rgba(239, 68, 68, 0.5)',
      activeBorder: '#ef4444'
    },
    {
      key: 'syndromic' as const,
      name: modelBreakdown.syndromic.name,
      tag: 'Clinical Surveillance',
      icon: Activity,
      score: modelBreakdown.syndromic.score,
      badge: `${modelBreakdown.syndromic.latency_ms}ms Latency`,
      description: modelBreakdown.syndromic.focus_domain,
      latency: `${modelBreakdown.syndromic.latency_ms}ms`,
      stats: `Ensemble Weight: ${(modelBreakdown.syndromic.weight * 100).toFixed(0)}%`,
      glowColor: 'rgba(249, 115, 22, 0.5)',
      activeBorder: '#f97316'
    },
    {
      key: 'bayesian' as const,
      name: modelBreakdown.bayesian.name,
      tag: 'Spatial Probabilistic',
      icon: Globe2,
      score: modelBreakdown.bayesian.score,
      badge: modelBreakdown.bayesian.confidence_interval
        ? `95% CI: [${modelBreakdown.bayesian.confidence_interval[0]} - ${modelBreakdown.bayesian.confidence_interval[1]}]`
        : 'Converged',
      description: modelBreakdown.bayesian.focus_domain,
      latency: `${modelBreakdown.bayesian.latency_ms}ms`,
      stats: `Ensemble Weight: ${(modelBreakdown.bayesian.weight * 100).toFixed(0)}%`,
      glowColor: 'rgba(16, 185, 129, 0.5)',
      activeBorder: '#10b981'
    }
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-gradient-to-b from-[#111928]/80 via-[#0a0f19]/85 to-[#05070a]/95 border border-white/[0.09] p-5 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.85)]">
      {/* Specular Top Edge Highlight Line */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3 mb-4">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>SANKET 3-Model Machine Intelligence Suite</span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                3/3 CONVERGED
              </span>
            </h3>
            <p className="text-[11px] text-[#aab4ad]">
              Select any model below to filter district risk calculations through that specific algorithmic lens.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#78837c] font-mono bg-white/[0.03] px-3 py-1.5 rounded-xl border border-white/[0.06]">
          <Sliders className="h-3.5 w-3.5 text-slate-500" />
          <span>Active View: <strong className="text-white capitalize">{activeModel}</strong></span>
        </div>
      </div>

      {/* 4 Interactive 3D Parallax Glass Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {models.map((m) => {
          const Icon = m.icon;
          const isSelected = activeModel === m.key;
          const isCritical = m.score >= 80;
          const isHigh = m.score >= 60;

          return (
            <GlassParallaxCard
              key={m.key}
              glowColor={m.glowColor}
              maxTilt={7}
              isSelected={isSelected}
              selectedBorderColor={m.activeBorder}
              onClick={() => onSelectModel(m.key)}
              className="p-4 flex flex-col justify-between h-[210px]"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Icon className="h-3 w-3 text-sky-400" />
                    <span>{m.tag}</span>
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-sky-300 flex items-center gap-1 bg-sky-500/15 px-2 py-0.5 rounded-full border border-sky-400/30 shadow-[0_0_10px_rgba(56,189,248,0.3)]">
                      <CheckCircle2 className="h-3 w-3" /> ACTIVE
                    </span>
                  )}
                </div>

                <div className="text-sm font-semibold text-white tracking-wide">{m.name}</div>
                <div className="text-[11px] text-[#aab4ad] line-clamp-2 mt-1 leading-relaxed font-light">
                  {m.description}
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-end justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 font-mono">{m.stats}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{m.badge}</div>
                </div>

                <div className="text-right">
                  <span className={`text-xl font-bold font-mono px-2.5 py-0.5 rounded-xl border ${
                    isCritical
                      ? 'bg-red-500/15 text-red-400 border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                      : isHigh
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {m.score}
                  </span>
                </div>
              </div>
            </GlassParallaxCard>
          );
        })}
      </div>
    </div>
  );
};

export default ModelComparisonMatrix;
