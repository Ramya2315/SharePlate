import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useToast } from '../contexts/ToastContext.tsx';
import { UserRole } from '../types/index.ts';
import { Eye, EyeOff, UtensilsCrossed, Building2, Truck, ShieldAlert } from 'lucide-react';

interface RegisterPageProps {
  setCurrentPage: (page: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ setCurrentPage }) => {
  const { register } = useAuth();
  const { showToast } = useToast();

  const [role, setRole] = useState<UserRole>('provider');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Organization-specific fields
  const [organizationName, setOrganizationName] = useState('');
  const [organizationType, setOrganizationType] = useState('restaurant');
  const [address, setAddress] = useState('');
  const [dailyCapacity, setDailyCapacity] = useState('200');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    if (password.length < 8) {
      showToast('Password must be at least 8 characters long', 'error');
      return;
    }

    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        role,
        phone,
        organizationName: role !== 'volunteer' ? organizationName || name : undefined,
        organizationType: role !== 'volunteer' ? organizationType : undefined,
        address,
        dailyCapacityServings: role === 'ngo' ? parseInt(dailyCapacity, 10) : undefined,
      });

      showToast(
        role === 'volunteer'
          ? 'Account created! Welcome to the volunteer courier network.'
          : 'Organization registered! Your verification profile has been submitted for administrative review.',
        'success'
      );
      setCurrentPage('landing');
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#183B28] flex items-center justify-center font-bold text-lg mx-auto">
            S
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Join the SharePlate Network</h1>
          <p className="text-xs text-slate-500">
            Select your account type to redistribute surplus food or receive donations
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setRole('provider');
              setOrganizationType('restaurant');
            }}
            className={`py-2 px-3 text-xs font-semibold rounded-lg flex flex-col items-center gap-1 transition-all ${
              role === 'provider'
                ? 'bg-white text-[#183B28] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Food Provider</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('ngo');
              setOrganizationType('ngo');
            }}
            className={`py-2 px-3 text-xs font-semibold rounded-lg flex flex-col items-center gap-1 transition-all ${
              role === 'ngo'
                ? 'bg-white text-[#183B28] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Verified NGO</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('volunteer')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg flex flex-col items-center gap-1 transition-all ${
              role === 'volunteer'
                ? 'bg-white text-[#183B28] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Volunteer</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {role === 'volunteer' ? 'Full Name' : 'Contact Person Full Name'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Marcus Vance"
                required
                className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#183B28] bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 012-3456"
                className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#183B28] bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operations@greenharvest.com"
              required
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#183B28] bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                className="w-full py-2 pl-3 pr-10 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#183B28] bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2 text-slate-400 hover:text-slate-600"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role specific organization info */}
          {role !== 'volunteer' && (
            <div className="pt-2 border-t border-slate-200 space-y-4">
              <span className="block text-xs font-bold text-slate-900">Organization Information</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Organization Name</label>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder={role === 'provider' ? 'Green Harvest Bakery' : 'Hope Food Bank'}
                    required
                    className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#183B28] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Organization Type</label>
                  <select
                    value={organizationType}
                    onChange={(e) => setOrganizationType(e.target.value)}
                    className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#183B28]"
                  >
                    {role === 'provider' ? (
                      <>
                        <option value="restaurant">Restaurant / Bistro</option>
                        <option value="hotel">Hotel / Banqueting</option>
                        <option value="caterer">Catering Company</option>
                        <option value="hostel">College Hostel / Dining Hall</option>
                        <option value="event_organizer">Event Venue / Conference Center</option>
                      </>
                    ) : (
                      <>
                        <option value="community_kitchen">Community Kitchen / Soup Kitchen</option>
                        <option value="food_bank">Food Bank / Pantry</option>
                        <option value="ngo">Non-Profit Organization (501c3)</option>
                        <option value="transitional_shelter">Transitional Housing Shelter</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Facility Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, city, state, zip code"
                  required
                  className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#183B28] bg-white"
                />
              </div>

              {role === 'ngo' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Daily Meal Distribution Capacity (Servings/day)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="5000"
                    value={dailyCapacity}
                    onChange={(e) => setDailyCapacity(e.target.value)}
                    className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#183B28] bg-white"
                  />
                </div>
              )}

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Organizations register with a pending status. Platform administrators review documentation before donation requesting and publishing are unlocked.
                </span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-xs font-semibold text-white bg-[#183B28] hover:bg-[#122c1e] rounded-xl transition-colors shadow-xs disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Already registered?{' '}
          <button
            onClick={() => setCurrentPage('login')}
            className="font-semibold text-[#183B28] hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};
