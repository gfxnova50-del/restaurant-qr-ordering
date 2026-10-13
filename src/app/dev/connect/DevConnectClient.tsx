'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  ShieldCheck,
  Wifi,
  Copy,
  Check,
  ExternalLink,
  Flame,
  Radio,
  HelpCircle,
  RefreshCw,
  Terminal,
} from 'lucide-react';

interface DevConnectClientProps {
  lanIp: string;
  initialSiteUrl: string;
}

export function DevConnectClient({ lanIp, initialSiteUrl }: DevConnectClientProps) {
  const [selectedTable, setSelectedTable] = useState('1');
  const [activeTab, setActiveTab] = useState<'customer' | 'admin'>('customer');
  const [customerQrDataUrl, setCustomerQrDataUrl] = useState<string>('');
  const [adminQrDataUrl, setAdminQrDataUrl] = useState<string>('');
  const [copiedCustomer, setCopiedCustomer] = useState(false);
  const [copiedAdmin, setCopiedAdmin] = useState(false);
  const [currentOrigin, setCurrentOrigin] = useState<string>(initialSiteUrl);

  // Sync origin with actual browser location if loaded over tunnel or LAN
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      // If loaded on localhost, use the detected LAN IP so mobile scan targets the phone-reachable IP
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const port = window.location.port || '3000';
        setCurrentOrigin(`http://${lanIp}:${port}`);
      } else {
        setCurrentOrigin(window.location.origin);
      }
    }
  }, [lanIp]);

  const customerUrl = `${currentOrigin}/?table=${selectedTable}`;
  const adminUrl = `${currentOrigin}/admin`;

  // Generate QR codes
  useEffect(() => {
    let isMounted = true;

    QRCode.toDataURL(customerUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#111827',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    }).then((url) => {
      if (isMounted) setCustomerQrDataUrl(url);
    });

    QRCode.toDataURL(adminUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#111827',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    }).then((url) => {
      if (isMounted) setAdminQrDataUrl(url);
    });

    return () => {
      isMounted = false;
    };
  }, [customerUrl, adminUrl]);

  const handleCopy = (text: string, type: 'customer' | 'admin') => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === 'customer') {
        setCopiedCustomer(true);
        setTimeout(() => setCopiedCustomer(false), 2000);
      } else {
        setCopiedAdmin(true);
        setTimeout(() => setCopiedAdmin(false), 2000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
            <span>LAN Network Dev Portal</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A]">
            Scan to Open on Your Phone
          </h1>

          <p className="text-[#64748B] text-base max-w-xl mx-auto">
            Scan these QR codes using your phone camera to test the live menu and kitchen dashboard on your mobile device.
          </p>

          {/* Network Banner */}
          <div className="inline-flex flex-wrap items-center justify-center gap-4 bg-white border border-[#E2E8F0] shadow-sm rounded-xl px-5 py-2.5 text-sm">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-emerald-600" />
              <span className="text-[#64748B]">Laptop LAN IP:</span>
              <strong className="font-mono text-[#0F172A] bg-slate-100 px-2 py-0.5 rounded text-xs sm:text-sm">
                {lanIp}
              </strong>
            </div>
            <span className="text-[#CBD5E1] hidden sm:inline">•</span>
            <div className="flex items-center gap-2">
              <span className="text-[#64748B]">Listening:</span>
              <strong className="font-mono text-[#0F172A] bg-slate-100 px-2 py-0.5 rounded text-xs sm:text-sm">
                0.0.0.0:3000
              </strong>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center">
          <div className="inline-flex p-1.5 bg-[#E2E8F0] rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('customer')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'customer'
                  ? 'bg-white text-[#0F172A] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Smartphone className="w-4 h-4 text-[#E23744]" />
              <span>Customer Menu</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'admin'
                  ? 'bg-white text-[#0F172A] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Admin / Kitchen</span>
            </button>
          </div>
        </div>

        {/* QR Showcase Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-10 shadow-sm max-w-xl mx-auto space-y-6">
          {activeTab === 'customer' ? (
            <div className="space-y-6 text-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#E23744] bg-red-50 border border-red-100 px-3 py-1 rounded-full">
                  Customer Dining Experience
                </span>
                <h3 className="text-xl font-bold text-[#0F172A] mt-2">
                  Diner Menu (Table {selectedTable})
                </h3>
                <p className="text-sm text-[#64748B] mt-1">
                  Point your phone camera at this QR code to open the ordering menu.
                </p>
              </div>

              {/* Table Switcher */}
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-[#64748B] mr-1">Switch Table:</span>
                {['1', '2', '3', '4', '5'].map((tbl) => (
                  <button
                    key={tbl}
                    type="button"
                    onClick={() => setSelectedTable(tbl)}
                    className={`h-8 px-3 rounded-lg text-xs font-bold transition-all ${
                      selectedTable === tbl
                        ? 'bg-[#E23744] text-white shadow-sm'
                        : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                    }`}
                  >
                    Table {tbl}
                  </button>
                ))}
              </div>

              {/* QR Code Container */}
              <div className="bg-white p-4 border border-[#E2E8F0] rounded-2xl shadow-inner inline-block mx-auto">
                {customerQrDataUrl ? (
                  <img
                    src={customerQrDataUrl}
                    alt={`Customer QR code for ${customerUrl}`}
                    className="w-64 h-64 sm:w-72 sm:h-72 object-contain mx-auto rounded-lg"
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  </div>
                )}
              </div>

              {/* URL & Actions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-left">
                  <span className="font-mono text-xs sm:text-sm text-[#0F172A] truncate flex-1">
                    {customerUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(customerUrl, 'customer')}
                    className="shrink-0 p-2 text-[#475569] hover:text-[#0F172A] hover:bg-[#E2E8F0] rounded-lg transition-colors"
                    title="Copy URL"
                  >
                    {copiedCustomer ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <a
                    href={customerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 p-2 text-[#475569] hover:text-[#0F172A] hover:bg-[#E2E8F0] rounded-lg transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                  Kitchen &amp; Order Manager
                </span>
                <h3 className="text-xl font-bold text-[#0F172A] mt-2">
                  Kitchen Orders &amp; Admin Panel
                </h3>
                <p className="text-sm text-[#64748B] mt-1">
                  Point staff phone or kitchen tablet camera here to manage live orders.
                </p>
              </div>

              {/* QR Code Container */}
              <div className="bg-white p-4 border border-[#E2E8F0] rounded-2xl shadow-inner inline-block mx-auto">
                {adminQrDataUrl ? (
                  <img
                    src={adminQrDataUrl}
                    alt={`Admin QR code for ${adminUrl}`}
                    className="w-64 h-64 sm:w-72 sm:h-72 object-contain mx-auto rounded-lg"
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  </div>
                )}
              </div>

              {/* URL & Actions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-left">
                  <span className="font-mono text-xs sm:text-sm text-[#0F172A] truncate flex-1">
                    {adminUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(adminUrl, 'admin')}
                    className="shrink-0 p-2 text-[#475569] hover:text-[#0F172A] hover:bg-[#E2E8F0] rounded-lg transition-colors"
                    title="Copy URL"
                  >
                    {copiedAdmin ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <a
                    href={adminUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 p-2 text-[#475569] hover:text-[#0F172A] hover:bg-[#E2E8F0] rounded-lg transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Troubleshooting / WiFi Guide Accordion */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 space-y-4 max-w-xl mx-auto shadow-sm">
          <div className="flex items-center gap-2.5 text-[#0F172A] font-bold text-base">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <span>Phone not loading the page? Follow these 3 steps:</span>
          </div>

          <div className="space-y-3 text-sm text-[#475569]">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </span>
              <div>
                <strong className="text-[#0F172A]">Same Wi-Fi Network</strong>: Confirm both your laptop and your phone are connected to the exact same Wi-Fi router (not mobile hotspot or guest Wi-Fi).
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </span>
              <div>
                <strong className="text-[#0F172A]">Windows Firewall Prompt</strong>: If Windows Defender popped up, make sure you checked &quot;Private Networks&quot; and clicked &quot;Allow Access&quot; for Node.js.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                3
              </span>
              <div>
                <strong className="text-[#0F172A]">Need Mobile Data Access?</strong>: Run <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-[#0F172A]">npm run share</code> in terminal to create a free public HTTPS tunnel that works anywhere on 4G/5G without Wi-Fi!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
