"use client";

import React, { useState } from 'react';
import { Phone, X, Clock, Calendar } from 'lucide-react';
import vapiService from '../services/vapiService';
import { timezones, getCurrentTimeInTimezone } from '../utils/timezoneUtils';
import { showSuccess, showError, showWarning } from '../utils/toastUtils';

interface SingleCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCallInitiated?: (callId: string) => void;
}

export default function SingleCallModal({ isOpen, onClose, onCallInitiated }: SingleCallModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [callSchedule, setCallSchedule] = useState<'now' | 'schedule'>('now');
  const [scheduledTime, setScheduledTime] = useState('');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');

  const handleMakeCall = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      showWarning('Please enter both customer name and phone number.');
      return;
    }

    try {
      setLoading(true);

      const callRequest = {
        customer: {
          name: customerName,
          number: customerPhone
        },
        assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!,
        phoneNumberId: process.env.NEXT_PUBLIC_PHONE_NUMBER_ID!,
        metadata: {
          customerEmail: customerEmail,
          type: 'single',
          property_details: prompt // <-- send property details as metadata
        }
      };

      let callResponse;

      if (callSchedule === 'now') {
        // Make immediate call
        callResponse = await vapiService.makeCall(callRequest);
        showSuccess(`Call initiated successfully! Call ID: ${callResponse.id}`);
      } else {
        // Schedule the call
        callResponse = await vapiService.scheduleCall({
          ...callRequest,
          scheduledTime: scheduledTime
        });
        showSuccess(`Call scheduled successfully! Call ID: ${callResponse.id}`);
      }

      if (onCallInitiated) {
        onCallInitiated(callResponse.id);
      }

      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setScheduledTime('');
      setCallSchedule('now');
      onClose();

    } catch (error) {
      console.error('Error making call:', error);
      showError(`Failed to initiate call: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Phone className="h-5 w-5 mr-2" />
            Make Single Call
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter customer name"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter phone number"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email (Optional)
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email address"
            />
          </div>

          {/* Call Script or Property Details */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Call Script or Property Details (AI will say this)
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter property details or script for the call"
            />
          </div>

          {/* Schedule Options */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Schedule
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="now"
                  checked={callSchedule === 'now'}
                  onChange={(e) => setCallSchedule(e.target.value as 'now' | 'schedule')}
                  className="mr-2"
                />
                <span className="text-gray-300">Call Now</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="schedule"
                  checked={callSchedule === 'schedule'}
                  onChange={(e) => setCallSchedule(e.target.value as 'now' | 'schedule')}
                  className="mr-2"
                />
                <span className="text-gray-300">Schedule</span>
              </label>
            </div>
          </div>

          {/* Scheduled Time */}
          {callSchedule === 'schedule' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Scheduled Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label} ({getCurrentTimeInTimezone(tz.value)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleMakeCall}
            disabled={loading || !customerName.trim() || !customerPhone.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Phone className="h-4 w-4 mr-2" />
            {loading ? 'Initiating...' : callSchedule === 'now' ? 'Call Now' : 'Schedule Call'}
          </button>
        </div>
      </div>
    </div>
  );
} 