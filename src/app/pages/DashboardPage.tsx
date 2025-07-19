"use client";

import { useState, useEffect } from 'react';
import { Play, Upload, Plus, Trash2, Phone, Users, BarChart3, Calendar, Pause, CheckCircle, Clock } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useData } from '../context/DataContext';
import vapiService from '../../services/vapiService';
import dashboardService, { DashboardMetrics } from '../../services/dashboardService';
import { showSuccess, showError, showWarning, showInfo, showConfirmation } from '../../utils/toastUtils';

import leadService from '../../services/leadService';
import { timezones, getCurrentTimeInTimezone } from '../../utils/timezoneUtils';

import PropertyFileManager from '../../components/PropertyFileManager';
import CallHistoryTable from '../../components/CallHistoryTable';
import CampaignHistoryTable from '../../components/CampaignHistoryTable';

import CampaignManager from '../../components/CampaignManager';
import AdvancedAnalytics from '../../components/AdvancedAnalytics';

interface DashboardPageProps {
  onNavigate: (route: string) => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { campaigns, addCampaign, deleteCampaign, addCallHistory } = useData();
  const [campaignName, setCampaignName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerInfo, setCustomerInfo] = useState('');
  const [callSchedule, setCallSchedule] = useState<'now' | 'schedule'>('now');
  const [campaignSchedule, setCampaignSchedule] = useState<'now' | 'schedule'>('now');
  const [scheduledTime, setScheduledTime] = useState('');
  const [campaignScheduledTime, setCampaignScheduledTime] = useState('');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  const [callTimeOfDay, setCallTimeOfDay] = useState('17:00');
  const [useTimeOfDay, setUseTimeOfDay] = useState(false);
  const [scheduledCalls, setScheduledCalls] = useState<Array<{id: string; scheduledTime: string; request: {customer: {name?: string; number: string}}; status: string}>>([]);
  const [campaignPrompt, setCampaignPrompt] = useState('');
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  
  // New state for property file selection
  const [selectedPropertyFileId, setSelectedPropertyFileId] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calls' | 'campaigns' | 'analytics'>('dashboard');
  
  // Campaign status filter
  const [campaignStatusFilter, setCampaignStatusFilter] = useState<'all' | 'active' | 'paused' | 'completed'>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [campaignCallHistory, setCampaignCallHistory] = useState<any[]>([]);

  // Dashboard metrics state
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Check VAPI configuration status
  const vapiConfig = vapiService.getConfigurationStatus();
  const isVapiConfigured = vapiService.isConfigured();

