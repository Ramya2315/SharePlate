import React, { useEffect, useState } from 'react';
import { api } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useToast } from '../contexts/ToastContext.tsx';
import { Restaurant } from '../types/index.ts';
import {
  Utensils,
  Plus,
  Search,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChefHat,
  Building,
  CheckCircle2,
  X,
  Navigation,
} from 'lucide-react';

interface RestaurantsPageProps {
  setCurrentPage: (page: string) => void;
  setSelectedListingId?: (id: string) => void;
}

const PRESET_PHOTOS = [
  {
    name: 'Artisanal Bakery & Bread',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Gourmet Buffet & Banquet',
    url: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Indian Curry & Biryani',
    url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Mediterranean Bowls',
    url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Campus Dining Trays',
    url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Organic Farm Salad',
    url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Italian Trattoria & Pasta',
    url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
  },
];

export const RestaurantsPage: React.FC<RestaurantsPageProps> = ({
  setCurrentPage,
  setSelectedListingId,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New restaurant registration form state
  const [form, setForm] = useState({
    name: '',
    tagline: '',
    cuisine: 'Bakery & Deli',
    organizationType: 'restaurant',
    photoUrl: PRESET_PHOTOS[0].url,
    address: '100 Montgomery Street, San Francisco, CA 94104',
    latitude: 37.7908,
    longitude: -122.4018,
    phone: '+1 (555) 789-0123',
    email: '',
    hygieneGrade: 'Grade A - ServSafe Certified',
    pickupHours: '15:00 - 21:00 Daily',
    dietaryOfferings: ['Vegetarian', 'Vegan'],
    description: '',
  });

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const res = await api.getRestaurants({
        search: searchQuery || undefined,
        cuisine: selectedCuisine !== 'All' ? selectedCuisine : undefined,
      });
      setRestaurants(res.restaurants || []);
    } catch (err: any) {
      console.error('Failed to load restaurants:', err);
      showToast(err.message || 'Failed to load restaurant directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, [selectedCuisine]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadRestaurants();
  };

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.cuisine || !form.address || !form.phone) {
      showToast('Please fill in restaurant name, cuisine, address, and phone number.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await api.createRestaurant(form);
      showToast(`${form.name} registered successfully!`, 'success');
      setIsModalOpen(false);
      setForm({
        name: '',
        tagline: '',
        cuisine: 'Bakery & Deli',
        organizationType: 'restaurant',
        photoUrl: PRESET_PHOTOS[0].url,
        address: '100 Montgomery Street, San Francisco, CA 94104',
        latitude: 37.7908,
        longitude: -122.4018,
        phone: '+1 (555) 789-0123',
        email: '',
        hygieneGrade: 'Grade A - ServSafe Certified',
        pickupHours: '15:00 - 21:00 Daily',
        dietaryOfferings: ['Vegetarian', 'Vegan'],
        description: '',
      });
      loadRestaurants();
    } catch (err: any) {
      showToast(err.message || 'Failed to register restaurant. Please try signing in.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const cuisines = [
    'All',
    'Bakery',
    'Banquet',
    'Indian',
    'Mediterranean',
    'Campus Kitchen',
    'Organic Salad',
    'Italian',
  ];

  return (
    <div className="space-y-12 pb-20">
      {/* Header Banner using user's uploaded banner styling */}
      <section className="relative bg-gradient-to-r from-emerald-900 via-[#183B28] to-emerald-950 text-white overflow-hidden py-14 sm:py-16">
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <img
            src="/assets/aistudio/Screenshot_2026-10-29_182405_3ecbc5c5.png"
            alt="RescueBite food recovery background"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-8 z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <ChefHat className="w-3.5 h-3.5" />
              <span>RescueBite Verified Food Donors Network</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Partner Restaurants & Commercial Kitchens
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
              Discover verified local restaurants, hotels, hostels, and caterers redirecting wholesome surplus food to non-profit shelters. Each donor operates under strict hygiene certification and cold-chain compliance.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-3 rounded-xl bg-white text-[#183B28] font-bold text-sm shadow-md hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>List Your Restaurant</span>
            </button>
            <button
              onClick={() => setCurrentPage('maps-agent')}
              className="px-5 py-3 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-white font-semibold text-sm border border-emerald-600 transition-all flex items-center justify-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              <span>Map Logistics</span>
            </button>
          </div>
        </div>
      </section>

      {/* Search and Filters Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search restaurants by name, cuisine, address, or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-24 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#183B28]/20 focus:border-[#183B28]"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#183B28] text-white rounded-lg text-xs font-semibold hover:bg-[#122c1e] transition-colors"
            >
              Search
            </button>
          </form>

          {/* Cuisine Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {cuisines.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCuisine(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCuisine === c
                    ? 'bg-[#183B28] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Directory Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 animate-pulse">
                <div className="h-48 bg-slate-200 rounded-xl"></div>
                <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                <div className="h-12 bg-slate-50 rounded"></div>
              </div>
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 max-w-xl mx-auto space-y-4">
            <Utensils className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">No restaurants match your filter</h3>
            <p className="text-xs text-slate-500">
              Try adjusting your search query or cuisine filter, or register a new restaurant partner below.
            </p>
            <button
              onClick={() => {
                setSelectedCuisine('All');
                setSearchQuery('');
                loadRestaurants();
              }}
              className="px-4 py-2 bg-emerald-50 text-[#183B28] text-xs font-semibold rounded-lg hover:bg-emerald-100"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((rest) => (
              <div
                key={rest.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Photo with Overlay Badges */}
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <img
                      src={rest.photoUrl}
                      alt={rest.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white/95 text-slate-800 shadow-sm flex items-center gap-1">
                        <Utensils className="w-3 h-3 text-[#183B28]" />
                        <span>{rest.cuisine}</span>
                      </span>
                      {rest.isVerified && (
                        <span className="px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-700 text-white shadow-sm flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Verified</span>
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 right-3">
                      {rest.activeSurplusCount > 0 ? (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-600 text-white shadow-sm flex items-center gap-1.5 animate-pulse">
                          <Sparkles className="w-3 h-3" />
                          <span>{rest.activeSurplusCount} Active Surplus</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-black/60 backdrop-blur-xs text-white">
                          Next batch scheduled
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#183B28] transition-colors leading-snug">
                          {rest.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
                          {rest.tagline || rest.cuisine}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-amber-800 text-xs font-bold shrink-0">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{rest.rating || 4.9}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {rest.description}
                    </p>

                    {/* Metadata Strip */}
                    <div className="pt-2 text-xs text-slate-500 space-y-1.5 border-t border-slate-100">
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{rest.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Pickup: {rest.pickupHours || '15:00 - 21:00 Daily'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{rest.phone}</span>
                      </div>
                    </div>

                    {/* Dietary Tags */}
                    {rest.dietaryOfferings && rest.dietaryOfferings.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {rest.dietaryOfferings.slice(0, 3).map((diet, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded"
                          >
                            {diet}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      if (setSelectedListingId && rest.liveListings && rest.liveListings.length > 0) {
                        setSelectedListingId(rest.liveListings[0].id);
                      }
                      setCurrentPage('feed');
                    }}
                    className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-[#183B28] text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>View Surplus</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setCurrentPage('maps-agent')}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Navigation className="w-3.5 h-3.5 text-slate-500" />
                    <span>Route & ETA</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#183B28] flex items-center justify-center font-bold">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">List Your Restaurant / Kitchen</h3>
                  <p className="text-xs text-slate-500">Join RescueBite food redistribution network</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRestaurant} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Restaurant / Business Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sourdough & Herb Cafe"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#183B28]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cuisine / Food Category *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Italian Trattoria, Continental, Bakery"
                    value={form.cuisine}
                    onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#183B28]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tagline / Mission</label>
                <input
                  type="text"
                  placeholder="e.g. Artisanal woodfired sourdough and fresh daily salads"
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#183B28]"
                />
              </div>

              {/* Photo Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Cover Photo or Enter URL *</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
                  {PRESET_PHOTOS.slice(0, 4).map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setForm({ ...form, photoUrl: p.url })}
                      className={`relative rounded-xl overflow-hidden h-16 border-2 transition-all ${
                        form.photoUrl === p.url ? 'border-[#183B28] ring-2 ring-[#183B28]/20' : 'border-transparent'
                      }`}
                    >
                      <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                      {form.photoUrl === p.url && (
                        <div className="absolute inset-0 bg-[#183B28]/30 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  placeholder="Or paste an image URL (https://...)"
                  value={form.photoUrl}
                  onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#183B28]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Physical Street Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 150 Powell St, San Francisco, CA"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#183B28]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#183B28]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hygiene Certification</label>
                  <input
                    type="text"
                    placeholder="e.g. Grade A - ServSafe Certified"
                    value={form.hygieneGrade}
                    onChange={(e) => setForm({ ...form, hygieneGrade: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#183B28]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Surplus Pickup Windows</label>
                  <input
                    type="text"
                    placeholder="e.g. 15:00 - 21:00 Daily"
                    value={form.pickupHours}
                    onChange={(e) => setForm({ ...form, pickupHours: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#183B28]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description & Food Rescue Commitment</label>
                <textarea
                  rows={3}
                  placeholder="Describe your kitchen, daily preparations, packaging standards, and types of surplus food..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#183B28]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#183B28] hover:bg-[#122c1e] text-white font-bold transition-all shadow-sm flex items-center gap-2"
                >
                  {submitting ? 'Registering...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
