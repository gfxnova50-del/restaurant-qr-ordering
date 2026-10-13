'use client';

import React, { useState } from 'react';
import { Restaurant, Table } from '@/types/database';
import { Utensils, Phone, Check, ChevronDown, MapPin, X } from 'lucide-react';

interface MenuHeaderProps {
  restaurant: Restaurant & { brand_color?: string };
  tableNumber: string;
  tables: Table[];
  onSelectTable: (table: string) => void;
}

export function MenuHeader({
  restaurant,
  tableNumber,
  tables,
  onSelectTable,
}: MenuHeaderProps) {
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-[#ECECEC] px-3.5 sm:px-4 py-2.5 sm:py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between gap-2.5">
          {/* Restaurant identity */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-[#F7F7F8] border border-[#ECECEC] shrink-0 flex items-center justify-center">
              {restaurant.logo_url ? (
                <img
                  src={restaurant.logo_url}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-[#555555]" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-[15px] sm:text-[18px] font-bold text-[#111111] leading-tight tracking-tight break-words">
                {restaurant.name}
              </h1>
              <div className="flex items-center gap-2 text-[12px] sm:text-[13px] text-[#666666] mt-0.5 flex-wrap">
                <span className="flex items-center gap-1 font-semibold text-[#15803D]">
                  <MapPin className="w-3 h-3" /> Dine-in
                </span>
                {restaurant.phone && (
                  <>
                    <span className="text-[#CCCCCC]">•</span>
                    <a
                      href={`tel:${restaurant.phone}`}
                      className="flex items-center gap-1 text-[#666666] hover:text-[#111111] font-medium transition-colors"
                      title="Call Restaurant"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{restaurant.phone}</span>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Table badge pill: "Table 5" */}
          <button
            type="button"
            onClick={() => setIsTableModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#F7F7F8] border border-[#E5E7EB] text-[#111111] font-bold text-xs sm:text-sm min-h-[38px] justify-center active:scale-95 transition-all hover:bg-[#F0F0F2] shadow-xs shrink-0"
            title="Tap to change table"
            aria-label={`Current table is Table ${tableNumber || '1'}. Tap to change.`}
          >
            <span>Table {tableNumber || '1'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#555555]" />
          </button>
        </div>
      </header>

      {/* Change Table Modal */}
      {isTableModalOpen && (
        <div
          onClick={() => setIsTableModalOpen(false)}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[#ECECEC] rounded-t-3xl sm:rounded-2xl w-full max-w-md p-5 space-y-4 shadow-[0_16px_36px_rgba(0,0,0,0.16)] animate-in slide-in-from-bottom-6"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#ECECEC]">
              <div>
                <h3 className="text-[18px] font-bold text-[#111111]">Select Your Table</h3>
                <p className="text-[14px] text-[#555555] mt-0.5">
                  Pick the number shown on your table stand
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTableModalOpen(false)}
                className="w-10 h-10 rounded-full bg-[#F7F7F8] border border-[#ECECEC] text-[#555555] flex items-center justify-center hover:text-[#111111] hover:bg-[#ECECEC] transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 max-h-64 overflow-y-auto py-1">
              {(tables.length > 0
                ? tables
                : [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ id: `tbl-${n}`, table_number: String(n) }))
              ).map((t) => {
                const isSelected = String(t.table_number) === String(tableNumber);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      onSelectTable(String(t.table_number));
                      setIsTableModalOpen(false);
                    }}
                    className={`flex items-center justify-center gap-1.5 h-12 px-3 rounded-xl font-bold text-[15px] transition-all active:scale-95 ${
                      isSelected
                        ? 'text-white shadow-sm'
                        : 'bg-[#F7F7F8] text-[#111111] border border-[#ECECEC] hover:border-[#D1D5DB]'
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'var(--brand, #E23744)' : undefined,
                    }}
                  >
                    <span>Table {t.table_number}</span>
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsTableModalOpen(false)}
              className="w-full h-12 rounded-xl bg-[#F7F7F8] border border-[#ECECEC] text-[#111111] font-semibold text-sm hover:bg-[#EFEFEF] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
