import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/outreach';
const DB_NAME = 'outreach';

// GET /api/emails - Get all stored emails
export async function GET(request: NextRequest) {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const storage = db.collection('storage');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || 'email';
    const status = searchParams.get('status'); // sent, received, etc.
    const userId = searchParams.get('userId');
    const search = searchParams.get('search');
    
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter: Record<string, unknown> = { type };
    if (status) filter.typeDetail = status;
    if (userId) filter.userId = new ObjectId(userId);
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { from: { $regex: search, $options: 'i' } },
        { to: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } }
      ];
    }
    
    const emails = await storage.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const total = await storage.countDocuments(filter);
    
    await client.close();
    
    return NextResponse.json({
      emails,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
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
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const storage = db.collection('storage');
    
    const body = await request.json();
    const { from, to, subject, body: emailBody, typeDetail = 'sent', userId } = body;
    
    // Validate required fields
    if (!from || !to || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields: from, to, subject, body' },
        { status: 400 }
      );
    }
    
    const emailRecord = {
      userId: userId ? new ObjectId(userId) : null,
      type: 'email',
      from,
      to,
      subject,
      body: emailBody,
      timestamp: new Date(),
      typeDetail,
      read: typeDetail === 'sent',
      starred: false,
      archived: false
    };
    
    const result = await storage.insertOne(emailRecord);
    await client.close();
    
    return NextResponse.json({
      success: true,
      message: 'Email record created successfully',
      emailId: result.insertedId
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating email record:', error);
    return NextResponse.json(
      { error: 'Failed to create email record' },
      { status: 500 }
    );
  }
} 