const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { logger } = require('./audit');

/**
 * Helper to convert number to Indonesian words (Terbilang)
 */
const terbilang = (nilai) => {
    const bilangan = [
        '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima',
        'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
    ];
    let temp = '';
    if (nilai < 12) {
        temp = ' ' + bilangan[nilai];
    } else if (nilai < 20) {
        temp = terbilang(nilai - 10) + ' Belas';
    } else if (nilai < 100) {
        temp = terbilang(Math.floor(nilai / 10)) + ' Puluh' + terbilang(nilai % 10);
    } else if (nilai < 200) {
        temp = ' Seratus' + terbilang(nilai - 100);
    } else if (nilai < 1000) {
        temp = terbilang(Math.floor(nilai / 100)) + ' Ratus' + terbilang(nilai % 100);
    } else if (nilai < 2000) {
        temp = ' Seribu' + terbilang(nilai - 1000);
    } else if (nilai < 1000000) {
        temp = terbilang(Math.floor(nilai / 1000)) + ' Ribu' + terbilang(nilai % 1000);
    } else if (nilai < 1000000000) {
        temp = terbilang(Math.floor(nilai / 1000000)) + ' Juta' + terbilang(nilai % 1000000);
    } else if (nilai < 1000000000000) {
        temp = terbilang(Math.floor(nilai / 1000000000)) + ' Milyar' + terbilang(nilai % 1000000000);
    }
    return temp.trim();
};

/**
 * Determine if a field should be displayed based on bank and jenisRekening.
 * Mirrors the logic in ProductDetail.js (frontend).
 */
const shouldDisplayField = (key, product) => {
    const bank = (product.bank || '').toUpperCase();
    const jenisRekening = (product.jenisRekening || '').toUpperCase();

    // BCA-exclusive fields
    if (['pinMBca', 'kodeAkses', 'myBCAUser', 'myBCAPassword', 'myBCAPin', 'pinKeyBCA'].includes(key)) {
        return bank.includes('BCA');
    }

    // pinWondr / passWondr — only relevant for BNI (Wondr app)
    if (['pinWondr', 'passWondr'].includes(key)) {
        return bank.includes('BNI');
    }

    // mobileUser, mobilePassword, mobilePin — used by non-BCA, non-BRI banks
    // BRI uses dedicated brimoUser/brimoPassword/brimoPin instead
    if (['mobileUser', 'mobilePassword', 'mobilePin'].includes(key)) {
        return !bank.includes('BCA') && !bank.includes('BRI');
    }

    // IB fields — show for all banks except BRI
    if (['ibUser', 'ibPassword', 'ibPin'].includes(key)) {
        return !bank.includes('BRI');
    }

    // BRI BRImo-specific fields (only for BRI non-QRIS)
    if (['brimoUser', 'brimoPassword', 'brimoPin'].includes(key)) {
        return bank.includes('BRI') && !jenisRekening.includes('QRIS');
    }

    // BRI MERCHANT QRIS fields
    if (['briMerchantUser', 'briMerchantPassword'].includes(key)) {
        return bank.includes('BRI') && jenisRekening.includes('QRIS');
    }

    // OCBC Nyala fields
    if (['ocbcNyalaUser', 'ocbcNyalaPassword', 'ocbcNyalaPin'].includes(key)) {
        return bank.includes('OCBC') || bank.includes('NISP');
    }

    // Deprecated generic merchant fields
    if (['merchantUser', 'merchantPassword'].includes(key)) {
        return false;
    }

    return true;
};

/**
 * Get dynamic label for a field based on the bank type.
 * Mirrors the logic in ProductDetail.js (frontend).
 */
const getDynamicLabel = (key, product, defaultLabel) => {
    const bank = (product.bank || '').toUpperCase();

    if (key === 'mobileUser') {
        if (bank.includes('BNI')) return 'User Wondr';
        if (bank.includes('MANDIRI')) return 'User Livin';
        if (bank.includes('BRI')) return 'User Brimo';
        if (bank.includes('OCBC') || bank.includes('NISP')) return 'User Nyala';
    }

    if (key === 'mobilePassword') {
        if (bank.includes('BCA')) return 'Kode Akses M-BCA';
        if (bank.includes('BNI')) return 'Password Wondr';
        if (bank.includes('MANDIRI')) return 'Password Livin';
        if (bank.includes('BRI')) return 'Password Brimo';
    }

    if (key === 'mobilePin') {
        if (bank.includes('BNI')) return 'Pin Wondr';
        if (bank.includes('MANDIRI')) return 'Pin Livin';
        if (bank.includes('BRI')) return 'Pin Brimo';
    }

    if (key === 'ibUser') {
        if (bank.includes('BCA')) return 'User Internet Banking';
    }

    if (key === 'ibPin') {
        if (bank.includes('BCA')) return 'Pin Internet Banking';
    }

    return defaultLabel;
};

