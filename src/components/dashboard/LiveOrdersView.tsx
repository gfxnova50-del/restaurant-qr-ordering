'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { OrderWithDetails, OrderStatus } from '@/types/database';
import { getLocalOrders, updateOrderStatus } from '@/lib/api';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { orderNotifier } from '@/lib/audio';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import {
  Clock,
  ChefHat,
  Bell,
  CheckCircle2,
  RefreshCw,
  User,
  Phone,
  FileText,
  ArrowRight,
  Check,
  Ban,
  Sparkles,
  Volume2,
  VolumeX,
  Sun,
  Download,
  AlertTriangle,
  Smartphone,
} from 'lucide-react';

export function LiveOrdersView() {
  const { toast, success: toastSuccess, error: toastError } = useToast();
  const { brandColor } = useAuth();

  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [highlightedOrderIds, setHighlightedOrderIds] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<OrderStatus>('received');

  // Mobile / PWA States
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isWakeLocked, setIsWakeLocked] = useState(false);
  const [wakeLockSupported, setWakeLockSupported] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting'>('connected');
  const wakeLockRef = useRef<any>(null);

  // Check Wake Lock support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
      setWakeLockSupported(true);
    }
  }, []);

  // Handle Wake Lock toggle to keep tablet/phone awake during shifts
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        const lock = await (navigator as any).wakeLock.request('screen');
        wakeLockRef.current = lock;
        setIsWakeLocked(true);
        lock.addEventListener('release', () => {
          setIsWakeLocked(false);
        });
        toast('Screen will stay awake during shifts', 'success');
      }
    } catch (err) {
      console.warn('Wake Lock request error:', err);
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsWakeLocked(false);
        toast('Screen sleep returned to normal', 'info');
      } catch {}
    }
  };

  const toggleWakeLock = () => {
    if (isWakeLocked) {
      releaseWakeLock();
    } else {
      requestWakeLock();
    }
  };

  // Re-request wake lock on page visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (wakeLockRef.current !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // PWA Install prompt listener
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // iOS Safari detection
    if (typeof window !== 'undefined') {
      const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
      const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;
      if (isIos && !isStandalone) {
        setShowIosPrompt(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredInstallPrompt(null);
        toast('App installed to your device!', 'success');
      }
    }
  };

  // Enable Sound handler (user must tap once so browser allows audio)
  const toggleSound = () => {
    orderNotifier.init();
    if (!soundEnabled) {
      orderNotifier.setSoundEnabled(true);
      orderNotifier.playNewOrderAlert();
      setSoundEnabled(true);
      toast('Sound enabled! Kitchen chimes will ring on new orders.', 'success');
    } else {
      orderNotifier.setSoundEnabled(false);
      setSoundEnabled(false);
      toast('Sound muted.', 'info');
    }
  };

  // Network connection monitor
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus('connected');
      loadOrders();
    };
    const handleOffline = () => {
      setConnectionStatus('reconnecting');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const previousOrdersRef = useRef<Record<string, OrderStatus>>({});
  const isInitialLoadRef = useRef(true);

  // Load live orders from server (works across phones and laptops)
  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.orders)) {
          const serverOrders: OrderWithDetails[] = data.orders;

          // Detect new incoming orders from phone
          if (!isInitialLoadRef.current) {
            for (const ord of serverOrders) {
              if (ord.status === 'received' && !previousOrdersRef.current[ord.id]) {
                orderNotifier.playNewOrderAlert();
                setHighlightedOrderIds((prev) => new Set([...prev, ord.id]));
                toast(`New Order from Table ${ord.table?.table_number || '1'}!`, 'info');
                setTimeout(() => {
                  setHighlightedOrderIds((prev) => {
                    const next = new Set(prev);
                    next.delete(ord.id);
                    return next;
                  });
                }, 12000);
              }
            }
          }

          const map: Record<string, OrderStatus> = {};
          serverOrders.forEach((o) => {
            map[o.id] = o.status;
          });
          previousOrdersRef.current = map;
          isInitialLoadRef.current = false;

          setOrders(serverOrders);
          if (!silent) setIsRefreshing(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not fetch orders from API:', e);
    }

    // Fallback to local / mock orders
    const local = getLocalOrders();
    setOrders([...local]);
    if (!silent) setIsRefreshing(false);
  }, [toast]);

  // Initial load and active background poll every 2.5s
  useEffect(() => {
    loadOrders(false);
    const interval = setInterval(() => {
      loadOrders(true);
    }, 2500);
    return () => clearInterval(interval);
  }, [loadOrders]);

  // Handle new incoming order (gentle highlight animation plus sound)
  const handleIncomingOrder = useCallback((newOrder: OrderWithDetails) => {
    // 1. Play sound
    orderNotifier.playNewOrderAlert();

    // 2. Add highlight animation
    setHighlightedOrderIds((prev) => new Set([...prev, newOrder.id]));

    // 3. Add to orders list
    setOrders((prev) => {
      const exists = prev.some((o) => o.id === newOrder.id);
      if (exists) {
        return prev.map((o) => (o.id === newOrder.id ? newOrder : o));
      }
      return [newOrder, ...prev];
    });

    toast(`New Order from Table ${newOrder.table?.table_number || '1'}!`, 'info');

    // Remove flash highlight after 14 seconds
    setTimeout(() => {
      setHighlightedOrderIds((prev) => {
        const next = new Set(prev);
        next.delete(newOrder.id);
        return next;
      });
    }, 14000);
  }, [toast]);

  // Listen to Supabase Realtime & custom browser events
  useEffect(() => {
    let channel: any = null;

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        channel = supabase
          .channel('owner_dashboard_orders')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'orders' },
            async (payload) => {
              if (payload.new) {
                loadOrders();
                orderNotifier.playNewOrderAlert();
                setHighlightedOrderIds((prev) => new Set([...prev, payload.new.id]));
              }
            }
          )
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'orders' },
            (payload) => {
              if (payload.new) {
                setOrders((prev) =>
                  prev.map((ord) =>
                    ord.id === payload.new.id ? { ...ord, ...(payload.new as any) } : ord
                  )
                );
              }
            }
          )
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              setConnectionStatus('connected');
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              setConnectionStatus('reconnecting');
              setTimeout(() => {
                loadOrders();
              }, 3000);
            }
          });
      } catch (e) {
        console.warn('Realtime subscribe error:', e);
      }
    }

    const onOrderCreated = (e: any) => {
      if (e.detail) {
        handleIncomingOrder(e.detail);
      }
    };

    const onOrderStatusUpdated = (e: any) => {
      if (e.detail) {
        setOrders((prev) =>
          prev.map((o) => (o.id === e.detail.id ? { ...o, status: e.detail.status } : o))
        );
      }
    };

    window.addEventListener('qrmenu_order_created', onOrderCreated);
    window.addEventListener('qrmenu_order_status_updated', onOrderStatusUpdated);

    return () => {
      if (channel) {
        try {
          const supabase = createClient();
          supabase.removeChannel(channel);
        } catch {}
      }
      window.removeEventListener('qrmenu_order_created', onOrderCreated);
      window.removeEventListener('qrmenu_order_status_updated', onOrderStatusUpdated);
    };
  }, [handleIncomingOrder, loadOrders]);

  // Status transition handler
  const handleMoveStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setHighlightedOrderIds((prev) => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );

    try {
      await updateOrderStatus(orderId, nextStatus);
      toastSuccess(`Order moved to ${nextStatus.toUpperCase()}`);
    } catch {
      toastError('Failed to update status');
      loadOrders();
    }
  };

  // Helper to simulate incoming customer order for testing
  const handleSimulateNewOrder = () => {
    const randomTable = Math.floor(Math.random() * 6) + 1;
    const testOrder: OrderWithDetails = {
      id: 'ord-sim-' + Math.random().toString(36).substring(2, 7),
      restaurant_id: 'b0000000-0000-0000-0000-000000000001',
      table_id: `t${randomTable}`,
      customer_name: ['Karan Sharma', 'Pooja Verma', 'Amit Patel', 'Sneha Roy'][
        Math.floor(Math.random() * 4)
      ],
      customer_phone: '+91 98' + Math.floor(10000000 + Math.random() * 90000000),
      status: 'received',
      payment_status: Math.random() > 0.5 ? 'paid' : 'pending',
      payment_method: Math.random() > 0.5 ? 'online' : 'counter',
      total_amount: Math.floor(Math.random() * 400 + 200),
      notes: Math.random() > 0.4 ? 'Less spicy, extra napkins please!' : null,
      razorpay_order_id: null,
      razorpay_payment_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      table: {
        id: `t${randomTable}`,
        restaurant_id: 'b0000000-0000-0000-0000-000000000001',
        table_number: String(randomTable),
        created_at: new Date().toISOString(),
      },
      order_items: [
        {
          id: 'oi-sim-1',
          order_id: 'ord-sim-test',
          menu_item_id: 'm01',
          name_snapshot: 'Paneer Butter Masala',
          price_snapshot: 280,
          quantity: 2,
          created_at: new Date().toISOString(),
        },
        {
          id: 'oi-sim-2',
          order_id: 'ord-sim-test',
          menu_item_id: 'm08',
          name_snapshot: 'Butter Tandoori Roti',
          price_snapshot: 35,
          quantity: 4,
          created_at: new Date().toISOString(),
        },
      ],
    };

    handleIncomingOrder(testOrder);
  };

  // 4 columns definitions with status colors
  const kanbanColumns: Array<{
    status: OrderStatus;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    pillClass: string;
    nextLabel?: string;
    nextStatus?: OrderStatus;
  }> = [
    {
      status: 'received',
      title: 'New',
      icon: Clock,
      pillClass: 'bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]',
      nextLabel: 'Start Preparing',
      nextStatus: 'preparing',
    },
    {
      status: 'preparing',
      title: 'Preparing',
      icon: ChefHat,
      pillClass: 'bg-[#FFF7ED] text-[#C2410C] border-[#FFEDD5]',
      nextLabel: 'Mark Ready',
      nextStatus: 'ready',
    },
    {
      status: 'ready',
      title: 'Ready',
      icon: Bell,
      pillClass: 'bg-[#F0FDF4] text-[#15803D] border-[#DCFCE7]',
      nextLabel: 'Mark Served',
      nextStatus: 'served',
    },
    {
      status: 'served',
      title: 'Served',
      icon: CheckCircle2,
      pillClass: 'bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]',
    },
  ];

  // Helper for elapsed time calculation and turning red after 15 min
  const getElapsedInfo = (createdAt: string) => {
    const elapsedMs = Date.now() - new Date(createdAt).getTime();
    const elapsedMinutes = Math.floor(elapsedMs / (60 * 1000));
    const isLate = elapsedMinutes >= 15;

    let text = 'Just now';
    if (elapsedMinutes >= 1 && elapsedMinutes < 60) {
      text = `${elapsedMinutes}m ago`;
    } else if (elapsedMinutes >= 60) {
      const hours = Math.floor(elapsedMinutes / 60);
      text = `${hours}h ${elapsedMinutes % 60}m ago`;
    }

    const timeString = new Date(createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return { text, isLate, timeString };
  };

  // Render a single order card
  const renderOrderCard = (ord: OrderWithDetails, col: typeof kanbanColumns[0]) => {
    const isNew = highlightedOrderIds.has(ord.id);
    const tableNum = ord.table?.table_number || '1';
    const { text: elapsedText, isLate, timeString } = getElapsedInfo(ord.created_at);

    return (
      <div
        key={ord.id}
        className={`p-4 bg-white border border-[#ECECEC] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] space-y-3.5 transition-all ${
          isNew ? 'animate-order-flash ring-2 ring-[var(--brand,#E23744)]' : ''
        }`}
      >
        {/* Top: Big Table Number ("TABLE 5") + Order Time & Timer */}
        <div className="flex items-start justify-between gap-2 border-b border-[#F0F0F0] pb-2.5">
          <div>
            <div className="text-[20px] font-black text-[#111111] tracking-tight">
              TABLE {tableNum}
            </div>
            <div className="text-[13px] text-[#555555]">
              Placed at {timeString}
            </div>
          </div>

          {/* Timer: Turns RED (#B91C1C on #FEF2F2) after 15 min */}
          <div
            className={`px-2.5 py-1 rounded-lg border font-bold text-[13px] flex items-center gap-1 shrink-0 ${
              isLate
                ? 'bg-[#FEF2F2] border-[#FEE2E2] text-[#B91C1C]'
                : 'bg-[#F7F7F8] border-[#ECECEC] text-[#555555]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{elapsedText}</span>
          </div>
        </div>

        {/* Customer info if provided */}
        {ord.customer_name && (
          <div className="flex items-center gap-1.5 text-[14px] text-[#555555]">
            <User className="w-3.5 h-3.5 text-[#555555]" />
            <span className="font-semibold text-[#111111] truncate">{ord.customer_name}</span>
            {ord.customer_phone && (
              <span className="text-[#555555] text-[13px]">({ord.customer_phone})</span>
            )}
          </div>
        )}

        {/* Items with quantities in LARGE text */}
        <div className="bg-[#F7F7F8] rounded-xl p-3 border border-[#ECECEC] space-y-2">
          {ord.order_items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-2 text-[#111111]"
            >
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="font-black text-[17px] text-[#111111] shrink-0">
                  {item.quantity}×
                </span>
                <span className="font-bold text-[16px] text-[#111111] leading-snug">
                  {item.name_snapshot}
                </span>
              </div>
              <span className="text-[14px] font-semibold text-[#555555] shrink-0">
                ₹{item.price_snapshot * item.quantity}
              </span>
            </div>
          ))}
        </div>

        {/* Customer notes in a highlighted YELLOW box */}
        {ord.notes && (
          <div className="p-3 rounded-xl bg-[#FEFCE8] border border-[#FEF08A] text-[#854D0E] text-[14px] flex items-start gap-2">
            <FileText className="w-4 h-4 text-[#854D0E] shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span className="font-bold block">Special Request:</span>
              <p className="mt-0.5 font-medium">{ord.notes}</p>
            </div>
          </div>
        )}

        {/* Payment status badge & total amount */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-[#F0F0F0]">
          <span
            className={`text-[12px] font-bold uppercase px-2.5 py-1 rounded-md border ${
              ord.payment_status === 'paid'
                ? 'bg-[#F0FDF4] border-[#DCFCE7] text-[#15803D]'
                : 'bg-[#FFF7ED] border-[#FFEDD5] text-[#C2410C]'
            }`}
          >
            {ord.payment_status === 'paid' ? 'Paid Online' : 'Pay at Counter'}
          </span>

          <span className="font-bold text-[16px] text-[#111111]">
            ₹{Number(ord.total_amount).toLocaleString()}
          </span>
        </div>

        {/* ONE big action button at the bottom with next step (min height 52px!) */}
        <div className="pt-1 flex gap-2">
          {col.nextStatus ? (
            <button
              type="button"
              onClick={() => handleMoveStatus(ord.id, col.nextStatus!)}
              className="flex-1 h-[52px] rounded-xl text-white font-bold text-[16px] tracking-wide flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all hover:brightness-105"
              style={{ backgroundColor: 'var(--brand, #E23744)' }}
            >
              <span>{col.nextLabel}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          ) : (
            <div className="flex-1 h-[52px] rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] text-[#15803D] font-bold text-[15px] flex items-center justify-center gap-2">
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span>Order Served</span>
            </div>
          )}

          {col.status === 'received' && (
            <button
              type="button"
              onClick={() => handleMoveStatus(ord.id, 'cancelled')}
              className="h-[52px] px-3.5 rounded-xl bg-[#F7F7F8] hover:bg-[#FEF2F2] text-[#555555] hover:text-[#B91C1C] border border-[#ECECEC] hover:border-[#FEE2E2] active:scale-95 transition-all text-xs font-bold"
              title="Cancel Order"
              aria-label="Cancel Order"
            >
              <Ban className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Reconnecting banner for flaky mobile/Wi-Fi connection */}
      {connectionStatus === 'reconnecting' && (
        <div className="flex items-center justify-center gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl font-bold text-sm shadow-sm animate-pulse">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-700" />
          <span>Reconnecting to live kitchen feed...</span>
        </div>
      )}

      {/* iOS Add to Home Screen Hint */}
      {showIosPrompt && (
        <div className="flex items-center justify-between gap-3 p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs sm:text-sm font-medium shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <Smartphone className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Install for fullscreen: Tap <strong className="font-bold">Share</strong> then <strong className="font-bold">&quot;Add to Home Screen&quot;</strong></span>
          </div>
          <button
            type="button"
            onClick={() => setShowIosPrompt(false)}
            className="text-indigo-600 font-bold hover:text-indigo-900 px-2 py-0.5 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* Page Title & Simulator Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-[#111111] tracking-tight">
            Live Orders
          </h1>
          <p className="text-[14px] text-[#555555]">
            Realtime kitchen board with automatic sound chime and instant status updates
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* PWA Install Button */}
          {deferredInstallPrompt && (
            <button
              type="button"
              onClick={handleInstallApp}
              className="h-11 px-3.5 rounded-xl bg-indigo-600 text-white font-bold text-[13px] hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2 shadow-sm"
              title="Install Admin App on this device"
            >
              <Download className="w-4 h-4" />
              <span>Install App</span>
            </button>
          )}

          {/* Enable / Mute Sound Button */}
          <button
            type="button"
            onClick={toggleSound}
            className={`h-11 px-3.5 rounded-xl border font-bold text-[13px] active:scale-95 transition-all flex items-center gap-2 shadow-sm ${
              soundEnabled
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
            }`}
            title="Toggle kitchen bell chime on new orders"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-600" />
                <span>Sound On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-amber-600" />
                <span>Enable Sound</span>
              </>
            )}
          </button>

          {/* Wake Lock Screen Awake Button */}
          {wakeLockSupported && (
            <button
              type="button"
              onClick={toggleWakeLock}
              className={`h-11 px-3.5 rounded-xl border font-bold text-[13px] active:scale-95 transition-all flex items-center gap-2 shadow-sm ${
                isWakeLocked
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-white border-[#ECECEC] text-[#555555] hover:text-[#111111]'
              }`}
              title="Keep screen awake during shifts"
            >
              <Sun className={`w-4 h-4 ${isWakeLocked ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
              <span>{isWakeLocked ? 'Screen Awake' : 'Stay Awake'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSimulateNewOrder}
            className="h-11 px-3.5 rounded-xl bg-white border border-[#ECECEC] text-[#111111] font-bold text-[13px] hover:bg-[#F7F7F8] active:scale-95 transition-all flex items-center gap-2 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-[var(--brand,#E23744)]" />
            <span>Simulate Order</span>
          </button>

          <button
            type="button"
            onClick={() => loadOrders(false)}
            disabled={isRefreshing}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-[#ECECEC] text-[#555555] hover:text-[#111111] active:scale-95 transition-all shadow-sm disabled:opacity-50"
            title="Refresh Orders"
            aria-label="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[var(--brand,#E23744)]' : ''}`} />
          </button>
        </div>
      </div>

      {/* MOBILE-ONLY: Swipeable/segmented tabs with count badges */}
      <div className="md:hidden">
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#ECECEC] rounded-xl overflow-x-auto no-scrollbar shadow-sm">
          {kanbanColumns.map((col) => {
            const count = orders.filter((o) => o.status === col.status).length;
            const isActive = activeMobileTab === col.status;
            return (
              <button
                key={col.status}
                type="button"
                onClick={() => setActiveMobileTab(col.status)}
                className={`flex-1 min-w-[76px] h-11 px-2.5 rounded-lg font-bold text-[13px] flex items-center justify-center gap-1.5 transition-all shrink-0 select-none ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'text-[#555555] hover:text-[#111111] hover:bg-[#F7F7F8]'
                }`}
                style={{
                  backgroundColor: isActive ? 'var(--brand, #E23744)' : undefined,
                }}
              >
                <span>{col.title}</span>
                <span
                  className={`text-[11px] font-black px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-black/25 text-white' : 'bg-[#EAEAEA] text-[#555555]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile active column list */}
        <div className="mt-4 space-y-3">
          {(() => {
            const activeCol = kanbanColumns.find((c) => c.status === activeMobileTab)!;
            const colOrders = orders.filter((o) => o.status === activeCol.status);

            if (colOrders.length === 0) {
              return (
                <div className="py-16 text-center text-[#555555] bg-white border border-[#ECECEC] rounded-2xl p-6 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-[#F7F7F8] border border-[#ECECEC] flex items-center justify-center mx-auto text-[#888888] mb-2">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="text-[16px] font-bold text-[#111111]">
                    No {activeCol.title.toLowerCase()} orders
                  </div>
                  <div className="text-[13px] text-[#555555] mt-0.5">
                    Orders will appear here automatically
                  </div>
                </div>
              );
            }

            return colOrders.map((ord) => renderOrderCard(ord, activeCol));
          })()}
        </div>
      </div>

      {/* TABLET / DESKTOP: 4 Columns Kanban Grid */}
      <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {kanbanColumns.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.status);
          const ColIcon = col.icon;

          return (
            <div
              key={col.status}
              className="bg-[#F7F7F8] border border-[#ECECEC] rounded-2xl flex flex-col overflow-hidden shadow-sm"
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-[#ECECEC] bg-white flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md border text-[13px] font-bold ${col.pillClass}`}>
                    {col.title}
                  </span>
                </div>
                <span className="text-[13px] font-bold px-2 py-0.5 rounded-full bg-[#F7F7F8] text-[#555555] border border-[#ECECEC]">
                  {colOrders.length}
                </span>
              </div>

              {/* Column Cards Container */}
              <div className="p-3 space-y-3 min-h-[350px] max-h-[calc(100vh-230px)] overflow-y-auto no-scrollbar">
                {colOrders.length === 0 ? (
                  <div className="py-16 text-center text-[#888888] text-[14px] font-medium space-y-1.5">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#ECECEC] flex items-center justify-center mx-auto text-[#888888]">
                      <ColIcon className="w-5 h-5" />
                    </div>
                    <div>No {col.title.toLowerCase()} orders</div>
                  </div>
                ) : (
                  colOrders.map((ord) => renderOrderCard(ord, col))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
