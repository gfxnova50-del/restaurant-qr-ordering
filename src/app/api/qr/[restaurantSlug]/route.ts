import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, isSupabaseAdminConfigured } from '@/lib/supabase/admin';
import { generateTableQRPng, generateTablesQRZip, buildTableQRUrl } from '@/lib/qr';
import { getSiteUrl } from '@/lib/network';
import { MOCK_RESTAURANTS, MOCK_TABLES } from '@/lib/mockData';

export const dynamic = 'force-dynamic';

interface TableRow {
  id: string;
  table_number: string;
}

/**
 * GET /api/qr/[restaurantSlug]
 * Generates QR codes for restaurant tables using the qrcode library.
 * QR URL format: {SITE_URL}/r/{slug}?table={table_number}
 */
export async function GET(
  request: NextRequest,
  context: { params: { restaurantSlug: string } }
) {
  try {
    const restaurantSlug = context?.params?.restaurantSlug;
    const { searchParams } = new URL(request.url);

    const tableParam = searchParams.get('table');
    const formatParam = searchParams.get('format')?.toLowerCase();

    if (!restaurantSlug) {
      return NextResponse.json({ error: 'Restaurant slug is required' }, { status: 400 });
    }

    let currentRestaurant: { id: string; name: string; slug: string } | null = null;
    let typedTables: TableRow[] = [];

    if (isSupabaseAdminConfigured()) {
      try {
        const supabase = createAdminClient();

        // 1. Fetch restaurant
        const { data: restaurant, error: restError } = await supabase
          .from('restaurants')
          .select('id, name, slug')
          .eq('slug', restaurantSlug)
          .single();

        if (!restError && restaurant) {
          currentRestaurant = restaurant as unknown as { id: string; name: string; slug: string };

          // 2. Fetch tables for this restaurant
          const { data: tables } = await supabase
            .from('tables')
            .select('id, table_number')
            .eq('restaurant_id', currentRestaurant.id)
            .order('table_number', { ascending: true });

          if (tables && tables.length > 0) {
            typedTables = tables as unknown as TableRow[];
          }
        }
      } catch (e) {
        console.warn('Supabase QR fetch failed, using mock data:', e);
      }
    }

    // Fallback to mock data
    if (!currentRestaurant) {
      const mockRest = MOCK_RESTAURANTS[restaurantSlug] || MOCK_RESTAURANTS['spice-garden'];
      if (mockRest) {
        currentRestaurant = {
          id: mockRest.id,
          name: mockRest.name,
          slug: mockRest.slug,
        };
        const mockTablesList = MOCK_TABLES[mockRest.id] || [];
        typedTables = mockTablesList.map((t) => ({
          id: t.id,
          table_number: String(t.table_number),
        }));
      }
    }

    if (!currentRestaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    if (typedTables.length === 0) {
      return NextResponse.json(
        { error: 'No tables found for this restaurant' },
        { status: 404 }
      );
    }

    // Determine site URL dynamically from headers, env, or detected LAN IP
    const hostHeader = request.headers.get('host');
    const protoHeader = request.headers.get('x-forwarded-proto') || (request.nextUrl.protocol ? request.nextUrl.protocol.replace(':', '') : 'http');
    const requestOrigin = hostHeader ? `${protoHeader}://${hostHeader}` : undefined;
    const siteUrl = requestOrigin || getSiteUrl();

    // 3. Handle JSON metadata format
    if (formatParam === 'json') {
      const tableUrls = typedTables.map((t) => ({
        table_number: t.table_number,
        qr_url: buildTableQRUrl(siteUrl, restaurantSlug, t.table_number),
        download_png: `${siteUrl}/api/qr/${restaurantSlug}?table=${t.table_number}&format=png`,
      }));

      return NextResponse.json({
        restaurant: currentRestaurant.name,
        slug: restaurantSlug,
        total_tables: typedTables.length,
        site_url: siteUrl,
        download_all_zip: `${siteUrl}/api/qr/${restaurantSlug}?format=zip`,
        tables: tableUrls,
      });
    }

    // 4. Handle Single Table PNG
    if (tableParam) {
      const targetTable = typedTables.find(
        (t) => String(t.table_number) === String(tableParam)
      );

      if (!targetTable) {
        return NextResponse.json(
          { error: `Table "${tableParam}" not found for this restaurant` },
          { status: 404 }
        );
      }

      const pngBuffer = await generateTableQRPng({
        siteUrl,
        slug: restaurantSlug,
        tableNumber: targetTable.table_number,
        margin: 2,
        width: 512,
      });

      return new NextResponse(pngBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `inline; filename="${restaurantSlug}_table_${targetTable.table_number}_qr.png"`,
          'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        },
      });
    }

    // 5. Default or ?format=zip: Return ZIP archive of all tables
    const zipBuffer = await generateTablesQRZip({
      siteUrl,
      slug: restaurantSlug,
      tables: typedTables,
    });

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${restaurantSlug}_all_tables_qr.zip"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
