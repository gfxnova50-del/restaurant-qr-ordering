'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { ChevronRight } from 'lucide-react';

interface FloatingCartBarProps {
  currency?: string;
  brandColor?: string;
}

export function FloatingCartBar({
  currency = 'INR',
  brandColor = '#E23744',
}: FloatingCartBarProps) {
  const { totalCount, subtotal, openDrawer } = useCart();

  if (totalCount === 0) return null;

  const currencySymbol = currency === 'INR' ? '₹' : currency;

  return (
    <div className="fixed bottom-4 inset-x-0 z-40 px-4 max-w-md mx-auto pointer-events-none">
      <button
        type="button"
        onClick={openDrawer}
        className="pointer-events-auto w-full h-14 flex items-center justify-between px-5 rounded-2xl text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] active:scale-[0.98] hover:brightness-105 transition-all duration-200 animate-in slide-in-from-bottom-6"
        style={{
          backgroundColor: 'var(--brand, #E23744)',
        }}
        aria-label={`View Cart with ${totalCount} items totaling ${currencySymbol}${subtotal}`}
      >
        {/* Left: "2 items | ₹340" */}
        <div className="flex items-center gap-2 font-bold text-[16px] text-white tracking-wide">
          <span>
            {totalCount} {totalCount === 1 ? 'item' : 'items'}
          </span>
          <span className="opacity-80">|</span>
          <span className="font-extrabold text-[17px]">
            {currencySymbol}{subtotal.toLocaleString()}
          </span>
        </div>

        {/* Right: "View Cart" */}
        <div className="flex items-center gap-1.5 font-bold text-[15px] text-white">
          <span>View Cart</span>
          <ChevronRight className="w-5 h-5 stroke-[2.5]" />
        </div>
      </button>
    </div>
  );
}
