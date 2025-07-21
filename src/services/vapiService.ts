import axios from 'axios';
// import databaseService from './databaseService'; // Commented out - not used

interface VAPICallRequest {
  phoneNumberId: string;
  assistantId: string;
  customer: {
    number: string;
    name?: string;
    info?: string;
  };
  metadata?: Record<string, unknown>; // Allow arbitrary metadata fields
  assistant?: {
    firstMessage: string;
  };
  assistantOverrides?: {
    variables?: Record<string, string>;
  };
}

interface VAPIScheduleCallRequest extends VAPICallRequest {
  scheduledTime?: string;
  timeOfDay?: string;
  timezone?: string;
}

interface VAPICampaignRequest {
  name: string;
  assistantId: string;
  phoneNumberId: string;
  leads: Array<{
    name: string;
    phone: string;
    info?: string;
  }>;
  prompt?: string;
  scheduledTime?: string;
  timeOfDay?: string;
  timezone?: string;
  metadata?: Record<string, unknown>;
  property_details?: string; // <-- add property_details
  assistantOverrides?: {
    variables?: Record<string, string>;
  };
}

// VAPI Campaign Schedule Plan interface
interface VAPISchedulePlan {
  earliestAt?: string; // ISO 8601 date-time
  latestAt?: string;   // ISO 8601 date-time
}

// VAPI Customer interface for campaigns
interface VAPICustomer {
  number: string;      // E.164 phone number
  name?: string;
  email?: string;
  extension?: string;
  externalId?: string;
  metadata?: Record<string, unknown>;
}

interface VAPICallResponse {
  id: string;
  status: string;
  customer: {
    number: string;
    name?: string;
  };
  assistant: {
    id: string;
  };
  phoneNumber: {
    id: string;
  };
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface VAPICampaignResponse {
  id: string;
  name: string;
  status: string;
  assistantId: string;
  phoneNumberId: string;
  leads: Array<{
    name: string;
    phone: string;
    info?: string;
  }>;
  prompt?: string;
  createdAt: string;
}

interface VAPICallStatusResponse {
  id: string;
  status: string;
  customer: {
    number: string;
    name?: string;
  };
  assistant: {
    id: string;
  };
  phoneNumber: {
    id: string;
  };
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface ScheduledCall {
  id: string;
  scheduledTime: string;
  request: VAPIScheduleCallRequest;
  status: 'pending' | 'executed' | 'failed';
}

class VAPIService {
  private baseURL = 'https://api.vapi.ai';
  private apiKey: string;
  private scheduledCalls: Map<string, ScheduledCall>;
  private schedulerInterval: number | null = null;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_VAPI_PRIVATE_KEY || '';
    this.scheduledCalls = new Map<string, ScheduledCall>();
    
    // Debug environment variable loading
    this.debugEnvironmentVariables();
    
    if (!this.apiKey) {
      console.error('❌ VAPI API key not found in environment variables');
      console.error('Please create a .env file with NEXT_PUBLIC_VAPI_PRIVATE_KEY=your_api_key_here');
      console.error('You can copy env.example to .env and fill in your values');
    } else {
      console.log('✅ VAPI Service initialized with API key: Present');
    }
    
    // Start the scheduler
    this.startScheduler();
  }

  private debugEnvironmentVariables() {
    console.log('🔍 Environment variables debug:');
    console.log('- process.env keys:', Object.keys(process.env));
    console.log('- NEXT_PUBLIC_VAPI_PRIVATE_KEY exists:', !!process.env.NEXT_PUBLIC_VAPI_PRIVATE_KEY);
    console.log('- NEXT_PUBLIC_VAPI_PRIVATE_KEY length:', process.env.NEXT_PUBLIC_VAPI_PRIVATE_KEY?.length || 0);
    console.log('- NEXT_PUBLIC_VAPI_PRIVATE_KEY value:', process.env.NEXT_PUBLIC_VAPI_PRIVATE_KEY ? '***' + process.env.NEXT_PUBLIC_VAPI_PRIVATE_KEY.slice(-4) : 'undefined');
    console.log('- NEXT_PUBLIC_VAPI_ASSISTANT_ID exists:', !!process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID);
    console.log('- NEXT_PUBLIC_PHONE_NUMBER_ID exists:', !!process.env.NEXT_PUBLIC_PHONE_NUMBER_ID);
    
    // Test if we can access the environment variable directly
    try {
      const testKey = process.env.NEXT_PUBLIC_VAPI_PRIVATE_KEY;
      console.log('- Direct access test:', testKey ? 'SUCCESS' : 'FAILED');
    } catch (error) {
      console.error('- Direct access error:', error);
    }
  }

