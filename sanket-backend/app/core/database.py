import json
import os
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from app.core.config import settings

# Pan-India National Sentinel Districts & Heatwave Crisis Nodes (NDMA / IMD / MoHFW)
ALL_INDIA_DISTRICTS = [
    # ─── NORTH & DESERT HEAT DOME ───────────────────────────
    {
        "id": "delhi",
        "name": "Delhi NCR",
        "headquarters": "New Delhi",
        "lat": 28.6139,
        "lon": 77.2090,
        "population": 16787941,
        "base_temp": 45.4,
        "base_rainfall": 0.0,
        "base_humidity": 28.0,
        "calculated_score": 91.2,
        "risk_level": "CRITICAL",
    },
    {
        "id": "churu",
        "name": "Churu (Thar Core)",
        "headquarters": "Churu, Rajasthan",
        "lat": 28.2900,
        "lon": 74.9600,
        "population": 2039547,
        "base_temp": 48.6,
        "base_rainfall": 0.0,
        "base_humidity": 18.0,
        "calculated_score": 96.8,
        "risk_level": "CRITICAL",
    },
    {
        "id": "bikaner",
        "name": "Bikaner",
        "headquarters": "Bikaner, Rajasthan",
        "lat": 28.0229,
        "lon": 73.3119,
        "population": 2363937,
        "base_temp": 47.5,
        "base_rainfall": 0.0,
        "base_humidity": 22.0,
        "calculated_score": 93.4,
        "risk_level": "CRITICAL",
    },
    {
        "id": "jaipur",
        "name": "Jaipur",
        "headquarters": "Jaipur, Rajasthan",
        "lat": 26.9124,
        "lon": 75.7873,
        "population": 3073350,
        "base_temp": 44.2,
        "base_rainfall": 0.0,
        "base_humidity": 30.0,
        "calculated_score": 79.5,
        "risk_level": "HIGH",
    },
    {
        "id": "gwalior",
        "name": "Gwalior",
        "headquarters": "Gwalior, Madhya Pradesh",
        "lat": 26.2183,
        "lon": 78.1828,
        "population": 2032036,
        "base_temp": 46.2,
        "base_rainfall": 0.0,
        "base_humidity": 24.0,
        "calculated_score": 90.5,
        "risk_level": "CRITICAL",
    },
    {
        "id": "bhopal",
        "name": "Bhopal",
        "headquarters": "Bhopal, Madhya Pradesh",
        "lat": 23.2599,
        "lon": 77.4126,
        "population": 2371061,
        "base_temp": 43.5,
        "base_rainfall": 0.0,
        "base_humidity": 32.0,
        "calculated_score": 74.5,
        "risk_level": "HIGH",
    },
    {
        "id": "prayagraj",
        "name": "Prayagraj",
        "headquarters": "Prayagraj, Uttar Pradesh",
        "lat": 25.4358,
        "lon": 81.8463,
        "population": 5954391,
        "base_temp": 46.8,
        "base_rainfall": 0.0,
        "base_humidity": 31.0,
        "calculated_score": 93.0,
        "risk_level": "CRITICAL",
    },
    {
        "id": "lucknow",
        "name": "Lucknow",
        "headquarters": "Lucknow, Uttar Pradesh",
        "lat": 26.8467,
        "lon": 80.9462,
        "population": 4589838,
        "base_temp": 44.0,
        "base_rainfall": 0.0,
        "base_humidity": 40.0,
        "calculated_score": 78.2,
        "risk_level": "HIGH",
    },
    {
        "id": "gaya",
        "name": "Gaya",
        "headquarters": "Gaya, Bihar",
        "lat": 24.7914,
        "lon": 85.0002,
        "population": 4391418,
        "base_temp": 45.8,
        "base_rainfall": 0.0,
        "base_humidity": 35.0,
        "calculated_score": 88.6,
        "risk_level": "CRITICAL",
    },
    {
        "id": "patna",
        "name": "Patna",
        "headquarters": "Patna, Bihar",
        "lat": 25.5941,
        "lon": 85.1376,
        "population": 5838465,
        "base_temp": 43.8,
        "base_rainfall": 0.0,
        "base_humidity": 45.0,
        "calculated_score": 77.0,
        "risk_level": "HIGH",
    },
    # ─── CENTRAL & WESTERN CRUCIBLE ────────────────────────
    {
        "id": "nagpur",
        "name": "Nagpur (Vidarbha)",
        "headquarters": "Nagpur, Maharashtra",
        "lat": 21.1458,
        "lon": 79.0882,
        "population": 4653570,
        "base_temp": 46.5,
        "base_rainfall": 0.0,
        "base_humidity": 26.0,
        "calculated_score": 92.0,
        "risk_level": "CRITICAL",
    },
    {
        "id": "chandrapur",
        "name": "Chandrapur",
        "headquarters": "Chandrapur, Maharashtra",
        "lat": 19.9615,
        "lon": 79.2961,
        "population": 2204307,
        "base_temp": 47.2,
        "base_rainfall": 0.0,
        "base_humidity": 25.0,
        "calculated_score": 94.5,
        "risk_level": "CRITICAL",
    },
    {
        "id": "ahmedabad",
        "name": "Ahmedabad",
        "headquarters": "Ahmedabad, Gujarat",
        "lat": 23.0225,
        "lon": 72.5714,
        "population": 5577940,
        "base_temp": 44.8,
        "base_rainfall": 0.0,
        "base_humidity": 38.0,
        "calculated_score": 83.0,
        "risk_level": "CRITICAL",
    },
    {
        "id": "mumbai",
        "name": "Mumbai Suburban",
        "headquarters": "Bandra, Maharashtra",
        "lat": 19.0760,
        "lon": 72.8777,
        "population": 9356962,
        "base_temp": 36.5,
        "base_rainfall": 0.0,
        "base_humidity": 78.0,
        "calculated_score": 73.5,
        "risk_level": "HIGH",
    },
    # ─── EAST & COASTAL BELT ───────────────────────────────
    {
        "id": "kolkata",
        "name": "Kolkata",
        "headquarters": "Kolkata, West Bengal",
        "lat": 22.5726,
        "lon": 88.3639,
        "population": 4496694,
        "base_temp": 40.2,
        "base_rainfall": 0.0,
        "base_humidity": 72.0,
        "calculated_score": 76.5,
        "risk_level": "HIGH",
    },
    {
        "id": "jharsuguda",
        "name": "Jharsuguda",
        "headquarters": "Jharsuguda, Odisha",
        "lat": 21.8500,
        "lon": 84.0000,
        "population": 579505,
        "base_temp": 45.5,
        "base_rainfall": 0.0,
        "base_humidity": 38.0,
        "calculated_score": 88.0,
        "risk_level": "CRITICAL",
    },
    {
        "id": "bolangir",
        "name": "Bolangir (Titilagarh)",
        "headquarters": "Balangir, Odisha",
        "lat": 20.7107,
        "lon": 83.4862,
        "population": 1648997,
        "base_temp": 46.2,
        "base_rainfall": 0.0,
        "base_humidity": 36.0,
        "calculated_score": 91.0,
        "risk_level": "CRITICAL",
    },
    {
        "id": "sambalpur",
        "name": "Sambalpur",
        "headquarters": "Sambalpur, Odisha",
        "lat": 21.4669,
        "lon": 83.9812,
        "population": 1041099,
        "base_temp": 44.8,
        "base_rainfall": 0.0,
        "base_humidity": 40.0,
        "calculated_score": 82.0,
        "risk_level": "CRITICAL",
    },
    {
        "id": "khordha",
        "name": "Khordha (Bhubaneswar)",
        "headquarters": "Bhubaneswar, Odisha",
        "lat": 20.1923,
        "lon": 85.6179,
        "population": 2251673,
        "base_temp": 42.5,
        "base_rainfall": 0.0,
        "base_humidity": 68.0,
        "calculated_score": 64.0,
        "risk_level": "HIGH",
    },
    {
        "id": "cuttack",
        "name": "Cuttack",
        "headquarters": "Cuttack, Odisha",
        "lat": 20.4625,
        "lon": 85.8830,
        "population": 2624470,
        "base_temp": 41.2,
        "base_rainfall": 0.0,
        "base_humidity": 65.0,
        "calculated_score": 52.4,
        "risk_level": "MODERATE",
    },
    {
        "id": "sundargarh",
        "name": "Sundargarh (Rourkela)",
        "headquarters": "Rourkela, Odisha",
        "lat": 22.1167,
        "lon": 84.0333,
        "population": 2093437,
        "base_temp": 44.2,
        "base_rainfall": 0.0,
        "base_humidity": 42.0,
        "calculated_score": 80.5,
        "risk_level": "CRITICAL",
    },
    {
        "id": "mayurbhanj",
        "name": "Mayurbhanj",
        "headquarters": "Baripada, Odisha",
        "lat": 21.9333,
        "lon": 86.7333,
        "population": 2519738,
        "base_temp": 43.1,
        "base_rainfall": 0.0,
        "base_humidity": 55.0,
        "calculated_score": 72.5,
        "risk_level": "HIGH",
    },
    {
        "id": "puri",
        "name": "Puri",
        "headquarters": "Puri, Odisha",
        "lat": 19.8135,
        "lon": 85.8312,
        "population": 1698730,
        "base_temp": 38.0,
        "base_rainfall": 2.5,
        "base_humidity": 78.0,
        "calculated_score": 38.0,
        "risk_level": "MODERATE",
    },
    {
        "id": "balasore",
        "name": "Balasore",
        "headquarters": "Baleshwar, Odisha",
        "lat": 21.4934,
        "lon": 86.9135,
        "population": 2320529,
        "base_temp": 40.2,
        "base_rainfall": 0.0,
        "base_humidity": 66.0,
        "calculated_score": 48.5,
        "risk_level": "MODERATE",
    },
    # ─── SOUTH & PENINSULAR HEAT BELT ──────────────────────
    {
        "id": "ramagundam",
        "name": "Peddapalli (Ramagundam)",
        "headquarters": "Ramagundam, Telangana",
        "lat": 18.7557,
        "lon": 79.5126,
        "population": 795332,
        "base_temp": 47.0,
        "base_rainfall": 0.0,
        "base_humidity": 32.0,
        "calculated_score": 94.0,
        "risk_level": "CRITICAL",
    },
    {
        "id": "hyderabad",
        "name": "Hyderabad",
        "headquarters": "Hyderabad, Telangana",
        "lat": 17.3850,
        "lon": 78.4867,
        "population": 6809970,
        "base_temp": 43.2,
        "base_rainfall": 0.0,
        "base_humidity": 42.0,
        "calculated_score": 75.0,
        "risk_level": "HIGH",
    },
    {
        "id": "vijayawada",
        "name": "NTR (Vijayawada)",
        "headquarters": "Vijayawada, Andhra Pradesh",
        "lat": 16.5062,
        "lon": 80.6480,
        "population": 2218591,
        "base_temp": 45.2,
        "base_rainfall": 0.0,
        "base_humidity": 58.0,
        "calculated_score": 89.0,
        "risk_level": "CRITICAL",
    },
    {
        "id": "chennai",
        "name": "Chennai",
        "headquarters": "Chennai, Tamil Nadu",
        "lat": 13.0827,
        "lon": 80.2707,
        "population": 7088000,
        "base_temp": 41.8,
        "base_rainfall": 0.0,
        "base_humidity": 70.0,
        "calculated_score": 78.0,
        "risk_level": "HIGH",
    },
    {
        "id": "bengaluru",
        "name": "Bengaluru Urban",
        "headquarters": "Bengaluru, Karnataka",
        "lat": 12.9716,
        "lon": 77.5946,
        "population": 9621551,
        "base_temp": 36.8,
        "base_rainfall": 2.0,
        "base_humidity": 52.0,
        "calculated_score": 42.0,
        "risk_level": "MODERATE",
    }
]

