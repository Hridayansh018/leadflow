import { NextRequest, NextResponse } from 'next/server';

// MongoDB code removed. If this file is now unused, consider deleting it.

// DELETE /api/emails/bulk-delete - Bulk delete emails
export async function DELETE(request: NextRequest) {
  try {
    // The original MongoDB client and connection logic is removed.
    // This function will now return a placeholder response.
    return NextResponse.json({
      success: true,
      message: 'Bulk deletion functionality is currently disabled.',
      deletedCount: 0
    });
  } catch (error) {
    console.error('Error bulk deleting emails:', error);
    return NextResponse.json(
      { error: 'Failed to bulk delete emails' },
      { status: 500 }
    );
  }
} 