'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/components/ui/Toast';
import { VegBadge } from '@/components/ui/VegBadge';
import { createOrder } from '@/lib/api';
import {
  X,
  Plus,
  Minus,
  Trash2,
  FileText,
  CreditCard,
  Banknote,
  Loader2,
  Check,
} from 'lucide-react';

interface CartDrawerProps {
  restaurantId: string;
  tableId: string;
  currency?: string;
  brandColor?: string;
  acceptsOnlinePayment?: boolean;
}

export function CartDrawer({
  restaurantId,
  tableId,
  currency = 'INR',
  brandColor = '#E23744',
  acceptsOnlinePayment = true,
}: CartDrawerProps) {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();

  const {
    restaurantSlug,
    tableNumber,
    items,
    updateQuantity,
    removeItem,
    updateItemNotes,
    clearCart,
    totalCount,
    subtotal,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    orderNotes,
    setOrderNotes,
    paymentMethod,
    setPaymentMethod,
    isDrawerOpen,
    closeDrawer,
  } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingNoteItemId, setEditingNoteItemId] = useState<string | null>(null);
  const [itemNoteText, setItemNoteText] = useState<string>('');

  if (!isDrawerOpen) return null;

  const currencySymbol = currency === 'INR' ? '₹' : currency;

  const handleOpenNote = (id: string, currentNote?: string) => {
    setEditingNoteItemId(id);
    setItemNoteText(currentNote || '');
  };

  const handleSaveNote = () => {
    if (editingNoteItemId) {
      updateItemNotes(editingNoteItemId, itemNoteText.trim());
      setEditingNoteItemId(null);
    }
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      toastError('Your cart is empty');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        restaurant_id: restaurantId,
        table_id: tableId,
        customer_name: customerName.trim() || null,
        customer_phone: customerPhone.trim() || null,
        payment_method: paymentMethod,
        notes: orderNotes.trim() || null,
        items: items.map((i) => ({
          menu_item_id: i.id,
          quantity: i.quantity,
        })),
      };

      const result = await createOrder(orderPayload);

      if (result && result.order) {
        toastSuccess('Order placed successfully!');
        clearCart();
        closeDrawer();
        router.push(`/order/${result.order.id}`);
      } else {
        toastError('Failed to place order. Please try again.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error placing order';
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={closeDrawer}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[#ECECEC] rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-[0_16px_36px_rgba(0,0,0,0.18)] animate-in slide-in-from-bottom-8 overflow-hidden"
      >
        {/* Header: "Your Order" with "Table 5" */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#ECECEC] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-[20px] font-bold text-[#111111]">Your Order</h2>
            <span className="text-[14px] font-bold px-3 py-1 rounded-full bg-[#F7F7F8] border border-[#ECECEC] text-[#111111]">
              Table {tableNumber || '1'}
            </span>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="w-10 h-10 rounded-full bg-[#F7F7F8] border border-[#ECECEC] text-[#555555] flex items-center justify-center hover:text-[#111111] hover:bg-[#ECECEC] transition-colors active:scale-95"
            aria-label="Close cart drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 no-scrollbar">
          {items.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#F7F7F8] border border-[#ECECEC] flex items-center justify-center mx-auto text-[#555555]">
                <Trash2 className="w-7 h-7" />
              </div>
              <p className="text-[16px] font-semibold text-[#111111]">Your cart is empty</p>
              <p className="text-[14px] text-[#555555]">Browse the menu to add delicious items!</p>
            </div>
          ) : (
            <>
              {/* Order Items List */}
              <div className="space-y-3">
                <div className="space-y-2.5">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-white border border-[#ECECEC] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Veg icon & item name */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <div className="pt-0.5">
                              <VegBadge isVeg={item.is_veg} size="sm" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-[16px] font-semibold text-[#111111] leading-snug">
                                {item.name}
                              </h4>
                              <div className="text-[14px] text-[#555555] mt-0.5">
                                {currencySymbol}{item.price} each
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Stepper (- 1 +) & Line Price */}
                        <div className="flex items-center gap-3 shrink-0">
                          {/* Stepper with min 44px tap target */}
                          <div className="flex items-center border border-[#ECECEC] rounded-lg bg-[#F7F7F8] overflow-hidden">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-10 h-10 flex items-center justify-center text-[#555555] hover:text-[#111111] hover:bg-[#EAEAEA] active:scale-95 transition-all"
                              aria-label={`Decrease ${item.name}`}
                            >
                              {item.quantity === 1 ? (
                                <Trash2 className="w-4 h-4 text-[#B91C1C]" />
                              ) : (
                                <Minus className="w-4 h-4 stroke-[2.5]" />
                              )}
                            </button>
                            <span className="w-8 text-center text-[15px] font-bold text-[#111111]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-10 h-10 flex items-center justify-center text-[#555555] hover:text-[#111111] hover:bg-[#EAEAEA] active:scale-95 transition-all"
                              aria-label={`Increase ${item.name}`}
                            >
                              <Plus className="w-4 h-4 stroke-[2.5]" />
                            </button>
                          </div>

                          {/* Line price */}
                          <div className="text-[16px] font-bold text-[#111111] min-w-[60px] text-right">
                            {currencySymbol}
                            {(item.price * item.quantity).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Item special instruction link */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#F0F0F0] text-[13px]">
                        {item.notes ? (
                          <span className="text-[#111111] truncate max-w-[75%] flex items-center gap-1.5 font-medium">
                            <FileText className="w-3.5 h-3.5 text-[#555555] shrink-0" />
                            Note: {item.notes}
                          </span>
                        ) : (
                          <span className="text-[#555555]">No special request</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenNote(item.id, item.notes)}
                          className="font-semibold text-[#111111] hover:underline"
                        >
                          {item.notes ? 'Edit' : '+ Add Note'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional Fields with Labels ABOVE inputs */}
              <div className="space-y-4 pt-1">
                {/* Customer Name */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="customer-name"
                    className="block text-[14px] font-bold text-[#111111]"
                  >
                    Your Name <span className="font-normal text-[#555555]">(Optional)</span>
                  </label>
                  <input
                    id="customer-name"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full h-12 bg-white border border-[#ECECEC] rounded-xl px-3.5 text-[15px] text-[#111111] placeholder-[#555555] focus:outline-none focus:border-[var(--brand,#E23744)] transition-colors"
                    maxLength={80}
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="customer-phone"
                    className="block text-[14px] font-bold text-[#111111]"
                  >
                    Phone Number <span className="font-normal text-[#555555]">(Optional)</span>
                  </label>
                  <input
                    id="customer-phone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full h-12 bg-white border border-[#ECECEC] rounded-xl px-3.5 text-[15px] text-[#111111] placeholder-[#555555] focus:outline-none focus:border-[var(--brand,#E23744)] transition-colors"
                    maxLength={15}
                  />
                </div>

                {/* Special Request */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="order-instructions"
                    className="block text-[14px] font-bold text-[#111111]"
                  >
                    Any special request? e.g. less spicy
                  </label>
                  <textarea
                    id="order-instructions"
                    rows={2}
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="e.g. Less spicy, bring water first, extra plates..."
                    className="w-full bg-white border border-[#ECECEC] rounded-xl p-3 text-[15px] text-[#111111] placeholder-[#555555] focus:outline-none focus:border-[var(--brand,#E23744)] transition-colors resize-none leading-relaxed"
                    maxLength={400}
                  />
                </div>
              </div>

              {/* Payment choice as two big selectable cards */}
              <div className="space-y-2 pt-1">
                <label className="block text-[14px] font-bold text-[#111111]">
                  Payment Method
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Card 1: Pay at counter */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('counter')}
                    className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all active:scale-[0.99] min-h-[58px] ${
                      paymentMethod === 'counter'
                        ? 'border-2 bg-white shadow-sm'
                        : 'border-[#ECECEC] bg-[#F7F7F8] hover:border-[#D1D5DB]'
                    }`}
                    style={{
                      borderColor:
                        paymentMethod === 'counter' ? 'var(--brand, #E23744)' : undefined,
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-[#F7F7F8] border border-[#ECECEC] flex items-center justify-center shrink-0 text-[#111111]">
                        <Banknote className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[15px] font-bold text-[#111111]">
                          Pay at counter
                        </div>
                        <div className="text-[13px] text-[#555555]">Cash or UPI after meal</div>
                      </div>
                    </div>

                    {paymentMethod === 'counter' && (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 ml-2"
                        style={{ backgroundColor: 'var(--brand, #E23744)' }}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </button>

                  {/* Card 2: Pay online */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('online')}
                    disabled={!acceptsOnlinePayment}
                    className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all active:scale-[0.99] min-h-[58px] ${
                      paymentMethod === 'online'
                        ? 'border-2 bg-white shadow-sm'
                        : 'border-[#ECECEC] bg-[#F7F7F8] hover:border-[#D1D5DB]'
                    } ${!acceptsOnlinePayment ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{
                      borderColor:
                        paymentMethod === 'online' ? 'var(--brand, #E23744)' : undefined,
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-[#F7F7F8] border border-[#ECECEC] flex items-center justify-center shrink-0 text-[#111111]">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[15px] font-bold text-[#111111]">Pay online</div>
                        <div className="text-[13px] text-[#555555]">UPI, GPay, Card</div>
                      </div>
                    </div>

                    {paymentMethod === 'online' && (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 ml-2"
                        style={{ backgroundColor: 'var(--brand, #E23744)' }}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Total Section: Item total, Total payable in large bold text */}
              <div className="p-4 bg-[#F7F7F8] border border-[#ECECEC] rounded-xl space-y-2">
                <div className="flex justify-between text-[15px] text-[#555555]">
                  <span>Item total</span>
                  <span className="font-semibold text-[#111111]">
                    {currencySymbol}{subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[15px] text-[#555555]">
                  <span>Taxes & charges</span>
                  <span className="text-[#15803D] font-semibold">Included</span>
                </div>
                <div className="pt-2 border-t border-[#ECECEC] flex items-center justify-between">
                  <span className="text-[17px] font-bold text-[#111111]">Total payable</span>
                  <span className="text-[22px] font-bold text-[#111111]">
                    {currencySymbol}{subtotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer: 56px tall Place Order button + Helper text */}
        {items.length > 0 && (
          <div className="p-4 border-t border-[#ECECEC] bg-white sticky bottom-0 space-y-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handlePlaceOrder}
              className="w-full h-[56px] rounded-xl text-white font-bold text-[17px] tracking-wide shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60"
              style={{
                backgroundColor: 'var(--brand, #E23744)',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Placing Order...</span>
                </>
              ) : (
                <span>
                  Place Order • {currencySymbol}{subtotal.toLocaleString()}
                </span>
              )}
            </button>

            {/* Helper text */}
            <p className="text-center text-[14px] text-[#555555] leading-snug">
              You can pay at the counter after your meal.
            </p>
          </div>
        )}

        {/* Edit Note Modal */}
        {editingNoteItemId && (
          <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-[#ECECEC] rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-xl">
              <h4 className="text-[17px] font-bold text-[#111111]">Special Request</h4>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Extra spicy, less oil, well done"
                value={itemNoteText}
                onChange={(e) => setItemNoteText(e.target.value)}
                className="w-full h-12 bg-white border border-[#ECECEC] rounded-xl px-3.5 text-[15px] text-[#111111] focus:outline-none focus:border-[var(--brand,#E23744)]"
                maxLength={120}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingNoteItemId(null)}
                  className="flex-1 h-11 rounded-xl bg-[#F7F7F8] border border-[#ECECEC] text-[#555555] font-semibold text-[14px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="flex-1 h-11 rounded-xl font-bold text-[14px] text-white"
                  style={{ backgroundColor: 'var(--brand, #E23744)' }}
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
