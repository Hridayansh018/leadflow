"use client";

import React, { useState, useEffect } from 'react';
import { Play, Pause, StopCircle, Trash2, Eye, BarChart3, AlertTriangle, TrendingUp, Users, Phone, CheckCircle, FileText, Clock, UserPlus, PhoneCall } from 'lucide-react';
import vapiService from '../services/vapiService';
import CampaignCreator from './CampaignCreator';

interface Campaign {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  leadsCount: number;
  completionRate: number;
}

interface CampaignAnalytics {
  totalCalls: number;
  answeredCalls: number;
  unansweredCalls: number;
  failedCalls: number;
  averageCallDuration: number;
  answerRate: number;
  successRate: number;
  conversionRate: number;
  leadsGenerated: number;
  callbackRequests: number;
  interestedCustomers: number;
  callTimeline: Array<{
    date: string;
    calls: number;
    answered: number;
    conversions: number;
  }>;
  topPerformingLeads: Array<{
    name: string;
    phone: string;
    status: string;
    duration: number;
    interest: string;
  }>;
}

interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category: 'lead-followup' | 'property-showing' | 'general' | 'custom';
  variables: string[];
}

export default function CampaignManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates] = useState<CampaignTemplate[]>(vapiService.getCampaignTemplates());
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const vapiCampaigns = await vapiService.getCampaigns();
      
      // Calculate real completion rates for each campaign
      const campaignData: Campaign[] = await Promise.all(
        vapiCampaigns.map(async (campaign) => {
          try {
            // Get detailed campaign information
            const campaignDetails = await vapiService.getCampaignDetails(campaign.id);
            const totalLeads = campaign.leads.length;
            const completedCalls = campaignDetails.callStatuses.filter(
              call => ['answered', 'unanswered', 'failed'].includes(call.status)
            ).length;
            const completionRate = totalLeads > 0 ? (completedCalls / totalLeads) * 100 : 0;
            
            return {
              id: campaign.id,
              name: campaign.name,
              status: campaign.status,
              createdAt: campaign.createdAt,
              leadsCount: totalLeads,
              completionRate: Math.round(completionRate)
            };
          } catch (error) {
            console.error(`Error getting details for campaign ${campaign.id}:`, error);
            return {
              id: campaign.id,
              name: campaign.name,
              status: campaign.status,
              createdAt: campaign.createdAt,
              leadsCount: campaign.leads.length,
              completionRate: 0
            };
          }
        })
      );

      setCampaigns(campaignData);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignAction = async (campaignId: string, action: 'pause' | 'resume' | 'stop' | 'delete') => {
    try {
      setActionLoading(campaignId);
      
      let result;
      switch (action) {
        case 'pause':
          result = await vapiService.pauseCampaign(campaignId);
          break;
        case 'resume':
          result = await vapiService.resumeCampaign(campaignId);
          break;
        case 'stop':
          result = await vapiService.stopCampaign(campaignId);
          break;
        case 'delete':
          result = await vapiService.deleteCampaign(campaignId);
          break;
      }
      
      if (result.success) {
        // Update local state
        setCampaigns(prev => prev.map(campaign => {
          if (campaign.id === campaignId) {
            let newStatus = campaign.status;
            switch (action) {
              case 'pause':
                newStatus = 'paused';
                break;
              case 'resume':
                newStatus = 'active';
                break;
              case 'stop':
                newStatus = 'completed';
                break;
              case 'delete':
                return null; // Remove from list
            }
            return { ...campaign, status: newStatus };
          }
          return campaign;
        }).filter(Boolean) as Campaign[]);
        
        alert(`✅ ${result.message}`);
      } else {
        alert(`❌ ${result.message}`);
      }
      
    } catch (error) {
      console.error(`Error ${action}ing campaign:`, error);
      alert(`❌ Error ${action}ing campaign: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const loadCampaignAnalytics = async (campaignId: string) => {
    try {
      setAnalyticsLoading(true);
      const result = await vapiService.getCampaignAnalytics(campaignId);
      
      if (result.success && result.data) {
        setAnalytics(result.data);
        setShowAnalytics(true);
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      alert(`❌ Error loading analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleTemplateSelect = (template: CampaignTemplate) => {
    setSelectedTemplate(template);
    
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Play className="h-4 w-4" />;
      case 'paused':
        return <Pause className="h-4 w-4" />;
      case 'completed':
        return <BarChart3 className="h-4 w-4" />;
      case 'scheduled':
        return <Eye className="h-4 w-4" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const canPause = (status: string) => status === 'active';
  const canResume = (status: string) => status === 'paused';
  const canStop = (status: string) => ['active', 'paused'].includes(status);
  const canDelete = (status: string) => ['completed', 'failed', 'paused'].includes(status);

  const renderAnalytics = () => {
    if (!analytics) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center">
              <BarChart3 className="h-6 w-6 text-blue-400 mr-3" />
              <h2 className="text-xl font-bold text-white">Campaign Analytics</h2>
            </div>
            <button
              onClick={() => setShowAnalytics(false)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>

          <div className="p-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-blue-400 mr-2" />
                  <span className="text-gray-300 text-sm">Total Calls</span>
                </div>
                <p className="text-2xl font-bold text-white">{analytics.totalCalls}</p>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  <span className="text-gray-300 text-sm">Answered</span>
                </div>
                <p className="text-2xl font-bold text-white">{analytics.answeredCalls}</p>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-purple-400 mr-2" />
                  <span className="text-gray-300 text-sm">Answer Rate</span>
                </div>
                <p className="text-2xl font-bold text-white">{analytics.answerRate.toFixed(1)}%</p>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-orange-400 mr-2" />
                  <span className="text-gray-300 text-sm">Conversions</span>
                </div>
                <p className="text-2xl font-bold text-white">{analytics.conversionRate.toFixed(1)}%</p>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-yellow-400 mr-2" />
                  <span className="text-gray-300 text-sm">Avg Duration</span>
                </div>
                <p className="text-2xl font-bold text-white">{Math.floor(analytics.averageCallDuration / 60)}m {analytics.averageCallDuration % 60}s</p>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 text-indigo-400 mr-2" />
                  <span className="text-gray-300 text-sm">Success Rate</span>
                </div>
                <p className="text-2xl font-bold text-white">{analytics.successRate.toFixed(1)}%</p>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center">
                  <UserPlus className="h-5 w-5 text-teal-400 mr-2" />
                  <span className="text-gray-300 text-sm">Leads Generated</span>
                </div>
                <p className="text-2xl font-bold text-white">{analytics.leadsGenerated}</p>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center">
                  <PhoneCall className="h-5 w-5 text-pink-400 mr-2" />
                  <span className="text-gray-300 text-sm">Callbacks</span>
                </div>
                <p className="text-2xl font-bold text-white">{analytics.callbackRequests}</p>
              </div>
            </div>

            {/* Timeline Chart */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Call Timeline (Last 7 Days)</h3>
              <div className="space-y-2">
                {analytics.callTimeline.map((day, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">{day.date}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-blue-400 text-sm">{day.calls} calls</span>
                      <span className="text-green-400 text-sm">{day.answered} answered</span>
                      <span className="text-purple-400 text-sm">{day.conversions} conversions</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Performing Leads */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Top Performing Leads</h3>
              <div className="space-y-2">
                {analytics.topPerformingLeads.map((lead, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                    <div>
                      <p className="text-white font-medium">{lead.name}</p>
                      <p className="text-gray-400 text-sm">{lead.phone}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        lead.interest === 'high' ? 'bg-green-100 text-green-800' :
                        lead.interest === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {lead.interest} interest
                      </span>
                      <span className="text-gray-400 text-sm">{lead.duration}s</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTemplates = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-blue-400 mr-3" />
              <h2 className="text-xl font-bold text-white">Campaign Templates</h2>
            </div>
            <button
              onClick={() => setShowTemplates(false)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`bg-gray-800 p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedTemplate?.id === template.id 
                      ? 'border-blue-500 bg-blue-900 bg-opacity-20' 
                      : 'border-gray-700 hover:border-blue-500'
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <h3 className="font-medium text-white mb-2">{template.name}</h3>
                  <p className="text-gray-400 text-sm mb-3">{template.description}</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs ${
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

            {selectedTemplate && (
              <div className="mt-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Template Preview</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Variables</label>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedTemplate.variables.map((variable) => (
                        <div key={variable} className="flex flex-col">
                          <label className="text-xs text-gray-400">{variable}</label>
                          <input
                            type="text"
                            value={templateVariables[variable] || ''}
                            onChange={(e) => setTemplateVariables(prev => ({ ...prev, [variable]: e.target.value }))}
                            className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Processed Prompt</label>
                    <div className="bg-gray-700 p-3 rounded border border-gray-600">
                      <p className="text-white text-sm">
                        {vapiService.processCampaignTemplate(selectedTemplate.id, templateVariables)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Campaign Manager</h3>
        <div className="flex space-x-2">
          <CampaignCreator />
          <button
            onClick={() => setShowTemplates(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            <FileText className="h-4 w-4 mr-2 inline" />
            Templates
          </button>
          <button
            onClick={loadCampaigns}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-300">No campaigns found</p>
          <p className="text-sm text-gray-400 mt-2">Create a campaign to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className={`border rounded-lg p-4 transition-colors ${
                selectedCampaign === campaign.id
                  ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(campaign.status)}
                  <div>
                    <h4 className="font-medium text-white">{campaign.name}</h4>
                    <p className="text-sm text-gray-400">Created {formatDate(campaign.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-400">Leads</p>
                  <p className="font-medium text-white">{campaign.leadsCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Completion</p>
                  <p className="font-medium text-white">{campaign.completionRate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">ID</p>
                  <p className="font-medium text-xs font-mono text-white">{campaign.id.slice(0, 8)}...</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Status</p>
                  <p className="font-medium capitalize text-white">{campaign.status}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {canPause(campaign.status) && (
                  <button
                    onClick={() => handleCampaignAction(campaign.id, 'pause')}
                    disabled={actionLoading === campaign.id}
                    className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center"
                  >
                    <Pause className="h-3 w-3 mr-1" />
                    Pause
                  </button>
                )}
                
                {canResume(campaign.status) && (
                  <button
                    onClick={() => handleCampaignAction(campaign.id, 'resume')}
                    disabled={actionLoading === campaign.id}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Resume
                  </button>
                )}
                
                {canStop(campaign.status) && (
                  <button
                    onClick={() => handleCampaignAction(campaign.id, 'stop')}
                    disabled={actionLoading === campaign.id}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
                  >
                    <StopCircle className="h-3 w-3 mr-1" />
                    Stop
                  </button>
                )}
                
                {canDelete(campaign.status) && (
                  <button
                    onClick={() => handleCampaignAction(campaign.id, 'delete')}
                    disabled={actionLoading === campaign.id}
                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </button>
                )}
                
                <button
                  onClick={() => loadCampaignAnalytics(campaign.id)}
                  disabled={analyticsLoading}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Analytics
                </button>
                
                <button
                  onClick={() => setSelectedCampaign(campaign.id)}
                  className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Details
                </button>
              </div>

              {actionLoading === campaign.id && (
                <div className="mt-2 text-sm text-gray-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 inline mr-2"></div>
                  Processing...
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAnalytics && renderAnalytics()}
      {showTemplates && renderTemplates()}
    </div>
  );
} 