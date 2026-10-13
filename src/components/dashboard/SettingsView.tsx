'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Palette, Store, Check } from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Classic Red (Default)', hex: '#E23744' },
  { name: 'Spice Orange', hex: '#EA580C' },
  { name: 'Royal Crimson', hex: '#E11D48' },
  { name: 'Warm Amber', hex: '#D97706' },
  { name: 'Emerald Green', hex: '#15803D' },
  { name: 'Modern Indigo', hex: '#4F46E5' },
];

export function SettingsView() {
  const { brandColor, setBrandColor } = useAuth();
  const { success: toastSuccess } = useToast();

  const [restaurantName, setRestaurantName] = useState('Spice Garden Bistro');
  const [currency, setCurrency] = useState('INR');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [onlinePayments, setOnlinePayments] = useState(true);
  const [customHex, setCustomHex] = useState(brandColor);

  const handleApplyColor = (hex: string) => {
    setCustomHex(hex);
    setBrandColor(hex);
    document.documentElement.style.setProperty('--brand', hex);
    document.documentElement.style.setProperty('--brand-color', hex);
    toastSuccess(`Brand color set to ${hex}!`);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    handleApplyColor(customHex);
    toastSuccess('Restaurant settings updated successfully!');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-[22px] sm:text-[26px] font-bold text-[#111111] tracking-tight">
          Brand & Settings
        </h1>
        <p className="text-[14px] text-[#555555]">
          Manage your brand color, restaurant details, currency, and payment options
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Brand Accent Color Card */}
        <div className="bg-white border border-[#ECECEC] rounded-2xl p-5 sm:p-6 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#ECECEC]">
            <Palette className="w-5 h-5 text-[#111111]" />
            <div>
              <h2 className="text-[16px] font-bold text-[#111111]">Brand Accent Color</h2>
              <p className="text-[13px] text-[#555555]">
                Single accent color applied to primary buttons, active tabs, price highlights, and badges
              </p>
            </div>
          </div>

          {/* Preset Swatches */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {PRESET_COLORS.map((c) => {
              const isSelected = brandColor.toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => handleApplyColor(c.hex)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-2 border-[#111111] bg-white shadow-sm'
                      : 'border-[#ECECEC] bg-[#F7F7F8] hover:border-[#D1D5DB]'
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-full shrink-0 shadow-sm flex items-center justify-center text-white"
                    style={{ backgroundColor: c.hex }}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-[13px] font-bold text-[#111111] truncate">{c.name}</span>
                </button>
              );
            })}
          </div>

          {/* Custom Hex Code */}
          <div className="pt-2 flex items-center gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="block text-[13px] font-bold text-[#111111]">
                Custom Hex Code
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customHex}
                  onChange={(e) => setCustomHex(e.target.value)}
                  placeholder="#E23744"
                  className="w-full h-11 bg-white border border-[#ECECEC] rounded-xl px-3.5 font-mono text-[14px] text-[#111111] focus:outline-none focus:border-[var(--brand,#E23744)]"
                />
                <button
                  type="button"
                  onClick={() => handleApplyColor(customHex)}
                  className="h-11 px-4 rounded-xl bg-[#F7F7F8] border border-[#ECECEC] text-[13px] font-bold text-[#111111] hover:bg-[#ECECEC] transition-colors shrink-0"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Live swatch */}
            <div className="pt-6">
              <div
                className="w-12 h-11 rounded-xl shadow-sm border border-[#ECECEC] flex items-center justify-center text-white font-bold text-[12px]"
                style={{ backgroundColor: brandColor }}
              >
                Brand
              </div>
            </div>
          </div>
        </div>

        {/* Restaurant Profile */}
        <div className="bg-white border border-[#ECECEC] rounded-2xl p-5 sm:p-6 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#ECECEC]">
            <Store className="w-5 h-5 text-[#111111]" />
            <div>
              <h2 className="text-[16px] font-bold text-[#111111]">Restaurant Profile</h2>
              <p className="text-[13px] text-[#555555]">Information visible to diners</p>
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="block text-[14px] font-bold text-[#111111]">
                Restaurant Name
              </label>
              <input
                type="text"
                required
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full h-11 bg-white border border-[#ECECEC] rounded-xl px-3.5 text-[14px] text-[#111111] focus:outline-none focus:border-[var(--brand,#E23744)]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="block text-[14px] font-bold text-[#111111]">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-11 bg-white border border-[#ECECEC] rounded-xl px-3.5 text-[14px] text-[#111111] focus:outline-none focus:border-[var(--brand,#E23744)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[14px] font-bold text-[#111111]">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full h-11 bg-white border border-[#ECECEC] rounded-xl px-3 text-[14px] text-[#111111] focus:outline-none focus:border-[var(--brand,#E23744)]"
                >
                  <option value="INR">₹ INR (Indian Rupee)</option>
                  <option value="USD">$ USD (US Dollar)</option>
                  <option value="AED">AED (UAE Dirham)</option>
                  <option value="EUR">€ EUR (Euro)</option>
                </select>
              </div>
            </div>

            {/* Online payment toggle */}
            <div className="flex items-center justify-between p-3.5 bg-[#F7F7F8] border border-[#ECECEC] rounded-xl">
              <div>
                <span className="block text-[14px] font-bold text-[#111111]">
                  Accept Online Payments (UPI / Card)
                </span>
                <span className="text-[12px] text-[#555555]">
                  Shows &quot;Pay online&quot; card in customer checkout
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOnlinePayments(!onlinePayments)}
                className={`w-12 h-6 rounded-full p-0.5 transition-colors flex items-center ${
                  onlinePayments ? 'bg-[#15803D]' : 'bg-[#D1D5DB]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    onlinePayments ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Save button (min 52px) */}
        <button
          type="submit"
          className="w-full h-[52px] rounded-xl text-white font-bold text-[16px] shadow-sm active:scale-[0.98] transition-all hover:brightness-105"
          style={{ backgroundColor: 'var(--brand, #E23744)' }}
        >
          Save Settings
        </button>
      </form>
    </div>
  );
}
