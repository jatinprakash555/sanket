import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.api.v1.endpoints import reports, districts, alerts, git_db

# Ensure static directories exist
os.makedirs(settings.AUDIO_DIR, exist_ok=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="SANKET: Early Warning & Epidemic/Heatwave Intelligence Engine powered by LangGraph, XGBoost, and SHAP Explainability."
)

# Enable CORS for Frontend PWA & Dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Audio for Voice Advisory Playback
app.mount("/static/audio", StaticFiles(directory=settings.AUDIO_DIR), name="audio")

# Mount API v1 Routers
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["Frontline Reports"])
app.include_router(districts.router, prefix=f"{settings.API_V1_STR}/districts", tags=["Districts & GIS"])
app.include_router(alerts.router, prefix=f"{settings.API_V1_STR}/alerts", tags=["Notifications & Voice"])
app.include_router(git_db.router, prefix=f"{settings.API_V1_STR}/git-db", tags=["Git Database Manager"])

@app.get("/")
async def root():
    return {
        "system": "SANKET Early Warning Intelligence Engine",
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "endpoints": {
            "districts": f"{settings.API_V1_STR}/districts",
            "geojson": f"{settings.API_V1_STR}/districts/geojson",
            "evaluate": f"{settings.API_V1_STR}/districts/evaluate",
            "reports": f"{settings.API_V1_STR}/reports",
            "voice_alerts": f"{settings.API_V1_STR}/alerts/voice"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "sanket-backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
