"use client";

import React, { useState, useEffect } from 'react';
import { Mail, Settings, TestTube, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import emailService, { EmailTemplate } from '../services/emailService';

interface EmailConfigurationProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmailConfiguration({ isOpen, onClose }: EmailConfigurationProps) {
  const [activeTab, setActiveTab] = useState<'config' | 'templates' | 'test'>('config');
  const [emailConfig, setEmailConfig] = useState({
    gmailEmail: process.env.GMAIL_EMAIL || '',
    gmailPassword: process.env.GMAIL_APP_PASSWORD || '',
    fromName: process.env.EMAIL_FROM_NAME || 'AI Call Pro CRM',
    replyTo: process.env.EMAIL_REPLY_TO || ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});

  const [configStatus, setConfigStatus] = useState<{ configured: boolean; email?: string; message: string }>({
    configured: false,
    message: 'Loading...'
  });

  useEffect(() => {
    const loadConfigStatus = async () => {
      try {
        const status = await emailService.getConfigurationStatus();
        setConfigStatus(status);
      } catch {
        setConfigStatus({
          configured: false,
          message: 'Failed to load configuration status'
        });
      }
    };
    
    loadConfigStatus();
  }, []);

  const handleTestEmail = async () => {
    if (!testEmail) {
      setTestResult({ success: false, message: 'Please enter a test email address' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await emailService.testEmailConfiguration();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTemplatePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    // Set default variables based on template
    const defaultVars: Record<string, string> = {
      recipientName: 'John Doe',
      senderName: emailConfig.fromName,
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
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
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
              readOnly
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Preview</label>
            <div 
              className="bg-white text-gray-900 p-4 rounded border max-h-96 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: previewBody }}
            />
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center">
            <Mail className="h-6 w-6 text-blue-400 mr-3" />
            <h2 className="text-xl font-bold text-white">Email Configuration</h2>
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
              onClick={() => setActiveTab('config')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'config'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Settings className="h-4 w-4 mr-2 inline" />
              Configuration
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'templates'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Mail className="h-4 w-4 mr-2 inline" />
              Templates
            </button>
            <button
              onClick={() => setActiveTab('test')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'test'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <TestTube className="h-4 w-4 mr-2 inline" />
              Test Email
            </button>
          </div>

          {/* Configuration Tab */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center mb-4">
                  {configStatus.configured ? (
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  )}
                  <span className={`font-medium ${configStatus.configured ? 'text-green-400' : 'text-red-400'}`}>
                    {configStatus.configured ? 'Email Service Configured' : 'Email Service Not Configured'}
                  </span>
                </div>
                <p className="text-gray-300 text-sm">{configStatus.message}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Gmail Email</label>
                  <input
                    type="email"
                    value={emailConfig.gmailEmail}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, gmailEmail: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your-email@gmail.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Gmail App Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={emailConfig.gmailPassword}
                      onChange={(e) => setEmailConfig(prev => ({ ...prev, gmailPassword: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="App password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">From Name</label>
                  <input
                    type="text"
                    value={emailConfig.fromName}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, fromName: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="AI Call Pro CRM"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Reply-To Email</label>
                  <input
                    type="email"
                    value={emailConfig.replyTo}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, replyTo: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="support@aicrm.com"
                  />
                </div>
              </div>

              <div className="bg-blue-900 bg-opacity-20 border border-blue-700 p-4 rounded-lg">
                <h3 className="text-blue-400 font-medium mb-2">Setup Instructions</h3>
                <ol className="text-gray-300 text-sm space-y-2">
                  <li>1. Enable 2-factor authentication on your Gmail account</li>
                  <li>2. Generate an App Password: Google Account → Security → App Passwords</li>
                  <li>3. Use the generated password (not your regular Gmail password)</li>
                  <li>4. Add these environment variables to your .env file</li>
                </ol>
              </div>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {emailService.getAllTemplates().map((template) => (
                  <div
                    key={template.id}
                    className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors cursor-pointer"
                    onClick={() => handleTemplatePreview(template)}
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

              {selectedTemplate && renderTemplatePreview()}
            </div>
          )}

          {/* Test Email Tab */}
          {activeTab === 'test' && (
            <div className="space-y-6">
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h3 className="font-medium text-white mb-4">Test Email Configuration</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Test Email Address</label>
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="test@example.com"
                    />
                  </div>
                  
                  <button
                    onClick={handleTestEmail}
                    disabled={isTesting || !testEmail}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center"
                  >
                    {isTesting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Testing...
                      </>
                    ) : (
                      <>
                        <TestTube className="h-4 w-4 mr-2" />
                        Send Test Email
                      </>
                    )}
                  </button>
                </div>

                {testResult && (
                  <div className={`mt-4 p-4 rounded-lg border ${
                    testResult.success 
                      ? 'bg-green-900 bg-opacity-20 border-green-700' 
                      : 'bg-red-900 bg-opacity-20 border-red-700'
                  }`}>
                    <div className="flex items-center">
                      {testResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                      )}
                      <span className={`font-medium ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                        {testResult.success ? 'Test Successful' : 'Test Failed'}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mt-2">{testResult.message}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 