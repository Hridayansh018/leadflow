// Database service for MongoDB operations
// Note: This service is designed to work in both server and client environments

interface DatabaseRecord {
  id?: string;
  [key: string]: any;
}

interface Lead {
  id?: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Campaign {
  id?: string;
  name: string;
  status: string;
  leads: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CallHistory {
  id?: string;
  customerName: string;
  phoneNumber: string;
  status: string;
  duration: string;
  notes: string;
  type: string;
  createdAt: string;
}

interface EmailTemplate {
  id?: string;
  name: string;
  subject: string;
  content: string;
  category: string;
  variables: string[];
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Property {
  id: string;
  name: string;
  address: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  type: 'residential' | 'commercial' | 'land';
  status: 'available' | 'sold' | 'pending' | 'off-market';
}

export interface PropertyFile {
  id?: string;
  name: string;
  description: string;
  content: string;
  properties: Property[];
  createdAt?: string;
  updatedAt?: string;
}

class DatabaseService {
  private isClient: boolean;

  constructor() {
    // Check if we're in a browser environment
    this.isClient = typeof window !== 'undefined';
  }

  // Generic method to create a record
  async createRecord(collection: string, data: any): Promise<DatabaseRecord> {
    if (this.isClient) {
      // Client-side: Use localStorage as fallback
      return this.createRecordClient(collection, data);
    } else {
      // Server-side: Use MongoDB
      return this.createRecordServer(collection, data);
    }
  }

  // Generic method to get records
  async getRecords(collection: string, filter: any = {}): Promise<DatabaseRecord[]> {
    if (this.isClient) {
      // Client-side: Use localStorage as fallback
      return this.getRecordsClient(collection, filter);
    } else {
      // Server-side: Use MongoDB
      return this.getRecordsServer(collection, filter);
    }
  }

  // Generic method to update a record
  async updateRecord(collection: string, id: string, data: any): Promise<DatabaseRecord> {
    if (this.isClient) {
      // Client-side: Use localStorage as fallback
      return this.updateRecordClient(collection, id, data);
    } else {
      // Server-side: Use MongoDB
      return this.updateRecordServer(collection, id, data);
    }
  }

  // Generic method to delete a record
  async deleteRecord(collection: string, id: string): Promise<boolean> {
    if (this.isClient) {
      // Client-side: Use localStorage as fallback
      return this.deleteRecordClient(collection, id);
    } else {
      // Server-side: Use MongoDB
      return this.deleteRecordServer(collection, id);
    }
  }

  // Client-side methods using localStorage
  private createRecordClient(collection: string, data: any): DatabaseRecord {
    const records = this.getRecordsFromStorage(collection);
    const newRecord = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    records.push(newRecord);
    this.saveRecordsToStorage(collection, records);
    return newRecord;
  }

  private getRecordsClient(collection: string, filter: any = {}): DatabaseRecord[] {
    const records = this.getRecordsFromStorage(collection);
    
    // Apply filters
    return records.filter(record => {
      for (const [key, value] of Object.entries(filter)) {
        if (record[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  private updateRecordClient(collection: string, id: string, data: any): DatabaseRecord {
    const records = this.getRecordsFromStorage(collection);
    const index = records.findIndex(record => record.id === id);
    
    if (index === -1) {
      throw new Error(`Record with id ${id} not found`);
    }
    
    const updatedRecord = {
      ...records[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    records[index] = updatedRecord;
    this.saveRecordsToStorage(collection, records);
    return updatedRecord;
  }

  private deleteRecordClient(collection: string, id: string): boolean {
    const records = this.getRecordsFromStorage(collection);
    const filteredRecords = records.filter(record => record.id !== id);
    
    if (filteredRecords.length === records.length) {
      return false; // Record not found
    }
    
    this.saveRecordsToStorage(collection, filteredRecords);
    return true;
  }

  private getRecordsFromStorage(collection: string): DatabaseRecord[] {
    try {
      const data = localStorage.getItem(`db_${collection}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }

  private saveRecordsToStorage(collection: string, records: DatabaseRecord[]): void {
    try {
      localStorage.setItem(`db_${collection}`, JSON.stringify(records));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }

  // Server-side methods using MongoDB (placeholder for future implementation)
  private async createRecordServer(collection: string, data: any): Promise<DatabaseRecord> {
    // This would be implemented with actual MongoDB connection
    console.log('Server-side create record:', collection, data);
    return { id: Date.now().toString(), ...data };
  }

  private async getRecordsServer(collection: string, filter: any = {}): Promise<DatabaseRecord[]> {
    // This would be implemented with actual MongoDB connection
    console.log('Server-side get records:', collection, filter);
    return [];
  }

  private async updateRecordServer(collection: string, id: string, data: any): Promise<DatabaseRecord> {
    // This would be implemented with actual MongoDB connection
    console.log('Server-side update record:', collection, id, data);
    return { id, ...data };
  }

  private async deleteRecordServer(collection: string, id: string): Promise<boolean> {
    // This would be implemented with actual MongoDB connection
    console.log('Server-side delete record:', collection, id);
    return true;
  }

  // Lead-specific methods
  async createLead(lead: Lead): Promise<Lead> {
    const result = await this.createRecord('leads', lead);
    return result as Lead;
  }

  async getLeads(): Promise<Lead[]> {
    const result = await this.getRecords('leads');
    return result as Lead[];
  }

  async updateLead(id: string, lead: Partial<Lead>): Promise<Lead> {
    const result = await this.updateRecord('leads', id, lead);
    return result as Lead;
  }

  async deleteLead(id: string): Promise<boolean> {
    return this.deleteRecord('leads', id);
  }

  // Campaign-specific methods
  async createCampaign(campaign: Campaign): Promise<Campaign> {
    const result = await this.createRecord('campaigns', campaign);
    return result as Campaign;
  }

  async getCampaigns(): Promise<Campaign[]> {
    const result = await this.getRecords('campaigns');
    return result as Campaign[];
  }

  async updateCampaign(id: string, campaign: Partial<Campaign>): Promise<Campaign> {
    const result = await this.updateRecord('campaigns', id, campaign);
    return result as Campaign;
  }

  async deleteCampaign(id: string): Promise<boolean> {
    return this.deleteRecord('campaigns', id);
  }

  // Call History-specific methods
  async createCallHistory(call: CallHistory): Promise<CallHistory> {
    const result = await this.createRecord('callHistory', call);
    return result as CallHistory;
  }

  async getCallHistory(): Promise<CallHistory[]> {
    const result = await this.getRecords('callHistory');
    return result as CallHistory[];
  }

  // Email Template-specific methods
  async createEmailTemplate(template: EmailTemplate): Promise<EmailTemplate> {
    const result = await this.createRecord('emailTemplates', template);
    return result as EmailTemplate;
  }

  async getEmailTemplates(): Promise<EmailTemplate[]> {
    const result = await this.getRecords('emailTemplates');
    return result as EmailTemplate[];
  }

  async updateEmailTemplate(id: string, template: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const result = await this.updateRecord('emailTemplates', id, template);
    return result as EmailTemplate;
  }

  async deleteEmailTemplate(id: string): Promise<boolean> {
    return this.deleteRecord('emailTemplates', id);
  }

  // Property File-specific methods
  async createPropertyFile(propertyFile: PropertyFile): Promise<PropertyFile> {
    const result = await this.createRecord('propertyFiles', propertyFile);
    return result as PropertyFile;
  }

  async getPropertyFiles(): Promise<PropertyFile[]> {
    const result = await this.getRecords('propertyFiles');
    return result as PropertyFile[];
  }

  async updatePropertyFile(id: string, propertyFile: Partial<PropertyFile>): Promise<PropertyFile> {
    const result = await this.updateRecord('propertyFiles', id, propertyFile);
    return result as PropertyFile;
  }

  async deletePropertyFile(id: string): Promise<boolean> {
    return this.deleteRecord('propertyFiles', id);
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    if (this.isClient) {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('db_')) {
          localStorage.removeItem(key);
        }
      });
    }
  }

  async exportData(): Promise<any> {
    if (this.isClient) {
      const collections = ['leads', 'campaigns', 'callHistory', 'emailTemplates', 'propertyFiles'];
      const data: any = {};
      
      collections.forEach(collection => {
        data[collection] = this.getRecordsFromStorage(collection);
      });
      
      return data;
    }
    return {};
  }

  async importData(data: any): Promise<void> {
    if (this.isClient) {
      Object.entries(data).forEach(([collection, records]) => {
        this.saveRecordsToStorage(collection, records as DatabaseRecord[]);
      });
    }
  }
}

export default new DatabaseService(); 