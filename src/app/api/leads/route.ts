import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/outreach';
const DB_NAME = 'outreach';

// GET /api/leads - Get all leads
export async function GET(request: NextRequest) {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const storage = db.collection('storage');
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const interest = searchParams.get('interest');
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    // Build filter object
    const filter: Record<string, unknown> = { type: 'lead' };
    if (status) filter.status = status;
    if (interest) filter.interest = interest;
    if (userId) filter.userId = new ObjectId(userId);
    const leads = await storage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();
    const total = await storage.countDocuments(filter);
    await client.close();
    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
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
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const storage = db.collection('storage');
    const body = await request.json();
    // Validate required fields
    if (!body.name || !body.email || !body.phone || !body.property || !body.userId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, phone, property, userId' },
        { status: 400 }
      );
    }
    const lead = {
      ...body,
      userId: new ObjectId(body.userId),
      type: 'lead',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await storage.insertOne(lead);
    await client.close();
    return NextResponse.json({ ...lead, _id: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
} 