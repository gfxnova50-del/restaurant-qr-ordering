import QRCode from 'qrcode';
import JSZip from 'jszip';

export interface GenerateTableQRParams {
  siteUrl: string;
  slug: string;
  tableNumber: string;
  margin?: number;
  width?: number;
}

/**
 * Builds the standard QR URL format: {SITE_URL}/r/{slug}?table={table_number}
 */
export function buildTableQRUrl(siteUrl: string, slug: string, tableNumber: string): string {
  const normalizedBase = siteUrl.replace(/\/+$/, '');
  const encodedTable = encodeURIComponent(tableNumber);
  return `${normalizedBase}/r/${encodeURIComponent(slug)}?table=${encodedTable}`;
}

/**
 * Generates a PNG Buffer for a single table QR code
 */
export async function generateTableQRPng({
  siteUrl,
  slug,
  tableNumber,
  margin = 2,
  width = 512,
}: GenerateTableQRParams): Promise<Buffer> {
  const url = buildTableQRUrl(siteUrl, slug, tableNumber);
  return QRCode.toBuffer(url, {
    type: 'png',
    margin,
    width,
    color: {
      dark: '#111827', // Crisp dark gray/black
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'H', // High error correction for restaurant environments (splashes, smudges)
  });
}

/**
 * Generates a ZIP archive containing QR PNG images for multiple tables
 */
export async function generateTablesQRZip({
  siteUrl,
  slug,
  tables,
}: {
  siteUrl: string;
  slug: string;
  tables: Array<{ id: string; table_number: string }>;
}): Promise<Buffer> {
  const zip = new JSZip();

  for (const table of tables) {
    const pngBuffer = await generateTableQRPng({
      siteUrl,
      slug,
      tableNumber: table.table_number,
    });

    const sanitizedTableName = table.table_number.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${slug}_${sanitizedTableName}_qr.png`;
    zip.file(fileName, pngBuffer);
  }

  // Also include a helpful README in the zip
  const manifest = `Restaurant: ${slug}
Generated Tables: ${tables.map((t) => t.table_number).join(', ')}
Base QR URL format: ${siteUrl}/r/${slug}?table={table_number}
Generated on: ${new Date().toISOString()}
`;
  zip.file('info.txt', manifest);

  const zipContent = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  return zipContent;
}
