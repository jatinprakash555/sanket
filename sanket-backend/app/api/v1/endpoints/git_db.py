from fastapi import APIRouter, Query, Response
from fastapi.responses import FileResponse, JSONResponse
from typing import Optional, Dict, Any, List
import json
import os

from app.core.database import db
from app.core.config import settings

router = APIRouter()

@router.get("/status")
async def get_git_db_status() -> Dict[str, Any]:
    """
    Get live Git Repository Flat-File Database metadata & health metrics
    (100% Native GitHub File Database Manager).
    """
    return db.get_git_db_metadata()

@router.get("/records")
async def get_git_db_records(
    search: Optional[str] = Query(None, description="Search term across ID, district, symptom, reporter"),
    source: Optional[str] = Query(None, description="Filter source: all, real, simulated"),
    limit: int = Query(100, ge=1, le=500)
) -> List[Dict[str, Any]]:
    """
    Retrieve database records formatted for Git DB table view.
    """
    return db.get_git_db_records(search=search, source=source, limit=limit)

@router.post("/sync")
async def sync_git_database() -> Dict[str, Any]:
    """
    Force manual synchronization of in-memory data to data/sanket_db.json
    and all mirror targets (backend data, frontend public data, and root repository data).
    """
    db.save_to_disk()
    meta = db.get_git_db_metadata()
    return {
        "status": "SYNCED",
        "message": f"Successfully flushed database to {meta['file_path']} ({meta['db_size_kb']})",
        "metadata": meta
    }

@router.get("/export")
async def export_git_database():
    """
    Download the complete sanket_db.json database payload.
    """
    if os.path.exists(settings.DATABASE_PATH):
        return FileResponse(
            path=settings.DATABASE_PATH,
            filename="sanket_db.json",
            media_type="application/json"
        )
    return JSONResponse(content=db.export_raw_json())
