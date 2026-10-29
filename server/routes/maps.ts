/**
 * Real-Time Google Maps Integration & Dispatch Agent Routes
 * Handles Places API (New), Routes API v2, Geocoding, and conversational routing queries.
 * Attribution ID: gmp_mcp_codeassist_v1_aistudio
 */

import { Router, Request, Response } from 'express';
import { db } from '../db/database.ts';

const router = Router();
const API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '';
const ATTRIBUTION_ID = 'gmp_mcp_codeassist_v1_aistudio';

// 1. Places Search (Places API New)
router.post('/places/search', async (req: Request, res: Response) => {
  const { query, locationBias, includedType } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const url = 'https://places.googleapis.com/v1/places:searchText';
    const bodyPayload: any = {
      textQuery: query,
      maxResultCount: 8,
    };

    if (includedType) {
      bodyPayload.includedType = includedType;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.types',
        'X-Goog-Maps-Solution-ID': ATTRIBUTION_ID,
      },
      body: JSON.stringify(bodyPayload),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Places API error', details: data });
    }

    res.json({ places: data.places || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to search places' });
  }
});

// 2. Compute Routes (Routes API v2)
router.post('/routes/compute', async (req: Request, res: Response) => {
  const { origin, destination, travelMode = 'DRIVE', avoidTolls = false } = req.body;

  if (!origin || !destination) {
    return res.status(400).json({ error: 'Origin and destination are required' });
  }

  try {
    const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';

    // Format origin and destination
    const formatWaypoint = (wp: any) => {
      if (typeof wp === 'string') {
        return { address: wp };
      }
      if (wp.lat !== undefined && wp.lng !== undefined) {
        return { location: { latLng: { latitude: wp.lat, longitude: wp.lng } } };
      }
      if (wp.latitude !== undefined && wp.longitude !== undefined) {
        return { location: { latLng: { latitude: wp.latitude, longitude: wp.longitude } } };
      }
      return { address: String(wp) };
    };

    const payload: any = {
      origin: formatWaypoint(origin),
      destination: formatWaypoint(destination),
      travelMode: travelMode === 'BICYCLE' ? 'BICYCLE' : travelMode === 'WALK' ? 'WALK' : 'DRIVE',
      routingPreference: travelMode === 'DRIVE' ? 'TRAFFIC_AWARE' : undefined,
      computeAlternativeRoutes: false,
      internalUsageAttributionIds: [ATTRIBUTION_ID],
    };

    if (avoidTolls) {
      payload.routeModifiers = { avoidTolls: true };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask':
          'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs,routes.description',
        'X-Goog-Maps-Solution-ID': ATTRIBUTION_ID,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Routes API error', details: data });
    }

    const route = data.routes?.[0];
    if (!route) {
      return res.json({ route: null, message: 'No route found between points' });
    }

    // Convert duration (e.g. "840s") and distance (meters) into friendly units
    const seconds = parseInt(route.duration?.replace('s', '') || '0', 10);
    const distanceMeters = route.distanceMeters || 0;
    const minutes = Math.round(seconds / 60);
    const distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;
    const distanceMiles = Math.round((distanceMeters / 1609.34) * 10) / 10;

    res.json({
      route: {
        ...route,
        durationMinutes: minutes,
        distanceKm,
        distanceMiles,
        legs: route.legs || [],
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to compute route' });
  }
});

// 3. Geocoding
router.post('/geocode', async (req: Request, res: Response) => {
  const { address } = req.body;
  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results?.length) {
      return res.status(404).json({ error: 'Location not found', status: data.status });
    }

    const result = data.results[0];
    res.json({
      location: result.geometry.location,
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Geocoding failed' });
  }
});

// 4. Logistics & Route Dispatch Agent
router.post('/agent/query', async (req: Request, res: Response) => {
  const { query, taskId } = req.body;
  if (!query && !taskId) {
    return res.status(400).json({ error: 'Query or taskId is required' });
  }

  try {
    const userPrompt = (query || '').toLowerCase();

    // Check if query is about a specific pickup task or task ID provided
    let origin = '42 Market Street, San Francisco, CA';
    let destination = '1150 Folsom Street, San Francisco, CA';
    let contextTitle = 'Food Redistribution Route';

    if (taskId) {
      const task = db.pickups.findById(taskId);
      if (task) {
        origin = task.providerAddress;
        destination = task.destinationAddress;
        contextTitle = `Route for ${task.foodName} (${task.providerName} → ${task.ngoName})`;
      }
    } else if (userPrompt.includes('green harvest') && userPrompt.includes('hope')) {
      origin = '42 Market Street, San Francisco, CA';
      destination = '1150 Folsom Street, San Francisco, CA';
      contextTitle = 'Green Harvest Bakery to Hope Community Kitchen';
    } else if (userPrompt.includes('grand plaza')) {
      origin = '780 Mission Street, San Francisco, CA';
      destination = '1150 Folsom Street, San Francisco, CA';
      contextTitle = 'Grand Plaza Hotel to Hope Community Kitchen';
    }

    // Check if query is searching for places (e.g. "find nearby food banks", "food pantries")
    if (userPrompt.includes('find') || userPrompt.includes('search') || userPrompt.includes('pantry') || userPrompt.includes('kitchen') || userPrompt.includes('shelter')) {
      const searchTerm = query.replace(/find|search|where|is|are|nearby|locate/gi, '').trim() || 'food bank community kitchen';
      const placesUrl = 'https://places.googleapis.com/v1/places:searchText';

      const pRes = await fetch(placesUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': API_KEY,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.rating,places.types',
          'X-Goog-Maps-Solution-ID': ATTRIBUTION_ID,
        },
        body: JSON.stringify({
          textQuery: searchTerm + ' San Francisco CA',
          maxResultCount: 5,
        }),
      });

      const pData = await pRes.json();
      const places = pData.places || [];

      return res.json({
        type: 'places',
        title: `Places Found: "${searchTerm}"`,
        summary: `The Logistics Agent queried Google Places API (New) and found ${places.length} matching locations in the service radius.`,
        places: places.map((p: any) => ({
          name: p.displayName?.text || 'Location',
          address: p.formattedAddress,
          rating: p.rating,
          location: p.location,
          types: p.types,
        })),
      });
    }

    // Otherwise compute real-time route between origin and destination
    const routesUrl = 'https://routes.googleapis.com/directions/v2:computeRoutes';
    const rRes = await fetch(routesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask':
          'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs,routes.description',
        'X-Goog-Maps-Solution-ID': ATTRIBUTION_ID,
      },
      body: JSON.stringify({
        origin: { address: origin },
        destination: { address: destination },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        internalUsageAttributionIds: [ATTRIBUTION_ID],
      }),
    });

    const rData = await rRes.json();
    const route = rData.routes?.[0];

    if (!route) {
      return res.json({
        type: 'error',
        message: 'Could not calculate navigation route for specified endpoints.',
      });
    }

    const durationSeconds = parseInt(route.duration?.replace('s', '') || '0', 10);
    const distanceMeters = route.distanceMeters || 0;
    const durationMinutes = Math.round(durationSeconds / 60);
    const distanceMiles = Math.round((distanceMeters / 1609.34) * 10) / 10;
    const distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;

    // Extract turn-by-turn steps if available
    const steps = (route.legs?.[0]?.steps || []).map((s: any) => ({
      instruction: s.navigationInstruction?.instructions || 'Continue on route',
      distance: s.distanceMeters ? `${Math.round(s.distanceMeters)}m` : '',
    }));

    res.json({
      type: 'route',
      title: contextTitle,
      origin,
      destination,
      durationMinutes,
      distanceMiles,
      distanceKm,
      steps: steps.length > 0 ? steps : [
        { instruction: `Depart from ${origin}` },
        { instruction: `Head south towards central corridor (traffic nominal)` },
        { instruction: `Arrive at destination: ${destination}` },
      ],
      summary: `Real-time navigation via Google Routes API: ${distanceMiles} miles (~${durationMinutes} mins) in current traffic.`,
      encodedPolyline: route.polyline?.encodedPolyline,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Agent processing failed' });
  }
});

export default router;
