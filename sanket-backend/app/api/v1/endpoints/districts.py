import json
import os
from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.contracts import RiskRequest, RiskResponse, DistrictSummary, DistrictDetail, ReportResponse
from app.core.database import db
from app.engine.graph import sanket_engine

router = APIRouter()

GEOJSON_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "data", "odisha_districts.geojson")

@router.get("", response_model=List[DistrictSummary])
async def get_all_districts():
    """
    List all monitored Odisha districts with live scores and 3-model breakdown.
    """
    districts = db.list_districts()
    return [
        DistrictSummary(
            id=d["id"],
            name=d["name"],
            headquarters=d["headquarters"],
            lat=d["lat"],
            lon=d["lon"],
            population=d["population"],
            calculated_score=d["calculated_score"],
            risk_level=d["risk_level"],
            temperature_3day_avg=d["temperature_3day_avg"],
            rainfall_mm=d["rainfall_mm"],
            total_frontline_cases=d.get("total_frontline_cases", 0),
            last_evaluated=d["last_evaluated"],
            active_model=d.get("active_model", "ensemble"),
            model_breakdown=d.get("model_breakdown")
        )
        for d in districts
    ]

@router.get("/geojson")
async def get_district_geojson():
    """
    Returns GeoJSON FeatureCollection of Odisha districts with dynamically updated
    risk scores and alert levels embedded in each feature's properties for MapLibre GL.
    """
    if not os.path.exists(GEOJSON_PATH):
        raise HTTPException(status_code=500, detail="GeoJSON boundary file missing")

    with open(GEOJSON_PATH, "r", encoding="utf-8") as f:
        geojson_data = json.load(f)

    for feature in geojson_data.get("features", []):
        did = feature.get("properties", {}).get("id")
        d_record = db.get_district(did)
        if d_record:
            feature["properties"]["score"] = d_record["calculated_score"]
            feature["properties"]["risk_level"] = d_record["risk_level"]
            feature["properties"]["temperature"] = d_record["temperature_3day_avg"]
            feature["properties"]["rainfall"] = d_record["rainfall_mm"]
            feature["properties"]["cases"] = d_record.get("total_frontline_cases", 0)
            feature["properties"]["active_model"] = d_record.get("active_model", "ensemble")

    return geojson_data

@router.get("/{district_id}", response_model=DistrictDetail)
async def get_district_detail(district_id: str):
    """
    Retrieve comprehensive details, 3-model metrics, SHAP reasoning, and action cards.
    """
    d = db.get_district(district_id)
    if not d:
        raise HTTPException(status_code=404, detail=f"District '{district_id}' not found")

    reports = db.get_reports(district_id=district_id, limit=10)
    report_responses = [
        ReportResponse(
            id=r["id"],
            district_id=r["district_id"],
            district_name=d["name"],
            village=r["village"],
            worker_name=r["worker_name"],
            symptom=r["symptom"],
            cases=r["cases"],
            severity=r["severity"],
            notes=r["notes"],
            timestamp=r["timestamp"],
            synced=r.get("synced", 1)
        )
        for r in reports
    ]

    return DistrictDetail(
        id=d["id"],
        name=d["name"],
        headquarters=d["headquarters"],
        lat=d["lat"],
        lon=d["lon"],
        population=d["population"],
        calculated_score=d["calculated_score"],
        risk_level=d["risk_level"],
        temperature_3day_avg=d["temperature_3day_avg"],
        rainfall_mm=d["rainfall_mm"],
        total_frontline_cases=d.get("total_frontline_cases", 0),
        last_evaluated=d["last_evaluated"],
        active_model=d.get("active_model", "ensemble"),
        model_breakdown=d.get("model_breakdown"),
        shap_reasons=d.get("shap_reasons", []),
        shap_impacts=d.get("shap_impacts", []),
        action_cards=d.get("action_cards", []),
        recent_reports=report_responses
    )

@router.post("/evaluate", response_model=RiskResponse)
async def evaluate_district(payload: RiskRequest):
    """
    Execute LangGraph Reaction Engine across the 3 predictive models and consensus ensemble.
    """
    district_info = db.get_district(payload.district_id)
    if not district_info:
        raise HTTPException(status_code=404, detail=f"District '{payload.district_id}' not found")

    initial_state = {
        "district_id": payload.district_id,
        "district_name": district_info["name"],
        "lat": district_info["lat"],
        "lon": district_info["lon"],
        "temperature_3day_avg": payload.override_temperature or 0.0,
        "rainfall_mm": payload.override_rainfall or 0.0,
        "frontline_fever_cases": payload.frontline_fever_cases,
        "active_model": payload.selected_model or "ensemble",
        "calculated_score": 0.0,
        "shap_reasons": [],
        "action_cards": []
    }
    
    result = await sanket_engine.ainvoke(initial_state)
    
    # Save latest evaluation in database
    db.update_district_evaluation(payload.district_id, result)
    
    return RiskResponse(
        district_id=result["district_id"],
        district_name=result.get("district_name", district_info["name"]),
        calculated_score=result["calculated_score"],
        risk_level=result.get("risk_level", "LOW"),
        temperature_3day_avg=result.get("temperature_3day_avg", 0.0),
        rainfall_mm=result.get("rainfall_mm", 0.0),
        frontline_fever_cases=payload.frontline_fever_cases,
        shap_reasons=result["shap_reasons"],
        shap_impacts=result.get("shap_impacts", []),
        action_cards=result["action_cards"],
        active_model=result.get("active_model", "ensemble"),
        model_breakdown=result.get("model_breakdown"),
        evaluated_at=result.get("last_evaluated")
    )

@router.post("/reseed/weather")
async def reseed_all_weather():
    """
    Fetch current Open-Meteo weather data across all Odisha districts
    and recompute multi-model baseline risk scores.
    """
    districts = db.list_districts()
    updated = []
    for d in districts:
        did = d["id"]
        total_cases = db.get_district_case_count(did)
        state = {
            "district_id": did,
            "district_name": d["name"],
            "lat": d["lat"],
            "lon": d["lon"],
            "temperature_3day_avg": 0.0,
            "rainfall_mm": 0.0,
            "frontline_fever_cases": total_cases,
            "active_model": "ensemble",
            "calculated_score": 0.0,
            "shap_reasons": [],
            "action_cards": []
        }
        res = await sanket_engine.ainvoke(state)
        db.update_district_evaluation(did, res)
        updated.append({"id": did, "score": res["calculated_score"], "temp": res["temperature_3day_avg"]})
    return {"status": "success", "updated_districts": len(updated), "details": updated}
