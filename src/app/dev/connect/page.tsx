import React from 'react';
import { getLanIp, getSiteUrl } from '@/lib/network';
import { DevConnectClient } from './DevConnectClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dev Connect - Scan & Open on Mobile',
  description: 'Connect your phone to the local QR Menu and Admin panel over Wi-Fi',
};

export default function DevConnectPage() {
  const lanIp = getLanIp();
  const siteUrl = getSiteUrl();

  return <DevConnectClient lanIp={lanIp} initialSiteUrl={siteUrl} />;
}
