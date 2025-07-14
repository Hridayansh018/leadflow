export interface ReceivedEmail {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  read: boolean;
  starred: boolean;
  archived: boolean;
}

class ReceivedEmailService {
  // TODO: Replace with real Gmail API integration
  private mockReceivedEmails: ReceivedEmail[] = [];

  async getReceivedEmails(filters?: {
    search?: string;
    read?: boolean;
    starred?: boolean;
    archived?: boolean;
  }): Promise<{
    emails: ReceivedEmail[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      let filteredEmails = [...this.mockReceivedEmails];

      // Apply filters
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredEmails = filteredEmails.filter(email =>
          email.subject.toLowerCase().includes(searchTerm) ||
          email.from.toLowerCase().includes(searchTerm) ||
          email.body.toLowerCase().includes(searchTerm)
        );
      }

      if (filters?.read !== undefined) {
        filteredEmails = filteredEmails.filter(email => email.read === filters.read);
      }

      if (filters?.starred !== undefined) {
        filteredEmails = filteredEmails.filter(email => email.starred === filters.starred);
      }

      if (filters?.archived !== undefined) {
        filteredEmails = filteredEmails.filter(email => email.archived === filters.archived);
      }

      // Sort by timestamp (newest first)
      filteredEmails.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return {
        emails: filteredEmails,
        pagination: {
          page: 1,
          limit: filteredEmails.length,
          total: filteredEmails.length,
          pages: 1
        }
      };
    } catch (error) {
      console.error('Error fetching received emails:', error);
      throw error;
    }
  }

  async markAsRead(emailId: string): Promise<boolean> {
    try {
      const email = this.mockReceivedEmails.find(e => e.id === emailId);
      if (email) {
        email.read = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking email as read:', error);
      return false;
    }
  }

  async toggleStar(emailId: string): Promise<boolean> {
    try {
      const email = this.mockReceivedEmails.find(e => e.id === emailId);
      if (email) {
        email.starred = !email.starred;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error toggling email star:', error);
      return false;
    }
  }

  async archiveEmail(emailId: string): Promise<boolean> {
    try {
      const email = this.mockReceivedEmails.find(e => e.id === emailId);
      if (email) {
        email.archived = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error archiving email:', error);
      return false;
    }
  }

  async deleteEmail(emailId: string): Promise<boolean> {
    try {
      const index = this.mockReceivedEmails.findIndex(e => e.id === emailId);
      if (index !== -1) {
        this.mockReceivedEmails.splice(index, 1);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting email:', error);
      return false;
    }
  }
}

export default new ReceivedEmailService(); 