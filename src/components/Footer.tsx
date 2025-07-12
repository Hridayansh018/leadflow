import React from 'react';
import { MessageSquare, Phone, Mail } from 'lucide-react';

export default function Footer() {
  const handleContactDeveloper = () => {
    window.open('mailto:developer@aicrm.com?subject=Support Request', '_blank');
  };

  return (
    <footer className="bg-gray-800 border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Phone className="h-6 w-6 text-blue-400 mr-2" />
            <span className="text-white font-semibold">LeadFlow</span>
          </div>
          
          <div className="flex items-center space-x-6">
            <button
              onClick={handleContactDeveloper}
              className="flex items-center text-gray-300 hover:text-white transition-colors"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Developer
            </button>
            <div className="flex items-center text-gray-300">
              <Mail className="h-4 w-4 mr-2" />
              support@aicrm.com
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-700 text-center text-gray-400">
          <p>&copy; 2024 LeadFlow. All rights reserved. Empowering real estate professionals with AI-powered calling solutions.</p>
        </div>
      </div>
    </footer>
  );
}