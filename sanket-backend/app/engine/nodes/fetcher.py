import httpx
import logging
from app.engine.state import RiskState
from app.core.database import db

logger = logging.getLogger(__name__)

# Fallback typical meteorological values per district if Open-Meteo API is unreachable
FALLBACK_WEATHER = {
    "cuttack": {"temp": 41.2, "rainfall": 0.0, "humidity": 65.0},
    "khordha": {"temp": 42.5, "rainfall": 0.0, "humidity": 68.0},
    "mayurbhanj": {"temp": 43.1, "rainfall": 0.0, "humidity": 55.0},
    "sundargarh": {"temp": 43.8, "rainfall": 0.0, "humidity": 45.0},
    "bolangir": {"temp": 44.5, "rainfall": 0.0, "humidity": 42.0},
    "puri": {"temp": 38.0, "rainfall": 2.5, "humidity": 78.0},
    "ganjam": {"temp": 39.5, "rainfall": 1.0, "humidity": 72.0},
    "balasore": {"temp": 40.2, "rainfall": 0.0, "humidity": 66.0},
    "sambalpur": {"temp": 44.0, "rainfall": 0.0, "humidity": 44.0},
    "koraput": {"temp": 35.5, "rainfall": 4.0, "humidity": 62.0},
    "angul": {"temp": 43.6, "rainfall": 0.0, "humidity": 48.0},
    "jharsuguda": {"temp": 44.8, "rainfall": 0.0, "humidity": 40.0},
}

async def fetch_weather_node(state: RiskState) -> RiskState:
    """
    Fetch 3-day average temperature and rainfall from Open-Meteo API
    or utilize calibrated district fallback when offline.
    """
    did = state.get("district_id", "").lower()
    district_info = db.get_district(did) or {}
    
    lat = state.get("lat") or district_info.get("lat", 20.4625)
    lon = state.get("lon") or district_info.get("lon", 85.8830)
    
    state["district_name"] = district_info.get("name", did.title())
    state["lat"] = lat
    state["lon"] = lon

    # Check if overrides are already provided in state
    if state.get("temperature_3day_avg", 0.0) > 0:
        return state

    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}&daily=temperature_2m_max,precipitation_sum,relative_humidity_2m_mean"
        f"&past_days=3&forecast_days=1&timezone=Asia%2FKolkata"
    )

    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                daily = data.get("daily", {})
                temps = daily.get("temperature_2m_max", [])
                rains = daily.get("precipitation_sum", [])
                humids = daily.get("relative_humidity_2m_mean", [])

                if temps:
                    avg_temp = round(sum(temps[-3:]) / len(temps[-3:]), 1)
                else:
                    avg_temp = 42.0

                total_rain = round(sum(rains[-3:]) if rains else 0.0, 1)
                avg_humid = round(sum(humids[-3:]) / len(humids[-3:]), 1) if humids else 60.0

                state["temperature_3day_avg"] = avg_temp
                state["rainfall_mm"] = total_rain
                state["humidity_pct"] = avg_humid
                return state
    except Exception as e:
        logger.warning(f"Open-Meteo API fetch failed for {did}: {e}. Employing regional climate fallback.")

    # Graceful fallback
    fallback = FALLBACK_WEATHER.get(did, {"temp": 42.5, "rainfall": 0.0, "humidity": 65.0})
    state["temperature_3day_avg"] = fallback["temp"]
    state["rainfall_mm"] = fallback["rainfall"]
    state["humidity_pct"] = fallback["humidity"]
    return state
