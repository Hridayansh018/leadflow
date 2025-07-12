export interface EmailRecipient {
  name: string;
  email: string;
}

export interface EmailContent {
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
  failedRecipients?: string[];
}

export interface BulkEmailRequest {
  recipients: EmailRecipient[];
  content: EmailContent;
  fromName?: string;
}

class EmailClientService {
  // Send email to a single recipient
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

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      return result;
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send email'
      };
    }
  }

  // Send bulk emails to multiple recipients
  async sendBulkEmails(request: BulkEmailRequest): Promise<EmailResponse> {
    try {
      const response = await fetch('/api/email/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send bulk emails');
      }

      return result;
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send bulk emails'
      };
    }
  }

  // Send emails to leads from database
  async sendEmailToLeads(leadIds: string[], content: EmailContent, fromName?: string): Promise<EmailResponse> {
    try {
      const response = await fetch('/api/email/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadIds,
          content,
          fromName
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send emails to leads');
      }

      return result;
    } catch (error) {
      console.error('Error sending emails to leads:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send emails to leads'
      };
    }
  }

  // Test email configuration
  async testEmailConfiguration(): Promise<EmailResponse> {
    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to test email configuration');
      }

      return result;
    } catch (error) {
      console.error('Error testing email configuration:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to test email configuration'
      };
    }
  }

  // Get email configuration status
  async getEmailConfigurationStatus(): Promise<{ configured: boolean; email?: string; message: string }> {
    try {
      const response = await fetch('/api/email/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to get email configuration status');
      }

      return result;
    } catch (error) {
      console.error('Error getting email configuration status:', error);
      return {
        configured: false,
        message: error instanceof Error ? error.message : 'Failed to get email configuration status'
      };
    }
  }
}

const emailClientService = new EmailClientService();
export default emailClientService; 