#!/usr/bin/env python3
"""
SharePlate Intelligence Microservice
Zero-dependency HTTP server running on port 8000.
Handles health checks, urgency scoring, rule-based recipient matching, and surplus analytics.
"""

import json
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from matching_engine import (
    calculate_urgency_score,
    match_donation_to_ngos,
    analyze_surplus_history,
    haversine_distance_km
)

PORT = 8000

class IntelligenceHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def _read_json_body(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length <= 0:
                return {}
            raw_data = self.rfile.read(content_length).decode("utf-8")
            return json.loads(raw_data)
        except Exception:
            return {}

    def _send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def do_GET(self):
        if self.path == "/health" or self.path == "/":
            self._send_json(200, {
                "status": "healthy",
                "service": "shareplate-intelligence",
                "version": "1.0.0",
                "framework": "python3-stdlib",
                "features": ["urgency_scoring", "haversine_matching", "surplus_analytics"]
            })
        else:
            self._send_json(404, {"error": "Not Found", "path": self.path})

    def do_POST(self):
        path = self.path.split("?")[0]
        payload = self._read_json_body()

        if path == "/match-donations":
            donation = payload.get("donation", {})
            ngos = payload.get("ngos", [])
            weights = payload.get("weights")
            max_radius = float(payload.get("max_radius_km", 35.0))

            if not donation:
                return self._send_json(400, {"error": "Missing donation payload"})

            result = match_donation_to_ngos(donation, ngos, weights, max_radius)
            return self._send_json(200, result)

        elif path == "/score-urgency":
            deadline = payload.get("collection_deadline", "")
            if not deadline:
                return self._send_json(400, {"error": "Missing collection_deadline"})

            result = calculate_urgency_score(deadline)
            return self._send_json(200, result)

        elif path == "/analytics/surplus-summary":
            records = payload.get("records", [])
            result = analyze_surplus_history(records)
            return self._send_json(200, result)

        else:
            self._send_json(404, {"error": "Endpoint not found", "path": path})

    def log_message(self, format, *args):
        # Concise logging to keep server output clean
        sys.stderr.write(f"[IntelligenceService] {args[0]} - {args[1]}\n")

import errno

class ReusableHTTPServer(HTTPServer):
    allow_reuse_address = True

def run(port=PORT):
    server_address = ("0.0.0.0", port)
    try:
        httpd = ReusableHTTPServer(server_address, IntelligenceHandler)
    except OSError as e:
        if e.errno == errno.EADDRINUSE:
            sys.stderr.write(f"[IntelligenceService] Port {port} already bound by active service instance. Reusing.\n")
            return
        raise e
    sys.stderr.write(f"SharePlate Intelligence Service listening on http://0.0.0.0:{port}\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    run(port)
