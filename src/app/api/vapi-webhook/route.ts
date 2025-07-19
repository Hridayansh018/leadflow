import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../services/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const callData = await req.json();
    // Insert call data into call_history
    const { error } = await supabaseAdmin.from('call_history').insert({
      user_id: callData.user_id,
      customer_name: callData.customer_name,
      customer_phone: callData.customer_phone,
      call_status: callData.call_status,
      duration: callData.duration,
      notes: callData.notes,
      interest: callData.interest,
      created_at: callData.created_at,
      interested_property: callData.property_details || ''
    });
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    // Optionally, create a lead if interest is "yes"
    if (callData.interest === 'yes') {
      await supabaseAdmin.from('leads').insert({
        user_id: callData.user_id,
        name: callData.customer_name,
        phone: callData.customer_phone,
        interest: 'yes',
        leadstatus: 'pending',
        status: 'new',
        notes: callData.notes,
        created_at: callData.created_at,
        updated_at: callData.created_at,
        email: '',
        interested_property: callData.property_details || ''
      });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
} 