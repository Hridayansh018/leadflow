import vapiService from './vapiService';

export interface AnalyticsExportOptions {
  format: 'json';
  dateRange: {
    start: string;
    end: string;
  };
  campaigns: string[];
  includeTimeline: boolean;
  includeLeads: boolean;
}

export interface AnalyticsData {
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

class AnalyticsService {
  async getAnalyticsData(options: {
    dateRange: { start: string; end: string };
    campaigns: string[];
    callStatus: string[];
    minAnswerRate: number;
    maxAnswerRate: number;
    minCalls: number;
    maxCalls: number;
  }): Promise<AnalyticsData | null> {
    try {
      const allCalls = await vapiService.getCalls();
      
      // Filter calls based on options
      const filteredCalls = allCalls.filter(call => {
        const metadata = call.metadata as { campaignId?: string } | undefined;
        const isSelectedCampaign = options.campaigns.includes(metadata?.campaignId || '');
        const isInDateRange = call.createdAt >= options.dateRange.start && 
                             call.createdAt <= options.dateRange.end;
        const hasValidStatus = options.callStatus.includes(call.status);
        
        return isSelectedCampaign && isInDateRange && hasValidStatus;
      });

      // Calculate metrics
      const totalCalls = filteredCalls.length;
      const answeredCalls = filteredCalls.filter(call => call.status === 'answered').length;
      const unansweredCalls = filteredCalls.filter(call => call.status === 'unanswered').length;
      const failedCalls = filteredCalls.filter(call => call.status === 'failed').length;
      
      const answerRate = totalCalls > 0 ? (answeredCalls / totalCalls) * 100 : 0;
      const successRate = totalCalls > 0 ? ((answeredCalls + unansweredCalls) / totalCalls) * 100 : 0;
      
      // Apply filters
      if (answerRate < options.minAnswerRate || 
          answerRate > options.maxAnswerRate ||
          totalCalls < options.minCalls ||
          totalCalls > options.maxCalls) {
        return null;
      }

      // Generate timeline
      const timeline = this.generateTimelineData(filteredCalls, options.dateRange);
      
      // Get top leads
      const topLeads = filteredCalls
        .filter(call => call.status === 'answered')
        .sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        })
        .slice(0, 10)
        .map(call => ({
          name: call.customer.name || 'Unknown',
          phone: call.customer.number,
          status: call.status,
          duration: 0,
          interest: 'high'
        }));

      return {
        totalCalls,
        answeredCalls,
        unansweredCalls,
        failedCalls,
        averageCallDuration: 0,
        answerRate,
        successRate,
        conversionRate: answerRate * 0.3,
        leadsGenerated: answeredCalls,
        callbackRequests: answeredCalls * 0.2,
        interestedCustomers: answeredCalls * 0.4,
        callTimeline: timeline,
        topPerformingLeads: topLeads
      };
    } catch (error) {
      console.error('Error getting analytics data:', error);
      return null;
    }
  }

  private generateTimelineData(calls: any[], dateRange: { start: string; end: string }) {
    const timeline: Array<{ date: string; calls: number; answered: number; conversions: number }> = [];
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      const dayCalls = calls.filter(call => {
        const callDate = new Date(call.createdAt).toISOString().split('T')[0];
        return callDate === dateStr;
      });
      
      timeline.push({
        date: dateStr,
        calls: dayCalls.length,
        answered: dayCalls.filter(call => call.status === 'answered').length,
        conversions: dayCalls.filter(call => call.status === 'answered').length
      });
    }
    
    return timeline;
  }



  exportToJSON(data: AnalyticsData, options: AnalyticsExportOptions): string {
    const jsonData = {
      exportDate: new Date().toISOString(),
      exportOptions: options,
      analytics: data
    };

    return JSON.stringify(jsonData, null, 2);
  }

  downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}

export default new AnalyticsService(); 