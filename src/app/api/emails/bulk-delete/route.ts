import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/outreach';
const DB_NAME = 'outreach';

// DELETE /api/emails/bulk-delete - Bulk delete emails
export async function DELETE(request: NextRequest) {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const storage = db.collection('storage');
    
    const body = await request.json();
    const { ids } = body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid ids array' },
        { status: 400 }
      );
    }
    
    const objectIds = ids.map((id: string) => new ObjectId(id));
    
    const result = await storage.deleteMany({ 
      _id: { $in: objectIds },
      type: 'email'
    });
    
    await client.close();
    
    return NextResponse.json({
      success: true,
      message: `Deleted ${result.deletedCount} emails`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error bulk deleting emails:', error);
    return NextResponse.json(
      { error: 'Failed to bulk delete emails' },
      { status: 500 }
    );
  }
} 