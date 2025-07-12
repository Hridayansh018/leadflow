"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Phone, Clock, User, Calendar, Search, Users } from 'lucide-react';
import vapiService from '../services/vapiService';

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

  const stats = [
    { name: 'Total Calls', value: calls.length, color: 'bg-blue-500' },
    { name: 'Answered', value: calls.filter(c => c.status === 'answered').length, color: 'bg-green-500' },
    { name: 'Unanswered', value: calls.filter(c => c.status === 'unanswered').length, color: 'bg-red-500' },
    { name: 'Campaign Calls', value: calls.filter(c => c.metadata?.campaignId).length, color: 'bg-purple-500' }
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading call history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Call History</h3>
        <button
          onClick={loadCalls}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <option value="answered">Answered</option>
              <option value="unanswered">Unanswered</option>
              <option value="busy">Busy</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="min-w-32">
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
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredCalls.length} of {calls.length} calls
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('createdAt')}>
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  Date/Time
                  {sortBy === 'createdAt' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('customerName')}>
                <div className="flex items-center gap-1">
                  <User size={14} />
                  Customer
                  {sortBy === 'customerName' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Phone</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1">
                  Status
                  {sortBy === 'status' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('duration')}>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  Duration
                  {sortBy === 'duration' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Type</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Campaign</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Interest</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCalls.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  No calls found matching your criteria
                </td>
              </tr>
            ) : (
              filteredCalls.map((call) => {
                const callType = call.metadata?.campaignId ? 'campaign' : 'single';
                const notes = (call.metadata as any)?.notes || '';
                const interest = (call.metadata as any)?.interest || '';
                const campaignName = (call.metadata as any)?.campaignName || '';
                
                return (
                  <tr key={call.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">
                      {formatDate(call.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {call.customer?.name || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {call.customer?.number || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(call.status)}`}>
                        {call.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDuration('0:00')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-gray-600">
                        {getTypeIcon(callType)}
                        <span className="capitalize">{callType}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {campaignName || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {interest ? (
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          interest === 'high' ? 'bg-green-100 text-green-800' :
                          interest === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {interest}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={notes}>
                      {notes || '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 