/**
 * Normalize product data for export — ensures BRI-specific fields are
 * populated from generic fields (and vice versa) so the PDF never shows
 * blanks when the data actually exists in an alternative field.
 */
const normalizeProductForExport = (product) => {
    const p = { ...product };
    const bank = (p.bank || '').toUpperCase();
    const jenisRekening = (p.jenisRekening || '').toUpperCase();

    const hasValue = (v) => v && v !== '-' && v !== '';

    if (bank.includes('BRI')) {
        if (jenisRekening.includes('QRIS')) {
            // QRIS: merge generic merchant → BRI merchant
            if (!hasValue(p.briMerchantUser) && hasValue(p.merchantUser)) p.briMerchantUser = p.merchantUser;
            if (!hasValue(p.briMerchantPassword) && hasValue(p.merchantPassword)) p.briMerchantPassword = p.merchantPassword;
        } else {
            // Tabungan: merge generic mobile ↔ brimo (bidirectional)
            if (!hasValue(p.brimoUser) && hasValue(p.mobileUser)) p.brimoUser = p.mobileUser;
            if (!hasValue(p.brimoPassword) && hasValue(p.mobilePassword)) p.brimoPassword = p.mobilePassword;
            if (!hasValue(p.brimoPin) && hasValue(p.mobilePin)) p.brimoPin = p.mobilePin;
            // Reverse: if brimo is set but mobile is not, copy back
            if (!hasValue(p.mobileUser) && hasValue(p.brimoUser)) p.mobileUser = p.brimoUser;
            if (!hasValue(p.mobilePassword) && hasValue(p.brimoPassword)) p.mobilePassword = p.brimoPassword;
            if (!hasValue(p.mobilePin) && hasValue(p.brimoPin)) p.mobilePin = p.brimoPin;
        }
    }

    return p;
};

/**
 * Generate PDF from corrected/extracted product data
 * @param {Array} products Array of product objects
 * @param {String} format 'table' or 'list'
 */
