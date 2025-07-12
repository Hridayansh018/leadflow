"use client";

import React, { useState, useEffect } from 'react';
import { RefreshCw, Play, Pause, BarChart3, Users, Phone, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import vapiService from '../services/vapiService';

// Import the VAPICampaignResponse type
type VAPICampaignResponse = {
  id: string;
  name: string;
  status: string;
  assistantId: string;
  phoneNumberId: string;
  leads: Array<{
    name: string;
    phone: string;
    info?: string;
  }>;
  prompt?: string;
  createdAt: string;
};

interface CampaignStatus {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  leadsCount: number;
  callsCompleted: number;
  callsInProgress: number;
  callsScheduled: number;
  callsFailed: number;
  completionRate: number;
}

interface CallStatus {
  callId: string;
  customerName: string;
  phoneNumber: string;
  status: string;
  duration?: string;
  createdAt: string;
}

export default function CampaignStatusChecker() {
  const [campaigns, setCampaigns] = useState<CampaignStatus[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [campaignDetails, setCampaignDetails] = useState<{
    campaign: VAPICampaignResponse;
    callStatuses: CallStatus[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  // Load campaigns on component mount
  useEffect(() => {
    loadCampaigns();
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadCampaigns();
      if (selectedCampaign) {
        loadCampaignDetails(selectedCampaign);
      }
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, selectedCampaign]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const vapiCampaigns = await vapiService.getCampaigns();
      
      // Get real campaign status with detailed call information
      const campaignStatuses: CampaignStatus[] = await Promise.all(
        vapiCampaigns.map(async (campaign) => {
          try {
            // Get detailed campaign information
            const campaignDetails = await vapiService.getCampaignDetails(campaign.id);
            const callStatuses = campaignDetails.callStatuses;
            
            // Calculate real call statistics
            const callsCompleted = callStatuses.filter(call => 
              ['answered', 'unanswered', 'failed'].includes(call.status)
            ).length;
            const callsInProgress = callStatuses.filter(call => 
              call.status === 'in-progress'
            ).length;
            const callsScheduled = campaign.leads.length;
            const callsFailed = callStatuses.filter(call => 
              call.status === 'failed'
            ).length;
            const completionRate = callsScheduled > 0 ? (callsCompleted / callsScheduled) * 100 : 0;

            return {
              id: campaign.id,
              name: campaign.name,
              status: campaign.status,
              createdAt: campaign.createdAt,
              leadsCount: campaign.leads.length,
              callsCompleted,
              callsInProgress,
              callsScheduled,
              callsFailed,
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
              callsCompleted: 0,
              callsInProgress: 0,
              callsScheduled: campaign.leads.length,
              callsFailed: 0,
              completionRate: 0
            };
          }
        })
      );

      setCampaigns(campaignStatuses);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaignDetails = async (campaignId: string) => {
    try {
      setLoading(true);
      const details = await vapiService.getCampaignDetails(campaignId);
      setCampaignDetails(details);
    } catch (error) {
      console.error('Error loading campaign details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignSelect = async (campaignId: string) => {
    setSelectedCampaign(campaignId);
    await loadCampaignDetails(campaignId);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Play className="h-4 w-4" />;
      case 'paused':
        return <Pause className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'scheduled':
        return <Clock className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getCallStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'answered':
        return 'bg-green-100 text-green-800';
      case 'unanswered':
        return 'bg-red-100 text-red-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (duration?: string) => {
    if (!duration) return '0:00';
    return duration;
  };

  return (
    <div className="bg-gray-700 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Campaign Status Monitor</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Auto-refresh</span>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={300}>5m</option>
            </select>
          </div>
          <button
            onClick={loadCampaigns}
            disabled={loading}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Campaign Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-900/50 p-4 rounded-lg border border-blue-700">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-300">Total Campaigns</p>
                <p className="text-2xl font-bold text-blue-100">{campaigns.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-900/50 p-4 rounded-lg border border-green-700">
            <div className="flex items-center">
              <Play className="h-8 w-8 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-300">Active</p>
                <p className="text-2xl font-bold text-green-100">
                  {campaigns.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-900/50 p-4 rounded-lg border border-yellow-700">
            <div className="flex items-center">
              <Pause className="h-8 w-8 text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-300">Paused</p>
                <p className="text-2xl font-bold text-yellow-100">
                  {campaigns.filter(c => c.status === 'paused').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-900/50 p-4 rounded-lg border border-purple-700">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-purple-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-300">Completed</p>
                <p className="text-2xl font-bold text-purple-100">
                  {campaigns.filter(c => c.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign List */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4">Campaigns</h4>
          <div className="space-y-3">
            {campaigns.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No campaigns found</p>
              </div>
            ) : (
              campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedCampaign === campaign.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleCampaignSelect(campaign.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(campaign.status)}
                      <h5 className="font-medium text-gray-900">{campaign.name}</h5>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Leads</p>
                      <p className="font-medium">{campaign.leadsCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Completion</p>
                      <p className="font-medium">{campaign.completionRate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Created</p>
                      <p className="font-medium">{formatDate(campaign.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Calls</p>
                      <p className="font-medium">{campaign.callsCompleted}/{campaign.callsScheduled}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Campaign Details */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4">Campaign Details</h4>
          {selectedCampaign && campaignDetails ? (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">{campaignDetails.campaign.name}</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaignDetails.campaign.status)}`}>
                      {campaignDetails.campaign.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Calls</p>
                    <p className="font-medium">{campaignDetails.callStatuses.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Created</p>
                    <p className="font-medium">{formatDate(campaignDetails.campaign.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">ID</p>
                    <p className="font-medium text-xs">{campaignDetails.campaign.id}</p>
                  </div>
                </div>
              </div>

              {/* Call Statuses */}
              <div>
                <h6 className="font-medium text-gray-900 mb-3">Call Statuses</h6>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {campaignDetails.callStatuses.length === 0 ? (
                    <p className="text-gray-500 text-sm">No calls found for this campaign</p>
                  ) : (
                    campaignDetails.callStatuses.map((call) => (
                      <div key={call.callId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{call.customerName}</p>
                          <p className="text-sm text-gray-600">{call.phoneNumber}</p>
                          <p className="text-xs text-gray-500">{formatDate(call.createdAt)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCallStatusColor(call.status)}`}>
                            {call.status}
                          </span>
                          {call.duration && (
                            <span className="text-xs text-gray-500">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {formatDuration(call.duration)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Phone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Select a campaign to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 