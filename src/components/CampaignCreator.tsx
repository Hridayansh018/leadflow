"use client";

import React, { useState } from 'react';
import { Plus, Upload, FileText, X } from 'lucide-react';
import vapiService from '../services/vapiService';
import csvUploadService, { CSVLead } from '../services/csvUploadService';
import { showSuccess, showError, showWarning } from '../utils/toastUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

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
    setCustomPrompt('');
  };

  const handleCustomPromptChange = () => {
    setSelectedTemplate(null);
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
      const leads = await csvUploadService.parseCSVFile(file);
      if (leads.length === 0) {
        showError('No valid leads found in CSV file');
        return;
      }
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
      const campaignData = {
        name: campaignName,
        prompt: getFinalPrompt(),
        leads: selectedLeads,
        status: 'scheduled',
        property_details: propertyDetails
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
            metadata: { property_details: campaignData.property_details }
          };
        })
      });
      showSuccess('Campaign created successfully!');
      setShowCreator(false);
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
      <Button
        onClick={() => setShowCreator(true)}
        variant="secondary"
        className="flex items-center"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Campaign
      </Button>
      <Dialog open={showCreator} onOpenChange={setShowCreator}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[var(--card)] text-[var(--card-foreground)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-6 w-6 text-[var(--primary)]" /> Create New Campaign
            </DialogTitle>
          </DialogHeader>
          <div className="p-0 space-y-6">
              <div>
              <label className="block text-sm font-medium mb-2">Campaign Name *</label>
              <Input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Enter campaign name..."
                />
              </div>
              <div>
              <label className="block text-sm font-medium mb-2">Campaign Template</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {templates.map((template) => (
                  <Card
                      key={template.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedTemplate?.id === template.id ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-[var(--border)] hover:border-[var(--primary)]'}`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                    <h3 className="font-medium text-[var(--foreground)] text-sm">{template.name}</h3>
                    <p className="text-[var(--muted-foreground)] text-xs mt-1">{template.description}</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs mt-2 ${
                      template.category === 'lead-followup' ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' :
                      template.category === 'property-showing' ? 'bg-[var(--secondary)] text-[var(--secondary-foreground)]' :
                      template.category === 'general' ? 'bg-[var(--accent)] text-[var(--accent-foreground)]' :
                      'bg-[var(--muted)] text-[var(--muted-foreground)]'
                      }`}>
                        {template.category}
                      </span>
                  </Card>
                  ))}
                </div>
              </div>
              <div>
              <label className="block text-sm font-medium mb-2">Custom Prompt</label>
              <Input
                type="text"
                  value={customPrompt}
                onChange={(e) => { setCustomPrompt(e.target.value); handleCustomPromptChange(); }}
                placeholder="Enter a custom prompt..."
                />
              </div>
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
                <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Upload CSV File *</label>
              <div className="border-2 border-dashed border-[var(--border)] rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-[var(--muted-foreground)] mx-auto mb-2" />
                  <p className="text-[var(--muted-foreground)]">Click to upload CSV file</p>
                  <p className="text-[var(--muted-foreground)] text-xs">Required columns: name, email, phone</p>
                    </label>
                  </div>
                  {uploadedFile && (
                <div className="mt-2 flex items-center justify-between bg-[var(--muted)] p-2 rounded">
                      <div className="flex items-center">
                    <FileText className="h-4 w-4 text-[var(--success)] mr-2" />
                    <span className="text-[var(--foreground)] text-sm">{uploadedFile.name}</span>
                      </div>
                      <button
                        onClick={clearUploadedData}
                    className="text-[var(--destructive)] hover:text-[var(--destructive-foreground)]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                {csvLeads.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Select Leads *</label>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSelectAllLeads}
                      className="text-xs text-[var(--primary)] hover:text-[var(--primary-foreground)]"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleDeselectAllLeads}
                      className="text-xs text-[var(--muted-foreground)] hover:text-[var(--muted-foreground)]"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="max-h-40 overflow-y-auto bg-[var(--muted)] rounded border border-[var(--border)]">
                      {csvLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className={`flex items-center p-2 hover:bg-[var(--hover)] cursor-pointer ${
                        selectedLeads.includes(lead.id) ? 'bg-[var(--primary)]/10' : ''
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
                        <p className="text-[var(--foreground)] text-sm font-medium">{lead.name}</p>
                        <p className="text-[var(--muted-foreground)] text-xs">{lead.email} • {lead.phone}</p>
                            {lead.location && (
                          <p className="text-[var(--muted-foreground)] text-xs">{lead.location}</p>
                            )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                      Selected {selectedLeads.length} of {csvLeads.length} leads
                </p>
                  </div>
                )}
            <div>
              <label className="block text-sm font-medium mb-2">Property Details *</label>
              <Input
                type="text"
                value={propertyDetails}
                onChange={(e) => setPropertyDetails(e.target.value)}
                placeholder="Enter property details..."
              />
            </div>
            <DialogFooter className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowCreator(false)}>Cancel</Button>
              <Button
                onClick={createCampaign}
                disabled={loading || !campaignName.trim() || !getFinalPrompt().trim() || !propertyDetails.trim() || selectedLeads.length === 0}
              >
                {loading ? 'Creating...' : 'Create Campaign'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 