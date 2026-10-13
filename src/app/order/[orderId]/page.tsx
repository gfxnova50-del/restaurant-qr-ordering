import React from 'react';
import { fetchOrderById } from '@/lib/api';
import { OrderTrackingView } from '@/components/customer/OrderTrackingView';
import type { Metadata } from 'next';

interface OrderPageProps {
  params: { orderId: string } | Promise<{ orderId: string }>;
}

export async function generateMetadata({ params }: OrderPageProps): Promise<Metadata> {
  const resolved = await Promise.resolve(params);
  const orderId = resolved?.orderId || 'order';
  return {
    title: `Order Tracking #${orderId.slice(-6).toUpperCase()}`,
    description: 'Track your live dining order status in real time.',
  };
}

export default async function OrderPage({ params }: OrderPageProps) {
  const resolved = await Promise.resolve(params);
  const orderId = resolved?.orderId || '';
  const data = await fetchOrderById(orderId);

  return <OrderTrackingView initialOrder={data.order} />;
}
