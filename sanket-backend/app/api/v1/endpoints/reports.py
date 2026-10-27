from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Optional
from app.schemas.contracts import ReportCreate, BatchReportCreate, ReportResponse
from app.core.database import db
from app.engine.graph import sanket_engine

router = APIRouter()

async def reevaluate_district(district_id: str):
    """Background task to re-run LangGraph engine when new frontline cases arrive."""
    d_info = db.get_district(district_id)
    if not d_info:
        return
    
    total_cases = db.get_district_case_count(district_id)
    initial_state = {
        "district_id": district_id,
        "district_name": d_info.get("name", district_id),
        "lat": d_info.get("lat"),
        "lon": d_info.get("lon"),
        "temperature_3day_avg": 0.0,
        "rainfall_mm": 0.0,
        "frontline_fever_cases": total_cases,
        "calculated_score": 0.0,
        "shap_reasons": [],
        "action_cards": []
    }
    result = await sanket_engine.ainvoke(initial_state)
    db.update_district_evaluation(district_id, result)

@router.post("", response_model=ReportResponse, status_code=201)
async def submit_report(payload: ReportCreate, background_tasks: BackgroundTasks):
    """
    Ingest a syndromic surveillance report from a frontline health worker.
    Triggers re-evaluation of district risk score via LangGraph.
    """
    district = db.get_district(payload.district_id)
    if not district:
        raise HTTPException(status_code=404, detail=f"District '{payload.district_id}' not found")

    report_record = db.add_report(payload.model_dump())
    
    # Trigger LangGraph evaluation to update district risk
    await reevaluate_district(payload.district_id)

    return ReportResponse(
        id=report_record["id"],
        district_id=report_record["district_id"],
        district_name=district["name"],
        village=report_record["village"],
        worker_name=report_record["worker_name"],
        symptom=report_record["symptom"],
        cases=report_record["cases"],
        severity=report_record["severity"],
        notes=report_record["notes"],
        timestamp=report_record["timestamp"],
        synced=1
    )

@router.post("/batch", response_model=List[ReportResponse])
async def submit_batch_reports(payload: BatchReportCreate, background_tasks: BackgroundTasks):
    """
    Batch sync queued reports stored offline in Dexie.js (IndexedDB)
    once mobile connectivity is restored.
    """
    results = []
    affected_districts = set()

    for item in payload.reports:
        district = db.get_district(item.district_id)
        d_name = district["name"] if district else item.district_id.title()
        record = db.add_report(item.model_dump())
        affected_districts.add(item.district_id.lower())
        results.append(ReportResponse(
            id=record["id"],
            district_id=record["district_id"],
            district_name=d_name,
            village=record["village"],
            worker_name=record["worker_name"],
            symptom=record["symptom"],
            cases=record["cases"],
            severity=record["severity"],
            notes=record["notes"],
            timestamp=record["timestamp"],
            synced=1
        ))

    # Re-evaluate all affected districts
    for did in affected_districts:
        await reevaluate_district(did)

    return results

@router.get("", response_model=List[ReportResponse])
async def list_reports(district_id: Optional[str] = None, limit: int = 50):
    """
    Retrieve frontline surveillance reports with optional district filter.
    """
    reports = db.get_reports(district_id=district_id, limit=limit)
    out = []
    for r in reports:
        d = db.get_district(r["district_id"])
        out.append(ReportResponse(
            id=r["id"],
            district_id=r["district_id"],
            district_name=d["name"] if d else r["district_id"].title(),
            village=r["village"],
            worker_name=r["worker_name"],
            symptom=r["symptom"],
            cases=r["cases"],
            severity=r["severity"],
            notes=r["notes"],
            timestamp=r["timestamp"],
            synced=r.get("synced", 1)
        ))
    return out
