'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { orderNotifier } from '@/lib/audio';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import {
  Flame,
  UtensilsCrossed,
  QrCode,
  History,
  Settings,
  Volume2,
  VolumeX,
  LogOut,
  ExternalLink,
  Store,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout, brandColor } = useAuth();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLive, setIsLive] = useState(true);

  // Check connection status
  useEffect(() => {
    setIsLive(typeof window !== 'undefined' ? navigator.onLine : true);
    const handleOnline = () => setIsLive(true);
    const handleOffline = () => setIsLive(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Route protection
  useEffect(() => {
    if (!loading && !user && pathname !== '/dashboard/login') {
      router.push('/dashboard/login');
    }
  }, [user, loading, pathname, router]);

  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    orderNotifier.setSoundEnabled(nextState);
    if (nextState) {
      orderNotifier.playNewOrderAlert();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-3">
        <div
          className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--brand, #E23744)', borderTopColor: 'transparent' }}
        />
        <p className="text-[14px] font-semibold text-[#555555]">Loading Dashboard...</p>
      </div>
    );
  }

  if (!user && pathname !== '/dashboard/login') {
    return null;
  }

  const navItems = [
    { href: '/dashboard', label: 'Live Orders', icon: Flame },
    { href: '/dashboard/menu', label: 'Menu', icon: UtensilsCrossed },
    { href: '/dashboard/tables', label: 'Tables & QR', icon: QrCode },
    { href: '/dashboard/history', label: 'History', icon: History },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div
      className="min-h-screen bg-[#F7F7F8] text-[#111111] flex flex-col md:flex-row selection:bg-[var(--brand,#E23744)] selection:text-white"
      style={{ '--brand': brandColor, '--brand-color': brandColor } as React.CSSProperties}
    >
      {/* Desktop/Tablet Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col bg-white border-r border-[#ECECEC] shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {/* Simple Brand Header */}
        <div className="p-5 border-b border-[#ECECEC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shadow-sm"
              style={{ backgroundColor: 'var(--brand, #E23744)' }}
            >
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[16px] font-bold text-[#111111] truncate leading-tight">
                Spice Garden
              </h2>
              {/* Live / Offline indicator */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLive ? 'bg-[#15803D] animate-pulse' : 'bg-[#9CA3AF]'
                  }`}
                />
                <span className="text-[12px] font-semibold text-[#555555]">
                  {isLive ? 'Live Connection' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl font-semibold text-[15px] transition-all min-h-[48px] ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'text-[#555555] hover:text-[#111111] hover:bg-[#F7F7F8]'
                }`}
                style={{
                  backgroundColor: isActive ? 'var(--brand, #E23744)' : undefined,
                }}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Sound toggle widget in sidebar */}
        <div className="p-4 mx-3 mb-3 bg-[#F7F7F8] border border-[#ECECEC] rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-[#111111]">Kitchen Alert Sound</span>
          </div>
          <button
            type="button"
            onClick={toggleSound}
            className={`h-9 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border min-h-[36px] ${
              soundEnabled
                ? 'bg-white border-[#ECECEC] text-[#111111] shadow-sm'
                : 'bg-[#EAEAEA] border-[#D1D5DB] text-[#6B6B6B]'
            }`}
            title={soundEnabled ? 'Sound is ON' : 'Sound is OFF'}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-[#15803D]" />
                <span>ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-[#B91C1C]" />
                <span>OFF</span>
              </>
            )}
          </button>
        </div>

        {/* Owner profile & logout */}
        <div className="p-4 border-t border-[#ECECEC] flex items-center justify-between bg-white">
          <div className="min-w-0 pr-2">
            <div className="text-[14px] font-bold text-[#111111] truncate">
              {user?.name || 'Owner'}
            </div>
            <div className="text-[12px] text-[#555555] truncate">{user?.email}</div>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="w-10 h-10 flex items-center justify-center text-[#555555] hover:text-[#B91C1C] hover:bg-[#F7F7F8] rounded-xl transition-colors"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {/* Top bar (for all screens) */}
        <header className="sticky top-0 z-30 bg-white border-b border-[#ECECEC] px-4 sm:px-6 py-3 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          {/* Left: Restaurant name & connection indicator */}
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold md:hidden"
              style={{ backgroundColor: 'var(--brand, #E23744)' }}
            >
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-[16px] sm:text-[18px] font-bold text-[#111111] leading-tight">
                Spice Garden Bistro
              </h1>
              <div className="flex items-center gap-1.5 md:hidden">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLive ? 'bg-[#15803D] animate-pulse' : 'bg-[#9CA3AF]'
                  }`}
                />
                <span className="text-[12px] font-medium text-[#555555]">
                  {isLive ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Sound toggle, Customer Menu link, Logout */}
          <div className="flex items-center gap-2">
            {/* Sound on/off button */}
            <button
              type="button"
              onClick={toggleSound}
              className={`h-10 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 ${
                soundEnabled
                  ? 'bg-white border-[#ECECEC] text-[#111111] shadow-sm'
                  : 'bg-[#F3F4F6] border-[#E5E7EB] text-[#6B6B6B]'
              }`}
              title={soundEnabled ? 'Kitchen sound is ON' : 'Kitchen sound is OFF'}
              aria-label={soundEnabled ? 'Sound is on. Tap to turn off.' : 'Sound is off. Tap to turn on.'}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-[#15803D]" />
                  <span className="hidden sm:inline">Sound ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-[#B91C1C]" />
                  <span className="hidden sm:inline">Muted</span>
                </>
              )}
            </button>

            {/* View customer menu */}
            <Link
              href="/r/spice-garden?table=1"
              target="_blank"
              className="h-10 px-3.5 rounded-xl bg-[#F7F7F8] border border-[#ECECEC] text-[#111111] font-semibold text-xs hover:bg-[#ECECEC] transition-colors flex items-center gap-1.5"
            >
              <span>Customer Menu</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#555555]" />
            </Link>

            <button
              type="button"
              onClick={() => logout()}
              className="w-10 h-10 flex items-center justify-center text-[#555555] hover:text-[#B91C1C] rounded-xl md:hidden"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (48px min tap targets) */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#ECECEC] flex items-center justify-around px-2 py-1 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
        aria-label="Mobile Navigation"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[58px] min-h-[48px] rounded-xl transition-all ${
                isActive ? 'text-[var(--brand,#E23744)] font-bold' : 'text-[#555555] font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-all ${
                  isActive ? 'text-[var(--brand,#E23744)]' : 'text-[#555555]'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[11px] leading-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
