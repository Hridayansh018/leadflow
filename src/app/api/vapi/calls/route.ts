import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    const response = await axios.get('https://api.vapi.ai/call', {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('VAPI API error:', error);
    return NextResponse.json({ error: 'Failed to fetch calls from VAPI.' }, { status: 502 });
  }
} 