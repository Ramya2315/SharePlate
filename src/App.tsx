import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { ToastProvider } from './contexts/ToastContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';

// Pages
import { LandingPage } from './pages/LandingPage.tsx';
import { RestaurantsPage } from './pages/RestaurantsPage.tsx';
import { AboutPage } from './pages/AboutPage.tsx';
import { HowItWorksPage } from './pages/HowItWorksPage.tsx';
import { SurplusFeedPage } from './pages/SurplusFeedPage.tsx';
import { ImpactPage } from './pages/ImpactPage.tsx';
import { LogisticsMapAgent } from './components/LogisticsMapAgent.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { ProviderDashboard } from './pages/ProviderDashboard.tsx';
import { NGODashboard } from './pages/NGODashboard.tsx';
import { VolunteerDashboard } from './pages/VolunteerDashboard.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

  const handleRoleSwitched = (role: string) => {
    switch (role) {
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
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage setCurrentPage={setCurrentPage} setSelectedListingId={setSelectedListingId} />;
      case 'restaurants':
        return <RestaurantsPage setCurrentPage={setCurrentPage} setSelectedListingId={setSelectedListingId} />;
      case 'about':
        return <AboutPage setCurrentPage={setCurrentPage} />;
      case 'how-it-works':
        return <HowItWorksPage setCurrentPage={setCurrentPage} />;
      case 'feed':
        return <SurplusFeedPage setCurrentPage={setCurrentPage} selectedListingId={selectedListingId} />;
      case 'maps-agent':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-6">
            <LogisticsMapAgent />
          </div>
        );
      case 'impact':
        return <ImpactPage />;
      case 'login':
        return <LoginPage setCurrentPage={setCurrentPage} />;
      case 'register':
        return <RegisterPage setCurrentPage={setCurrentPage} />;
      case 'provider-dashboard':
        return <ProviderDashboard />;
      case 'ngo-dashboard':
        return <NGODashboard initialListingId={selectedListingId} />;
      case 'volunteer-dashboard':
        return <VolunteerDashboard />;
      case 'admin-dashboard':
        return <AdminDashboard />;
      default:
        return <LandingPage setCurrentPage={setCurrentPage} setSelectedListingId={setSelectedListingId} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-slate-800 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Bar Header with Integrated Role Switcher Dropdown */}
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      {/* Main Viewport Content */}
      <main className="flex-1">
        {renderPage()}
      </main>

      {/* Site Footer */}
      <Footer setCurrentPage={setCurrentPage} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
