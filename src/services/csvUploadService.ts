import { supabase } from './supabaseClient';

export interface CSVLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  location?: string;
  notes?: string;
}

export interface UploadedCSV {
  id: string;
  filename: string;
  leadCount: number;
  uploadedAt: string;
  status: 'processing' | 'completed' | 'failed';
  error?: string;
}

class CSVUploadService {
  // Parse CSV file and extract leads
  async parseCSVFile(file: File): Promise<CSVLead[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const csv = event.target?.result as string;
          const lines = csv.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          
          // Validate required headers
          const requiredHeaders = ['name', 'email', 'phone'];
          const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
          
          if (missingHeaders.length > 0) {
            reject(new Error(`Missing required headers: ${missingHeaders.join(', ')}`));
            return;
          }
          
          const leads: CSVLead[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = line.split(',').map(v => v.trim());
            if (values.length < 3) continue; // Skip incomplete rows
            
            const lead: CSVLead = {
              id: `csv_${Date.now()}_${i}`,
              name: values[headers.indexOf('name')] || '',
              email: values[headers.indexOf('email')] || '',
              phone: values[headers.indexOf('phone')] || '',
              location: headers.includes('location') ? values[headers.indexOf('location')] : undefined,
              notes: headers.includes('notes') ? values[headers.indexOf('notes')] : undefined
            };
            
            // Validate lead data
            if (lead.name && lead.email && lead.phone) {
              leads.push(lead);
            }
          }
          
          resolve(leads);
        } catch (error) {
          reject(new Error('Failed to parse CSV file'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // Store uploaded CSV data in database
  async storeUploadedCSV(filename: string, leads: CSVLead[]): Promise<UploadedCSV> {
    try {
      const { data, error } = await supabase
        .from('uploaded_csvs')
        .insert({
          filename,
          lead_count: leads.length,
          status: 'completed',
          uploaded_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error('Failed to store CSV upload record');
      }

      // Store individual leads
      const leadRecords = leads.map(lead => ({
        csv_upload_id: data.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        location: lead.location,
        notes: lead.notes,
        created_at: new Date().toISOString()
      }));

      const { error: leadsError } = await supabase
        .from('csv_leads')
        .insert(leadRecords);

      if (leadsError) {
        throw new Error('Failed to store CSV leads');
      }

      return {
        id: data.id,
        filename,
        leadCount: leads.length,
        uploadedAt: data.uploaded_at,
        status: 'completed'
      };
    } catch (error) {
      console.error('Error storing uploaded CSV:', error);
      throw error;
    }
  }

  // Get uploaded CSV files
  async getUploadedCSVs(): Promise<UploadedCSV[]> {
    try {
      const { data, error } = await supabase
        .from('uploaded_csvs')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) {
        throw new Error('Failed to fetch uploaded CSVs');
      }

      return (data || []).map(csv => ({
        id: csv.id,
        filename: csv.filename,
        leadCount: csv.lead_count,
        uploadedAt: csv.uploaded_at,
        status: csv.status,
        error: csv.error
      }));
    } catch (error) {
      console.error('Error fetching uploaded CSVs:', error);
      throw error;
    }
  }

  // Get leads from a specific CSV upload
  async getCSVLeads(csvUploadId: string): Promise<CSVLead[]> {
    try {
      const { data, error } = await supabase
        .from('csv_leads')
        .select('*')
        .eq('csv_upload_id', csvUploadId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error('Failed to fetch CSV leads');
      }

      return (data || []).map(lead => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        location: lead.location,
        notes: lead.notes
      }));
    } catch (error) {
      console.error('Error fetching CSV leads:', error);
      throw error;
    }
  }

  // Delete uploaded CSV and its leads
  async deleteUploadedCSV(csvUploadId: string): Promise<boolean> {
    try {
      // Delete leads first
      const { error: leadsError } = await supabase
        .from('csv_leads')
        .delete()
        .eq('csv_upload_id', csvUploadId);

      if (leadsError) {
        throw new Error('Failed to delete CSV leads');
      }

      // Delete CSV upload record
      const { error } = await supabase
        .from('uploaded_csvs')
        .delete()
        .eq('id', csvUploadId);

      if (error) {
        throw new Error('Failed to delete CSV upload record');
      }

      return true;
    } catch (error) {
      console.error('Error deleting uploaded CSV:', error);
      throw error;
    }
  }
}

export default new CSVUploadService(); 