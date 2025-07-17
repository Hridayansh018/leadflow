import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabaseAdmin } from '../../../../services/supabaseAdmin';

interface EmailRecipient {
  name: string;
  email: string;
}

interface EmailContent {
  subject: string;
  htmlBody: string;
  textBody?: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export async function POST(request: NextRequest) {
  let emailRecipients: EmailRecipient[] = [];
  let emailContent: EmailContent | undefined;
  let fromName: string | undefined;
  let userId: string | undefined;
  
  try {
    const body = await request.json();
    const { recipients, content, fromName: bodyFromName, userId: bodyUserId } = body;
    emailRecipients = recipients;
    emailContent = content;
    fromName = bodyFromName;
    userId = bodyUserId;

    // Validate required fields
    if (!emailRecipients || !Array.isArray(emailRecipients) || emailRecipients.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid recipients array' },
        { status: 400 }
      );
    }

    if (!emailContent || !emailContent.subject || !emailContent.htmlBody) {
      return NextResponse.json(
        { error: 'Missing required content fields: subject, htmlBody' },
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

    const defaultFromName = process.env.EMAIL_FROM_NAME || 'LeadFlow CRM';
    const from = fromName ? `${fromName} <${email}>` : `${defaultFromName} <${email}>`;

    let successCount = 0;
    const failedRecipients: string[] = [];
    const emailRecords: any[] = [];
    const now = new Date().toISOString();

    // Send emails to each recipient
    for (const recipient of emailRecipients) {
      try {
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
          user_id: userId || null,
          from: fromName || email,
          to: recipient.email,
          subject: emailContent.subject,
          body: emailContent.htmlBody,
          status: 'delivered',
          created_at: now,
          updated_at: now
        });
      } catch (error) {
        failedRecipients.push(`${recipient.name} (${recipient.email})`);
        
        // Add failed email record
        emailRecords.push({
          user_id: userId || null,
          from: fromName || email,
          to: recipient.email,
          subject: emailContent.subject,
          body: emailContent.htmlBody,
          status: 'failed',
          created_at: now,
          updated_at: now
        });
      }
    }

    const totalRecipients = emailRecipients.length;
    const successRate = totalRecipients > 0 ? (successCount / totalRecipients) * 100 : 0;

    // Store all email records in Supabase
    if (emailRecords.length > 0) {
      const { error: dbError } = await supabaseAdmin
        .from('emails')
        .insert(emailRecords);

      if (dbError) {
        console.error('Error storing email records:', dbError);
      }
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