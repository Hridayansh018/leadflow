"use client";

import React, { useState } from 'react';
import { Plus, Play } from 'lucide-react';
import vapiService from '../services/vapiService';

interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category: 'lead-followup' | 'property-showing' | 'general' | 'custom';
  variables: string[];
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
}

export default function CampaignCreator() {
  const [showCreator, setShowCreator] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [templates] = useState<CampaignTemplate[]>(vapiService.getCampaignTemplates());

  // Load leads when component mounts
  React.useEffect(() => {
    loadLeads();
  }, []);

  const handleTemplateSelect = (template: CampaignTemplate) => {
    setSelectedTemplate(template);
    setCustomPrompt(''); // Clear custom prompt when template is selected
    
    // Set default variables
    const defaultVars: Record<string, string> = {
      recipientName: 'John Doe',
      senderName: 'AI Call Pro',
      companyName: 'AI Call Pro CRM',
      propertyType: 'residential',
      location: 'Downtown',
      propertyAddress: '123 Main St',
      showingDate: new Date().toLocaleDateString(),
      showingTime: '2:00 PM',
      propertyFeatures: '3 bedrooms, 2 bathrooms',
      propertyPrice: '$500,000',
      marketConditions: 'favorable',
      marketTrend: 'increasing prices',
      inquiryType: 'property inquiry',
      specificDetails: '3-bedroom homes',
      openHouseDate: new Date().toLocaleDateString(),
      openHouseTime: '1:00 PM - 4:00 PM',
      propertyHighlights: 'recently renovated, great location'
    };
    
    // Only set variables that exist in the template
    const templateVars: Record<string, string> = {};
    template.variables.forEach(variable => {
      if (defaultVars[variable]) {
        templateVars[variable] = defaultVars[variable];
      }
    });
    
    setTemplateVariables(templateVars);
  };

  const handleCustomPromptChange = () => {
    setSelectedTemplate(null); // Clear template when custom prompt is used
  };

  const getFinalPrompt = (): string => {
    if (selectedTemplate) {
      return vapiService.processCampaignTemplate(selectedTemplate.id, templateVariables);
    }
    return customPrompt;
  };

  const loadLeads = async () => {
    try {
      setLoading(true);
      // This would load leads from your database
      const mockLeads: Lead[] = [
        { id: '1', name: 'John Smith', email: 'john@example.com', phone: '+1234567890', status: 'new' },
        { id: '2', name: 'Jane Doe', email: 'jane@example.com', phone: '+1234567891', status: 'contacted' },
        { id: '3', name: 'Bob Johnson', email: 'bob@example.com', phone: '+1234567892', status: 'interested' },
      ];
      setLeads(mockLeads);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeadToggle = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAllLeads = () => {
    setSelectedLeads(leads.map(lead => lead.id));
  };

  const handleDeselectAllLeads = () => {
    setSelectedLeads([]);
  };

  const createCampaign = async () => {
    if (!campaignName.trim()) {
      alert('Please enter a campaign name');
      return;
    }

    if (!getFinalPrompt().trim()) {
      alert('Please enter a campaign prompt or select a template');
      return;
    }

    if (selectedLeads.length === 0) {
      alert('Please select at least one lead');
      return;
    }

    try {
      setLoading(true);
      
      // Create campaign using VAPI
      const campaignData = {
        name: campaignName,
        prompt: getFinalPrompt(),
        leads: selectedLeads,
        status: 'scheduled'
      };

      await vapiService.createCampaign({
        name: campaignData.name,
        assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || '',
        phoneNumberId: process.env.NEXT_PUBLIC_PHONE_NUMBER_ID || '',
        prompt: campaignData.prompt,
        leads: campaignData.leads.map(leadId => {
          const lead = leads.find(l => l.id === leadId);
          return {
            name: lead?.name || 'Unknown',
            phone: lead?.phone || '',
            info: lead?.email || ''
          };
        })
      });
      
      alert('✅ Campaign created successfully!');
      setShowCreator(false);
      // Reset form
      setCampaignName('');
      setSelectedTemplate(null);
      setCustomPrompt('');
      setTemplateVariables({});
      setSelectedLeads([]);
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert(`❌ Error creating campaign: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowCreator(true)}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Campaign
      </button>

      {showCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center">
                <Plus className="h-6 w-6 text-green-400 mr-3" />
                <h2 className="text-xl font-bold text-white">Create New Campaign</h2>
              </div>
              <button
                onClick={() => setShowCreator(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Enter campaign name..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Campaign Template
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`bg-gray-800 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedTemplate?.id === template.id 
                          ? 'border-blue-500 bg-blue-900 bg-opacity-20' 
                          : 'border-gray-700 hover:border-blue-500'
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <h3 className="font-medium text-white text-sm">{template.name}</h3>
                      <p className="text-gray-400 text-xs mt-1">{template.description}</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs mt-2 ${
                        template.category === 'lead-followup' ? 'bg-blue-100 text-blue-800' :
                        template.category === 'property-showing' ? 'bg-green-100 text-green-800' :
                        template.category === 'general' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {template.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Template Variables */}
              {selectedTemplate && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Template Variables
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedTemplate.variables.map((variable) => (
                      <div key={variable}>
                        <label className="block text-xs text-gray-400 mb-1">{variable}</label>
                        <input
                          type="text"
                          value={templateVariables[variable] || ''}
                          onChange={(e) => setTemplateVariables(prev => ({ ...prev, [variable]: e.target.value }))}
                          className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Custom Prompt
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => {
                    setCustomPrompt(e.target.value);
                    handleCustomPromptChange();
                  }}
                  placeholder="Enter your custom campaign prompt..."
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Prompt Preview */}
              {getFinalPrompt() && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Final Prompt Preview
                  </label>
                  <div className="bg-gray-800 p-3 rounded border border-gray-700">
                    <p className="text-white text-sm">{getFinalPrompt()}</p>
                  </div>
                </div>
              )}

              {/* Lead Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Select Leads *
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSelectAllLeads}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleDeselectAllLeads}
                      className="text-xs text-gray-400 hover:text-gray-300"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                
                <div className="max-h-40 overflow-y-auto bg-gray-800 rounded border border-gray-700">
                  {leads.map((lead) => (
                    <div
                      key={lead.id}
                      className={`flex items-center p-2 hover:bg-gray-700 cursor-pointer ${
                        selectedLeads.includes(lead.id) ? 'bg-blue-900 bg-opacity-20' : ''
                      }`}
                      onClick={() => handleLeadToggle(lead.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={() => handleLeadToggle(lead.id)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{lead.name}</p>
                        <p className="text-gray-400 text-xs">{lead.phone}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                        lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {lead.status}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Selected {selectedLeads.length} of {leads.length} leads
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setShowCreator(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createCampaign}
                  disabled={loading || !campaignName.trim() || !getFinalPrompt().trim() || selectedLeads.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Create Campaign
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 