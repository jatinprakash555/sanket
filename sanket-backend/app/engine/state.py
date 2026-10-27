from typing import TypedDict, List, Dict, Any, Optional

class RiskState(TypedDict, total=False):
    district_id: str
    district_name: Optional[str]
    lat: Optional[float]
    lon: Optional[float]
    temperature_3day_avg: float
    rainfall_mm: float
    humidity_pct: Optional[float]
    frontline_fever_cases: int
    calculated_score: float
    risk_level: Optional[str]
    active_model: Optional[str]  # 'ensemble' | 'xgboost' | 'syndromic' | 'bayesian'
    model_breakdown: Optional[Dict[str, Any]]
    shap_reasons: List[str]
    shap_impacts: Optional[List[Dict[str, Any]]]
    action_cards: List[Dict[str, Any]]
    error: Optional[str]
