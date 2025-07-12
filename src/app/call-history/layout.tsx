"use client";

import React from 'react';
import { DataProvider } from '../context/DataContext';
import { AuthProvider } from '../context/AuthContext';

export default function CallHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DataProvider>
        {children}
      </DataProvider>
    </AuthProvider>
  );
} 