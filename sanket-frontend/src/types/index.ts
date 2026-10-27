export interface ActionCard {
  role: string;
  task: string;
  priority: 'Critical' | 'High' | 'Moderate' | 'Routine';
  category: string;
}

export interface ShapImpact {
  feature: string;
  impact_percentage: number;
  description: string;
  direction: 'increase' | 'decrease';
}

export interface ModelMetric {
  name: string;
  score: number;
  weight: number;
  latency_ms: number;
  confidence_interval?: number[];
  focus_domain: string;
  status: string;
}

export interface ModelBreakdown {
  ensemble_score: number;
  concordance_pct: number;
  active_model_key: string;
  xgboost: ModelMetric;
  syndromic: ModelMetric;
  bayesian: ModelMetric;
}

export interface DistrictSummary {
  id: string;
  name: string;
  headquarters: string;
  lat: number;
  lon: number;
  population: number;
  calculated_score: number;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  temperature_3day_avg: number;
  rainfall_mm: number;
  total_frontline_cases: number;
  last_evaluated: string;
  active_model?: string;
  model_breakdown?: ModelBreakdown;
}

export interface DistrictDetail extends DistrictSummary {
  shap_reasons: string[];
  shap_impacts: ShapImpact[];
  action_cards: ActionCard[];
  recent_reports: ReportItem[];
}

export interface ReportItem {
  id: string;
  district_id: string;
  district_name: string;
  village: string;
  worker_name: string;
  symptom: string;
  cases: number;
  severity: string;
  notes?: string;
  timestamp: string;
  synced: number;
}

export interface VoiceAlertResponse {
  district_id: string;
  district_name: string;
  language: string;
  recipient_role: string;
  audio_url?: string;
  transcript: string;
  phonetic_preview: string;
  status: string;
}
