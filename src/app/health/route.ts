import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /health
 * Public health-check endpoint for uptime monitors, Caddy, Cloudflare, Docker, and Kubernetes.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      env: process.env.NODE_ENV || 'development',
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
