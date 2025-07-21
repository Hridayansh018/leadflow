// Client-safe email service that uses API calls instead of direct nodemailer
// Nodemailer will only be used on the server side via API routes

export interface EmailRecipient {
  name: string;
  email: string;
}

export interface EmailContent {
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export interface BulkEmailRequest {
  recipients: EmailRecipient[];
  content: EmailContent;
  fromName?: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
  failedRecipients?: string[];
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  category: 'lead-followup' | 'campaign' | 'general' | 'custom';
}

class EmailService {
  private defaultTemplates: EmailTemplate[] = [];

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates() {
    this.defaultTemplates = [
      {
        id: 'lead-followup',
        name: 'Lead Follow-up',
        subject: 'Thank you for your interest in our properties',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Thank you for your interest!</h2>
            <p>Dear {{customer_name}},</p>
            <p>Thank you for your interest in our real estate properties. We've received your inquiry and our team will be in touch with you shortly.</p>
            <p>In the meantime, feel free to browse our latest listings or contact us directly if you have any urgent questions.</p>
            <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h3 style="margin-top: 0;">What happens next?</h3>
              <ul>
                <li>Our team will review your requirements</li>
                <li>We'll match you with suitable properties</li>
                <li>You'll receive personalized recommendations</li>
                <li>We'll schedule a consultation call</li>
              </ul>
            </div>
            <p>Best regards,<br>
            <strong>{{senderName}}</strong><br>
            LeadFlow</p>
          </div>
        `,
        textBody: `Thank you for your interest in our properties. We'll be in touch shortly.`,
        category: 'lead-followup'
      },
      {
        id: 'property-showing',
        name: 'Property Showing Invitation',
        subject: 'Property Showing Invitation - {{propertyName}}',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Property Showing Invitation</h2>
            <p>Dear {{customer_name}},</p>
            <p>We're excited to invite you to view {{propertyName}}!</p>
            <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h3 style="margin-top: 0;">Property Details</h3>
              <p><strong>Address:</strong> {{propertyAddress}}</p>
              <p><strong>Price:</strong> {{propertyPrice}}</p>
              <p><strong>Showing Date:</strong> {{showingDate}}</p>
              <p><strong>Showing Time:</strong> {{showingTime}}</p>
            </div>
            <p>Please confirm your attendance by replying to this email or calling us at {{phoneNumber}}.</p>
            <p>Best regards,<br>
            <strong>{{senderName}}</strong><br>
            LeadFlow</p>
          </div>
        `,
        textBody: `You're invited to view {{propertyName}}. Please confirm your attendance.`,
        category: 'campaign'
      },
      {
        id: 'campaign-update',
        name: 'Campaign Update',
        subject: 'Your Campaign Status Update',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Campaign Update</h2>
            <p>Dear {{customer_name}},</p>
            <p>Here's an update on your campaign: <strong>{{campaignName}}</strong></p>
            <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h3 style="margin-top: 0;">Campaign Statistics</h3>
              <p><strong>Total Calls:</strong> {{totalCalls}}</p>
              <p><strong>Answered Calls:</strong> {{answeredCalls}}</p>
              <p><strong>Success Rate:</strong> {{successRate}}%</p>
              <p><strong>Leads Generated:</strong> {{leadsGenerated}}</p>
            </div>
            <p>You can view detailed analytics in your dashboard.</p>
            <p>Best regards,<br>
            <strong>{{senderName}}</strong><br>
            LeadFlow</p>
          </div>
        `,
        textBody: `Your campaign {{campaignName}} has been updated. Check your dashboard for details.`,
        category: 'campaign'
      },
      {
        id: 'welcome',
        name: 'Welcome Email',
        subject: 'Welcome to LeadFlow',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Welcome to LeadFlow!</h2>
            <p>Dear {{customer_name}},</p>
            <p>Welcome to LeadFlow - your complete solution for real estate lead management and AI-powered calling.</p>
            <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h3 style="margin-top: 0;">Getting Started</h3>
              <ul>
                <li>Add your leads manually</li>
                <li>Create AI calling campaigns</li>
                <li>Track your analytics</li>
                <li>Manage your email communications</li>
              </ul>
            </div>
            <p>If you have any questions, our support team is here to help!</p>
            <p>Best regards,<br>
            <strong>{{senderName}}</strong><br>
            LeadFlow</p>
          </div>
        `,
        textBody: `Welcome to LeadFlow! We're excited to help you grow your real estate business.`,
        category: 'general'
      }
    ];
  }

