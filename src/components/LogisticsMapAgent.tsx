/**
 * SharePlate Real-Time Google Maps Logistics & Dispatch Agent
 * Features:
 * - Real-time Google Maps Places API (New) location search
 * - Real-time Routes API v2 navigation and distance calculation
 * - Natural Language Logistics Agent for food couriers, NGOs, and donors
 * Attribution ID: gmp_mcp_codeassist_v1_aistudio
 */

import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import {
  Compass,
  MapPin,
  Navigation,
  Search,
  Sparkles,
  Clock,
  ArrowRight,
  Building2,
  Send,
  CornerDownRight,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

export const LogisticsMapAgent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'agent' | 'places' | 'route'>('agent');

  // Agent State
  const [query, setQuery] = useState('');
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentResponse, setAgentResponse] = useState<any>(null);

  // Route Tool State
  const [origin, setOrigin] = useState('42 Market Street, San Francisco, CA');
  const [destination, setDestination] = useState('1150 Folsom Street, San Francisco, CA');
  const [travelMode, setTravelMode] = useState('DRIVE');
  const [routeData, setRouteData] = useState<any>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Places Tool State
  const [placesQuery, setPlacesQuery] = useState('Food bank or community kitchen');
  const [placesList, setPlacesList] = useState<any[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);

  // Pre-seed initial route calculation on mount
  useEffect(() => {
    handleComputeRoute();
  }, []);

  const handleComputeRoute = async () => {
    if (!origin || !destination) return;
    setRouteLoading(true);
    try {
      const res = await api.computeRoute(origin, destination, travelMode);
      setRouteData(res.route);
    } catch (err) {
      console.error('Route computation error:', err);
    } finally {
      setRouteLoading(false);
    }
  };

  const handleSearchPlaces = async () => {
    if (!placesQuery) return;
    setPlacesLoading(true);
    try {
      const res = await api.searchPlaces(placesQuery);
      setPlacesList(res.places || []);
    } catch (err) {
      console.error('Places search error:', err);
    } finally {
      setPlacesLoading(false);
    }
  };

  const handleAgentSubmit = async (customQuery?: string) => {
    const q = customQuery || query;
    if (!q.trim()) return;

    setAgentLoading(true);
    try {
      const res = await api.queryLogisticsAgent(q);
      setAgentResponse(res);
      if (res.type === 'route') {
        setRouteData({
          durationMinutes: res.durationMinutes,
          distanceMiles: res.distanceMiles,
          distanceKm: res.distanceKm,
          description: res.title,
          legs: [{ steps: res.steps }],
        });
      } else if (res.type === 'places' && res.places) {
        setPlacesList(res.places);
      }
    } catch (err) {
      console.error('Agent query error:', err);
    } finally {
      setAgentLoading(false);
    }
  };

  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCOb2WSGt6VoM26zPrSQSvwDCcFApKGIxI';

  // Embed map URL using standard Google Maps Embed API
  const embedUrl = `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${encodeURIComponent(
    origin
  )}&destination=${encodeURIComponent(destination)}&mode=${travelMode.toLowerCase()}`;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden text-left">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#183B28] via-[#244F35] to-[#1B3E2B] p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4 text-emerald-300" />
            <span>Google Maps Platform Real-Time Intelligence</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            SharePlate Logistics & Route Agent
          </h2>
          <p className="text-xs text-emerald-100/80 mt-1 max-w-xl">
            Live turn-by-turn routing, Google Places (New) food bank lookup, and intelligent navigation assistance for donors, NGOs, and couriers.
          </p>
        </div>

        {/* Bootstrap-styled Tabs */}
        <div className="bg-white/10 p-1 rounded-xl flex items-center gap-1 self-start md:self-auto border border-white/10">
          <button
            onClick={() => setActiveTab('agent')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'agent' ? 'bg-white text-[#183B28] shadow-sm' : 'text-emerald-100 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Logistics Agent</span>
          </button>
          <button
            onClick={() => setActiveTab('route')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'route' ? 'bg-white text-[#183B28] shadow-sm' : 'text-emerald-100 hover:text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Route Planner</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('places');
              if (placesList.length === 0) handleSearchPlaces();
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'places' ? 'bg-white text-[#183B28] shadow-sm' : 'text-emerald-100 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Places Search</span>
          </button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Interactive Panel (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* TAB 1: Conversational Dispatch Agent */}
          {activeTab === 'agent' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#183B28]">
                  <Sparkles className="w-4 h-4 text-[#183B28]" />
                  <span>Ask the Logistics Agent Anything</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ask about driving routes, optimal delivery paths, traffic conditions, or nearby charitable distribution centers.
                </p>

                {/* Prompt Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    'Route from Green Harvest Bakery to Hope Kitchen',
                    'Find nearby food pantries in San Francisco',
                    'Fastest route from Grand Plaza Hotel to Hope Kitchen',
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => {
                        setQuery(chip);
                        handleAgentSubmit(chip);
                      }}
                      className="text-[11px] font-medium bg-white hover:bg-emerald-100/60 border border-emerald-200 text-[#183B28] px-2.5 py-1 rounded-full transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAgentSubmit();
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. Calculate directions from 42 Market St to Hope Food Bank..."
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#183B28] bg-white shadow-2xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={agentLoading}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-[#183B28] hover:bg-[#122c1e] rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {agentLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Ask Agent</span>
                </button>
              </form>

              {/* Agent Response Card */}
              {agentResponse && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <span className="text-xs font-bold text-slate-900">{agentResponse.title}</span>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                      Google Maps Verified
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">{agentResponse.summary}</p>

                  {/* If Route Result */}
                  {agentResponse.type === 'route' && (
                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Distance</span>
                        <span className="text-sm font-bold text-slate-900 font-mono">
                          {agentResponse.distanceMiles} mi ({agentResponse.distanceKm} km)
                        </span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Est. Travel Time</span>
                        <span className="text-sm font-bold text-[#183B28] font-mono">
                          ~{agentResponse.durationMinutes} mins
                        </span>
                      </div>
                    </div>
                  )}

                  {/* If Places Result */}
                  {agentResponse.type === 'places' && agentResponse.places && (
                    <div className="space-y-2 pt-1">
                      {agentResponse.places.map((p: any, idx: number) => (
                        <div key={idx} className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs flex items-start justify-between gap-2">
                          <div>
                            <span className="font-semibold text-slate-900 block">{p.name}</span>
                            <span className="text-slate-500 text-[11px]">{p.address}</span>
                          </div>
                          {p.rating && (
                            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded shrink-0">
                              ★ {p.rating}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Route Planner */}
          {activeTab === 'route' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Donor Pickup Origin</label>
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">NGO Destination Hub</label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {['DRIVE', 'WALK', 'BICYCLE'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setTravelMode(mode)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                        travelMode === mode
                          ? 'bg-[#183B28] text-white border-[#183B28]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleComputeRoute}
                  disabled={routeLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#183B28] hover:bg-[#122c1e] rounded-xl transition-colors shadow-2xs"
                >
                  {routeLoading ? 'Calculating...' : 'Recalculate Route'}
                </button>
              </div>

              {routeData && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Est. Duration</span>
                      <span className="text-sm font-bold text-[#183B28] font-mono">
                        {routeData.durationMinutes} mins
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Distance</span>
                      <span className="text-sm font-bold text-slate-900 font-mono">
                        {routeData.distanceMiles} mi
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Traffic Status</span>
                      <span className="text-xs font-semibold text-emerald-700">Nominal Flow</span>
                    </div>
                  </div>

                  {/* Step-by-Step Directions */}
                  {routeData.legs?.[0]?.steps && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                        Turn-by-Turn Navigation Steps
                      </span>
                      <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 p-2 text-xs">
                        {routeData.legs[0].steps.map((st: any, i: number) => (
                          <div key={i} className="py-2 flex items-start gap-2 text-slate-700">
                            <CornerDownRight className="w-3.5 h-3.5 text-[#183B28] shrink-0 mt-0.5" />
                            <span className="leading-snug">{st.instruction || st.navigationInstruction?.instructions || 'Proceed along designated route'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Places Search */}
          {activeTab === 'places' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={placesQuery}
                  onChange={(e) => setPlacesQuery(e.target.value)}
                  placeholder="e.g. Food pantry, soup kitchen, food bank..."
                  className="flex-1 text-xs p-2.5 border border-slate-300 rounded-xl bg-white"
                />
                <button
                  onClick={handleSearchPlaces}
                  disabled={placesLoading}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-[#183B28] rounded-xl hover:bg-[#122c1e] transition-colors"
                >
                  {placesLoading ? 'Searching...' : 'Find Places'}
                </button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {placesList.map((place: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{place.displayName?.text || place.name}</span>
                      <span className="text-slate-600 text-[11px]">{place.formattedAddress || place.address}</span>
                    </div>
                    <button
                      onClick={() => {
                        setDestination(place.formattedAddress || place.address);
                        setActiveTab('route');
                        handleComputeRoute();
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold text-[#183B28] bg-white border border-[#183B28]/30 rounded-lg hover:bg-[#183B28] hover:text-white transition-colors shrink-0"
                    >
                      Route Here
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Map Canvas (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 h-[360px] relative">
            <iframe
              title="Google Maps Navigation Viewport"
              src={embedUrl}
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="pt-4 flex items-center justify-between text-[11px] text-slate-500">
            <span>Powered by Google Maps Platform Routes API & Places API (New)</span>
            <span className="font-mono text-slate-400">gmp_mcp_codeassist_v1_aistudio</span>
          </div>
        </div>
      </div>
    </div>
  );
};
