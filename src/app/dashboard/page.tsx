import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { LiveOrdersView } from '@/components/dashboard/LiveOrdersView';
import { ToastProvider } from '@/components/ui/Toast';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Orders - Kitchen Kanban Board',
  description: 'Real-time multi-column kitchen display system with sound alerts.',
};

export default function DashboardOrdersPage() {
  return (
    <ToastProvider>
      <DashboardLayout>
        <LiveOrdersView />
      </DashboardLayout>
    </ToastProvider>
  );
}
