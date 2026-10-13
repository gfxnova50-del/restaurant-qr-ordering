import React from 'react';
import { fetchRestaurantMenu } from '@/lib/api';
import { CartProvider } from '@/context/CartContext';
import { MenuClientView } from '@/components/customer/MenuClientView';
import type { Metadata } from 'next';

interface MenuPageProps {
  params: { slug: string } | Promise<{ slug: string }>;
  searchParams?: { table?: string } | Promise<{ table?: string }>;
}

export async function generateMetadata({ params }: MenuPageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const data = await fetchRestaurantMenu(resolvedParams.slug);
  return {
    title: `${data.restaurant.name} - Digital QR Menu`,
    description: `Order fresh & delicious food from ${data.restaurant.name} directly from your phone.`,
  };
}

export default async function MenuPage({ params, searchParams }: MenuPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedQuery = searchParams ? await Promise.resolve(searchParams) : {};
  const slug = resolvedParams.slug;
  const initialTable = resolvedQuery?.table || '1';

  const menuData = await fetchRestaurantMenu(slug);

  return (
    <CartProvider slug={slug} initialTable={initialTable}>
      <MenuClientView initialData={menuData} slug={slug} />
    </CartProvider>
  );
}