# Backward compatibility alias
ODISHA_DISTRICTS = ALL_INDIA_DISTRICTS

class Database:
    """
    SANKET Autonomous Git File Database Engine
    Modeled after the TCC Flat-File JSON Repository Database Architecture:
    - 100% Native GitHub Repository Storage (Zero External DB)
    - Auto-persists to data/sanket_db.json
    - Prunes records to retention cap (max 200 entries)
    - Mirrors database to Frontend Public Data for offline / static PWA fallback
    - Ready for GitHub Actions scheduled auto-commit workflows
    """
    MAX_REPORTS_RETENTION = 200

    def __init__(self):
        self.districts: Dict[str, Dict[str, Any]] = {}
        self.reports: List[Dict[str, Any]] = []
        self.alerts: List[Dict[str, Any]] = []
        self.metadata: Dict[str, Any] = {}
        
        self.db_path = settings.DATABASE_PATH
        self.mirror_paths = [
            settings.DATABASE_PATH,
            getattr(settings, "ROOT_DATABASE_PATH", None),
            getattr(settings, "FRONTEND_DATABASE_PATH", None)
        ]
        
        # Load from Git File DB if available, otherwise initialize & persist
        if os.path.exists(self.db_path):
            loaded = self.load_from_disk()
            if not loaded:
                self._initialize_data()
                self.save_to_disk()
        else:
            self._initialize_data()
            self.save_to_disk()

    def _initialize_data(self):
        now_str = datetime.utcnow().isoformat()
        for d in ODISHA_DISTRICTS:
            self.districts[d["id"]] = {
                "id": d["id"],
                "name": d["name"],
                "headquarters": d["headquarters"],
                "lat": d["lat"],
                "lon": d["lon"],
                "population": d["population"],
                "calculated_score": d["calculated_score"],
                "risk_level": d["risk_level"],
                "temperature_3day_avg": d["base_temp"],
                "rainfall_mm": d["base_rainfall"],
                "humidity_pct": d["base_humidity"],
                "frontline_fever_cases": 0,
                "total_frontline_cases": 0,
                "shap_reasons": [
                    f"Baseline summer temperature {d['base_temp']}°C",
                    f"Precipitation deficit: {d['base_rainfall']}mm rainfall"
                ],
                "shap_impacts": [
                    {"feature": "Temperature 3-day avg", "impact_percentage": 55.0, "description": f"Sustained heat at {d['base_temp']}°C", "direction": "increase"},
                    {"feature": "Rainfall Deficit", "impact_percentage": 20.0, "description": "Absence of pre-monsoon showers", "direction": "increase"}
                ],
                "action_cards": [
                    {"role": "Health Officer", "task": "Stock ORS & IV Fluids at Block PHCs", "priority": "High", "category": "Health"},
                    {"role": "Block Officer", "task": "Activate localized drinking water booths (Jal Chhatra)", "priority": "Moderate", "category": "Logistics"}
                ],
                "last_evaluated": now_str
            }

        # Seed initial frontline ground reports for realism
        self.reports = [
            {
                "id": "rep-001",
                "district_id": "cuttack",
                "village": "Banki Goth",
                "worker_name": "Mamata Sethi (ASHA)",
                "symptom": "Heat Exhaustion / Cramps",
                "cases": 4,
                "severity": "Moderate",
                "notes": "Farm workers working in afternoon heat",
                "source": "real",
                "timestamp": now_str,
                "synced": 1
            },
            {
                "id": "rep-002",
                "district_id": "khordha",
                "village": "Jatni Basti",
                "worker_name": "Priyanka Jena (ANM)",
                "symptom": "High Fever & Dehydration",
                "cases": 6,
                "severity": "Moderate",
                "notes": "Cluster of children with dehydration symptoms",
                "source": "real",
                "timestamp": now_str,
                "synced": 1
            }
        ]

    def load_from_disk(self) -> bool:
        """Load state from Git repository flat-file JSON database"""
        try:
            with open(self.db_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            self.metadata = data.get("metadata", {})
            self.districts = data.get("districts", {})
            self.reports = data.get("reports", [])
            self.alerts = data.get("alerts", [])

            # Ensure all catalog districts are represented
            for d in ODISHA_DISTRICTS:
                if d["id"] not in self.districts:
                    self.districts[d["id"]] = {
                        "id": d["id"],
                        "name": d["name"],
                        "headquarters": d["headquarters"],
                        "lat": d["lat"],
                        "lon": d["lon"],
                        "population": d["population"],
                        "calculated_score": d["calculated_score"],
                        "risk_level": d["risk_level"],
                        "temperature_3day_avg": d["base_temp"],
                        "rainfall_mm": d["base_rainfall"],
                        "humidity_pct": d["base_humidity"],
                        "frontline_fever_cases": 0,
                        "total_frontline_cases": 0,
                        "shap_reasons": [],
                        "shap_impacts": [],
                        "action_cards": [],
                        "last_evaluated": datetime.utcnow().isoformat()
                    }
            return True
        except Exception as e:
            print(f"[Git DB Engine] Failed to load {self.db_path}: {e}")
            return False

    def save_to_disk(self):
        """
        Auto-persist database state to JSON repository flat-file
        and mirror to all configured paths.
        """
        now_str = datetime.utcnow().isoformat()

        # Enforce Auto-Retention Policy
        if len(self.reports) > self.MAX_REPORTS_RETENTION:
            self.reports = self.reports[:self.MAX_REPORTS_RETENTION]

        payload = {
            "metadata": {
                "system": "SANKET Autonomous Git File Database Manager",
                "version": settings.VERSION,
                "last_updated": now_str,
                "total_districts": len(self.districts),
                "total_reports": len(self.reports),
                "total_alerts": len(self.alerts),
                "retention_policy": f"Auto-managed to max {self.MAX_REPORTS_RETENTION} recent entries",
                "storage_mode": "100% Native GitHub Repository Storage (Zero External DB)",
                "db_size_kb": "0.0 KB"
            },
            "districts": self.districts,
            "reports": self.reports,
            "alerts": self.alerts
        }

        # Calculate database size
        raw_json = json.dumps(payload, indent=2)
        size_kb = f"{len(raw_json.encode('utf-8')) / 1024:.2f} KB"
        payload["metadata"]["db_size_kb"] = size_kb
        self.metadata = payload["metadata"]

        final_json = json.dumps(payload, indent=2)

        # Write to all target paths
        for p in self.mirror_paths:
            if p:
                try:
                    os.makedirs(os.path.dirname(p), exist_ok=True)
                    with open(p, "w", encoding="utf-8") as f:
                        f.write(final_json)
                except Exception as e:
                    print(f"[Git DB Engine] Mirror write skipped for {p}: {e}")

    def get_district(self, district_id: str) -> Optional[Dict[str, Any]]:
        return self.districts.get(district_id.lower())

    def list_districts(self) -> List[Dict[str, Any]]:
        return list(self.districts.values())

    def update_district_evaluation(self, district_id: str, eval_data: Dict[str, Any]):
        did = district_id.lower()
        if did in self.districts:
            self.districts[did].update({
                "calculated_score": eval_data.get("calculated_score", self.districts[did]["calculated_score"]),
                "risk_level": eval_data.get("risk_level", self.districts[did]["risk_level"]),
                "temperature_3day_avg": eval_data.get("temperature_3day_avg", self.districts[did]["temperature_3day_avg"]),
                "rainfall_mm": eval_data.get("rainfall_mm", self.districts[did]["rainfall_mm"]),
                "frontline_fever_cases": eval_data.get("frontline_fever_cases", self.districts[did]["frontline_fever_cases"]),
                "shap_reasons": eval_data.get("shap_reasons", self.districts[did]["shap_reasons"]),
                "shap_impacts": eval_data.get("shap_impacts", self.districts[did]["shap_impacts"]),
                "action_cards": eval_data.get("action_cards", self.districts[did]["action_cards"]),
                "active_model": eval_data.get("active_model", self.districts[did].get("active_model", "ensemble")),
                "model_breakdown": eval_data.get("model_breakdown", self.districts[did].get("model_breakdown")),
                "last_evaluated": datetime.utcnow().isoformat()
            })
            self.save_to_disk()

    def add_report(self, report_dict: Dict[str, Any]) -> Dict[str, Any]:
        report_id = f"rep-{uuid.uuid4().hex[:6]}"
        record = {
            "id": report_id,
            "district_id": report_dict["district_id"].lower(),
            "village": report_dict.get("village", "Unknown Village"),
            "worker_name": report_dict.get("worker_name", "Frontline Worker (ASHA)"),
            "symptom": report_dict.get("symptom", "Fever / Dehydration"),
            "cases": int(report_dict.get("cases", 1)),
            "severity": report_dict.get("severity", "Moderate"),
            "notes": report_dict.get("notes", ""),
            "source": report_dict.get("source", "real"),
            "timestamp": report_dict.get("timestamp") or datetime.utcnow().isoformat(),
            "synced": 1
        }
        self.reports.insert(0, record)
        
        # Update district total frontline cases counter
        did = record["district_id"]
        if did in self.districts:
            self.districts[did]["total_frontline_cases"] = sum(
                r["cases"] for r in self.reports if r["district_id"] == did
            )
            self.districts[did]["frontline_fever_cases"] = self.districts[did]["total_frontline_cases"]

        self.save_to_disk()
        return record

    def get_reports(self, district_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        if district_id:
            did = district_id.lower()
            return [r for r in self.reports if r["district_id"] == did][:limit]
        return self.reports[:limit]

    def get_district_case_count(self, district_id: str) -> int:
        did = district_id.lower()
        return sum(r["cases"] for r in self.reports if r["district_id"] == did)

    def log_alert(self, alert_data: Dict[str, Any]):
        alert_record = {
            "id": f"alt-{uuid.uuid4().hex[:6]}",
            **alert_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        self.alerts.insert(0, alert_record)
        self.save_to_disk()
        return alert_record

    def get_alerts(self, limit: int = 20) -> List[Dict[str, Any]]:
        return self.alerts[:limit]

    def get_git_db_metadata(self) -> Dict[str, Any]:
        """Return live metadata for the Git File Database Manager"""
        return {
            "system": self.metadata.get("system", "SANKET Autonomous Git File Database Manager"),
            "version": self.metadata.get("version", settings.VERSION),
            "last_updated": self.metadata.get("last_updated", datetime.utcnow().isoformat()),
            "total_districts": len(self.districts),
            "total_reports": len(self.reports),
            "total_alerts": len(self.alerts),
            "total_records": len(self.reports) + len(self.districts),
            "retention_policy": f"Auto-managed to max {self.MAX_REPORTS_RETENTION} recent entries",
            "storage_mode": "100% Native GitHub Repository Storage (Zero External DB)",
            "db_size_kb": self.metadata.get("db_size_kb", "0.0 KB"),
            "file_path": "data/sanket_db.json"
        }

    def get_git_db_records(self, search: Optional[str] = None, source: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Return combined database records for inspection & table view"""
        records = []
        for r in self.reports:
            item = {
                "id": r.get("id"),
                "timestamp": r.get("timestamp"),
                "district_id": r.get("district_id"),
                "location": f"{r.get('village', '')}, {r.get('district_id', '').upper()}",
                "reporter": r.get("worker_name"),
                "symptom": r.get("symptom"),
                "cases": r.get("cases"),
                "severity": r.get("severity"),
                "source": r.get("source", "real"),
                "type": "Frontline Ground Report"
            }
            records.append(item)

        # Filter by search
        if search:
            s = search.lower().strip()
            records = [
                r for r in records
                if s in str(r.get("id", "")).lower()
                or s in str(r.get("district_id", "")).lower()
                or s in str(r.get("location", "")).lower()
                or s in str(r.get("symptom", "")).lower()
                or s in str(r.get("reporter", "")).lower()
            ]

        # Filter by source
        if source and source != "all":
            records = [r for r in records if r.get("source") == source]

        return records[:limit]

    def export_raw_json(self) -> Dict[str, Any]:
        """Export full database payload as JSON"""
        return {
            "metadata": self.get_git_db_metadata(),
            "districts": self.districts,
            "reports": self.reports,
            "alerts": self.alerts
        }

# Singleton instance
db = Database()

