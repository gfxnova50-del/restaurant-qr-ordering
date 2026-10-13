import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { TablesQRView } from '@/components/dashboard/TablesQRView';
import { ToastProvider } from '@/components/ui/Toast';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tables & QR Codes - Print-Ready PDF',
  description: 'Manage dining tables and generate printable QR code stands and stickers.',
};

export default function DashboardTablesPage() {
  return (
    <ToastProvider>
      <DashboardLayout>
        <TablesQRView />
      </DashboardLayout>
    </ToastProvider>
  );
}
