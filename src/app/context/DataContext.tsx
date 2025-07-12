"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Campaign {
  id: string;
  name: string;
  leads: number;
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
}

interface CallHistory {
  id: string;
  customerName: string;
  phoneNumber: string;
  duration: string;
  status: 'answered' | 'unanswered' | 'busy';
  type: 'campaign' | 'single';
  campaignName?: string;
  timestamp: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  interest: 'high' | 'medium' | 'low';
  property: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted';
  requestedCallback: boolean;
}

interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  type: 'sent' | 'received';
  read?: boolean;
  starred?: boolean;
  archived?: boolean;
}

interface DataContextType {
  campaigns: Campaign[];
  callHistory: CallHistory[];
  leads: Lead[];
  emails: Email[];
  addCampaign: (campaign: Omit<Campaign, 'id'>) => void;
  addCallHistory: (call: Omit<CallHistory, 'id'>) => void;
  addLead: (lead: Omit<Lead, 'id'>) => void;
  addEmail: (email: Omit<Email, 'id'>) => void;
  deleteCampaign: (id: string) => void;
  deleteEmail: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [callHistory, setCallHistory] = useState<CallHistory[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);

  const addCampaign = (campaign: Omit<Campaign, 'id'>) => {
    setCampaigns(prev => [...prev, { ...campaign, id: Date.now().toString() }]);
  };

  const addCallHistory = (call: Omit<CallHistory, 'id'>) => {
    setCallHistory(prev => [...prev, { ...call, id: Date.now().toString() }]);
  };

  const addLead = (lead: Omit<Lead, 'id'>) => {
    setLeads(prev => [...prev, { ...lead, id: Date.now().toString() }]);
  };

  const addEmail = (email: Omit<Email, 'id'>) => {
    setEmails(prev => [...prev, { ...email, id: Date.now().toString() }]);
  };

  const deleteCampaign = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
  };

  const deleteEmail = (id: string) => {
    setEmails(prev => prev.filter(e => e.id !== id));
  };

  return (
    <DataContext.Provider value={{
      campaigns,
      callHistory,
      leads,
      emails,
      addCampaign,
      addCallHistory,
      addLead,
      addEmail,
      deleteCampaign,
      deleteEmail,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}