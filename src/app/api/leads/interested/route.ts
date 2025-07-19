import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  // Validate required env vars
  const missingVars: string[] = [];
  if (!process.env.TWILIO_ACCOUNT_SID) missingVars.push('TWILIO_ACCOUNT_SID');
  if (!process.env.TWILIO_AUTH_TOKEN) missingVars.push('TWILIO_AUTH_TOKEN');
  if (!process.env.TWILIO_PHONE_NUMBER) missingVars.push('TWILIO_PHONE_NUMBER');
  if (!process.env.ADMIN_EMAIL) missingVars.push('ADMIN_EMAIL');
  if (!process.env.GMAIL_EMAIL) missingVars.push('GMAIL_EMAIL');
  if (!process.env.GMAIL_APP_PASSWORD) missingVars.push('GMAIL_APP_PASSWORD');
  if (missingVars.length > 0) {
    console.error('Missing environment variables:', missingVars.join(', '));
    return NextResponse.json({ success: false, error: 'Server misconfiguration. Please contact support.' }, { status: 500 });
  }

  const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  const fromNumber = process.env.TWILIO_PHONE_NUMBER!;
  const adminEmail = process.env.ADMIN_EMAIL!;
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_EMAIL,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  try {
    const { lead, propertyDetails } = await req.json();
    if (!lead || !lead.phone || !lead.name || !propertyDetails) {
      return NextResponse.json({ success: false, error: 'Missing lead or property details.' }, { status: 400 });
    }

    // 1. Send SMS to lead with property details
    try {
      await twilioClient.messages.create({
        body: `Thank you for your time, ${lead.name}! Here are the property details you discussed:\n${propertyDetails}`,
        from: fromNumber,
        to: lead.phone
      });
    } catch (smsError) {
      console.error('Error sending SMS to lead:', smsError);
      return NextResponse.json({ success: false, error: 'Failed to send SMS to lead.' }, { status: 502 });
    }

    // 2. Send email to admin
    try {
      await transporter.sendMail({
        from: process.env.GMAIL_EMAIL,
        to: adminEmail,
        subject: 'New Interested Lead Alert',
        text: `Lead ${lead.name} (${lead.phone}) is interested.\n\nProperty Details:\n${propertyDetails}\n\nLead Info:\n${JSON.stringify(lead, null, 2)}`
      });
    } catch (emailError) {
      console.error('Error sending email to admin:', emailError);
      // Don't fail the whole request if email fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error in /api/leads/interested:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong. Please try again later.' }, { status: 500 });
  }
} 