const generateCorrectedPDF = async (products, format = 'table') => {
    let browser;
    try {
        // Normalize all products before rendering
        const normalizedProducts = products.map(normalizeProductForExport);
        logger.info('Generating Corrected PDF document', { count: normalizedProducts.length, format });

        // Complete field list with all bank-specific fields
        const fields = [
            // Data Order
            { key: 'noOrder', label: 'No. Order' },
            { key: 'codeAgen', label: 'Code Agen' },
            { key: 'customer', label: 'Customer' },
            // Data Bank
            { key: 'bank', label: 'Bank' },
            { key: 'jenisRekening', label: 'Jenis Rekening' },
            { key: 'grade', label: 'Grade' },
            { key: 'kcp', label: 'Kantor Cabang' },
            // Data Personal
            { key: 'nik', label: 'NIK' },
            { key: 'nama', label: 'Nama' },
            { key: 'namaIbuKandung', label: 'Nama Ibu Kandung' },
            { key: 'tempatTanggalLahir', label: 'Tempat/Tanggal Lahir' },
            { key: 'noRek', label: 'No. Rekening' },
            { key: 'sisaSaldo', label: 'Sisa Saldo' },
            { key: 'noAtm', label: 'No. ATM' },
            { key: 'validThru', label: 'Valid Kartu' },
            { key: 'noHp', label: 'No. HP' },
            // Data Keamanan - Umum
            { key: 'pinAtm', label: 'PIN ATM' },
            { key: 'pinWondr', label: 'PIN Wondr' },
            { key: 'passWondr', label: 'Pass Wondr' },
            { key: 'email', label: 'Email' },
            { key: 'passEmail', label: 'Password Email' },
            // Mobile Banking (non-BCA)
            { key: 'mobileUser', label: 'User Mobile' },
            { key: 'mobilePassword', label: 'Password Mobile' },
            { key: 'mobilePin', label: 'PIN Mobile' },
            // Internet Banking
            { key: 'ibUser', label: 'User I-Banking' },
            { key: 'ibPassword', label: 'Password IB' },
            { key: 'ibPin', label: 'PIN IB' },
            // BCA-specific
            { key: 'myBCAUser', label: 'BCA-ID' },
            { key: 'myBCAPassword', label: 'Pass BCA-ID' },
            { key: 'myBCAPin', label: 'Pin Transaksi' },
            { key: 'pinKeyBCA', label: 'Pin KeyBCA' },
            { key: 'kodeAkses', label: 'Kode Akses M-BCA' },
            { key: 'pinMBca', label: 'Pin M-BCA' },
            // BRI-specific
            { key: 'brimoUser', label: 'User Brimo' },
            { key: 'brimoPassword', label: 'Password Brimo' },
            { key: 'brimoPin', label: 'Pin Brimo' },
            { key: 'briMerchantUser', label: 'User Merchant QRIS' },
            { key: 'briMerchantPassword', label: 'Password Merchant QRIS' },
            // OCBC-specific
            { key: 'ocbcNyalaUser', label: 'User Nyala' },
            { key: 'ocbcNyalaPassword', label: 'Password Nyala' },
            { key: 'ocbcNyalaPin', label: 'Pin Nyala' },
            // Data Tambahan
            { key: 'expired', label: 'Expired' },
            { key: 'status', label: 'Status' },
            { key: 'complaint', label: 'Complaint' }
        ];

        // First 10 fields are universal (used for table format)
        const tableFields = fields.slice(0, 10);

        // Helper to resolve image path for Puppeteer
        const buildImageSrc = (src) => {
            if (!src || src === '-' || src === '') return null;

            // Always try to find locally first by filename, even if it's a URL
            const filename = path.basename(src.split('?')[0]);
            const localPath = path.join(__dirname, '../uploads', filename);
            if (fs.existsSync(localPath)) return `file://${localPath}`;

            const rootPath = path.join(__dirname, '../../uploads', filename);
            if (fs.existsSync(rootPath)) return `file://${rootPath}`;

            // If not found locally, and it's a URL, return the URL
            if (src.toString().startsWith('http')) return src;

            return null;
        };

        // Helper to format field value
        const formatValue = (key, value) => {
            if (value === undefined || value === null || value === '') return '-';
            if (key === 'expired' && value) {
                try {
                    return new Date(value).toLocaleDateString('id-ID');
                } catch (e) {
                    return value;
                }
            }
            return String(value);
        };

        let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Arial', sans-serif; margin: 0; padding: 20px; color: #333; }
                h1 { text-align: center; color: #007bff; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
                .footer { text-align: center; font-size: 10px; color: #777; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
                
                /* Table Styles */
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; table-layout: fixed; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                th { background-color: #f8f9fa; font-weight: bold; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                
                /* List Styles */
                .product-card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 30px; page-break-after: always; }
                .product-card:last-child { page-break-after: auto; }
                .product-header { background-color: #007bff; color: white; padding: 10px; border-radius: 4px; margin-bottom: 15px; font-weight: bold; }
                .field-row { display: flex; border-bottom: 1px solid #eee; padding: 8px 0; }
                .field-label { width: 200px; font-weight: bold; color: #555; }
                .field-value { flex: 1; }

                /* Image Gallery */
                .image-section { margin-top: 30px; }
                .image-title { font-weight: bold; color: #007bff; border-left: 4px solid #007bff; padding-left: 10px; margin: 20px 0 10px 0; }
                .image-container { display: flex; gap: 20px; flex-wrap: wrap; }
                .image-box { border: 1px solid #ddd; padding: 10px; border-radius: 4px; background: #fff; }
                .image-box img { max-width: 400px; max-height: 300px; object-fit: contain; display: block; }
                .image-label { text-align: center; font-weight: bold; margin-top: 5px; font-size: 12px; }
            </style>
        </head>
        <body>
            <h1>Laporan Data Produk Lengkap</h1>
            <div style="text-align: right; font-size: 12px; margin-bottom: 20px;">
                Dibuat pada: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}
            </div>
        `;

        if (format === 'table') {
            html += `
            <table>
                <thead>
                    <tr>
                        <th style="width: 30px">No</th>
                        ${tableFields.map(f => `<th>${f.label}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${normalizedProducts.map((p, idx) => `
                        <tr>
                            <td>${idx + 1}</td>
                            ${tableFields.map(f => `<td>${formatValue(f.key, p[f.key])}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <p style="font-size: 12px; margin-top: 20px;">* Tabel di atas hanya menampilkan 10 kolom utama. Gunakan format List untuk detail lengkap per produk.</p>
            
            <div class="image-section">
                ${normalizedProducts.map((p, idx) => {
                const ktpSrc = buildImageSrc(p.uploadFotoId);
                const selfieSrc = buildImageSrc(p.uploadFotoSelfie);

                if (!ktpSrc && !selfieSrc) return '';

                return `
                        <div class="image-title">LAMPIRAN FOTO - PRODUK ${idx + 1} (${p.nama || '-'})</div>
                        <div class="image-container">
                            ${ktpSrc ? `
                                <div class="image-box">
                                    <img src="${ktpSrc}" alt="KTP">
                                    <div class="image-label">FOTO KTP</div>
                                </div>
                            ` : ''}
                            ${selfieSrc ? `
                                <div class="image-box">
                                    <img src="${selfieSrc}" alt="Selfie">
                                    <div class="image-label">FOTO SELFIE</div>
                                </div>
                            ` : ''}
                        </div>
                    `;
            }).join('')}
            </div>
            `;
        } else {
            // List format — bank-aware rendering per product
            html += normalizedProducts.map((p, idx) => {
                const ktpSrc = buildImageSrc(p.uploadFotoId);
                const selfieSrc = buildImageSrc(p.uploadFotoSelfie);

                // Filter fields based on bank and render with dynamic labels
                const fieldRows = fields
                    .filter(f => shouldDisplayField(f.key, p))
                    .map(f => {
                        const value = formatValue(f.key, p[f.key]);
                        // Skip fields with empty/dash values to keep the card clean
                        if (value === '-') return '';
                        const label = getDynamicLabel(f.key, p, f.label);
                        return `
                        <div class="field-row">
                            <div class="field-label">${label}</div>
                            <div class="field-value">${value}</div>
                        </div>
                    `;
                    })
                    .filter(row => row !== '')
                    .join('');

                return `
                <div class="product-card">
                    <div class="product-header">PRODUK ${idx + 1} - ${p.nama || 'Tanpa Nama'} (${p.bank || '-'})</div>
                    ${fieldRows}
                    
                    ${(ktpSrc || selfieSrc) ? `
                        <div class="image-section">
                            <div class="image-title">LAMPIRAN FOTO</div>
                            <div class="image-container">
                                ${ktpSrc ? `
                                    <div class="image-box">
                                        <img src="${ktpSrc}" alt="KTP">
                                        <div class="image-label">FOTO KTP</div>
                                    </div>
                                ` : ''}
                                ${selfieSrc ? `
                                    <div class="image-box">
                                        <img src="${selfieSrc}" alt="Selfie">
                                        <div class="image-label">FOTO SELFIE</div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
            }).join('');
        }

        html += `
            <div style="margin-top: 50px; display: flex; justify-content: flex-end; page-break-inside: avoid;">
                <div style="width: 250px; text-align: center;">
                    <div style="font-size: 12px; margin-bottom: 60px;">Dicetak oleh Administrator,</div>
                    <div style="border-bottom: 1px solid #000; margin-bottom: 5px;"></div>
                    <div style="font-size: 12px; font-weight: bold;">( _____________________ )</div>
                    <div style="font-size: 10px; color: #666;">Tanda Tangan & Nama Terang</div>
                </div>
            </div>

            <div class="footer">
                <p>© ${new Date().getFullYear()} Website Aksesoris - Laporan Sistem Keamanan</p>
                <p>Dokumen ini dihasilkan secara otomatis oleh sistem pada ${new Date().toLocaleString('id-ID')}</p>
            </div>
        </body>
        </html>
        `;

        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files']
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: format === 'table',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });

        await browser.close();
        return {
            success: true,
            buffer: pdfBuffer,
            filename: `corrected-data-${Date.now()}.pdf`
        };

    } catch (error) {
        if (browser) await browser.close();
        logger.error('Failed to generate Corrected PDF', { error: error.message });
        return { success: false, error: error.message };
    }
};

/**
 * Generate Grouped Invoice PDF (Piutang)
 */
const generateGroupedInvoicePDF = async (products, customerName) => {
    let browser;
    try {
        const totalAmount = products.reduce((sum, p) => sum + (p.hargaJual || 0), 0);
        const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
        const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Helvetica', 'Arial', sans-serif; margin: 0; padding: 40px; color: #333; line-height: 1.4; }
                .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                .company-info h1 { margin: 0; color: #1a73e8; font-size: 28px; }
                .company-info p { margin: 5px 0; font-size: 12px; color: #666; }
                .invoice-title { text-align: right; }
                .invoice-title h2 { margin: 0; color: #333; font-size: 24px; text-transform: uppercase; }
                .invoice-title p { margin: 5px 0; font-size: 14px; font-weight: bold; }
                
                .details-section { display: flex; justify-content: space-between; margin-bottom: 40px; }
                .bill-to h3 { margin: 0 0 10px 0; font-size: 14px; color: #777; text-transform: uppercase; }
                .bill-to p { margin: 2px 0; font-size: 16px; font-weight: bold; }
                
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th { background-color: #f8f9fa; border-bottom: 2px solid #dee2e6; padding: 12px 8px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666; }
                td { border-bottom: 1px solid #eee; padding: 12px 8px; font-size: 13px; }
                .text-right { text-align: right; }
                .font-bold { font-weight: bold; }
                
                .summary { display: flex; justify-content: flex-end; }
                .summary-table { width: 300px; }
                .summary-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                .summary-row.total { border-bottom: none; font-size: 18px; color: #1a73e8; font-weight: bold; }
                
                .terbilang-box { margin-top: -20px; margin-bottom: 40px; padding: 15px; background: #f8f9fa; border-left: 4px solid #1a73e8; font-style: italic; font-size: 14px; }
                
                .footer { margin-top: 60px; display: flex; justify-content: space-between; }
                .signature { width: 200px; text-align: center; }
                .signature-space { height: 80px; border-bottom: 1px solid #333; margin-bottom: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-info">
                    <h1>SISTEM AKSESORIS</h1>
                    <p>Manajemen Piutang & Keamanan Data</p>
                </div>
                <div class="invoice-title">
                    <h2>INVOICE</h2>
                    <p>#${invoiceNo}</p>
                    <p style="font-weight: normal; font-size: 12px;">Tanggal: ${dateStr}</p>
                </div>
            </div>

            <div class="details-section">
                <div class="bill-to">
                    <h3>Tagihan Kepada:</h3>
                    <p>${customerName || 'Customer Umum'}</p>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 40px">No</th>
                        <th>No. Order</th>
                        <th>Keterangan Produk</th>
                        <th>Bank / Rekening</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map((p, idx) => `
                        <tr>
                            <td>${idx + 1}</td>
                            <td class="font-bold">${p.noOrder || '-'}</td>
                            <td>${p.nama || '-'} (NIK: ${p.nik || '-'})</td>
                            <td>${p.bank || '-'} - ${p.noRek || '-'}</td>
                            <td class="text-right font-bold">Rp ${Number(p.hargaJual || 0).toLocaleString('id-ID')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="terbilang-box">
                Terbilang: <strong># ${terbilang(totalAmount)} Rupiah #</strong>
            </div>

            <div class="summary">
                <div class="summary-table">
                    <div class="summary-row total">
                        <span>TOTAL</span>
                        <span>Rp ${totalAmount.toLocaleString('id-ID')}</span>
                    </div>
                </div>
            </div>

            <div class="footer">
                <div class="signature">
                    <p>Penerima,</p>
                    <div class="signature-space"></div>
                    <p>( ____________________ )</p>
                </div>
                <div class="signature">
                    <p>Hormat Kami,</p>
                    <div class="signature-space"></div>
                    <p><strong>Admin Sistem</strong></p>
                </div>
            </div>
        </body>
        </html>
        `;

        browser = await puppeteer.launch({ args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html);
        const buffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', bottom: '20px' } });
        await browser.close();
        return { success: true, buffer, filename: `Invoice-${invoiceNo}.pdf` };
    } catch (err) {
        if (browser) await browser.close();
        return { success: false, error: err.message };
    }
};

/**
 * Generate Kwitansi PDF (Hutang to Orlap)
 */
const generateKwitansiPDF = async (products, orlapName) => {
    let browser;
    try {
        const totalAmount = products.reduce((sum, p) => sum + (p.hargaBeli || 0), 0);
        const receiptNo = `KWT-${Date.now().toString().slice(-6)}`;
        const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Courier New', Courier, monospace; margin: 0; padding: 20px; color: #000; }
                .receipt-container { border: 2px solid #000; padding: 30px; position: relative; max-width: 800px; margin: auto; }
                .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; color: rgba(0,0,0,0.05); z-index: -1; white-space: nowrap; }
                
                header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 1px solid #000; padding-bottom: 10px; }
                .title { font-size: 24px; font-weight: bold; text-decoration: underline; }
                .serial { font-size: 14px; }
                
                .row { display: flex; margin-bottom: 15px; font-size: 16px; }
                .label { width: 180px; }
                .separator { width: 20px; }
                .value { flex: 1; border-bottom: 1px dotted #000; padding-bottom: 2px; }
                
                .amount-box { margin-top: 30px; display: inline-block; padding: 10px 20px; border: 2px solid #000; background: #f0f0f0; font-size: 20px; font-weight: bold; }
                .footer { margin-top: 40px; display: flex; justify-content: flex-end; }
                .signature-box { text-align: center; width: 250px; }
                .signature-space { height: 80px; }
                
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                th, td { border: 1px solid #000; padding: 5px; text-align: left; }
                th { background: #eee; }
            </style>
        </head>
        <body>
            <div class="receipt-container">
                <div class="watermark">KWITANSI / RECEIPT</div>
                <header>
                    <div class="title">KWITANSI</div>
                    <div class="serial">No: ${receiptNo}</div>
                </header>

                <div class="row">
                    <div class="label">Sudah Terima Dari</div>
                    <div class="separator">:</div>
                    <div class="value"><strong>SISTEM AKSESORIS</strong></div>
                </div>
                <div class="row">
                    <div class="label">Banyaknya Uang</div>
                    <div class="separator">:</div>
                    <div class="value" style="font-style: italic; background: #f9f9f9; padding: 5px;">
                        # ${terbilang(totalAmount)} Rupiah #
                    </div>
                </div>
                <div class="row">
                    <div class="label">Untuk Pembayaran</div>
                    <div class="separator">:</div>
                    <div class="value">Pembayaran Hutang Kepada Orlap Multi-Produk</div>
                </div>
                <div class="row" style="margin-bottom: 0;">
                    <div class="label">Nama Penerima</div>
                    <div class="separator">:</div>
                    <div class="value"><strong>${orlapName || 'Orlap Umum'}</strong></div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 30px">No</th>
                            <th>No. Order</th>
                            <th>Nama / NIK</th>
                            <th>Bank / Rekening</th>
                            <th style="text-align: right">Nominal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products.map((p, idx) => `
                            <tr>
                                <td>${idx + 1}</td>
                                <td>${p.noOrder || '-'}</td>
                                <td>${p.nama || '-'} (${p.nik || '-'})</td>
                                <td>${p.bank || '-'} - ${p.noRek || '-'}</td>
                                <td style="text-align: right">Rp ${Number(p.hargaBeli || 0).toLocaleString('id-ID')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="amount-box">
                    Rp ${totalAmount.toLocaleString('id-ID')},-
                </div>

                <div class="footer">
                    <div class="signature-box">
                        <p>Tgl, ${dateStr}</p>
                        <div class="signature-space"></div>
                        <p><strong>( ${orlapName || '________________'} )</strong></p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        browser = await puppeteer.launch({ args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html);
        const buffer = await page.pdf({ format: 'A4', orientation: 'landscape', printBackground: true });
        await browser.close();
        return { success: true, buffer, filename: `Kwitansi-${receiptNo}.pdf` };
    } catch (err) {
        if (browser) await browser.close();
        return { success: false, error: err.message };
    }
};

module.exports = {
    generateCorrectedPDF,
    generateGroupedInvoicePDF,
    generateKwitansiPDF
};
