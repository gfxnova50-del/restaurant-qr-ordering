'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MenuResponse } from '@/lib/api';
import { MenuHeader } from '@/components/customer/MenuHeader';
import { CategoryNav } from '@/components/customer/CategoryNav';
import { ItemCard } from '@/components/customer/ItemCard';
import { FloatingCartBar } from '@/components/customer/FloatingCartBar';
import { CartDrawer } from '@/components/customer/CartDrawer';
import { VegBadge } from '@/components/ui/VegBadge';
import { useCart } from '@/context/CartContext';
import { Search, X, AlertCircle } from 'lucide-react';

interface MenuClientViewProps {
  initialData: MenuResponse;
  slug: string;
}

export function MenuClientView({ initialData, slug }: MenuClientViewProps) {
  const { restaurant, tables, categories } = initialData;
  const brandColor = restaurant.brand_color || '#E23744';

  const {
    tableNumber,
    setTableNumber,
    addItem,
    updateQuantity,
    getItemQuantity,
  } = useCart();

  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    categories[0]?.id || ''
  );

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Ensure CSS variable is synced
  useEffect(() => {
    if (restaurant.brand_color) {
      document.documentElement.style.setProperty('--brand', restaurant.brand_color);
      document.documentElement.style.setProperty('--brand-color', restaurant.brand_color);
    }
  }, [restaurant.brand_color]);

  // Flattened and filtered items
  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return categories
      .map((cat) => {
        const filteredItems = cat.items.filter((item) => {
          const matchesVeg = !vegOnly || item.is_veg;
          const matchesQuery =
            !query ||
            item.name.toLowerCase().includes(query) ||
            (item.description && item.description.toLowerCase().includes(query));
          return matchesVeg && matchesQuery;
        });

        return {
          ...cat,
          items: filteredItems,
        };
      })
      .filter((cat) => cat.items.length > 0);
  }, [categories, searchQuery, vegOnly]);

  // Auto-switch active category tab if current active is filtered out
  useEffect(() => {
    if (filteredCategories.length > 0) {
      const isCurrentValid = filteredCategories.some((c) => c.id === activeCategoryId);
      if (!isCurrentValid) {
        setActiveCategoryId(filteredCategories[0].id);
      }
    }
  }, [filteredCategories, activeCategoryId]);

  // Handle category tab click with smooth scrolling & clear search if category is filtered out
  const handleSelectCategory = (id: string) => {
    const isCategoryVisible = filteredCategories.some((c) => c.id === id);
    if (!isCategoryVisible && searchQuery) {
      setSearchQuery('');
    }
    setActiveCategoryId(id);
    setTimeout(() => {
      const element = sectionRefs.current[id];
      if (element) {
        const yOffset = -135; // Offset for sticky header + category nav
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }, 60);
  };

  // Scroll spy to update active category tab as user scrolls
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 145;
      for (const cat of categories) {
        const el = sectionRefs.current[cat.id];
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveCategoryId(cat.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categories]);

  // Find table UUID for order placement
  const activeTable = useMemo(() => {
    return (
      tables.find((t) => String(t.table_number) === String(tableNumber)) ||
      tables[0] || {
        id: 'tbl-default',
        restaurant_id: restaurant.id,
        table_number: tableNumber || '1',
        created_at: new Date().toISOString(),
      }
    );
  }, [tables, tableNumber, restaurant.id]);

  const handleTableChange = (newTableNumber: string) => {
    setTableNumber(newTableNumber);
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('table', newTableNumber);
        window.history.replaceState({}, '', url.toString());
      } catch {}
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F9F9FB] text-[#111111] pb-28 selection:bg-[var(--brand,#E23744)] selection:text-white"
      style={
        {
          '--brand': brandColor,
          '--brand-color': brandColor,
        } as React.CSSProperties
      }
    >
      <div className="max-w-md mx-auto relative bg-white min-h-screen border-x border-[#ECECEC] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {/* Top Header */}
        <MenuHeader
          restaurant={restaurant}
          tableNumber={tableNumber}
          tables={tables}
          onSelectTable={handleTableChange}
        />

        {/* Search Bar & Veg Only Toggle */}
        <div className="px-4 pt-3.5 pb-2.5 bg-white border-b border-[#F7F7F8]">
          <div className="flex items-center gap-2">
            {/* Search Input with search icon & clear button */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setSearchQuery('');
                }}
                placeholder="Search food or drinks..."
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                className="w-full h-11 bg-[#F7F7F8] border border-[#ECECEC] rounded-xl pl-10 pr-10 text-[15px] text-[#111111] placeholder-[#777777] focus:outline-none focus:border-[var(--brand,#E23744)] focus:bg-white transition-all shadow-inner/5"
                aria-label="Search menu items"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="w-9 h-9 rounded-full text-[#666666] hover:text-[#111111] hover:bg-[#ECECEC] absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center transition-colors active:scale-95"
                  aria-label="Clear search query"
                  title="Clear search"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}
            </div>

            {/* "Veg only" toggle button */}
            <button
              type="button"
              onClick={() => setVegOnly((prev) => !prev)}
              className={`h-11 px-3 rounded-xl border flex items-center gap-2 shrink-0 transition-all select-none active:scale-95 ${
                vegOnly
                  ? 'bg-[#F0FDF4] border-[#15803D] text-[#15803D] shadow-sm ring-1 ring-[#15803D]/20'
                  : 'bg-[#F7F7F8] border-[#ECECEC] text-[#555555] hover:border-[#D1D5DB]'
              }`}
              aria-pressed={vegOnly}
              aria-label="Filter vegetarian dishes only"
            >
              <VegBadge isVeg={true} size="sm" />
              <span className="text-[14px] font-semibold whitespace-nowrap">Veg only</span>
              {/* Visible switch pill */}
              <div
                className={`w-7 h-4 rounded-full p-0.5 transition-colors flex items-center ${
                  vegOnly ? 'bg-[#15803D]' : 'bg-[#D1D5DB]'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${
                    vegOnly ? 'translate-x-3' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Sticky Horizontal Category Tabs */}
        {categories.length > 0 && (
          <CategoryNav
            categories={categories}
            activeCategoryId={activeCategoryId}
            onSelectCategory={handleSelectCategory}
            brandColor={brandColor}
          />
        )}

        {/* Menu Items Sections */}
        <main className="px-4 py-4 space-y-6">
          {filteredCategories.length === 0 ? (
            <div className="py-16 text-center space-y-3 px-6 bg-[#F7F7F8] rounded-2xl border border-[#ECECEC]">
              <div className="w-12 h-12 rounded-full bg-white border border-[#ECECEC] flex items-center justify-center mx-auto text-[#666666]">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-[18px] font-bold text-[#111111]">No dishes found</h3>
              <p className="text-[14px] text-[#555555] max-w-xs mx-auto">
                No items match &quot;{searchQuery}&quot;
                {vegOnly ? ' with Veg only filter' : ''}.
              </p>
              {(searchQuery || vegOnly) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setVegOnly(false);
                  }}
                  className="h-11 px-5 rounded-xl bg-white border border-[#ECECEC] text-[#111111] text-[14px] font-bold hover:bg-[#F0F0F0] transition-colors shadow-sm active:scale-95"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            filteredCategories.map((category) => (
              <section
                key={category.id}
                ref={(el) => {
                  sectionRefs.current[category.id] = el;
                }}
                className="space-y-3 scroll-mt-32"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between pb-1 pt-2">
                  <h2 className="text-[22px] font-bold text-[#111111] tracking-tight flex items-center gap-2">
                    <span>{category.name}</span>
                    <span className="text-[13px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F7F7F8] border border-[#ECECEC] text-[#555555]">
                      {category.items.length}
                    </span>
                  </h2>
                </div>

                {/* Items in this category */}
                <div className="space-y-3">
                  {category.items.map((item) => {
                    const quantity = getItemQuantity(item.id);
                    return (
                      <ItemCard
                        key={item.id}
                        item={item}
                        currency={restaurant.currency}
                        quantity={quantity}
                        onAdd={() => addItem(item, 1)}
                        onRemove={() => updateQuantity(item.id, -1)}
                        brandColor={brandColor}
                      />
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </main>

        {/* Floating Cart Bar (appears when items in cart) */}
        <FloatingCartBar
          currency={restaurant.currency}
          brandColor={brandColor}
        />

        {/* Cart Drawer Modal */}
        <CartDrawer
          restaurantId={restaurant.id}
          tableId={activeTable.id}
          currency={restaurant.currency}
          brandColor={brandColor}
          acceptsOnlinePayment={restaurant.accepts_online_payment}
        />
      </div>
    </div>
  );
}
