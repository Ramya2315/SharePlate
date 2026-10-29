import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useToast } from '../contexts/ToastContext.tsx';
import { api } from '../services/api.ts';
import { FoodListing, DonationRequest, PickupTask } from '../types/index.ts';
import { QRModal } from '../components/QRModal.tsx';
import {
  Plus,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  QrCode,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const ProviderDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [listings, setListings] = useState<FoodListing[]>([]);
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [pickups, setPickups] = useState<PickupTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTaskForQr, setSelectedTaskForQr] = useState<string | null>(null);
  const [reviewRequestModal, setReviewRequestModal] = useState<DonationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Form State
  const [foodName, setFoodName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Cooked Meals');
  const [quantity, setQuantity] = useState('25');
  const [unit, setUnit] = useState('servings');
  const [estimatedServings, setEstimatedServings] = useState('25');
  const [storageCondition, setStorageCondition] = useState('Refrigerated');
  const [dietary, setDietary] = useState('Vegetarian');
  const [allergens, setAllergens] = useState<string[]>([]);
  const [collectionDeadlineHours, setCollectionDeadlineHours] = useState('4');
  const [pickupAddress, setPickupAddress] = useState(user?.address || '');
  const [contactInstructions, setContactInstructions] = useState('');
  const [safetyDeclaration, setSafetyDeclaration] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const allergenOptions = ['Gluten', 'Dairy', 'Eggs', 'Nuts', 'Soy', 'Shellfish', 'Fish', 'None reported'];

  const refreshData = async () => {
    if (!user) return;
    try {
      const [listRes, reqRes, pickRes] = await Promise.all([
        api.getListings({ providerId: user.id }),
        api.getRequests(),
        api.getPickups(),
      ]);
      setListings(listRes.listings || []);
      setRequests(reqRes.requests || []);
      setPickups(pickRes.tasks || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName || !quantity) {
      showToast('Please fill in food name and available quantity', 'error');
      return;
    }
    if (!safetyDeclaration) {
      showToast('You must confirm the food safety compliance declaration', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date();
      const deadline = new Date(now.getTime() + parseFloat(collectionDeadlineHours) * 3600 * 1000).toISOString();

      await api.createListing({
        foodName,
        description,
        category,
        quantity: parseFloat(quantity),
        unit,
        estimatedServings: parseInt(estimatedServings, 10),
        preparationTime: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
        collectionStartTime: now.toISOString(),
        collectionDeadline: deadline,
        storageCondition,
        allergens,
        dietary,
        pickupAddress: pickupAddress || user?.address || 'Kitchen address',
        contactInstructions,
        foodSafetyDeclaration: true,
      });

      showToast('Surplus food listing published to verified NGOs', 'success');
      setCreateModalOpen(false);
      // Reset form
      setFoodName('');
      setDescription('');
      setSafetyDeclaration(false);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to publish listing', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const res = await api.approveRequest(requestId);
      showToast('Donation request approved. Pickup task scheduled!', 'success');
      setReviewRequestModal(null);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Approval failed (inventory may be insufficient)', 'error');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await api.rejectRequest(requestId, rejectionReason);
      showToast('Request declined.', 'info');
      setReviewRequestModal(null);
      setRejectionReason('');
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to decline request', 'error');
    }
  };

  const handleCancelListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to cancel this listing? All pending requests will be cancelled.')) return;
    try {
      await api.cancelListing(listingId);
      showToast('Listing cancelled.', 'info');
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel listing', 'error');
    }
  };

  // Metrics
  const activeListings = listings.filter((l) => l.status === 'available' || l.status === 'partially_reserved').length;
  const pendingRequests = requests.filter((r) => r.status === 'pending').length;
  const completedHandouts = pickups.filter((p) => p.status === 'delivered' || p.status === 'picked_up').length;
  const expiredListings = listings.filter((l) => l.status === 'expired').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Provider Dashboard</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-[#183B28]">{user?.organizationName || user?.name}</span>
            {user?.isVerified && (
              <span className="text-emerald-700 font-medium">· Verified Donor</span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Food Surplus Operations</h1>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2.5 text-xs font-semibold text-white bg-[#183B28] hover:bg-[#122c1e] rounded-xl transition-all shadow-xs flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Publish Surplus Food</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Active Surplus Listings</span>
          <span className="block text-2xl font-bold text-slate-900 mt-1 tabular-nums">{activeListings}</span>
          <span className="text-[11px] text-emerald-700">Open for NGO claims</span>
        </div>
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Pending NGO Requests</span>
          <span className="block text-2xl font-bold text-amber-600 mt-1 tabular-nums">{pendingRequests}</span>
          <span className="text-[11px] text-slate-500">Requires your review</span>
        </div>
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Completed Deliveries</span>
          <span className="block text-2xl font-bold text-[#183B28] mt-1 tabular-nums">{completedHandouts}</span>
          <span className="text-[11px] text-slate-500">Verified handovers</span>
        </div>
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Expired Listings</span>
          <span className="block text-2xl font-bold text-slate-500 mt-1 tabular-nums">{expiredListings}</span>
          <span className="text-[11px] text-slate-400">Past pickup deadline</span>
        </div>
      </div>

      {/* Pending NGO Requests Queue */}
      {pendingRequests > 0 && (
        <div className="bg-amber-50/70 rounded-2xl border border-amber-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h2 className="text-sm font-bold">Inbound NGO Requests Needing Action ({pendingRequests})</h2>
            </div>
          </div>

          <div className="divide-y divide-amber-200/60">
            {requests
              .filter((r) => r.status === 'pending')
              .map((req) => (
                <div key={req.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-900">{req.ngoName}</span>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Requesting <span className="font-semibold text-slate-900">{req.requestedQuantity} servings</span> of "{req.foodName}"
                    </p>
                    {req.pickupNotes && (
                      <p className="text-[11px] text-slate-500 mt-1 italic">Note: "{req.pickupNotes}"</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveRequest(req.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-[#183B28] hover:bg-[#122c1e] rounded-lg transition-colors shadow-2xs"
                    >
                      Approve & Allocate
                    </button>
                    <button
                      onClick={() => setReviewRequestModal(req)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Active Listings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Your Food Listings</h2>
          <span className="text-xs text-slate-500 tabular-nums">{listings.length} total entries</span>
        </div>

        {listings.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No food listings created yet. Click "Publish Surplus Food" to list excess commercial meals.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Food Item</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold text-right">Available / Total</th>
                  <th className="py-3 px-4 font-semibold">Collection Deadline</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listings.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{l.foodName}</span>
                      <span className="text-[11px] text-slate-500">{l.dietary} · {l.storageCondition}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{l.category}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      <span className="font-bold text-slate-900">{l.remainingQuantity}</span> / {l.quantity} {l.unit}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(l.collectionDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <span className="block text-[10px] text-slate-400">
                        {new Date(l.collectionDeadline).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          l.status === 'available'
                            ? 'bg-emerald-100 text-emerald-800'
                            : l.status === 'partially_reserved'
                            ? 'bg-amber-100 text-amber-800'
                            : l.status === 'reserved'
                            ? 'bg-blue-100 text-blue-800'
                            : l.status === 'completed'
                            ? 'bg-slate-100 text-slate-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {l.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {l.status === 'available' || l.status === 'partially_reserved' ? (
                        <button
                          onClick={() => handleCancelListing(l.id)}
                          className="text-xs text-rose-600 hover:underline font-medium"
                        >
                          Cancel
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active Pickups & Handover Codes */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Scheduled Handover Pickups</h2>
          <span className="text-xs text-slate-500">Present code or QR to volunteer upon arrival</span>
        </div>

        {pickups.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No scheduled pickups currently pending.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pickups.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4"
              >
                <div>
                  <span className="text-xs font-bold text-slate-900">{task.foodName}</span>
                  <p className="text-xs text-slate-600 mt-0.5">
                    For: <span className="font-semibold text-slate-800">{task.ngoName}</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Courier: {task.volunteerName || 'Pending driver pickup'} · Status: <span className="capitalize font-medium">{task.status}</span>
                  </p>
                </div>

                <button
                  onClick={() => setSelectedTaskForQr(task.id)}
                  className="px-3 py-2 text-xs font-semibold text-[#183B28] bg-white border border-[#183B28]/30 hover:bg-[#183B28] hover:text-white rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Show QR & Code</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Listing Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-8 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Publish Surplus Food Donation</h2>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Food Item Name</label>
                <input
                  type="text"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="e.g. Prepared Vegetarian Pasta & Garden Salad"
                  required
                  className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#183B28] bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Food Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#183B28]"
                  >
                    <option value="Cooked Meals">Cooked Meals</option>
                    <option value="Bakery & Bread">Bakery & Bread</option>
                    <option value="Fresh Produce">Fresh Produce</option>
                    <option value="Packaged Goods">Packaged Goods</option>
                    <option value="Dairy & Refrigerated">Dairy & Refrigerated</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dietary Classification</label>
                  <select
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value)}
                    className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#183B28]"
                  >
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Non-Vegetarian">Non-Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Halal">Halal</option>
                    <option value="Kosher">Kosher</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#183B28] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#183B28]"
                  >
                    <option value="servings">servings</option>
                    <option value="kg">kg</option>
                    <option value="boxes">boxes</option>
                    <option value="trays">trays</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Est. Servings</label>
                  <input
                    type="number"
                    min="1"
                    value={estimatedServings}
                    onChange={(e) => setEstimatedServings(e.target.value)}
                    required
                    className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#183B28] bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Storage Condition</label>
                  <select
                    value={storageCondition}
                    onChange={(e) => setStorageCondition(e.target.value)}
                    className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#183B28]"
                  >
                    <option value="Refrigerated">Refrigerated (&lt; 4°C)</option>
                    <option value="Heated Container">Heated Container (&gt; 60°C)</option>
                    <option value="Room Temperature">Room Temperature</option>
                    <option value="Dry Storage">Dry Storage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pickup Deadline (Hours from now)
                  </label>
                  <select
                    value={collectionDeadlineHours}
                    onChange={(e) => setCollectionDeadlineHours(e.target.value)}
                    className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#183B28]"
                  >
                    <option value="2">2 Hours (Critical urgency)</option>
                    <option value="4">4 Hours (Same day evening)</option>
                    <option value="8">8 Hours (Full day)</option>
                    <option value="24">24 Hours (Next day)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Allergens Present</label>
                <div className="flex flex-wrap gap-2">
                  {allergenOptions.map((alg) => {
                    const checked = allergens.includes(alg);
                    return (
                      <button
                        type="button"
                        key={alg}
                        onClick={() => {
                          if (alg === 'None reported') {
                            setAllergens(['None reported']);
                          } else {
                            const withoutNone = allergens.filter((a) => a !== 'None reported');
                            if (checked) {
                              setAllergens(withoutNone.filter((a) => a !== alg));
                            } else {
                              setAllergens([...withoutNone, alg]);
                            }
                          }
                        }}
                        className={`px-2.5 py-1 text-xs rounded-md transition-colors border ${
                          checked
                            ? 'bg-[#183B28] text-white border-[#183B28]'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {alg}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pickup Address & Loading Instructions
                </label>
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Facility address"
                  className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#183B28] bg-white mb-2"
                />
                <input
                  type="text"
                  value={contactInstructions}
                  onChange={(e) => setContactInstructions(e.target.value)}
                  placeholder="e.g. Ring service doorbell at alley loading bay, ask for Chef Marcus"
                  className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#183B28] bg-white"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={safetyDeclaration}
                    onChange={(e) => setSafetyDeclaration(e.target.checked)}
                    className="mt-0.5 rounded text-[#183B28] focus:ring-[#183B28]"
                  />
                  <span className="text-[11px] leading-relaxed">
                    <strong>Mandatory Food Safety Declaration:</strong> I declare that this food surplus has been handled, prepared, and stored under sanitary conditions, that allergens are accurately disclosed, and that it has remained within safe temperature parameters.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#183B28] hover:bg-[#122c1e] rounded-xl transition-colors shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Request Modal (Reject with reason) */}
      {reviewRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-left">
            <h3 className="text-base font-bold text-slate-900 mb-2">Decline Donation Request</h3>
            <p className="text-xs text-slate-600 mb-4">
              Decline request from <strong>{reviewRequestModal.ngoName}</strong> for "{reviewRequestModal.foodName}"
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for declining (e.g. food already claimed, insufficient warming equipment)..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#183B28] mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setReviewRequestModal(null)}
                className="px-3 py-1.5 text-xs text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectRequest(reviewRequestModal.id)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show QR Modal */}
      {selectedTaskForQr && (
        <QRModal taskId={selectedTaskForQr} onClose={() => setSelectedTaskForQr(null)} />
      )}
    </div>
  );
};