  // Test VAPI connection
  const testVAPIConnection = async () => {
    try {
      const result = await vapiService.testVAPIConnection();
      if (result.success) {
        showSuccess('VAPI API connection successful!');
      } else {
        showError(`VAPI API connection failed: ${result.message}`);
      }
    } catch (error) {
      showError(`Error testing VAPI connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Check campaign details and call statuses
  const checkCampaignDetails = async () => {
    try {
      // Get all campaigns first
      const campaigns = await vapiService.getCampaigns();
      if (campaigns.length === 0) {
        showWarning('No campaigns found. Create a campaign first.');
        return;
      }
      
      // Get details for the most recent campaign
      const latestCampaign = campaigns[campaigns.length - 1];
      const details = await vapiService.getCampaignDetails(latestCampaign.id);
      
      const message = `Campaign: ${details.campaign.name}\n` +
        `Status: ${details.campaign.status}\n` +
        `Total Calls: ${details.callStatuses.length}\n` +
        `Call Statuses:\n${details.callStatuses.map(call => 
          `- ${call.customerName} (${call.phoneNumber}): ${call.status}`
        ).join('\n')}`;
      
      showInfo(message);
    } catch (error) {
      console.error('Campaign details error:', error);
      showError(`Error checking campaign details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Load campaign call history
  const loadCampaignCallHistory = async (campaignId: string) => {
    try {
      const details = await vapiService.getCampaignDetails(campaignId);
      setCampaignCallHistory(details.callStatuses);
    } catch (error) {
      console.error('Error loading campaign call history:', error);
      setCampaignCallHistory([]);
    }
  };

  // Handle campaign selection
  const handleCampaignSelect = async (campaignId: string) => {
    setSelectedCampaign(campaignId);
    await loadCampaignCallHistory(campaignId);
  };

  const handleCreateCampaign = async () => {
    if (!campaignName || !campaignPrompt) {
      showWarning('Please enter both campaign name and prompt.');
      return;
    }

    try {
      setIsCreatingCampaign(true);

      // Get leads from leadService
      let leads: any[] = [];
      try {
        const leadResponse = await leadService.getLeads();
        leads = leadResponse.leads || [];
      } catch (error) {
        console.error('Error fetching leads:', error);
        showError('Failed to fetch leads. Please try again.');
        return;
      }

      if (leads.length === 0) {
        showWarning('No leads available. Please add some leads first.');
        return;
      }

      // Create campaign request
      const campaignRequest = {
        name: campaignName,
        assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!,
        phoneNumberId: process.env.NEXT_PUBLIC_PHONE_NUMBER_ID!,
        leads: leads.map(lead => ({
          name: lead.name,
          phone: lead.phone,
          info: lead.notes || ''
        })),
        prompt: campaignPrompt
      };

      let campaignResponse;

      if (campaignSchedule === 'now') {
        // Start campaign immediately
        console.log('Starting campaign immediately...');
        campaignResponse = await vapiService.createCampaign(campaignRequest);
        showSuccess(`Campaign started successfully! Campaign ID: ${campaignResponse.id}`);
      } else {
        // Schedule the campaign - use createCampaign with scheduledTime
        console.log('Scheduling campaign...');
        campaignResponse = await vapiService.createCampaign({
          ...campaignRequest,
          scheduledTime: campaignScheduledTime
      });
        showSuccess(`Campaign scheduled successfully! Campaign ID: ${campaignResponse.id}`);
      }

      // Add to local campaigns
      addCampaign({
        name: campaignName,
        status: 'active',
        leads: leads.length,
        createdAt: new Date().toISOString()
      });
      
      setCampaignName('');
      setCampaignPrompt('');
      setCampaignScheduledTime('');
      setCampaignSchedule('now');
    } catch (error) {
      console.error('Error creating campaign:', error);
      showError('Failed to create campaign. Please check your VAPI configuration.');
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  const handleMakeCall = async () => {
    if (customerName && customerPhone) {
      try {
        const callRequest = {
          customer: {
            name: customerName,
            number: customerPhone
          },
          assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!,
          phoneNumberId: process.env.NEXT_PUBLIC_PHONE_NUMBER_ID!,
          metadata: {
            customerInfo: customerInfo
          }
        };

        let callResponse;
        
        if (callSchedule === 'now') {
          // Make immediate VAPI call
          console.log('Making immediate call...');
          callResponse = await vapiService.makeCall(callRequest);
          showSuccess(`Call initiated successfully! Call ID: ${callResponse.id}`);
        } else {
          // Schedule the call
          console.log('Scheduling call...');
          if (useTimeOfDay) {
            // Use time of day scheduling
            callResponse = await vapiService.scheduleCall({
              ...callRequest,
              timeOfDay: callTimeOfDay,
              timezone: timezone
            });
          } else {
            // Use specific date/time scheduling
            callResponse = await vapiService.scheduleCall({
              ...callRequest,
              scheduledTime: scheduledTime
            });
          }
          showSuccess(`Call scheduled successfully! Call ID: ${callResponse.id}`);
        }

        // Add to local call history
        addCallHistory({
          customerName,
          phoneNumber: customerPhone,
          duration: '0:00',
          status: 'answered',
          type: 'single',
          timestamp: callSchedule === 'now' 
            ? new Date().toLocaleString() 
            : useTimeOfDay 
              ? `Daily at ${callTimeOfDay}` 
              : scheduledTime
        });

        setCustomerName('');
        setCustomerPhone('');
        setCustomerInfo('');
        setScheduledTime('');
        setCallSchedule('now');
      } catch (error) {
        console.error('Error making call:', error);
        showError('Failed to initiate call. Please check your VAPI configuration. Try "Call Now" first to test the basic connection.');
      }
    } else {
      showWarning('Please enter both customer name and phone number.');
    }
  };

  // Load scheduled calls
  const loadScheduledCalls = () => {
    const calls = vapiService.getScheduledCalls();
    setScheduledCalls(calls.map(call => ({
      id: call.id,
      scheduledTime: call.scheduledTime,
      request: call.request,
      status: call.status
    })));
  };

  // Cancel a scheduled call
  const handleCancelScheduledCall = (id: string) => {
    if (vapiService.cancelScheduledCall(id)) {
      setScheduledCalls(prev => prev.filter(call => call.id !== id));
      showSuccess('Scheduled call cancelled successfully!');
    } else {
      showError('Failed to cancel scheduled call.');
    }
  };

  // Load scheduled calls on component mount
  useEffect(() => {
    loadScheduledCalls();
    // Refresh scheduled calls every 30 seconds
    const interval = setInterval(loadScheduledCalls, 30000);
    return () => clearInterval(interval);
  }, []);

  const [stats, setStats] = useState([
    { name: 'Total Campaigns', value: 0, icon: BarChart3, color: 'bg-blue-500' },
    { name: 'Active Campaigns', value: 0, icon: Play, color: 'bg-green-500' },
    { name: 'Paused Campaigns', value: 0, icon: Pause, color: 'bg-yellow-500' },
    { name: 'Completed Campaigns', value: 0, icon: CheckCircle, color: 'bg-purple-500' }
  ]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        // Fetch campaigns from VAPI
        const campaigns = await vapiService.getCampaigns();
        // Fetch leads from leadService
        let leads: any[] = [];
        try {
          const leadResponse = await leadService.getLeads();
          leads = leadResponse.leads || [];
        } catch {
          // fallback: count leads from campaigns if DB fails
          leads = campaigns.flatMap(c => c.leads || []);
        }
        // Calculate stats
        const now = new Date();
        const thisMonth = now.toISOString().slice(0, 7); // 'YYYY-MM'
        setStats([
          {
            name: 'Total Campaigns',
            value: campaigns.length,
            icon: BarChart3,
            color: 'bg-blue-500'
          },
          {
            name: 'Active Campaigns',
            value: campaigns.filter(c => c.status === 'active').length,
            icon: Play,
            color: 'bg-green-500'
          },
          {
            name: 'Paused Campaigns',
            value: campaigns.filter(c => c.status === 'paused').length,
            icon: Pause,
            color: 'bg-yellow-500'
          },
          {
            name: 'Completed Campaigns',
            value: campaigns.filter(c => c.status === 'completed').length,
            icon: CheckCircle,
            color: 'bg-purple-500'
          }
        ]);
      } catch {
        setStats([
          { name: 'Total Campaigns', value: 0, icon: BarChart3, color: 'bg-blue-500' },
          { name: 'Active Campaigns', value: 0, icon: Play, color: 'bg-green-500' },
          { name: 'Paused Campaigns', value: 0, icon: Pause, color: 'bg-yellow-500' },
          { name: 'Completed Campaigns', value: 0, icon: CheckCircle, color: 'bg-purple-500' }
        ]);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  // Load dashboard metrics
  const loadDashboardMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const metrics = await dashboardService.getDashboardMetrics();
      setDashboardMetrics(metrics);
    } catch (error) {
      console.error('Error loading dashboard metrics:', error);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Refresh dashboard data
  const refreshDashboard = () => {
    loadDashboardMetrics();
  };

  useEffect(() => {
    loadDashboardMetrics();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900">
      <Header onNavigate={onNavigate} currentRoute="dashboard" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loadingStats ? (
            Array(4).fill(0).map((_, idx) => (
              <div key={idx} className="bg-gray-800 p-6 rounded-lg border border-gray-700 animate-pulse h-28" />
            ))
          ) : (
            stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.name} className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${stat.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-300">{stat.name}</p>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* VAPI Configuration Status */}
        {!isVapiConfigured && (
          <div className="mb-8 bg-red-900 border border-red-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-200">
                    VAPI Not Configured
                </h3>
                <div className="mt-2 text-sm text-red-300">
                  <p>{vapiConfig.message}</p>
                </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={testVAPIConnection}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  Test Connection
                </button>
                <button
                  onClick={checkCampaignDetails}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                >
                  Check Campaign Details
                </button>
              </div>
            </div>
          </div>
        )}

        {isVapiConfigured && (
          <div className="mb-8 bg-green-900 border border-green-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-200">
                    VAPI Ready
                  </h3>
                  <div className="mt-2 text-sm text-green-300">
                    <p>{vapiConfig.message}</p>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={testVAPIConnection}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  Test Connection
                </button>
                <button
                  onClick={checkCampaignDetails}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                >
                  Check Campaign Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('calls')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'calls'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Call History
            </button>
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'campaigns'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Campaign History
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Analytics
            </button>
          </nav>
          {activeTab === 'dashboard' && (
            <button
              onClick={refreshDashboard}
              disabled={loadingMetrics}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white px-3 py-2 rounded-md font-medium transition-colors flex items-center text-sm"
            >
              <svg className={`h-4 w-4 mr-2 ${loadingMetrics ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Key Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {loadingMetrics ? (
                Array(4).fill(0).map((_, idx) => (
                  <div key={idx} className="bg-gray-800 p-6 rounded-lg border border-gray-700 animate-pulse h-28" />
                ))
              ) : (
                <>
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <div className="flex items-center">
                      <div className="p-3 rounded-lg bg-blue-500">
                        <Users className="h-6 w-6 text-white" />
              </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-300">Total Leads</p>
                        <p className="text-2xl font-bold text-white">{dashboardMetrics?.totalLeads || 0}</p>
                        <p className="text-xs text-green-400">Real-time data</p>
                </div>
              </div>
            </div>
            
                  <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <div className="flex items-center">
                      <div className="p-3 rounded-lg bg-green-500">
                        <Phone className="h-6 w-6 text-white" />
                </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-300">Calls Today</p>
                        <p className="text-2xl font-bold text-white">{dashboardMetrics?.callsToday || 0}</p>
                        <p className="text-xs text-green-400">From VAPI</p>
              </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <div className="flex items-center">
                      <div className="p-3 rounded-lg bg-purple-500">
                        <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-300">Conversion Rate</p>
                        <p className="text-2xl font-bold text-white">{dashboardMetrics?.conversionRate || 0}%</p>
                        <p className="text-xs text-green-400">Calculated from leads</p>
                  </div>
                        </div>
                        </div>

                  <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <div className="flex items-center">
                      <div className="p-3 rounded-lg bg-orange-500">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-300">Active Campaigns</p>
                        <p className="text-2xl font-bold text-white">{dashboardMetrics?.activeCampaigns || 0}</p>
                        <p className="text-xs text-blue-400">From VAPI</p>
                        </div>
                    </div>
                      </div>
                </>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Quick Actions
                </h3>
                <div className="space-y-3">
            <button
                    onClick={() => onNavigate('leads')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-medium transition-colors flex items-center justify-center"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Add New Lead
            </button>
                    <button
                    onClick={() => setActiveTab('calls')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md font-medium transition-colors flex items-center justify-center"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Make Single Call
                  </button>
                  <button
                    onClick={() => setActiveTab('campaigns')}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-md font-medium transition-colors flex items-center justify-center"
                    >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Create Campaign
                    </button>
                  </div>
                </div>

              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {loadingMetrics ? (
                    Array(4).fill(0).map((_, idx) => (
                      <div key={idx} className="p-3 bg-gray-700 rounded-md animate-pulse h-16" />
                    ))
                  ) : dashboardMetrics?.recentActivity && dashboardMetrics.recentActivity.length > 0 ? (
                    dashboardMetrics.recentActivity.slice(0, 4).map((activity, index) => (
                      <div key={activity.id || index} className="flex items-center space-x-3 p-3 bg-gray-700 rounded-md">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'call' ? 'bg-green-400' :
                          activity.type === 'lead' ? 'bg-blue-400' :
                          activity.type === 'campaign' ? 'bg-purple-400' :
                          'bg-orange-400'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{activity.title}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 py-4">
                      <p className="text-sm">No recent activity</p>
                    </div>
                  )}
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Performance Summary
                </h3>
                <div className="space-y-4">
              <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Call Success Rate</span>
                      <span className="text-white font-medium">{dashboardMetrics?.performanceMetrics.callSuccessRate || 0}%</span>
              </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: `${dashboardMetrics?.performanceMetrics.callSuccessRate || 0}%`}}></div>
              </div>
                  </div>
              <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Lead Response Rate</span>
                      <span className="text-white font-medium">{dashboardMetrics?.performanceMetrics.leadResponseRate || 0}%</span>
              </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                      <div className="bg-blue-500 h-2 rounded-full" style={{width: `${dashboardMetrics?.performanceMetrics.leadResponseRate || 0}%`}}></div>
                    </div>
                  </div>
              <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Conversion Rate</span>
                      <span className="text-white font-medium">{dashboardMetrics?.performanceMetrics.conversionRate || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                      <div className="bg-purple-500 h-2 rounded-full" style={{width: `${dashboardMetrics?.performanceMetrics.conversionRate || 0}%`}}></div>
                    </div>
                  </div>
                </div>
                </div>
              </div>

            {/* Lead Status Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Lead Status Distribution</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-gray-300">New Leads</span>
                    </div>
                    <span className="text-white font-medium">{dashboardMetrics?.leadStatusDistribution.new || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                      <span className="text-gray-300">Contacted</span>
                    </div>
                    <span className="text-white font-medium">{dashboardMetrics?.leadStatusDistribution.contacted || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                      <span className="text-gray-300">Qualified</span>
                        </div>
                    <span className="text-white font-medium">{dashboardMetrics?.leadStatusDistribution.qualified || 0}</span>
                        </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-gray-300">Converted</span>
                      </div>
                    <span className="text-white font-medium">{dashboardMetrics?.leadStatusDistribution.converted || 0}</span>
                        </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                      <span className="text-gray-300">Lost</span>
                    </div>
                    <span className="text-white font-medium">{dashboardMetrics?.leadStatusDistribution.lost || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Today's Schedule</h3>
                <div className="space-y-3">
                  {loadingMetrics ? (
                    Array(3).fill(0).map((_, idx) => (
                      <div key={idx} className="p-3 bg-gray-700 rounded-md animate-pulse h-16" />
                    ))
                  ) : dashboardMetrics?.todaysSchedule && dashboardMetrics.todaysSchedule.length > 0 ? (
                    dashboardMetrics.todaysSchedule.slice(0, 3).map((schedule, index) => (
                      <div key={schedule.id || index} className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
                    <div>
                          <p className="text-sm font-medium text-white">{schedule.title}</p>
                          <p className="text-xs text-gray-400">{schedule.contact} - {schedule.time}</p>
                      </div>
                        <span className={`text-xs text-white px-2 py-1 rounded-full ${
                          schedule.status === 'scheduled' ? 'bg-blue-500' :
                          schedule.status === 'confirmed' ? 'bg-green-500' :
                          'bg-purple-500'
                        }`}>
                          {schedule.status}
                        </span>
                    </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 py-4">
                      <p className="text-sm">No scheduled activities</p>
                </div>
              )}
                </div>
              </div>
            </div>
            
            {/* System Status */}
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                System Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`flex items-center space-x-3 p-3 rounded-md border ${
                  dashboardMetrics?.systemStatus.vapi 
                    ? 'bg-green-900 border-green-700' 
                    : 'bg-red-900 border-red-700'
                }`}>
                  {dashboardMetrics?.systemStatus.vapi ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <div className="h-5 w-5 bg-red-400 rounded-full"></div>
                  )}
                      <div>
                    <p className="text-sm font-medium text-white">VAPI Calling</p>
                    <p className={`text-xs ${
                      dashboardMetrics?.systemStatus.vapi ? 'text-green-300' : 'text-red-300'
                    }`}>
                      {dashboardMetrics?.systemStatus.vapi ? 'Connected & Ready' : 'Not Configured'}
                        </p>
                      </div>
                    </div>
                <div className={`flex items-center space-x-3 p-3 rounded-md border ${
                  dashboardMetrics?.systemStatus.database 
                    ? 'bg-green-900 border-green-700' 
                    : 'bg-red-900 border-red-700'
                }`}>
                  {dashboardMetrics?.systemStatus.database ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <div className="h-5 w-5 bg-red-400 rounded-full"></div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-white">Database</p>
                    <p className={`text-xs ${
                      dashboardMetrics?.systemStatus.database ? 'text-green-300' : 'text-red-300'
                    }`}>
                      {dashboardMetrics?.systemStatus.database ? 'Supabase Connected' : 'Connection Failed'}
                    </p>
                  </div>
                </div>
          </div>
        </div>
          </div>
        )}

        {/* Call History Tab */}
        {activeTab === 'calls' && (
          <div className="space-y-6">
            <CallHistoryTable />
          </div>
        )}

        {/* Campaign History Tab */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Campaign Manager</h3>
                <CampaignManager />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Advanced Analytics</h3>
              <AdvancedAnalytics />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Campaign History</h3>
              <CampaignHistoryTable />
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <AdvancedAnalytics />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}