  // Send email to a single recipient via API
  async sendEmail(to: EmailRecipient, content: EmailContent, fromName?: string): Promise<EmailResponse> {
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          content,
          fromName
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        message: `Failed to send email to ${to.name} (${to.email}): ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Send bulk emails to multiple recipients via API
  async sendBulkEmails(request: BulkEmailRequest): Promise<EmailResponse> {
    try {
      const response = await fetch('/api/email/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      return {
        success: false,
        message: `Failed to send bulk emails: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Send templated email
  async sendTemplatedEmail(
    to: EmailRecipient, 
    templateId: string, 
    variables: Record<string, string> = {},
    fromName?: string
  ): Promise<EmailResponse> {
    const template = this.getTemplate(templateId);
    if (!template) {
      return {
        success: false,
        message: `Template '${templateId}' not found`
      };
    }

    const processedContent = this.processTemplate(template, variables);
    return this.sendEmail(to, processedContent, fromName);
  }

  // Send bulk templated emails
  async sendBulkTemplatedEmails(
    recipients: EmailRecipient[],
    templateId: string,
    variables: Record<string, string> = {},
    fromName?: string
  ): Promise<EmailResponse> {
    const template = this.getTemplate(templateId);
    if (!template) {
      return {
        success: false,
        message: `Template '${templateId}' not found`
      };
    }

    const processedContent = this.processTemplate(template, variables);
    return this.sendBulkEmails({
      recipients,
      content: processedContent,
      fromName
    });
  }

  // Template management methods
  getTemplate(templateId: string): EmailTemplate | undefined {
    return this.defaultTemplates.find(template => template.id === templateId);
  }

  getAllTemplates(): EmailTemplate[] {
    return [...this.defaultTemplates];
  }

  getTemplatesByCategory(category: EmailTemplate['category']): EmailTemplate[] {
    return this.defaultTemplates.filter(template => template.category === category);
  }

  private processTemplate(template: EmailTemplate, variables: Record<string, string>): EmailContent {
    let processedSubject = template.subject;
    let processedHtmlBody = template.htmlBody;
    let processedTextBody = template.textBody || '';

    // Replace variables in template
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), value);
      processedHtmlBody = processedHtmlBody.replace(new RegExp(placeholder, 'g'), value);
      processedTextBody = processedTextBody.replace(new RegExp(placeholder, 'g'), value);
    });

    return {
      subject: processedSubject,
      htmlBody: processedHtmlBody,
      textBody: processedTextBody
    };
  }

  // Send emails to leads by their IDs
  async sendEmailToLeads(leadIds: string[], content: EmailContent, fromName?: string): Promise<EmailResponse> {
    try {
      // Get leads from localStorage (client-side)
      const leads = this.getLeadsFromStorage();
      const recipients: EmailRecipient[] = [];

      for (const leadId of leadIds) {
        const lead = leads.find(l => l.id === leadId);
        if (lead && lead.email) {
          recipients.push({
            name: lead.name || 'Lead',
            email: lead.email
          });
        }
      }

      if (recipients.length === 0) {
        return {
          success: false,
          message: 'No valid email addresses found for the selected leads'
        };
      }

      return this.sendBulkEmails({
        recipients,
        content,
        fromName
      });
    } catch (error) {
      console.error('Error sending emails to leads:', error);
      return {
        success: false,
        message: `Failed to send emails to leads: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private getLeadsFromStorage(): Array<{ id: string; name?: string; email?: string }> {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem('leads');
      return stored ? JSON.parse(stored) : [];
    } catch {
      console.error('Error reading leads from storage');
      return [];
    }
  }

  // Check if email is configured
  async isEmailConfigured(): Promise<boolean> {
    try {
      const response = await fetch('/api/email/test');
      if (!response.ok) return false;
      const result = await response.json();
      return result.success;
    } catch {
      return false;
    }
  }

  // Get configuration status
  async getConfigurationStatus(): Promise<{ configured: boolean; email?: string; message: string }> {
    try {
      const response = await fetch('/api/email/test');
      if (!response.ok) {
        return {
          configured: false,
          message: 'Email service not available'
        };
      }
      
      const result = await response.json();
      return {
        configured: result.success,
        email: result.email,
        message: result.message
      };
    } catch {
      return {
        configured: false,
        message: 'Failed to check email configuration'
      };
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  // Test email configuration
  async testEmailConfiguration(): Promise<EmailResponse> {
    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error testing email configuration:', error);
      return {
        success: false,
        message: `Failed to test email configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService; 