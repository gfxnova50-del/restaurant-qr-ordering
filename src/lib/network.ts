import os from 'os';

/**
 * Detects the local machine's primary LAN IPv4 address (e.g. 192.168.x.x, 10.x.x.x)
 */
export function getLanIp(): string {
  try {
    const interfaces = os.networkInterfaces();
    const candidates: Array<{ name: string; address: string; priority: number }> = [];

    for (const [name, addrs] of Object.entries(interfaces)) {
      if (!addrs) continue;
      for (const addr of addrs) {
        // Skip IPv6 and internal loopback (127.0.0.1)
        if (addr.family === 'IPv4' && !addr.internal) {
          const lowerName = name.toLowerCase();
          let priority = 1;
          // Prioritize Wi-Fi and physical Ethernet interfaces
          if (lowerName.includes('wi-fi') || lowerName.includes('wifi') || lowerName.includes('wlan')) {
            priority = 10;
          } else if (lowerName.includes('ethernet') || lowerName.includes('eth') || lowerName.includes('en0')) {
            priority = 8;
          } else if (lowerName.includes('virtual') || lowerName.includes('vEthernet') || lowerName.includes('vmnet')) {
            priority = 0;
          }
          candidates.push({ name, address: addr.address, priority });
        }
      }
    }

    if (candidates.length > 0) {
      candidates.sort((a, b) => b.priority - a.priority);
      return candidates[0].address;
    }
  } catch (e) {
    console.warn('Failed to detect LAN IP:', e);
  }

  return '127.0.0.1';
}

/**
 * Resolves the application's base URL for QR codes, links, and sharing.
 * - In production: uses SITE_URL or NEXT_PUBLIC_SITE_URL (must be HTTPS domain).
 * - In development: uses SITE_URL if set and non-localhost; otherwise auto-detects LAN IP.
 * - In browser: uses window.location.origin so any device uses its active host.
 */
export function getSiteUrl(port: number = 3000): string {
  // If running in browser, always use current origin
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  // 1. Explicit environment variable (SITE_URL or NEXT_PUBLIC_SITE_URL)
  const envUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && envUrl.trim() !== '') {
    const cleanUrl = envUrl.trim().replace(/\/+$/, '');
    // In dev, if explicitly configured to a real domain or custom IP, respect it
    if (!cleanUrl.includes('localhost') && !cleanUrl.includes('127.0.0.1')) {
      return cleanUrl;
    }
    // If in production, respect whatever is set
    if (process.env.NODE_ENV === 'production') {
      return cleanUrl;
    }
  }

  // 2. Development fallback to detected LAN IP
  const lanIp = getLanIp();
  return `http://${lanIp}:${port}`;
}

/**
 * Extracts client IP behind reverse proxies (Caddy, Nginx, Cloudflare)
 */
export function getClientIp(req: Request): string {
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',');
    return ips[0].trim();
  }

  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp) return xRealIp.trim();

  return '127.0.0.1';
}

/**
 * Checks if request is secure over HTTPS (including Cloudflare/Caddy forwarded headers)
 */
export function isRequestSecure(req: Request): boolean {
  const proto = req.headers.get('x-forwarded-proto');
  if (proto && proto.toLowerCase() === 'https') return true;

  const cfVisitor = req.headers.get('cf-visitor');
  if (cfVisitor && cfVisitor.includes('"scheme":"https"')) return true;

  try {
    const url = new URL(req.url);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}
