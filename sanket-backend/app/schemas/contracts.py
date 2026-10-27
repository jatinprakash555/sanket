from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ActionCard(BaseModel):
    role: str
    task: str
    priority: str = "High"  # High, Critical, Moderate, Routine
    category: str = "Health"  # Health, Water/Sanitation, Administration, Logistics

class ShapImpact(BaseModel):
    feature: str
    impact_percentage: float
    description: str
    direction: str = "increase"  # increase or decrease

class ModelMetric(BaseModel):
    name: str
    score: float
    weight: float
    latency_ms: float
    confidence_interval: Optional[List[float]] = None
    focus_domain: str
    status: str = "CONVERGED"

class ModelBreakdown(BaseModel):
    ensemble_score: float
    concordance_pct: float
    xgboost: ModelMetric
    syndromic: ModelMetric
    bayesian: ModelMetric

class RiskRequest(BaseModel):
    district_id: str
    frontline_fever_cases: int = 0
    override_temperature: Optional[float] = None
    override_rainfall: Optional[float] = None
    selected_model: Optional[str] = "ensemble"  # ensemble, xgboost, syndromic, bayesian

class RiskResponse(BaseModel):
    district_id: str
    calculated_score: float
    shap_reasons: List[str]
    action_cards: List[Dict[str, Any]]
    district_name: Optional[str] = None
    risk_level: Optional[str] = "LOW"
    temperature_3day_avg: Optional[float] = 0.0
    rainfall_mm: Optional[float] = 0.0
    frontline_fever_cases: Optional[int] = 0
    shap_impacts: Optional[List[ShapImpact]] = []
    evaluated_at: Optional[str] = None
    active_model: Optional[str] = "ensemble"
    model_breakdown: Optional[Dict[str, Any]] = None

class ReportCreate(BaseModel):
    district_id: str
    village: str
    worker_name: str = "Frontline Worker (ASHA)"
    symptom: str = "Fever / Dehydration"
    cases: int = Field(ge=1, default=1)
    severity: str = "Moderate"
    notes: Optional[str] = ""
    timestamp: Optional[str] = None

class BatchReportCreate(BaseModel):
    reports: List[ReportCreate]

class ReportResponse(BaseModel):
    id: str
    district_id: str
    district_name: str
    village: str
    worker_name: str
    symptom: str
    cases: int
    severity: str
    notes: Optional[str]
    timestamp: str
    synced: int = 1

class DistrictSummary(BaseModel):
    id: str
    name: str
    headquarters: str
    lat: float
    lon: float
    population: int
    calculated_score: float
    risk_level: str
    temperature_3day_avg: float
    rainfall_mm: float
    total_frontline_cases: int
    last_evaluated: str
    active_model: Optional[str] = "ensemble"
    model_breakdown: Optional[Dict[str, Any]] = None

class DistrictDetail(DistrictSummary):
    shap_reasons: List[str]
    shap_impacts: List[ShapImpact]
    action_cards: List[ActionCard]
    recent_reports: List[ReportResponse]

class VoiceAlertRequest(BaseModel):
    district_id: str
    language: str = "odia"
    recipient_role: str = "Block Development Officer"
    custom_message: Optional[str] = None

class VoiceAlertResponse(BaseModel):
    district_id: str
    district_name: str
    language: str
    recipient_role: str
    audio_url: Optional[str] = None
    transcript: str
    phonetic_preview: str
    status: str = "generated"

class SMSAlertRequest(BaseModel):
    district_id: str
    recipient_phone: str = "+919876543210"
    recipient_role: str = "Chief District Medical Officer"
    language: str = "english"

class SMSAlertResponse(BaseModel):
    success: bool
    recipient_phone: str
    preview_message: str
    status: str
    dispatched_at: str
