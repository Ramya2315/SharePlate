import React, { useState } from 'react';
import { Utensils, Building2, Truck, CheckCircle2, QrCode, Cpu, ShieldCheck } from 'lucide-react';

interface HowItWorksPageProps {
  setCurrentPage: (page: string) => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ setCurrentPage }) => {
  const [activeTab, setActiveTab] = useState<'provider' | 'ngo' | 'volunteer'>('provider');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 space-y-12">
      <div className="max-w-3xl space-y-4">
        <span className="text-xs font-semibold text-[#183B28] uppercase tracking-wider">
          Transparent Operations
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
          How SharePlate Coordinates Food Rescue
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          Surplus food is highly time-sensitive. Our platform replaces chaotic group chats and phone calls with an automated, expiry-aware pipeline from restaurant prep station to community dinner tables.
        </p>
      </div>

      {/* Interactive Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('provider')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'provider'
              ? 'border-[#183B28] text-[#183B28]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>For Food Providers</span>
        </button>
        <button
          onClick={() => setActiveTab('ngo')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'ngo'
              ? 'border-[#183B28] text-[#183B28]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>For Verified NGOs</span>
        </button>
        <button
          onClick={() => setActiveTab('volunteer')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'volunteer'
              ? 'border-[#183B28] text-[#183B28]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>For Volunteer Couriers</span>
        </button>
      </div>

      {/* Tab 1: Food Providers */}
      {activeTab === 'provider' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-[#183B28]">Step 1</span>
            <h3 className="text-base font-bold text-slate-900">Publish Surplus Batch</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Log quantity, food category, preparation time, collection deadline, dietary information, and allergen tags. Sign the mandatory digital food safety declaration.
            </p>
          </div>
          <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-[#183B28]">Step 2</span>
            <h3 className="text-base font-bold text-slate-900">Review Inbound Requests</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Nearby verified NGOs submit donation claims for requested quantities. You approve or reject requests with atomic inventory reservation that prevents double-booking.
            </p>
          </div>
          <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-[#183B28]">Step 3</span>
            <h3 className="text-base font-bold text-slate-900">Present Verification Code</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              When the courier or NGO driver arrives, show your dynamic QR code or 6-character code. Once scanned, your donation is logged and your impact dashboard updates.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: NGOs */}
      {activeTab === 'ngo' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-[#183B28]">Step 1</span>
            <h3 className="text-base font-bold text-slate-900">Browse & AI Matching</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Filter available food by distance, dietary restrictions, and time urgency. View personalized recommendations calculated by our Python intelligence service based on your daily capacity.
            </p>
          </div>
          <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-[#183B28]">Step 2</span>
            <h3 className="text-base font-bold text-slate-900">Submit Quantity Claim</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Request partial or full batch sizes up to the remaining inventory limit. Add custom pickup instructions and arrival estimates for the kitchen team.
            </p>
          </div>
          <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-[#183B28]">Step 3</span>
            <h3 className="text-base font-bold text-slate-900">Coordinate Pickup</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Once approved, assign your NGO driver or request an authorized volunteer courier to complete the handover using the secure one-time code.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Volunteers */}
      {activeTab === 'volunteer' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-[#183B28]">Step 1</span>
            <h3 className="text-base font-bold text-slate-900">Claim Pickup Task</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Review open pickup tasks in your area. Inspect food type, container quantity, loading dock notes, and delivery destination before accepting.
            </p>
          </div>
          <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-[#183B28]">Step 2</span>
            <h3 className="text-base font-bold text-slate-900">Verify at Donor Location</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Arrive with clean thermal delivery carriers. Scan the provider's QR code or type the verification code to mark the package as collected.
            </p>
          </div>
          <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-[#183B28]">Step 3</span>
            <h3 className="text-base font-bold text-slate-900">Deliver to NGO Hub</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hand over food containers safely to kitchen supervisors at the destination NGO and mark the task delivered to complete the audit chain.
            </p>
          </div>
        </div>
      )}

      {/* Algorithmic Intelligence Breakdown */}
      <div className="p-8 bg-slate-900 text-white rounded-2xl space-y-6">
        <div className="flex items-center gap-2.5 text-emerald-400">
          <Cpu className="w-5 h-5" />
          <h2 className="text-lg font-bold">Inside the Python Intelligence Service</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs text-slate-300">
          <div>
            <span className="font-semibold text-white block text-sm mb-1">Haversine Distance (35%)</span>
            Calculates spherical geodesic distance from restaurant pickup coordinates to eligible NGO facilities.
          </div>
          <div>
            <span className="font-semibold text-white block text-sm mb-1">Time Urgency (25%)</span>
            Evaluates hours remaining until collection deadline (under 2 hours flags CRITICAL priority).
          </div>
          <div>
            <span className="font-semibold text-white block text-sm mb-1">Capacity Absorption (20%)</span>
            Matches batch servings with NGO daily feeding capacity to avoid overwhelming storage facilities.
          </div>
          <div>
            <span className="font-semibold text-white block text-sm mb-1">Dietary Alignment (20%)</span>
            Verifies non-profit dietary restrictions (e.g., Halal, Vegetarian, Vegan) and refrigeration equipment.
          </div>
        </div>
      </div>
    </div>
  );
};
