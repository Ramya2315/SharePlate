/**
 * Python Intelligence Service Client
 * Handles communication between Node.js API and the Python FastAPI/HTTP intelligence microservice.
 * Includes graceful timeout handling, validation, and zero-crash fallback.
 */

import http from 'http';
import path from 'path';
import { execFile } from 'child_process';
import { IFoodListing, IUser } from '../models/index.ts';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000';
const TIMEOUT_MS = 3000;

function postJson(endpoint: string, payload: any): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(endpoint, PYTHON_SERVICE_URL);
      const data = JSON.stringify(payload);

      const req = http.request(
        {
          hostname: url.hostname,
          port: url.port || 8000,
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
          },
          timeout: TIMEOUT_MS,
        },
        (res) => {
          let responseBody = '';
          res.on('data', (chunk) => {
            responseBody += chunk;
          });
          res.on('end', () => {
            try {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                resolve(JSON.parse(responseBody));
              } else {
                reject(new Error(`Service returned HTTP ${res.statusCode}: ${responseBody}`));
              }
            } catch (parseErr) {
              reject(parseErr);
            }
          });
        }
      );

      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Python intelligence service timed out'));
      });

      req.write(data);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Execute standalone python matching engine as fallback if HTTP server is not answering
 */
function getPythonExecutable(): string {
  return process.platform === 'win32' ? 'py' : 'python3';
}

function runPythonFallback(scriptArgs: string[], inputJson: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.resolve(process.cwd(), 'intelligence', 'service.py');
    const child = execFile(
      getPythonExecutable(),
      ['-c', `
import sys, json, os
sys.path.insert(0, os.path.abspath('intelligence'))
from matching_engine import match_donation_to_ngos, calculate_urgency_score, analyze_surplus_history
data = json.loads(sys.stdin.read())
action = sys.argv[1]
if action == 'match':
    res = match_donation_to_ngos(data['donation'], data['ngos'], data.get('weights'), data.get('max_radius_km', 35.0))
elif action == 'urgency':
    res = calculate_urgency_score(data['collection_deadline'])
elif action == 'analytics':
    res = analyze_surplus_history(data['records'])
else:
    res = {'error': 'Unknown action'}
print(json.dumps(res))
`, scriptArgs[0]],
      { timeout: 3500 },
      (err, stdout, stderr) => {
        if (err) {
          return reject(err);
        }
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          reject(e);
        }
      }
    );

    child.stdin?.write(JSON.stringify(inputJson));
    child.stdin?.end();
  });
}

export class PythonClient {
  /**
   * Health check for intelligence service
   */
  public static async checkHealth(): Promise<{ status: string; service: string }> {
    return new Promise((resolve) => {
      try {
        const url = new URL('/health', PYTHON_SERVICE_URL);
        const req = http.get(
          {
            hostname: url.hostname,
            port: url.port || 8000,
            path: url.pathname,
            timeout: 1500,
          },
          (res) => {
            let body = '';
            res.on('data', (d) => (body += d));
            res.on('end', () => {
              try {
                resolve(JSON.parse(body));
              } catch {
                resolve({ status: 'degraded', service: 'shareplate-intelligence' });
              }
            });
          }
        );
        req.on('error', () => {
          resolve({ status: 'offline', service: 'shareplate-intelligence (fallback active)' });
        });
      } catch {
        resolve({ status: 'offline', service: 'shareplate-intelligence (fallback active)' });
      }
    });
  }

  /**
   * Match donation with eligible NGOs using rule-based algorithms
   */
  public static async matchDonation(
    listing: IFoodListing,
    ngos: IUser[]
  ): Promise<any> {
    const payload = {
      donation: {
        id: listing.id,
        category: listing.category,
        dietary: listing.dietary,
        quantity: listing.remainingQuantity,
        estimated_servings: listing.estimatedServings,
        collection_deadline: listing.collectionDeadline,
        latitude: listing.latitude,
        longitude: listing.longitude,
        require_verified_only: true,
      },
      ngos: ngos.map((n) => ({
        id: n.id,
        name: n.organizationName || n.name,
        latitude: n.latitude,
        longitude: n.longitude,
        is_verified: n.isVerified,
        daily_servings_capacity: n.dailyCapacityServings || 200,
        accepted_categories: n.acceptedCategories || [],
        dietary_preferences: n.dietaryPreferences || [],
        contact_person: n.name,
        phone: n.phone,
      })),
      max_radius_km: 40.0,
    };

    try {
      return await postJson('/match-donations', payload);
    } catch (httpErr) {
      console.warn('[PythonClient] HTTP POST /match-donations failed, falling back to direct Python script:', httpErr);
      return await runPythonFallback(['match'], payload);
    }
  }

  /**
   * Urgency scoring based on collection deadline
   */
  public static async scoreUrgency(deadlineIso: string): Promise<any> {
    const payload = { collection_deadline: deadlineIso };
    try {
      return await postJson('/score-urgency', payload);
    } catch (httpErr) {
      return await runPythonFallback(['urgency'], payload);
    }
  }

  /**
   * Surplus trend analytics
   */
  public static async getSurplusSummary(records: any[]): Promise<any> {
    const payload = { records };
    try {
      return await postJson('/analytics/surplus-summary', payload);
    } catch (httpErr) {
      return await runPythonFallback(['analytics'], payload);
    }
  }
}
