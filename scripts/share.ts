import { spawn, execSync } from 'child_process';
import qrcode from 'qrcode-terminal';

import fs from 'fs';
import path from 'path';

function getCloudflaredBin(): string | null {
  const localBin = path.join(process.cwd(), process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared');
  if (fs.existsSync(localBin)) {
    return localBin;
  }
  try {
    const cmd = process.platform === 'win32' ? 'where cloudflared' : 'which cloudflared';
    execSync(cmd, { stdio: 'ignore' });
    return 'cloudflared';
  } catch {
    return null;
  }
}

function printInstallInstructions() {
  console.log('\n' + '='.repeat(64));
  console.log('  ⚠️  cloudflared is not installed on your system');
  console.log('='.repeat(64));
  console.log('\nTo share your local dev server over 4G/5G mobile data, install cloudflared:\n');
  if (process.platform === 'win32') {
    console.log('  👉 Windows (PowerShell / Command Prompt):');
    console.log('     winget install Cloudflare.cloudflared\n');
    console.log('     OR download direct executable:');
    console.log('     https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe');
  } else if (process.platform === 'darwin') {
    console.log('  👉 macOS (Homebrew):');
    console.log('     brew install cloudflared');
  } else {
    console.log('  👉 Linux:');
    console.log('     sudo apt-get install cloudflared  # or brew install cloudflared');
  }
  console.log('\nAfter installation, run "npm run share" again.');
  console.log('='.repeat(64) + '\n');
}

const port = process.env.PORT || '3000';
const cloudflaredBin = getCloudflaredBin();

if (!cloudflaredBin) {
  printInstallInstructions();
  process.exit(1);
}

console.log('\n' + '='.repeat(64));
console.log('  🚀 Starting Cloudflare Quick Tunnel for port ' + port + '...');
console.log('='.repeat(64) + '\n');

const child = spawn(cloudflaredBin, ['tunnel', '--url', `http://localhost:${port}`], {
  stdio: ['ignore', 'pipe', 'pipe'],
});

let foundUrl = false;

function handleOutput(data: Buffer) {
  const text = data.toString();
  // Cloudflare prints tunnel URLs matching https://*.trycloudflare.com
  const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match && !foundUrl) {
    foundUrl = true;
    const tunnelUrl = match[0];
    const customerUrl = `${tunnelUrl}/?table=1`;
    const adminUrl = `${tunnelUrl}/admin`;
    const connectUrl = `${tunnelUrl}/dev/connect`;

    console.log('\n' + '='.repeat(64));
    console.log('  🌍 PUBLIC HTTPS ACCESS OVER MOBILE DATA (No Wi-Fi needed!)');
    console.log('='.repeat(64));
    console.log('\n  Scan with your phone camera from anywhere:\n');

    qrcode.generate(customerUrl, { small: true }, (qr) => {
      console.log(qr);
    });

    console.log('  Customer menu: ' + customerUrl);
    console.log('  Admin panel:   ' + adminUrl);
    console.log('  Dev Portal:    ' + connectUrl);
    console.log('  Tunnel URL:    ' + tunnelUrl);
    console.log('='.repeat(64));
    console.log('  Press Ctrl+C to close tunnel\n');
  }
}

child.stdout.on('data', handleOutput);
child.stderr.on('data', handleOutput);

child.on('close', (code) => {
  console.log(`\nCloudflare tunnel stopped (code ${code}).`);
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
  process.exit(0);
});
