"""
SharePlate Intelligence Engine
Pure Python implementation of rule-based food donation matching,
urgency scoring, and surplus trend analytics.
Zero external library requirement for maximum deployment portability.
"""

import math
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Tuple

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on the earth in kilometers
    using the Haversine formula.
    """
    # Earth radius in kilometers
    r = 6371.0

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    
    # Avoid numerical instability near antipodal points
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a)))
    return round(r * c, 2)


def calculate_urgency_score(collection_deadline_iso: str, current_time: Optional[datetime] = None) -> Dict[str, Any]:
    """
    Compute urgency score (0 - 100) and priority level based on time remaining.
    Deadlines in the past receive score 100 with status EXPIRED.
    """
    if current_time is None:
        current_time = datetime.now(timezone.utc)
    elif current_time.tzinfo is None:
        current_time = current_time.replace(tzinfo=timezone.utc)

    try:
        # Parse ISO format (handling Z or +00:00)
        iso_str = collection_deadline_iso.replace("Z", "+00:00")
        deadline = datetime.fromisoformat(iso_str)
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
    except Exception:
        return {
            "urgency_score": 50,
            "priority": "MODERATE",
            "hours_remaining": 0.0,
            "is_expired": False,
            "error": "Invalid ISO timestamp format"
        }

    diff_seconds = (deadline - current_time).total_seconds()
    hours_remaining = round(diff_seconds / 3600.0, 2)

    if diff_seconds <= 0:
        return {
            "urgency_score": 100,
            "priority": "EXPIRED",
            "hours_remaining": hours_remaining,
            "is_expired": True,
            "description": "Collection deadline has passed. Food must not be distributed without re-inspection."
        }

    # Within 2 hours: Critical
    if hours_remaining <= 2.0:
        # Score 85 to 100
        factor = (2.0 - hours_remaining) / 2.0
        score = 85 + factor * 15
        priority = "CRITICAL"
    # Within 6 hours: High
    elif hours_remaining <= 6.0:
        # Score 60 to 84
        factor = (6.0 - hours_remaining) / 4.0
        score = 60 + factor * 24
        priority = "HIGH"
    # Within 12 hours: Moderate
    elif hours_remaining <= 12.0:
        # Score 35 to 59
        factor = (12.0 - hours_remaining) / 6.0
        score = 35 + factor * 24
        priority = "MODERATE"
    # Over 12 hours: Low
    else:
        # Score 10 to 34
        factor = min(1.0, (24.0 - min(hours_remaining, 24.0)) / 12.0)
        score = 10 + factor * 24
        priority = "LOW"

    return {
        "urgency_score": round(score, 1),
        "priority": priority,
        "hours_remaining": hours_remaining,
        "is_expired": False,
        "description": f"{hours_remaining}h remaining before collection deadline."
    }


def match_donation_to_ngos(
    donation: Dict[str, Any],
    ngos: List[Dict[str, Any]],
    weights: Optional[Dict[str, float]] = None,
    max_radius_km: float = 35.0
) -> Dict[str, Any]:
    """
    Transparent, explainable rule-based matching algorithm.
    Weights:
      distance_weight: 0.35
      urgency_weight: 0.25
      capacity_weight: 0.20
      category_match_weight: 0.20
    """
    if weights is None:
        weights = {
            "distance": 0.35,
            "urgency": 0.25,
            "capacity": 0.20,
            "category": 0.20
        }

    urgency_info = calculate_urgency_score(donation.get("collection_deadline", ""))
    if urgency_info.get("is_expired", False):
        return {
            "success": False,
            "matches": [],
            "message": "Donation has expired. Automatic matching skipped for food safety.",
            "urgency": urgency_info
        }

    don_lat = donation.get("latitude")
    don_lon = donation.get("longitude")
    don_qty = float(donation.get("quantity", 0))
    don_category = donation.get("category", "").lower()
    don_dietary = donation.get("dietary", "").lower()

    scored_recipients = []

    for ngo in ngos:
        # Check verification requirement
        is_verified = ngo.get("is_verified", False)
        if not is_verified and donation.get("require_verified_only", True):
            continue

        ngo_lat = ngo.get("latitude")
        ngo_lon = ngo.get("longitude")

        # Distance calculation
        if don_lat is not None and don_lon is not None and ngo_lat is not None and ngo_lon is not None:
            dist_km = haversine_distance_km(don_lat, don_lon, ngo_lat, ngo_lon)
        else:
            dist_km = 10.0 # Default moderate baseline if coordinates unshared

        # Check radius constraint
        if dist_km > max_radius_km:
            continue

        # Distance score: 100 at 0km down to 0 at max_radius_km
        distance_score = max(0.0, (max_radius_km - dist_km) / max_radius_km) * 100.0

        # Capacity score: Can NGO absorb this donation?
        ngo_daily_capacity = float(ngo.get("daily_servings_capacity", 200))
        estimated_servings = float(donation.get("estimated_servings", don_qty * 2))
        if ngo_daily_capacity >= estimated_servings:
            capacity_score = 100.0
        else:
            capacity_score = max(20.0, (ngo_daily_capacity / max(1.0, estimated_servings)) * 100.0)

        # Category and dietary preference match
        accepted_categories = [c.lower() for c in ngo.get("accepted_categories", [])]
        category_match = True if not accepted_categories or don_category in accepted_categories or "all" in accepted_categories else False

        dietary_prefs = [d.lower() for d in ngo.get("dietary_preferences", [])]
        dietary_match = True
        if dietary_prefs and "all" not in dietary_prefs:
            if don_dietary and don_dietary not in dietary_prefs:
                dietary_match = False

        if category_match and dietary_match:
            category_score = 100.0
        elif category_match:
            category_score = 75.0
        else:
            category_score = 30.0

        # Urgency component
        urgency_score = urgency_info.get("urgency_score", 50.0)

        # Weighted composite score (0 - 100)
        total_score = (
            distance_score * weights["distance"] +
            urgency_score * weights["urgency"] +
            capacity_score * weights["capacity"] +
            category_score * weights["category"]
        )

        reasons = [
            f"Proximity: {dist_km:.1f} km away (sub-score: {distance_score:.0f}/100)",
            f"Capacity: Handles {int(ngo_daily_capacity)} servings/day (fit: {capacity_score:.0f}%)",
            f"Category fit: {category_score:.0f}/100"
        ]
        if is_verified:
            reasons.append("Formally verified NGO partner")

        scored_recipients.append({
            "ngo_id": ngo.get("id") or ngo.get("_id"),
            "ngo_name": ngo.get("name", "Community Partner"),
            "distance_km": dist_km,
            "composite_score": round(total_score, 1),
            "urgency_score": round(urgency_score, 1),
            "capacity_score": round(capacity_score, 1),
            "distance_score": round(distance_score, 1),
            "category_score": round(category_score, 1),
            "reasons": reasons,
            "contact_person": ngo.get("contact_person", ""),
            "contact_phone": ngo.get("phone", "")
        })

    # Sort descending by composite score
    scored_recipients.sort(key=lambda x: x["composite_score"], reverse=True)

    return {
        "success": True,
        "total_matched": len(scored_recipients),
        "donation_id": donation.get("id"),
        "urgency": urgency_info,
        "matches": scored_recipients[:10], # Top 10 matches
        "message": "Top eligible non-profit recipients ranked by proximity, urgency, and capacity."
    }


def analyze_surplus_history(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Transparent aggregation of past completed food rescue records.
    Computes category breakdown, total rescued volume, and EPA-grounded avoided emissions.
    """
    total_qty_kg = 0.0
    total_servings = 0
    by_category = {}
    by_provider = {}
    completed_count = 0

    for rec in records:
        if rec.get("status") in ["delivered", "completed", "picked_up"]:
            completed_count += 1
            qty = float(rec.get("quantity", 0))
            servings = int(rec.get("estimated_servings", qty * 2.2))
            cat = rec.get("category", "General Prepared Food")
            provider = rec.get("provider_name", "Anonymous Partner")

            total_qty_kg += qty
            total_servings += servings
            by_category[cat] = by_category.get(cat, 0.0) + qty
            by_provider[provider] = by_provider.get(provider, 0.0) + qty

    # Documented baseline: 1 kg edible food waste avoided saves ~2.5 kg CO2e (FAO / EPA WARM baseline)
    co2e_avoided_kg = round(total_qty_kg * 2.5, 1)

    return {
        "completed_donations_count": completed_count,
        "total_volume_kg": round(total_qty_kg, 1),
        "total_estimated_servings": total_servings,
        "co2e_avoided_kg": co2e_avoided_kg,
        "category_distribution": {k: round(v, 1) for k, v in by_category.items()},
        "top_providers": [{"name": k, "volume_kg": round(v, 1)} for k, v in sorted(by_provider.items(), key=lambda x: x[1], reverse=True)[:5]],
        "methodology": "Based on verified completed handovers. CO2e factor calibrated at 2.5 kg CO2e/kg food per FAO standard."
    }
