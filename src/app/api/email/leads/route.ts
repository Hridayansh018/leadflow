import { NextRequest, NextResponse } from 'next/server';
import emailService, { EmailContent } from '../../../../services/emailService';

// MongoDB code removed. If this file is now unused, consider deleting it.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadIds, content, fromName, userId, leads } = body;

    // Validate required fields
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid leadIds array' },
        { status: 400 }
      );
    }

    if (!content || !content.subject || !content.htmlBody) {
      return NextResponse.json(
        { error: 'Missing required content fields: subject, htmlBody' },
        { status: 400 }
      );
    }

    const emailContent: EmailContent = {
      subject: content.subject,
      htmlBody: content.htmlBody,
      textBody: content.textBody
    };

    const result = await emailService.sendEmailToLeads(leadIds, emailContent, fromName);

    if (result.success && Array.isArray(leads)) {
      // Store each sent email to leads in outreach.storage
      // The original code had MongoDB logic here, which is removed.
      // If this file is now unused, consider deleting it.
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    console.error('Error sending emails to leads:', error);
    return NextResponse.json(
      { error: 'Failed to send emails to leads', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 