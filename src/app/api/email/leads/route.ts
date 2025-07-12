import { NextRequest, NextResponse } from 'next/server';
import emailService, { EmailContent } from '../../../../services/emailService';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/outreach';
const DB_NAME = 'outreach';

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
      const client = new MongoClient(MONGODB_URI);
      await client.connect();
      const db = client.db(DB_NAME);
      const storage = db.collection('storage');
      const now = new Date();
      await storage.insertMany(leads.map((to: Record<string, unknown>) => ({
        userId: userId ? new ObjectId(userId) : null,
        type: 'email',
        from: fromName || process.env.GMAIL_EMAIL,
        to: to.email,
        subject: content.subject,
        body: content.htmlBody,
        timestamp: now,
        typeDetail: 'sent',
        read: true,
        starred: false,
        archived: false
      })));
      await client.close();
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