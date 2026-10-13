import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { MenuManagerView } from '@/components/dashboard/MenuManagerView';
import { ToastProvider } from '@/components/ui/Toast';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Menu Manager - Dishes & Categories',
  description: 'Manage menu items, prices, images, and live availability switches.',
};

export default function DashboardMenuPage() {
  return (
    <ToastProvider>
      <DashboardLayout>
        <MenuManagerView />
      </DashboardLayout>
    </ToastProvider>
  );
}
