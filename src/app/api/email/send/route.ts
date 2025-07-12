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
  let recipient: EmailRecipient | undefined;
  let emailContent: EmailContent | undefined;
  let fromName: string | undefined;
  let userId: string | undefined;
  
  try {
    const body = await request.json();
    const { to, content, fromName: bodyFromName, userId: bodyUserId } = body;
    fromName = bodyFromName;
    userId = bodyUserId;

    // Validate required fields
    if (!to || !content || !to.name || !to.email || !content.subject || !content.htmlBody) {
      return NextResponse.json(
        { error: 'Missing required fields: to (name, email), content (subject, htmlBody)' },
        { status: 400 }
      );
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

    recipient = {
      name: to.name,
      email: to.email
    };

    emailContent = {
      subject: content.subject,
      htmlBody: content.htmlBody,
      textBody: content.textBody
    };

    // Send email
    const defaultFromName = process.env.EMAIL_FROM_NAME || 'AI Call Pro CRM';
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

    // Store sent email in outreach.storage
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const storage = db.collection('storage');
    await storage.insertOne({
      userId: userId ? new ObjectId(userId) : null,
      type: 'email',
      from: fromName || email,
      to: recipient.email,
      subject: emailContent.subject,
      body: emailContent.htmlBody,
      timestamp: new Date(),
      typeDetail: 'sent',
      status: 'delivered',
      read: true,
      starred: false,
      archived: false,
      recipientName: recipient.name
    });
    await client.close();

    return NextResponse.json({
      success: true,
      message: `Email sent successfully to ${recipient.name} (${recipient.email})`,
      emailId: 'email_sent_' + Date.now()
    });
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Store failed email record
    if (recipient && emailContent) {
      try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db(DB_NAME);
        const storage = db.collection('storage');
        await storage.insertOne({
          userId: userId ? new ObjectId(userId) : null,
          type: 'email',
          from: fromName || process.env.GMAIL_EMAIL,
          to: recipient.email,
          subject: emailContent.subject,
          body: emailContent.htmlBody,
          timestamp: new Date(),
          typeDetail: 'sent',
          status: 'failed',
          read: true,
          starred: false,
          archived: false,
          recipientName: recipient.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        await client.close();
      } catch (dbError) {
        console.error('Error storing failed email record:', dbError);
      }
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to send email', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
} 