import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST() {
  try {
    // Check email configuration
    const email = process.env.GMAIL_EMAIL;
    const password = process.env.GMAIL_APP_PASSWORD;

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Email service not configured. Please check Gmail credentials.'
      }, { status: 500 });
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

    // Send test email
    const testRecipient = {
      name: 'Test User',
      email: email
    };

    const testContent = {
      subject: 'Test Email from AI Call Pro CRM',
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Test Email</h2>
          <p>This is a test email from your AI Call Pro CRM system.</p>
          <p>If you received this email, your email configuration is working correctly!</p>
          <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Configuration:</strong> Gmail SMTP</p>
          </div>
          <p>Best regards,<br>
          <strong>AI Call Pro CRM Team</strong></p>
        </div>
      `
    };

    const defaultFromName = process.env.EMAIL_FROM_NAME || 'AI Call Pro CRM';
    const from = `${defaultFromName} <${email}>`;

    const mailOptions = {
      from,
      to: `${testRecipient.name} <${testRecipient.email}>`,
      subject: testContent.subject,
      text: stripHtml(testContent.htmlBody),
      html: testContent.htmlBody,
      replyTo: process.env.EMAIL_REPLY_TO || email
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully! Email configuration is working correctly.',
      email: email
    });
  } catch (error) {
    console.error('Error testing email configuration:', error);
    return NextResponse.json({
      success: false,
      message: `Failed to test email configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const email = process.env.GMAIL_EMAIL;
    const password = process.env.GMAIL_APP_PASSWORD;

    if (!email || !password) {
      return NextResponse.json({
        configured: false,
        message: 'Gmail credentials not configured. Set GMAIL_EMAIL and GMAIL_APP_PASSWORD environment variables.'
      });
    }

    return NextResponse.json({
      configured: true,
      email,
      message: 'Email service configured successfully'
    });
  } catch (error) {
    console.error('Error getting email configuration status:', error);
    return NextResponse.json({
      configured: false,
      message: 'Failed to check email configuration'
    }, { status: 500 });
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
} 