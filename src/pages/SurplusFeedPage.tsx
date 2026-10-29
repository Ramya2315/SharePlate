import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useToast } from '../contexts/ToastContext.tsx';
import { api } from '../services/api.ts';
import { FoodListing } from '../types/index.ts';
import { SafetyReportModal } from '../components/SafetyReportModal.tsx';
import {
  Search,
  MapPin,
  Clock,
  Building2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface SurplusFeedPageProps {
  setCurrentPage: (page: string) => void;
  selectedListingId?: string | null;
}

export const SurplusFeedPage: React.FC<SurplusFeedPageProps> = ({
  setCurrentPage,
  selectedListingId,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [listings, setListings] = useState<FoodListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [dietary, setDietary] = useState('All');

  const [activeReportListing, setActiveReportListing] = useState<FoodListing | null>(null);

  const fetchListings = async () => {
    try {
      const res = await api.getListings({
        category: category !== 'All' ? category : undefined,
        dietary: dietary !== 'All' ? dietary : undefined,
        search: search.trim() || undefined,
        status: 'available',
      });
      setListings(res.listings || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch surplus feed', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [category, dietary, search]);

  const handleActionClick = (listing: FoodListing) => {
    if (!user) {
      showToast('Please sign in or register as a verified NGO to request this donation', 'info');
      setCurrentPage('login');
    } else if (user.role === 'ngo') {
      setCurrentPage('ngo-dashboard');
    } else if (user.role === 'provider') {
      showToast('Food providers manage donations from the Provider Dashboard', 'info');
      setCurrentPage('provider-dashboard');
    } else {
      showToast('Volunteers can view active tasks in the Volunteer Dashboard', 'info');
      setCurrentPage('volunteer-dashboard');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold text-[#183B28] uppercase tracking-wider">
            Live Surplus Exchange
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">Available Food Donations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time surplus batches published by verified restaurants, hostels, caterers, and hotels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(user ? (user.role === 'provider' ? 'provider-dashboard' : 'ngo-dashboard') : 'register')}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#183B28] hover:bg-[#122c1e] rounded-xl transition-all shadow-xs"
          >
            {user?.role === 'provider' ? 'Publish Surplus Batch' : 'Request as NGO'}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by food item, description, donor, or location..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#183B28] bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="text-xs p-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#183B28]"
            >
              <option value="All">All Categories</option>
              <option value="Cooked Meals">Cooked Meals</option>
              <option value="Bakery & Bread">Bakery & Bread</option>
              <option value="Fresh Produce">Fresh Produce</option>
              <option value="Packaged Goods">Packaged Goods</option>
              <option value="Dairy & Refrigerated">Dairy & Refrigerated</option>
            </select>

            <select
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
              className="text-xs p-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#183B28]"
            >
              <option value="All">All Dietary</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Non-Vegetarian">Non-Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="Halal">Halal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((l) => (
          <div
            key={l.id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="h-48 bg-slate-100 relative overflow-hidden">
                <img
                  src={l.imageUrl || '/src/assets/images/hero_food_redistribution_1793275539454.jpg'}
                  alt={l.foodName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 bg-white/95 px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-800 shadow-xs">
                  {l.remainingQuantity} {l.unit} available
                </div>
                {l.urgency && (
                  <div
                    className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold shadow-xs ${
                      l.urgency.priority === 'CRITICAL'
                        ? 'bg-rose-600 text-white'
                        : l.urgency.priority === 'HIGH'
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {l.urgency.priority} · {l.urgency.hours_remaining}h left
                  </div>
                )}
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{l.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{l.dietary}</span>
                  <span aria-hidden="true">·</span>
                  <span>{l.storageCondition}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-1">
                  {l.foodName}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {l.description}
                </p>

                <div className="pt-2 text-xs text-slate-500 space-y-1.5 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 truncate">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700 truncate">{l.providerName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{l.pickupAddress}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Collect before {new Date(l.collectionDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 pt-0 flex items-center gap-2">
              <button
                onClick={() => handleActionClick(l)}
                className="flex-1 py-2 text-xs font-semibold text-center text-white bg-[#183B28] hover:bg-[#122c1e] rounded-xl transition-colors shadow-2xs"
              >
                Request This Surplus
              </button>
              <button
                onClick={() => setActiveReportListing(l)}
                title="Report concern"
                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {activeReportListing && (
        <SafetyReportModal
          entityType="listing"
          entityId={activeReportListing.id}
          entityTitle={activeReportListing.foodName}
          onClose={() => setActiveReportListing(null)}
        />
      )}
    </div>
  );
};
