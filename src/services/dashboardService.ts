import { supabase } from './supabase';
import vapiService from './vapiService';
import leadService from './leadService';
import emailDataService from './emailDataService';

export interface DashboardMetrics {
  totalLeads: number;
  callsToday: number;
  conversionRate: number;
  activeCampaigns: number;
  leadStatusDistribution: {
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
    lost: number;
  };
  performanceMetrics: {
    callSuccessRate: number;
    leadResponseRate: number;
    conversionRate: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'call' | 'lead' | 'campaign' | 'email';
    title: string;
    timestamp: string;
    status: string;
  }>;
  todaysSchedule: Array<{
    id: string;
    type: 'call' | 'showing' | 'campaign';
    title: string;
    time: string;
    status: 'scheduled' | 'confirmed' | 'pending';
    contact: string;
  }>;
  systemStatus: {
    vapi: boolean;
    email: boolean;
    database: boolean;
  };
}

class DashboardService {
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      // Fetch real data from multiple sources
      const [
        leadsData,
        callsData,
        campaignsData,
        emailsData,
        vapiStatus
      ] = await Promise.all([
        this.getLeadsData(),
        this.getCallsData(),
        this.getCampaignsData(),
        this.getEmailsData(),
        this.getVAPIStatus()
      ]);

      // Calculate metrics
      const totalLeads = leadsData.total;
      const callsToday = callsData.today;
      const conversionRate = this.calculateConversionRate(leadsData);
      const activeCampaigns = campaignsData.active;

      // Calculate lead status distribution
      const leadStatusDistribution = {
        new: leadsData.leads.filter(lead => lead.status === 'new').length,
        contacted: leadsData.leads.filter(lead => lead.status === 'contacted').length,
        qualified: leadsData.leads.filter(lead => lead.status === 'qualified').length,
        converted: leadsData.leads.filter(lead => lead.status === 'converted').length,
        lost: leadsData.leads.filter(lead => lead.status === 'lost').length
      };

      // Calculate performance metrics
      const performanceMetrics = {
        callSuccessRate: this.calculateCallSuccessRate(callsData),
        leadResponseRate: this.calculateLeadResponseRate(leadsData),
        conversionRate: conversionRate
      };

      // Get recent activity
      const recentActivity = await this.getRecentActivity(leadsData, callsData, campaignsData, emailsData);

      // Get today's schedule
      const todaysSchedule = await this.getTodaysSchedule(callsData, campaignsData);

      // System status
      const systemStatus = {
        vapi: vapiStatus.connected,
        email: emailsData.configured,
        database: true // Supabase connection is handled by the client
      };

