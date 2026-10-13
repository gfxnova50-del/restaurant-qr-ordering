import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Utensils,
  Smartphone,
  Flame,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { table?: string } | Promise<{ table?: string }>;
}) {
  const query = searchParams ? await Promise.resolve(searchParams) : {};
  if (query?.table) {
    redirect(`/r/spice-garden?table=${encodeURIComponent(query.table)}`);
  }
  return (
    <div className="min-h-screen bg-white text-[#111111] flex flex-col justify-between selection:bg-[var(--brand,#E23744)] selection:text-white">
      {/* Top Navbar */}
      <nav className="border-b border-[#ECECEC] bg-white sticky top-0 z-40 px-6 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shadow-sm"
              style={{ backgroundColor: 'var(--brand, #E23744)' }}
            >
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[18px] font-bold text-[#111111] tracking-tight block leading-tight">
                QR Dine
              </span>
              <span className="text-[12px] font-medium text-[#555555]">
                QR Menu & Ordering
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard"
              className="h-10 px-4 rounded-xl bg-[#F7F7F8] border border-[#ECECEC] hover:bg-[#ECECEC] text-[13px] font-bold text-[#111111] transition-all flex items-center justify-center"
            >
              Owner Portal
            </Link>
            <Link
              href="/r/spice-garden?table=2"
              className="h-10 px-4 rounded-xl text-white text-[13px] font-bold shadow-sm transition-all flex items-center justify-center hover:brightness-105 active:scale-95"
              style={{ backgroundColor: 'var(--brand, #E23744)' }}
            >
              Customer Menu
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-12 md:py-20 flex-1 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F7F7F8] border border-[#ECECEC] text-[#111111] text-[13px] font-semibold">
            <Sparkles className="w-4 h-4 text-[var(--brand,#E23744)]" />
            <span>Clean, fast, mobile-first ordering for restaurants</span>
          </div>

          <h1 className="text-[32px] sm:text-[48px] md:text-[54px] font-black text-[#111111] tracking-tight leading-[1.15]">
            Simple QR Menu &amp; Live Kitchen Orders
          </h1>

          <p className="text-[16px] sm:text-[18px] text-[#555555] max-w-2xl mx-auto leading-relaxed">
            Diners scan table QR codes on their phones to view menus, customize food, and place orders directly. Kitchen staff manage orders in real time.
          </p>

          {/* Quick CTA Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Link
              href="/r/spice-garden?table=2"
              className="w-full sm:w-auto h-13 px-7 rounded-xl text-white font-bold text-[16px] flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all hover:brightness-105 min-h-[52px]"
              style={{ backgroundColor: 'var(--brand, #E23744)' }}
            >
              <Smartphone className="w-5 h-5" />
              <span>Open Customer Menu (Table 2)</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto h-13 px-7 rounded-xl bg-white border border-[#ECECEC] hover:bg-[#F7F7F8] text-[#111111] font-bold text-[16px] flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all min-h-[52px]"
            >
              <Flame className="w-5 h-5 text-[var(--brand,#E23744)]" />
              <span>Kitchen Live Orders</span>
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Experience Card */}
          <div className="bg-white border border-[#ECECEC] rounded-2xl p-6 sm:p-8 space-y-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: 'var(--brand, #E23744)' }}
              >
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-[20px] font-bold text-[#111111]">Customer Dining Experience</h2>
                <span className="text-[14px] text-[#555555]">Designed for 360px phones with high clarity</span>
              </div>
            </div>

            <ul className="space-y-3 text-[15px] text-[#555555]">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#15803D] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#111111]">Table Awareness</strong>: Prominent Table pill so diners know where they are seated.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#15803D] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#111111]">Clear Item Layout</strong>: Standard veg/non-veg dot, 17px item name, 96x96 image with overlapping ADD button.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#15803D] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#111111]">Floating Cart Bar</strong>: Brand-colored bottom bar with slide-up animation and instant cart drawer.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#15803D] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#111111]">Live Order Tracking</strong>: 4-step progress stepper with live green status updates.
                </span>
              </li>
            </ul>

            <div className="flex gap-2 pt-2">
              <Link
                href="/r/spice-garden?table=1"
                className="flex-1 h-11 rounded-xl bg-[#F7F7F8] border border-[#ECECEC] text-[#111111] text-[13px] font-bold flex items-center justify-center hover:bg-[#ECECEC] transition-colors"
              >
                Spice Garden (Table 1)
              </Link>
              <Link
                href="/r/craves?table=3"
                className="flex-1 h-11 rounded-xl bg-[#F7F7F8] border border-[#ECECEC] text-[#111111] text-[13px] font-bold flex items-center justify-center hover:bg-[#ECECEC] transition-colors"
              >
                Craves Cafe (Table 3)
              </Link>
            </div>
          </div>

          {/* Owner Dashboard Card */}
          <div className="bg-white border border-[#ECECEC] rounded-2xl p-6 sm:p-8 space-y-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#111111] text-white flex items-center justify-center">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-[20px] font-bold text-[#111111]">Kitchen &amp; Admin Panel</h2>
                <span className="text-[14px] text-[#555555]">Fast operational panel for tablet and phone</span>
              </div>
            </div>

            <ul className="space-y-3 text-[15px] text-[#555555]">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#15803D] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#111111]">4 Live Columns / Phone Tabs</strong>: New, Preparing, Ready, Served with count badges.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#15803D] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#111111]">Large Order Cards</strong>: Big table number, 15-min warning timer, and 52px action buttons.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#15803D] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#111111]">Menu Manager</strong>: Simple list with live availability switches and clean add dish form.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#15803D] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#111111]">Today&apos;s Summary &amp; Tables QR</strong>: Today&apos;s Orders and Sales summary with print-ready PDF export.
                </span>
              </li>
            </ul>

            <div className="flex gap-2 pt-2">
              <Link
                href="/dashboard"
                className="flex-1 h-11 rounded-xl bg-[#F7F7F8] border border-[#ECECEC] text-[#111111] text-[13px] font-bold flex items-center justify-center hover:bg-[#ECECEC] transition-colors"
              >
                Live Orders Board
              </Link>
              <Link
                href="/dashboard/tables"
                className="flex-1 h-11 rounded-xl bg-[#F7F7F8] border border-[#ECECEC] text-[#111111] text-[13px] font-bold flex items-center justify-center hover:bg-[#ECECEC] transition-colors"
              >
                Tables &amp; QR
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#ECECEC] py-6 text-center text-[13px] text-[#555555] bg-white">
        QR Dine • Clean, Minimal QR Ordering
      </footer>
    </div>
  );
}
