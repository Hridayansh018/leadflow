"use client";

import React, { useState, useEffect } from 'react';
import { Play, Pause, StopCircle, Trash2, Eye, BarChart3, AlertTriangle, TrendingUp, Users, Phone, CheckCircle, FileText, Clock, UserPlus, PhoneCall } from 'lucide-react';
import vapiService from '../services/vapiService';
import CampaignCreator from './CampaignCreator';
import { showSuccess, showError, showWarning } from '../utils/toastUtils';
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "./ui/table";

interface Campaign {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  leadsCount: number;
  completionRate: number;
}

interface CampaignAnalytics {
  totalCalls: number;
  answeredCalls: number;
  unansweredCalls: number;
  failedCalls: number;
  averageCallDuration: number;
  answerRate: number;
  successRate: number;
  conversionRate: number;
  leadsGenerated: number;
  callbackRequests: number;
  interestedCustomers: number;
  callTimeline: Array<{
    date: string;
    calls: number;
    answered: number;
    conversions: number;
  }>;
  topPerformingLeads: Array<{
    name: string;
    phone: string;
    status: string;
    duration: number;
    interest: string;
  }>;
}

interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category: 'lead-followup' | 'property-showing' | 'general' | 'custom';
  variables: string[];
}



export default function CampaignManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates] = useState<CampaignTemplate[]>(vapiService.getCampaignTemplates());
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedCampaignDetails, setSelectedCampaignDetails] = useState<{ campaign: any, callDetails: any[] } | null>(null);


  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const vapiCampaigns = await vapiService.getCampaigns();
      
      // Calculate real completion rates for each campaign
      const campaignData: Campaign[] = await Promise.all(
        vapiCampaigns.map(async (campaign) => {
          try {
            // Get detailed campaign information
            const campaignDetails = await vapiService.getCampaignDetails(campaign.id);
            const totalLeads = campaign.leads.length;
            const completedCalls = campaignDetails.callDetails.filter(
              call => ['answered', 'unanswered', 'failed'].includes(call.status)
            ).length;
            const completionRate = totalLeads > 0 ? (completedCalls / totalLeads) * 100 : 0;
            
            return {
              id: campaign.id,
              name: campaign.name,
              status: campaign.status,
              createdAt: campaign.createdAt,
              leadsCount: totalLeads,
              completionRate: Math.round(completionRate)
            };
          } catch (error) {
            console.error(`Error getting details for campaign ${campaign.id}:`, error);
            return {
              id: campaign.id,
              name: campaign.name,
              status: campaign.status,
              createdAt: campaign.createdAt,
              leadsCount: campaign.leads.length,
              completionRate: 0
            };
          }
        })
      );

      setCampaigns(campaignData);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignAction = async (campaignId: string, action: 'pause' | 'stop' | 'delete') => {
    try {
      setActionLoading(campaignId);
      
      let result;
      switch (action) {
        case 'pause':
          result = await vapiService.pauseCampaign(campaignId);
          break;
        case 'stop':
          result = await vapiService.stopCampaign(campaignId);
          break;
        case 'delete':
          result = await vapiService.deleteCampaign(campaignId);
          break;
      }
      
      if (result.success) {
        // Update local state
        setCampaigns(prev => prev.map(campaign => {
          if (campaign.id === campaignId) {
            let newStatus = campaign.status;
            switch (action) {
              case 'pause':
                newStatus = 'paused';
                break;
              case 'stop':
                newStatus = 'completed';
                break;
              case 'delete':
                return null; // Remove from list
            }
            return { ...campaign, status: newStatus };
          }
          return campaign;
        }).filter(Boolean) as Campaign[]);
        
        alert(`✅ ${result.message}`);
      } else {
        alert(`❌ ${result.message}`);
      }
      
    } catch (error) {
      console.error(`Error ${action}ing campaign:`, error);
      alert(`❌ Error ${action}ing campaign: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTemplateSelect = (template: CampaignTemplate) => {
    setSelectedTemplate(template);
    
    // Set default variables
    const defaultVars: Record<string, string> = {
      recipientName: 'John Doe',
      senderName: 'AI Call Pro',
      companyName: 'AI Call Pro CRM',
      propertyType: 'residential',
      location: 'Downtown',
      propertyAddress: '123 Main St',
      showingDate: new Date().toLocaleDateString(),
      showingTime: '2:00 PM',
      propertyFeatures: '3 bedrooms, 2 bathrooms',
      propertyPrice: '$500,000',
      marketConditions: 'favorable',
      marketTrend: 'increasing prices',
      inquiryType: 'property inquiry',
      specificDetails: '3-bedroom homes',
      openHouseDate: new Date().toLocaleDateString(),
      openHouseTime: '1:00 PM - 4:00 PM',
      propertyHighlights: 'recently renovated, great location'
    };
    
    // Only set variables that exist in the template
    const templateVars: Record<string, string> = {};
    template.variables.forEach(variable => {
      if (defaultVars[variable]) {
        templateVars[variable] = defaultVars[variable];
      }
    });
    
    setTemplateVariables(templateVars);
  };

  const handleShowDetails = async (campaignId: string) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    try {
      const details = await vapiService.getCampaignDetails(campaignId);
      setSelectedCampaignDetails(details);
    } catch (error) {
      showError('Failed to load campaign call details');
      setSelectedCampaignDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };


  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Play className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'border-green-500 text-green-700 bg-green-50';
      case 'paused':
        return 'border-yellow-500 text-yellow-700 bg-yellow-50';
      case 'completed':
        return 'border-blue-500 text-blue-700 bg-blue-50';
      case 'failed':
        return 'border-red-500 text-red-700 bg-red-50';
      default:
        return 'border-gray-500 text-gray-700 bg-gray-50';
    }
  };

  const canPause = (status: string) => status === 'active';
  const canStop = (status: string) => ['active', 'paused'].includes(status);
  const canDelete = (status: string) => ['completed', 'failed'].includes(status);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderTemplates = () => {
    return (
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[var(--card)] text-[var(--card-foreground)]">
          <DialogHeader>
            <DialogTitle>Campaign Templates</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card
                key={template.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedTemplate?.id === template.id ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-[var(--border)] hover:border-[var(--primary)]'}`}
                onClick={() => handleTemplateSelect(template)}
              >
                <h4 className="font-medium text-[var(--foreground)] mb-2">{template.name}</h4>
                <p className="text-sm text-[var(--muted-foreground)] mb-3">{template.description}</p>
                <div className="flex flex-wrap gap-1">
                  {template.variables.slice(0, 3).map((variable) => (
                    <span
                      key={variable}
                      className="px-2 py-1 text-xs bg-[var(--muted)] text-[var(--muted-foreground)] rounded"
                    >
                      {variable}
                    </span>
                  ))}
                  {template.variables.length > 3 && (
                    <span className="px-2 py-1 text-xs bg-[var(--muted)] text-[var(--muted-foreground)] rounded">
                      +{template.variables.length - 3} more
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
          {selectedTemplate && (
            <Card className="mt-6 bg-[var(--muted)] p-4 rounded-lg border border-[var(--border)]">
              <CardHeader>
                <CardTitle>Template Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Variables</label>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedTemplate.variables.map((variable) => (
                        <div key={variable} className="flex flex-col">
                          <label className="text-xs text-[var(--muted-foreground)]">{variable}</label>
                          <Input
                            type="text"
                            value={templateVariables[variable] || ''}
                            onChange={(e) => setTemplateVariables(prev => ({ ...prev, [variable]: e.target.value }))}
                            className="px-2 py-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Processed Prompt</label>
                    <div className="bg-[var(--input)] p-3 rounded border border-[var(--border)]">
                      <p className="text-[var(--foreground)] text-sm">
                        {vapiService.processCampaignTemplate(selectedTemplate.id, templateVariables)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <Card className="bg-[var(--card)] text-[var(--card-foreground)] p-6">
      <CardHeader className="flex items-center justify-between mb-6">
        <CardTitle>Campaign Manager</CardTitle>
        <div className="flex space-x-2">
          <CampaignCreator />
          <Button onClick={() => setShowTemplates(true)} variant="secondary" className="flex items-center">
            <FileText className="h-4 w-4 mr-2 inline" />
            Templates
          </Button>
          <Button onClick={loadCampaigns} disabled={loading} variant="outline">
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {campaigns.length === 0 ? (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-[var(--muted-foreground)]" />
            <p className="text-[var(--muted-foreground)]">No campaigns found</p>
            <p className="text-sm text-[var(--muted-foreground)] mt-2">Create a campaign to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className={`border rounded-lg p-4 transition-colors ${selectedCampaign === campaign.id ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-[var(--border)] hover:border-[var(--primary)]'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(campaign.status)}
                    <div>
                      <h4 className="font-medium text-[var(--foreground)]">{campaign.name}</h4>
                      <p className="text-sm text-[var(--muted-foreground)]">Created {formatDate(campaign.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--foreground)]">{campaign.leadsCount}</div>
                    <div className="text-sm text-[var(--muted-foreground)]">Leads</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--primary)]">{campaign.completionRate}%</div>
                    <div className="text-sm text-[var(--muted-foreground)]">Completion</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canPause(campaign.status) && (
                    <Button
                      onClick={() => handleCampaignAction(campaign.id, 'pause')}
                      disabled={actionLoading === campaign.id}
                      variant="secondary"
                      className="flex items-center"
                    >
                      <Pause className="h-3 w-3 mr-1" />
                      Pause
                    </Button>
                  )}
                  {canStop(campaign.status) && (
                    <Button
                      onClick={() => handleCampaignAction(campaign.id, 'stop')}
                      disabled={actionLoading === campaign.id}
                      variant="destructive"
                      className="flex items-center"
                    >
                      <StopCircle className="h-3 w-3 mr-1" />
                      Stop
                    </Button>
                  )}
                  {canDelete(campaign.status) && (
                    <Button
                      onClick={() => handleCampaignAction(campaign.id, 'delete')}
                      disabled={actionLoading === campaign.id}
                      variant="outline"
                      className="flex items-center"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  )}
                  <Button
                    onClick={() => { setSelectedCampaign(campaign.id); handleShowDetails(campaign.id); }}
                    variant="secondary"
                    className="flex items-center"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Details
                  </Button>
                </div>
                {actionLoading === campaign.id && (
                  <div className="mt-2 text-sm text-[var(--muted-foreground)]">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--primary)] inline mr-2"></div>
                    Processing...
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
        {showTemplates && renderTemplates()}
        {/* Campaign Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="min-w-[70vw] min-h-[25vh] overflow-y-auto bg-[var(--card)] text-[var(--card-foreground)]">
            <DialogHeader>
              <DialogTitle>Campaign Call Details</DialogTitle>
            </DialogHeader>
            {detailsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
                <span className="ml-2 text-[var(--muted-foreground)]">Loading call details...</span>
              </div>
            ) : selectedCampaignDetails ? (
              <div>
                <div className="mb-4">
                  <div className="font-semibold">Campaign: {selectedCampaignDetails.campaign.name}</div>
                  <div className="text-sm text-[var(--muted-foreground)]">Created: {formatDate(selectedCampaignDetails.campaign.createdAt)}</div>
                </div>
                {selectedCampaignDetails.callDetails.length === 0 ? (
                  <div className="text-[var(--muted-foreground)]">
                    No calls have been made for this campaign yet.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Ended Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedCampaignDetails.callDetails.map((call, idx) => (
                        <TableRow key={call.callId || call.id || `${call.phoneNumber}-${call.createdAt}` || idx}>
                          <TableCell>{call.customerName || '-'}</TableCell>
                          <TableCell>{call.phoneNumber || '-'}</TableCell>
                          <TableCell>{call.status || '-'}</TableCell>
                          <TableCell>{call.duration || '-'}</TableCell>
                          <TableCell>{call.createdAt && !isNaN(Date.parse(call.createdAt)) ? new Date(call.createdAt).toLocaleString() : '-'}</TableCell>
                          <TableCell>{call.endedReason || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
} 