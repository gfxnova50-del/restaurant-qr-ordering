import { NextRequest, NextResponse } from 'next/server';
import { getRestaurantMenuData } from '@/lib/menuService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/menu/[slug]
 * Public endpoint to fetch restaurant info, categories, and available menu items.
 */
export async function GET(
  _request: NextRequest,
  context: { params: { slug: string } }
) {
  try {
    const slug = context?.params?.slug;

    if (!slug) {
      return NextResponse.json({ error: 'Restaurant slug is required' }, { status: 400 });
    }

    const menuData = await getRestaurantMenuData(slug);
    return NextResponse.json(menuData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
