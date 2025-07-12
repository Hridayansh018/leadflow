"use client";

import { useState, useEffect } from 'react';
import { Play, Upload, Plus, Trash2, Phone, Users, BarChart3, Calendar } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useData } from '../context/DataContext';
import vapiService from '../../services/vapiService';

import leadService from '../../services/leadService';
import { timezones, getCurrentTimeInTimezone } from '../../utils/timezoneUtils';

import PropertyFileManager from '../../components/PropertyFileManager';
import CallHistoryTable from '../../components/CallHistoryTable';
import CampaignHistoryTable from '../../components/CampaignHistoryTable';

import CampaignStatusChecker from '../../components/CampaignStatusChecker';
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calls' | 'campaigns'>('dashboard');

  // Check VAPI configuration status
  const vapiConfig = vapiService.getConfigurationStatus();
  const isVapiConfigured = vapiService.isConfigured();

  // Test VAPI connection
  const testVAPIConnection = async () => {
    try {
      const result = await vapiService.testVAPIConnection();
      if (result.success) {
        alert('✅ VAPI API connection successful!');
      } else {
        alert(`❌ VAPI API connection failed: ${result.message}\n\nDetails: ${JSON.stringify(result.details, null, 2)}`);
      }
    } catch (error) {
      alert(`❌ Error testing VAPI connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Check campaign details and call statuses
  const checkCampaignDetails = async () => {
    try {
      // Get all campaigns first
      const campaigns = await vapiService.getCampaigns();
      if (campaigns.length === 0) {
        alert('No campaigns found. Create a campaign first.');
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
      
      alert(message);
    } catch (error) {
      console.error('Campaign details error:', error);
      alert(`❌ Error checking campaign details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };




  const handleCreateCampaign = async () => {
    if (!campaignName.trim()) {
      alert('Please enter a campaign name.');
      return;
    }



    if (campaignSchedule === 'schedule') {
      if (useTimeOfDay && !callTimeOfDay) {
        alert('Please select a time of day for the campaign.');
        return;
      }
      if (!useTimeOfDay && !campaignScheduledTime) {
        alert('Please select a scheduled time for the campaign.');
        return;
      }
    }

    setIsCreatingCampaign(true);

    try {
      // Get environment variables
      const phoneNumberId = process.env.NEXT_PUBLIC_PHONE_NUMBER_ID;
      const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
      
      console.log('Creating campaign with configuration:', {
        name: campaignName,
        phoneNumberId,
        assistantId,
        hasPhoneNumberId: !!phoneNumberId,
        hasAssistantId: !!assistantId,
        schedule: campaignSchedule,
        timeOfDay: useTimeOfDay ? callTimeOfDay : undefined,
        scheduledTime: !useTimeOfDay ? campaignScheduledTime : undefined
      });
      
      if (!phoneNumberId || !assistantId) {
        alert('Missing VAPI configuration. Please check your environment variables.');
        return;
      }

      // Create VAPI campaign with leads using native VAPI campaign API
      const campaignResponse = await vapiService.createCampaign({
        name: campaignName,
        assistantId,
        phoneNumberId,
        leads: [],
        prompt: campaignPrompt || 'Default campaign prompt for lead outreach',
        ...(campaignSchedule === 'schedule' && {
          ...(useTimeOfDay 
            ? { timeOfDay: callTimeOfDay, timezone: timezone }
            : { scheduledTime: campaignScheduledTime }
          )
        })
      });

      console.log('Campaign created successfully:', campaignResponse);

      // Add to local campaign list
      addCampaign({
        name: campaignName,
        leads: 0,
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0]
      });
      
      // Clear form
      setCampaignName('');

      setCampaignPrompt('');
      setCampaignScheduledTime('');
      setCampaignSchedule('now');
      
      alert(`Campaign "${campaignName}" created successfully!`);
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert(`Failed to create campaign: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your VAPI configuration.`);
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  const handleMakeCall = async () => {
    if (customerName.trim() && customerPhone.trim()) {
      try {
        // Get environment variables
        const phoneNumberId = process.env.NEXT_PUBLIC_PHONE_NUMBER_ID;
        const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
        
        if (!phoneNumberId || !assistantId) {
          alert('Missing VAPI configuration. Please check your environment variables.');
          return;
        }

        if (callSchedule === 'schedule') {
          if (useTimeOfDay) {
            // For time-of-day scheduling, check if time is selected
            if (!callTimeOfDay) {
              alert('Please select a time of day.');
              return;
            }
          } else {
            // For specific date/time scheduling, check if scheduled time is selected
            if (!scheduledTime) {
              alert('Please select a scheduled time.');
              return;
            }
          }
        }

        // Prepare call request
        const callRequest = {
          phoneNumberId,
          assistantId,
          customer: {
            number: customerPhone,
            name: customerName,
            info: customerInfo
          },
          metadata: {
            customerInfo: customerInfo
          }
        };

        let callResponse;
        
        if (callSchedule === 'now') {
          // Make immediate VAPI call
          console.log('Making immediate call...');
          callResponse = await vapiService.makeCall(callRequest);
          alert(`Call initiated successfully! Call ID: ${callResponse.id}`);
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
          alert(`Call scheduled successfully! Call ID: ${callResponse.id}`);
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
        alert('Failed to initiate call. Please check your VAPI configuration. Try "Call Now" first to test the basic connection.');
      }
    } else {
      alert('Please enter both customer name and phone number.');
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
      alert('Scheduled call cancelled successfully!');
    } else {
      alert('Failed to cancel scheduled call.');
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
    { name: 'Total Leads', value: 0, icon: Users, color: 'bg-purple-500' },
    { name: 'This Month', value: 0, icon: Calendar, color: 'bg-orange-500' }
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
            name: 'Total Leads',
            value: leads.length,
            icon: Users,
            color: 'bg-purple-500'
          },
          {
            name: 'This Month',
            value: campaigns.filter(c => (c.createdAt || '').startsWith(thisMonth)).length,
            icon: Calendar,
            color: 'bg-orange-500'
          }
        ]);
      } catch {
        setStats([
          { name: 'Total Campaigns', value: 0, icon: BarChart3, color: 'bg-blue-500' },
          { name: 'Active Campaigns', value: 0, icon: Play, color: 'bg-green-500' },
          { name: 'Total Leads', value: 0, icon: Users, color: 'bg-purple-500' },
          { name: 'This Month', value: 0, icon: Calendar, color: 'bg-orange-500' }
        ]);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
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
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-200">
                  VAPI Configuration Required
                </h3>
                <div className="mt-2 text-sm text-red-300">
                  <p>{vapiConfig.message}</p>
                  <p className="mt-1">
                    Please create a <code className="bg-red-800 px-1 rounded">.env</code> file with your VAPI credentials. 
                    See the README for setup instructions.
                  </p>
                </div>
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

        {/* Campaign Management Section */}
        {/* <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaign Management</h2>
          <CampaignManager />
        </div> */}





        {/* Tab Navigation */}
        <div className="mb-6">
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

          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Property File Manager */}
            {/* <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
              <PropertyFileManager
                selectedPropertyFileId={selectedPropertyFileId}
                onPropertyFileChange={setSelectedPropertyFileId}
              />
            </div> */}

            {/* Campaign and Call Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Campaign Section */}
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Campaign Management
              </h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter campaign name"
                />
              </div>
              

              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Campaign Prompt
                </label>
                <textarea
                  rows={3}
                  value={campaignPrompt}
                  onChange={(e) => setCampaignPrompt(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your campaign prompt (e.g., 'Hello, I'm calling about our real estate services...')"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Available Services File
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept=".json,.txt"
                    className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    <Upload className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Campaign Schedule
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="campaignSchedule"
                      value="now"
                      checked={campaignSchedule === 'now'}
                      onChange={(e) => setCampaignSchedule(e.target.value as 'now' | 'schedule')}
                      className="mr-2"
                    />
                    <span className="text-gray-300">Start Now</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="campaignSchedule"
                      value="schedule"
                      checked={campaignSchedule === 'schedule'}
                      onChange={(e) => setCampaignSchedule(e.target.value as 'now' | 'schedule')}
                      className="mr-2"
                    />
                    <span className="text-gray-300">Schedule Campaign</span>
                  </label>
                </div>
              </div>

              {campaignSchedule === 'schedule' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Timezone
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {timezones.map(tz => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label} ({tz.offset})
                        </option>
                      ))}
                    </select>
                    <div className="mt-1 text-xs text-gray-400">
                      Current time: {getCurrentTimeInTimezone(timezone)}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Scheduling Type
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="scheduleType"
                          value="specific"
                          checked={!useTimeOfDay}
                          onChange={() => setUseTimeOfDay(false)}
                          className="mr-2"
                        />
                        <span className="text-gray-300">Specific Date & Time</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="scheduleType"
                          value="timeOfDay"
                          checked={useTimeOfDay}
                          onChange={() => setUseTimeOfDay(true)}
                          className="mr-2"
                        />
                        <span className="text-gray-300">Time of Day</span>
                      </label>
                    </div>
                  </div>

                  {!useTimeOfDay ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Scheduled Date & Time
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Date</label>
                          <input
                            type="date"
                            value={campaignScheduledTime ? campaignScheduledTime.split('T')[0] : ''}
                            onChange={(e) => {
                              const date = e.target.value;
                              const time = campaignScheduledTime ? campaignScheduledTime.split('T')[1] || '12:00' : '12:00';
                              setCampaignScheduledTime(`${date}T${time}`);
                            }}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Time</label>
                          <input
                            type="time"
                            value={campaignScheduledTime ? campaignScheduledTime.split('T')[1] || '12:00' : '12:00'}
                            onChange={(e) => {
                              const time = e.target.value;
                              const date = campaignScheduledTime ? campaignScheduledTime.split('T')[0] : new Date().toISOString().split('T')[0];
                              setCampaignScheduledTime(`${date}T${time}`);
                            }}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      {campaignScheduledTime && (
                        <div className="mt-1 text-xs text-gray-400">
                          UTC: {new Date(campaignScheduledTime).toISOString()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Call Time of Day
                      </label>
                      <input
                        type="time"
                        value={callTimeOfDay}
                        onChange={(e) => setCallTimeOfDay(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="mt-1 text-xs text-gray-400">
                        Calls will be made at {callTimeOfDay} in {timezone} timezone
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>



            <button
              onClick={handleCreateCampaign}
              disabled={isCreatingCampaign}
              className={`w-full text-white py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center ${
                isCreatingCampaign 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isCreatingCampaign ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Campaign...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {campaignSchedule === 'now' ? 'Start Now' : 'Schedule Campaign'}
                </>
              )}
            </button>
            
            {/* Campaign List */}
            <div className="mt-6 space-y-3">
              <h3 className="text-lg font-medium text-white">Active Campaigns</h3>
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="bg-gray-900 p-4 rounded-md border border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white">{campaign.name}</h4>
                      <p className="text-sm text-gray-400">{campaign.leads} leads • {campaign.status}</p>
                    </div>
                    <button
                      onClick={() => deleteCampaign(campaign.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Single Call Section */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <Phone className="h-5 w-5 mr-2" />
              Single Call
            </h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter customer name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter mobile number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Additional Info (Optional)
                </label>
                <textarea
                  rows={3}
                  value={customerInfo}
                  onChange={(e) => setCustomerInfo(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter any additional information about the customer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Call Schedule
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="callSchedule"
                      value="now"
                      checked={callSchedule === 'now'}
                      onChange={(e) => setCallSchedule(e.target.value as 'now' | 'schedule')}
                      className="mr-2"
                    />
                    <span className="text-gray-300">Call Now</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="callSchedule"
                      value="schedule"
                      checked={callSchedule === 'schedule'}
                      onChange={(e) => setCallSchedule(e.target.value as 'now' | 'schedule')}
                      className="mr-2"
                    />
                    <span className="text-gray-300">Schedule Call</span>
                  </label>
                </div>
              </div>

              {callSchedule === 'schedule' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Timezone
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {timezones.map(tz => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label} ({tz.offset})
                        </option>
                      ))}
                    </select>
                    <div className="mt-1 text-xs text-gray-400">
                      Current time: {getCurrentTimeInTimezone(timezone)}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Scheduling Type
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="callScheduleType"
                          value="specific"
                          checked={!useTimeOfDay}
                          onChange={() => setUseTimeOfDay(false)}
                          className="mr-2"
                        />
                        <span className="text-gray-300">Specific Date & Time</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="callScheduleType"
                          value="timeOfDay"
                          checked={useTimeOfDay}
                          onChange={() => setUseTimeOfDay(true)}
                          className="mr-2"
                        />
                        <span className="text-gray-300">Time of Day</span>
                      </label>
                    </div>
                  </div>

                  {!useTimeOfDay ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Scheduled Date & Time
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Date</label>
                          <input
                            type="date"
                            value={scheduledTime ? scheduledTime.split('T')[0] : ''}
                            onChange={(e) => {
                              const date = e.target.value;
                              const time = scheduledTime ? scheduledTime.split('T')[1] || '12:00' : '12:00';
                              setScheduledTime(`${date}T${time}`);
                            }}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Time</label>
                          <input
                            type="time"
                            value={scheduledTime ? scheduledTime.split('T')[1] || '12:00' : '12:00'}
                            onChange={(e) => {
                              const time = e.target.value;
                              const date = scheduledTime ? scheduledTime.split('T')[0] : new Date().toISOString().split('T')[0];
                              setScheduledTime(`${date}T${time}`);
                            }}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      {scheduledTime && (
                        <div className="mt-1 text-xs text-gray-400">
                          UTC: {new Date(scheduledTime).toISOString()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Call Time of Day
                      </label>
                      <input
                        type="time"
                        value={callTimeOfDay}
                        onChange={(e) => setCallTimeOfDay(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="mt-1 text-xs text-gray-400">
                        Call will be made at {callTimeOfDay} in {timezone} timezone
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <button
              onClick={handleMakeCall}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center"
            >
              <Phone className="h-4 w-4 mr-2" />
              {callSchedule === 'now' ? 'Call Now' : 'Schedule Call'}
            </button>
            
            {/* Scheduled Calls Section */}
            {scheduledCalls.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-lg font-medium text-white">Scheduled Calls</h3>
                {scheduledCalls.map((call) => (
                  <div key={call.id} className="bg-gray-900 p-4 rounded-md border border-gray-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-white">{call.request.customer.name}</h4>
                        <p className="text-sm text-gray-400">
                          {call.request.customer.number} • {new Date(call.scheduledTime).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          Status: {call.status} • ID: {call.id}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCancelScheduledCall(call.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Cancel scheduled call"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Campaign Manager</h3>
                <CampaignManager />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Campaign Status Monitor</h3>
                <CampaignStatusChecker />
              </div>
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


      </main>

      <Footer />
    </div>
  );
}