import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/outreach';
const DB_NAME = 'outreach';

interface EmailRecipient {
  name: string;
  email: string;
}

interface EmailContent {
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipients, content, fromName, userId } = body;

    // Validate required fields
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid recipients array' },
        { status: 400 }
      );
    }

    if (!content || !content.subject || !content.htmlBody) {
      return NextResponse.json(
        { error: 'Missing required content fields: subject, htmlBody' },
        { status: 400 }
      );
    }

    // Validate each recipient
    for (const recipient of recipients) {
      if (!recipient.name || !recipient.email) {
        return NextResponse.json(
          { error: 'Each recipient must have name and email fields' },
          { status: 400 }
        );
      }
    }

    // Check email configuration
    const email = process.env.GMAIL_EMAIL;
    const password = process.env.GMAIL_APP_PASSWORD;

    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Email service not configured. Please check Gmail credentials.' 
        },
        { status: 500 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: email,
        pass: password
      },
      secure: true,
      port: 465,
      tls: {
        rejectUnauthorized: false
      }
    });

    const emailRecipients: EmailRecipient[] = recipients.map((r: { name: string; email: string }) => ({
      name: r.name,
      email: r.email
    }));

    const emailContent: EmailContent = {
      subject: content.subject,
      htmlBody: content.htmlBody,
      textBody: content.textBody
    };

    // Send bulk emails and track results
    const failedRecipients: string[] = [];
    let successCount = 0;
    const defaultFromName = process.env.EMAIL_FROM_NAME || 'AI Call Pro CRM';
    const emailRecords: Array<{
      userId: ObjectId | null;
      type: string;
      from: string;
      to: string;
      subject: string;
      body: string;
      timestamp: Date;
      typeDetail: string;
      status: string;
      read: boolean;
      starred: boolean;
      archived: boolean;
      recipientName: string;
      error?: string;
    }> = [];
    const now = new Date();

    for (const recipient of emailRecipients) {
      try {
        const from = fromName ? `${fromName} <${email}>` : `${defaultFromName} <${email}>`;

        const mailOptions = {
          from,
          to: `${recipient.name} <${recipient.email}>`,
          subject: emailContent.subject,
          text: emailContent.textBody || stripHtml(emailContent.htmlBody),
          html: emailContent.htmlBody,
          replyTo: process.env.EMAIL_REPLY_TO || email
        };

        await transporter.sendMail(mailOptions);
        successCount++;
        
        // Add successful email record
        emailRecords.push({
          userId: userId ? new ObjectId(userId) : null,
          type: 'email',
          from: fromName || email,
          to: recipient.email,
          subject: emailContent.subject,
          body: emailContent.htmlBody,
          timestamp: now,
          typeDetail: 'sent',
          status: 'delivered',
          read: true,
          starred: false,
          archived: false,
          recipientName: recipient.name
        });
      } catch (error) {
        failedRecipients.push(`${recipient.name} (${recipient.email})`);
        
        // Add failed email record
        emailRecords.push({
          userId: userId ? new ObjectId(userId) : null,
          type: 'email',
          from: fromName || email,
          to: recipient.email,
          subject: emailContent.subject,
          body: emailContent.htmlBody,
          timestamp: now,
          typeDetail: 'sent',
          status: 'failed',
          read: true,
          starred: false,
          archived: false,
          recipientName: recipient.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const totalRecipients = emailRecipients.length;
    const successRate = totalRecipients > 0 ? (successCount / totalRecipients) * 100 : 0;

    // Store all email records in database
    if (emailRecords.length > 0) {
      const client = new MongoClient(MONGODB_URI);
      await client.connect();
      const db = client.db(DB_NAME);
      const storage = db.collection('storage');
      await storage.insertMany(emailRecords);
      await client.close();
    }

    return NextResponse.json({
      success: successCount > 0,
      message: `Bulk email completed: ${successCount}/${totalRecipients} emails sent successfully (${successRate.toFixed(1)}% success rate)`,
      failedRecipients: failedRecipients.length > 0 ? failedRecipients : undefined,
      totalSent: totalRecipients,
      successfulSent: successCount,
      failedSent: failedRecipients.length
    });
  } catch (error) {
    console.error('Error sending bulk emails:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to send bulk emails', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
} 