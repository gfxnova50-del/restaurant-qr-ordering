'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import { Table, Restaurant } from '@/types/database';
import { MOCK_TABLES, MOCK_RESTAURANTS } from '@/lib/mockData';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import {
  Plus,
  Download,
  Copy,
  ExternalLink,
  Trash2,
  Eye,
  X,
  FileDown,
  Smartphone,
  Globe,
  Wifi,
  Check,
} from 'lucide-react';

export function TablesQRView() {
  const { brandColor } = useAuth();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  const [tables, setTables] = useState<Table[]>([]);
  const [restaurant] = useState<Restaurant>(MOCK_RESTAURANTS['spice-garden']);
  const [siteUrl, setSiteUrl] = useState<string>('http://localhost:3000');
  const [networkInfo, setNetworkInfo] = useState<{
    lanIp: string;
    lanUrl: string;
    tunnelUrl: string;
    siteUrl: string;
  } | null>(null);
  const [urlMode, setUrlMode] = useState<'tunnel' | 'lan' | 'local'>('tunnel');
  const [qrCodeDataUrls, setQrCodeDataUrls] = useState<Record<string, string>>({});
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Add Table Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');

  // QR Preview Modal
  const [previewTable, setPreviewTable] = useState<Table | null>(null);

  // Fetch network info on mount to auto-detect public tunnel & Wi-Fi LAN IP
  useEffect(() => {
    const fetchNetwork = async () => {
      try {
        const res = await fetch('/api/network/info', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setNetworkInfo(data);
          if (data.tunnelUrl) {
            setUrlMode('tunnel');
          } else if (data.lanUrl) {
            setUrlMode('lan');
          }
        }
      } catch (err) {
        console.warn('Network info fetch error:', err);
      }
    };
    fetchNetwork();
  }, []);

  // Compute effective base URL for phone-scannable QR codes
  const effectiveBaseUrl = React.useMemo(() => {
    if (urlMode === 'tunnel' && networkInfo?.tunnelUrl) {
      return networkInfo.tunnelUrl;
    }
    if (urlMode === 'lan' && networkInfo?.lanUrl) {
      return networkInfo.lanUrl;
    }
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return siteUrl;
  }, [urlMode, networkInfo, siteUrl]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSiteUrl(window.location.origin);
    }

    const loadTables = async () => {
      try {
        if (isSupabaseConfigured()) {
          const supabase = createClient();
          const { data } = await supabase.from('tables').select('*').order('table_number');
          if (data && data.length > 0) {
            setTables(data);
            return;
          }
        }
      } catch (e) {
        console.warn('Supabase fetch failed:', e);
      }

      setTables(MOCK_TABLES['b0000000-0000-0000-0000-000000000001'] || []);
    };

    loadTables();
  }, []);

  // Generate QR code data URLs for all tables with effective phone-accessible URL
  useEffect(() => {
    const generateAllQrs = async () => {
      const urls: Record<string, string> = {};
      for (const t of tables) {
        const tableUrl = `${effectiveBaseUrl}/r/${restaurant.slug}?table=${encodeURIComponent(t.table_number)}`;
        try {
          const dataUrl = await QRCode.toDataURL(tableUrl, {
            width: 400,
            margin: 2,
            color: {
              dark: '#111111',
              light: '#ffffff',
            },
            errorCorrectionLevel: 'H',
          });
          urls[t.id] = dataUrl;
        } catch (e) {
          console.warn('QR generation error for table:', t.table_number, e);
        }
      }
      setQrCodeDataUrls(urls);
    };

    if (tables.length > 0) {
      generateAllQrs();
    }
  }, [tables, effectiveBaseUrl, restaurant.slug]);

  // Copy customer menu link for table
  const handleCopyLink = async (tableNumber: string) => {
    const url = `${effectiveBaseUrl}/r/${restaurant.slug}?table=${encodeURIComponent(tableNumber)}`;
    try {
      await navigator.clipboard.writeText(url);
      toastSuccess(`Link for Table ${tableNumber} copied to clipboard!`);
    } catch {
      toastError('Failed to copy link');
    }
  };

  // Download individual table QR PNG
  const handleDownloadQrPng = (tableNumber: string, qrDataUrl: string) => {
    const link = document.createElement('a');
    link.download = `${restaurant.slug}_Table_${tableNumber}_QR.png`;
    link.href = qrDataUrl;
    link.click();
    toastSuccess(`Downloaded QR code for Table ${tableNumber}`);
  };

  // Add new table
  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber.trim()) return;

    const exists = tables.some(
      (t) => t.table_number.toLowerCase() === newTableNumber.trim().toLowerCase()
    );
    if (exists) {
      toastError(`Table ${newTableNumber} already exists`);
      return;
    }

    const newTable: Table = {
      id: 'tbl-' + Math.random().toString(36).substring(2, 9),
      restaurant_id: restaurant.id,
      table_number: newTableNumber.trim(),
      created_at: new Date().toISOString(),
    };

    setTables((prev) => [...prev, newTable]);
    toastSuccess(`Table ${newTable.table_number} added`);
    setIsAddModalOpen(false);
    setNewTableNumber('');
  };

  // Delete table
  const handleDeleteTable = (id: string, tableNumber: string) => {
    if (confirm(`Are you sure you want to remove Table ${tableNumber}?`)) {
      setTables((prev) => prev.filter((t) => t.id !== id));
      toastSuccess(`Table ${tableNumber} removed`);
    }
  };

  // Download Print-Ready PDF of all QR codes
  const handleDownloadPdf = async () => {
    if (tables.length === 0) {
      toastError('No tables available to generate PDF');
      return;
    }

    setIsGeneratingPdf(true);
    toastInfo('Generating print-ready PDF...');

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 210;
      const cardsPerPage = 2;
      const totalPages = Math.ceil(tables.length / cardsPerPage);

      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        const cardIndexOnPage = i % cardsPerPage;
        const pageIndex = Math.floor(i / cardsPerPage);

        if (i > 0 && cardIndexOnPage === 0) {
          doc.addPage();
        }

        const qrData = qrCodeDataUrls[table.id];
        const yOffset = cardIndexOnPage === 0 ? 15 : 155;

        // Card Outer Border
        doc.setDrawColor(230, 230, 230);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(20, yOffset, 170, 125, 6, 6, 'FD');

        // Top Accent Bar (Brand red)
        doc.setFillColor(226, 55, 68);
        doc.roundedRect(20, yOffset, 170, 6, 3, 3, 'F');

        // Restaurant Name Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(17, 17, 17);
        doc.text(restaurant.name.toUpperCase(), pageWidth / 2, yOffset + 24, { align: 'center' });

        // Table Badge
        doc.setFontSize(16);
        doc.setTextColor(226, 55, 68);
        doc.text(`TABLE ${table.table_number}`, pageWidth / 2, yOffset + 33, { align: 'center' });

        // QR Code Image
        if (qrData) {
          doc.addImage(qrData, 'PNG', pageWidth / 2 - 28, yOffset + 40, 56, 56);
        }

        // Instructions Footer
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(17, 17, 17);
        doc.text('SCAN WITH PHONE CAMERA TO ORDER', pageWidth / 2, yOffset + 104, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(85, 85, 85);
        doc.text(
          `Instant Digital Menu • No App Download Required • Table ${table.table_number}`,
          pageWidth / 2,
          yOffset + 112,
          { align: 'center' }
        );

        // Page footer note
        doc.setFontSize(7.5);
        doc.setTextColor(140, 140, 140);
        doc.text(`Page ${pageIndex + 1} of ${totalPages}`, pageWidth - 25, 290, { align: 'right' });
      }

      doc.save(`${restaurant.slug}_All_Tables_Print_Ready_QR.pdf`);
      toastSuccess('Print-ready PDF downloaded successfully!');
    } catch (e) {
      console.error('PDF generation error:', e);
      toastError('Failed to generate PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-[#111111] tracking-tight">
            Tables & QR
          </h1>
          <p className="text-[14px] text-[#555555]">
            Generate and download print-ready QR codes for dining tables
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="h-11 px-4 rounded-xl bg-white border border-[#ECECEC] text-[#111111] font-bold text-[14px] flex items-center gap-2 shadow-sm hover:bg-[#F7F7F8] active:scale-95 transition-all disabled:opacity-50"
          >
            <FileDown className="w-4 h-4 text-[#555555]" />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="h-11 px-4 rounded-xl text-white font-bold text-[14px] flex items-center gap-2 shadow-sm active:scale-95 transition-all hover:brightness-105"
            style={{ backgroundColor: 'var(--brand, #E23744)' }}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Table</span>
          </button>
        </div>
      </div>

      {/* Phone Camera Scanner Mode Switcher */}
      <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#15803D] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[15px] font-bold text-[#111111] flex items-center gap-2">
              <span>Phone Scanner Mode</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#15803D] text-white tracking-wider">Active</span>
            </div>
            <p className="text-[13px] text-[#4B5563] mt-0.5">
              QR codes encode this base URL so your phone camera opens the menu directly:
            </p>
            <div className="text-[12px] font-mono text-[#15803D] font-bold mt-1 bg-white/80 px-2 py-0.5 rounded border border-[#DCFCE7] inline-block break-all">
              {effectiveBaseUrl}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#E5E7EB] shrink-0 self-start md:self-auto shadow-xs">
          <button
            type="button"
            onClick={() => setUrlMode('tunnel')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              urlMode === 'tunnel' ? 'bg-[#15803D] text-white shadow-sm' : 'text-[#4B5563] hover:text-[#111111] hover:bg-[#F9FAFB]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Public (Any Phone)</span>
          </button>
          <button
            type="button"
            onClick={() => setUrlMode('lan')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              urlMode === 'lan' ? 'bg-[#15803D] text-white shadow-sm' : 'text-[#4B5563] hover:text-[#111111] hover:bg-[#F9FAFB]'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Same Wi-Fi</span>
          </button>
          <button
            type="button"
            onClick={() => setUrlMode('local')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              urlMode === 'local' ? 'bg-[#111111] text-white shadow-sm' : 'text-[#4B5563] hover:text-[#111111] hover:bg-[#F9FAFB]'
            }`}
          >
            Localhost
          </button>
        </div>
      </div>

      {/* Grid of Table QR Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((table) => {
          const qrDataUrl = qrCodeDataUrls[table.id];
          const directTableUrl = `${effectiveBaseUrl}/r/${restaurant.slug}?table=${encodeURIComponent(table.table_number)}`;

          return (
            <div
              key={table.id}
              className="bg-white border border-[#ECECEC] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex flex-col justify-between space-y-3.5 hover:border-[#D1D5DB] transition-all"
            >
              {/* Header: Table Number & Delete */}
              <div className="flex items-center justify-between pb-2.5 border-b border-[#ECECEC]">
                <div>
                  <h3 className="text-[18px] font-bold text-[#111111]">
                    Table {table.table_number}
                  </h3>
                  <span className="text-[12px] text-[#555555]">Dine-in Sticker</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteTable(table.id, table.table_number)}
                  className="w-9 h-9 rounded-xl bg-[#F7F7F8] border border-[#ECECEC] text-[#555555] hover:text-[#B91C1C] hover:bg-[#FEF2F2] hover:border-[#FEE2E2] flex items-center justify-center transition-colors"
                  title="Remove Table"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* QR Code Preview in Center */}
              <div
                onClick={() => setPreviewTable(table)}
                className="w-full aspect-square bg-[#F7F7F8] rounded-xl border border-[#ECECEC] p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-[#F0F0F2] transition-colors relative group"
              >
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`Table ${table.table_number} QR Code`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" />
                )}

                <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity">
                  <span className="text-[13px] font-bold text-[#111111] flex items-center gap-1.5">
                    <Eye className="w-4 h-4" /> Preview
                  </span>
                </div>
              </div>

              {/* URL preview text */}
              <div className="text-[11px] font-mono text-[#666666] truncate bg-[#F7F7F8] px-2.5 py-1 rounded-lg border border-[#ECECEC]" title={directTableUrl}>
                {directTableUrl}
              </div>

              {/* Action Buttons: Copy link, Save PNG & Open */}
              <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-[#ECECEC]">
                <button
                  type="button"
                  onClick={() => handleCopyLink(table.table_number)}
                  className="h-9 rounded-lg bg-[#F7F7F8] border border-[#ECECEC] text-[#111111] font-bold text-[12px] flex items-center justify-center gap-1 hover:bg-[#ECECEC] active:scale-95 transition-all"
                  title="Copy customer menu URL"
                >
                  <Copy className="w-3.5 h-3.5 text-[#555555]" />
                  <span>Copy</span>
                </button>

                <button
                  type="button"
                  onClick={() => qrDataUrl && handleDownloadQrPng(table.table_number, qrDataUrl)}
                  className="h-9 rounded-lg bg-[#F7F7F8] border border-[#ECECEC] text-[#111111] font-bold text-[12px] flex items-center justify-center gap-1 hover:bg-[#ECECEC] active:scale-95 transition-all"
                  title="Download PNG QR image"
                >
                  <Download className="w-3.5 h-3.5 text-[#555555]" />
                  <span>PNG</span>
                </button>

                <a
                  href={directTableUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 rounded-lg bg-[#F7F7F8] border border-[#ECECEC] text-[#111111] font-bold text-[12px] flex items-center justify-center gap-1 hover:bg-[#ECECEC] active:scale-95 transition-all text-center"
                  title="Open customer menu in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#555555]" />
                  <span>Open</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Table Modal: Labels above fields */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-[#ECECEC] rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#ECECEC]">
              <h3 className="text-[18px] font-bold text-[#111111]">Add New Table</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-10 h-10 rounded-full bg-[#F7F7F8] border border-[#ECECEC] text-[#555555] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTable} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[14px] font-bold text-[#111111]">
                  Table Number or Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. 7 or Rooftop-2"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full h-12 bg-white border border-[#ECECEC] rounded-xl px-3.5 text-[15px] text-[#111111] focus:outline-none focus:border-[var(--brand,#E23744)]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 h-12 rounded-xl bg-[#F7F7F8] border border-[#ECECEC] text-[#555555] font-semibold text-[14px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-12 rounded-xl text-white font-bold text-[14px]"
                  style={{ backgroundColor: 'var(--brand, #E23744)' }}
                >
                  Create Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Preview Modal */}
      {previewTable && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-[#ECECEC] rounded-2xl w-full max-w-sm p-6 text-center space-y-4 shadow-2xl">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewTable(null)}
                className="w-9 h-9 rounded-full bg-[#F7F7F8] border border-[#ECECEC] text-[#555555] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-[22px] font-bold text-[#111111]">
                Table {previewTable.table_number}
              </h3>
              <p className="text-[14px] text-[#555555]">
                {restaurant.name}
              </p>
            </div>

            <div className="w-48 h-48 mx-auto bg-white p-2 rounded-xl border border-[#ECECEC]">
              {qrCodeDataUrls[previewTable.id] && (
                <img
                  src={qrCodeDataUrls[previewTable.id]}
                  alt={`Table ${previewTable.table_number} QR`}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <p className="text-[13px] text-[#555555]">
              Scan with mobile camera to test table ordering flow
            </p>

            <a
              href={`${siteUrl}/r/${restaurant.slug}?table=${encodeURIComponent(previewTable.table_number)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-12 rounded-xl text-white font-bold text-[14px] flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--brand, #E23744)' }}
            >
              <span>Open Customer Menu</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
