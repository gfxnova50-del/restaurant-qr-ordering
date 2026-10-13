'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { OrderWithDetails, OrderStatus } from '@/types/database';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { fetchOrderById } from '@/lib/api';
import confetti from 'canvas-confetti';
import {
  Check,
  RotateCcw,
  Plus,
  ArrowLeft,
  AlertCircle,
  Receipt,
} from 'lucide-react';

interface OrderTrackingViewProps {
  initialOrder: OrderWithDetails;
}

const STEPS: Array<{
  status: OrderStatus;
  label: string;
  desc: string;
}> = [
  {
    status: 'received',
    label: 'Received',
    desc: 'Order sent to the kitchen',
  },
  {
    status: 'preparing',
    label: 'Preparing',
    desc: 'Chef is cooking your fresh dishes',
  },
  {
    status: 'ready',
    label: 'Ready',
    desc: 'Ready and on the way to your table',
  },
  {
    status: 'served',
    label: 'Served',
    desc: 'Delivered to your table. Enjoy your meal!',
  },
];

const STATUS_HEADINGS: Record<OrderStatus, string> = {
  received: 'Your order has been received',
  preparing: 'Your order is being prepared',
  ready: 'Your order is ready to serve',
  served: 'Your order has been served',
  cancelled: 'Your order was cancelled',
};

const STATUS_INDEX: Record<OrderStatus, number> = {
  received: 0,
  preparing: 1,
  ready: 2,
  served: 3,
  cancelled: -1,
};

