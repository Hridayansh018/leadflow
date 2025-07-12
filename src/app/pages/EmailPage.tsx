"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Send, Trash2, Plus, Search, Inbox, Eye, Reply, Forward, Archive, Star, Filter, RefreshCw, Users, Settings } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useData } from '../context/DataContext';
import BulkEmailComposer from '../../components/BulkEmailComposer';
import EmailConfiguration from '../../components/EmailConfiguration';
import emailDataService, { StoredEmail } from '../../services/emailDataService';

interface EmailPageProps {
  onNavigate: (route: string) => void;
  currentRoute: string;
  subRoute?: string;
}

interface EmailStats {
  name: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  change?: number;
}

interface EmailFilters {
  search: string;
  status: 'all' | 'read' | 'unread' | 'starred' | 'archived';
  dateRange: 'all' | 'today' | 'week' | 'month';
}

export default function EmailPage({ onNavigate, currentRoute }: EmailPageProps) {
  const { emails, addEmail, deleteEmail } = useData();
  const [showCompose, setShowCompose] = useState(false);
  const [showBulkCompose, setShowBulkCompose] = useState(false);
  const [showEmailConfig, setShowEmailConfig] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [filters, setFilters] = useState<EmailFilters>({
    search: '',
    status: 'all',
    dateRange: 'all'
  });
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    body: '',
    cc: '',
    bcc: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Move fetchSentEmails outside useEffect so it can be called by the refresh button
  const fetchSentEmails = useCallback(async () => {
    try {
      const result = await emailDataService.getEmails({ typeDetail: 'sent' });
      const dbEmails = result.emails;
      // Build a set of unique keys for deduplication
      const existingKeys = new Set(
        emails.map(e => `${e.subject}|${e.to}|${e.timestamp}`)
      );
      const addedKeys = new Set<string>();
      dbEmails.forEach((dbEmail: StoredEmail) => {
        const key = `${dbEmail.subject}|${dbEmail.to}|${new Date(dbEmail.timestamp).toLocaleString()}`;
        if (!existingKeys.has(key) && !addedKeys.has(key)) {
          addEmail({
            from: dbEmail.from || 'admin@realestate.com',
            to: dbEmail.to,
            subject: dbEmail.subject,
            body: dbEmail.body,
            timestamp: new Date(dbEmail.timestamp).toLocaleString(),
            type: 'sent',
            read: dbEmail.read ?? true,
            starred: dbEmail.starred ?? false,
            archived: dbEmail.archived ?? false
          });
          addedKeys.add(key);
        }
      });
    } catch (error) {
      console.error('Failed to load sent emails:', error);
    }
  }, [addEmail, emails]);

  useEffect(() => {
    fetchSentEmails();
    // Only run on mount
  }, []);

  // Enhanced email filtering with multiple criteria
  const filteredEmails = useCallback(() => {
    const filtered = emails.filter(email => {
      const matchesSearch = email.subject.toLowerCase().includes(filters.search.toLowerCase()) ||
                           email.from.toLowerCase().includes(filters.search.toLowerCase()) ||
                           email.to.toLowerCase().includes(filters.search.toLowerCase()) ||
                           email.body.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesType = email.type === 'sent';
      const matchesStatus = filters.status === 'all' || 
                           (filters.status === 'starred' && email.starred) ||
                           (filters.status === 'archived' && email.archived);
      
      const matchesDate = filters.dateRange === 'all' || 
                         (filters.dateRange === 'today' && isToday(new Date(email.timestamp))) ||
                         (filters.dateRange === 'week' && isThisWeek(new Date(email.timestamp))) ||
                         (filters.dateRange === 'month' && isThisMonth(new Date(email.timestamp)));
      
      return matchesSearch && matchesType && matchesStatus && matchesDate;
    });

    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [emails, filters]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isThisWeek = (date: Date) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date >= weekAgo;
  };

  const isThisMonth = (date: Date) => {
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };

  // Enhanced stats calculation
  const stats: EmailStats[] = [
    {
      name: 'Total Sent',
      value: emails.filter(e => e.type === 'sent').length,
      color: 'bg-blue-500',
      icon: <Send className="h-6 w-6 text-white" />
    },
    {
      name: 'Starred',
      value: emails.filter(e => e.starred).length,
      color: 'bg-yellow-500',
      icon: <Star className="h-6 w-6 text-white" />
    },
    {
      name: 'Archived',
      value: emails.filter(e => e.archived).length,
      color: 'bg-gray-500',
      icon: <Archive className="h-6 w-6 text-white" />
    }
  ];

  const handleSendEmail = async () => {
    if (composeData.to && composeData.subject && composeData.body) {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        addEmail({
          from: 'admin@realestate.com',
          to: composeData.to,
          subject: composeData.subject,
          body: composeData.body,
          timestamp: new Date().toLocaleString(),
          type: 'sent',
          read: true,
          starred: false,
          archived: false
        });
        
        setComposeData({ to: '', subject: '', body: '', cc: '', bcc: '' });
        setShowCompose(false);
      } catch (error) {
        console.error('Error sending email:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBulkAction = (action: 'delete' | 'archive' | 'mark-read' | 'mark-unread') => {
    selectedEmails.forEach(emailId => {
      const email = emails.find(e => e.id === emailId);
      if (email) {
        switch (action) {
          case 'delete':
            deleteEmail(emailId);
            break;
          case 'archive':
            // Update email archived status
            break;
          case 'mark-read':
            // Update email read status
            break;
          case 'mark-unread':
            // Update email read status
            break;
        }
      }
    });
    setSelectedEmails(new Set());
  };

  const getSelectedEmailContent = () => {
    if (!selectedEmail) return null;
    return emails.find(e => e.id === selectedEmail);
  };

  const selectedEmailContent = getSelectedEmailContent();

  const handleEmailSelect = (emailId: string) => {
    const newSelected = new Set(selectedEmails);
    if (newSelected.has(emailId)) {
      newSelected.delete(emailId);
    } else {
      newSelected.add(emailId);
    }
    setSelectedEmails(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedEmails.size === filteredEmails().length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(filteredEmails().map(e => e.id)));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Header onNavigate={onNavigate} currentRoute="email" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Email Management</h1>
          <p className="text-gray-300">Send, receive, and manage your email communications</p>
        </div>

        {/* Enhanced Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:bg-gray-750 transition-colors">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  {stat.icon}
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">{stat.name}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  {stat.change && (
                    <p className={`text-xs ${stat.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {stat.change > 0 ? '+' : ''}{stat.change} from last week
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Enhanced Sidebar */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="space-y-3 mb-6">
              <button
                onClick={() => setShowCompose(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-medium transition-colors flex items-center justify-center shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Compose
              </button>
              <button
                onClick={() => setShowBulkCompose(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md font-medium transition-colors flex items-center justify-center shadow-lg"
              >
                <Users className="h-4 w-4 mr-2" />
                Bulk Email
              </button>
            </div>
            
            <nav className="space-y-2">
              <button
                onClick={() => onNavigate('email')}
                className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentRoute === 'email'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Inbox className="h-4 w-4 mr-2" />
                All Emails
                <span className="ml-auto text-xs bg-gray-600 px-2 py-1 rounded-full">
                  {emails.length}
                </span>
              </button>
              <button
                onClick={() => onNavigate('email-sent')}
                className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentRoute === 'email-sent'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Send className="h-4 w-4 mr-2" />
                Sent
                <span className="ml-auto text-xs bg-gray-600 px-2 py-1 rounded-full">
                  {emails.filter(e => e.type === 'sent').length}
                </span>
              </button>
              <button
                onClick={() => onNavigate('email-starred')}
                className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentRoute === 'email-starred'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Star className="h-4 w-4 mr-2" />
                Starred
                <span className="ml-auto text-xs bg-gray-600 px-2 py-1 rounded-full">
                  {emails.filter(e => e.starred).length}
                </span>
              </button>
              <button
                onClick={() => onNavigate('email-archived')}
                className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentRoute === 'email-archived'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Archive className="h-4 w-4 mr-2" />
                Archived
                <span className="ml-auto text-xs bg-gray-600 px-2 py-1 rounded-full">
                  {emails.filter(e => e.archived).length}
                </span>
              </button>
            </nav>

            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-md transition-colors">
                  <Star className="h-4 w-4 mr-2" />
                  Starred
                </button>
                <button className="w-full flex items-center px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-md transition-colors">
                  <Archive className="h-4 w-4 mr-2" />
                  Archived
                </button>
                <button 
                  onClick={() => setShowEmailConfig(true)}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-md transition-colors"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Email Settings
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Main Content */}
          <div className="lg:col-span-3">
            {/* Enhanced Search and Filters */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search emails..."
                      value={filters.search}
                      onChange={(e) => setFilters({...filters, search: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition-colors flex items-center"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </button>
                  <button
                    onClick={fetchSentEmails}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition-colors flex items-center"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({...filters, status: e.target.value as EmailFilters['status']})}
                      className="px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="starred">Starred</option>
                      <option value="archived">Archived</option>
                    </select>
                    
                    <select
                      value={filters.dateRange}
                      onChange={(e) => setFilters({...filters, dateRange: e.target.value as EmailFilters['dateRange']})}
                      className="px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Bulk Actions */}
            {selectedEmails.size > 0 && (
              <div className="bg-blue-900 p-4 rounded-lg border border-blue-700 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-white">
                    {selectedEmails.size} email{selectedEmails.size > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBulkAction('mark-read')}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                    >
                      Mark Read
                    </button>
                    <button
                      onClick={() => handleBulkAction('archive')}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                    >
                      Archive
                    </button>
                    <button
                      onClick={() => handleBulkAction('delete')}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Email List */}
            {!selectedEmail && (
              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center">
                      <Mail className="h-5 w-5 mr-2" />
                      {currentRoute === 'email-sent' ? 'Sent Emails' : 
                       currentRoute === 'email-starred' ? 'Starred Emails' : 'All Emails'} ({filteredEmails().length})
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSelectAll}
                        className="text-sm text-gray-300 hover:text-white"
                      >
                        {selectedEmails.size === filteredEmails().length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-700">
                  {filteredEmails().length === 0 ? (
                    <div className="p-8 text-center">
                      <Mail className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400">No emails found</p>
                    </div>
                  ) : (
                    filteredEmails().map((email) => (
                      <div 
                        key={email.id} 
                        className={`p-4 hover:bg-gray-700 transition-colors cursor-pointer ${
                          selectedEmails.has(email.id) ? 'bg-blue-900 bg-opacity-50' : ''
                        }`}
                        onClick={() => setSelectedEmail(email.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={selectedEmails.has(email.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleEmailSelect(email.id);
                              }}
                              className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                            />
                            <div className={`w-2 h-2 rounded-full ${email.type === 'sent' ? 'bg-green-400' : 'bg-blue-400'}`}></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3">
                                <p className={`text-sm font-medium ${email.read ? 'text-gray-300' : 'text-white'} truncate`}>
                                  {email.type === 'sent' ? `To: ${email.to}` : `From: ${email.from}`}
                                </p>
                                <p className="text-xs text-gray-400">{email.timestamp}</p>
                              </div>
                              <p className={`text-sm font-medium ${email.read ? 'text-gray-400' : 'text-gray-300'} mt-1`}>
                                {email.subject}
                              </p>
                              <p className="text-sm text-gray-500 truncate mt-1">{email.body}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Toggle star
                              }}
                              className="text-gray-400 hover:text-yellow-400 p-1"
                            >
                              <Star className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteEmail(email.id);
                              }}
                              className="text-red-400 hover:text-red-300 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEmail(email.id);
                              }}
                              className="text-blue-400 hover:text-blue-300 p-1"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Enhanced Email Detail View */}
            {selectedEmail && selectedEmailContent && (
              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-white">{selectedEmailContent.subject}</h2>
                      <div className="mt-2 text-sm text-gray-300">
                        <p>From: {selectedEmailContent.from}</p>
                        <p>To: {selectedEmailContent.to}</p>
                        <p>Date: {selectedEmailContent.timestamp}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="text-gray-400 hover:text-white p-2">
                        <Reply className="h-4 w-4" />
                      </button>
                      <button className="text-gray-400 hover:text-white p-2">
                        <Forward className="h-4 w-4" />
                      </button>
                      <button className="text-gray-400 hover:text-white p-2">
                        <Star className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setSelectedEmail(null)}
                        className="text-gray-400 hover:text-white p-2"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 whitespace-pre-wrap">{selectedEmailContent.body}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Compose Modal */}
        {showCompose && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Compose Email</h2>
                <button
                  onClick={() => setShowCompose(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">To *</label>
                  <input
                    type="email"
                    value={composeData.to}
                    onChange={(e) => setComposeData({...composeData, to: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="recipient@example.com"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">CC</label>
                    <input
                      type="email"
                      value={composeData.cc}
                      onChange={(e) => setComposeData({...composeData, cc: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="cc@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">BCC</label>
                    <input
                      type="email"
                      value={composeData.bcc}
                      onChange={(e) => setComposeData({...composeData, bcc: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="bcc@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Subject *</label>
                  <input
                    type="text"
                    value={composeData.subject}
                    onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email subject"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Message *</label>
                  <textarea
                    rows={8}
                    value={composeData.body}
                    onChange={(e) => setComposeData({...composeData, body: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your message..."
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-400">
                  * Required fields
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowCompose(false)}
                    className="px-4 py-2 text-gray-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendEmail}
                    disabled={isLoading || !composeData.to || !composeData.subject || !composeData.body}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium transition-colors flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Email Composer */}
        {showBulkCompose && (
          <BulkEmailComposer isOpen={showBulkCompose} onClose={() => setShowBulkCompose(false)} />
        )}

        {/* Email Configuration */}
        {showEmailConfig && (
          <EmailConfiguration isOpen={showEmailConfig} onClose={() => setShowEmailConfig(false)} />
        )}
      </main>

      <Footer />
    </div>
  );
}