from typing import List, Dict, Any
from app.engine.state import RiskState

def generate_shap_explanation_node(state: RiskState) -> RiskState:
    """
    Generate SHAP-style attribution explanations and prescriptive action cards
    tailored to the driving risk factors.
    """
    temp = state.get("temperature_3day_avg", 0.0)
    cases = state.get("frontline_fever_cases", 0)
    rainfall = state.get("rainfall_mm", 0.0)
    humidity = state.get("humidity_pct", 55.0)
    score = state.get("calculated_score", 0.0)

    reasons: List[str] = []
    impacts: List[Dict[str, Any]] = []
    action_cards: List[Dict[str, Any]] = []

    # 1. Thermal factor impact
    if temp >= 40.0:
        temp_impact = min(round((temp - 35.0) * 4.5), 45)
        reasons.append(f"Heatwave sustained above 40°C (+{temp_impact}% risk impact)")
        impacts.append({
            "feature": "Sustained Heatwave (Avg Temp)",
            "impact_percentage": float(temp_impact),
            "description": f"Ambient temperature averaging {temp}°C over 30-min monitoring window",
            "direction": "increase"
        })
    elif temp >= 37.0:
        reasons.append(f"Elevated summer temperatures nearing threshold (+22% risk impact)")
        impacts.append({
            "feature": "Moderate Thermal Stress",
            "impact_percentage": 22.0,
            "description": f"Temperatures at {temp}°C",
            "direction": "increase"
        })

    # 2. Frontline case surge impact
    if cases > 0:
        case_impact = min(round(cases * 2.2), 48)
        reasons.append(f"Spike in dehydration/fever ground reports (+{case_impact}% risk impact)")
        impacts.append({
            "feature": "Frontline Syndromic Spike",
            "impact_percentage": float(case_impact),
            "description": f"{cases} confirmed ground cases reported by ASHA/ANM workers",
            "direction": "increase"
        })
    else:
        reasons.append("No active syndromic clustering detected on the frontline yet")

    # 3. Moisture / Humidity / Rainfall deficit
    if rainfall == 0.0:
        reasons.append("Zero precipitation in 30-min window exacerbating thermal dehydration (+12% risk impact)")
        impacts.append({
            "feature": "Rainfall Deficit",
            "impact_percentage": 12.0,
            "description": "0.0 mm rainfall recorded",
            "direction": "increase"
        })
    
    if humidity >= 65.0 and temp >= 39.0:
        reasons.append(f"High relative humidity ({humidity}%) amplifying wet-bulb temperature (+14% risk impact)")
        impacts.append({
            "feature": "Wet-Bulb Discomfort Index",
            "impact_percentage": 14.0,
            "description": f"{humidity}% relative humidity suppresses body sweating efficiency",
            "direction": "increase"
        })

    # Fallback explanation if score is mild
    if not reasons:
        reasons.append("Climatic and epidemiological markers remain within safe seasonal bounds")

    # Dynamic Prescriptive Action Cards based on severity
    if score >= 80.0:
        action_cards.extend([
            {
                "role": "Chief District Medical Officer (CDMO)",
                "task": "Issue Red Alert: Deploy emergency ORS buffer stocks & IV saline fluids to all rural PHCs/CHCs within 3 hours",
                "priority": "Critical",
                "category": "Health"
            },
            {
                "role": "Block Development Officer (BDO)",
                "task": "Enforce mandatory rest breaks between 11 AM – 3 PM for MGNREGA workers and outdoor laborers",
                "priority": "Critical",
                "category": "Administration"
            },
            {
                "role": "PHE / Water & Sanitation",
                "task": "Activate 24x7 emergency tanker water supply & shaded cooling sheds (Jal Chhatras) at weekly markets",
                "priority": "High",
                "category": "Logistics"
            },
            {
                "role": "ASHA / ANM Frontline Supervisors",
                "task": "Initiate door-to-door vulnerability checks for elderly, infants, and pregnant mothers",
                "priority": "High",
                "category": "Frontline Surveillance"
            }
        ])
    elif score >= 60.0:
        action_cards.extend([
            {
                "role": "Health Officer",
                "task": "Deploy extra ORS packets to Primary Health Centres and verify cold storage at sub-centers",
                "priority": "High",
                "category": "Health"
            },
            {
                "role": "Block Officer",
                "task": "Activate localized cooling shelters and community water dispensers at bus stands",
                "priority": "High",
                "category": "Administration"
            },
            {
                "role": "ASHA Worker Team",
                "task": "Broadcast heatwave warning in local dialect (Odia/Santhali) at village meetings",
                "priority": "Moderate",
                "category": "Frontline Surveillance"
            }
        ])
    else:
        action_cards.extend([
            {
                "role": "Health Officer",
                "task": "Maintain routine syndromic surveillance and inspect water sample purity",
                "priority": "Routine",
                "category": "Health"
            },
            {
                "role": "Block Officer",
                "task": "Monitor daily weather forecasts and ensure PHC generators are operational",
                "priority": "Routine",
                "category": "Administration"
            }
        ])

    state["shap_reasons"] = reasons
    state["shap_impacts"] = impacts
    state["action_cards"] = action_cards
    return state