export function OrderTrackingView({ initialOrder }: OrderTrackingViewProps) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderWithDetails>(initialOrder);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentStepIndex = STATUS_INDEX[order.status] ?? 0;
  const isCancelled = order.status === 'cancelled';

  const triggerCelebration = useCallback(() => {
    try {
      confetti({
        particleCount: 60,
        spread: 55,
        origin: { y: 0.65 },
        colors: ['#E23744', '#15803D', '#2563EB', '#C2410C'],
      });
    } catch {}
  }, []);

  // Fire confetti once on ready or served
  useEffect(() => {
    if (order.status === 'ready' || order.status === 'served') {
      triggerCelebration();
    }
  }, [order.status, triggerCelebration]);

  const refreshOrder = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetchOrderById(order.id);
      if (res && res.order) {
        setOrder(res.order);
      }
    } catch (e) {
      console.warn('Refresh error:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, [order.id]);

  // Connection state for mobile flaky networks
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting'>('connected');

  // Subscribe to Supabase Realtime AND fallback polling / local events
  useEffect(() => {
    let channel: any = null;

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        channel = supabase
          .channel(`order_tracking_${order.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'orders',
              filter: `id=eq.${order.id}`,
            },
            (payload) => {
              if (payload.new) {
                setOrder((prev) => ({
                  ...prev,
                  ...(payload.new as any),
                }));
                if (payload.new.status === 'ready' || payload.new.status === 'served') {
                  triggerCelebration();
                }
              }
            }
          )
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              setConnectionStatus('connected');
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              setConnectionStatus('reconnecting');
            }
          });
      } catch (err) {
        console.warn('Realtime subscription error:', err);
      }
    }

    // Local custom event listener for offline/mock updates
    const handleLocalUpdate = (e: any) => {
      if (e.detail?.id === order.id) {
        setOrder((prev) => ({
          ...prev,
          status: e.detail.status,
        }));
        if (e.detail.status === 'ready' || e.detail.status === 'served') {
          triggerCelebration();
        }
      }
    };
    window.addEventListener('qrmenu_order_status_updated', handleLocalUpdate);

    const handleOnline = () => {
      setConnectionStatus('connected');
      refreshOrder();
    };
    const handleOffline = () => {
      setConnectionStatus('reconnecting');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Active live polling every 2 seconds so customer phone tracks kitchen updates in real time
    const interval = setInterval(() => {
      refreshOrder();
    }, 2000);

    return () => {
      if (channel) {
        try {
          const supabase = createClient();
          supabase.removeChannel(channel);
        } catch {}
      }
      window.removeEventListener('qrmenu_order_status_updated', handleLocalUpdate);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [order.id, refreshOrder, triggerCelebration]);

  const currencySymbol =
    order.restaurant?.currency === 'INR' || !order.restaurant?.currency
      ? '₹'
      : order.restaurant.currency;
  const restaurantSlug = order.restaurant?.slug || 'spice-garden';
  const tableNumber = order.table?.table_number || '1';

  // Format time placed
  const formattedTime = new Date(order.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-white text-[#111111] pb-24 selection:bg-[var(--brand,#E23744)] selection:text-white">
      <div className="max-w-md mx-auto min-h-screen bg-white border-x border-[#ECECEC] px-4 py-4 space-y-6">
        {/* Reconnecting banner for flaky mobile/Wi-Fi connection */}
        {connectionStatus === 'reconnecting' && (
          <div className="flex items-center justify-center gap-2 p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold animate-pulse">
            <RotateCcw className="w-3.5 h-3.5 animate-spin text-amber-700" />
            <span>Reconnecting to live kitchen feed...</span>
          </div>
        )}
        {/* Navigation Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#ECECEC]">
          <button
            type="button"
            onClick={() => router.push(`/r/${restaurantSlug}?table=${tableNumber}`)}
            className="flex items-center gap-1.5 text-[15px] font-semibold text-[#555555] hover:text-[#111111] transition-colors p-1"
          >
            <ArrowLeft className="w-5 h-5 text-[#555555]" />
            <span>Menu</span>
          </button>

          {/* Small "Live" green dot to show page auto-updates */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F0FDF4] border border-[#DCFCE7] text-[13px] font-bold text-[#15803D]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#15803D] animate-ping" />
            <span>Live</span>
          </div>

          <button
            type="button"
            onClick={refreshOrder}
            disabled={isRefreshing}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F7F7F8] border border-[#ECECEC] text-[#555555] hover:text-[#111111] active:scale-95 transition-all disabled:opacity-50"
            title="Refresh Status"
            aria-label="Refresh Order Status"
          >
            <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[var(--brand,#E23744)]' : ''}`} />
          </button>
        </div>

        {/* Large Friendly Status Heading: 26px bold */}
        <div className="space-y-1.5 pt-1">
          <h1 className="text-[26px] font-bold text-[#111111] leading-tight tracking-tight">
            {STATUS_HEADINGS[order.status] || 'Order Status'}
          </h1>
          <p className="text-[15px] text-[#555555]">
            {isCancelled
              ? 'This order has been cancelled by the restaurant.'
              : STEPS[currentStepIndex]?.desc || 'Tracking your order live'}
          </p>
        </div>

        {/* Vertical Stepper with 4 steps */}
        {!isCancelled ? (
          <div className="bg-[#F7F7F8] border border-[#ECECEC] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="relative space-y-6">
              {STEPS.map((step, idx) => {
                const isCompleted = currentStepIndex > idx;
                const isCurrent = currentStepIndex === idx;
                const isFuture = currentStepIndex < idx;

                return (
                  <div key={step.status} className="relative flex items-start gap-4">
                    {/* Connecting vertical line */}
                    {idx < STEPS.length - 1 && (
                      <div
                        className={`absolute left-[15px] top-8 w-[2px] h-[calc(100%+8px)] transition-colors duration-300 ${
                          currentStepIndex > idx ? 'bg-[#15803D]' : 'bg-[#E5E7EB]'
                        }`}
                      />
                    )}

                    {/* Step Icon Node */}
                    <div
                      className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isCompleted
                          ? 'bg-[#15803D] text-white shadow-sm'
                          : isCurrent
                          ? 'bg-white border-2 border-[#15803D] shadow-sm'
                          : 'bg-[#E5E7EB] text-[#888888]'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : isCurrent ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#15803D] animate-ping" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-[#9CA3AF]" />
                      )}
                    </div>

                    {/* Step Details */}
                    <div className="flex-1 pt-0.5 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[16px] leading-tight ${
                            isCurrent
                              ? 'text-[#111111] font-bold'
                              : isCompleted
                              ? 'text-[#111111] font-semibold'
                              : 'text-[#6B6B6B] font-medium'
                          }`}
                        >
                          {step.label}
                        </span>

                        {isCurrent && (
                          <span className="text-[12px] font-bold text-[#15803D] bg-[#F0FDF4] border border-[#DCFCE7] px-2.5 py-0.5 rounded-full">
                            In progress
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[14px] mt-0.5 ${
                          isCurrent
                            ? 'text-[#555555]'
                            : isCompleted
                            ? 'text-[#555555]'
                            : 'text-[#888888]'
                        }`}
                      >
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-2xl p-5 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-[#B91C1C] mx-auto" />
            <h3 className="text-[18px] font-bold text-[#B91C1C]">Order Cancelled</h3>
            <p className="text-[14px] text-[#555555]">
              Please speak with your waiter or counter staff for assistance.
            </p>
          </div>
        )}

        {/* Order Details: Order number, Table number, Time placed, Items, Total */}
        <div className="bg-white border border-[#ECECEC] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] space-y-4">
          {/* Header row */}
          <div className="flex items-center justify-between pb-3 border-b border-[#ECECEC]">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#555555]" />
              <span className="font-bold text-[16px] text-[#111111]">Order Details</span>
            </div>
            <span
              className={`text-[12px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                order.payment_status === 'paid'
                  ? 'bg-[#F0FDF4] border-[#DCFCE7] text-[#15803D]'
                  : 'bg-[#FFF7ED] border-[#FFEDD5] text-[#C2410C]'
              }`}
            >
              {order.payment_status === 'paid' ? 'Paid Online' : 'Pay at Counter'}
            </span>
          </div>

          {/* Meta rows: Order #, Table #, Time placed */}
          <div className="grid grid-cols-3 gap-2 py-1 text-center bg-[#F7F7F8] rounded-xl p-3 border border-[#ECECEC]">
            <div>
              <span className="block text-[12px] text-[#555555]">Order No.</span>
              <span className="text-[14px] font-bold text-[#111111] font-mono">
                #{order.id.slice(-5).toUpperCase()}
              </span>
            </div>
            <div>
              <span className="block text-[12px] text-[#555555]">Table</span>
              <span className="text-[14px] font-bold text-[#111111]">
                Table {tableNumber}
              </span>
            </div>
            <div>
              <span className="block text-[12px] text-[#555555]">Time Placed</span>
              <span className="text-[14px] font-bold text-[#111111]">
                {formattedTime}
              </span>
            </div>
          </div>

          {/* List of items */}
          <div className="space-y-2.5 pt-1">
            <span className="text-[14px] font-bold text-[#555555] block">Items</span>
            {order.order_items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-[15px]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-[#111111] w-6 shrink-0">
                    {item.quantity}×
                  </span>
                  <span className="text-[#111111] truncate">{item.name_snapshot}</span>
                </div>
                <span className="font-bold text-[#111111] shrink-0 ml-2">
                  {currencySymbol}
                  {(item.price_snapshot * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Special notes if any */}
          {order.notes && (
            <div className="p-3 bg-[#FEFCE8] rounded-xl border border-[#FEF08A] text-[14px] text-[#854D0E]">
              <span className="font-bold block mb-0.5">Special Request:</span>
              <p>{order.notes}</p>
            </div>
          )}

          {/* Total row: 17px bold */}
          <div className="pt-3 border-t border-[#ECECEC] flex items-center justify-between">
            <span className="text-[16px] font-bold text-[#111111]">Total Amount</span>
            <span className="text-[20px] font-bold text-[#111111]">
              {currencySymbol}
              {Number(order.total_amount).toLocaleString()}
            </span>
          </div>
        </div>

        {/* "Add more items" button (outlined) at the bottom */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => router.push(`/r/${restaurantSlug}?table=${tableNumber}`)}
            className="w-full h-12 rounded-xl bg-white border-2 text-[15px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-neutral-50 shadow-sm"
            style={{
              borderColor: 'var(--brand, #E23744)',
              color: 'var(--brand, #E23744)',
            }}
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>Add more items</span>
          </button>
        </div>
      </div>
    </div>
  );
}
