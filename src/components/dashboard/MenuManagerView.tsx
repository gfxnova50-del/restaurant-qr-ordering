'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Category, MenuItem } from '@/types/database';
import { MOCK_CATEGORIES, MOCK_MENU_ITEMS } from '@/lib/mockData';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { VegBadge } from '@/components/ui/VegBadge';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Check,
  X,
  Layers,
} from 'lucide-react';

export function MenuManagerView() {
  const { brandColor } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');

  // Modals state
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemFormData, setItemFormData] = useState({
    name: '',
    description: '',
    price: 250,
    category_id: '',
    is_veg: true,
    is_available: true,
    image_url: '',
  });

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catNameInput, setCatNameInput] = useState('');
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  // Load menu items and categories
  useEffect(() => {
    const load = async () => {
      try {
        if (isSupabaseConfigured()) {
          const supabase = createClient();
          const { data: catData } = await supabase.from('categories').select('*').order('sort_order');
          const { data: itemData } = await supabase.from('menu_items').select('*').order('sort_order');

          if (catData && catData.length > 0) setCategories(catData);
          if (itemData && itemData.length > 0) setMenuItems(itemData);
          return;
        }
      } catch (e) {
        console.warn('Supabase fetch failed:', e);
      }

      // Fallback local storage or mock
      const restaurantId = 'b0000000-0000-0000-0000-000000000001';
      setCategories(MOCK_CATEGORIES[restaurantId] || []);
      setMenuItems(MOCK_MENU_ITEMS[restaurantId] || []);
    };

    load();
  }, []);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat =
        selectedCategoryFilter === 'all' || item.category_id === selectedCategoryFilter;
      const matchQuery =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [menuItems, selectedCategoryFilter, searchQuery]);

  // Toggle Availability Switch
  const handleToggleAvailability = async (item: MenuItem) => {
    const updatedStatus = !item.is_available;
    setMenuItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_available: updatedStatus } : i))
    );

    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await (supabase.from('menu_items') as any)
          .update({ is_available: updatedStatus, updated_at: new Date().toISOString() })
          .eq('id', item.id);
      }
      toastSuccess(
        `${item.name} is now ${updatedStatus ? 'Available' : 'Marked Not Available'}`
      );
    } catch {
      toastError('Failed to update availability status');
    }
  };

  // Open Add/Edit Item modal
  const handleOpenItemModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setItemFormData({
        name: item.name,
        description: item.description || '',
        price: Number(item.price),
        category_id: item.category_id,
        is_veg: item.is_veg,
        is_available: item.is_available,
        image_url: item.image_url || '',
      });
    } else {
      setEditingItem(null);
      setItemFormData({
        name: '',
        description: '',
        price: 280,
        category_id: categories[0]?.id || '',
        is_veg: true,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80',
      });
    }
    setItemModalOpen(true);
  };

  // Save Item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemFormData.name.trim() || !itemFormData.category_id) {
      toastError('Please fill in Item Name and select a Category');
      return;
    }

    if (editingItem) {
      // Edit
      const updated = {
        ...editingItem,
        ...itemFormData,
        price: Number(itemFormData.price),
        updated_at: new Date().toISOString(),
      };
      setMenuItems((prev) => prev.map((i) => (i.id === editingItem.id ? updated : i)));
      toastSuccess('Item updated successfully');
    } else {
      // Add
      const newItem: MenuItem = {
        id: 'm-' + Math.random().toString(36).substring(2, 9),
        restaurant_id: 'b0000000-0000-0000-0000-000000000001',
        category_id: itemFormData.category_id,
        name: itemFormData.name.trim(),
        description: itemFormData.description.trim() || null,
        price: Number(itemFormData.price),
        image_url: itemFormData.image_url.trim() || null,
        is_veg: itemFormData.is_veg,
        is_available: itemFormData.is_available,
        sort_order: menuItems.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setMenuItems((prev) => [...prev, newItem]);
      toastSuccess('New item added to menu');
    }

    setItemModalOpen(false);
  };

  // Delete Item
  const handleDeleteItem = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}" from the menu?`)) {
      setMenuItems((prev) => prev.filter((i) => i.id !== id));
      toastSuccess(`"${name}" deleted`);
    }
  };

  // Add / Edit Category
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameInput.trim()) return;

    if (editingCat) {
      setCategories((prev) =>
        prev.map((c) => (c.id === editingCat.id ? { ...c, name: catNameInput.trim() } : c))
      );
      toastSuccess('Category updated');
    } else {
      const newCat: Category = {
        id: 'c-' + Math.random().toString(36).substring(2, 9),
        restaurant_id: 'b0000000-0000-0000-0000-000000000001',
        name: catNameInput.trim(),
        sort_order: categories.length + 1,
        created_at: new Date().toISOString(),
      };
      setCategories((prev) => [...prev, newCat]);
      toastSuccess('Category added');
    }

    setCatModalOpen(false);
    setEditingCat(null);
    setCatNameInput('');
  };

  // Delete Category
  const handleDeleteCategory = (id: string, name: string) => {
    const itemCount = menuItems.filter((i) => i.category_id === id).length;
    if (itemCount > 0) {
      toastError(`Cannot delete "${name}" because it still contains ${itemCount} items.`);
      return;
    }
    if (confirm(`Delete category "${name}"?`)) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toastSuccess(`Category "${name}" removed`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-[#111111] tracking-tight">
            Menu
          </h1>
          <p className="text-[14px] text-[#555555]">
            Manage dishes, categories, and item availability
          </p>
        </div>

        {/* Tab & Add Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-white border border-[#ECECEC] rounded-xl p-1 flex shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab('items')}
              className={`px-3.5 py-1.5 rounded-lg text-[13px] font-bold transition-all ${
                activeTab === 'items'
                  ? 'text-white shadow-sm'
                  : 'text-[#555555] hover:text-[#111111]'
              }`}
              style={{
                backgroundColor: activeTab === 'items' ? 'var(--brand, #E23744)' : undefined,
              }}
            >
              Dishes ({menuItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className={`px-3.5 py-1.5 rounded-lg text-[13px] font-bold transition-all ${
                activeTab === 'categories'
                  ? 'text-white shadow-sm'
                  : 'text-[#555555] hover:text-[#111111]'
              }`}
              style={{
                backgroundColor:
                  activeTab === 'categories' ? 'var(--brand, #E23744)' : undefined,
              }}
            >
              Categories ({categories.length})
            </button>
          </div>

          {activeTab === 'items' ? (
            <button
              type="button"
              onClick={() => handleOpenItemModal()}
              className="h-11 px-4 rounded-xl text-white font-bold text-[14px] flex items-center gap-2 shadow-sm active:scale-95 transition-all hover:brightness-105"
              style={{ backgroundColor: 'var(--brand, #E23744)' }}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add item</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingCat(null);
                setCatNameInput('');
                setCatModalOpen(true);
              }}
              className="h-11 px-4 rounded-xl text-white font-bold text-[14px] flex items-center gap-2 shadow-sm active:scale-95 transition-all hover:brightness-105"
              style={{ backgroundColor: 'var(--brand, #E23744)' }}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add category</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'items' && (
        <div className="space-y-4">
          {/* Search Bar & Category Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#555555] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search dish by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 bg-white border border-[#ECECEC] rounded-xl pl-10 pr-4 text-[15px] text-[#111111] placeholder-[#555555] focus:outline-none focus:border-[var(--brand,#E23744)] transition-colors"
              />
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('all')}
                className={`h-10 px-3.5 rounded-xl text-[13px] font-bold shrink-0 transition-all border ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-white text-[#555555] border-[#ECECEC] hover:border-[#D1D5DB]'
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(c.id)}
                  className={`h-10 px-3.5 rounded-xl text-[13px] font-bold shrink-0 transition-all border ${
                    selectedCategoryFilter === c.id
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'bg-white text-[#555555] border-[#ECECEC] hover:border-[#D1D5DB]'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Simple List with image, name, price, availability switch, edit and delete icons */}
          <div className="bg-white border border-[#ECECEC] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] divide-y divide-[#ECECEC] overflow-hidden">
            {filteredItems.length === 0 ? (
              <div className="py-16 text-center text-[#555555] space-y-2">
                <p className="text-[16px] font-semibold text-[#111111]">No dishes found</p>
                <p className="text-[14px]">Try a different search or add a new item</p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const catName =
                  categories.find((c) => c.id === item.category_id)?.name || 'General';

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-colors ${
                      item.is_available ? 'bg-white' : 'bg-[#FAFAFA]'
                    }`}
                  >
                    {/* Left: Thumbnail image, veg dot, name, category, price */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Square image 48x48 rounded 10px */}
                      <div className="w-12 h-12 rounded-[10px] overflow-hidden bg-[#F7F7F8] border border-[#ECECEC] shrink-0">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className={`w-full h-full object-cover ${
                              item.is_available ? '' : 'grayscale'
                            }`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#888888]">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      {/* Name & price */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <VegBadge isVeg={item.is_veg} size="sm" />
                          <h3
                            className={`text-[16px] font-bold truncate leading-snug ${
                              item.is_available ? 'text-[#111111]' : 'text-[#6B6B6B] line-through'
                            }`}
                          >
                            {item.name}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 text-[14px] mt-0.5">
                          <span className="font-bold text-[#111111]">
                            ₹{Number(item.price).toLocaleString()}
                          </span>
                          <span className="text-[#888888]">•</span>
                          <span className="text-[12px] font-semibold text-[#555555] bg-[#F7F7F8] px-2 py-0.5 rounded border border-[#ECECEC]">
                            {catName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Availability switch, edit & delete buttons */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#F0F0F0]">
                      {/* Availability Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(item)}
                        className={`h-10 px-3 rounded-xl border flex items-center gap-2 text-[13px] font-bold transition-all min-w-[124px] justify-between ${
                          item.is_available
                            ? 'bg-[#F0FDF4] border-[#DCFCE7] text-[#15803D]'
                            : 'bg-[#F3F4F6] border-[#E5E7EB] text-[#374151]'
                        }`}
                        title="Toggle availability"
                        aria-label={`Toggle availability for ${item.name}. Currently ${
                          item.is_available ? 'Available' : 'Not available'
                        }`}
                      >
                        <span>{item.is_available ? 'Available' : 'Sold Out'}</span>
                        {/* Switch indicator */}
                        <div
                          className={`w-7 h-4 rounded-full p-0.5 transition-colors flex items-center ${
                            item.is_available ? 'bg-[#15803D]' : 'bg-[#9CA3AF]'
                          }`}
                        >
                          <div
                            className={`w-3 h-3 rounded-full bg-white transition-transform ${
                              item.is_available ? 'translate-x-3' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </button>

                      {/* Edit Icon Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenItemModal(item)}
                        className="w-10 h-10 rounded-xl bg-[#F7F7F8] border border-[#ECECEC] text-[#555555] hover:text-[#111111] hover:bg-[#EAEAEA] flex items-center justify-center active:scale-95 transition-all"
                        title="Edit dish"
                        aria-label={`Edit ${item.name}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete Icon Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id, item.name)}
                        className="w-10 h-10 rounded-xl bg-[#F7F7F8] border border-[#ECECEC] text-[#555555] hover:text-[#B91C1C] hover:bg-[#FEF2F2] hover:border-[#FEE2E2] flex items-center justify-center active:scale-95 transition-all"
                        title="Delete dish"
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div className="bg-white border border-[#ECECEC] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] divide-y divide-[#ECECEC] overflow-hidden">
          {categories.map((cat, idx) => {
            const count = menuItems.filter((i) => i.category_id === cat.id).length;
            return (
              <div
                key={cat.id}
                className="p-4 flex items-center justify-between gap-3 bg-white hover:bg-[#F7F7F8] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[#F7F7F8] border border-[#ECECEC] text-[#555555] font-bold text-[13px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="text-[16px] font-bold text-[#111111]">{cat.name}</h3>
                    <p className="text-[13px] text-[#555555]">{count} dishes in category</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCat(cat);
                      setCatNameInput(cat.name);
                      setCatModalOpen(true);
                    }}
                    className="w-10 h-10 rounded-xl bg-[#F7F7F8] border border-[#ECECEC] text-[#555555] hover:text-[#111111] flex items-center justify-center"
                    title="Edit category"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    className="w-10 h-10 rounded-xl bg-[#F7F7F8] border border-[#ECECEC] text-[#555555] hover:text-[#B91C1C] flex items-center justify-center"
                    title="Delete category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dish Modal: Clean form with labels ABOVE fields */}
      {itemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-[#ECECEC] rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-[0_16px_36px_rgba(0,0,0,0.18)] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#ECECEC]">
              <h2 className="text-[18px] font-bold text-[#111111]">
                {editingItem ? 'Edit Dish' : 'Add New Dish'}
              </h2>
              <button
                type="button"
                onClick={() => setItemModalOpen(false)}
                className="w-10 h-10 rounded-full bg-[#F7F7F8] border border-[#ECECEC] text-[#555555] flex items-center justify-center hover:text-[#111111]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveItem} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Dish Name */}
              <div className="space-y-1.5">
                <label className="block text-[14px] font-bold text-[#111111]">
                  Dish Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paneer Butter Masala"
                  value={itemFormData.name}
                  onChange={(e) =>
                    setItemFormData({ ...itemFormData, name: e.target.value })
                  }
                  className="w-full h-12 bg-white border border-[#ECECEC] rounded-xl px-3.5 text-[15px] text-[#111111] placeholder-[#555555] focus:outline-none focus:border-[var(--brand,#E23744)]"
                />
              </div>

              {/* Category & Price in 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-[14px] font-bold text-[#111111]">
                    Category *
                  </label>
                  <select
                    value={itemFormData.category_id}
                    onChange={(e) =>
                      setItemFormData({ ...itemFormData, category_id: e.target.value })
                    }
                    className="w-full h-12 bg-white border border-[#ECECEC] rounded-xl px-3 text-[15px] text-[#111111] focus:outline-none focus:border-[var(--brand,#E23744)]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[14px] font-bold text-[#111111]">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="250"
                    value={itemFormData.price}
                    onChange={(e) =>
                      setItemFormData({ ...itemFormData, price: Number(e.target.value) })
                    }
                    className="w-full h-12 bg-white border border-[#ECECEC] rounded-xl px-3.5 text-[15px] text-[#111111] focus:outline-none focus:border-[var(--brand,#E23744)]"
                  />
                </div>
              </div>

              {/* Food Type: Veg / Non-Veg */}
              <div className="space-y-1.5">
                <label className="block text-[14px] font-bold text-[#111111]">
                  Food Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setItemFormData({ ...itemFormData, is_veg: true })}
                    className={`h-12 rounded-xl border flex items-center justify-center gap-2 font-bold text-[14px] transition-all ${
                      itemFormData.is_veg
                        ? 'border-[#15803D] bg-[#F0FDF4] text-[#15803D]'
                        : 'border-[#ECECEC] bg-white text-[#555555]'
                    }`}
                  >
                    <VegBadge isVeg={true} size="sm" />
                    <span>Vegetarian</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setItemFormData({ ...itemFormData, is_veg: false })}
                    className={`h-12 rounded-xl border flex items-center justify-center gap-2 font-bold text-[14px] transition-all ${
                      !itemFormData.is_veg
                        ? 'border-[#B91C1C] bg-[#FEF2F2] text-[#B91C1C]'
                        : 'border-[#ECECEC] bg-white text-[#555555]'
                    }`}
                  >
                    <VegBadge isVeg={false} size="sm" />
                    <span>Non-Veg</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-[14px] font-bold text-[#111111]">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Short description of ingredients and preparation..."
                  value={itemFormData.description}
                  onChange={(e) =>
                    setItemFormData({ ...itemFormData, description: e.target.value })
                  }
                  className="w-full bg-white border border-[#ECECEC] rounded-xl p-3 text-[14px] text-[#111111] placeholder-[#555555] focus:outline-none focus:border-[var(--brand,#E23744)] resize-none"
                  maxLength={300}
                />
              </div>

              {/* Image URL */}
              <div className="space-y-1.5">
                <label className="block text-[14px] font-bold text-[#111111]">
                  Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={itemFormData.image_url}
                  onChange={(e) =>
                    setItemFormData({ ...itemFormData, image_url: e.target.value })
                  }
                  className="w-full h-12 bg-white border border-[#ECECEC] rounded-xl px-3.5 text-[14px] text-[#111111] placeholder-[#555555] focus:outline-none focus:border-[var(--brand,#E23744)]"
                />
              </div>

              {/* Availability */}
              <div className="flex items-center justify-between p-3.5 bg-[#F7F7F8] border border-[#ECECEC] rounded-xl">
                <div>
                  <span className="block text-[14px] font-bold text-[#111111]">Available for order</span>
                  <span className="text-[12px] text-[#555555]">Customers can add this item right away</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setItemFormData({
                      ...itemFormData,
                      is_available: !itemFormData.is_available,
                    })
                  }
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors flex items-center ${
                    itemFormData.is_available ? 'bg-[#15803D]' : 'bg-[#D1D5DB]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      itemFormData.is_available ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Submit Button (min 52px) */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-[52px] rounded-xl text-white font-bold text-[16px] shadow-sm active:scale-[0.98] transition-all hover:brightness-105"
                  style={{ backgroundColor: 'var(--brand, #E23744)' }}
                >
                  {editingItem ? 'Save Changes' : 'Add Item to Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#ECECEC] rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <h3 className="text-[18px] font-bold text-[#111111]">
              {editingCat ? 'Edit Category' : 'Add New Category'}
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[14px] font-bold text-[#111111]">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Starters, Main Course, Drinks"
                  value={catNameInput}
                  onChange={(e) => setCatNameInput(e.target.value)}
                  className="w-full h-12 bg-white border border-[#ECECEC] rounded-xl px-3.5 text-[15px] text-[#111111] focus:outline-none focus:border-[var(--brand,#E23744)]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="flex-1 h-12 rounded-xl bg-[#F7F7F8] border border-[#ECECEC] text-[#555555] font-semibold text-[14px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-12 rounded-xl text-white font-bold text-[14px]"
                  style={{ backgroundColor: 'var(--brand, #E23744)' }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
