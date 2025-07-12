export interface Lead {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  property: string;
  interest: 'high' | 'medium' | 'low';
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  requestedCallback: boolean;
  notes?: string;
  campaignId?: string;
  lastContactDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LeadResponse {
  leads: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Refactored: All lead data is now stored in outreach.storage as StorageRecord documents.
// Use createRecord('lead', ...), getRecords('lead'), etc. for all lead operations.
// TODO: Replace all collection-specific service calls with generic storage API calls.
class LeadService {
  private baseURL = '/api/leads';

  // Get all leads with optional filtering
  async getLeads(params?: {
    status?: string;
    interest?: string;
    page?: number;
    limit?: number;
  }): Promise<LeadResponse> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.interest) searchParams.append('interest', params.interest);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const response = await fetch(`${this.baseURL}?${searchParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch leads');
    }
    return response.json();
  }

  // Get a single lead by ID
  async getLead(id: string): Promise<Lead> {
    const response = await fetch(`${this.baseURL}/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch lead');
    }
    return response.json();
  }

  // Create a new lead
  async createLead(lead: Omit<Lead, '_id' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lead),
    });
    if (!response.ok) {
      throw new Error('Failed to create lead');
    }
    return response.json();
  }

  // Update a lead
  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error('Failed to update lead');
    }
    return response.json();
  }

  // Delete a lead
  async deleteLead(id: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete lead');
    }
  }

  // Bulk create leads from data
  async bulkCreateLeads(leads: Omit<Lead, '_id' | 'createdAt' | 'updatedAt'>[]): Promise<Lead[]> {
    const promises = leads.map(lead => this.createLead(lead));
    return Promise.all(promises);
  }
}

const leadService = new LeadService();
export default leadService; 