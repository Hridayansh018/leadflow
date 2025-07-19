"use client";

import React from 'react';
import { Phone, BarChart3, Users, Mail, LogOut, MessageSquare } from 'lucide-react';
import { useAuth } from '../app/context/AuthContext';

interface HeaderProps {
  onNavigate: (route: string) => void;
  currentRoute: string;
}

export default function Header({ onNavigate, currentRoute }: HeaderProps) {
  const { logout, user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Phone },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'leads', label: 'Leads', icon: Users },
  ];

  const handleContactDeveloper = () => {
    window.open('mailto:developer@aicrm.com?subject=Support Request', '_blank');
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Phone className="h-8 w-8 text-blue-400 mr-3" />
            <h1 className="text-xl font-bold text-white">LeadFlow</h1>
          </div>
          
          <nav className="flex space-x-8 items-center justify-center w-full h-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentRoute === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleContactDeveloper}
              className="flex items-center px-3 py-2 rounded-md text-nowrap text-sm font-medium text-gray-300 hover:bg-blue-600 hover:text-white transition-colors"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Developer
            </button>
            <button
              onClick={logout}
              className="flex items-center bg-gray-600 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2 " />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}