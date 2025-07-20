"use client";

import React, { useState } from 'react';
import { Plus, Play, Upload, FileText, Users, X } from 'lucide-react';
import vapiService from '../services/vapiService';
import csvUploadService, { CSVLead } from '../services/csvUploadService';
import { showSuccess, showError, showWarning } from '../utils/toastUtils';

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
  location?: string;
  notes?: string;
}

export default function CampaignCreator() {
  const [showCreator, setShowCreator] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [csvLeads, setCsvLeads] = useState<CSVLead[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [templates] = useState<CampaignTemplate[]>(vapiService.getCampaignTemplates());
  const [propertyDetails, setPropertyDetails] = useState('');

  const handleTemplateSelect = (template: CampaignTemplate) => {
    setSelectedTemplate(template);
    setCustomPrompt(''); // Clear custom prompt when template is selected
  };

  const handleCustomPromptChange = () => {
    setSelectedTemplate(null); // Clear template when custom prompt is used
  };

  const getFinalPrompt = (): string => {
    if (selectedTemplate) {
      return selectedTemplate.prompt;
    }
    return customPrompt;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      showError('Please upload a CSV file');
      return;
    }

    try {
      setLoading(true);
      setUploadedFile(file);
      
      // Parse CSV file
      const leads = await csvUploadService.parseCSVFile(file);
      
      if (leads.length === 0) {
        showError('No valid leads found in CSV file');
        return;
      }

      // Store in database
      await csvUploadService.storeUploadedCSV(file.name, leads);
      
      setCsvLeads(leads);
      showSuccess(`Successfully uploaded ${leads.length} leads from CSV`);
    } catch (error) {
      console.error('Error uploading CSV:', error);
      showError(`Error uploading CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUploadedFile(null);
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
    setSelectedLeads(csvLeads.map(lead => lead.id));
  };

  const handleDeselectAllLeads = () => {
    setSelectedLeads([]);
  };

  const clearUploadedData = () => {
    setUploadedFile(null);
    setCsvLeads([]);
    setSelectedLeads([]);
  };

  const createCampaign = async () => {
    if (!campaignName.trim()) {
      showWarning('Please enter a campaign name');
      return;
    }

    if (!getFinalPrompt().trim()) {
      showWarning('Please enter a campaign prompt or select a template');
      return;
    }

    if (!propertyDetails.trim()) {
      showWarning('Please enter property details');
      return;
    }

    if (selectedLeads.length === 0) {
      showWarning('Please select at least one lead');
      return;
    }

    try {
      setLoading(true);
      
      // Create campaign using VAPI
      const campaignData = {
        name: campaignName,
        prompt: getFinalPrompt(),
        leads: selectedLeads,
        status: 'scheduled',
        property_details: propertyDetails // <-- include property details
      };

      await vapiService.createCampaign({
        name: campaignData.name,
        assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || '',
        phoneNumberId: process.env.NEXT_PUBLIC_PHONE_NUMBER_ID || '',
        prompt: campaignData.prompt,
        leads: campaignData.leads.map(leadId => {
          const lead = csvLeads.find(l => l.id === leadId);
          return {
            name: lead?.name || 'Unknown',
            phone: lead?.phone || '',
            info: lead?.email || '',
            metadata: { property_details: campaignData.property_details } // <-- add property_details to metadata
          };
        }),
        // property_details: campaignData.property_details // <-- remove this line
      });
      
      showSuccess('Campaign created successfully!');
      setShowCreator(false);
      // Reset form
      setCampaignName('');
      setSelectedTemplate(null);
      setCustomPrompt('');
      setSelectedLeads([]);
      setPropertyDetails('');
      clearUploadedData();
    } catch (error) {
      console.error('Error creating campaign:', error);
      showError(`Error creating campaign: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
                
                {/* CSV Upload Section */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Upload CSV File *
                  </label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-300">Click to upload CSV file</p>
                      <p className="text-gray-500 text-xs">Required columns: name, email, phone</p>
                    </label>
                  </div>
                  {uploadedFile && (
                    <div className="mt-2 flex items-center justify-between bg-gray-800 p-2 rounded">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-green-400 mr-2" />
                        <span className="text-white text-sm">{uploadedFile.name}</span>
                      </div>
                      <button
                        onClick={clearUploadedData}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Lead Selection */}
                {csvLeads.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-300">
                        Select Leads from CSV *
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
                      {csvLeads.map((lead) => (
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
                            <p className="text-gray-400 text-xs">{lead.email} • {lead.phone}</p>
                            {lead.location && (
                              <p className="text-gray-500 text-xs">{lead.location}</p>
                            )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                      Selected {selectedLeads.length} of {csvLeads.length} leads
                </p>
                  </div>
                )}
              </div>

              {/* Property Details */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Property Details (for customer SMS/alert) *
                </label>
                <textarea
                  value={propertyDetails}
                  onChange={e => setPropertyDetails(e.target.value)}
                  placeholder="Enter property details for this campaign..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                  disabled={loading || !campaignName.trim() || !getFinalPrompt().trim() || selectedLeads.length === 0 || !propertyDetails.trim()}
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