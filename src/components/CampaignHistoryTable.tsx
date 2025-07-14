"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Users, BarChart3, Calendar, Search, Play, Pause, CheckCircle, XCircle } from 'lucide-react';
// Removed all commented-out references to databaseService

// Use the correct Campaign interface with all required properties
type Campaign = {
  id?: string;
  name: string;
  status: string;
  leads: string[];
  leadsCount?: number;
  callsCompleted?: number;
  prompt?: string;
  propertyFileId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function CampaignHistoryTable() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'status' | 'leadsCount'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      try {
        // Replace with actual campaign fetching logic
        // For now, using a placeholder or a mock data if databaseService is removed
        // This part of the code will need to be updated based on the new data source
        // setCampaigns(data);
        // setFilteredCampaigns(data);
        setCampaigns([]); // Placeholder
        setFilteredCampaigns([]); // Placeholder
      } catch (error) {
        setCampaigns([]);
        setFilteredCampaigns([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  const filterAndSortCampaigns = useCallback(() => {
    let filtered = [...campaigns];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(campaign =>
        campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (campaign.prompt || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(campaign => campaign.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt || '').getTime();
          bValue = new Date(b.createdAt || '').getTime();
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        case 'leadsCount':
          aValue = a.leadsCount || a.leads.length;
          bValue = b.leadsCount || b.leads.length;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredCampaigns(filtered);
  }, [campaigns, searchTerm, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    filterAndSortCampaigns();
  }, [filterAndSortCampaigns]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    let filtered = campaigns;
    
    if (term.trim()) {
      filtered = filtered.filter(campaign =>
        campaign.name.toLowerCase().includes(term.toLowerCase()) ||
        (campaign.prompt || '').toLowerCase().includes(term.toLowerCase())
      );
    }
    
    setFilteredCampaigns(filtered);
  }, [campaigns]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Replace with actual campaign fetching logic
      // For now, using a placeholder or a mock data if databaseService is removed
      // This part of the code will need to be updated based on the new data source
      // setCampaigns(data);
      // setFilteredCampaigns(data);
      setCampaigns([]); // Placeholder
      setFilteredCampaigns([]); // Placeholder
    } catch (error) {
      console.error('Error refreshing campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: 'createdAt' | 'name' | 'status' | 'leadsCount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Play size={16} />;
      case 'paused':
        return <Pause size={16} />;
      case 'completed':
        return <CheckCircle size={16} />;
      case 'failed':
        return <XCircle size={16} />;
      default:
        return <BarChart3 size={16} />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  const getCompletionRate = (campaign: Campaign) => {
    const total = campaign.leadsCount || campaign.leads.length;
    const completed = campaign.callsCompleted || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-16 bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <BarChart3 className="h-6 w-6 text-blue-400 mr-3" />
          <h3 className="text-lg font-semibold text-white">Campaign History</h3>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="min-w-32">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredCampaigns.length} of {campaigns.length} campaigns
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-300 cursor-pointer hover:bg-gray-700" onClick={() => handleSort('createdAt')}>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Created
                  {sortBy === 'createdAt' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-300 cursor-pointer hover:bg-gray-700" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Campaign Name
                  {sortBy === 'name' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-300 cursor-pointer hover:bg-gray-700" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1">
                  Status
                  {sortBy === 'status' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-300 cursor-pointer hover:bg-gray-700" onClick={() => handleSort('leadsCount')}>
                <div className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  Leads
                  {sortBy === 'leadsCount' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-300">Progress</th>
              <th className="px-4 py-3 text-left font-medium text-gray-300">Success Rate</th>

              <th className="px-4 py-3 text-left font-medium text-gray-300">Property File</th>
              <th className="px-4 py-3 text-left font-medium text-gray-300">Prompt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredCampaigns.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  No campaigns found matching your criteria
                </td>
              </tr>
            ) : (
              filteredCampaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-4 text-gray-300">
                    {formatDate(campaign.createdAt)}
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <div className="font-medium text-white">{campaign.name}</div>
                      {campaign.prompt && (
                        <div className="text-xs text-gray-400 mt-1 truncate max-w-xs">
                          {campaign.prompt}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-300">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      {campaign.leadsCount || campaign.leads.length}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-300">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-700 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${getCompletionRate(campaign)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs">{getCompletionRate(campaign)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-300">
                    {campaign.leadsCount || campaign.leads.length > 0 ? (
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        getCompletionRate(campaign) >= 80 ? 'bg-green-100 text-green-800' :
                        getCompletionRate(campaign) >= 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {getCompletionRate(campaign)}%
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>

                  <td className="px-4 py-4 text-gray-300">
                    {campaign.propertyFileId ? 'Yes' : 'No'}
                  </td>
                  <td className="px-4 py-4 text-gray-300 max-w-xs truncate" title={campaign.prompt}>
                    {campaign.prompt || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 