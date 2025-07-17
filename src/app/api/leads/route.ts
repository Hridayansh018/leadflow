import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../services/supabaseAdmin';

// GET /api/leads - Get all leads
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build filter object
    let query = supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);
    query = query.order('created_at', { ascending: false });

    const { data: leads, error, count } = await query;

    if (error) {
      console.error('Error fetching leads:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      leads: leads || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

// POST /api/leads - Create a new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email || !body.phone || !body.user_id) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, phone, user_id' },
        { status: 400 }
      );
    }

    const lead = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      status: body.status || 'new',
      notes: body.notes || '',
      user_id: body.user_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert(lead)
      .select()
      .single();

    if (error) {
      console.error('Error creating lead:', error);
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
} 