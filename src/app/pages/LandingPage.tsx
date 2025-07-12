import React from 'react';
import { Phone, Users, BarChart3, Zap, Shield, Clock, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (route: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const features = [
    {
      icon: Phone,
      title: 'AI-Powered Calling',
      description: 'Advanced AI technology that conducts natural conversations with potential clients'
    },
    {
      icon: Users,
      title: 'Lead Management',
      description: 'Comprehensive lead tracking and management system for better conversion rates'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Real-time analytics and insights to optimize your calling campaigns'
    },
    {
      icon: Zap,
      title: 'Campaign Automation',
      description: 'Automated calling campaigns that scale with your business needs'
    },
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'Industry-standard security and compliance with calling regulations'
    },
    {
      icon: Clock,
      title: '24/7 Operations',
      description: 'Round-the-clock calling capabilities to maximize your reach'
    }
  ];

  const handleContactDeveloper = () => {
    window.open('mailto:developer@aicrm.com?subject=General Inquiry', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Phone className="h-12 w-12 text-blue-400 mr-4" />
              <h1 className="text-4xl font-bold text-white">LeadFlow</h1>
            </div>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Revolutionize your real estate business with AI-powered calling solutions. 
              Convert more leads, save time, and scale your operations with intelligent automation.
            </p>
            <button
              onClick={() => onNavigate('login')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center mx-auto"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Powerful Features</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Everything you need to transform your real estate business with AI-powered calling
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-gray-900 p-6 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors">
                  <Icon className="h-12 w-12 text-blue-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Developer Contact Section */}
      <div className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Need Support?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Our dedicated development team is here to help you maximize your AI calling potential
          </p>
          <button
            onClick={handleContactDeveloper}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Contact Developer
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
          <p>&copy; 2024 LeadFlow. All rights reserved. Empowering real estate professionals with AI-powered calling solutions.</p>
        </div>
      </footer>
    </div>
  );
}