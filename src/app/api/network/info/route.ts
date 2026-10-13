import { NextResponse } from 'next/server';
import { getLanIp, getSiteUrl } from '@/lib/network';

export const dynamic = 'force-dynamic';

export async function GET() {
  const lanIp = getLanIp();
  const lanUrl = `http://${lanIp}:3000`;
  const tunnelUrl = 'https://sisters-considering-artist-move.trycloudflare.com';

  return NextResponse.json({
    lanIp,
    lanUrl,
    tunnelUrl,
    siteUrl: tunnelUrl || lanUrl,
    port: 3000,
  });
}
