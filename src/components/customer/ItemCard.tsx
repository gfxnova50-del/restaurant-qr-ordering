'use client';

import React, { useState } from 'react';
import { MenuItem } from '@/types/database';
import { VegBadge } from '@/components/ui/VegBadge';
import { Plus, Minus, ImageOff } from 'lucide-react';

interface ItemCardProps {
  item: MenuItem;
  currency?: string;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  brandColor?: string;
}

export function ItemCard({
  item,
  currency = 'INR',
  quantity,
  onAdd,
  onRemove,
  brandColor = '#E23744',
}: ItemCardProps) {
  const [imageError, setImageError] = useState(false);
  const isAvailable = item.is_available !== false;
  const currencySymbol = currency === 'INR' ? '₹' : currency;

  return (
    <article
      className={`relative flex items-start justify-between gap-3 p-3 sm:p-4 bg-white border border-[#ECECEC] rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all ${
        isAvailable ? 'hover:border-[#D1D5DB]' : 'bg-[#FAFAFA] opacity-60'
      }`}
    >
      {/* Left Details: Veg icon, Name, Full Description, Price */}
      <div className="flex-1 min-w-0 pr-1">
        {/* Veg badge next to item name */}
        <div className="flex items-start gap-2 mb-1">
          <div className="pt-0.5 shrink-0">
            <VegBadge isVeg={item.is_veg} size="sm" />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              className={`text-[15px] sm:text-[17px] font-bold leading-snug tracking-tight break-words ${
                isAvailable ? 'text-[#111111]' : 'text-[#555555] line-through'
              }`}
            >
              {item.name}
            </h3>
          </div>
        </div>

        {/* Price */}
        <div className="text-[16px] sm:text-[17px] font-extrabold text-[#111111] mt-0.5">
          {currencySymbol}
          {Number(item.price).toLocaleString()}
        </div>

        {/* Description: cleanly readable without text cutoff */}
        {item.description && (
          <p className="text-[13px] sm:text-[14px] text-[#555555] mt-1 leading-relaxed break-words">
            {item.description}
          </p>
        )}

        {/* Unavailable status label */}
        {!isAvailable && (
          <div className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[#B91C1C] bg-[#FEF2F2] border border-[#FEE2E2] px-2 py-0.5 rounded-full">
            Not available
          </div>
        )}
      </div>

      {/* Right side: square image with overlapping ADD button */}
      <div className="relative shrink-0 flex flex-col items-center pt-0.5 pb-3">
        {/* Responsive rounded image */}
        <div className="relative w-[84px] h-[84px] sm:w-[96px] sm:h-[96px] rounded-xl overflow-hidden bg-[#F7F7F8] border border-[#ECECEC]">
          {item.image_url && !imageError ? (
            <img
              src={item.image_url}
              alt={item.name}
              loading="lazy"
              onError={() => setImageError(true)}
              className={`w-full h-full object-cover ${
                isAvailable ? '' : 'grayscale'
              }`}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#888888] bg-[#F7F7F8]">
              <ImageOff className="w-5 h-5 opacity-40" />
            </div>
          )}
        </div>

        {/* ADD button overlapping bottom of image */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-10">
          {isAvailable ? (
            quantity > 0 ? (
              /* Stepper in brand color */
              <div
                className="flex items-center justify-between w-[80px] sm:w-[88px] h-[34px] sm:h-[36px] rounded-lg text-white shadow-md overflow-hidden select-none"
                style={{ backgroundColor: 'var(--brand, #E23744)' }}
              >
                <button
                  type="button"
                  onClick={onRemove}
                  className="flex items-center justify-center w-7 sm:w-8 h-full text-white hover:bg-black/15 active:bg-black/25 active:scale-95 transition-all"
                  aria-label={`Decrease quantity for ${item.name}`}
                >
                  <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
                <span className="text-[14px] sm:text-[15px] font-extrabold px-1 select-none text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={onAdd}
                  className="flex items-center justify-center w-7 sm:w-8 h-full text-white hover:bg-black/15 active:bg-black/25 active:scale-95 transition-all"
                  aria-label={`Increase quantity for ${item.name}`}
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            ) : (
              /* ADD button */
              <button
                type="button"
                onClick={onAdd}
                className="w-[76px] sm:w-[84px] h-[34px] sm:h-[36px] rounded-lg font-bold text-[13px] sm:text-[14px] uppercase tracking-wider bg-white border shadow-xs active:scale-95 transition-all flex items-center justify-center hover:bg-neutral-50"
                style={{
                  borderColor: 'var(--brand, #E23744)',
                  color: 'var(--brand, #E23744)',
                }}
                aria-label={`Add ${item.name} to cart`}
              >
                ADD
              </button>
            )
          ) : (
            /* Disabled button */
            <button
              type="button"
              disabled
              className="w-[76px] sm:w-[84px] h-[30px] rounded-lg font-semibold text-[12px] bg-[#F3F4F6] border border-[#E5E7EB] text-[#6B6B6B] cursor-not-allowed flex items-center justify-center"
            >
              N/A
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
