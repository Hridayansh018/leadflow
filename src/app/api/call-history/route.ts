import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../services/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const filters = await req.json();
    let query = supabaseAdmin.from('call_history').select('*');

    // Apply filters if provided
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters.interest) {
      query = query.eq('interest', filters.interest);
    }
    if (filters.call_status) {
      query = query.eq('call_status', filters.call_status);
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