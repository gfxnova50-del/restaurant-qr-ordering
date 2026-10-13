'use client';

import React, { useRef, useEffect } from 'react';

interface CategoryNavProps {
  categories: Array<{ id: string; name: string }>;
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
  brandColor?: string;
}

export function CategoryNav({
  categories,
  activeCategoryId,
  onSelectCategory,
  brandColor = '#E23744',
}: CategoryNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll the horizontal pill container so the active category stays visible
  useEffect(() => {
    if (activeBtnRef.current && containerRef.current) {
      const container = containerRef.current;
      const button = activeBtnRef.current;
      const scrollLeft =
        button.offsetLeft - container.offsetWidth / 2 + button.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [activeCategoryId]);

  return (
    <nav
      className="sticky top-[65px] z-20 bg-white/95 backdrop-blur-sm border-b border-[#ECECEC] py-2.5 px-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
      aria-label="Menu Categories"
    >
      <div
        ref={containerRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth"
      >
        {categories.map((cat) => {
          const isActive = cat.id === activeCategoryId;
          return (
            <button
              key={cat.id}
              ref={isActive ? activeBtnRef : null}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`shrink-0 h-11 px-4 rounded-full font-semibold text-[14px] transition-all active:scale-95 duration-150 select-none flex items-center justify-center ${
                isActive
                  ? 'text-white shadow-sm'
                  : 'bg-white text-[#555555] border border-[#ECECEC] hover:border-[#D1D5DB] hover:text-[#111111]'
              }`}
              style={{
                backgroundColor: isActive ? 'var(--brand, #E23744)' : undefined,
                borderColor: isActive ? 'transparent' : undefined,
              }}
              aria-current={isActive ? 'true' : undefined}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
