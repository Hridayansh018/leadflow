import { supabase } from './supabase';

export interface Lead {
  id?: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  notes?: string;
  interest?: 'high' | 'medium' | 'low';
  requestedCallback?: boolean;
  created_at?: string;
  updated_at?: string;
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

class LeadService {
  // Get all leads with optional filtering
  async getLeads(params?: {
    status?: string;
    user_id?: string;
    page?: number;
    limit?: number;
  }): Promise<LeadResponse> {
    try {
      let query = supabase
        .from('leads')
        .select('*', { count: 'exact' });

      if (params?.status) {
        query = query.eq('status', params.status);
      }
      if (params?.user_id) {
        query = query.eq('user_id', params.user_id);
      }

      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const offset = (page - 1) * limit;

      query = query.range(offset, offset + limit - 1);
      query = query.order('created_at', { ascending: false });

      const { data: leads, error, count } = await query;

      if (error) {
        throw new Error('Failed to fetch leads');
      }

      return {
        leads: leads || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
  }

  // Create a new lead
  async createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...lead,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error('Failed to create lead');
      }

      return data;
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }

  // Update a lead
  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error('Failed to update lead');
      }

      return data;
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  }

  // Delete a lead
  async deleteLead(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error('Failed to delete lead');
      }

      return true;
    } catch (error) {
      console.error('Error deleting lead:', error);
      throw error;
    }
  }

  // Get a single lead by ID
  async getLead(id: string): Promise<Lead | null> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Lead not found
        }
        throw new Error('Failed to fetch lead');
      }

      return data;
    } catch (error) {
      console.error('Error fetching lead:', error);
      throw error;
    }
  }
}

const leadService = new LeadService();
export default leadService; 