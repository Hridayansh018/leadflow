"use client";

import React from 'react';
import { Phone, BarChart3, Users, Mail, LogOut, MessageSquare } from 'lucide-react';
import { useAuth } from '../app/context/AuthContext';
import { Button } from "./ui/button";

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
                <Button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  variant={currentRoute === item.id ? "default" : "ghost"}
                  className="flex items-center"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          <div className="flex items-center space-x-4">
            <Button
              onClick={handleContactDeveloper}
              variant="outline"
              className="flex items-center text-nowrap"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Developer
            </Button>
            <Button
              onClick={logout}
              variant="destructive"
              className="flex items-center"
            >
              <LogOut className="h-4 w-4 mr-2 " />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}