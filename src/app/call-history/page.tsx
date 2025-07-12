"use client";

import React from 'react';
import CallHistoryTable from '../../components/CallHistoryTable';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

export default function CallHistoryRoute() {
  return <CallHistoryTable />;
} 