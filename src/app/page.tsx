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
  const { isAuthenticated } = useAuth();
  const [currentRoute, setCurrentRoute] = React.useState<Route>('landing');

  React.useEffect(() => {
    console.log('isAuthenticated:', isAuthenticated, 'currentRoute:', currentRoute);
    setCurrentRoute(prevRoute => {
      if (isAuthenticated && prevRoute !== 'dashboard') {
        console.log('Switching to dashboard');
        return 'dashboard';
      } else if (!isAuthenticated && prevRoute !== 'landing') {
        console.log('Switching to landing');
        return 'landing';
      }
      return prevRoute;
    });
  }, [isAuthenticated]);

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