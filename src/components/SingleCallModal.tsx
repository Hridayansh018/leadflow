"use client";

import React, { useState } from 'react';
import { Phone, X, Clock, Calendar } from 'lucide-react';
import vapiService from '../services/vapiService';
import { timezones, getCurrentTimeInTimezone } from '../utils/timezoneUtils';
import { showSuccess, showError, showWarning } from '../utils/toastUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

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

  const promptTemplate = `Hi {{customer_name}}, here are some properties you might like:\n{{property_details}}\nWould you like to know more or schedule a tour?`;

  function fillPrompt(template: string, variables: Record<string, string>) {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return result;
  }

  const handleMakeCall = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      showWarning('Please enter both customer name and phone number.');
      return;
    }

    try {
      setLoading(true);

      const finalPrompt = fillPrompt(promptTemplate, {
        property_details: prompt,
        customer_name: customerName
      });

      const callRequest = {
        customer: {
          name: customerName,
          number: customerPhone
        },
        assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!,
        phoneNumberId: process.env.NEXT_PUBLIC_PHONE_NUMBER_ID!,
        metadata: {
          customerEmail: customerEmail,
          type: 'single'
        },
        prompt: finalPrompt // send the substituted prompt
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-[var(--card)] text-[var(--card-foreground)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" /> Make Single Call
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Customer Name *</label>
            <Input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number *</label>
            <Input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Enter phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email (Optional)</label>
            <Input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="Enter email address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Property Details (will be inserted into the call script)</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              placeholder="Enter property details for the call"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Schedule</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="now"
                  checked={callSchedule === 'now'}
                  onChange={(e) => setCallSchedule(e.target.value as 'now' | 'schedule')}
                  className="mr-2"
                />
                <span>Call Now</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="schedule"
                  checked={callSchedule === 'schedule'}
                  onChange={(e) => setCallSchedule(e.target.value as 'now' | 'schedule')}
                  className="mr-2"
                />
                <span>Schedule</span>
              </label>
            </div>
          </div>
          {callSchedule === 'schedule' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Scheduled Time</label>
                <Input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
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
        <DialogFooter className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleMakeCall}
            disabled={loading || !customerName.trim() || !customerPhone.trim()}
          >
            <Phone className="h-4 w-4 mr-2" />
            {loading ? 'Initiating...' : callSchedule === 'now' ? 'Call Now' : 'Schedule Call'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 