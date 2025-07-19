"use client";

import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import LeadPage from './pages/LeadPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

type Route = 'landing' | 'login' | 'dashboard' | 'analytics' | 'leads';

function AppContent() {
  const [currentRoute, setCurrentRoute] = useState<Route>('landing');
  const { isAuthenticated } = useAuth();

  const navigate = (route: string) => {
    setCurrentRoute(route as Route);
  };

  const renderPage = () => {
    if (!isAuthenticated && currentRoute !== 'landing' && currentRoute !== 'login') {
      return <LandingPage onNavigate={navigate} />;
    }

    switch (currentRoute) {
      case 'landing':
        return <LandingPage onNavigate={navigate} />;
      case 'login':
        return <LoginPage onNavigate={navigate} />;
      case 'dashboard':
        return <DashboardPage onNavigate={navigate} />;
      case 'analytics':
        return <AnalyticsPage onNavigate={navigate} />;
      case 'leads':
        return <LeadPage onNavigate={navigate} />;
      default:
        return <LandingPage onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {renderPage()}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}

export default App; 