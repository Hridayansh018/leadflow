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
  const [senderName, setSenderName] = useState('');

  // Template selection state
  const templates = vapiService.getCampaignTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});

  // When a template is selected, reset variables
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const initialVars: Record<string, string> = {};
      template.variables.forEach(v => {
        if (v === 'customer_name') initialVars[v] = customerName;
        else if (v === 'customerEmail') initialVars[v] = customerEmail;
        else if (v === 'senderName') initialVars[v] = senderName || 'MAX';
        else initialVars[v] = '';
      });
      setTemplateVariables(initialVars);
      setPrompt('');
    }
  };

  // Update template variable value
  const handleVariableChange = (key: string, value: string) => {
    setTemplateVariables(prev => ({ ...prev, [key]: value }));
    if (key === 'customer_name') setCustomerName(value);
    if (key === 'customerEmail') setCustomerEmail(value);
    if (key === 'senderName') setSenderName(value);
  };

  // Fill template with variables
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

      let finalPrompt = '';
      const finalVars = { ...templateVariables };
      if (selectedTemplateId) {
        const template = templates.find(t => t.id === selectedTemplateId);
        if (template) {
          // Ensure senderName is set to 'MAX' if blank
          finalVars.senderName = senderName.trim() ? senderName : 'MAX';
          finalPrompt = fillPrompt(template.prompt, finalVars);
        }
      }
      if (!selectedTemplateId) {
        // Always use the default greeting script if no template is selected
        finalPrompt = fillPrompt(
          `Hi {{customer_name}}, This is {{senderName}} from WarpX. I'm calling about the properties we have right now. Are you interested in learning more?`,
          {
            customer_name: customerName,
            senderName: senderName.trim() ? senderName : 'MAX'
          }
        );
      }
      // Debug: log the final prompt sent to VAPI
      console.log(finalPrompt);

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
        prompt: finalPrompt
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
      setSelectedTemplateId('');
      setTemplateVariables({});
      setPrompt('');
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
        <div
          className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 hide-scrollbar"
        >
          {/* Caller Name input */}
          <div>
            <label className="block text-sm font-medium mb-1">Caller Name (for {'{{senderName}}'})</label>
            <Input
              type="text"
              value={senderName}
              onChange={e => {
                setSenderName(e.target.value);
                // If a template is selected and it uses senderName, update the variable
                if (selectedTemplateId) {
                  setTemplateVariables(prev => ({ ...prev, senderName: e.target.value }));
                }
              }}
              placeholder="Enter caller name (default: MAX)"
            />
          </div>
          {/* Template selection */}
          <div>
            <label className="block text-sm font-medium mb-1">Call Script Template</label>
            <select
              value={selectedTemplateId}
              onChange={e => handleTemplateChange(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              <option value="">-- Custom / No Template --</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {selectedTemplateId && (
              <div className="mt-2 space-y-2">
                {templates.find(t => t.id === selectedTemplateId)?.variables.map(v => (
                  <div key={v}>
                    <label className="block text-xs font-medium mb-1">{v}</label>
                    <Input
                      type="text"
                      value={templateVariables[v] || ''}
                      onChange={e => handleVariableChange(v, e.target.value)}
                      placeholder={`Enter ${v}`}
                    />
                  </div>
                ))}
                <div className="text-xs text-muted-foreground mt-2">
                  Preview: <br />
                  <span className="whitespace-pre-line">{fillPrompt(templates.find(t => t.id === selectedTemplateId)?.prompt || '', templateVariables)}</span>
                </div>
              </div>
            )}
          </div>
          {/* End template selection */}
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
          {/* Only show property details if not using a template */}
          {!selectedTemplateId && (
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
          )}
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