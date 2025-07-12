"use client";

import React, { useState, useEffect } from 'react';
import { Mail, Users, FileText, Send, CheckCircle, AlertCircle } from 'lucide-react';
import emailService, { EmailTemplate, EmailRecipient } from '../services/emailService';
import leadService from '../services/leadService';

interface BulkEmailComposerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BulkEmailComposer({ isOpen, onClose }: BulkEmailComposerProps) {
  const [activeTab, setActiveTab] = useState<'compose' | 'templates' | 'recipients'>('compose');
  const [emailContent, setEmailContent] = useState({
    subject: '',
    htmlBody: '',
    textBody: ''
  });
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [allLeads, setAllLeads] = useState<Array<{ _id?: string; name: string; email: string; phone: string; status: string }>>([]);
  const [fromName, setFromName] = useState(process.env.EMAIL_FROM_NAME || 'AI Call Pro CRM');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string; failedRecipients?: string[] } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadLeads();
    }
  }, [isOpen]);

  const loadLeads = async () => {
    try {
      const response = await leadService.getLeads();
      setAllLeads(response.leads || []);
    } catch (error) {
      console.error('Error loading leads:', error);
    }
  };

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEmailContent({
      subject: template.subject,
      htmlBody: template.htmlBody,
      textBody: template.textBody || ''
    });
    
    // Set default variables
    const defaultVars: Record<string, string> = {
      recipientName: '{{recipientName}}',
      senderName: fromName,
      propertyName: 'Sample Property',
      propertyAddress: '123 Main St, City, State',
      propertyPrice: '$500,000',
      showingDate: new Date().toLocaleDateString(),
      showingTime: '2:00 PM',
      phoneNumber: '(555) 123-4567',
      campaignName: 'Sample Campaign',
      totalCalls: '50',
      answeredCalls: '35',
      successRate: '70',
      leadsGenerated: '15'
    };
    setTemplateVariables(defaultVars);
  };

  const handleSendBulkEmail = async () => {
    if (selectedLeads.length === 0) {
      setSendResult({ success: false, message: 'Please select at least one recipient' });
      return;
    }

    if (!emailContent.subject || !emailContent.htmlBody) {
      setSendResult({ success: false, message: 'Please fill in subject and message' });
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const recipients: EmailRecipient[] = allLeads
        .filter(lead => lead._id && selectedLeads.includes(lead._id))
        .map(lead => ({
          name: lead.name,
          email: lead.email
        }));

      let result;
      if (selectedTemplate) {
        // Send templated email
        result = await emailService.sendBulkTemplatedEmails(
          recipients,
          selectedTemplate.id,
          templateVariables,
          fromName
        );
      } else {
        // Send custom email
        result = await emailService.sendBulkEmails({
          recipients,
          content: emailContent,
          fromName
        });
      }

      setSendResult(result);
      
      if (result.success) {
        // Clear form on success
        setEmailContent({ subject: '', htmlBody: '', textBody: '' });
        setSelectedLeads([]);
        setSelectedTemplate(null);
      }
    } catch (error) {
      setSendResult({
        success: false,
        message: `Failed to send emails: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleLeadToggle = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAllLeads = () => {
    if (selectedLeads.length === allLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(allLeads.map(lead => lead._id).filter((id): id is string => id !== undefined));
    }
  };

  const renderTemplatePreview = () => {
    if (!selectedTemplate) return null;

    let previewSubject = selectedTemplate.subject;
    let previewBody = selectedTemplate.htmlBody;

    // Replace variables in preview
    Object.entries(templateVariables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      previewSubject = previewSubject.replace(new RegExp(placeholder, 'g'), value);
      previewBody = previewBody.replace(new RegExp(placeholder, 'g'), value);
    });

    return (
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Template Preview</h3>
          <button
            onClick={() => setSelectedTemplate(null)}
            className="text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
            <input
              type="text"
              value={previewSubject}
              onChange={(e) => setEmailContent(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Variables</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(templateVariables).map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <label className="text-xs text-gray-400">{key}</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setTemplateVariables(prev => ({ ...prev, [key]: e.target.value }))}
                    className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
            <textarea
              rows={8}
              value={previewBody}
              onChange={(e) => setEmailContent(prev => ({ ...prev, htmlBody: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center">
            <Mail className="h-6 w-6 text-blue-400 mr-3" />
            <h2 className="text-xl font-bold text-white">Bulk Email Composer</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Tab Navigation */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setActiveTab('compose')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'compose'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Mail className="h-4 w-4 mr-2 inline" />
              Compose
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'templates'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <FileText className="h-4 w-4 mr-2 inline" />
              Templates
            </button>
            <button
              onClick={() => setActiveTab('recipients')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'recipients'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Users className="h-4 w-4 mr-2 inline" />
              Recipients ({selectedLeads.length})
            </button>
          </div>

          {/* Compose Tab */}
          {activeTab === 'compose' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">From Name</label>
                  <input
                    type="text"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="AI Call Pro CRM"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Subject *</label>
                  <input
                    type="text"
                    value={emailContent.subject}
                    onChange={(e) => setEmailContent(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email subject"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Message (HTML) *</label>
                <textarea
                  rows={12}
                  value={emailContent.htmlBody}
                  onChange={(e) => setEmailContent(prev => ({ ...prev, htmlBody: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your HTML message..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Plain Text Version (Optional)</label>
                <textarea
                  rows={6}
                  value={emailContent.textBody}
                  onChange={(e) => setEmailContent(prev => ({ ...prev, textBody: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Plain text version of your message..."
                />
              </div>

              {selectedTemplate && renderTemplatePreview()}
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {emailService.getAllTemplates().map((template) => (
                  <div
                    key={template.id}
                    className={`bg-gray-800 p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id 
                        ? 'border-blue-500 bg-blue-900 bg-opacity-20' 
                        : 'border-gray-700 hover:border-blue-500'
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <h3 className="font-medium text-white mb-2">{template.name}</h3>
                    <p className="text-gray-400 text-sm mb-3">{template.subject}</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      template.category === 'lead-followup' ? 'bg-blue-100 text-blue-800' :
                      template.category === 'campaign' ? 'bg-green-100 text-green-800' :
                      template.category === 'general' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {template.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recipients Tab */}
          {activeTab === 'recipients' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Select Recipients</h3>
                <button
                  onClick={handleSelectAllLeads}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  {selectedLeads.length === allLeads.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              
              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-700">
                  <h4 className="text-white font-medium">
                    Leads ({selectedLeads.length} of {allLeads.length} selected)
                  </h4>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {allLeads.map((lead) => (
                    <div
                      key={lead._id || `lead-${Math.random()}`}
                      className={`flex items-center px-6 py-3 border-b border-gray-700 hover:bg-gray-700 cursor-pointer ${
                        lead._id && selectedLeads.includes(lead._id) ? 'bg-blue-900 bg-opacity-20' : ''
                      }`}
                      onClick={() => lead._id && handleLeadToggle(lead._id)}
                    >
                      <input
                        type="checkbox"
                        checked={lead._id ? selectedLeads.includes(lead._id) : false}
                        onChange={() => lead._id && handleLeadToggle(lead._id)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-white">{lead.name}</div>
                        <div className="text-gray-400 text-sm">{lead.email}</div>
                        {lead.phone && (
                          <div className="text-gray-400 text-sm">{lead.phone}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                          lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                          lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                          lead.status === 'qualified' ? 'bg-purple-100 text-purple-800' :
                          lead.status === 'converted' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {lead.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Send Button and Results */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {selectedLeads.length > 0 && `Ready to send to ${selectedLeads.length} recipients`}
              </div>
              
              <button
                onClick={handleSendBulkEmail}
                disabled={isSending || selectedLeads.length === 0 || !emailContent.subject || !emailContent.htmlBody}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-6 rounded-md font-medium transition-colors flex items-center"
              >
                {isSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Bulk Email
                  </>
                )}
              </button>
            </div>

            {sendResult && (
              <div className={`mt-4 p-4 rounded-lg border ${
                sendResult.success 
                  ? 'bg-green-900 bg-opacity-20 border-green-700' 
                  : 'bg-red-900 bg-opacity-20 border-red-700'
              }`}>
                <div className="flex items-center">
                  {sendResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  )}
                  <span className={`font-medium ${sendResult.success ? 'text-green-400' : 'text-red-400'}`}>
                    {sendResult.success ? 'Bulk Email Sent Successfully' : 'Bulk Email Failed'}
                  </span>
                </div>
                <p className="text-gray-300 text-sm mt-2">{sendResult.message}</p>
                {sendResult.failedRecipients && sendResult.failedRecipients.length > 0 && (
                  <div className="mt-3">
                    <p className="text-red-400 text-sm font-medium">Failed Recipients:</p>
                    <ul className="text-red-300 text-sm mt-1 space-y-1">
                      {sendResult.failedRecipients.map((recipient, index) => (
                        <li key={index}>• {recipient}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 