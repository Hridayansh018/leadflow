"use client";

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Repeat, 
  List, 
  Play, 
  Pause, 
  Trash2, 
  Edit, 
  Plus,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import vapiService from '../services/vapiService';
import { showSuccess, showError, showWarning } from '../utils/toastUtils';

interface RecurringSchedule {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  daysOfWeek?: number[]; // 0-6, Sunday-Saturday
  dayOfMonth?: number; // 1-31
  timezone: string;
  isActive: boolean;
  lastRun?: string;
  nextRun?: string;
  totalCalls: number;
  successfulCalls: number;
}

interface CallQueue {
  id: string;
  customerName: string;
  phoneNumber: string;
  scheduledTime: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  retryCount: number;
  maxRetries: number;
  notes?: string;
}

export default function AdvancedCallScheduler() {
  const [recurringSchedules, setRecurringSchedules] = useState<RecurringSchedule[]>([]);
  const [callQueue, setCallQueue] = useState<CallQueue[]>([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showQueueManager, setShowQueueManager] = useState(false);
  // const [selectedSchedule, setSelectedSchedule] = useState<RecurringSchedule | null>(null); // Commented out - not used
  const [loading, setLoading] = useState(false);

  // Form state for new recurring schedule
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    time: '09:00',
    daysOfWeek: [] as number[],
    dayOfMonth: 1,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    isActive: true
  });

  useEffect(() => {
    loadRecurringSchedules();
    loadCallQueue();
  }, []);

  const loadRecurringSchedules = async () => {
    try {
      setLoading(true);
      // Load real schedules from VAPI or database
      // For now, we'll start with empty array and let users create real schedules
      setRecurringSchedules([]);
    } catch (error) {
      console.error('Error loading recurring schedules:', error);
      showError('Failed to load recurring schedules');
    } finally {
      setLoading(false);
    }
  };

  const loadCallQueue = async () => {
    try {
      setLoading(true);
      // Load real call queue from VAPI or database
      // For now, we'll start with empty array and let users create real queue items
      setCallQueue([]);
    } catch (error) {
      console.error('Error loading call queue:', error);
      showError('Failed to load call queue');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      setLoading(true);
      
      const newSchedule: RecurringSchedule = {
        id: Date.now().toString(),
        name: scheduleForm.name,
        frequency: scheduleForm.frequency,
        time: scheduleForm.time,
        daysOfWeek: scheduleForm.frequency === 'weekly' ? scheduleForm.daysOfWeek : undefined,
        dayOfMonth: scheduleForm.frequency === 'monthly' ? scheduleForm.dayOfMonth : undefined,
        timezone: scheduleForm.timezone,
        isActive: scheduleForm.isActive,
        totalCalls: 0,
        successfulCalls: 0,
        nextRun: calculateNextRun(scheduleForm)
      };

      setRecurringSchedules(prev => [...prev, newSchedule]);
      setShowScheduleForm(false);
      setScheduleForm({
        name: '',
        frequency: 'daily',
        time: '09:00',
        daysOfWeek: [],
        dayOfMonth: 1,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        isActive: true
      });
      
      showSuccess('Recurring schedule created successfully!');
    } catch (error) {
      console.error('Error creating schedule:', error);
      showError('Error creating schedule');
    } finally {
      setLoading(false);
    }
  };

  const calculateNextRun = (schedule: typeof scheduleForm): string => {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);
    
    const nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);
    
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    return nextRun.toISOString();
  };

  const toggleScheduleStatus = (scheduleId: string) => {
    setRecurringSchedules(prev => prev.map(schedule => 
      schedule.id === scheduleId 
        ? { ...schedule, isActive: !schedule.isActive }
        : schedule
    ));
  };

  const deleteSchedule = (scheduleId: string) => {
    if (confirm('Are you sure you want to delete this recurring schedule?')) {
      setRecurringSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'in-progress':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getFrequencyText = (frequency: string, daysOfWeek?: number[], dayOfMonth?: number) => {
    switch (frequency) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const days = daysOfWeek?.map(day => dayNames[day]).join(', ') || '';
        return `Weekly (${days})`;
      case 'monthly':
        return `Monthly (${dayOfMonth}${getDaySuffix(dayOfMonth || 1)})`;
      default:
        return frequency;
    }
  };

  const getDaySuffix = (day: number) => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Calendar className="h-6 w-6 text-blue-400 mr-3" />
          <h3 className="text-lg font-semibold text-white">Advanced Call Scheduler</h3>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowQueueManager(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center"
          >
            <List className="h-4 w-4 mr-2" />
            Queue Manager
          </button>
          <button
            onClick={() => setShowScheduleForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Schedule
          </button>
        </div>
      </div>

      {/* Recurring Schedules */}
      <div className="space-y-4">
        <h4 className="text-white font-medium">Recurring Schedules</h4>
        
        {recurringSchedules.length === 0 ? (
          <div className="text-center py-8">
            <Repeat className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-300">No recurring schedules</p>
            <p className="text-sm text-gray-400 mt-2">Create a schedule to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recurringSchedules.map((schedule) => (
              <div key={schedule.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Repeat className="h-5 w-5 text-blue-400" />
                    <div>
                      <h5 className="font-medium text-white">{schedule.name}</h5>
                      <p className="text-sm text-gray-400">
                        {getFrequencyText(schedule.frequency, schedule.daysOfWeek, schedule.dayOfMonth)} at {schedule.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${
                      schedule.isActive 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    }`}>
                      {schedule.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-400">Total Calls</p>
                    <p className="font-medium text-white">{schedule.totalCalls}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Successful</p>
                    <p className="font-medium text-white">{schedule.successfulCalls}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Success Rate</p>
                    <p className="font-medium text-white">
                      {schedule.totalCalls > 0 ? ((schedule.successfulCalls / schedule.totalCalls) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Next Run</p>
                    <p className="font-medium text-white text-sm">
                      {schedule.nextRun ? formatDate(schedule.nextRun) : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleScheduleStatus(schedule.id)}
                    className={`px-3 py-1 text-sm rounded transition-colors flex items-center ${
                      schedule.isActive
                        ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {schedule.isActive ? <Pause className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                    {schedule.isActive ? 'Pause' : 'Activate'}
                  </button>
                  
                  <button
                    onClick={() => {/* setSelectedSchedule(schedule) */}}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </button>
                  
                  <button
                    onClick={() => deleteSchedule(schedule.id)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Schedule Modal */}
      {showScheduleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center">
                <Repeat className="h-6 w-6 text-blue-400 mr-3" />
                <h2 className="text-xl font-bold text-white">Create Recurring Schedule</h2>
              </div>
              <button
                onClick={() => setShowScheduleForm(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Schedule Name</label>
                <input
                  type="text"
                  value={scheduleForm.name}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter schedule name..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Frequency</label>
                <select
                  value={scheduleForm.frequency}
                  onChange={(e) => setScheduleForm(prev => ({ 
                    ...prev, 
                    frequency: e.target.value as 'daily' | 'weekly' | 'monthly' 
                  }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
                <input
                  type="time"
                  value={scheduleForm.time}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {scheduleForm.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Days of Week</label>
                  <div className="grid grid-cols-7 gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                      <label key={day} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={scheduleForm.daysOfWeek.includes(index)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setScheduleForm(prev => ({
                                ...prev,
                                daysOfWeek: [...prev.daysOfWeek, index]
                              }));
                            } else {
                              setScheduleForm(prev => ({
                                ...prev,
                                daysOfWeek: prev.daysOfWeek.filter(d => d !== index)
                              }));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-gray-300 text-sm">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {scheduleForm.frequency === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Day of Month</label>
                  <select
                    value={scheduleForm.dayOfMonth}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, dayOfMonth: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>{day}{getDaySuffix(day)}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
                <select
                  value={scheduleForm.timezone}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, timezone: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={scheduleForm.isActive}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-gray-300">Active</span>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-700">
              <button
                onClick={() => setShowScheduleForm(false)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSchedule}
                disabled={loading || !scheduleForm.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Queue Manager Modal */}
      {showQueueManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center">
                <List className="h-6 w-6 text-purple-400 mr-3" />
                <h2 className="text-xl font-bold text-white">Call Queue Manager</h2>
              </div>
              <button
                onClick={() => setShowQueueManager(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                {callQueue.map((call) => (
                  <div key={call.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(call.status)}
                        <div>
                          <h4 className="font-medium text-white">{call.customerName}</h4>
                          <p className="text-sm text-gray-400">{call.phoneNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(call.priority)}`}>
                          {call.priority} priority
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                          call.status === 'completed' ? 'bg-green-100 text-green-800' :
                          call.status === 'failed' ? 'bg-red-100 text-red-800' :
                          call.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {call.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-400">Scheduled</p>
                        <p className="font-medium text-white text-sm">{formatDate(call.scheduledTime)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Retries</p>
                        <p className="font-medium text-white">{call.retryCount}/{call.maxRetries}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">ID</p>
                        <p className="font-medium text-white text-xs font-mono">{call.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Notes</p>
                        <p className="font-medium text-white text-sm">{call.notes || 'None'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {call.status === 'pending' && (
                        <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center">
                          <Play className="h-3 w-3 mr-1" />
                          Execute Now
                        </button>
                      )}
                      
                      <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </button>
                      
                      <button className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center">
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 