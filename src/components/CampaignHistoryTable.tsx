"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Users, BarChart3, Calendar, Search, Play, Pause, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "./ui/table";
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
        return 'bg-[var(--primary)] text-[var(--primary-foreground)]';
      case 'paused':
        return 'bg-[var(--secondary)] text-[var(--secondary-foreground)]';
      case 'completed':
        return 'bg-[var(--accent)] text-[var(--accent-foreground)]';
      case 'failed':
        return 'bg-[var(--destructive)] text-[var(--destructive-foreground)]';
      default:
        return 'bg-[var(--muted)] text-[var(--muted-foreground)]';
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
      <Card className="bg-[var(--card)] text-[var(--card-foreground)] p-6">
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-[var(--muted)] rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-16 bg-[var(--background)] rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[var(--card)] text-[var(--card-foreground)] p-6">
      <CardHeader className="flex items-center justify-between mb-6">
        <CardTitle className="text-lg font-semibold">Campaign History</CardTitle>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline">Refresh</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <Input
            type="text"
            value={searchTerm}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search campaigns..."
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded border px-3 py-2 bg-[var(--input)] text-[var(--foreground)] border-[var(--border)]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div className="mb-4 text-sm text-[var(--muted-foreground)]">
          Showing {filteredCampaigns.length} of {campaigns.length} campaigns
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[var(--muted)]">
              <TableRow>
                <TableHead className="text-[var(--muted-foreground)] cursor-pointer" onClick={() => handleSort('createdAt')}>Created</TableHead>
                <TableHead className="text-[var(--muted-foreground)] cursor-pointer" onClick={() => handleSort('name')}>Campaign Name</TableHead>
                <TableHead className="text-[var(--muted-foreground)] cursor-pointer" onClick={() => handleSort('status')}>Status</TableHead>
                <TableHead className="text-[var(--muted-foreground)] cursor-pointer" onClick={() => handleSort('leadsCount')}>Leads</TableHead>
                <TableHead className="text-[var(--muted-foreground)]">Progress</TableHead>
                <TableHead className="text-[var(--muted-foreground)]">Success Rate</TableHead>
                <TableHead className="text-[var(--muted-foreground)]">Property File</TableHead>
                <TableHead className="text-[var(--muted-foreground)]">Prompt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-[var(--muted-foreground)] py-8">
                    No campaigns found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredCampaigns.map((campaign) => (
                  <TableRow key={campaign.id} className="bg-[var(--background)] text-[var(--foreground)]">
                    <TableCell>{formatDate(campaign.createdAt)}</TableCell>
                    <TableCell>{campaign.name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                        {getStatusIcon(campaign.status)} {campaign.status}
                      </span>
                    </TableCell>
                    <TableCell>{campaign.leadsCount || campaign.leads.length}</TableCell>
                    <TableCell>{/* Progress bar or value */}</TableCell>
                    <TableCell>{getCompletionRate(campaign)}%</TableCell>
                    <TableCell>{campaign.propertyFileId || '-'}</TableCell>
                    <TableCell>{campaign.prompt || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
} 