      return {
        totalLeads,
        callsToday,
        conversionRate,
        activeCampaigns,
        leadStatusDistribution,
        performanceMetrics,
        recentActivity,
        todaysSchedule,
        systemStatus
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      // Return fallback data if there's an error
      return this.getFallbackMetrics();
    }
  }

  private async getLeadsData() {
    try {
      const response = await leadService.getLeads();
      const leads = response.leads || [];
      
      // Get leads created today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayLeads = leads.filter(lead => {
        const leadDate = new Date(lead.created_at || '');
        return leadDate >= today;
      });

      return {
        total: leads.length,
        today: todayLeads.length,
        leads: leads
      };
    } catch (error) {
      console.error('Error fetching leads data:', error);
      return { total: 0, today: 0, leads: [] };
    }
  }

  private async getCallsData() {
    try {
      // Get calls from VAPI
      const calls = await vapiService.getCalls();
      
      // Get calls from today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCalls = calls.filter(call => {
        const callDate = new Date(call.createdAt);
        return callDate >= today;
      });

      // Get answered calls
      const answeredCalls = calls.filter(call => call.status === 'answered');
      const totalCalls = calls.length;

      return {
        total: totalCalls,
        today: todayCalls.length,
        answered: answeredCalls.length,
        calls: calls
      };
    } catch (error) {
      console.error('Error fetching calls data:', error);
      return { total: 0, today: 0, answered: 0, calls: [] };
    }
  }

  private async getCampaignsData() {
    try {
      const campaigns = await vapiService.getCampaigns();
      const activeCampaigns = campaigns.filter(campaign => campaign.status === 'active');
      
      return {
        total: campaigns.length,
        active: activeCampaigns.length,
        campaigns: campaigns
      };
    } catch (error) {
      console.error('Error fetching campaigns data:', error);
      return { total: 0, active: 0, campaigns: [] };
    }
  }

  private async getEmailsData() {
    try {
      const response = await emailDataService.getEmails();
      const emails = response.emails || [];
      
      // Check if email service is configured
      const configured = !!(process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD);
      
      return {
        total: emails.length,
        configured: configured,
        emails: emails
      };
    } catch (error) {
      console.error('Error fetching emails data:', error);
      return { total: 0, configured: false, emails: [] };
    }
  }

  private async getVAPIStatus() {
    try {
      const status = vapiService.getConfigurationStatus();
      return {
        connected: status.apiKey,
        message: status.message
      };
    } catch (error) {
      console.error('Error checking VAPI status:', error);
      return {
        connected: false,
        message: 'VAPI not configured'
      };
    }
  }

  private calculateConversionRate(leadsData: any): number {
    if (leadsData.total === 0) return 0;
    const convertedLeads = leadsData.leads.filter((lead: any) => lead.status === 'converted').length;
    return Math.round((convertedLeads / leadsData.total) * 100);
  }

  private calculateCallSuccessRate(callsData: any): number {
    if (callsData.total === 0) return 0;
    return Math.round((callsData.answered / callsData.total) * 100);
  }

  private calculateLeadResponseRate(leadsData: any): number {
    if (leadsData.total === 0) return 0;
    const contactedLeads = leadsData.leads.filter((lead: any) => 
      lead.status === 'contacted' || lead.status === 'qualified' || lead.status === 'converted'
    ).length;
    return Math.round((contactedLeads / leadsData.total) * 100);
  }

  private async getRecentActivity(leadsData: any, callsData: any, campaignsData: any, emailsData: any) {
    const activities: any[] = [];

    // Add recent calls
    const recentCalls = callsData.calls.slice(0, 5);
    recentCalls.forEach((call: any) => {
      activities.push({
        id: call.id,
        type: 'call',
        title: `Call ${call.status} - ${call.customer?.name || 'Unknown'}`,
        timestamp: call.created_at,
        status: call.status
      });
    });

    // Add recent leads
    const recentLeads = leadsData.leads.slice(0, 3);
    recentLeads.forEach((lead: any) => {
      activities.push({
        id: lead.id,
        type: 'lead',
        title: `New lead added - ${lead.name}`,
        timestamp: lead.created_at || lead.createdAt,
        status: lead.status
      });
    });

    // Add recent campaigns
    const recentCampaigns = campaignsData.campaigns.slice(0, 2);
    recentCampaigns.forEach((campaign: any) => {
      activities.push({
        id: campaign.id,
        type: 'campaign',
        title: `Campaign ${campaign.status} - ${campaign.name}`,
        timestamp: campaign.created_at,
        status: campaign.status
      });
    });

    // Add recent emails
    const recentEmails = emailsData.emails.slice(0, 2);
    recentEmails.forEach((email: any) => {
      activities.push({
        id: email.id,
        type: 'email',
        title: `Email sent - ${email.subject}`,
        timestamp: email.created_at,
        status: email.status
      });
    });

    // Sort by timestamp and return latest 8 activities
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);
  }

  private async getTodaysSchedule(callsData: any, campaignsData: any) {
    const schedule: any[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add scheduled calls
    const scheduledCalls = callsData.calls.filter((call: any) => {
      const callDate = new Date(call.created_at);
      return callDate >= today && call.status === 'pending';
    });

    scheduledCalls.slice(0, 3).forEach((call: any) => {
      schedule.push({
        id: call.id,
        type: 'call',
        title: 'Follow-up Call',
        time: new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'scheduled',
        contact: call.customer?.name || 'Unknown'
      });
    });

    // Add active campaigns
    const activeCampaigns = campaignsData.campaigns.filter((campaign: any) => campaign.status === 'active');
    activeCampaigns.slice(0, 2).forEach((campaign: any) => {
      schedule.push({
        id: campaign.id,
        type: 'campaign',
        title: `Campaign Launch`,
        time: new Date(campaign.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'pending',
        contact: campaign.name
      });
    });

    return schedule;
  }

  private getFallbackMetrics(): DashboardMetrics {
    return {
      totalLeads: 0,
      callsToday: 0,
      conversionRate: 0,
      activeCampaigns: 0,
      leadStatusDistribution: {
        new: 0,
        contacted: 0,
        qualified: 0,
        converted: 0,
        lost: 0
      },
      performanceMetrics: {
        callSuccessRate: 0,
        leadResponseRate: 0,
        conversionRate: 0
      },
      recentActivity: [],
      todaysSchedule: [],
      systemStatus: {
        vapi: false,
        email: false,
        database: false
      }
    };
  }
}

export default new DashboardService(); 