  private reloadEnvironmentVariables() {
    console.log('🔄 Reloading environment variables...');
    this.apiKey = process.env.NEXT_PUBLIC_VAPI_PRIVATE_KEY || '';
    this.debugEnvironmentVariables();
  }

  private startScheduler() {
    // Check for scheduled calls every minute
    this.schedulerInterval = setInterval(() => {
      this.checkScheduledCalls();
    }, 60000) as unknown as number; // 60 seconds
    
    // Also check immediately on startup
    this.checkScheduledCalls();
  }

  private async checkScheduledCalls() {
    try {
      const now = new Date();
      
      // Ensure scheduledCalls is properly initialized
      if (!this.scheduledCalls || typeof this.scheduledCalls.entries !== 'function') {
        console.warn('Scheduled calls map not properly initialized, reinitializing...');
        this.scheduledCalls = new Map<string, ScheduledCall>();
        return;
      }
      
      if (this.scheduledCalls.size === 0) {
        return;
      }
      
      for (const [id, scheduledCall] of this.scheduledCalls.entries()) {
        if (scheduledCall.status === 'pending') {
          const scheduledTime = new Date(scheduledCall.scheduledTime);
          
          if (scheduledTime <= now) {
            console.log(`Executing scheduled call ${id} at ${scheduledTime.toISOString()}`);
            
            try {
              // Execute the call using the existing makeCall method
              await this.makeCall(scheduledCall.request);
              scheduledCall.status = 'executed';
              console.log(`Scheduled call ${id} executed successfully`);
            } catch (error) {
              console.error(`Failed to execute scheduled call ${id}:`, error);
              scheduledCall.status = 'failed';
            }
          }
        }
      }
      
      // Clean up executed/failed calls older than 24 hours
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      for (const [id, scheduledCall] of this.scheduledCalls.entries()) {
        const scheduledTime = new Date(scheduledCall.scheduledTime);
        if (scheduledTime < oneDayAgo && scheduledCall.status !== 'pending') {
          this.scheduledCalls.delete(id);
        }
      }
    } catch (error) {
      console.error('Error in checkScheduledCalls:', error);
    }
  }

  // Get all scheduled calls
  getScheduledCalls(): ScheduledCall[] {
    if (!this.scheduledCalls || typeof this.scheduledCalls.values !== 'function') {
      console.warn('Scheduled calls map not properly initialized, returning empty array');
      return [];
    }
    return Array.from(this.scheduledCalls.values());
  }

  // Cancel a scheduled call
  cancelScheduledCall(id: string): boolean {
    if (!this.scheduledCalls || typeof this.scheduledCalls.delete !== 'function') {
      console.warn('Scheduled calls map not properly initialized, cannot cancel call');
      return false;
    }
    return this.scheduledCalls.delete(id);
  }

  // Cleanup scheduler (for when service is destroyed)
  cleanup() {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
  }

  // Check if VAPI is properly configured
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  // Get configuration status
  getConfigurationStatus(): {
    apiKey: boolean;
    message: string;
  } {
    const hasApiKey = !!this.apiKey;
    let message = '';
    
    if (!hasApiKey) {
      message = 'VAPI API key not configured. Please set VITE_VAPI_PRIVATE_KEY in your .env file and restart the development server';
    } else {
      message = 'VAPI is properly configured';
    }
    
    return {
      apiKey: hasApiKey,
      message
    };
  }

