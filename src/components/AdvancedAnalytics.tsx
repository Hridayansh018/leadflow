"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Filter, 
  TrendingUp, 
  Users, 
  Phone, 
  CheckCircle, 
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import vapiService from '../services/vapiService';

interface AnalyticsData {
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

interface FilterOptions {
  dateRange: {
    start: string;
    end: string;
  };
  campaignStatus: string[];
  callStatus: string[];
  minAnswerRate: number;
  maxAnswerRate: number;
  minCalls: number;
  maxCalls: number;
}

export default function AdvancedAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
      end: new Date().toISOString().split('T')[0] // today
    },
    campaignStatus: ['active', 'completed', 'paused'],
    callStatus: ['answered', 'unanswered', 'failed'],
    minAnswerRate: 0,
    maxAnswerRate: 100,
    minCalls: 0,
    maxCalls: 1000
  });
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string; status: string }>>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    if (campaigns.length > 0) {
      loadAnalytics();
    }
  }, [campaigns, filterOptions, selectedCampaigns]);

  const loadCampaigns = async () => {
    try {
      const vapiCampaigns = await vapiService.getCampaigns();
      setCampaigns(vapiCampaigns);
      setSelectedCampaigns(vapiCampaigns.map(c => c.id));
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  const loadAnalytics = async () => {
    if (selectedCampaigns.length === 0) return;

    try {
      setLoading(true);
      
      // Aggregate data from selected campaigns
      const allCalls = await vapiService.getCalls();
      const filteredCalls = allCalls.filter(call => {
        const metadata = call.metadata as { campaignId?: string } | undefined;
        const isSelectedCampaign = selectedCampaigns.includes(metadata?.campaignId || '');
        const isInDateRange = call.createdAt >= filterOptions.dateRange.start && 
                             call.createdAt <= filterOptions.dateRange.end;
        const hasValidStatus = filterOptions.callStatus.includes(call.status);
        
        return isSelectedCampaign && isInDateRange && hasValidStatus;
      });

      // Calculate aggregated metrics
      const totalCalls = filteredCalls.length;
      const answeredCalls = filteredCalls.filter(call => call.status === 'answered').length;
      const unansweredCalls = filteredCalls.filter(call => call.status === 'unanswered').length;
      const failedCalls = filteredCalls.filter(call => call.status === 'failed').length;
      
      const answerRate = totalCalls > 0 ? (answeredCalls / totalCalls) * 100 : 0;
      const successRate = totalCalls > 0 ? ((answeredCalls + unansweredCalls) / totalCalls) * 100 : 0;
      
      // Generate timeline data
      const timeline = generateTimelineData(filteredCalls, filterOptions.dateRange);
      
      // Get top performing leads
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

      // Apply answer rate filter
      const filteredData = {
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

      // Apply filters
      if (filteredData.answerRate >= filterOptions.minAnswerRate && 
          filteredData.answerRate <= filterOptions.maxAnswerRate &&
          filteredData.totalCalls >= filterOptions.minCalls &&
          filteredData.totalCalls <= filterOptions.maxCalls) {
        setAnalyticsData(filteredData);
      } else {
        setAnalyticsData(null);
      }
      
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTimelineData = (calls: Array<{ createdAt: string; status: string }>, dateRange: { start: string; end: string }) => {
    const timeline: Array<{ date: string; calls: number; answered: number; conversions: number }> = [];
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      const dayCalls = calls.filter(call => {
        const callDate = new Date(call.createdAt as string).toISOString().split('T')[0];
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
  };

  const exportData = () => {
    if (!analyticsData) return;

    exportToJSON();
  };

  const exportToJSON = () => {
    if (!analyticsData) return;

    const jsonData = {
      exportDate: new Date().toISOString(),
      filters: filterOptions,
      analytics: analyticsData
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCampaignToggle = (campaignId: string) => {
    setSelectedCampaigns(prev => 
      prev.includes(campaignId) 
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    );
  };

  const handleSelectAllCampaigns = () => {
    setSelectedCampaigns(campaigns.map(c => c.id));
  };

  const handleDeselectAllCampaigns = () => {
    setSelectedCampaigns([]);
  };

  return (
    <div className="bg-gray-900 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <BarChart3 className="h-6 w-6 text-blue-400 mr-3" />
          <h3 className="text-lg font-semibold text-white">Advanced Analytics</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors flex items-center"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
          </button>
          <div className="relative">

          </div>
          <div className="relative">
            <button
              onClick={() => exportData()}
              disabled={!analyticsData}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-6">
          <h4 className="text-white font-medium mb-4">Advanced Filters</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date Range</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={filterOptions.dateRange.start}
                  onChange={(e) => setFilterOptions(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: e.target.value }
                  }))}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                />
                <input
                  type="date"
                  value={filterOptions.dateRange.end}
                  onChange={(e) => setFilterOptions(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: e.target.value }
                  }))}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                />
              </div>
            </div>

            {/* Campaign Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Campaigns</label>
              <div className="max-h-32 overflow-y-auto bg-gray-700 rounded border border-gray-600 p-2">
                <div className="flex justify-between mb-2">
                  <button
                    onClick={handleSelectAllCampaigns}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleDeselectAllCampaigns}
                    className="text-xs text-gray-400 hover:text-gray-300"
                  >
                    Deselect All
                  </button>
                </div>
                {campaigns.map((campaign) => (
                  <label key={campaign.id} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedCampaigns.includes(campaign.id)}
                      onChange={() => handleCampaignToggle(campaign.id)}
                      className="rounded"
                    />
                    <span className="text-gray-300">{campaign.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Call Status */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Call Status</label>
              <div className="space-y-2">
                {['answered', 'unanswered', 'failed', 'pending'].map((status) => (
                  <label key={status} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filterOptions.callStatus.includes(status)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilterOptions(prev => ({
                            ...prev,
                            callStatus: [...prev.callStatus, status]
                          }));
                        } else {
                          setFilterOptions(prev => ({
                            ...prev,
                            callStatus: prev.callStatus.filter(s => s !== status)
                          }));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-gray-300 capitalize">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Answer Rate Range */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Answer Rate Range (%)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filterOptions.minAnswerRate}
                  onChange={(e) => setFilterOptions(prev => ({
                    ...prev,
                    minAnswerRate: Number(e.target.value)
                  }))}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  placeholder="Min"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filterOptions.maxAnswerRate}
                  onChange={(e) => setFilterOptions(prev => ({
                    ...prev,
                    maxAnswerRate: Number(e.target.value)
                  }))}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Call Count Range */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Call Count Range</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  value={filterOptions.minCalls}
                  onChange={(e) => setFilterOptions(prev => ({
                    ...prev,
                    minCalls: Number(e.target.value)
                  }))}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  placeholder="Min"
                />
                <input
                  type="number"
                  min="0"
                  value={filterOptions.maxCalls}
                  onChange={(e) => setFilterOptions(prev => ({
                    ...prev,
                    maxCalls: Number(e.target.value)
                  }))}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  placeholder="Max"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-400 mt-2">Loading analytics...</p>
        </div>
      ) : analyticsData ? (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-blue-400 mr-2" />
                <span className="text-gray-300 text-sm">Total Calls</span>
              </div>
              <p className="text-2xl font-bold text-white">{analyticsData.totalCalls}</p>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                <span className="text-gray-300 text-sm">Answered</span>
              </div>
              <p className="text-2xl font-bold text-white">{analyticsData.answeredCalls}</p>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-purple-400 mr-2" />
                <span className="text-gray-300 text-sm">Answer Rate</span>
              </div>
              <p className="text-2xl font-bold text-white">{analyticsData.answerRate.toFixed(1)}%</p>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-orange-400 mr-2" />
                <span className="text-gray-300 text-sm">Conversions</span>
              </div>
              <p className="text-2xl font-bold text-white">{analyticsData.conversionRate.toFixed(1)}%</p>
            </div>
          </div>

          {/* Timeline Chart */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Call Timeline</h3>
            <div className="space-y-2">
              {analyticsData.callTimeline.map((day, index) => (
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
              {analyticsData.topPerformingLeads.map((lead, index) => (
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
      ) : (
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-300">No data matches the current filters</p>
          <p className="text-sm text-gray-400 mt-2">Try adjusting your filter criteria</p>
        </div>
      )}
    </div>
  );
} 