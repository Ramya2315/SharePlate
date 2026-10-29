import React, { useEffect, useState } from 'react';
import { api } from '../services/api.ts';
import { FoodListing, PlatformAnalytics, Restaurant } from '../types/index.ts';
import {
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  MapPin,
  Utensils,
  Leaf,
  Users,
  CheckCircle,
  Star,
  ChefHat,
  Building,
  Heart,
  Navigation,
} from 'lucide-react';

interface LandingPageProps {
  setCurrentPage: (page: string) => void;
  setSelectedListingId?: (id: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  setCurrentPage,
  setSelectedListingId,
}) => {
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [listingsRes, analyticsRes, restaurantsRes] = await Promise.all([
          api.getListings({ status: 'available' }),
          api.getDashboardAnalytics(),
          api.getRestaurants(),
        ]);
        setListings(listingsRes.listings?.slice(0, 3) || []);
        setAnalytics(analyticsRes);
        setRestaurants(restaurantsRes.restaurants?.slice(0, 4) || []);
      } catch (err) {
        console.error('Error fetching landing data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section Featuring RescueBite Banner Graphic */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 sm:pt-10">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-emerald-900/10 bg-[#EBF4EC]">
          {/* Main Visual Banner Graphic from User Upload - Displayed Cleanly Without Text Overlays */}
          <div className="relative w-full overflow-hidden bg-white">
            <img
              src="/assets/aistudio/Screenshot_2026-10-29_182253_fb725c62.png"
              alt="RescueBite — Share Food. Reduce Waste. Fight Hunger."
              className="w-full h-auto object-contain block mx-auto"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Quick Action Ribbon Under the Banner Graphic */}
          <div className="bg-[#183B28] text-white px-6 py-4 sm:px-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs sm:text-sm font-medium text-emerald-100">
                RescueBite Real-Time Food Redistribution Network
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setCurrentPage('restaurants')}
                className="px-5 py-2.5 text-xs sm:text-sm font-bold text-[#183B28] bg-white hover:bg-emerald-50 rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                <Utensils className="w-4 h-4" />
                <span>Explore Partner Restaurants</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage('feed')}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-600 rounded-xl transition-all shadow-sm flex items-center gap-2 border border-emerald-500/40"
              >
                <span>Claim Surplus Food</span>
              </button>
              <button
                onClick={() => setCurrentPage('maps-agent')}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-emerald-100 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/20 flex items-center gap-2"
              >
                <Navigation className="w-4 h-4 text-emerald-300" />
                <span>Live Map Dispatch</span>
              </button>
            </div>
          </div>

          {/* Three Core Action Pillars from Graphic */}
          <div className="bg-white border-t border-emerald-100 p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/80">
              <div className="w-12 h-12 rounded-xl bg-[#183B28] text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                <Utensils className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Donate Surplus Food</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Commercial kitchens list safe, wholesome prepared dishes, baked goods, and produce in under 60 seconds.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/80">
              <div className="w-12 h-12 rounded-xl bg-[#183B28] text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Get Matched with NGOs</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Our rule-based engine routes urgent portions to verified shelters within safe proximity and temperature windows.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/80">
              <div className="w-12 h-12 rounded-xl bg-[#183B28] text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Create Bigger Impact</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Real-time environmental reporting tracking greenhouse emissions avoided and nutritious meals provided.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Partner Restaurants Section (User requested: list restaurants with photos & everything) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#183B28] uppercase tracking-wider">
              <ChefHat className="w-4 h-4" />
              <span>Verified Food Donors</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Partner Restaurants & Commercial Kitchens
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Certified food businesses committed to zero food waste and community nourishment.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage('restaurants')}
              className="px-4 py-2 text-xs font-bold text-white bg-[#183B28] hover:bg-[#122c1e] rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>View All Restaurants</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {restaurants.map((rest) => (
            <div
              key={rest.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div>
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <img
                    src={rest.photoUrl}
                    alt={rest.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-800 shadow-xs flex items-center gap-1">
                    <Utensils className="w-3 h-3 text-[#183B28]" />
                    <span>{rest.cuisine}</span>
                  </div>
                  {rest.activeSurplusCount > 0 && (
                    <div className="absolute bottom-2.5 right-2.5 bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-xs">
                      {rest.activeSurplusCount} Active Surplus
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-1.5">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#183B28] transition-colors leading-snug line-clamp-1">
                      {rest.name}
                    </h3>
                    <div className="flex items-center gap-0.5 text-amber-600 text-xs font-bold shrink-0">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{rest.rating || 4.9}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {rest.tagline || rest.description}
                  </p>

                  <div className="pt-2 text-[11px] text-slate-500 space-y-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{rest.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="text-emerald-800 font-medium truncate">{rest.hygieneGrade}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  onClick={() => setCurrentPage('restaurants')}
                  className="w-full py-2 text-xs font-bold text-center text-[#183B28] bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
                >
                  View Restaurant Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission Graphic Banner from 2nd User Upload */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="relative rounded-3xl overflow-hidden shadow-xl border border-emerald-200/60 bg-[#F4F9F4]">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
            <div className="lg:col-span-5 p-8 sm:p-12 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Good Food Deserves a Second Chance</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Less Food Waste, More Smiles.
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every evening, thousands of wholesome meals are packaged, inspected, and transported from restaurant kitchens to community shelters. We coordinate the entire chain with real-time route optimization and QR-verified delivery tokens.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={() => setCurrentPage('feed')}
                  className="px-5 py-2.5 rounded-xl bg-[#183B28] hover:bg-[#122c1e] text-white font-bold text-xs shadow-sm flex items-center gap-2"
                >
                  <span>Browse Available Food</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage('how-it-works')}
                  className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs"
                >
                  How Distribution Works
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 h-full min-h-[320px] relative overflow-hidden bg-white/40">
              <img
                src="/assets/aistudio/Screenshot_2026-10-29_182405_3ecbc5c5.png"
                alt="Good Food Deserves a Second Chance — RescueBite Flow"
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Live Surplus Listings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-semibold text-[#183B28] uppercase tracking-wider">
              Immediate Food Rescue
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">Available Food Surplus Near You</h2>
          </div>
          <button
            onClick={() => setCurrentPage('feed')}
            className="text-xs font-semibold text-[#183B28] hover:underline flex items-center gap-1"
          >
            <span>View All Surplus Listings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {listings.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="h-44 bg-slate-100 relative overflow-hidden">
                  <img
                    src={item.imageUrl || '/src/assets/images/safety_inspected_meals_1793275541061.jpg'}
                    alt={item.foodName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 bg-white/95 px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-800 shadow-xs">
                    {item.remainingQuantity} {item.unit} available
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{item.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.dietary}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-1">
                    {item.foodName}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="pt-2 text-xs text-slate-500 space-y-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.pickupAddress}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Collect before {new Date(item.collectionDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <button
                  onClick={() => {
                    if (setSelectedListingId) setSelectedListingId(item.id);
                    setCurrentPage('feed');
                  }}
                  className="w-full py-2.5 text-xs font-semibold text-center text-[#183B28] bg-emerald-50 hover:bg-emerald-100/80 rounded-xl transition-colors"
                >
                  View Details & Request
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Real-time Google Maps Logistics Agent Section (Bootstrap + Tailwind) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="card shadow-lg border-0 overflow-hidden rounded-3xl bg-slate-900 text-white relative">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <img
              src="/src/assets/images/volunteer_pickup_electric_van_1793275542861.jpg"
              alt="Food dispatch and distribution logistics van"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="relative p-8 sm:p-12 lg:p-14 z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-pill text-xs font-semibold">
                  Google Maps Platform Integrated
                </span>
                <span className="badge bg-white/10 text-slate-200 px-3 py-1.5 rounded-pill text-xs font-medium">
                  Places (New) + Routes v2 + Geocoding
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Real-Time Google Maps Logistics & Dispatch Agent
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                Experience seamless cold-chain redistribution with live ETA computations, turn-by-turn routing steps, and verified shelter lookups powered by Google Maps Platform. Ask our conversational dispatch agent to evaluate food bank distances, find optimal collection routes, or calculate safe travel windows.
              </p>
              <div className="d-flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => setCurrentPage('maps-agent')}
                  className="btn btn-success d-inline-flex align-items-center gap-2 px-4 py-2.5 rounded-xl font-semibold shadow-sm text-sm"
                  style={{ backgroundColor: '#10b981', borderColor: '#059669' }}
                >
                  <MapPin className="w-4 h-4" />
                  <span>Launch Logistics Map Agent</span>
                  <ArrowRight className="w-4 h-4 ms-1" />
                </button>
                <button
                  onClick={() => setCurrentPage('login')}
                  className="btn btn-outline-light px-4 py-2.5 rounded-xl font-semibold text-sm"
                >
                  Sign In to Dispatch
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-5 shadow-inner space-y-4">
                <div className="d-flex align-items-center justify-between pb-3 border-bottom border-slate-700">
                  <div className="d-flex align-items-center gap-2">
                    <div className="w-3 h-3 rounded-circle bg-emerald-400 animate-pulse"></div>
                    <span className="text-xs font-bold tracking-wide uppercase text-slate-200">Live Dispatch Assistant</span>
                  </div>
                  <span className="badge bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">Real-time API</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-slate-300">
                    <p className="font-semibold text-white mb-1">“Calculate transit time from Green Harvest Bakery to Hope Shelter”</p>
                    <p className="text-emerald-400 text-[11px] mb-0">Routes v2: 6.8 km · 14 mins · 5 turn-by-turn waypoints computed</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-slate-300">
                    <p className="font-semibold text-white mb-1">“Find verified food banks and soup kitchens in Downtown”</p>
                    <p className="text-emerald-400 text-[11px] mb-0">Places New: Real-time ratings, formatted addresses & coordinates</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Environmental & Community Impact Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="bg-[#183B28] text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="max-w-2xl space-y-4">
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
              Quantifiable Impact
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-balance">
              Transforming edible surplus into community resilience
            </h2>
            <p className="text-sm text-emerald-100/80 leading-relaxed">
              Every completed donation is recorded with transparent environmental accounting. We use EPA/FAO emissions models where 1 kg of avoided food waste directly prevents 2.5 kg of greenhouse gases.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-10 mt-8 border-t border-emerald-800">
            <div>
              <span className="block text-3xl font-extrabold tabular-nums">
                {analytics?.metrics.totalKgRescued || '1,280'} kg
              </span>
              <span className="text-xs text-emerald-200/80">Fresh Food Rescued</span>
            </div>
            <div>
              <span className="block text-3xl font-extrabold tabular-nums">
                {analytics?.metrics.totalServings || '2,560'}
              </span>
              <span className="text-xs text-emerald-200/80">Wholesome Meals</span>
            </div>
            <div>
              <span className="block text-3xl font-extrabold tabular-nums">
                {analytics?.metrics.totalCo2eAvoidedKg || '3,200'} kg
              </span>
              <span className="text-xs text-emerald-200/80">CO₂e Emissions Prevented</span>
            </div>
            <div>
              <span className="block text-3xl font-extrabold tabular-nums">
                {analytics?.metrics.pickupSuccessRate || '100'}%
              </span>
              <span className="text-xs text-emerald-200/80">Verified Handover Rate</span>
            </div>
          </div>
        </div>
      </section>

      {/* Dual CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Ready to prevent edible food from reaching landfills?
        </h2>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Sign up as a restaurant or food donor, verified NGO distribution partner, or volunteer courier today.
        </p>
        <div className="pt-2 flex justify-center gap-4">
          <button
            onClick={() => setCurrentPage('register')}
            className="px-6 py-3 text-xs font-semibold text-white bg-[#183B28] hover:bg-[#122c1e] rounded-xl transition-all shadow-xs"
          >
            Create Your Account
          </button>
          <button
            onClick={() => setCurrentPage('restaurants')}
            className="px-6 py-3 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all"
          >
            Explore Partner Restaurants
          </button>
        </div>
      </section>
    </div>
  );
};
