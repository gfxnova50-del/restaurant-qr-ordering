'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { OrderWithDetails } from '@/types/database';
import { getLocalOrders } from '@/lib/api';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import {
  Calendar,
  ShoppingBag,
  Search,
  Receipt,
  User,
  X,
  CreditCard,
  Banknote,
  TrendingUp,
} from 'lucide-react';

type DateFilterOption = 'today' | 'yesterday' | '7days' | 'month' | 'all';

export function OrderHistoryView() {
  const { brandColor } = useAuth();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('today');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (isSupabaseConfigured()) {
          const supabase = createClient();
          const { data } = await supabase
            .from('orders')
            .select(`
              id,
              restaurant_id,
              table_id,
              customer_name,
              customer_phone,
              status,
              payment_status,
              payment_method,
              total_amount,
              notes,
              created_at,
              updated_at,
              tables ( table_number ),
              order_items ( id, menu_item_id, name_snapshot, price_snapshot, quantity )
            `)
            .order('created_at', { ascending: false });

          if (data && data.length > 0) {
            const formatted = (data as any[]).map((d) => ({
              ...d,
              table: d.tables,
              order_items: d.order_items || [],
            }));
            setOrders(formatted);
            return;
          }
        }
      } catch (e) {
        console.warn('Supabase history fetch error:', e);
      }

      setOrders(getLocalOrders());
    };

    load();
  }, []);

  // Today's dedicated summary statistics
  const todayStats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const todayOrders = orders.filter((o) => {
      const orderTime = new Date(o.created_at).getTime();
      return orderTime >= startOfToday;
    });

    const validToday = todayOrders.filter((o) => o.status !== 'cancelled');
    const todaySales = validToday.reduce((sum, o) => sum + Number(o.total_amount), 0);

    return {
      ordersCount: todayOrders.length,
      salesTotal: todaySales,
    };
  }, [orders]);

  // Filter orders by date, status, search
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return orders.filter((order) => {
      const orderTime = new Date(order.created_at).getTime();

      // Date match
      let matchDate = true;
      if (dateFilter === 'today') {
        matchDate = orderTime >= startOfToday;
      } else if (dateFilter === 'yesterday') {
        matchDate = orderTime >= startOfYesterday && orderTime < startOfToday;
      } else if (dateFilter === '7days') {
        matchDate = orderTime >= sevenDaysAgo;
      } else if (dateFilter === 'month') {
        matchDate = orderTime >= startOfMonth;
      }

      // Status match
      const matchStatus = statusFilter === 'all' || order.status === statusFilter;

      // Query match
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        order.id.toLowerCase().includes(q) ||
        (order.table?.table_number && order.table.table_number.toLowerCase().includes(q)) ||
        (order.customer_name && order.customer_name.toLowerCase().includes(q)) ||
        (order.customer_phone && order.customer_phone.includes(q));

      return matchDate && matchStatus && matchQuery;
    });
  }, [orders, dateFilter, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-[22px] sm:text-[26px] font-bold text-[#111111] tracking-tight">
          History
        </h1>
        <p className="text-[14px] text-[#555555]">
          Track orders, payments, and dining sales records
        </p>
      </div>

      {/* Summary card on top showing "Today's Orders" and "Today's Sales" in big numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Today's Orders */}
        <div className="p-5 sm:p-6 bg-white border border-[#ECECEC] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-bold text-[#555555] uppercase tracking-wider">
              Today&apos;s Orders
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#F7F7F8] border border-[#ECECEC] flex items-center justify-center text-[#111111]">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[32px] sm:text-[36px] font-black text-[#111111] mt-2 tracking-tight">
            {todayStats.ordersCount}
          </div>
          <p className="text-[13px] text-[#555555] mt-0.5">
            Placed through QR menu today
          </p>
        </div>

        {/* Today's Sales */}
        <div className="p-5 sm:p-6 bg-white border border-[#ECECEC] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-bold text-[#555555] uppercase tracking-wider">
              Today&apos;s Sales
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center text-[#15803D]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[32px] sm:text-[36px] font-black text-[#111111] mt-2 tracking-tight">
            ₹{todayStats.salesTotal.toLocaleString()}
          </div>
          <p className="text-[13px] text-[#555555] mt-0.5">
            Total revenue from confirmed orders
          </p>
        </div>
      </div>

      {/* Date Picker / Filter Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Date Picker Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7days', label: 'Last 7 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'all', label: 'All Time' },
            ].map((tab) => {
              const isSelected = dateFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDateFilter(tab.id as DateFilterOption)}
                  className={`h-11 px-4 rounded-xl text-[14px] font-bold shrink-0 transition-all border ${
                    isSelected
                      ? 'text-white shadow-sm'
                      : 'bg-white text-[#555555] border-[#ECECEC] hover:border-[#D1D5DB]'
                  }`}
                  style={{
                    backgroundColor: isSelected ? 'var(--brand, #E23744)' : undefined,
                    borderColor: isSelected ? 'transparent' : undefined,
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-[#555555] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search table, customer, order #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 bg-white border border-[#ECECEC] rounded-xl pl-10 pr-4 text-[14px] text-[#111111] placeholder-[#555555] focus:outline-none focus:border-[var(--brand,#E23744)]"
            />
          </div>
        </div>
      </div>

      {/* Orders List Table / Card View */}
      <div className="bg-white border border-[#ECECEC] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] divide-y divide-[#ECECEC] overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-[#555555] space-y-2">
            <p className="text-[16px] font-semibold text-[#111111]">No orders found</p>
            <p className="text-[14px]">Try selecting a different date range or filter</p>
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const tableNum = ord.table?.table_number || '1';
            const orderTime = new Date(ord.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            const orderDate = new Date(ord.created_at).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            });

            const statusColors: Record<string, string> = {
              received: 'bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]',
              preparing: 'bg-[#FFF7ED] text-[#C2410C] border-[#FFEDD5]',
              ready: 'bg-[#F0FDF4] text-[#15803D] border-[#DCFCE7]',
              served: 'bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]',
              cancelled: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FEE2E2]',
            };

            return (
              <div
                key={ord.id}
                onClick={() => setSelectedOrder(ord)}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F7F7F8] cursor-pointer transition-colors"
              >
                {/* Left: Table, Order ID, Date/Time */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-[#F7F7F8] border border-[#ECECEC] flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-[#555555] uppercase">Table</span>
                    <span className="text-[16px] font-black text-[#111111] leading-tight">
                      {tableNum}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold text-[#111111]">
                        #{ord.id.slice(-5).toUpperCase()}
                      </span>
                      {ord.customer_name && (
                        <span className="text-[14px] text-[#555555] truncate">
                          • {ord.customer_name}
                        </span>
                      )}
                    </div>
                    <div className="text-[13px] text-[#555555] mt-0.5">
                      {orderDate} at {orderTime} • {ord.order_items.length} items
                    </div>
                  </div>
                </div>

                {/* Right: Status badge & Total Amount */}
                <div className="flex items-center justify-between sm:justify-end gap-3.5 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#F0F0F0]">
                  <span
                    className={`text-[12px] font-bold uppercase px-2.5 py-1 rounded-md border ${
                      statusColors[ord.status] || 'bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]'
                    }`}
                  >
                    {ord.status}
                  </span>

                  <span className="font-bold text-[17px] text-[#111111]">
                    ₹{Number(ord.total_amount).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-[#ECECEC] rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECECEC]">
              <div>
                <h3 className="text-[18px] font-bold text-[#111111]">
                  Order #{selectedOrder.id.slice(-5).toUpperCase()}
                </h3>
                <p className="text-[13px] text-[#555555]">
                  Table {selectedOrder.table?.table_number || '1'} • Placed on{' '}
                  {new Date(selectedOrder.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-10 h-10 rounded-full bg-[#F7F7F8] border border-[#ECECEC] text-[#555555] flex items-center justify-center hover:text-[#111111]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer info */}
            {selectedOrder.customer_name && (
              <div className="text-[14px] text-[#555555] bg-[#F7F7F8] p-3 rounded-xl border border-[#ECECEC]">
                <div className="font-bold text-[#111111]">Customer:</div>
                <div>{selectedOrder.customer_name} {selectedOrder.customer_phone && `(${selectedOrder.customer_phone})`}</div>
              </div>
            )}

            {/* Items */}
            <div className="space-y-2">
              <span className="text-[14px] font-bold text-[#555555]">Items</span>
              {selectedOrder.order_items.map((item) => (
                <div key={item.id} className="flex justify-between text-[15px]">
                  <span>
                    {item.quantity}× {item.name_snapshot}
                  </span>
                  <span className="font-bold text-[#111111]">
                    ₹{item.price_snapshot * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="pt-3 border-t border-[#ECECEC] flex justify-between font-bold text-[18px] text-[#111111]">
              <span>Total Paid</span>
              <span>₹{Number(selectedOrder.total_amount).toLocaleString()}</span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className="w-full h-12 rounded-xl bg-[#F7F7F8] border border-[#ECECEC] text-[#111111] font-bold text-[14px]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
