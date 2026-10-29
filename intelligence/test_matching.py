"""
Unit Tests for SharePlate Matching Engine
Runs with `python3 -m unittest intelligence/test_matching.py` or pytest.
"""

import unittest
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from datetime import datetime, timezone, timedelta
from matching_engine import (
    haversine_distance_km,
    calculate_urgency_score,
    match_donation_to_ngos,
    analyze_surplus_history
)

class TestSharePlateIntelligence(unittest.TestCase):

    def test_haversine_distance_identical_points(self):
        # Distance between identical points is 0
        d = haversine_distance_km(40.7128, -74.0060, 40.7128, -74.0060)
        self.assertEqual(d, 0.0)

    def test_haversine_known_distance(self):
        # Distance between London (51.5074, -0.1278) and Paris (48.8566, 2.3522) ~ 343 km
        dist = haversine_distance_km(51.5074, -0.1278, 48.8566, 2.3522)
        self.assertTrue(335 <= dist <= 350, f"Expected ~343km, got {dist}")

    def test_urgency_scoring_critical(self):
        now = datetime.now(timezone.utc)
        deadline_1h = (now + timedelta(hours=1)).isoformat()
        res = calculate_urgency_score(deadline_1h, current_time=now)
        self.assertEqual(res["priority"], "CRITICAL")
        self.assertGreaterEqual(res["urgency_score"], 85.0)
        self.assertFalse(res["is_expired"])

    def test_urgency_scoring_expired(self):
        now = datetime.now(timezone.utc)
        past_deadline = (now - timedelta(hours=2)).isoformat()
        res = calculate_urgency_score(past_deadline, current_time=now)
        self.assertEqual(res["priority"], "EXPIRED")
        self.assertEqual(res["urgency_score"], 100)
        self.assertTrue(res["is_expired"])

    def test_urgency_scoring_low(self):
        now = datetime.now(timezone.utc)
        deadline_20h = (now + timedelta(hours=20)).isoformat()
        res = calculate_urgency_score(deadline_20h, current_time=now)
        self.assertEqual(res["priority"], "LOW")
        self.assertLessEqual(res["urgency_score"], 35.0)

    def test_match_donations_ranking(self):
        now = datetime.now(timezone.utc)
        deadline = (now + timedelta(hours=3)).isoformat()
        donation = {
            "id": "don_1",
            "category": "Cooked Meals",
            "dietary": "Vegetarian",
            "quantity": 25.0,
            "estimated_servings": 50,
            "collection_deadline": deadline,
            "latitude": 37.7749,
            "longitude": -122.4194,
            "require_verified_only": True
        }

        ngos = [
            {
                "id": "ngo_close",
                "name": "Mission Food Pantry",
                "latitude": 37.7752,
                "longitude": -122.4180, # Very close (~0.1 km)
                "is_verified": True,
                "daily_servings_capacity": 100,
                "accepted_categories": ["Cooked Meals", "Baked Goods"],
                "dietary_preferences": ["Vegetarian"]
            },
            {
                "id": "ngo_far",
                "name": "Bay Area Shelter",
                "latitude": 37.8044,
                "longitude": -122.2712, # Oakland (~13 km)
                "is_verified": True,
                "daily_servings_capacity": 500,
                "accepted_categories": ["Cooked Meals"],
                "dietary_preferences": ["Vegetarian"]
            },
            {
                "id": "ngo_unverified",
                "name": "Pending Center",
                "latitude": 37.7750,
                "longitude": -122.4190,
                "is_verified": False,
                "daily_servings_capacity": 50,
                "accepted_categories": ["Cooked Meals"]
            }
        ]

        result = match_donation_to_ngos(donation, ngos)
        self.assertTrue(result["success"])
        self.assertEqual(result["total_matched"], 2) # Unverified excluded
        matches = result["matches"]
        # The closest verified NGO should rank higher
        self.assertEqual(matches[0]["ngo_id"], "ngo_close")
        self.assertGreater(matches[0]["composite_score"], matches[1]["composite_score"])

    def test_surplus_history_analytics(self):
        records = [
            {"status": "delivered", "quantity": 10.0, "estimated_servings": 20, "category": "Produce", "provider_name": "Farm Co"},
            {"status": "picked_up", "quantity": 20.0, "estimated_servings": 40, "category": "Bakery", "provider_name": "Baker Joe"},
            {"status": "cancelled", "quantity": 15.0, "estimated_servings": 30, "category": "Dairy", "provider_name": "Dairy Ltd"}
        ]
        res = analyze_surplus_history(records)
        self.assertEqual(res["completed_donations_count"], 2)
        self.assertEqual(res["total_volume_kg"], 30.0)
        self.assertEqual(res["total_estimated_servings"], 60)
        self.assertEqual(res["co2e_avoided_kg"], 75.0) # 30 * 2.5
        self.assertIn("Produce", res["category_distribution"])
        self.assertIn("Bakery", res["category_distribution"])
        self.assertNotIn("Dairy", res["category_distribution"])

if __name__ == "__main__":
    unittest.main()