  // Force restart the service (useful for development)
  restart(): void {
    console.log('🔄 Restarting VAPIService...');
    this.cleanup();
    this.apiKey = process.env.NEXT_PUBLIC_VAPI_PRIVATE_KEY || '';
    this.scheduledCalls = new Map<string, ScheduledCall>();
    this.debugEnvironmentVariables();
    this.startScheduler();
    console.log('✅ VAPIService restarted');
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  // Make a single call
  async makeCall(request: VAPICallRequest & { user_id?: string; prompt?: string }): Promise<VAPICallResponse> {
    try {
      if (!this.apiKey) {
        this.reloadEnvironmentVariables();
        if (!this.apiKey) {
          throw new Error('VAPI API key not configured. Please set NEXT_PUBLIC_VAPI_PRIVATE_KEY in your .env file and restart the development server');
        }
      }
      let cleanPhoneNumber = request.customer.number.replace(/\s+/g, '');
      if (!cleanPhoneNumber.startsWith('+')) {
        if (cleanPhoneNumber.length === 10) {
          cleanPhoneNumber = '+1' + cleanPhoneNumber;
        } else if (cleanPhoneNumber.length === 11 && cleanPhoneNumber.startsWith('1')) {
          cleanPhoneNumber = '+' + cleanPhoneNumber;
        } else {
          throw new Error('Phone number must be in E.164 format (e.g., +1234567890) or 10-digit US number');
        }
      }
      if (!request.phoneNumberId || !request.assistantId || !cleanPhoneNumber) {
        throw new Error('Missing required fields: phoneNumberId, assistantId, or customer number');
      }
      const metadata = {
        ...(request.metadata || {}),
        ...(request.user_id ? { user_id: request.user_id } : {})
      };
      const requestPayload: any = {
        phoneNumberId: request.phoneNumberId,
        assistantId: request.assistantId,
        customer: {
          number: cleanPhoneNumber,
          name: request.customer.name || '',
        },
        ...(Object.keys(metadata).length > 0 && { metadata })
      };
      // If a prompt is provided (property details or script), include it
      if (request.prompt) {
        requestPayload.assistant = {
          firstMessage: request.prompt
        };
      }
      // If assistantOverrides is provided, include it
      if (request.assistantOverrides) {
        requestPayload.assistantOverrides = request.assistantOverrides;
      }

      console.log('Request Payload:', JSON.stringify(requestPayload, null, 2));

      const response = await axios.post(
        `${this.baseURL}/call/phone`,
        requestPayload,
        {
          headers: this.getHeaders(),
          timeout: 30000
        }
      );
      return response.data as VAPICallResponse;
    } catch (error) {
      console.error('Error making VAPI call:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:');
        console.error('- Status:', error.response?.status);
        console.error('- Status Text:', error.response?.statusText);
        console.error('- Response Data:', error.response?.data);
        console.error('- Request URL:', error.config?.url);
        console.error('- Request Method:', error.config?.method);
        console.error('- Request Headers:', error.config?.headers);
        console.error('- Request Data:', error.config?.data);
      }
      throw error;
    }
  }

