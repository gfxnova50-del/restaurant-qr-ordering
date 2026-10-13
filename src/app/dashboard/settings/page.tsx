import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SettingsView } from '@/components/dashboard/SettingsView';
import { ToastProvider } from '@/components/ui/Toast';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Branding & Restaurant Settings',
  description: 'Customize restaurant brand color, theme, currency, and dining configurations.',
};

export default function DashboardSettingsPage() {
  return (
    <ToastProvider>
      <DashboardLayout>
        <SettingsView />
      </DashboardLayout>
    </ToastProvider>
  );
}
