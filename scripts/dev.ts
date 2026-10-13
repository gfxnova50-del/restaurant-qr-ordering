import { spawn } from 'child_process';
import os from 'os';
import qrcode from 'qrcode-terminal';

export function getLanIpAddress(): string {
  try {
    const interfaces = os.networkInterfaces();
    const candidates: Array<{ name: string; address: string; priority: number }> = [];

    for (const [name, addrs] of Object.entries(interfaces)) {
      if (!addrs) continue;
      for (const addr of addrs) {
        if (addr.family === 'IPv4' && !addr.internal) {
          const lower = name.toLowerCase();
          let priority = 1;
          if (lower.includes('wi-fi') || lower.includes('wifi') || lower.includes('wlan')) {
            priority = 10;
          } else if (lower.includes('ethernet') || lower.includes('eth') || lower.includes('en0')) {
            priority = 8;
          } else if (lower.includes('virtual') || lower.includes('vethernet') || lower.includes('vmnet')) {
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

const lanIp = getLanIpAddress();
const port = process.env.PORT || '3000';
const customerUrl = `http://${lanIp}:${port}/?table=1`;
const adminUrl = `http://${lanIp}:${port}/admin`;
const connectUrl = `http://${lanIp}:${port}/dev/connect`;

console.log('\n' + '='.repeat(62));
console.log('  📱 QR MENU & LIVE KITCHEN ORDERING — MOBILE DEV ACCESS');
console.log('='.repeat(62));
console.log('\n  Scan with your phone camera (Same Wi-Fi):\n');

qrcode.generate(customerUrl, { small: true }, (qr) => {
  console.log(qr);
});

console.log('  Customer menu: ' + customerUrl);
console.log('  Admin panel:   ' + adminUrl);
console.log('  Dev Portal:    ' + connectUrl);
console.log('  Listening on:  0.0.0.0:' + port);
console.log('='.repeat(62) + '\n');

// Launch Next.js dev server listening on 0.0.0.0
const nextBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(nextBin, ['next', 'dev', '-H', '0.0.0.0', '-p', String(port)], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    SITE_URL: process.env.SITE_URL || `http://${lanIp}:${port}`,
  },
});

child.on('close', (code) => {
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
  process.exit(0);
});
