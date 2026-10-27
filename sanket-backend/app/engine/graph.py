from langgraph.graph import StateGraph, END
from app.engine.state import RiskState
from app.engine.nodes.fetcher import fetch_weather_node
from app.engine.nodes.model import evaluate_risk_node
from app.engine.nodes.explainer import generate_shap_explanation_node

# Assemble State Machine Workflow Graph
builder = StateGraph(RiskState)

# Register functional nodes
builder.add_node("fetch_weather", fetch_weather_node)
builder.add_node("evaluate_risk", evaluate_risk_node)
builder.add_node("generate_explanation", generate_shap_explanation_node)

# Connect execution pipeline
builder.set_entry_point("fetch_weather")
builder.add_edge("fetch_weather", "evaluate_risk")
builder.add_edge("evaluate_risk", "generate_explanation")
builder.add_edge("generate_explanation", END)

# Compile reaction engine
sanket_engine = builder.compile()