  // Schedule a call using local scheduling system
  async scheduleCall(request: VAPIScheduleCallRequest): Promise<VAPICallResponse> {
    try {
      console.log('Scheduling call using local scheduler:', request);
      
      let scheduledTime = request.scheduledTime;
      
      // Fix timezone mapping
      let timezone = request.timezone;
      if (timezone === 'Asia/Calcutta') {
        timezone = 'Asia/Kolkata';
      }

      if (request.timeOfDay && timezone) {
        // For time-of-day scheduling, calculate the next occurrence
        const today = new Date();
        const [hours, minutes] = request.timeOfDay.split(':').map(Number);
        const nextCall = new Date();
        nextCall.setHours(hours, minutes, 0, 0);
        
        // If the time has passed today, schedule for tomorrow
        if (nextCall <= today) {
          nextCall.setDate(nextCall.getDate() + 1);
        }
        
        scheduledTime = nextCall.toISOString();
      } else if (request.scheduledTime) {
        // Convert local time to UTC
        const localDate = new Date(request.scheduledTime);
        scheduledTime = localDate.toISOString();
      } else {
        throw new Error('No scheduled time or time of day provided');
      }
      
      // Create a unique ID for the scheduled call
      const scheduledCallId = `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store the scheduled call in our local system
      const scheduledCall: ScheduledCall = {
        id: scheduledCallId,
        scheduledTime: scheduledTime,
        request: {
          ...request,
          customer: {
            ...request.customer,
            number: request.customer.number.replace(/\s+/g, '') // Remove spaces
          }
        },
        status: 'pending'
      };
      
      this.scheduledCalls.set(scheduledCallId, scheduledCall);
      
      console.log(`Call scheduled for ${scheduledTime} with ID: ${scheduledCallId}`);
      
      // Return a mock response indicating the call is scheduled
      return {
        id: scheduledCallId,
        status: 'scheduled',
        customer: request.customer,
        assistant: { id: request.assistantId },
        phoneNumber: { id: request.phoneNumberId },
        metadata: {
          scheduledTime: scheduledTime,
          scheduleType: request.timeOfDay ? 'timeOfDay' : 'specificDateTime',
          timezone: timezone
        },
        createdAt: new Date().toISOString()
      } as VAPICallResponse;
      
    } catch (error) {
      console.error('Error scheduling call:', error);
      throw error;
    }
  }

  // Create a campaign using VAPI's native campaign API
  async createCampaign(request: VAPICampaignRequest & { user_id?: string }): Promise<VAPICampaignResponse> {
    try {
      if (!this.apiKey) {
        console.error('❌ API key is empty when creating campaign');
        console.error('Current API key value:', this.apiKey);
        console.error('Environment variable value:', process.env.NEXT_PUBLIC_VAPI_PRIVATE_KEY);
        
        // Try reloading environment variables
        this.reloadEnvironmentVariables();
        
        if (!this.apiKey) {
          throw new Error('VAPI API key not configured. Please set NEXT_PUBLIC_VAPI_PRIVATE_KEY in your .env file and restart the development server');
        }
      }

      console.log('Creating VAPI campaign with request:', request);
      console.log('Using API key ending with:', this.apiKey.slice(-4));
      
      // Validate required fields
      if (!request.name || !request.assistantId || !request.phoneNumberId || !request.leads || request.leads.length === 0) {
        throw new Error('Missing required fields: name, assistantId, phoneNumberId, or leads');
      }

      // Convert leads to VAPI customers format, including user_id in metadata
      const customers: VAPICustomer[] = request.leads.map((lead, index) => {
        if (!lead.name || !lead.phone) {
          throw new Error('Each lead must have name and phone number');
        }
        
        // Clean phone number and ensure it's in E.164 format
        let cleanPhone = lead.phone.replace(/\s+/g, ''); // Remove spaces
        if (!cleanPhone.startsWith('+')) {
          // If it's a 10-digit number, assume US (+1)
          if (cleanPhone.length === 10) {
            cleanPhone = '+1' + cleanPhone;
          } else if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
            cleanPhone = '+' + cleanPhone;
          } else {
            throw new Error('Phone number must be in E.164 format (e.g., +1234567890) or 10-digit US number');
          }
        }
        
        return {
          number: cleanPhone,
          name: lead.name.trim(),
          externalId: `lead_${index + 1}`,
          metadata: request.user_id ? { user_id: request.user_id } : undefined
        };
      });

      // Build schedule plan if scheduling is requested
      let schedulePlan: VAPISchedulePlan | undefined;
      
      if (request.scheduledTime || request.timeOfDay) {
        if (request.timeOfDay) {
          // For time-of-day scheduling, calculate the next occurrence
          const today = new Date();
          const [hours, minutes] = request.timeOfDay.split(':').map(Number);
          const nextCall = new Date();
          nextCall.setHours(hours, minutes, 0, 0);
          
          // If the time has passed today, schedule for tomorrow
          if (nextCall <= today) {
            nextCall.setDate(nextCall.getDate() + 1);
          }
          
          schedulePlan = {
            earliestAt: nextCall.toISOString()
          };
        } else if (request.scheduledTime) {
          // For specific date/time scheduling
          const scheduledDate = new Date(request.scheduledTime);
          schedulePlan = {
            earliestAt: scheduledDate.toISOString()
          };
        }
      }

      // Build campaign request according to VAPI API specification
      const campaignRequest = {
        name: request.name,
        phoneNumberId: request.phoneNumberId,
        assistantId: request.assistantId,
        customers: customers,
        ...(schedulePlan && { schedulePlan }),
        metadata: {
          ...(request.metadata || {}),
          ...(request.property_details ? { property_details: request.property_details } : {})
        },
        ...(request.assistantOverrides && { assistantOverrides: request.assistantOverrides })
      };

      console.log('Campaign request (VAPI format):', JSON.stringify(campaignRequest, null, 2));
      
      const response = await axios.post(
        `${this.baseURL}/campaign`,
        campaignRequest,
        { 
          headers: this.getHeaders(),
          timeout: 60000 // 60 second timeout for campaign creation
        }
      );
      
      console.log('Campaign created successfully:', response.data);
      
      // Transform the response to match our interface
      const responseData = response.data as {
        id: string;
        name: string;
        status: string;
        assistantId: string;
        phoneNumberId: string;
        customers?: Array<{
          name?: string;
          number: string;
          info?: string;
        }>;
        createdAt: string;
        callsCounterScheduled?: number;
        callsCounterQueued?: number;
        callsCounterInProgress?: number;
        callsCounterEnded?: number;
      };
      
      const campaignResponse: VAPICampaignResponse = {
        id: responseData.id,
        name: responseData.name,
        status: responseData.status,
        assistantId: responseData.assistantId,
        phoneNumberId: responseData.phoneNumberId,
        leads: responseData.customers?.map((customer) => ({
          name: customer.name || '',
          phone: customer.number,
          info: '' // VAPI doesn't return info in customer objects
        })) || [],
        prompt: request.prompt,
        createdAt: responseData.createdAt
      };
      
      // Save campaign record to database (commented out - database service not available)
      // try {
      //   await databaseService.createRecord('campaign', {
      //     campaignId: campaignResponse.id,
      //     name: campaignResponse.name,
      //     status: campaignResponse.status,
      //     leadsCount: campaignResponse.leads.length,
      //     callsCompleted: responseData.callsCounterEnded || 0,
      //     callsFailed: 0, // VAPI doesn't provide failed count in response
      //     prompt: campaignResponse.prompt || ''
      //   });
      // } catch (dbError) {
      //   console.error('Error saving campaign record to database:', dbError);
      // }
      
      return campaignResponse;
    } catch (error) {
      console.error('Error creating VAPI campaign:', error);
      
      // Enhanced error logging
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:');
        console.error('- Status:', error.response?.status);
        console.error('- Status Text:', error.response?.statusText);
        console.error('- Response Data:', error.response?.data);
        console.error('- Request URL:', error.config?.url);
        console.error('- Request Method:', error.config?.method);
        console.error('- Request Headers:', error.config?.headers);
        console.error('- Request Data:', error.config?.data);
      }
      
      throw error;
    }
  }

  getCampaignTemplates(): Array<{
    id: string;
    name: string;
    description: string;
    prompt: string;
    category: 'lead-followup' | 'property-showing' | 'general' | 'custom';
    variables: string[];
  }> {
    return [
      {
        id: 'lead-followup',
        name: 'Lead Follow-up',
        description: 'Follow up with leads who have shown interest',
        prompt: `Hi {{customer_name}}, this is {{senderName}} from {{companyName}}. I'm calling about your recent inquiry regarding {{propertyType}} properties. I wanted to check if you're still in the market and if you'd be interested in viewing some properties that match your criteria. We have some great options available in {{location}} that I think would be perfect for you. Would you be available for a quick chat about your requirements?`,
        category: 'lead-followup',
        variables: ['customer_name', 'senderName', 'companyName', 'propertyType', 'location']
      },
      {
        id: 'property-showing',
        name: 'Property Showing Invitation',
        description: 'Invite leads to view specific properties',
        prompt: `Hi {{customer_name}}, this is {{senderName}} from {{companyName}}. I'm calling about the {{propertyType}} property at {{propertyAddress}} that you expressed interest in. We have a showing available on {{showingDate}} at {{showingTime}}. This property features {{propertyFeatures}} and is priced at {{propertyPrice}}. Would you be interested in scheduling a viewing? I can also answer any questions you might have about the property or the neighborhood.`,
        category: 'property-showing',
        variables: ['customer_name', 'senderName', 'companyName', 'propertyType', 'propertyAddress', 'showingDate', 'showingTime', 'propertyFeatures', 'propertyPrice']
      },
      {
        id: 'market-update',
        name: 'Market Update',
        description: 'Share market insights and new listings',
        prompt: `Hi {{customer_name}}, this is {{senderName}} from {{companyName}}. I wanted to reach out with a quick market update for {{location}}. We've seen some interesting activity in your area recently, and I thought you might be interested in knowing about some new {{propertyType}} listings that have come on the market. The current market conditions are {{marketConditions}}, and we're seeing {{marketTrend}}. Would you like me to send you some information about these new opportunities?`,
        category: 'general',
        variables: ['customer_name', 'senderName', 'companyName', 'location', 'propertyType', 'marketConditions', 'marketTrend']
      },
      {
        id: 'callback-request',
        name: 'Callback Request',
        description: 'Request a callback from interested leads',
        prompt: `Hi {{customer_name}}, this is {{senderName}} from {{companyName}}. I'm calling because you left a message requesting a callback about {{inquiryType}}. I wanted to make sure I have all the details right - you were asking about {{specificDetails}}, correct? I'm available to discuss this further at your convenience. What would be the best time to call you back? I'm flexible and can work around your schedule.`,
        category: 'lead-followup',
        variables: ['customer_name', 'senderName', 'companyName', 'inquiryType', 'specificDetails']
      },
      {
        id: 'open-house-invitation',
        name: 'Open House Invitation',
        description: 'Invite leads to open house events',
        prompt: `Hi {{customer_name}}, this is {{senderName}} from {{companyName}}. I'm calling to personally invite you to our open house this {{openHouseDate}} from {{openHouseTime}} at {{propertyAddress}}. This {{propertyType}} property is one of our most popular listings and features {{propertyHighlights}}. We're expecting a good turnout, so I wanted to make sure you had the details. There will be refreshments and I'll be available to answer any questions. Would you be able to make it?`,
        category: 'property-showing',
        variables: ['customer_name', 'senderName', 'companyName', 'openHouseDate', 'openHouseTime', 'propertyAddress', 'propertyType', 'propertyHighlights']
      }
    ];
  }

