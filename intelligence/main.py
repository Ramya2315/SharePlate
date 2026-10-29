"""
SharePlate FastAPI Intelligence Service
Standard FastAPI definition for production deployments with uvicorn.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

try:
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from intelligence.matching_engine import (
        calculate_urgency_score,
        match_donation_to_ngos,
        analyze_surplus_history
    )
except ImportError:
    # Fallback to local import if run directly inside directory
    try:
        from matching_engine import (
            calculate_urgency_score,
            match_donation_to_ngos,
            analyze_surplus_history
        )
    except Exception:
        pass

app = None
try:
    from fastapi import FastAPI
    app = FastAPI(
        title="SharePlate Intelligence Service",
        description="Rule-based matching, urgency scoring, and surplus analytics",
        version="1.0.0"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    class DonationPayload(BaseModel):
        id: Optional[str] = None
        category: str
        dietary: Optional[str] = "Vegetarian"
        quantity: float
        estimated_servings: Optional[int] = None
        collection_deadline: str
        latitude: Optional[float] = None
        longitude: Optional[float] = None
        require_verified_only: Optional[bool] = True

    class NGOPayload(BaseModel):
        id: str
        name: str
        latitude: Optional[float] = None
        longitude: Optional[float] = None
        is_verified: bool = True
        daily_servings_capacity: float = 200.0
        accepted_categories: Optional[List[str]] = []
        dietary_preferences: Optional[List[str]] = []
        contact_person: Optional[str] = None
        phone: Optional[str] = None

    class MatchRequest(BaseModel):
        donation: DonationPayload
        ngos: List[NGOPayload]
        max_radius_km: Optional[float] = 35.0
        weights: Optional[Dict[str, float]] = None

    class UrgencyRequest(BaseModel):
        collection_deadline: str

    class SurplusHistoryRequest(BaseModel):
        records: List[Dict[str, Any]]

    @app.get("/health")
    def health():
        return {"status": "healthy", "service": "shareplate-intelligence-fastapi"}

    @app.post("/match-donations")
    def match_donations(req: MatchRequest):
        return match_donation_to_ngos(
            donation=req.donation.dict(),
            ngos=[n.dict() for n in req.ngos],
            weights=req.weights,
            max_radius_km=req.max_radius_km or 35.0
        )

    @app.post("/score-urgency")
    def score_urgency(req: UrgencyRequest):
        return calculate_urgency_score(req.collection_deadline)

    @app.post("/analytics/surplus-summary")
    def surplus_summary(req: SurplusHistoryRequest):
        return analyze_surplus_history(req.records)

except Exception:
    pass
