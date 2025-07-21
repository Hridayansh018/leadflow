"use client";

import { useState, useEffect } from 'react';
import { Play, BarChart3, Pause, CheckCircle } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useData } from '../context/DataContext';
import vapiService from '../../services/vapiService';
import dashboardService, { DashboardMetrics } from '../../services/dashboardService';
import { showSuccess, showError, showWarning, showInfo, showConfirmation } from '../../utils/toastUtils';

import leadService from '../../services/leadService';

import CallHistoryTable from '../../components/CallHistoryTable';

import CampaignManager from '../../components/CampaignManager';
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";

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
        `Total Calls: ${details.callDetails.length}\n` +
        `Call Statuses:\n${details.callDetails.map(call => 
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
      setCampaignCallHistory(details.callDetails);
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
        prompt: campaignPrompt,
        assistantOverrides: {
          variables: {
            property_details: campaignPrompt
          }
        }
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
          },
          assistantOverrides: {
            variables: {
              property_details: campaignPrompt
            }
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
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Header onNavigate={onNavigate} currentRoute="dashboard" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue={activeTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard" onClick={() => setActiveTab('dashboard')}>Dashboard</TabsTrigger>
            <TabsTrigger value="calls" onClick={() => setActiveTab('calls')}>Calls</TabsTrigger>
            <TabsTrigger value="campaigns" onClick={() => setActiveTab('campaigns')}>Campaigns</TabsTrigger>          </TabsList>
          <TabsContent value="dashboard">
            <Card className="mb-8 bg-[var(--card)] text-[var(--card-foreground)]">
              <CardHeader>
                <CardTitle>Dashboard Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <Card key={stat.name} className="flex flex-col items-center justify-center p-6 bg-[var(--muted)] text-[var(--foreground)] border-[var(--border)]">
                        <Icon className="h-8 w-8 mb-2" />
                        <div className="text-lg font-semibold">{stat.value}</div>
                        <div className="text-sm text-[var(--muted-foreground)]">{stat.name}</div>
                      </Card>
                    );
                  })}
                </div>
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-4 mb-8">
                  <Button onClick={testVAPIConnection} variant="secondary">Test VAPI Connection</Button>
                  <Button onClick={checkCampaignDetails} variant="secondary">Check Campaign Details</Button>
                  <Button onClick={refreshDashboard} variant="outline">Refresh Dashboard</Button>
                </div>
                {/* Dashboard Metrics Widget */}
                {dashboardMetrics && (
                  <Card className="mb-8 bg-[var(--muted)] text-[var(--foreground)] border-[var(--border)]">
                    <CardHeader>
                      <CardTitle>Key Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                          <div className="text-2xl font-bold">{dashboardMetrics.totalLeads}</div>
                          <div className="text-sm text-[var(--muted-foreground)]">Total Leads</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{dashboardMetrics.callsToday}</div>
                          <div className="text-sm text-[var(--muted-foreground)]">Calls Today</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{dashboardMetrics.activeCampaigns}</div>
                          <div className="text-sm text-[var(--muted-foreground)]">Active Campaigns</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{dashboardMetrics.conversionRate}%</div>
                          <div className="text-sm text-[var(--muted-foreground)]">Conversion Rate</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{dashboardMetrics.performanceMetrics.callSuccessRate}%</div>
                          <div className="text-sm text-[var(--muted-foreground)]">Call Success Rate</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{dashboardMetrics.performanceMetrics.leadResponseRate}%</div>
                          <div className="text-sm text-[var(--muted-foreground)]">Lead Response Rate</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {/* Scheduled Calls Widget */}
                <Card className="mb-8 bg-[var(--muted)] text-[var(--foreground)] border-[var(--border)]">
                  <CardHeader>
                    <CardTitle>Scheduled Calls</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {scheduledCalls.length === 0 ? (
                      <div className="text-[var(--muted-foreground)]">No scheduled calls.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-[var(--muted)]">
                            <tr>
                              <th className="px-4 py-2 text-left">Customer</th>
                              <th className="px-4 py-2 text-left">Scheduled Time</th>
                              <th className="px-4 py-2 text-left">Status</th>
                              <th className="px-4 py-2 text-left">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {scheduledCalls.map((call) => (
                              <tr key={call.id} className="border-b border-[var(--border)]">
                                <td className="px-4 py-2">{call.request.customer.name || call.request.customer.number}</td>
                                <td className="px-4 py-2">{call.scheduledTime}</td>
                                <td className="px-4 py-2">{call.status}</td>
                                <td className="px-4 py-2">
                                  <Button size="sm" variant="destructive" onClick={() => handleCancelScheduledCall(call.id)}>
                                    Cancel
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="calls">
            <Card className="mb-8 bg-[var(--card)] text-[var(--card-foreground)]">
              <CardHeader>
                <CardTitle>Call History</CardTitle>
              </CardHeader>
              <CardContent>
                <CallHistoryTable />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="campaigns">
            <CampaignManager />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}