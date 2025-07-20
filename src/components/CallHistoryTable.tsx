"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Phone, Clock, User, Calendar, Search, Users, Plus } from 'lucide-react';
import vapiService from '../services/vapiService';
import SingleCallModal from './SingleCallModal';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

interface VAPICallData {
  id: string;
  status: string;
  customer: {
    number: string;
    name?: string;
  };
  assistant: {
    id: string;
  };
  phoneNumber: {
    id: string;
  };
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export default function CallHistoryTable() {
  const [calls, setCalls] = useState<VAPICallData[]>([]);
  const [filteredCalls, setFilteredCalls] = useState<VAPICallData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'customerName' | 'status' | 'duration'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSingleCallModal, setShowSingleCallModal] = useState(false);

  useEffect(() => {
    loadCalls();
  }, []);

  const filterAndSortCalls = useCallback(() => {
    let filtered = [...calls];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(call =>
        (call.customer?.name || 'Unknown').toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.customer?.number.includes(searchTerm) ||
        ((call.metadata as any)?.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(call => call.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(call => {
        // Determine type from metadata
        const callType = call.metadata?.campaignId ? 'campaign' : 'single';
        return callType === typeFilter;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'customerName':
          aValue = (a.customer?.name || 'Unknown').toLowerCase();
          bValue = (b.customer?.name || 'Unknown').toLowerCase();
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        case 'duration':
          // VAPI doesn't provide duration, so we'll use 0
          aValue = 0;
          bValue = 0;
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

    setFilteredCalls(filtered);
  }, [calls, searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  useEffect(() => {
    filterAndSortCalls();
  }, [filterAndSortCalls]);

  const loadCalls = async () => {
    try {
      setLoading(true);
      const callRecords = await vapiService.getCalls();
      setCalls(callRecords);
    } catch (error) {
      console.error('Error loading calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: 'createdAt' | 'customerName' | 'status' | 'duration') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'answered':
        return 'bg-[var(--primary)] text-[var(--primary-foreground)]';
      case 'unanswered':
        return 'bg-[var(--destructive)] text-[var(--destructive-foreground)]';
      case 'busy':
        return 'bg-[var(--secondary)] text-[var(--secondary-foreground)]';
      case 'failed':
        return 'bg-[var(--destructive)] text-[var(--destructive-foreground)]';
      default:
        return 'bg-[var(--muted)] text-[var(--muted-foreground)]';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'campaign' ? <Users size={16} /> : <Phone size={16} />;
  };

  const formatDuration = (duration: string) => {
    if (!duration) return '0:00';
    return duration;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleCallInitiated = (callId: string) => {
    // Refresh the call list after a new call is initiated
    loadCalls();
  };

  const stats = [
    { name: 'Total Calls', value: calls.length, color: 'bg-[var(--primary)]' },
    { name: 'Answered', value: calls.filter(c => c.status === 'answered').length, color: 'bg-[var(--primary)]' },
    { name: 'Unanswered', value: calls.filter(c => c.status === 'unanswered').length, color: 'bg-[var(--destructive)]' },
    { name: 'Campaign Calls', value: calls.filter(c => c.metadata?.campaignId).length, color: 'bg-[var(--secondary)]' }
  ];

  function formatDurationValue(call: VAPICallData) {
    // Try metadata.duration first
    const metaDuration = (call.metadata as any)?.duration;
    if (metaDuration && typeof metaDuration === 'string' && metaDuration !== '0:00') {
      return metaDuration;
    }
    // Calculate from createdAt and updatedAt
    if (call.createdAt && call.updatedAt) {
      const ms = new Date(call.updatedAt).getTime() - new Date(call.createdAt).getTime();
      if (!isNaN(ms) && ms > 0) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    }
    return '0:00';
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading call history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[var(--card)] text-[var(--card-foreground)] p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowSingleCallModal(true)}
            variant="secondary"
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Make Call
          </Button>
          <Button
            onClick={loadCalls}
            variant="outline"
          >
            Refresh
          </Button>
        </div>
      </div>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.name} className={`${stat.color} p-6`}>
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search calls..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="answered">Answered</option>
              <option value="unanswered">Unanswered</option>
              <option value="busy">Busy</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="single">Single Calls</option>
              <option value="campaign">Campaign Calls</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="createdAt">Date</option>
              <option value="customerName">Customer</option>
              <option value="status">Status</option>
              <option value="duration">Duration</option>
            </select>
          </div>
        </div>

        {/* Call History Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-[var(--muted-foreground)] uppercase bg-[var(--muted)]">
              <tr>
                <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort('customerName')}>
                  <div className="flex items-center">
                    Customer
                    {sortBy === 'customerName' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort('status')}>
                  <div className="flex items-center">
                    Status
                    {sortBy === 'status' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort('createdAt')}>
                  <div className="flex items-center">
                    Date
                    {sortBy === 'createdAt' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort('duration')}>
                  <div className="flex items-center">
                    Duration
                    {sortBy === 'duration' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCalls.map((call) => {
                const callType = call.metadata?.campaignId ? 'campaign' : 'single';
                return (
                  <tr key={call.id} className="bg-[var(--background)] border-b hover:bg-[var(--muted)] text-[var(--foreground)]">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-[var(--foreground)]">
                          {call.customer?.name || 'Unknown'}
                        </div>
                        <div className="text-[var(--muted-foreground)]">{call.customer?.number}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(call.status)}`}>{call.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getTypeIcon(callType)}
                        <span className="ml-1 capitalize text-[var(--muted-foreground)]">{callType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[var(--muted-foreground)]">
                      {formatDate(call.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-[var(--muted-foreground)]">
                      {formatDurationValue(call)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCalls.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Phone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No calls found matching your criteria</p>
          </div>
        )}

        {/* Single Call Modal */}
        <SingleCallModal
          isOpen={showSingleCallModal}
          onClose={() => setShowSingleCallModal(false)}
          onCallInitiated={handleCallInitiated}
        />
      </CardContent>
    </Card>
  );
} 