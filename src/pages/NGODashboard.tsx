import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useToast } from '../contexts/ToastContext.tsx';
import { api } from '../services/api.ts';
import { FoodListing, DonationRequest } from '../types/index.ts';
import { SafetyReportModal } from '../components/SafetyReportModal.tsx';
import {
  Search,
  Filter,
  Clock,
  MapPin,
  Sparkles,
  ShieldCheck,
  Building2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Info,
} from 'lucide-react';

interface NGODashboardProps {
  initialListingId?: string | null;
}

export const NGODashboard: React.FC<NGODashboardProps> = ({ initialListingId }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [listings, setListings] = useState<FoodListing[]>([]);
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDietary, setSelectedDietary] = useState('All');

  // Request Modal
  const [selectedListing, setSelectedListing] = useState<FoodListing | null>(null);
  const [requestedQty, setRequestedQty] = useState('10');
  const [pickupNotes, setPickupNotes] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Safety Report Modal
  const [safetyReportTarget, setSafetyReportTarget] = useState<FoodListing | null>(null);

  // Python Recommendations
  const [matchingRecommendations, setMatchingRecommendations] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const categories = ['All', 'Cooked Meals', 'Bakery & Bread', 'Fresh Produce', 'Packaged Goods', 'Dairy & Refrigerated'];
  const dietaryOptions = ['All', 'Vegetarian', 'Non-Vegetarian', 'Vegan', 'Halal'];

  const refreshData = async () => {
    try {
      const [listRes, reqRes] = await Promise.all([
        api.getListings({
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          dietary: selectedDietary !== 'All' ? selectedDietary : undefined,
          search: search.trim() || undefined,
        }),
        api.getRequests(),
      ]);
      setListings(listRes.listings || []);
      setRequests(reqRes.requests || []);

      if (initialListingId && listRes.listings) {
        const match = listRes.listings.find((l: FoodListing) => l.id === initialListingId);
        if (match) setSelectedListing(match);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch food catalog', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [selectedCategory, selectedDietary, search]);

  // Request Python intelligence matching recommendations when user opens first available listing
  const fetchMatchingForListing = async (listingId: string) => {
    setLoadingRecommendations(true);
    try {
      const res = await api.getMatchRecommendations(listingId);
      if (res.matches) {
        setMatchingRecommendations(res.matches);
      }
    } catch (err) {
      console.warn('Matching service fallback:', err);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleOpenListing = (listing: FoodListing) => {
    setSelectedListing(listing);
    setRequestedQty(String(Math.min(listing.remainingQuantity, 15)));
    fetchMatchingForListing(listing.id);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing) return;

    if (!user?.isVerified) {
      showToast('Your organization verification is pending review. Requests will be unlocked upon approval.', 'error');
      return;
    }

    const qty = parseFloat(requestedQty);
    if (isNaN(qty) || qty <= 0) {
      showToast('Please specify a valid quantity greater than zero', 'error');
      return;
    }

    if (qty > selectedListing.remainingQuantity) {
      showToast(`Cannot request more than remaining available (${selectedListing.remainingQuantity} ${selectedListing.unit})`, 'error');
      return;
    }

    setSubmittingRequest(true);
    try {
      await api.createRequest({
        listingId: selectedListing.id,
        requestedQuantity: qty,
        pickupNotes,
      });

      showToast(`Donation request for ${qty} ${selectedListing.unit} sent to ${selectedListing.providerName}!`, 'success');
      setSelectedListing(null);
      setPickupNotes('');
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit donation request', 'error');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this donation request?')) return;
    try {
      await api.cancelRequest(requestId);
      showToast('Donation request cancelled.', 'info');
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel request', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>NGO Distribution Hub</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-[#183B28]">{user?.organizationName || user?.name}</span>
            {user?.isVerified ? (
              <span className="text-emerald-700 font-medium">· Verified 501(c)(3)</span>
            ) : (
              <span className="text-amber-600 font-semibold">· Verification Pending</span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Surplus Food Rescue Catalogue</h1>
        </div>

        {!user?.isVerified && (
          <div className="bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl text-xs text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Organization verification under admin review. Approvals unlock live claiming.</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by food name, ingredient, restaurant, or location..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#183B28] bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs p-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#183B28]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
              ))}
            </select>

            <select
              value={selectedDietary}
              onChange={(e) => setSelectedDietary(e.target.value)}
              className="text-xs p-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#183B28]"
            >
              {dietaryOptions.map((d) => (
                <option key={d} value={d}>{d === 'All' ? 'All Dietary' : d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Available Food Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Available Surplus Meals ({listings.length})
          </h2>
          <span className="text-xs text-slate-500">Sorted by time urgency</span>
        </div>

        {listings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400 space-y-2">
            <p>No food listings currently match your selected filters.</p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedDietary('All');
                setSearch('');
              }}
              className="text-[#183B28] font-semibold hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((l) => (
              <div
                key={l.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 bg-slate-100 relative overflow-hidden">
                    <img
                      src={l.imageUrl || '/src/assets/images/safety_inspected_meals_1793275541061.jpg'}
                      alt={l.foodName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 bg-white/95 px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-800 shadow-xs">
                      {l.remainingQuantity} {l.unit} remaining
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

                  <div className="p-5 space-y-2.5">
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

                    <div className="pt-2 text-xs text-slate-500 space-y-1 border-t border-slate-100">
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
                        <span>Deadline: {new Date(l.collectionDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenListing(l)}
                    className="flex-1 py-2 text-xs font-semibold text-center text-white bg-[#183B28] hover:bg-[#122c1e] rounded-xl transition-colors shadow-2xs"
                  >
                    Request Donation
                  </button>
                  <button
                    onClick={() => setSafetyReportTarget(l)}
                    title="Report food safety concern"
                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Requests Tracker */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Your Donation Requests</h2>
          <span className="text-xs text-slate-500 tabular-nums">{requests.length} requests</span>
        </div>

        {requests.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            You have not submitted any donation claims yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Food Item</th>
                  <th className="py-3 px-4 font-semibold">Food Provider</th>
                  <th className="py-3 px-4 font-semibold text-right">Requested Quantity</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Created</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{r.foodName}</td>
                    <td className="py-3 px-4 text-slate-600">{r.providerName}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">{r.requestedQuantity} servings</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          r.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : r.status === 'delivered'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      {r.status === 'pending' && (
                        <button
                          onClick={() => handleCancelRequest(r.id)}
                          className="text-xs text-rose-600 hover:underline font-medium"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Donation Request Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Request Food Donation</h3>
              <button
                onClick={() => setSelectedListing(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div>
                <span className="text-sm font-bold text-slate-900">{selectedListing.foodName}</span>
                <p className="text-xs text-slate-500">
                  Offered by <strong>{selectedListing.providerName}</strong> · Pickup at {selectedListing.pickupAddress}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div>Available inventory: <strong className="text-slate-900">{selectedListing.remainingQuantity} {selectedListing.unit}</strong></div>
                <div>Storage condition: <strong>{selectedListing.storageCondition}</strong></div>
                <div>Allergens: <strong>{selectedListing.allergens.join(', ') || 'None reported'}</strong></div>
                <div>Deadline: <strong className="text-amber-800">{new Date(selectedListing.collectionDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></div>
              </div>

              {/* Python Match Intelligence Insights */}
              {matchingRecommendations.length > 0 && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#183B28]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Python Match Intelligence Analysis</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Proximity score: <strong>{matchingRecommendations[0]?.distance_score}/100</strong> ({matchingRecommendations[0]?.distance_km} km away). Capacity fit: <strong>{matchingRecommendations[0]?.capacity_score}%</strong>.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmitRequest} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Requested Quantity (Max: {selectedListing.remainingQuantity} {selectedListing.unit})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedListing.remainingQuantity}
                    value={requestedQty}
                    onChange={(e) => setRequestedQty(e.target.value)}
                    required
                    className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#183B28] bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pickup Coordination & Vehicle Notes
                  </label>
                  <textarea
                    rows={2}
                    value={pickupNotes}
                    onChange={(e) => setPickupNotes(e.target.value)}
                    placeholder="e.g. Hope Kitchen van arriving with insulated cambro totes at 4:30 PM..."
                    className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#183B28] bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedListing(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRequest}
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#183B28] hover:bg-[#122c1e] rounded-xl transition-colors shadow-xs disabled:opacity-50"
                  >
                    {submittingRequest ? 'Submitting...' : 'Confirm Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Safety Report Modal */}
      {safetyReportTarget && (
        <SafetyReportModal
          entityType="listing"
          entityId={safetyReportTarget.id}
          entityTitle={safetyReportTarget.foodName}
          onClose={() => setSafetyReportTarget(null)}
        />
      )}
    </div>
  );
};
