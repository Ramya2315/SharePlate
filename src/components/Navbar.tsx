import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useToast } from '../contexts/ToastContext.tsx';
import { NotificationDropdown } from './NotificationDropdown.tsx';
import { UserRole } from '../types/index.ts';
import {
  Menu,
  X,
  LogOut,
  ChevronDown,
  ChefHat,
  Building2,
  Truck,
  ShieldCheck,
  UserCircle2,
  UtensilsCrossed,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, setCurrentPage }) => {
  const { user, logout, quickDemoLogin } = useAuth();
  const { showToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDashboardPage = () => {
    if (!user) return 'login';
    switch (user.role) {
      case 'provider':
        return 'provider-dashboard';
      case 'ngo':
        return 'ngo-dashboard';
      case 'volunteer':
        return 'volunteer-dashboard';
      case 'admin':
        return 'admin-dashboard';
      default:
        return 'landing';
    }
  };

  const navLinks = [
    { id: 'landing', label: 'Home' },
    { id: 'restaurants', label: 'Restaurants' },
    { id: 'feed', label: 'Surplus Feed' },
    { id: 'maps-agent', label: 'Maps & Logistics' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'about', label: 'About' },
    { id: 'impact', label: 'Impact' },
  ];

  if (user) {
    navLinks.push({ id: getDashboardPage(), label: 'Dashboard' });
  }

  const handleNavClick = (pageId: string) => {
    setCurrentPage(pageId);
    setMobileMenuOpen(false);
  };

  const rolesList: { role: UserRole; label: string; icon: any; title: string; subtitle: string }[] = [
    {
      role: 'provider',
      label: 'Food Provider',
      icon: ChefHat,
      title: 'Chef Marcus Thorne',
      subtitle: 'Green Harvest Bakery & Cafe',
    },
    {
      role: 'ngo',
      label: 'NGO Recipient',
      icon: Building2,
      title: 'David Chen',
      subtitle: 'Hope Community Kitchen',
    },
    {
      role: 'volunteer',
      label: 'Volunteer Courier',
      icon: Truck,
      title: 'Alex Rivera',
      subtitle: 'Verified Dispatch Courier',
    },
    {
      role: 'admin',
      label: 'Platform Admin',
      icon: ShieldCheck,
      title: 'Eleanor Vance',
      subtitle: 'Platform Security & Governance',
    },
  ];

  const handleSwitchRole = async (targetRole: UserRole) => {
    try {
      setRoleDropdownOpen(false);
      await quickDemoLogin(targetRole);
      showToast(`Switched active account to ${targetRole.toUpperCase()}`, 'success');
      switch (targetRole) {
        case 'provider':
          setCurrentPage('provider-dashboard');
          break;
        case 'ngo':
          setCurrentPage('ngo-dashboard');
          break;
        case 'volunteer':
          setCurrentPage('volunteer-dashboard');
          break;
        case 'admin':
          setCurrentPage('admin-dashboard');
          break;
        default:
          setCurrentPage('landing');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to switch role', 'error');
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'provider':
        return ChefHat;
      case 'ngo':
        return Building2;
      case 'volunteer':
        return Truck;
      case 'admin':
        return ShieldCheck;
      default:
        return UserCircle2;
    }
  };

  const CurrentRoleIcon = getRoleIcon(user?.role);

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E8E1D7]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-8 py-3.5">
        {/* Brand Logo & Wordmark matching RescueBite branding */}
        <button
          onClick={() => handleNavClick('landing')}
          className="text-xl font-extrabold tracking-tight text-[#183B28] whitespace-nowrap shrink-0 flex items-center gap-2.5 text-left focus:outline-none group"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#183B28] to-emerald-800 text-white flex items-center justify-center font-bold text-base shadow-xs group-hover:scale-105 transition-transform">
            🌿
          </div>
          <div className="flex flex-col">
            <span className="font-['Plus_Jakarta_Sans',sans-serif] leading-tight flex items-center gap-1">
              RescueBite
              <span className="text-[10px] font-semibold tracking-normal text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                SharePlate
              </span>
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-600">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className={`transition-colors whitespace-nowrap shrink-0 focus:outline-none hover:text-[#183B28] ${
                currentPage === link.id ? 'text-[#183B28] font-bold border-b-2 border-[#183B28] pb-0.5' : ''
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Header Right Actions: Role Dropdown & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Header Role Switcher Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-700/20 bg-emerald-50/70 hover:bg-emerald-100/70 text-slate-800 text-xs font-medium transition-all shadow-2xs"
              title="Select Active Platform Role"
            >
              <CurrentRoleIcon className="w-3.5 h-3.5 text-[#183B28]" />
              <span className="hidden sm:inline font-semibold text-[#183B28]">
                {user ? `${user.role.toUpperCase()}` : 'Switch Role'}
              </span>
              <span className="sm:hidden font-semibold text-[#183B28]">
                {user ? user.role.slice(0, 3).toUpperCase() : 'Role'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-left animate-in fade-in-50 zoom-in-95">
                <div className="px-4 py-2 border-b border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Active Account Switcher
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Experience RescueBite through any of the four verified system roles.
                  </p>
                </div>

                <div className="py-1">
                  {rolesList.map(({ role, label, icon: Icon, title, subtitle }) => {
                    const isSelected = user?.role === role;
                    return (
                      <button
                        key={role}
                        onClick={() => handleSwitchRole(role)}
                        className={`w-full px-4 py-2.5 text-left flex items-start gap-3 transition-colors ${
                          isSelected ? 'bg-emerald-50/80 text-[#183B28]' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected ? 'bg-[#183B28] text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 leading-tight">
                              {label}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                Current
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-600 block truncate mt-0.5 font-medium">
                            {title}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {subtitle}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 mt-1 border-t border-slate-100 px-3 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 py-1">
                    <span>New to RescueBite?</span>
                    <button
                      onClick={() => {
                        setRoleDropdownOpen(false);
                        handleNavClick('register');
                      }}
                      className="font-bold text-[#183B28] hover:underline"
                    >
                      Register Now &rarr;
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setRoleDropdownOpen(false);
                      handleNavClick('restaurants');
                    }}
                    className="w-full text-center py-1 text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 flex items-center justify-center gap-1"
                  >
                    <UtensilsCrossed className="w-3 h-3" />
                    <span>View Partner Restaurants</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Explicit Login and Register Buttons for New Users in Header */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => handleNavClick('login')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                currentPage === 'login'
                  ? 'bg-emerald-100 text-[#183B28] font-bold'
                  : 'text-slate-700 hover:text-[#183B28] hover:bg-emerald-50'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => handleNavClick('register')}
              className={`px-3 sm:px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shadow-xs ${
                currentPage === 'register'
                  ? 'bg-emerald-800 text-white ring-2 ring-emerald-600'
                  : 'text-white bg-[#183B28] hover:bg-[#122c1e]'
              }`}
            >
              Register
            </button>
          </div>

          {/* User Status / Active Session Controls */}
          {user && (
            <div className="flex items-center gap-1.5 sm:gap-2.5 pl-1 sm:pl-2 border-l border-slate-200">
              <NotificationDropdown />
              <button
                onClick={() => handleNavClick(getDashboardPage())}
                className="hidden xl:flex flex-col text-right focus:outline-none"
                title="Go to Dashboard"
              >
                <span className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[120px]">
                  {user.organizationName || user.name}
                </span>
                <span className="text-[10px] text-emerald-700 font-medium capitalize">
                  {user.role} {user.isVerified && '· Verified'}
                </span>
              </button>
              <button
                onClick={logout}
                title="Log Out"
                className="p-1.5 sm:p-2 text-slate-500 hover:text-rose-600 transition-colors rounded-lg hover:bg-slate-100"
                aria-label="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E8E1D7] bg-[#FAF8F5] px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className={`block w-full text-left py-2.5 px-3 text-sm font-medium rounded-lg transition-colors ${
                currentPage === link.id ? 'bg-[#183B28] text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {link.label}
            </button>
          ))}

          {/* Mobile Login and Register for New Users */}
          <div className="pt-3 mt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
            <button
              onClick={() => handleNavClick('login')}
              className="w-full py-2.5 text-center text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => handleNavClick('register')}
              className="w-full py-2.5 text-center text-xs font-bold text-white bg-[#183B28] rounded-xl hover:bg-[#122c1e] transition-colors"
            >
              Register
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
