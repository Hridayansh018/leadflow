import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../services/supabaseAdmin';

// GET /api/emails - Get all stored emails
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // sent, received, etc.
    const userId = searchParams.get('userId');
    const search = searchParams.get('search');
    
    const offset = (page - 1) * limit;
    
    // Build query
    let query = supabaseAdmin
      .from('emails')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (search) {
      query = query.or(`subject.ilike.%${search}%,from.ilike.%${search}%,to.ilike.%${search}%`);
    }
    
    // Add pagination and ordering
    query = query.range(offset, offset + limit - 1);
    query = query.order('created_at', { ascending: false });
    
    const { data: emails, error, count } = await query;
    
    if (error) {
      console.error('Error fetching emails:', error);
      return NextResponse.json(
        { error: 'Failed to fetch emails' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      emails: emails || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}

// POST /api/emails - Create a new email record (for manual entry)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from, to, subject, body: emailBody, status = 'sent', user_id } = body;
    
    // Validate required fields
    if (!from || !to || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields: from, to, subject, body' },
        { status: 400 }
      );
    }
    
    const emailRecord = {
      user_id: user_id || null,
      from,
      to,
      subject,
      body: emailBody,
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabaseAdmin
      .from('emails')
      .insert(emailRecord)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating email record:', error);
      return NextResponse.json(
        { error: 'Failed to create email record' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Email record created successfully',
      emailId: data.id
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating email record:', error);
    return NextResponse.json(
      { error: 'Failed to create email record' },
      { status: 500 }
    );
  }
} 