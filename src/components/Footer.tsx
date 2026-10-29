import React from 'react';

interface FooterProps {
  setCurrentPage: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentPage }) => {
  return (
    <footer className="bg-[#183B28] text-[#E8E1D7] pt-14 pb-10 border-t border-[#122c1e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-emerald-900/60">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
                S
              </span>
              <span className="text-xl font-bold tracking-tight text-white">SharePlate</span>
            </div>
            <p className="text-xs text-emerald-200/80 leading-relaxed">
              Safe, transparent food redistribution platform connecting restaurants, caterers, college hostels, verified NGOs, and volunteers to minimize avoidable food waste.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">Platform</h4>
            <ul className="space-y-2 text-xs text-emerald-200/70">
              <li>
                <button onClick={() => setCurrentPage('restaurants')} className="hover:text-white transition-colors">
                  Partner Restaurants & Donors
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('feed')} className="hover:text-white transition-colors">
                  Surplus Food Feed
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('maps-agent')} className="hover:text-white transition-colors">
                  Google Maps Logistics Agent
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('how-it-works')} className="hover:text-white transition-colors">
                  Matching Algorithm
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('impact')} className="hover:text-white transition-colors">
                  Impact Analytics
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('about')} className="hover:text-white transition-colors">
                  Verification Standards
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">Food Safety & Compliance</h4>
            <p className="text-xs text-emerald-200/70 leading-relaxed mb-2">
              Food safety is the shared responsibility of donors and recipients. All donations require temperature logs, allergen labels, and hygienic packaging declarations.
            </p>
            <p className="text-[11px] text-emerald-300/80">
              Good Samaritan Food Donation Act compliant.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">Get Started</h4>
            <p className="text-xs text-emerald-200/70 leading-relaxed mb-3">
              Join local food rescue operations as a verified food donor, non-profit distribution hub, or driver.
            </p>
            <button
              onClick={() => setCurrentPage('register')}
              className="px-4 py-2 text-xs font-semibold text-[#183B28] bg-[#FAF8F5] hover:bg-white rounded-lg transition-colors shadow-xs"
            >
              Register Organization
            </button>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-300/60">
          <p>© {new Date().getFullYear()} SharePlate Platform. Built for verified social impact.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
            <span className="hover:text-white transition-colors cursor-pointer">Food Hygiene Protocol</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
