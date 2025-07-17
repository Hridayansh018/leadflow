import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../services/supabaseAdmin';
import receivedEmailService from '../../../../services/receivedEmailService';

// GET /api/emails/received - Fetch received emails
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const read = searchParams.get('read');
    const starred = searchParams.get('starred');
    const archived = searchParams.get('archived');
    
    const filters: any = {};
    if (search) filters.search = search;
    if (read) filters.read = read === 'true';
    if (starred) filters.starred = starred === 'true';
    if (archived) filters.archived = archived === 'true';
    
    const result = await receivedEmailService.getReceivedEmails(filters);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching received emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch received emails' },
      { status: 500 }
    );
  }
}

// POST /api/emails/received - Store received email (for webhook)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from, to, subject, body: emailBody, timestamp, userId } = body;
    
    // Validate required fields
    if (!from || !to || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields: from, to, subject, body' },
        { status: 400 }
      );
    }
    
    const emailRecord = {
      user_id: userId || null,
      from,
      to,
      subject,
      body: emailBody,
      status: 'received',
      created_at: timestamp || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabaseAdmin
      .from('emails')
      .insert(emailRecord)
      .select()
      .single();
    
    if (error) {
      console.error('Error storing received email:', error);
      return NextResponse.json(
        { error: 'Failed to store received email' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Received email stored successfully',
      emailId: data.id
    }, { status: 201 });
  } catch (error) {
    console.error('Error storing received email:', error);
    return NextResponse.json(
      { error: 'Failed to store received email' },
      { status: 500 }
    );
  }
} 