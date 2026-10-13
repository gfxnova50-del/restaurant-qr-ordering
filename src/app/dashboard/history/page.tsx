import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { OrderHistoryView } from '@/components/dashboard/OrderHistoryView';
import { ToastProvider } from '@/components/ui/Toast';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order History & Sales Analytics',
  description: 'View daily sales totals, revenue metrics, and past customer dining orders.',
};

export default function DashboardHistoryPage() {
  return (
    <ToastProvider>
      <DashboardLayout>
        <OrderHistoryView />
      </DashboardLayout>
    </ToastProvider>
  );
}
