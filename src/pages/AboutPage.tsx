import React from 'react';
import { ShieldCheck, HeartHandshake, Scale, Award, ArrowRight } from 'lucide-react';

interface AboutPageProps {
  setCurrentPage: (page: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ setCurrentPage }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 space-y-16">
      {/* Intro */}
      <div className="max-w-3xl space-y-4">
        <span className="text-xs font-semibold text-[#183B28] uppercase tracking-wider">
          About SharePlate
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Closing the gap between commercial food surplus and food insecurity
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          More than one-third of all food produced globally goes to waste, while millions face daily nutritional insecurity. SharePlate is a dedicated social-impact infrastructure platform designed to bridge this divide through real-time logistics, strict food safety protocols, and transparent recipient matching.
        </p>
      </div>

      {/* Visual Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          <img
            src="/src/assets/images/community_ngo_pickup_1793275540565.jpg"
            alt="Verified NGO receiving temperature-controlled food donation"
            className="w-full h-80 object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">
            Dignity, Hygiene, and Speed
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Redistributed food must meet the exact same safety standards as commercial dining. We mandate temperature control declarations, tamper-evident seals, and mandatory allergen disclosures for every single batch listed on SharePlate.
          </p>
          <div className="space-y-2 pt-2 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#183B28] shrink-0" />
              <span>Full compliance with the Bill Emerson Good Samaritan Food Donation Act.</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#183B28] shrink-0" />
              <span>501(c)(3) and state health registry verification for all recipient non-profits.</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#183B28] shrink-0" />
              <span>Automated audit logging and rapid administrator dispute resolution.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Role Breakdown */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Platform Ecosystem Roles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <span className="text-xs font-semibold text-[#183B28]">01. Food Providers</span>
            <h3 className="text-sm font-bold text-slate-900">Commercial Donors</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Restaurants, hotels, corporate dining halls, bakery chains, and caterers with safe surplus inventory.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <span className="text-xs font-semibold text-[#183B28]">02. Verified NGOs</span>
            <h3 className="text-sm font-bold text-slate-900">Community Kitchens</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Food banks, soup kitchens, transitional shelters, and youth outreach programs distributing hot meals.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <span className="text-xs font-semibold text-[#183B28]">03. Volunteers</span>
            <h3 className="text-sm font-bold text-slate-900">Courier Network</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Community members equipped with insulated thermal carriers who facilitate rapid physical handovers.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <span className="text-xs font-semibold text-[#183B28]">04. Administrators</span>
            <h3 className="text-sm font-bold text-slate-900">Safety & Trust Officers</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Audits organization registrations, inspects safety incident reports, and reviews logs.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="p-8 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold text-[#183B28]">Are you a certified non-profit organization?</h3>
          <p className="text-xs text-emerald-800 mt-1">
            Register your organization to start receiving surplus meal notifications in your area.
          </p>
        </div>
        <button
          onClick={() => setCurrentPage('register')}
          className="px-5 py-2.5 text-xs font-semibold text-white bg-[#183B28] hover:bg-[#122c1e] rounded-lg transition-colors whitespace-nowrap shadow-xs"
        >
          Join as an NGO Partner
        </button>
      </div>
    </div>
  );
};