  processCampaignTemplate(templateId: string, variables: Record<string, string>): string {
    const templates = this.getCampaignTemplates();
    const template = templates.find(t => t.id === templateId);
    if (!template) {
      return '';
    }
    let processedPrompt = template.prompt;
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      processedPrompt = processedPrompt.replace(new RegExp(placeholder, 'g'), value);
    });
    return processedPrompt;
  }

  // Get call status
  async getCallStatus(callId: string): Promise<VAPICallStatusResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/call/${callId}`,
        { headers: this.getHeaders() }
      );
      return response.data as VAPICallStatusResponse;
    } catch (error) {
      console.error('Error getting call status:', error);
      throw error;
    }
  }

  // Get campaign status
  async getCampaignStatus(campaignId: string): Promise<VAPICampaignResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/campaign/${campaignId}`,
        { headers: this.getHeaders() }
      );
      
      const responseData = response.data as {
        id: string;
        name: string;
        status: string;
        assistantId: string;
        phoneNumberId: string;
        customers?: Array<{
          name?: string;
          number: string;
          info?: string;
        }>;
        createdAt: string;
        calls?: Record<string, unknown>; // VAPI returns call details in campaign response
        callsCounterScheduled?: number;
        callsCounterQueued?: number;
        callsCounterInProgress?: number;
        callsCounterEnded?: number;
      };
      
      console.log('Campaign status response:', responseData);
      
      // Transform the response to match our interface
      const campaignResponse: VAPICampaignResponse = {
        id: responseData.id,
        name: responseData.name,
        status: responseData.status,
        assistantId: responseData.assistantId,
        phoneNumberId: responseData.phoneNumberId,
        leads: responseData.customers?.map((customer) => ({
          name: customer.name || '',
          phone: customer.number,
          info: '' // VAPI doesn't return info in customer objects
        })) || [],
        prompt: undefined, // VAPI doesn't return prompt in response
        createdAt: responseData.createdAt
      };
      
      return campaignResponse;
    } catch (error) {
      console.error('Error getting campaign status:', error);
      throw error;
    }
  }

  // Get all calls
  async getCalls(): Promise<VAPICallStatusResponse[]> {
    try {
      // Use the local proxy API route to avoid CORS issues
      const response = await axios.get('/api/vapi/calls');
      return response.data as VAPICallStatusResponse[];
    } catch (error) {
      console.error('Error getting calls:', error);
      throw error;
    }
  }

  // Test VAPI API connection
  async testVAPIConnection(): Promise<{ success: boolean; message: string; details?: unknown }> {
    try {
      console.log('🧪 Testing VAPI API connection...');
      
      // Try to get campaigns to test the connection
      const response = await axios.get(
        `${this.baseURL}/campaign`,
        { headers: this.getHeaders() }
      );
      
      console.log('✅ VAPI API connection successful');
      return {
        success: true,
        message: 'VAPI API connection successful',
        details: response.data
      };
    } catch (error) {
      const axiosError = error as { response?: { data?: unknown; status?: number; statusText?: string } };
      console.error('❌ VAPI API connection failed:', axiosError.response?.data);
      
      return {
        success: false,
        message: `VAPI API connection failed: ${axiosError.response?.status} ${axiosError.response?.statusText || ''}`,
        details: axiosError.response?.data
      };
    }
  }

  // Get all campaigns
  async getCampaigns(): Promise<VAPICampaignResponse[]> {
    try {
      const response = await axios.get(
        `${this.baseURL}/campaign`,
        { headers: this.getHeaders() }
      );
      
      console.log('Raw campaigns response:', response.data);
      
      // Handle different response formats
      let responseData: Array<{
        id: string;
        name: string;
        status: string;
        assistantId: string;
        phoneNumberId: string;
        customers?: Array<{
          name?: string;
          number: string;
          info?: string;
        }>;
        createdAt: string;
        callsCounterScheduled?: number;
        callsCounterQueued?: number;
        callsCounterInProgress?: number;
        callsCounterEnded?: number;
      }> = [];
      
      if (Array.isArray(response.data)) {
        responseData = response.data;
      } else if (response.data && typeof response.data === 'object' && 'results' in response.data) {
        // Handle VAPI response format with results array
        responseData = (response.data.results as typeof responseData) || [];
        console.log('Found campaigns in results array:', responseData.length);
      } else if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        // Handle paginated response
        responseData = (response.data.data as typeof responseData) || [];
      } else {
        console.warn('Unexpected campaigns response format:', response.data);
        responseData = [];
      }
      
      // Transform the response to match our interface
      const campaigns: VAPICampaignResponse[] = responseData.map((campaign) => {
        // Calculate total leads from call counters if customers not available
        const totalLeads = campaign.customers?.length || 
          (campaign.callsCounterScheduled || 0) + 
          (campaign.callsCounterQueued || 0) + 
          (campaign.callsCounterInProgress || 0) + 
          (campaign.callsCounterEnded || 0);

        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          assistantId: campaign.assistantId,
          phoneNumberId: campaign.phoneNumberId,
          leads: campaign.customers?.map((customer) => ({
            name: customer.name || '',
            phone: customer.number,
            info: '' // VAPI doesn't return info in customer objects
          })) || Array(totalLeads).fill(null).map((_, index) => ({
            name: `Lead ${index + 1}`,
            phone: 'N/A',
            info: ''
          })),
          prompt: undefined, // VAPI doesn't return prompt in response
          createdAt: campaign.createdAt
        };
      });
      
      console.log('Processed campaigns:', campaigns);
      return campaigns;
    } catch (error) {
      console.error('Error getting campaigns:', error);
      throw error;
    }
  }

  // Get detailed campaign information including call details
  async getCampaignDetails(campaignId: string): Promise<{
    campaign: any;
    callDetails: Array<any>;
  }> {
    try {
      // Fetch campaign details
      const response = await axios.get(`${this.baseURL}/campaign/${campaignId}`, {
        headers: this.getHeaders(),
      });
      const campaign = response.data;
      const callIds = campaign.calls ? Object.keys(campaign.calls) : [];
      // Fetch each call's details in parallel
      const callDetails = await Promise.all(
        callIds.map(async (callId) => {
          try {
            const callResp = await axios.get(`${this.baseURL}/call/${callId}`, {
              headers: this.getHeaders(),
            });
            console.log('Fetched call details for', callId, callResp.data);
            return callResp.data;
          } catch (err) {
            if (axios.isAxiosError(err)) {
              console.error('Error fetching call details for', callId, {
                message: err.message,
                code: err.code,
                config: err.config,
                response: err.response,
                data: err.response?.data,
                toJSON: err.toJSON(),
              });
            } else {
              console.error('Unknown error fetching call details for', callId, err);
            }
            return null;
          }
        })
      );
      // Filter out failed/null call details
      const successfulCallDetails = callDetails.filter(Boolean);
      if (successfulCallDetails.length === 0 && callIds.length > 0) {
        throw new Error('All call detail requests failed. Check your network, API key, or CORS configuration.');
      }
      // Map to UI-friendly fields
      const mappedCallDetails = successfulCallDetails.map((call: any) => {
        // Calculate duration if not present
        let duration = call.duration;
        if (!duration && call.createdAt && call.updatedAt) {
          const ms = new Date(call.updatedAt).getTime() - new Date(call.createdAt).getTime();
          if (!isNaN(ms) && ms > 0) {
            const totalSeconds = Math.floor(ms / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
          } else {
            duration = '-';
          }
        }
        return {
          callId: call.id,
          customerName: call.customer?.name || '-',
          phoneNumber: call.customer?.number || '-',
          status: call.status || '-',
          duration: duration || '-',
          createdAt: call.createdAt,
          endedReason: call.endedReason || '-',
        };
      });
      return { campaign, callDetails: mappedCallDetails };
    } catch (error) {
      console.error('Error in getCampaignDetails:', error);
      throw error;
    }
  }

  // Pause a campaign
  async pauseCampaign(campaignId: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.apiKey) {
        throw new Error('VAPI API key not configured');
      }

      console.log(`Pausing campaign ${campaignId}`);
      
      const response = await axios.patch(
        `${this.baseURL}/campaign/${campaignId}`,
        { status: 'paused' },
        { headers: this.getHeaders() }
      );
      
      console.log('Campaign paused successfully:', response.data);
      
      return {
        success: true,
        message: 'Campaign paused successfully'
      };
    } catch (error) {
      console.error('Error pausing campaign:', error);
      return {
        success: false,
        message: `Failed to pause campaign: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async stopCampaign(campaignId: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.apiKey) {
        throw new Error('VAPI API key not configured');
      }
      const response = await axios.patch(
        `${this.baseURL}/campaign/${campaignId}`,
        { status: 'completed' },
        { headers: this.getHeaders() }
      );
      return {
        success: true,
        message: 'Campaign stopped successfully'
      };
    } catch (error) {
      console.error('Error stopping campaign:', error);
      return {
        success: false,
        message: `Failed to stop campaign: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async deleteCampaign(campaignId: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.apiKey) {
        throw new Error('VAPI API key not configured');
      }
      const response = await axios.delete(
        `${this.baseURL}/campaign/${campaignId}`,
        { headers: this.getHeaders() }
      );
      return {
        success: true,
        message: 'Campaign deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting campaign:', error);
      return {
        success: false,
        message: `Failed to delete campaign: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

const vapiService = new VAPIService();
export { vapiService };
export default vapiService;