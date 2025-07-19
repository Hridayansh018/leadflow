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

export async function POST(req: NextRequest) {
  try {
    const filters = await req.json();
    let query = supabaseAdmin.from('leads').select('*');

    // Apply filters if provided
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters.interest) {
      query = query.eq('interest', filters.interest);
    }
    if (filters.leadstatus) {
      query = query.eq('leadstatus', filters.leadstatus);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.created_after) {
      query = query.gte('created_at', filters.created_after);
    }
    if (filters.created_before) {
      query = query.lte('created_at', filters.created_before);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
} 